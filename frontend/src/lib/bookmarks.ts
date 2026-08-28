// Reading list kept in the visitor's own browser. There is no accounts system,
// so a bookmark is deliberately local: no request leaves the page.
import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'roadeep:bookmarks';

const listeners = new Set<() => void>();

/** Cached snapshot: useSyncExternalStore needs a stable value between changes. */
let snapshot: string = '[]';

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    // Private mode or blocked storage: bookmarks simply do not persist.
    return '[]';
  }
}

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string {
  const raw = readRaw();
  if (raw !== snapshot) snapshot = raw;
  return snapshot;
}

function getServerSnapshot(): string {
  return '[]';
}

function write(slugs: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Ignore: the toggle still updates this session through the listeners below.
  }
  snapshot = JSON.stringify(slugs);
  for (const listener of listeners) listener();
}

/** `[isSaved, toggle]` for one post, shared across every button on the page. */
export function useBookmark(slug: string): [boolean, () => void] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const saved = parse(raw).includes(slug);

  const toggle = useCallback(() => {
    const current = parse(readRaw());
    write(current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
  }, [slug]);

  return [saved, toggle];
}
