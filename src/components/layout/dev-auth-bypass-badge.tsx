"use client";

import { AUTH_BYPASS } from "@/config/constants";

/** Unobtrusive corner badge — only mounts when auth bypass is enabled. */
export function DevAuthBypassBadge() {
  if (!AUTH_BYPASS) return null;

  return (
    <div
      className="pointer-events-none fixed right-2 bottom-2 z-[100] rounded-full border px-2 py-1 text-[9px] font-semibold tracking-wide uppercase sm:right-3 sm:bottom-3 sm:px-2.5 sm:text-[10px]"
      style={{
        backgroundColor: "rgba(28, 24, 20, 0.82)",
        borderColor: "rgba(196, 165, 116, 0.35)",
        color: "#f3ead8",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
      }}
      aria-live="polite"
    >
      DEV — auth bypass
    </div>
  );
}
