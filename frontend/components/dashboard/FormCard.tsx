"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormListItem } from "@/lib/types";
import { Pill } from "@/components/ui/Pill";
import { MoreHorizontalIcon, ExternalLinkIcon } from "@/components/ui/icons";

// Shared style for the small round icon buttons that float over the card
// thumbnail — always visible (not hover-only) with a solid white backing
// and a border/shadow, so they read clearly against any thumbnail color.
const iconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-fg-muted shadow-sm transition-colors hover:border-fg/30 hover:text-fg hover:shadow";

export function FormCard({
  form,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: {
  form: FormListItem;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePublish: (id: number, status: FormListItem["status"]) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-md">
      <Link href={`/builder/${form.id}`} className="block">
        <div className="mb-3 h-24 overflow-hidden rounded-lg bg-surface">
          {form.cover_image_url ? (
            <img src={form.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-fg-muted/40">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 15l4.5-4.5a1.5 1.5 0 012.12 0L14 15" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 14l1.5-1.5a1.5 1.5 0 012.12 0L21 16" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="8.5" r="1.5" />
              </svg>
            </div>
          )}
        </div>
        <h3 className="truncate pr-16 font-semibold text-fg">{form.title}</h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
          <Pill tone={form.status === "published" ? "success" : "neutral"}>
            {form.status}
          </Pill>
          <span>
            {form.response_count} response{form.response_count === 1 ? "" : "s"}
          </span>
        </div>
      </Link>

      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {form.status === "published" && (
          <Link
            href={`/f/${form.slug}`}
            target="_blank"
            aria-label="Open live form"
            title="Open live form"
            className={iconButtonClass}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLinkIcon />
          </Link>
        )}

        <button
          aria-label="More options"
          title="More options"
          className={iconButtonClass}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          <MoreHorizontalIcon />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-9 z-10 w-40 rounded-lg border border-border bg-white py-1 shadow-lg"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-surface"
              onClick={() => {
                onTogglePublish(form.id, form.status);
                setMenuOpen(false);
              }}
            >
              {form.status === "published" ? "Unpublish" : "Publish"}
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-surface"
              onClick={() => {
                onDuplicate(form.id);
                setMenuOpen(false);
              }}
            >
              Duplicate
            </button>
            {form.status === "published" && (
              <Link
                href={`/results/${form.id}`}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface"
              >
                View results
              </Link>
            )}
            <button
              className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-surface"
              onClick={() => {
                onDelete(form.id);
                setMenuOpen(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
