import Link from "next/link";

export default function AssinaturaPage() {
  return (
    <main className="container-page">
      <section className="card space-y-3">
        <h1 className="text-2xl font-bold">Plano Premium</h1>
        <p className="text-stone-700">Acesso a simulados completos e área de desempenho avançada.</p>
        <Link className="btn-primary" href="/premium">
          Ir para assinatura
        </Link>
      </section>
    </main>
  );
}
