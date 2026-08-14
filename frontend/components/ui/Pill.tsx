export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "bg-surface text-fg-muted",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses}`}>
      {children}
    </span>
  );
}
