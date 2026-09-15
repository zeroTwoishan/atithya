/** The planning agent, run entirely in the browser.
 *
 *  There is no backend in this build, so the itinerary is composed here from
 *  the catalogue instead of coming back from an LLM. It is deterministic on
 *  purpose: the same sentence produces the same trip every time, which is what
 *  you want on a stage. The output shape is what a real planning agent would
 *  return — an itinerary, the loop it walked to get there, the option it
 *  picked, and the options it rejected and why.
 */

import { LISTINGS, KNOWN_SITES, ADVISORIES } from "../data/catalog";

const DAY = 86_400_000;

/* ── Reading the request ───────────────────────────────────────────────── */

const STOPWORDS = new Set([
  "and", "with", "for", "the", "a", "an", "want", "i", "im", "looking", "to", "in", "of", "my",
  "days", "day", "nights", "night", "budget", "under", "around", "about", "from", "trip", "plan",
  "please", "some", "we", "our", "would", "like", "need", "traveling", "travelling", "authentic",
  "want", "take", "somewhere", "something", "there", "that", "this", "very", "really", "much",
]);

/** Interest words the catalogue actually knows how to satisfy. */
const INTEREST_MAP = {
  mountain: ["mountains", "trek base", "high altitude"],
  mountains: ["mountains", "trek base", "high altitude"],
  trek: ["trekking", "trek base", "mountains"],
  trekking: ["trekking", "trek base"],
  hike: ["trekking", "trek base"],
  craft: ["craft", "weaving", "hands-on"],
  crafts: ["craft", "weaving", "hands-on"],
  weaving: ["weaving", "craft"],
  artisan: ["craft", "hands-on"],
  food: ["food", "home-cooked", "foraging"],
  cooking: ["food", "foraging"],
  quiet: ["quiet", "remote", "forest"],
  peace: ["quiet", "remote"],
  remote: ["remote", "quiet"],
  offbeat: ["remote", "quiet", "forest"],
  river: ["river", "forest"],
  rivers: ["river"],
  valley: ["river", "forest", "quiet"],
  valleys: ["river", "forest", "quiet"],
  forest: ["forest", "quiet"],
  stars: ["stargazing", "high altitude"],
  stargazing: ["stargazing", "high altitude"],
  homestay: ["home-cooked", "family"],
  homestays: ["home-cooked", "family"],
  family: ["family", "budget"],
  budget: ["budget"],
  cheap: ["budget"],
  sunrise: ["sunrise", "mountains"],
};

