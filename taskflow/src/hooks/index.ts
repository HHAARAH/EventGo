import { useState, useEffect } from 'react';
import { ApiError } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], skip = false) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: !skip,
    error: null,
  });

  useEffect(() => {
    if (skip) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            useAuthStore.getState().logout();
          }
          setState({ data: null, isLoading: false, error: err instanceof Error ? err.message : 'Failed to load' });
        }
      });

    return () => { cancelled = true; };
  }, [...deps, skip]);

  return state;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
