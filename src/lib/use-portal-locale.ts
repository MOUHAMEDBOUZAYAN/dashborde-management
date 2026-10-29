"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  PORTAL_LOCALE_KEY,
  writePortalLocale,
  type PortalLocale,
} from "@/lib/portal-locale";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("portal-locale-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("portal-locale-change", onStoreChange);
  };
}

function getLocaleSnapshot(): PortalLocale {
  const stored = window.localStorage.getItem(PORTAL_LOCALE_KEY);
  return stored === "en" || stored === "fr" ? stored : "fr";
}

function getServerLocaleSnapshot(): PortalLocale {
  return "fr";
}

export function usePortalLocale() {
  const locale = useSyncExternalStore(
    subscribe,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const setLocale = useCallback((next: PortalLocale) => {
    writePortalLocale(next);
    window.dispatchEvent(new Event("portal-locale-change"));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "fr" ? "en" : "fr");
  }, [locale, setLocale]);

  return {
    locale,
    isEnglish: locale === "en",
    setLocale,
    toggleLocale,
  };
}
