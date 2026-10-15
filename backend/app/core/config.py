"""App settings, read from environment variables (or backend/.env locally)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENV: str = "development"
    APP_NAME: str = "SkillLens API"
    API_PREFIX: str = "/api/v1"

    # Comma-separated list of allowed browser origins.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Regex for preview deployments (e.g. every Vercel preview URL).
    CORS_ORIGIN_REGEX: str | None = r"https://.*\.vercel\.app"

    # Supabase — used to verify sign-in tokens.
    SUPABASE_URL: str = "https://jujiyzbnqezajuapwjbv.supabase.co"
    # Only needed if the project still signs tokens with the legacy shared secret.
    SUPABASE_JWT_SECRET: str | None = None

    # Postgres connection (Supabase). Must start with postgresql+psycopg://
    DATABASE_URL: str | None = None

    SENTRY_DSN: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
