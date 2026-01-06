import React, { useCallback, useEffect, useMemo, useState } from "react";
import Page2ScenarioSettings from "./pages/Page2ScenarioSettings";
import Page3LeversIntent from "./pages/Page3LeversIntent";
import type { OnboardingData } from "./onboarding.types";
import { DEFAULT_ONBOARDING_DATA } from "./onboarding.types";

// Current real flag (DashboardLayout gating)
const STORAGE_KEY_ENABLED = "STRATFIT_ONBOARDING_ENABLED";
// Back-compat dev flags (do not remove yet)
const STORAGE_KEY_OVERLAY = "STRATFIT_DEV_ONBOARDING_OVERLAY";
const STORAGE_KEY_P2 = "STRATFIT_DEV_ONBOARDING_P2";

function readEnabledFlag(): boolean {
  if (typeof window === "undefined") return false;
  const ls = window.localStorage;
  return (
    ls.getItem(STORAGE_KEY_ENABLED) === "1" ||
    ls.getItem(STORAGE_KEY_OVERLAY) === "1" ||
    ls.getItem(STORAGE_KEY_P2) === "1"
  );
}

export interface OnboardingFlowProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function OnboardingFlow({ isOpen, onClose }: OnboardingFlowProps) {
  const [enabled, setEnabled] = useState<boolean>(() => readEnabledFlag());
  const [step, setStep] = useState<2 | 3>(2);
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);

  const open = isOpen ?? enabled;

  useEffect(() => {
    // Ensure we re-check after hydration in case initial render happens without window access.
    setEnabled(readEnabledFlag());
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key === STORAGE_KEY_ENABLED || e.key === STORAGE_KEY_OVERLAY || e.key === STORAGE_KEY_P2) {
        setEnabled(readEnabledFlag());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = useCallback(() => {
    onClose?.();
    if (typeof window !== "undefined") {
      // Close the real overlay + clear dev flags
      window.localStorage.removeItem(STORAGE_KEY_ENABLED);
      window.localStorage.removeItem(STORAGE_KEY_OVERLAY);
      window.localStorage.removeItem(STORAGE_KEY_P2);
    }
    setEnabled(false);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, open]);

  const titleId = useMemo(() => "stratfit-onboarding-title", []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={dismiss} />

      <div className="relative h-full w-full overflow-auto p-4 sm:p-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex items-baseline gap-3">
              <h2 id={titleId} className="text-sm font-semibold text-gray-200">
                Onboarding — LOCAL BUILD 2026-01-06
              </h2>
              <div className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-white/50">
                Step {step} / 4
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-[#1e2b45] bg-[#0f1b34] px-3 py-2 text-sm font-semibold text-gray-200 hover:border-[#00b4ff]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4ff]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]"
            >
              Close (Esc)
            </button>
          </div>

          <div role="dialog" aria-modal="true" aria-labelledby={titleId}>
            {step === 2 ? (
              <Page2ScenarioSettings
                value={data.scenarioSettings}
                onUpdate={(next) => setData((prev) => ({ ...prev, scenarioSettings: next }))}
                onBack={() => {}}
                onNext={() => setStep(3)}
              />
            ) : (
              <Page3LeversIntent
                value={data}
                onUpdate={setData}
                onBack={() => setStep(2)}
                onNext={() => {}}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


