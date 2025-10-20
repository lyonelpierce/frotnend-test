"""FastAPI application factory."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .errors import APIHttpException
from .events import EventBroker
from .jobs import JobManager
from .metrics import Metrics
from .middleware import install_middlewares
from .models import ErrorDetail, ErrorEnvelope
from .routes import deals, events, ops
from .settings import get_settings
from .store import InMemoryStore

logger = logging.getLogger("krida.mock_api")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Krida Deal Desk Mock API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    allow_origins = settings.allowed_origins
    if allow_origins == "*":
        origins = ["*"]
    else:
        origins = allow_origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    # Shared state
    store = InMemoryStore(settings.seed_path)
    events_broker = EventBroker()
    jobs = JobManager(store, events_broker)
    metrics = Metrics()

    app.state.store = store
    app.state.events = events_broker
    app.state.jobs = jobs
    app.state.metrics = metrics

    install_middlewares(app)

    app.include_router(ops.router)
    app.include_router(deals.router)
    app.include_router(events.router)

    register_exception_handlers(app)
    register_lifecycle_events(app)

    return app


def register_exception_handlers(app: FastAPI) -> None:
    settings = get_settings()

    @app.exception_handler(APIHttpException)
    async def api_exception_handler(request: Request, exc: APIHttpException):
        headers = dict(exc.headers or {})
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            headers.setdefault(settings.request_id_header, request_id)
        request.app.state.metrics.incr_errors()
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.envelope.model_dump(by_alias=True),
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):  # pragma: no cover - defensive
        logger.exception("Unhandled error", exc_info=exc)
        request.app.state.metrics.incr_errors()
        headers = {}
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            headers[settings.request_id_header] = request_id
        envelope = ErrorEnvelope(error=ErrorDetail(code="internal", message="Internal server error"))
        return JSONResponse(status_code=500, content=envelope.model_dump(by_alias=True), headers=headers)


def register_lifecycle_events(app: FastAPI) -> None:
    @app.on_event("shutdown")
    async def shutdown_event():
        await app.state.jobs.shutdown()


app = create_app()
