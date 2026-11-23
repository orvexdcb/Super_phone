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

-- Server-side discount quote validation (redemption is recorded only after confirmed payment).
create or replace function public.quote_discount_code(
 p_code text,p_applies_to text,p_amount numeric,p_currency text,p_plan_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.discount_codes%rowtype; v_discount numeric(12,2); v_final numeric(12,2);
begin
 if auth.uid() is null then raise exception 'يجب تسجيل الدخول'; end if;
 if p_amount is null or p_amount<0 or p_currency not in ('IQD','USD') or p_applies_to not in ('plan','listing_fee') then raise exception 'بيانات السعر غير صالحة'; end if;
 select * into d from public.discount_codes where code=upper(trim(p_code)) and is_active=true and starts_at<=now()
 and (expires_at is null or expires_at>now()) and (max_redemptions is null or redemption_count<max_redemptions)
 and currency=p_currency and (applies_to='both' or (applies_to='plans' and p_applies_to='plan') or (applies_to='listing_fees' and p_applies_to='listing_fee'))
 and (plan_id is null or (p_applies_to='plan' and plan_id=p_plan_id)) for update;
 if not found then raise exception 'كود الخصم غير صالح أو منتهي أو غير متاح لهذا الشراء'; end if;
 if d.discount_type='percentage' then v_discount:=round(p_amount*d.discount_value/100,2); else v_discount:=d.discount_value; end if;
 v_discount:=least(p_amount,v_discount); v_final:=greatest(0,p_amount-v_discount);
 return jsonb_build_object('valid',true,'code',d.code,'discount_type',d.discount_type,'discount_value',d.discount_value,'discount_amount',v_discount,'original_amount',p_amount,'final_amount',v_final,'currency',p_currency);
end; $$;
revoke all on function public.quote_discount_code(text,text,numeric,text,uuid) from public,anon;
grant execute on function public.quote_discount_code(text,text,numeric,text,uuid) to authenticated;
