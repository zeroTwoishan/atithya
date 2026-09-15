import { test } from "node:test";
import assert from "node:assert/strict";

import { composeItinerary, estimateCost, daysBetween, SITES_PER_DAY } from "../src/planner.js";

const stay = (id, price) => ({ id, price_amount: price });
const site = (id) => ({ id });
const STAYS = [stay("cheap", 800), stay("mid", 1850), stay("posh", 6000)]; // cheapest first
const SITES = [site("s1"), site("s2"), site("s3"), site("s4"), site("s5")];

test("picks the priciest stay that fits the whole trip, not the cheapest", () => {
  const items = composeItinerary(4, 15000, STAYS, SITES);
  // posh is 6000*4 = 24000 > 15000; mid is 1850*4 = 7400, fits.
  assert.equal(items.find((i) => i.item_type === "listing").listing_id, "mid");
});

test("falls back to the cheapest stay and says so when nothing fits", () => {
  const items = composeItinerary(4, 1000, STAYS, SITES);
  const stayItem = items.find((i) => i.item_type === "listing");
  assert.equal(stayItem.listing_id, "cheap");
  assert.match(stayItem.notes, /Over budget/);
});

test("one stay plus SITES_PER_DAY sites per day, no site repeated", () => {
  const items = composeItinerary(2, 15000, STAYS, SITES);
  assert.equal(items.filter((i) => i.day_number === 1).length, 1 + SITES_PER_DAY);
  const siteIds = items.filter((i) => i.item_type === "known_site").map((i) => i.known_site_id);
  assert.equal(new Set(siteIds).size, siteIds.length);
});

test("runs short rather than repeating when sites run out", () => {
  const items = composeItinerary(4, 15000, STAYS, [site("only")]);
  assert.equal(items.filter((i) => i.item_type === "known_site").length, 1);
  assert.equal(items.filter((i) => i.item_type === "listing").length, 4); // every day still has a bed
});

test("sequence restarts at 0 each day and increments without gaps", () => {
  const items = composeItinerary(3, 15000, STAYS, SITES);
  for (let day = 1; day <= 3; day++) {
    const sequences = items.filter((i) => i.day_number === day).map((i) => i.sequence);
    assert.deepEqual(sequences, sequences.map((_, index) => index));
  }
});

test("no stays available still yields a sightseeing itinerary", () => {
  const items = composeItinerary(2, 15000, [], SITES);
  assert.equal(items.length, 2 * SITES_PER_DAY);
  assert.equal(estimateCost(items, 2, []), 0);
});

test("degenerate day counts produce nothing rather than throwing", () => {
  for (const days of [0, -1, 1.5, Number.NaN]) {
    assert.deepEqual(composeItinerary(days, 15000, STAYS, SITES), []);
  }
});

test("estimateCost prices the stay across every night of the trip", () => {
  const items = composeItinerary(4, 15000, STAYS, SITES);
  assert.equal(estimateCost(items, 4, STAYS), 1850 * 4);
});

test("daysBetween is inclusive — Oct 18 to Oct 22 is a 5-day trip", () => {
  assert.equal(daysBetween("2026-10-18", "2026-10-22"), 5);
  assert.equal(daysBetween("2026-10-18", "2026-10-18"), 1);
});
