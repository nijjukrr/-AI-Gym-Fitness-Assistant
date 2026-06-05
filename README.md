# 🏋️ TRIVAN'S TECH AI Gym & Fitness Assistant

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![GitHub Stars](https://img.shields.io/github/stars/nijjukrr/-AI-Gym-Fitness-Assistant?style=for-the-badge&color=gold)](https://github.com/nijjukrr/-AI-Gym-Fitness-Assistant)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An all-in-one, premium, high-fidelity AI-driven Fitness Ecosystem that integrates real-time computer vision workout detection, dietician suggestions, smart IoT gym telemetry, behavioral habit analysis, and motivational conversational companion APIs.

---

## 🌟 Key Features & Modules

The platform is organized into **7 core intelligent modules** accessible from a glassmorphism sidebar interface:

1. **🏋️ AI Gym Trainer**:
   - Real-time video pose tracking using **MediaPipe Pose**.
   - Automatic rep counting (Squats & Bicep Curls) and form posture feedback logs.
   - Demo mode fallback when a webcam is not available.

2. **🍎 Calorie Coach**:
   - Chat companion (**NutriCoach AI**) for custom diet recipes, snacks, and meal preps.
   - Built-in BMI calculator with goal classification.
   - Dynamic food logger that tracks daily calorie consumption.

3. **🔌 Smart Gym IoT**:
   - Dashboard representing telemetry from smart weights & connected treadmill (Speed & Incline controls).
   - In-app treadmill belt simulator showing visual speeds.
   - Live peak power, velocity loss, and target load telemetry.

4. **📅 Habit Tracker**:
   - Behavioral AI predictor running a logistic regression model.
   - Real-time skipping risk probability calculations based on sleep hours, stress index, and rest days.
   - Interactive continuity calendar mapping workout progress.

5. **💬 Virtual Gym Buddy**:
   - Sentiment-aware chatbot (**Aura**) designed to keep motivation levels high.
   - Interactive 3D/ambient breathing orb reacting to conversations.
   - Integrated Web Speech synthesis for vocal companion responses.

6. **📊 Pose-to-Performance Analyzer**:
   - Motion efficiency score charts.
   - Interactive range of motion details with custom telemetry plots.

7. **🗺️ Gym Recommender**:
   - Location-aware trainer maps.
   - Ongoing active fitness community challenges.

---

## 🏗️ Technical Stack

- **Frontend**: Standard HTML5 (semantic layout), Vanilla CSS3 (custom glassmorphism, responsive styles, smooth animations), Javascript (ES6, Lucide icons, MediaPipe Pose CDN, canvas renders).
  - **Backend**: Python FastAPI (`server.py`), `pymongo` (MongoDB Atlas logs database Integration), `scikit-learn` (behavioral prediction model), `python-dotenv`, `httpx`.
- **Database**: MongoDB Atlas (tracks workout logs, user telemetry, and consistency history).

### 2. Backend Installation & Start
1. Navigate to the project directory:
   ```bash
   cd "ai gym"
   ```
2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn pymongo python-dotenv scikit-learn httpx
   ```
3. Set up your environment variables:
   - Copy `.env.example` into a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and fill in your actual **MongoDB Atlas connection URI** and **OpenAI API key**:
     ```env
     MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.nxw4ute.mongodb.net/your_db
     OPENAI_API_KEY=your_openai_api_key
     ```
4. Start the backend FastAPI server:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend will start running on `http://localhost:8000`.

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your system:
- Modern web browser (Chrome, Edge, Firefox)
- Python 3.8+ (for running the backend)
- MongoDB Atlas cluster account (or local MongoDB connection)

### 2. Backend Installation & Start
1. Navigate to the project directory:
   ```bash
   cd "ai gym"
   ```
2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn pymongo python-dotenv scikit-learn httpx
   ```
3. Set up your environment variables:
   - Copy `.env.example` into a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and fill in your actual **MongoDB Atlas connection URI**:
     ```env
     MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.nxw4ute.mongodb.net/your_db
     ```
4. Start the backend Flask server:
   ```bash
   python server.py
   ```
   The backend will start running on `http://localhost:8000`.

### 3. Frontend Running
Simply open [index.html](index.html) in your browser, or serve it using any local static web server extension (e.g., Live Server in VS Code, Python SimpleHTTPServer, etc.):
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000`.

---

## ⚡ Deployment to Vercel (Frontend)

To deploy the static frontend portion of this project onto Vercel:

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Login to Vercel:
   ```bash
   vercel login
   ```
3. Deploy the project:
   ```bash
   vercel --prod
   ```
4. Link the repository to Vercel via the Vercel dashboard to set up automatic deployment on every push.

---

## 📝 License
This project is licensed under the MIT License - see the LICENSE details for info.
