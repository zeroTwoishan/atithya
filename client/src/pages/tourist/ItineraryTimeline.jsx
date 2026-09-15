/** The trip itself: stops, safety pulse, budget, and the two actions that
 *  matter — book it, or re-plan it around a disruption (docs/TRD.md §3.2/§3.4). */
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Warning, Lightning, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Card, SectionLabel, Placeholder, Spinner, StatusBadge, Stat } from "../../components/Primitives";
import { Timeline } from "../../components/Timeline";
import { endpoints, apiError } from "../../lib/api";
import { rupees, dateRange } from "../../lib/format";

const DISRUPTION = "Landslide has closed NH-305 near Aut — the Tirthan approach is blocked today.";

export function ItineraryTimeline() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const trips = useQuery({ queryKey: ["trips"], queryFn: endpoints.trips, enabled: !tripId });
  // No id in the URL: fall back to the most recent trip, so the tab is never
  // a dead end after a reload.
  const latestId = trips.data?.[0]?.id;
  const id = tripId ?? latestId;

  const trip = useQuery({ queryKey: ["trip", id], queryFn: () => endpoints.trip(id), enabled: Boolean(id) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["trip", id] });
    queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  const book = useMutation({
    mutationFn: () => endpoints.bookTrip(id),
    onSuccess: (result) => {
      invalidate();
      toast.success(`Booked — ${rupees(result.total)} debited, host notified.`);
    },
    onError: (error) => toast.error(apiError(error)),
  });

  const replan = useMutation({
    mutationFn: () => endpoints.replanTrip(id, DISRUPTION),
    onSuccess: (result) => {
      invalidate();
      toast.success(result.narrative ?? "Itinerary rebuilt around the disruption.");
    },
    onError: (error) => toast.error(apiError(error)),
  });

  if (!id && !trips.isLoading) {
    return (
      <Placeholder empty="No trips yet — plan one in the chat and it will appear here.">
        <div />
      </Placeholder>
    );
  }

  return (
    <Placeholder
      loading={trips.isLoading || trip.isLoading}
      error={trip.isError ? apiError(trip.error) : null}
    >
      {trip.data && (
        <div className="mx-auto grid w-full max-w-[1000px] gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">{trip.data.days}-day route</p>
                <h2 className="font-display text-[26px] leading-tight text-ink">
                  {dateRange(trip.data.start_date, trip.data.end_date)}
                </h2>
              </div>
              <StatusBadge status={trip.data.status} />
            </div>

            <SafetyPulse advisories={trip.data.advisories} />

            <section>
              <SectionLabel>Itinerary</SectionLabel>
              {trip.data.itinerary_items.length ? (
                <Timeline items={trip.data.itinerary_items} />
              ) : (
                <Card className="text-center text-[13px] text-ink-soft">
                  No stops yet — no live listing matched this budget.
                </Card>
              )}
            </section>
          </div>

          {/* Budget + actions: sidebar on desktop, stacked underneath on phones */}
          <Card className="flex flex-col gap-5 lg:sticky lg:top-6">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Estimated" value={rupees(trip.data.estimated_cost)} />
              <Stat
                label="Headroom"
                value={rupees(Math.max(Number(trip.data.budget) - Number(trip.data.estimated_cost), 0))}
                tone="text-positive"
                caption={`of ${rupees(trip.data.budget)}`}
              />
            </div>

            {trip.data.status === "planning" ? (
              <button
                onClick={() => book.mutate()}
                disabled={book.isPending || !trip.data.itinerary_items.length}
                className="pill-positive flex items-center justify-center gap-2 py-3.5 text-[13.5px] font-medium"
              >
                {book.isPending ? <Spinner size={16} /> : <CheckCircle size={16} weight="fill" />}
                Confirm and book
              </button>
            ) : (
              <p className="card-inset flex items-center gap-2 p-3 text-[12.5px] text-positive">
                <CheckCircle size={15} weight="fill" />
                Booked. The host has the dates.
              </p>
            )}

            <div>
              <SectionLabel>If something changes</SectionLabel>
              <button
                onClick={() => replan.mutate()}
                disabled={replan.isPending}
                className="pill flex w-full items-center justify-center gap-2 py-3 text-[12.5px] text-ink-soft"
              >
                {replan.isPending ? <Spinner size={15} /> : <Lightning size={15} weight="duotone" />}
                Simulate a road closure
              </button>
              <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">
                Rebuilds only the days still ahead, avoiding regions under an active warning.
              </p>
            </div>

            <button onClick={() => navigate("/tourist/chat")} className="text-[12px] text-ink-faint underline-offset-4 hover:underline">
              Plan a different trip
            </button>
          </Card>
        </div>
      )}
    </Placeholder>
  );
}

/** The live safety pulse from the deck — advisories matched to the regions
 *  this itinerary actually passes through. */
function SafetyPulse({ advisories = [] }) {
  const worst = advisories.find((a) => a.severity === "warning") ?? advisories.find((a) => a.severity === "caution");
  const clear = !worst;

  return (
    <Card className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 ${clear ? "text-positive" : "text-caution"}`}>
        {clear ? <ShieldCheck size={19} weight="duotone" /> : <Warning size={19} weight="duotone" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow mb-1">Safety pulse · live</p>
        <p className="text-[13px] leading-relaxed text-ink">
          {worst ? worst.message : "All regions on this route are clear. No active advisories."}
        </p>
        {advisories.length > 1 && (
          <p className="mt-1.5 text-[11px] text-ink-faint">
            {advisories.length - 1} more advisor{advisories.length - 1 === 1 ? "y" : "ies"} on this route.
          </p>
        )}
      </div>
    </Card>
  );
}
