import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RideKorea API"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgrespassword")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "127.0.0.1")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5435")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "ridekorea")
    
    @property
    def public_db_url_async(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    @property
    def public_db_url_sync(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # JWT Settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkeychangeinproduction1234567890!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # OAuth Settings
    GOOGLE_CLIENT_ID_WEB: str = "849613742035-8qdt58uj7g6frgc2fo40f54upm1husnp.apps.googleusercontent.com"
    GOOGLE_CLIENT_ID_ANDROID: str = "849613742035-j77rn224om2d7idcf41cp30itht8v5k9.apps.googleusercontent.com"
    GOOGLE_CLIENT_ID: str = GOOGLE_CLIENT_ID_WEB
    APPLE_CLIENT_ID: str = os.getenv("APPLE_CLIENT_ID", "")

    
    # Media Upload Settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    class Config:
        case_sensitive = True

settings = Settings()
