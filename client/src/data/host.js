/** Seeded host-side history.
 *
 *  A host dashboard is worthless with an empty calendar, and a prototype has
 *  no real booking history to draw on — so this is three months of plausible
 *  stays across the demo host's listings. Figures elsewhere in the host
 *  dashboard are computed from this array, never hard-coded.
 */

export const DEMO_HOST_ID = "meera";

/** Listings the demo host owns, in the order they were onboarded. */
export const HOST_LISTING_IDS = ["l-ghost-pine", "l-trout", "l-orchard"];

export const BOOKINGS = [
  { id: "b-01", listing_id: "l-ghost-pine", guest: "Aditya S.", nights: 3, guests: 2, amount: 5400, start: "2026-09-19", status: "confirmed", channel: "Atithya" },
  { id: "b-02", listing_id: "l-ghost-pine", guest: "Reema & Farhan", nights: 2, guests: 2, amount: 3600, start: "2026-09-24", status: "confirmed", channel: "Atithya" },
  { id: "b-03", listing_id: "l-trout", guest: "Kabir M.", nights: 1, guests: 4, amount: 1200, start: "2026-09-21", status: "confirmed", channel: "Atithya" },
  { id: "b-04", listing_id: "l-ghost-pine", guest: "The Naiks", nights: 4, guests: 5, amount: 7200, start: "2026-10-02", status: "confirmed", channel: "Atithya" },
  { id: "b-05", listing_id: "l-ghost-pine", guest: "Ishita R.", nights: 2, guests: 1, amount: 3600, start: "2026-08-28", status: "completed", channel: "Atithya" },
  { id: "b-06", listing_id: "l-trout", guest: "Dev & Anya", nights: 1, guests: 2, amount: 1200, start: "2026-08-30", status: "completed", channel: "WhatsApp" },
  { id: "b-07", listing_id: "l-ghost-pine", guest: "Sunita P.", nights: 5, guests: 3, amount: 9000, start: "2026-08-12", status: "completed", channel: "Atithya" },
  { id: "b-08", listing_id: "l-ghost-pine", guest: "Arun B.", nights: 2, guests: 2, amount: 3600, start: "2026-07-25", status: "completed", channel: "WhatsApp" },
  { id: "b-09", listing_id: "l-trout", guest: "Meghna T.", nights: 1, guests: 3, amount: 1200, start: "2026-07-19", status: "completed", channel: "Atithya" },
  { id: "b-10", listing_id: "l-ghost-pine", guest: "The Josephs", nights: 3, guests: 4, amount: 5400, start: "2026-07-04", status: "completed", channel: "Atithya" },
];

/** The pricing copilot's suggestions — the reason a host keeps the app open
 *  once the novelty of the listing has worn off. */
export const PRICING = [
  {
    listing_id: "l-ghost-pine",
    current: 1800,
    suggested: 2150,
    confidence: "high",
    why: "Every comparable Tirthan homestay is between ₹2,000 and ₹2,400 for the first week of October, and you are 84% booked for it already.",
    window: "1–10 October",
  },
  {
    listing_id: "l-trout",
    current: 1200,
    suggested: 1200,
    confidence: "hold",
    why: "Priced correctly. Guide rates in Rohru have not moved this season and you convert 6 of every 10 enquiries at this rate.",
    window: "Rest of season",
  },
  {
    listing_id: "l-orchard",
    current: 1500,
    suggested: 1900,
    confidence: "medium",
    why: "This sits 38% under every other Banjar homestay. Verification flagged the same gap — raising it will also clear the review.",
    window: "From listing approval",
  },
];

/** Occupancy by month, as a percentage of available nights. */
export const OCCUPANCY = [
  { month: "Jun", pct: 34 },
  { month: "Jul", pct: 58 },
  { month: "Aug", pct: 71 },
  { month: "Sep", pct: 84 },
  { month: "Oct", pct: 62 },
];

export const PAYOUTS = [
  { id: "p-1", period: "August 2026", amount: 21600, status: "paid", on: "2026-09-03" },
  { id: "p-2", period: "July 2026", amount: 12000, status: "paid", on: "2026-08-03" },
  { id: "p-3", period: "September 2026", amount: 17400, status: "pending", on: "2026-10-03" },
];
