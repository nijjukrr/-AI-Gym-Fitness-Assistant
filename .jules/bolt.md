# Bolt's Journal - Critical Learnings

## 2026-03-30 - Database Connection Pooling and Indexing in FastAPI Architecture
**Learning:** Instantiating new MongoClient connection pools inside frequent endpoints like `/health` creates unnecessary socket, thread, and TLS overhead on every probe. Additionally, MongoDB query collections (`users`, `workouts`, `diet_logs`, `habits`) need explicit indexes created on startup to avoid O(N) collection scans during authentication and log retrieval.
**Action:** Always reuse global MongoClient instances from `backend/database.py` across request handlers, and ensure indexes are created in `connect_db()` upon connection initialization.

## 2026-03-31 - Server-Side Document Counting and Projection for Stats Aggregation
**Learning:** Calling `find_documents()` without projections to aggregate counts or sums (e.g. in `/admin/stats`) forces MongoDB to serialize and transfer all full collection documents over the network into Python memory. Using native `col.count_documents(query)` and field projection (`projection={"kcal": 1, "_id": 0}`) executes aggregations directly on the database engine, reducing network overhead and Python deserialization latency from O(N * payload_size) to O(1) or O(log N).
**Action:** Always prefer `count_documents(collection_name, query)` or projections in `backend/database.py` when calculating collection counts or single-field totals.

## 2026-04-01 - HTTP Response Compression Overhead Thresholds with Starlette StaticFiles
**Learning:** Serving large frontend assets (`app.js` at 95KB, `index.css` at 59KB, `index.html` at 54KB) directly through FastAPI/Starlette without response compression transfers over 230KB of uncompressed text on initial app loads. Applying `GZipMiddleware` with `minimum_size=1000` compresses assets by ~75-84% (down to ~47KB total), while avoiding CPU compression overhead on tiny responses like `/health` pings. In automated tests, note that `httpx`/`TestClient` automatically decompresses `res.content`, so wire compression must be inspected via `res.headers["content-encoding"]` and `res.num_bytes_downloaded`.
**Action:** Always set `minimum_size=1000` on `GZipMiddleware` to balance CPU overhead and wire bandwidth, and verify wire transfer bytes using `res.num_bytes_downloaded`.
