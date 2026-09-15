/** docs/BACKEND_SCHEMA.md §5 — demo seed data.
 *
 *  Idempotent: it clears every table it owns first, because it gets re-run
 *  between rehearsals. Run after `npm run db:init`.
 */
import { getPool, query } from "./index.js";
import { hashPassword } from "../auth.js";
import { ROLE, OFFERING_TYPE, PRICE_UNIT, LISTING_STATUS, TRIP_STATUS, BOOKING_STATUS, PAYOUT_STATUS, SEVERITY } from "../constants.js";

const KNOWN_SITES = [
  ["Kasol", "Parvati Valley, HP", "town", "Backpacker hub on the Parvati river, gateway to the valley."],
  ["Jibhi", "Banjar Valley, HP", "village", "Quiet pine-forest village popular for waterfalls and slow travel."],
  ["Chhoie Waterfall", "Tirthan Valley, HP", "nature", "Short forest trek to a seasonal waterfall near Gushaini."],
  ["Jalori Pass", "Banjar Valley, HP", "mountain-pass", "3,120m pass connecting Kullu and Shimla districts."],
  ["Great Himalayan National Park (GHNP) buffer", "Tirthan Valley, HP", "eco-zone", "UNESCO-listed park buffer with guided nature walks."],
  ["Serolsar Lake", "Banjar Valley, HP", "nature", "Forest lake a 5km walk from Jalori Pass, oak and rhododendron trail."],
  ["Chehni Kothi", "Tirthan Valley, HP", "heritage", "1,500-year-old kathkuni tower, the tallest surviving in Himachal."],
  ["Manikaran", "Parvati Valley, HP", "pilgrimage", "Hot springs and Sikh/Hindu pilgrimage site on the Parvati."],
  ["Bijli Mahadev", "Kullu, HP", "pilgrimage", "Hilltop temple with a panoramic view of the Kullu valley."],
  ["Malana", "Parvati Valley, HP", "village", "Isolated village with its own customary governance, permit-restricted trail."],
  ["Gushaini", "Tirthan Valley, HP", "village", "Confluence village where the Falachan meets the Tirthan."],
  ["Shoja", "Banjar Valley, HP", "village", "Cedar-forest hamlet below Jalori Pass, waterfall and ridge views."],
  ["Naggar Castle", "Kullu, HP", "heritage", "15th-century castle and Roerich art gallery above the Beas."],
  ["Tirthan River Trail", "Tirthan Valley, HP", "nature", "Riverside trail with trout pools and rope bridges."],
  ["Raghupur Fort", "Banjar Valley, HP", "heritage", "Ruined fort meadow an hour's climb from Jalori Pass."],
  ["Bahu Village Weavers", "Kullu, HP", "craft", "Handloom hamlet known for Kullu shawls and patti weaving."],
];

const USERS = [
  // The 3 fixed demo accounts (docs/TRD.md §4) — password == username.
  { username: "tourist_demo", name: "Aditya Sharma", role: ROLE.TOURIST, language: "en", phone: "+919800000010" },
  { username: "host_demo", name: "Meera Devi", role: ROLE.HOST, language: "hi", phone: "+919800000001" },
  { username: "gov_demo", name: "HP Tourism Board", role: ROLE.GOV, language: "en", phone: "+919800000020" },
  // Extra hosts so the regional median has something to compare against.
  { username: "roshan_thakur", name: "Roshan Thakur", role: ROLE.HOST, language: "hi", phone: "+919800000002" },
  { username: "kullu_handloom_guild", name: "Kullu Handloom Guild", role: ROLE.HOST, language: "hi", phone: "+919800000003" },
  { username: "devi_ram", name: "Devi Ram Negi", role: ROLE.HOST, language: "hi", phone: "+919800000004" },
];

