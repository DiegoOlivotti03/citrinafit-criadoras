"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export default function Login() {
  const [estado, acao, pendente] = useActionState(entrar, undefined);
  return (
    <div className="centro">
      <div className="cartao">
        <h1>Entrar</h1>
        <p className="suave">Central das criadoras Citrina Fit.</p>
        <form action={acao} className="coluna">
          <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
          <label>Senha<input name="senha" type="password" required autoComplete="current-password" /></label>
          {estado?.erro && <p className="erro">{estado.erro}</p>}
          <button type="submit" disabled={pendente}>{pendente ? "Entrando…" : "Entrar"}</button>
        </form>
        <p className="suave">Ainda não tem conta? O acesso é por convite da equipe.</p>
      </div>
    </div>
  );
}
