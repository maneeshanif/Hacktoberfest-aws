"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const STANDALONE = "(display-mode: standalone)";

function subscribeStandalone(notify: () => void) {
  const mq = matchMedia(STANDALONE);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

// Chrome/Edge/Android fire `beforeinstallprompt`; iOS Safari has no such event, so callers show manual steps there.
export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installedEvent, setInstalledEvent] = useState(false);
  const standalone = useSyncExternalStore(subscribeStandalone, () => matchMedia(STANDALONE).matches, () => false);
  const installed = installedEvent || standalone;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalledEvent(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }, [prompt]);

  return { canInstall: Boolean(prompt) && !installed, install };
}
