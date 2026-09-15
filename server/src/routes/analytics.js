/** docs/TRD.md §4 — read-mostly aggregates over listings/bookings/reviews.
 *  Every number the host and government screens show is computed here; none
 *  of it is stored (docs/BACKEND_SCHEMA.md §2 — no gov_metrics table). */
import { Router } from "express";

import { query } from "../db/index.js";
import { ok, fail, route } from "../http.js";
import { requireRole } from "../auth.js";
import { ROLE, LISTING_STATUS, BOOKING_STATUS } from "../constants.js";

const router = Router();

/** A host sees only their own dashboard; gov sees any (aggregate oversight is
 *  its whole purpose). Anyone else gets 403 before a row is read. */
function canViewHost(req, res) {
  if (req.user.role === ROLE.GOV || req.user.id === req.params.id) return true;
  fail(res, 403, "forbidden", "That dashboard belongs to another host.");
  return false;
}

router.get(
  "/hosts/:id/dashboard",
  route(async (req, res) => {
    if (!canViewHost(req, res)) return;
    const hostId = req.params.id;

    // The four tiles on the deck's host portal: properties, stays this month,
    // occupancy, gross payout.
    const [listings, bookings, reviews, payouts] = await Promise.all([
      query(
        `SELECT status, count(*)::int AS count FROM listings WHERE host_user_id = $1 GROUP BY status`,
        [hostId],
      ),
      query(
        `SELECT count(*)::int AS bookings, coalesce(sum(b.total_price), 0) AS gross,
                coalesce(sum(b.quantity), 0)::int AS nights_sold
           FROM bookings b JOIN listings l ON l.id = b.listing_id
          WHERE l.host_user_id = $1 AND b.status <> $2
            AND b.created_at >= date_trunc('month', now())`,
        [hostId, BOOKING_STATUS.CANCELLED],
      ),
      query(
        `SELECT round(avg(r.rating)::numeric, 2) AS rating, count(*)::int AS count
           FROM reviews r JOIN listings l ON l.id = r.listing_id
          WHERE l.host_user_id = $1`,
        [hostId],
      ),
      query(
        `SELECT id, amount, period_start, period_end, status FROM payouts
          WHERE host_user_id = $1 ORDER BY period_end DESC LIMIT 6`,
        [hostId],
      ),
    ]);

    const byStatus = Object.fromEntries(listings.rows.map((row) => [row.status, row.count]));
    const liveListings = byStatus[LISTING_STATUS.LIVE] ?? 0;
    const daysElapsed = new Date().getDate();
    // Occupancy = nights actually sold / nights that were on offer so far this
    // month. No live listing means no denominator, not a divide-by-zero.
    const capacity = liveListings * daysElapsed;

    ok(res, {
      listings: {
        total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
        live: liveListings,
        needs_review: byStatus[LISTING_STATUS.NEEDS_REVIEW] ?? 0,
        pending_verification: byStatus[LISTING_STATUS.PENDING_VERIFICATION] ?? 0,
      },
      this_month: {
        bookings: bookings.rows[0].bookings,
        nights_sold: bookings.rows[0].nights_sold,
        gross_payout: Number(bookings.rows[0].gross),
        occupancy_rate: capacity ? Math.round((bookings.rows[0].nights_sold / capacity) * 1000) / 10 : 0,
      },
      rating: { average: reviews.rows[0].rating ? Number(reviews.rows[0].rating) : null, count: reviews.rows[0].count },
      payouts: payouts.rows,
    });
  }),
);

