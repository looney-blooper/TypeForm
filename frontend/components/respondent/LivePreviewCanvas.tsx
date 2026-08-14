"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { QuestionRenderer } from "@/components/respondent/QuestionRenderer";

export function LivePreviewCanvas({ question }: { question: Question | null }) {
  const [previewValue, setPreviewValue] = useState<unknown>(null);

  if (!question) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-fg-muted">
        Select or add a question to preview it here.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-8">
      <div className="w-full max-w-xl">
        <p className="mb-2 text-xs font-medium text-fg-muted">Preview</p>
        {question.description && <p className="mb-1 text-sm text-fg-muted">{question.description}</p>}
        <h2 className="question-title mb-6">
          {question.title || "Untitled question"}
          {question.required && <span className="ml-1 text-danger">*</span>}
        </h2>
        <QuestionRenderer
          question={question}
          value={previewValue}
          onChange={setPreviewValue}
          mode="preview"
        />
      </div>
    </div>
  );
}
