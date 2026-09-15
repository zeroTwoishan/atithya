# Atithya

An agentic AI platform to digitize India's invisible tourism economy — Smart India Hackathon, Problem Statement 26204 (AICTE).

## Docs

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/TRD.md`](docs/TRD.md) — technical requirements & architecture
- [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md) — data model (ERD + `schema.sql` + data-access notes)
- [`docs/UI_UX_DESIGN.md`](docs/UI_UX_DESIGN.md) — design system + screen mockups (`docs/screens/`)
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) — 36-hour hackathon build plan

## Stack

React 19 + Vite + Tailwind v4 + Phosphor Icons (frontend) · Node.js 20 + Express 5 (backend) · LangGraph.js + Anthropic Claude (agents) · PostgreSQL 16 + pgvector · WhatsApp Cloud API.

The repo is scaffolded (`server/`, `client/`) — real feature work (agents, wired-up screens, seed data) happens on hackathon day, see `docs/BUILD_PLAN.md` for the hour-by-hour plan.

## Getting Started

```bash
# Database (Postgres + pgvector)
docker compose up -d

# Backend
cd server
npm install
cp .env.example .env    # fill in real keys before hackathon day
npm run db:init         # applies src/db/schema.sql (drops and recreates)
npm run db:seed         # demo users + known sites + listings + history
npm run dev

# Frontend (separate terminal)
cd client
npm install
cp .env.example .env
npm run dev
```

Backend on `http://localhost:8000`, frontend on `http://localhost:5173`.

## Original problem statement

[`.agent/Atithya_SIH_Project_Document.md`](.agent/Atithya_SIH_Project_Document.md)
