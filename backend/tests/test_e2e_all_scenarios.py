"""
End-to-End Test Suite for Hairdrama Task Management.
Validates workflows against live Supabase PostgreSQL and Gmail SMTP.
"""

import unittest
import json
from app import create_app
from app.config import Config


class EndToEndFullScenariosTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

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

    def test_scenario_01_infrastructure_health(self):
        """Verify API health, Supabase DB connection, and Gmail SMTP status."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["database"]["connected"])
        self.assertEqual(data["database"]["type"], "supabase_postgresql")
        self.assertTrue(data["email_service"]["configured"])
        self.assertEqual(data["email_service"]["provider"], "gmail_smtp")

    def test_scenario_02_user_sync_and_directory(self):
        """Sync user profile and verify directory listing."""
        sync_res = self.client.post(
            "/api/users/sync",
            headers=self.auth_headers_c,
            data=json.dumps(self.user_c)
        )
        self.assertEqual(sync_res.status_code, 200)
        synced_user = sync_res.get_json()["data"]
        self.assertEqual(synced_user["email"], self.user_c["email"])

        users_res = self.client.get("/api/users", headers=self.auth_headers_c)
        self.assertEqual(users_res.status_code, 200)
        users = users_res.get_json()["data"]
        self.assertTrue(any(u["email"] == self.user_c["email"] for u in users))

    def test_scenario_03_task_creation_and_assignment(self):
        """User creates a task and assigns it to another user (triggers assignment email)."""
        payload = {
            "title": "E2E Test: Deliverable Review",
            "description": "Validation of task lifecycle and email integration.",
            "priority": "urgent",
            "due_date": "2026-10-15",
            "assigned_to": self.user_c["id"]
        }
        res = self.client.post("/api/tasks", headers=self.auth_headers_a, data=json.dumps(payload))
        self.assertEqual(res.status_code, 201)
        task = res.get_json()["data"]
        self.assertEqual(task["title"], payload["title"])
        self.assertEqual(task["priority"], "urgent")
        self.assertEqual(task["status"], "pending")
        self.assertEqual(task["assigned_to"], self.user_c["id"])
        self.assertEqual(task["created_by"], self.user_a["id"])

    def test_scenario_04_filtering_and_querying(self):
        """Filter tasks by status, priority, search keywords, and assignee."""
        res_all = self.client.get("/api/tasks", headers=self.auth_headers_a)
        self.assertEqual(res_all.status_code, 200)
        all_tasks = res_all.get_json()["data"]
        self.assertIsInstance(all_tasks, list)

        res_pending = self.client.get("/api/tasks?status=pending", headers=self.auth_headers_a)
        self.assertEqual(res_pending.status_code, 200)
        for t in res_pending.get_json()["data"]:
            self.assertEqual(t["status"], "pending")

        res_urgent = self.client.get("/api/tasks?priority=urgent", headers=self.auth_headers_a)
        self.assertEqual(res_urgent.status_code, 200)
        for t in res_urgent.get_json()["data"]:
            self.assertEqual(t["priority"], "urgent")

        res_search = self.client.get("/api/tasks?search=E2E", headers=self.auth_headers_a)
        self.assertEqual(res_search.status_code, 200)

    def test_scenario_05_status_transitions_and_completion_email(self):
        """Transition pending -> in_progress -> completed (triggers completion email)."""
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

        # Move to in_progress
        res_prog = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers_c,
            data=json.dumps({"status": "in_progress"})
        )
        self.assertEqual(res_prog.status_code, 200)
        self.assertEqual(res_prog.get_json()["data"]["status"], "in_progress")

        # Move to completed
        res_comp = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers_c,
            data=json.dumps({"status": "completed"})
        )
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.get_json()["data"]["status"], "completed")

    def test_scenario_06_task_reassignment(self):
        """Update task to reassign to a new team member."""
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

        update_res = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers_a,
            data=json.dumps({"assigned_to": self.user_c["id"]})
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()["data"]["assigned_to"], self.user_c["id"])

    def test_scenario_07_dashboard_stats(self):
        """Verify dashboard summary statistics calculation."""
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

    def test_scenario_08_security_and_permissions(self):
        """Reject unauthenticated requests and protect deletion permissions."""
        res_no_auth = self.client.get("/api/tasks")
        self.assertEqual(res_no_auth.status_code, 401)

        res_bad_auth = self.client.get("/api/tasks", headers={"Authorization": "Bearer bad-token-xxx"})
        self.assertEqual(res_bad_auth.status_code, 401)

        # User B cannot delete User A's task -> 403 Forbidden
        task_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers_a,
            data=json.dumps({"title": "Private Task Sarah"})
        )
        task_id = task_res.get_json()["data"]["id"]

        del_res_unauthorized = self.client.delete(f"/api/tasks/{task_id}", headers=self.auth_headers_b)
        self.assertEqual(del_res_unauthorized.status_code, 403)

    def test_scenario_09_task_deletion(self):
        """Creator deletes their task and verifies permanent removal."""
        task_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers_a,
            data=json.dumps({"title": "Task To Delete Permanently"})
        )
        task_id = task_res.get_json()["data"]["id"]

        del_res = self.client.delete(f"/api/tasks/{task_id}", headers=self.auth_headers_a)
        self.assertEqual(del_res.status_code, 200)

        get_res = self.client.get(f"/api/tasks/{task_id}", headers=self.auth_headers_a)
        self.assertEqual(get_res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
