# Bhraman — 36-Hour Build Plan

**Companion to [[PRD]], [[TRD]], [[BACKEND_SCHEMA]], [[UI_UX_DESIGN]]** · Team of 6 · Standard SIH grand-finale format.

> **Velocity reality check:** this plan was calibrated against this team's own git history (AMS-with-TimeTable — 4,599 commits over 2.5 years, still active). Even at that team's highest observed daily velocity, commits were scoped incremental units on an already-mature codebase with shared conventions already in place — not "stand up a new integration from zero." Nobody on the team has shipped evidence of prior LangGraph, Twilio, or pgvector integration. That's why the two novel integration surfaces (WhatsApp onboarding, pgvector retrieval) get an earlier go/no-go gate and a named fallback below, instead of being trusted to "just work" by hour 18.

---

## 1. Roles (fixed for the whole 36h — no context-switching)

| Role | Owns | Primary files/surfaces |
|---|---|---|
| **R1 — Backend/Agent Lead** | Django project + DRF setup, migrations, LangGraph setup, Planning & Booking Agent | `TRD` §3.2, §4 (API surface) |
| **R2 — Onboarding Agent Engineer** | Twilio WhatsApp Sandbox integration, Onboarding Agent graph, Verification Agent | `TRD` §3.1, §3.3 |
| **R3 — Tourist Frontend** | Wires the tourist screens ([[UI_UX_DESIGN]] §4b) to live API in React | Trip planner chat, itinerary timeline, discover feed (mobile + desktop) |
| **R4 — Host + Gov Frontend** | Wires the host/government screens to live API in React | Host listings/calendar/earnings, gov heatmap/metrics/advisories |
| **R5 — Data Engineer** | Django models + migrations, seed data (§5 of [[BACKEND_SCHEMA]]), pgvector embeddings, gov aggregate queries | `models.py` per app, `seed_demo_data` management command |
| **R6 — Integration Lead / PM** | End-to-end loop testing, demo script, judge Q&A prep, unblocks whoever is stuck | Everything, nobody's code |

## 2. Hour-by-Hour

### Hours 0–2: Setup (everyone, in parallel)
- R1: `django-admin startproject`, DRF + `django-cors-headers` + `djangorestframework-simplejwt` installed, per-domain apps created (`accounts`, `listings`, `trips`, `onboarding`, `verification`, `analytics`), hosted/local Postgres up with `pgvector` extension enabled.
- R2: create Twilio account, activate WhatsApp Sandbox, get join code ready, register webhook URL (use `ngrok`/similar for local dev).
- R3 + R4: `npm create vite@latest` (React, JS), Tailwind v4 installed with the two `@theme` token sets from [[UI_UX_DESIGN]] §2/§3, `lucide-react`/`react-router-dom`/`@tanstack/react-query`/`axios` installed. Pull the 12 Stitch-generated HTML screens from `docs/screens/` as the visual/content reference (§4b of [[UI_UX_DESIGN]] — not copy-pasted, translated to components), wire static routing (no live data yet).
- R5: write the Django models per app (mirroring `schema.sql` — see [[BACKEND_SCHEMA]] §4) and run first `makemigrations`/`migrate` — this can happen mostly offline, doesn't block on anyone else.
- R6: confirm every team member has API keys (Anthropic, Twilio, DB URL) in `.env`, not committed. **R1 + R6 also freeze the exact JSON request/response shape for every [[TRD]] §4 endpoint right now**, before R3/R4 write a line of API-calling code — AMS-with-TimeTable's own history is full of post-hoc "fix: read the field from X not Y" commits from exactly this kind of skipped step. A shared shape doc (even a 1-page markdown table) beats finding the mismatch at hour 10.
- **Checkpoint:** DB reachable by everyone, one person can send a WhatsApp sandbox message and see the webhook fire (even if it just logs to console), Vite dev server + Django dev server both running with CORS working between them, API contract frozen and shared.

### Hours 2–8: Sprint 1 — one thing working end-to-end, not everything half-working
- R1: `/api/v1/listings` DRF viewset (CRUD), `/api/v1/trips` create + basic itinerary compose (can start with known_sites only, no pgvector yet).
- R2: Onboarding Agent graph nodes 1–3 (`classify_intent`, `extract_fields`, `ask_missing_or_confirm`) working against a **text-only** WhatsApp message (photos come in Sprint 2).
- R3: Trip planner chat screen calling the real `/api/v1/trips` endpoint against seeded known_sites via `react-query` (fake it with static JSON if the agent isn't ready yet — don't block frontend on backend).
- R4: Host listings screen reading real `/api/v1/listings` (empty is fine, seed data lands end of this block).
- R5: `seed_demo_data` management command finishes and runs — 15–20 known_sites, 5–10 pre-onboarded listings, historical bookings/reviews.
- **Checkpoint (hour 8):** a tourist can plan a trip using only seeded known_sites + pre-seeded listings, end-to-end through the UI. This is the fallback demo if the onboarding agent isn't ready later.

