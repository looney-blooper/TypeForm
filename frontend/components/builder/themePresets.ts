import type { FormTheme } from "@/lib/types";

export interface ThemePreset {
  id: string;
  name: string;
  theme: FormTheme;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "Classic",
    theme: {
      font: "Inter",
      roundedCorners: "small",
      colors: { question: "#191919", answer: "#191919", button: "#191919", background: "#FFFFFF" },
      background: { layout: "none", imageUrl: null, brightness: 0 },
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    theme: {
      font: "Inter",
      roundedCorners: "small",
      colors: { question: "#FFFFFF", answer: "#FFFFFF", button: "#FFFFFF", background: "#191919" },
      background: { layout: "none", imageUrl: null, brightness: 0 },
    },
  },
  {
    id: "coral",
    name: "Coral",
    theme: {
      font: "Inter",
      roundedCorners: "large",
      colors: { question: "#7A2E1F", answer: "#7A2E1F", button: "#E8543D", background: "#FFF4F0" },
      background: { layout: "none", imageUrl: null, brightness: 0 },
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    theme: {
      font: "Inter",
      roundedCorners: "large",
      colors: { question: "#0F2C4C", answer: "#0F2C4C", button: "#1E6FD9", background: "#F0F7FF" },
      background: { layout: "none", imageUrl: null, brightness: 0 },
    },
  },
];

export function findPresetId(theme: FormTheme | undefined): string | null {
  if (!theme?.colors) return null;
  const match = THEME_PRESETS.find(
    (p) =>
      p.theme.colors?.background === theme.colors?.background &&
      p.theme.colors?.button === theme.colors?.button
  );
  return match?.id ?? null;
}
