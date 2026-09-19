// components/useSimulatedLoad.ts
"use client";

import { useEffect, useState } from "react";

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