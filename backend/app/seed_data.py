"""Default seed data generation for the mock API."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path
from random import Random
from typing import Any, Dict, List

from .enums import DealStage, DocStatus, ProductType, Severity, TaskStatus

DEFAULT_SEED_RANDOM_SEED = 20240522


def load_seed(seed_path: str | None) -> Dict[str, Any]:
    if seed_path:
        path = Path(seed_path)
        if path.exists():
            with path.open("r", encoding="utf-8") as fh:
                return json.load(fh)
    return build_default_seed()


def build_default_seed() -> Dict[str, Any]:
    rng = Random(DEFAULT_SEED_RANDOM_SEED)
    owners = [
        {"id": "o_avery", "name": "Avery Chen"},
        {"id": "o_malik", "name": "Malik Ortiz"},
        {"id": "o_sky", "name": "Sky Patel"},
    ]

    borrowers: List[Dict[str, Any]] = []
    deals: List[Dict[str, Any]] = []
    financials: List[Dict[str, Any]] = []
    documents: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []
    suggestions: List[Dict[str, Any]] = []
    term_sheets: List[Dict[str, Any]] = []
    activity: List[Dict[str, Any]] = []

    borrower_templates = [
        ("Acme Bakery", "311812", "Food Manufacturing"),
        ("GreenTech Fabrication", "335312", "Clean Energy"),
        ("Sunrise Learning Center", "624410", "Child Care"),
        ("Bluewater Fisheries", "114112", "Aquaculture"),
        ("Summit Outdoor Gear", "451110", "Retail"),
        ("Harbor Freight Logistics", "488510", "Logistics"),
        ("Lakeside Hospitality Group", "721110", "Hospitality"),
        ("BrightPath Healthcare", "621610", "Healthcare"),
        ("Atlas Auto Services", "811111", "Automotive"),
        ("Crescent Landscaping", "561730", "Services"),
        ("Northstar Media", "512110", "Media"),
        ("Verdant Farming Co.", "111998", "Agriculture"),
    ]

    stages_cycle = [
        DealStage.prospect.value,
        DealStage.application.value,
        DealStage.underwriting.value,
        DealStage.credit_memo.value,
        DealStage.docs.value,
        DealStage.approved.value,
        DealStage.closed.value,
        DealStage.declined.value,
    ]

    product_cycle = [
        ProductType.term_loan.value,
        ProductType.line_of_credit.value,
        ProductType.sba7a.value,
        ProductType.equipment.value,
        ProductType.cre.value,
    ]

    today = datetime.utcnow()

    total_deals = 40
    for idx in range(total_deals):
        template = borrower_templates[idx % len(borrower_templates)]
        borrower_id = f"b_{idx+301}"
        borrower_name = f"{template[0]} {idx % 5 + 1}"
        borrowers.append(
            {
                "id": borrower_id,
                "legalName": borrower_name,
                "industry": template[2],
                "naics": template[1],
                "address": f"{100 + idx} Market St, City {idx % 7 + 1}, ST",
                "existingRelationship": rng.choice([True, False]),
                "deposits": round(rng.uniform(50_000, 750_000), 2),
            }
        )

        stage = stages_cycle[idx % len(stages_cycle)]
        product = product_cycle[idx % len(product_cycle)]
        requested_amount = round(rng.uniform(150_000, 5_000_000), 2)
        created_delta = rng.randint(40, 240)
        updated_delta = rng.randint(1, 30)
        created_at = today - timedelta(days=created_delta)
        updated_at = today - timedelta(days=updated_delta)
        risk_score = round(rng.uniform(0.2, 0.85), 2)
        probability = round(rng.uniform(0.15, 0.85), 2)
        dscr = round(rng.uniform(0.8, 1.4), 2)
        ltv = round(rng.uniform(0.45, 0.85), 2)

        owner = owners[idx % len(owners)]
        deal_id = f"d_{idx+401}"
        deal_name = f"{borrower_name} {product}"
        deals.append(
            {
                "id": deal_id,
                "name": deal_name,
                "borrowerId": borrower_id,
                "owner": owner,
                "product": product,
                "stage": stage,
                "requestedAmount": requested_amount,
                "probability": probability,
                "riskScore": risk_score,
                "dscr": dscr,
                "ltv": ltv,
                "docsProgress": rng.uniform(0.2, 0.95),
                "flags": [flag for flag in _sample_flags(rng)],
                "createdAt": created_at.isoformat(timespec="seconds"),
                "updatedAt": updated_at.isoformat(timespec="seconds"),
            }
        )

        # Financials (three annual records and one quarterly)
        base_year = datetime.utcnow().year - 3
        for year_offset in range(3):
            revenue = round(rng.uniform(850_000, 8_500_000), 2)
            ebitda = round(revenue * rng.uniform(0.08, 0.22), 2)
            debt_service = round(revenue * rng.uniform(0.04, 0.12), 2)
            financials.append(
                {
                    "borrowerId": borrower_id,
                    "period": "annual",
                    "periodEnd": date(base_year + year_offset, 12, 31).isoformat(),
                    "revenue": revenue,
                    "ebitda": ebitda,
                    "debtService": debt_service,
                }
            )
        # Latest quarterly
        quarter_end = date.today().replace(month=3 * ((date.today().month - 1) // 3 + 1), day=30)
        revenue = round(rng.uniform(250_000, 2_000_000), 2)
        ebitda = round(revenue * rng.uniform(0.06, 0.2), 2)
        debt_service = round(revenue * rng.uniform(0.05, 0.12), 2)
        financials.append(
            {
                "borrowerId": borrower_id,
                "period": "quarterly",
                "periodEnd": quarter_end.isoformat(),
                "revenue": revenue,
                "ebitda": ebitda,
                "debtService": debt_service,
            }
        )

        # Document checklist
        doc_templates = _document_templates(rng)
        for doc in doc_templates:
            doc_id = doc["id"]
            documents.append({"dealId": deal_id, **doc})

        # Tasks
        task_count = rng.randint(1, 3)
        for task_idx in range(task_count):
            task_id = f"t_{deal_id}_{task_idx+1}"
            due_at = today + timedelta(days=rng.randint(2, 20))
            tasks.append(
                {
                    "id": task_id,
                    "dealId": deal_id,
                    "title": rng.choice(
                        [
                            "Collect BOI Report",
                            "Review cash flow model",
                            "Confirm collateral appraisal",
                            "Prep credit memo draft",
                            "Schedule site visit",
                        ]
                    ),
                    "assignedTo": owner["id"],
                    "dueAt": due_at.isoformat(timespec="seconds"),
                    "status": rng.choice([status.value for status in TaskStatus]),
                }
            )

        # Suggestions
        for suggestion in _suggestions_templates(rng, deal_id):
            suggestions.append(suggestion)

        # Term sheet baseline
        term_sheets.append(_term_sheet_template(rng, deal_id, today))

        # Activity events baseline
        activity.extend(_activity_seed(rng, deal_id, updated_at))

    return {
        "owners": owners,
        "borrowers": borrowers,
        "deals": deals,
        "financials": financials,
        "documents": documents,
        "tasks": tasks,
        "suggestions": suggestions,
        "termSheets": term_sheets,
        "activity": activity,
        "user": {
            "id": "u_reviewer",
            "name": "Jordan Review",
            "email": "jordan.review@krida.example",
        },
    }


def _sample_flags(rng: Random) -> List[str]:
    flags = [
        "RevenueDecline",
        "BankStatementMismatch",
        "HighLeverage",
        "AgingReceivables",
    ]
    rng.shuffle(flags)
    return flags[: rng.randint(0, 2)]


def _document_templates(rng: Random) -> List[Dict[str, Any]]:
    base_docs = [
        {"id": f"dc_{rng.randbytes(3).hex()}", "label": "2019 Tax Return", "type": "tax"},
        {"id": f"dc_{rng.randbytes(3).hex()}", "label": "2023 YTD P&L", "type": "statement"},
        {"id": f"dc_{rng.randbytes(3).hex()}", "label": "Debt Schedule", "type": "other"},
        {"id": f"dc_{rng.randbytes(3).hex()}", "label": "Bank Statements", "type": "bank_statements"},
        {"id": f"dc_{rng.randbytes(3).hex()}", "label": "Personal Financial Statement", "type": "statement"},
        {"id": f"dc_{rng.randbytes(3).hex()}", "label": "Ownership Chart", "type": "other"},
    ]
    rng.shuffle(base_docs)
    count = min(rng.randint(5, 8), len(base_docs))
    status_choices = [status.value for status in DocStatus]
    docs: List[Dict[str, Any]] = []
    for idx in range(count):
        doc = base_docs[idx]
        status = rng.choice(status_choices)
        requested_at = datetime.utcnow() - timedelta(days=rng.randint(1, 35))
        docs.append(
            {
                "id": doc["id"],
                "label": doc["label"],
                "type": doc["type"],
                "requiredBy": (date.today() + timedelta(days=rng.randint(5, 30))).isoformat()
                if rng.random() < 0.6
                else None,
                "status": status,
                "link": None,
                "requestedAt": requested_at.isoformat(timespec="seconds"),
            }
        )
    return docs


def _suggestions_templates(rng: Random, deal_id: str) -> List[Dict[str, Any]]:
    templates = [
        ("Reduce rate to 8.9%", "Keeps DSCR ≥ 1.2 with fee adj.", Severity.info.value),
        ("Add 0.25% origination fee", "Offset margin without DSCR risk", Severity.info.value),
        ("Consider 10% holdback", "Mitigate project execution risk", Severity.warning.value),
        ("Request landlord waiver", "Tenant improvements rely on lease terms", Severity.warning.value),
    ]
    rng.shuffle(templates)
    count = rng.randint(2, 4)
    payload = []
    for idx in range(count):
        title, text, severity = templates[idx]
        payload.append(
            {
                "id": f"s_{deal_id}_{idx+1}",
                "dealId": deal_id,
                "severity": severity,
                "text": text,
            }
        )
    return payload


def _term_sheet_template(rng: Random, deal_id: str, timestamp: datetime) -> Dict[str, Any]:
    return {
        "id": f"ts_{deal_id}",
        "dealId": deal_id,
        "baseRate": rng.choice(["SOFR", "Prime"]),
        "marginBps": rng.randint(350, 650),
        "amortMonths": rng.choice([120, 180, 240, 300]),
        "interestOnlyMonths": rng.choice([0, 3, 6, 12]),
        "originationFeeBps": rng.randint(75, 250),
        "prepayPenalty": rng.choice(["3-2-1", "Declining", None]),
        "collateral": rng.choice(["Business assets", "CRE first lien", "Equipment lien"]),
        "covenants": ["Maintain DSCR ≥ 1.20", "Quarterly reporting"],
        "conditions": ["Evidence of insurance", "Environmental report"],
        "lastEditedAt": timestamp.isoformat(timespec="seconds"),
    }


def _activity_seed(rng: Random, deal_id: str, base_time: datetime) -> List[Dict[str, Any]]:
    events = []
    for idx, event_type in enumerate(["deal.created", "deal.updated", "note.added"]):
        events.append(
            {
                "id": f"a_{deal_id}_{idx+1}",
                "type": event_type,
                "at": (base_time - timedelta(days=idx + 1)).isoformat(timespec="seconds"),
                "dealId": deal_id,
                "payload": {"summary": f"{event_type.replace('.', ' ').title()}"},
            }
        )
    return events
