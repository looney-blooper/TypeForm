"use client";

import { useState } from "react";
import type { FormTheme, Question } from "@/lib/types";
import { QuestionRenderer } from "@/components/respondent/QuestionRenderer";
import { QuestionLayout } from "@/components/respondent/QuestionLayout";
import { ThemedBackground } from "@/components/respondent/ThemedBackground";

export function LivePreviewCanvas({ question, theme }: { question: Question | null; theme?: FormTheme }) {
  const [previewValue, setPreviewValue] = useState<unknown>(null);

  if (!question) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-fg-muted">
        Select or add a question to preview it here.
      </div>
    );
  }

  const questionColor = theme?.colors?.question;

  return (
    <div className="h-full overflow-y-auto">
      <ThemedBackground theme={theme}>
        <div className="flex h-full min-h-[600px] flex-col items-center justify-center px-8 py-10">
          <div className="w-full max-w-2xl">
            <p className="mb-2 text-xs font-medium text-fg-muted">Preview</p>
            <QuestionLayout media={question.settings.media}>
              <div>
                {question.description && (
                  <p className="mb-1 text-sm text-fg-muted">{question.description}</p>
                )}
                <h2 className="question-title mb-6" style={{ color: questionColor }}>
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
            </QuestionLayout>
          </div>
        </div>
      </ThemedBackground>
    </div>
  );
}
