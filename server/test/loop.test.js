/** The core loop, end to end, against a real Postgres running in-process
 *  (PGlite). No Docker, no server, no network — so this runs anywhere and
 *  actually exercises schema.sql, seed.js and every route's SQL.
 *
 *  Two shims, both because PGlite 0.5 ships no pgvector build:
 *    - `CREATE EXTENSION vector` is dropped
 *    - `vector(1536)` columns become `text`
 *  Nothing in src/ reads or writes those columns yet (retrieval is the plain
 *  SQL filter in src/agents/planning.js), so no tested path is faked. When
 *  embeddings land, this test stops covering them — verify those against the
 *  real database.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";

import { setBackend } from "../src/db/index.js";
import { createApp } from "../src/app.js";

let pglite;
let server;
let base;

/** Adapts PGlite to the two methods src/db/index.js needs. PGlite is a single
 *  connection, so `connect()` hands back the same one — fine here: the tests
 *  are sequential, and BEGIN/COMMIT still behave. */
function adapter(db) {
  const client = {
    query: (text, params) => db.query(text, params),
    release: () => {},
  };
  // `end` is a no-op: seed.js closes the pool when it finishes, and this
  // suite still needs the database afterwards. `after()` closes PGlite.
  return { query: client.query, connect: async () => client, end: async () => {} };
}

before(async () => {
  process.env.JWT_SECRET = "test-jwt-secret";
  delete process.env.ANTHROPIC_API_KEY; // exercise the no-LLM fallback paths

  pglite = await PGlite.create({
    parsers: {
      1700: Number.parseFloat, // NUMERIC — matches the pg type parser in src/db
    },
  });
  setBackend(adapter(pglite));

  const schema = (await readFile(new URL("../src/db/schema.sql", import.meta.url), "utf8"))
    .replace(/CREATE EXTENSION IF NOT EXISTS vector;/, "")
    .replaceAll("vector(1536)", "text");
  await pglite.exec(schema);

  // seed.js runs top-level on import, against the backend set above.
  await import("../src/db/seed.js");

  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  server?.close();
  await pglite?.close();
});

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload, data: payload?.data };
}

const login = async (username) => {
  const { status, data } = await call("POST", "/auth/token", { body: { username, password: username } });
  assert.equal(status, 200, `login failed for ${username}`);
  return data;
};

// ── The demo script, in order (docs/BUILD_PLAN.md §4) ──────────

test("schema applies and the seed populates every table the demo reads", async () => {
  const counts = await pglite.query(`
    SELECT (SELECT count(*) FROM users) AS users,
           (SELECT count(*) FROM listings) AS listings,
           (SELECT count(*) FROM known_sites) AS sites,
           (SELECT count(*) FROM bookings) AS bookings,
           (SELECT count(*) FROM reviews) AS reviews,
           (SELECT count(*) FROM payouts) AS payouts,
           (SELECT count(*) FROM safety_advisories) AS advisories`);
  const row = counts.rows[0];
  assert.equal(Number(row.users), 6);
  assert.equal(Number(row.listings), 10);
  assert.equal(Number(row.sites), 16);
  assert.ok(Number(row.bookings) > 20, `expected demo booking history, got ${row.bookings}`);
  assert.ok(Number(row.reviews) > 0);
  assert.ok(Number(row.payouts) > 0);
  assert.equal(Number(row.advisories), 4);
});

test("the freshly seeded host portal matches the deck", async (t) => {
  // Slide 3/5: four properties, two live, one in review, occupancy in the
  // mid-eighties. The seed targets the *rate*, not the absolute stay count —
  // two rooms cannot sell 48 nights by the 15th (see TARGET_OCCUPANCY in
  // src/db/seed.js) — so this runs before anything else books a room.
  const { access, user } = await login("host_demo");
  const { data } = await call("GET", `/hosts/${user.id}/dashboard`, { token: access });

  assert.equal(data.listings.total, 4);
  assert.ok(
    data.this_month.occupancy_rate >= 78 && data.this_month.occupancy_rate <= 90,
    `seeded occupancy ${data.this_month.occupancy_rate}% is outside the demo band`,
  );
  t.diagnostic(
    `${data.this_month.nights_sold} nights · ₹${data.this_month.gross_payout} · ${data.this_month.occupancy_rate}%`,
  );
});

