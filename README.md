# Krida Deal Desk UI — Frontend Take‑Home

Welcome! This project is a production-adjacent UI challenge tailored to Krida's lending workflow. You'll implement a banker-facing Deal Desk experience using **TanStack Start (React + TypeScript)** against the provided mock backend API.

> Estimated time: ~4 hours (stretch polish optional)

## Objectives

Build a responsive, accessible UI that helps bankers triage, review, and advance SMB lending deals. Focus on:

- Clear information hierarchy and interaction design
- Competent use of TanStack Start primitives (routes, loaders, server functions)
- Server-state handling, optimistic updates, and resilient UX states

## Requirements

### 1. Deals Pipeline (`/` or `/deals`)
- Group deals by stage: Intake → Underwriting → Credit Memo → Docs → Funded
- Search by borrower name; filter by product/amount; sort by `updatedAt`
- Drag & drop cards between stages → `PATCH /deals/:id` with optimistic update & rollback on failure
- Card details: borrower, amount, product, docs progress %, risk score, last updated timestamp

### 2. Deal Detail (`/deals/:dealId`)
- Tabs: Overview, Checklist, Activity
- **Overview:** borrower facts (NAICS, revenue/EBITDA when present), requested terms, risk/insight chips
- **Checklist:** required docs with status (Missing | Requested | Received | Rejected); inline action to request a doc (optimistic)
- **Activity:** timeline of recent events (polling accepted; SSE a stretch goal)

### 3. Term-Sheet Playground
- Interactive inputs: amount, rate, amortization, term
- Read-only suggestions returned from the API describing trade-offs
- Action to copy a formatted summary (text or HTML) to the clipboard

### 4. Fit & Finish
- Responsive layout with dark mode toggle
- Intentional loading, empty, and error states (skeletons encouraged)
- Keyboard affordances (e.g., Cmd/Ctrl+K global search or quick navigation)
- Baseline accessibility: focus outlines, labels, ARIA roles where appropriate

### Optional Enhancements
- SSE-powered realtime updates to checklist/activity (`/events/stream`)
- Column virtualization for long pipeline lists
- Persisted filters in URL query parameters
- Tests (Vitest/Jest for units, Playwright/Cypress for E2E)
- Type-safe API layer (Zod), error boundaries, route-level data prefetch, cache invalidation
- Performance insights, code-splitting, bundle analysis
- Auth gate (mock or Clerk integration)
- Deployment (Netlify/Vercel) with link in submission
- Additional dark/light themes, theming presets, or design tokens
- Advanced accessibility touches (skip links, reduced-motion support, screen-reader cues)

## Tech Stack Expectations
- **Required:** TanStack Start, React 18, TypeScript
- **Recommended:** TanStack Query and/or Router loaders for data fetching & caching, Tailwind/Radix/shadcn for UI if desired
- You may use additional libraries as long as you document the choice

## Getting Started

1. **Clone & branch**
   ```bash
   git clone <your fork URL>
   cd frontend-takehome
   git checkout -b solution/<your-name>
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment**
   - Copy `.env.example` → `.env`
   - Add the credentials we emailed you:
     ```ini
     API_URL="https://api.example.com"
     API_TOKEN="<provided token>"
     ```
4. **Run the dev server**
   ```bash
   npm run dev
   ```
5. **Connect to the mock backend**
   - The mock backend lives in `/backend`; see its README for setup and endpoint details
   - OpenAPI docs are served at `/openapi.json` when the backend is running

## API Overview

All requests require `Authorization: Bearer <API_TOKEN>`.

| Concern | Endpoint Highlights |
| --- | --- |
| Deals | `GET /deals`, `GET /deals/:id`, `PATCH /deals/:id` |
| Checklist | `GET /deals/:id/checklist`, `POST /deals/:id/request-doc` |
| Term Sheet | `GET /deals/:id/term-sheet/suggestions`, `GET/PUT /deals/:id/term-sheet` |
| Activity | `GET /deals/:id/activity`, `GET /events/stream?dealId=` (SSE) |

See `/backend/README.md` for endpoint coverage, latency/error toggles, and local dev tips. The running API exposes `/openapi.json`, `/docs`, and `/redoc` for interactive exploration.


## Submission Checklist

- [ ] Provide runnable code in your branch/fork
- [ ] Include a `SOLUTION.md` covering setup, tests, assumptions, decisions, improvements
- [ ] Commit regularly with descriptive messages
- [ ] Ensure `.env.example` stays in sync with required environment variables
- [ ] Email us the repo link (and deploy URL if applicable)
- [ ] (Optional) Share a public preview/deploy URL
- [ ] (Optional) Deliver SSE-powered realtime updates to checklist/activity (`/events/stream`)
- [ ] (Optional) Add column virtualization (e.g., pipeline lists with many deals)
- [ ] (Optional) Persist filters/search state in the URL
- [ ] (Optional) Ship meaningful automated tests (Vitest/Jest, Playwright/Cypress)
- [ ] (Optional) Introduce a type-safe API layer (Zod), error boundaries, and cache invalidation strategy
- [ ] (Optional) Profile bundle size, add obvious code-splits, and document performance insights
- [ ] (Optional) Add an auth gate (simple mock or Clerk integration)
- [ ] (Optional) Publish additional documentation (design system notes, architecture diagrams)
- [ ] (Optional) Include extra polish like command palette shortcuts or AI-assisted borrower summaries (clearly document assumptions)
- [ ] (Optional) Expand theming with enhanced dark/light palettes or contrast modes
- [ ] (Optional) Push accessibility further (skip links, reduced-motion, screen reader guidance)

## Tips

- Use optimistic updates for stage transitions and doc requests; roll back on errors
- Build reusable primitives (cards, tabs, skeletons) to keep the UI consistent
- Leverage loader data + TanStack Query caching for fast navigation
- Mind money formatting, time zones, and respectful handling of PII in UI/logging
- Keep ergonomics in mind: keyboard shortcuts, focus management, skip-to-content, etc.

Have fun—and feel free to note any stretch goals or future improvements you’d make with more time.
