"use client";

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import {
  IconCalendar,
  IconPhone,
  IconSwap,
} from "@/components/layout/nav-icons";
import {
  formatLeadDateTimeFr,
  formatRelativeFr,
  initialsFromName,
} from "@/lib/format-relative";
import { PIPELINE_STAGES } from "@/lib/pipeline-api";
import type { PipelineLead, PipelineStageId } from "@/types";

type PipelineLeadCardProps = {
  lead: PipelineLead;
  onOpen?: () => void;
  onStageChange?: (stage: PipelineStageId) => void;
  dragging?: boolean;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "style">;

type MenuPos = { top: number; left: number };

export const PipelineLeadCard = forwardRef<HTMLElement, PipelineLeadCardProps>(
  function PipelineLeadCard(
    { lead, onOpen, onStageChange, dragging = false, style, ...rest },
    ref,
  ) {
    const initials = initialsFromName(lead.name);
    const relative = formatRelativeFr(lead.date);
    const when = formatLeadDateTimeFr(lead.date);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const moveTargets = PIPELINE_STAGES.filter(
      (stage) => stage.id !== lead.stage,
    );

    useLayoutEffect(() => {
      if (!menuOpen || !buttonRef.current) {
        setMenuPos(null);
        return;
      }

      function place() {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        const width = 196;
        const left = Math.min(
          Math.max(8, rect.right - width),
          window.innerWidth - width - 8,
        );
        setMenuPos({ top: rect.bottom + 6, left });
      }

      place();
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      return () => {
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
      };
    }, [menuOpen]);

    useEffect(() => {
      if (!menuOpen) return;

      function onPointerDown(event: MouseEvent) {
        const target = event.target as Node;
        if (
          menuRef.current?.contains(target) ||
          buttonRef.current?.contains(target)
        ) {
          return;
        }
        setMenuOpen(false);
      }

      function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") setMenuOpen(false);
      }

      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [menuOpen]);

    useEffect(() => {
      if (dragging) setMenuOpen(false);
    }, [dragging]);

    return (
      <article
        ref={ref}
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={
          onOpen
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen();
                }
              }
            : undefined
        }
        className="relative cursor-grab rounded-2xl border px-3 py-3 touch-manipulation active:cursor-grabbing"
        style={{
          backgroundColor: "var(--dash-surface)",
          borderColor: "var(--dash-border)",
          opacity: dragging ? 0.4 : 1,
          boxShadow: dragging
            ? "0 18px 40px rgba(0, 0, 0, 0.28)"
            : "var(--dash-shadow)",
          transform: dragging ? "scale(1.02)" : undefined,
          ...style,
        }}
        {...rest}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-wide"
            style={{
              backgroundColor: "var(--dash-nav-active-bg)",
              color: "var(--dash-nav-active-text)",
            }}
            aria-hidden
          >
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <h3
                  className="truncate text-[13px] font-semibold leading-tight"
                  style={{ color: "var(--dash-text)" }}
                >
                  {lead.name}
                </h3>
                {relative ? (
                  <p
                    className="mt-0.5 truncate text-[11px]"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {relative}
                  </p>
                ) : null}
              </div>

              {onStageChange ? (
                <button
                  ref={buttonRef}
                  type="button"
                  aria-label="Déplacer vers une autre étape"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title="Déplacer vers..."
                  className={`mt-0 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--dash-text)_10%,transparent)] ${
                    menuOpen
                      ? "bg-[color-mix(in_srgb,var(--dash-text)_10%,transparent)]"
                      : "bg-transparent"
                  }`}
                  style={{ color: "var(--dash-muted)" }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setMenuOpen((current) => !current);
                  }}
                >
                  <IconSwap className="h-4 w-4" />
                </button>
              ) : (
                <span
                  className="mt-0 inline-flex h-8 w-8 shrink-0 items-center justify-center"
                  style={{ color: "var(--dash-muted)", opacity: 0.7 }}
                  aria-hidden
                >
                  <IconSwap className="h-4 w-4" />
                </span>
              )}
            </div>

            {lead.phone ? (
              <p
                className="mt-2.5 flex items-center gap-1.5 truncate text-[12px]"
                style={{ color: "var(--dash-text)" }}
              >
                <IconPhone className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{lead.phone}</span>
              </p>
            ) : null}

            {when ? (
              <p
                className="mt-1.5 flex items-center gap-1.5 truncate text-[11px]"
                style={{ color: "var(--dash-muted)" }}
              >
                <IconCalendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{when}</span>
              </p>
            ) : null}
          </div>
        </div>

        {menuOpen && menuPos && onStageChange && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={menuRef}
                role="menu"
                aria-label="Déplacer vers"
                className="fixed z-[80] min-w-[188px] overflow-hidden rounded-2xl border py-2"
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                  backgroundColor: "var(--dash-surface)",
                  borderColor: "var(--dash-border)",
                  boxShadow: "0 14px 36px rgba(0, 0, 0, 0.18)",
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <p
                  className="px-3.5 pb-1.5 text-[11px] font-medium"
                  style={{ color: "var(--dash-muted)" }}
                >
                  Déplacer vers...
                </p>
                {moveTargets.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors hover:bg-black/5"
                    style={{ color: "var(--dash-text)" }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      onStageChange(stage.id);
                    }}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: stage.color }}
                      aria-hidden
                    />
                    <span>{stage.label}</span>
                  </button>
                ))}
              </div>,
              document.body,
            )
          : null}
      </article>
    );
  },
);
