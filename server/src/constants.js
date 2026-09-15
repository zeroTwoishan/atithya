/** Mirrors of the Postgres enums in src/db/schema.sql (docs/BACKEND_SCHEMA.md §3).
 *  Kept here so a typo is a JS error at the boundary rather than a 22P02 from
 *  the driver halfway through a transaction. */

export const ROLE = Object.freeze({ HOST: "host", TOURIST: "tourist", GOV: "gov" });

export const OFFERING_TYPE = Object.freeze({
  HOMESTAY: "homestay",
  GUIDE: "guide",
  ARTISAN_EXPERIENCE: "artisan_experience",
  OTHER: "other",
});

export const PRICE_UNIT = Object.freeze({ NIGHT: "night", PERSON: "person", EXPERIENCE: "experience" });

export const LISTING_STATUS = Object.freeze({
  PENDING_VERIFICATION: "pending_verification",
  NEEDS_REVIEW: "needs_review",
  LIVE: "live",
  INACTIVE: "inactive",
});

export const TRIP_STATUS = Object.freeze({
  PLANNING: "planning",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

export const BOOKING_STATUS = Object.freeze({ CONFIRMED: "confirmed", COMPLETED: "completed", CANCELLED: "cancelled" });
export const ITEM_TYPE = Object.freeze({ KNOWN_SITE: "known_site", LISTING: "listing" });
export const WALLET_TXN_TYPE = Object.freeze({ DEBIT: "debit", REFUND: "refund" });
export const PAYOUT_STATUS = Object.freeze({ PENDING: "pending", PAID: "paid" });
export const SEVERITY = Object.freeze({ INFO: "info", CAUTION: "caution", WARNING: "warning" });
