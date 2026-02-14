"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../components/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("oab_token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Falha no login");
    }
  }

  return (
    <main className="container-page">
      <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className="w-full rounded border p-2"
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary" type="submit">
          Acessar
        </button>
      </form>
    </main>
  );
}