test("the three demo accounts sign in and a wrong password does not", async () => {
  for (const username of ["tourist_demo", "host_demo", "gov_demo"]) {
    const { user, access } = await login(username);
    assert.equal(user.username ?? username, username);
    assert.ok(access.split(".").length === 3, "expected a JWT");
  }
  const bad = await call("POST", "/auth/token", { body: { username: "tourist_demo", password: "wrong" } });
  assert.equal(bad.status, 401);
});

test("tourist plans a trip and the planner fills the itinerary", async (t) => {
  const { access } = await login("tourist_demo");
  const created = await call("POST", "/trips", {
    token: access,
    body: {
      budget: 15000,
      interests: ["mountains", "homestay"],
      start_date: "2026-10-18",
      end_date: "2026-10-21",
    },
  });
  assert.equal(created.status, 201, JSON.stringify(created.payload));
  const trip = created.data;

  assert.equal(trip.days, 4);
  assert.ok(trip.itinerary_items.length > 0, "planner produced no stops");
  assert.ok(trip.narrative?.length > 20, "no narrative for the chat");

  const stay = trip.itinerary_items.find((item) => item.listing);
  assert.ok(stay, "no bookable stay in the itinerary");
  assert.ok(stay.listing.price_amount * trip.days <= trip.budget, "stay blows the budget");
  assert.equal(trip.estimated_cost, stay.listing.price_amount * trip.days);

  t.diagnostic(`planned: ${stay.listing.title} · ${trip.itinerary_items.length} stops · ₹${trip.estimated_cost}`);
});

test("another tourist cannot read that trip", async () => {
  const tourist = await login("tourist_demo");
  const { data: trip } = await call("POST", "/trips", {
    token: tourist.access,
    body: { budget: 9000, interests: ["craft"], start_date: "2026-11-02", end_date: "2026-11-04" },
  });

  const host = await login("host_demo");
  const stolen = await call("GET", `/trips/${trip.id}`, { token: host.access });
  assert.equal(stolen.status, 404, "trip leaked to another account");
});

test("booking writes bookings + a wallet debit and flips the trip to confirmed", async () => {
  const { access } = await login("tourist_demo");
  const { data: trip } = await call("POST", "/trips", {
    token: access,
    body: { budget: 20000, interests: ["mountains"], start_date: "2026-12-01", end_date: "2026-12-04" },
  });

  const booked = await call("POST", `/trips/${trip.id}/book`, { token: access });
  assert.equal(booked.status, 201, JSON.stringify(booked.payload));
  assert.equal(booked.data.trip.status, "confirmed");
  assert.ok(booked.data.bookings.length > 0);
  assert.equal(booked.data.total, booked.data.bookings.reduce((sum, b) => sum + b.total_price, 0));

  const ledger = await pglite.query("SELECT amount, type FROM wallet_transactions WHERE trip_id = $1", [trip.id]);
  assert.equal(ledger.rows.length, 1);
  assert.equal(ledger.rows[0].type, "debit");
  assert.equal(Number(ledger.rows[0].amount), booked.data.total);

  // Double-booking the same trip is a conflict, not a second debit.
  const again = await call("POST", `/trips/${trip.id}/book`, { token: access });
  assert.equal(again.status, 409);
});

test("removing a stop touches only that day, and resequences it", async () => {
  const { access } = await login("tourist_demo");
  const { data: trip } = await call("POST", "/trips", {
    token: access,
    body: { budget: 16000, interests: ["mountains"], start_date: "2027-01-05", end_date: "2027-01-08" },
  });

  const target = trip.itinerary_items.find((item) => item.known_site && item.day_number === 2);
  assert.ok(target, "expected a sightseeing stop on day 2");
  const dayOneBefore = trip.itinerary_items.filter((item) => item.day_number === 1).map((item) => item.id);

  const edited = await call("PATCH", `/trips/${trip.id}/items/${target.id}`, {
    token: access,
    body: { action: "remove" },
  });
  assert.equal(edited.status, 200, JSON.stringify(edited.payload));
  assert.equal(edited.data.edited_day, 2);

  const stops = edited.data.itinerary_items;
  assert.ok(!stops.some((item) => item.id === target.id), "removed stop is still there");
  assert.deepEqual(
    stops.filter((item) => item.day_number === 1).map((item) => item.id),
    dayOneBefore,
    "day 1 must be untouched",
  );
  // Sequences stay 0,1,2… or the next insert on that day collides.
  const sequences = stops.filter((item) => item.day_number === 2).map((item) => item.sequence);
  assert.deepEqual(sequences, sequences.map((_, index) => index));
});

