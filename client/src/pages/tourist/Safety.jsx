/** Safety, and where the crowds are not.
 *
 *  The two halves belong together: a traveller asking "is this route fine?"
 *  is usually also asking "is it going to be full?". Advisories carry their
 *  source and their date, because an advisory you cannot age is worthless.
 */

import { Warning, Info, ShieldWarning } from "@phosphor-icons/react";

import { cn } from "../../lib/utils";
import { shortDate } from "../../lib/format";
import { ADVISORIES, KNOWN_SITES } from "../../data/catalog";
import { Shell } from "../../components/Shell";
import { Card, Page, SectionLabel, Meter } from "../../components/ui";

const SEVERITY = {
  info: { icon: Info, tone: "text-positive", label: "Good to know" },
  caution: { icon: ShieldWarning, tone: "text-caution", label: "Caution" },
  warning: { icon: Warning, tone: "text-negative", label: "Warning" },
};

const ORDER = { warning: 0, caution: 1, info: 2 };

export function Safety() {
  const advisories = [...ADVISORIES].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const sites = [...KNOWN_SITES].sort((a, b) => b.load - a.load);

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <h1 className="pt-2 font-display text-[30px] leading-tight text-ink">Safety</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          Live advisories on the routes Atithya plans, and how full each destination actually is.
        </p>

        <section className="mt-7">
          <SectionLabel>Active advisories</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {advisories.map((advisory) => {
              const meta = SEVERITY[advisory.severity];
              return (
                <Card key={advisory.id}>
                  <div className="flex items-start gap-3">
                    <meta.icon size={17} weight="duotone" className={cn("mt-0.5 shrink-0", meta.tone)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={cn("text-[11px] font-medium uppercase tracking-[0.12em]", meta.tone)}>{meta.label}</p>
                        <p className="caption shrink-0">{shortDate(advisory.updated)}</p>
                      </div>
                      <p className="mt-1 font-display text-[18px] leading-snug text-ink">{advisory.title}</p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{advisory.body}</p>
                      <p className="caption mt-2.5">{advisory.region} · {advisory.source}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-9">
          <SectionLabel>How full each place is</SectionLabel>
          <Card className="divide-y divide-hairline p-0">
            {sites.map((site) => (
              <div key={site.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-[13.5px] text-ink">{site.name}</p>
                  <p className={cn("figure shrink-0 text-[15px]", site.load > 75 ? "text-negative" : site.load > 50 ? "text-caution" : "text-positive")}>
                    {site.load}%
                  </p>
                </div>
                <Meter
                  className="mt-2.5"
                  value={site.load}
                  max={100}
                  tone={site.load > 75 ? "negative" : site.load > 50 ? "caution" : "positive"}
                />
                <p className="caption mt-2">{site.note}</p>
              </div>
            ))}
          </Card>
          <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-ink-faint">
            Load is bookings against comfortable carrying capacity, not licensed capacity. Atithya routes away from
            anything above 75%.
          </p>
        </section>
      </Page>
    </Shell>
  );
}
