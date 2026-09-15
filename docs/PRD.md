# Atithya — Product Requirements Document

**Problem Statement 26204** · Smart India Hackathon (AICTE) · Theme: Travel & Tourism
**Status:** Draft for 36-hour build · **Owner:** Team Atithya

---

## 1. Problem

India's unorganized tourism supply — homestays, local guides, artisans, hyperlocal experiences — is invisible online. Not because of low demand, but because **onboarding it is operationally expensive**: someone has to visit, photograph, write listings, translate, and price for an operator who is often not English-speaking or smartphone-comfortable. Meanwhile tourists (especially first-time and foreign travelers) face overcrowding at the same known spots, difficulty discovering authentic local experiences, language barriers, and safety/scam concerns. Policymakers running rural tourism schemes (Swadesh Darshan 2.0, MUDRA-loan homestays) have no visibility into whether those schemes are actually converting into bookings and income.

**Precise problem statement:** bring India's unorganized tourism supply online at scale without requiring operator tech/English literacy, give tourists a trustworthy end-to-end discovery-to-booking path, and give government bodies real visibility into scheme outcomes.

## 2. Goals

| Goal | Metric (demo-scale) |
|---|---|
| Onboard unorganized supply with near-zero friction | A host completes onboarding via WhatsApp conversation in their own language in < 5 minutes, zero app installs |
| Convert tourist intent into a booked, adaptable trip | Tourist goes from "I want a trip" to a booked itinerary with ≥1 verified local listing in < 3 minutes |
| Give hosts a reason to stay listed | Host dashboard shows bookings, earnings, and at least one actionable pricing suggestion |
| Give government a scheme-outcome view | Dashboard shows rural income generated, homestay growth, and demand heatmap from real platform data |

## 3. Non-Goals (explicitly out of scope for this build)

- Real payment settlement (mock wallet only — see [[TRD]])
- Meta business verification / a production WhatsApp number (Cloud API test number stand-in — see [[TRD]])
- Multi-language production-grade translation pipeline (demo supports 1–2 regional languages, not all 22)
- Native mobile apps (web-responsive dashboards only)
- Full fraud/ML-based verification model (rule + LLM-flag heuristic only)

## 4. Personas

1. **Meera, homestay owner, rural Uttarakhand** — owns a 3-room homestay, speaks Hindi, has a basic smartphone, has never listed online because she doesn't know how and doesn't have time to figure out an app.
2. **Aditya, first-time domestic tourist** — wants an authentic trip beyond the standard circuit, has a budget and rough dates, doesn't want to spend hours comparing listings or worry about getting scammed.
3. **Ministry/state tourism officer** — needs to report on whether MUDRA-loan homestays and Swadesh Darshan 2.0 destinations are actually generating bookings and income, currently has no real-time data source.

## 5. Core User Journeys

### 5.1 Host onboarding (Meera)
1. Meera messages a WhatsApp number (or is messaged by the onboarding agent).
2. Conversational agent asks, in Hindi, what she offers, pricing, availability, and requests photos.
3. Agent extracts structured listing data, asks clarifying follow-ups where ambiguous, confirms back to her in her language.
4. Listing is created in `pending_verification` state, screened by the Verification & Safety agent, then goes live.
5. Meera can check bookings/earnings via a simple web dashboard (or WhatsApp status replies).

### 5.2 Tourist trip planning (Aditya)
1. Aditya opens the tourist web app, describes budget/interests/dates in a chat box.
2. Planning agent proposes an itinerary blending known sites with verified local listings (from the same DB Meera's listing lives in).
3. Aditya edits the itinerary inline (swap a stop, adjust budget), agent re-generates affected segments.
4. Aditya confirms — agent completes a mock booking (holds inventory, marks paid via mock wallet).
5. Mid-trip: if a "disruption" is simulated (closure/weather), the re-planning agent adjusts the remaining itinerary automatically. *(stretch)*

### 5.3 Government oversight
1. Officer opens the government dashboard.
2. Sees a regional heatmap of overcrowded vs. underused destinations, state-wise homestay growth, rural income attributable to the platform, and domestic vs. foreign arrival trend (seeded/synthetic where live data doesn't exist yet).

## 6. Features by Dashboard

### Tourist Dashboard
- Live, editable itinerary timeline
- Budget tracker
- Booking wallet (mock)
- Real-time safety pulse for current/selected location
- "Discover nearby" proactive suggestions
- Post-trip review → feeds host verification score

### Host / Operator Dashboard
- Listing management (view/edit what the onboarding agent captured)
- Booking calendar
- AI pricing copilot (rate suggestions from regional demand/seasonality)
- Earnings & payout tracker (mock payouts)
- Plain-language occupancy/conversion analytics

### Government / Tourism Board Dashboard
- Regional tourism heatmap (overcrowded vs. underused)
- Rural income generated, mapped to MUDRA-loan homestay growth
- State-wise homestay growth tracking
- Domestic vs. foreign arrival trends
- Aggregated safety-incident heatmap

## 7. Agent Layer (product view — see [[TRD]] for implementation)

| Agent | Job |
|---|---|
| WhatsApp Onboarding Agent | Converts a voice/text conversation in a regional language into a structured, live listing |
| Travel Planning & Booking Agent | Converts stated budget/interests/dates into a booked, editable itinerary |
| Verification & Safety Agent | Flags listing inconsistencies pre-publish; surfaces route-specific safety advisories |
| Adaptive Re-planning Agent *(stretch)* | Re-optimizes remaining itinerary on disruption, without manual re-prompting |

## 8. Why This Isn't "Just a Chatbot"

- **Persistent memory** — every listing and booking persists in Postgres; the platform compounds instead of resetting per session.
- **Acts, not just responds** — onboarding and re-planning agents act autonomously (outbound conversation, automatic re-plan) rather than waiting to be prompted each time.
- **Transacts** — completes bookings, not just advice.
- **Private structured data** — host listing history, tourist itinerary state, regional demand — none of which a general model has access to.

## 9. Success Criteria for the 36-Hour Build (demo-grade)

- [ ] One real end-to-end onboarding: WhatsApp (Cloud API test number) message → structured listing visible in Host Dashboard.
- [ ] One real end-to-end tourist flow: chat input → itinerary with ≥1 onboarded listing → mock booking confirmed.
- [ ] Host dashboard shows the booking against the listing with a payout figure.
- [ ] Government dashboard renders a heatmap and scheme-linked stats from the same database (seeded historical data + live demo data overlaid).
- [ ] Judges can watch the full loop live: onboard a fake homestay on stage → book it as a tourist → see it reflected in all three dashboards.

## 10. Risks

| Risk | Mitigation |
|---|---|
| A Cloud API test number only messages 5 pre-registered recipients | Register every demo phone in the Meta console before the event; have a fallback recorded clip if live WhatsApp fails |
| LLM latency during live demo | Keep agent graphs to 2–3 nodes; cache/pre-warm before demo slot |
| Regional language coverage | Demo in Hindi only; mention multi-language as roadmap, not built |
| Scope creep into re-planning agent | Treat as stretch, cut first if behind schedule (see [[BUILD_PLAN]]) |

---
*Related: [[TRD]] for architecture/tech decisions, [[BACKEND_SCHEMA]] for data model, [[UI_UX_DESIGN]] for screens, [[BUILD_PLAN]] for the 36-hour execution plan.*
