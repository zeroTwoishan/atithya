/** What the onboarding agent captured, as the host sees it.
 *
 *  A host who cannot correct the agent will stop trusting it, so every
 *  listing is openable and editable from here — including the ones still
 *  waiting on verification.
 */

import { useNavigate } from "react-router-dom";
import { WhatsappLogo } from "@phosphor-icons/react";

import { useStore, listingsWithEdits } from "../../lib/store";
import { HOST_LISTING_IDS } from "../../data/host";
import { Shell } from "../../components/Shell";
import { ListingCard } from "../../components/ListingCard";
import { Inset, Page, SectionLabel } from "../../components/ui";

export function HostListings() {
  const navigate = useNavigate();
  const listings = useStore(listingsWithEdits).filter((listing) => HOST_LISTING_IDS.includes(listing.id));

  const live = listings.filter((listing) => listing.status === "live");
  const waiting = listings.filter((listing) => listing.status !== "live");

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[720px]">
        <h1 className="pt-2 font-display text-[30px] leading-tight text-ink">Listings</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          Everything the onboarding agent wrote from your WhatsApp conversation. Open any of them to correct it.
        </p>

        {waiting.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Waiting on you</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {waiting.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showStatus
                  onOpen={() => navigate(`/host/listing/${listing.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <SectionLabel>Live</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {live.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showStatus
                onOpen={() => navigate(`/host/listing/${listing.id}`)}
              />
            ))}
          </div>
        </section>

        <Inset className="mt-7 flex items-start gap-3">
          <WhatsappLogo size={18} weight="duotone" className="mt-0.5 shrink-0 text-positive" />
          <div>
            <p className="text-[13px] text-ink">Add another offering</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
              Send a voice note or a message to the Atithya number in Hindi. The agent asks what it needs, writes
              the listing, and puts it here for you to approve — no form, no app, no English.
            </p>
          </div>
        </Inset>
      </Page>
    </Shell>
  );
}
