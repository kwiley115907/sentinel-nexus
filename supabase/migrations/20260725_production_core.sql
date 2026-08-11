create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'designer', 'technician', 'inspector', 'viewer')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  project_code text not null,
  name text not null,
  building text,
  address text,
  panel_manufacturer text,
  panel_model text,
  drawing_revision text,
  status text not null default 'planning'
    check (status in ('planning', 'design', 'installation', 'testing', 'complete', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, project_code)
);

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wire_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  wire_run_code text not null,
  circuit_type text,
  circuit_source text,
  source_terminal text,
  cable_designation text,
  conductor_count integer,
  wire_gauge_awg integer,
  estimated_length_ft numeric,
  installed_length_ft numeric,
  alarm_current_amps numeric,
  voltage_drop_percent numeric,
  status text not null default 'planning',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, wire_run_code)
);

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  source_type text not null default 'company-note',
  manufacturer text,
  product text,
  document_number text,
  document_revision text,
  firmware_range text,
  board_revision text,
  country text,
  listing text[],
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'superseded', 'rejected')),
  verified boolean not null default false,
  verified_at timestamptz,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  knowledge_document_id uuid not null
    references public.knowledge_documents(id) on delete cascade,
  title text not null,
  url text,
  domain text,
  retrieved_at timestamptz,
  published_at timestamptz,
  official boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.engineering_calculations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete restrict,
  calculation_type text not null,
  inputs jsonb not null,
  results jsonb not null,
  assumptions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  operation text not null,
  entity_type text,
  entity_id text,
  status text not null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists projects_company_idx
  on public.projects(company_id);

create index if not exists notes_project_idx
  on public.project_notes(project_id);

create index if not exists wire_runs_project_idx
  on public.wire_runs(project_id);

create index if not exists chat_messages_conversation_idx
  on public.chat_messages(conversation_id, created_at);

create index if not exists knowledge_lookup_idx
  on public.knowledge_documents(manufacturer, product, status, verified);
