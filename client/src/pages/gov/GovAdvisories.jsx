/** What travellers are actually being shown on each route.
 *
 *  The board's copy of the advisory feed. The point of putting it here is
 *  that the officer can see the same sentence the traveller sees, with its
 *  source and its age attached.
 */

import { Warning, Info, ShieldWarning } from "@phosphor-icons/react";

import { cn } from "../../lib/utils";
import { shortDate } from "../../lib/format";
import { ADVISORIES, KNOWN_SITES } from "../../data/catalog";
import { Shell } from "../../components/Shell";
import { Card, Inset, Page, SectionLabel, StatRow } from "../../components/ui";

const SEVERITY = {
  info: { icon: Info, tone: "text-positive", label: "Good to know" },
  caution: { icon: ShieldWarning, tone: "text-caution", label: "Caution" },
  warning: { icon: Warning, tone: "text-negative", label: "Warning" },
};

const ORDER = { warning: 0, caution: 1, info: 2 };

export function GovAdvisories() {
  const advisories = [...ADVISORIES].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const counts = advisories.reduce((tally, advisory) => ({ ...tally, [advisory.severity]: (tally[advisory.severity] ?? 0) + 1 }), {});
  const routed = KNOWN_SITES.filter((site) => site.load > 75).length;

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <h1 className="pt-2 font-display text-[30px] leading-tight text-ink">Advisories</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          The exact text travellers are shown before and during a trip on these routes.
        </p>

        <StatRow
          className="mt-5"
          items={[
            { label: "warnings", value: counts.warning ?? 0 },
            { label: "cautions", value: counts.caution ?? 0 },
            { label: "sites routed around", value: routed },
          ]}
        />

        <section className="mt-8">
          <SectionLabel>Live feed</SectionLabel>
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
                      <p className="caption mt-2.5">{advisory.region} · source: {advisory.source}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Inset className="mt-8">
          <p className="caption mb-2">How these are raised</p>
          <p className="text-[12px] leading-relaxed text-ink-soft">
            Official bulletins are ingested directly. The rest come from hosts and travellers reporting through the
            platform — the Bhuntar taxi pricing advisory came from three separate traveller reports in one month.
            Anything routed above 75% load is steered around automatically, whether or not an advisory exists.
          </p>
        </Inset>
      </Page>
    </Shell>
  );
}
