/** The catalogue every screen reads from.
 *
 *  This build is frontend-only: there is no server, so the "database" is this
 *  module. Shapes deliberately mirror docs/BACKEND_SCHEMA.md — `listings`,
 *  `known_sites`, `advisories` — so wiring a real API later is a swap of the
 *  data source, not a rewrite of the screens.
 */

/* ── Hosts ─────────────────────────────────────────────────────────────── */

export const HOSTS = {
  meera: { id: "meera", name: "Meera Rawat", village: "Gushaini", language: "Hindi", joined: "2026-04-11", onboarded_via: "WhatsApp" },
  devki: { id: "devki", name: "Devki Negi", village: "Jibhi", language: "Hindi", joined: "2026-05-02", onboarded_via: "WhatsApp" },
  tashi: { id: "tashi", name: "Tashi Dorje", village: "Kaza", language: "Bhoti", joined: "2026-06-19", onboarded_via: "WhatsApp" },
  bhuvan: { id: "bhuvan", name: "Bhuvan Chandra", village: "Sari", language: "Garhwali", joined: "2026-03-28", onboarded_via: "Field partner" },
  laxmi: { id: "laxmi", name: "Laxmi Devi", village: "Munsiyari", language: "Kumaoni", joined: "2026-07-04", onboarded_via: "WhatsApp" },
};

/* ── Listings ──────────────────────────────────────────────────────────── */
/* status: live | needs_review | pending_verification | inactive           */

