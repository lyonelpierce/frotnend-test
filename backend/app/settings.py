"""Application settings loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, conlist
from pydantic.functional_validators import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the mock API."""

    port: int = Field(4343, description="Port to bind the HTTP server")
    api_token: str = Field("demo", description="Bearer token expected in Authorization header")
    seed_path: str | None = Field(
        None, description="Optional path to JSON seed data overriding the generated default"
    )
    sim_latency_profile: str = Field(
        "normal", description="Latency profile: fast|normal|slow|chaos"
    )
    sim_error_rate: float = Field(
        0.0, ge=0.0, le=1.0, description="Default random 5xx error rate (0-1 range)"
    )
    cors_origins: conlist(str, min_length=0) | None = Field(
        default=None,
        description="Allowed CORS origins as CSV; defaults to * when empty",
    )
    request_id_header: str = Field(
        "X-Request-Id", description="Header name used to propagate the request identifier"
    )

    @property
    def allowed_origins(self) -> List[str] | str:
        if not self.cors_origins:
            return "*"
        return self.cors_origins

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: str | List[str] | None):
        if value is None or value == "":
            return None
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()


__all__ = ["Settings", "get_settings"]
