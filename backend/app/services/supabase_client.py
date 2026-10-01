import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.config import Config

logger = logging.getLogger(__name__)

# Real Supabase Client Initialization
supabase_client = None

if Config.SUPABASE_URL and (Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_KEY):
    try:
        from supabase import create_client, Client
        key_to_use = Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_KEY
        supabase_client: Client = create_client(Config.SUPABASE_URL, key_to_use)
        logger.info("Supabase client initialized successfully with URL: %s", Config.SUPABASE_URL)
    except Exception as e:
        logger.error("Failed to initialize Supabase client: %s. Falling back to local mock store if needed.", e)
        supabase_client = None
else:
    logger.warning("Supabase credentials not configured in environment. Using in-memory store for development.")


# In-Memory Mock Store for Seamless Local Testing & Interview Demo
class MockDataStore:
    def __init__(self):
        # Seed default profiles
        self.profiles: Dict[str, Dict[str, Any]] = {
            "usr_demo_1": {
                "id": "usr_demo_1",
                "email": "sarah.developer@gmail.com",
                "full_name": "Sarah Connor",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "usr_demo_2": {
                "id": "usr_demo_2",
                "email": "alex.tech@gmail.com",
                "full_name": "Alex Vance",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "usr_demo_3": {
                "id": "usr_demo_3",
                "email": "john.hairdrama@gmail.com",
                "full_name": "John Doe",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
        # Seed default tasks
        self.tasks: Dict[str, Dict[str, Any]] = {
            "task_demo_1": {
                "id": "task_demo_1",
                "title": "Design Hairdrama Brand Color Palette & UI Tokens",
                "description": "Establish high-contrast modern luxury palette for the autumn release collection.",
                "status": "completed",
                "priority": "high",
                "due_date": "2026-10-05",
                "created_by": "usr_demo_1",
                "assigned_to": "usr_demo_2",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "task_demo_2": {
                "id": "task_demo_2",
                "title": "Implement Next.js Task Management Dashboard",
                "description": "Create responsive Kanban board with task filtering, sorting, and user assignment dropdown.",
                "status": "in_progress",
                "priority": "urgent",
                "due_date": "2026-10-10",
                "created_by": "usr_demo_2",
                "assigned_to": "usr_demo_1",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "task_demo_3": {
                "id": "task_demo_3",
                "title": "Integrate Gmail SMTP Notification Dispatcher",
                "description": "Send automated HTML notifications when tasks are created or status changes to completed.",
                "status": "pending",
                "priority": "medium",
                "due_date": "2026-10-15",
                "created_by": "usr_demo_1",
                "assigned_to": "usr_demo_3",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }

mock_store = MockDataStore()


class DatabaseService:
    """
    Unified Data Access Layer:
    Interacts with Supabase PostgreSQL when credentials exist,
    and falls back to MockDataStore for offline development.
    """

    @staticmethod
    def is_live_supabase() -> bool:
        return supabase_client is not None

    # ---------------- Profiles / Users ----------------
    @staticmethod
    def get_all_profiles() -> List[Dict[str, Any]]:
        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("profiles").select("*").order("full_name").execute()
                return res.data or []
            except Exception as e:
                logger.error("Error fetching profiles from Supabase: %s", e)
        return list(mock_store.profiles.values())

    @staticmethod
    def get_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("profiles").select("*").eq("id", profile_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error("Error fetching profile %s from Supabase: %s", profile_id, e)
        return mock_store.profiles.get(profile_id)

    @staticmethod
    def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("profiles").select("*").eq("email", email).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error("Error fetching profile by email from Supabase: %s", e)
        for p in mock_store.profiles.values():
            if p.get("email", "").lower() == email.lower():
                return p
        return None

    @staticmethod
    def upsert_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = profile_data.get("id") or str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()
        clean_profile = {
            "id": profile_id,
            "email": profile_data.get("email"),
            "full_name": profile_data.get("full_name") or profile_data.get("email", "").split("@")[0],
            "avatar_url": profile_data.get("avatar_url", ""),
            "updated_at": now_str
        }
        
        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("profiles").upsert(clean_profile).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error("Error upserting profile in Supabase: %s", e)

        # In-memory store
        if profile_id not in mock_store.profiles:
            clean_profile["created_at"] = now_str
        else:
            clean_profile["created_at"] = mock_store.profiles[profile_id].get("created_at", now_str)
        mock_store.profiles[profile_id] = clean_profile
        return clean_profile

    # ---------------- Tasks ----------------
    @staticmethod
    def get_tasks(
        status: Optional[str] = None,
        priority: Optional[str] = None,
        user_id: Optional[str] = None,
        filter_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves tasks with creator and assignee profile joins.
        """
        if DatabaseService.is_live_supabase():
            try:
                # Query tasks table with foreign key relations
                query = supabase_client.table("tasks").select(
                    "*, creator:created_by(id, email, full_name, avatar_url), assignee:assigned_to(id, email, full_name, avatar_url)"
                )
                
                if status and status != "all":
                    query = query.eq("status", status)
                if priority and priority != "all":
                    query = query.eq("priority", priority)
                if filter_type == "assigned_to_me" and user_id:
                    query = query.eq("assigned_to", user_id)
                elif filter_type == "created_by_me" and user_id:
                    query = query.eq("created_by", user_id)
                
                query = query.order("created_at", desc=True)
                res = query.execute()
                tasks_data = res.data or []
                
                if search:
                    term = search.lower()
                    tasks_data = [
                        t for t in tasks_data
                        if term in (t.get("title") or "").lower() or term in (t.get("description") or "").lower()
                    ]
                return tasks_data
            except Exception as e:
                logger.error("Error querying tasks from Supabase: %s. Falling back to local store.", e)

        # In-memory store fallback
        results = []
        for t in mock_store.tasks.values():
            if status and status != "all" and t.get("status") != status:
                continue
            if priority and priority != "all" and t.get("priority") != priority:
                continue
            if filter_type == "assigned_to_me" and user_id and t.get("assigned_to") != user_id:
                continue
            if filter_type == "created_by_me" and user_id and t.get("created_by") != user_id:
                continue
            if search:
                term = search.lower()
                title_match = term in (t.get("title") or "").lower()
                desc_match = term in (t.get("description") or "").lower()
                if not (title_match or desc_match):
                    continue

            # Attach profiles
            task_copy = dict(t)
            task_copy["creator"] = mock_store.profiles.get(t.get("created_by"))
            task_copy["assignee"] = mock_store.profiles.get(t.get("assigned_to")) if t.get("assigned_to") else None
            results.append(task_copy)

        # Sort by created_at desc
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results

    @staticmethod
    def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("tasks").select(
                    "*, creator:created_by(id, email, full_name, avatar_url), assignee:assigned_to(id, email, full_name, avatar_url)"
                ).eq("id", task_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error("Error fetching task %s from Supabase: %s", task_id, e)

        if task_id in mock_store.tasks:
            t = dict(mock_store.tasks[task_id])
            t["creator"] = mock_store.profiles.get(t.get("created_by"))
            t["assignee"] = mock_store.profiles.get(t.get("assigned_to")) if t.get("assigned_to") else None
            return t
        return None

    @staticmethod
    def create_task(data: Dict[str, Any]) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()
        
        record = {
            "id": task_id,
            "title": data.get("title"),
            "description": data.get("description", ""),
            "status": data.get("status", "pending"),
            "priority": data.get("priority", "medium"),
            "due_date": data.get("due_date"),
            "created_by": data.get("created_by"),
            "assigned_to": data.get("assigned_to"),
            "created_at": now_str,
            "updated_at": now_str
        }

        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("tasks").insert(record).execute()
                if res.data:
                    created = res.data[0]
                    # Fetch joined record
                    return DatabaseService.get_task_by_id(created["id"]) or created
            except Exception as e:
                logger.error("Error creating task in Supabase: %s", e)

        # In-memory store
        mock_store.tasks[task_id] = record
        return DatabaseService.get_task_by_id(task_id)

    @staticmethod
    def update_task(task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now_str = datetime.now(timezone.utc).isoformat()
        allowed_fields = ["title", "description", "status", "priority", "due_date", "assigned_to"]
        clean_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        clean_updates["updated_at"] = now_str

        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("tasks").update(clean_updates).eq("id", task_id).execute()
                if res.data:
                    return DatabaseService.get_task_by_id(task_id)
            except Exception as e:
                logger.error("Error updating task %s in Supabase: %s", task_id, e)

        if task_id in mock_store.tasks:
            mock_store.tasks[task_id].update(clean_updates)
            return DatabaseService.get_task_by_id(task_id)
        return None

    @staticmethod
    def delete_task(task_id: str) -> bool:
        if DatabaseService.is_live_supabase():
            try:
                res = supabase_client.table("tasks").delete().eq("id", task_id).execute()
                return bool(res.data)
            except Exception as e:
                logger.error("Error deleting task %s in Supabase: %s", task_id, e)

        if task_id in mock_store.tasks:
            del mock_store.tasks[task_id]
            return True
        return False
