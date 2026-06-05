# Installation Guide

## Prerequisites
- Python 3.10+
- MongoDB Atlas account (or use the in‑memory fallback)
- OpenAI API key (optional, for AI chat)

## Setup
```bash
# Clone repository (if applicable) and navigate to project folder
cd "c:/Users/Nishanth.KR/Downloads/ai gym"

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Environment Variables
Create a `.env` file in the project root:
```
MONGODB_URI=<your mongodb connection string>
OPENAI_API_KEY=<your openai key>   # optional, needed for real chatbots
PORT=8000
```

## Run the Server
```bash
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000} --reload
```
Visit `http://localhost:8000` to see the API and `http://localhost:8000/admin.html` for the admin dashboard.
