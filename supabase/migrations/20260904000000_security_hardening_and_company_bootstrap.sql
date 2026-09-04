-- ============================================================
-- Applied directly to the live project (wjwekeytgsttuhbczrdd) via the
-- Supabase MCP connector on 2026-09-04, verified against the actual
-- live schema rather than the (drifted) migrations that came before
-- this one. This file documents that change for the repo; it is NOT
-- what originally shipped in this filename (that version assumed a
-- company-scoped schema that never matched what was actually deployed
-- and was never applied - `list_migrations` on the live project
-- returned empty before this).
--
-- Fixes:
-- 1. public.companies / public.company_members had RLS disabled
--    entirely - fully open to anon/authenticated via the public anon
--    key (every company's data readable/writable by anyone).
-- 2. public.subscriptions had RLS enabled but zero policies - fully
--    locked, so not even a company's own members could read their
--    subscription row once the webhook wrote one.
-- 3. is_company_member/can_write_company/ensure_company_for_current_user
--    referenced by application code did not exist anywhere.
--    handle_new_company existed nowhere and there was no company
--    bootstrap at all - new signups never got a company, membership,
--    or subscription row (confirmed live: 9 auth.users, only 1 had a
--    company before this ran).
--
-- Note: public.blueprint_3d_models, public.projects, public.blueprints,
-- public.devices, and public.wire_runs are already correctly scoped by
-- user_id with working RLS policies and were deliberately NOT touched
-- here - the app's data model is solo-user ownership for those tables;
-- only companies/subscriptions (the billing layer) is company-scoped.
-- ============================================================

-- ---------- helper functions ----------

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
      and cm.is_active = true
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
      and cm.is_active = true
      and cm.role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.can_write_company(uuid) to authenticated;

-- ---------- company bootstrap: trigger + self-serve RPC ----------

create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.company_members (company_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (company_id, user_id) do nothing;

  insert into public.subscriptions (company_id)
  values (new.id)
  on conflict (company_id) do nothing;

  return new;
end;
$$;

drop trigger if exists handle_new_company_trigger on public.companies;
create trigger handle_new_company_trigger
  after insert on public.companies
  for each row execute function public.handle_new_company();

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
    and cm.is_active = true
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

-- ---------- RLS: companies ----------

alter table public.companies enable row level security;

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

-- ---------- RLS: company_members ----------

alter table public.company_members enable row level security;

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

-- ---------- RLS: subscriptions (read-only to members; writes stay
-- service-role-only via the Stripe webhook, same as before) ----------

drop policy if exists "members can view their subscription" on public.subscriptions;
create policy "members can view their subscription"
  on public.subscriptions for select
  using (public.is_company_member(company_id));

-- ---------- Backfill: every existing auth.users row gets a company ----------
-- (also ran a one-off backfill for the single pre-existing company that
-- predated the trigger and had no subscription row - not repeated here
-- since it's already fixed live; this insert is naturally a no-op on
-- a database where every company already has one.)

insert into public.companies (name, owner_user_id)
select
  coalesce(nullif(trim(split_part(u.email, '@', 1)), ''), 'New Company') || '''s Company',
  u.id
from auth.users u
where not exists (
  select 1 from public.company_members cm where cm.user_id = u.id
);
