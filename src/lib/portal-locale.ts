export const PORTAL_LOCALE_KEY = "client-portal-locale";

export type PortalLocale = "fr" | "en";

export function readPortalLocale(): PortalLocale {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem(PORTAL_LOCALE_KEY);
  return stored === "en" || stored === "fr" ? stored : "fr";
}

export function writePortalLocale(locale: PortalLocale) {
  window.localStorage.setItem(PORTAL_LOCALE_KEY, locale);
}
