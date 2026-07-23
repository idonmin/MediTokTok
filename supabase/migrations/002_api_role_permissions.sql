-- 이미 001_initial_schema.sql을 실행한 프로젝트에 API 역할 권한을 추가합니다.
-- GRANT는 반복 실행해도 안전합니다.

grant usage on schema public to authenticated, service_role;

grant select on public.pubmed_records to authenticated;
grant select on public.collection_runs to authenticated;
grant select, insert, update, delete on public.chat_conversations to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;

grant all privileges on public.pubmed_records to service_role;
grant all privileges on public.collection_runs to service_role;
grant all privileges on public.chat_conversations to service_role;
grant all privileges on public.chat_messages to service_role;
