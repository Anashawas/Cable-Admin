import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Screens scroll either in the layout's content box or in a screen-level
 * scroller just below it (AppScreenContainer). We remember both, addressed by
 * their child-index path from the content box, so we can find them again.
 */
const MAX_DEPTH = 4;
const RESTORE_TIMEOUT_MS = 2500;

type Entry = { path: number[]; top: number };
/** location.key -> (path string -> entry). In-memory for the tab's lifetime. */
const positions = new Map<string, Map<string, Entry>>();

function pathFrom(container: HTMLElement, el: Element): number[] | null {
  const path: number[] = [];
  let node: Element | null = el;
  while (node && node !== container) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.children, node));
    if (path.length > MAX_DEPTH) return null;
    node = parent;
  }
  return node === container ? path : null;
}

function resolve(container: HTMLElement, path: number[]): HTMLElement | null {
  let node: Element | undefined = container;
  for (const i of path) {
    node = node?.children[i];
    if (!node) return null;
  }
  return (node as HTMLElement) ?? null;
}

function resetScroll(el: Element, depth: number) {
  if (el.scrollTop > 0) el.scrollTop = 0;
  if (depth >= MAX_DEPTH) return;
  for (const child of Array.from(el.children)) resetScroll(child, depth + 1);
}

/**
 * Scroll behaviour for the content area:
 * - PUSH/REPLACE to a new pathname → scroll to top.
 * - POP (back/forward) → restore the offsets saved for that history entry.
 */
export function useScrollManager(containerRef: RefObject<HTMLElement | null>) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const keyRef = useRef(location.key);
  const prevPathRef = useRef<string | null>(null);

  // Save offsets as the user scrolls (capture: scroll events don't bubble).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = (e: Event) => {
      const target = e.target === document ? null : (e.target as Element);
      if (!target) return;
      const path = target === container ? [] : pathFrom(container, target);
      if (!path) return;
      let entries = positions.get(keyRef.current);
      if (!entries) {
        entries = new Map();
        positions.set(keyRef.current, entries);
      }
      entries.set(path.join("."), { path, top: target.scrollTop });
    };
    container.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => container.removeEventListener("scroll", onScroll, { capture: true });
  }, [containerRef]);

  useLayoutEffect(() => {
    keyRef.current = location.key;
    const container = containerRef.current;
    const prevPath = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (!container || prevPath === null) return; // first render: nothing to do

    if (navigationType !== "POP") {
      if (prevPath !== location.pathname) resetScroll(container, 0);
      return;
    }

    const saved = positions.get(location.key);
    if (!saved || saved.size === 0) {
      if (prevPath !== location.pathname) resetScroll(container, 0);
      return;
    }
    // Snapshot: restoring fires scroll events that would overwrite the map.
    const targets = Array.from(saved.values()).map((e) => ({ ...e }));
    let cancelled = false;
    let frame = 0;
    const cancel = () => {
      cancelled = true;
    };
    const start = performance.now();
    const tick = () => {
      if (cancelled) return;
      let done = true;
      for (const t of targets) {
        const el = resolve(container, t.path);
        if (!el) {
          done = false;
          continue;
        }
        if (Math.abs(el.scrollTop - t.top) > 1) {
          el.scrollTop = t.top;
          if (Math.abs(el.scrollTop - t.top) > 1) done = false; // content not tall enough yet
        }
      }
      if (!done && performance.now() - start < RESTORE_TIMEOUT_MS) frame = requestAnimationFrame(tick);
    };
    tick();
    // Stop fighting the user if they start scrolling themselves.
    container.addEventListener("wheel", cancel, { passive: true });
    container.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      container.removeEventListener("wheel", cancel);
      container.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [location.key, location.pathname, navigationType, containerRef]);
}
