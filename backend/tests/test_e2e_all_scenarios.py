"""
Comprehensive End-to-End Test Suite for Hairdrama Tech Task Management.
Tests every scenario against live Supabase PostgreSQL and Gmail SMTP.
"""

import unittest
import json
import time
from app import create_app
from app.config import Config
from app.services.supabase_client import DatabaseService
from app.services.email_service import GmailService


class EndToEndFullScenariosTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

        # Test users
        cls.user_a = {
            "id": "11111111-1111-4111-a111-111111111111",
            "email": "sarah.pm@gmail.com",
            "full_name": "Sarah Connor",
            "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=Sarah"
        }
        cls.user_b = {
            "id": "22222222-2222-4222-a222-222222222222",
            "email": "alex.tech@gmail.com",
            "full_name": "Alex Murphy",
            "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=Alex"
        }
        cls.user_c = {
            "id": "33333333-3333-4333-a333-333333333333",
            "email": "chetankumar8203@gmail.com",
            "full_name": "Chetan Kumar",
            "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=Chetan"
        }

        cls.auth_headers_a = {
            "Authorization": f"Bearer mock-user-{cls.user_a['id']}",
            "Content-Type": "application/json"
        }
        cls.auth_headers_b = {
            "Authorization": f"Bearer mock-user-{cls.user_b['id']}",
            "Content-Type": "application/json"
        }
        cls.auth_headers_c = {
            "Authorization": f"Bearer mock-user-{cls.user_c['id']}",
            "Content-Type": "application/json"
        }

    # ==========================================
    # SCENARIO 1: Health & Infrastructure Check
    # ==========================================
    def test_scenario_01_infrastructure_health(self):
        """Scenario 1: Verify API health, Supabase DB connection, and Gmail SMTP status."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["database"]["connected"])
        self.assertEqual(data["database"]["type"], "supabase_postgresql")
        self.assertTrue(data["email_service"]["configured"])
        self.assertEqual(data["email_service"]["provider"], "gmail_smtp")
        print("\n[SCENARIO 1 PASS] Infrastructure: Supabase PostgreSQL connected, Gmail SMTP configured.")

    # ==========================================
    # SCENARIO 2: User Account Sync & Directory
    # ==========================================
    def test_scenario_02_user_sync_and_directory(self):
        """Scenario 2: Sync Google OAuth / Gmail user profile and verify directory listing."""
        # 1. Sync User C (Chetan)
        sync_res = self.client.post(
            "/api/users/sync",
            headers=self.auth_headers_c,
            data=json.dumps(self.user_c)
        )
        self.assertEqual(sync_res.status_code, 200)
        synced_user = sync_res.get_json()["data"]
        self.assertEqual(synced_user["email"], self.user_c["email"])

        # 2. Fetch users list
        users_res = self.client.get("/api/users", headers=self.auth_headers_c)
        self.assertEqual(users_res.status_code, 200)
        users = users_res.get_json()["data"]
        self.assertTrue(any(u["email"] == self.user_c["email"] for u in users))
        print(f"\n[SCENARIO 2 PASS] User profile synchronized and retrieved from directory ({len(users)} users active).")

    # ==========================================
    # SCENARIO 3: Task Creation & Assignment
    # ==========================================
    def test_scenario_03_task_creation_and_assignment(self):
        """Scenario 3: User creates a task and assigns it to another user (triggers assignment email)."""
        payload = {
            "title": "E2E Test: Deliverable Review",
            "description": "Comprehensive validation of task lifecycle and email integration.",
            "priority": "urgent",
            "due_date": "2026-10-15",
            "assigned_to": self.user_c["id"]  # Assigned to Chetan Kumar
        }
        res = self.client.post("/api/tasks", headers=self.auth_headers_a, data=json.dumps(payload))
        self.assertEqual(res.status_code, 201)
        task = res.get_json()["data"]
        self.assertEqual(task["title"], payload["title"])
        self.assertEqual(task["priority"], "urgent")
        self.assertEqual(task["status"], "pending")
        self.assertEqual(task["assigned_to"], self.user_c["id"])
        self.assertEqual(task["created_by"], self.user_a["id"])
        print(f"\n[SCENARIO 3 PASS] Task '{task['title']}' created by Sarah and assigned to Chetan (id: {task['id']}).")
        return task["id"]

    # ==========================================
    # SCENARIO 4: Filtering, Searching & Querying
    # ==========================================
    def test_scenario_04_filtering_and_querying(self):
        """Scenario 4: Filter tasks by status, priority, search keywords, and assignee."""
        # 1. Fetch all
        res_all = self.client.get("/api/tasks", headers=self.auth_headers_a)
        self.assertEqual(res_all.status_code, 200)
        all_tasks = res_all.get_json()["data"]
        self.assertIsInstance(all_tasks, list)

        # 2. Filter by status
        res_pending = self.client.get("/api/tasks?status=pending", headers=self.auth_headers_a)
        self.assertEqual(res_pending.status_code, 200)
        for t in res_pending.get_json()["data"]:
            self.assertEqual(t["status"], "pending")

        # 3. Filter by priority
        res_urgent = self.client.get("/api/tasks?priority=urgent", headers=self.auth_headers_a)
        self.assertEqual(res_urgent.status_code, 200)
        for t in res_urgent.get_json()["data"]:
            self.assertEqual(t["priority"], "urgent")

        # 4. Search query
        res_search = self.client.get("/api/tasks?search=E2E", headers=self.auth_headers_a)
        self.assertEqual(res_search.status_code, 200)
        print(f"\n[SCENARIO 4 PASS] Task filtering and full-text search operational.")

    # ==========================================
    # SCENARIO 5: Status Transitions & Completion
    # ==========================================
    def test_scenario_05_status_transitions_and_completion_email(self):
        """Scenario 5: Transition pending -> in_progress -> completed (triggers completion email)."""
        # Create a task for testing completion
        create_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers_a,
            data=json.dumps({
                "title": "E2E Lifecycle: Complete Feature X",
                "description": "Test completion status update and notification dispatch.",
                "priority": "high",
                "assigned_to": self.user_c["id"]
            })
        )
        self.assertEqual(create_res.status_code, 201)
        task_id = create_res.get_json()["data"]["id"]

        # Step 1: Move to in_progress
        res_prog = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers_c,
            data=json.dumps({"status": "in_progress"})
        )
        self.assertEqual(res_prog.status_code, 200)
        self.assertEqual(res_prog.get_json()["data"]["status"], "in_progress")

        # Step 2: Move to completed (triggers completion email)
        res_comp = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers_c,
            data=json.dumps({"status": "completed"})
        )
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.get_json()["data"]["status"], "completed")
        print(f"\n[SCENARIO 5 PASS] Task lifecycle transition (pending -> in_progress -> completed) verified.")

    # ==========================================
    # SCENARIO 6: Task Reassignment
    # ==========================================
    def test_scenario_06_task_reassignment(self):
        """Scenario 6: Update task to reassign to a new team member."""
        create_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers_a,
            data=json.dumps({
                "title": "Reassignment Test Task",
                "priority": "medium",
                "assigned_to": self.user_b["id"]
            })
        )
        task_id = create_res.get_json()["data"]["id"]

        # Reassign to User C
        update_res = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers_a,
            data=json.dumps({"assigned_to": self.user_c["id"]})
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()["data"]["assigned_to"], self.user_c["id"])
        print(f"\n[SCENARIO 6 PASS] Task successfully reassigned to new member.")

    # ==========================================
    # SCENARIO 7: Dashboard Analytics / Stats
    # ==========================================
    def test_scenario_07_dashboard_stats(self):
        """Scenario 7: Verify dashboard summary statistics calculation."""
        res = self.client.get("/api/stats", headers=self.auth_headers_a)
        self.assertEqual(res.status_code, 200)
        stats = res.get_json()["data"]
        self.assertIn("total_tasks", stats)
        self.assertIn("pending_tasks", stats)
        self.assertIn("in_progress_tasks", stats)
        self.assertIn("completed_tasks", stats)
        self.assertIn("assigned_to_me", stats)
        self.assertIn("created_by_me", stats)
        self.assertGreaterEqual(stats["total_tasks"], 1)
        print(f"\n[SCENARIO 7 PASS] Stats aggregation verified: total={stats['total_tasks']}, completed={stats['completed_tasks']}.")

    # ==========================================
    # SCENARIO 8: Security & Authorization Access
    # ==========================================
    def test_scenario_08_security_and_permissions(self):
        """Scenario 8: Reject unauthenticated requests and protect deletion permissions."""
        # 1. No token -> 401
        res_no_auth = self.client.get("/api/tasks")
        self.assertEqual(res_no_auth.status_code, 401)

        # 2. Invalid token -> 401
        res_bad_auth = self.client.get("/api/tasks", headers={"Authorization": "Bearer bad-token-xxx"})
        self.assertEqual(res_bad_auth.status_code, 401)

        # 3. User B tries to delete User A's task -> 403 Forbidden
        task_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers_a,
            data=json.dumps({"title": "Private Task Sarah"})
        )
        task_id = task_res.get_json()["data"]["id"]

        del_res_unauthorized = self.client.delete(f"/api/tasks/{task_id}", headers=self.auth_headers_b)
        self.assertEqual(del_res_unauthorized.status_code, 403)
        print("\n[SCENARIO 8 PASS] Security controls active: 401 on missing auth, 403 on forbidden actions.")

    # ==========================================
    # SCENARIO 9: Task Deletion Flow
    # ==========================================
    def test_scenario_09_task_deletion(self):
        """Scenario 9: Creator deletes their task and verifies permanent removal."""
        task_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers_a,
            data=json.dumps({"title": "Task To Delete Permanently"})
        )
        task_id = task_res.get_json()["data"]["id"]

        del_res = self.client.delete(f"/api/tasks/{task_id}", headers=self.auth_headers_a)
        self.assertEqual(del_res.status_code, 200)

        # Confirm 404
        get_res = self.client.get(f"/api/tasks/{task_id}", headers=self.auth_headers_a)
        self.assertEqual(get_res.status_code, 404)
        print(f"\n[SCENARIO 9 PASS] Task successfully deleted and verified 404 from database.")


if __name__ == "__main__":
    unittest.main()
