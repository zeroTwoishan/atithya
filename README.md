# Bhraman

An agentic AI platform to digitize India's invisible tourism economy — Smart India Hackathon, Problem Statement 26204 (AICTE).

## Docs

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/TRD.md`](docs/TRD.md) — technical requirements & architecture
- [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md) — data model (ERD + schema + Django models)
- [`docs/UI_UX_DESIGN.md`](docs/UI_UX_DESIGN.md) — design system + screen mockups (`docs/screens/`)
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) — 36-hour hackathon build plan

## Stack

React 19 + Vite + Tailwind v4 + Phosphor Icons (frontend) · Django 6 + DRF (backend) · LangGraph + Anthropic Claude (agents) · PostgreSQL + pgvector · Twilio WhatsApp Sandbox.

The repo is scaffolded (`server/`, `client/`) — real feature work (agents, wired-up screens, seed data) happens on hackathon day, see `docs/BUILD_PLAN.md` for the hour-by-hour plan.

## Getting Started

```bash
# Database (Postgres + pgvector)
docker compose up -d

# Backend
cd server
python -m venv venv && ./venv/Scripts/activate  # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env                             # fill in real keys before hackathon day
python manage.py migrate
python manage.py create_demo_users
python manage.py seed_demo_data
python manage.py createsuperuser                 # for /admin/
python manage.py runserver

# Frontend (separate terminal)
cd client
npm install
cp .env.example .env
npm run dev
```

Backend on `http://localhost:8000` (DRF browsable API + `/admin/`), frontend on `http://localhost:5173`.

## Original problem statement

[`.agent/Bhraman_SIH_Project_Document.md`](.agent/Bhraman_SIH_Project_Document.md)
