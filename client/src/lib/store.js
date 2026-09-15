/** The whole application state, in the browser.
 *
 *  No server, no API client, no query cache — one plain object in
 *  localStorage with a subscribe/notify pair on top, read through
 *  `useStore()`. Everything that would normally be a POST is a function in
 *  the ACTIONS block at the bottom, and every one of them is synchronous
 *  except where a deliberate delay simulates the agent thinking.
 */

import { useSyncExternalStore } from "react";

import { LISTINGS } from "../data/catalog";

const KEY = "atithya_state_v1";

const DEFAULT_SETTINGS = {
  /* What the agent may commit to without asking — the reference's "Limits". */
  agentBooks: true,
  autoApprove: 2000,
  dailyCap: 25_000,
  hardCap: 100_000,
  askNewHost: true,
  askNonRefundable: true,
  trustedHosts: [],
};

const EMPTY = {
  session: null,
  trips: [],
  activity: [],
  settings: DEFAULT_SETTINGS,
  /* Host-side edits live here so the catalogue stays immutable. */
  listingOverrides: {},
  spentToday: 0,
};

/* ── Persistence ───────────────────────────────────────────────────────── */

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    // Merge over EMPTY so a state written by an older build still boots.
    return { ...EMPTY, ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) } };
  } catch {
    return EMPTY; // corrupted entry — start clean rather than crash on boot
  }
}

let state = read();
const listeners = new Set();

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota. The session still works, it just won't survive a
    // reload — not worth interrupting the user over.
  }
  for (const listener of listeners) listener();
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const snapshot = () => state;

/** Read the store. Pass a selector to subscribe to one slice. */
export function useStore(select = (value) => value) {
  return useSyncExternalStore(
    subscribe,
    () => select(snapshot()),
    () => select(EMPTY),
  );
}

export const getState = () => state;

/* ── Activity log ──────────────────────────────────────────────────────── */

const now = () => new Date().toISOString();

function log(entry) {
  return {
    id: `e-${Math.random().toString(36).slice(2, 9)}`,
    at: now(),
    ...entry,
  };
}

/* ── Actions ───────────────────────────────────────────────────────────── */