test("swapping a stop brings a different place, never one already on the trip", async () => {
  const { access } = await login("tourist_demo");
  const { data: trip } = await call("POST", "/trips", {
    token: access,
    body: { budget: 16000, interests: ["mountains"], start_date: "2027-02-05", end_date: "2027-02-07" },
  });

  const target = trip.itinerary_items.find((item) => item.known_site);
  const before = new Set(trip.itinerary_items.filter((i) => i.known_site).map((i) => i.known_site.id));

  const edited = await call("PATCH", `/trips/${trip.id}/items/${target.id}`, {
    token: access,
    body: { action: "swap" },
  });
  assert.equal(edited.status, 200, JSON.stringify(edited.payload));

  const swapped = edited.data.itinerary_items.find((item) => item.id === target.id);
  assert.notEqual(swapped.known_site.id, target.known_site.id, "swap returned the same place");
  assert.ok(!before.has(swapped.known_site.id), "swapped in a place already on the trip");

  const siteIds = edited.data.itinerary_items.filter((i) => i.known_site).map((i) => i.known_site.id);
  assert.equal(new Set(siteIds).size, siteIds.length, "trip now has a duplicate stop");
});

test("editing a stop on someone else's trip, or a booked one, is refused", async () => {
  const tourist = await login("tourist_demo");
  const { data: trip } = await call("POST", "/trips", {
    token: tourist.access,
    body: { budget: 16000, interests: ["mountains"], start_date: "2027-03-05", end_date: "2027-03-07" },
  });
  const stop = trip.itinerary_items[0];

  const host = await login("host_demo");
  const foreign = await call("PATCH", `/trips/${trip.id}/items/${stop.id}`, {
    token: host.access,
    body: { action: "remove" },
  });
  assert.equal(foreign.status, 403, "a host should not be able to edit a tourist's itinerary");

  await call("POST", `/trips/${trip.id}/book`, { token: tourist.access });
  const afterBooking = await call("PATCH", `/trips/${trip.id}/items/${stop.id}`, {
    token: tourist.access,
    body: { action: "remove" },
  });
  assert.equal(afterBooking.status, 409, "a booked trip must not be editable");
});

test("re-planning rebuilds only the days still ahead", async () => {
  const { access } = await login("tourist_demo");
  const { data: trip } = await call("POST", "/trips", {
    token: access,
    body: { budget: 18000, interests: ["mountains"], start_date: "2026-12-10", end_date: "2026-12-14" },
  });
  const dayOneBefore = trip.itinerary_items.filter((item) => item.day_number === 1).length;

  const replanned = await call("POST", `/trips/${trip.id}/replan`, {
    token: access,
    body: { disruption: "Landslide has closed NH-305 near Aut.", from_day: 2 },
  });
  assert.equal(replanned.status, 200, JSON.stringify(replanned.payload));
  assert.equal(replanned.data.replanned_from_day, 2);
  assert.equal(
    replanned.data.itinerary_items.filter((item) => item.day_number === 1).length,
    dayOneBefore,
    "day 1 should be untouched",
  );
});

test("host dashboard reports real occupancy, payouts and the review flag", async () => {
  const { access, user } = await login("host_demo");
  const { status, data } = await call("GET", `/hosts/${user.id}/dashboard`, { token: access });
  assert.equal(status, 200, JSON.stringify(data));

  // Structure only. The exact occupancy is asserted right after seeding,
  // before any test in this file books anything — bookings made here land on
  // the demo host's rooms and legitimately move the number.
  assert.equal(data.listings.total, 4);
  assert.equal(data.listings.live, 2);
  assert.equal(data.listings.needs_review, 1);
  assert.equal(data.listings.pending_verification, 1);
  assert.ok(data.this_month.nights_sold > 0);
  assert.ok(data.this_month.gross_payout > 0);
  assert.ok(data.this_month.occupancy_rate > 0);
  assert.ok(data.payouts.length > 0);
});

