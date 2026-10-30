# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.

## 2026-03-31 - Server-Side Document Counting and Projection for Stats Aggregation
**Learning:** Calling `find_documents()` without projections to aggregate counts or sums (e.g. in `/admin/stats`) forces MongoDB to serialize and transfer all full collection documents over the network into Python memory. Using native `col.count_documents(query)` and field projection (`projection={"kcal": 1, "_id": 0}`) executes aggregations directly on the database engine, reducing network overhead and Python deserialization latency from O(N * payload_size) to O(1) or O(log N).
**Action:** Always prefer `count_documents(collection_name, query)` or projections in `backend/database.py` when calculating collection counts or single-field totals.

## 2026-04-01 - Single-Record Query Optimization with find_one_document
**Learning:** Calling `find_documents()` (which wraps `col.find()`) for single-record lookups like user authentication in `get_current_user` instantiates a PyMongo cursor, forces full collection traversal until the cursor finishes, and constructs a Python list of all results in memory. Switching to `find_one_document()` (wrapping `col.find_one()`) limits query execution to 1 result directly on the MongoDB engine, preventing cursor/list allocations and returning immediately upon the first index match.
**Action:** Use `find_one_document()` for single-record lookups (e.g. user authentication or session verification) instead of calling `find_documents()` and taking the first element `[0]`.
