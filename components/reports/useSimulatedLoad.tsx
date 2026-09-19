// components/useSimulatedLoad.ts
"use client";

import { useEffect, useState } from "react";

/**
 * UI-only stand-in for a data fetch. Flips `loading` true for `ms`
 * whenever a value in `deps` changes, so the skeleton loader has
 * something real to respond to (e.g. changing Period, Apply, Search).
 */
export function useSimulatedLoad(deps: unknown[] = [], ms = 700) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return loading;
}