"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { FormDetail, FormTheme, Question, QuestionType, QuestionUpdate } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { QuestionListSidebar } from "@/components/builder/QuestionListSidebar";
import { QuestionTypePicker } from "@/components/builder/QuestionTypePicker";
import { QuestionEditorPanel } from "@/components/builder/QuestionEditorPanel";
import { LivePreviewCanvas } from "@/components/builder/LivePreviewCanvas";
import { ThemeGallery } from "@/components/builder/ThemeGallery";
import { FormMetaEditor } from "@/components/builder/FormMetaEditor";
import { ComingSoon } from "@/components/builder/ComingSoon";
import { defaultSettingsFor, QUESTION_TYPE_META } from "@/components/builder/questionTypes";

export default function BuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const id = Number(formId);
  const toast = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [rightTab, setRightTab] = useState<"content" | "design" | "logic">("content");

  useEffect(() => {
    api
      .getForm(id)
      .then((f) => {
        setForm(f);
        setSelectedId(f.questions[0]?.id ?? null);
      })
      .catch(() => toast.show("Couldn't load form", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const debouncedSaveTitle = useDebouncedCallback(async (title: string) => {
    setSaving(true);
    try {
      await api.updateForm(id, { title });
    } catch {
      toast.show("Couldn't save title", "error");
    } finally {
      setSaving(false);
    }
  }, 600);

  function handleTitleChange(title: string) {
    setForm((f) => (f ? { ...f, title } : f));
    debouncedSaveTitle(title);
  }

  const debouncedSaveTheme = useDebouncedCallback(async (theme: FormTheme) => {
    setSaving(true);
    try {
      await api.updateForm(id, { theme });
    } catch {
      toast.show("Couldn't save theme", "error");
    } finally {
      setSaving(false);
    }
  }, 500);

  function handleThemeChange(theme: FormTheme) {
    setForm((f) => (f ? { ...f, theme } : f));
    debouncedSaveTheme(theme);
  }

  const debouncedSaveMeta = useDebouncedCallback(
    async (update: { description?: string; thank_you_message?: string }) => {
      setSaving(true);
      try {
        await api.updateForm(id, update);
      } catch {
        toast.show("Couldn't save", "error");
      } finally {
        setSaving(false);
      }
    },
    500
  );

  async function handleAddQuestion(type: QuestionType) {
    if (!form) return;
    try {
      const q = await api.addQuestion(form.id, {
        type,
        title: `New ${QUESTION_TYPE_META[type].label} Question`,
        required: false,
        settings: defaultSettingsFor(type),
      });
      setForm((f) => (f ? { ...f, questions: [...f.questions, q] } : f));
      setSelectedId(q.id);
    } catch {
      toast.show("Couldn't add question", "error");
    }
  }

  const debouncedSaveQuestion = useDebouncedCallback(
    async (questionId: number, update: QuestionUpdate) => {
      try {
        await api.updateQuestion(questionId, update);
      } catch {
        toast.show("Couldn't save question", "error");
      }
    },
    500
  );

  const handleUpdateQuestion = useCallback(
    (questionId: number, update: QuestionUpdate) => {
      setForm((f) =>
        f
          ? {
              ...f,
              questions: f.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      ...update,
                      // Callers always pass the FULL desired settings object (built from
                      // current state), so replace rather than merge — a shallow merge
                      // can't express removing a key (e.g. clearing a question's image).
                      settings: update.settings ?? q.settings,
                    }
                  : q
              ),
            }
          : f
      );
      debouncedSaveQuestion(questionId, update);
    },
    [debouncedSaveQuestion]
  );

  async function handleDeleteQuestion(questionId: number) {
    if (!form) return;
    try {
      await api.deleteQuestion(questionId);
      const remaining = form.questions.filter((q) => q.id !== questionId);
      setForm({ ...form, questions: remaining });
      setSelectedId(remaining[0]?.id ?? null);
    } catch {
      toast.show("Couldn't delete question", "error");
    }
  }

  async function handleReorder(newOrder: Question[]) {
    if (!form) return;
    // optimistic update
    setForm({ ...form, questions: newOrder });
    try {
      const saved = await api.reorderQuestions(
        form.id,
        newOrder.map((q, i) => ({ id: q.id, order_index: i }))
      );
      setForm((f) => (f ? { ...f, questions: saved } : f));
    } catch {
      toast.show("Couldn't save new order", "error");
    }
  }

  async function handleTogglePublish() {
    if (!form) return;
    try {
      const updated =
        form.status === "published" ? await api.unpublishForm(form.id) : await api.publishForm(form.id);
      setForm(updated);
      toast.show(updated.status === "published" ? "Form published!" : "Form unpublished");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Couldn't update publish status";
      toast.show(message, "error");
    }
  }

  if (!form) {
    return <div className="p-8 text-sm text-fg-muted">Loading…</div>;
  }

  const selectedQuestion = form.questions.find((q) => q.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col">
      <BuilderTopBar
        form={form}
        saving={saving}
        onTitleChange={handleTitleChange}
        onTogglePublish={handleTogglePublish}
      />
      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        <div className="flex flex-col gap-3 overflow-y-auto border-r border-border bg-surface p-3">
          <QuestionListSidebar
            questions={form.questions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={handleReorder}
          />
          <QuestionTypePicker onPick={handleAddQuestion} />
        </div>

        <LivePreviewCanvas question={selectedQuestion} theme={form.theme} />

        <div className="flex flex-col border-l border-border bg-surface">
          <div className="flex border-b border-border">
            <button
              className={`flex-1 py-2.5 text-sm font-medium ${
                rightTab === "content" ? "border-b-2 border-fg text-fg" : "text-fg-muted"
              }`}
              onClick={() => setRightTab("content")}
            >
              Content
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium ${
                rightTab === "design" ? "border-b-2 border-fg text-fg" : "text-fg-muted"
              }`}
              onClick={() => setRightTab("design")}
            >
              Design
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium ${
                rightTab === "logic" ? "border-b-2 border-fg text-fg" : "text-fg-muted"
              }`}
              onClick={() => setRightTab("logic")}
            >
              Logic
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightTab === "logic" ? (
              <ComingSoon
                title="Logic jumps"
                description="Branch to different questions based on prior answers. Not part of this build's core scope."
              />
            ) : rightTab === "design" ? (
              <>
                <FormMetaEditor
                  description={form.description}
                  thankYouMessage={form.thank_you_message}
                  onChangeDescription={(description) => {
                    setForm((f) => (f ? { ...f, description } : f));
                    debouncedSaveMeta({ description });
                  }}
                  onChangeThankYou={(thank_you_message) => {
                    setForm((f) => (f ? { ...f, thank_you_message } : f));
                    debouncedSaveMeta({ thank_you_message });
                  }}
                />
                <ThemeGallery theme={form.theme} onChange={handleThemeChange} />
              </>
            ) : selectedQuestion ? (
              <QuestionEditorPanel
                key={selectedQuestion.id}
                question={selectedQuestion}
                onChange={(update) => handleUpdateQuestion(selectedQuestion.id, update)}
                onDelete={() => handleDeleteQuestion(selectedQuestion.id)}
              />
            ) : (
              <div className="p-5 text-sm text-fg-muted">No question selected.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
