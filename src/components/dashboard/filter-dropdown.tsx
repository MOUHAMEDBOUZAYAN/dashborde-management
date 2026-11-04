"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@/components/layout/nav-icons";

export type FilterOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  ariaLabel: string;
};

export function FilterDropdown({
  value,
  onChange,
  options,
  ariaLabel,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 max-w-[min(72vw,240px)] items-center gap-2 rounded-full border px-3 text-sm font-medium outline-none sm:max-w-[240px] sm:px-3.5"
        style={{
          backgroundColor: "transparent",
          borderColor: "var(--dash-border)",
          color: "var(--dash-text)",
        }}
      >
        <span className="truncate">{selected?.label}</span>
        <IconChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+6px)] left-0 z-30 overflow-hidden rounded-2xl border p-1.5"
          style={{
            backgroundColor: "var(--dash-surface)",
            borderColor: "var(--dash-border)",
            boxShadow: "0 12px 32px rgba(28, 24, 20, 0.14)",
            minWidth: "max(100%, 210px)",
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className="filter-dropdown-item flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors"
                  style={{ color: "var(--dash-text)" }}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                    {isSelected ? <IconCheck className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
