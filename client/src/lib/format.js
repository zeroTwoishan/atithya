/** Shared formatters. Money is always ₹ with Indian digit grouping and no
 *  decimals — a hackathon demo priced in whole rupees (docs/UI_UX_DESIGN.md
 *  asks for tabular-nums on money; that is a class, applied at each call site). */

export const rupees = (amount) =>
  `₹${Number(amount ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const shortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const dateRange = (start, end) => `${shortDate(start)} – ${shortDate(end)}`;

export const clockTime = (value = new Date()) =>
  value.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/** "homestay" -> "Homestay", "artisan_experience" -> "Artisan experience" */
export const humanise = (value = "") =>
  value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
