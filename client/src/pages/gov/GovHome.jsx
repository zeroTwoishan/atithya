/** The state tourism board's view: whether the schemes converted.
 *
 *  Every figure is computed from the same regions the traveller and host
 *  dashboards book against — that is the argument of the screen. An officer
 *  currently has no real-time source for any of this.
 */

import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendUp } from "@phosphor-icons/react";

import { cn } from "../../lib/utils";
import { rupees, compactRupees, greeting } from "../../lib/format";
import { useStore } from "../../lib/store";
import { REGIONS, SCHEME_METRICS, ARRIVALS, KNOWN_SITES } from "../../data/catalog";
import { Shell } from "../../components/Shell";
import { Card, Inset, Chip, Page, Row, SectionLabel, StatRow, Meter } from "../../components/ui";

export function GovHome() {
  const navigate = useNavigate();
  const { session } = useStore();

  const income = REGIONS.reduce((total, region) => total + region.income, 0);
  const homestays = REGIONS.reduce((total, region) => total + region.homestays, 0);
  const bookings = REGIONS.reduce((total, region) => total + region.bookings, 0);
  const sanctioned = SCHEME_METRICS.reduce((total, scheme) => total + scheme.sanctioned, 0);
  const listed = SCHEME_METRICS.reduce((total, scheme) => total + scheme.live_on_platform, 0);

  const underused = [...REGIONS].sort((a, b) => a.load - b.load).slice(0, 3);
  const overloaded = [...KNOWN_SITES].sort((a, b) => b.load - a.load).slice(0, 3);
  const maxArrivals = Math.max(...ARRIVALS.map((entry) => entry.domestic + entry.foreign));

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <div className="pt-2">
          <p className="caption">{greeting()},</p>
          <h1 className="font-display text-[34px] leading-tight text-ink">{session?.name ?? "Officer"}.</h1>
        </div>

        {/* The headline number */}
        <Card className="mt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="figure text-[30px] leading-none text-ink">{compactRupees(income)}</p>
              <p className="caption mt-1.5">Reached rural hosts this season</p>
            </div>
            <div className="text-right">
              <p className="caption">Conversion</p>
              <p className="figure mt-0.5 text-[17px] text-ink">{Math.round((listed / sanctioned) * 100)}%</p>
            </div>
          </div>

          <Meter value={listed} max={sanctioned} className="mt-4" tone="positive" />

          <p className="caption mt-2.5 leading-relaxed">
            {listed} of {sanctioned} scheme-sanctioned units are listed and taking bookings.
          </p>
        </Card>

        <StatRow
          className="mt-2.5"
          items={[
            { label: "verified hosts", value: homestays },
            { label: "bookings", value: bookings },
            { label: "districts", value: REGIONS.length },
          ]}
        />

        {/* Scheme outcomes */}
        <section className="mt-8">
          <SectionLabel>Scheme outcomes</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {SCHEME_METRICS.map((scheme) => {
              const rate = scheme.live_on_platform / scheme.sanctioned;
              return (
                <Card key={scheme.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-[18px] leading-snug text-ink">{scheme.name}</p>
                      <p className="caption mt-0.5">
                        {scheme.live_on_platform} of {scheme.sanctioned} units live
                      </p>
                    </div>
                    <p className="figure shrink-0 text-[17px] text-ink">{compactRupees(scheme.income)}</p>
                  </div>
                  <Meter value={scheme.live_on_platform} max={scheme.sanctioned} className="mt-3.5" tone={rate > 0.7 ? "positive" : "caution"} />
                  <p className="caption mt-2.5 leading-relaxed">{scheme.note}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Arrivals */}
        <section className="mt-8">
          <SectionLabel>Arrivals through the platform</SectionLabel>
          <Card>
            <div className="flex items-end justify-between gap-2" style={{ height: 118 }}>
              {ARRIVALS.map((entry) => {
                const total = entry.domestic + entry.foreign;
                return (
                  <div key={entry.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className="figure text-[10.5px] text-ink-faint">{total}</span>
                    <div className="flex w-full flex-col justify-end" style={{ height: `${(total / maxArrivals) * 100}%` }}>
                      <div className="w-full rounded-t-md bg-caution/55" style={{ height: `${(entry.foreign / total) * 100}%` }} />
                      <div className="w-full bg-ink/18" style={{ height: `${(entry.domestic / total) * 100}%` }} />
                    </div>
                    <span className="caption">{entry.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 border-t border-hairline pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span className="size-2 rounded-sm bg-ink/18" /> domestic
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span className="size-2 rounded-sm bg-caution/55" /> foreign
              </span>
            </div>
          </Card>
        </section>

        {/* Where to direct the next rupee */}
        <section className="mt-8">
          <SectionLabel>Where capacity is going unused</SectionLabel>
          <Card className="divide-y divide-hairline p-0">
            {underused.map((region) => (
              <button
                key={region.id}
                onClick={() => navigate("/gov/regions")}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-strong"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-ink">{region.name}</span>
                  <span className="caption mt-0.5 block">
                    {region.load}% load · {region.homestays} hosts · {region.scheme}
                  </span>
                </span>
                <Chip className="shrink-0 border-positive/35 text-positive">
                  <TrendUp size={11} weight="bold" />
                  {region.growth}%
                </Chip>
              </button>
            ))}
          </Card>
          <p className="caption mt-2.5 px-1 leading-relaxed">
            Growing fastest from the smallest base. These are where scheme money buys the most additional capacity.
          </p>
        </section>

        {/* Pressure */}
        <section className="mt-8">
          <SectionLabel>Where the pressure is</SectionLabel>
          <Inset className="divide-y divide-hairline p-0">
            {overloaded.map((site) => (
              <div key={site.id} className="px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-[13px] text-ink">{site.name}</p>
                  <p className={cn("figure shrink-0 text-[14px]", site.load > 85 ? "text-negative" : "text-caution")}>
                    {site.load}%
                  </p>
                </div>
                <p className="caption mt-1 leading-relaxed">{site.note}</p>
              </div>
            ))}
          </Inset>
        </section>

        <section className="mt-8 flex flex-col gap-2">
          <Row title="All districts" subtitle="Load, income and growth, district by district" to="/gov/regions" />
          <Row title="Safety advisories" subtitle="What travellers are being shown on each route" to="/gov/advisories" />
        </section>

        <p className="caption mt-6 flex items-center justify-center gap-1.5 text-center">
          Figures are seeded demo data <ArrowRight size={11} /> {rupees(income)} total
        </p>
      </Page>
    </Shell>
  );
}
