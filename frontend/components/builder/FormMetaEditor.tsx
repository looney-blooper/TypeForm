"use client";

export function FormMetaEditor({
  description,
  thankYouMessage,
  onChangeDescription,
  onChangeThankYou,
}: {
  description: string | null;
  thankYouMessage: string | null;
  onChangeDescription: (value: string) => void;
  onChangeThankYou: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          Welcome screen description
        </span>
        <textarea
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-fg"
          rows={2}
          placeholder="Shown under the title before respondents start…"
          value={description ?? ""}
          onChange={(e) => onChangeDescription(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          Thank-you message
        </span>
        <textarea
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-fg"
          rows={2}
          placeholder="Shown after a response is submitted…"
          value={thankYouMessage ?? ""}
          onChange={(e) => onChangeThankYou(e.target.value)}
        />
      </label>
    </div>
  );
}
