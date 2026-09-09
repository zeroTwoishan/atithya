import { Compass } from "@phosphor-icons/react";
import { ApiStatus } from "../../components/ApiStatus";

// Placeholder — real screens land here on hackathon day (docs/UI_UX_DESIGN.md
// §4b): Trip Planner chat, Itinerary Timeline, Discover Nearby.
export function TouristHome() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Compass size={40} weight="duotone" className="text-primary" />
      <h1 className="font-display text-3xl tracking-tight">Tourist Dashboard</h1>
      <p className="text-text-muted max-w-md">
        Trip Planner, Itinerary Timeline, and Discover Nearby wire up here — see docs/UI_UX_DESIGN.md §4b.
      </p>
      <ApiStatus />
    </div>
  );
}
