import type { FormStats } from "@/lib/types";

export function StatsSummary({ stats }: { stats: FormStats }) {
  return (
    <div className="mb-8 grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-xs text-fg-muted">Total responses</p>
        <p className="text-2xl font-semibold">{stats.total_responses}</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-xs text-fg-muted">Completed</p>
        <p className="text-2xl font-semibold">{stats.completed_responses}</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-xs text-fg-muted">Completion rate</p>
        <p className="text-2xl font-semibold">{Math.round(stats.completion_rate * 100)}%</p>
      </div>
    </div>
  );
}

export function QuestionStatsList({ stats }: { stats: FormStats }) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Summary by question</h2>
      {stats.questions.map((q) => (
        <div key={q.question_id} className="rounded-xl border border-border bg-white p-4">
          <p className="mb-1 text-sm font-medium">{q.question_title}</p>
          <p className="mb-2 text-xs text-fg-muted">{q.response_count} answered</p>
          {Object.keys(q.summary).length === 0 ? (
            <p className="text-xs text-fg-muted">No numeric summary for this question type.</p>
          ) : (
            <div className="flex flex-wrap gap-3 text-sm">
              {Object.entries(q.summary).map(([key, val]) => (
                <span key={key} className="rounded-full bg-surface px-3 py-1">
                  {key}: {typeof val === "number" ? Math.round(val * 100) / 100 : String(val)}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
