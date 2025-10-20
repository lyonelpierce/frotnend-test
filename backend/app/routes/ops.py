"""Operational endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from ..auth import require_bearer_token
from ..errors import http_error
from ..metrics import Metrics
from ..middleware import LATENCY_PROFILES
from ..settings import get_settings
from ..store import InMemoryStore

router = APIRouter(prefix="/-", tags=["ops"])


@router.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


@router.get("/readyz")
async def readyz(request: Request) -> dict:
    store: InMemoryStore = request.app.state.store
    return {"status": "ready", "deals": store.deal_count()}


@router.get("/metrics")
async def metrics(request: Request) -> Response:
    metrics: Metrics = request.app.state.metrics
    snapshot = metrics.snapshot()
    body = "\n".join(f"{key} {value}" for key, value in snapshot.items()) + "\n"
    return Response(content=body, media_type="text/plain")


@router.post("/reset")
async def reset(
    request: Request,
    profile: str | None = None,
    _: None = Depends(require_bearer_token),
) -> Response:
    store: InMemoryStore = request.app.state.store
    settings = get_settings()
    store.reset(settings.seed_path)
    if profile:
        if profile not in LATENCY_PROFILES:
            raise http_error(422, code="invalid_request", message="Unknown latency profile")
        settings.sim_latency_profile = profile
    return Response(status_code=204)


@router.post("/seed/documents/verify-all")
async def verify_all_documents(
    request: Request,
    dealId: str,
    _: None = Depends(require_bearer_token),
) -> dict:
    store: InMemoryStore = request.app.state.store
    documents = store.documents_for_deal(dealId)
    updated = []
    for document in documents:
        if document.status.value == "received":
            doc = store.update_document(document.id, {"status": "verified"})
            updated.append(doc.id)
    return {"updated": updated}

