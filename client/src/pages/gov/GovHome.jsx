/** The state tourism board's view: where rural tourism spend actually lands.
 *
 *  The district heatmap is a stylized zone diagram — colour-weighted blocks
 *  per region, not a map library (docs/TRD.md §4, an explicit scope decision).
 *  The deck marks the full district heatmap as weeks 9–12; what ships here is
 *  the same query against real bookings at the regions the platform covers. */
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapTrifold, ChartLineUp } from "@phosphor-icons/react";

import { Shell } from "../../components/Shell";
import { Card, SectionLabel, Stat, Placeholder, Chip } from "../../components/Primitives";
import { endpoints, apiError } from "../../lib/api";
import { rupees } from "../../lib/format";

const TABS = [
  { to: "/gov/heatmap", label: "Demand", icon: MapTrifold },
  { to: "/gov/scheme-metrics", label: "Scheme outcomes", icon: ChartLineUp },
];

const TITLES = { heatmap: "Regional demand", "scheme-metrics": "Scheme outcomes" };

export function GovHome() {
  const location = useLocation();
  const section = location.pathname.split("/")[2] ?? "heatmap";

  return (
    <Shell tabs={TABS} title={TITLES[section]}>
      <Routes location={location}>
        <Route index element={<Navigate to="/gov/heatmap" replace />} />
        <Route path="heatmap" element={<Heatmap />} />
        <Route path="scheme-metrics" element={<SchemeMetrics />} />
      </Routes>
    </Shell>
  );
}

function Heatmap() {
  const heatmap = useQuery({ queryKey: ["gov-heatmap"], queryFn: endpoints.govHeatmap });

  return (
    <Placeholder
      loading={heatmap.isLoading}
      error={heatmap.isError ? apiError(heatmap.error) : null}
      empty={heatmap.data?.length ? null : "No regional activity recorded yet."}
    >
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(heatmap.data ?? []).map((region) => (
            <Card key={region.region} className="relative overflow-hidden">
              {/* Density band — colour carries the ranking, the figures carry
                  the meaning, so this reads without relying on colour. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-positive"
                style={{ opacity: 0.25 + region.density * 0.75 }}
              />
              <p className="font-display text-[18px] leading-snug text-ink">{region.region}</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Stat label="Spend" value={rupees(region.revenue)} />
                <Stat label="Bookings" value={region.bookings} />
                <Stat label="Listings" value={region.listings} />
                <Stat label="Hosts" value={region.hosts} />
              </div>
              {region.advisories > 0 && (
                <Chip className="mt-4 text-caution">
                  {region.advisories} active advisor{region.advisories === 1 ? "y" : "ies"}
                </Chip>
              )}
            </Card>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-ink-faint">
          Zone diagram over live bookings. District-level mapping is roadmap weeks 9–12.
        </p>
      </div>
    </Placeholder>
  );
}

function SchemeMetrics() {
  const metrics = useQuery({ queryKey: ["gov-scheme-metrics"], queryFn: endpoints.govSchemeMetrics });

  return (
    <Placeholder loading={metrics.isLoading} error={metrics.isError ? apiError(metrics.error) : null}>
      {metrics.data && (
        <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
          <Card className="grid grid-cols-2 gap-6 lg:grid-cols-3">
            <Stat label="Rural income routed" value={rupees(metrics.data.rural_income)} tone="text-positive" caption="Direct to hosts, all time" />
            <Stat label="Bookings" value={metrics.data.bookings} caption="Confirmed or completed" />
            <Stat label="Hosts onboarded" value={metrics.data.hosts_onboarded} caption="Via WhatsApp, no field visit" />
          </Card>

          <section>
            <SectionLabel>Monthly revenue</SectionLabel>
            <Card>
              <Bars
                rows={metrics.data.monthly_revenue}
                valueOf={(row) => row.revenue}
                format={rupees}
              />
            </Card>
          </section>

          <section>
            <SectionLabel>Homestay growth</SectionLabel>
            <Card>
              <Bars rows={metrics.data.homestay_growth} valueOf={(row) => row.listings} format={(value) => `${value} new`} />
            </Card>
          </section>
        </div>
      )}
    </Placeholder>
  );
}

/** A bar list, not a chart library — 6 to 12 rows of one series each
 *  (docs/TRD.md §4 keeps the gov screens read-only and simple). */
function Bars({ rows = [], valueOf, format }) {
  if (!rows.length) return <p className="text-[13px] text-ink-soft">Nothing recorded yet.</p>;
  const peak = Math.max(...rows.map(valueOf), 1);

  return (
    <ol className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.month} className="flex items-center gap-3">
          <span className="w-[62px] shrink-0 text-[11px] text-ink-faint">{row.month}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
            <span
              className="block h-full rounded-full bg-positive"
              style={{ width: `${Math.max((valueOf(row) / peak) * 100, 2)}%` }}
            />
          </span>
          <span className="figure w-[86px] shrink-0 text-right text-[12.5px] text-ink">{format(valueOf(row))}</span>
        </li>
      ))}
    </ol>
  );
}