export const actions = {
  /* Session -------------------------------------------------------------- */

  signIn({ name, email, role }) {
    commit({
      ...state,
      session: { name: name?.trim() || "Traveller", email: email?.trim() || "", role, since: now() },
      activity: [log({ kind: "session", title: `Signed in as ${role}`, detail: name }), ...state.activity],
    });
  },

  switchRole(role) {
    if (!state.session) return;
    commit({ ...state, session: { ...state.session, role } });
  },

  updateProfile(patch) {
    if (!state.session) return;
    commit({ ...state, session: { ...state.session, ...patch } });
  },

  signOut() {
    commit({ ...EMPTY });
  },

  /* Trips ---------------------------------------------------------------- */

  addTrip(trip) {
    commit({
      ...state,
      trips: [trip, ...state.trips],
      activity: [
        log({ kind: "trip", title: "Trip started", detail: `${trip.days} days in ${trip.title}`, tripId: trip.id }),
        ...state.activity,
      ],
    });
    return trip;
  },

  updateTrip(id, patch) {
    commit({
      ...state,
      trips: state.trips.map((trip) => (trip.id === id ? { ...trip, ...patch } : trip)),
    });
  },

  /** Puts the trip in front of the traveller for sign-off. Anything at or
   *  under the auto-approve limit skips this and books itself. */
  requestApproval(id) {
    const trip = state.trips.find((entry) => entry.id === id);
    if (!trip) return;

    if (trip.estimated_cost <= state.settings.autoApprove) {
      actions.confirmTrip(id, { auto: true });
      return;
    }

    commit({
      ...state,
      trips: state.trips.map((entry) => (entry.id === id ? { ...entry, status: "awaiting_approval" } : entry)),
      activity: [
        log({ kind: "approval", title: "Approval requested", detail: trip.title, tripId: id }),
        ...state.activity,
      ],
    });
  },

  confirmTrip(id, { auto = false } = {}) {
    const trip = state.trips.find((entry) => entry.id === id);
    if (!trip) return;

    const reference = `ATY-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    commit({
      ...state,
      spentToday: state.spentToday + trip.estimated_cost,
      trips: state.trips.map((entry) =>
        entry.id === id
          ? { ...entry, status: "booked", booked_at: now(), reference, auto_approved: auto }
          : entry,
      ),
      activity: [
        log({ kind: "booked", title: "Trip booked", detail: `${trip.title} · ${reference}`, amount: trip.estimated_cost, tripId: id }),
        log({ kind: auto ? "auto" : "approved", title: auto ? "Auto-approved within limits" : "You approved the booking", detail: trip.title, amount: trip.estimated_cost, tripId: id }),
        ...state.activity,
      ],
    });
    return reference;
  },

  declineTrip(id) {
    const trip = state.trips.find((entry) => entry.id === id);
    commit({
      ...state,
      trips: state.trips.map((entry) => (entry.id === id ? { ...entry, status: "declined" } : entry)),
      activity: [log({ kind: "declined", title: "You declined the booking", detail: trip?.title, tripId: id }), ...state.activity],
    });
  },

  replaceTrip(id, trip) {
    commit({
      ...state,
      trips: state.trips.map((entry) => (entry.id === id ? trip : entry)),
      activity: [log({ kind: "replan", title: "Itinerary re-planned", detail: trip.title, tripId: id }), ...state.activity],
    });
  },

  removeTrip(id) {
    commit({ ...state, trips: state.trips.filter((entry) => entry.id !== id) });
  },

  clearFinished() {
    commit({
      ...state,
      trips: state.trips.filter((trip) => trip.status !== "booked" && trip.status !== "declined"),
    });
  },

  clearActivity() {
    commit({ ...state, activity: [] });
  },

  /* Limits --------------------------------------------------------------- */

  setSetting(key, value) {
    commit({ ...state, settings: { ...state.settings, [key]: value } });
  },

  trustHost(hostId) {
    if (state.settings.trustedHosts.includes(hostId)) return;
    commit({ ...state, settings: { ...state.settings, trustedHosts: [...state.settings.trustedHosts, hostId] } });
  },

  untrustHost(hostId) {
    commit({
      ...state,
      settings: { ...state.settings, trustedHosts: state.settings.trustedHosts.filter((id) => id !== hostId) },
    });
  },

  resetLimits() {
    commit({ ...state, settings: DEFAULT_SETTINGS });
  },

  /* Host side ------------------------------------------------------------ */

  /** Host edits are stored as a patch per listing id, so the seeded
   *  catalogue stays the single source of truth for everything untouched. */
  patchListing(id, patch) {
    commit({
      ...state,
      listingOverrides: { ...state.listingOverrides, [id]: { ...(state.listingOverrides[id] ?? {}), ...patch } },
      activity: [log({ kind: "listing", title: "Listing updated", detail: id }), ...state.activity],
    });
  },

  publishListing(id) {
    actions.patchListing(id, { status: "live", verification_notes: null });
  },
};

/* ── Derived reads ─────────────────────────────────────────────────────── */

/** The catalogue with any host edits applied. Every screen reads listings
 *  through this, never from the raw import.
 *
 *  Memoised on the overrides object, and that is not an optimisation: this
 *  feeds `useStore` selectors, whose snapshot must be referentially stable
 *  between commits or `useSyncExternalStore` re-renders forever. A fresh
 *  array on every read blanks the screen. For the same reason, callers must
 *  filter this list during render rather than inside the selector. */
let mergedFor = null;
let merged = null;

export function listingsWithEdits(current = state) {
  if (mergedFor === current.listingOverrides && merged) return merged;
  mergedFor = current.listingOverrides;
  merged = LISTINGS.map((listing) => ({ ...listing, ...(current.listingOverrides[listing.id] ?? {}) }));
  return merged;
}

export function listingWithEdits(id, current = state) {
  return listingsWithEdits(current).find((listing) => listing.id === id) ?? null;
}

export const tripById = (id, current = state) => current.trips.find((trip) => trip.id === id) ?? null;

export const activeTrips = (current = state) =>
  current.trips.filter((trip) => trip.status === "draft" || trip.status === "awaiting_approval" || trip.status === "booked");

export const finishedTrips = (current = state) =>
  current.trips.filter((trip) => trip.status === "declined" || trip.status === "completed");

export const pendingApprovals = (current = state) =>
  current.trips.filter((trip) => trip.status === "awaiting_approval");
