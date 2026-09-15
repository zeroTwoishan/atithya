/** docs/TRD.md §3.1 — WhatsApp Onboarding Agent (supervisor route 01).
 *
 *  classify_intent -> extract_fields -> ask_missing_or_confirm -> persist_listing
 *
 *  The host's accumulated answers live in conversation_state.state (jsonb),
 *  keyed by WhatsApp number, so the conversation survives across messages and
 *  process restarts — this is the "it remembers" claim in docs/PRD.md, and it
 *  is why the graph itself stays stateless between turns.
 */
import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

import { query, transaction } from "../db/index.js";
import { OFFERING_TYPE, PRICE_UNIT, ROLE } from "../constants.js";
import { extract, say, hasLLM } from "./llm.js";
import { runVerification } from "./verification.js";
import { fetchAllMedia } from "../media.js";
import { checkpointer } from "./checkpointer.js";

/** A listing cannot be published without these. Everything else is optional. */
const REQUIRED = ["offering_type", "title", "price_amount", "region"];

const draftSchema = z.object({
  offering_type: z.enum(Object.values(OFFERING_TYPE)).nullable(),
  title: z.string().nullable().describe("a short listing title, in English"),
  description: z.string().nullable().describe("2-3 sentences, in English, from what the host said"),
  price_amount: z.number().positive().nullable().describe("rupees, as a number"),
  price_unit: z.enum(Object.values(PRICE_UNIT)).nullable(),
  region: z.string().nullable().describe('e.g. "Tirthan Valley, HP"'),
  language: z.string().nullable().describe("ISO code of the language the host wrote in, e.g. hi, en, pa"),
});

const State = new StateSchema({
  from: z.string(),
  body: z.string(),
  mediaIds: z.array(z.string()).default(() => []),
  conversation: z.custom().nullable().default(null),
  intent: z.enum(["new_listing", "follow_up", "update", "chitchat"]).default("new_listing"),
  draft: z.record(z.string(), z.unknown()).default(() => ({})),
  listing: z.custom().nullable().default(null),
  reply: z.string().default(""),
});

async function loadConversation(state) {
  // The row maps a number to a host and records when they last wrote; the
  // answers they have given so far live in the graph's checkpoint, keyed by
  // the same number. One copy of the draft, not two.
  const { rows } = await query(
    `INSERT INTO conversation_state (whatsapp_number) VALUES ($1)
       ON CONFLICT (whatsapp_number) DO UPDATE SET last_message_at = now()
       RETURNING id, whatsapp_number, host_user_id, state`,
    [state.from],
  );
  return { conversation: rows[0] };
}

/** Node 1 — classify_intent. A host with no draft yet is always starting one;
 *  only an existing draft makes the distinction worth an LLM call. */
async function classifyIntent(state) {
  const hasDraft = Object.keys(state.draft).length > 0;
  if (!hasDraft) return { intent: "new_listing" };
  if (!hasLLM()) return { intent: "follow_up" };

  const verdict = await extract(
    z.object({ intent: z.enum(["new_listing", "follow_up", "update", "chitchat"]) }),
    "Classify a WhatsApp message from a rural Indian tourism host who is mid-way through listing " +
      "their property. 'follow_up' = answering the question we asked. 'update' = changing something " +
      "already given. 'new_listing' = starting a different, additional property. 'chitchat' = " +
      "anything else. Reply with the label only.",
    `Draft so far: ${JSON.stringify(state.draft)}\nNew message: ${state.body}`,
  );
  return { intent: verdict?.intent ?? "follow_up" };
}

/** Node 2 — extract_fields. Merges only the fields this message actually
 *  supplied; nulls never overwrite something the host already told us. */
async function extractFields(state) {
  const base = state.intent === "new_listing" ? {} : state.draft;
  const extracted = await extract(
    draftSchema,
    "Extract tourism-listing fields from a WhatsApp message written by a rural Indian host, in any " +
      "language (Hindi, Hinglish, Punjabi, English...). Return null for anything not stated — never " +
      "guess a price or a place. Write title and description in English even when the host writes in " +
      "another language; record which language they used.",
    `Known so far: ${JSON.stringify(base)}\nNew message: ${state.body}`,
  );

  const draft = { ...base };
  for (const [key, value] of Object.entries(extracted ?? {})) {
    if (value !== null && value !== undefined && value !== "") draft[key] = value;
  }
  if (state.mediaIds.length) {
    // Ids only at this stage — fetching photos for a conversation that never
    // finishes would be wasted round-trips against Meta.
    draft.media_ids = [...new Set([...(draft.media_ids ?? []), ...state.mediaIds])];
  }
  draft.price_unit ??= PRICE_UNIT.NIGHT;
  return { draft };
}

const missingFields = (draft) => REQUIRED.filter((field) => !draft[field]);

