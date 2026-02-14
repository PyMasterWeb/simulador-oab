"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../components/api";

type User = { id: string; name: string; plan: "FREE" | "PREMIUM" };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rec, setRec] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("oab_token") || "";
    apiFetch<User>("/users/me", {}, token).then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("oab_token") || "";
    apiFetch(`/recommendations/${user.id}`, {}, token).then(setRec).catch(() => null);
  }, [user]);

  return (
    <main className="container-page space-y-4">
      <section className="card">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>{user ? `Olá, ${user.name}. Plano atual: ${user.plan}.` : "Faça login para carregar seus dados."}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <h2 className="font-semibold">Últimos simulados</h2>
          <p className="text-sm text-stone-700">Acompanhe desempenho por tentativa e tempo médio.</p>
          <Link className="btn-outline mt-2" href="/simulados">
            Ver simulados
          </Link>
        </article>
        <article className="card">
          <h2 className="font-semibold">Recomendação automática</h2>
          <p className="text-sm text-stone-700">{rec ? `Tópicos fracos: ${rec.weakTopics?.length || 0}` : "Sem dados suficientes ainda."}</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">Ranking</h2>
          <Link className="btn-outline mt-2" href="/ranking">
            Acessar ranking
          </Link>
        </article>
      </section>
    </main>
  );
}
