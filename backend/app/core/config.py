import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "University Event Management and Compliance System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://postgres:postgres@localhost:5432/university_event_db"
    )

    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretjwtsecretkey_replace_with_strong_key_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

