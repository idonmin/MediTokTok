create extension if not exists pgcrypto;

create table if not exists public.pubmed_records (
  pmid text primary key,
  title text not null,
  abstract text not null default '',
  journal text not null default '',
  pub_year integer,
  authors text[] not null default '{}',
  collected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  start_year integer not null,
  end_year integer not null,
  "limit" integer not null check ("limit" between 1 and 100),
  found integer not null default 0,
  inserted integer not null default 0,
  skipped integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '새 대화',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists pubmed_records_pub_year_idx on public.pubmed_records(pub_year);
create index if not exists pubmed_records_journal_idx on public.pubmed_records(journal);
create index if not exists chat_messages_conversation_idx on public.chat_messages(conversation_id, created_at);

alter table public.pubmed_records enable row level security;
alter table public.collection_runs enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

create policy "authenticated users can read pubmed records" on public.pubmed_records for select to authenticated using (true);
create policy "users can read own collection runs" on public.collection_runs for select to authenticated using (auth.uid() = user_id);
create policy "users manage own conversations" on public.chat_conversations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own messages" on public.chat_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- INSERT/UPDATE는 service role을 사용하는 Express 서버에서만 수행합니다.
