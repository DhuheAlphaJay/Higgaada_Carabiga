"use client";

import { Download } from "lucide-react";
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

export function InstallAppButton() {
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);
  const ios = useSyncExternalStore(subscribe, () => isIos() && !isStandalone(), () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

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

  if (standalone || installed || (!promptEvent && !ios)) return null;

  async function install() {
    if (!promptEvent) {
      setShowIosSteps(true);
      return;
    }
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
      {showIosSteps ? (
        <p dir="ltr" className="mt-2 rounded-2xl bg-white/90 px-3 py-2 text-center text-sm font-bold text-indigo-950">
          {copy.installIos}
        </p>
      ) : null}
    </div>
  );
}
