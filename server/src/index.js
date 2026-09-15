import { createApp } from "./app.js";
import { query } from "./db/index.js";

const port = Number(process.env.PORT ?? 8000);

/** Say plainly what is wrong at startup instead of letting every request fail
 *  with a 500 an hour before the demo. The server still starts — a dead
 *  database is not a reason to be unable to read the logs. */
async function reportEnvironment() {
  if (!process.env.DATABASE_URL) {
    console.error("[startup] DATABASE_URL is not set — copy server/.env.example to server/.env");
  } else {
    try {
      const { rows } = await query("SELECT count(*)::int AS listings FROM listings");
      console.log(`[startup] database ok — ${rows[0].listings} listings`);
    } catch (error) {
      console.error(`[startup] database unreachable: ${error.message}`);
      console.error("[startup] is Postgres running? have you run `npm run db:init && npm run db:seed`?");
    }
  }

  // Both optional: the app degrades instead of failing (docs/TRD.md §3).
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[startup] no ANTHROPIC_API_KEY — agents run their deterministic paths, no generated prose");
  }
  if (!process.env.WHATSAPP_APP_SECRET) {
    console.warn("[startup] no WHATSAPP_APP_SECRET — the webhook will reject every inbound message");
  }
}

createApp().listen(port, async () => {
  console.log(`atithya api on http://localhost:${port}`);
  await reportEnvironment();
});
