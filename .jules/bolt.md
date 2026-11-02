# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.

## 2026-03-31 - Server-Side Document Counting and Projection for Stats Aggregation
**Learning:** Calling `find_documents()` without projections to aggregate counts or sums (e.g. in `/admin/stats`) forces MongoDB to serialize and transfer all full collection documents over the network into Python memory. Using native `col.count_documents(query)` and field projection (`projection={"kcal": 1, "_id": 0}`) executes aggregations directly on the database engine, reducing network overhead and Python deserialization latency from O(N * payload_size) to O(1) or O(log N).
**Action:** Always prefer `count_documents(collection_name, query)` or projections in `backend/database.py` when calculating collection counts or single-field totals.

## 2026-11-02 - Single-Document Lookups vs Full List Scans in Auth Handlers
**Learning:** Querying single unique records (such as user authentication profiles or OTP verification records) with `find_documents(...)` forces cursor iteration and allocation of full Python lists, scanning all matching documents or iterating the whole collection in-memory. Implementing `find_document(...)` backed by native `col.find_one(...)` in PyMongo and early-return short-circuit linear scanning in in-memory fallbacks eliminates intermediate list allocations and stops iteration upon the first matching document.
**Action:** Always use `find_document(collection_name, query, projection)` whenever only a single unique entity (e.g., current user, active OTP session) is required.
