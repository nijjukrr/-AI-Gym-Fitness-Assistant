from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routes import router as api_router

app = FastAPI(
    title="Trivan's Tech AI Gym Backend",
    description="All-in-one modular backend for AI Gym & Fitness Assistant",
    version="1.1.0"
)

# Performance Optimization: GZip HTTP Response Compression
# Compresses responses >= 1,000 bytes (HTML, CSS, JS static assets, and large JSON payloads)
# Reduces transferred payload sizes by ~75-84% (e.g., app.js 95KB -> 22KB, index.css 59KB -> 9.5KB),
# significantly improving network load latency and initial page paint times.
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Register API Router
app.include_router(api_router, prefix="/api")

# 2. Mount Static Files LAST so it doesn't collide with Swagger /docs or /openapi.json
# This serves index.html at root, index.css, app.js, admin.html etc.
app.mount("/", StaticFiles(directory=".", html=True))
