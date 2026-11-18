-- SUPER PHONE — 0001 core schema (DRAFT: لم يُنفَّذ بعد، بانتظار المراجعة)
-- Project: Super_phone (eqlenftagozvjezswbaf)

-- ========== Enums ==========
create type public.user_role as enum ('user', 'admin');
create type public.listing_status as enum ('draft','pending_review','active','paused','sold','rejected');
create type public.device_condition as enum ('new','used','refurbished');
create type public.report_status as enum ('open','reviewed','dismissed');

-- ========== Helpers ==========
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ========== profiles ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  governorate text,
  role public.user_role not null default 'user',
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- المستخدم لا يستطيع ترقية نفسه أو رفع الحظر عن نفسه
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_banned := old.is_banned;
  end if;
  return new;
end $$;
create trigger trg_profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ========== categories ==========
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ========== listings ==========
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 4000),
  price numeric(12,0) not null check (price >= 0),
  currency text not null default 'IQD' check (currency in ('IQD','USD')),
  condition public.device_condition not null,
  brand text,
  model text,
  governorate text not null,
  city text,
  contact_phone text,
  status public.listing_status not null default 'pending_review',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.listings (status, created_at desc);
create index on public.listings (category_id, status);
create index on public.listings (governorate, status);
create index on public.listings (price);
create index on public.listings (seller_id);
create trigger trg_listings_updated before update on public.listings
  for each row execute function public.set_updated_at();

-- غير الأدمن لا يستطيع تفعيل إعلان أو رفضه؛ أي تعديل على إعلان فعّال يعيده للمراجعة
create or replace function public.protect_listing_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if new.status not in ('draft','pending_review') then new.status := 'pending_review'; end if;
    new.rejection_reason := null;
  else
    new.seller_id := old.seller_id;
    new.rejection_reason := old.rejection_reason;
    if new.status in ('active','rejected') and new.status is distinct from old.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;
create trigger trg_listings_protect before insert or update on public.listings
  for each row execute function public.protect_listing_status();

-- ========== listing_images ==========
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.listing_images (listing_id, sort_order);

-- ========== listing_specs (مواصفات مرنة) ==========
create table public.listing_specs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  spec_key text not null,      -- مثال: ram, storage, battery_health
  spec_value text not null,
  unique (listing_id, spec_key)
);

-- ========== favorites ==========
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index on public.favorites (listing_id);

-- ========== reports ==========
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);
create index on public.reports (status, created_at desc);

-- ========== RLS ==========
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.listings       enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_specs  enable row level security;
alter table public.favorites      enable row level security;
alter table public.reports        enable row level security;

-- profiles: المستخدم يرى ويعدّل ملفه، والأدمن يرى ويدير الكل
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- categories: قراءة عامة، تعديل للأدمن
create policy categories_select on public.categories for select to anon, authenticated using (true);
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- listings
create policy listings_select on public.listings for select to anon, authenticated
  using (status = 'active' or seller_id = (select auth.uid()) or public.is_admin());
create policy listings_insert on public.listings for insert to authenticated
  with check (seller_id = (select auth.uid())
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_banned));
create policy listings_update on public.listings for update to authenticated
  using (seller_id = (select auth.uid()) or public.is_admin())
  with check (seller_id = (select auth.uid()) or public.is_admin());
create policy listings_delete on public.listings for delete to authenticated
  using (seller_id = (select auth.uid()) or public.is_admin());

-- listing_images / listing_specs: تتبع صلاحيات الإعلان
create policy images_select on public.listing_images for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
    and (l.status = 'active' or l.seller_id = (select auth.uid()) or public.is_admin())));
create policy images_write on public.listing_images for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
    and (l.seller_id = (select auth.uid()) or public.is_admin())))
  with check (exists (select 1 from public.listings l where l.id = listing_id
    and (l.seller_id = (select auth.uid()) or public.is_admin())));

create policy specs_select on public.listing_specs for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
    and (l.status = 'active' or l.seller_id = (select auth.uid()) or public.is_admin())));
create policy specs_write on public.listing_specs for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
    and (l.seller_id = (select auth.uid()) or public.is_admin())))
  with check (exists (select 1 from public.listings l where l.id = listing_id
    and (l.seller_id = (select auth.uid()) or public.is_admin())));

-- favorites: خاصة بصاحبها
create policy favorites_own on public.favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- reports: أي مسجّل يبلّغ، والأدمن فقط يقرأ ويدير
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy reports_admin on public.reports for select to authenticated using (public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
