"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../components/api";
import { useClipboardGuard } from "../../../components/useClipboardGuard";

type Question = {
  id: string;
  statement: string;
  alternatives: Record<string, string>;
  subject: { name: string };
  topic: { name: string };
};

type ExamResponse = {
  id: string;
  title: string;
  isFree: boolean;
  durationMinutes: number;
  questions: Array<{ question: Question; position: number }>;
};

export default function SimuladoExecPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;
  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [attemptId, setAttemptId] = useState<string>("");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [review, setReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lead, setLead] = useState({ name: "", email: "", phone: "", consentMarketing: false });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [error, setError] = useState("");

  useClipboardGuard(false);

  useEffect(() => {
    apiFetch<ExamResponse[]>("/exams")
      .then((list) => setExam(list.find((e) => e.id === examId) || null))
      .catch(() => setExam(null));
  }, [examId]);

  useEffect(() => {
    if (!exam) return;
    setSecondsLeft(exam.durationMinutes * 60);
  }, [exam]);

  useEffect(() => {
    if (!secondsLeft) return;
    const id = setInterval(() => setSecondsLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  async function startAttempt() {
    setError("");
    try {
      const token = localStorage.getItem("oab_token") || "";
      const data = await apiFetch<{ attempt: { id: string }; token?: string }>(`/exams/${examId}/start`, { method: "POST" }, token);
      if (data.token) {
        localStorage.setItem("oab_token", data.token);
      }
      setAttemptId(data.attempt.id);
    } catch (err: any) {
      setError(err.message || "Não foi possível iniciar a tentativa.");
    }
  }

  const question = useMemo(() => exam?.questions[idx]?.question, [exam, idx]);

  async function submitAnswer(option: string) {
    if (!question || !attemptId) return;
    const token = localStorage.getItem("oab_token") || "";
    setSelected((prev) => ({ ...prev, [question.id]: option }));

    await apiFetch(
      `/attempts/${attemptId}/answer`,
      {
        method: "POST",
        body: JSON.stringify({
          questionId: question.id,
          selected: option,
          timeSpentSec: 20,
          reviewLater: Boolean(review[question.id])
        })
      },
      token
    );
  }

  async function finishAttempt() {
    if (!attemptId || !exam) return;

    if (exam.isFree) {
      setShowLeadModal(true);
      return;
    }

    const token = localStorage.getItem("oab_token") || "";
    await apiFetch(`/attempts/${attemptId}/finish`, { method: "POST" }, token);
    router.push(`/resultado/${attemptId}`);
  }

  async function submitLeadThenFinish() {
    await apiFetch("/leads", { method: "POST", body: JSON.stringify(lead) });
    const token = localStorage.getItem("oab_token") || "";
    await apiFetch(`/attempts/${attemptId}/finish`, { method: "POST" }, token);
    router.push(`/resultado/${attemptId}`);
  }

  if (!exam) return <main className="container-page">Carregando simulado...</main>;

  return (
    <main className="container-page space-y-4">
      <section className="card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{exam.title}</h1>
          <p className="text-sm text-stone-700">
            Questão {idx + 1}/{exam.questions.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-600">Tempo restante</p>
          <p className="font-bold">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</p>
        </div>
      </section>

      {!attemptId ? (
        <div className="space-y-2">
          <button className="btn-primary" onClick={startAttempt}>
            Começar tentativa
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}

      {question && attemptId ? (
        <section className="card space-y-3">
          <p className="text-sm text-stone-600">
            {question.subject.name} • {question.topic.name}
          </p>
          <p>{question.statement}</p>
          <div className="space-y-2">
            {Object.entries(question.alternatives).map(([key, value]) => (
              <button
                key={key}
                className={`w-full rounded border p-2 text-left ${selected[question.id] === key ? "border-brand bg-orange-50" : ""}`}
                onClick={() => submitAnswer(key)}
              >
                <strong>{key})</strong> {value}
              </button>
            ))}
          </div>
          <label className="text-sm">
            <input
              type="checkbox"
              checked={Boolean(review[question.id])}
              onChange={(e) => setReview((prev) => ({ ...prev, [question.id]: e.target.checked }))}
            />{" "}
            Marcar para revisar
          </label>
        </section>
      ) : null}

      <section className="flex gap-2">
        <button className="btn-outline" disabled={idx === 0} onClick={() => setIdx((v) => Math.max(0, v - 1))}>
          Anterior
        </button>
        <button className="btn-outline" disabled={idx >= exam.questions.length - 1} onClick={() => setIdx((v) => Math.min(exam.questions.length - 1, v + 1))}>
          Próxima
        </button>
        <button className="btn-primary" onClick={finishAttempt}>
          Finalizar prova
        </button>
      </section>

      {showLeadModal ? (
        <section className="card space-y-2 border-brand">
          <h2 className="font-semibold">Antes do resultado, complete seu cadastro</h2>
          <input className="w-full rounded border p-2" placeholder="Nome" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="WhatsApp (opcional)" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
          <label className="text-sm">
            <input
              type="checkbox"
              checked={lead.consentMarketing}
              onChange={(e) => setLead({ ...lead, consentMarketing: e.target.checked })}
            />{" "}
            Concordo com comunicações de conteúdo (LGPD).
          </label>
          <button className="btn-primary" onClick={submitLeadThenFinish}>
            Ver resultado
          </button>
        </section>
      ) : null}
    </main>
  );
}
