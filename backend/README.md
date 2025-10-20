# Krida Deal Desk Mock API

A FastAPI-based mock service that simulates the backend for the Krida Deal Desk frontend take-home. It exposes realistic REST endpoints, latency/error injection, SSE updates, and background jobs so candidates can build production-adjacent UI flows offline.

## Features

- Bearer auth, CORS support, request IDs
- Deals pipeline with cursor pagination, filtering, optimistic-friendly mutations
- Borrower details, financial history, checklist/documents, tasks, suggestions, activity feed
- Term-sheet playground with async optimisation job
- SSE stream for document/task/term updates
- Latency/error simulation knobs and reset tooling for reviewers
- In-memory seed with 40 deals, borrowers, docs, tasks, suggestions

## Requirements

- Python 3.10+ recommended (3.9 supported via `eval-type-backport`)
- `pip install -e backend[dev]` or see quickstart below

## Quickstart

```bash
# Install dependencies (user mode)
python3 -m pip install -e backend[dev]

# Copy environment template and adjust if needed
cp backend/.env.example backend/.env

# Run the API (auto-reload)
uvicorn backend.app.main:create_app --factory --reload
```

The server listens on `http://127.0.0.1:4343` by default. Docs live at:

- Swagger UI: `http://127.0.0.1:4343/docs`
- ReDoc: `http://127.0.0.1:4343/redoc`
- Raw spec: `http://127.0.0.1:4343/openapi.json`

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `API_TOKEN` | `demo` | Bearer token required for all non-ops endpoints |
| `PORT` | `4343` | Server port |
| `SEED_PATH` | — | Optional JSON seed override |
| `SIM_LATENCY_PROFILE` | `normal` | `fast`, `normal`, `slow`, `chaos` |
| `SIM_ERROR_RATE` | `0` | Default random 5xx rate (0–1) |
| `CORS_ORIGINS` | `*` | CSV of allowed origins |

Per-request overrides:

- `?_sim_latency=fast|normal|slow|chaos`
- `?_sim_error=p5|p10|p20|none|next`
- `X-Sim-Latency`, `X-Sim-Error` headers

## Operational Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/-/healthz` | Liveness |
| GET | `/-/readyz` | Readiness (shows deal count) |
| GET | `/-/metrics` | Plain-text counters |
| POST | `/-/reset?profile=fast` | Reseed + change latency profile (auth required) |
| POST | `/-/seed/documents/verify-all?dealId=` | Force all received docs to verified |

## Key API Paths

- `GET /deals` – Cursor pagination, filters, sorting
- `GET /deals/{id}` – Deal detail
- `PATCH /deals/{id}` – Update stage/owner/probability/risk
- `GET /deals/{id}/checklist` – Document checklist
- `POST /deals/{id}/request-doc` – Optimistic doc request (202)
- `PATCH /documents/{id}` – Update status/link (received -> schedules verification job)
- `GET /deals/{id}/tasks` / `POST` / `PATCH /tasks/{id}` – Task management
- `GET /deals/{id}/term-sheet` / `PUT` – Term sheet CRUD
- `POST /deals/{id}/term-sheet/optimize` – Async optimisation job
- `GET /deals/{id}/term-sheet/suggestions` – Suggestions with echoed query inputs
- `GET /deals/{id}/activity` – Recent events
- `GET /events/stream?dealId=` – SSE stream (document/task/term events)
- `GET /jobs/{id}` – Poll job status

All non ops endpoints require `Authorization: Bearer <API_TOKEN>`.

### Sample `curl`

```bash
TOKEN=demo
curl -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:4343/deals?limit=5&stage=Underwriting"
```

## Tests

```bash
# Run the async integration tests
python3 -m pytest backend/tests
```

## Background Jobs & SSE

- Document `status=received` → schedules verification job (2–6s) emitting:
  - `document.received`, `document.verification_started`, `document.verified|document.rejected`
- `POST /deals/{id}/term-sheet/optimize` → schedules optimisation job (3–8s) emitting `term.optimized`
- SSE endpoint broadcasts keepalive every 15s to keep clients connected

## Seed Data Overview

- 40 deals across stages, 3 owners, varied risk/probability, docs progress
- Borrowers with NAICS/industries, deposits, relationship flag
- Financials: 3 annual + latest quarterly records per borrower
- Checklist: 5–6 docs each, mix of statuses
- Tasks: 1–3 per deal, assorted statuses
- Suggestions: 2–4 baseline insights per deal
- Activity: seeded timeline + auto-appended events from mutations/jobs

## Notes

- Token auth is intentionally simple; no refresh/expiry.
- In-memory data resets on restart or `POST /-/reset`.
- Jobs run on `asyncio` tasks within the process; this mock is single-instance only.
- SSE should be consumed with a client that understands `event` + `data` lines (e.g., `EventSource`).
- For deterministic grading, reviewers can `POST /-/reset?profile=fast` between runs.
