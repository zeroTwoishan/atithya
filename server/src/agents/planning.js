/** docs/TRD.md §3.2 — Travel Planning & Booking Agent (supervisor route 03).
 *
 *  retrieve_candidates -> compose_itinerary -> narrate. The structure is
 *  decided by the pure planner in src/planner.js; the LLM only writes the
 *  sentence the tourist reads. A generation failure costs prose, never the
 *  itinerary — which is why the demo still works with no API key.
 *
 *  ponytail: retrieval is a plain interest/region/budget SQL filter, the named
 *  fallback in docs/BUILD_PLAN.md §3. Swap in a pgvector `ORDER BY embedding
 *  <=> $1` here once listings carry embeddings — nothing else has to change.
 */
import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

import { query } from "../db/index.js";
import { LISTING_STATUS } from "../constants.js";
import { composeItinerary, estimateCost, daysBetween } from "../planner.js";
import { say } from "./llm.js";

const State = new StateSchema({
  trip: z.custom(),
  disruption: z.string().nullable().default(null),
  stays: z.array(z.custom()).default(() => []),
  sites: z.array(z.custom()).default(() => []),
  items: z.array(z.custom()).default(() => []),
  narrative: z.string().default(""),
});

/** ILIKE ANY over a text[] of interest terms — one query, no per-term loop,
 *  and the terms stay bound parameters rather than concatenated SQL. */
async function retrieveCandidates(state) {
  const interests = (state.trip.interests ?? []).filter(Boolean).map((term) => `%${term}%`);

  const staySql = `SELECT id, host_user_id, offering_type, title, description, price_amount,
                          price_unit, region, lat, lng, photo_urls
                     FROM listings WHERE status = $1`;
  let stays = await query(
    interests.length
      ? `${staySql} AND (title ILIKE ANY($2) OR description ILIKE ANY($2)
             OR region ILIKE ANY($2) OR offering_type::text ILIKE ANY($2))
         ORDER BY price_amount`
      : `${staySql} ORDER BY price_amount`,
    interests.length ? [LISTING_STATUS.LIVE, interests] : [LISTING_STATUS.LIVE],
  );
  // Interests too narrow to match anything — an empty itinerary helps nobody,
  // so widen to the whole live catalogue rather than returning nothing.
  if (!stays.rows.length && interests.length) {
    stays = await query(`${staySql} ORDER BY price_amount`, [LISTING_STATUS.LIVE]);
  }

  const siteSql = "SELECT id, name, region, category, description, lat, lng FROM known_sites";
  let sites = await query(
    interests.length
      ? `${siteSql} WHERE name ILIKE ANY($1) OR description ILIKE ANY($1)
            OR region ILIKE ANY($1) OR category ILIKE ANY($1)`
      : siteSql,
    interests.length ? [interests] : [],
  );
  if (!sites.rows.length) sites = await query(siteSql, []);

  // Sites in the chosen stay's region first — a trip, not a scatter of pins.
  const region = stays.rows[0]?.region;
  const ordered = region
    ? [...sites.rows.filter((s) => s.region === region), ...sites.rows.filter((s) => s.region !== region)]
    : sites.rows;

  return { stays: stays.rows, sites: ordered };
}

function compose(state) {
  const days = daysBetween(state.trip.start_date, state.trip.end_date);
  return { items: composeItinerary(days, state.trip.budget, state.stays, state.sites) };
}

/** The chat reply. Prose only — every number in it comes from the composed
 *  plan, so the model cannot invent a price or a place. */
async function narrate(state) {
  const days = daysBetween(state.trip.start_date, state.trip.end_date);
  const stay = state.stays.find((s) => s.id === state.items.find((i) => i.listing_id)?.listing_id);
  const cost = estimateCost(state.items, days, state.stays);
  const siteNames = state.items
    .filter((item) => item.known_site_id)
    .map((item) => state.sites.find((site) => site.id === item.known_site_id)?.name)
    .filter(Boolean);

  const facts =
    `Days: ${days}\nBudget: ₹${state.trip.budget}\nEstimated spend: ₹${cost}\n` +
    `Stay: ${stay ? `${stay.title} in ${stay.region} at ₹${stay.price_amount}/${stay.price_unit}` : "none available"}\n` +
    `Stops: ${siteNames.join(", ") || "none"}\n` +
    (state.disruption ? `Disruption being worked around: ${state.disruption}\n` : "");

  const narrative = await say(
    "You are Atithya, a warm Indian travel curator writing one short paragraph (max 60 words) to a " +
      "tourist about the itinerary just built for them. Use ONLY the facts given — never invent a " +
      "place, price or feature. Mention the budget headroom if there is any. No bullet points, no " +
      "markdown, no greeting boilerplate beyond a brief warm opener.",
    facts,
  );

  // Deterministic fallback so the chat is never blank (no key, or a bad call).
  const fallback = stay
    ? `A ${days}-day route through ${stay.region}, staying at ${stay.title}. ` +
      `Estimated spend ₹${cost.toLocaleString("en-IN")} of your ₹${Number(state.trip.budget).toLocaleString("en-IN")} budget` +
      (siteNames.length ? `, with stops at ${siteNames.slice(0, 3).join(", ")}.` : ".")
    : `A ${days}-day sightseeing route${siteNames.length ? ` via ${siteNames.slice(0, 3).join(", ")}` : ""}. ` +
      "No verified stay matched your budget yet — more hosts are onboarding daily.";

  return { narrative: narrative ?? fallback };
}

export const planningGraph = new StateGraph(State)
  .addNode("retrieve_candidates", retrieveCandidates)
  .addNode("compose_itinerary", compose)
  .addNode("narrate", narrate)
  .addEdge(START, "retrieve_candidates")
  .addEdge("retrieve_candidates", "compose_itinerary")
  .addEdge("compose_itinerary", "narrate")
  .addEdge("narrate", END)
  .compile();

/** Plans `trip`, replaces its itinerary rows, and returns the chat narrative. */
export async function planTrip(trip, { disruption = null } = {}) {
  const result = await planningGraph.invoke({ trip, disruption });
  await persistItems(trip.id, result.items);
  return { items: result.items, narrative: result.narrative };
}

export async function persistItems(tripId, items, { fromDay = 1 } = {}) {
  await query("DELETE FROM itinerary_items WHERE trip_id = $1 AND day_number >= $2", [tripId, fromDay]);
  for (const item of items.filter((i) => i.day_number >= fromDay)) {
    await query(
      `INSERT INTO itinerary_items (trip_id, day_number, sequence, item_type, listing_id, known_site_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [tripId, item.day_number, item.sequence, item.item_type, item.listing_id, item.known_site_id, item.notes],
    );
  }
}
