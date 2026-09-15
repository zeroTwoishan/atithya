/** Trips, and everything that has happened.
 *
 *  Two tabs on one screen, exactly as the reference splits Tasks from
 *  History: what is still live, and the append-only log of what the agent and
 *  the traveller each did.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks } from "@phosphor-icons/react";

import { rupees, shortDate, clockTime, relativeDay } from "../../lib/format";
import { useStore, actions } from "../../lib/store";
import { Shell } from "../../components/Shell";
import { Card, Chip, EmptyState, Page, Segmented, StatusBadge } from "../../components/ui";

const TABS = [
  { value: "trips", label: "Trips" },
  { value: "history", label: "History" },
];

const KIND_TONE = {
  booked: "text-positive",
  approved: "text-positive",
  auto: "text-positive",
  declined: "text-negative",
  approval: "text-caution",
  replan: "text-caution",
};

export function Trips() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("trips");
  const { trips, activity } = useStore();

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <div className="flex items-center justify-between gap-3 pt-2">
          <h1 className="font-display text-[30px] leading-tight text-ink">Trips</h1>
          <button
            onClick={() => (tab === "trips" ? actions.clearFinished() : actions.clearActivity())}
            className="pill px-3.5 py-1.5 text-[12px] text-ink-soft"
          >
            Clear
          </button>
        </div>

        <Segmented className="mt-4" options={TABS} value={tab} onChange={setTab} />

        {tab === "trips" ? (
          trips.length ? (
            <div className="mt-5 flex flex-col gap-2.5">
              {trips.map((trip) => (
                <Card
                  key={trip.id}
                  onClick={() => navigate(trip.status === "draft" ? `/app/new/${trip.id}` : `/app/trip/${trip.id}`)}
                  className="cursor-pointer transition-colors hover:bg-surface-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-[19px] leading-snug text-ink">
                        {trip.days} days in {trip.title}
                      </p>
                      <p className="caption mt-1 truncate">
                        {shortDate(trip.start_date)} – {shortDate(trip.end_date)}
                        {trip.reference ? ` · ${trip.reference}` : ""}
                      </p>
                    </div>
                    <span className="figure shrink-0 text-[17px] text-ink">{rupees(trip.estimated_cost)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={trip.status} />
                    {trip.estimated_cost <= trip.budget && (
                      <Chip className="text-positive">{rupees(trip.budget - trip.estimated_cost)} under</Chip>
                    )}
                    {trip.replanned && <Chip className="text-caution">re-planned</Chip>}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListChecks}
              title="No trips yet"
              body="Describe a trip on the home screen and it will appear here while the agent works through it."
              action={
                <button onClick={() => navigate("/app")} className="pill-primary px-6 py-3 text-[13px] font-medium">
                  Plan a trip
                </button>
              }
            />
          )
        ) : activity.length ? (
          <div className="mt-6">
            <p className="caption mb-2">Most recent first</p>
            <div className="flex flex-col">
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 border-b border-hairline py-3.5 last:border-0">
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${KIND_TONE[entry.kind] ? "bg-current" : "bg-ink-faint"} ${KIND_TONE[entry.kind] ?? ""}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-ink">{entry.title}</p>
                    {entry.detail && <p className="caption mt-0.5 truncate">{entry.detail}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    {entry.amount ? <p className="figure text-[13px] text-ink-soft">{rupees(entry.amount)}</p> : null}
                    <p className="caption">{relativeDay(entry.at)} {clockTime(new Date(entry.at))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={ListChecks} title="Nothing has happened yet" body="Every plan, approval and booking gets logged here, in order." />
        )}
      </Page>
    </Shell>
  );
}
