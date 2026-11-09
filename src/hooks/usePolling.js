import { useCallback, useEffect, useRef, useState } from "react";

/**
 * usePolling — live-update hook (spec section 4 fallback strategy).
 * Polls an async fetcher on an interval, pauses while the tab is hidden,
 * and exposes { data, error, loading, refresh, lastUpdated }.
 *
 * The same mechanism can later wrap WebSockets/SSE without touching the
 * pages — swap the transport, keep the interface.
 */
export default function usePolling(fetcher, intervalMs = 15000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      // Keep prior data on transient failures (e.g., laptop wake).
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timer;

    const tick = () => {
      if (document.visibilityState === "visible") {
        refresh(true);
      }
    };

    refresh();
    timer = setInterval(tick, intervalMs);

    // Refresh immediately when the tab regains focus.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);

  return { data, error, loading, refresh, lastUpdated };
}
