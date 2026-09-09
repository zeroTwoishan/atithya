"""docs/TRD.md §3.3 — Verification & Safety Agent.

No models of its own: this app is pure logic operating on `listings.Listing`.
"""

import statistics

from listings.models import Listing


def check_price_outlier(listing: Listing) -> str | None:
    """Rule check: price outside +-2 std-dev of the regional median for the
    same offering type. Real and working — no LLM needed for this half."""
    comparable_prices = list(
        Listing.objects.filter(offering_type=listing.offering_type, region=listing.region)
        .exclude(pk=listing.pk)
        .values_list("price_amount", flat=True)
    )
    if len(comparable_prices) < 3:
        return None  # not enough regional data to judge yet

    prices = [float(p) for p in comparable_prices]
    mean = statistics.mean(prices)
    stdev = statistics.pstdev(prices) or 1.0
    price = float(listing.price_amount)

    if abs(price - mean) > 2 * stdev:
        return (
            f"Price {price:.0f} is outside 2 std-dev of the regional median "
            f"({mean:.0f}) for {listing.offering_type} listings in {listing.region}."
        )
    return None


def check_contradictions_llm(listing: Listing) -> str | None:
    """LLM check: internally contradictory description (docs/TRD.md §3.3 example:
    claims both "no wifi" and "high-speed wifi").

    TODO (hackathon day, R2): call `settings.ANTHROPIC_API_KEY` with the
    listing description, ask for a single contradiction flag or None.
    """
    raise NotImplementedError("Wire up the Anthropic contradiction check here (docs/TRD.md §3.3)")


def run_verification(listing: Listing) -> Listing:
    """Runs the rule check now (real); the LLM check is still TODO, so a
    listing only ever gets auto-approved or rule-flagged until it's wired in."""
    reason = check_price_outlier(listing)
    if reason:
        listing.status = Listing.Status.NEEDS_REVIEW
        listing.verification_notes = reason
    else:
        listing.status = Listing.Status.LIVE
        listing.verification_notes = ""
    listing.save(update_fields=["status", "verification_notes", "updated_at"])
    return listing
