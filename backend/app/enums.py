"""Domain enumerations."""

from __future__ import annotations

from enum import Enum


class DealStage(str, Enum):
    prospect = "Prospect"
    application = "Application"
    underwriting = "Underwriting"
    credit_memo = "CreditMemo"
    docs = "Docs"
    approved = "Approved"
    closed = "Closed"
    declined = "Declined"


class ProductType(str, Enum):
    term_loan = "TermLoan"
    line_of_credit = "LineOfCredit"
    sba7a = "SBA7a"
    equipment = "Equipment"
    cre = "CRE"


class DocStatus(str, Enum):
    pending = "pending"
    requested = "requested"
    received = "received"
    verified = "verified"
    rejected = "rejected"
    waived = "waived"


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Severity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class InsightType(str, Enum):
    risk = "risk"
    note = "note"

