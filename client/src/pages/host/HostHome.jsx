/** The host portal from the deck: four tiles (properties, stays this month,
 *  occupancy, gross payout), the listings with their verification state, and
 *  the pricing copilot's suggestions. Every number is computed server-side
 *  from bookings — nothing here is a constant. */
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SquaresFour, ListChecks, TrendUp } from "@phosphor-icons/react";

import { Shell } from "../../components/Shell";
import { Card, SectionLabel, Stat, Placeholder, Chip } from "../../components/Primitives";
import { ListingCard } from "../../components/ListingCard";
import { endpoints, apiError, getUser } from "../../lib/api";
import { rupees, shortDate } from "../../lib/format";

const TABS = [
  { to: "/host/overview", label: "Overview", icon: SquaresFour },
  { to: "/host/listings", label: "Listings", icon: ListChecks },
  { to: "/host/pricing", label: "Pricing", icon: TrendUp },
];

const TITLES = { overview: "Your portal", listings: "Listings & experiences", pricing: "Pricing copilot" };

export function HostHome() {
  const location = useLocation();
  const section = location.pathname.split("/")[2] ?? "overview";

  return (
    <Shell tabs={TABS} title={TITLES[section]}>
      <Routes location={location}>
        <Route index element={<Navigate to="/host/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="listings" element={<Listings />} />
        <Route path="pricing" element={<Pricing />} />
      </Routes>
    </Shell>
  );
}

function Overview() {
  const hostId = getUser()?.id;
  const dashboard = useQuery({
    queryKey: ["host-dashboard", hostId],
    queryFn: () => endpoints.hostDashboard(hostId),
    enabled: Boolean(hostId),
  });

  return (
    <Placeholder loading={dashboard.isLoading} error={dashboard.isError ? apiError(dashboard.error) : null}>
      {dashboard.data && (
        <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
          <Card className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <Stat
              label="Total properties"
              value={dashboard.data.listings.total}
              caption={`${dashboard.data.listings.live} live · ${dashboard.data.listings.needs_review} in review`}
            />
            <Stat
              label="Stays this month"
              value={dashboard.data.this_month.nights_sold}
              caption={`${dashboard.data.this_month.bookings} bookings`}
            />
            <Stat
              label="Occupancy"
              value={`${dashboard.data.this_month.occupancy_rate}%`}
              caption="Nights sold vs nights offered"
            />
            <Stat
              label="Gross payout"
              value={rupees(dashboard.data.this_month.gross_payout)}
              tone="text-positive"
              caption="This month, before commission"
            />
          </Card>

          {dashboard.data.rating.average && (
            <Card className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow mb-1">Guest rating</p>
                <p className="figure text-[22px] text-ink">{dashboard.data.rating.average.toFixed(2)}</p>
              </div>
              <Chip>{dashboard.data.rating.count} reviews</Chip>
            </Card>
          )}

          <section>
            <SectionLabel>Payouts</SectionLabel>
            {dashboard.data.payouts.length ? (
              <Card className="flex flex-col divide-y divide-hairline p-0">
                {dashboard.data.payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div>
                      <p className="text-[13px] text-ink">
                        {shortDate(payout.period_start)} – {shortDate(payout.period_end)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {payout.status === "paid" ? "Transferred" : "Scheduled"}
                      </p>
                    </div>
                    <span className="figure text-[16px] text-ink">{rupees(payout.amount)}</span>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="text-[13px] text-ink-soft">No payouts yet — they appear after the first booking.</Card>
            )}
          </section>
        </div>
      )}
    </Placeholder>
  );
}

function Listings() {
  const hostId = getUser()?.id;
  const listings = useQuery({
    queryKey: ["listings", { host: hostId }],
    queryFn: () => endpoints.listings({ host: hostId }),
    enabled: Boolean(hostId),
  });

  return (
    <Placeholder
      loading={listings.isLoading}
      error={listings.isError ? apiError(listings.error) : null}
      empty={listings.data?.length ? null : "No listings yet. Message the WhatsApp number to add one."}
    >
      <div className="mx-auto grid w-full max-w-[1000px] gap-4 sm:grid-cols-2">
        {(listings.data ?? []).map((listing) => (
          <ListingCard key={listing.id} listing={listing} showStatus />
        ))}
      </div>
    </Placeholder>
  );
}

function Pricing() {
  const hostId = getUser()?.id;
  const suggestions = useQuery({
    queryKey: ["pricing", hostId],
    queryFn: () => endpoints.pricingSuggestions(hostId),
    enabled: Boolean(hostId),
  });

  return (
    <Placeholder
      loading={suggestions.isLoading}
      error={suggestions.isError ? apiError(suggestions.error) : null}
      empty={suggestions.data?.length ? null : "Pricing suggestions appear once a listing is live."}
    >
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
        {(suggestions.data ?? []).map((suggestion) => (
          <Card key={suggestion.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-[18px] leading-snug text-ink">{suggestion.title}</h3>
                <p className="mt-0.5 text-[11.5px] text-ink-faint">{suggestion.region}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="figure text-[18px] text-ink">{rupees(suggestion.price_amount)}</p>
                {suggestion.suggested_price !== null && suggestion.suggested_price !== suggestion.price_amount && (
                  <p className="figure mt-0.5 text-[13px] text-positive">→ {rupees(suggestion.suggested_price)}</p>
                )}
              </div>
            </div>
            <p className="card-inset p-3 text-[12px] leading-relaxed text-ink-soft">{suggestion.reason}</p>
          </Card>
        ))}
      </div>
    </Placeholder>
  );
}
