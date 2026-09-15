import axios from "axios";

// docs/TRD.md §4 — JWT for the 3 fixed demo role accounts
// (tourist_demo / host_demo / gov_demo, password == username).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
});

const TOKEN_KEY = "atithya_access_token";
const USER_KEY = "atithya_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null");
  } catch {
    return null; // corrupted entry — treat as signed out rather than crashing
  }
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signIn(username, password) {
  const { data } = await api.post("/auth/token", { username, password });
  localStorage.setItem(TOKEN_KEY, data.data.access);
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  return data.data.user;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Every endpoint returns { data, meta? } / { error } (docs/TRD.md §4) — unwrap
// `data` once here so no component has to know about the envelope.
const unwrap = (response) => response.data.data;

/** Turns an axios failure into the message the API actually sent. */
export function apiError(error) {
  return error?.response?.data?.error?.message ?? error?.message ?? "Something went wrong.";
}

export const endpoints = {
  listings: (params) => api.get("/listings", { params }).then(unwrap),
  listing: (id) => api.get(`/listings/${id}`).then(unwrap),
  knownSites: () => api.get("/known-sites").then(unwrap),
  advisories: (region) => api.get("/advisories", { params: region ? { region } : {} }).then(unwrap),

  trips: () => api.get("/trips").then(unwrap),
  trip: (id) => api.get(`/trips/${id}`).then(unwrap),
  createTrip: (body) => api.post("/trips", body).then(unwrap),
  updateTrip: (id, body) => api.patch(`/trips/${id}`, body).then(unwrap),
  bookTrip: (id) => api.post(`/trips/${id}/book`).then(unwrap),
  replanTrip: (id, disruption) => api.post(`/trips/${id}/replan`, { disruption }).then(unwrap),

  hostDashboard: (id) => api.get(`/hosts/${id}/dashboard`).then(unwrap),
  pricingSuggestions: (id) => api.get(`/hosts/${id}/pricing-suggestions`).then(unwrap),
  govHeatmap: () => api.get("/gov/heatmap").then(unwrap),
  govSchemeMetrics: () => api.get("/gov/scheme-metrics").then(unwrap),
};
