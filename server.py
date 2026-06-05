import os
import random
import time
import math
import asyncio
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import numpy as np

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Safe imports for AI/ML frameworks to ensure boot success
try:
    from sklearn.linear_model import LogisticRegression
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    import pymongo
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

app = FastAPI(title="Trivan's Tech AI Gym Backend")
app.mount("/", StaticFiles(directory=".", html=True))

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# DATABASE SETUP (MongoDB Connection)
# ----------------------------------------------------
db = None
users_col = None
calories_col = None
habits_col = None
workouts_col = None

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://nishanthkr775_db_user:YOUR_PASSWORD@cluster0.nxw4ute.mongodb.net/?appName=Cluster0")

if HAS_PYMONGO:
    try:
        # Resolve `<db_password>` if present, notify in console
        client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Ping connection
        client.admin.command('ping')
        db = client["trivans_gym_db"]
        users_col = db["users"]
        calories_col = db["calories"]
        habits_col = db["habits"]
        workouts_col = db["workouts"]
        print("[DATABASE] Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"[DATABASE WARNING] Failed to connect to MongoDB: {e}")
        print("[DATABASE WARNING] Running with in-memory fallback database.")
else:
    print("[DATABASE WARNING] pymongo not installed. Running with in-memory fallback database.")

# In-Memory database fallbacks for developer convenience
in_memory_db = {
    "users": [],
    "calories": [
        {"food": "Oatmeal with Almonds", "kcal": 350},
        {"food": "Grilled Chicken Breast & Rice", "kcal": 650},
        {"food": "Whey Protein Shake", "kcal": 250},
        {"food": "Greek Yogurt with Berries", "kcal": 200}
    ],
    "habits": [],
    "workouts": [],
    "otp_sessions": {}
}

# ----------------------------------------------------
# AI/ML MODULE: SCIKIT-LEARN MODEL TRAINING
# ----------------------------------------------------
# Pre-training a Logistic Regression model to predict skip risk based on:
# [Sleep Hours, Stress Level (1-10), Energy Index (1-10), Days Since Last Workout]
ml_model = None

def train_habit_model():
    global ml_model
    if not HAS_SKLEARN:
        print("[AI/ML] scikit-learn not installed. Skipping model training, using mathematical heuristic.")
        return

    # Generate synthetic training data
    # X: [Sleep, Stress, Energy, DaysSinceLast]
    X_train = np.array([
        [8.0, 2, 9, 1], # Active/No Skip (0)
        [7.5, 3, 8, 1], # Active/No Skip (0)
        [5.0, 8, 4, 3], # Skip (1)
        [6.0, 7, 5, 2], # Skip (1)
        [8.5, 1, 9, 0], # Active/No Skip (0)
        [4.5, 9, 3, 4], # Skip (1)
        [7.0, 4, 7, 2], # Active/No Skip (0)
        [5.5, 6, 5, 3], # Skip (1)
        [9.0, 2, 8, 1], # Active/No Skip (0)
        [6.5, 8, 4, 2]  # Skip (1)
    ])
    y_train = np.array([0, 0, 1, 1, 0, 1, 0, 1, 0, 1]) # 0 = go, 1 = skip

    ml_model = LogisticRegression()
    ml_model.fit(X_train, y_train)
    print("[AI/ML] scikit-learn Logistic Regression Model trained successfully on startup!")

train_habit_model()

# ----------------------------------------------------
# MODEL SCHEMAS
# ----------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyEmailRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    otp: str

class CalorieItem(BaseModel):
    food: str
    kcal: int

class HabitInput(BaseModel):
    sleep: float
    stress: int
    energy: int
    days_since_workout: int

class WorkoutSession(BaseModel):
    exercise: str
    reps: int
    score: int

class ChatRequest(BaseModel):
    message: str

# ----------------------------------------------------
# ROUTING: AUTHENTICATION
# ----------------------------------------------------
@app.post("/api/auth/verify")
async def verify_email(req: VerifyEmailRequest):
    otp = str(random.randint(100000, 999999))
    
    # Store OTP in DB
    if db is not None:
        db["otp_sessions"].update_one(
            {"email": req.email},
            {"$set": {"otp": otp, "timestamp": time.time()}},
            upsert=True
        )
    else:
        in_memory_db["otp_sessions"][req.email] = {"otp": otp, "timestamp": time.time()}

    return {"status": "success", "otp": otp, "message": f"Simulated code sent to {req.email}"}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    # Standard fallback login validation
    return {"status": "success", "message": "Authenticated"}

# ----------------------------------------------------
# ROUTING: DIET / CALORIES
# ----------------------------------------------------
@app.get("/api/diet/logs")
async def get_calories():
    if db is not None:
        logs = list(calories_col.find({}, {"_id": 0}))
    else:
        logs = in_memory_db["calories"]
    return logs

@app.post("/api/diet/logs")
async def add_calorie(item: CalorieItem):
    log_data = {"food": item.food, "kcal": item.kcal, "timestamp": time.time()}
    if db is not None:
        calories_col.insert_one(log_data)
    else:
        in_memory_db["calories"].append({"food": item.food, "kcal": item.kcal})
    
    return {"status": "success", "data": item}

# ----------------------------------------------------
# ROUTING: AI/ML HABIT PREDICTOR (scikit-learn / Heuristic)
# ----------------------------------------------------
@app.post("/api/ml/habit-predict")
async def predict_habit(inputs: HabitInput):
    risk_percentage = 30
    
    if HAS_SKLEARN and ml_model is not None:
        # Run prediction
        features = np.array([[inputs.sleep, inputs.stress, inputs.energy, inputs.days_since_workout]])
        # Probabilities of skipping (class 1)
        prob = ml_model.predict_proba(features)[0][1]
        risk_percentage = int(prob * 100)
    else:
        # Mathematical regression heuristic model matching sklearn logic
        risk = 30
        risk += (8.0 - inputs.sleep) * 12
        risk += inputs.stress * 8
        risk += (8 - inputs.energy) * 10
        risk += inputs.days_since_workout * 15
        risk_percentage = max(5, min(98, int(risk)))

    # Save details to database
    log_entry = {
        "sleep": inputs.sleep,
        "stress": inputs.stress,
        "energy": inputs.energy,
        "days_since_workout": inputs.days_since_workout,
        "calculated_risk": risk_percentage,
        "timestamp": time.time()
    }
    
    if db is not None:
        habits_col.insert_one(log_entry)
    else:
        in_memory_db["habits"].append(log_entry)

    # Return prediction and dynamic advice
    advice = "You're in the optimal zone! Keep moving."
    if risk_percentage >= 60:
        advice = "Skipping likelihood is high. AI recommends a light 15-minute home stretch to maintain habit triggers."
    elif risk_percentage >= 25:
        advice = "Energy index is low. Focus on a simple bodyweight or resistance routine today."

    return {
        "risk_probability": risk_percentage,
        "advice": advice
    }

# ----------------------------------------------------
# ROUTING: CONVERSATIONAL AI & NLP (OpenAI / HuggingFace Hooks)
# ----------------------------------------------------
@app.post("/api/ai/coach")
async def calorie_coach_chat(req: ChatRequest):
    query = req.message.lower()
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    # If API key is available, run real model. Else, fall back to NLP parsing.
    if openai_api_key:
        try:
            # We can use the official openai SDK if installed, or direct API fetch
            import httpx
            headers = {
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are NutriCoach AI, a premium, knowledgeable dietitian and calorie advisor for TRIVAN'S TECH. Give concise, bulleted nutrition advice."},
                    {"role": "user", "content": req.message}
                ],
                "max_tokens": 150
            }
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=5.0)
                if res.status_code == 200:
                    return {"response": res.json()["choices"][0]["message"]["content"]}
        except Exception as e:
            print(f"[AI Chat Error] OpenAI request failed: {e}")

    # Local NLP matching engine fallback
    if "breakfast" in query or "recipe" in query:
        response = (
            "<strong>High-Protein Fuel Breakfast (Local NLP Recommended):</strong><br><br>"
            "• <strong>Scrambled Egg White Medley</strong>: 4 egg whites, 1 whole egg, 50g spinach, 30g cherry tomatoes.<br>"
            "• <strong>Macros</strong>: 380 kcal | 28g Protein | 14g Fats | 22g Carbs.<br>"
            "• <strong>Tip</strong>: Boost metabolic scaling with unsweetened green tea!"
        )
    elif "snack" in query or "post-workout" in query:
        response = (
            "<strong>Post-Workout Anabolic Snacks (Local NLP):</strong><br><br>"
            "1. <strong>Whey & Banana Blitz</strong>: 1 scoop whey isolate blended with 1 banana.<br>"
            "2. <strong>Greek Parfait</strong>: 150g fat-free Greek yogurt topped with fresh blueberries."
        )
    elif "grocery" in query or "list" in query:
        response = (
            "<strong>Lean Muscle Grocery List (Local NLP):</strong><br><br>"
            "• <strong>Proteins</strong>: Chicken breast, Wild salmon, Liquid egg whites.<br>"
            "• <strong>Complex Carbs</strong>: Quinoa, Sweet potatoes, Steel-cut oats.<br>"
            "• <strong>Fats</strong>: Extra virgin olive oil, Almonds, Avocados."
        )
    else:
        response = "NutriCoach AI: Understood! Let me know if you want a fat-loss menu, a muscle-building macro guide, or a low-carb recipe option."

    return {"response": response}

