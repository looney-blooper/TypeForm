import type { PublicForm } from "@/lib/types";

export function WelcomeScreen({ form, onStart }: { form: PublicForm; onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="question-title mb-3 max-w-2xl">{form.title}</h1>
      {form.description && <p className="mb-8 max-w-xl text-fg-muted">{form.description}</p>}
      <button
        onClick={onStart}
        className="rounded-full bg-fg px-8 py-3 text-white transition-opacity hover:opacity-90"
      >
        Start
      </button>
      <p className="mt-4 text-xs text-fg-muted">
        {form.questions.length} question{form.questions.length === 1 ? "" : "s"} · press Enter ↵
      </p>
    </div>
  );
}
