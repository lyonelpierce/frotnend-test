"""Error response helpers."""

from __future__ import annotations

from fastapi import HTTPException, status

from .models import ErrorDetail, ErrorEnvelope


class APIHttpException(HTTPException):
    """HTTPException subclass that carries the error envelope."""

    def __init__(self, *, envelope: ErrorEnvelope, status_code: int, headers: dict | None = None):
        super().__init__(status_code=status_code, detail=envelope.error.message, headers=headers)
        self.envelope = envelope


def http_error(
    status_code: int,
    *,
    code: str,
    message: str,
    details: dict | None = None,
    headers: dict | None = None,
) -> APIHttpException:
    envelope = ErrorEnvelope(error=ErrorDetail(code=code, message=message, details=details))
    return APIHttpException(envelope=envelope, status_code=status_code, headers=headers)


class Errors:
    @staticmethod
    def unauthorized() -> APIHttpException:
        return http_error(
            status.HTTP_401_UNAUTHORIZED,
            code="unauthorized",
            message="Missing or invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

