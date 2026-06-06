import os
import time
from typing import Any, Dict, List

# Safe imports for AI/ML frameworks
try:
    import pymongo
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

db = None
users_col = None
calories_col = None
habits_col = None
workouts_col = None
otp_sessions_col = None

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    # Use fallback template if not set in env (which points to Atlas with placeholder/updated credentials)
    MONGODB_URI = "mongodb+srv://nishanthkr775_db_user:E2d75sEZPOKL0EPx@cluster0.nxw4ute.mongodb.net/?appName=Cluster0"

# In-Memory database fallbacks for developer convenience
in_memory_db = {
    "users": [],
    "diet_logs": [],
    "habits": [],
    "workouts": [],
    "otp_sessions": {}
}

def connect_db():
    global db, users_col, calories_col, habits_col, workouts_col, otp_sessions_col
    if HAS_PYMONGO:
        try:
            client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
            client.admin.command('ping')
            db = client["trivans_gym_db"]
            users_col = db["users"]
            calories_col = db["calories"]
            habits_col = db["habits"]
            workouts_col = db["workouts"]
            otp_sessions_col = db["otp_sessions"]
            print("[DATABASE] Connected to MongoDB Atlas successfully!")
            return True
        except Exception as e:
            print(f"[DATABASE WARNING] Failed to connect to MongoDB: {e}")
            print("[DATABASE WARNING] Running with in-memory fallback database.")
    else:
        print("[DATABASE WARNING] pymongo not installed. Running with in-memory fallback database.")
    return False

# Attempt connection on import
connect_db()

# DB Helper functions
def get_collection(name: str):
    if db is not None:
        return db[name]
    return None

def insert_document(collection_name: str, document: Dict[str, Any]):
    col = get_collection(collection_name)
    if col is not None:
        try:
            col.insert_one(document)
            return True
        except Exception as e:
            print(f"[DATABASE ERROR] Failed to insert into {collection_name}: {e}")
    
    # In-memory fallback
    if collection_name == "users":
        in_memory_db["users"].append(document)
    elif collection_name == "diet_logs":
        in_memory_db["diet_logs"].append(document)
    elif collection_name == "habits":
        in_memory_db["habits"].append(document)
    elif collection_name == "workouts":
        in_memory_db["workouts"].append(document)
    elif collection_name == "otp_sessions":
        in_memory_db["otp_sessions"][document.get("email")] = document
    return True

def find_documents(collection_name: str, query: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    if query is None:
        query = {}
    col = get_collection(collection_name)
    if col is not None:
        try:
            # Return list of results, excluding ObjectId which causes JSON serialization errors
            results = list(col.find(query))
            for r in results:
                if "_id" in r:
                    r["_id"] = str(r["_id"])
            return results
        except Exception as e:
            print(f"[DATABASE ERROR] Failed to query {collection_name}: {e}")
            
    # In-memory fallback
    if collection_name == "users":
        return in_memory_db["users"]
    elif collection_name == "diet_logs":
        return in_memory_db["diet_logs"]
    elif collection_name == "habits":
        return in_memory_db["habits"]
    elif collection_name == "workouts":
        return in_memory_db["workouts"]
    elif collection_name == "otp_sessions":
        return list(in_memory_db["otp_sessions"].values())
    return []

def update_document(collection_name: str, query: Dict[str, Any], update_data: Dict[str, Any], upsert: bool = False):
    col = get_collection(collection_name)
    if col is not None:
        try:
            col.update_one(query, update_data, upsert=upsert)
            return True
        except Exception as e:
            print(f"[DATABASE ERROR] Failed to update {collection_name}: {e}")
            
    # In-memory fallback
    if collection_name == "otp_sessions" and "email" in query:
        email = query["email"]
        set_data = update_data.get("$set", {})
        if email in in_memory_db["otp_sessions"]:
            in_memory_db["otp_sessions"][email].update(set_data)
        else:
            in_memory_db["otp_sessions"][email] = {**query, **set_data}
        return True
    return False
