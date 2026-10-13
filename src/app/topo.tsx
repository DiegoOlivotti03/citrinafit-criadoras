import Link from "next/link";
import { sair } from "./login/acoes";

export default function Topo({ admin }: { admin: boolean }) {
  return (
    <header className="topo">
      <Link href="/" className="marca">
        <img src="/selo.svg" alt="" />
        Citrina · Criadoras
      </Link>
      <nav>
        <Link href="/criadora">Meu painel</Link>
        <Link href="/ranking">Ranking</Link>
        {admin && <Link href="/admin">Equipe</Link>}
        <form action={sair}>
          <button className="sec" type="submit">Sair</button>
        </form>
      </nav>
    </header>
  );
}
