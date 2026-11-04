import type { PortalLocale } from "@/lib/portal-locale";

const messages = {
  fr: {
    nav: {
      "/dashboard": "Mes tâches",
      "/dashboard/pipeline": "Pipeline",
      "/dashboard/leads": "Leads",
      "/dashboard/suivi": "Suivi",
      "/dashboard/performance": "Performance",
      "/dashboard/equipe": "Équipe",
      "/dashboard/connexion-meta": "Connexion Meta",
    },
    logout: "Déconnexion",
    footerPrefix: "Solution proposée par",
    footerBrand: "© 63 Agency",
    footerLine2: "2026 · Tous droits réservés",
    search: "Rechercher…",
    notifications: "Notifications",
    openMenu: "Ouvrir le menu",
    themeToLight: "Activer le thème clair",
    themeToDark: "Activer le thème sombre",
    language: "Langue",
    switchToEn: "Passer en anglais",
    switchToFr: "Passer en français",
    all: "Tous",
    newPipeline: "Nouveau pipeline",
    filters: "Filtres",
    loading: "Chargement…",
    emptyTasks:
      "Aucune tâche en attente. Les nouveaux leads créeront automatiquement une tâche d'appel.",
    comingSoon: "Bientôt disponible",
    comingSoonBody: "Cette section sera disponible ici prochainement.",
  },
  en: {
    nav: {
      "/dashboard": "My tasks",
      "/dashboard/pipeline": "Pipeline",
      "/dashboard/leads": "Leads",
      "/dashboard/suivi": "Follow-up",
      "/dashboard/performance": "Performance",
      "/dashboard/equipe": "Team",
      "/dashboard/connexion-meta": "Meta connection",
    },
    logout: "Log out",
    footerPrefix: "Solution by",
    footerBrand: "© 63 Agency",
    footerLine2: "2026 · All rights reserved",
    search: "Search…",
    notifications: "Notifications",
    openMenu: "Open menu",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    language: "Language",
    switchToEn: "Switch to English",
    switchToFr: "Switch to French",
    all: "All",
    newPipeline: "New pipeline",
    filters: "Filters",
    loading: "Loading…",
    emptyTasks:
      "No pending tasks. New leads will automatically create a call task.",
    comingSoon: "Coming soon",
    comingSoonBody: "This section will be available here soon.",
  },
} as const;

export type MessageKey = Exclude<keyof (typeof messages)["fr"], "nav">;

export function t(locale: PortalLocale, key: MessageKey) {
  return messages[locale][key];
}

export function navLabel(locale: PortalLocale, href: string) {
  const labels = messages[locale].nav;
  return labels[href as keyof typeof labels] ?? href;
}
