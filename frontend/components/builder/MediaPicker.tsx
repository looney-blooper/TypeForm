"use client";

import type { QuestionSettings } from "@/lib/types";

type MediaLayout = "split-right" | "split-left" | "fullscreen" | "float";

export function MediaPicker({
  settings,
  onChange,
}: {
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
}) {
  const media = settings.media as { url?: string; layout?: MediaLayout } | undefined;

  function setUrl(url: string) {
    if (!url) {
      const { media: _drop, ...rest } = settings;
      void _drop;
      onChange(rest);
      return;
    }
    onChange({ ...settings, media: { url, layout: media?.layout ?? "split-right" } });
  }

  function setLayout(layout: MediaLayout) {
    if (!media?.url) return;
    onChange({ ...settings, media: { ...media, layout } });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">Image</span>
      <input
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-fg"
        placeholder="Image URL (optional)"
        value={media?.url ?? ""}
        onChange={(e) => setUrl(e.target.value)}
      />
      {media?.url && (
        <>
          <img src={media.url} alt="" className="h-24 w-full rounded-lg object-cover" />
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={media.layout ?? "split-right"}
            onChange={(e) => setLayout(e.target.value as MediaLayout)}
          >
            <option value="split-right">Split — image right</option>
            <option value="split-left">Split — image left</option>
            <option value="fullscreen">Fullscreen background</option>
            <option value="float">Float above question</option>
          </select>
        </>
      )}
    </div>
  );
}
