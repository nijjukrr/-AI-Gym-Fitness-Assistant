# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.

## 2026-03-31 - Server-Side Document Counting and Projection for Stats Aggregation
**Learning:** Calling `find_documents()` without projections to aggregate counts or sums (e.g. in `/admin/stats`) forces MongoDB to serialize and transfer all full collection documents over the network into Python memory. Using native `col.count_documents(query)` and field projection (`projection={"kcal": 1, "_id": 0}`) executes aggregations directly on the database engine, reducing network overhead and Python deserialization latency from O(N * payload_size) to O(1) or O(log N).
**Action:** Always prefer `count_documents(collection_name, query)` or projections in `backend/database.py` when calculating collection counts or single-field totals.

## 2026-04-01 - Single-Document Lookups using `find_one()` Cursor Optimization
**Learning:** Querying single records (such as user profile or OTP session verification) using `find_documents()` executes `col.find()` cursor iteration and materializes a list in Python memory before indexing `[0]`. Using PyMongo's native `col.find_one()` (`find_one_document`) instructs MongoDB server to evaluate with `LIMIT 1`, terminating the query immediately upon match and avoiding unnecessary cursor allocation.
**Action:** Use `find_one_document(collection_name, query)` whenever only a single matching document is needed for authentication or record retrieval.
