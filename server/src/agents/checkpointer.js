/** docs/TRD.md §6 — the onboarding conversation has to survive a process
 *  restart, so the checkpointer is Postgres-backed, not in-memory. A crash
 *  mid-demo must not make a host re-answer questions they already answered.
 *
 *  PostgresSaver owns its own tables (`checkpoints`, `checkpoint_writes`, ...)
 *  and creates them on first `setup()`. They are deliberately not in
 *  src/db/schema.sql: that file is ours, these are LangGraph's, and hand-
 *  maintaining someone else's schema is how you get a version mismatch at
 *  hour 30.
 */
import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

let saver;
let ready;

/** In-memory when there is no Postgres to talk to — the test suite runs
 *  against PGlite, which PostgresSaver cannot drive. Same graph, same
 *  behaviour within a run; only durability across restarts differs. */
function create() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("postgres")) {
    console.log("[checkpointer] no Postgres DATABASE_URL — using in-memory checkpoints");
    return new MemorySaver();
  }
  return PostgresSaver.fromConnString(url);
}

/** Lazily built and set up exactly once, then shared by every graph. */
export async function checkpointer() {
  saver ??= create();
  if (saver instanceof PostgresSaver) {
    // setup() is idempotent, but it is a round trip — only ever await it once.
    ready ??= saver.setup();
    await ready;
  }
  return saver;
}