/** Node 3 — ask_missing_or_confirm, in the host's own language. */
async function askMissingOrConfirm(state) {
  const missing = missingFields(state.draft);
  const language = state.draft.language ?? "hi";

  if (missing.length) {
    const reply =
      (await say(
        `You are Atithya, onboarding a rural Indian tourism host over WhatsApp. Ask for ONLY the ` +
          `missing details, in ONE short friendly message, written in the language whose ISO code is ` +
          `"${language}". Never ask for something already known. No markdown, no lists longer than 3 lines.`,
        `Known: ${JSON.stringify(state.draft)}\nStill missing: ${missing.join(", ")}`,
      )) ?? `Thank you! Please also tell me: ${missing.join(", ")}.`;
    return { reply };
  }

  const summary =
    `${state.draft.title} — ${state.draft.offering_type} in ${state.draft.region}, ` +
    `₹${state.draft.price_amount} per ${state.draft.price_unit}`;
  const reply =
    (await say(
      `You are Atithya. Confirm back to the host, in the language with ISO code "${language}", that ` +
        `their listing is now live, in at most 35 words. Warm, plain, no markdown.`,
      summary,
    )) ?? `Your listing is live: ${summary}`;
  return { reply };
}

/** Node 4 — persist_listing. Creates the host account on first contact, then
 *  hands the row to the Verification Agent before it can go live. */
async function persistListing(state) {
  // Not publishable yet: the checkpointer already holds the draft for the
  // host's next message, so there is nothing to write here.
  if (missingFields(state.draft).length) return {};

  // Two authenticated round-trips per photo — done before the transaction
  // opens, never while holding it.
  const photoUrls = await fetchAllMedia(state.draft.media_ids ?? []);

  const listing = await transaction(async (client) => {
    let hostId = state.conversation.host_user_id;
    if (!hostId) {
      const phone = state.from.replace("whatsapp:", "");
      const { rows } = await client.query(
        // A host who messaged before (new conversation row, same number) must
        // resolve to the same user — DO UPDATE, not DO NOTHING, so RETURNING
        // still yields the id instead of an empty result.
        `INSERT INTO users (role, phone, name, username, password, language)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (phone) DO UPDATE SET language = EXCLUDED.language
           RETURNING id`,
        [
          ROLE.HOST,
          phone,
          state.draft.title?.slice(0, 40) ?? "WhatsApp host",
          `host_${phone.replace(/\D/g, "")}`,
          // No password login for WhatsApp-onboarded hosts: they authenticate
          // by owning the number. A non-null placeholder that no password can
          // hash to (hashes here are always "salt:hash") keeps them locked out
          // of /auth/token until a real credential is set.
          "whatsapp-only",
          state.draft.language ?? "hi",
        ],
      );
      hostId = rows[0].id;
      await client.query("UPDATE conversation_state SET host_user_id = $2 WHERE id = $1", [
        state.conversation.id,
        hostId,
      ]);
    }

    const { rows } = await client.query(
      `INSERT INTO listings (host_user_id, offering_type, title, description, price_amount,
                             price_unit, region, photo_urls)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, host_user_id, offering_type, title, description, price_amount, price_unit,
                 region, lat, lng, availability, photo_urls, status, verification_notes,
                 created_at, updated_at`,
      [
        hostId,
        state.draft.offering_type,
        state.draft.title,
        state.draft.description ?? "",
        state.draft.price_amount,
        state.draft.price_unit,
        state.draft.region,
        photoUrls,
      ],
    );
    await client.query("UPDATE conversation_state SET state = $2 WHERE id = $1", [
      state.conversation.id,
      { last_listing_id: rows[0].id },
    ]);
    return rows[0];
  });

  // Draft cleared so the host's next message starts a fresh listing rather
  // than editing the one just published.
  return { listing: await runVerification(listing), draft: {} };
}

const builder = new StateGraph(State)
  .addNode("load_conversation", loadConversation)
  .addNode("classify_intent", classifyIntent)
  .addNode("extract_fields", extractFields)
  .addNode("ask_missing_or_confirm", askMissingOrConfirm)
  .addNode("persist_listing", persistListing)
  .addEdge(START, "load_conversation")
  .addEdge("load_conversation", "classify_intent")
  .addEdge("classify_intent", "extract_fields")
  .addEdge("extract_fields", "ask_missing_or_confirm")
  .addEdge("ask_missing_or_confirm", "persist_listing")
  .addEdge("persist_listing", END);

let graph;

/** Compiled once, with the shared checkpointer attached. Exported so tests
 *  can drive the graph with a pre-filled draft — without an API key the
 *  extraction nodes are no-ops, and persist_listing is worth testing anyway. */
export async function onboardingGraph() {
  graph ??= builder.compile({ checkpointer: await checkpointer() });
  return graph;
}

/** One WhatsApp message in, one reply out. The thread is the host's number,
 *  so every message they send resumes the same conversation — including after
 *  a restart (docs/TRD.md §6).
 *  @returns {{reply: string, listing: object|null}} */
export async function handleInboundMessage({ from, body, mediaIds = [] }) {
  const compiled = await onboardingGraph();
  const result = await compiled.invoke(
    { from, body, mediaIds },
    { configurable: { thread_id: `onboarding:${from}` } },
  );
  return { reply: result.reply, listing: result.listing };
}
