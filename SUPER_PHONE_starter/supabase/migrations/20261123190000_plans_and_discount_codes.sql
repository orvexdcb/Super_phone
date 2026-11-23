-- SUPER PHONE: fixed plans and promotional codes
create table public.subscription_plans (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 2 and 80),
 description text,
 price numeric(12,0) not null default 0 check (price >= 0),
 currency text not null default 'IQD' check (currency in ('IQD','USD')),
 duration_days integer not null check (duration_days > 0),
 max_active_listings integer not null default 1 check (max_active_listings >= 0),
 max_featured_listings integer not null default 0 check (max_featured_listings >= 0),
 is_active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index subscription_plans_active_sort_idx on public.subscription_plans(is_active,sort_order);
create trigger trg_subscription_plans_updated before update on public.subscription_plans for each row execute function public.set_updated_at();

create table public.discount_codes (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check (code = upper(trim(code)) and char_length(code) between 3 and 40),
 discount_type text not null check (discount_type in ('percentage','fixed')),
 discount_value numeric(12,2) not null check (discount_value > 0),
 currency text not null default 'IQD' check (currency in ('IQD','USD')),
 applies_to text not null default 'both' check (applies_to in ('both','plans','listing_fees')),
 plan_id uuid references public.subscription_plans(id) on delete set null,
 starts_at timestamptz not null default now(),
 expires_at timestamptz,
 max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
 redemption_count integer not null default 0 check (redemption_count >= 0),
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint discount_dates_valid check (expires_at is null or expires_at > starts_at),
 constraint discount_percent_valid check (discount_type <> 'percentage' or discount_value <= 100),
 constraint discount_scope_plan_valid check (applies_to <> 'plans' or plan_id is not null)
);
create index discount_codes_active_dates_idx on public.discount_codes(is_active,starts_at,expires_at);
create trigger trg_discount_codes_updated before update on public.discount_codes for each row execute function public.set_updated_at();

create table public.discount_redemptions (
 id uuid primary key default gen_random_uuid(),
 discount_code_id uuid not null references public.discount_codes(id) on delete restrict,
 user_id uuid not null references public.profiles(id) on delete cascade,
 applies_to text not null check (applies_to in ('plan','listing_fee')),
 plan_id uuid references public.subscription_plans(id) on delete set null,
 original_amount numeric(12,2) not null check (original_amount >= 0),
 discount_amount numeric(12,2) not null check (discount_amount >= 0),
 final_amount numeric(12,2) not null check (final_amount >= 0),
 currency text not null check (currency in ('IQD','USD')),
 redeemed_at timestamptz not null default now()
);
create index discount_redemptions_user_idx on public.discount_redemptions(user_id,redeemed_at desc);
create index discount_redemptions_code_idx on public.discount_redemptions(discount_code_id);

alter table public.subscription_plans enable row level security;
alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;
create policy subscription_plans_public_active_select on public.subscription_plans for select to anon,authenticated using (is_active or public.is_admin());
create policy subscription_plans_admin_manage on public.subscription_plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy discount_codes_admin_manage on public.discount_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy discount_redemptions_user_or_admin_select on public.discount_redemptions for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy discount_redemptions_admin_manage on public.discount_redemptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.subscription_plans to anon,authenticated;
grant insert,update,delete on public.subscription_plans to authenticated;
grant select,insert,update,delete on public.discount_codes to authenticated;
grant select,insert,update,delete on public.discount_redemptions to authenticated;
