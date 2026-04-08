from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, auth, districts, favorites, files, itineraries, places, reviews, stories, uploads


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    origins = []
    for origin in settings.CORS_ORIGINS.split(","):
        normalized = origin.strip().rstrip("/")
        if normalized and normalized not in origins:
            origins.append(normalized)

    allow_origin_regex = settings.CORS_ALLOW_ORIGIN_REGEX.strip() if settings.CORS_ALLOW_ORIGIN_REGEX else None

    # `*` with allow_credentials=True is unreliable for browser-based auth flows.
    # When wildcard access is requested, switch to a regex so the middleware
    # echoes the caller origin instead of returning an unusable wildcard policy.
    if origins == ["*"]:
        origins = []
        allow_origin_regex = allow_origin_regex or ".*"

    if origins or allow_origin_regex:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_origin_regex=allow_origin_regex,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(districts.router, prefix="/districts", tags=["Districts"])
    app.include_router(places.router, prefix="/places", tags=["Places"])
    app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
    app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
    app.include_router(stories.router, tags=["Stories"])
    app.include_router(itineraries.router, tags=["Itineraries"])
    app.include_router(uploads.router, tags=["Uploads"])
    app.include_router(files.router, tags=["Files"])
    app.include_router(admin.router)

    return app


app = create_app()
