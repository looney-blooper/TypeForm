"use client";

import { useState } from "react";
import type { QuestionType } from "@/lib/types";
import { QUESTION_TYPES, QUESTION_TYPE_META } from "./questionTypes";
import { Button } from "@/components/ui/Button";

export function QuestionTypePicker({ onPick }: { onPick: (type: QuestionType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="secondary" className="w-full" onClick={() => setOpen((o) => !o)}>
        + Add question
      </Button>
      {open && (
        <div
          className="absolute left-0 right-0 z-10 mt-1 grid grid-cols-2 gap-1 rounded-lg border border-border bg-white p-2 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {QUESTION_TYPES.map((type) => (
            <button
              key={type}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-surface"
              onClick={() => {
                onPick(type);
                setOpen(false);
              }}
            >
              <span className="w-4 text-center text-fg-muted">{QUESTION_TYPE_META[type].icon}</span>
              {QUESTION_TYPE_META[type].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
