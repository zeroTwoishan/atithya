## BHRAMAN

An Agentic AI Platform to Digitize India's Invisible Tourism Economy

|   | Smart India Hackathon — Problem Statement |
| --- | --- |
| Problem Statement ID | 26204 |
| Title | Student Innovation — A solution/idea that can boost the current |
|   | situation of the tourism industries including hotels, travel and others. |
| Organization | AICTE |
| Department | AICTE, MIC – Student Innovation |
| Category | Software |
| Theme | Travel & Tourism |

This document outlines the problem, the proposed solution, the revenue model, and a comparative

analysis against existing market players.


## 1. Problem Statement

India's tourism sector is at an inflection point. Domestic travel is booming, but inbound international tourism is under strain, and the government has explicitly identified rural tourism, homestays, and unorganized local operators as the next growth lever for the industry.

## 1.1 The macro picture

- India recorded around 9.02 million foreign tourist arrivals in 2025-26, while inbound arrivals are showing signs of strain due to global geopolitical uncertainty and rising travel costs — even as domestic travel continues to thrive and support local economies.

- The Union Budget 2026-27 allocated ■2,335 crore to tourism, with explicit focus on developing 50 new destinations, MUDRA loans for homestays, and rural connectivity — signaling that the government sees the unorganized sector as central to future growth.

- States including Ladakh, Uttarakhand, Himachal Pradesh, Kerala, and the North-East have already begun promoting homestay-based, community-driven tourism models as an economic lever for rural households, women, and youth.

## 1.2 The gap no one is solving

Despite this policy push, the actual supply of homestays, local guides, artisans, and hyperlocal experiences remains almost entirely invisible online. Established OTAs (MakeMyTrip, Booking.com, OYO) do not list this unorganized inventory at scale — not out of neglect, but because onboarding it is operationally expensive: someone has to visit, photograph, write listings, translate, and set pricing for an operator who is often not comfortable with English or smartphone apps. This is a structural cost-of-onboarding problem, not a demand problem.

At the same time, tourists — particularly foreign and first-time domestic travelers — face real friction: overcrowding at the same well-known destinations, difficulty discovering authentic local experiences, language barriers with local vendors, and safety/scam concerns that are repeatedly cited as a barrier to inbound tourism growth.

## 1.3 Problem, stated precisely

How do we bring India's unorganized tourism supply — homestays, guides, artisans, and hyperlocal experiences — online at scale, without requiring operators to be tech-literate or English-speaking, while giving tourists a trustworthy, end-to-end way to discover and book these experiences, and giving policymakers visibility into whether their own rural tourism schemes are actually working?


## 2. Our Solution: Bhraman

Bhraman is an agentic AI platform that does two things no existing tourism product does together: it autonomously onboards unorganized tourism supply through natural conversation, and it plans, books, and adapts trips end-to-end for tourists — all backed by role-specific dashboards for hosts, tourists, and government tourism bodies.

## 2.1 The agent layer

| Agent | What it does |
| --- | --- |
| WhatsApp Onboarding | Holds a natural voice/text conversation with a homestay owner, guide, or artisan |
| Agent | in their regional language over WhatsApp — no app download, no English |
|   | required. Extracts what they offer, pricing, availability, and photos, and |
|   | autonomously builds a structured, searchable listing. This is the core |
|   | differentiator: it solves the actual reason unorganized supply isn't online today. |
| Travel Planning & Booking | Tourist describes budget, interests, and dates in conversation. The agent builds |
| Agent | a personalized itinerary blending well-known sites with verified local experiences, |
|   | and completes the booking transaction directly — it does not just recommend, it |
| acts. |   |
| Verification & Safety Agent | Screens new listings for inconsistencies before they go live (pricing far outside |
|   | local norms, contradictory details) and gives tourists real-time, route-specific |
|   | safety and scam advisories — directly addressing the safety-perception barrier |
|   | that limits inbound tourism. |
| Adaptive Re-planning | Automatically re-optimizes the remainder of an itinerary when weather, closures, |
| Agent | or local events disrupt the original plan — mid-trip, without the tourist having to |
| replan manually. |   |

## 2.2 Three role-based dashboards

The agent layer is invisible infrastructure — the dashboards are where each stakeholder actually experiences the value.

| Dashboard | Key features |
| --- | --- |
| Tourist Dashboard | Live editable itinerary timeline · budget tracker · booking wallet · real-time safety |
|   | pulse for current location · “discover nearby” proactive suggestions · post-trip |
|   | reviews that feed back into host verification. |
| Host / Operator Dashboard | Listing management · booking calendar · AI pricing copilot suggesting rate |
|   | changes based on regional demand and seasonality · earnings and payout |
|   | tracker · plain-language occupancy and conversion analytics. |
| Government / Tourism | Regional tourism heatmaps (overcrowded vs. underused destinations) · rural |
| Board Dashboard | income generated through the platform, mapped to MUDRA-loan-backed |
|   | homestay growth · state-wise homestay growth tracking · domestic vs. foreign |
|   | arrival trends · aggregated safety-incident heatmaps to guide where advisories or |
| patrols are needed. |   |

## 2.3 Why this can't just be a ChatGPT prompt


