"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";

async function exigirAdmin() {
  const atual = await usuarioAtual();
  if (!atual || atual.perfil.papel !== "admin" || !atual.perfil.ativa) throw new Error("Acesso negado");
  return criarClienteServidor();
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
  const { error } = await supabase.from("perfis").update({ cupom }).eq("id", id);
  if (error) throw new Error(error.message);
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
