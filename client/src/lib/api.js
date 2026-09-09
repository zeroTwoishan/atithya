import axios from "axios";

// docs/TRD.md §4 — JWT for the 3 fixed demo role accounts (tourist_demo/host_demo/gov_demo).
// TODO (hackathon day): real login screen; for now the token is set manually
// (e.g. from a management command / DRF browsable API) into localStorage.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bhraman_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
