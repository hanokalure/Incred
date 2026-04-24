from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

    origins = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    is_wildcard = "*" in origins
    
    # Explicitly include the new web production domain for safety
    explicit_origins = [
        "https://karnataka-indol.vercel.app",
        "https://karnataka-app.vercel.app",
        "http://localhost:3000",
        "http://localhost:19006"
    ]
    
    # Merge with settings origins
    final_origins = list(set(origins + explicit_origins))
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[] if is_wildcard else final_origins,
        allow_origin_regex=".*" if is_wildcard else None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
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
