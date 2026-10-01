from datetime import datetime, timezone
from flask import Blueprint, jsonify, g
from app.auth import require_auth
from app.services.supabase_client import DatabaseService
from app.services.email_service import GmailService
from app.config import Config

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Production health check endpoint for monitoring uptime on Render, Railway, or Vercel.
    """
    is_supabase_connected = DatabaseService.is_live_supabase()
    is_gmail_configured = GmailService.is_configured()

    return jsonify({
        "status": "healthy",
        "service": "hairdrama-task-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "type": "supabase_postgresql" if is_supabase_connected else "in_memory_mock",
            "connected": True
        },
        "email_service": {
            "provider": "gmail_smtp",
            "configured": is_gmail_configured,
            "smtp_server": Config.SMTP_SERVER,
            "smtp_port": Config.SMTP_PORT
        }
    }), 200


@health_bp.route("/stats", methods=["GET"])
@require_auth
def get_stats():
    """
    Dashboard summary statistics for current user.
    """
    user_id = g.current_user["id"]
    all_tasks = DatabaseService.get_tasks()

    total = len(all_tasks)
    pending = sum(1 for t in all_tasks if t.get("status") == "pending")
    in_progress = sum(1 for t in all_tasks if t.get("status") == "in_progress")
    completed = sum(1 for t in all_tasks if t.get("status") == "completed")
    assigned_to_me = sum(1 for t in all_tasks if t.get("assigned_to") == user_id)
    created_by_me = sum(1 for t in all_tasks if t.get("created_by") == user_id)

    return jsonify({
        "success": True,
        "data": {
            "total_tasks": total,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "completed_tasks": completed,
            "assigned_to_me": assigned_to_me,
            "created_by_me": created_by_me
        }
    }), 200
