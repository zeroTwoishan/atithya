/** The itinerary as a vertical timeline: a node per stop, a hairline running
 *  between them, days as section breaks. Stays are filled nodes, sights are
 *  hollow, workshops carry their own mark — so the shape of a day is readable
 *  before any of its text is.
 */

import { House, MapPin, Sparkle } from "@phosphor-icons/react";

import { cn } from "../lib/utils";
import { rupees } from "../lib/format";
import { Chip } from "./ui";

const KIND = {
  stay: { icon: House, className: "border-transparent bg-positive/15 text-positive" },
  experience: { icon: Sparkle, className: "border-transparent bg-ink/8 text-ink-soft" },
  site: { icon: MapPin, className: "border-hairline bg-surface text-ink-faint" },
};

function Stop({ item, last, onOpen }) {
  const meta = KIND[item.kind] ?? KIND.site;
  const openable = Boolean(item.listing_id && onOpen);

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span aria-hidden="true" className="absolute left-[13px] top-8 h-full w-px bg-hairline" />}

      <span className={cn("relative z-10 mt-0.5 flex size-[27px] shrink-0 items-center justify-center rounded-full border", meta.className)}>
        <meta.icon size={13} weight={item.kind === "site" ? "duotone" : "fill"} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              disabled={!openable}
              onClick={openable ? () => onOpen(item.listing_id) : undefined}
              className={cn(
                "block max-w-full truncate text-left font-display text-[17px] leading-snug text-ink",
                openable && "hover:underline",
              )}
            >
              {item.title}
            </button>
            <p className="caption mt-0.5 truncate">{item.region}</p>
          </div>
          {item.amount > 0 && <span className="figure shrink-0 text-[15px] text-ink">{rupees(item.amount)}</span>}
        </div>

        {item.note && (
          <p className={cn("mt-1.5 text-[11.5px] leading-relaxed", item.swapped ? "text-caution" : "text-ink-faint")}>
            {item.note}
          </p>
        )}
      </div>
    </li>
  );
}

export function Timeline({ items, onOpen }) {
  // Group by day without assuming the planner returned them contiguously.
  const days = [...new Set(items.map((item) => item.day))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-7">
      {days.map((day) => {
        const stops = items.filter((item) => item.day === day).sort((a, b) => a.sequence - b.sequence);
        return (
          <section key={day}>
            <div className="mb-4 flex items-center gap-3">
              <Chip className="shrink-0 font-medium">Day {day}</Chip>
              <span className="h-px flex-1 bg-hairline" />
            </div>
            <ol>
              {stops.map((item, index) => (
                <Stop key={`${day}-${item.sequence}`} item={item} last={index === stops.length - 1} onOpen={onOpen} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
