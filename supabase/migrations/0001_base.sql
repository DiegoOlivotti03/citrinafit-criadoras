-- Citrina Fit · Central das criadoras · base inicial
-- Rode no Supabase: SQL Editor > New query > cole e execute.

create table public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  instagram   text,
  cupom       text unique,
  papel       text not null default 'criadora' check (papel in ('admin', 'criadora')),
  ativa       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create table public.convites (
  codigo      text primary key,
  usado_por   uuid references public.perfis(id),
  usado_em    timestamptz,
  expira_em   timestamptz not null default (now() + interval '14 days'),
  criado_em   timestamptz not null default now()
);

-- Vendas atribuidas a uma criadora. A logica de entrada (cupom -> venda)
-- sera definida depois; por ora a equipe pode lancar manualmente.
create table public.vendas (
  id          uuid primary key default gen_random_uuid(),
  criadora_id uuid not null references public.perfis(id) on delete cascade,
  valor       numeric(12, 2) not null check (valor >= 0),
  data        date not null default current_date,
  origem      text not null default 'manual',
  id_externo  text unique,
  criado_em   timestamptz not null default now()
);

create index vendas_criadora_idx on public.vendas (criadora_id, data);

-- Funcao auxiliar: o usuario logado e admin?
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin' and ativa);
$$;

-- Ranking publico entre criadoras logadas (so nome, instagram e totais).
create or replace function public.ranking(p_de date default null, p_ate date default null)
returns table (posicao bigint, criadora_id uuid, nome text, instagram text, total numeric, qtd bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    rank() over (order by coalesce(sum(v.valor), 0) desc) as posicao,
    p.id,
    p.nome,
    p.instagram,
    coalesce(sum(v.valor), 0) as total,
    count(v.id) as qtd
  from public.perfis p
  left join public.vendas v
    on v.criadora_id = p.id
   and (p_de  is null or v.data >= p_de)
   and (p_ate is null or v.data <= p_ate)
  where p.papel = 'criadora' and p.ativa and auth.uid() is not null
  group by p.id, p.nome, p.instagram
  order by total desc, p.nome;
$$;

revoke all on function public.ranking(date, date) from public, anon;
grant execute on function public.ranking(date, date) to authenticated;

-- Seguranca por linha: cada criadora so enxerga o que e dela.
alter table public.perfis   enable row level security;
alter table public.convites enable row level security;
alter table public.vendas   enable row level security;

create policy "perfil: ver o proprio ou admin"
  on public.perfis for select
  using (id = auth.uid() or public.eh_admin());

create policy "perfil: criadora edita nome e instagram do proprio"
  on public.perfis for update
  using (id = auth.uid())
  with check (id = auth.uid() and papel = 'criadora');

create policy "perfil: admin gerencia"
  on public.perfis for all
  using (public.eh_admin())
  with check (public.eh_admin());

create policy "convites: so admin"
  on public.convites for all
  using (public.eh_admin())
  with check (public.eh_admin());

create policy "vendas: ver as proprias ou admin"
  on public.vendas for select
  using (criadora_id = auth.uid() or public.eh_admin());

create policy "vendas: so admin escreve"
  on public.vendas for all
  using (public.eh_admin())
  with check (public.eh_admin());

-- Para tornar voce admin depois de criar a sua conta:
--   update public.perfis set papel = 'admin' where id = '<seu-user-id>';
