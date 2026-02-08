// src/onboard/hooks/useOnboardDraft.ts

import { useEffect, useMemo, useRef, useState } from "react";
import type { OnboardingData } from "../schema";
import { DEFAULT_ONBOARDING_DATA } from "../schema";
import { createDebouncedDraftSaver, loadOnboardDraft } from "../storage";

export function useOnboardDraft() {
  const [data, setData] = useState<OnboardingData>(() => {
    if (typeof window === "undefined") return DEFAULT_ONBOARDING_DATA;
    return loadOnboardDraft();
  });

  const [savedPulse, setSavedPulse] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);

  const saverRef = useRef<ReturnType<typeof createDebouncedDraftSaver> | null>(null);

  useEffect(() => {
    saverRef.current = createDebouncedDraftSaver(400, () => {
      setSavedPulse(true);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => setSavedPulse(false), 1500);
    });
    return () => {
      saverRef.current?.cancel();
      saverRef.current = null;
    };
  }, []);

  useEffect(() => {
    saverRef.current?.schedule(data);
  }, [data]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const patch = (p: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...p }));

  const api = useMemo(
    () => ({
      data,
      setData,
      patch,
      savedPulse,
      flush: () => saverRef.current?.flush(data),
    }),
    [data, savedPulse]
  );

  return api;
}


