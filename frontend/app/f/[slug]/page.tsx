"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PublicForm } from "@/lib/types";
import { isAnswerValid } from "@/lib/validateAnswer";
import { ProgressBar } from "@/components/respondent/ProgressBar";
import { QuestionSlide } from "@/components/respondent/QuestionSlide";
import { QuestionRenderer } from "@/components/respondent/QuestionRenderer";
import { QuestionLayout } from "@/components/respondent/QuestionLayout";
import { ThemedBackground } from "@/components/respondent/ThemedBackground";
import { OkButton } from "@/components/respondent/OkButton";
import { WelcomeScreen } from "@/components/respondent/WelcomeScreen";
import { ThankYouScreen } from "@/components/respondent/ThankYouScreen";

type Phase = "loading" | "welcome" | "filling" | "submitting" | "done" | "not_found";

export default function RespondentFlowPage() {
  const { slug } = useParams<{ slug: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [form, setForm] = useState<PublicForm | null>(null);
  const [responseId, setResponseId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicForm(slug)
      .then((f) => {
        setForm(f);
        setPhase("welcome");
      })
      .catch(() => setPhase("not_found"));
  }, [slug]);

  const theme = form?.theme;
  const questionColor = theme?.colors?.question || "#191919";
  const buttonColor = theme?.colors?.button || "#191919";

  const currentQuestion = form?.questions[index] ?? null;
  const progress = form && form.questions.length > 0 ? index / form.questions.length : 0;

  async function handleStart() {
    if (!form) return;
    try {
      const { response_id } = await api.startResponse(slug);
      setResponseId(response_id);
      setPhase("filling");
    } catch {
      setError("Couldn't start this form. Please try again.");
    }
  }

  const goNext = useCallback(async () => {
    if (!form || !currentQuestion || responseId === null) return;
    const value = answers[currentQuestion.id];
    const check = isAnswerValid(currentQuestion, value);
    if (!check.valid) {
      setError(check.error ?? "Please check your answer");
      return;
    }
    setError(null);

    // save-as-you-go, fire and forget (don't block navigation on network latency)
    if (value !== undefined && value !== null && value !== "") {
      api.saveAnswers(responseId, [{ question_id: currentQuestion.id, value }]).catch(() => {});
    }

    const isLast = index === form.questions.length - 1;
    if (isLast) {
      setPhase("submitting");
      try {
        const finalAnswers = form.questions
          .filter((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "")
          .map((q) => ({ question_id: q.id, value: answers[q.id] }));
        await api.submitResponse(responseId, finalAnswers);
        setPhase("done");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Couldn't submit. Please try again.");
        setPhase("filling");
      }
    } else {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  }, [form, currentQuestion, responseId, answers, index]);

  function goBack() {
    if (index === 0) return;
    setError(null);
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  // Keyboard navigation: Enter to advance, Shift+Enter / ArrowUp to go back
  useEffect(() => {
    if (phase !== "filling") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && !e.shiftKey) {
        // avoid double-advance while typing in a textarea with default Enter behavior
        if ((e.target as HTMLElement)?.tagName === "TEXTAREA" && !e.metaKey && !e.ctrlKey) return;
        e.preventDefault();
        goNext();
      } else if ((e.key === "Enter" && e.shiftKey) || e.key === "ArrowUp") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, goNext]);

  if (phase === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-fg-muted">Loading…</div>;
  }

  if (phase === "not_found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-xl font-semibold">This form isn&apos;t available</h1>
        <p className="text-sm text-fg-muted">It may be unpublished or the link is incorrect.</p>
      </div>
    );
  }

  if (!form) return null;

  if (phase === "welcome") {
    return <WelcomeScreen form={form} onStart={handleStart} />;
  }

  if (phase === "done") {
    return <ThankYouScreen message={form.thank_you_message} />;
  }

  return (
    <ThemedBackground theme={theme}>
      <ProgressBar progress={phase === "submitting" ? 1 : progress} color={buttonColor} />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        {currentQuestion && (
          <QuestionSlide slideKey={currentQuestion.id} direction={direction}>
            <QuestionLayout media={currentQuestion.settings.media}>
              <div>
                <p className="mb-2 text-sm font-medium text-fg-muted">
                  {index + 1} → {form.questions.length}
                </p>
                {currentQuestion.description && (
                  <p className="mb-1 text-sm text-fg-muted">{currentQuestion.description}</p>
                )}
                <h2 className="question-title mb-8" style={{ color: questionColor }}>
                  {currentQuestion.title}
                  {currentQuestion.required && <span className="ml-1 text-danger">*</span>}
                </h2>
                <QuestionRenderer
                  question={currentQuestion}
                  value={answers[currentQuestion.id]}
                  onChange={(v) => {
                    setError(null);
                    setAnswers((a) => ({ ...a, [currentQuestion.id]: v }));
                  }}
                />
                {error && <p className="mt-3 text-sm text-danger">{error}</p>}
                <div className="flex items-center gap-3">
                  <OkButton onClick={goNext} disabled={phase === "submitting"} />
                  {index > 0 && (
                    <button
                      onClick={goBack}
                      className="mt-6 text-sm text-fg-muted hover:text-fg"
                      aria-label="Previous question"
                    >
                      ↑ Back
                    </button>
                  )}
                </div>
              </div>
            </QuestionLayout>
          </QuestionSlide>
        )}
      </div>
    </ThemedBackground>
  );
}
