import "server-only";

export type CupomSync = { codigo: string; ativo: boolean };
export type ResultadoSync = { ok: true } | { ok: false; erro: string };

// Chama a API da loja Citrina. Roda so no servidor: o segredo nunca vai ao navegador.
// Nunca lanca excecao, para nao bloquear o cadastro da criadora.
export async function enviarCupons(corpo: CupomSync | CupomSync[]): Promise<ResultadoSync> {
  const base = process.env.LOJA_URL?.replace(/\/+$/, "");
  const segredo = process.env.CUPONS_SYNC_SECRET;
  if (!base || !segredo) return { ok: false, erro: "LOJA_URL ou CUPONS_SYNC_SECRET não configurados." };

  try {
    const resposta = await fetch(`${base}/api/public/cupons-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${segredo}` },
      body: JSON.stringify(corpo),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!resposta.ok) {
      const texto = (await resposta.text().catch(() => "")).slice(0, 300);
      return { ok: false, erro: `A loja respondeu ${resposta.status}. ${texto}`.trim() };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Falha de rede ao chamar a loja." };
  }
}
