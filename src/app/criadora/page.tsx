import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { reais } from "../formato";
import Topo from "../topo";

export default async function PainelCriadora() {
  const atual = await usuarioAtual();
  if (!atual) redirect("/login");

  const supabase = await criarClienteServidor();
  const { data: ranking } = await supabase.rpc("ranking");
  const minha = ranking?.find((r: { criadora_id: string }) => r.criadora_id === atual.user.id);

  return (
    <>
      <Topo admin={atual.perfil.papel === "admin"} />
      <main>
        <h1>Olá, {atual.perfil.nome.split(" ")[0]}</h1>
        <div className="cartoes">
          <div className="cartao">
            <div className="suave">Sua posição</div>
            <div className="numero">{minha ? `${minha.posicao}º` : "—"}</div>
          </div>
          <div className="cartao">
            <div className="suave">Suas vendas</div>
            <div className="numero">{reais(minha?.total ?? 0)}</div>
          </div>
          <div className="cartao">
            <div className="suave">Pedidos</div>
            <div className="numero">{minha?.qtd ?? 0}</div>
          </div>
        </div>

        <h2>Seu cupom</h2>
        <div className="cartao">
          {atual.perfil.cupom ? (
            <span className="numero">{atual.perfil.cupom}</span>
          ) : (
            <span className="suave">Seu cupom ainda será criado pela equipe.</span>
          )}
        </div>

        <h2>Instagram</h2>
        <div className="cartao">
          <p>{atual.perfil.instagram ? `@${atual.perfil.instagram}` : "Nenhum perfil informado."}</p>
          <p className="suave">A conexão para trazer seus insights automaticamente vem em breve.</p>
        </div>
      </main>
    </>
  );
}
