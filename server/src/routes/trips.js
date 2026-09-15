/** docs/TRD.md §4 — /trips, /trips/:id, /trips/:id/book, /trips/:id/replan */
import { Router } from "express";
import { z } from "zod";

import { query, transaction } from "../db/index.js";
import { ok, created, fail, route, parseBody } from "../http.js";
import { requireRole } from "../auth.js";
import { ROLE, TRIP_STATUS, BOOKING_STATUS, WALLET_TXN_TYPE } from "../constants.js";
import { run, TASK } from "../agents/supervisor.js";
import { daysBetween } from "../planner.js";

const router = Router();

const tripInput = z
  .object({
    budget: z.number().positive().max(99_999_999),
    interests: z.array(z.string().min(1).max(60)).max(20).default([]),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
  })
  .refine((trip) => trip.end_date >= trip.start_date, {
    message: "end_date must be on or after start_date",
    path: ["end_date"],
  });

/** A trip is private to the tourist who created it. Loads it and 404s on
 *  anyone else's — not 403, which would confirm the id exists. */
async function loadOwnTrip(req, res) {
  const { rows } = await query(
    `SELECT id, tourist_user_id, budget, interests, start_date, end_date, status, created_at
       FROM trips WHERE id = $1 AND tourist_user_id = $2`,
    [req.params.id, req.user.id],
  );
  if (!rows[0]) {
    fail(res, 404, "not_found", "No such trip.");
    return null;
  }
  return rows[0];
}

/** The trip plus its stops, each with the listing/site detail the timeline
 *  screen renders — one round trip instead of N follow-up fetches. */
async function tripWithItinerary(tripId) {
  const trip = await query(
    `SELECT id, tourist_user_id, budget, interests, start_date, end_date, status, created_at
       FROM trips WHERE id = $1`,
    [tripId],
  );
  const items = await query(
    `SELECT i.id, i.day_number, i.sequence, i.item_type, i.notes, i.start_time, i.end_time,
            to_jsonb(l) - 'embedding' AS listing,
            to_jsonb(k) - 'embedding' AS known_site
       FROM itinerary_items i
       LEFT JOIN listings    l ON l.id = i.listing_id
       LEFT JOIN known_sites k ON k.id = i.known_site_id
      WHERE i.trip_id = $1
      ORDER BY i.day_number, i.sequence`,
    [tripId],
  );
  const regions = [
    ...new Set(items.rows.map((item) => item.listing?.region ?? item.known_site?.region).filter(Boolean)),
  ];
  // Safety pulse for exactly the regions on this itinerary (deck p3/p5).
  const advisories = regions.length
    ? await query(
        `SELECT id, region, category, message, severity FROM safety_advisories
          WHERE region = ANY($1) ORDER BY severity DESC, created_at DESC`,
        [regions],
      )
    : { rows: [] };

  const stay = items.rows.find((item) => item.listing)?.listing;
  const days = daysBetween(trip.rows[0].start_date, trip.rows[0].end_date);
  return {
    ...trip.rows[0],
    days,
    estimated_cost: stay ? stay.price_amount * days : 0,
    itinerary_items: items.rows,
    advisories: advisories.rows,
  };
}

router.get(
  "/trips",
  route(async (req, res) => {
    const { rows } = await query(
      `SELECT id, budget, interests, start_date, end_date, status, created_at
         FROM trips WHERE tourist_user_id = $1 ORDER BY created_at DESC`,
      [req.user.id],
    );
    ok(res, rows, { count: rows.length });
  }),
);

router.post(
  "/trips",
  requireRole(ROLE.TOURIST),
  route(async (req, res) => {
    const body = parseBody(tripInput, req, res);
    if (!body) return;

    const { rows } = await query(
      `INSERT INTO trips (tourist_user_id, budget, interests, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5)
       RETURNING id, tourist_user_id, budget, interests, start_date, end_date, status, created_at`,
      [req.user.id, body.budget, body.interests, body.start_date, body.end_date],
    );
    const { narrative } = await run(TASK.PLAN, { trip: rows[0] });
    created(res, { ...(await tripWithItinerary(rows[0].id)), narrative });
  }),
);

