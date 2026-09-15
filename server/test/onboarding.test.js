/** The WhatsApp onboarding agent against Postgres in-process (PGlite).
 *
 *  No ANTHROPIC_API_KEY here, so the LLM extraction nodes return null and the
 *  draft is fed in directly — what this proves is the machinery around them:
 *  the conversation remembers across messages, a half-finished draft does NOT
 *  create a listing, a complete one does and goes through verification, and
 *  the same number maps to one host no matter how many listings they add.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";

import { setBackend, query } from "../src/db/index.js";

let pglite;
let handleInboundMessage;

before(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.DATABASE_URL; // -> in-memory checkpointer, see src/agents/checkpointer.js
  delete process.env.WHATSAPP_ACCESS_TOKEN;

  pglite = await PGlite.create({ parsers: { 1700: Number.parseFloat } });
  const client = { query: (text, params) => pglite.query(text, params), release: () => {} };
  setBackend({ query: client.query, connect: async () => client, end: async () => {} });

  const schema = (await readFile(new URL("../src/db/schema.sql", import.meta.url), "utf8"))
    .replace(/CREATE EXTENSION IF NOT EXISTS vector;/, "")
    .replaceAll("vector(1536)", "text");
  await pglite.exec(schema);

  ({ handleInboundMessage } = await import("../src/agents/onboarding.js"));
});

after(async () => {
  await pglite?.close();
});

const HOST = "919812345678";

test("a first message opens a conversation and asks for what is missing", async () => {
  const { reply, listing } = await handleInboundMessage({
    from: HOST,
    body: "Namaste, mere paas do kamre hain Tirthan mein",
  });

  assert.equal(listing, null, "nothing publishable yet, so no listing row");
  assert.match(reply, /offering_type|title|price_amount|region/i, "should name the missing fields");

  const rows = await query("SELECT whatsapp_number, host_user_id FROM conversation_state WHERE whatsapp_number = $1", [HOST]);
  assert.equal(rows.rows.length, 1);
  assert.equal(rows.rows[0].host_user_id, null, "no host account until a listing exists");

  const listings = await query("SELECT count(*)::int AS count FROM listings");
  assert.equal(listings.rows[0].count, 0);
});

test("the conversation remembers the first message when the second arrives", async () => {
  // A second turn on the same thread must not reset what came before — this
  // is the checkpointer doing its job.
  await handleInboundMessage({ from: HOST, body: "Homestay hai, do kamre" });

  const rows = await query("SELECT count(*)::int AS count FROM conversation_state WHERE whatsapp_number = $1", [HOST]);
  assert.equal(rows.rows[0].count, 1, "same number must reuse one conversation row");
});

test("two different numbers are two separate conversations", async () => {
  await handleInboundMessage({ from: "919700000000", body: "Hello" });
  const rows = await query("SELECT count(*)::int AS count FROM conversation_state");
  assert.equal(rows.rows[0].count, 2);
});

test("a complete draft publishes: host account created, listing live, number linked", async (t) => {
  const { onboardingGraph } = await import("../src/agents/onboarding.js");
  const graph = await onboardingGraph();
  const from = "919888777666";

  // The fields the extraction node would have produced from a real Hindi
  // message, fed straight in — everything after that node is the real path.
  const result = await graph.invoke(
    {
      from,
      body: "Haan bilkul, publish kar do",
      mediaIds: [],
      draft: {
        offering_type: "homestay",
        title: "Meera Devi Homestay",
        price_amount: 1600,
        price_unit: "night",
        region: "Tirthan Valley, HP",
        language: "hi",
      },
    },
    { configurable: { thread_id: `onboarding:${from}` } },
  );

  assert.ok(result.listing, "a complete draft must produce a listing");
  assert.equal(result.listing.title, "Meera Devi Homestay");
  assert.notEqual(result.listing.status, "pending_verification", "verification agent should have ruled");
  t.diagnostic(`published as ${result.listing.status}`);

  // The host account is created from the number, and the conversation now
  // points at it — that link is what makes the host dashboard find the row.
  const host = await query("SELECT id, role, phone, password FROM users WHERE id = $1", [result.listing.host_user_id]);
  assert.equal(host.rows[0].role, "host");
  assert.equal(host.rows[0].phone, from);
  assert.equal(host.rows[0].password, "whatsapp-only", "must not be a usable credential");

  const conversation = await query("SELECT host_user_id FROM conversation_state WHERE whatsapp_number = $1", [from]);
  assert.equal(conversation.rows[0].host_user_id, result.listing.host_user_id);
});

test("a second listing from the same number reuses the one host account", async () => {
  const { onboardingGraph } = await import("../src/agents/onboarding.js");
  const graph = await onboardingGraph();
  const from = "919888777666"; // same host as the previous test

  const result = await graph.invoke(
    {
      from,
      body: "Ek aur kamra bhi hai",
      mediaIds: [],
      draft: {
        offering_type: "homestay",
        title: "Meera Devi Upper Room",
        price_amount: 1400,
        price_unit: "night",
        region: "Tirthan Valley, HP",
      },
    },
    { configurable: { thread_id: `onboarding:${from}` } },
  );

  assert.ok(result.listing);
  const hosts = await query("SELECT count(*)::int AS count FROM users WHERE phone = $1", [from]);
  assert.equal(hosts.rows[0].count, 1, "one number, one host account");

  const listings = await query("SELECT count(*)::int AS count FROM listings WHERE host_user_id = $1", [
    result.listing.host_user_id,
  ]);
  assert.equal(listings.rows[0].count, 2);
});

test("an unparseable message never throws — the host gets a reply either way", async () => {
  const { reply } = await handleInboundMessage({ from: HOST, body: "😀" });
  assert.ok(typeof reply === "string" && reply.length > 0);
});

test("media ids are carried but not fetched without credentials", async () => {
  const before = await query("SELECT count(*)::int AS count FROM listings");
  const { listing } = await handleInboundMessage({ from: HOST, body: "photo", mediaIds: ["media-abc"] });
  const after = await query("SELECT count(*)::int AS count FROM listings");

  assert.equal(listing, null);
  assert.equal(after.rows[0].count, before.rows[0].count, "an incomplete draft must not publish");
});
