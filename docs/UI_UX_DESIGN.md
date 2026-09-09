# Bhraman — UI/UX Design

**Companion to [[PRD]] and [[TRD]]** · Mockups generated via **Stitch MCP** (project `Bhraman - SIH 26204`, id `12922044088822496175`) · Rendered HTML saved to `docs/screens/{tourist,host,government}/`.

Design references consulted: `75-company-designs` (Airbnb — warm consumer marketplace; PostHog — technical data-dense console), `design-house-rules`, `ui-ux-pro-max`.

---

## 1. Two Deliberate Archetypes, Not One Skin Stretched Three Ways

Per `design-house-rules` Step 0, the three dashboards don't share a single visual system, because they don't share an audience, a device, or a mood:

- **Tourist + Host → "Warm Marketplace" archetype.** *Physical scene:* Meera checks bookings on a cracked-screen Android between guests; Aditya scrolls one-handed on a train platform deciding where to stay tonight. Both need warmth, trust signals (verified badges, ratings), and forgiving touch targets — closer to Airbnb's photography-led marketplace than to enterprise SaaS.
- **Government → "Precision Console" archetype.** *Physical scene:* a tourism officer reviews scheme outcomes on a desktop monitor in an office, comparing regions and defending budget numbers to a superior. This needs density, legibility of numbers, and zero decorative noise — closer to PostHog/Linear's technical-console family than to a consumer app.

Splitting the system this way also does real product work: switching from warm terracotta to slate-and-teal is itself a signal to anyone screen-sharing which room of the platform they're in.

## 2. Design Tokens — Warm Marketplace (Tourist + Host)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F5E6D8` (terracotta-tinted ivory — an intentional warm surface, not the reflex sand/cream default) | Page background |
| `ink` | `#2A211C` (warm near-black brown) | Headlines, body text — never pure black |
| `primary` (rust/terracotta) | `#BF4E30` | Primary CTA only — send button, "Reserve", "New listing". Reserved, not diluted across secondary UI |
| `primary-active` | `#A33F26` | Press state |
| `secondary` (forest green) | `#2F4B3C` | "Verified" badges, safety confirmations, paid/live status |
| `warning` (amber) | `#C97D2E` | "Needs review" status, pricing-copilot flags |
| `surface-card` | `#FFFFFF` | Cards, always with the system's one soft layered shadow — never flat |
| `hairline` | `#E3CFBC` | Card borders, dividers |
| Display type | **Fraunces** (serif, weight 400–600, tight negative tracking `-0.02em` on headlines) | Page titles, section heads — the one place the system trusts type for warmth |
| UI/body type | **Inter** | Body copy, buttons, form fields, chat bubbles |
| Radius | card `16px` · button `10px` · pill `full` (chips, filter tags) | Soft, human, no hard corners |
| Shadow | single tier: `0 1px 2px rgba(42,33,28,.04), 0 4px 12px rgba(42,33,28,.08)` | Cards, floating chat input, dropdowns — no default browser shadow |

## 3. Design Tokens — Precision Console (Government)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#121821` (deep slate navy) | Page background |
| `surface-panel` | `#1B232D` | Panels, cards — **1px hairline border, zero drop shadow** |
| `hairline` | `rgba(255,255,255,0.08)` | The system's only depth cue |
| `text-primary` | `#E8EAED` | Headlines, primary labels |
| `text-muted` | `#8B93A1` | Secondary labels, axis text |
| `primary` (teal) | `#2F8F86` | Primary actions, chart lines, active nav |
| `status-positive` | `#34C77B` (emerald) | Underused-but-growing, scheme growth |
| `status-caution` | `#E8A33D` (amber) | Moderate demand |
| `status-negative` | `#E5484D` (red) | Overcrowded, safety incidents |
| UI type | **IBM Plex Sans** | Nav, labels, body |
| Data type | **IBM Plex Mono**, `font-variant-numeric: tabular-nums` | Every stat number, chart axis, table figure — non-negotiable for a dashboard defending budget numbers |
| Radius | `6–8px` throughout | Deliberately less soft than the marketplace side — this is a work tool, not a consumer app |
| Shadow | none, anywhere | Depth comes only from the hairline border + surface contrast (Precision Void, per `design-house-rules`) |

## 4. Screen Inventory

All 12 screens live in Stitch project `12922044088822496175`. Static HTML mockups are saved locally so the team can open them directly in a browser without a Stitch account.

### Tourist Dashboard (Warm Marketplace — mobile AND desktop, responsive web, not mobile-only)
| # | Screen | File | What it proves |
|---|---|---|---|
| 1 | Trip Planner (chat) — mobile | `docs/screens/tourist/01-trip-planner-chat.html` | The Planning & Booking Agent conversation — budget/interest input → itinerary preview card blending a known site with a verified listing ([[TRD]] §3.2) |
| 2 | Itinerary Timeline — mobile | `docs/screens/tourist/02-itinerary-timeline.html` | Editable day-by-day stepper, sticky budget tracker, "Safety Pulse" banner — PRD §6 Tourist Dashboard features in one screen |
| 3 | Discover Nearby — mobile | `docs/screens/tourist/03-discover-nearby.html` | Photo-first proactive suggestion feed with verified-host badges |
| 4 | Trip Planner (chat) — desktop | `docs/screens/tourist/04-trip-planner-chat-desktop.html` | Same agent conversation, two-pane layout: chat on the left, a sticky live-updating itinerary rail on the right — the desktop-native pattern, not a stretched phone screen |
| 5 | Itinerary Timeline — desktop | `docs/screens/tourist/05-itinerary-timeline-desktop.html` | Left column stepper + sticky right rail (safety pulse, route map, budget) — Airbnb-listing-style 2-column layout |
| 6 | Discover Nearby — desktop | `docs/screens/tourist/06-discover-nearby-desktop.html` | 3-column search-results grid instead of a single mobile feed column |

