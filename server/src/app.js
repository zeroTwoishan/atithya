import { fileURLToPath } from "node:url";

import express from "express";
import cors from "cors";

import { fail } from "./http.js";
import { query } from "./db/index.js";
import { hasLLM, providerName } from "./agents/llm.js";
import { requireAuth } from "./auth.js";
import { MEDIA_DIR } from "./media.js";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import tripRoutes from "./routes/trips.js";
import analyticsRoutes from "./routes/analytics.js";
import whatsappRoutes from "./routes/whatsapp.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173" }));

  // The WhatsApp webhook mounts BEFORE express.json(): validating Meta's
  // X-Hub-Signature-256 needs the exact raw bytes, and a parsed-then-
  // re-serialised body is not byte-identical (docs/TRD.md §6).
  app.use("/webhooks/whatsapp", whatsappRoutes);

  app.use(express.json({ limit: "1mb" }));

  // Photos hosts sent over WhatsApp (src/media.js). Public and unauthenticated
  // — a listing's photos are public anyway, and the filenames are random UUIDs
  // rather than guessable media ids.
  app.use("/media", express.static(fileURLToPath(MEDIA_DIR), { maxAge: "1h", index: false }));

  // Unauthenticated on purpose: it is what you curl when something is wrong,
  // and it must answer even when auth or the database is the thing that broke.
  app.get("/api/v1/health", async (req, res) => {
    let database = "ok";
    if (!process.env.DATABASE_URL) {
      database = "DATABASE_URL is not set";
    } else {
      try {
        await query("SELECT 1");
      } catch (error) {
        // pg's connection errors often carry a code and an empty message —
        // reporting "" tells the person curling this nothing at all.
        database = error.message || error.code || String(error);
      }
    }
    const status = database === "ok" ? 200 : 503;
    res.status(status).json({
      data: {
        status: status === 200 ? "ok" : "degraded",
        database,
        // Which optional integrations are actually configured — the fastest
        // way to explain "why is the agent replying in English".
        llm: hasLLM() ? providerName() : false,
        whatsapp: Boolean(process.env.WHATSAPP_APP_SECRET && process.env.WHATSAPP_ACCESS_TOKEN),
      },
    });
  });
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1", requireAuth, listingRoutes);
  app.use("/api/v1", requireAuth, tripRoutes);
  app.use("/api/v1", requireAuth, analyticsRoutes);

  app.use((req, res) => fail(res, 404, "not_found", `No route for ${req.method} ${req.path}.`));

  // eslint-disable-next-line no-unused-vars -- express identifies the error
  // handler by arity; dropping `next` turns this into a normal middleware.
  app.use((error, req, res, next) => {
    console.error(error);
    // Never the stack, never the driver's message: a Postgres error can carry
    // column names and query fragments (docs/TRD.md §6).
    fail(res, 500, "internal_error", "Something broke on our side.");
  });

  return app;
}
