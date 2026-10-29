type IconProps = { className?: string };

export function IconTasks({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h11M9 12h11M9 18h11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 6 1 1 2-2M4.5 12l1 1 2-2M4.5 18l1 1 2-2" />
    </svg>
  );
}

export function IconPipeline({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="4.5" width="5" height="15" rx="1.5" />
      <rect x="9.5" y="4.5" width="5" height="15" rx="1.5" />
      <rect x="15.5" y="4.5" width="5" height="15" rx="1.5" />
    </svg>
  );
}

export function IconTeam({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S14 16 14.5 19" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 14.8c1.7-.3 3.4.4 4.5 2.2" />
    </svg>
  );
}

export function IconMeta({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c1.8-4 4.2-6 6.5-6 2 0 3.2 1.5 4.5 4s2.5 4 4.5 4c2.3 0 4.7-2 6.5-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c1.8 4 4.2 6 6.5 6 2 0 3.2-1.5 4.5-4s2.5-4 4.5-4c2.3 0 4.7 2 6.5 6" />
    </svg>
  );
}

export function IconChecklist({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 1.2 1.2L12 7.4M8 14l1.2 1.2L12 12.4" />
      <path strokeLinecap="round" d="M14.5 9.5H17M14.5 14.5H17" />
    </svg>
  );
}

export function IconSettings({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" />
    </svg>
  );
}

export function IconPlus({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconLeads({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path strokeLinecap="round" d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export function IconSuivi({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 14 3-3 3 2 5-6" />
    </svg>
  );
}

export function IconPerformance({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 15v-3M12 15V9M16 15v-6" />
    </svg>
  );
}

export function IconLogout({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 7l5 5-5 5M19 12H10" />
    </svg>
  );
}

export function IconSearch({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" d="m16.5 16.5 4 4" />
    </svg>
  );
}

export function IconBell({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 16h12l-1.2-2.2a2 2 0 0 1-.3-1V10a4.5 4.5 0 1 0-9 0v2.8c0 .35-.1.7-.3 1L6 16Z" />
      <path strokeLinecap="round" d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconMenu({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconSun({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="3.5" />
      <path strokeLinecap="round" d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
    </svg>
  );
}

export function IconMoon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6 6 0 0 0 20 14.5z" />
    </svg>
  );
}

export function IconSliders({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

export function IconKanban({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="4.5" width="5" height="15" rx="1.2" />
      <rect x="9.5" y="4.5" width="5" height="10" rx="1.2" />
      <rect x="15.5" y="4.5" width="5" height="12" rx="1.2" />
    </svg>
  );
}

export function IconList({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" d="M8 7h12M8 12h12M8 17h12" />
      <path strokeLinecap="round" d="M4 7h.01M4 12h.01M4 17h.01" />
    </svg>
  );
}

export function IconNewTask({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 1.4 1.4L13 9.8" />
    </svg>
  );
}

export function IconChevronDown({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconCheck({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

export function IconPhone({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 4.5h2.2l1.1 3.2-1.4 1.4a12.5 12.5 0 0 0 5.5 5.5l1.4-1.4 3.2 1.1v2.2A2 2 0 0 1 17.5 18 13.5 13.5 0 0 1 4 4.5a2 2 0 0 1 2-2Z"
      />
    </svg>
  );
}

export function IconCalendar({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path strokeLinecap="round" d="M8 3.5v3M16 3.5v3M3.5 9.5h17" />
    </svg>
  );
}

export function IconWhatsApp({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.2 18.4 5 19.5l1.2-2.3A7.5 7.5 0 1 1 12 19.5a7.4 7.4 0 0 1-4.8-1.1Z"
      />
      <path strokeLinecap="round" d="M9.2 10.2c.4 1.5 1.8 2.9 3.3 3.3l.9-.9c.2-.2.5-.2.7-.1.6.2 1.3.4 2 .5.3 0 .5.3.5.6v1.2c0 .3-.3.6-.6.6A7 7 0 0 1 8.2 8.6c0-.3.2-.6.6-.6h1.2c.3 0 .5.2.6.5.1.7.3 1.4.5 2 .1.2 0 .5-.2.7l-.7.8Z" />
    </svg>
  );
}

export function IconRefresh({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 1 1-2.1-5.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5v4.2H15" />
    </svg>
  );
}

export function IconDocument({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path strokeLinecap="round" d="M14 3.5V8h4.5M8.5 12h7M8.5 15.5h7" />
    </svg>
  );
}

export function IconSwap({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h11l-2.5-2.5M17 16H6l2.5 2.5" />
    </svg>
  );
}

export function IconClock({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="7.5" />
      <path strokeLinecap="round" d="M12 8.5V12l2.5 1.5" />
    </svg>
  );
}

export function IconMail({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}

export function IconCampaign({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10v4M7 8.5v7M10 6v12M14.5 9.5l5-2.5v10l-5-2.5V9.5Z" />
    </svg>
  );
}

export function IconTrash({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" d="M5 8h14M9.5 8V5.5h5V8M9 11v6M12 11v6M15 11v6M7 8l.8 11.2A1.5 1.5 0 0 0 9.3 20.5h5.4a1.5 1.5 0 0 0 1.5-1.3L17 8" />
    </svg>
  );
}

export function IconPencil({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 5.5 18.5 8.5M5 19l1.1-4.2L15.2 5.7a1.5 1.5 0 0 1 2.1 0l1 1a1.5 1.5 0 0 1 0 2.1L8.2 17.9 4 19l1-4Z"
      />
    </svg>
  );
}

export function IconInfo({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function IconUser({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="9" r="3.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 18.5c1.4-2.2 3.3-3.3 5.5-3.3s4.1 1.1 5.5 3.3" />
    </svg>
  );
}

export function IconUserPlus({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="10" cy="9" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 18.5c1.2-2 2.9-3 5.5-3s4.3 1 5.5 3M17 8v6M14 11h6" />
    </svg>
  );
}

export function IconSend({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12 19 4.5 14.5 19l-2.2-6.3L4.5 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12.3 12.7 6.7-8.2" />
    </svg>
  );
}

export const NAV_ICONS = {
  "/dashboard": IconTasks,
  "/dashboard/pipeline": IconPipeline,
  "/dashboard/leads": IconLeads,
  "/dashboard/suivi": IconSuivi,
  "/dashboard/performance": IconPerformance,
  "/dashboard/equipe": IconTeam,
  "/dashboard/connexion-meta": IconMeta,
} as const;
