# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.
