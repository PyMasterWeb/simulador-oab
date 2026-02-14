"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../components/api";

export default function ResultadoPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("oab_token") || "";
    apiFetch(`/attempts/${params.id}/result`, {}, token).then(setData).catch(() => setData(null));
  }, [params.id]);

  if (!data) return <main className="container-page">Carregando resultado...</main>;

  return (
    <main className="container-page space-y-4">
      <section className="card">
        <h1 className="text-2xl font-bold">Resultado</h1>
        <p>Acertos: {data.attempt.correctCount}</p>
        <p>Pontuação: {data.attempt.score}</p>
        <p>Tempo total: {data.attempt.totalTimeSec}s</p>
      </section>
      <section className="card">
        <h2 className="font-semibold">Desempenho por matéria</h2>
        <ul className="list-disc pl-6">
          {data.subjectStats.map((s: any) => (
            <li key={s.subject}>
              {s.subject}: {s.accuracy}% ({s.correct}/{s.total})
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2 className="font-semibold">Recomendação</h2>
        <p>{data.recommendations}</p>
      </section>
    </main>
  );
}
