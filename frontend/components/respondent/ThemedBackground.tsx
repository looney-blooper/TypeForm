import type { ReactNode } from "react";
import type { FormTheme } from "@/lib/types";

export function ThemedBackground({ theme, children }: { theme?: FormTheme; children: ReactNode }) {
  const bg = theme?.background;
  const bgColor = theme?.colors?.background || "#ffffff";

  if (bg?.layout === "fullscreen" && bg.imageUrl) {
    const overlayOpacity = Math.min(1, Math.max(0, (bg.brightness ?? 0) * -1));
    return (
      <div className="relative min-h-screen">
        <img src={bg.imageUrl} alt="" className="fixed inset-0 h-full w-full object-cover" />
        <div className="fixed inset-0 bg-black" style={{ opacity: overlayOpacity }} />
        <div className="relative min-h-screen">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {children}
    </div>
  );
}
