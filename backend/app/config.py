import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "RideKorea API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database Settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgrespassword")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "127.0.0.1")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5435")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "ridekorea")
    # Echo generated SQL (handy in dev, noisy in prod). Override with SQL_ECHO=false.
    SQL_ECHO: bool = os.getenv("SQL_ECHO", "true").lower() == "true"

    @property
    def public_db_url_async(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def public_db_url_sync(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT Settings (override JWT_SECRET via environment in production!)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkeychangeinproduction1234567890!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # OAuth Settings
    # Google client IDs are public identifiers (not secrets); kept as env-overridable
    # defaults so existing real-login wiring keeps working out of the box.
    GOOGLE_CLIENT_ID_WEB: str = os.getenv(
        "GOOGLE_CLIENT_ID_WEB",
        "849613742035-8qdt58uj7g6frgc2fo40f54upm1husnp.apps.googleusercontent.com",
    )
    GOOGLE_CLIENT_ID_ANDROID: str = os.getenv(
        "GOOGLE_CLIENT_ID_ANDROID",
        "849613742035-j77rn224om2d7idcf41cp30itht8v5k9.apps.googleusercontent.com",
    )
    GOOGLE_CLIENT_ID_IOS: str = os.getenv(
        "GOOGLE_CLIENT_ID_IOS",
        "849613742035-8g5bhkqg3f0k6cb10e0tr4r4egg3seao.apps.googleusercontent.com",
    )
    GOOGLE_CLIENT_ID: str = GOOGLE_CLIENT_ID_WEB
    APPLE_CLIENT_ID: str = os.getenv("APPLE_CLIENT_ID", "")

    # Media Upload Settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_IMAGE_UPLOAD_BYTES: int = int(os.getenv("MAX_IMAGE_UPLOAD_BYTES", str(10 * 1024 * 1024)))
    # Storage backend selector: "local" today; "s3" (MinIO/S3) planned.
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")

    # OSM-based bicycle routing engine (self-hosted GraphHopper/OSRM/BRouter).
    # Empty base URL => routing falls back gracefully (no engine wired yet).
    OSM_ROUTING_BASE_URL: str = os.getenv("OSM_ROUTING_BASE_URL", "")
    OSM_ROUTING_ENGINE: str = os.getenv("OSM_ROUTING_ENGINE", "graphhopper")
    OSM_ROUTING_BIKE_PROFILE: str = os.getenv("OSM_ROUTING_BIKE_PROFILE", "bike")

    # Admin allowlist (comma-separated emails). Empty => MVP mode: any
    # authenticated user passes the admin gate. Set to lock the admin panel.
    ADMIN_EMAILS_RAW: str = os.getenv("ADMIN_EMAILS", "")

    @property
    def ADMIN_EMAILS(self) -> frozenset[str]:
        return frozenset(e.strip() for e in self.ADMIN_EMAILS_RAW.split(",") if e.strip())

    # CORS allowed origins (comma-separated, or "*" for all). Defaults to "*"
    # to preserve current mobile-dev behavior; restrict for production.
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "*")

    @property
    def cors_origins(self) -> list[str]:
        raw = self.CORS_ORIGINS_RAW.strip()
        if raw == "*" or not raw:
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()
