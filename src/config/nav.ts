export type NavItem = {
  href: string;
  label: string;
  title: string;
};

export const DASHBOARD_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Mes tâches",
    title: "Mes tâches",
  },
  {
    href: "/dashboard/pipeline",
    label: "Pipeline",
    title: "Pipeline",
  },
  {
    href: "/dashboard/leads",
    label: "Leads",
    title: "Leads",
  },
  {
    href: "/dashboard/suivi",
    label: "Suivi",
    title: "Suivi des leads",
  },
  {
    href: "/dashboard/performance",
    label: "Performance",
    title: "Performance de l'équipe",
  },
  {
    href: "/dashboard/equipe",
    label: "Équipe",
    title: "Équipe",
  },
  {
    href: "/dashboard/connexion-meta",
    label: "Connexion Meta",
    title: "Connexion Meta",
  },
];

export function getPageTitle(pathname: string) {
  const exact = DASHBOARD_NAV.find((item) => item.href === pathname);
  if (exact) return exact.title;

  const nested = DASHBOARD_NAV.find(
    (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
  );
  return nested?.title ?? "Mes tâches";
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
