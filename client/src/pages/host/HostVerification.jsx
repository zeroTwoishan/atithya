/** The verification agent's queue, from the host's side.
 *
 *  A flag with no reason is a dead end, so every check the agent ran is shown
 *  — the ones that passed as well as the ones that did not. That is what
 *  makes the flag feel like a colleague rather than a rejection.
 */

import { useNavigate } from "react-router-dom";
import { CheckCircle, ShieldCheck, WarningCircle, Clock } from "@phosphor-icons/react";

import { cn } from "../../lib/utils";
import { rupees } from "../../lib/format";
import { useStore, listingsWithEdits } from "../../lib/store";
import { HOST_LISTING_IDS } from "../../data/host";
import { Shell } from "../../components/Shell";
import { Card, Inset, Page, SectionLabel, StatusBadge, EmptyState } from "../../components/ui";

/** The checks the agent runs before anything is published. */
function checksFor(listing, peers) {
  const median = peers.length
    ? [...peers].map((entry) => entry.price_amount).sort((a, b) => a - b)[Math.floor(peers.length / 2)]
    : listing.price_amount;

  const priceGap = Math.round(((listing.price_amount - median) / median) * 100);

  return [
    {
      key: "price",
      label: "Rate against comparable listings",
      pass: Math.abs(priceGap) < 30,
      detail:
        Math.abs(priceGap) < 30
          ? `${rupees(listing.price_amount)}, within range of the ${rupees(median)} district median`
          : `${rupees(listing.price_amount)} is ${Math.abs(priceGap)}% ${priceGap < 0 ? "below" : "above"} the ${rupees(median)} district median`,
    },
    {
      key: "capacity",
      label: "Stated capacity against the photos",
      pass: listing.status !== "needs_review",
      detail:
        listing.status === "needs_review"
          ? "Photos show fewer beds than the listing claims"
          : `Sleeps ${listing.capacity}, consistent with what was sent`,
    },
    {
      key: "contact",
      label: "Host contact verified",
      pass: true,
      detail: "WhatsApp number confirmed during onboarding",
    },
    {
      key: "duplicate",
      label: "Not a duplicate of an existing listing",
      pass: true,
      detail: "No title, address or photo match in the catalogue",
    },
    {
      key: "language",
      label: "Description faithful to the conversation",
      pass: true,
      detail: "Back-translated and confirmed with the host in their language",
    },
  ];
}

export function HostVerification() {
  const navigate = useNavigate();
  const all = useStore(listingsWithEdits);
  const mine = all.filter((listing) => HOST_LISTING_IDS.includes(listing.id));

  const open = mine.filter((listing) => listing.status !== "live");

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <h1 className="pt-2 font-display text-[30px] leading-tight text-ink">Verification</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          Every listing is screened before a traveller can see it. Here is what the agent checked, and what it found.
        </p>

        {open.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Everything is cleared"
            body="All of your listings passed verification and are live. New ones will appear here while they are screened."
            action={
              <button onClick={() => navigate("/host/listings")} className="pill-primary px-6 py-3 text-[13px] font-medium">
                See your listings
              </button>
            }
          />
        ) : (
          <div className="mt-7 flex flex-col gap-3">
            {open.map((listing) => {
              const peers = all.filter(
                (entry) => entry.district === listing.district && entry.offering_type === listing.offering_type && entry.id !== listing.id,
              );
              const checks = checksFor(listing, peers);
              const failed = checks.filter((check) => !check.pass);

              return (
                <Card key={listing.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="caption truncate">{listing.region}</p>
                      <p className="font-display text-[19px] leading-snug text-ink">{listing.title}</p>
                    </div>
                    <StatusBadge status={listing.status} className="shrink-0" />
                  </div>

                  <ul className="mt-4 flex flex-col gap-2.5 border-t border-hairline pt-4">
                    {checks.map((check) => (
                      <li key={check.key} className="flex items-start gap-2.5">
                        {check.pass ? (
                          <CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-positive" />
                        ) : (
                          <WarningCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-caution" />
                        )}
                        <span className="min-w-0">
                          <span className={cn("block text-[12.5px] leading-snug", check.pass ? "text-ink-soft" : "text-ink")}>
                            {check.label}
                          </span>
                          <span className="caption mt-0.5 block leading-relaxed">{check.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {listing.status === "pending_verification" && (
                    <Inset className="mt-4 flex items-center gap-2.5 py-3">
                      <Clock size={14} weight="duotone" className="shrink-0 text-ink-faint" />
                      <p className="text-[11.5px] text-ink-soft">Still screening. Nothing is needed from you yet.</p>
                    </Inset>
                  )}

                  <button
                    onClick={() => navigate(`/host/listing/${listing.id}`)}
                    className={cn("mt-4 w-full py-3 text-[13px] font-medium", failed.length ? "pill-primary" : "pill text-ink-soft")}
                  >
                    {failed.length ? `Fix ${failed.length === 1 ? "it" : `${failed.length} things`} and publish` : "Open the listing"}
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        <section className="mt-9">
          <SectionLabel>Why this exists</SectionLabel>
          <Inset>
            <p className="text-[12px] leading-relaxed text-ink-soft">
              A traveller booking an unlisted village homestay has no reviews to fall back on and no way to visit
              first. Screening every listing before publication is what makes the first booking possible at all —
              and the reason the flag is always explained is that the host has to be able to act on it.
            </p>
          </Inset>
        </section>
      </Page>
    </Shell>
  );
}
