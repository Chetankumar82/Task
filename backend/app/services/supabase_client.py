import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import Config

logger = logging.getLogger(__name__)

# Real Supabase Client Initialization (if URL & API key exist)
supabase_client = None

if Config.SUPABASE_URL and (Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_KEY):
    try:
        from supabase import create_client, Client
        key_to_use = Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_KEY
        supabase_client: Client = create_client(Config.SUPABASE_URL, key_to_use)
    except Exception:
        supabase_client = None


def get_db_connection():
    """Returns a direct PostgreSQL connection to Supabase if DATABASE_URL is configured."""
    if Config.DATABASE_URL:
        try:
            return psycopg2.connect(Config.DATABASE_URL)
        except Exception as e:
            logger.error("Failed to connect to Supabase PostgreSQL: %s", e)
    return None


# Seed default profiles in database if empty
def ensure_default_seed(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM public.profiles;")
            count = cur.fetchone()[0]
            if count == 0:
                demo_profiles = [
                    (
                        "usr_demo_1",
                        "sarah.developer@gmail.com",
                        "Sarah Connor",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                    ),
                    (
                        "usr_demo_2",
                        "alex.tech@gmail.com",
                        "Alex Vance",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                    ),
                    (
                        "usr_demo_3",
                        "john.hairdrama@gmail.com",
                        "John Doe",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
                    ),
                ]
                for pid, email, name, avatar in demo_profiles:
                    cur.execute(
                        """
                        INSERT INTO public.profiles (id, email, full_name, avatar_url)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING;
                        """,
                        (pid, email, name, avatar),
                    )
                conn.commit()
    except Exception as e:
        logger.warning("Could not auto-seed demo profiles: %s", e)


# Check connection on startup
init_conn = get_db_connection()
if init_conn:
    logger.info("Successfully connected to live Supabase PostgreSQL database!")
    ensure_default_seed(init_conn)
    init_conn.close()
else:
    logger.warning("DATABASE_URL not configured. Using local fallback.")


class MockDataStore:
    def __init__(self):
        self.profiles: Dict[str, Dict[str, Any]] = {
            "usr_demo_1": {
                "id": "usr_demo_1",
                "email": "sarah.developer@gmail.com",
                "full_name": "Sarah Connor",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "usr_demo_2": {
                "id": "usr_demo_2",
                "email": "alex.tech@gmail.com",
                "full_name": "Alex Vance",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "usr_demo_3": {
                "id": "usr_demo_3",
                "email": "john.hairdrama@gmail.com",
                "full_name": "John Doe",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        }
        self.tasks: Dict[str, Dict[str, Any]] = {
            "task_demo_1": {
                "id": "task_demo_1",
                "title": "Design Hairdrama Brand Color Palette & UI Tokens",
                "description": "Establish high-contrast modern luxury palette for autumn release.",
                "status": "completed",
                "priority": "high",
                "due_date": "2026-10-05",
                "created_by": "usr_demo_1",
                "assigned_to": "usr_demo_2",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "task_demo_2": {
                "id": "task_demo_2",
                "title": "Implement Next.js Task Management Dashboard",
                "description": "Create responsive Kanban board with task filtering and user assignment.",
                "status": "in_progress",
                "priority": "urgent",
                "due_date": "2026-10-10",
                "created_by": "usr_demo_2",
                "assigned_to": "usr_demo_1",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        }

mock_store = MockDataStore()


class DatabaseService:
    @staticmethod
    def is_live_supabase() -> bool:
        return bool(Config.DATABASE_URL or supabase_client)

    # ---------------- Profiles ----------------
    @staticmethod
    def get_all_profiles() -> List[Dict[str, Any]]:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM public.profiles ORDER BY full_name ASC;")
                    rows = cur.fetchall()
                    return [dict(r) for r in rows]
            except Exception as e:
                logger.error("Error querying profiles from Postgres: %s", e)
            finally:
                conn.close()
        return list(mock_store.profiles.values())

    @staticmethod
    def get_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM public.profiles WHERE id = %s;", (profile_id,))
                    row = cur.fetchone()
                    if row:
                        return dict(row)
            except Exception as e:
                logger.error("Error querying profile %s: %s", profile_id, e)
            finally:
                conn.close()
        return mock_store.profiles.get(profile_id)

    @staticmethod
    def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM public.profiles WHERE LOWER(email) = LOWER(%s);", (email,))
                    row = cur.fetchone()
                    if row:
                        return dict(row)
            except Exception as e:
                logger.error("Error querying profile by email: %s", e)
            finally:
                conn.close()
        for p in mock_store.profiles.values():
            if p.get("email", "").lower() == email.lower():
                return p
        return None

    @staticmethod
    def upsert_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = profile_data.get("id") or str(uuid.uuid4())
        email = profile_data.get("email", "")
        full_name = profile_data.get("full_name") or email.split("@")[0]
        avatar_url = profile_data.get("avatar_url", "")

        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        """
                        INSERT INTO public.profiles (id, email, full_name, avatar_url, updated_at)
                        VALUES (%s, %s, %s, %s, timezone('utc'::text, now()))
                        ON CONFLICT (id) DO UPDATE
                        SET full_name = EXCLUDED.full_name,
                            avatar_url = EXCLUDED.avatar_url,
                            email = EXCLUDED.email,
                            updated_at = timezone('utc'::text, now())
                        RETURNING *;
                        """,
                        (profile_id, email, full_name, avatar_url),
                    )
                    conn.commit()
                    row = cur.fetchone()
                    if row:
                        return dict(row)
            except Exception as e:
                logger.error("Error upserting profile in Postgres: %s", e)
            finally:
                conn.close()

        clean_profile = {
            "id": profile_id,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mock_store.profiles[profile_id] = clean_profile
        return clean_profile

    # ---------------- Tasks ----------------
    @staticmethod
    def _format_task_row(row: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": row.get("id"),
            "title": row.get("title"),
            "description": row.get("description", ""),
            "status": row.get("status"),
            "priority": row.get("priority"),
            "due_date": str(row.get("due_date")) if row.get("due_date") else None,
            "created_by": row.get("created_by"),
            "assigned_to": row.get("assigned_to"),
            "created_at": row.get("created_at").isoformat() if hasattr(row.get("created_at"), "isoformat") else str(row.get("created_at")),
            "updated_at": row.get("updated_at").isoformat() if hasattr(row.get("updated_at"), "isoformat") else str(row.get("updated_at")),
            "creator": {
                "id": row.get("created_by"),
                "email": row.get("creator_email"),
                "full_name": row.get("creator_name"),
                "avatar_url": row.get("creator_avatar"),
            } if row.get("creator_email") else None,
            "assignee": {
                "id": row.get("assigned_to"),
                "email": row.get("assignee_email"),
                "full_name": row.get("assignee_name"),
                "avatar_url": row.get("assignee_avatar"),
            } if row.get("assignee_email") else None,
        }

    @staticmethod
    def get_tasks(
        status: Optional[str] = None,
        priority: Optional[str] = None,
        user_id: Optional[str] = None,
        filter_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT 
                        t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at, t.updated_at,
                        t.created_by,
                        c.email as creator_email, c.full_name as creator_name, c.avatar_url as creator_avatar,
                        t.assigned_to,
                        a.email as assignee_email, a.full_name as assignee_name, a.avatar_url as assignee_avatar
                    FROM public.tasks t
                    LEFT JOIN public.profiles c ON t.created_by = c.id
                    LEFT JOIN public.profiles a ON t.assigned_to = a.id
                    WHERE 1=1
                    """
                    params = []

                    if status and status != "all":
                        query += " AND t.status = %s"
                        params.append(status)
                    if priority and priority != "all":
                        query += " AND t.priority = %s"
                        params.append(priority)
                    if filter_type == "assigned_to_me" and user_id:
                        query += " AND t.assigned_to = %s"
                        params.append(user_id)
                    elif filter_type == "created_by_me" and user_id:
                        query += " AND t.created_by = %s"
                        params.append(user_id)
                    if search:
                        query += " AND (LOWER(t.title) LIKE %s OR LOWER(t.description) LIKE %s)"
                        term = f"%{search.lower()}%"
                        params.extend([term, term])

                    query += " ORDER BY t.created_at DESC;"
                    cur.execute(query, tuple(params))
                    rows = cur.fetchall()
                    return [DatabaseService._format_task_row(dict(r)) for r in rows]
            except Exception as e:
                logger.error("Error querying tasks from Postgres: %s", e)
            finally:
                conn.close()

        # Fallback to mock store
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
                if not (term in (t.get("title") or "").lower() or term in (t.get("description") or "").lower()):
                    continue

            task_copy = dict(t)
            task_copy["creator"] = mock_store.profiles.get(t.get("created_by"))
            task_copy["assignee"] = mock_store.profiles.get(t.get("assigned_to")) if t.get("assigned_to") else None
            results.append(task_copy)

        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results

    @staticmethod
    def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT 
                        t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at, t.updated_at,
                        t.created_by,
                        c.email as creator_email, c.full_name as creator_name, c.avatar_url as creator_avatar,
                        t.assigned_to,
                        a.email as assignee_email, a.full_name as assignee_name, a.avatar_url as assignee_avatar
                    FROM public.tasks t
                    LEFT JOIN public.profiles c ON t.created_by = c.id
                    LEFT JOIN public.profiles a ON t.assigned_to = a.id
                    WHERE t.id = %s;
                    """
                    cur.execute(query, (task_id,))
                    row = cur.fetchone()
                    if row:
                        return DatabaseService._format_task_row(dict(row))
            except Exception as e:
                logger.error("Error fetching task %s: %s", task_id, e)
            finally:
                conn.close()

        if task_id in mock_store.tasks:
            t = dict(mock_store.tasks[task_id])
            t["creator"] = mock_store.profiles.get(t.get("created_by"))
            t["assignee"] = mock_store.profiles.get(t.get("assigned_to")) if t.get("assigned_to") else None
            return t
        return None

    @staticmethod
    def create_task(data: Dict[str, Any]) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())
        title = data.get("title")
        description = data.get("description", "")
        status = data.get("status", "pending")
        priority = data.get("priority", "medium")
        due_date = data.get("due_date") or None
        created_by = data.get("created_by")
        assigned_to = data.get("assigned_to") or None

        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO public.tasks (id, title, description, status, priority, due_date, created_by, assigned_to)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                        """,
                        (task_id, title, description, status, priority, due_date, created_by, assigned_to),
                    )
                    conn.commit()
                return DatabaseService.get_task_by_id(task_id)
            except Exception as e:
                logger.error("Error inserting task into Postgres: %s", e)
            finally:
                conn.close()

        record = {
            "id": task_id,
            "title": title,
            "description": description,
            "status": status,
            "priority": priority,
            "due_date": due_date,
            "created_by": created_by,
            "assigned_to": assigned_to,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mock_store.tasks[task_id] = record
        return DatabaseService.get_task_by_id(task_id)

    @staticmethod
    def update_task(task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cur:
                    allowed = ["title", "description", "status", "priority", "due_date", "assigned_to"]
                    set_clauses = []
                    params = []
                    for k, v in updates.items():
                        if k in allowed:
                            set_clauses.append(f"{k} = %s")
                            params.append(v if v != "" else None)

                    if set_clauses:
                        set_clauses.append("updated_at = timezone('utc'::text, now())")
                        params.append(task_id)
                        query = f"UPDATE public.tasks SET {', '.join(set_clauses)} WHERE id = %s;"
                        cur.execute(query, tuple(params))
                        conn.commit()
                return DatabaseService.get_task_by_id(task_id)
            except Exception as e:
                logger.error("Error updating task in Postgres: %s", e)
            finally:
                conn.close()

        if task_id in mock_store.tasks:
            mock_store.tasks[task_id].update(updates)
            mock_store.tasks[task_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
            return DatabaseService.get_task_by_id(task_id)
        return None

    @staticmethod
    def delete_task(task_id: str) -> bool:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM public.tasks WHERE id = %s;", (task_id,))
                    conn.commit()
                    return cur.rowcount > 0
            except Exception as e:
                logger.error("Error deleting task in Postgres: %s", e)
            finally:
                conn.close()

        if task_id in mock_store.tasks:
            del mock_store.tasks[task_id]
            return True
        return False
