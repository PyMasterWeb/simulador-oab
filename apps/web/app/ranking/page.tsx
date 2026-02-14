"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/api";

export default function RankingPage() {
  const [period, setPeriod] = useState<"WEEK" | "ALL">("WEEK");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    apiFetch<any[]>(`/ranking?period=${period}`).then(setRows).catch(() => setRows([]));
  }, [period]);

  return (
    <main className="container-page space-y-4">
      <section className="card flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <select className="rounded border p-2" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
          <option value="WEEK">Semanal</option>
          <option value="ALL">Geral</option>
        </select>
      </section>
      <section className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Pos.</th>
              <th>Nome</th>
              <th>Score</th>
              <th>Tempo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.position}-${r.user.name}`} className="border-t">
                <td>{r.position}</td>
                <td>{r.user.name}</td>
                <td>{r.score}</td>
                <td>{r.timeSec}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