- It remembers and accumulates — every onboarded listing and every booking persists in a database, making the platform better for the next tourist. A chat session has no memory of the last homestay it spoke to.

- It acts without being asked — the onboarding agent runs outbound conversations and the re-planning agent adjusts itineraries automatically; a general model only responds when prompted.

- It transacts, completing real bookings and payments, rather than only offering advice the user must act on separately.

- It has structured, private data no general model has — a specific host's listing history, a specific tourist's itinerary state, a specific region's live demand.

## 2.4 Technology stack

Node.js + Express for the booking and listing APIs; LangGraph for the multi-agent orchestration layer (onboarding, planning, verification, and re-planning agents as a supervised graph with persistent checkpointing); PostgreSQL with pgvector for relational data and retrieval-augmented grounding; WhatsApp Business API as the onboarding channel; HTML/CSS/JS for the tourist, host, and government dashboards.


## 3. Revenue Model

The model is deliberately structured so that onboarding remains free — supply growth is the priority in the early phase — while monetization happens on transactions, premium host tools, and government/enterprise licensing once the network has scale.

| Stream | Model | Rationale |
| --- | --- | --- |
| Booking commission | 10-15% take rate per confirmed booking, | Standard OTA/marketplace mechanic (in |
|   | split between a host-side commission and | line with Airbnb-style take rates); scales |
|   | a small tourist-side service fee. | directly with transaction volume. |
| Host subscription | Free basic listing; a paid Pro tier | Keeps the onboarding funnel free (critical |
| tiers | (indicative ■299/month) unlocks the AI | for unorganized-sector adoption) while |
|   | pricing copilot, advanced analytics, and | monetizing hosts who are already earning |
|   | priority placement in search. | through the platform. |
| Government / B2G | Subscription or grant-funded licensing of | Directly usable for tracking Swadesh |
| dashboard licensing | the analytics dashboard to state tourism | Darshan 2.0 and MUDRA-loan homestay |
|   | boards and the Ministry of Tourism. | scheme outcomes — a natural budget line |
|   |   | for tourism departments already funding |
|   |   | these programs. |
| Verified partner | Local transport operators, artisan | Low-friction revenue from operators who |
| placements | cooperatives, and tour guides pay a | benefit from visibility but aren't part of the |
|   | modest fee for featured placement in | core booking flow. |
|   | relevant itineraries. |   |
| Anonymized demand | Aggregated, anonymized regional demand | A byproduct of platform activity that |
| insights | and seasonality data licensed to hotel | becomes valuable at scale, with no |
|   | chains and destination management | individual host or tourist data exposed. |
|   | companies. |   |

Sequencing: Phase 1 prioritizes free onboarding and commission-only revenue to build supply density. Phase 2 introduces host Pro subscriptions once hosts see measurable booking volume. Phase 3 pursues government dashboard licensing once the platform has enough state-level data to be genuinely useful for policy tracking.


## 4. How We Compare to the Market

Bhraman is not positioned against any single competitor — it sits in the white space between three categories that each solve only part of the problem: large OTAs, accommodation marketplaces, and generic AI trip planners.

| Capability | MakeMyTrip / | OYO / Airbnb | Generic AI trip | Bhraman |
| --- | --- | --- | --- | --- |
|   | Yatra (OTA) | (accommodation) | planners |   |
| Lists unorganized |   |   |   |   |
| supply (homestays, | No | Limited | No | Yes — core focus |
| local guides, artisans) |   |   |   |   |
| Onboarding method | Manual, | App-based, |   | WhatsApp |
| for non-tech-literate | sales-heavy | English-first | N/A | voice/text in |
| operators |   |   |   | regional languages |
| Persistent AI agent |   |   | No — resets each | Yes — |
| with memory across | No | No | chat session | accumulates listing |
| sessions |   |   |   | & trip history |
| End-to-end booking | Yes | Yes | No | Yes |
| (not just suggestions) |   |   |   |   |
| Real-time safety / | No | No | No | Yes |
| scam advisories |   |   |   |   |
| Adaptive mid-trip | No | No | Only if manually | Yes — automatic |
| re-planning |   |   | re-prompted |   |
| Government / |   |   |   | Yes — unique to |
| policy-level analytics | No | No | No | Bhraman |
| dashboard |   |   |   |   |
| Focus on rural income | No | No | No | Yes |
| & scheme alignment |   |   |   |   |

## 4.1 The honest positioning statement

We do not compete with MakeMyTrip or OYO on their core business — organized hotel and flight booking. We compete for the supply and experiences they structurally cannot onboard profitably, and for the policy-visibility layer no consumer travel app has ever built. This makes Bhraman complementary to, not a direct substitute for, the existing OTA ecosystem — which also makes future integration or partnership plausible rather than adversarial.

## 4.2 Government scheme alignment

- Directly supports Swadesh Darshan 2.0's goal of spreading tourism beyond the same well-known destinations, by making offbeat, verified experiences discoverable.

- Extends the reach of MUDRA loan-backed homestay expansion by giving newly-funded homestays a route to actual bookings, not just physical readiness.

- Provides the kind of state-wise, scheme-linked visibility that frameworks like Ladakh's Holistic Homestay Support Framework are currently trying to build manually.


Bhraman — Problem Statement 26204, Smart India Hackathon (AICTE)
