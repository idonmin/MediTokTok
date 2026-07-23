begin;

drop table if exists public.user_papers cascade;
drop table if exists public.pubmed_records cascade;

create table public.pubmed_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  pmid text not null,
  title text not null,
  abstract text not null default '',
  journal text not null default '',
  pub_year integer,
  authors text[] not null default '{}',
  doi text,
  pmcid text,
  created_at timestamptz not null default now(),
  primary key (user_id, pmid)
);

create index if not exists pubmed_records_user_idx on public.pubmed_records(user_id);
create index if not exists pubmed_records_pub_year_idx on public.pubmed_records(pub_year);
create index if not exists pubmed_records_journal_idx on public.pubmed_records(journal);

alter table public.pubmed_records enable row level security;

drop policy if exists "users manage own pubmed records" on public.pubmed_records;
create policy "users manage own pubmed records"
on public.pubmed_records
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.pubmed_records to authenticated;
grant all privileges on public.pubmed_records to service_role;

commit;
