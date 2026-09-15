/** The verified catalogue — every listing an agent onboarded and the
 *  verification agent cleared. One column on phones, two from `sm`, three
 *  from `xl`. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { Card, SectionLabel, Placeholder, Chip } from "../../components/Primitives";
import { ListingCard } from "../../components/ListingCard";
import { endpoints, apiError } from "../../lib/api";
import { humanise } from "../../lib/format";

const TYPES = ["homestay", "guide", "artisan_experience"];

export function DiscoverNearby() {
  const [type, setType] = useState(null);
  const [term, setTerm] = useState("");

  const listings = useQuery({
    queryKey: ["listings", { status: "live", type }],
    queryFn: () => endpoints.listings({ status: "live", ...(type ? { offering_type: type } : {}) }),
  });
  const advisories = useQuery({ queryKey: ["advisories"], queryFn: () => endpoints.advisories() });

  const needle = term.trim().toLowerCase();
  const visible = (listings.data ?? []).filter(
    (listing) =>
      !needle ||
      [listing.title, listing.region, listing.description].some((field) => field?.toLowerCase().includes(needle)),
  );

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
      <div className="card flex items-center gap-2.5 px-4 py-3">
        <MagnifyingGlass size={16} className="shrink-0 text-ink-faint" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search valleys, crafts, hosts…"
          aria-label="Search listings"
          className="min-w-0 flex-1 bg-transparent font-reading text-[14.5px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        <FilterChip active={type === null} onClick={() => setType(null)}>
          Everything
        </FilterChip>
        {TYPES.map((value) => (
          <FilterChip key={value} active={type === value} onClick={() => setType(value)}>
            {humanise(value)}
          </FilterChip>
        ))}
      </div>

      <Placeholder
        loading={listings.isLoading}
        error={listings.isError ? apiError(listings.error) : null}
        empty={visible.length ? null : "No verified listings match that yet."}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </Placeholder>

      {advisories.data?.length > 0 && (
        <section>
          <SectionLabel>Regional advisories</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {advisories.data.map((advisory) => (
              <Card key={advisory.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Chip>{advisory.region}</Chip>
                  <Chip
                    className={
                      advisory.severity === "warning"
                        ? "text-negative"
                        : advisory.severity === "caution"
                          ? "text-caution"
                          : "text-positive"
                    }
                  >
                    {humanise(advisory.severity)}
                  </Chip>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{advisory.message}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 rounded-full border px-4 py-2 text-[12px] transition-colors ${
      active ? "border-transparent bg-ink text-canvas" : "border-hairline bg-surface text-ink-soft hover:text-ink"
    }`}
  >
    {children}
  </button>
);
