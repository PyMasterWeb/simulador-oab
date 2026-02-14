export default function ConteudoPage() {
  const posts = [
    "Matérias que mais caem na 1ª fase",
    "Como revisar questões difíceis com eficiência",
    "Erros recorrentes em peças prático-profissionais",
    "Técnicas de gestão de tempo para prova da OAB"
  ];

  return (
    <main className="container-page space-y-4">
      <section className="card">
        <h1 className="text-2xl font-bold">Conteúdo</h1>
        <p className="text-sm text-stone-700">Área editorial educativa (MVP) com orientações e trilhas de estudo.</p>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post} className="card">
            <h2 className="font-semibold">{post}</h2>
            <p className="text-sm text-stone-700">Resumo introdutório do tema com foco técnico e abordagem objetiva.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
