export const PORTAL_THEME_KEY = "client-portal-theme";

export type PortalTheme = "light" | "dark";

export function readPortalTheme(): PortalTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(PORTAL_THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

export function writePortalTheme(theme: PortalTheme) {
  window.localStorage.setItem(PORTAL_THEME_KEY, theme);
}

export function themeClassName(theme: PortalTheme) {
  return theme === "dark" ? "login-theme-dark" : "login-theme-light";
}

/** Apply theme on <html> so sidebar + whole app pick up CSS variables. */
export function applyThemeToDocument(theme: PortalTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.remove("login-theme-dark", "login-theme-light");
  root.classList.add(themeClassName(theme));
}
