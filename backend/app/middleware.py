"""HTTP middlewares for the mock API."""

from __future__ import annotations

import asyncio
import random
from typing import Callable

from fastapi import FastAPI, Request, Response, status

from .errors import http_error
from .settings import get_settings
from .utils import ensure_request_id

LatencyFn = Callable[[], float]

LATENCY_PROFILES: dict[str, tuple[float, float, float]] = {
    "fast": (0.03, 0.12, 0.15),
    "normal": (0.12, 0.4, 0.6),
    "slow": (0.4, 1.2, 1.8),
    "chaos": (0.05, 2.5, 2.5),
}

ERROR_OVERRIDES = {
    "p5": 0.05,
    "p10": 0.10,
    "p20": 0.20,
    "none": 0.0,
}


def _sample_latency(profile: str) -> float:
    minimum, typical, p95 = LATENCY_PROFILES.get(profile, LATENCY_PROFILES["normal"])
    if profile == "chaos":
        # Wider random distribution, allow spikes up to p95 (already maximum)
        return random.uniform(minimum, p95)
    if random.random() < 0.95:
        return random.uniform(minimum, typical)
    return random.uniform(typical, p95)


def install_middlewares(app: FastAPI) -> None:
    settings = get_settings()

    @app.middleware("http")
    async def request_lifecycle(request: Request, call_next):
        metrics = request.app.state.metrics
        metrics.incr_requests()

        request_id = ensure_request_id(request, settings.request_id_header)
        profile = _resolve_latency_profile(request, settings.sim_latency_profile)
        delay = _sample_latency(profile)
        if delay > 0:
            await asyncio.sleep(delay)

        error_decision = _resolve_error_decision(request, profile, settings.sim_error_rate)
        if error_decision:
            metrics.incr_errors()
            raise http_error(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                code="internal",
                message="Simulated failure",
            )

        response = await call_next(request)
        response.headers.setdefault(settings.request_id_header, request_id)
        response.headers.setdefault("Cache-Control", "no-store")
        return response


def _resolve_latency_profile(request: Request, default_profile: str) -> str:
    override = request.query_params.get("_sim_latency") or request.headers.get("X-Sim-Latency")
    if override and override in LATENCY_PROFILES:
        return override
    if default_profile in LATENCY_PROFILES:
        return default_profile
    return "normal"


def _resolve_error_decision(request: Request, profile: str, default_rate: float) -> bool:
    override = request.query_params.get("_sim_error") or request.headers.get("X-Sim-Error")
    if override == "next":
        return True
    if override in ERROR_OVERRIDES:
        rate = ERROR_OVERRIDES[override]
    else:
        rate = default_rate
    if profile == "chaos":
        rate = min(1.0, rate + 0.05)
    return random.random() < rate

