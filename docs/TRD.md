# Bhraman — Technical Requirements Document

**Companion to [[PRD]]** · Scope: 36-hour SIH build · See [[BACKEND_SCHEMA]] for full data model, [[BUILD_PLAN]] for execution order.

---

## 1. Architecture Overview

```
                              ┌─────────────────────────┐
   WhatsApp (Twilio Sandbox)  │                          │
   ───────────────────────────▶   Onboarding Agent Graph │
   inbound webhook             │   (LangGraph, Python)    │
                              └────────────┬─────────────┘
                                           │ writes (Django ORM)
                                           ▼
┌──────────────┐  reads/writes  ┌──────────────────────┐   reads/writes   ┌──────────────────┐
│ React Web App │◀──────────────▶│  Django + DRF API     │◀─────────────────▶│  React Web App    │
│ (Tourist)     │  REST/JSON     │  (single service)      │   REST/JSON       │  (Host)           │
└───────┬───────┘                └───────────┬──────────┘                   └────────┬──────────┘
        │ triggers                           │                                        │
        ▼                                    ▼                                        │
┌──────────────────────┐        ┌─────────────────────────┐                          │
│ Planning & Booking    │        │  PostgreSQL + pgvector   │◀─────────────────────────┘
│ Agent Graph (LangGraph)│──────▶│  (single source of truth) │
└──────────────────────┘        └────────────┬────────────┘
┌──────────────────────┐                     │
│ Verification & Safety │◀────────────────────┘
│ Agent Graph            │        aggregate queries (DRF read endpoints)
└──────────────────────┘                     │
                                              ▼
                                   ┌─────────────────────┐
                                   │ React Web App         │
                                   │ (Government, read-mostly)│
                                   └─────────────────────┘
```

**Single Postgres database is the integration point between every surface.** No agent talks directly to another agent — each reads/writes shared tables via the Django ORM, which is what makes the "it remembers and accumulates" claim in the PRD literally true rather than marketing copy.

## 2. Tech Stack

Frontend and backend choices below match this team's own established conventions (carried over from prior projects), not generic hackathon defaults — reuse the same patterns, don't reinvent them under time pressure.

