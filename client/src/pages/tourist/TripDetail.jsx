/** The trip, and the agent's working shown.
 *
 *  The loop advances on a timer the first time a draft is opened — the point
 *  of the screen is that you can watch it work and then, afterwards, read
 *  back every step it took. It stops itself at "Request approval" and will
 *  not move again until the traveller holds the button, however good the
 *  itinerary looks to it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowsClockwise, CheckCircle, Warning, CaretDown } from "@phosphor-icons/react";

import { cn } from "../../lib/utils";
import { rupees, shortDate, clockTime } from "../../lib/format";
import { useStore, actions, tripById, listingWithEdits } from "../../lib/store";
import { replan } from "../../lib/planner";
import { ADVISORIES } from "../../data/catalog";
import { ActionLoop } from "../../components/ActionLoop";
import { Timeline } from "../../components/Timeline";
import { Card, Inset, Chip, Sheet, SubHeader, Toggle, Page, StatusBadge } from "../../components/ui";

const APPROVAL_STEP = 6; // index of "Request approval" in planner.buildLoop
const TICK = 750;

const DISRUPTION = "A landslide has closed the Aut approach for the next two days.";

export function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = useStore((state) => tripById(tripId, state));

  const status = trip?.status;
  const steps = trip?.loop?.length ?? 0;
  const settled = Boolean(trip?.booked_at) || status === "declined";

  /* A trip that was already settled — or already waiting on the traveller —
     renders at the step it actually reached, rather than re-animating from
     zero every time the screen is opened. */
  const [progress, setProgress] = useState(() =>
    settled ? steps : status === "awaiting_approval" ? APPROVAL_STEP : 0,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const timer = useRef(null);

  const id = trip?.id;
  const booked = status === "booked";
  const declined = status === "declined";

  /* Walk the loop. A draft runs up to the approval gate and stops dead
     there; the last steps only play once the button has actually been held. */
  useEffect(() => {
    if (!id || status !== "draft") return undefined;

    let step = 0;
    timer.current = setInterval(() => {
      step += 1;
      setProgress(step);
      if (step >= APPROVAL_STEP) {
        clearInterval(timer.current);
        actions.requestApproval(id);
        setSheetOpen(true);
      }
    }, TICK);

    return () => clearInterval(timer.current);
  }, [id, status]);

  const confirm = useCallback(() => {
    const reference = actions.confirmTrip(trip.id);
    setSheetOpen(false);
    // Let the last steps play out rather than snapping to complete.
    let step = APPROVAL_STEP;
    const finish = setInterval(() => {
      step += 1;
      setProgress(step);
      if (step >= trip.loop.length) clearInterval(finish);
    }, TICK);
    toast.success(`Booked — ${reference}. The host has been notified.`);
  }, [trip]);

  if (!trip) {
    return (
      <div className="aurora min-h-dvh">
        <SubHeader title="Trip not found" back="/app" />
        <p className="px-5 text-[12.5px] text-ink-soft">That trip is no longer on this device.</p>
      </div>
    );
  }

  const stay = listingWithEdits(trip.choice.listing_id);
  const running = progress < trip.loop.length && !declined;
  const advisory = ADVISORIES.find((entry) => trip.advisories?.includes(entry.id));

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[560px] pb-16">
        <SubHeader
          title="Trip"
          subtitle={clockTime(new Date(trip.created_at))}
          back="/app/trips"
          action={
            booked ? (
              <button
                onClick={() => {
                  actions.replaceTrip(trip.id, replan(trip, DISRUPTION));
                  toast("Itinerary re-planned around the closure.");
                }}
                aria-label="Simulate a disruption"
                className="pill flex size-9 items-center justify-center text-ink-soft"
              >
                <ArrowsClockwise size={15} />
              </button>
            ) : null
          }
        />

        <Page className="px-5">
          {/* State line */}
          <div className="flex flex-wrap items-center gap-2">
            {running && !booked ? (
              <Chip className="text-caution">
                <motion.span
                  className="size-1.5 rounded-full bg-caution"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                planning
              </Chip>
            ) : (
              <StatusBadge status={trip.status} />
            )}
            <span className="caption">ceiling {rupees(trip.budget)}</span>
          </div>

          <h2 className="mt-3 font-display text-[26px] leading-snug text-ink">
            &ldquo;{trip.request}&rdquo;
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
            {booked ? "Booked and confirmed with the host." : declined ? "You declined this one. Nothing was charged." : "The agent is working through the loop."}
          </p>

          {/* Receipt, once it has happened */}
          {booked && (
            <Card className="mt-5">
              <Chip className="text-positive">
                <CheckCircle size={12} weight="fill" />
                settled
              </Chip>
              <p className="figure mt-2.5 text-[28px] leading-none text-ink">{rupees(trip.estimated_cost)}</p>
              <div className="mt-4 divide-y divide-hairline">
                <Line label="Reference" value={trip.reference} />
                <Line label="Dates" value={`${shortDate(trip.start_date)} – ${shortDate(trip.end_date)}`} />
                <Line label="To the host" value={`${rupees(trip.estimated_cost - trip.travel_cost)} · 0% commission`} />
                <Line label="Travel estimate" value={rupees(trip.travel_cost)} />
              </div>
            </Card>
          )}

          {/* The loop */}
          <section className="mt-8">
            <p className="caption mb-3">Action loop</p>
            <ActionLoop steps={trip.loop} progress={progress} />
          </section>

          {/* Re-open the gate if it was closed without deciding */}
          {trip.status === "awaiting_approval" && !sheetOpen && (
            <button onClick={() => setSheetOpen(true)} className="pill-primary mt-6 w-full py-3.5 text-[13px] font-medium">
              Review and approve · {rupees(trip.estimated_cost)}
            </button>
          )}

          {/* The choice it made */}
          {progress > 3 && stay && (
            <section className="mt-9">
              <p className="caption mb-3">The choice</p>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="caption truncate">{stay.region}</p>
                    <p className="font-display text-[19px] leading-snug text-ink">{stay.title}</p>
                  </div>
                  <Chip className="shrink-0 border-positive/35 text-positive">agent&apos;s pick</Chip>
                </div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="figure text-[19px] text-ink">{rupees(stay.price_amount)}</span>
                  <span className="caption">per {stay.price_unit}</span>
                  {stay.rating && <Chip className="ml-auto">{stay.rating.toFixed(1)} · {stay.reviews}</Chip>}
                </div>

                <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
                  {trip.choice.reasons.map((reason) => (
                    <li key={reason} className="text-[11.5px] leading-relaxed text-ink-soft">
                      {reason}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate(`/app/stay/${stay.id}`)}
                  className="pill mt-4 w-full py-2.5 text-[12px] text-ink-soft"
                >
                  Open the listing
                </button>
              </Card>

              {/* What it turned down, and why */}
              {trip.rejected.length > 0 && (
                <>
                  <button
                    onClick={() => setShowRejected((open) => !open)}
                    className="pill mt-2 flex w-full items-center justify-center gap-2 py-2.5 text-[12px] text-ink-soft"
                  >
                    {showRejected ? "Hide" : `Show the ${trip.rejected.length} options it rejected`}
                    <CaretDown size={12} className={cn("transition-transform", showRejected && "rotate-180")} />
                  </button>

                  {showRejected && (
                    <div className="mt-2 flex flex-col gap-2">
                      {trip.rejected.map((entry, index) => {
                        const listing = listingWithEdits(entry.listing_id);
                        if (!listing) return null;
                        return (
                          <Card key={entry.listing_id} className="opacity-80">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="caption">#{index + 2} {listing.region.split(",")[0]}</p>
                                <p className="font-display text-[17px] leading-snug text-ink">{listing.title}</p>
                              </div>
                              <Chip className="shrink-0 border-negative/30 text-negative">{entry.flag}</Chip>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="figure text-[16px] text-ink-soft">{rupees(listing.price_amount)}</span>
                              <span className="caption">score {entry.score}</span>
                            </div>
                            <ul className="mt-3 space-y-1 border-t border-hairline pt-3">
                              {entry.reasons.slice(0, 2).map((reason) => (
                                <li key={reason} className="text-[11px] leading-relaxed text-ink-faint">
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Safety, if the route has any */}
          {advisory && progress > 5 && (
            <section className="mt-9">
              <p className="caption mb-3">On this route</p>
              <Inset>
                <div className="flex items-start gap-3">
                  <Warning size={16} weight="duotone" className="mt-0.5 shrink-0 text-caution" />
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink">{advisory.title}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{advisory.body}</p>
                    <p className="caption mt-2">{advisory.source} · {shortDate(advisory.updated)}</p>
                  </div>
                </div>
              </Inset>
            </section>
          )}

          {/* The itinerary itself */}
          {progress > 4 && (
            <section className="mt-9">
              <p className="caption mb-4">
                {trip.days} days · {shortDate(trip.start_date)} – {shortDate(trip.end_date)}
              </p>
              <Timeline items={trip.items} onOpen={(id) => navigate(`/app/stay/${id}`)} />

              <Inset className="mt-6 flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-ink-soft">Travel between stops</span>
                <span className="figure text-[14px] text-ink">{rupees(trip.travel_cost)}</span>
              </Inset>
            </section>
          )}

          {trip.replanned && (
            <Inset className="mt-4 border-caution/30">
              <p className="text-[11.5px] leading-relaxed text-caution">{trip.narrative}</p>
            </Inset>
          )}
        </Page>
      </div>

      <ApprovalSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        trip={trip}
        stay={stay}
        onConfirm={confirm}
        onDecline={() => {
          actions.declineTrip(trip.id);
          setSheetOpen(false);
          toast("Declined. Nothing was charged.");
        }}
      />
    </div>
  );
}

const Line = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="text-[12px] text-ink-soft">{label}</span>
    <span className="truncate text-[12px] text-ink">{value}</span>
  </div>
);

/* ── The approval gate ─────────────────────────────────────────────────── */

/** The sheet is only a frame; the state lives in the body below it, which
 *  unmounts when the sheet closes — so a half-finished hold can never be
 *  waiting there the next time it opens. */
function ApprovalSheet({ open, onClose, trip, stay, onConfirm, onDecline }) {
  if (!trip) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Approve this trip?">
      <ApprovalBody trip={trip} stay={stay} onConfirm={onConfirm} onDecline={onDecline} />
    </Sheet>
  );
}

/** Booking is a press-and-hold, not a tap.
 *
 *  It is the one irreversible action in the product, and the reference makes
 *  the same call — a deliberate ~900ms of contact, so it cannot happen by
 *  brushing the screen while reading.
 */
function ApprovalBody({ trip, stay, onConfirm, onDecline }) {
  const [held, setHeld] = useState(0);
  const [trust, setTrust] = useState(false);
  const holding = useRef(null);

  useEffect(() => () => clearInterval(holding.current), []);

  function press() {
    clearInterval(holding.current);
    holding.current = setInterval(() => {
      setHeld((value) => {
        if (value < 100) return value + 5;
        clearInterval(holding.current);
        return 100;
      });
    }, 45);
  }

  function release() {
    clearInterval(holding.current);
    setHeld(0);
  }

  // Firing on the render that reaches 100 keeps the side effect out of the
  // state updater, which StrictMode would otherwise run twice.
  useEffect(() => {
    if (held < 100) return;
    clearInterval(holding.current);
    if (trust && stay) actions.trustHost(stay.host_id);
    onConfirm();
  }, [held, trust, stay, onConfirm]);

  const overBy = trip.estimated_cost - trip.budget;

  return (
    <>
      <Inset className="p-4">
        <p className="caption truncate">{stay?.region}</p>
        <p className="mt-0.5 text-[14px] text-ink">{stay?.title}</p>
        <p className="figure mt-1.5 text-[28px] leading-none text-ink">{rupees(trip.estimated_cost)}</p>
        <ul className="mt-3 space-y-1">
          <li className="caption">
            {trip.days} nights · {shortDate(trip.start_date)} – {shortDate(trip.end_date)}
          </li>
          <li className="caption">
            {rupees(trip.estimated_cost - trip.travel_cost)} to the host, {rupees(trip.travel_cost)} travel
          </li>
          <li className="caption">Free cancellation up to 72 hours before</li>
        </ul>
      </Inset>

      <div className="mt-5">
        <p className="caption mb-2">Why you&apos;re being asked</p>
        <ul className="space-y-1.5">
          <li className="text-[11.5px] leading-relaxed text-ink-soft">
            {rupees(trip.estimated_cost)} is above your {rupees(2000)} auto-approve limit
          </li>
          {stay && (
            <li className="text-[11.5px] leading-relaxed text-ink-soft">
              {stay.title} is a host you haven&apos;t stayed with before
            </li>
          )}
          {overBy > 0 && (
            <li className="text-[11.5px] leading-relaxed text-caution">
              This is {rupees(overBy)} past the ceiling you set for this trip
            </li>
          )}
        </ul>
      </div>

      {stay && (
        <div className="card-inset mt-5 flex items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">
            Trust {stay.title} for future trips
          </span>
          <Toggle checked={trust} onChange={setTrust} label="Trust this host for future trips" />
        </div>
      )}

      <button
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        /* touch-none is load-bearing: without it the browser treats a long
           press as the start of a scroll and fires pointercancel partway
           through, so the hold can never complete on a phone. */
        className="pill-positive relative mt-5 w-full touch-none select-none overflow-hidden py-3.5 text-[13px] font-medium"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-positive/35 transition-[width] duration-75"
          style={{ width: `${held}%` }}
        />
        <span className="relative">Hold to book {rupees(trip.estimated_cost)}</span>
      </button>

      <button onClick={onDecline} className="pill-negative mt-2 w-full py-3.5 text-[13px]">
        Decline
      </button>

      <p className="mt-3 text-center text-[10.5px] text-ink-faint">
        Nothing is charged until you finish the hold.
      </p>
    </>
  );
}
