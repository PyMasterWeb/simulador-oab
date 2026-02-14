"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../components/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    consentMarketing: false,
    utmSource: "",
    utmCampaign: ""
  });
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("oab_token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Falha no cadastro");
    }
  }

  return (
    <main className="container-page">
      <form onSubmit={onSubmit} className="card mx-auto max-w-lg space-y-3">
        <h1 className="text-xl font-semibold">Cadastro</h1>
        <input className="w-full rounded border p-2" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input
          className="w-full rounded border p-2"
          placeholder="Senha"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <input className="w-full rounded border p-2" placeholder="WhatsApp (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.consentMarketing}
            onChange={(e) => setForm({ ...form, consentMarketing: e.target.checked })}
          />
          Concordo com o recebimento de comunicações educacionais (LGPD).
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input className="rounded border p-2" placeholder="utm_source" value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} />
          <input className="rounded border p-2" placeholder="utm_campaign" value={form.utmCampaign} onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })} />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary" type="submit">
          Criar conta
        </button>
      </form>
    </main>
  );
}
