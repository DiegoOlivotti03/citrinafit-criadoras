"use server";

import { redirect } from "next/navigation";
import { criarClienteAdmin, criarClienteServidor } from "@/lib/supabase/server";

type Estado = { erro?: string } | undefined;

export async function criarConta(codigo: string, _: Estado, dados: FormData): Promise<Estado> {
  const nome = String(dados.get("nome") ?? "").trim();
  const instagram = String(dados.get("instagram") ?? "").trim().replace(/^@/, "");
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!nome || !email) return { erro: "Preencha nome e e-mail." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const admin = criarClienteAdmin();

  // Reserva o convite de forma atomica: so um cadastro consegue usa-lo.
  const { data: reservado } = await admin
    .from("convites")
    .update({ usado_em: new Date().toISOString() })
    .eq("codigo", codigo)
    .is("usado_em", null)
    .gt("expira_em", new Date().toISOString())
    .select("codigo")
    .maybeSingle();
  if (!reservado) return { erro: "Este convite não é mais válido." };

  const liberar = () => admin.from("convites").update({ usado_em: null }).eq("codigo", codigo);

  const { data: criado, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error || !criado.user) {
    await liberar();
    return { erro: "Não foi possível criar a conta. Esse e-mail já pode estar em uso." };
  }

  const { error: erroPerfil } = await admin
    .from("perfis")
    .insert({ id: criado.user.id, nome, instagram: instagram || null });
  if (erroPerfil) {
    await admin.auth.admin.deleteUser(criado.user.id);
    await liberar();
    return { erro: "Não foi possível finalizar o cadastro. Tente novamente." };
  }

  await admin.from("convites").update({ usado_por: criado.user.id }).eq("codigo", codigo);

  const supabase = await criarClienteServidor();
  await supabase.auth.signInWithPassword({ email, password: senha });
  redirect("/criadora");
}
