import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const PREFIX = "cable-admin:list-state:";

/**
 * Drop-in replacement for `useState` for list-screen state (filters, search,
 * page, view mode…). The value is mirrored to sessionStorage keyed by the
 * current route + `name`, and restored when the screen is reached by a POP
 * navigation (browser back/forward, our smart back button, or a reload).
 * A fresh PUSH (e.g. clicking the sidebar link) starts from `initial`.
 *
 * Values go through JSON, so Date values come back as ISO strings — pass a
 * `revive` function for those.
 */
export function useListState<T>(
  name: string,
  initial: T | (() => T),
  revive?: (raw: unknown) => T
): [T, Dispatch<SetStateAction<T>>] {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const storageKey = `${PREFIX}${pathname}:${name}`;

  const [value, setValue] = useState<T>(() => {
    if (navigationType === "POP") {
      try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (raw != null) {
          const parsed = JSON.parse(raw) as unknown;
          return revive ? revive(parsed) : (parsed as T);
        }
      } catch {
        /* storage unavailable / corrupt — fall through to initial */
      }
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      if (value === undefined) window.sessionStorage.removeItem(storageKey);
      else window.sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [storageKey, value]);

  return [value, setValue];
}

/** Reviver for `Date | null` values stored with `useListState`. */
export const reviveDateOrNull = (raw: unknown): Date | null => {
  if (raw == null) return null;
  const d = new Date(raw as string);
  return Number.isNaN(d.getTime()) ? null : d;
};
