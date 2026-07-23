alter table public.pubmed_records
  add column if not exists doi text,
  add column if not exists pmcid text;
