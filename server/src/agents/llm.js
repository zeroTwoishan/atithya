/** The one LLM client every agent shares (docs/TRD.md §2).
 *
 *  Three providers, picked by whichever API key is present — Gemini and Groq
 *  both have a free tier that needs no card, which is the difference between
 *  "the agent speaks Hindi on stage" and "it doesn't" when nobody on the team
 *  can pay for an API. The deck names no LLM vendor, so this is free to vary.
 *
 *  Nothing else in the codebase knows which one is in use: every agent calls
 *  `extract()` or `say()` and gets null on any failure.
 */
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

const PROVIDERS = [
  {
    name: "anthropic",
    key: "ANTHROPIC_API_KEY",
    defaultModel: "claude-opus-5",
    build: (model) => new ChatAnthropic({ model, maxTokens: 2048 }),
  },
  {
    name: "gemini",
    key: "GOOGLE_API_KEY",
    defaultModel: "gemini-2.0-flash",
    build: (model) => new ChatGoogleGenerativeAI({ model, maxOutputTokens: 2048 }),
  },
  {
    name: "groq",
    key: "GROQ_API_KEY",
    defaultModel: "llama-3.3-70b-versatile",
    build: (model) => new ChatGroq({ model, maxTokens: 2048 }),
  },
];

/** First provider with a key wins, unless LLM_PROVIDER names one. */
function selected() {
  const forced = process.env.LLM_PROVIDER;
  if (forced) {
    const provider = PROVIDERS.find((candidate) => candidate.name === forced);
    if (!provider) throw new Error(`LLM_PROVIDER "${forced}" is not one of: ${PROVIDERS.map((p) => p.name).join(", ")}`);
    return process.env[provider.key] ? provider : null;
  }
  return PROVIDERS.find((provider) => process.env[provider.key]) ?? null;
}

export const MODEL = () => {
  const provider = selected();
  return provider ? (process.env.LLM_MODEL ?? provider.defaultModel) : null;
};

/** False when no provider has a key. Every agent then runs its deterministic
 *  path instead of throwing — the demo must survive a missing key, and half
 *  the graph (price rules, itinerary composition) never needed an LLM. */
export const hasLLM = () => Boolean(selected());

export const providerName = () => selected()?.name ?? "none";

let client;
export function llm() {
  const provider = selected();
  if (!provider) throw new Error("No LLM key set — see ANTHROPIC_API_KEY / GOOGLE_API_KEY / GROQ_API_KEY");
  client ??= provider.build(process.env.LLM_MODEL ?? provider.defaultModel);
  return client;
}

/** Structured extraction against a zod schema. Returns null (never throws)
 *  when the LLM is unavailable or the call fails, so callers can fall back. */
export async function extract(schema, systemPrompt, userContent) {
  if (!hasLLM()) return null;
  try {
    return await llm()
      .withStructuredOutput(schema)
      .invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ]);
  } catch (error) {
    console.error(`[llm:${providerName()}] structured extraction failed:`, error.message);
    return null;
  }
}

/** Plain prose reply. Same contract: null rather than a thrown error. */
export async function say(systemPrompt, userContent) {
  if (!hasLLM()) return null;
  try {
    const reply = await llm().invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);
    return typeof reply.content === "string"
      ? reply.content
      : reply.content.map((block) => block.text ?? "").join("");
  } catch (error) {
    console.error(`[llm:${providerName()}] completion failed:`, error.message);
    return null;
  }
}
