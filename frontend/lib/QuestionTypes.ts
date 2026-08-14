import type { QuestionType } from "@/lib/types";

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: string }> = {
  short_text: { label: "Short Text", icon: "—" },
  long_text: { label: "Long Text", icon: "≡" },
  multiple_choice: { label: "Multiple Choice", icon: "☰" },
  dropdown: { label: "Dropdown", icon: "▾" },
  email: { label: "Email", icon: "@" },
  number: { label: "Number", icon: "#" },
  yes_no: { label: "Yes/No", icon: "✓" },
  rating: { label: "Rating", icon: "★" },
};

export const QUESTION_TYPES: QuestionType[] = Object.keys(QUESTION_TYPE_META) as QuestionType[];

export function defaultSettingsFor(type: QuestionType) {
  if (type === "multiple_choice" || type === "dropdown") {
    return {
      choices: [
        { id: "a", label: "Option 1" },
        { id: "b", label: "Option 2" },
      ],
      ...(type === "multiple_choice" ? { allowMultiple: false } : {}),
    };
  }
  if (type === "rating") return { max: 5 };
  return {};
}
