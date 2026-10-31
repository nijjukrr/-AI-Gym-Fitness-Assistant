# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.

## 2026-03-31 - Server-Side Document Counting and Projection for Stats Aggregation
**Learning:** Calling `find_documents()` without projections to aggregate counts or sums (e.g. in `/admin/stats`) forces MongoDB to serialize and transfer all full collection documents over the network into Python memory. Using native `col.count_documents(query)` and field projection (`projection={"kcal": 1, "_id": 0}`) executes aggregations directly on the database engine, reducing network overhead and Python deserialization latency from O(N * payload_size) to O(1) or O(log N).
**Action:** Always prefer `count_documents(collection_name, query)` or projections in `backend/database.py` when calculating collection counts or single-field totals.

## 2026-04-01 - HTTP Response Compression for Static Web Assets in FastAPI Monoliths
**Learning:** Serving large monolithic frontend assets (`index.css` ~59 KB, `app.js` ~95 KB, `index.html` ~54 KB) through Starlette/FastAPI's `StaticFiles` without HTTP compression sends raw uncompressed text on every client request, ballooning network transfer sizes and inflating mobile Time To Interactive (TTI). Adding `GZipMiddleware` with `minimum_size=1000` compresses assets on-the-fly, reducing wire payload size by ~80% (from ~232 KB down to ~47.6 KB) while automatically bypassing WebSocket connections and small responses.
**Action:** Always include `GZipMiddleware(app, minimum_size=1000)` in full-stack FastAPI applications serving static files or large JSON responses.
