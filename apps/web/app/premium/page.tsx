"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/api";

export default function PremiumPage() {
  const [providers, setProviders] = useState<Array<{ provider: string; label: string; url: string }>>([]);
  const [plan, setPlan] = useState<"FREE" | "PREMIUM" | "UNKNOWN">("UNKNOWN");
  const [events, setEvents] = useState<Array<{ id: string; provider: string; status: string; createdAt: string }>>([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    apiFetch<{ providers: Array<{ provider: string; label: string; url: string }> }>("/checkout/options")
      .then((r) => setProviders(r.providers))
      .catch(() => setProviders([]));

    refreshBilling();
  }, []);

  async function refreshBilling() {
    const token = localStorage.getItem("oab_token") || "";
    if (!token) {
      setPlan("UNKNOWN");
      setEvents([]);
      return;
    }

    try {
      const data = await apiFetch<{
        user: { plan: "FREE" | "PREMIUM" };
        events: Array<{ id: string; provider: string; status: string; createdAt: string }>;
      }>("/billing/me", {}, token);
      setPlan(data.user.plan);
      setEvents(data.events);
      setStatusMessage("");
    } catch (error: any) {
      setPlan("UNKNOWN");
      setEvents([]);
      setStatusMessage(error?.message || "Não foi possível carregar o status da assinatura.");
    }
  }

  return (
    <main className="container-page space-y-4">
      <section className="card">
        <h1 className="text-2xl font-bold">Área Premium</h1>
        <p className="text-stone-700">Simulados completos, ranking e trilha de revisão avançada.</p>
        <p className="mt-2 text-sm">
          Status atual:{" "}
          <strong className={plan === "PREMIUM" ? "text-green-700" : "text-stone-700"}>
            {plan === "UNKNOWN" ? "não autenticado" : plan}
          </strong>
        </p>
        <button className="btn-outline mt-3" onClick={refreshBilling}>
          Já paguei, atualizar status
        </button>
        {statusMessage ? <p className="mt-2 text-sm text-red-700">{statusMessage}</p> : null}
      </section>
      <section className="card">
        <h2 className="font-semibold">Conteúdos Premium</h2>
        <ul className="list-disc pl-6 text-sm text-stone-700">
          <li>Simulado completo padrão FGV (80 questões)</li>
          <li>Relatórios avançados por subtema</li>
          <li>Revisão inteligente de erros recorrentes</li>
        </ul>
      </section>
      <section className="card">
        <h2 className="font-semibold">Escolha o método de assinatura</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {providers.length ? (
            providers.map((provider) => (
              <a key={provider.provider} className="btn-primary" href={provider.url} target="_blank" rel="noreferrer">
                Assinar com {provider.label}
              </a>
            ))
          ) : (
            <p className="text-sm text-stone-700">Nenhum checkout configurado. Preencha as URLs no `.env`.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-stone-600">
          Webhooks esperados: <code>/webhooks/payments/asaas</code>, <code>/webhooks/payments/mercadopago</code>,{" "}
          <code>/webhooks/payments/nubank_qr</code>.
        </p>
      </section>

      <section className="card">
        <h2 className="font-semibold">Últimos eventos de pagamento</h2>
        {!events.length ? (
          <p className="text-sm text-stone-700">Nenhum evento recebido para este usuário.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.provider}</strong> • {event.status} • {new Date(event.createdAt).toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
