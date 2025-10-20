"""Deal-centric endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import BaseModel, Field

from ..auth import require_bearer_token
from ..deps import get_broker, get_job_manager, get_store
from ..enums import DocStatus
from ..events import EventBroker
from ..jobs import JobManager
from ..models import TermSheet
from ..store import InMemoryStore

router = APIRouter(tags=["deals"])


class UpdateDealRequest(BaseModel):
    stage: Optional[str] = None
    ownerId: Optional[str] = None
    probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    riskScore: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class CreateDocumentRequest(BaseModel):
    label: str
    type: str
    requiredBy: Optional[str] = None
    link: Optional[str] = None


class RequestDocumentPayload(BaseModel):
    checklistItemId: str


class CreateTaskRequest(BaseModel):
    title: str
    assignedTo: Optional[str] = None
    dueAt: Optional[str] = None
    status: Optional[str] = None


class UpdateDocumentRequest(BaseModel):
    status: Optional[str] = None
    link: Optional[str] = None


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    assignedTo: Optional[str] = None
    dueAt: Optional[str] = None
    status: Optional[str] = None


class TermSheetSuggestionsQuery(BaseModel):
    amount: Optional[float] = None
    rate: Optional[float] = None
    amort: Optional[int] = None
    term: Optional[int] = None


@router.get("/me", dependencies=[Depends(require_bearer_token)])
async def me(store: InMemoryStore = Depends(get_store)) -> dict:
    return store.me().model_dump(by_alias=True)


@router.get("/reference", dependencies=[Depends(require_bearer_token)])
async def reference(store: InMemoryStore = Depends(get_store)) -> dict:
    return store.reference()


@router.get("/deals", dependencies=[Depends(require_bearer_token)])
async def list_deals(
    store: InMemoryStore = Depends(get_store),
    search: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    ownerId: Optional[str] = Query(default=None),
    product: Optional[str] = Query(default=None),
    minAmt: Optional[float] = Query(default=None),
    maxAmt: Optional[float] = Query(default=None),
    sort: str = Query(default="updatedAt"),
    order: str = Query(default="desc"),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
) -> dict:
    deals, next_cursor = store.list_deals(
        search=search,
        stage=stage,
        owner_id=ownerId,
        product=product,
        min_amount=minAmt,
        max_amount=maxAmt,
        sort=sort,
        order=order,
        limit=limit,
        cursor=cursor,
    )
    return {
        "items": [deal.model_dump(by_alias=True) for deal in deals],
        "nextCursor": next_cursor,
    }


@router.get("/deals/{deal_id}", dependencies=[Depends(require_bearer_token)])
async def get_deal(deal_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    deal = store.get_deal(deal_id)
    return deal.model_dump(by_alias=True)


@router.patch("/deals/{deal_id}", dependencies=[Depends(require_bearer_token)])
async def update_deal(
    deal_id: str,
    payload: UpdateDealRequest,
    store: InMemoryStore = Depends(get_store),
) -> dict:
    deal = store.update_deal(deal_id, payload.model_dump(exclude_none=True, by_alias=True))
    return deal.model_dump(by_alias=True)


@router.get("/deals/{deal_id}/borrowers", dependencies=[Depends(require_bearer_token)])
async def deal_borrowers(deal_id: str, store: InMemoryStore = Depends(get_store)) -> list:
    return store.borrowers_for_deal(deal_id)


@router.get("/borrowers/{borrower_id}", dependencies=[Depends(require_bearer_token)])
async def borrower(borrower_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    return store.get_borrower(borrower_id)


@router.get("/borrowers/{borrower_id}/financials", dependencies=[Depends(require_bearer_token)])
async def borrower_financials(
    borrower_id: str,
    store: InMemoryStore = Depends(get_store),
    period: Optional[str] = Query(default=None),
    fromYear: Optional[int] = Query(default=None),
    toYear: Optional[int] = Query(default=None),
) -> list:
    records = store.financials_for_borrower(borrower_id, period=period)
    if fromYear:
        records = [rec for rec in records if int(rec["periodEnd"][:4]) >= fromYear]
    if toYear:
        records = [rec for rec in records if int(rec["periodEnd"][:4]) <= toYear]
    return records


@router.get("/deals/{deal_id}/documents", dependencies=[Depends(require_bearer_token)])
async def deal_documents(deal_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    docs = store.documents_for_deal(deal_id)
    return {"items": [doc.model_dump(by_alias=True) for doc in docs]}


@router.get("/deals/{deal_id}/checklist", dependencies=[Depends(require_bearer_token)])
async def deal_checklist(deal_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    docs = store.documents_for_deal(deal_id)
    return {"items": [doc.model_dump(by_alias=True) for doc in docs]}


@router.post(
    "/deals/{deal_id}/documents",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_bearer_token)],
)
async def create_document(
    deal_id: str,
    payload: CreateDocumentRequest,
    store: InMemoryStore = Depends(get_store),
) -> dict:
    doc = store.create_document(deal_id, payload.model_dump(exclude_none=True))
    return doc.model_dump(by_alias=True)


@router.patch(
    "/documents/{document_id}",
    dependencies=[Depends(require_bearer_token)],
)
async def update_document(
    document_id: str,
    payload: UpdateDocumentRequest,
    store: InMemoryStore = Depends(get_store),
    broker: EventBroker = Depends(get_broker),
    jobs: JobManager = Depends(get_job_manager),
) -> dict:
    updates = payload.model_dump(exclude_none=True)
    doc = store.update_document(document_id, updates)
    verification_job_id: str | None = None
    if updates.get("status") == DocStatus.received.value:
        await broker.publish(
            doc.deal_id,
            {
                "event": "document.received",
                "data": doc.model_dump(by_alias=True),
            },
        )
        store.append_activity(
            doc.deal_id,
            {
                "type": "document.received",
                "payload": {"documentId": doc.id},
            },
        )
        verification_job_id = jobs.schedule_doc_verification(doc.deal_id, doc.id)
    response = doc.model_dump(by_alias=True)
    if verification_job_id:
        response["verificationJobId"] = verification_job_id
    return response


@router.post(
    "/deals/{deal_id}/request-doc",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_bearer_token)],
)
async def request_document(
    deal_id: str,
    payload: RequestDocumentPayload,
    store: InMemoryStore = Depends(get_store),
    broker: EventBroker = Depends(get_broker),
) -> dict:
    doc = store.request_document(deal_id, payload.checklistItemId)
    await broker.publish(
        deal_id,
        {
            "event": "document.requested",
            "data": doc.model_dump(by_alias=True),
        },
    )
    store.append_activity(
        deal_id,
        {
            "type": "document.requested",
            "payload": {"documentId": doc.id},
        },
    )
    return {"status": "Requested", "documentId": doc.id}


@router.get("/deals/{deal_id}/tasks", dependencies=[Depends(require_bearer_token)])
async def deal_tasks(deal_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    tasks = store.tasks_for_deal(deal_id)
    return {"items": [task.model_dump(by_alias=True) for task in tasks]}


@router.post(
    "/deals/{deal_id}/tasks",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_bearer_token)],
)
async def create_task(
    deal_id: str,
    payload: CreateTaskRequest,
    store: InMemoryStore = Depends(get_store),
) -> dict:
    task = store.create_task(deal_id, payload.model_dump(exclude_none=True))
    store.append_activity(
        deal_id,
        {
            "type": "task.created",
            "payload": {"taskId": task.id},
        },
    )
    return task.model_dump(by_alias=True)


@router.patch("/tasks/{task_id}", dependencies=[Depends(require_bearer_token)])
async def update_task(
    task_id: str,
    payload: UpdateTaskRequest,
    store: InMemoryStore = Depends(get_store),
) -> dict:
    task = store.update_task(task_id, payload.model_dump(exclude_unset=True, exclude_none=True))
    store.append_activity(
        task.deal_id,
        {
            "type": "task.updated",
            "payload": {"taskId": task.id, "status": task.status.value},
        },
    )
    return task.model_dump(by_alias=True)


@router.get("/deals/{deal_id}/suggestions", dependencies=[Depends(require_bearer_token)])
async def deal_suggestions(deal_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    suggestions = store.suggestions_for_deal(deal_id)
    return {"suggestions": [s.model_dump(by_alias=True) for s in suggestions]}


@router.get("/deals/{deal_id}/term-sheet", dependencies=[Depends(require_bearer_token)])
async def get_term_sheet(deal_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    term = store.term_sheet_for_deal(deal_id)
    return term.model_dump(by_alias=True)


@router.put("/deals/{deal_id}/term-sheet", dependencies=[Depends(require_bearer_token)])
async def put_term_sheet(
    deal_id: str,
    payload: TermSheet,
    store: InMemoryStore = Depends(get_store),
) -> dict:
    term = store.upsert_term_sheet(deal_id, payload.model_dump(by_alias=True))
    return term.model_dump(by_alias=True)


@router.get("/deals/{deal_id}/term-sheet/suggestions", dependencies=[Depends(require_bearer_token)])
async def term_sheet_suggestions(
    deal_id: str,
    query: TermSheetSuggestionsQuery = Depends(),
    store: InMemoryStore = Depends(get_store),
) -> dict:
    suggestions = store.suggestions_for_deal(deal_id)
    payload = [suggestion.model_dump(by_alias=True) for suggestion in suggestions]
    # Surface user-provided parameters as echo metadata to help candidates debug
    filters = query.model_dump(exclude_none=True)
    if filters:
        for item in payload:
            item.setdefault("inputs", filters)
    return {"suggestions": payload}


@router.post(
    "/deals/{deal_id}/term-sheet/optimize",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_bearer_token)],
)
async def optimize_term_sheet(
    deal_id: str,
    store: InMemoryStore = Depends(get_store),
    jobs: JobManager = Depends(get_job_manager),
) -> dict:
    store.get_deal(deal_id)
    job_id = jobs.schedule_term_optimization(deal_id)
    return {"jobId": job_id}


@router.get("/deals/{deal_id}/activity", dependencies=[Depends(require_bearer_token)])
async def deal_activity(
    deal_id: str,
    store: InMemoryStore = Depends(get_store),
    limit: int = Query(default=50, ge=1, le=200),
) -> list:
    events = store.activity_for_deal(deal_id, limit=limit)
    return [event.model_dump(by_alias=True) for event in events]


@router.get("/jobs/{job_id}", dependencies=[Depends(require_bearer_token)])
async def get_job(job_id: str, store: InMemoryStore = Depends(get_store)) -> dict:
    job = store.get_job(job_id)
    return job.model_dump(by_alias=True)
