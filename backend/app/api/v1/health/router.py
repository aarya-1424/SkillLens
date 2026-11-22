from fastapi import APIRouter

from app.core.config import settings
from app.privacy.service import sign_in_erasure_status

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok", "service": settings.APP_NAME, "env": settings.ENV,
        # Privacy Policy s.6 promises erasure removes the sign-in record too.
        "account_erasure": sign_in_erasure_status(),
    }
