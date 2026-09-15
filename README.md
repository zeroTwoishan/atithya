# Atithya

Hospitality every village already has. A market it has never reached.

A village host sends one WhatsApp message. Our agent interviews them, writes the listing, publishes it — then sells it to tourists. Smart India Hackathon 2026, Problem Statement 26204 (AICTE), Theme: Travel & Tourism. Team **Claude Can Code**.

## Docs

- [`.agent/Design12.pdf`](.agent/Design12.pdf) — the submitted deck. **Source of truth** when anything disagrees.
- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/TRD.md`](docs/TRD.md) — architecture, the four agents, API surface
- [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md) — ERD and data-access notes (the DDL itself is [`server/src/db/schema.sql`](server/src/db/schema.sql))
- [`docs/UI_UX_DESIGN.md`](docs/UI_UX_DESIGN.md) — design tokens, layout and navigation rules
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) — 36-hour plan, roles, cut order

## Stack

React 19 + Vite + Tailwind v4 + Phosphor Icons · Node.js 20 + Express 5 · LangGraph.js (Claude / Gemini / Groq — whichever key is set) · PostgreSQL 16 + pgvector · WhatsApp Cloud API.

Four agents under one LangGraph supervisor — onboarding, verification, planning, re-planning ([`server/src/agents/`](server/src/agents/)). No ORM: eleven frozen tables, hand-written parameterised SQL.

## Getting started

The frontend runs on its own — no server, no database, no keys. Everything it
shows (the catalogue, the planning agent, bookings) runs in the browser, with
state in `localStorage`.

```bash
cd client
npm install
npm run dev     # http://localhost:5173
```

See [`client/README.md`](client/README.md) for the design language and the code
layout.

<details>
<summary>Running the backend too</summary>

```bash
# 1. Database — Postgres 16 with pgvector.
# Either `docker compose up -d` for a local one, or a free Neon/Supabase
# project; put its connection string in DATABASE_URL.
docker compose up -d

# 2. Backend
cd server
npm install
cp .env.example .env    # see "Environment" below
npm run db:init         # applies src/db/schema.sql — DROPS everything first
npm run db:seed         # demo users, known sites, listings, booking history
npm run dev             # http://localhost:8000

# 3. Frontend (separate terminal)
cd client
npm install
npm run dev             # http://localhost:5173
```

Sign in as **`tourist_demo`**, **`host_demo`** or **`gov_demo`** — password matches the username.

Check `curl localhost:8000/api/v1/health` first if anything looks wrong: it reports database reachability and which integrations are configured, and needs no auth.

## Environment

Only two variables are required. Everything else degrades rather than failing.

| Variable | Required | Without it |
|---|---|---|
| `DATABASE_URL` | **yes** | Nothing works; `/health` returns 503 and says so |
| `JWT_SECRET` | **yes** | Sign-in throws on first use |
| `ANTHROPIC_API_KEY` **or** `GOOGLE_API_KEY` **or** `GROQ_API_KEY` | no | Agents run their deterministic paths — itineraries still build and book, you just lose the generated prose. Set any one; Gemini and Groq are free and need no card. `LLM_PROVIDER` forces the choice, `LLM_MODEL` the model |
| `WHATSAPP_APP_SECRET` | no | The webhook rejects every inbound message (it fails closed by design) |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | no | Replies are logged to the console instead of sent; photos are not downloaded |
| `WHATSAPP_VERIFY_TOKEN` | no | Meta's subscription handshake fails |
| `PUBLIC_BASE_URL` | no | Defaults to `http://localhost:$PORT` for photo URLs — set it when tunnelling |

Never commit `.env`. Share real keys over a password manager, not the repo.

## Tests

```bash
cd server && npm test
```

Runs the whole demo script — plan a trip, book it, re-plan it, read the host and government dashboards, onboard a listing over WhatsApp — against Postgres running **in-process** (PGlite), so it needs no Docker and no network. Also covers the access-control paths: another tourist's trip 404s, another host's dashboard 403s, government endpoints reject tourists.

Two things the suite cannot cover, both noted in [`server/test/loop.test.js`](server/test/loop.test.js): PGlite ships no pgvector, so the embedding columns become `text` there, and the LangGraph checkpointer falls back to in-memory. Both have since been verified by hand against a real Neon database — `CREATE EXTENSION vector` applies, and `PostgresSaver` writes checkpoints per WhatsApp thread.

## WhatsApp onboarding (the differentiator)

1. Create a Meta app, add the WhatsApp product, and copy the test number's `phone_number_id` and access token.
2. Expose the local server: `ngrok http 8000`.
3. In the Meta console set the callback to `https://<tunnel>/webhooks/whatsapp` with your `WHATSAPP_VERIFY_TOKEN`, and subscribe to `messages`.
4. Register every phone that will message it — a test number only talks to 5 pre-registered recipients.

The webhook verifies `X-Hub-Signature-256` against `WHATSAPP_APP_SECRET` over the raw request body, and **fails closed**: with no secret configured, nothing is accepted.

</details>

## Original problem statement

[`.agent/Design12.pdf`](.agent/Design12.pdf)
