"use client";

import { Modal } from "@/components/ui/modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  submitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  submitting = false,
  error = null,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} closeOnBackdrop>
      <p className="text-sm leading-6" style={{ color: "var(--dash-muted)" }}>
        {message}
      </p>

      {error ? (
        <p className="mt-3 text-sm" style={{ color: "#f87171" }} role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-10 rounded-xl border px-4 text-sm font-medium disabled:opacity-60"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-text)",
            backgroundColor: "transparent",
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="h-10 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
          style={
            destructive
              ? { backgroundColor: "#dc2626", color: "#fff" }
              : {
                  backgroundColor: "var(--login-cream)",
                  color: "#1c1814",
                }
          }
        >
          {submitting ? "…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
