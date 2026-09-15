/** Pure itinerary composition — no DB, no LLM, no I/O, so it is unit-testable
 *  (test/planner.test.js) and deterministic on stage.
 *
 *  docs/TRD.md §3.2 `compose_itinerary`. The agent in src/agents/planning.js
 *  wraps this: retrieval and the host-facing prose are its job, the actual
 *  day-by-day structure is decided here, where a wrong answer is a failing
 *  test rather than a bad generation nobody notices until the demo.
 */

import { ITEM_TYPE } from "./constants.js";

export const SITES_PER_DAY = 2;

/**
 * @param {number} days      nights + 1, from the trip's date range
 * @param {number} budget    total rupees for the whole trip
 * @param {Array}  stays     live listings, cheapest first
 * @param {Array}  sites     known sites, already ordered by relevance
 * @returns {Array} itinerary_items rows (minus trip_id), in insertion order
 */
export function composeItinerary(days, budget, stays, sites) {
  if (!Number.isInteger(days) || days < 1) return [];

  const stay = pickStay(days, budget, stays);
  const items = [];

  for (let day = 1; day <= days; day++) {
    let sequence = 0;
    if (stay) {
      items.push({
        day_number: day,
        sequence: sequence++,
        item_type: ITEM_TYPE.LISTING,
        listing_id: stay.id,
        known_site_id: null,
        notes: stay.price_amount * days <= budget ? "Within budget." : "Over budget — cheapest stay available.",
      });
    }
    for (let offset = 0; offset < SITES_PER_DAY; offset++) {
      const site = sites[(day - 1) * SITES_PER_DAY + offset];
      if (!site) break; // ran out of sites — short days beat repeated ones
      items.push({
        day_number: day,
        sequence: sequence++,
        item_type: ITEM_TYPE.KNOWN_SITE,
        listing_id: null,
        known_site_id: site.id,
        notes: "",
      });
    }
  }
  return items;
}

/** The priciest stay whose full-trip cost fits the budget — a tourist who says
 *  ₹15,000 wants a ₹15,000 trip, not the cheapest bed in the valley. Falls back
 *  to the cheapest listing when nothing fits, flagged in the item's notes. */
function pickStay(days, budget, stays) {
  if (!stays?.length) return null;
  const affordable = stays.filter((s) => s.price_amount * days <= budget);
  return affordable.length ? affordable[affordable.length - 1] : stays[0];
}

/** Total spend for a composed plan: the stay, priced across the whole trip. */
export function estimateCost(items, days, stays) {
  const stayItem = items.find((i) => i.item_type === ITEM_TYPE.LISTING);
  if (!stayItem) return 0;
  const stay = stays.find((s) => s.id === stayItem.listing_id);
  return stay ? stay.price_amount * days : 0;
}

/** Inclusive day count for a trip's date range. */
export const daysBetween = (startDate, endDate) =>
  Math.round((new Date(endDate) - new Date(startDate)) / 86_400_000) + 1;
