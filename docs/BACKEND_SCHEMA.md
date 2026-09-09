# Bhraman — Backend Schema

**Companion to [[TRD]]** · PostgreSQL 16 + `pgvector`, accessed via Django's ORM · Single init migration (no production data yet, so no expand-contract/zero-downtime ceremony — see `ponytail` note below).

> This is the first migration for a project with no prod data, so every column can be added with real constraints up front instead of the nullable-then-backfill dance zero-downtime migrations need. That pattern is documented in `docs/BACKEND_SCHEMA.md#phase-2-migration-notes` for when the schema needs to change under live data.

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ LISTINGS : hosts
    USERS ||--o{ TRIPS : plans
    USERS ||--o{ CONVERSATION_STATE : "onboards via"
    USERS ||--o{ WALLET_TRANSACTIONS : spends
    USERS ||--o{ PAYOUTS : receives
    LISTINGS ||--o{ ITINERARY_ITEMS : "included in"
    LISTINGS ||--o{ BOOKINGS : "booked as"
    LISTINGS ||--o{ REVIEWS : receives
    KNOWN_SITES ||--o{ ITINERARY_ITEMS : "included in"
    TRIPS ||--o{ ITINERARY_ITEMS : contains
    TRIPS ||--o{ BOOKINGS : produces
    TRIPS ||--o{ WALLET_TRANSACTIONS : charges
    BOOKINGS ||--o{ REVIEWS : "reviewed via"

    USERS {
        uuid id PK
        text role
        text phone
        text name
        text language
        timestamptz created_at
    }
    LISTINGS {
        uuid id PK
        uuid host_user_id FK
        text offering_type
        text title
        text description
        numeric price_amount
        text price_unit
        text region
        jsonb availability
        text[] photo_urls
        vector embedding
        text status
        text verification_notes
        timestamptz created_at
    }
    KNOWN_SITES {
        uuid id PK
        text name
        text region
        text category
        vector embedding
    }
    CONVERSATION_STATE {
        uuid id PK
        text whatsapp_number
        uuid host_user_id FK
        jsonb state
        timestamptz last_message_at
    }
    TRIPS {
        uuid id PK
        uuid tourist_user_id FK
        numeric budget
        text[] interests
        date start_date
        date end_date
        text status
    }
    ITINERARY_ITEMS {
        uuid id PK
        uuid trip_id FK
        int day_number
        int sequence
        text item_type
        uuid listing_id FK
        uuid known_site_id FK
    }
    BOOKINGS {
        uuid id PK
        uuid trip_id FK
        uuid listing_id FK
        int quantity
        numeric total_price
        text status
    }
    WALLET_TRANSACTIONS {
        uuid id PK
        uuid tourist_user_id FK
        uuid trip_id FK
        numeric amount
        text type
    }
    PAYOUTS {
        uuid id PK
        uuid host_user_id FK
        numeric amount
        text status
    }
    REVIEWS {
        uuid id PK
        uuid booking_id FK
        uuid listing_id FK
        int rating
        text comment
    }
    SAFETY_ADVISORIES {
        uuid id PK
        text region
        text category
        text message
        text severity
    }
```

## 2. Design Notes

- **One `users` table with a `role` enum** rather than separate host/tourist/gov tables — a real person could plausibly be both a tourist and a host, and splitting identity from role-specific data avoids a duplicate-identity problem later. Role-specific fields live on the tables that actually need them (`listings.host_user_id`, `trips.tourist_user_id`), not on `users` itself.
- **`listings.embedding` (pgvector)** powers the Planning Agent's semantic retrieval (`retrieve_candidates` node in [[TRD]] §3.2) — cosine similarity against the tourist's stated interests.
- **No separate `pricing_suggestions` table.** The AI pricing copilot (`GET /api/v1/hosts/:id/pricing-suggestions`) computes a suggestion live from `listings` + `bookings` (regional median price for the same `offering_type`/`region`) — storing it would just be a cache with nothing yet to invalidate against. Add a table only if computing it live becomes measurably slow.
- **No separate `gov_metrics` table.** The government dashboard's heatmap and scheme metrics are aggregate `GROUP BY` queries over `bookings`/`listings`/`reviews` — same reasoning as above.
- **`conversation_state.state` is `jsonb`**, not a fixed set of columns, because the onboarding conversation's shape (what's been asked, what's still missing) changes agent-side without needing a migration every time the conversation graph changes.
- **Mock money, real ledger shape.** `wallet_transactions` and `payouts` are structured exactly like a real ledger (append-only, typed) even though no payment gateway is wired up — swapping in Razorpay/Stripe later is an integration change, not a schema change.

## 3. `schema.sql`

```sql
-- Bhraman initial schema — single init migration, PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('host', 'tourist', 'gov');
CREATE TYPE offering_type AS ENUM ('homestay', 'guide', 'artisan_experience', 'other');
CREATE TYPE price_unit AS ENUM ('night', 'person', 'experience');
CREATE TYPE listing_status AS ENUM ('pending_verification', 'needs_review', 'live', 'inactive');
CREATE TYPE trip_status AS ENUM ('planning', 'confirmed', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'cancelled');
CREATE TYPE itinerary_item_type AS ENUM ('known_site', 'listing');
CREATE TYPE wallet_txn_type AS ENUM ('debit', 'refund');
CREATE TYPE payout_status AS ENUM ('pending', 'paid');
CREATE TYPE advisory_severity AS ENUM ('info', 'caution', 'warning');

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role         user_role NOT NULL,
    phone        TEXT UNIQUE,
    name         TEXT NOT NULL,
    language     TEXT NOT NULL DEFAULT 'hi',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE known_sites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    region      TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    embedding   vector(1536)
);

CREATE TABLE listings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id        UUID NOT NULL REFERENCES users(id),
    offering_type       offering_type NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    price_amount        NUMERIC(10,2) NOT NULL,
    price_unit          price_unit NOT NULL,
    region              TEXT NOT NULL,
    lat                 DOUBLE PRECISION,
    lng                 DOUBLE PRECISION,
    availability        JSONB NOT NULL DEFAULT '{}',
    photo_urls          TEXT[] NOT NULL DEFAULT '{}',
    embedding           vector(1536),
    status              listing_status NOT NULL DEFAULT 'pending_verification',
    verification_notes  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listings_host ON listings (host_user_id);
CREATE INDEX idx_listings_status_region ON listings (status, region);

CREATE TABLE conversation_state (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_number  TEXT NOT NULL UNIQUE,
    host_user_id     UUID REFERENCES users(id),
    state            JSONB NOT NULL DEFAULT '{}',
    last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trips (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_user_id  UUID NOT NULL REFERENCES users(id),
    budget           NUMERIC(10,2) NOT NULL,
    interests        TEXT[] NOT NULL DEFAULT '{}',
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    status           trip_status NOT NULL DEFAULT 'planning',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_tourist ON trips (tourist_user_id);

CREATE TABLE itinerary_items (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number     INT NOT NULL,
    sequence       INT NOT NULL,
    item_type      itinerary_item_type NOT NULL,
    listing_id     UUID REFERENCES listings(id),
    known_site_id  UUID REFERENCES known_sites(id),
    notes          TEXT,
    start_time     TIME,
    end_time       TIME,
    CHECK (
        (item_type = 'listing' AND listing_id IS NOT NULL AND known_site_id IS NULL) OR
        (item_type = 'known_site' AND known_site_id IS NOT NULL AND listing_id IS NULL)
    )
);
CREATE INDEX idx_itinerary_trip ON itinerary_items (trip_id, day_number, sequence);

CREATE TABLE bookings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id      UUID NOT NULL REFERENCES trips(id),
    listing_id   UUID NOT NULL REFERENCES listings(id),
    quantity     INT NOT NULL DEFAULT 1,
    unit_price   NUMERIC(10,2) NOT NULL,
    total_price  NUMERIC(10,2) NOT NULL,
    status       booking_status NOT NULL DEFAULT 'confirmed',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_listing ON bookings (listing_id);
CREATE INDEX idx_bookings_trip ON bookings (trip_id);

CREATE TABLE wallet_transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_user_id  UUID NOT NULL REFERENCES users(id),
    trip_id          UUID REFERENCES trips(id),
    amount           NUMERIC(10,2) NOT NULL,
    type             wallet_txn_type NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id  UUID NOT NULL REFERENCES users(id),
    amount        NUMERIC(10,2) NOT NULL,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    status        payout_status NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id   UUID NOT NULL REFERENCES bookings(id),
    listing_id   UUID NOT NULL REFERENCES listings(id),
    rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_listing ON reviews (listing_id);

CREATE TABLE safety_advisories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region     TEXT NOT NULL,
    category   TEXT NOT NULL,
    message    TEXT NOT NULL,
    severity   advisory_severity NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_advisories_region ON safety_advisories (region);
```

## 4. Django Models

`schema.sql` above stays the canonical contract (it's what the ERD and every other doc reference) — but the app talks to Postgres through Django's ORM, not raw SQL, per [[TRD]] §2. Two mechanical translation notes so the models don't drift from the diagram:

- **Migrations, not `psql < schema.sql`.** Write the models below per Django app (`listings.models.Listing`, `trips.models.Trip`, etc.), then `manage.py makemigrations && manage.py migrate` generates the actual DDL. The hand-written `schema.sql` in §3 is the design reference the team agreed on — if a model's `makemigrations` output diverges from it, that's a signal to double check which one is wrong, not to silently let them drift apart.
- **pgvector needs one extra package.** `pip install pgvector` gives `pgvector.django.VectorField` — use it for `Listing.embedding` and `KnownSite.embedding` exactly where §3 has `vector(1536)`. Register `pgvector.django` in `INSTALLED_APPS` and enable the extension via a migration's `AddExtension` operation (or a raw-SQL migration for `CREATE EXTENSION IF NOT EXISTS pgvector`) — Django won't do this on its own.
- **Enums become `TextChoices`.** Every Postgres `ENUM` in §3 (`user_role`, `listing_status`, `trip_status`, …) maps to a `models.TextChoices` class on the owning model, with `choices=...` on the field — this is the standard Django pattern and keeps the enum values identical to §3 rather than reinventing them as free-text.

Example — `listings.models.Listing`, showing the pattern the rest of the models follow:

```python
from django.db import models
from pgvector.django import VectorField
import uuid

class Listing(models.Model):
    class OfferingType(models.TextChoices):
        HOMESTAY = "homestay"
        GUIDE = "guide"
        ARTISAN_EXPERIENCE = "artisan_experience"
        OTHER = "other"

    class Status(models.TextChoices):
        PENDING_VERIFICATION = "pending_verification"
        NEEDS_REVIEW = "needs_review"
        LIVE = "live"
        INACTIVE = "inactive"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="listings")
    offering_type = models.CharField(max_length=32, choices=OfferingType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price_amount = models.DecimalField(max_digits=10, decimal_places=2)
    price_unit = models.CharField(max_length=16)  # TextChoices, per §3 price_unit enum
    region = models.CharField(max_length=255)
    availability = models.JSONField(default=dict)
    photo_urls = models.JSONField(default=list)  # Postgres TEXT[] -> JSONField is the pragmatic Django mapping
    embedding = VectorField(dimensions=1536, null=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING_VERIFICATION)
    verification_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["status", "region"])]
```

## 5. Seed Data Needed for the Demo (not schema, but required to make the 3 dashboards non-empty on stage)

- 15–20 `known_sites` rows across 2–3 regions (so the itinerary isn't 100% agent-onboarded content).
- 5–10 pre-onboarded `listings` (so the tourist flow has inventory even before the live on-stage onboarding happens) + the live one onboarded during the demo.
- 20–30 historical `bookings`/`reviews` rows dated over the past few months (so the government dashboard's trend charts aren't a flat line).
- A handful of `safety_advisories` for the regions used in the demo itinerary.
- Write seed data as a Django management command (`manage.py seed_demo_data`), not a raw SQL script — it can reuse the real model validation instead of hand-crafting inserts that might drift from the schema.

## 6. Phase-2 Migration Notes

Once this is running with real users, schema changes follow the standard expand-contract pattern (add nullable → backfill → switch reads → drop old column), with `CREATE INDEX CONCURRENTLY` for any index added to a table that already has production rows. None of that applies to this initial migration because the table doesn't exist yet to lock.
