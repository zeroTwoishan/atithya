-- Atithya initial schema — single init migration, PostgreSQL 16+
-- Canonical: this file IS the migration (docs/BACKEND_SCHEMA.md §3/§4).
-- Applied by `npm run db:init`, which drops and recreates everything.

-- The pgvector extension is named `vector` — `CREATE EXTENSION pgvector` fails.
CREATE EXTENSION IF NOT EXISTS vector;
-- No uuid-ossp: gen_random_uuid() is built in from PG13, one less extension to
-- have installed on whatever Postgres the demo ends up running against.

DROP TABLE IF EXISTS reviews, safety_advisories, payouts, wallet_transactions,
    bookings, itinerary_items, trips, conversation_state, listings,
    known_sites, users CASCADE;
DROP TYPE IF EXISTS user_role, offering_type, price_unit, listing_status,
    trip_status, booking_status, itinerary_item_type, wallet_txn_type,
    payout_status, advisory_severity CASCADE;

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
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role         user_role NOT NULL,
    phone        TEXT UNIQUE,
    name         TEXT NOT NULL,
    username     TEXT NOT NULL UNIQUE,
    password     TEXT NOT NULL,
    language     TEXT NOT NULL DEFAULT 'hi',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE known_sites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    region      TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    embedding   vector(1536)
);

CREATE TABLE listings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number  TEXT NOT NULL UNIQUE,
    host_user_id     UUID REFERENCES users(id),
    state            JSONB NOT NULL DEFAULT '{}',
    last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trips (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_user_id  UUID NOT NULL REFERENCES users(id),
    trip_id          UUID REFERENCES trips(id),
    amount           NUMERIC(10,2) NOT NULL,
    type             wallet_txn_type NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id  UUID NOT NULL REFERENCES users(id),
    amount        NUMERIC(10,2) NOT NULL,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    status        payout_status NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID NOT NULL REFERENCES bookings(id),
    listing_id   UUID NOT NULL REFERENCES listings(id),
    rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_listing ON reviews (listing_id);

CREATE TABLE safety_advisories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region     TEXT NOT NULL,
    category   TEXT NOT NULL,
    message    TEXT NOT NULL,
    severity   advisory_severity NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_advisories_region ON safety_advisories (region);
