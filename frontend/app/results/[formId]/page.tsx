"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { FormDetail, FormStats, ResponseDetail, ResponseListItem } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Pill } from "@/components/ui/Pill";
import { StatsSummary, QuestionStatsList } from "@/components/results/StatsSummary";
import { ResponseDetailModal } from "@/components/results/ResponseDetailModal";

export default function ResultsPage() {
  const { formId } = useParams<{ formId: string }>();
  const id = Number(formId);
  const toast = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [responses, setResponses] = useState<ResponseListItem[] | null>(null);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [selected, setSelected] = useState<ResponseDetail | null>(null);

  useEffect(() => {
    Promise.all([api.getForm(id), api.listResponses(id), api.getStats(id)])
      .then(([f, r, s]) => {
        setForm(f);
        setResponses(r);
        setStats(s);
      })
      .catch(() => toast.show("Couldn't load results", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function openResponse(responseId: number) {
    try {
      const detail = await api.getResponse(id, responseId);
      setSelected(detail);
    } catch {
      toast.show("Couldn't load response", "error");
    }
  }

  if (!form || !responses || !stats) {
    return <div className="p-8 text-sm text-fg-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-fg-muted hover:text-fg">
        ← Back to forms
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{form.title}</h1>
        <Pill tone={form.status === "published" ? "success" : "neutral"}>{form.status}</Pill>
      </div>

      <StatsSummary stats={stats} />
      <QuestionStatsList stats={stats} />

      <h2 className="mb-3 text-lg font-semibold">Responses</h2>
      {responses.length === 0 ? (
        <p className="text-sm text-fg-muted">No responses yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-left text-xs text-fg-muted">
              <tr>
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                  onClick={() => r.is_complete && openResponse(r.id)}
                >
                  <td className="px-4 py-2">#{r.id}</td>
                  <td className="px-4 py-2">{new Date(r.started_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <Pill tone={r.is_complete ? "success" : "warning"}>
                      {r.is_complete ? "Complete" : "Partial"}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ResponseDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        response={selected}
        questions={form.questions}
      />
    </div>
  );
}