export const LISTINGS = [
  {
    id: "l-ghost-pine",
    host_id: "meera",
    title: "Ghost Pine Homestay",
    offering_type: "homestay",
    region: "Tirthan Valley, Himachal",
    district: "Kullu",
    price_amount: 1800,
    price_unit: "night",
    rating: 4.8,
    reviews: 64,
    status: "live",
    capacity: 6,
    tags: ["river", "quiet", "home-cooked"],
    description:
      "Three rooms above the Tirthan, a deodar balcony that catches the morning, and dinner cooked on the same chulha Meera's mother used. No television by design.",
    highlights: ["Trout stream at the door", "Siddhi Vinayak trail starts here", "Vegetarian Himachali thali included"],
  },
  {
    id: "l-loom",
    host_id: "devki",
    title: "Chandrakhani Loom Sessions",
    offering_type: "artisan_experience",
    region: "Naggar, Himachal",
    district: "Kullu",
    price_amount: 900,
    price_unit: "session",
    rating: 4.9,
    reviews: 41,
    status: "live",
    capacity: 4,
    tags: ["craft", "weaving", "hands-on"],
    description:
      "Four hours on a pit loom with Devki, who has been weaving Kullu pattu since she was eleven. You leave with the muffler you wove, mistakes included.",
    highlights: ["Raw Kullu wool provided", "Natural dye demonstration", "Take home what you weave"],
  },
  {
    id: "l-trout",
    host_id: "meera",
    title: "Pabbar Trout Walk",
    offering_type: "guide",
    region: "Rohru, Himachal",
    district: "Shimla",
    price_amount: 1200,
    price_unit: "day",
    rating: 4.6,
    reviews: 28,
    status: "live",
    capacity: 5,
    tags: ["river", "walking", "food"],
    description:
      "A slow day along the Pabbar with a licensed river guide — catch-and-release above the hatchery, apple orchards on the walk back, lunch at a roadside dhaba.",
    highlights: ["Rods and permits arranged", "Apple orchard stop in season", "Lunch included"],
  },
  {
    id: "l-riverside",
    host_id: "bhuvan",
    title: "Sari Village Riverside Rooms",
    offering_type: "homestay",
    region: "Chopta, Uttarakhand",
    district: "Rudraprayag",
    price_amount: 1400,
    price_unit: "night",
    rating: 4.7,
    reviews: 52,
    status: "live",
    capacity: 8,
    tags: ["mountains", "trek base", "budget"],
    description:
      "The last house before the Deoriatal trail. Bhuvan walks the route every week and will tell you, honestly, whether the weather is worth the climb.",
    highlights: ["Deoriatal trailhead, 10 min walk", "Hot water by solar", "Packed breakfast for trek days"],
  },
  {
    id: "l-kaza",
    host_id: "tashi",
    title: "Langza Mud House",
    offering_type: "homestay",
    region: "Spiti, Himachal",
    district: "Lahaul & Spiti",
    price_amount: 2200,
    price_unit: "night",
    rating: 4.9,
    reviews: 33,
    status: "live",
    capacity: 4,
    tags: ["high altitude", "stargazing", "remote"],
    description:
      "A traditional mud-and-timber house at 4,400m, rebuilt by Tashi to hold heat through a Spiti night. The Buddha statue is a two-minute walk; the Milky Way needs no walk at all.",
    highlights: ["Bukhari-heated rooms", "Fossil walk with Tashi", "Butter tea, endlessly"],
  },
  {
    id: "l-munsiyari",
    host_id: "laxmi",
    title: "Panchachuli View Homestay",
    offering_type: "homestay",
    region: "Munsiyari, Uttarakhand",
    district: "Pithoragarh",
    price_amount: 1600,
    price_unit: "night",
    rating: 4.8,
    reviews: 47,
    status: "live",
    capacity: 6,
    tags: ["mountains", "sunrise", "quiet"],
    description:
      "Five peaks across the valley, and Laxmi's kitchen window pointed straight at them. Kumaoni bhatt ki churkani for dinner, madira roti at dawn.",
    highlights: ["All five Panchachuli peaks visible", "Ringal bamboo craft demo", "Local Kumaoni cooking"],
  },
  {
    id: "l-ringal",
    host_id: "laxmi",
    title: "Ringal Bamboo Craft Morning",
    offering_type: "artisan_experience",
    region: "Munsiyari, Uttarakhand",
    district: "Pithoragarh",
    price_amount: 700,
    price_unit: "session",
    rating: 4.7,
    reviews: 19,
    status: "live",
    capacity: 6,
    tags: ["craft", "hands-on", "morning"],
    description:
      "Split, soak and weave hill bamboo into a basket that will outlive the trip. Three hours, tea throughout, no prior skill assumed.",
    highlights: ["Materials included", "Suitable for children", "Basket ships home if it won't fit your bag"],
  },
  {
    id: "l-jibhi",
    host_id: "devki",
    title: "Jibhi Wooden Cottage",
    offering_type: "homestay",
    region: "Jibhi, Himachal",
    district: "Kullu",
    price_amount: 2400,
    price_unit: "night",
    rating: 4.5,
    reviews: 71,
    status: "live",
    capacity: 4,
    tags: ["forest", "couples", "fireplace"],
    description:
      "Kath-kuni construction, a working fireplace, and a stream loud enough to sleep to. Devki's family have farmed this slope for four generations.",
    highlights: ["Wood-fired bukhari", "Forest waterfall, 20 min", "Breakfast from the kitchen garden"],
  },
  {
    id: "l-forager",
    host_id: "bhuvan",
    title: "Garhwali Forage & Cook",
    offering_type: "artisan_experience",
    region: "Chopta, Uttarakhand",
    district: "Rudraprayag",
    price_amount: 1100,
    price_unit: "session",
    rating: 4.8,
    reviews: 24,
    status: "live",
    capacity: 5,
    tags: ["food", "foraging", "hands-on"],
    description:
      "Walk the oak forest for lingda fern and stinging nettle, then cook both the way Garhwali kitchens have for centuries. Ends with eating what you picked.",
    highlights: ["Seasonal foraging walk", "Cook on a wood chulha", "Recipe card to take home"],
  },
  {
    id: "l-pangi",
    host_id: "tashi",
    title: "Pangi Valley Trek Guide",
    offering_type: "guide",
    region: "Pangi, Himachal",
    district: "Chamba",
    price_amount: 2800,
    price_unit: "day",
    rating: 4.9,
    reviews: 12,
    status: "live",
    capacity: 6,
    tags: ["trekking", "remote", "expert"],
    description:
      "Multi-day routes through one of the least-visited valleys in the western Himalaya, led by a guide who grew up walking them for work rather than sport.",
    highlights: ["Certified mountain guide", "Village-to-village routes", "Porter arrangement available"],
  },
  {
    id: "l-orchard",
    host_id: "meera",
    title: "Banjar Orchard Rooms",
    offering_type: "homestay",
    region: "Banjar, Himachal",
    district: "Kullu",
    price_amount: 1500,
    price_unit: "night",
    rating: 4.4,
    reviews: 9,
    status: "needs_review",
    capacity: 5,
    tags: ["orchard", "family", "new"],
    description:
      "Two new rooms at the top of the apple orchard, finished this spring. Shares the kitchen with the main house.",
    highlights: ["Apple picking in season", "Family-friendly", "Parking at the gate"],
    verification_notes:
      "Photos show four beds but the listing says capacity five, and the stated tariff is 38% below every other Banjar homestay. Confirm both with Meera before this goes live.",
  },
  {
    id: "l-kaza-cafe",
    host_id: "tashi",
    title: "Spiti Barley Kitchen",
    offering_type: "artisan_experience",
    region: "Spiti, Himachal",
    district: "Lahaul & Spiti",
    price_amount: 850,
    price_unit: "session",
    rating: null,
    reviews: 0,
    status: "pending_verification",
    capacity: 8,
    tags: ["food", "new", "high altitude"],
    description:
      "Roast, grind and eat your own tsampa, then make thukpa with the barley grown on the family's own terrace.",
    highlights: ["Barley from the family terrace", "Vegetarian", "Runs year-round"],
  },
];

