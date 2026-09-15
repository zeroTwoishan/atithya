/** The WhatsApp webhook's gatekeeping — the only unauthenticated route in the
 *  app. None of these cases reach the database. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { createApp } from "../src/app.js";

const SECRET = "test-app-secret";
let server;
let base;

before(async () => {
  process.env.WHATSAPP_APP_SECRET = SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = "test-verify-token";
  process.env.JWT_SECRET = "test-jwt-secret";
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const sign = (body) => `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;

const post = (body, signature) =>
  fetch(`${base}/webhooks/whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(signature ? { "X-Hub-Signature-256": signature } : {}) },
    body,
  });

test("GET handshake echoes hub.challenge when the verify token matches", async () => {
  const response = await fetch(
    `${base}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=abc123`,
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "abc123");
});

test("GET handshake rejects a wrong verify token", async () => {
  const response = await fetch(
    `${base}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123`,
  );
  assert.equal(response.status, 403);
});

test("POST without a signature is rejected", async () => {
  assert.equal((await post('{"entry":[]}')).status, 403);
});

test("POST with a signature over different bytes is rejected", async () => {
  const response = await post('{"entry":[{"tampered":true}]}', sign('{"entry":[]}'));
  assert.equal(response.status, 403);
});

test("POST with a valid signature is accepted", async () => {
  // entry:[] carries no messages, so this ends before any agent or DB call.
  const body = '{"object":"whatsapp_business_account","entry":[]}';
  assert.equal((await post(body, sign(body))).status, 200);
});

test("a status callback (no messages key) is accepted and ignored", async () => {
  const body = JSON.stringify({
    entry: [{ changes: [{ value: { statuses: [{ id: "wamid.X", status: "delivered" }] } }] }],
  });
  assert.equal((await post(body, sign(body))).status, 200);
});

test("fails closed when no app secret is configured", async () => {
  const saved = process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_APP_SECRET;
  const body = '{"entry":[]}';
  assert.equal((await post(body, sign(body))).status, 403);
  process.env.WHATSAPP_APP_SECRET = saved;
});
