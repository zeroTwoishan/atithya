/** The host's portal.
 *
 *  Same spine as the traveller's home — a figure, a strip, then sections — so
 *  the two dashboards are recognisably one product. Every number here is
 *  computed from data/host.js, not written down.
 */

import { useNavigate } from "react-router-dom";
import { ArrowRight, CurrencyInr, TrendUp, WhatsappLogo } from "@phosphor-icons/react";

import { cn } from "../../lib/utils";
import { rupees, shortDate, greeting } from "../../lib/format";
import { useStore, listingsWithEdits } from "../../lib/store";
import { BOOKINGS, PRICING, OCCUPANCY, PAYOUTS, HOST_LISTING_IDS } from "../../data/host";
import { Shell } from "../../components/Shell";
import { Card, Inset, Chip, Page, Row, SectionLabel, StatRow, Meter } from "../../components/ui";

export function HostHome() {
  const navigate = useNavigate();
  const { session } = useStore();
  const listings = useStore(listingsWithEdits).filter((listing) => HOST_LISTING_IDS.includes(listing.id));

  const upcoming = BOOKINGS.filter((booking) => booking.status === "confirmed");
  const completed = BOOKINGS.filter((booking) => booking.status === "completed");
  const gross = BOOKINGS.reduce((total, booking) => total + booking.amount, 0);
  const pending = PAYOUTS.find((payout) => payout.status === "pending");
  const occupancy = OCCUPANCY.at(-2)?.pct ?? 0;
  const nights = BOOKINGS.reduce((total, booking) => total + booking.nights, 0);

  const topSuggestion = PRICING.find((entry) => entry.suggested > entry.current);
  const suggestionListing = listings.find((listing) => listing.id === topSuggestion?.listing_id);

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <div className="pt-2">
          <p className="caption">{greeting()},</p>
          <h1 className="font-display text-[34px] leading-tight text-ink">{session?.name ?? "Host"}.</h1>
        </div>

        {/* Earnings */}
        <Card className="mt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="figure text-[30px] leading-none text-ink">{rupees(gross)}</p>
              <p className="caption mt-1.5">Earned across {BOOKINGS.length} stays</p>
            </div>
            <div className="text-right">
              <p className="caption">Next payout</p>
              <p className="figure mt-0.5 text-[17px] text-ink">{rupees(pending?.amount ?? 0)}</p>
            </div>
          </div>

          <Meter value={occupancy} max={100} className="mt-4" tone={occupancy > 70 ? "positive" : "caution"} />

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="caption">{occupancy}% occupancy in September</p>
            <p className="caption">{pending ? `paid ${shortDate(pending.on)}` : "all settled"}</p>
          </div>
        </Card>

        <StatRow
          className="mt-2.5"
          items={[
            { label: "listings", value: listings.length },
            { label: "upcoming stays", value: upcoming.length },
            { label: "nights sold", value: nights },
          ]}
        />

        {/* The pricing copilot */}
        {topSuggestion && suggestionListing && (
          <section className="mt-8">
            <SectionLabel>Pricing copilot</SectionLabel>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="caption truncate">{suggestionListing.title}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="figure text-[15px] text-ink-faint line-through">{rupees(topSuggestion.current)}</span>
                    <ArrowRight size={12} className="text-ink-faint" />
                    <span className="figure text-[22px] text-positive">{rupees(topSuggestion.suggested)}</span>
                  </p>
                </div>
                <Chip className="shrink-0 border-positive/35 text-positive">
                  <TrendUp size={11} weight="bold" />
                  {Math.round(((topSuggestion.suggested - topSuggestion.current) / topSuggestion.current) * 100)}%
                </Chip>
              </div>
              <p className="mt-3 border-t border-hairline pt-3 text-[11.5px] leading-relaxed text-ink-soft">
                {topSuggestion.why}
              </p>
              <p className="caption mt-2">Applies to {topSuggestion.window}</p>
            </Card>
          </section>
        )}

        {/* Upcoming stays */}
        <section className="mt-8">
          <SectionLabel>Upcoming stays</SectionLabel>
          <div className="flex flex-col">
            {upcoming.map((booking) => {
              const listing = listings.find((entry) => entry.id === booking.listing_id);
              return (
                <div key={booking.id} className="flex items-start justify-between gap-3 border-b border-hairline py-3.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] text-ink">{booking.guest}</p>
                    <p className="caption mt-0.5 truncate">
                      {listing?.title} · {booking.nights} {booking.nights === 1 ? "night" : "nights"} · {booking.guests} guests
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="figure text-[14px] text-ink">{rupees(booking.amount)}</p>
                    <p className="caption">{shortDate(booking.start)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Occupancy by month */}
        <section className="mt-8">
          <SectionLabel>Occupancy</SectionLabel>
          <Card>
            <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
              {OCCUPANCY.map((entry) => (
                <div key={entry.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="figure text-[11px] text-ink-faint">{entry.pct}</span>
                  <div
                    className={cn("w-full rounded-t-md", entry.pct > 70 ? "bg-positive/50" : "bg-ink/15")}
                    style={{ height: `${entry.pct}%` }}
                  />
                  <span className="caption">{entry.month}</span>
                </div>
              ))}
            </div>
            <p className="caption mt-4 border-t border-hairline pt-3 leading-relaxed">
              Percentage of your available nights that sold. September is your strongest month on record.
            </p>
          </Card>
        </section>

        {/* Payouts */}
        <section className="mt-8">
          <SectionLabel>Payouts</SectionLabel>
          <Inset className="divide-y divide-hairline p-0">
            {PAYOUTS.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] text-ink">{payout.period}</p>
                  <p className="caption mt-0.5">
                    {payout.status === "paid" ? `paid ${shortDate(payout.on)}` : `due ${shortDate(payout.on)}`}
                  </p>
                </div>
                <p className={cn("figure shrink-0 text-[14px]", payout.status === "paid" ? "text-ink-soft" : "text-ink")}>
                  {rupees(payout.amount)}
                </p>
              </div>
            ))}
          </Inset>
          <p className="caption mt-2.5 px-1 leading-relaxed">
            Atithya takes no commission. The figure on your listing is the figure you receive.
          </p>
        </section>

        <section className="mt-8 flex flex-col gap-2">
          <Row icon={CurrencyInr} title="Your listings" subtitle={`${listings.length} onboarded by the agent`} to="/host/listings" />
          <Row icon={WhatsappLogo} title="Add another offering" subtitle="Message the agent on WhatsApp and it writes the listing" onClick={() => navigate("/host/listings")} />
        </section>

        <p className="caption mt-6 px-1 text-center leading-relaxed">
          {completed.length} completed stays · onboarded over WhatsApp, in Hindi
        </p>
      </Page>
    </Shell>
  );
}