const LISTINGS = [
  // host_demo's four — the deck's host portal shows exactly this mix:
  // live, live, needs_review, pending.
  { host: "host_demo", type: OFFERING_TYPE.HOMESTAY, title: "Meera Devi's Himalayan Homestay", region: "Tirthan Valley, HP",
    price: 1850, unit: PRICE_UNIT.NIGHT, status: LISTING_STATUS.LIVE,
    description: "Traditional kathkuni-style homestay with fire-cooked Pahadi meals and river-facing rooms. Bukhari wood-stove heating in every room." },
  { host: "host_demo", type: OFFERING_TYPE.HOMESTAY, title: "Chehni Kothi Cedar Rooms", region: "Tirthan Valley, HP",
    price: 2400, unit: PRICE_UNIT.NIGHT, status: LISTING_STATUS.LIVE,
    description: "Two cedar-panelled rooms below the Chehni Kothi tower, orchard breakfast included." },
  { host: "host_demo", type: OFFERING_TYPE.ARTISAN_EXPERIENCE, title: "Kangri Dham Cooking Afternoon", region: "Tirthan Valley, HP",
    price: 14500, unit: PRICE_UNIT.EXPERIENCE, status: LISTING_STATUS.NEEDS_REVIEW,
    description: "Cook a full Kangri dham on a wood fire — madra, khatta, badana — and eat it on the terrace.",
    notes: "Price ₹14500 is more than 2 standard deviations from the ₹1200 regional average for artisan_experience in Tirthan Valley, HP." },
  { host: "host_demo", type: OFFERING_TYPE.GUIDE, title: "Chhoie Waterfall Forest Walk", region: "Tirthan Valley, HP",
    price: 800, unit: PRICE_UNIT.PERSON, status: LISTING_STATUS.PENDING_VERIFICATION,
    description: "Three-hour guided walk to the Chhoie fall through deodar and bhojpatra." },

  { host: "roshan_thakur", type: OFFERING_TYPE.GUIDE, title: "Sunrise Fly-Fishing & River Walk along Tirthan", region: "Tirthan Valley, HP",
    price: 1400, unit: PRICE_UNIT.PERSON, status: LISTING_STATUS.LIVE,
    description: "Wade into glacial pools with handcrafted bamboo rods, catch-and-release fly casting on the Tirthan." },
  { host: "roshan_thakur", type: OFFERING_TYPE.HOMESTAY, title: "Falachan Valley Farm Stay", region: "Tirthan Valley, HP",
    price: 1100, unit: PRICE_UNIT.NIGHT, status: LISTING_STATUS.LIVE,
    description: "Working apple farm with three guest rooms, home-churned butter and river access." },
  { host: "kullu_handloom_guild", type: OFFERING_TYPE.ARTISAN_EXPERIENCE, title: "Patti Weaving & Natural Walnut Dyeing with Meena Di", region: "Kullu, HP",
    price: 950, unit: PRICE_UNIT.EXPERIENCE, status: LISTING_STATUS.LIVE,
    description: "Sit by the handloom in a 100-year-old workshop, natural walnut wood dye, weave your own patti." },
  { host: "kullu_handloom_guild", type: OFFERING_TYPE.ARTISAN_EXPERIENCE, title: "Kullu Shawl Loom Morning", region: "Kullu, HP",
    price: 1200, unit: PRICE_UNIT.EXPERIENCE, status: LISTING_STATUS.LIVE,
    description: "Half a day at the pit loom learning the Kullu border motif from third-generation weavers." },
  { host: "devi_ram", type: OFFERING_TYPE.HOMESTAY, title: "Shoja Ridge Wooden Cottage", region: "Banjar Valley, HP",
    price: 2100, unit: PRICE_UNIT.NIGHT, status: LISTING_STATUS.LIVE,
    description: "Two-room cedar cottage on the Shoja ridge, wood stove, views to Jalori Pass." },
  { host: "devi_ram", type: OFFERING_TYPE.GUIDE, title: "Serolsar Lake Oak Forest Trek", region: "Banjar Valley, HP",
    price: 1300, unit: PRICE_UNIT.PERSON, status: LISTING_STATUS.LIVE,
    description: "Guided 10km round trip from Jalori Pass to Serolsar through moss-hung oak." },
];

const ADVISORIES = [
  ["Tirthan Valley, HP", "road", "Safe to travel. No active landslides or road blocks on NH-305. Aut tunnel to Gushaini clear.", SEVERITY.INFO],
  ["Banjar Valley, HP", "weather", "High-altitude cold advisory after sunset near Jalori Pass — carry warm layers.", SEVERITY.CAUTION],
  ["Parvati Valley, HP", "safety", "Solo night trekking to Malana is discouraged; use a registered local guide.", SEVERITY.CAUTION],
  ["Kullu, HP", "crowding", "Dussehra week sees heavy footfall in Kullu town — book transport ahead.", SEVERITY.INFO],
];

const REVIEW_COMMENTS = [
  "Wonderful, authentic experience. Meera ji's food alone is worth the trip.",
  "Spotless rooms and the river right there. Would come back in spring.",
  "Our guide knew every bird on the trail. Kids loved it.",
  "Simple, warm and honest. Exactly what the listing described.",
  "The wood stove kept us warm all night. Great value.",
];

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

