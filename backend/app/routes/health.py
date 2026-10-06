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
    from app.services.supabase_client import get_db_connection
    is_gmail_configured = GmailService.is_configured()
    
    db_test_ok = False
    db_test_err = None
    try:
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                cur.fetchone()
            conn.close()
            db_test_ok = True
        else:
            db_test_err = "get_db_connection returned None (check DATABASE_URL)"
    except Exception as e:
        db_test_err = str(e)

    return jsonify({
        "status": "healthy" if db_test_ok else "degraded",
        "service": "hairdrama-task-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "type": "supabase_postgresql" if db_test_ok else "in_memory_mock",
            "connected": db_test_ok,
            "error": db_test_err
        },
        "email_service": {
            "provider": "gmail_smtp",
            "configured": is_gmail_configured,
            "gmail_user": Config.GMAIL_USER,
            "password_configured": bool(Config.GMAIL_APP_PASSWORD),
            "smtp_server": Config.SMTP_SERVER,
            "smtp_port": Config.SMTP_PORT
        },
        "app_public_url": Config.APP_PUBLIC_URL,
        "frontend_url": Config.FRONTEND_URL
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
