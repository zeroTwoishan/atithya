/** Turns "₹15,000, 4 days, mountains and authentic homestays" into the body
 *  POST /trips expects. Deliberately small and deterministic — the planning
 *  agent wants a structured trip, and an LLM round-trip just to read three
 *  numbers out of a sentence would cost a second of demo latency.
 *
 *  ponytail: regex, not NLU. If the chat ever needs to understand free prose
 *  (multi-city, "the weekend after Diwali"), move this to an extract() call
 *  in the planning agent instead of growing the patterns here.
 */

const STOPWORDS = new Set([
  "and", "with", "for", "the", "a", "an", "want", "i", "im", "looking", "to", "in", "of", "my",
  "days", "day", "nights", "night", "budget", "under", "around", "about", "from", "trip", "plan",
  "please", "some", "we", "our", "would", "like", "need", "traveling", "travelling", "authentic",
]);

const DEFAULTS = { budget: 15000, days: 4 };

export function parseTripRequest(text) {
  const lower = text.toLowerCase();

  // ₹15,000 / 15000 / 15k / rs 15,000
  const budgetMatch = lower.match(/(?:₹|rs\.?\s*|inr\s*)?([\d,]+(?:\.\d+)?)\s*(k\b)?/);
  let budget = DEFAULTS.budget;
  if (budgetMatch) {
    const value = Number.parseFloat(budgetMatch[1].replaceAll(",", ""));
    const scaled = budgetMatch[2] ? value * 1000 : value;
    // A bare "4 days" must not be read as a ₹4 budget.
    if (scaled >= 500) budget = scaled;
  }

  const daysMatch = lower.match(/(\d+)\s*(?:day|days|night|nights)/);
  const days = daysMatch ? Math.min(Math.max(Number(daysMatch[1]), 1), 30) : DEFAULTS.days;

  const interests = [
    ...new Set(
      lower
        .replace(/[₹]|rs\.?|inr/g, " ")
        .replace(/[\d,.]+k?/g, " ")
        .split(/[^a-z]+/)
        .filter((word) => word.length > 3 && !STOPWORDS.has(word)),
    ),
  ].slice(0, 6);

  // Trips start tomorrow unless the user says otherwise — a same-day start
  // makes "nights" ambiguous and nobody demos a trip that began this morning.
  const start = new Date(Date.now() + 86_400_000);
  const end = new Date(start.getTime() + (days - 1) * 86_400_000);
  const iso = (date) => date.toISOString().slice(0, 10);

  return { budget, interests, start_date: iso(start), end_date: iso(end) };
}
