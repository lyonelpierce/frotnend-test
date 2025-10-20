"""Utility helpers for the mock API."""

from __future__ import annotations

import base64
import hashlib
import os
import time
import uuid
from datetime import datetime
from typing import Any

from fastapi import Request


def generate_request_id() -> str:
    """Return a unique request identifier."""

    return uuid.uuid4().hex


def ensure_request_id(request: Request, header_name: str) -> str:
    """Fetch or generate a request id and stash it on the request state."""

    request_id = request.headers.get(header_name)
    if not request_id:
        request_id = generate_request_id()
    request.state.request_id = request_id
    return request_id


def stable_cursor(value: str) -> str:
    """Encode a cursor string into an opaque base64 token."""

    token = value.encode("utf-8")
    return base64.urlsafe_b64encode(token).decode("ascii")


def decode_cursor(cursor: str | None) -> str | None:
    if not cursor:
        return None
    try:
        return base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
    except Exception:
        return None


def make_cursor(updated_at: datetime, identifier: str) -> str:
    payload = f"{updated_at.isoformat()}|{identifier}"
    return stable_cursor(payload)


def etag_for_payload(payload: Any) -> str:
    """Create an ETag from a JSON-serialisable payload."""

    digest = hashlib.sha1(repr(payload).encode("utf-8")).hexdigest()
    return f"W/\"{digest}\""

