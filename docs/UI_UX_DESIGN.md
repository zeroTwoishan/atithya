# Atithya — UI/UX Design

**Companion to [[PRD]] and [[TRD]]** · Screen content reference: the Stitch mockups in `docs/screens/{tourist,host,government}/` · **Visual system reference: the prototype recording in `.agent/`** — that build, not the Stitch mockups, defines how Atithya looks.

---

## 1. One System, Two Temperatures

The earlier plan split the product into two visual archetypes (a warm marketplace for tourist/host, a precision console for government). That is superseded: the reference build in `.agent/` is a single system that works for all three audiences, and three dashboards that look like three products is a liability in a 13-minute demo where judges are tracking one story across all of them.

What separates the three surfaces now is **content density and navigation**, not palette. The tourist gets prose and one action per screen; the host gets tiles and a table; the government gets aggregates and bars. Same tokens throughout.

The system's two temperatures are **light** (default) and **dark**, not two archetypes:

- **Light** — an iridescent wash (rose, lavender, mint, butter) over a pale ground, with white translucent cards. Reads as calm and premium in a bright demo room, and photographs well on a projector.
- **Dark** — near-black with the same gradient geometry at low opacity. Follows the OS until the user picks; the choice then sticks (`client/src/lib/useTheme.js`).

Both are defined once as CSS custom properties in `client/src/index.css`; a component never hard-codes a colour.

## 2. Design Tokens

Canonical source: `client/src/index.css`. Everything below mirrors that file — if the two disagree, the stylesheet is right.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-canvas` | `#eceaf2` | `#08080c` | Page ground under the aurora |
| `--color-surface` | `rgba(255,255,255,0.62)` | `rgba(255,255,255,0.055)` | Cards, pills, inputs |
| `--color-surface-strong` | `rgba(255,255,255,0.86)` | `rgba(255,255,255,0.09)` | Hover, active nav, raised rows |
| `--color-hairline` | `rgba(24,20,34,0.09)` | `rgba(255,255,255,0.10)` | Every border and rule — 1px, never heavier |
| `--color-ink` | `#1b1725` | `#f4f2f7` | Primary text, filled buttons |
| `--color-ink-soft` | 62% ink | 62% ink | Body copy, secondary labels |
| `--color-ink-faint` | 42% ink | 38% ink | Eyebrows, captions, metadata |
| `--color-primary` | `#c2542c` | `#e8845c` | Brand terracotta — accents and focus rings only |
| `--color-positive` | `#2f7d5f` | `#63c79b` | Verified, booked, safe, growth |
| `--color-caution` | `#b07d2b` | `#e0b055` | Needs review, advisories |
| `--color-negative` | `#b0342f` | `#e2726d` | Declines, warnings, cancellations |

**Type.** Three faces, one job each:

| Face | Role |
|---|---|
| **Instrument Serif** (`--font-display`) | Every heading, every figure, and the chat/search inputs. This is the product's voice. |
| **Newsreader** (`--font-reading`) | The agent's prose in chat — a reading serif at 16.5px/1.6. |
| **Inter** (`--font-sans`) | Labels, captions, buttons, table data. Never a heading. |

*Unverified:* the faces above are the closest Google Fonts match to the reference recording — a video can't be inspected for `font-family`. If the reference build's own stylesheet is available, take the names from there and swap the `@import` in `index.css`; nothing else changes.

**Shape.** Cards `20px`, nested cards `14px`, every control a full pill (`9999px`). One filled button per screen (`.pill-primary`, ink-on-canvas); everything else is a hairline pill.

## 3. Layout & Navigation

Responsive is a requirement, not a stretch — judges will see this on a laptop, the team will demo parts of it on a phone.

- **Content column** caps at `1280px`; inner reading columns cap at `720px` (chat, forms) or `1000px` (grids, dashboards).
- **Navigation changes shape, not content.** Below `lg`: a floating dock of circular buttons, thumb-reachable, over the content. From `lg`: a 240px labelled rail beside the content. One `tabs` array feeds both (`client/src/components/Shell.jsx`), so a route cannot exist in one and be missing from the other.
- **Grids** step 1 → 2 → 3 columns at `sm` and `xl`. The itinerary and trip screens go two-column at `lg` with the budget/actions panel sticky.
- Mobile keeps `pb-28` under scrollable content so the dock never covers the last row.

## 4. Screen Inventory

