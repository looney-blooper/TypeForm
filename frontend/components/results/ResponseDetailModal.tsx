"use client";

import type { Question, ResponseDetail } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

function formatValue(value: unknown, question?: Question): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    if (!question?.settings.choices) return value.join(", ");
    const labels = value.map(
      (id) => question.settings.choices?.find((c) => c.id === id)?.label ?? String(id)
    );
    return labels.join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (question?.settings.choices) {
    return question.settings.choices.find((c) => c.id === value)?.label ?? String(value);
  }
  return String(value);
}

export function ResponseDetailModal({
  open,
  onClose,
  response,
  questions,
}: {
  open: boolean;
  onClose: () => void;
  response: ResponseDetail | null;
  questions: Question[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Response detail">
      {response && (
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {questions.map((q) => {
            const answer = response.answers.find((a) => a.question_id === q.id);
            return (
              <div key={q.id}>
                <p className="text-xs font-medium text-fg-muted">{q.title}</p>
                <p className="text-sm">{formatValue(answer?.value, q)}</p>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
