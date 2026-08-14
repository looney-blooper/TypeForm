// Mirrors backend/app/schemas.py. Keep these in sync manually — no codegen
// for this project's scope, but the shapes should match 1:1.

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type FormStatus = "draft" | "published";

export interface Choice {
  id: string;
  label: string;
}

export interface QuestionSettings {
  choices?: Choice[];
  allowMultiple?: boolean; // multiple_choice only
  max?: number; // rating
  min?: number; // number
  [key: string]: unknown;
}

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  settings: QuestionSettings;
  logic: Record<string, unknown> | null;
  order_index: number;
}

export interface QuestionCreate {
  type: QuestionType;
  title: string;
  description?: string | null;
  required?: boolean;
  settings?: QuestionSettings;
}

export interface QuestionUpdate {
  type?: QuestionType;
  title?: string;
  description?: string | null;
  required?: boolean;
  settings?: QuestionSettings;
}

export interface FormTheme {
  font?: string;
  roundedCorners?: "none" | "small" | "large";
  colors?: {
    question?: string;
    answer?: string;
    button?: string;
    background?: string;
  };
  background?: {
    layout?: "none" | "fullscreen";
    imageUrl?: string | null;
    brightness?: number;
  };
}

export interface FormListItem {
  id: number;
  title: string;
  status: FormStatus;
  slug: string;
  response_count: number;
  updated_at: string;
  cover_image_url: string | null;
}

export interface FormDetail {
  id: number;
  creator_id: number;
  title: string;
  description: string | null;
  status: FormStatus;
  slug: string;
  theme: FormTheme;
  thank_you_message: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface PublicForm {
  id: number;
  title: string;
  description: string | null;
  theme: FormTheme;
  thank_you_message: string | null;
  questions: Question[];
}

export interface ResponseListItem {
  id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
}

export interface AnswerOut {
  question_id: number;
  value: unknown;
}

export interface ResponseDetail {
  id: number;
  form_id: number;
  started_at: string;
  submitted_at: string | null;
  answers: AnswerOut[];
}

export interface QuestionStat {
  question_id: number;
  question_title: string;
  type: QuestionType;
  response_count: number;
  summary: Record<string, unknown>;
}

export interface FormStats {
  form_id: number;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  questions: QuestionStat[];
}
