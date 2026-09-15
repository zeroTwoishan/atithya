/** Shared formatters.
 *
 *  Money is always ₹ with Indian digit grouping and no decimals — a demo
 *  priced in whole rupees. Anything that sits in a column also wants the
 *  `figure` class, which turns on tabular figures.
 */

export const rupees = (amount) =>
  `₹${Number(amount ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** ₹28.4 L / ₹1.18 Cr — for dashboard headlines, where the exact rupee is
 *  noise and the magnitude is the point. */
export function compactRupees(amount) {
  const value = Number(amount ?? 0);
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1).replace(/\.0$/, "")} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return rupees(value);
}

export const shortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const dateRange = (start, end) => `${shortDate(start)} – ${shortDate(end)}`;

export const clockTime = (value = new Date()) =>
  new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/** "Today" / "Yesterday" / a date — used by the history feed, where an
 *  absolute date on every row is unreadable. */
export function relativeDay(value) {
  const then = new Date(value);
  const today = new Date();
  const days = Math.floor((today.setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return shortDate(value);
}

/** The greeting above the name on every dashboard home. */
export function greeting(at = new Date()) {
  const hour = at.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Still up";
}

/** "homestay" -> "Homestay", "artisan_experience" -> "Artisan experience" */
export const humanise = (value = "") =>
  value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
