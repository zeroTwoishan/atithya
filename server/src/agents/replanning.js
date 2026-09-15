/** docs/TRD.md §3.4 — Adaptive Re-planning Agent (supervisor route 04).
 *
 *  Baseline, not stretch: the deck sells four agents under one supervisor.
 *  Only the days that have not happened yet are rebuilt — days already spent
 *  are history, and regenerating them would move stops the tourist already
 *  visited (docs/TRD.md §3.2 node 3, "only the affected day").
 */
import { query } from "../db/index.js";
import { daysBetween } from "../planner.js";
import { planningGraph, persistItems } from "./planning.js";
import { say } from "./llm.js";

/**
 * @param {object} trip        the trip row
 * @param {string} disruption  e.g. "NH-305 blocked by a landslide near Aut"
 * @param {number} fromDay     first day to rebuild (default: keep day 1)
 */
export async function replanTrip(trip, disruption, { fromDay = 2 } = {}) {
  const totalDays = daysBetween(trip.start_date, trip.end_date);
  const firstRebuilt = Math.min(Math.max(fromDay, 1), totalDays);

  // Regions named in the disruption are excluded from the rebuild — this is
  // the whole point of re-planning, not just reshuffling the same stops.
  const blockedRegions = await blockedRegionsFor(disruption);
  const planned = await planningGraph.invoke({ trip, disruption });

  const surviving = planned.items.filter(
    (item) => item.day_number >= firstRebuilt && !isBlocked(item, planned, blockedRegions),
  );
  // Re-number so the rebuilt tail starts where the kept days end.
  const rebuilt = surviving.map((item) => ({ ...item }));
  await persistItems(trip.id, rebuilt, { fromDay: firstRebuilt });

  const narrative =
    (await say(
      "You are Atithya. In at most 45 words, tell the tourist calmly what you changed about the " +
        "remaining days of their trip and why. Use only the facts given. No markdown.",
      `Disruption: ${disruption}\nRebuilt from day: ${firstRebuilt} of ${totalDays}\n` +
        `Avoided regions: ${blockedRegions.join(", ") || "none"}\n${planned.narrative}`,
    )) ??
    `Rebuilt days ${firstRebuilt}–${totalDays} around the disruption: ${disruption}. ` +
      `Days 1–${firstRebuilt - 1} are unchanged.`;

  return { items: rebuilt, narrative, fromDay: firstRebuilt, disruption };
}

/** Regions with an active `warning` advisory whose text overlaps the
 *  disruption — the seeded safety_advisories table is the source of truth
 *  here, not the model (docs/TRD.md §3.3). */
async function blockedRegionsFor(disruption) {
  const { rows } = await query(
    "SELECT DISTINCT region, message FROM safety_advisories WHERE severity = 'warning'",
  );
  const text = disruption.toLowerCase();
  return rows
    .filter((row) => text.includes(row.region.toLowerCase().split(",")[0].trim().toLowerCase()))
    .map((row) => row.region);
}

function isBlocked(item, planned, blockedRegions) {
  if (!blockedRegions.length) return false;
  const site = planned.sites.find((candidate) => candidate.id === item.known_site_id);
  const stay = planned.stays.find((candidate) => candidate.id === item.listing_id);
  return blockedRegions.includes(site?.region ?? stay?.region ?? "");
}