Bhraman's actual product is a **responsive web app**, not separate mobile/desktop builds — these 6 screens are the two ends of one fluid layout (per `ui-ux-pro-max` priority-5 responsive rules: same components, same breakpoints project described in [[TRD]], not a different app). Build the CSS once with these two as the reference points for the layout's collapse behavior, same as the breakpoint tables in the Airbnb/PostHog references consulted for this system.

### Host / Operator Dashboard (desktop — Warm Marketplace, denser)
| # | Screen | File | What it proves |
|---|---|---|---|
| 7 | Listings | `docs/screens/host/01-listings.html` | Listing management grid with Live/Needs-review/Pending status — surfaces Verification Agent output directly ([[TRD]] §3.3) |
| 8 | Calendar & Earnings | `docs/screens/host/02-calendar-earnings.html` | Booking calendar + earnings figure (tabular nums) + AI Pricing Copilot suggestion card |
| 9 | Listing Detail & Verification | `docs/screens/host/03-listing-detail-verification.html` | A single flagged listing showing the *specific* reason it was flagged — not a black-box "rejected" |

### Government / Tourism Board Dashboard (desktop — Precision Console)
| # | Screen | File | What it proves |
|---|---|---|---|
| 10 | Regional Heatmap | `docs/screens/government/01-regional-heatmap.html` | Overcrowded vs. underused destination heatmap + top-line stat tiles. **This exact stylized zone-diagram look is the shipped implementation, not a placeholder for a real map** — see [[TRD]] §4 and [[BUILD_PLAN]] §2 for why a Leaflet/Mapbox integration is explicitly out of scope |
| 11 | Scheme Metrics | `docs/screens/government/02-scheme-metrics.html` | Rural income vs. MUDRA-homestay growth, state-wise comparison, domestic/foreign arrival split — the B2G monetization surface from [[PRD]] §Revenue Model |
| 12 | Safety Advisories | `docs/screens/government/03-safety-advisories.html` | Aggregated incident-by-region list + advisory table |

## 4b. From Stitch Mockup to React Component

These 12 files are **static HTML references for visual/content direction, not the shipped frontend.** Per [[TRD]] §2, the real build is React 19 + Vite + Tailwind v4. When translating each screen to a component:

- **Icons swap from Material Symbols to `lucide-react`.** The mockups use Google Fonts' Material Symbols Outlined (a webfont-ligature icon approach — visible as literal text like `arrow_back` in any renderer that doesn't load that specific font, which is a real fragility, not just a headless-sandbox quirk). React components use `lucide-react`'s actual SVG components instead — pick the closest-matching icon per name (`arrow_back` → `ArrowLeft`, `verified_user` → `ShieldCheck`, `calendar_month` → `Calendar`, etc.). This removes the failure mode entirely rather than just working around it.
- **Design tokens (§2/§3 above) become Tailwind v4 `@theme` variables**, one `@theme` block per archetype — e.g. `--color-canvas`, `--color-ink`, `--color-primary` for warm-marketplace pages, a second set for the government precision-console pages, per the team's CSS-first Tailwind v4 convention (not `tailwind.config.js`).
- **Fonts (Fraunces/Inter, IBM Plex Sans/Mono) load the same way** — Google Fonts `<link>` tags or `@font-face`, no change needed there; only the icon approach was the fragile part.
- **Component boundaries:** each screen decomposes into the obvious repeated pieces — `ListingCard`, `ItineraryStopCard`, `StatTile`, `SeverityBadge`, `ChatBubble` — shared between the mobile and desktop variants of the same screen (§ above) rather than duplicated, since they're one responsive layout, not two builds.

## 5. Interaction & Accessibility Notes (apply across all 9 screens)

- All primary touch targets ≥44×44px (tourist mobile screens are the ones judges will actually tap on stage).
- Every status badge (Verified / Live / Needs review / severity dot) carries a text label, not color alone — color-blind-safe per `ui-ux-pro-max` priority-1 accessibility rule.
- Chat input and itinerary edit controls need a visible focus ring — demo will very likely include keyboard navigation if a judge tries it.
- Government dashboard numbers are tabular-nums everywhere a figure could change (per `design-house-rules`) — a heatmap number reflowing mid-glance undermines the "trustworthy policy tool" pitch.
- No Lorem Ipsum, no "Acme"-style placeholder names anywhere — every mockup uses real Himachal Pradesh place/listing names so judges see the actual pitch, not a template.

## 6. What Wasn't Built (by design, for 36h)

- No dark-mode variant for the tourist/host apps (light-only, matches Airbnb's own public-web behavior — one less surface to get right under time pressure).
- No settings/profile/auth screens — out of scope per [[TRD]] §7.
- Government dashboard has no drill-down-per-district view — state-level only, sufficient to make the B2G pitch in a demo.
