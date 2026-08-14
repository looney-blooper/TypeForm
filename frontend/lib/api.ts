import type {
  FormDetail,
  FormListItem,
  FormStats,
  FormTheme,
  PublicForm,
  Question,
  QuestionCreate,
  QuestionUpdate,
  ResponseDetail,
  ResponseListItem,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore body parse failure
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Forms
  listForms: () => request<FormListItem[]>("/api/forms"),
  createForm: (title: string, description?: string) =>
    request<FormDetail>("/api/forms", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }),
  getForm: (id: number) => request<FormDetail>(`/api/forms/${id}`),
  updateForm: (
    id: number,
    body: Partial<{
      title: string;
      description: string;
      theme: FormTheme;
      thank_you_message: string;
    }>
  ) =>
    request<FormDetail>(`/api/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteForm: (id: number) => request<void>(`/api/forms/${id}`, { method: "DELETE" }),
  duplicateForm: (id: number) => request<FormDetail>(`/api/forms/${id}/duplicate`, { method: "POST" }),
  publishForm: (id: number) => request<FormDetail>(`/api/forms/${id}/publish`, { method: "POST" }),
  unpublishForm: (id: number) => request<FormDetail>(`/api/forms/${id}/unpublish`, { method: "POST" }),

  // Questions
  addQuestion: (formId: number, body: QuestionCreate) =>
    request<Question>(`/api/forms/${formId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateQuestion: (questionId: number, body: QuestionUpdate) =>
    request<Question>(`/api/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteQuestion: (questionId: number) =>
    request<void>(`/api/questions/${questionId}`, { method: "DELETE" }),
  reorderQuestions: (formId: number, order: { id: number; order_index: number }[]) =>
    request<Question[]>(`/api/forms/${formId}/questions/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  // Public respondent flow
  getPublicForm: (slug: string) => request<PublicForm>(`/api/public/forms/${slug}`),
  startResponse: (slug: string) =>
    request<{ response_id: number; started_at: string }>(`/api/public/forms/${slug}/responses`, {
      method: "POST",
    }),
  saveAnswers: (responseId: number, answers: { question_id: number; value: unknown }[]) =>
    request<void>(`/api/public/responses/${responseId}/answers`, {
      method: "PATCH",
      body: JSON.stringify({ answers }),
    }),
  submitResponse: (responseId: number, answers: { question_id: number; value: unknown }[] = []) =>
    request<ResponseDetail>(`/api/public/responses/${responseId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  // Results
  listResponses: (formId: number) => request<ResponseListItem[]>(`/api/forms/${formId}/responses`),
  getResponse: (formId: number, responseId: number) =>
    request<ResponseDetail>(`/api/forms/${formId}/responses/${responseId}`),
  getStats: (formId: number) => request<FormStats>(`/api/forms/${formId}/stats`),
};

export { ApiError };
