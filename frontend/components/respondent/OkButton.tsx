export function OkButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex h-11 items-center gap-2 rounded-lg bg-fg px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        OK
        <span aria-hidden>↵</span>
      </button>
      <span className="text-xs text-fg-muted">press Enter ↵</span>
    </div>
  );
}
