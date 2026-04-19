// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates
 * after `delayMs` milliseconds of inactivity.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchText, 400);
 *   useEffect(() => { runSearch(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