/* ── Known sites ───────────────────────────────────────────────────────── */
/* The standard circuit, so the planner can say what it is steering around.  */

export const KNOWN_SITES = [
  { id: "s-manali", name: "Manali Mall Road", region: "Kullu, Himachal", load: 94, trend: "up", note: "At 94% of comfortable capacity every weekend since April." },
  { id: "s-kasol", name: "Kasol & Chalal", region: "Kullu, Himachal", load: 88, trend: "up", note: "Waste load exceeds municipal collection on peak days." },
  { id: "s-shimla", name: "Shimla Ridge", region: "Shimla, Himachal", load: 91, trend: "flat", note: "Parking saturation from 11:00 on all public holidays." },
  { id: "s-rishikesh", name: "Rishikesh Ghats", region: "Dehradun, Uttarakhand", load: 86, trend: "up", note: "Raft-launch queues past two hours in season." },
  { id: "s-nainital", name: "Naini Lake", region: "Nainital, Uttarakhand", load: 83, trend: "flat", note: "Boat licences capped; demand well past the cap." },
  { id: "s-tirthan", name: "Tirthan Valley", region: "Kullu, Himachal", load: 34, trend: "up", note: "Room nights growing 3× year on year from a small base." },
  { id: "s-chopta", name: "Chopta & Deoriatal", region: "Rudraprayag, Uttarakhand", load: 41, trend: "up", note: "Trek permits comfortably under quota on weekdays." },
  { id: "s-munsiyari", name: "Munsiyari", region: "Pithoragarh, Uttarakhand", load: 27, trend: "up", note: "Eleven new homestays registered since the road upgrade." },
  { id: "s-spiti", name: "Spiti Circuit", region: "Lahaul & Spiti, Himachal", load: 38, trend: "up", note: "Season limited by road opening, not by demand." },
  { id: "s-pangi", name: "Pangi Valley", region: "Chamba, Himachal", load: 12, trend: "flat", note: "Almost no formal inventory — the largest untapped gap in the state." },
];

/* ── Safety advisories ─────────────────────────────────────────────────── */
/* severity: info | caution | warning                                       */

