/** One listing, in full — including who the host is and how the listing got
 *  here, which is the part that makes an unlisted village homestay
 *  trustworthy enough to book.
 */

import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Star, Users, ChatCircleDots, CheckCircle } from "@phosphor-icons/react";

import { rupees, humanise, shortDate } from "../../lib/format";
import { useStore, listingWithEdits, actions } from "../../lib/store";
import { HOSTS, ADVISORIES } from "../../data/catalog";
import { planTrip } from "../../lib/planner";
import { Card, Inset, Chip, Page, SubHeader, StatusBadge } from "../../components/ui";

export function StayDetail() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const listing = useStore((state) => listingWithEdits(listingId, state));

  if (!listing) {
    return (
      <div className="aurora min-h-dvh">
        <SubHeader title="Listing not found" back="/app/discover" />
        <p className="px-5 text-[12.5px] text-ink-soft">That listing is no longer in the catalogue.</p>
      </div>
    );
  }

  const host = HOSTS[listing.host_id];
  const advisory = ADVISORIES.find((entry) => entry.region.startsWith(listing.district));

  function planAround() {
    const trip = planTrip(`₹${listing.price_amount * 5}, 4 days, ${listing.tags.join(" ")}`);
    actions.addTrip(trip);
    navigate(`/app/new/${trip.id}`);
  }

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[560px] pb-20">
        <SubHeader title={humanise(listing.offering_type)} back="/app/discover" />

        <Page className="px-5">
          <h1 className="font-display text-[30px] leading-tight text-ink">{listing.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <MapPin size={14} weight="duotone" />
            {listing.region}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={listing.status} />
            {listing.rating && (
              <Chip>
                <Star size={12} weight="fill" className="text-caution" />
                {listing.rating.toFixed(1)} · {listing.reviews} stays
              </Chip>
            )}
            <Chip>
              <Users size={12} weight="duotone" />
              sleeps {listing.capacity}
            </Chip>
          </div>

          <Card className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="figure text-[30px] leading-none text-ink">{rupees(listing.price_amount)}</p>
              <p className="caption mt-1.5">per {listing.price_unit}</p>
            </div>
            <div className="text-right">
              <p className="caption">To the host</p>
              <p className="figure mt-0.5 text-[17px] text-positive">{rupees(listing.price_amount)}</p>
              <p className="caption">0% commission</p>
            </div>
          </Card>

          <p className="mt-6 font-reading text-[16px] leading-[1.65] text-ink">{listing.description}</p>

          <section className="mt-7">
            <p className="caption mb-3">What you get</p>
            <ul className="flex flex-col gap-2">
              {listing.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2.5">
                  <CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-positive" />
                  <span className="text-[12.5px] leading-relaxed text-ink-soft">{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          {host && (
            <section className="mt-8">
              <p className="caption mb-3">Your host</p>
              <Inset>
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-strong font-display text-[18px] text-ink">
                    {host.name[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-ink">{host.name}</p>
                    <p className="caption mt-0.5">{host.village} · speaks {host.language}</p>
                  </div>
                </div>
                <p className="mt-3.5 flex items-start gap-2 border-t border-hairline pt-3.5 text-[11.5px] leading-relaxed text-ink-soft">
                  <ChatCircleDots size={14} weight="duotone" className="mt-0.5 shrink-0 text-ink-faint" />
                  Onboarded via {host.onboarded_via} on {shortDate(host.joined)} — the agent conducted the interview in {host.language} and wrote this listing from it.
                </p>
              </Inset>
            </section>
          )}

          {advisory && (
            <section className="mt-8">
              <p className="caption mb-3">Getting there</p>
              <Inset>
                <p className="text-[13px] text-ink">{advisory.title}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{advisory.body}</p>
              </Inset>
            </section>
          )}

          <div className="mt-9 flex flex-col gap-2">
            <button onClick={planAround} className="pill-primary py-3.5 text-[13.5px] font-medium">
              Plan a trip around this
            </button>
            <button onClick={() => navigate("/app/discover")} className="pill py-3.5 text-[13px] text-ink-soft">
              Back to discover
            </button>
          </div>
        </Page>
      </div>
    </div>
  );
}
