"use client";

import Link from "next/link";
import type { FormDetail } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";

export function BuilderTopBar({
  form,
  saving,
  onTitleChange,
  onTogglePublish,
}: {
  form: FormDetail;
  saving: boolean;
  onTitleChange: (title: string) => void;
  onTogglePublish: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-fg-muted hover:text-fg" aria-label="Back to dashboard">
          ←
        </Link>
        <input
          className="w-64 rounded-md px-2 py-1 text-sm font-medium outline-none hover:bg-surface focus:bg-surface"
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <Pill tone={form.status === "published" ? "success" : "neutral"}>{form.status}</Pill>
        <span className="text-xs text-fg-muted">{saving ? "Saving…" : "Saved"}</span>
      </div>
      <div className="flex items-center gap-2">
        {form.status === "published" && (
          <Link
            href={`/f/${form.slug}`}
            target="_blank"
            className="text-sm text-fg-muted hover:text-fg"
          >
            View live →
          </Link>
        )}
        <Button variant="secondary" onClick={onTogglePublish}>
          {form.status === "published" ? "Unpublish" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
