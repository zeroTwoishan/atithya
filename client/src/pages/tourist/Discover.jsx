/** The verified catalogue — every host an agent onboarded and verification
 *  cleared. One column on phones, two from `sm`, because a listing card is
 *  unreadable narrower than about 300px.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { humanise } from "../../lib/format";
import { useStore, listingsWithEdits } from "../../lib/store";
import { ListingCard } from "../../components/ListingCard";
import { Page, SubHeader, EmptyState, ChipButton } from "../../components/ui";

const TYPES = ["homestay", "artisan_experience", "guide"];

export function Discover() {
  const navigate = useNavigate();
  const listings = useStore(listingsWithEdits).filter((listing) => listing.status === "live");
  const [type, setType] = useState(null);
  const [term, setTerm] = useState("");

  const needle = term.trim().toLowerCase();
  const visible = listings.filter(
    (listing) =>
      (!type || listing.offering_type === type) &&
      (!needle ||
        [listing.title, listing.region, listing.description, ...listing.tags].some((field) =>
          field?.toLowerCase().includes(needle),
        )),
  );

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[960px] pb-20">
        <SubHeader title="Discover" subtitle={`${listings.length} verified listings`} back="/app" />

        <Page className="px-5 lg:px-8">
          <div className="card flex items-center gap-2.5 px-4 py-3">
            <MagnifyingGlass size={16} className="shrink-0 text-ink-faint" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Valleys, crafts, hosts…"
              aria-label="Search listings"
              className="min-w-0 flex-1 bg-transparent font-reading text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
            <ChipButton
              onClick={() => setType(null)}
              className={!type ? "bg-surface-strong font-medium text-ink" : ""}
            >
              Everything
            </ChipButton>
            {TYPES.map((entry) => (
              <ChipButton
                key={entry}
                onClick={() => setType(entry === type ? null : entry)}
                className={entry === type ? "bg-surface-strong font-medium text-ink" : ""}
              >
                {humanise(entry)}
              </ChipButton>
            ))}
          </div>

          {visible.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {visible.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onOpen={() => navigate(`/app/stay/${listing.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MagnifyingGlass}
              title="Nothing matches that"
              body="Try a district, a craft, or clear the filter — the catalogue is small by design."
            />
          )}
        </Page>
      </div>
    </div>
  );
}
