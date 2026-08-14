"use client";

import type { Question } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Props {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  /** preview = rendered inside the builder's live-preview canvas, non-interactive-ish but still shows state */
  mode?: "fill" | "preview";
}

export function QuestionRenderer({ question, value, onChange, mode = "fill" }: Props) {
  const inputBaseClass =
    "w-full border-b-2 border-border bg-transparent pb-2 text-xl outline-none focus:border-fg transition-colors placeholder:text-fg-muted/50";

  switch (question.type) {
    case "short_text":
    case "email":
      return (
        <input
          type={question.type === "email" ? "email" : "text"}
          className={inputBaseClass}
          placeholder="Type your answer here…"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={mode === "fill"}
        />
      );

    case "long_text":
      return (
        <textarea
          className={`${inputBaseClass} resize-none`}
          rows={3}
          placeholder="Type your answer here…"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={mode === "fill"}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className={inputBaseClass}
          placeholder="Type a number…"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          autoFocus={mode === "fill"}
        />
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          {[
            { label: "Yes", val: true },
            { label: "No", val: false },
          ].map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.val)}
              className={`flex items-center gap-2 rounded-lg border-2 px-5 py-3 text-left transition-colors ${
                value === opt.val ? "border-fg bg-fg text-white" : "border-border hover:border-fg/40"
              }`}
            >
              <span className="rounded border border-current px-1.5 text-xs">{LETTERS[i]}</span>
              {opt.label}
            </button>
          ))}
        </div>
      );

    case "rating": {
      const max = (question.settings.max as number) ?? 5;
      const current = (value as number) ?? 0;
      return (
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`Rate ${n} out of ${max}`}
              className={`text-3xl transition-colors ${n <= current ? "text-fg" : "text-border"}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    }

    case "dropdown": {
      const choices = question.settings.choices ?? [];
      return (
        <select
          className={`${inputBaseClass} cursor-pointer`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Select an option…
          </option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      );
    }

    case "multiple_choice": {
      const choices = question.settings.choices ?? [];
      const allowMultiple = !!question.settings.allowMultiple;
      const selected: string[] = allowMultiple
        ? ((value as string[]) ?? [])
        : value
          ? [value as string]
          : [];

      function toggle(choiceId: string) {
        if (allowMultiple) {
          const next = selected.includes(choiceId)
            ? selected.filter((c) => c !== choiceId)
            : [...selected, choiceId];
          onChange(next);
        } else {
          onChange(choiceId);
        }
      }

      return (
        <div className="flex flex-col gap-2">
          {choices.map((c, i) => {
            const isSelected = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  isSelected ? "border-fg bg-fg text-white" : "border-border hover:border-fg/40"
                }`}
              >
                <span className="rounded border border-current px-1.5 text-xs">{LETTERS[i] ?? i + 1}</span>
                <span className="flex-1">{c.label}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}
