/** A listing as the traveller and the host both see it — shaped directly by
 *  the row in data/catalog.js, not by props invented per screen.
 */

import { MapPin, Star, Users } from "@phosphor-icons/react";

import { cn } from "../lib/utils";
import { rupees, humanise } from "../lib/format";
import { Card, StatusBadge, Chip } from "./ui";

export function ListingCard({ listing, onOpen, action, showStatus = false, className }) {
  const { title, region, offering_type, price_amount, price_unit, description, status, verification_notes, rating, reviews, capacity } = listing;

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="flex items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="eyebrow mb-1">{humanise(offering_type)}</p>
          <h3 className={cn("font-display text-[19px] leading-snug text-ink", onOpen && "hover:underline")}>{title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <MapPin size={13} weight="duotone" />
            {region}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="figure text-[20px] leading-none text-ink">{rupees(price_amount)}</p>
          <p className="caption mt-1">per {price_unit}</p>
        </div>
      </button>

      {description && <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{description}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {showStatus && <StatusBadge status={status} />}
        {rating ? (
          <Chip>
            <Star size={12} weight="fill" className="text-caution" />
            {rating.toFixed(1)}
            <span className="text-ink-faint">· {reviews}</span>
          </Chip>
        ) : (
          <Chip className="text-ink-faint">No stays yet</Chip>
        )}
        {capacity && (
          <Chip>
            <Users size={12} weight="duotone" />
            {capacity}
          </Chip>
        )}
      </div>

      {/* The verification agent's actual reason, shown to the host verbatim —
          a flag with no reason is just a dead end. */}
      {showStatus && status === "needs_review" && verification_notes && (
        <p className="card-inset p-3 text-[11.5px] leading-relaxed text-caution">{verification_notes}</p>
      )}

      {action}
    </Card>
  );
}
