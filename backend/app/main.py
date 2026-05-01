from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from .routers import projects

app = FastAPI(
    title="PS Engagement Tracker API",
    description="API for tracking the health of professional services projects.",
    version="1.0.0",
)

# Define the path to the static files directory
static_files_dir = os.path.join(os.path.dirname(__file__), "..", "static")

#------just for debug
from fastapi import Request
@app.middleware("http")
async def log_raw_body(request: Request, call_next):
    body = await request.body()
    print("RAW BODY:", body)
    return await call_next(request)
#------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api")
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}