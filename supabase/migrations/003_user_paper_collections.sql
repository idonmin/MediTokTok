-- 논문 메타데이터는 공용으로 유지하고 사용자별 수집 여부를 별도로 관리합니다.

create table if not exists public.user_papers (
  user_id uuid not null references auth.users(id) on delete cascade,
  pmid text not null references public.pubmed_records(pmid) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key (user_id, pmid)
);

create index if not exists user_papers_pmid_idx on public.user_papers(pmid);

-- 기존 데이터의 최초 수집자를 사용자 컬렉션으로 이전합니다.
insert into public.user_papers (user_id, pmid)
select collected_by, pmid
from public.pubmed_records
where collected_by is not null
on conflict (user_id, pmid) do nothing;

alter table public.user_papers enable row level security;

drop policy if exists "users manage own paper collection" on public.user_papers;
create policy "users manage own paper collection"
on public.user_papers
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant usage on schema public to authenticated, service_role;
grant select, insert, delete on public.user_papers to authenticated;
grant all privileges on public.user_papers to service_role;