All 12 screens live in Stitch project `12922044088822496175`. Static HTML mockups are saved locally so the team can open them directly in a browser without a Stitch account.

### Tourist Dashboard (mobile and desktop, responsive)
| # | Screen | File | What it proves |
|---|---|---|---|
| 1 | Trip Planner (chat) — mobile | `docs/screens/tourist/01-trip-planner-chat.html` | The Planning & Booking Agent conversation — budget/interest input → itinerary preview card blending a known site with a verified listing ([[TRD]] §3.2) |
| 2 | Itinerary Timeline — mobile | `docs/screens/tourist/02-itinerary-timeline.html` | Editable day-by-day stepper, sticky budget tracker, "Safety Pulse" banner — PRD §6 Tourist Dashboard features in one screen |
| 3 | Discover Nearby — mobile | `docs/screens/tourist/03-discover-nearby.html` | Photo-first proactive suggestion feed with verified-host badges |
| 4 | Trip Planner (chat) — desktop | `docs/screens/tourist/04-trip-planner-chat-desktop.html` | Same agent conversation, two-pane layout: chat on the left, a sticky live-updating itinerary rail on the right — the desktop-native pattern, not a stretched phone screen |
| 5 | Itinerary Timeline — desktop | `docs/screens/tourist/05-itinerary-timeline-desktop.html` | Left column stepper + sticky right rail (safety pulse, route map, budget) — Airbnb-listing-style 2-column layout |
| 6 | Discover Nearby — desktop | `docs/screens/tourist/06-discover-nearby-desktop.html` | 3-column search-results grid instead of a single mobile feed column |

Atithya's actual product is a **responsive web app**, not separate mobile/desktop builds — these 6 screens are the two ends of one fluid layout (per `ui-ux-pro-max` priority-5 responsive rules: same components, same breakpoints project described in [[TRD]], not a different app). Build the CSS once with these two as the reference points for the layout's collapse behavior, same as the breakpoint tables in the Airbnb/PostHog references consulted for this system.

### Host / Operator Dashboard (denser — tiles and tables)
| # | Screen | File | What it proves |
|---|---|---|---|
| 7 | Listings | `docs/screens/host/01-listings.html` | Listing management grid with Live/Needs-review/Pending status — surfaces Verification Agent output directly ([[TRD]] §3.3) |
| 8 | Calendar & Earnings | `docs/screens/host/02-calendar-earnings.html` | Booking calendar + earnings figure (tabular nums) + AI Pricing Copilot suggestion card |
| 9 | Listing Detail & Verification | `docs/screens/host/03-listing-detail-verification.html` | A single flagged listing showing the *specific* reason it was flagged — not a black-box "rejected" |

### Government / Tourism Board Dashboard (aggregates and bars)
| # | Screen | File | What it proves |
|---|---|---|---|
| 10 | Regional Heatmap | `docs/screens/government/01-regional-heatmap.html` | Overcrowded vs. underused destination heatmap + top-line stat tiles. **This exact stylized zone-diagram look is the shipped implementation, not a placeholder for a real map** — see [[TRD]] §4 and [[BUILD_PLAN]] §2 for why a Leaflet/Mapbox integration is explicitly out of scope |
| 11 | Scheme Metrics | `docs/screens/government/02-scheme-metrics.html` | Rural income vs. MUDRA-homestay growth, state-wise comparison, domestic/foreign arrival split — the B2G monetization surface from [[PRD]] §Revenue Model |
| 12 | Safety Advisories | `docs/screens/government/03-safety-advisories.html` | Aggregated incident-by-region list + advisory table |

## 4b. From Stitch Mockup to React Component

These 12 files are **static HTML references for visual/content direction, not the shipped frontend.** Per [[TRD]] §2, the real build is React 19 + Vite + Tailwind v4. When translating each screen to a component:

- **Icons swap from Material Symbols to `@phosphor-icons/react`.** The mockups use Google Fonts' Material Symbols Outlined (a webfont-ligature icon approach — visible as literal text like `arrow_back` in any renderer that doesn't load that specific font, which is a real fragility, not just a headless-sandbox quirk). React components use Phosphor's actual SVG components instead — pick the closest-matching icon per name (`arrow_back` → `ArrowLeft`, `verified_user` → `ShieldCheck`, `calendar_month` → `Calendar`, etc.), generally at `weight="duotone"` or `"regular"` rather than the default thin outline, to read less generic than a stock icon set. This removes the failure mode entirely rather than just working around it.
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
