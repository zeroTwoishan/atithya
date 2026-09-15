/** Four destinations per role, in the same order and with the same icons —
 *  whichever dashboard you are in, the dock means the same thing in each
 *  position. Settings is shared by all three.
 */

import { House, ListDashes, ShieldCheck, Gear } from "@phosphor-icons/react";

export const NAV = {
  tourist: [
    { to: "/app", label: "Home", icon: House, end: true },
    { to: "/app/trips", label: "Trips", icon: ListDashes },
    { to: "/app/safety", label: "Safety", icon: ShieldCheck },
    { to: "/app/settings", label: "Settings", icon: Gear },
  ],
  host: [
    { to: "/host", label: "Home", icon: House, end: true },
    { to: "/host/listings", label: "Listings", icon: ListDashes },
    { to: "/host/verification", label: "Verification", icon: ShieldCheck },
    { to: "/app/settings", label: "Settings", icon: Gear },
  ],
  gov: [
    { to: "/gov", label: "Home", icon: House, end: true },
    { to: "/gov/regions", label: "Regions", icon: ListDashes },
    { to: "/gov/advisories", label: "Advisories", icon: ShieldCheck },
    { to: "/app/settings", label: "Settings", icon: Gear },
  ],
};

export const WORDMARK = { tourist: "Atithya", host: "Atithya Host", gov: "Atithya Board" };
