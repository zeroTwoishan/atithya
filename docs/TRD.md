# Atithya — Technical Requirements Document

**Companion to [[PRD]]** · Scope: 36-hour SIH build · See [[BACKEND_SCHEMA]] for full data model, [[BUILD_PLAN]] for execution order.

---

## 1. Architecture Overview

```
                              ┌─────────────────────────┐
   WhatsApp (Cloud API, Meta)  │                          │
   ───────────────────────────▶   Onboarding Agent Graph │
   inbound webhook             │  (LangGraph.js, node 01) │
                              └────────────┬─────────────┘
                                           │ writes (pg, parameterised SQL)
                                           ▼
┌──────────────┐  reads/writes  ┌──────────────────────┐   reads/writes   ┌──────────────────┐
│ React Web App │◀──────────────▶│  Node.js + Express API│◀─────────────────▶│  React Web App    │
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
│ Agent Graph            │        aggregate queries (Express read routes)
└──────────────────────┘                     │
                                              ▼
                                   ┌─────────────────────┐
                                   │ React Web App         │
                                   │ (Government, read-mostly)│
                                   └─────────────────────┘
```

**Single Postgres database is the integration point between every surface.** No agent talks directly to another agent — each reads/writes shared tables through the same `pg` pool, which is what makes the "it remembers and accumulates" claim in the PRD literally true rather than marketing copy.

## 2. Tech Stack

Frontend and backend choices below match this team's own established conventions (carried over from prior projects), not generic hackathon defaults — reuse the same patterns, don't reinvent them under time pressure.

