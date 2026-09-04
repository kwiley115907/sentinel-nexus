-- ============================================================
-- This migration fixes two things found in review:
--
-- 1. public.is_company_member(), public.can_write_company(), and
--    public.set_updated_at() are referenced by
--    20260807061926_subscriptions_and_promo_codes.sql but are never
--    defined anywhere in this repo's migrations, and
--    handle_new_company() was defined but never bound to a trigger.
--    That means new companies never got an owner membership row or a
--    subscription row, which is the root cause of subscription status
--    never showing up correctly in the app.
--
-- 2. None of the core tables from 20260725_production_core.sql ever
--    had Row Level Security enabled. Supabase grants anon/authenticated
--    broad table privileges by default and relies on RLS to restrict
--    them - with RLS off, every company's projects, wire runs, chat
--    history, and engineering calculations are readable/writable by
--    anyone holding the public anon key (i.e. anyone who opens the
--    site), not just their own company. This enables it with policies
--    scoped to company membership.
-- ============================================================

-- ---------- 1. Helper functions (idempotent) ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.can_write_company(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.can_write_company(uuid) to authenticated;

-- ---------- 2. Bind the company bootstrap trigger ----------

drop trigger if exists handle_new_company_trigger on public.companies;

create trigger handle_new_company_trigger
  after insert on public.companies
  for each row execute function public.handle_new_company();

-- ---------- 3. Self-serve company bootstrap ----------
-- There's no "create a company" UI yet, so every user needs a company
-- created for them the first time they show up authenticated. This is
-- safe to call repeatedly - it returns the existing company on every
-- call after the first.

create or replace function public.ensure_company_for_current_user(company_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select cm.company_id into v_company_id
  from public.company_members cm
  where cm.user_id = auth.uid()
  order by cm.created_at asc
  limit 1;

  if v_company_id is not null then
    return v_company_id;
  end if;

  select email into v_user_email from auth.users where id = auth.uid();

  insert into public.companies (name, owner_user_id)
  values (
    coalesce(
      nullif(trim(company_name), ''),
      split_part(coalesce(v_user_email, 'New Company'), '@', 1) || '''s Company'
    ),
    auth.uid()
  )
  returning id into v_company_id;

  return v_company_id;
end;
$$;

grant execute on function public.ensure_company_for_current_user(text) to authenticated;

-- ---------- 4. blueprint_3d_models ----------
-- Referenced by apps/web/src/app/blueprint-3d/page.tsx (save/load/rename/
-- delete) but never defined in any migration in this repo, so every save
-- in the 3D Builder has been failing with "relation does not exist".

create table if not exists public.blueprint_3d_models (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null default 'Untitled 3D Model',
  model_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blueprint_3d_models_company_idx
  on public.blueprint_3d_models(company_id, created_at desc);

alter table public.blueprint_3d_models enable row level security;

drop trigger if exists set_updated_at on public.blueprint_3d_models;
create trigger set_updated_at before update on public.blueprint_3d_models
  for each row execute function public.set_updated_at();

drop policy if exists "members can view their company's 3d models" on public.blueprint_3d_models;
create policy "members can view their company's 3d models"
  on public.blueprint_3d_models for select
  using (public.is_company_member(company_id));

drop policy if exists "members can save 3d models" on public.blueprint_3d_models;
create policy "members can save 3d models"
  on public.blueprint_3d_models for insert
  with check (public.is_company_member(company_id) and created_by = auth.uid());

drop policy if exists "members can update their company's 3d models" on public.blueprint_3d_models;
create policy "members can update their company's 3d models"
  on public.blueprint_3d_models for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists "members can delete their company's 3d models" on public.blueprint_3d_models;
create policy "members can delete their company's 3d models"
  on public.blueprint_3d_models for delete
  using (public.is_company_member(company_id));

-- ---------- 5. "blueprints" storage bucket ----------
-- apps/web/src/app/blueprint-upload/page.tsx and
-- apps/web/src/app/sentinel-ai/page.tsx upload here via
-- supabase.storage.from("blueprints") but nothing creates the bucket.
-- Uploaded paths aren't namespaced per company (just a timestamp
-- prefix), so this can only be scoped to "any logged-in user" for now -
-- tightening it to per-company folders is a good follow-up once upload
-- paths are changed to include company_id.

insert into storage.buckets (id, name, public)
values ('blueprints', 'blueprints', false)
on conflict (id) do nothing;

drop policy if exists "authenticated users can read blueprint files" on storage.objects;
create policy "authenticated users can read blueprint files"
  on storage.objects for select
  using (bucket_id = 'blueprints' and auth.role() = 'authenticated');

drop policy if exists "authenticated users can upload blueprint files" on storage.objects;
create policy "authenticated users can upload blueprint files"
  on storage.objects for insert
  with check (bucket_id = 'blueprints' and auth.role() = 'authenticated');

drop policy if exists "authenticated users can update blueprint files" on storage.objects;
create policy "authenticated users can update blueprint files"
  on storage.objects for update
  using (bucket_id = 'blueprints' and auth.role() = 'authenticated')
  with check (bucket_id = 'blueprints' and auth.role() = 'authenticated');

-- ---------- 6. Row Level Security on the core schema ----------

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_notes enable row level security;
alter table public.wire_runs enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.engineering_calculations enable row level security;
alter table public.audit_events enable row level security;

-- companies
drop policy if exists "members can view their company" on public.companies;
create policy "members can view their company"
  on public.companies for select
  using (public.is_company_member(id));

drop policy if exists "authenticated users can create a company" on public.companies;
create policy "authenticated users can create a company"
  on public.companies for insert
  with check (owner_user_id = auth.uid());

drop policy if exists "owners and admins can update their company" on public.companies;
create policy "owners and admins can update their company"
  on public.companies for update
  using (public.can_write_company(id))
  with check (public.can_write_company(id));

-- company_members
drop policy if exists "members can view their company's roster" on public.company_members;
create policy "members can view their company's roster"
  on public.company_members for select
  using (public.is_company_member(company_id));

drop policy if exists "owners and admins can add members" on public.company_members;
create policy "owners and admins can add members"
  on public.company_members for insert
  with check (public.can_write_company(company_id));

drop policy if exists "owners and admins can remove members" on public.company_members;
create policy "owners and admins can remove members"
  on public.company_members for delete
  using (public.can_write_company(company_id));

-- projects
drop policy if exists "members can view their company's projects" on public.projects;
create policy "members can view their company's projects"
  on public.projects for select
  using (public.is_company_member(company_id));

drop policy if exists "members can create projects" on public.projects;
create policy "members can create projects"
  on public.projects for insert
  with check (public.is_company_member(company_id) and created_by = auth.uid());

drop policy if exists "members can update their company's projects" on public.projects;
create policy "members can update their company's projects"
  on public.projects for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists "admins can delete projects" on public.projects;
create policy "admins can delete projects"
  on public.projects for delete
  using (public.can_write_company(company_id));

-- project_notes
drop policy if exists "members can view their company's notes" on public.project_notes;
create policy "members can view their company's notes"
  on public.project_notes for select
  using (public.is_company_member(company_id));

drop policy if exists "members can add notes" on public.project_notes;
create policy "members can add notes"
  on public.project_notes for insert
  with check (public.is_company_member(company_id) and created_by = auth.uid());

drop policy if exists "members can update their company's notes" on public.project_notes;
create policy "members can update their company's notes"
  on public.project_notes for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- wire_runs
drop policy if exists "members can view their company's wire runs" on public.wire_runs;
create policy "members can view their company's wire runs"
  on public.wire_runs for select
  using (public.is_company_member(company_id));

drop policy if exists "members can manage wire runs" on public.wire_runs;
create policy "members can manage wire runs"
  on public.wire_runs for insert
  with check (public.is_company_member(company_id) and created_by = auth.uid());

drop policy if exists "members can update wire runs" on public.wire_runs;
create policy "members can update wire runs"
  on public.wire_runs for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- chat_conversations
drop policy if exists "members can view their company's conversations" on public.chat_conversations;
create policy "members can view their company's conversations"
  on public.chat_conversations for select
  using (public.is_company_member(company_id));

drop policy if exists "members can create conversations" on public.chat_conversations;
create policy "members can create conversations"
  on public.chat_conversations for insert
  with check (public.is_company_member(company_id) and user_id = auth.uid());

drop policy if exists "members can update their own conversations" on public.chat_conversations;
create policy "members can update their own conversations"
  on public.chat_conversations for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- chat_messages
drop policy if exists "members can view their company's chat messages" on public.chat_messages;
create policy "members can view their company's chat messages"
  on public.chat_messages for select
  using (public.is_company_member(company_id));

drop policy if exists "members can send chat messages" on public.chat_messages;
create policy "members can send chat messages"
  on public.chat_messages for insert
  with check (public.is_company_member(company_id) and user_id = auth.uid());

-- knowledge_documents (shared library entries have company_id = null;
-- company-authored notes are scoped to that company)
drop policy if exists "shared and own-company knowledge is readable" on public.knowledge_documents;
create policy "shared and own-company knowledge is readable"
  on public.knowledge_documents for select
  using (company_id is null or public.is_company_member(company_id));

drop policy if exists "members can add company knowledge" on public.knowledge_documents;
create policy "members can add company knowledge"
  on public.knowledge_documents for insert
  with check (
    company_id is not null
    and public.is_company_member(company_id)
    and created_by = auth.uid()
  );

drop policy if exists "members can update their company's knowledge" on public.knowledge_documents;
create policy "members can update their company's knowledge"
  on public.knowledge_documents for update
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

-- knowledge_sources (inherits visibility from its parent document)
drop policy if exists "knowledge sources follow their document's visibility" on public.knowledge_sources;
create policy "knowledge sources follow their document's visibility"
  on public.knowledge_sources for select
  using (
    exists (
      select 1 from public.knowledge_documents kd
      where kd.id = knowledge_document_id
        and (kd.company_id is null or public.is_company_member(kd.company_id))
    )
  );

-- engineering_calculations
drop policy if exists "members can view their company's calculations" on public.engineering_calculations;
create policy "members can view their company's calculations"
  on public.engineering_calculations for select
  using (public.is_company_member(company_id));

drop policy if exists "members can save calculations" on public.engineering_calculations;
create policy "members can save calculations"
  on public.engineering_calculations for insert
  with check (public.is_company_member(company_id) and user_id = auth.uid());

-- audit_events (read-only to company admins; written only by
-- service-role backend code, so deliberately no insert policy here)
drop policy if exists "admins can view their company's audit log" on public.audit_events;
create policy "admins can view their company's audit log"
  on public.audit_events for select
  using (company_id is not null and public.can_write_company(company_id));
