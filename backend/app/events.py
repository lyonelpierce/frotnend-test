"""Server-sent event broker."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import AsyncGenerator, Dict, Optional, Set


class EventBroker:
    def __init__(self) -> None:
        self._subscribers: Dict[Optional[str], Set[asyncio.Queue]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def publish(self, deal_id: str | None, event: dict) -> None:
        async with self._lock:
            targets = set(self._subscribers.get(None, set()))
            if deal_id in self._subscribers:
                targets |= self._subscribers[deal_id]
            for queue in targets:
                await queue.put(event)

    async def subscribe(self, deal_id: str | None) -> AsyncGenerator[dict, None]:
        queue: asyncio.Queue[dict] = asyncio.Queue()
        async with self._lock:
            self._subscribers[deal_id].add(queue)
        try:
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield payload
                except asyncio.TimeoutError:
                    yield {"event": "keepalive"}
        finally:
            async with self._lock:
                self._subscribers[deal_id].discard(queue)
                if not self._subscribers[deal_id]:
                    self._subscribers.pop(deal_id, None)

