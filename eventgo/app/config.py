"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global settings for EventGo, populated from .env file and environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- Application ---
    APP_NAME: str = "EventGo"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    SECRET_KEY: str = "change-me-to-a-random-string-at-least-32-chars"

    # --- Database ---
    # Local dev: set DB_HOST / DB_USER / DB_PASSWORD / DB_NAME individually
    # Cloud (Railway/Render): they inject a full DATABASE_URL connection string
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "eventgo_dev"
    DB_NAME: str = "eventgo"
    DATABASE_URL: str = ""  # Cloud platforms inject this

    # --- JWT ---
    JWT_SECRET: str = "change-me-to-a-random-secret-at-least-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # --- Redis (Celery broker) ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Email (configured in Module 5) ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    @property
    def async_database_url(self) -> str:
        """Build the async connection string.

        When DATABASE_URL is set (cloud deployment), use it directly
        with the async driver. Otherwise build from individual fields.
        """
        if self.DATABASE_URL:
            # Replace the scheme prefix with async driver
            # e.g. mysql://... -> mysql+aiomysql://...
            return self.DATABASE_URL.replace("mysql://", "mysql+aiomysql://", 1)
        return (
            f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def sync_database_url(self) -> str:
        """Build the sync connection string (used by Alembic)."""
        if self.DATABASE_URL:
            return self.DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
