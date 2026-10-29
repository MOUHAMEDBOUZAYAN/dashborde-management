import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
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
import type { PipelineLead } from "@/types";

type PipelineLeadCardProps = {
  lead: PipelineLead;
  onOpen?: () => void;
  dragging?: boolean;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "style">;

export const PipelineLeadCard = forwardRef<HTMLElement, PipelineLeadCardProps>(
  function PipelineLeadCard(
    { lead, onOpen, dragging = false, style, ...rest },
    ref,
  ) {
    const initials = initialsFromName(lead.name);
    const relative = formatRelativeFr(lead.date);
    const when = formatLeadDateTimeFr(lead.date);

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
        className="cursor-grab rounded-2xl border px-3 py-3 touch-none active:cursor-grabbing"
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
              <span
                className="mt-0.5 inline-flex shrink-0 opacity-55"
                style={{ color: "var(--dash-muted)" }}
                aria-hidden
              >
                <IconSwap className="h-3.5 w-3.5" />
              </span>
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
      </article>
    );
  },
);
