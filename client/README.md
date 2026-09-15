# Atithya — frontend

The whole product, running in the browser. There is no API: the catalogue, the
planning agent and every booking are local modules, and state lives in
`localStorage`. `npm run dev` is the only thing you need to see all three
dashboards.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## The design language

Taken from the reference recording in `.agent/`:

- **Type** — one high-contrast serif (Instrument Serif) carries every heading,
  figure and input; one neutral sans (Inter) carries labels and body, small and
  letterspaced. Numbers use `.figure`, which turns on tabular lining figures so
  columns line up.
- **Surface** — soft iridescent light mode, near-black aurora dark mode. Same
  gradient geometry in both: the same room with the lights off.
- **Controls** — everything is a pill. One filled action per screen.
- **Navigation** — four circles floating over the content on phones, a labelled
  rail from `lg` up. Defined once in `src/lib/nav.js`.

Tokens and the component classes (`.card`, `.pill`, `.field`, `.toggle`,
`.range`, `.aurora`) are all in `src/index.css`.

## Layout

```
src/
  data/          the "database" — catalog.js (listings, sites, advisories,
                 districts) and host.js (seeded bookings, payouts, pricing)
  lib/
    store.js     all application state, localStorage-backed, read via useStore()
    planner.js   the planning agent: a sentence in, an itinerary + the loop out
    nav.js       the four dock destinations per role
    format.js    ₹ formatting, dates, greetings
  components/
    ui.jsx       every shared primitive (Card, Stat, Sheet, Toggle, Slider, …)
    Shell.jsx    dock + rail frame
    ActionLoop.jsx  the agent's reasoning as a vertical timeline
  pages/         Landing, Start, About, Settings, Limits + tourist/ host/ gov/
```

## Two things to know before editing

**Store selectors must return stable references.** `useStore` is
`useSyncExternalStore`, so a selector that builds a new array or object on every
call re-renders forever and blanks the screen. `listingsWithEdits` is memoised on
the overrides object for exactly this reason — filter its result during render,
never inside the selector.

**The trip loop is timed, and stops itself.** `TripDetail` walks
`trip.loop` on an interval and halts at `Request approval`. Nothing advances past
that point until the traveller completes the press-and-hold. The hold button
carries `touch-none`, without which the browser claims the long press as a scroll
gesture and fires `pointercancel` partway through.

## Wiring a real API later

Swap the data source, not the screens. `data/catalog.js` and the reads in
`lib/store.js` are the only places that know where a listing comes from; the
shapes deliberately mirror `docs/BACKEND_SCHEMA.md`.
