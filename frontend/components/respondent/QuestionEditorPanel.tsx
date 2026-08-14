"use client";

import type { Question, QuestionUpdate, Choice } from "@/lib/types";
import { QUESTION_TYPE_META } from "./questionTypes";

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export function QuestionEditorPanel({
  question,
  onChange,
  onDelete,
}: {
  question: Question;
  onChange: (update: QuestionUpdate) => void;
  onDelete: () => void;
}) {
  const choices = question.settings.choices ?? [];
  const hasChoices = question.type === "multiple_choice" || question.type === "dropdown";

  function updateChoices(next: Choice[]) {
    onChange({ settings: { ...question.settings, choices: next } });
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
          {QUESTION_TYPE_META[question.type].label}
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg-muted">Question</span>
        <input
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-fg"
          value={question.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Type your question…"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg-muted">Description (optional)</span>
        <textarea
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-fg"
          rows={2}
          value={question.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value || null })}
          placeholder="Add help text…"
        />
      </label>

      <label className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">Required</span>
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={question.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
      </label>

      {question.type === "multiple_choice" && (
        <label className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Allow multiple selections</span>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!question.settings.allowMultiple}
            onChange={(e) =>
              onChange({ settings: { ...question.settings, allowMultiple: e.target.checked } })
            }
          />
        </label>
      )}

      {question.type === "rating" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Max rating</span>
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={(question.settings.max as number) ?? 5}
            onChange={(e) => onChange({ settings: { ...question.settings, max: Number(e.target.value) } })}
          >
            {[3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      {hasChoices && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-fg-muted">Choices</span>
          {choices.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-fg"
                value={c.label}
                onChange={(e) => {
                  const next = [...choices];
                  next[i] = { ...c, label: e.target.value };
                  updateChoices(next);
                }}
              />
              <button
                type="button"
                className="text-fg-muted hover:text-danger"
                onClick={() => updateChoices(choices.filter((_, idx) => idx !== i))}
                aria-label="Remove choice"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="self-start text-sm text-fg-muted hover:text-fg"
            onClick={() => updateChoices([...choices, { id: uid(), label: `Option ${choices.length + 1}` }])}
          >
            + Add choice
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="mt-auto self-start text-sm text-danger hover:underline"
      >
        Delete question
      </button>
    </div>
  );
}
