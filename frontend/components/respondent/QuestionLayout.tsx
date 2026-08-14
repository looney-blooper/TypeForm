import type { ReactNode } from "react";
import type { QuestionSettings } from "@/lib/types";

export function QuestionLayout({
  media,
  children,
  className = "",
}: {
  media?: QuestionSettings["media"];
  children: ReactNode;
  className?: string;
}) {
  const m = media as { url?: string; layout?: string } | undefined;

  if (!m?.url) {
    return <div className={className}>{children}</div>;
  }

  if (m.layout === "split-right" || m.layout === "split-left") {
    const imageFirst = m.layout === "split-left";
    return (
      <div className={`grid w-full items-center gap-8 md:grid-cols-2 ${className}`}>
        {imageFirst && (
          <img src={m.url} alt="" className="h-48 w-full rounded-xl object-cover md:h-80" />
        )}
        <div className="flex flex-col justify-center">{children}</div>
        {!imageFirst && (
          <img src={m.url} alt="" className="h-48 w-full rounded-xl object-cover md:h-80" />
        )}
      </div>
    );
  }

  if (m.layout === "fullscreen") {
    return (
      <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
        <img src={m.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative p-8 text-white [&_.question-title]:text-white [&_input]:text-white [&_textarea]:text-white [&_input]:border-white/50 [&_textarea]:border-white/50">
          {children}
        </div>
      </div>
    );
  }

  // float
  return (
    <div className={className}>
      <img src={m.url} alt="" className="mb-6 h-40 w-full rounded-xl object-cover" />
      {children}
    </div>
  );
}
