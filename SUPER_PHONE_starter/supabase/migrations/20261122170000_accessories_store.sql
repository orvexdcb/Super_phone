-- Isolated accessories store; does not touch device marketplace tables.
create table public.accessory_categories (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name_ar text not null, name_en text not null, name_ku text not null,
 sort_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.accessory_products (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.profiles(id) on delete restrict,
 category_id uuid not null references public.accessory_categories(id) on delete restrict,
 title text not null check(char_length(title) between 3 and 140),
 description text check(char_length(description)<=5000), brand text,
 price numeric(12,0) not null check(price>=0),
 currency text not null default 'IQD' check(currency in ('IQD','USD')),
 stock integer not null default 0 check(stock>=0), image_url text,
 is_featured boolean not null default false,
 status text not null default 'pending_review' check(status in ('draft','pending_review','active','paused','out_of_stock','rejected')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index accessory_products_public_idx on public.accessory_products(status,is_featured desc,created_at desc);
create index accessory_products_category_idx on public.accessory_products(category_id,status);
create index accessory_products_seller_idx on public.accessory_products(seller_id);
create table public.accessory_product_images (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.accessory_products(id) on delete cascade,
 image_url text not null, sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create index accessory_product_images_product_idx on public.accessory_product_images(product_id,sort_order);
create table public.accessory_orders (
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid not null references public.profiles(id) on delete restrict,
 seller_id uuid not null references public.profiles(id) on delete restrict,
 product_id uuid not null references public.accessory_products(id) on delete restrict,
 quantity integer not null default 1 check(quantity between 1 and 99),
 unit_price numeric(12,0) not null check(unit_price>=0),
 currency text not null check(currency in ('IQD','USD')),
 contact_phone text, note text check(char_length(note)<=1000),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','completed','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index accessory_orders_buyer_idx on public.accessory_orders(buyer_id,created_at desc);
create index accessory_orders_seller_idx on public.accessory_orders(seller_id,created_at desc);
create trigger trg_accessory_products_updated before update on public.accessory_products for each row execute function public.set_updated_at();
create trigger trg_accessory_orders_updated before update on public.accessory_orders for each row execute function public.set_updated_at();
alter table public.accessory_categories enable row level security;
alter table public.accessory_products enable row level security;
alter table public.accessory_product_images enable row level security;
alter table public.accessory_orders enable row level security;
create policy accessory_categories_read on public.accessory_categories for select to anon,authenticated using(is_active or public.is_admin());
create policy accessory_categories_admin on public.accessory_categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy accessory_products_read on public.accessory_products for select to anon,authenticated using(status='active' or seller_id=(select auth.uid()) or public.is_admin());
create policy accessory_products_insert on public.accessory_products for insert to authenticated with check(seller_id=(select auth.uid()) and not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_banned));
create policy accessory_products_update on public.accessory_products for update to authenticated using(seller_id=(select auth.uid()) or public.is_admin()) with check(seller_id=(select auth.uid()) or public.is_admin());
create policy accessory_products_delete on public.accessory_products for delete to authenticated using(seller_id=(select auth.uid()) or public.is_admin());
create policy accessory_product_images_read on public.accessory_product_images for select to anon,authenticated using(exists(select 1 from public.accessory_products p where p.id=product_id and (p.status='active' or p.seller_id=(select auth.uid()) or public.is_admin())));
create policy accessory_product_images_admin_write on public.accessory_product_images for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy accessory_orders_read on public.accessory_orders for select to authenticated using(buyer_id=(select auth.uid()) or seller_id=(select auth.uid()) or public.is_admin());
create policy accessory_orders_create on public.accessory_orders for insert to authenticated with check(buyer_id=(select auth.uid()) and exists(select 1 from public.accessory_products p where p.id=product_id and p.seller_id=seller_id and p.status='active' and p.stock>=quantity));
create policy accessory_orders_manage on public.accessory_orders for update to authenticated using(seller_id=(select auth.uid()) or public.is_admin()) with check(seller_id=(select auth.uid()) or public.is_admin());
grant select on public.accessory_categories,public.accessory_products,public.accessory_product_images to anon,authenticated;
grant insert,update,delete on public.accessory_categories to authenticated;
grant insert,update,delete on public.accessory_products to authenticated;
grant insert,update,delete on public.accessory_product_images to authenticated;
grant select,insert,update on public.accessory_orders to authenticated;
insert into public.accessory_categories(slug,name_ar,name_en,name_ku,sort_order) values
('phone-accessories','إكسسوارات الهواتف','Phone accessories','ئاکسسواراتی مۆبایل',1),
('chargers-cables','الشواحن والكابلات','Chargers & cables','شارژەر و کەیبڵ',2),
('headphones','السماعات','Headphones','گوێگر',3),
('cases-protection','الأغطية وحماية الشاشات','Cases & screen protection','قاپ و پاراستنی شاشە',4),
('computer-accessories','إكسسوارات اللابتوب والكمبيوتر','Laptop & computer accessories','ئاکسسواراتی لاپتۆپ و کۆمپیوتەر',5),
('watch-accessories','إكسسوارات الساعات الذكية','Smartwatch accessories','ئاکسسواراتی کاتژمێری زیرەک',6),
('batteries-power-banks','البطاريات وبنوك الطاقة','Batteries & power banks','باتری و پاوەربانک',7)
on conflict(slug) do update set name_ar=excluded.name_ar,name_en=excluded.name_en,name_ku=excluded.name_ku,sort_order=excluded.sort_order;
