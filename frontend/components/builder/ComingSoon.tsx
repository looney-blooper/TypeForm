export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border text-fg-muted">
        ✦
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-xs text-xs text-fg-muted">{description}</p>
      <span className="mt-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-fg-muted">
        Coming soon
      </span>
    </div>
  );
}
