"use client";

import { usePathname } from "next/navigation";
import { getPageTitle } from "@/config/nav";
import { HeaderSearch } from "@/components/layout/header-search";
import {
  IconBell,
  IconMenu,
  IconMoon,
  IconSun,
} from "@/components/layout/nav-icons";
import { navLabel, t } from "@/lib/i18n";
import { usePortalLocale } from "@/lib/use-portal-locale";
import { useAuthStore } from "@/store/auth-store";

type AppHeaderProps = {
  onMenuClick: () => void;
  dark: boolean;
  onToggleTheme: () => void;
};

export function AppHeader({ onMenuClick, dark, onToggleTheme }: AppHeaderProps) {
  const pathname = usePathname();
  const { locale, toggleLocale } = usePortalLocale();
  const companyName = useAuthStore((state) => state.client?.company_name);
  const title =
    navLabel(locale, pathname) !== pathname
      ? navLabel(locale, pathname)
      : getPageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b px-5 py-2.5 sm:min-h-16 sm:gap-3 sm:px-6 sm:py-3 md:px-7 xl:px-8"
      style={{
        backgroundColor: "var(--dash-header)",
        borderColor: "var(--dash-border)",
        color: "var(--dash-text)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t(locale, "openMenu")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border xl:hidden"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-muted)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          <IconMenu />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg md:text-xl">
            {title}
          </h1>
          {companyName ? (
            <p
              className="truncate text-xs sm:text-sm"
              style={{ color: "var(--dash-muted)" }}
            >
              {companyName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
        <HeaderSearch />

        <button
          type="button"
          aria-label={t(locale, "notifications")}
          className="flex h-9 w-9 items-center justify-center rounded-full border"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-muted)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          <IconBell />
        </button>

        <button
          type="button"
          onClick={toggleLocale}
          aria-label={
            locale === "fr" ? t(locale, "switchToEn") : t(locale, "switchToFr")
          }
          title={t(locale, "language")}
          className="inline-flex h-9 items-center rounded-full border px-2.5 text-xs font-semibold tracking-wide sm:px-3"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-text)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          <span className={locale === "fr" ? "opacity-100" : "opacity-45"}>
            FR
          </span>
          <span className="mx-0.5 opacity-45">/</span>
          <span className={locale === "en" ? "opacity-100" : "opacity-45"}>
            EN
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? t(locale, "themeToLight") : t(locale, "themeToDark")}
          className="flex h-9 w-9 items-center justify-center rounded-full border"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-muted)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          {dark ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}
