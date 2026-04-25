from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from .config import settings
from .routers import admin, auth, districts, favorites, files, itineraries, notifications, places, reviews, stories, uploads


from contextlib import asynccontextmanager
from .database import close_clients

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic can go here
    yield
    # Shutdown logic
    await close_clients()

def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

    # Explicit whitelist for reliability with credentials
    origins = [
        "https://karnataka-indol.vercel.app",
        "https://karnataka-app.vercel.app",
        "http://localhost:3000",
        "http://localhost:19006"
    ]
    
    # Also add origins from settings
    settings_origins = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    final_origins = list(set(origins + settings_origins))
    
    # Remove wildcard if present as it conflicts with credentials
    if "*" in final_origins:
        final_origins.remove("*")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=final_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        origin = request.headers.get("origin")
        headers = {}
        if origin and (origin in final_origins or "*" in settings_origins):
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
            
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_message": str(exc), "traceback": traceback.format_exc()},
            headers=headers
        )

    @app.get("/health")
    async def health_check():
        return {"status": "online", "message": "Server is awake"}

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(districts.router, prefix="/districts", tags=["Districts"])
    app.include_router(places.router, prefix="/places", tags=["Places"])
    app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
    app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
    app.include_router(stories.router, tags=["Stories"])
    app.include_router(itineraries.router, tags=["Itineraries"])
    app.include_router(uploads.router, tags=["Uploads"])
    app.include_router(files.router, tags=["Files"])
    app.include_router(notifications.router)
    app.include_router(admin.router)

    return app


app = create_app()
