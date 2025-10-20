"""Authentication dependencies."""

from __future__ import annotations

from fastapi import Depends, Header

from .errors import Errors
from .settings import get_settings


async def require_bearer_token(
    authorization: str | None = Header(default=None),
):
    settings = get_settings()
    if not authorization or not authorization.startswith("Bearer "):
        raise Errors.unauthorized()
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.api_token:
        raise Errors.unauthorized()


__all__ = ["require_bearer_token"]
