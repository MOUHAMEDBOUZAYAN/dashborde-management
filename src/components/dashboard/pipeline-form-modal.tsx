"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { PIPELINE_COLORS } from "@/lib/pipelines-api";
import type { Pipeline } from "@/types";

type PipelineFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Pick<Pipeline, "name" | "color"> | null;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: { name: string; color: string }) => void;
};

export function PipelineFormModal({
  open,
  mode,
  initial,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: PipelineFormModalProps) {
  if (!open) return null;

  return (
    <PipelineFormModalInner
      key={`${mode}:${initial?.name ?? ""}:${initial?.color ?? ""}`}
      mode={mode}
      initial={initial}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function PipelineFormModalInner({
  mode,
  initial,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: Pick<Pipeline, "name" | "color"> | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: { name: string; color: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<string>(
    initial?.color ?? PIPELINE_COLORS[0],
  );

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "create" ? "Nouveau pipeline" : "Modifier le pipeline"}
      description={
        mode === "create"
          ? "Une vue séparée avec ses 8 étapes, par exemple B2B ou B2C."
          : "Mets à jour le nom et la couleur de ce pipeline."
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({ name: name.trim(), color });
        }}
      >
        <div>
          <label htmlFor="pipeline-name" className="sr-only">
            Nom du pipeline
          </label>
          <input
            id="pipeline-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom du pipeline (ex. B2B)"
            className="h-11 w-full rounded-xl border px-4 text-sm outline-none"
            style={{
              backgroundColor: "var(--dash-field)",
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
            }}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {PIPELINE_COLORS.map((swatch) => {
            const selected = color === swatch;
            return (
              <button
                key={swatch}
                type="button"
                aria-label={`Couleur ${swatch}`}
                aria-pressed={selected}
                onClick={() => setColor(swatch)}
                className="h-7 w-7 rounded-full transition-transform"
                style={{
                  backgroundColor: swatch,
                  outline: selected
                    ? "2px solid var(--dash-nav-active-bg)"
                    : "2px solid transparent",
                  outlineOffset: "2px",
                  transform: selected ? "scale(1.08)" : undefined,
                }}
              />
            );
          })}
        </div>

        {error ? (
          <p className="text-sm" style={{ color: "#f87171" }} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--login-cream)",
            color: "#1c1814",
          }}
        >
          <span aria-hidden>+</span>
          {mode === "create"
            ? submitting
              ? "Création…"
              : "Continuer"
            : submitting
              ? "Enregistrement…"
              : "Enregistrer"}
        </button>
      </form>
    </Modal>
  );
}
