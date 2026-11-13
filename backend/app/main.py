"""
Transit Scope - Scientific Backend Application Entry Point
FastAPI web server providing astrophysics signal processing and machine-learning APIs.
"""

import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.routes.api import router as api_router

# Configure scientific logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("transit_scope")

app = FastAPI(
    title="Transit Scope API",
    description="Astrophysics signal processing and supervised machine-learning system for planetary transit validation.",
    version="1.0.0"
)

# CORS configuration allowing local development and production deployments
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "https://transit-scope.vercel.app",
    "*"  # Open for scientific public exploration
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root_endpoint():
    return {
        "identity": "Transit Scope",
        "tagline": "Teaching a computer to tell a real planet's shadow from an impostor in a star's light.",
        "status": "operational",
        "documentation": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)

