/** docs/TRD.md §3 — the supervisor the deck sells: one LangGraph state machine
 *  that routes every step to one of the four agents, retries a failed node
 *  once, and records what ran.
 *
 *  Routing is by explicit `task`, not by asking a model to pick: every caller
 *  already knows which agent it needs (a webhook means onboarding, a trip POST
 *  means planning). An LLM router here would add a second or two of latency
 *  and a failure mode, and decide nothing that was ever in doubt.
 */
import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

import { handleInboundMessage } from "./onboarding.js";
import { runVerification } from "./verification.js";
import { planTrip, editStop } from "./planning.js";
import { replanTrip } from "./replanning.js";

export const TASK = Object.freeze({
  ONBOARD: "onboard",
  VERIFY: "verify",
  PLAN: "plan",
  REPLAN: "replan",
  EDIT: "edit",
});

const State = new StateSchema({
  task: z.enum(Object.values(TASK)),
  payload: z.record(z.string(), z.unknown()),
  result: z.custom().nullable().default(null),
  attempts: z.number().default(0),
  error: z.string().nullable().default(null),
  trace: z.array(z.string()).default(() => []),
});

const AGENTS = {
  [TASK.ONBOARD]: (payload) => handleInboundMessage(payload),
  [TASK.VERIFY]: (payload) => runVerification(payload.listing),
  [TASK.PLAN]: (payload) => planTrip(payload.trip, { disruption: payload.disruption ?? null }),
  [TASK.REPLAN]: (payload) => replanTrip(payload.trip, payload.disruption, { fromDay: payload.fromDay ?? 2 }),
  [TASK.EDIT]: (payload) => editStop(payload.trip, payload.itemId, payload.action),
};

async function dispatch(state) {
  const started = Date.now();
  try {
    const result = await AGENTS[state.task](state.payload);
    console.log(`[supervisor] ${state.task} ok in ${Date.now() - started}ms`);
    return { result, error: null, trace: [`${state.task}:ok`] };
  } catch (error) {
    console.error(`[supervisor] ${state.task} failed:`, error.message);
    return { error: error.message, attempts: state.attempts + 1, trace: [`${state.task}:error`] };
  }
}

/** One retry, then give up. A second failure is a real fault (bad payload, DB
 *  down) and looping on it just delays the error the caller has to handle. */
const shouldRetry = (state) => (state.error && state.attempts < 2 ? "dispatch" : END);

export const supervisorGraph = new StateGraph(State)
  .addNode("dispatch", dispatch)
  .addEdge(START, "dispatch")
  .addConditionalEdges("dispatch", shouldRetry, ["dispatch", END])
  .compile();

/** Runs one agent under the supervisor. Throws if it failed twice. */
export async function run(task, payload) {
  const state = await supervisorGraph.invoke({ task, payload });
  if (state.error) throw new Error(`${task} agent failed: ${state.error}`);
  return state.result;
}
