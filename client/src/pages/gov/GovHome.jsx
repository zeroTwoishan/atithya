import { ChartBar } from "@phosphor-icons/react";
import { ApiStatus } from "../../components/ApiStatus";

// Placeholder — real screens land here on hackathon day (docs/UI_UX_DESIGN.md
// §4b): Regional Heatmap, Scheme Metrics, Safety Advisories. Note the
// "Precision Console" archetype (docs/UI_UX_DESIGN.md §3) — this page is
// wrapped in the .gov class by GovLayout, not styled individually.
export function GovHome() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8 text-center font-mono">
      <ChartBar size={40} weight="duotone" className="text-primary" />
      <h1 className="font-sans text-3xl tracking-tight">Government Console</h1>
      <p className="text-text-muted max-w-md font-sans">
        Regional Heatmap, Scheme Metrics, and Safety Advisories wire up here — see docs/UI_UX_DESIGN.md §4b.
      </p>
      <ApiStatus />
    </div>
  );
}
