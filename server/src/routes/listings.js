/** docs/TRD.md §4 — /listings, /listings/:id, /listings/:id/verify, /known-sites */
import { Router } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import { ok, created, fail, route, parseBody } from "../http.js";
import { requireRole } from "../auth.js";
import { LISTING_STATUS, OFFERING_TYPE, PRICE_UNIT, ROLE } from "../constants.js";
import { runVerification } from "../agents/verification.js";

const router = Router();

const LISTING_COLUMNS = `id, host_user_id, offering_type, title, description, price_amount,
  price_unit, region, lat, lng, availability, photo_urls, status, verification_notes,
  created_at, updated_at`;

const listingInput = z.object({
  offering_type: z.enum(Object.values(OFFERING_TYPE)),
  title: z.string().min(3).max(255),
  description: z.string().max(4000).default(""),
  price_amount: z.number().positive().max(99_999_999),
  price_unit: z.enum(Object.values(PRICE_UNIT)),
  region: z.string().min(2).max(255),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  availability: z.record(z.string(), z.unknown()).default({}),
  photo_urls: z.array(z.string().url()).default([]),
});

router.get(
  "/listings",
  route(async (req, res) => {
    // Whitelisted filters only — the column names are literals here, never
    // interpolated from req.query, so there is nothing to inject into.
    const filters = [];
    const values = [];
    for (const [param, column] of [
      ["status", "status"],
      ["region", "region"],
      ["offering_type", "offering_type"],
      ["host", "host_user_id"],
    ]) {
      if (req.query[param]) {
        values.push(req.query[param]);
        filters.push(`${column} = $${values.length}`);
      }
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT ${LISTING_COLUMNS} FROM listings ${where} ORDER BY created_at DESC`,
      values,
    );
    ok(res, rows, { count: rows.length });
  }),
);

router.get(
  "/listings/:id",
  route(async (req, res) => {
    const { rows } = await query(`SELECT ${LISTING_COLUMNS} FROM listings WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return fail(res, 404, "not_found", "No such listing.");
    ok(res, rows[0]);
  }),
);

router.post(
  "/listings",
  requireRole(ROLE.HOST),
  route(async (req, res) => {
    const body = parseBody(listingInput, req, res);
    if (!body) return;
    // host_user_id is always the caller — never read from the payload, or any
    // host could create listings under another host's account.
    const { rows } = await query(
      `INSERT INTO listings (host_user_id, offering_type, title, description, price_amount,
         price_unit, region, lat, lng, availability, photo_urls)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING ${LISTING_COLUMNS}`,
      [
        req.user.id, body.offering_type, body.title, body.description, body.price_amount,
        body.price_unit, body.region, body.lat ?? null, body.lng ?? null,
        body.availability, body.photo_urls,
      ],
    );
    created(res, await runVerification(rows[0]));
  }),
);

router.patch(
  "/listings/:id",
  requireRole(ROLE.HOST),
  route(async (req, res) => {
    const body = parseBody(listingInput.partial(), req, res);
    if (!body) return;

    const owned = await query("SELECT host_user_id FROM listings WHERE id = $1", [req.params.id]);
    if (!owned.rows[0]) return fail(res, 404, "not_found", "No such listing.");
    if (owned.rows[0].host_user_id !== req.user.id) {
      return fail(res, 403, "forbidden", "That listing belongs to another host.");
    }

    const entries = Object.entries(body);
    if (!entries.length) return fail(res, 422, "empty_update", "No fields to update.");
    // Keys come from the zod schema's own shape, so a caller cannot smuggle a
    // column name (host_user_id, status) in through the body.
    const assignments = entries.map(([column], index) => `${column} = $${index + 2}`);
    const { rows } = await query(
      `UPDATE listings SET ${assignments.join(", ")}, updated_at = now()
       WHERE id = $1 RETURNING ${LISTING_COLUMNS}`,
      [req.params.id, ...entries.map(([, value]) => value)],
    );
    // A price or description edit invalidates the previous verdict.
    ok(res, await runVerification(rows[0]));
  }),
);

router.post(
  "/listings/:id/verify",
  requireRole(ROLE.HOST),
  route(async (req, res) => {
    const { rows } = await query(`SELECT ${LISTING_COLUMNS} FROM listings WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return fail(res, 404, "not_found", "No such listing.");
    if (rows[0].host_user_id !== req.user.id) {
      return fail(res, 403, "forbidden", "That listing belongs to another host.");
    }
    ok(res, await runVerification(rows[0]));
  }),
);

router.get(
  "/known-sites",
  route(async (req, res) => {
    const { rows } = await query(
      "SELECT id, name, region, category, description, lat, lng FROM known_sites ORDER BY name",
    );
    ok(res, rows, { count: rows.length });
  }),
);

router.get(
  "/advisories",
  route(async (req, res) => {
    // The tourist trip view's safety pulse (deck p3/p5) matches advisories to
    // the regions on the itinerary; unfiltered is the whole board.
    const region = req.query.region;
    const { rows } = await query(
      region
        ? "SELECT id, region, category, message, severity, created_at FROM safety_advisories WHERE region = $1 ORDER BY created_at DESC"
        : "SELECT id, region, category, message, severity, created_at FROM safety_advisories ORDER BY created_at DESC",
      region ? [region] : [],
    );
    ok(res, rows, { count: rows.length });
  }),
);

export { LISTING_COLUMNS, LISTING_STATUS };
export default router;
