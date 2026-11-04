"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconChevronDown } from "@/components/layout/nav-icons";
import { formatRelativeFr } from "@/lib/format-relative";
import { getStageById } from "@/lib/pipeline-api";
import type { PipelineLead } from "@/types";

const PAGE_SIZE = 20;

type PipelineListViewProps = {
  leads: PipelineLead[];
  onLeadOpen?: (lead: PipelineLead) => void;
  onLeadEdit?: (lead: PipelineLead) => void;
  onLeadDelete?: (lead: PipelineLead) => void;
};

export function PipelineListView({
  leads,
  onLeadOpen,
}: PipelineListViewProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [leads]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageLeads = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return leads.slice(start, start + PAGE_SIZE);
  }, [leads, page]);

  const allPageSelected =
    pageLeads.length > 0 && pageLeads.every((lead) => selected.has(lead.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageSelected) {
        for (const lead of pageLeads) next.delete(lead.id);
      } else {
        for (const lead of pageLeads) next.add(lead.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (leads.length === 0) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border text-sm"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-surface)",
          color: "var(--dash-muted)",
        }}
      >
        Aucun lead
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <div className="dash-h-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr style={{ color: "var(--dash-muted)" }}>
              <th className="w-12 py-3.5 pr-1 pl-5 font-medium">
                <RowCheckbox
                  checked={allPageSelected}
                  ariaLabel="Tout sélectionner"
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-3.5 text-[12px] font-medium">Nom</th>
              <th className="px-3 py-3.5 text-[12px] font-medium">Campagne</th>
              <th className="px-3 py-3.5 text-[12px] font-medium">Téléphone</th>
              <th className="px-3 py-3.5 text-[12px] font-medium">Étape</th>
              <th className="px-3 py-3.5 text-[12px] font-medium">Responsable</th>
              <th className="px-3 py-3.5 pr-5 text-[12px] font-medium">
                <span className="inline-flex items-center gap-1">
                  Reçu
                  <IconChevronDown className="h-3 w-3 opacity-60" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageLeads.map((lead) => {
              const stage = getStageById(lead.stage);
              const isSelected = selected.has(lead.id);
              const relative = formatRelativeFr(lead.date);

              return (
                <tr
                  key={lead.id}
                  className="border-t transition-colors"
                  style={{
                    borderColor: "var(--dash-border)",
                    cursor: onLeadOpen ? "pointer" : undefined,
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--dash-text) 4%, transparent)"
                      : "transparent",
                  }}
                  onClick={() => onLeadOpen?.(lead)}
                >
                  <td className="py-[18px] pr-1 pl-5 align-middle">
                    <RowCheckbox
                      checked={isSelected}
                      ariaLabel={`Sélectionner ${lead.name}`}
                      onChange={() => toggleOne(lead.id)}
                    />
                  </td>
                  <td
                    className="max-w-[220px] truncate px-3 py-[18px] align-middle text-[13px] font-semibold"
                    style={{ color: "var(--dash-text)" }}
                  >
                    {lead.name}
                  </td>
                  <td
                    className="max-w-[160px] truncate px-3 py-[18px] align-middle text-[13px]"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {lead.campaign || ""}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-[18px] align-middle text-[13px]"
                    style={{ color: "var(--dash-text)" }}
                  >
                    {lead.phone || "—"}
                  </td>
                  <td className="px-3 py-[18px] align-middle">
                    <span className="inline-flex items-center gap-2 text-[13px]">
                      {stage ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: stage.color }}
                          aria-hidden
                        />
                      ) : null}
                      <span style={{ color: "var(--dash-text)" }}>
                        {stage?.label ?? lead.stage}
                      </span>
                    </span>
                  </td>
                  <td
                    className="max-w-[140px] truncate px-3 py-[18px] align-middle text-[13px]"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {lead.owner || "—"}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-[18px] pr-5 align-middle text-[13px]"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {relative || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3 text-sm"
        style={{
          borderColor: "var(--dash-border)",
          color: "var(--dash-muted)",
        }}
      >
        <p>
          {leads.length} lead{leads.length > 1 ? "s" : ""}
        </p>

        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Page précédente"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm disabled:opacity-35"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
              backgroundColor: "transparent",
            }}
          >
            ‹
          </button>
          <span className="min-w-[3ch] px-1 text-center tabular-nums">
            {page}/{totalPages}
          </span>
          <button
            type="button"
            aria-label="Page suivante"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm disabled:opacity-35"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
              backgroundColor: "transparent",
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function RowCheckbox({
  checked,
  ariaLabel,
  onChange,
}: {
  checked: boolean;
  ariaLabel: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className="inline-flex h-[17px] w-[17px] items-center justify-center rounded-full border transition-colors"
      style={{
        borderColor: checked
          ? "var(--dash-gold-muted)"
          : "color-mix(in srgb, var(--dash-muted) 55%, transparent)",
        backgroundColor: checked ? "var(--dash-nav-active-bg)" : "transparent",
        color: checked ? "var(--dash-nav-active-text)" : "transparent",
      }}
    >
      {checked ? <IconCheck className="h-2.5 w-2.5" /> : null}
    </button>
  );
}
