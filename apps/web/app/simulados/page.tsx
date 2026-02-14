"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../components/api";

type Exam = {
  id: string;
  title: string;
  mode: "FULL" | "SUBJECT";
  isFree: boolean;
  durationMinutes: number;
  questions: Array<{ questionId: string }>;
};

export default function SimuladosPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Exam[]>("/exams")
      .then((data) => {
        setExams(data);
        setError("");
      })
      .catch((err: any) => {
        setExams([]);
        setError(err?.message || "Não foi possível carregar os simulados.");
      });
  }, []);

  return (
    <main className="container-page space-y-4">
      <h1 className="text-2xl font-bold">Simulados</h1>
      {error ? (
        <section className="card border-red-300">
          <p className="font-semibold text-red-700">Falha ao carregar simulados</p>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-sm text-stone-700">
            Verifique se o backend está online e se a variável de ambiente da API está configurada.
          </p>
        </section>
      ) : null}
      {!error && exams.length === 0 ? (
        <section className="card">
          <p className="font-semibold">Nenhum simulado encontrado.</p>
          <p className="text-sm text-stone-700">Rode o seed para criar os simulados iniciais.</p>
        </section>
      ) : null}
      {exams.map((exam) => (
        <article key={exam.id} className="card flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">{exam.title}</h2>
            <p className="text-sm text-stone-700">
              {exam.mode} • {exam.durationMinutes} min • {exam.isFree ? "FREE" : "PREMIUM"}
            </p>
          </div>
          <Link href={`/simulados/${exam.id}`} className="btn-primary">
            Iniciar
          </Link>
        </article>
      ))}
    </main>
  );
}
