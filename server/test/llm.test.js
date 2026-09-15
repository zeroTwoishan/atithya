/** Provider selection (src/agents/llm.js). No network: this is about which
 *  client gets built from which environment, which is the part that decides
 *  whether the agent can speak at all on demo day. */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { hasLLM, providerName, MODEL } from "../src/agents/llm.js";

const KEYS = ["ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "LLM_PROVIDER", "LLM_MODEL"];

beforeEach(() => {
  for (const key of KEYS) delete process.env[key];
});

test("no key anywhere means no LLM, and nothing throws", () => {
  assert.equal(hasLLM(), false);
  assert.equal(providerName(), "none");
  assert.equal(MODEL(), null);
});

test("a single key selects that provider and its default model", () => {
  process.env.GOOGLE_API_KEY = "test";
  assert.equal(providerName(), "gemini");
  assert.match(MODEL(), /^gemini/);

  delete process.env.GOOGLE_API_KEY;
  process.env.GROQ_API_KEY = "test";
  assert.equal(providerName(), "groq");
  assert.match(MODEL(), /llama/);
});

test("Anthropic wins when several keys are present, unless told otherwise", () => {
  process.env.GOOGLE_API_KEY = "test";
  process.env.ANTHROPIC_API_KEY = "test";
  assert.equal(providerName(), "anthropic");

  process.env.LLM_PROVIDER = "gemini";
  assert.equal(providerName(), "gemini", "LLM_PROVIDER must override the order");
});

test("LLM_PROVIDER naming a provider with no key means no LLM, not a crash", () => {
  process.env.LLM_PROVIDER = "groq"; // no GROQ_API_KEY set
  process.env.GOOGLE_API_KEY = "test"; // must NOT be silently used instead
  assert.equal(hasLLM(), false);
});

test("an unknown LLM_PROVIDER fails loudly rather than silently picking one", () => {
  process.env.LLM_PROVIDER = "openai";
  process.env.GOOGLE_API_KEY = "test";
  assert.throws(() => hasLLM(), /not one of/);
});

test("LLM_MODEL overrides the provider's default", () => {
  process.env.GOOGLE_API_KEY = "test";
  process.env.LLM_MODEL = "gemini-2.5-pro";
  assert.equal(MODEL(), "gemini-2.5-pro");
});
