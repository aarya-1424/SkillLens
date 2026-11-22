"""SkillLens API entry point.  Run locally:  uvicorn app.main:app --reload"""
import asyncio
import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, environment=settings.ENV, traces_sample_rate=0.1)

log = logging.getLogger(__name__)
ERASE_EVERY_SECONDS = 6 * 3600


def erase_due_once() -> int:
    """Carry out deletions whose 30-day window has closed (Privacy Policy s.6)."""
    from app.db import session as dbs
    from app.privacy.service import erase_due
    if not dbs.database_configured():
        return 0
    try:
        dbs.get_engine()
        with dbs._SessionLocal() as db:
            return erase_due(db)
    except Exception:  # never stop the API over this; it retries on the next run
        log.exception("Scheduled account erasure failed; will retry")
        return 0


async def _erase_loop() -> None:
    while True:
        await asyncio.to_thread(erase_due_once)
        await asyncio.sleep(ERASE_EVERY_SECONDS)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # The free server sleeps when idle and starts again on the next visit,
    # so this also runs every time it wakes up.
    task = asyncio.create_task(_erase_loop())
    yield
    task.cancel()


app = FastAPI(title=settings.APP_NAME, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": settings.APP_NAME, "docs": "/docs"}
