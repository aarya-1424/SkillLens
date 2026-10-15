"""Verify Supabase sign-in tokens.

The frontend signs in with Google through Supabase and sends the Supabase
access token as `Authorization: Bearer <token>`. We verify it against the
project's public signing keys (JWKS), so the backend never needs a secret
for this. Projects still on the legacy shared secret can set
SUPABASE_JWT_SECRET instead.
"""
import time
from dataclasses import dataclass

import httpx
from jose import JWTError, jwt

from app.core.config import settings

_JWKS_TTL_SECONDS = 3600
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}


class AuthError(Exception):
    pass


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    name: str | None
    avatar_url: str | None


def _jwks() -> list[dict]:
    now = time.time()
    if _jwks_cache["keys"] is None or now - _jwks_cache["fetched_at"] > _JWKS_TTL_SECONDS:
        url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        resp = httpx.get(url, timeout=5)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json().get("keys", [])
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


def verify_token(token: str) -> CurrentUser:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise AuthError("Malformed token") from exc

    alg = header.get("alg")
    try:
        if alg == "HS256":
            if not settings.SUPABASE_JWT_SECRET:
                raise AuthError("HS256 tokens are not accepted (no shared secret configured)")
            claims = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        else:
            key = next((k for k in _jwks() if k.get("kid") == header.get("kid")), None)
            if key is None:
                raise AuthError("Unknown signing key")
            claims = jwt.decode(token, key, algorithms=[alg], audience="authenticated")
    except JWTError as exc:
        raise AuthError("Invalid or expired token") from exc
    except httpx.HTTPError as exc:
        raise AuthError("Could not fetch signing keys") from exc

    meta = claims.get("user_metadata") or {}
    return CurrentUser(
        id=claims["sub"],
        email=claims.get("email"),
        name=meta.get("full_name") or meta.get("name"),
        avatar_url=meta.get("avatar_url"),
    )
