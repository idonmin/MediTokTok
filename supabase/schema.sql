begin;

create extension if not exists pgcrypto;

-- PubMed 논문 원본 데이터.
-- status = 1: 한 명 이상의 사용자가 현재 수집 중
-- status = 0: 현재 수집 중인 사용자가 없음
create table public.pubmed_records (
  pmid text primary key,
  title text not null,
  abstract text not null default '',
  journal text not null default '',
  pub_year integer,
  authors text[] not null default '{}',
  status smallint not null default 0 check (status in (0, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auth.users와 1:1로 연결되는 애플리케이션 사용자 정보.
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 사용자와 사용자가 수집한 논문의 N:M 중개 테이블.
create table public.user_paper_collections (
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  pmid text not null references public.pubmed_records(pmid) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key (user_id, pmid)
);

-- 사용자별 챗봇 채팅방.
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  title text not null default '새 대화',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

-- 선택 논문 전용 채팅방과 사용자 논문 컬렉션을 연결합니다.
create table public.chat_room_papers (
  room_id uuid not null,
  user_id uuid not null,
  pmid text not null,
  created_at timestamptz not null default now(),
  primary key (room_id, pmid),
  constraint chat_room_papers_room_user_fk
    foreign key (room_id, user_id)
    references public.chat_rooms (id, user_id)
    on delete cascade,
  constraint chat_room_papers_pubmed_fk
    foreign key (pmid)
    references public.pubmed_records (pmid)
    on delete cascade,
  constraint chat_room_papers_collection_fk
    foreign key (user_id, pmid)
    references public.user_paper_collections (user_id, pmid)
    on delete cascade
);

-- 사용자별 챗봇 메시지 기록.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now(),
  constraint chat_messages_room_user_fk
    foreign key (room_id, user_id)
    references public.chat_rooms (id, user_id)
    on delete cascade
);

create index pubmed_records_pub_year_idx
  on public.pubmed_records(pub_year);
create index pubmed_records_journal_idx
  on public.pubmed_records(journal);
create index user_paper_collections_user_idx
  on public.user_paper_collections(user_id, collected_at desc);
create index user_paper_collections_pmid_idx
  on public.user_paper_collections(pmid);
create index chat_rooms_user_updated_idx
  on public.chat_rooms(user_id, updated_at desc);
create index chat_room_papers_user_room_idx
  on public.chat_room_papers(user_id, room_id);
create index chat_messages_room_created_idx
  on public.chat_messages(room_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_pubmed_records_updated_at
before update on public.pubmed_records
for each row execute function public.set_updated_at();

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger set_chat_rooms_updated_at
before update on public.chat_rooms
for each row execute function public.set_updated_at();

-- 신규 로그인 사용자의 provider 정보를 public.user_profiles에 자동 생성한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (
    user_id,
    provider,
    email,
    display_name,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (user_id) do update
  set
    provider = excluded.provider,
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email, raw_app_meta_data, raw_user_meta_data
on auth.users
for each row execute function public.handle_new_user();

-- 이 스키마를 적용하기 전에 이미 가입한 사용자도 프로필에 반영한다.
insert into public.user_profiles (
  user_id,
  provider,
  email,
  display_name,
  avatar_url
)
select
  id,
  coalesce(raw_app_meta_data ->> 'provider', 'email'),
  email,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name'
  ),
  coalesce(
    raw_user_meta_data ->> 'avatar_url',
    raw_user_meta_data ->> 'picture'
  )
from auth.users
on conflict (user_id) do update
set
  provider = excluded.provider,
  email = excluded.email,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url;

-- 중개 테이블의 상태를 기준으로 pubmed_records.status를 자동 동기화한다.
create or replace function public.sync_pubmed_record_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_pmid text;
begin
  if tg_op = 'DELETE' then
    target_pmid := old.pmid;
  else
    target_pmid := new.pmid;
  end if;

  update public.pubmed_records
  set status = case
    when exists (
      select 1
      from public.user_paper_collections
      where pmid = target_pmid
    ) then 1
    else 0
  end
  where pmid = target_pmid;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger sync_pubmed_status_after_collection_change
after insert or delete on public.user_paper_collections
for each row execute function public.sync_pubmed_record_status();

-- 새 메시지가 생기면 채팅방의 최근 수정 시각을 갱신한다.
create or replace function public.touch_chat_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_rooms
  set updated_at = now()
  where id = new.room_id
    and user_id = new.user_id;

  return new;
end;
$$;

create trigger touch_chat_room_after_message
after insert on public.chat_messages
for each row execute function public.touch_chat_room();

-- 애플리케이션 검증 외에도 채팅방당 최대 5편을 보장합니다.
create or replace function public.enforce_chat_room_paper_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.chat_room_papers
    where room_id = new.room_id
      and user_id = new.user_id
  ) >= 5 then
    raise exception '채팅방에는 최대 5편의 논문만 연결할 수 있습니다.';
  end if;

  return new;
end;
$$;

create trigger enforce_chat_room_paper_limit_before_insert
before insert on public.chat_room_papers
for each row execute function public.enforce_chat_room_paper_limit();

alter table public.pubmed_records enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_paper_collections enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_room_papers enable row level security;
alter table public.chat_messages enable row level security;

create policy "authenticated users can read pubmed records"
on public.pubmed_records
for select
to authenticated
using (true);

create policy "users can read own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own paper collections"
on public.user_paper_collections
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own chat rooms"
on public.chat_rooms
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own chat room papers"
on public.chat_room_papers
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own chat messages"
on public.chat_messages
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant usage on schema public to authenticated, service_role;

grant select on public.pubmed_records to authenticated;
grant select on public.user_profiles to authenticated;
grant update (display_name, avatar_url) on public.user_profiles to authenticated;
grant select, insert, delete on public.user_paper_collections to authenticated;
grant select, insert, update, delete on public.chat_rooms to authenticated;
grant select, insert, delete on public.chat_room_papers to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;

grant all privileges on public.pubmed_records to service_role;
grant all privileges on public.user_profiles to service_role;
grant all privileges on public.user_paper_collections to service_role;
grant all privileges on public.chat_rooms to service_role;
grant all privileges on public.chat_room_papers to service_role;
grant all privileges on public.chat_messages to service_role;

commit;
