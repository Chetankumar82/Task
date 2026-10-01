import unittest
import json
from app import create_app
from app.config import Config
from app.services.supabase_client import mock_store

class TaskManagementAPITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.auth_headers = {
            "Authorization": "Bearer mock-user-sarah",
            "Content-Type": "application/json"
        }

    def test_health_check(self):
        """Test health endpoint is online."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("database", data)
        self.assertIn("email_service", data)

    def test_unauthorized_access(self):
        """Test that endpoints reject requests without authorization."""
        res = self.client.get("/api/tasks")
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn("error", data)

    def test_get_users(self):
        """Test fetching registered users list for task assignment."""
        res = self.client.get("/api/users", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["data"]), 1)
        # Verify user attributes
        user = data["data"][0]
        self.assertIn("email", user)
        self.assertIn("full_name", user)

    def test_create_and_get_task(self):
        """Test creating a new task with assignment."""
        new_task = {
            "title": "Build Automated CI/CD Pipeline",
            "description": "Configure GitHub Actions workflow for linting and test execution.",
            "priority": "high",
            "due_date": "2026-10-18",
            "assigned_to": "usr_demo_2"
        }
        create_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers,
            data=json.dumps(new_task)
        )
        self.assertEqual(create_res.status_code, 201)
        created_data = create_res.get_json()
        self.assertTrue(created_data["success"])
        task_id = created_data["data"]["id"]

        # Fetch single task
        get_res = self.client.get(f"/api/tasks/{task_id}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 200)
        task_data = get_res.get_json()["data"]
        self.assertEqual(task_data["title"], new_task["title"])
        self.assertEqual(task_data["status"], "pending")
        self.assertEqual(task_data["priority"], "high")

    def test_update_task_to_completed(self):
        """Test updating task status to completed (triggers completion email)."""
        # First create a task
        create_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers,
            data=json.dumps({
                "title": "Refactor Data Layer",
                "priority": "medium",
                "assigned_to": "usr_demo_2"
            })
        )
        task_id = create_res.get_json()["data"]["id"]

        # Update status to completed
        update_res = self.client.patch(
            f"/api/tasks/{task_id}",
            headers=self.auth_headers,
            data=json.dumps({"status": "completed"})
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.get_json()["data"]
        self.assertEqual(updated_data["status"], "completed")

    def test_delete_task(self):
        """Test deleting a task created by user."""
        create_res = self.client.post(
            "/api/tasks",
            headers=self.auth_headers,
            data=json.dumps({"title": "Temporary Task"})
        )
        task_id = create_res.get_json()["data"]["id"]

        del_res = self.client.delete(f"/api/tasks/{task_id}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 200)

        # Ensure it's deleted
        get_res = self.client.get(f"/api/tasks/{task_id}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 404)

    def test_get_dashboard_stats(self):
        """Test fetching dashboard stats."""
        res = self.client.get("/api/stats", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        stats = data["data"]
        self.assertIn("total_tasks", stats)
        self.assertIn("pending_tasks", stats)
        self.assertIn("completed_tasks", stats)


if __name__ == "__main__":
    unittest.main()