router.get(
  "/trips/:id",
  route(async (req, res) => {
    const trip = await loadOwnTrip(req, res);
    if (!trip) return;
    ok(res, await tripWithItinerary(trip.id));
  }),
);

router.patch(
  "/trips/:id",
  route(async (req, res) => {
    const trip = await loadOwnTrip(req, res);
    if (!trip) return;
    if (trip.status !== TRIP_STATUS.PLANNING) {
      return fail(res, 409, "already_booked", `Trip is ${trip.status} — edit it before booking.`);
    }
    const body = parseBody(tripInput.partial(), req, res);
    if (!body) return;

    const entries = Object.entries(body);
    if (!entries.length) return fail(res, 422, "empty_update", "No fields to update.");
    // Column names come from the zod shape, never from caller-supplied keys.
    const assignments = entries.map(([column], index) => `${column} = $${index + 2}`);
    const { rows } = await query(
      `UPDATE trips SET ${assignments.join(", ")} WHERE id = $1
       RETURNING id, tourist_user_id, budget, interests, start_date, end_date, status, created_at`,
      [trip.id, ...entries.map(([, value]) => value)],
    );
    // Budget/dates/interests changed — replan rather than patch stops around.
    const { narrative } = await run(TASK.PLAN, { trip: rows[0] });
    ok(res, { ...(await tripWithItinerary(trip.id)), narrative });
  }),
);

router.post(
  "/trips/:id/book",
  requireRole(ROLE.TOURIST),
  route(async (req, res) => {
    const trip = await loadOwnTrip(req, res);
    if (!trip) return;
    if (trip.status !== TRIP_STATUS.PLANNING) {
      return fail(res, 409, "already_booked", `Trip is already ${trip.status}.`);
    }

    const days = daysBetween(trip.start_date, trip.end_date);
    const { rows: listings } = await query(
      `SELECT DISTINCT l.id, l.price_amount FROM itinerary_items i
         JOIN listings l ON l.id = i.listing_id
        WHERE i.trip_id = $1`,
      [trip.id],
    );
    if (!listings.length) {
      return fail(res, 400, "nothing_to_book", "This itinerary has no bookable listing.");
    }

    // Mock money, real ledger shape (docs/BACKEND_SCHEMA.md §2) — bookings,
    // the wallet debit and the status flip land together or not at all.
    const result = await transaction(async (client) => {
      const bookings = [];
      for (const listing of listings) {
        const { rows } = await client.query(
          `INSERT INTO bookings (trip_id, listing_id, quantity, unit_price, total_price, status)
             VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING id, trip_id, listing_id, quantity, unit_price, total_price, status, created_at`,
          [trip.id, listing.id, days, listing.price_amount, listing.price_amount * days, BOOKING_STATUS.CONFIRMED],
        );
        bookings.push(rows[0]);
      }
      const total = bookings.reduce((sum, booking) => sum + booking.total_price, 0);
      await client.query(
        "INSERT INTO wallet_transactions (tourist_user_id, trip_id, amount, type) VALUES ($1,$2,$3,$4)",
        [req.user.id, trip.id, total, WALLET_TXN_TYPE.DEBIT],
      );
      await client.query("UPDATE trips SET status = $2 WHERE id = $1", [trip.id, TRIP_STATUS.CONFIRMED]);
      return { bookings, total };
    });

    created(res, { trip: await tripWithItinerary(trip.id), ...result });
  }),
);

router.post(
  "/trips/:id/replan",
  requireRole(ROLE.TOURIST),
  route(async (req, res) => {
    const trip = await loadOwnTrip(req, res);
    if (!trip) return;

    const body = parseBody(
      z.object({
        disruption: z.string().min(3).max(300),
        from_day: z.number().int().positive().max(60).default(2),
      }),
      req,
      res,
    );
    if (!body) return;

    const { narrative, fromDay } = await run(TASK.REPLAN, {
      trip,
      disruption: body.disruption,
      fromDay: body.from_day,
    });
    ok(res, { ...(await tripWithItinerary(trip.id)), narrative, replanned_from_day: fromDay });
  }),
);

export default router;
