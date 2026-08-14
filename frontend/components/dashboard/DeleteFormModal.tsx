"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function DeleteFormModal({
  open,
  formTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  formTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete this form?">
      <p className="text-sm text-fg-muted">
        {`"${formTitle}" and all of its responses will be permanently deleted. This can't be undone.`}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
