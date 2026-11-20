"""Database engine and session. Lazily created so the API can boot without a DB."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal = None


def database_configured() -> bool:
    """Saving history is optional: without a database the app still analyses."""
    return bool(settings.DATABASE_URL)


def get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        if not settings.DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not set")
        url = settings.DATABASE_URL
        # SQLite (used for local development and tests) takes no pool sizing.
        kwargs = {"pool_pre_ping": True}
        if not url.startswith("sqlite"):
            kwargs.update(pool_size=5, max_overflow=5)
        else:
            kwargs = {"connect_args": {"check_same_thread": False}}
        _engine = create_engine(url, **kwargs)
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def get_db() -> Iterator[Session]:
    """A database session, or a clear 503 if history is not switched on yet.

    The check belongs here rather than in the endpoints: FastAPI resolves
    dependencies before the endpoint body runs, so a guard inside the body
    never gets the chance to answer.
    """
    if not database_configured():
        from fastapi import HTTPException, status
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "History is not switched on yet (no database configured).",
        )
    get_engine()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def reset_engine() -> None:
    """Drop the cached engine. Only used by tests when they swap databases."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _SessionLocal = None
