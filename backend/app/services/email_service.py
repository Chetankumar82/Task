import smtplib
import logging
import base64
import threading
import time
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Optional, Tuple
from collections import deque
from datetime import datetime, timezone
from app.config import Config

import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

logger = logging.getLogger(__name__)

# Asynchronous thread pool for non-blocking email dispatch
executor = ThreadPoolExecutor(max_workers=3)


class GmailService:
    """
    Gmail SMTP Notification Service.
    Dispatches responsive HTML notifications asynchronously for task lifecycle events.
    """
    dispatch_logs = deque(maxlen=30)

    _token_lock = threading.Lock()
    _access_token: Optional[str] = None
    _access_token_expiry: float = 0.0

    @classmethod
    def is_gmail_api_configured(cls) -> bool:
        return bool(Config.GMAIL_CLIENT_ID and Config.GMAIL_CLIENT_SECRET and Config.GMAIL_REFRESH_TOKEN)

    @classmethod
    def is_smtp_configured(cls) -> bool:
        return bool(Config.GMAIL_USER and Config.GMAIL_APP_PASSWORD)

    @classmethod
    def is_configured(cls) -> bool:
        return cls.is_gmail_api_configured() or cls.is_smtp_configured()

    # ---------------- Message building ----------------

    @classmethod
    def _build_message(cls, to_email: str, subject: str, html_body: str, plain_body: str) -> MIMEMultipart:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Hairdrama Tech Tasks <{Config.GMAIL_USER}>"
        msg["To"] = to_email
        msg["Subject"] = Header(subject, "utf-8")
        msg.attach(MIMEText(plain_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        return msg

    # ---------------- Transport 1: Gmail REST API (HTTPS / port 443) ----------------

    @classmethod
    def _get_access_token(cls) -> str:
        """Exchanges the long-lived refresh token for a short-lived access token (cached)."""
        with cls._token_lock:
            if cls._access_token and time.time() < cls._access_token_expiry - 60:
                return cls._access_token
            resp = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": Config.GMAIL_CLIENT_ID,
                    "client_secret": Config.GMAIL_CLIENT_SECRET,
                    "refresh_token": Config.GMAIL_REFRESH_TOKEN,
                    "grant_type": "refresh_token",
                },
                timeout=15,
            )
            if resp.status_code != 200:
                raise RuntimeError(f"OAuth token refresh failed ({resp.status_code}): {resp.text[:300]}")
            data = resp.json()
            cls._access_token = data["access_token"]
            cls._access_token_expiry = time.time() + int(data.get("expires_in", 3600))
            return cls._access_token

    @classmethod
    def _send_via_gmail_api(cls, msg: MIMEMultipart) -> None:
        token = cls._get_access_token()
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii")
        resp = requests.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {token}"},
            json={"raw": raw},
            timeout=20,
        )
        if resp.status_code not in (200, 202):
            raise RuntimeError(f"Gmail API send failed ({resp.status_code}): {resp.text[:300]}")

    # ---------------- Transport 2: Gmail SMTP (ports 587 / 465) ----------------

    @classmethod
    def _send_via_smtp(cls, msg: MIMEMultipart) -> None:
        clean_password = (Config.GMAIL_APP_PASSWORD or "").replace(" ", "").strip()
        try:
            with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(Config.GMAIL_USER, clean_password)
                server.send_message(msg)
            return
        except Exception as e587:
            logger.warning("[EmailService] SMTP 587 failed: %s. Trying 465 (SSL)...", e587)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server_ssl:
            server_ssl.ehlo()
            server_ssl.login(Config.GMAIL_USER, clean_password)
            server_ssl.send_message(msg)

    @classmethod
    def _deliver(cls, msg: MIMEMultipart) -> Tuple[bool, Optional[str], Dict[str, Any]]:
        """Tries each configured transport in order. Returns (sent, transport_used, attempts)."""
        attempts: Dict[str, Any] = {}
        transports = []
        if cls.is_gmail_api_configured():
            transports.append(("gmail_api_https", cls._send_via_gmail_api))
        if cls.is_smtp_configured():
            transports.append(("gmail_smtp", cls._send_via_smtp))

        for name, fn in transports:
            try:
                fn(msg)
                attempts[name] = {"status": "success", "error": None}
                return True, name, attempts
            except Exception as e:
                attempts[name] = {"status": "failed", "error": f"{type(e).__name__}: {e}"}
                logger.error("[EmailService] Transport %s failed: %s", name, e)
        return False, None, attempts

    @classmethod
    def _send_smtp_email(cls, to_email: str, subject: str, html_body: str, plain_body: str) -> bool:
        """Synchronous send (executed in background worker thread). Name kept for backwards compatibility."""
        if not to_email:
            logger.warning("[EmailService] No recipient email specified. Skipping.")
            return False

        safe_subj = str(subject).encode("ascii", "replace").decode("ascii")

        if not cls.is_configured():
            print(f"[EmailService] No email transport configured. Simulated email to {to_email}: {safe_subj}", flush=True)
            return True

        try:
            msg = cls._build_message(to_email, subject, html_body, plain_body)
            sent, transport, attempts = cls._deliver(msg)
        except Exception as e:
            sent, transport, attempts = False, None, {"build": {"status": "failed", "error": str(e)}}

        cls.dispatch_logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "to": to_email,
            "subject": safe_subj,
            "sent": sent,
            "transport": transport,
            "attempts": attempts,
        })

        if sent:
            print(f"[EmailService] SUCCESS via {transport}: {to_email} ({safe_subj})", flush=True)
        else:
            print(f"[EmailService] FAILED to deliver to {to_email}: {attempts}", flush=True)
        return sent

    @classmethod
    def diagnose_smtp(cls, to_email: str) -> Dict[str, Any]:
        """Sends a diagnostic email through the configured transports and reports each attempt."""
        report: Dict[str, Any] = {
            "is_configured": cls.is_configured(),
            "gmail_user": Config.GMAIL_USER,
            "gmail_api_configured": cls.is_gmail_api_configured(),
            "smtp_configured": cls.is_smtp_configured(),
            "recipient": to_email,
            "attempts": {},
            "transport": None,
            "delivered": False
        }

        if not cls.is_configured():
            report["error"] = "No email transport configured."
            return report

        msg = cls._build_message(
            to_email,
            "[Hairdrama] Diagnostic Verification Email",
            "<p>This is an automated diagnostic test from Hairdrama Tech backend.</p>",
            "This is an automated diagnostic test from Hairdrama Tech backend.",
        )
        sent, transport, attempts = cls._deliver(msg)
        report.update({"delivered": sent, "transport": transport, "attempts": attempts})
        if not sent and not cls.is_gmail_api_configured():
            report["hint"] = (
                "SMTP is blocked on this host (e.g. Render free tier). Set GMAIL_CLIENT_ID, "
                "GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN to send via the Gmail API over HTTPS."
            )
        return report

    @classmethod
    def send_async(cls, to_email: str, subject: str, html_body: str, plain_body: str):
        """Dispatches email asynchronously so client requests aren't blocked."""
        executor.submit(cls._send_smtp_email, to_email, subject, html_body, plain_body)

    # ---------------- Notification Handlers ----------------

    @classmethod
    def notify_task_created(
        cls, 
        task: Dict[str, Any], 
        creator: Dict[str, Any], 
        assignee: Optional[Dict[str, Any]] = None
    ):
        """
        Sends email notification when a new task is created.
        Recipients:
        - The creator (confirming creation)
        - The assignee (alerting about assignment)
        """
        task_title = task.get("title", "Untitled Task")
        task_desc = task.get("description", "No description provided.")
        priority = (task.get("priority") or "medium").capitalize()
        due_date = task.get("due_date") or "No due date specified"
        creator_name = creator.get("full_name") or creator.get("email") or "A team member"
        creator_email = creator.get("email", "").strip()
        assignee_name = (assignee.get("full_name") or assignee.get("email") or "Unassigned") if assignee else "Unassigned"
        assignee_email = assignee.get("email", "").strip() if assignee else ""
        app_url = f"{Config.APP_PUBLIC_URL}/?taskId={task.get('id', '')}"

        priority_colors = {
            "Urgent": "#ef4444",
            "High": "#f97316",
            "Medium": "#3b82f6",
            "Low": "#64748b"
        }
        badge_color = priority_colors.get(priority, "#3b82f6")

        # 1. HTML Email Template for Assignee (Task Assignment Alert)
        assignee_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
                .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 28px; text-align: left; color: #ffffff; }}
                .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
                .header p {{ margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; }}
                .body-content {{ padding: 28px; }}
                .task-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .task-title {{ font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px; }}
                .task-desc {{ font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px; }}
                .meta-row {{ font-size: 13px; color: #64748b; margin-bottom: 6px; }}
                .badge {{ display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #ffffff; background-color: {badge_color}; }}
                .btn {{ display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }}
                .footer {{ background: #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Hairdrama Tech</h1>
                    <p>Task Assignment Notification</p>
                </div>
                <div class="body-content">
                    <p style="font-size: 15px; line-height: 1.6;">
                        Hello <strong>{assignee_name}</strong>,<br>
                        <strong>{creator_name}</strong> has assigned a new task to you on the Hairdrama Task Platform.
                    </p>
                    
                    <div class="task-card">
                        <div class="task-title">{task_title}</div>
                        <div class="task-desc">{task_desc}</div>
                        <div class="meta-row">
                            <strong>Priority:</strong> <span class="badge">{priority}</span>
                        </div>
                        <div class="meta-row" style="margin-top: 6px;">
                            <strong>Due Date:</strong> <span>{due_date}</span>
                        </div>
                        <div class="meta-row" style="margin-top: 6px;">
                            <strong>Assigned By:</strong> <span>{creator_name} ({creator_email})</span>
                        </div>
                    </div>

                    <a href="{app_url}" class="btn">View & Manage Task</a>
                </div>
                <div class="footer">
                    Automated notification from Hairdrama Tech Task Management.
                </div>
            </div>
        </body>
        </html>
        """

        assignee_plain = f"""Hairdrama Tech - New Task Assignment

Hello {assignee_name},
{creator_name} has assigned a new task to you:

Task: {task_title}
Description: {task_desc}
Priority: {priority}
Due Date: {due_date}
Assigned By: {creator_name} ({creator_email})

Manage this task here: {app_url}
"""

        # 2. HTML Email Template for Creator (Task Creation Confirmation)
        creator_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
                .header {{ background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 28px; text-align: left; color: #ffffff; }}
                .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
                .header p {{ margin: 6px 0 0 0; color: #c7d2fe; font-size: 14px; }}
                .body-content {{ padding: 28px; }}
                .task-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .task-title {{ font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px; }}
                .task-desc {{ font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px; }}
                .meta-row {{ font-size: 13px; color: #64748b; margin-bottom: 6px; }}
                .badge {{ display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #ffffff; background-color: {badge_color}; }}
                .btn {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }}
                .footer {{ background: #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Hairdrama Tech</h1>
                    <p>Task Created Successfully</p>
                </div>
                <div class="body-content">
                    <p style="font-size: 15px; line-height: 1.6;">
                        Hello <strong>{creator_name}</strong>,<br>
                        Your task has been created successfully in the Hairdrama workspace.
                    </p>
                    
                    <div class="task-card">
                        <div class="task-title">{task_title}</div>
                        <div class="task-desc">{task_desc}</div>
                        <div class="meta-row">
                            <strong>Priority:</strong> <span class="badge">{priority}</span>
                        </div>
                        <div class="meta-row" style="margin-top: 6px;">
                            <strong>Due Date:</strong> <span>{due_date}</span>
                        </div>
                        <div class="meta-row" style="margin-top: 6px;">
                            <strong>Assigned To:</strong> <span>{assignee_name} {f'({assignee_email})' if assignee_email else ''}</span>
                        </div>
                    </div>

                    <a href="{app_url}" class="btn">View Task</a>
                </div>
                <div class="footer">
                    Automated notification from Hairdrama Tech Task Management.
                </div>
            </div>
        </body>
        </html>
        """

        creator_plain = f"""Hairdrama Tech - Task Created Successfully

Hello {creator_name},
Your task has been created:

Task: {task_title}
Description: {task_desc}
Priority: {priority}
Due Date: {due_date}
Assigned To: {assignee_name} {f'({assignee_email})' if assignee_email else ''}

View task: {app_url}
"""

        # Dispatch emails
        print(f"[EmailService] notify_task_created called. Creator: {creator_email}, Assignee: {assignee_email}", flush=True)

        # Case 1: Assigned to a different user -> notify assignee AND creator
        if assignee_email and assignee_email.lower() != creator_email.lower():
            cls.send_async(assignee_email, f"🔔 [Hairdrama Task] New Task Assigned: {task_title}", assignee_html, assignee_plain)
            if creator_email:
                cls.send_async(creator_email, f"📝 [Hairdrama Task] Task Created: {task_title}", creator_html, creator_plain)

        # Case 2: Assigned to oneself (creator == assignee) -> notify once
        elif assignee_email and assignee_email.lower() == creator_email.lower():
            cls.send_async(assignee_email, f"🔔 [Hairdrama Task] Task Created & Assigned to You: {task_title}", assignee_html, assignee_plain)

        # Case 3: Unassigned task -> notify creator
        elif creator_email:
            cls.send_async(creator_email, f"📝 [Hairdrama Task] Task Created: {task_title}", creator_html, creator_plain)

    @classmethod
    def notify_task_completed(
        cls, 
        task: Dict[str, Any], 
        completed_by: Dict[str, Any], 
        creator: Dict[str, Any], 
        assignee: Optional[Dict[str, Any]] = None
    ):
        """
        Sends email notification when a task status changes to 'completed'.
        Recipients:
        - Task creator (so they know the task is completed)
        - Task assignee (confirmation)
        """
        task_title = task.get("title", "Untitled Task")
        completer_name = completed_by.get("full_name") or completed_by.get("email") or "A team member"
        app_url = f"{Config.APP_PUBLIC_URL}/?taskId={task.get('id', '')}"

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
                .header {{ background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 32px 28px; text-align: left; color: #ffffff; }}
                .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
                .header p {{ margin: 6px 0 0 0; color: #a7f3d0; font-size: 14px; }}
                .body-content {{ padding: 28px; }}
                .success-banner {{ background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 16px 0; color: #065f46; font-size: 14px; font-weight: 500; }}
                .task-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .task-title {{ font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px; }}
                .badge-completed {{ display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #065f46; background-color: #a7f3d0; }}
                .btn {{ display: inline-block; background-color: #059669; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }}
                .footer {{ background: #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Hairdrama Tech</h1>
                    <p>Task Completion Update</p>
                </div>
                <div class="body-content">
                    <div class="success-banner">
                        🎉 Great news! The task has been marked as <strong>Completed</strong>.
                    </div>
                    
                    <p style="font-size: 15px; line-height: 1.6;">
                        <strong>{completer_name}</strong> has completed the following task:
                    </p>
                    
                    <div class="task-card">
                        <div class="task-title">{task_title}</div>
                        <p style="color: #64748b; font-size: 13px; margin: 8px 0;">{task.get('description', '')}</p>
                        <div style="margin-top: 12px;">
                            <span class="badge-completed">Status: Completed</span>
                        </div>
                    </div>

                    <a href="{app_url}" class="btn">View Task in Hairdrama App</a>
                </div>
                <div class="footer">
                    Hairdrama Tech Task Management &bull; Automated Notifications
                </div>
            </div>
        </body>
        </html>
        """

        plain_template = f"""
Hairdrama Tech - Task Completed

The following task has been marked as COMPLETED by {completer_name}:

Task: {task_title}
Status: Completed
Description: {task.get('description', '')}

Review details here: {app_url}
        """

        subject = f"✅ [Hairdrama Task] Completed: {task_title}"

        # Collect unique emails to notify
        recipients = set()
        if creator and creator.get("email"):
            recipients.add(creator["email"])
        if assignee and assignee.get("email"):
            recipients.add(assignee["email"])

        for email in recipients:
            cls.send_async(email, subject, html_template, plain_template)
