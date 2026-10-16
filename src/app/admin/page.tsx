import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { reais } from "../formato";
import Topo from "../topo";
import { alternarAtiva, definirCupom, gerarConvite, lancarVenda, sincronizarTodosCupons } from "./acoes";

export default async function Admin() {
  const atual = await usuarioAtual();
  if (!atual) redirect("/login");
  if (atual.perfil.papel !== "admin") redirect("/criadora");

  const supabase = await criarClienteServidor();
  const [{ data: criadoras }, { data: convites }, { data: ranking }, { data: ultimoSync }] = await Promise.all([
    supabase.from("perfis").select("*").eq("papel", "criadora").order("nome"),
    supabase.from("convites").select("*").is("usado_em", null).gt("expira_em", new Date().toISOString()).order("criado_em", { ascending: false }),
    supabase.rpc("ranking"),
    supabase.from("cupons_sync_log").select("ok, detalhe, erro, criado_em").order("criado_em", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const totais = new Map<string, number>((ranking ?? []).map((r: { criadora_id: string; total: number }) => [r.criadora_id, r.total]));
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <>
      <Topo admin />
      <main>
        <h1>Equipe</h1>

        {ultimoSync && !ultimoSync.ok && (
          <p role="alert" style={{ border: "1px solid currentColor", padding: "0.75rem", borderRadius: 8 }}>
            ⚠ Não foi possível sincronizar com a loja ({ultimoSync.detalhe}): {ultimoSync.erro}.
            A alteração foi salva aqui. Use “Sincronizar todos os cupons” para tentar de novo.
          </p>
        )}

        <h2>Criadoras ({criadoras?.length ?? 0})</h2>
        <table>
          <thead>
            <tr><th>Nome</th><th>Cupom</th><th className="num">Vendas</th><th>Lançar venda</th><th>Situação</th></tr>
          </thead>
          <tbody>
            {criadoras?.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}{c.instagram && <span className="suave"> · @{c.instagram}</span>}</td>
                <td>
                  <form action={definirCupom} style={{ display: "flex", gap: "0.4rem" }}>
                    <input type="hidden" name="id" value={c.id} />
                    <input name="cupom" defaultValue={c.cupom ?? ""} placeholder="MARIA10" size={10} />
                    <button className="sec" type="submit">Salvar</button>
                  </form>
                </td>
                <td className="num">{reais(totais.get(c.id) ?? 0)}</td>
                <td>
                  <form action={lancarVenda} style={{ display: "flex", gap: "0.4rem" }}>
                    <input type="hidden" name="id" value={c.id} />
                    <input name="valor" inputMode="decimal" placeholder="R$ 0,00" size={8} required />
                    <button className="sec" type="submit">Lançar</button>
                  </form>
                </td>
                <td>
                  <form action={alternarAtiva}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="ativa" value={String(!c.ativa)} />
                    <button className="sec" type="submit">{c.ativa ? "Desativar" : "Reativar"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!criadoras?.length && <tr><td colSpan={5} className="suave">Nenhuma criadora ainda. Gere um convite abaixo.</td></tr>}
          </tbody>
        </table>

        <form action={sincronizarTodosCupons} style={{ marginTop: "1rem" }}>
          <button type="submit">Sincronizar todos os cupons</button>
        </form>
        <p className="suave">Envia à loja Citrina, de uma vez, todos os cupons existentes e se cada um está ativo.</p>

        <h2>Convites abertos</h2>
        <form action={gerarConvite}><button type="submit">Gerar novo convite</button></form>
        <p className="suave">Cada link vale por 14 dias e só pode ser usado uma vez.</p>
        <ul>
          {convites?.map((c) => (
            <li key={c.codigo}><code>{site}/convite/{c.codigo}</code></li>
          ))}
        </ul>
      </main>
    </>
  );
}
