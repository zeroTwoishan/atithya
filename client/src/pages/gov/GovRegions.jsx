/** The district heatmap.
 *
 *  A stylised zone grid rather than a map library — the districts that matter
 *  here are eight, and a choropleth of eight polygons costs 200KB to say what
 *  a weighted block says for free. Colour is never the only signal: every
 *  block carries its load as a figure.
 */

import { useState } from "react";

import { cn } from "../../lib/utils";
import { rupees, compactRupees } from "../../lib/format";
import { REGIONS } from "../../data/catalog";
import { Shell } from "../../components/Shell";
import { Card, Chip, Page, SectionLabel, Segmented, Meter } from "../../components/ui";

const SORTS = [
  { value: "load", label: "Load" },
  { value: "income", label: "Income" },
  { value: "growth", label: "Growth" },
];

/** Warmer as it fills up. Kept as inline opacity so both themes read it. */
function tone(load) {
  if (load > 75) return { chip: "text-negative", bar: "negative", band: "bg-negative/18" };
  if (load > 50) return { chip: "text-caution", bar: "caution", band: "bg-caution/18" };
  return { chip: "text-positive", bar: "positive", band: "bg-positive/18" };
}

export function GovRegions() {
  const [sort, setSort] = useState("load");
  const [selected, setSelected] = useState(null);

  const regions = [...REGIONS].sort((a, b) => b[sort] - a[sort]);
  const totalIncome = REGIONS.reduce((total, region) => total + region.income, 0);
  const active = regions.find((region) => region.id === selected) ?? null;

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[720px]">
        <h1 className="pt-2 font-display text-[30px] leading-tight text-ink">Districts</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          Demand against comfortable capacity, and what reached hosts in each district.
        </p>

        <Segmented className="mt-5" options={SORTS} value={sort} onChange={setSort} />

        {/* The grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {regions.map((region) => {
            const meta = tone(region.load);
            return (
              <button
                key={region.id}
                onClick={() => setSelected(region.id === selected ? null : region.id)}
                className={cn(
                  "card relative overflow-hidden p-4 text-left transition-transform",
                  region.id === selected && "ring-1 ring-ink",
                )}
              >
                <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0", meta.band)} style={{ height: `${region.load}%` }} />
                <span className="relative block">
                  <span className="caption block truncate">{region.state.split(" ")[0]}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-ink">{region.name}</span>
                  <span className={cn("figure mt-2 block text-[22px] leading-none", meta.chip)}>{region.load}%</span>
                  <span className="caption mt-1 block">{compactRupees(region.income)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* The selected district in full */}
        {active && (
          <Card className="mt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="caption">{active.state}</p>
                <p className="font-display text-[22px] leading-snug text-ink">{active.name}</p>
              </div>
              <Chip className="shrink-0">{active.scheme}</Chip>
            </div>

            <Meter value={active.load} max={100} className="mt-4" tone={tone(active.load).bar} />

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-hairline pt-4 sm:grid-cols-4">
              <Figure label="Load" value={`${active.load}%`} />
              <Figure label="Verified hosts" value={active.homestays} />
              <Figure label="Bookings" value={active.bookings} />
              <Figure label="To hosts" value={compactRupees(active.income)} />
            </div>

            <p className="caption mt-4 border-t border-hairline pt-3 leading-relaxed">
              {active.growth}% year-on-year growth in listed capacity.{" "}
              {active.load > 75
                ? "Already past comfortable capacity — new scheme spend here buys congestion, not income."
                : active.load < 35
                  ? "Well under capacity. Additional listings here convert directly into rural income."
                  : "Healthy. Room to grow without displacing anyone."}
            </p>
          </Card>
        )}

        {/* The table, for anyone who would rather read it */}
        <section className="mt-9">
          <SectionLabel>All districts</SectionLabel>
          <Card className="divide-y divide-hairline p-0">
            {regions.map((region) => (
              <div key={region.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{region.name}</span>
                  <span className="caption mt-0.5 block">
                    {region.homestays} hosts · {region.bookings} bookings · +{region.growth}%
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={cn("figure block text-[14px]", tone(region.load).chip)}>{region.load}%</span>
                  <span className="caption">{compactRupees(region.income)}</span>
                </span>
              </div>
            ))}
          </Card>
          <p className="caption mt-3 px-1 leading-relaxed">
            {rupees(totalIncome)} in total reached hosts across these districts. Seeded demo figures modelled on
            Himachal and Uttarakhand district data.
          </p>
        </section>
      </Page>
    </Shell>
  );
}

const Figure = ({ label, value }) => (
  <div>
    <p className="caption">{label}</p>
    <p className="figure mt-0.5 text-[17px] text-ink">{value}</p>
  </div>
);
