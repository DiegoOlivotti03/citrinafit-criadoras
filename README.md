# Citrina Fit · Central das Criadoras

App para gerenciar as criadoras de conteúdo da Citrina Fit.
Endereço previsto: **criadoras.citrinafit.com.br**

## O que já existe

- **Contas individuais**: cada criadora entra com e-mail e senha e só vê os próprios dados.
- **Cadastro por convite**: a equipe gera um link de uso único (vale 14 dias). Não há cadastro aberto.
- **Painel da criadora**: posição, vendas, pedidos, cupom e Instagram informado.
- **Ranking público** entre as criadoras, por valor de vendas.
- **Painel da equipe** (`/admin`): lista de criadoras, cupom de cada uma, lançamento manual de venda e geração de convites.

## O que falta (próximos passos)

1. **Entrada automática de vendas por cupom.** Hoje a equipe lança o valor à mão.
   A tabela `vendas` já tem `origem` e `id_externo` para receber vendas de fora sem duplicar.
2. **Conexão com o Instagram** (API oficial da Meta) para trazer insights. Exige conta profissional
   da criadora e revisão do app pela Meta. Enquanto isso, o painel mostra só o @ informado.
3. Entregas e prazos de posts, e comissões.

## Tecnologia

Next.js 15 (App Router) + Supabase (login, banco e segurança por linha).
Cores e fontes vêm de `marca/tokens.css`, copiado do repositório da marca.

## Como rodar

1. Crie um projeto no [Supabase](https://supabase.com).
2. No SQL Editor, execute `supabase/migrations/0001_base.sql`.
3. Copie `.env.example` para `.env.local` e preencha as chaves (Project Settings > API).
4. Instale e rode:
   ```
   npm install
   npm run dev
   ```
5. **Primeira conta admin:** em Authentication > Users, crie o seu usuário. Depois, no SQL Editor:
   ```sql
   insert into public.perfis (id, nome, papel)
   values ('<id-do-seu-usuario>', 'Seu Nome', 'admin');
   ```

## Publicar

Conecte este repositório ao Netlify ou Vercel, cadastre as variáveis do `.env.example` e aponte
o subdomínio `criadoras` (registro CNAME) para o endereço que a plataforma fornecer.

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` só existe no servidor. Nunca vai para o navegador nem para o Git.
- As regras de acesso estão no banco (RLS), não só nas telas.
- O ranking é uma função que expõe apenas nome, @ e totais, e só para quem está logado.
