/** docs/TRD.md §3.1 / §4 — WhatsApp Cloud API webhook.
 *
 *  Mounted before express.json() (see src/app.js): the signature covers the
 *  exact bytes Meta sent, and a re-serialised body is not those bytes.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import express from "express";

import { run, TASK } from "../agents/supervisor.js";

const router = Router();
const GRAPH_API = "https://graph.facebook.com/v21.0";

// GET — Meta's one-time subscription handshake. Echo hub.challenge back as
// plain text when the verify token matches, 403 otherwise.
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(String(req.query["hub.challenge"] ?? ""));
  }
  res.sendStatus(403);
});

router.post("/", express.raw({ type: "*/*", limit: "1mb" }), async (req, res) => {
  if (!validSignature(req)) return res.sendStatus(403);

  // Meta retries anything that is not a fast 200, and the agent takes seconds.
  // Acknowledge first, then process — a duplicate delivery is worse than a
  // slightly late reply.
  res.sendStatus(200);

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    return console.error("[whatsapp] unparseable webhook body");
  }

  for (const message of inboundMessages(payload)) {
    try {
      const { reply } = await run(TASK.ONBOARD, message);
      if (reply) await sendWhatsApp(message.from, reply);
    } catch (error) {
      console.error("[whatsapp] onboarding failed:", error.message);
      await sendWhatsApp(
        message.from,
        "Sorry — something went wrong on our side. Please send that again in a moment.",
      );
    }
  }
});

/** HMAC-SHA256 of the raw body against the app secret. Fails closed: with no
 *  secret configured there is nothing to validate against, so nothing is
 *  accepted (docs/TRD.md §6). */
function validSignature(req) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.error("[whatsapp] WHATSAPP_APP_SECRET unset — rejecting webhook");
    return false;
  }
  const header = req.headers["x-hub-signature-256"];
  if (typeof header !== "string" || !header.startsWith("sha256=")) return false;

  const expected = Buffer.from(createHmac("sha256", secret).update(req.body).digest("hex"));
  const actual = Buffer.from(header.slice("sha256=".length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Flattens Meta's entry[].changes[].value.messages[] envelope. Status
 *  callbacks (delivered/read) carry no `messages` key and are skipped. */
function* inboundMessages(payload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        yield {
          from: message.from,
          body: message.text?.body ?? message.image?.caption ?? message.audio?.caption ?? "",
          // Media arrives as an id, not a URL — resolving it needs a second
          // authenticated call, so the id is carried through and resolved
          // only if the listing actually gets published.
          mediaUrls: [message.image?.id, message.video?.id, message.document?.id]
            .filter(Boolean)
            .map((id) => `${GRAPH_API}/${id}`),
        };
      }
    }
  }
}

async function sendWhatsApp(to, text) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    // Local dev without Meta credentials: log what would have been sent so the
    // conversation is still followable from the terminal.
    return console.log(`[whatsapp] (not sent, no credentials) -> ${to}: ${text}`);
  }
  const response = await fetch(`${GRAPH_API}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  if (!response.ok) console.error("[whatsapp] send failed:", response.status, await response.text());
}

export default router;
