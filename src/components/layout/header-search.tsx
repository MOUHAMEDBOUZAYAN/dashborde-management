"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconSearch } from "@/components/layout/nav-icons";
import { getStageById, fetchPipelineLeads, pipelineLeadsQueryKey } from "@/lib/pipeline-api";
import { t } from "@/lib/i18n";
import { usePortalLocale } from "@/lib/use-portal-locale";
import type { PipelineLead } from "@/types";

export function HeaderSearch() {
  const router = useRouter();
  const { locale } = usePortalLocale();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const leadsQuery = useQuery({
    queryKey: pipelineLeadsQueryKey("all"),
    queryFn: () => fetchPipelineLeads("all"),
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [] as PipelineLead[];
    return (leadsQuery.data ?? [])
      .filter((lead) => {
        return (
          lead.name.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.campaign.toLowerCase().includes(q) ||
          lead.owner.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [leadsQuery.data, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function goToLead(lead: PipelineLead) {
    setOpen(false);
    setQuery("");
    router.push(`/dashboard/leads?lead=${encodeURIComponent(lead.id)}`);
  }

  function goToSearch() {
    const q = query.trim();
    setOpen(false);
    if (!q) {
      router.push("/dashboard/leads");
      return;
    }
    router.push(`/dashboard/leads?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={rootRef} className="relative hidden min-w-0 lg:block lg:w-[180px] xl:w-[220px] 2xl:w-[260px]">
      <label className="relative block">
        <span className="sr-only">{t(locale, "search")}</span>
        <span
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          style={{ color: "var(--dash-muted)" }}
        >
          <IconSearch />
        </span>
        <input
          type="search"
          value={query}
          placeholder={t(locale, "search")}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && query.trim().length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-9 w-full rounded-full border pr-3 pl-9 text-sm outline-none"
          style={{
            backgroundColor: "var(--dash-field)",
            borderColor: "var(--dash-border)",
            color: "var(--dash-text)",
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) =>
                results.length === 0 ? 0 : Math.min(current + 1, results.length - 1),
              );
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const active = results[activeIndex];
              if (open && active) {
                goToLead(active);
              } else {
                goToSearch();
              }
            }
          }}
        />
      </label>

      {open && query.trim().length > 0 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-2xl border shadow-lg"
          style={{
            backgroundColor: "var(--dash-surface)",
            borderColor: "var(--dash-border)",
            boxShadow: "var(--dash-shadow)",
          }}
        >
          {leadsQuery.isLoading ? (
            <p className="px-3 py-3 text-sm" style={{ color: "var(--dash-muted)" }}>
              {t(locale, "loading")}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm" style={{ color: "var(--dash-muted)" }}>
              Aucun lead trouvé
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((lead, index) => {
                const stage = getStageById(lead.stage);
                const active = index === activeIndex;
                return (
                  <li key={lead.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
                      style={{
                        backgroundColor: active
                          ? "var(--dash-field)"
                          : "transparent",
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goToLead(lead)}
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-sm font-medium"
                          style={{ color: "var(--dash-text)" }}
                        >
                          {lead.name}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-xs"
                          style={{ color: "var(--dash-muted)" }}
                        >
                          {[lead.phone, lead.email, lead.campaign]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </span>
                      {stage ? (
                        <span
                          className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[11px]"
                          style={{ color: "var(--dash-muted)" }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                            aria-hidden
                          />
                          {stage.label}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={goToSearch}
            className="flex w-full border-t px-3 py-2.5 text-left text-xs font-medium"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-gold-muted)",
              backgroundColor: "var(--dash-surface)",
            }}
          >
            Voir tous les résultats dans Leads
          </button>
        </div>
      ) : null}
    </div>
  );
}
