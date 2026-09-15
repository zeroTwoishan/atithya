/** docs/TRD.md §3.3 — Verification & Safety Agent (supervisor route 02).
 *
 *  Two checks, in cost order: a price-outlier rule that needs no LLM, then a
 *  contradiction check that does. Either flag sends the listing to
 *  needs_review with the specific reason the host sees on their dashboard.
 */
import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

import { query } from "../db/index.js";
import { LISTING_STATUS } from "../constants.js";
import { extract } from "./llm.js";

const MIN_COMPARABLES = 3; // below this, "regional median" means nothing
const STDDEV_LIMIT = 2;

const State = new StateSchema({
  listing: z.custom(),
  flags: z.array(z.string()).default(() => []),
});

/** Price outside ±2 std-dev of the regional median for the same offering type. */
async function ruleCheck(state) {
  const { listing } = state;
  const { rows } = await query(
    `SELECT price_amount FROM listings
      WHERE offering_type = $1 AND region = $2 AND id <> $3`,
    [listing.offering_type, listing.region, listing.id],
  );
  if (rows.length < MIN_COMPARABLES) return {};

  const prices = rows.map((row) => row.price_amount);
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + (price - mean) ** 2, 0) / prices.length;
  const stddev = Math.sqrt(variance) || 1; // every comparable identically priced

  if (Math.abs(listing.price_amount - mean) > STDDEV_LIMIT * stddev) {
    return {
      flags: [
        `Price ₹${Math.round(listing.price_amount)} is more than ${STDDEV_LIMIT} standard deviations ` +
          `from the ₹${Math.round(mean)} regional average for ${listing.offering_type} in ${listing.region}.`,
      ],
    };
  }
  return {};
}

const contradictionSchema = z.object({
  contradiction: z.boolean().describe("true only if the description contradicts itself"),
  reason: z.string().describe("the contradicting claims, one sentence, empty when there is none"),
});

/** LLM check: internally contradictory description (docs/TRD.md §3.3). Skipped
 *  silently when no API key is configured — a listing is never blocked by an
 *  absent LLM, it just goes live on the rule check alone. */
async function contradictionCheck(state) {
  const { listing } = state;
  if (!listing.description?.trim()) return {};

  const verdict = await extract(
    contradictionSchema,
    "You screen tourism listings for internal contradictions — a description that claims both " +
      "'no wifi' and 'high-speed wifi', or 'sleeps 4' and 'sleeps 12'. Flag ONLY direct " +
      "self-contradiction. Regional phrasing, mixed languages, and marketing enthusiasm are not " +
      "contradictions.",
    `Title: ${listing.title}\nDescription: ${listing.description}`,
  );
  return verdict?.contradiction && verdict.reason ? { flags: [verdict.reason] } : {};
}

async function persistVerdict(state) {
  const flagged = state.flags.length > 0;
  const { rows } = await query(
    `UPDATE listings SET status = $2, verification_notes = $3, updated_at = now()
      WHERE id = $1
      RETURNING id, host_user_id, offering_type, title, description, price_amount, price_unit,
                region, lat, lng, availability, photo_urls, status, verification_notes,
                created_at, updated_at`,
    [
      state.listing.id,
      flagged ? LISTING_STATUS.NEEDS_REVIEW : LISTING_STATUS.LIVE,
      flagged ? state.flags.join(" ") : "",
    ],
  );
  return { listing: rows[0] };
}

export const verificationGraph = new StateGraph(State)
  .addNode("rule_check", ruleCheck)
  .addNode("contradiction_check", contradictionCheck)
  .addNode("persist_verdict", persistVerdict)
  .addEdge(START, "rule_check")
  .addEdge("rule_check", "contradiction_check")
  .addEdge("contradiction_check", "persist_verdict")
  .addEdge("persist_verdict", END)
  .compile();

/** @returns the listing row as it now stands (live, or needs_review + reason). */
export async function runVerification(listing) {
  const result = await verificationGraph.invoke({ listing, flags: [] });
  return result.listing;
}
