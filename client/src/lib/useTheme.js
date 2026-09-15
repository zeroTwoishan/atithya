import { useCallback, useSyncExternalStore } from "react";

/** Light by default; follows the OS until the user picks, then that choice
 *  sticks. The class goes on <html> so the tokens in index.css cascade over
 *  everything, including portalled toasts. */
const KEY = "atithya_theme";
const listeners = new Set();

const stored = () => localStorage.getItem(KEY);
const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

function isDark() {
  const choice = stored();
  return choice ? choice === "dark" : prefersDark();
}

export function applyTheme() {
  document.documentElement.classList.toggle("dark", isDark());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = useCallback(() => {
    localStorage.setItem(KEY, isDark() ? "light" : "dark");
    applyTheme();
    for (const listener of listeners) listener();
  }, []);

  return { dark, toggle };
}
