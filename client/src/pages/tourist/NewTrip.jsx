/** The brief, before the agent runs.
 *
 *  The reference puts one number on this screen and nothing else that can be
 *  fiddled with: the ceiling. Everything the agent inferred from the sentence
 *  is shown read-only underneath, so a wrong reading is caught here rather
 *  than after it has booked something.
 */

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";

import { rupees } from "../../lib/format";
import { useStore, actions, tripById } from "../../lib/store";
import { planTrip } from "../../lib/planner";
import { Card, Inset, Page, SubHeader } from "../../components/ui";

const CEILINGS = [8000, 15000, 25000, 40000, 60000];

export function NewTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = useStore((state) => tripById(tripId, state));
  const [budget, setBudget] = useState(trip?.budget ?? 15000);

  // The ceiling drives the plan, so moving the slider re-plans against the
  // original sentence rather than just relabelling the old itinerary.
  const preview = useMemo(() => {
    if (!trip) return null;
    return planTrip(`${trip.request} ₹${budget}`.replace(/₹[\d,]+/, `₹${budget}`));
  }, [trip, budget]);

  if (!trip) {
    return (
      <div className="aurora min-h-dvh">
        <SubHeader title="Trip not found" back="/app" />
        <p className="px-5 text-[12.5px] text-ink-soft">That trip is no longer on this device.</p>
      </div>
    );
  }

  const pct = ((budget - CEILINGS[0]) / (CEILINGS.at(-1) - CEILINGS[0])) * 100;

  function start() {
    actions.updateTrip(trip.id, {
      ...preview,
      id: trip.id,
      created_at: trip.created_at,
      request: trip.request,
      budget,
      status: "draft",
    });
    navigate(`/app/trip/${trip.id}`, { replace: true });
  }

  return (
    <div className="aurora flex min-h-dvh flex-col">
      <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 flex-col">
        <SubHeader title="New trip" back="/app" />

        <Page className="flex flex-1 flex-col px-5 pb-8">
          <h2 className="font-display text-[26px] leading-snug text-ink">{trip.request}</h2>

          {/* The ceiling */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between gap-3">
              <p className="figure text-[32px] leading-none text-ink">{rupees(budget)}</p>
              <p className="caption">{rupees(CEILINGS.at(-1))}</p>
            </div>

            {/* A gradient track: comfortable at the left, at the edge by the
                right, so the number has a feeling as well as a value. */}
            <div className="relative mt-3">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[10px] h-[2px] rounded-full"
                style={{
                  background: `linear-gradient(90deg, var(--color-positive) 0%, var(--color-caution) ${Math.min(95, pct)}%, var(--color-hairline) ${Math.min(96, pct + 1)}%)`,
                }}
              />
              <input
                type="range"
                className="range relative"
                min={CEILINGS[0]}
                max={CEILINGS.at(-1)}
                step={500}
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                aria-label="Most you will pay"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="caption">Most you will pay</p>
              <p className="caption">It stops and asks you here</p>
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {CEILINGS.map((ceiling) => (
                <button
                  key={ceiling}
                  onClick={() => setBudget(ceiling)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors ${
                    ceiling === budget
                      ? "border-transparent bg-surface-strong font-medium text-ink"
                      : "border-hairline text-ink-faint hover:text-ink-soft"
                  }`}
                >
                  {rupees(ceiling)}
                </button>
              ))}
            </div>
          </div>

          {/* What it read out of the sentence */}
          <div className="mt-9">
            <p className="caption mb-2">What the agent understood</p>
            <Card className="divide-y divide-hairline p-0">
              <Understood label="Looking for" value={preview.interests.length ? preview.interests.join(", ") : "Open to anything"} />
              <Understood label="Away for" value={`${preview.days} days`} />
              <Understood label="Spending at most" value={rupees(budget)} />
              <Understood label="Books when" value="It clears your rules" />
            </Card>
          </div>

          {/* Where it is leaning, before it commits */}
          <Inset className="mt-3">
            <p className="caption">Leaning towards</p>
            <p className="mt-1 font-display text-[18px] leading-snug text-ink">{preview.title}</p>
            <p className="caption mt-1">
              {rupees(preview.estimated_cost)} all in ·{" "}
              {preview.estimated_cost <= budget
                ? `${rupees(budget - preview.estimated_cost)} under your ceiling`
                : `${rupees(preview.estimated_cost - budget)} over — it will stop and ask`}
            </p>
          </Inset>

          <div className="mt-auto pt-10">
            <button onClick={start} className="pill-primary flex w-full items-center justify-center gap-2 py-3.5 text-[13.5px] font-medium">
              <ArrowRight size={14} />
              Start planning
            </button>
          </div>
        </Page>
      </div>
    </div>
  );
}

const Understood = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-3.5">
    <span className="text-[12.5px] text-ink-soft">{label}</span>
    <span className="truncate text-[12.5px] text-ink">{value}</span>
  </div>
);
