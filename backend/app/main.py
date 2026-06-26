import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from .config import settings
from .database import get_db
from .core.exceptions import register_exception_handlers
from .routers import (
    auth,
    courses,
    spots,
    journeys,
    diaries,
    vouchers,
    admin_vouchers,
    routing,
)

# Create uploads directory if not exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Map domain exceptions (NotFound/PermissionDenied/...) to HTTP responses
register_exception_handlers(app)

# CORS Middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # default ["*"]; restrict via CORS_ORIGINS env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(courses.router, prefix=settings.API_V1_STR)
app.include_router(spots.router, prefix=settings.API_V1_STR)
app.include_router(journeys.router, prefix=settings.API_V1_STR)
app.include_router(diaries.router, prefix=settings.API_V1_STR)
app.include_router(vouchers.router, prefix=settings.API_V1_STR)
app.include_router(admin_vouchers.router, prefix=settings.API_V1_STR)
app.include_router(routing.router, prefix=settings.API_V1_STR)

@app.get("/", include_in_schema=False)
async def redirect_to_swagger():
    """Redirect root access to Swagger documentation."""
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint that verifies DB connectivity."""
    try:
        # Check database connection
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "project": settings.PROJECT_NAME,
            "database": f"error: {str(e)}"
        }

@app.get("/map", response_class=HTMLResponse, tags=["Map"])
async def get_map_page():
    """Serve the map HTML page dynamically from frontend assets."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    map_html_path = os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "assets", "map.html"))

    if not os.path.exists(map_html_path):
        return HTMLResponse(content="<h1>Map HTML file not found</h1>", status_code=404)

    with open(map_html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    return HTMLResponse(content=html_content)