async function seed() {
  // Order matters: children before parents (foreign keys).
  await query(`TRUNCATE reviews, bookings, wallet_transactions, payouts, itinerary_items,
                        trips, conversation_state, listings, safety_advisories, known_sites, users
                RESTART IDENTITY CASCADE`);

  const sites = new Map();
  for (const [name, region, category, description] of KNOWN_SITES) {
    const { rows } = await query(
      "INSERT INTO known_sites (name, region, category, description) VALUES ($1,$2,$3,$4) RETURNING id",
      [name, region, category, description],
    );
    sites.set(name, rows[0].id);
  }

  const users = new Map();
  for (const user of USERS) {
    const { rows } = await query(
      `INSERT INTO users (role, phone, name, username, password, language)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [user.role, user.phone, user.name, user.username, hashPassword(user.username), user.language],
    );
    users.set(user.username, rows[0].id);
  }

  const listings = [];
  for (const listing of LISTINGS) {
    const { rows } = await query(
      `INSERT INTO listings (host_user_id, offering_type, title, description, price_amount,
                             price_unit, region, status, verification_notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() - ($10 || ' days')::interval)
       RETURNING id, host_user_id, price_amount, region, status`,
      [
        users.get(listing.host), listing.type, listing.title, listing.description, listing.price,
        listing.unit, listing.region, listing.status, listing.notes ?? "",
        String(90 - listings.length * 7), // staggered so gov growth charts have a slope
      ],
    );
    listings.push(rows[0]);
  }

  for (const [region, category, message, severity] of ADVISORIES) {
    await query(
      "INSERT INTO safety_advisories (region, category, message, severity) VALUES ($1,$2,$3,$4)",
      [region, category, message, severity],
    );
  }

  // Booking history: enough volume for the host tiles and the government
  // trend charts to have a shape rather than a flat line. Deterministic —
  // a rehearsal and the real run produce the same dashboard.
  const touristId = users.get("tourist_demo");
  const liveListings = listings.filter((listing) => listing.status === LISTING_STATUS.LIVE);
  let bookingCount = 0;

  for (let week = 0; week < 16; week++) {
    for (const [index, listing] of liveListings.entries()) {
      // A deterministic 0-2 stays per listing per week, heavier for the demo
      // host's rooms so their month tile reads like a working homestay.
      const stays = (week * 7 + index * 3) % 5 === 0 ? 2 : (week + index) % 3 === 0 ? 1 : 0;
      for (let n = 0; n < stays; n++) {
        const start = 7 * week + n * 2;
        const nights = 2 + ((week + index + n) % 3);
        const { rows: tripRows } = await query(
          `INSERT INTO trips (tourist_user_id, budget, interests, start_date, end_date, status, created_at)
             VALUES ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval) RETURNING id`,
          [touristId, 15000, ["mountains", "homestays"], daysAgo(start + nights), daysAgo(start),
           start > 3 ? TRIP_STATUS.COMPLETED : TRIP_STATUS.CONFIRMED, String(start + nights)],
        );
        const { rows: bookingRows } = await query(
          `INSERT INTO bookings (trip_id, listing_id, quantity, unit_price, total_price, status, created_at)
             VALUES ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval) RETURNING id`,
          [tripRows[0].id, listing.id, nights, listing.price_amount, listing.price_amount * nights,
           start > 3 ? BOOKING_STATUS.COMPLETED : BOOKING_STATUS.CONFIRMED, String(start + nights)],
        );
        await query(
          "INSERT INTO wallet_transactions (tourist_user_id, trip_id, amount, type) VALUES ($1,$2,$3,'debit')",
          [touristId, tripRows[0].id, listing.price_amount * nights],
        );
        if ((week + index + n) % 2 === 0) {
          await query(
            "INSERT INTO reviews (booking_id, listing_id, rating, comment) VALUES ($1,$2,$3,$4)",
            [bookingRows[0].id, listing.id, 4 + ((week + index) % 2), REVIEW_COMMENTS[(week + index + n) % REVIEW_COMMENTS.length]],
          );
        }
        bookingCount++;
      }
    }
  }

  // The demo host's current month, tuned to the deck's portal (slide 3/5):
  // ~84.5% occupancy, and a payout on the same scale as its ₹1,18,400.
  //
  // The deck's three figures (48 stays, 84.5%, ₹1,18,400) are only mutually
  // consistent at the end of a month — two live rooms cannot sell 48 nights by
  // the 15th. So this targets the *rate* and lets the totals follow the date:
  // demo on the 28th and you land on the deck's numbers, demo on the 10th and
  // you get a believable third of them, either way the tile reads like a
  // working homestay rather than a number someone typed in.
  const TARGET_OCCUPANCY = 0.845;
  const demoHostId = users.get("host_demo");
  const demoRooms = listings.filter(
    (listing) => listing.host_user_id === demoHostId && listing.status === LISTING_STATUS.LIVE,
  );
  const elapsed = new Date().getDate();

  const sold = await query(
    `SELECT coalesce(sum(b.quantity), 0)::int AS nights
       FROM bookings b JOIN listings l ON l.id = b.listing_id
      WHERE l.host_user_id = $1 AND b.created_at >= date_trunc('month', now())`,
    [demoHostId],
  );
  let shortfall = Math.round(TARGET_OCCUPANCY * demoRooms.length * elapsed) - sold.rows[0].nights;

  // Fill from the priciest room down, so the payout tile reflects the rooms a
  // host would actually sell first.
  for (const room of [...demoRooms].sort((a, b) => b.price_amount - a.price_amount)) {
    let day = 1;
    while (shortfall > 0 && day <= elapsed) {
      const nights = Math.min(2 + (day % 2), shortfall, elapsed - day + 1);
      const startedDaysAgo = elapsed - day;
      const { rows: tripRows } = await query(
        `INSERT INTO trips (tourist_user_id, budget, interests, start_date, end_date, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval) RETURNING id`,
        [touristId, 15000, ["mountains", "homestays"], daysAgo(startedDaysAgo + nights), daysAgo(startedDaysAgo),
         startedDaysAgo > 2 ? TRIP_STATUS.COMPLETED : TRIP_STATUS.CONFIRMED, String(startedDaysAgo)],
      );
      const { rows: bookingRows } = await query(
        `INSERT INTO bookings (trip_id, listing_id, quantity, unit_price, total_price, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval) RETURNING id`,
        [tripRows[0].id, room.id, nights, room.price_amount, room.price_amount * nights,
         startedDaysAgo > 2 ? BOOKING_STATUS.COMPLETED : BOOKING_STATUS.CONFIRMED, String(startedDaysAgo)],
      );
      await query(
        "INSERT INTO wallet_transactions (tourist_user_id, trip_id, amount, type) VALUES ($1,$2,$3,'debit')",
        [touristId, tripRows[0].id, room.price_amount * nights],
      );
      if (day % 2 === 0) {
        await query(
          "INSERT INTO reviews (booking_id, listing_id, rating, comment) VALUES ($1,$2,$3,$4)",
          [bookingRows[0].id, room.id, 5, REVIEW_COMMENTS[day % REVIEW_COMMENTS.length]],
        );
      }
      shortfall -= nights;
      bookingCount++;
      day += nights + 1;
    }
  }

  // Payouts: one settled row per host per past month, one pending for this one.
  for (const host of USERS.filter((user) => user.role === ROLE.HOST)) {
    const hostId = users.get(host.username);
    const { rows } = await query(
      `SELECT to_char(date_trunc('month', b.created_at), 'YYYY-MM-01') AS period_start,
              coalesce(sum(b.total_price), 0) AS amount
         FROM bookings b JOIN listings l ON l.id = b.listing_id
        WHERE l.host_user_id = $1 GROUP BY 1 ORDER BY 1`,
      [hostId],
    );
    for (const row of rows) {
      const isCurrentMonth = row.period_start.slice(0, 7) === new Date().toISOString().slice(0, 7);
      await query(
        `INSERT INTO payouts (host_user_id, amount, period_start, period_end, status)
           VALUES ($1,$2,$3, ($3::date + interval '1 month - 1 day')::date, $4)`,
        [hostId, row.amount, row.period_start, isCurrentMonth ? PAYOUT_STATUS.PENDING : PAYOUT_STATUS.PAID],
      );
    }
  }

  console.log(
    `seeded: ${KNOWN_SITES.length} known sites, ${USERS.length} users, ${listings.length} listings, ` +
      `${bookingCount} bookings, ${ADVISORIES.length} advisories`,
  );
  console.log("demo logins (password == username): tourist_demo / host_demo / gov_demo");
}

await seed();
await getPool().end();