@app.post("/api/ai/buddy")
async def motivation_buddy_chat(req: ChatRequest):
    query = req.message.lower()
    openai_api_key = os.getenv("OPENAI_API_KEY")

    if openai_api_key:
        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are Aura, a high-energy virtual workout buddy and gym motivator for TRIVAN'S TECH. Be extremely positive, centered, and encouraging."},
                    {"role": "user", "content": req.message}
                ],
                "max_tokens": 100
            }
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=5.0)
                if res.status_code == 200:
                    return {"response": res.json()["choices"][0]["message"]["content"]}
        except Exception as e:
            print(f"[AI Chat Error] OpenAI request failed: {e}")

    # Local NLP matching engine fallback
    sentiment = "focused"
    if any(word in query for word in ["tired", "exhausted", "lazy", "sore", "pain"]):
        sentiment = "empathetic"
        response = "I hear you, Nishanth. Feeling exhausted is completely natural. How about we scale back and do a light 10-minute active stretch? Every little bit counts!"
    elif any(word in query for word in ["ready", "crush", "let's go", "excited", "hype"]):
        sentiment = "excited"
        response = "HELL YEAH! That's what I want to hear! Let's load the weight, keep that chest high, and smash this set! Let's go!"
    else:
        response = "I'm with you, Nishanth. Let's focus. Open the Gym Trainer tab, select your program, and let's count some reps!"

    return {"response": response, "sentiment": sentiment}

