"""Background job manager for the mock API."""

from __future__ import annotations

import asyncio
import random
from typing import Any, Dict, List, Set

from .enums import DocStatus, JobStatus, Severity
from .events import EventBroker
from .store import InMemoryStore


class JobManager:
    def __init__(self, store: InMemoryStore, broker: EventBroker) -> None:
        self._store = store
        self._broker = broker
        self._tasks: Set[asyncio.Task] = set()
        self._lock = asyncio.Lock()

    def schedule_doc_verification(self, deal_id: str, document_id: str) -> str:
        job = self._store.create_job("doc.verify")
        task = asyncio.create_task(self._run_doc_verification(job.id, deal_id, document_id))
        self._track(task)
        return job.id

    def schedule_term_optimization(self, deal_id: str) -> str:
        job = self._store.create_job("term.optimize")
        task = asyncio.create_task(self._run_term_optimize(job.id, deal_id))
        self._track(task)
        return job.id

    async def shutdown(self) -> None:
        async with self._lock:
            for task in list(self._tasks):
                task.cancel()
            await asyncio.gather(*self._tasks, return_exceptions=True)
            self._tasks.clear()

    # ------------------------------------------------------------------
    # internal helpers
    # ------------------------------------------------------------------
    def _track(self, task: asyncio.Task) -> None:
        async def _cleanup(finished: asyncio.Task) -> None:
            async with self._lock:
                self._tasks.discard(finished)

        async def _callback(finished: asyncio.Task) -> None:
            await _cleanup(finished)

        self._tasks.add(task)
        task.add_done_callback(lambda finished: asyncio.create_task(_callback(finished)))

    async def _run_doc_verification(self, job_id: str, deal_id: str, document_id: str) -> None:
        try:
            self._store.update_job(job_id, status=JobStatus.running)
            await self._broker.publish(
                deal_id,
                {
                    "event": "document.verification_started",
                    "data": {"dealId": deal_id, "documentId": document_id},
                },
            )
            self._store.append_activity(
                deal_id,
                {
                    "id": f"act_{job_id}_start",
                    "type": "document.verification_started",
                    "at": None,
                    "dealId": deal_id,
                    "payload": {"documentId": document_id},
                },
            )
            await asyncio.sleep(random.uniform(2.0, 6.0))
            success = random.random() < 0.8
            new_status = DocStatus.verified if success else DocStatus.rejected
            document = self._store.update_document(document_id, {"status": new_status.value})
            event_type = "document.verified" if success else "document.rejected"
            await self._broker.publish(
                deal_id,
                {
                    "event": event_type,
                    "data": document.model_dump(by_alias=True),
                },
            )
            self._store.append_activity(
                deal_id,
                {
                    "id": f"act_{job_id}_finish",
                    "type": event_type,
                    "at": None,
                    "dealId": deal_id,
                    "payload": {"documentId": document_id, "status": new_status.value},
                },
            )
            self._store.update_job(
                job_id,
                status=JobStatus.succeeded,
                result={"documentId": document_id, "status": new_status.value},
            )
        except Exception as exc:  # pragma: no cover - defensive
            self._store.update_job(job_id, status=JobStatus.failed, error=str(exc))
            await self._broker.publish(
                deal_id,
                {
                    "event": "job.failed",
                    "data": {"jobId": job_id, "error": str(exc)},
                },
            )

    async def _run_term_optimize(self, job_id: str, deal_id: str) -> None:
        try:
            self._store.update_job(job_id, status=JobStatus.running)
            await self._broker.publish(
                deal_id,
                {
                    "event": "term.optimize_started",
                    "data": {"dealId": deal_id, "jobId": job_id},
                },
            )
            await asyncio.sleep(random.uniform(3.0, 8.0))
            improvements = _suggestion_improvements(deal_id)
            created_ids: List[str] = []
            for suggestion in improvements:
                created = self._store.add_suggestion(deal_id, suggestion)
                created_ids.append(created.id)
            await self._broker.publish(
                deal_id,
                {
                    "event": "term.optimized",
                    "data": {"dealId": deal_id, "suggestionIds": created_ids},
                },
            )
            self._store.append_activity(
                deal_id,
                {
                    "id": f"act_{job_id}_optimized",
                    "type": "term.optimized",
                    "at": None,
                    "dealId": deal_id,
                    "payload": {"suggestionIds": created_ids},
                },
            )
            self._store.update_job(
                job_id,
                status=JobStatus.succeeded,
                result={"dealId": deal_id, "suggestionIds": created_ids},
            )
        except Exception as exc:  # pragma: no cover - defensive
            self._store.update_job(job_id, status=JobStatus.failed, error=str(exc))
            await self._broker.publish(
                deal_id,
                {
                    "event": "job.failed",
                    "data": {"jobId": job_id, "error": str(exc)},
                },
            )


def _suggestion_improvements(deal_id: str) -> List[Dict[str, Any]]:
    templates = [
        {
            "severity": Severity.info.value,
            "text": "Consider trimming amortization by 12 months to improve velocity.",
        },
        {
            "severity": Severity.info.value,
            "text": "Add 0.5% closing fee to offset rate reductions.",
        },
        {
            "severity": Severity.warning.value,
            "text": "Introduce DSCR covenant at 1.15x with quarterly testing.",
        },
        {
            "severity": Severity.critical.value,
            "text": "Re-evaluate collateral appraisal; variance exceeds policy.",
        },
    ]
    random.shuffle(templates)
    selected = templates[:2]
    payload: List[Dict[str, Any]] = []
    for idx, template in enumerate(selected, start=1):
        payload.append(
            {
                "id": f"s_{deal_id}_opt_{idx}",
                "dealId": deal_id,
                "severity": template["severity"],
                "text": template["text"],
            }
        )
    return payload

