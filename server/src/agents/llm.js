/** One shared Claude client for every agent (docs/TRD.md §2). */
import { ChatAnthropic } from "@langchain/anthropic";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/** False when no key is configured. Every agent degrades to its deterministic
 *  path instead of throwing — the demo must survive a missing key, and half
 *  the graph (price rules, itinerary composition) never needed the LLM. */
export const hasLLM = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client;
export function llm() {
  if (!hasLLM()) throw new Error("ANTHROPIC_API_KEY is not set");
  client ??= new ChatAnthropic({ model: MODEL, maxTokens: 2048 });
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
    console.error("[llm] structured extraction failed:", error.message);
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
    console.error("[llm] completion failed:", error.message);
    return null;
  }
}
