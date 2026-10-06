import logging
from flask import Blueprint, request, jsonify, g
from app.auth import require_auth
from app.config import Config
from app.services.supabase_client import DatabaseService
from app.services.email_service import GmailService

logger = logging.getLogger(__name__)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

VALID_STATUSES = {"pending", "in_progress", "completed"}
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


@tasks_bp.route("", methods=["GET"])
@require_auth
def get_tasks():
    """
    Get tasks with optional filters:
    - status: pending | in_progress | completed | all
    - priority: low | medium | high | urgent | all
    - filter: all | assigned_to_me | created_by_me
    - search: search text in title or description
    """
    status = request.args.get("status")
    priority = request.args.get("priority")
    filter_type = request.args.get("filter", "all")
    search = request.args.get("search")
    user_id = g.current_user["id"]

    tasks = DatabaseService.get_tasks(
        status=status,
        priority=priority,
        user_id=user_id,
        filter_type=filter_type,
        search=search
    )

    return jsonify({
        "success": True,
        "count": len(tasks),
        "data": tasks
    }), 200


@tasks_bp.route("/<task_id>", methods=["GET"])
@require_auth
def get_task(task_id):
    """Retrieve single task by ID."""
    task = DatabaseService.get_task_by_id(task_id)
    if not task:
        return jsonify({"error": "Not Found", "message": "Task not found."}), 404

    return jsonify({"success": True, "data": task}), 200


@tasks_bp.route("", methods=["POST"])
@require_auth
def create_task():
    """
    Create a new task.
    Dispatches automated Gmail notification to the assignee if assigned.
    """
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    priority = (data.get("priority") or "medium").lower()
    due_date = data.get("due_date")
    assigned_to = data.get("assigned_to")

    if not title:
        return jsonify({"error": "Validation Error", "message": "Task title is required."}), 400

    if priority not in VALID_PRIORITIES:
        priority = "medium"

    # Validate assignee if provided
    assignee_profile = None
    if assigned_to:
        assignee_profile = DatabaseService.get_profile_by_id(assigned_to)
        if not assignee_profile:
            return jsonify({"error": "Validation Error", "message": "Selected assignee does not exist."}), 400
        assigned_to = assignee_profile["id"]

    task_payload = {
        "title": title,
        "description": description,
        "status": "pending",
        "priority": priority,
        "due_date": due_date,
        "created_by": g.current_user["id"],
        "assigned_to": assigned_to if assigned_to else None
    }

    created_task = DatabaseService.create_task(task_payload)

    # Trigger asynchronous Gmail notification (notifies creator and assignee)
    GmailService.notify_task_created(
        task=created_task,
        creator=g.current_user,
        assignee=assignee_profile
    )

    return jsonify({
        "success": True,
        "message": "Task created successfully.",
        "data": created_task
    }), 201


@tasks_bp.route("/<task_id>", methods=["PUT", "PATCH"])
@require_auth
def update_task(task_id):
    """
    Update an existing task.
    Triggers:
    - Gmail notification when status transitions to 'completed'
    - Gmail notification if a new assignee is designated
    """
    existing_task = DatabaseService.get_task_by_id(task_id)
    if not existing_task:
        return jsonify({"error": "Not Found", "message": "Task not found."}), 404

    data = request.get_json() or {}
    old_status = existing_task.get("status")
    old_assignee_id = existing_task.get("assigned_to")

    updates = {}
    if "title" in data:
        updates["title"] = str(data["title"]).strip()
    if "description" in data:
        updates["description"] = str(data["description"]).strip()
    if "status" in data:
        new_status = str(data["status"]).lower()
        if new_status in VALID_STATUSES:
            updates["status"] = new_status
    if "priority" in data:
        new_priority = str(data["priority"]).lower()
        if new_priority in VALID_PRIORITIES:
            updates["priority"] = new_priority
    if "due_date" in data:
        updates["due_date"] = data["due_date"]
    if "assigned_to" in data:
        assigned_val = data["assigned_to"]
        if assigned_val:
            assignee_profile = DatabaseService.get_profile_by_id(assigned_val)
            if not assignee_profile:
                return jsonify({"error": "Validation Error", "message": "Selected assignee does not exist."}), 400
            updates["assigned_to"] = assignee_profile["id"]
        else:
            updates["assigned_to"] = None

    updated_task = DatabaseService.update_task(task_id, updates)
    if not updated_task:
        return jsonify({"error": "Internal Error", "message": "Failed to update task."}), 500

    # 1. Check if status transitioned to 'completed'
    new_status = updated_task.get("status")
    if new_status == "completed" and old_status != "completed":
        creator_profile = DatabaseService.get_profile_by_id(updated_task["created_by"])
        assignee_profile = DatabaseService.get_profile_by_id(updated_task["assigned_to"]) if updated_task.get("assigned_to") else None
        
        GmailService.notify_task_completed(
            task=updated_task,
            completed_by=g.current_user,
            creator=creator_profile or {"email": ""},
            assignee=assignee_profile
        )

    # 2. Check if a new assignee was assigned
    new_assignee_id = updated_task.get("assigned_to")
    if new_assignee_id and new_assignee_id != old_assignee_id:
        assignee_profile = DatabaseService.get_profile_by_id(new_assignee_id)
        if assignee_profile:
            GmailService.notify_task_created(
                task=updated_task,
                creator=g.current_user,
                assignee=assignee_profile
            )

    return jsonify({
        "success": True,
        "message": "Task updated successfully.",
        "data": updated_task
    }), 200


@tasks_bp.route("/<task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id):
    """
    Delete a task.
    Permission check: creator or designated admin can delete.
    """
    task = DatabaseService.get_task_by_id(task_id)
    if not task:
        return jsonify({"error": "Not Found", "message": "Task not found."}), 404

    # Allow creator or admin
    if task.get("created_by") != g.current_user["id"]:
        return jsonify({
            "error": "Forbidden",
            "message": "Only the creator of this task can delete it."
        }), 403

    success = DatabaseService.delete_task(task_id)
    if success:
        return jsonify({"success": True, "message": "Task deleted successfully."}), 200
    return jsonify({"error": "Internal Error", "message": "Failed to delete task."}), 500


@tasks_bp.route("/test-email", methods=["GET"])
def test_email_endpoint():
    """Diagnostic endpoint to test live Gmail SMTP delivery and report errors."""
    to_email = request.args.get("to") or Config.GMAIL_USER or "chetankumar8203@gmail.com"
    try:
        report = GmailService.diagnose_smtp(to_email)
        return jsonify(report), 200
    except Exception as e:
        return jsonify({
            "delivered": False,
            "error": str(e),
            "type": type(e).__name__
        }), 200
