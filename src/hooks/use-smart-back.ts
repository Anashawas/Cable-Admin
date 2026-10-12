import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * True when there is an in-app history entry behind the current one, i.e. the
 * user reached this screen by navigating inside the admin (not by opening the
 * URL directly / refreshing / a new tab).
 */
export function hasInAppHistory(locationKey: string): boolean {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  if (typeof idx === "number") return idx > 0;
  return locationKey !== "default";
}

/**
 * Returns a `goBack()` that behaves like the browser back button when the user
 * came from another admin screen (so the previous screen keeps its filters,
 * page and scroll), and falls back to `fallbackPath` otherwise.
 */
export function useSmartBack(fallbackPath: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (hasInAppHistory(location.key)) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }, [navigate, location.key, fallbackPath]);
}
