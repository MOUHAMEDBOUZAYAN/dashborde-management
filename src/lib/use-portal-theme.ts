"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  PORTAL_THEME_KEY,
  applyThemeToDocument,
  themeClassName,
  writePortalTheme,
  type PortalTheme,
} from "@/lib/portal-theme";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("portal-theme-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("portal-theme-change", onStoreChange);
  };
}

function getThemeSnapshot(): PortalTheme {
  const stored = window.localStorage.getItem(PORTAL_THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function getServerThemeSnapshot(): PortalTheme {
  return "dark";
}

export function usePortalTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((next: PortalTheme) => {
    writePortalTheme(next);
    applyThemeToDocument(next);
    window.dispatchEvent(new Event("portal-theme-change"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return {
    theme,
    dark: theme === "dark",
    className: themeClassName(theme),
    setTheme,
    toggleTheme,
  };
}
