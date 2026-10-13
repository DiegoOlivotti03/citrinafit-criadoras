"use client";

import { useActionState } from "react";
import { criarConta } from "./acoes";

export default function Formulario({ codigo }: { codigo: string }) {
  const [estado, acao, pendente] = useActionState(criarConta.bind(null, codigo), undefined);
  return (
    <form action={acao} className="coluna">
      <label>Seu nome<input name="nome" required autoComplete="name" /></label>
      <label>Seu @ do Instagram<input name="instagram" placeholder="@seuperfil" /></label>
      <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
      <label>Senha (mín. 8 caracteres)<input name="senha" type="password" minLength={8} required autoComplete="new-password" /></label>
      {estado?.erro && <p className="erro">{estado.erro}</p>}
      <button type="submit" disabled={pendente}>{pendente ? "Criando…" : "Criar minha conta"}</button>
    </form>
  );
}
