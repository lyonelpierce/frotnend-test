"""Pydantic schemas exposed by the API."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .enums import (
    DealStage,
    DocStatus,
    InsightType,
    JobStatus,
    ProductType,
    Severity,
    TaskStatus,
)


def to_camel(string: str) -> str:
    pieces = string.split("_")
    return pieces[0] + "".join(word.capitalize() for word in pieces[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Owner(CamelModel):
    id: str
    name: str


class Deal(CamelModel):
    id: str
    name: str
    borrower_id: str = Field(..., alias="borrowerId")
    owner: Owner
    product: ProductType
    stage: DealStage
    requested_amount: float = Field(..., alias="requestedAmount")
    probability: float
    risk_score: float | None = Field(default=None, alias="riskScore")
    dscr: float | None = None
    ltv: float | None = None
    docs_progress: float | None = Field(default=None, alias="docsProgress")
    flags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class Borrower(CamelModel):
    id: str
    legal_name: str = Field(..., alias="legalName")
    industry: str | None = None
    naics: str | None = None
    address: str | None = None
    existing_relationship: bool = Field(..., alias="existingRelationship")
    deposits: float | None = None


class Financial(CamelModel):
    borrower_id: str = Field(..., alias="borrowerId")
    period: str
    period_end: date = Field(..., alias="periodEnd")
    revenue: float
    ebitda: float
    debt_service: float = Field(..., alias="debtService")


class DocumentRequest(CamelModel):
    id: str
    deal_id: str = Field(..., alias="dealId")
    label: str
    type: str
    required_by: date | None = Field(default=None, alias="requiredBy")
    status: DocStatus
    link: str | None = None
    requested_at: datetime = Field(..., alias="requestedAt")


class Task(CamelModel):
    id: str
    deal_id: str = Field(..., alias="dealId")
    title: str
    assigned_to: str | None = Field(default=None, alias="assignedTo")
    due_at: datetime | None = Field(default=None, alias="dueAt")
    status: TaskStatus


class Suggestion(CamelModel):
    id: str
    deal_id: str = Field(..., alias="dealId")
    severity: Severity
    text: str


class TermSheet(CamelModel):
    id: str
    deal_id: str = Field(..., alias="dealId")
    base_rate: str = Field(..., alias="baseRate")
    margin_bps: int = Field(..., alias="marginBps")
    amort_months: int = Field(..., alias="amortMonths")
    interest_only_months: int = Field(..., alias="interestOnlyMonths")
    origination_fee_bps: int = Field(..., alias="originationFeeBps")
    prepay_penalty: str | None = Field(default=None, alias="prepayPenalty")
    collateral: str | None = None
    covenants: List[str] | None = None
    conditions: List[str] | None = None
    last_edited_at: datetime = Field(..., alias="lastEditedAt")


class ActivityEvent(CamelModel):
    id: str
    type: str
    at: datetime
    deal_id: str = Field(..., alias="dealId")
    payload: Dict[str, Any] = Field(default_factory=dict)


class Job(CamelModel):
    id: str
    type: str
    status: JobStatus
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    result: Dict[str, Any] | None = None
    error: str | None = None


class Pagination(CamelModel):
    items: List[Any]
    next_cursor: str | None = Field(default=None, alias="nextCursor")


class SuggestionsPayload(CamelModel):
    suggestions: List[Suggestion]


class ErrorDetail(CamelModel):
    code: str
    message: str
    details: Dict[str, Any] | None = None


class ErrorEnvelope(CamelModel):
    error: ErrorDetail


class MeResponse(CamelModel):
    id: str
    name: str
    email: str