test("a host cannot open another host's dashboard, but gov can", async () => {
  const host = await login("host_demo");
  const other = await pglite.query("SELECT id FROM users WHERE username = 'devi_ram'");
  const otherId = other.rows[0].id;

  const forbidden = await call("GET", `/hosts/${otherId}/dashboard`, { token: host.access });
  assert.equal(forbidden.status, 403);

  const gov = await login("gov_demo");
  const allowed = await call("GET", `/hosts/${otherId}/dashboard`, { token: gov.access });
  assert.equal(allowed.status, 200);
});

test("pricing copilot compares against the regional median", async () => {
  const { access, user } = await login("host_demo");
  const { status, data } = await call("GET", `/hosts/${user.id}/pricing-suggestions`, { token: access });
  assert.equal(status, 200, JSON.stringify(data));
  assert.ok(data.length > 0);
  for (const suggestion of data) assert.ok(suggestion.reason?.length > 10);
});

test("government sees regional demand and scheme outcomes; a tourist does not", async () => {
  const gov = await login("gov_demo");

  const heatmap = await call("GET", "/gov/heatmap", { token: gov.access });
  assert.equal(heatmap.status, 200, JSON.stringify(heatmap.payload));
  assert.ok(heatmap.data.length >= 2, "expected several regions");
  for (const region of heatmap.data) assert.ok(region.density >= 0 && region.density <= 1);

  const metrics = await call("GET", "/gov/scheme-metrics", { token: gov.access });
  assert.equal(metrics.status, 200, JSON.stringify(metrics.payload));
  assert.ok(metrics.data.rural_income > 0);
  assert.ok(metrics.data.hosts_onboarded >= 4);
  assert.ok(metrics.data.monthly_revenue.length > 0);

  const tourist = await login("tourist_demo");
  const denied = await call("GET", "/gov/heatmap", { token: tourist.access });
  assert.equal(denied.status, 403);
});

test("verification flags a price outlier and clears a normal one", async () => {
  const { access } = await login("host_demo");

  const sane = await call("POST", "/listings", {
    token: access,
    body: {
      offering_type: "homestay",
      title: "Tirthan Riverside Room",
      description: "One room by the river.",
      price_amount: 1900,
      price_unit: "night",
      region: "Tirthan Valley, HP",
    },
  });
  assert.equal(sane.status, 201, JSON.stringify(sane.payload));
  assert.equal(sane.data.status, "live");

  const absurd = await call("POST", "/listings", {
    token: access,
    body: {
      offering_type: "homestay",
      title: "Tirthan Gold-Plated Suite",
      description: "One room by the river.",
      price_amount: 90000,
      price_unit: "night",
      region: "Tirthan Valley, HP",
    },
  });
  assert.equal(absurd.status, 201);
  assert.equal(absurd.data.status, "needs_review");
  assert.match(absurd.data.verification_notes, /standard deviation/i);
});

test("a host cannot edit another host's listing", async () => {
  const host = await login("host_demo");
  const foreign = await pglite.query(
    "SELECT l.id FROM listings l JOIN users u ON u.id = l.host_user_id WHERE u.username = 'devi_ram' LIMIT 1",
  );
  const response = await call("PATCH", `/listings/${foreign.rows[0].id}`, {
    token: host.access,
    body: { price_amount: 1 },
  });
  assert.equal(response.status, 403);
});

test("malformed payloads are rejected with 422, not a 500", async () => {
  const { access } = await login("tourist_demo");
  const bad = await call("POST", "/trips", {
    token: access,
    body: { budget: -5, interests: "not-an-array", start_date: "18-10-2026", end_date: "2026-10-21" },
  });
  assert.equal(bad.status, 422);
  assert.equal(bad.payload.error.code, "validation_error");

  const backwards = await call("POST", "/trips", {
    token: access,
    body: { budget: 5000, interests: [], start_date: "2026-10-21", end_date: "2026-10-18" },
  });
  assert.equal(backwards.status, 422);
});
