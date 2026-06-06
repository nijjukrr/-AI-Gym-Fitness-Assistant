import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the modular FastAPI application from the package
from backend.main import app

if __name__ == "__main__":
    # Read port from environment (Render sets this dynamically)
    port = int(os.getenv("PORT", 8000))
    print(f"[SYSTEM] Starting Modular FastAPI Server on port {port}...")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
