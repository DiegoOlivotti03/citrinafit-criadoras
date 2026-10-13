import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { reais } from "../formato";
import Topo from "../topo";

type Linha = { posicao: number; criadora_id: string; nome: string; instagram: string | null; total: number; qtd: number };

export default async function Ranking() {
  const atual = await usuarioAtual();
  if (!atual) redirect("/login");

  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("ranking");
  const linhas = (data ?? []) as Linha[];

  return (
    <>
      <Topo admin={atual.perfil.papel === "admin"} />
      <main>
        <h1>Ranking de criadoras</h1>
        <p className="suave">Posição por valor de vendas. Visível para todas as criadoras.</p>
        <table>
          <thead>
            <tr><th>#</th><th>Criadora</th><th className="num">Pedidos</th><th className="num">Vendas</th></tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.criadora_id} className={l.criadora_id === atual.user.id ? "eu" : undefined}>
                <td className="pos">{l.posicao}º</td>
                <td>{l.nome}{l.instagram && <span className="suave"> · @{l.instagram}</span>}</td>
                <td className="num">{l.qtd}</td>
                <td className="num">{reais(l.total)}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr><td colSpan={4} className="suave">Nenhuma criadora cadastrada ainda.</td></tr>
            )}
          </tbody>
        </table>
      </main>
    </>
  );
}
