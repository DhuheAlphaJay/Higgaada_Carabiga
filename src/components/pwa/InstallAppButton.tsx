"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, Share, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribe() {
  return () => undefined;
}

function isStandalone() {
  const iosStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function isIos() {
  const agent = window.navigator.userAgent;
  const iPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/i.test(agent) || iPad;
}

const iosSteps = [
  { icon: <Share className="size-6" aria-hidden="true" />, text: copy.installIosStep1 },
  { icon: <Plus className="size-6" aria-hidden="true" />, text: copy.installIosStep2 },
  { icon: <span className="text-sm font-black">Add</span>, text: copy.installIosStep3 },
];

export function InstallAppButton() {
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);
  const ios = useSyncExternalStore(subscribe, () => isIos() && !isStandalone(), () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGuideOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guideOpen]);

  if (standalone || installed || (!promptEvent && !ios)) return null;

  async function install() {
    if (ios) {
      setGuideOpen(true);
      return;
    }
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  return (
    <div className="relative mt-4">
      <button
        type="button"
        dir="ltr"
        onClick={() => void install()}
        className="pressable edge-sky flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-4 text-sm font-extrabold text-white sm:text-base"
      >
        <Download className="size-5 shrink-0" aria-hidden="true" />
        {copy.installApp}
      </button>

      <AnimatePresence>
        {guideOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/55 p-3 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGuideOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-install-title"
              dir="ltr"
              initial={{ y: 36, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-orange-50 p-5 shadow-2xl sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 id="ios-install-title" className="text-xl font-black leading-snug text-indigo-950 sm:text-2xl">
                  {copy.installIosTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="pressable edge-soft inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-white text-indigo-950"
                  aria-label={copy.close}
                >
                  <X className="size-6" />
                </button>
              </div>

              <ol className="mt-4 space-y-3">
                {iosSteps.map((step, index) => (
                  <li key={step.text} className="flex items-center gap-3 rounded-3xl bg-white px-3 py-3 shadow-sm">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-lg font-black text-white">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm font-extrabold leading-snug text-indigo-950 sm:text-base">{step.text}</p>
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-indigo-950">
                      {step.icon}
                    </span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
