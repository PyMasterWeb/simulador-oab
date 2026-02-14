import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-page space-y-6">
      <section className="card space-y-3">
        <p className="text-xs uppercase tracking-wide text-brand">Preparação OAB</p>
        <h1 className="text-3xl font-bold">Simulado padrão FGV com foco técnico e sobriedade</h1>
        <p className="text-stone-700">
          Treino objetivo e prático com estatísticas, gabarito comentado, ranking e recomendações para evolução contínua.
        </p>
        <div className="flex gap-3">
          <Link href="/simulados" className="btn-primary">
            Fazer simulado gratuito
          </Link>
          <Link href="/assinatura" className="btn-outline">
            Conhecer Premium
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <h2 className="font-semibold">Simulado gratuito</h2>
          <p className="text-sm text-stone-700">Isca digital com captura de lead antes do resultado final.</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">Premium até passar</h2>
          <p className="text-sm text-stone-700">Acesso a simulados completos, ranking e comentários detalhados.</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">Marketing jurídico ético</h2>
          <p className="text-sm text-stone-700">Conteúdo informativo e educacional, sem promessa de resultado garantido.</p>
        </article>
      </section>
    </main>
  );
}