export const ADVISORIES = [
  {
    id: "a-nh305",
    region: "Kullu, Himachal",
    severity: "caution",
    title: "NH-305 single-lane near Aut",
    body: "Slope repair has the Aut–Banjar stretch down to one lane between 09:00 and 16:00. Budget an extra hour on the Tirthan approach, or cross before nine.",
    updated: "2026-09-14",
    source: "HP PWD bulletin",
  },
  {
    id: "a-weather",
    region: "Rudraprayag, Uttarakhand",
    severity: "warning",
    title: "Heavy rain forecast, Chopta ridge",
    body: "IMD orange alert for the next 48 hours above 2,500m. The Deoriatal climb is unpleasant and the Chandrashila summit push is not advisable in this window.",
    updated: "2026-09-15",
    source: "IMD Dehradun",
  },
  {
    id: "a-permit",
    region: "Lahaul & Spiti, Himachal",
    severity: "info",
    title: "Inner-line permits not required for Indian nationals",
    body: "Kaza, Langza and Komic need no permit for domestic travellers. Foreign nationals still register at Kaza SDM office — carry two passport copies.",
    updated: "2026-09-02",
    source: "District administration",
  },
  {
    id: "a-atm",
    region: "Pithoragarh, Uttarakhand",
    severity: "info",
    title: "Last reliable ATM at Thal",
    body: "Cash machines above Thal are frequently out of service. Most Munsiyari homestays accept UPI, but guides and porters generally do not.",
    updated: "2026-08-29",
    source: "Platform host reports",
  },
  {
    id: "a-scam",
    region: "Kullu, Himachal",
    severity: "caution",
    title: "Unregistered taxi pricing at Bhuntar",
    body: "Three reports this month of quoted fares three to four times the HRTC rate for the airport transfer. Book the transfer through your host instead.",
    updated: "2026-09-08",
    source: "Platform traveller reports",
  },
];

/* ── Government: regional outcomes ─────────────────────────────────────── */

export const REGIONS = [
  { id: "kullu", name: "Kullu", state: "Himachal Pradesh", load: 72, homestays: 148, bookings: 612, income: 2840000, growth: 41, scheme: "Swadesh Darshan 2.0" },
  { id: "shimla", name: "Shimla", state: "Himachal Pradesh", load: 84, homestays: 96, bookings: 388, income: 1720000, growth: 18, scheme: "Swadesh Darshan 2.0" },
  { id: "spiti", name: "Lahaul & Spiti", state: "Himachal Pradesh", load: 38, homestays: 54, bookings: 176, income: 1130000, growth: 67, scheme: "Vibrant Villages" },
  { id: "chamba", name: "Chamba", state: "Himachal Pradesh", load: 21, homestays: 22, bookings: 48, income: 268000, growth: 84, scheme: "Vibrant Villages" },
  { id: "rudraprayag", name: "Rudraprayag", state: "Uttarakhand", load: 46, homestays: 71, bookings: 254, income: 946000, growth: 52, scheme: "MUDRA homestay" },
  { id: "pithoragarh", name: "Pithoragarh", state: "Uttarakhand", load: 29, homestays: 63, bookings: 191, income: 742000, growth: 73, scheme: "MUDRA homestay" },
  { id: "dehradun", name: "Dehradun", state: "Uttarakhand", load: 79, homestays: 112, bookings: 441, income: 1980000, growth: 12, scheme: "Swadesh Darshan 2.0" },
  { id: "nainital", name: "Nainital", state: "Uttarakhand", load: 81, homestays: 134, bookings: 502, income: 2210000, growth: 9, scheme: "Swadesh Darshan 2.0" },
];

export const SCHEME_METRICS = [
  { id: "mudra", name: "MUDRA homestay loans", sanctioned: 134, live_on_platform: 118, income: 1688000, note: "88% of sanctioned units are listed and taking bookings." },
  { id: "swadesh", name: "Swadesh Darshan 2.0", sanctioned: 312, live_on_platform: 204, income: 8750000, note: "Four destinations still have no verified inventory at all." },
  { id: "vibrant", name: "Vibrant Villages", sanctioned: 76, live_on_platform: 41, income: 1398000, note: "Fastest growth of any scheme, from the smallest base." },
];

export const ARRIVALS = [
  { month: "Apr", domestic: 182, foreign: 21 },
  { month: "May", domestic: 241, foreign: 28 },
  { month: "Jun", domestic: 198, foreign: 24 },
  { month: "Jul", domestic: 143, foreign: 17 },
  { month: "Aug", domestic: 156, foreign: 19 },
  { month: "Sep", domestic: 227, foreign: 34 },
];

/* ── Lookups ───────────────────────────────────────────────────────────── */

export const listingById = (id) => LISTINGS.find((listing) => listing.id === id) ?? null;
export const hostById = (id) => HOSTS[id] ?? null;
export const siteById = (id) => KNOWN_SITES.find((site) => site.id === id) ?? null;

export const liveListings = () => LISTINGS.filter((listing) => listing.status === "live");

export const advisoriesFor = (regions = []) =>
  ADVISORIES.filter((advisory) => regions.some((region) => advisory.region.split(",")[0].trim() === region));
