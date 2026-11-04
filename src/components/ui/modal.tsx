"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** When false, backdrop click does not close (useful for destructive confirms if desired). */
  closeOnBackdrop?: boolean;
  /** Wider panel for multi-field forms. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Skip default title/close chrome — children own the full layout. */
  bare?: boolean;
  /** Extra classes on the dialog panel (e.g. fixed height flex layout). */
  panelClassName?: string;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  closeOnBackdrop = true,
  size = "sm",
  bare = false,
  panelClassName = "",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const sizeClass =
    size === "xl"
      ? "max-w-3xl"
      : size === "lg"
        ? "max-w-[560px]"
        : size === "md"
          ? "max-w-[540px]"
          : "max-w-[420px]";

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];
    (focusables[0] ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/55"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={bare ? undefined : titleId}
        aria-label={bare ? title ?? "Dialogue" : undefined}
        aria-describedby={!bare && description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 max-h-[92dvh] w-[calc(100vw-1.5rem)] rounded-xl border outline-none sm:rounded-xl ${
          panelClassName.includes("overflow-") ? "" : "overflow-y-auto"
        } ${sizeClass} ${bare ? "p-0" : "px-4 py-5 sm:px-6 sm:py-6"} ${panelClassName}`}
        style={{
          backgroundColor: "var(--dash-surface)",
          borderColor: "color-mix(in srgb, var(--dash-gold-muted) 40%, transparent)",
          color: "var(--dash-text)",
          boxShadow: "0 40px 90px -30px rgba(0, 0, 0, 0.6)",
        }}
      >
        {bare ? (
          children
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {description ? (
                  <p
                    id={descriptionId}
                    className="mt-1.5 text-sm leading-6"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm"
                style={{
                  borderColor: "var(--dash-border)",
                  color: "var(--dash-muted)",
                  backgroundColor: "rgba(0,0,0,0.12)",
                }}
              >
                ×
              </button>
            </div>

            <div className="mt-5">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
