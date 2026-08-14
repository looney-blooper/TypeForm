"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { FormListItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { FormCard } from "@/components/dashboard/FormCard";
import { DeleteFormModal } from "@/components/dashboard/DeleteFormModal";

export default function DashboardPage() {
  const [forms, setForms] = useState<FormListItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);
  const router = useRouter();
  const toast = useToast();

  const load = () => api.listForms().then(setForms).catch(() => toast.show("Failed to load forms", "error"));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const form = await api.createForm("Untitled Form");
      router.push(`/builder/${form.id}`);
    } catch {
      toast.show("Couldn't create form", "error");
      setCreating(false);
    }
  }

  async function handleDuplicate(id: number) {
    try {
      await api.duplicateForm(id);
      toast.show("Form duplicated");
      load();
    } catch {
      toast.show("Couldn't duplicate form", "error");
    }
  }

  async function handleTogglePublish(id: number, status: FormListItem["status"]) {
    try {
      if (status === "published") {
        await api.unpublishForm(id);
        toast.show("Form unpublished");
      } else {
        await api.publishForm(id);
        toast.show("Form published");
      }
      load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Couldn't update form";
      toast.show(message, "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteForm(deleteTarget.id);
      toast.show("Form deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.show("Couldn't delete form", "error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg">My forms</h1>
        <Button onClick={handleCreate} disabled={creating}>
          + Create form
        </Button>
      </div>

      {forms === null ? (
        <p className="text-sm text-fg-muted">Loading…</p>
      ) : forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-fg-muted">No forms yet.</p>
          <Button className="mt-4" onClick={handleCreate}>
            Create your first form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <FormCard
              key={f.id}
              form={f}
              onDuplicate={handleDuplicate}
              onDelete={() => setDeleteTarget(f)}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      )}

      <DeleteFormModal
        open={!!deleteTarget}
        formTitle={deleteTarget?.title ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