| Layer | Choice | Notes for 36h build |
|---|---|---|
| Frontend | **React 19 + Vite**, plain JS (not TS — matches team convention, one less build-time failure mode under time pressure) | One SPA, three role-gated route trees (`/tourist`, `/host`, `/gov`) rather than three separate apps — shared auth/API-client code, less duplicated setup |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`, not `tailwind.config.js`) | Design tokens from [[UI_UX_DESIGN]] go directly into `index.css` `@theme` blocks — one per archetype (warm-marketplace vars, precision-console vars) |
| Icons | **`@phosphor-icons/react`** | Real SVG React components — no webfont-ligature icon fonts (avoids the "icon renders as literal text" class of bug entirely) |
| Routing / data | `react-router-dom` · `@tanstack/react-query` + `axios` for API calls · `motion` for the few animations that matter (day-stepper transitions, chat message entry) · `sonner` for toasts · `clsx` + `tailwind-merge` (`cn()` util) | Standard team toolkit — don't introduce alternatives |
| API | **Node.js 20+ with Express 5** | One router per bounded domain (`listings`, `trips`, `analytics`, `whatsapp`) mounted on a single app — not one monolith file, not microservices |
| Auth | `jsonwebtoken` | Even for the 36h demo's 3 role-tokens (§4) — reuse the real JWT library rather than hand-rolling token checks |
| CORS / config | `cors`, node's built-in `--env-file` (no `dotenv` dependency needed on node 20+) | Standard pattern for local dev against the Vite dev server |
| Agent orchestration | **LangGraph.js**, one supervisor graph routing to 4 sub-agents, called synchronously from an Express route | Each agent = one small `StateGraph` (2–4 nodes), invoked in-process — no Celery/Channels needed for a 36h demo's request volume. Use LangGraph's Postgres-backed checkpointer for persistence, not a custom state machine |
| LLM | Anthropic Claude via `@langchain/anthropic` | Tool-use / structured output for listing extraction and itinerary generation |
| Database | PostgreSQL 16 + `pgvector`, accessed with the `pg` driver over the hand-written `schema.sql` in [[BACKEND_SCHEMA]] §3 — no ORM | The schema is 11 tables and frozen for the build; an ORM would add a migration toolchain and a mapping layer to maintain for zero queries it makes easier. Vector column on `listings` feeds the planning agent's retrieval |
| Onboarding channel | **WhatsApp Cloud API** (Meta, test number) | A Cloud API *test* number is issued immediately with no business verification, sends to 5 pre-registered recipients, and is free — enough for the demo, and it is the same API the production number uses later. No Twilio layer in between |
| Payments | Mock wallet (ledger table, no gateway) | Real Razorpay/Stripe integration is a Phase-2 item, not 36h scope |
| Hosting | Local / single free-tier VM (Render/Railway) for demo | No need for multi-region infra at hackathon scale |

**Stretch, not baseline (36h):** streaming the agent's response token-by-token to the tourist chat UI (visually strong for a live demo — judges watch it "think") needs a WebSocket (`ws`) or SSE endpoint alongside Express. Add it only after the core loop ([[BUILD_PLAN]] hour-18 checkpoint) is solid — a synchronous request/response with a loading state is the correct default, not a placeholder to feel bad about.

## 3. Agent Designs (LangGraph.js)

**One supervisor, four sub-agents.** A single `StateGraph` supervisor owns routing, retries on node failure, and checkpointing; the four graphs below are its routable destinations. No sub-agent calls another sub-agent directly — the supervisor decides what runs next from the shared state, which is what keeps a failed node recoverable instead of leaving a half-written listing behind.

### 3.1 WhatsApp Onboarding Agent
- **Trigger:** inbound WhatsApp Cloud API webhook (`POST /webhooks/whatsapp`), after `X-Hub-Signature-256` HMAC validation.
- **Graph nodes:**
  1. `classify_intent` — is this a new onboarding, a follow-up answer, or an update to an existing listing?
  2. `extract_fields` — LLM tool-call extracts `{offering_type, description, price, availability, location, photos[]}` from the message. Media arrives as an *id*, not a URL: resolving it takes two authenticated Graph API calls (`GET /<id>` for a short-lived URL, then the bytes), so ids are carried on the draft and only downloaded in `persist_listing` — a conversation that never finishes costs no round-trips. Files land in `server/media/`, served at `/media/<uuid>`.
  3. `ask_missing_or_confirm` — if required fields are missing, generate the next question in the host's language; else summarize back for confirmation.
  4. `persist_listing` — upsert into `listings` table with `status = 'pending_verification'`, enqueue for the Verification agent.
- **State persisted per WhatsApp number** — the graph is checkpointed with `PostgresSaver` under thread id `onboarding:<number>`, so a host's half-finished listing survives both their next message and a process restart; the `conversation_state` row carries the number-to-host link alongside it. This is the "memory" the PRD claims.
- **Language:** system prompt instructs the model to respond in the same language the host wrote in (Hindi supported for demo; no separate translation service needed since the LLM handles it natively).

### 3.2 Travel Planning & Booking Agent
- **Trigger:** tourist submits `{budget, interests[], dates, origin}` via web chat.
- **Graph nodes:**
  1. `retrieve_candidates` — pgvector similarity search over `listings` (interest embedding) + curated `known_sites` table.
  2. `compose_itinerary` — LLM composes a day-by-day itinerary within budget, mixing known sites and verified listings.
  3. `await_edit` — if the tourist edits a stop (swap/remove), only the affected day changes, not the whole trip. A swap picks an alternative of the same kind that is not already on the trip, and for a stay one that still fits the budget; a removal resequences the day so the next insert does not collide. Deterministic, no LLM call — re-running the planner would move stops the tourist was happy with, and visibly redraw the screen on stage.
  4. `book` — on confirm, writes `bookings` rows, decrements listing availability, writes a `wallet_transactions` row (mock debit).
- **Checkpointing:** LangGraph checkpoint keyed by `trip_id` so "await_edit" can pause indefinitely between user turns.

### 3.3 Verification & Safety Agent
- **Trigger:** new/updated listing enters `pending_verification`.
- **Logic (kept simple for 36h — not a separate ML model):**
  - Rule check: price outside ±2 std-dev of regional median for that `offering_type` → flag.
  - LLM check: description internally contradictory (e.g., claims both "no wifi" and "high-speed wifi") → flag.
  - No flags → `status = 'live'`. Flags → `status = 'needs_review'`, surfaced on host dashboard with the specific reason.
- **Safety advisories:** a static/seeded `safety_advisories` table (region, category, message) surfaced to the tourist dashboard by matching itinerary stop locations — not a live scraping pipeline.

### 3.4 Adaptive Re-planning Agent
- **Trigger:** manual "simulate disruption" button in the demo (stands in for a real weather/closure webhook). Promoted from stretch to baseline — the deck lists it as agent 04 of 4, so the supervisor ships with all four routes.
- Re-runs `compose_itinerary` for remaining days only, same graph as 3.2 node 2, with a `disruption_reason` added to context.

## 4. API Surface (REST, `/api/v1`, JSON, per `api-design` conventions)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/health` | GET | Unauthenticated probe: database reachability plus which integrations are configured. 503 when the database is down |
| `/webhooks/whatsapp` | GET | Meta webhook verification handshake (`hub.challenge`) — required once at subscription time |
| `/webhooks/whatsapp` | POST | WhatsApp Cloud API inbound message webhook → Onboarding Agent |
| `/api/v1/listings` | GET | List/filter listings (host dashboard, planning agent internal use) |
| `/api/v1/listings/:id` | GET / PATCH | View/edit a listing |
| `/api/v1/listings/:id/verify` | POST | Manually re-trigger verification (host disputes a flag) |
| `/api/v1/trips` | POST | Start a planning session `{budget, interests, dates}` |
| `/api/v1/trips/:id` | GET / PATCH | Fetch/edit itinerary (PATCH triggers partial regeneration) |
| `/api/v1/trips/:id/items/:itemId` | PATCH | Remove or swap one stop — only that day changes (§3.2 node 3) |
| `/api/v1/trips/:id/book` | POST | Confirm booking, debit mock wallet |
| `/api/v1/trips/:id/replan` | POST | Trigger adaptive re-planning *(stretch)* |
| `/api/v1/hosts/:id/dashboard` | GET | Aggregated bookings/earnings/analytics for a host |
| `/api/v1/hosts/:id/pricing-suggestions` | GET | AI pricing copilot output |
| `/api/v1/gov/heatmap` | GET | Regional demand + safety-incident heatmap data — rendered client-side as a **stylized zone diagram** (color-coded density blocks per region, matching the Stitch mockup), *not* a real map library. Explicit scope decision: no team member has integrated Leaflet/Mapbox/GeoJSON before, and it's the kind of rabbit hole that eats a day without being visible in the pitch |
| `/api/v1/gov/scheme-metrics` | GET | Rural income, homestay growth, arrival trends |