/** "₹15,000, 4 days, mountains and craft" → { budget, days, interests } */
export function readRequest(text) {
  const lower = String(text ?? "").toLowerCase();

  // Budget: ₹15,000 / 15000 / 15k / rs 15,000. A bare "4 days" must not read
  // as a ₹4 budget, so anything under ₹500 is ignored.
  let budget = 15_000;
  for (const match of lower.matchAll(/(?:₹|rs\.?\s*|inr\s*)?([\d][\d,]*(?:\.\d+)?)\s*(k\b)?/g)) {
    const value = Number.parseFloat(match[1].replaceAll(",", ""));
    const scaled = match[2] ? value * 1000 : value;
    if (Number.isFinite(scaled) && scaled >= 500) {
      budget = Math.round(scaled);
      break;
    }
  }

  const daysMatch = lower.match(/(\d+)\s*(?:day|days|night|nights)/);
  const days = daysMatch ? Math.min(Math.max(Number(daysMatch[1]), 2), 14) : 4;

  const words = lower
    .replace(/[₹]|rs\.?|inr/g, " ")
    .replace(/[\d,.]+k?/g, " ")
    .split(/[^a-z]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  const tags = [...new Set(words.flatMap((word) => INTEREST_MAP[word] ?? []))];
  const interests = [...new Set(words.filter((word) => INTEREST_MAP[word]))].slice(0, 5);

  return { budget, days, interests, tags: tags.length ? tags : ["quiet", "home-cooked"], text: String(text ?? "").trim() };
}

/* ── Scoring ───────────────────────────────────────────────────────────── */

/** Every listing gets a score out of 100 and, more importantly, the reasons
 *  behind it — the traveller sees the reasons, not the number alone. */
function score(listing, request) {
  const nightly = listing.price_amount;
  const perDay = request.budget / request.days;
  const reasons = [];
  let points = 40;

  const matched = listing.tags.filter((tag) => request.tags.includes(tag));
  if (matched.length) {
    points += Math.min(matched.length * 12, 30);
    reasons.push(`Matches ${matched.join(", ")}`);
  }

  if (listing.rating) {
    points += (listing.rating - 4) * 22;
    reasons.push(`Rated ${listing.rating.toFixed(1)} across ${listing.reviews} stays`);
  }

  if (nightly <= perDay * 0.6) {
    points += 14;
    reasons.push(`₹${(perDay - nightly).toLocaleString("en-IN", { maximumFractionDigits: 0 })} a day under your ceiling`);
  } else if (nightly > perDay) {
    points -= 18;
    reasons.push("Above your nightly ceiling");
  }

  return { points: Math.round(Math.max(0, Math.min(100, points))), reasons };
}

/* ── Composing the trip ────────────────────────────────────────────────── */

const isoDate = (date) => new Date(date).toISOString().slice(0, 10);

/** Build a full trip from a free-text request. Pure — no state, no clock
 *  beyond "tomorrow", so a rerun in the same session is identical. */
export function planTrip(text, { startAt = Date.now() + DAY } = {}) {
  const request = readRequest(text);

  const stays = LISTINGS.filter((listing) => listing.status === "live" && listing.offering_type === "homestay")
    .map((listing) => ({ listing, ...score(listing, request) }))
    .sort((a, b) => b.points - a.points);

  const chosen = stays[0];
  const rejected = stays.slice(1, 3);

  const experiences = LISTINGS.filter(
    (listing) =>
      listing.status === "live" &&
      listing.offering_type !== "homestay" &&
      listing.district === chosen.listing.district,
  );

  // Anything in the district, then anything at all, so a thin district still
  // produces a trip with something to do in it.
  const pool = experiences.length
    ? experiences
    : LISTINGS.filter((listing) => listing.status === "live" && listing.offering_type !== "homestay");

  const districtName = chosen.listing.district;
  const nearbySites = KNOWN_SITES.filter((site) => site.region.startsWith(districtName) && site.load < 60);
  const fallbackSites = KNOWN_SITES.filter((site) => site.load < 60);
  const sites = nearbySites.length ? nearbySites : fallbackSites;

  const items = [];
  let cost = 0;

  for (let day = 1; day <= request.days; day += 1) {
    // Every night is the same stay — a single base beats hopping on a short
    // trip, and the traveller can swap it from the itinerary.
    items.push({
      day,
      sequence: 1,
      kind: "stay",
      listing_id: chosen.listing.id,
      title: chosen.listing.title,
      region: chosen.listing.region,
      note: day === 1 ? "Check in, dinner with the family" : "Night " + day,
      amount: chosen.listing.price_amount,
    });
    cost += chosen.listing.price_amount;

    if (day === 1) {
      items.push({
        day,
        sequence: 2,
        kind: "site",
        site_id: sites[0]?.id,
        title: sites[0]?.name ?? "Settle in",
        region: sites[0]?.region ?? chosen.listing.region,
        note: "Short walk to find your feet after the drive",
        amount: 0,
      });
    } else if (pool[(day - 2) % pool.length]) {
      const experience = pool[(day - 2) % pool.length];
      items.push({
        day,
        sequence: 2,
        kind: "experience",
        listing_id: experience.id,
        title: experience.title,
        region: experience.region,
        note: experience.highlights[0],
        amount: experience.price_amount,
      });
      cost += experience.price_amount;
    }

    if (day === request.days) {
      items.push({
        day,
        sequence: 3,
        kind: "site",
        site_id: sites[1]?.id ?? sites[0]?.id,
        title: sites[1]?.name ?? sites[0]?.name ?? "Slow morning",
        region: chosen.listing.region,
        note: "Last morning before the road down",
        amount: 0,
      });
    }
  }

  // Travel is the line every itinerary quietly forgets. Keep it visible.
  const travel = Math.round(request.days * 650);
  cost += travel;

  const start = new Date(startAt);
  const end = new Date(startAt + (request.days - 1) * DAY);
  const regionKey = chosen.listing.region.split(",")[0].trim();
  const districtKey = chosen.listing.district;

  const advisories = ADVISORIES.filter(
    (advisory) => advisory.region.startsWith(districtKey) || advisory.region.startsWith(regionKey),
  ).map((advisory) => advisory.id);

  return {
    id: `t-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
    request: request.text,
    title: chosen.listing.region.split(",")[0].trim(),
    budget: request.budget,
    days: request.days,
    interests: request.interests,
    tags: request.tags,
    start_date: isoDate(start),
    end_date: isoDate(end),
    status: "draft",
    estimated_cost: cost,
    travel_cost: travel,
    items,
    advisories,
    choice: {
      listing_id: chosen.listing.id,
      score: chosen.points,
      reasons: chosen.reasons,
    },
    rejected: rejected.map((entry) => ({
      listing_id: entry.listing.id,
      score: entry.points,
      reasons: entry.reasons,
      flag:
        entry.listing.price_amount > request.budget / request.days
          ? "over budget"
          : entry.points < chosen.points - 20
            ? "weaker match"
            : "close second",
    })),
    narrative: narrate(request, chosen.listing, cost),
    loop: buildLoop(request, chosen, rejected, cost, advisories),
  };
}

function narrate(request, listing, cost) {
  const headroom = request.budget - cost;
  const where = listing.region.split(",")[0].trim();
  const money =
    headroom >= 0
      ? `That leaves ₹${headroom.toLocaleString("en-IN")} of your ₹${request.budget.toLocaleString("en-IN")} unspent.`
      : `That is ₹${Math.abs(headroom).toLocaleString("en-IN")} over your ceiling — drop a day or a workshop and it clears.`;

  return `${request.days} days based in ${where}, staying with ${listing.title.replace(/ Homestay| Rooms| Cottage| House/, "")}. I kept you off the Manali–Kasol line entirely; everything here is a verified host taking under half the visitors they can hold. ${money}`;
}

/** The loop the agent walked. Rendered as the vertical timeline on the trip
 *  screen — the point is that every step is inspectable after the fact. */
function buildLoop(request, chosen, rejected, cost, advisories) {
  const nightly = chosen.listing.price_amount;
  const advisory = ADVISORIES.find((entry) => advisories.includes(entry.id));

  return [
    {
      key: "understand",
      label: "Understand",
      summary: `${request.days} days · up to ₹${request.budget.toLocaleString("en-IN")}`,
      detail: [
        `intent  ${request.interests.length ? request.interests.join(", ") : "open"}`,
        `budget ceiling  ₹${request.budget.toLocaleString("en-IN")}`,
        `nights  ${request.days}`,
      ],
    },
    {
      key: "search",
      label: "Search",
      summary: `${LISTINGS.filter((l) => l.status === "live").length} verified listings across ${new Set(LISTINGS.map((l) => l.district)).size} districts`,
      detail: [
        `${chosen.listing.title}  ₹${nightly.toLocaleString("en-IN")}`,
        ...rejected.map((entry) => `${entry.listing.title}  ₹${entry.listing.price_amount.toLocaleString("en-IN")}`),
      ],
    },
    {
      key: "compare",
      label: "Compare",
      summary: "Scored on fit, rating, price and crowding",
      detail: [
        `#1 ${chosen.listing.title} — score ${chosen.points}`,
        ...rejected.map((entry, index) => `#${index + 2} ${entry.listing.title} — score ${entry.points}`),
      ],
    },
    {
      key: "decide",
      label: "Decide",
      summary: `${chosen.listing.title} — ₹${nightly.toLocaleString("en-IN")} a night`,
      detail: chosen.reasons.slice(0, 3),
    },
    {
      key: "route",
      label: "Route",
      summary: `${request.days}-day route, single base`,
      detail: [
        `total ₹${cost.toLocaleString("en-IN")} including travel`,
        `${chosen.listing.region} at ${KNOWN_SITES.find((s) => s.region.startsWith(chosen.listing.district))?.load ?? 30}% of capacity`,
      ],
    },
    {
      key: "safety",
      label: "Check safety",
      summary: advisory ? advisory.title : "No active advisories on this route",
      detail: advisory ? [advisory.body] : ["Route clear at time of planning"],
    },
    {
      key: "approval",
      label: "Request approval",
      summary: `₹${cost.toLocaleString("en-IN")} needs your confirmation`,
      detail: ["above the ₹2,000 auto-approve limit", "first booking with this host"],
    },
    {
      key: "book",
      label: "Book",
      summary: "Holds the rooms, notifies the host",
      detail: ["100% of the room rate reaches the host", "free cancellation up to 72 hours before"],
    },
    {
      key: "verify",
      label: "Verify",
      summary: "Confirmed with the host over WhatsApp",
      detail: ["host acknowledged in their own language", "booking reference issued"],
    },
  ];
}

/** Re-planning after a disruption: drop the affected day, extend the base,
 *  and say plainly what changed. */
export function replan(trip, disruption) {
  const affected = Math.min(2, trip.days);
  const items = trip.items.map((item) =>
    item.day === affected && item.kind !== "stay"
      ? {
          ...item,
          kind: "experience",
          title: "Indoor loom session with Devki",
          note: "Swapped in — the original stop is weather-affected",
          swapped: true,
        }
      : item,
  );

  return {
    ...trip,
    items,
    replanned: true,
    disruption,
    narrative: `${disruption} I moved day ${affected} indoors — the loom session runs whatever the weather, and the trail stop shifts to your last morning if it clears. Nothing about your booking or your total changed.`,
  };
}
