"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { enviarCupons, type CupomSync } from "@/lib/loja";

async function exigirAdmin() {
  const atual = await usuarioAtual();
  if (!atual || atual.perfil.papel !== "admin" || !atual.perfil.ativa) throw new Error("Acesso negado");
  return criarClienteServidor();
}

type Supabase = Awaited<ReturnType<typeof criarClienteServidor>>;

// Envia para a loja e registra o resultado. Falha aqui nunca bloqueia a acao do admin.
async function sincronizar(supabase: Supabase, detalhe: string, corpo: CupomSync | CupomSync[]) {
  const r = await enviarCupons(corpo);
  if (!r.ok) console.error(`[cupons-sync] ${detalhe}: ${r.erro}`);
  const { error } = await supabase
    .from("cupons_sync_log")
    .insert({ ok: r.ok, detalhe, erro: r.ok ? null : r.erro });
  if (error) console.error("[cupons-sync] não foi possível registrar o log:", error.message);
}

export async function gerarConvite() {
  const supabase = await exigirAdmin();
  const codigo = randomBytes(12).toString("base64url");
  const { error } = await supabase.from("convites").insert({ codigo });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function definirCupom(dados: FormData) {
  const supabase = await exigirAdmin();
  const id = String(dados.get("id"));
  const cupom = String(dados.get("cupom") ?? "").trim().toUpperCase() || null;
  const { data: antes } = await supabase.from("perfis").select("cupom, ativa").eq("id", id).single();
  const { error } = await supabase.from("perfis").update({ cupom }).eq("id", id);
  if (error) throw new Error(error.message);

  // Cupom antigo deixa de valer na loja; o novo vale se a criadora estiver ativa.
  if (antes?.cupom && antes.cupom !== cupom) await sincronizar(supabase, `desativar ${antes.cupom}`, { codigo: antes.cupom, ativo: false });
  if (cupom) await sincronizar(supabase, `cupom ${cupom}`, { codigo: cupom, ativo: antes?.ativa ?? true });
  revalidatePath("/admin");
}

export async function alternarAtiva(dados: FormData) {
  const supabase = await exigirAdmin();
  const id = String(dados.get("id"));
  const ativa = String(dados.get("ativa")) === "true";
  const { data: perfil, error } = await supabase
    .from("perfis")
    .update({ ativa })
    .eq("id", id)
    .eq("papel", "criadora")
    .select("cupom")
    .single();
  if (error) throw new Error(error.message);
  if (perfil.cupom) await sincronizar(supabase, `${ativa ? "reativar" : "desativar"} ${perfil.cupom}`, { codigo: perfil.cupom, ativo: ativa });
  revalidatePath("/admin");
  revalidatePath("/ranking");
}

export async function sincronizarTodosCupons() {
  const supabase = await exigirAdmin();
  const { data, error } = await supabase.from("perfis").select("cupom, ativa").eq("papel", "criadora").not("cupom", "is", null);
  if (error) throw new Error(error.message);
  const lista: CupomSync[] = (data ?? []).map((p) => ({ codigo: p.cupom as string, ativo: p.ativa }));
  await sincronizar(supabase, `sincronizar todos (${lista.length} cupons)`, lista);
  revalidatePath("/admin");
}

export async function lancarVenda(dados: FormData) {
  const supabase = await exigirAdmin();
  const valor = Number(String(dados.get("valor")).replace(",", "."));
  if (!Number.isFinite(valor) || valor < 0) throw new Error("Valor inválido");
  const { error } = await supabase.from("vendas").insert({
    criadora_id: String(dados.get("id")),
    valor,
    origem: "manual",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/ranking");
}
