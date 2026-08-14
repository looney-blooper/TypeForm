export function ProgressBar({ progress, color }: { progress: number; color?: string }) {
  return (
    <div className="fixed left-0 right-0 top-0 z-20 h-1 bg-border">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: color || "#191919" }}
      />
    </div>
  );
}
