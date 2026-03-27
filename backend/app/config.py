import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


def get_env(name: str, default: Optional[str] = None) -> str:
    value = os.getenv(name, default)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


class Settings:
    ENV: str = os.getenv("ENV", "development")
    APP_NAME: str = os.getenv("APP_NAME", "Incredible Karnataka")

    SUPABASE_URL: str = get_env("SUPABASE_URL")
    SUPABASE_ANON_KEY: str = get_env("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    AWS_ACCESS_KEY_ID: str = get_env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = get_env("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = get_env("AWS_REGION")
    AWS_S3_BUCKET: str = get_env("AWS_S3_BUCKET")
    AWS_S3_BASE_FOLDER: str = os.getenv("AWS_S3_BASE_FOLDER", "places")

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")


settings = Settings()
