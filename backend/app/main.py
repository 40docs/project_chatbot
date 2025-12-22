from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import validate_router, chat_router, providers_router

app = FastAPI(
    title="LLM Portal API",
    description="Backend API for LLM Portal - Multi-provider chat interface",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(validate_router)
app.include_router(chat_router)
app.include_router(providers_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "LLM Portal API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "providers": "/api/providers",
            "validate": "/api/validate/{provider}",
            "chat": "/api/chat",
            "conversations": "/api/conversations"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
