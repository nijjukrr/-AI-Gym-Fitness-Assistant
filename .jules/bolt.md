# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.

## 2026-03-31 - Server-Side Document Counting and Projection for Stats Aggregation
**Learning:** Calling `find_documents()` without projections to aggregate counts or sums (e.g. in `/admin/stats`) forces MongoDB to serialize and transfer all full collection documents over the network into Python memory. Using native `col.count_documents(query)` and field projection (`projection={"kcal": 1, "_id": 0}`) executes aggregations directly on the database engine, reducing network overhead and Python deserialization latency from O(N * payload_size) to O(1) or O(log N).
**Action:** Always prefer `count_documents(collection_name, query)` or projections in `backend/database.py` when calculating collection counts or single-field totals.

## 2026-04-01 - Short-Circuit Single-Record Queries with find_document
**Learning:** Calling `find_documents()` to retrieve a single record (e.g., in `get_current_user` dependency or login verification) constructs cursor objects and iterates the entire match set into Python list allocations. Using native `col.find_one()` via `find_document()` applies an implicit `limit: 1` query parameter on MongoDB and short-circuits in-memory searches on the first match, eliminating unnecessary list allocations on every authenticated request.
**Action:** Always use `find_document(collection_name, query)` instead of `find_documents()` when only a single record is expected or needed.
