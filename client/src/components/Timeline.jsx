/** The itinerary as a vertical timeline: a node per stop, a hairline running
 *  between them, days as section breaks. Stays are filled nodes, sightseeing
 *  stops hollow — so the shape of a day is readable before any text is. */
import { House, MapPin } from "@phosphor-icons/react";

import { rupees, humanise } from "../lib/format";
import { Chip } from "./Primitives";

function Stop({ item, last }) {
  const place = item.listing ?? item.known_site;
  const isStay = Boolean(item.listing);

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* Connector — drawn behind the node, stopped at the last stop */}
      {!last && <span aria-hidden="true" className="absolute left-[13px] top-7 h-full w-px bg-hairline" />}

      <span
        className={`relative z-10 mt-0.5 flex size-[27px] shrink-0 items-center justify-center rounded-full border ${
          isStay ? "border-transparent bg-positive/15 text-positive" : "border-hairline bg-surface text-ink-faint"
        }`}
      >
        {isStay ? <House size={14} weight="fill" /> : <MapPin size={13} weight="duotone" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[17px] leading-snug text-ink">{place?.title ?? place?.name ?? "Free time"}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-soft">
              {place?.region}
              {place?.category ? ` · ${humanise(place.category)}` : ""}
            </p>
          </div>
          {isStay && (
            <span className="figure shrink-0 text-[15px] text-ink">
              {rupees(item.listing.price_amount)}
              <span className="ml-1 font-sans text-[10.5px] text-ink-faint">/{item.listing.price_unit}</span>
            </span>
          )}
        </div>
        {item.notes && <p className="mt-1.5 text-[11.5px] text-ink-faint">{item.notes}</p>}
      </div>
    </li>
  );
}

export function Timeline({ items }) {
  // Group by day without assuming the API returned them contiguously.
  const days = [...new Set(items.map((item) => item.day_number))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-7">
      {days.map((day) => {
        const stops = items.filter((item) => item.day_number === day).sort((a, b) => a.sequence - b.sequence);
        return (
          <section key={day}>
            <div className="rule-row mb-4">
              <Chip className="font-medium">Day {day}</Chip>
            </div>
            <ol>
              {stops.map((item, index) => (
                <Stop key={item.id ?? `${day}-${index}`} item={item} last={index === stops.length - 1} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
