import { House } from "@phosphor-icons/react";
import { ApiStatus } from "../../components/ApiStatus";

// Placeholder — real screens land here on hackathon day (docs/UI_UX_DESIGN.md
// §4b): Listings, Calendar & Earnings, Listing Detail & Verification.
export function HostHome() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8 text-center">
      <House size={40} weight="duotone" className="text-primary" />
      <h1 className="font-display text-3xl tracking-tight">Host Dashboard</h1>
      <p className="text-text-muted max-w-md">
        Listings, Calendar & Earnings, and Listing Detail & Verification wire up here — see docs/UI_UX_DESIGN.md §4b.
      </p>
      <ApiStatus />
    </div>
  );
}
