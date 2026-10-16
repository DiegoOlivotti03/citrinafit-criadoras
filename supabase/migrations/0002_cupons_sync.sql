-- Registro das chamadas de sincronizacao de cupons com a loja Citrina.
-- O painel da equipe mostra um aviso quando a ultima tentativa falhou.

create table public.cupons_sync_log (
  id        uuid primary key default gen_random_uuid(),
  ok        boolean not null,
  detalhe   text not null,
  erro      text,
  criado_em timestamptz not null default now()
);

alter table public.cupons_sync_log enable row level security;

create policy "cupons_sync_log: so admin"
  on public.cupons_sync_log for all
  using (public.eh_admin())
  with check (public.eh_admin());
