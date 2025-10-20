"""SSE endpoints."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from ..auth import require_bearer_token
from ..deps import get_broker
from ..events import EventBroker

router = APIRouter(tags=["events"])


@router.get("/events/stream", dependencies=[Depends(require_bearer_token)])
async def events_stream(
    dealId: str | None = None,
    broker: EventBroker = Depends(get_broker),
):
    async def event_generator():
        async for payload in broker.subscribe(dealId):
            event_type = payload.get("event", "message")
            data = payload.get("data")
            lines = [f"event: {event_type}"]
            if data is not None:
                lines.append(f"data: {json.dumps(data)}")
            yield "\n".join(lines) + "\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

