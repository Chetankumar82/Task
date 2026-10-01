import logging
from flask import Blueprint, jsonify, request, g
from app.auth import require_auth
from app.services.supabase_client import DatabaseService

logger = logging.getLogger(__name__)

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("", methods=["GET"])
@require_auth
def get_users():
    """
    Get all registered users for task assignment.
    Allows team members to assign tasks to any registered Gmail user.
    """
    profiles = DatabaseService.get_all_profiles()
    # Format user objects
    user_list = [
        {
            "id": p["id"],
            "email": p["email"],
            "full_name": p.get("full_name") or p["email"].split("@")[0],
            "avatar_url": p.get("avatar_url") or f"https://api.dicebear.com/7.x/initials/svg?seed={p.get('full_name', p['email'])}"
        }
        for p in profiles
    ]
    return jsonify({
        "success": True,
        "count": len(user_list),
        "data": user_list
    }), 200


@users_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user_profile():
    """Returns the authenticated user's profile."""
    return jsonify({
        "success": True,
        "data": g.current_user
    }), 200


@users_bp.route("/sync", methods=["POST"])
@require_auth
def sync_user_profile():
    """
    Syncs user details from frontend Google OAuth session.
    Ensures email, full_name, and avatar_url are up-to-date in public.profiles.
    """
    data = request.get_json() or {}
    updated = DatabaseService.upsert_profile({
        "id": g.current_user["id"],
        "email": data.get("email") or g.current_user["email"],
        "full_name": data.get("full_name") or g.current_user.get("full_name"),
        "avatar_url": data.get("avatar_url") or g.current_user.get("avatar_url")
    })
    return jsonify({
        "success": True,
        "message": "User profile synchronized successfully.",
        "data": updated
    }), 200
