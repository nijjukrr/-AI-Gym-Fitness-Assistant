# AI Gym Fitness Assistant – REST API Documentation

This documentation details all the REST and WebSocket endpoints exposed by the backend FastAPI server.

## Base URL
*   Local Development: `http://localhost:8000/api`
*   Production (Render/Railway): `{Your-Deployed-URL}/api`

---

## 1. Authentication Module

### **Verify Email / Start Verification**
Simulates sending a 6-digit OTP verification code to a Gmail address and registers a temporary registration session.
*   **URL**: `/auth/verify`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "email": "username@gmail.com",
      "password": "userpassword123"
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "status": "success",
          "otp": "489201",
          "message": "Simulated verification code sent to username@gmail.com"
        }
        ```

### **Login & Registration (Seamless)**
Verifies the OTP code. If the user doesn't exist, it registers them automatically. If the user exists, it verifies the password. Returns a JWT access token.
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "email": "username@gmail.com",
      "password": "userpassword123",
      "otp": "489201"
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "status": "success",
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "email": "username@gmail.com",
            "name": "Username"
          }
        }
        ```

### **Get Authenticated User Profile**
Returns profile details of the current logged-in user. Requires JWT authorization header.
*   **URL**: `/auth/me`
*   **Method**: `GET`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "email": "username@gmail.com",
          "name": "Username",
          "timestamp": 1779920182.25
        }
        ```

---

## 2. Diet & Nutrition Module

### **Get Calorie Logs**
Retrieves calorie logs associated with the logged-in user.
*   **URL**: `/diet/logs`
*   **Method**: `GET`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        [
          {"food": "Oatmeal with Almonds", "kcal": 350, "timestamp": 1779920182.25},
          {"food": "Grilled Chicken & Rice", "kcal": 650, "timestamp": 1779923782.25}
        ]
        ```

### **Log Calorie Item**
Adds a calorie consumption entry for the logged-in user.
*   **URL**: `/diet/logs`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Request Body**:
    ```json
    {
      "food": "Avocado Salad",
      "kcal": 250
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "status": "success",
          "data": {
            "food": "Avocado Salad",
            "kcal": 250
          }
        }
        ```

### **Generate Diet Plan & Grocery List**
Generates a customized sports diet plan and matching grocery list using loaded LLMs or rule-based macronutrient equations.
*   **URL**: `/diet/generate`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Request Body**:
    ```json
    {
      "weight": 70.0,
      "height": 175.0,
      "age": 25,
      "gender": "male",
      "goal": "weight-loss"
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "bmi": 22.9,
          "target_calories": 2135,
          "protein_g": 160,
          "carbs_g": 213,
          "fats_g": 71,
          "plan_html": "<div class='plan-card'>...</div>"
        }
        ```

---

## 3. Workout & Training Module

### **Log Completed Workout Session**
Persists completed sets and accuracy scores.
*   **URL**: `/workout/log`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Request Body**:
    ```json
    {
      "exercise": "squats",
      "reps": 12,
      "score": 95
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "status": "success",
          "data": {
            "email": "username@gmail.com",
            "exercise": "squats",
            "reps": 12,
            "score": 95,
            "timestamp": 1779929821.15
          }
        }
        ```

### **Generate Personalized Workout Plan**
Generates a weekly fitness routine based on goal and experience level.
*   **URL**: `/workout/generate`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Request Body**:
    ```json
    {
      "level": "intermediate",
      "goal": "strength"
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "level": "intermediate",
          "goal": "strength",
          "plan_html": "<div class='plan-card'>...</div>"
        }
        ```

---

## 4. AI & ML Module

### **Predict Skipping Habit Risk**
Pre-trained scikit-learn Logistic Regression classifier predicts consistency skipping probability based on behavioral metrics.
*   **URL**: `/ml/habit-predict`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <your_jwt_token>`
*   **Request Body**:
    ```json
    {
      "sleep": 7.5,
      "stress": 3,
      "energy": 8,
      "days_since_workout": 1
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "risk_probability": 12,
          "advice": "You're in the optimal zone! Keep moving."
        }
        ```

### **NutriCoach AI Chatbot**
Conversational AI responder for nutrition advice.
*   **URL**: `/ai/coach`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "message": "Recommend a high-protein post-workout snack."
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "response": "<strong>Post-Workout Anabolic Snacks (Recommended):</strong><br>1. Whey & Banana Blitz..."
        }
        ```

### **Aura Motivation Buddy Chatbot**
Sentiment-aware workout buddy.
*   **URL**: `/ai/buddy`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "message": "I feel so tired today."
    }
    ```
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "response": "I hear you, Nishanth. Feeling exhausted is completely natural...",
          "sentiment": "empathetic"
        }
        ```

---

## 5. IoT Telemetry WebSocket

### **Treadmill & Dumbbell Feed**
Establishes a 1Hz sensor telemetry feed. Allows client adjustments.
*   **URL**: `/iot/ws`
*   **Protocol**: `WS` / `WSS`
*   **Message Format (Client -> Server)**:
    ```json
    {
      "speed": 8.0,
      "incline": 4
    }
    ```
*   **Message Format (Server -> Client)**:
    ```json
    {
      "treadmill": {
        "status": "Running",
        "speed": 8.0,
        "incline": 4,
        "distance": 1.45,
        "calories": 165,
        "heartrate": 145
      },
      "dumbbell": {
        "load_lbs": 80,
        "power_w": 180,
        "rep_cadence": "Optimal"
      },
      "mqtt_broker_status": "ONLINE"
    }
    ```

---

## 6. Admin Panel Module

### **Get System Statistics**
*   **URL**: `/admin/stats`
*   **Method**: `GET`
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "total_users": 1,
          "total_workouts": 8,
          "total_calories": 1450,
          "habit_completion_percentage": 85.5
        }
        ```

### **Educational Solution Runner**
Executes or reads `assessment_solutions.py` and returns stdout.
*   **URL**: `/assessment/solutions`
*   **Method**: `GET`
*   **Success Response**:
    *   **Code**: `200 OK`
    *   **Content**:
        ```json
        {
          "status": "success",
          "file_name": "assessment_solutions.py",
          "stdout": "=== Running Python for AI & ML... Q1: Filtering Data... Q2: Basic Arithmetic..."
        }
        ```