### Hours 8–14: Sprint 2 — the differentiator
- R2: Onboarding Agent node 4 (`persist_listing`) — a real WhatsApp conversation produces a real row in `listings`. Media/photo handling from Twilio.
- **Go/no-go gate at hour ~11 (new, earlier than the hour-18 one below):** does one real WhatsApp message → structured `listings` row actually round-trip? This is the single most untested integration on the team (no prior LangGraph or Twilio use on record) — if it's not working by hour 11, **stop and fall back to a scripted/simulated onboarding for the demo** (a pre-recorded conversation replayed against the same `persist_listing` code path) rather than discovering the gap at hour 18 alongside everything else.
- R1: pgvector embedding + `retrieve_candidates` node wired into the Planning Agent — itineraries now blend onboarded listings, not just known_sites. **Named fallback if this drags:** plain SQL filter on `listings` by `region` + `offering_type` + `price_amount <= budget` — no embeddings. Nobody on the team has shipped a pgvector integration before; don't let this be the thing that quietly eats Sprint 2. (See also §3 Cut Order — this moved up.)
- R3: itinerary timeline screen — editable stops, budget tracker, safety pulse banner wired to `safety_advisories`.
- R4: host calendar/earnings screens wired to real `bookings`/`payouts`; government heatmap screen wired to first aggregate query. **Heatmap is a stylized zone diagram with color-coded density (as shown in the Stitch mockup), not a real map library (Leaflet/Mapbox/GeoJSON)** — that's an explicit scope decision, not an oversight, made precisely to close off a integration rabbit-hole this team has no need to open.
- R5: write the gov aggregate SQL (heatmap, scheme-metrics) — hand off to R4 as soon as query shape is confirmed.
- **Checkpoint (hour 14):** a listing onboarded live via WhatsApp shows up in a tourist's itinerary search within the same session.

### Hours 14–18: Verification Agent + remaining Gov screens (overnight block — expect it to go slower)
- R2: Verification Agent (rule check + LLM contradiction check) — new listings enter `needs_review` correctly, host dashboard shows the specific flag reason.
- R4: finish government scheme-metrics and safety-advisories screens.
- R1 + R5: mock wallet/booking flow — `POST /trips/:id/book` writes `bookings` + `wallet_transactions`, host earnings reflect it.
- **Go/no-go checkpoint (hour 18) — the second gate, after the hour-11 onboarding-specific one above — decide now, don't drift into it:**
  - If the core loop (onboard → plan → book → reflected in all 3 dashboards) isn't working end-to-end yet, **stop all new-feature work** and put everyone on fixing that loop.
  - Re-planning Agent (stretch) is cut first if anyone is behind. Say so out loud, don't quietly keep trying.

### Hours 18–24: Full-loop integration
- R6 runs the actual judge demo script (§4 below) top to bottom, logs every break.
- Whoever owns the broken piece fixes it — no new features enter scope past this point except the re-planning stretch, and only if the core loop is solid.
- R5: top up seed data if the demo needs a specific region/listing that doesn't exist yet.

### Hours 24–30: Polish + stretch
- Re-planning Agent ("simulate disruption" button) — **only if** hour-18 checkpoint passed clean.
- Visual polish pass against [[UI_UX_DESIGN]] tokens (contrast, tabular-nums on money, badge labels not color-only).
- R6: write the judge-facing one-pager (problem → solution → live demo → revenue model) from [[PRD]].

### Hours 30–33: Demo rehearsal
- Full run-through, twice, with a fresh WhatsApp number each time (sandbox join codes expire/reset — confirm this doesn't break the live demo).
- Record a backup video of the full loop in case live WhatsApp fails in the room (PRD §10 risk).
- Rehearse the specific judge Q&A angles: "why not just use ChatGPT" (PRD §8), "how is this different from Airbnb" (PRD §4).

### Hours 33–36: Buffer + submission
- No new code. Fix only what's actively broken.
- Final rehearsal, submission upload, sleep if any is left.

## 3. Cut Order (when behind schedule — cut top-down, don't spread thin)

1. Adaptive Re-planning Agent (stretch from day one)
2. pgvector semantic retrieval in the Planning Agent — fall back to plain SQL filtering (region/offering_type/budget). Moved up from its original spot per the hour-11 gate above: unproven integration for this team, and invisible to judges either way (they see an itinerary, not the retrieval method).
3. Government "Safety Advisories" screen (Heatmap + Scheme Metrics carry the B2G pitch alone)
4. AI Pricing Copilot suggestion (host dashboard still works without it — just show the earnings/calendar)
5. Verification Agent's LLM contradiction check (keep the price-outlier rule check only — cheaper, still demoable)
6. Live WhatsApp media/photo handling (text-only onboarding still proves the differentiator)

**Never cut:** the onboarding-agent-to-tourist-booking loop — that's the entire pitch. If time runs out, everything else is negotiable before that isn't.

## 4. The Judge Demo Script (the thing hours 18–36 are actually optimizing for)

1. **(2 min) Problem framing** — one slide from [[PRD]] §1, no more.
2. **(3 min) Live onboarding** — a team member messages the WhatsApp sandbox number *live, on stage*, in Hindi, onboarding a fake homestay. Judges watch the structured listing appear in the Host Dashboard in real time.
3. **(3 min) Live tourist flow** — open the tourist web app, type a budget/interest/dates prompt, get an itinerary that includes the listing *just onboarded 30 seconds ago*, confirm booking.
4. **(2 min) Host Dashboard** — show the booking landing against that exact listing, earnings updating, the verification flag on a *different* pre-seeded listing to show the safety net works.
5. **(2 min) Government Dashboard** — heatmap + scheme metrics, tie explicitly back to MUDRA-loan homestays and Swadesh Darshan 2.0 language from [[PRD]] §4.2.
6. **(1 min) Close** — revenue model one-liner, "why this isn't just a ChatGPT wrapper" one-liner.

Total: ~13 minutes, leaves room for Q&A within a typical 15–20 minute slot.
