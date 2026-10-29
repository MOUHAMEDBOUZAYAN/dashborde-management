import { IconPencil, IconTrash } from "@/components/layout/nav-icons";
import { getStageById } from "@/lib/pipeline-api";
import type { PipelineLead } from "@/types";

type PipelineListViewProps = {
  leads: PipelineLead[];
  onLeadOpen?: (lead: PipelineLead) => void;
  onLeadEdit?: (lead: PipelineLead) => void;
  onLeadDelete?: (lead: PipelineLead) => void;
};

export function PipelineListView({
  leads,
  onLeadOpen,
  onLeadEdit,
  onLeadDelete,
}: PipelineListViewProps) {
  const hasActions = Boolean(onLeadEdit || onLeadDelete);

  if (leads.length === 0) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 items-center justify-center rounded-xl border text-sm sm:rounded-2xl"
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
      className="dash-h-scroll h-full min-h-0 flex-1 overflow-auto rounded-xl border sm:rounded-2xl"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead>
          <tr
            className="border-b text-xs uppercase tracking-wide"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-muted)",
            }}
          >
            <th className="px-4 py-3 font-semibold">Nom</th>
            <th className="px-4 py-3 font-semibold">Téléphone</th>
            <th className="px-4 py-3 font-semibold">Campagne</th>
            <th className="px-4 py-3 font-semibold">Responsable</th>
            <th className="px-4 py-3 font-semibold">Étape</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            {hasActions ? (
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const stage = getStageById(lead.stage);
            return (
              <tr
                key={lead.id}
                className="border-b last:border-b-0 transition-colors"
                style={{
                  borderColor: "var(--dash-border)",
                  cursor: onLeadOpen ? "pointer" : undefined,
                }}
                onClick={() => onLeadOpen?.(lead)}
              >
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: "var(--dash-text)" }}
                >
                  {lead.name}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--dash-muted)" }}>
                  {lead.phone || "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--dash-muted)" }}>
                  {lead.campaign || "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--dash-text)" }}>
                  {lead.owner || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    {stage ? (
                      <span
                        className="h-2 w-2 rounded-full"
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
                  className="px-4 py-3"
                  style={{ color: "var(--dash-gold-muted)" }}
                >
                  {new Date(lead.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                {hasActions ? (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onLeadEdit ? (
                        <button
                          type="button"
                          aria-label={`Modifier ${lead.name}`}
                          title="Modifier"
                          onClick={(event) => {
                            event.stopPropagation();
                            onLeadEdit(lead);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-80"
                          style={{
                            borderColor: "var(--dash-border)",
                            color: "var(--dash-text)",
                            backgroundColor: "var(--dash-field)",
                          }}
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      {onLeadDelete ? (
                        <button
                          type="button"
                          aria-label={`Supprimer ${lead.name}`}
                          title="Supprimer"
                          onClick={(event) => {
                            event.stopPropagation();
                            onLeadDelete(lead);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-80"
                          style={{
                            borderColor: "var(--dash-border)",
                            color: "#ef4444",
                            backgroundColor: "var(--dash-field)",
                          }}
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
