"""Simple in-memory metrics store."""

from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock


@dataclass
class Metrics:
    requests_total: int = 0
    errors_total: int = 0
    lock: Lock = field(default_factory=Lock, repr=False)

    def incr_requests(self) -> None:
        with self.lock:
            self.requests_total += 1

    def incr_errors(self) -> None:
        with self.lock:
            self.errors_total += 1

    def snapshot(self) -> dict[str, int]:
        with self.lock:
            return {
                "requests_total": self.requests_total,
                "errors_total": self.errors_total,
            }
