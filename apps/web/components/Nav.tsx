import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/dashboard", "Dashboard"],
  ["/simulados", "Simulados"],
  ["/ranking", "Ranking"],
  ["/premium", "Premium"],
  ["/conteudo", "Conteúdo"],
  ["/admin", "Admin"]
] as const;

export function Nav() {
  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="container-page flex flex-wrap items-center gap-3 py-3">
        <span className="font-bold text-brand">Simulador OAB</span>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="text-sm text-stone-700 hover:text-brand">
            {label}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          <Link href="/login" className="btn-outline">
            Entrar
          </Link>
          <Link href="/register" className="btn-primary">
            Cadastrar
          </Link>
        </div>
      </div>
    </nav>
  );
}
