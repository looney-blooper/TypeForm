"use client";

import type { FormTheme } from "@/lib/types";
import { THEME_PRESETS, findPresetId } from "./themePresets";

export function ThemeGallery({
  theme,
  onChange,
}: {
  theme: FormTheme;
  onChange: (theme: FormTheme) => void;
}) {
  const activePreset = findPresetId(theme);
  const colors = theme.colors ?? {};
  const background = theme.background ?? { layout: "none", imageUrl: null, brightness: 0 };

  function setColor(key: "question" | "answer" | "button" | "background", value: string) {
    onChange({ ...theme, colors: { ...colors, [key]: value } });
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Theme presets</p>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange(p.theme)}
              className={`flex flex-col items-start gap-1.5 rounded-lg border-2 p-2.5 text-left transition-colors ${
                activePreset === p.id ? "border-fg" : "border-border hover:border-fg/40"
              }`}
            >
              <div className="flex h-6 w-full overflow-hidden rounded">
                <div className="flex-1" style={{ backgroundColor: p.theme.colors?.background }} />
                <div className="w-3" style={{ backgroundColor: p.theme.colors?.button }} />
              </div>
              <span className="text-xs font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Custom colors</p>
        <div className="flex flex-col gap-2">
          {(["background", "question", "answer", "button"] as const).map((key) => (
            <label key={key} className="flex items-center justify-between text-sm">
              <span className="capitalize text-fg-muted">{key}</span>
              <input
                type="color"
                className="h-7 w-10 cursor-pointer rounded border border-border"
                value={colors[key] || "#191919"}
                onChange={(e) => setColor(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">Rounded corners</span>
        <select
          className="rounded-lg border border-border px-3 py-2 text-sm"
          value={theme.roundedCorners ?? "small"}
          onChange={(e) => onChange({ ...theme, roundedCorners: e.target.value as FormTheme["roundedCorners"] })}
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="large">Large</option>
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Background image</p>
        <input
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-fg"
          placeholder="Image URL (optional)"
          value={background.imageUrl ?? ""}
          onChange={(e) =>
            onChange({
              ...theme,
              background: {
                ...background,
                imageUrl: e.target.value || null,
                layout: e.target.value ? "fullscreen" : "none",
              },
            })
          }
        />
        {background.imageUrl && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-muted">Darken overlay</span>
            <input
              type="range"
              min={-1}
              max={0.5}
              step={0.05}
              value={background.brightness ?? 0}
              onChange={(e) =>
                onChange({ ...theme, background: { ...background, brightness: Number(e.target.value) } })
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}
