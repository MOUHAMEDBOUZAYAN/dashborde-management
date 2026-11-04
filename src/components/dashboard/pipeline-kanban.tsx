"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { PipelineLeadCard } from "@/components/dashboard/pipeline-lead-card";
import { PIPELINE_STAGES } from "@/lib/pipeline-api";
import type { PipelineLead, PipelineStage, PipelineStageId } from "@/types";

type PipelineKanbanProps = {
  leads: PipelineLead[];
  onLeadOpen: (lead: PipelineLead) => void;
  onStageChange: (leadId: string, stage: PipelineStageId) => void;
};

export function PipelineKanban({
  leads,
  onLeadOpen,
  onStageChange,
}: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeId) ?? null,
    [activeId, leads],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = String(active.id);
    const fromStage = active.data.current?.stage as PipelineStageId | undefined;
    const toStage = String(over.id) as PipelineStageId;

    if (!fromStage || fromStage === toStage) return;
    if (!PIPELINE_STAGES.some((stage) => stage.id === toStage)) return;

    onStageChange(leadId, toStage);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="dash-h-scroll flex min-h-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] sm:gap-3 sm:snap-none">
          {PIPELINE_STAGES.map((stage) => {
            const columnLeads = leads.filter((lead) => lead.stage === stage.id);
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={columnLeads}
                activeId={activeId}
                onLeadOpen={onLeadOpen}
                onStageChange={onStageChange}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="w-[min(78vw,260px)] sm:w-[260px]">
            <PipelineLeadCard lead={activeLead} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  leads,
  activeId,
  onLeadOpen,
  onStageChange,
}: {
  stage: PipelineStage;
  leads: PipelineLead[];
  activeId: string | null;
  onLeadOpen: (lead: PipelineLead) => void;
  onStageChange: (leadId: string, stage: PipelineStageId) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage: stage.id },
  });

  return (
    <section
      ref={setNodeRef}
      className="pipeline-column relative flex h-full w-[min(78vw,240px)] shrink-0 snap-start flex-col overflow-hidden rounded-[16px] sm:w-[260px] sm:snap-align-none xl:w-[280px]"
      style={
        {
          "--col-tint": stage.tint,
          "--col-tint-dark": stage.tintDark,
          "--col-accent": stage.color,
          backgroundColor: isOver
            ? `color-mix(in srgb, ${stage.color} 18%, var(--col-tint))`
            : "var(--col-tint)",
          borderTop: `5px solid ${stage.color}`,
          boxShadow: isOver
            ? `inset 0 0 0 2px color-mix(in srgb, ${stage.color} 40%, transparent)`
            : "none",
          transition: "background-color 120ms ease, box-shadow 120ms ease",
        } as CSSProperties
      }
    >
      <header className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-2.5 sm:px-3.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: stage.color }}
          aria-hidden
        />
        <h2
          className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight"
          style={{ color: "var(--dash-text)" }}
        >
          {stage.label}
        </h2>
        <span
          className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums"
          style={{
            backgroundColor: `color-mix(in srgb, ${stage.color} 16%, var(--dash-surface))`,
            color: "var(--dash-text)",
            border: `1px solid color-mix(in srgb, ${stage.color} 22%, transparent)`,
          }}
        >
          {leads.length}
        </span>
      </header>

      <div className="dash-v-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-y-contain px-2 pb-3 [-webkit-overflow-scrolling:touch] sm:px-2.5">
        {leads.length === 0 ? (
          <p
            className="flex flex-1 items-center justify-center px-2 pb-8 text-center text-xs"
            style={{ color: "var(--dash-muted)" }}
          >
            Aucun lead
          </p>
        ) : (
          leads.map((lead) => (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              isActive={activeId === lead.id}
              onOpen={() => onLeadOpen(lead)}
              onStageChange={(nextStage) => onStageChange(lead.id, nextStage)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DraggableLeadCard({
  lead,
  isActive,
  onOpen,
  onStageChange,
}: {
  lead: PipelineLead;
  isActive: boolean;
  onOpen: () => void;
  onStageChange: (stage: PipelineStageId) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage, lead },
  });

  return (
    <PipelineLeadCard
      ref={setNodeRef}
      lead={lead}
      dragging={isActive || isDragging}
      onOpen={onOpen}
      onStageChange={onStageChange}
      style={
        isDragging
          ? { opacity: 0.25, boxShadow: "none", transform: "none" }
          : undefined
      }
      {...listeners}
      {...attributes}
    />
  );
}