router.get(
  "/hosts/:id/pricing-suggestions",
  route(async (req, res) => {
    if (!canViewHost(req, res)) return;
    // Computed live against the regional median for the same offering type —
    // no stored suggestions table (docs/BACKEND_SCHEMA.md §2).
    const { rows } = await query(
      `SELECT l.id, l.title, l.price_amount, l.region, l.offering_type,
              peers.median_price, peers.peer_count
         FROM listings l
         JOIN LATERAL (
              SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY p.price_amount) AS median_price,
                     count(*)::int AS peer_count
                FROM listings p
               WHERE p.region = l.region AND p.offering_type = l.offering_type
                 AND p.id <> l.id AND p.status = $2
         ) peers ON true
        WHERE l.host_user_id = $1 AND l.status = $2`,
      [req.params.id, LISTING_STATUS.LIVE],
    );

    const suggestions = rows.map((row) => {
      const median = row.median_price === null ? null : Number(row.median_price);
      // Fewer than 2 peers is not a market — say so instead of inventing one.
      if (median === null || row.peer_count < 2) {
        return { ...row, suggested_price: null, reason: "Not enough comparable listings in this region yet." };
      }
      const delta = Math.round(((row.price_amount - median) / median) * 100);
      if (Math.abs(delta) <= 10) {
        return { ...row, suggested_price: row.price_amount, reason: `In line with the regional median (₹${Math.round(median)}).` };
      }
      return {
        ...row,
        suggested_price: Math.round(median),
        reason:
          delta > 0
            ? `Priced ${delta}% above the ₹${Math.round(median)} regional median — expect slower weekday bookings.`
            : `Priced ${Math.abs(delta)}% below the ₹${Math.round(median)} regional median — room to raise without losing demand.`,
      };
    });
    ok(res, suggestions, { count: suggestions.length });
  }),
);

router.get(
  "/gov/heatmap",
  requireRole(ROLE.GOV),
  route(async (req, res) => {
    // Rendered client-side as a stylized zone diagram, not a map library
    // (docs/TRD.md §4). One row per region = one coloured block.
    const { rows } = await query(
      `SELECT l.region,
              count(DISTINCT l.id)::int                      AS listings,
              count(b.id)::int                               AS bookings,
              coalesce(sum(b.total_price), 0)                AS revenue,
              count(DISTINCT l.host_user_id)::int            AS hosts,
              (SELECT count(*)::int FROM safety_advisories a
                WHERE a.region = l.region AND a.severity <> 'info') AS advisories
         FROM listings l
         LEFT JOIN bookings b ON b.listing_id = l.id AND b.status <> $1
        GROUP BY l.region
        ORDER BY revenue DESC`,
      [BOOKING_STATUS.CANCELLED],
    );
    const peak = Math.max(...rows.map((row) => Number(row.revenue)), 1);
    ok(
      res,
      // density is what drives the block's colour — normalised here so every
      // consumer shades the same way.
      rows.map((row) => ({ ...row, revenue: Number(row.revenue), density: Number(row.revenue) / peak })),
      { count: rows.length },
    );
  }),
);

router.get(
  "/gov/scheme-metrics",
  requireRole(ROLE.GOV),
  route(async (req, res) => {
    const [totals, monthly, growth] = await Promise.all([
      query(
        `SELECT coalesce(sum(total_price), 0) AS rural_income, count(*)::int AS bookings
           FROM bookings WHERE status <> $1`,
        [BOOKING_STATUS.CANCELLED],
      ),
      query(
        `SELECT to_char(date_trunc('month', b.created_at), 'YYYY-MM') AS month,
                count(*)::int AS bookings, coalesce(sum(b.total_price), 0) AS revenue
           FROM bookings b WHERE b.status <> $1
          GROUP BY 1 ORDER BY 1`,
        [BOOKING_STATUS.CANCELLED],
      ),
      query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, count(*)::int AS listings
           FROM listings GROUP BY 1 ORDER BY 1`,
      ),
    ]);
    const hosts = await query("SELECT count(*)::int AS count FROM users WHERE role = $1", [ROLE.HOST]);

    ok(res, {
      rural_income: Number(totals.rows[0].rural_income),
      bookings: totals.rows[0].bookings,
      hosts_onboarded: hosts.rows[0].count,
      monthly_revenue: monthly.rows.map((row) => ({ ...row, revenue: Number(row.revenue) })),
      homestay_growth: growth.rows,
    });
  }),
);

export default router;
