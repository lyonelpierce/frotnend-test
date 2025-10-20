"""In-memory data store for the mock API."""

from __future__ import annotations

from datetime import datetime
from threading import RLock
from typing import Any, Dict, Iterable, List, Optional, Tuple

from .enums import DealStage, DocStatus, JobStatus, ProductType, TaskStatus
from .errors import http_error
from .models import (
    ActivityEvent,
    Deal,
    DocumentRequest,
    Job,
    MeResponse,
    Pagination,
    Suggestion,
    Task,
    TermSheet,
)
from .seed_data import load_seed
from .utils import decode_cursor, stable_cursor


class InMemoryStore:
    def __init__(self, seed_path: str | None = None):
        self._lock = RLock()
        self._state: Dict[str, Any] = {}
        self.reset(seed_path)

    # ------------------------------------------------------------------
    # core state helpers
    # ------------------------------------------------------------------
    def reset(self, seed_path: str | None = None) -> None:
        data = load_seed(seed_path)
        with self._lock:
            self._owners = {owner["id"]: owner for owner in data["owners"]}
            self._user = data.get("user", {"id": "u_demo", "name": "Demo User", "email": "demo@example.com"})
            self._borrowers = {borrower["id"]: borrower for borrower in data["borrowers"]}
            self._deals = {}
            for deal in data["deals"]:
                self._deals[deal["id"]] = self._coerce_dates(deal)
            self._financials_by_borrower = {}
            for record in data.get("financials", []):
                record = record.copy()
                self._financials_by_borrower.setdefault(record["borrowerId"], []).append(record)
            self._documents_by_id = {}
            self._documents_by_deal = {}
            for doc in data.get("documents", []):
                coerced = self._coerce_dates(doc)
                self._documents_by_id[coerced["id"]] = coerced
                self._documents_by_deal.setdefault(coerced["dealId"], []).append(coerced["id"])
            self._tasks_by_id = {}
            self._tasks_by_deal = {}
            for task in data.get("tasks", []):
                coerced = self._coerce_dates(task)
                self._tasks_by_id[coerced["id"]] = coerced
                self._tasks_by_deal.setdefault(coerced["dealId"], []).append(coerced["id"])
            self._suggestions_by_deal = {}
            for suggestion in data.get("suggestions", []):
                self._suggestions_by_deal.setdefault(suggestion["dealId"], []).append(suggestion)
            self._term_sheets = {}
            for term in data.get("termSheets", []):
                self._term_sheets[term["dealId"]] = self._coerce_dates(term)
            self._activity_by_deal: Dict[str, List[dict]] = {}
            for event in data.get("activity", []):
                coerced = self._coerce_dates(event)
                self._activity_by_deal.setdefault(coerced["dealId"], []).append(coerced)
            for events in self._activity_by_deal.values():
                events.sort(key=lambda item: item["at"], reverse=True)
            self._jobs: Dict[str, dict] = {}
            self._recompute_docs_progress_for_all()

    def deal_count(self) -> int:
        with self._lock:
            return len(self._deals)

    # ------------------------------------------------------------------
    # public getters
    # ------------------------------------------------------------------
    def me(self) -> MeResponse:
        with self._lock:
            return MeResponse.model_validate(self._user)

    def reference(self) -> dict:
        with self._lock:
            return {
                "stages": [stage.value for stage in DealStage],
                "products": [product.value for product in ProductType],
                "owners": list(self._owners.values()),
            }

    def list_deals(
        self,
        *,
        search: str | None = None,
        stage: str | None = None,
        owner_id: str | None = None,
        product: str | None = None,
        min_amount: float | None = None,
        max_amount: float | None = None,
        sort: str = "updatedAt",
        order: str = "desc",
        limit: int = 20,
        cursor: str | None = None,
    ) -> Tuple[List[Deal], str | None]:
        with self._lock:
            records = list(self._deals.values())
            if search:
                lowered = search.lower()
                borrower_lookup = self._borrowers
                records = [
                    rec
                    for rec in records
                    if lowered in borrower_lookup.get(rec["borrowerId"], {}).get("legalName", "").lower()
                ]
            if stage:
                records = [rec for rec in records if rec["stage"] == stage]
            if owner_id:
                records = [rec for rec in records if rec["owner"]["id"] == owner_id]
            if product:
                records = [rec for rec in records if rec["product"] == product]
            if min_amount is not None:
                records = [rec for rec in records if rec["requestedAmount"] >= min_amount]
            if max_amount is not None:
                records = [rec for rec in records if rec["requestedAmount"] <= max_amount]

            key = _deal_sort_key(sort)
            reverse = order.lower() == "desc"
            records.sort(key=key, reverse=reverse)

            start_index = 0
            marker_key = None
            if cursor:
                decoded = decode_cursor(cursor)
                if decoded:
                    try:
                        marker_value, marker_id = decoded.split("|", 1)
                        marker_key = _deal_sort_tuple(sort, marker_value, marker_id)
                    except ValueError:
                        marker_key = None
            if marker_key is not None:
                trimmed: List[dict] = []
                for rec in records:
                    if _compare_sort_tuple(key(rec), marker_key, reverse):
                        trimmed.append(rec)
                records = trimmed

            page = records[: limit if limit > 0 else len(records)]
            next_cursor = None
            if limit > 0 and len(records) > limit:
                tail = page[-1]
                cursor_value = _cursor_value(sort, tail)
                next_cursor = stable_cursor(f"{cursor_value}|{tail['id']}")
            models = [Deal.model_validate(rec) for rec in page]
            return models, next_cursor

    def get_deal(self, deal_id: str) -> Deal:
        with self._lock:
            deal = self._deals.get(deal_id)
            if not deal:
                raise http_error(404, code="not_found", message="Deal not found")
            return Deal.model_validate(deal)

    def update_deal(self, deal_id: str, payload: dict) -> Deal:
        with self._lock:
            if deal_id not in self._deals:
                raise http_error(404, code="not_found", message="Deal not found")
            deal = self._deals[deal_id]
            if stage := payload.get("stage"):
                if stage not in [stage.value for stage in DealStage]:
                    raise http_error(422, code="invalid_request", message="Unknown stage")
                deal["stage"] = stage
            if owner_id := payload.get("ownerId"):
                owner = self._owners.get(owner_id)
                if not owner:
                    raise http_error(422, code="invalid_request", message="Unknown owner")
                deal["owner"] = owner
            if "probability" in payload:
                prob = payload["probability"]
                if not (0 <= prob <= 1):
                    raise http_error(422, code="invalid_request", message="Probability must be between 0 and 1")
                deal["probability"] = prob
            if "riskScore" in payload:
                risk = payload["riskScore"]
                if not (0 <= risk <= 1):
                    raise http_error(422, code="invalid_request", message="Risk score must be between 0 and 1")
                deal["riskScore"] = risk
            self._touch_deal(deal_id)
            return Deal.model_validate(deal)

    def borrowers_for_deal(self, deal_id: str) -> List[dict]:
        with self._lock:
            deal = self._deals.get(deal_id)
            if not deal:
                raise http_error(404, code="not_found", message="Deal not found")
            borrower_id = deal["borrowerId"]
            borrower = self._borrowers.get(borrower_id)
            return [borrower] if borrower else []

    def get_borrower(self, borrower_id: str) -> dict:
        with self._lock:
            borrower = self._borrowers.get(borrower_id)
            if not borrower:
                raise http_error(404, code="not_found", message="Borrower not found")
            return borrower

    def financials_for_borrower(self, borrower_id: str, *, period: str | None = None) -> List[dict]:
        with self._lock:
            records = list(self._financials_by_borrower.get(borrower_id, []))
            if period:
                records = [rec for rec in records if rec["period"] == period]
            return records

    def documents_for_deal(self, deal_id: str) -> List[DocumentRequest]:
        with self._lock:
            doc_ids = self._documents_by_deal.get(deal_id, [])
            docs = [self._documents_by_id[doc_id] for doc_id in doc_ids]
            docs.sort(key=lambda item: item["requestedAt"], reverse=True)
            return [DocumentRequest.model_validate(doc) for doc in docs]

    def create_document(self, deal_id: str, payload: dict) -> DocumentRequest:
        with self._lock:
            if deal_id not in self._deals:
                raise http_error(404, code="not_found", message="Deal not found")
            doc_id = payload.get("id") or self._generate_id("dc")
            required_fields = {"label", "type"}
            if not required_fields.issubset(payload):
                raise http_error(422, code="invalid_request", message="Missing fields", details={"required": list(required_fields)})
            doc = {
                "id": doc_id,
                "dealId": deal_id,
                "label": payload["label"],
                "type": payload["type"],
                "requiredBy": payload.get("requiredBy"),
                "status": DocStatus.pending.value,
                "link": payload.get("link"),
                "requestedAt": datetime.utcnow(),
            }
            self._documents_by_id[doc_id] = doc
            self._documents_by_deal.setdefault(deal_id, []).append(doc_id)
            self._touch_deal(deal_id)
            self._recompute_docs_progress(deal_id)
            return DocumentRequest.model_validate(doc)

    def update_document(self, document_id: str, payload: dict) -> DocumentRequest:
        with self._lock:
            doc = self._documents_by_id.get(document_id)
            if not doc:
                raise http_error(404, code="not_found", message="Document not found")
            if status_value := payload.get("status"):
                if status_value not in [status.value for status in DocStatus]:
                    raise http_error(422, code="invalid_request", message="Invalid status")
                doc["status"] = status_value
            if "link" in payload:
                doc["link"] = payload["link"]
            self._touch_deal(doc["dealId"])
            self._recompute_docs_progress(doc["dealId"])
            return DocumentRequest.model_validate(doc)

    def request_document(self, deal_id: str, checklist_item_id: str) -> DocumentRequest:
        with self._lock:
            if checklist_item_id not in self._documents_by_id:
                raise http_error(404, code="not_found", message="Document not found")
            doc = self._documents_by_id[checklist_item_id]
            if doc["dealId"] != deal_id:
                raise http_error(404, code="not_found", message="Document not attached to deal")
            doc["status"] = DocStatus.requested.value
            self._touch_deal(deal_id)
            self._recompute_docs_progress(deal_id)
            return DocumentRequest.model_validate(doc)

    def tasks_for_deal(self, deal_id: str) -> List[Task]:
        with self._lock:
            ids = self._tasks_by_deal.get(deal_id, [])
            tasks = [self._tasks_by_id[task_id] for task_id in ids]
            tasks.sort(key=lambda task: task["dueAt"] or datetime.max)
            return [Task.model_validate(task) for task in tasks]

    def create_task(self, deal_id: str, payload: dict) -> Task:
        with self._lock:
            if deal_id not in self._deals:
                raise http_error(404, code="not_found", message="Deal not found")
            if "title" not in payload:
                raise http_error(422, code="invalid_request", message="title is required")
            task_id = self._generate_id("task")
            task = {
                "id": task_id,
                "dealId": deal_id,
                "title": payload["title"],
                "assignedTo": payload.get("assignedTo"),
                "dueAt": payload.get("dueAt"),
                "status": payload.get("status", TaskStatus.todo.value),
            }
            self._tasks_by_id[task_id] = task
            self._tasks_by_deal.setdefault(deal_id, []).append(task_id)
            self._touch_deal(deal_id)
            return Task.model_validate(task)

    def update_task(self, task_id: str, payload: dict) -> Task:
        with self._lock:
            task = self._tasks_by_id.get(task_id)
            if not task:
                raise http_error(404, code="not_found", message="Task not found")
            if status_value := payload.get("status"):
                if status_value not in [status.value for status in TaskStatus]:
                    raise http_error(422, code="invalid_request", message="Invalid status")
                task["status"] = status_value
            if "title" in payload:
                task["title"] = payload["title"]
            if "assignedTo" in payload:
                task["assignedTo"] = payload["assignedTo"]
            if "dueAt" in payload:
                task["dueAt"] = payload["dueAt"]
            self._touch_deal(task["dealId"])
            return Task.model_validate(task)

    def suggestions_for_deal(self, deal_id: str) -> List[Suggestion]:
        with self._lock:
            suggestions = self._suggestions_by_deal.get(deal_id, [])
            return [Suggestion.model_validate(item) for item in suggestions]

    def add_suggestion(self, deal_id: str, suggestion: dict) -> Suggestion:
        with self._lock:
            suggestion = suggestion.copy()
            suggestion.setdefault("id", self._generate_id("sug"))
            suggestion.setdefault("dealId", deal_id)
            self._suggestions_by_deal.setdefault(deal_id, []).append(suggestion)
            self._touch_deal(deal_id)
            return Suggestion.model_validate(suggestion)

    def term_sheet_for_deal(self, deal_id: str) -> TermSheet:
        with self._lock:
            term = self._term_sheets.get(deal_id)
            if not term:
                raise http_error(404, code="not_found", message="Term sheet not found")
            return TermSheet.model_validate(term)

    def upsert_term_sheet(self, deal_id: str, payload: dict) -> TermSheet:
        with self._lock:
            payload = payload.copy()
            payload["dealId"] = deal_id
            if "lastEditedAt" not in payload:
                payload["lastEditedAt"] = datetime.utcnow()
            coerced = self._coerce_dates(payload)
            self._term_sheets[deal_id] = coerced
            self._touch_deal(deal_id)
            return TermSheet.model_validate(coerced)

    def activity_for_deal(self, deal_id: str, limit: int = 50) -> List[ActivityEvent]:
        with self._lock:
            events = list(self._activity_by_deal.get(deal_id, []))
            events.sort(key=lambda event: event["at"], reverse=True)
            limited = events[: limit if limit > 0 else len(events)]
            return [ActivityEvent.model_validate(item) for item in limited]

    def append_activity(self, deal_id: str, event: dict) -> ActivityEvent:
        with self._lock:
            event = event.copy()
            event.setdefault("id", self._generate_id("act"))
            if not event.get("at"):
                event["at"] = datetime.utcnow()
            event.setdefault("dealId", deal_id)
            event = self._coerce_dates(event)
            self._activity_by_deal.setdefault(deal_id, []).append(event)
            self._activity_by_deal[deal_id].sort(key=lambda e: e["at"], reverse=True)
            self._touch_deal(deal_id)
            return ActivityEvent.model_validate(event)

    def create_job(self, job_type: str, *, result: dict | None = None, error: str | None = None) -> Job:
        with self._lock:
            job_id = self._generate_id("job")
            now = datetime.utcnow()
            record = {
                "id": job_id,
                "type": job_type,
                "status": JobStatus.queued.value,
                "createdAt": now,
                "updatedAt": now,
                "result": result,
                "error": error,
            }
            self._jobs[job_id] = record
            return Job.model_validate(record)

    def update_job(self, job_id: str, *, status: JobStatus, result: dict | None = None, error: str | None = None) -> Job:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise http_error(404, code="not_found", message="Job not found")
            job["status"] = status.value
            job["updatedAt"] = datetime.utcnow()
            if result is not None:
                job["result"] = result
            if error is not None:
                job["error"] = error
            return Job.model_validate(job)

    def get_job(self, job_id: str) -> Job:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise http_error(404, code="not_found", message="Job not found")
            return Job.model_validate(job)

    # ------------------------------------------------------------------
    # internal helpers
    # ------------------------------------------------------------------
    def _touch_deal(self, deal_id: str) -> None:
        deal = self._deals.get(deal_id)
        if deal:
            deal["updatedAt"] = datetime.utcnow()

    def _coerce_dates(self, obj: dict) -> dict:
        coerced = obj.copy()
        for key, value in list(coerced.items()):
            if key.endswith("At") and isinstance(value, str):
                coerced[key] = datetime.fromisoformat(value)
            elif key == "at" and isinstance(value, str):
                coerced[key] = datetime.fromisoformat(value)
        return coerced

    def _generate_id(self, prefix: str) -> str:
        return f"{prefix}_{datetime.utcnow().timestamp():.6f}".replace(".", "")

    def _recompute_docs_progress_for_all(self) -> None:
        for deal_id in self._deals:
            self._recompute_docs_progress(deal_id)

    def _recompute_docs_progress(self, deal_id: str) -> None:
        doc_ids = self._documents_by_deal.get(deal_id, [])
        if not doc_ids:
            progress = 0.0
        else:
            completed = 0
            for doc_id in doc_ids:
                status_value = self._documents_by_id[doc_id]["status"]
                if status_value in {DocStatus.received.value, DocStatus.verified.value, DocStatus.waived.value}:
                    completed += 1
            progress = completed / len(doc_ids)
        self._deals[deal_id]["docsProgress"] = round(progress, 2)


def _deal_sort_key(field: str):
    if field == "requestedAmount":
        return lambda record: (record["requestedAmount"], record["id"])
    return lambda record: (record["updatedAt"], record["id"])


def _deal_sort_tuple(field: str, value: str, identifier: str):
    if field == "requestedAmount":
        return (float(value), identifier)
    return (datetime.fromisoformat(value), identifier)


def _compare_sort_tuple(current: Tuple[Any, Any], marker: Tuple[Any, Any], reverse: bool) -> bool:
    if reverse:
        return current < marker
    return current > marker


def _cursor_value(field: str, record: dict) -> str:
    if field == "requestedAmount":
        return str(record["requestedAmount"])
    value = record["updatedAt"]
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)
