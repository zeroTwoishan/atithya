/** A listing as the tourist and the host both see it — shaped directly by the
 *  `listings` row the API returns (docs/BACKEND_SCHEMA.md §3), not by props
 *  invented per screen. */
import { MapPin, Star } from "@phosphor-icons/react";

import { cn } from "../lib/utils";
import { rupees, humanise } from "../lib/format";
import { Card, StatusBadge, Chip } from "./Primitives";

export function ListingCard({ listing, action, showStatus = false, className }) {
  const { title, region, offering_type, price_amount, price_unit, description, status, verification_notes, rating } = listing;

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">{humanise(offering_type)}</p>
          <h3 className="font-display text-[19px] leading-snug text-ink">{title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <MapPin size={13} weight="duotone" />
            {region}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="figure text-[20px] leading-none text-ink">{rupees(price_amount)}</p>
          <p className="mt-1 text-[11px] text-ink-faint">per {price_unit}</p>
        </div>
      </div>

      {description && <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{description}</p>}

      {(showStatus || rating) && (
        <div className="flex flex-wrap items-center gap-2">
          {showStatus && <StatusBadge status={status} />}
          {rating && (
            <Chip>
              <Star size={12} weight="fill" className="text-caution" />
              {Number(rating).toFixed(2)}
            </Chip>
          )}
        </div>
      )}

      {/* The verification agent's actual reason, shown to the host verbatim —
          a flag with no reason is just a dead end (docs/TRD.md §3.3). */}
      {showStatus && status === "needs_review" && verification_notes && (
        <p className="card-inset p-3 text-[11.5px] leading-relaxed text-caution">{verification_notes}</p>
      )}

      {action}
    </Card>
  );
}
