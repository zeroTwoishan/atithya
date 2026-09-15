/** One listing, editable.
 *
 *  Price and capacity are the two fields the onboarding agent most often has
 *  to guess at, so they are the two the host can change here directly.
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

import { rupees, humanise, shortDate } from "../../lib/format";
import { useStore, listingWithEdits, actions } from "../../lib/store";
import { HOSTS } from "../../data/catalog";
import { BOOKINGS } from "../../data/host";
import { Card, Inset, Chip, Page, SubHeader, StatusBadge, Slider } from "../../components/ui";

export function HostListingDetail() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const listing = useStore((state) => listingWithEdits(listingId, state));

  const [price, setPrice] = useState(listing?.price_amount ?? 0);
  const [capacity, setCapacity] = useState(listing?.capacity ?? 2);

  if (!listing) {
    return (
      <div className="aurora min-h-dvh">
        <SubHeader title="Listing not found" back="/host/listings" />
        <p className="px-5 text-[12.5px] text-ink-soft">That listing is no longer in the catalogue.</p>
      </div>
    );
  }

  const host = HOSTS[listing.host_id];
  const stays = BOOKINGS.filter((booking) => booking.listing_id === listing.id);
  const earned = stays.reduce((total, booking) => total + booking.amount, 0);
  const dirty = price !== listing.price_amount || capacity !== listing.capacity;

  function save() {
    actions.patchListing(listing.id, { price_amount: price, capacity });
    toast.success("Listing updated. Travellers see the new rate immediately.");
  }

  function publish() {
    actions.patchListing(listing.id, { price_amount: price, capacity, status: "live", verification_notes: null });
    toast.success("Published. It is now bookable.");
    navigate("/host/listings");
  }

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[560px] pb-20">
        <SubHeader title={humanise(listing.offering_type)} back="/host/listings" />

        <Page className="px-5">
          <h1 className="font-display text-[28px] leading-tight text-ink">{listing.title}</h1>
          <p className="caption mt-1.5">{listing.region}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={listing.status} />
            {listing.rating ? <Chip>{listing.rating.toFixed(1)} · {listing.reviews} stays</Chip> : <Chip>No stays yet</Chip>}
          </div>

          {/* The verification agent's reason, verbatim */}
          {listing.verification_notes && (
            <Inset className="mt-5 border-caution/30">
              <div className="flex items-start gap-3">
                <WarningCircle size={16} weight="duotone" className="mt-0.5 shrink-0 text-caution" />
                <div>
                  <p className="text-[12.5px] font-medium text-caution">The verification agent flagged this</p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">{listing.verification_notes}</p>
                </div>
              </div>
            </Inset>
          )}

          {/* What the agent wrote */}
          <section className="mt-7">
            <p className="caption mb-2">What the agent wrote from your conversation</p>
            <Card>
              <p className="font-reading text-[15.5px] leading-[1.65] text-ink">{listing.description}</p>
              <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
                {listing.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-soft">
                    <CheckCircle size={12} weight="fill" className="mt-0.5 shrink-0 text-positive" />
                    {highlight}
                  </li>
                ))}
              </ul>
              {host && (
                <p className="caption mt-4 border-t border-hairline pt-3 leading-relaxed">
                  Captured over {host.onboarded_via} in {host.language}, {shortDate(host.joined)}.
                </p>
              )}
            </Card>
          </section>

          {/* The two fields worth editing */}
          <section className="mt-7">
            <p className="caption mb-2">Correct the agent</p>
            <Card className="flex flex-col gap-6">
              <Slider
                label={`Rate per ${listing.price_unit}`}
                value={price}
                min={300}
                max={6000}
                step={50}
                onChange={setPrice}
                format={rupees}
                note={
                  price === listing.price_amount
                    ? "This is what travellers currently see."
                    : `Was ${rupees(listing.price_amount)}. You keep 100% of this either way.`
                }
              />
              <Slider
                label="Sleeps"
                value={capacity}
                min={1}
                max={12}
                step={1}
                onChange={setCapacity}
                note="Beds you can actually make up, not floor space."
              />
            </Card>

            <div className="mt-3 flex flex-col gap-2">
              {listing.status !== "live" ? (
                <button onClick={publish} className="pill-positive py-3.5 text-[13px] font-medium">
                  Publish this listing
                </button>
              ) : (
                <button onClick={save} disabled={!dirty} className="pill-primary py-3.5 text-[13px] font-medium">
                  {dirty ? "Save changes" : "Nothing to save"}
                </button>
              )}
            </div>
          </section>

          {/* Its own history */}
          <section className="mt-8">
            <p className="caption mb-2">This listing has earned</p>
            <Card>
              <p className="figure text-[28px] leading-none text-ink">{rupees(earned)}</p>
              <p className="caption mt-1.5">across {stays.length} stays</p>
              {stays.length > 0 && (
                <div className="mt-4 divide-y divide-hairline border-t border-hairline pt-1">
                  {stays.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-4 py-2.5">
                      <span className="min-w-0 truncate text-[12px] text-ink-soft">
                        {booking.guest} · {shortDate(booking.start)}
                      </span>
                      <span className="figure shrink-0 text-[12.5px] text-ink">{rupees(booking.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </Page>
      </div>
    </div>
  );
}
