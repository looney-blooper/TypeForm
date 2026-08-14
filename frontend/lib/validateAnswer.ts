import type { Question } from "@/lib/types";

export function isAnswerValid(question: Question, value: unknown): { valid: boolean; error?: string } {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (question.required && isEmpty) {
    return { valid: false, error: "This question is required" };
  }
  if (isEmpty) return { valid: true }; // optional + skipped

  if (question.type === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      return { valid: false, error: "Enter a valid email address" };
    }
  }
  if (question.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { valid: false, error: "Enter a valid number" };
    }
  }
  if (question.type === "rating") {
    const max = (question.settings.max as number) ?? 5;
    if (typeof value !== "number" || value < 0 || value > max) {
      return { valid: false, error: `Rate between 0 and ${max}` };
    }
  }
  return { valid: true };
}
