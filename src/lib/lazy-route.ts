import { lazy, useSyncExternalStore, type ComponentType } from "react";

/*
 * Tracks route chunks that are currently being downloaded so the layout can
 * show a thin progress bar while the router keeps the previous screen on
 * screen (react-router wraps navigations in startTransition, so the content
 * Suspense fallback is not shown for already-visible content).
 */
let pending = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => pending > 0;

/** True while at least one lazy route chunk is loading. */
export function useRouteChunkLoading(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** `React.lazy` that reports its loading state to `useRouteChunkLoading`. */
export function lazyRoute<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() => {
    // React calls this during render — defer the store update.
    queueMicrotask(() => {
      pending += 1;
      emit();
    });
    return factory().finally(() => {
      queueMicrotask(() => {
        pending = Math.max(0, pending - 1);
        emit();
      });
    });
  });
}
