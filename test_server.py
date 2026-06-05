import os
import unittest
from fastapi.testclient import TestClient

# Set dummy environment variables for testing
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/testdb")
os.environ.setdefault("OPENAI_API_KEY", "test_key")

# Import the FastAPI app after setting env vars
from server import app

client = TestClient(app)

class TestServerEndpoints(unittest.TestCase):
    def test_admin_stats(self):
        response = client.get("/api/admin/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_users", data)
        self.assertIn("total_workouts", data)
        self.assertIn("total_calories", data)
        self.assertIn("habit_completion_percentage", data)

    def test_admin_users(self):
        response = client.get("/api/admin/users")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_admin_workouts(self):
        response = client.get("/api/admin/workouts")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_admin_habits(self):
        response = client.get("/api/admin/habits")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_ai_coach_chat(self):
        payload = {"message": "What should I eat for breakfast?"}
        response = client.post("/api/ai/coach", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("response", response.json())

    def test_ai_buddy_chat(self):
        payload = {"message": "I feel tired today."}
        response = client.post("/api/ai/buddy", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("response", response.json())
        self.assertIn("sentiment", response.json())

if __name__ == "__main__":
    unittest.main()