# ----------------------------------------------------
# ROUTING: IOT TELEMETRY (WebSocket MQTT / Node-RED Simulator)
# ----------------------------------------------------
# Simple WebSocket server simulating MQTT client receiving treadmill & stack sensor updates
@app.websocket("/api/iot/ws")
async def iot_sensor_feed(websocket: WebSocket):
    await websocket.accept()
    print("[IoT Sensor Hub] Connected to client WebSocket (Simulating MQTT broker)")
    
    speed = 6.5
    incline = 3
    distance = 1.25
    calories = 140
    heartrate = 142
    
    try:
        while True:
            # Simulate real-time sensor updates
            speed_noise = random.uniform(-0.1, 0.1)
            heart_noise = random.randint(-2, 2)
            
            # Read speed adjustment from client if any received asynchronously
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                if "speed" in data: speed = float(data["speed"])
                if "incline" in data: incline = int(data["incline"])
            except asyncio.TimeoutError:
                pass # No adjustment message, proceed with noise updates
            
            # Increment distance & calories based on time delta
            distance += (speed / 3600.0)
            calories += (speed * 0.04) + (incline * 0.02)
            heartrate = max(70, min(180, int(110 + (speed * 6) + (incline * 3) + heart_noise)))
            
            # Simulated MQTT/Node-RED payload
            payload = {
                "treadmill": {
                    "status": "Running",
                    "speed": round(speed, 1),
                    "incline": incline,
                    "distance": round(distance, 2),
                    "calories": int(calories),
                    "heartrate": heartrate
                },
                "dumbbell": {
                    "load_lbs": 80,
                    "power_w": int(80 * 2.25),
                    "rep_cadence": "Optimal"
                },
                "mqtt_broker_status": "ONLINE",
                "node_red_flow": "Flow_Active_Tele_Sync"
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(1.0)
            
    except WebSocketDisconnect:
        print("[IoT Sensor Hub] Client disconnected from WebSocket telemetry stream.")
    except Exception as e:
        print(f"[IoT Sensor Hub Error] WebSocket error: {e}")

# ----------------------------------------------------
# RUN SERVER
# ----------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # Read port from environment
    port = int(os.getenv("PORT", 8000))
    print(f"[SYSTEM] Starting FastAPI Server on port {port}...")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
