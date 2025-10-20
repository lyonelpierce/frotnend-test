"""FastAPI dependency utilities."""

from __future__ import annotations

from fastapi import Request

from .events import EventBroker
from .jobs import JobManager
from .store import InMemoryStore


async def get_store(request: Request) -> InMemoryStore:
    return request.app.state.store


async def get_broker(request: Request) -> EventBroker:
    return request.app.state.events


async def get_job_manager(request: Request) -> JobManager:
    return request.app.state.jobs


