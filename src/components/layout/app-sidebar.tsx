"use client";

import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV, isNavActive } from "@/config/nav";
import { IconLogout, NAV_ICONS } from "@/components/layout/nav-icons";
import { navLabel, t } from "@/lib/i18n";
import { usePortalLocale } from "@/lib/use-portal-locale";
import { useAuthStore } from "@/store/auth-store";

const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

type AppSidebarProps = {
  open: boolean;
  onNavigate?: () => void;
};

export function AppSidebar({ open, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const { locale } = usePortalLocale();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[min(248px,85vw)] flex-col border-r transition-transform duration-200 xl:w-[248px] xl:translate-x-0 ${
        open ? "translate-x-0" : "max-xl:-translate-x-full"
      }`}
      style={{
        backgroundColor: "var(--dash-sidebar)",
        borderColor: "var(--dash-sidebar-border)",
        color: "var(--dash-sidebar-text)",
      }}
    >
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sm:px-5 sm:pt-6 sm:pb-5">
        <Image
          src="/images/63.png"
          alt="63 Agency"
          width={40}
          height={40}
          className="h-9 w-9 rounded-[10px] sm:h-10 sm:w-10"
        />
        <p className={`${serif.className} text-[20px] leading-none sm:text-[22px]`}>
          63 Agency
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 pb-4 sm:px-3">
        {DASHBOARD_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--dash-nav-active-bg)] text-[var(--dash-nav-active-text)]"
                  : "text-[var(--dash-sidebar-muted)] hover:bg-[var(--dash-nav-hover)] hover:text-[var(--dash-sidebar-text)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{navLabel(locale, item.href)}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className="mt-auto border-t px-2.5 pt-3 pb-4 sm:px-3 sm:pb-5"
        style={{ borderColor: "var(--dash-sidebar-border)" }}
      >
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--dash-sidebar-muted)] transition-colors hover:bg-[var(--dash-nav-hover)] hover:text-[var(--dash-sidebar-text)]"
        >
          <IconLogout className="h-4 w-4 shrink-0" />
          <span>{t(locale, "logout")}</span>
        </button>

        <div className="mt-4 px-3">
          <p
            className="text-[11px] leading-5"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            {t(locale, "footerLine1")}
          </p>
          <p
            className="text-[11px] leading-5"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            {t(locale, "footerLine2")}
          </p>
        </div>
      </div>
    </aside>
  );
}
