/** The traveller's home.
 *
 *  Same spine as the reference's home screen: a greeting, one field that
 *  takes the whole request as a sentence, the suggestion row under it, the
 *  spend figure against the ceiling, a three-up strip, then whatever has
 *  actually been settled.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Compass, MapTrifold } from "@phosphor-icons/react";

import { rupees, greeting, shortDate } from "../../lib/format";
import { useStore, actions } from "../../lib/store";
import { Card, ChipButton, Meter, StatRow, SectionLabel, Row, Page } from "../../components/ui";
import { Shell } from "../../components/Shell";
import { planTrip } from "../../lib/planner";

const SUGGESTIONS = [
  "₹15,000, 4 days, mountains and homestays",
  "₹8,000, 3 days, weaving and craft",
  "₹22,000, 5 days, quiet valleys and food",
  "₹30,000, 6 days, remote and stargazing",
];

export function TouristHome() {
  const navigate = useNavigate();
  const [request, setRequest] = useState("");
  const { session, trips, settings } = useStore();

  const booked = trips.filter((trip) => trip.status === "booked");
  const waiting = trips.filter((trip) => trip.status === "awaiting_approval");
  const committed = booked.reduce((total, trip) => total + trip.estimated_cost, 0);
  const saved = booked.reduce((total, trip) => total + Math.max(0, trip.budget - trip.estimated_cost), 0);

  function send(text) {
    const value = (text ?? request).trim();
    if (!value) return;
    const trip = planTrip(value);
    actions.addTrip(trip);
    setRequest("");
    navigate(`/app/new/${trip.id}`);
  }

  return (
    <Shell
      mastheadAction={
        <button
          onClick={() => navigate("/app/trips")}
          aria-label="Activity"
          className="pill relative flex size-9 items-center justify-center text-ink-soft"
        >
          <Bell size={15} />
          {waiting.length > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-caution" />}
        </button>
      }
    >
      <Page className="mx-auto w-full max-w-[560px]">
        {/* Greeting */}
        <div className="pt-2">
          <p className="caption">{greeting()},</p>
          <h1 className="font-display text-[34px] leading-tight text-ink">{session?.name ?? "Traveller"}.</h1>
        </div>

        {/* The one field */}
        <div className="mt-5">
          <input
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && send()}
            placeholder="Plan. Compare. Book."
            aria-label="Describe the trip you want"
            className="field"
          />

          {request.trim() ? (
            <button onClick={() => send()} className="pill-primary mt-2.5 flex w-full items-center justify-center gap-2 py-3.5 text-[13px] font-medium">
              <ArrowRight size={14} />
              Send it
            </button>
          ) : (
            <div className="no-scrollbar -mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5">
              {SUGGESTIONS.map((suggestion) => (
                <ChipButton key={suggestion} onClick={() => send(suggestion)}>
                  {suggestion}
                </ChipButton>
              ))}
            </div>
          )}
        </div>

        {/* Committed against the ceiling */}
        <Card className="mt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="figure text-[30px] leading-none text-ink">{rupees(committed)}</p>
              <p className="caption mt-1.5">Committed</p>
            </div>
            <div className="text-right">
              <p className="caption">Daily cap</p>
              <p className="figure mt-0.5 text-[17px] text-ink">{rupees(settings.dailyCap)}</p>
            </div>
          </div>

          <Meter value={committed} max={settings.dailyCap} className="mt-4" tone={committed > settings.dailyCap ? "negative" : "positive"} />

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="caption">
              {committed === 0
                ? "Nothing committed yet"
                : committed > settings.dailyCap
                  ? "Past your cap"
                  : "Well inside your cap"}
            </p>
            <button onClick={() => navigate("/app/settings/limits")} className="caption underline-offset-4 hover:underline">
              Change your limits
            </button>
          </div>
        </Card>

        <StatRow
          className="mt-2.5"
          items={[
            { label: "trips planned", value: trips.length },
            { label: "waiting on you", value: waiting.length },
            { label: "under budget", value: saved > 0 ? rupees(saved) : "—" },
          ]}
        />

        {/* Waiting on you */}
        {waiting.length > 0 && (
          <section className="mt-8">
            <SectionLabel>Waiting on you</SectionLabel>
            <div className="flex flex-col gap-2">
              {waiting.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => navigate(`/app/trip/${trip.id}`)}
                  className="card-inset flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-strong"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] text-ink">{trip.days} days in {trip.title}</span>
                    <span className="caption mt-0.5 block">Needs your approval</span>
                  </span>
                  <span className="figure shrink-0 text-[15px] text-ink">{rupees(trip.estimated_cost)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Settled */}
        <section className="mt-8">
          <SectionLabel>{booked.length ? "Booked" : "Nothing booked yet"}</SectionLabel>
          {booked.length ? (
            <div className="flex flex-col gap-2">
              {booked.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => navigate(`/app/trip/${trip.id}`)}
                  className="flex items-start justify-between gap-3 border-b border-hairline px-1 py-3.5 text-left last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] text-ink">{trip.days} days in {trip.title}</span>
                    <span className="caption mt-0.5 block">
                      {shortDate(trip.start_date)} – {shortDate(trip.end_date)} · {trip.reference}
                    </span>
                  </span>
                  <span className="figure shrink-0 text-[14px] text-ink-soft">{rupees(trip.estimated_cost)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-1 text-[12.5px] leading-relaxed text-ink-faint">
              Describe a trip above and Atithya will plan it, price it, and stop at your ceiling for sign-off.
            </p>
          )}
        </section>

        {/* Ways in */}
        <section className="mt-8 flex flex-col gap-2">
          <Row
            icon={Compass}
            title="Discover verified stays"
            subtitle="Every host an agent onboarded and verification cleared"
            to="/app/discover"
          />
          <Row
            icon={MapTrifold}
            title="Where the crowds are not"
            subtitle="District load against comfortable capacity"
            to="/app/safety"
          />
        </section>
      </Page>
    </Shell>
  );
}
