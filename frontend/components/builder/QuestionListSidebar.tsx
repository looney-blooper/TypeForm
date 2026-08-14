"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Question } from "@/lib/types";
import { QUESTION_TYPE_META } from "./questionTypes";

function SortableRow({
  question,
  index,
  selected,
  onSelect,
}: {
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = QUESTION_TYPE_META[question.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        selected ? "border-fg bg-white shadow-sm" : "border-transparent hover:bg-white/60"
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab select-none text-fg-muted active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        ⠿
      </span>
      <span className="w-5 text-center text-fg-muted">{meta.icon}</span>
      <span className="w-5 text-xs text-fg-muted">{index + 1}</span>
      <span className="flex-1 truncate">{question.title || "Untitled question"}</span>
    </div>
  );
}

export function QuestionListSidebar({
  questions,
  selectedId,
  onSelect,
  onReorder,
}: {
  questions: Question[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReorder: (newOrder: Question[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    onReorder(arrayMove(questions, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
          {questions.map((q, i) => (
            <SortableRow
              key={q.id}
              question={q}
              index={i}
              selected={q.id === selectedId}
              onSelect={() => onSelect(q.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
