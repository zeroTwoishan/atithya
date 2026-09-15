import pg from "pg";

// Numerics come back as strings by default (pg refuses to silently lose
// precision on NUMERIC). Every money column in this schema is NUMERIC(10,2) —
// rupees, max 8 integer digits — which is nowhere near Number's 2^53 safe
// range, so parsing to a number here is safe and saves every route from
// doing it. Revisit if a column ever exceeds that (docs/BACKEND_SCHEMA.md §3).
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number.parseFloat);
// DATE as a plain 'YYYY-MM-DD' string, not a Date in the server's timezone —
// a trip's start_date is a calendar date, and UTC-shifting it moves the trip.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

let backend;

/** The connection pool, created on first use so importing this module never
 *  opens a socket (tests that only touch pure code stay offline). */
export function getPool() {
  backend ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  return backend;
}

/** Test seam: swap in any backend exposing `query(text, params)` and
 *  `connect()` -> `{ query, release }`. test/loop.test.js uses it to run the
 *  whole API against an in-process Postgres, so the SQL below is exercised
 *  without Docker. Nothing in src/ calls this. */
export function setBackend(custom) {
  backend = custom;
}

/** Parameterised query. Never interpolate values into `text` — use $1, $2. */
export const query = (text, params) => getPool().query(text, params);

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function transaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