Standard response envelope `{ data, meta? }` / `{ error: { code, message, details? } }`; standard status codes (201 on create, 404/422/409 as applicable). Auth is real `jsonwebtoken` HS256 JWTs, just issued to 3 fixed demo accounts (`tourist_demo` / `host_demo` / `gov_demo`) rather than a full signup flow — full per-user auth/registration is out of scope for 36h and noted as a Phase-2 item below.

## 5. Data Flow — "why it isn't just a chat session"

1. Meera's WhatsApp conversation → row in `listings` (persists forever, independent of any chat window).
2. Aditya's planning session retrieves that row via pgvector search → row in `bookings` referencing `listings.id`.
3. Host dashboard queries `bookings` joined to `listings` → Meera sees the booking without ever re-explaining her homestay.
4. Government dashboard aggregates the same `bookings`/`listings` tables by region → scheme-outcome view.

Every dashboard is a different read (and sometimes write) view over **one schema** — see [[BACKEND_SCHEMA]].

## 6. Non-Functional Requirements (demo-scoped)

- **Latency:** agent response < 5s in demo conditions (pre-warm LLM connection before judges arrive; keep graphs to ≤4 nodes).
- **Reliability:** no auto-scaling/HA needed; a single restart-safe process is sufficient. LangGraph checkpointer must survive a process restart (Postgres-backed checkpointer, not in-memory) so a crash mid-demo doesn't lose conversation state.
- **Security (still required — see PRD non-goals for what's cut, not this):** webhook signature validation (`X-Hub-Signature-256`, HMAC-SHA256 of the raw body against the Meta app secret — needs the raw buffer, so mount the webhook's body parser before any JSON parser), input validation on every API route (reject malformed payloads with 422, never leak stack traces), secrets (Anthropic key, Meta app secret + access token, DB URL) in environment variables only, never committed.
- **Observability:** structured console logging per agent node transition is enough for a hackathon — no APM stack.

## 7. Explicitly Deferred (Phase 2, do not build in 36h)

- Meta business verification + a production WhatsApp number (the Cloud API *test* number covers the demo)
- Real payment gateway
- Multi-region hosting, autoscaling
- Full ML-based fraud/verification model
- Per-user auth/RBAC beyond the 3 demo role tokens
- Production translation pipeline beyond LLM-native language handling
