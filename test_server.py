import os
import unittest
from fastapi.testclient import TestClient

# Set dummy environment variables for testing
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/testdb")
os.environ.setdefault("HUGGINGFACE_API_KEY", "test_key")
os.environ.setdefault("JWT_SECRET", "test_secret_key")

# Import the FastAPI app
from server import app

client = TestClient(app)

class TestServerEndpoints(unittest.TestCase):
    def setUp(self):
        # Setup static test credentials
        self.test_email = "testuser@gmail.com"
        self.test_password = "testpassword123"
        self.test_otp = "123456"
        self.token = None
        
        # Verify first
        verify_res = client.post("/api/auth/verify", json={
            "email": self.test_email,
            "password": self.test_password
        })
        self.assertEqual(verify_res.status_code, 200)
        
        # Login to get token
        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password,
            "otp": self.test_otp
        })
        self.assertEqual(login_res.status_code, 200)
        self.token = login_res.json()["token"]

    def test_swagger_docs(self):
        # Verify that Swagger endpoint is exposed and not intercepted by static files
        response = client.get("/docs")
        self.assertEqual(response.status_code, 200)
        self.assertIn("swagger", response.text.lower())

    def test_auth_me(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        response = client.get("/api/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.test_email)

    def test_admin_stats(self):
        response = client.get("/api/admin/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_users", data)
        self.assertIn("total_workouts", data)
        self.assertIn("total_calories", data)
        self.assertIn("habit_completion_percentage", data)

    def test_diet_logs(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        # Get logs
        response = client.get("/api/diet/logs", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        
        # Post log
        payload = {"food": "Avocado Salad", "kcal": 250}
        post_response = client.post("/api/diet/logs", json=payload, headers=headers)
        self.assertEqual(post_response.status_code, 200)

    def test_diet_generate(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {
            "weight": 70.0,
            "height": 175.0,
            "age": 25,
            "gender": "male",
            "goal": "weight-loss"
        }
        response = client.post("/api/diet/generate", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("bmi", data)
        self.assertIn("plan_html", data)

    def test_workout_logs(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        # Get logs
        response = client.get("/api/workout/logs", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        
        # Post log
        payload = {
            "exercise": "squats",
            "reps": 12,
            "sets": 3,
            "duration": 45,
            "performance_score": 92
        }
        post_response = client.post("/api/workout/logs", json=payload, headers=headers)
        self.assertEqual(post_response.status_code, 200)
        
        # Get logs again
        get_response = client.get("/api/workout/logs", headers=headers)
        self.assertEqual(get_response.status_code, 200)
        logs = get_response.json()
        self.assertTrue(len(logs) > 0)
        self.assertEqual(logs[-1]["exercise"], "squats")
        self.assertEqual(logs[-1]["sets"], 3)
        self.assertEqual(logs[-1]["duration"], 45)

    def test_workout_generate(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {
            "level": "intermediate",
            "goal": "strength"
        }
        response = client.post("/api/workout/generate", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("plan_html", data)

    def test_habit_predict(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {
            "sleep": 8.0,
            "stress": 2,
            "energy": 9,
            "days_since_workout": 1
        }
        response = client.post("/api/ml/habit-predict", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("risk_probability", data)
        self.assertIn("advice", data)

    def test_ai_coach_chat(self):
        payload = {"message": "Give me a high-protein recipe option."}
        response = client.post("/api/ai/coach", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("response", response.json())

    def test_ai_buddy_chat(self):
        payload = {"message": "I am so ready to crush today!"}
        response = client.post("/api/ai/buddy", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("response", response.json())
        self.assertIn("sentiment", response.json())


if __name__ == "__main__":
    unittest.main()
