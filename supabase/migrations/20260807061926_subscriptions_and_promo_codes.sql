-- ============================================================
-- 1. Platform admins (you, not a company role — for reviewing
--    Cash App payments across every company)
-- ============================================================
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

create policy "platform admins can view the admin list"
  on public.platform_admins for select
  using (public.is_platform_admin());

-- ============================================================
-- 2. Subscriptions — one row per company
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan text not null default 'basic'
    check (plan in ('basic', 'pro', 'premium')),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'pending_manual_review', 'incomplete')),
  payment_method text
    check (payment_method in ('stripe', 'cash_app')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on public.subscriptions(status);

alter table public.subscriptions enable row level security;

create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Read-only to company members: plan changes only happen through
-- Stripe webhooks, the redeem_promo_code() function below, or a
-- platform admin approving a Cash App request — never a direct
-- client write, so there's deliberately no insert/update policy
-- here for regular users.
create policy "members can view their subscription"
  on public.subscriptions for select
  using (public.is_company_member(company_id));

-- Bootstrap every new company with a free Basic subscription,
-- same moment it gets its owner membership row.
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

  insert into public.subscriptions (company_id, plan, status)
  values (new.id, 'basic', 'active')
  on conflict (company_id) do nothing;

  return new;
end;
$$;

-- ============================================================
-- 3. Promo codes — never directly readable by clients (so users
--    can't enumerate valid codes); only touched through the
--    redeem_promo_code() function below.
-- ============================================================
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null
    check (type in ('free_access', 'trial_extension', 'stripe_discount')),
  grants_plan text
    check (grants_plan in ('basic', 'pro', 'premium')),
  grants_days integer,
  stripe_promotion_code_id text,
  max_redemptions integer,
  redemption_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;
-- Deliberately no policies at all: RLS is on, no policy grants
-- access, so this table is invisible to every client role except
-- service_role and functions running as the table owner.

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  redeemed_by uuid not null references auth.users(id) on delete restrict,
  redeemed_at timestamptz not null default now(),
  unique (promo_code_id, company_id)
);

create index if not exists promo_code_redemptions_company_idx
  on public.promo_code_redemptions(company_id);

alter table public.promo_code_redemptions enable row level security;

create policy "members can view their company's redemptions"
  on public.promo_code_redemptions for select
  using (public.is_company_member(company_id));

-- The only way a client ever touches promo_codes: this function
-- validates the code, records the redemption, and applies the
-- effect — all in one transaction, so a code can never be
-- double-spent by a race condition (the `for update` row lock
-- below prevents two simultaneous redemptions of a limited code).
create or replace function public.redeem_promo_code(
  target_company_id uuid,
  promo_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo record;
  v_current_trial_end timestamptz;
begin
  if not public.can_write_company(target_company_id) then
    raise exception 'You do not have permission to redeem a code for this company.';
  end if;

  select * into v_promo
  from public.promo_codes
  where code = promo_code
    and active = true
    and (expires_at is null or expires_at > now())
    and (max_redemptions is null or redemption_count < max_redemptions)
  for update;

  if not found then
    raise exception 'This promo code is invalid, expired, or fully redeemed.';
  end if;

  if v_promo.type = 'stripe_discount' then
    raise exception 'This code applies at checkout, not here.';
  end if;

  if exists (
    select 1 from public.promo_code_redemptions
    where promo_code_id = v_promo.id and company_id = target_company_id
  ) then
    raise exception 'This company has already redeemed this code.';
  end if;

  insert into public.promo_code_redemptions (promo_code_id, company_id, redeemed_by)
  values (v_promo.id, target_company_id, auth.uid());

  update public.promo_codes
  set redemption_count = redemption_count + 1
  where id = v_promo.id;

  if v_promo.type = 'free_access' then
    update public.subscriptions
    set plan = v_promo.grants_plan,
        status = 'active',
        trial_ends_at = case
          when v_promo.grants_days is not null
          then now() + (v_promo.grants_days::text || ' days')::interval
          else null
        end,
        updated_at = now()
    where company_id = target_company_id;

    return jsonb_build_object('success', true, 'type', 'free_access', 'plan', v_promo.grants_plan);
  end if;

  if v_promo.type = 'trial_extension' then
    select trial_ends_at into v_current_trial_end
    from public.subscriptions
    where company_id = target_company_id;

    update public.subscriptions
    set trial_ends_at = greatest(coalesce(v_current_trial_end, now()), now())
          + (v_promo.grants_days::text || ' days')::interval,
        status = 'trialing',
        updated_at = now()
    where company_id = target_company_id;

    return jsonb_build_object('success', true, 'type', 'trial_extension', 'days_added', v_promo.grants_days);
  end if;

  return jsonb_build_object('success', false);
end;
$$;

-- ============================================================
-- 4. Cash App manual-approval queue
-- ============================================================
create table if not exists public.cash_app_payment_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  requested_plan text not null
    check (requested_plan in ('pro', 'premium')),
  cash_app_reference text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cash_app_requests_company_idx
  on public.cash_app_payment_requests(company_id);
create index if not exists cash_app_requests_status_idx
  on public.cash_app_payment_requests(status);

alter table public.cash_app_payment_requests enable row level security;

create policy "members and admins can view relevant requests"
  on public.cash_app_payment_requests for select
  using (public.is_company_member(company_id) or public.is_platform_admin());

create policy "members can submit a payment request"
  on public.cash_app_payment_requests for insert
  with check (public.can_write_company(company_id) and submitted_by = auth.uid());

create policy "only platform admins can review requests"
  on public.cash_app_payment_requests for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