| Layer | Choice | Notes for 36h build |
|---|---|---|
| Frontend | **React 19 + Vite**, plain JS (not TS — matches team convention, one less build-time failure mode under time pressure) | One SPA, three role-gated route trees (`/tourist`, `/host`, `/gov`) rather than three separate apps — shared auth/API-client code, less duplicated setup |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`, not `tailwind.config.js`) | Design tokens from [[UI_UX_DESIGN]] go directly into `index.css` `@theme` blocks — one per archetype (warm-marketplace vars, precision-console vars) |
| Icons | **`@phosphor-icons/react`** | Real SVG React components — no webfont-ligature icon fonts (avoids the "icon renders as literal text" class of bug entirely) |
| Routing / data | `react-router-dom` · `@tanstack/react-query` + `axios` for API calls · `motion` for the few animations that matter (day-stepper transitions, chat message entry) · `sonner` for toasts · `clsx` + `tailwind-merge` (`cn()` util) | Standard team toolkit — don't introduce alternatives |
| API | **Django 5.1+ with Django REST Framework** | Per-domain apps: `accounts`, `listings`, `trips`, `onboarding`, `verification`, `analytics` — not one monolith app |
| Auth | `djangorestframework-simplejwt` | Even for the 36h demo's 3 role-tokens (§4) — reuse the real auth library rather than hand-rolling token checks |
| CORS / config | `django-cors-headers`, `python-dotenv` | Standard team pattern for local dev against the Vite dev server |
| Agent orchestration | **LangGraph (Python)**, called synchronously from a DRF view | Each agent = one small `StateGraph` (2–4 nodes), invoked in-process — no Celery/Channels needed for a 36h demo's request volume. Use LangGraph's Postgres-backed checkpointer for persistence, not a custom state machine |
| LLM | Anthropic Claude via `anthropic` Python SDK | Tool-use / structured output for listing extraction and itinerary generation |
| Database | PostgreSQL 16 + `pgvector` extension, accessed via Django models (`pgvector.django.VectorField`) | Vector column on `listings` for semantic "find similar experience" search feeding the planning agent — see [[BACKEND_SCHEMA]] §Django Models |
| Onboarding channel | **Twilio WhatsApp Sandbox** (not Meta Business API) | Real WhatsApp Business API requires Meta business verification — not achievable in 36h. Twilio sandbox gives a real WhatsApp number + webhook in minutes |
| Payments | Mock wallet (ledger table, no gateway) | Real Razorpay/Stripe integration is a Phase-2 item, not 36h scope |
| Hosting | Local / single free-tier VM (Render/Railway) for demo | No need for multi-region infra at hackathon scale |

**Stretch, not baseline (36h):** streaming the agent's response token-by-token to the tourist chat UI (visually strong for a live demo — judges watch it "think") needs Django Channels + `daphne` for a WebSocket, which this team has used before (CodeMind). Add it only after the core loop ([[BUILD_PLAN]] hour-18 checkpoint) is solid — a synchronous request/response with a loading state is the correct default, not a placeholder to feel bad about.

## 3. Agent Designs (LangGraph)

### 3.1 WhatsApp Onboarding Agent
- **Trigger:** inbound Twilio webhook (`POST /webhooks/whatsapp`).
- **Graph nodes:**
  1. `classify_intent` — is this a new onboarding, a follow-up answer, or an update to an existing listing?
  2. `extract_fields` — LLM tool-call extracts `{offering_type, description, price, availability, location, photos[]}` from the message (+ any attached media URLs from Twilio).
  3. `ask_missing_or_confirm` — if required fields are missing, generate the next question in the host's language; else summarize back for confirmation.
  4. `persist_listing` — upsert into `listings` table with `status = 'pending_verification'`, enqueue for the Verification agent.
- **State persisted per WhatsApp number** (`conversation_state` table) so the conversation survives across messages — this is the "memory" the PRD claims.
- **Language:** system prompt instructs the model to respond in the same language the host wrote in (Hindi supported for demo; no separate translation service needed since the LLM handles it natively).

### 3.2 Travel Planning & Booking Agent
- **Trigger:** tourist submits `{budget, interests[], dates, origin}` via web chat.
- **Graph nodes:**
  1. `retrieve_candidates` — pgvector similarity search over `listings` (interest embedding) + curated `known_sites` table.
  2. `compose_itinerary` — LLM composes a day-by-day itinerary within budget, mixing known sites and verified listings.
  3. `await_edit` — if tourist edits a stop (swap/remove), only the affected day is regenerated, not the whole trip (keeps demo latency low).
  4. `book` — on confirm, writes `bookings` rows, decrements listing availability, writes a `wallet_transactions` row (mock debit).
- **Checkpointing:** LangGraph checkpoint keyed by `trip_id` so "await_edit" can pause indefinitely between user turns.

### 3.3 Verification & Safety Agent
- **Trigger:** new/updated listing enters `pending_verification`.
- **Logic (kept simple for 36h — not a separate ML model):**
  - Rule check: price outside ±2 std-dev of regional median for that `offering_type` → flag.
  - LLM check: description internally contradictory (e.g., claims both "no wifi" and "high-speed wifi") → flag.
  - No flags → `status = 'live'`. Flags → `status = 'needs_review'`, surfaced on host dashboard with the specific reason.
- **Safety advisories:** a static/seeded `safety_advisories` table (region, category, message) surfaced to the tourist dashboard by matching itinerary stop locations — not a live scraping pipeline.

### 3.4 Adaptive Re-planning Agent *(stretch — cut first if behind schedule)*
- **Trigger:** manual "simulate disruption" button in the demo (stands in for a real weather/closure webhook).
- Re-runs `compose_itinerary` for remaining days only, same graph as 3.2 node 2, with a `disruption_reason` added to context.

## 4. API Surface (REST, `/api/v1`, JSON, per `api-design` conventions)

| Endpoint | Method | Purpose |
|---|---|---|
| `/webhooks/whatsapp` | POST | Twilio inbound message webhook → Onboarding Agent |
| `/api/v1/listings` | GET | List/filter listings (host dashboard, planning agent internal use) |
| `/api/v1/listings/:id` | GET / PATCH | View/edit a listing |
| `/api/v1/listings/:id/verify` | POST | Manually re-trigger verification (host disputes a flag) |
| `/api/v1/trips` | POST | Start a planning session `{budget, interests, dates}` |
| `/api/v1/trips/:id` | GET / PATCH | Fetch/edit itinerary (PATCH triggers partial regeneration) |
| `/api/v1/trips/:id/book` | POST | Confirm booking, debit mock wallet |
| `/api/v1/trips/:id/replan` | POST | Trigger adaptive re-planning *(stretch)* |
| `/api/v1/hosts/:id/dashboard` | GET | Aggregated bookings/earnings/analytics for a host |
| `/api/v1/hosts/:id/pricing-suggestions` | GET | AI pricing copilot output |
| `/api/v1/gov/heatmap` | GET | Regional demand + safety-incident heatmap data — rendered client-side as a **stylized zone diagram** (color-coded density blocks per region, matching the Stitch mockup), *not* a real map library. Explicit scope decision: no team member has integrated Leaflet/Mapbox/GeoJSON before, and it's the kind of rabbit hole that eats a day without being visible in the pitch |
| `/api/v1/gov/scheme-metrics` | GET | Rural income, homestay growth, arrival trends |

Standard response envelope `{ data, meta? }` / `{ error: { code, message, details? } }`; standard status codes (201 on create, 404/422/409 as applicable). Auth is real `simplejwt` JWTs, just issued to 3 fixed demo accounts (`tourist_demo` / `host_demo` / `gov_demo`) rather than a full signup flow — full per-user auth/registration is out of scope for 36h and noted as a Phase-2 item below.

## 5. Data Flow — "why it isn't just a chat session"

1. Meera's WhatsApp conversation → row in `listings` (persists forever, independent of any chat window).
2. Aditya's planning session retrieves that row via pgvector search → row in `bookings` referencing `listings.id`.
3. Host dashboard queries `bookings` joined to `listings` → Meera sees the booking without ever re-explaining her homestay.
4. Government dashboard aggregates the same `bookings`/`listings` tables by region → scheme-outcome view.

Every dashboard is a different read (and sometimes write) view over **one schema** — see [[BACKEND_SCHEMA]].

## 6. Non-Functional Requirements (demo-scoped)

- **Latency:** agent response < 5s in demo conditions (pre-warm LLM connection before judges arrive; keep graphs to ≤4 nodes).
- **Reliability:** no auto-scaling/HA needed; a single restart-safe process is sufficient. LangGraph checkpointer must survive a process restart (Postgres-backed checkpointer, not in-memory) so a crash mid-demo doesn't lose conversation state.
- **Security (still required — see PRD non-goals for what's cut, not this):** webhook signature validation on the Twilio endpoint, input validation on every API route (reject malformed payloads with 422, never leak stack traces), secrets (Anthropic key, Twilio auth token, DB URL) in environment variables only, never committed.
- **Observability:** structured console logging per agent node transition is enough for a hackathon — no APM stack.

## 7. Explicitly Deferred (Phase 2, do not build in 36h)

- Real WhatsApp Business API + Meta verification
- Real payment gateway
- Multi-region hosting, autoscaling
- Full ML-based fraud/verification model
- Per-user auth/RBAC beyond the 3 demo role tokens
- Production translation pipeline beyond LLM-native language handling
