import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function Inicio() {
  const atual = await usuarioAtual();
  if (!atual) redirect("/login");
  redirect(atual.perfil.papel === "admin" ? "/admin" : "/criadora");
}
