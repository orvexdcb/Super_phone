-- SUPER PHONE: read-only FK orphan checks. Expected orphan_rows = 0 for every relation.
select * from (
 select 'profiles -> auth.users' relation, count(*) orphan_rows from public.profiles p left join auth.users u on u.id=p.id where u.id is null
 union all select 'listings -> profiles', count(*) from public.listings c left join public.profiles p on p.id=c.seller_id where p.id is null
 union all select 'listings -> categories', count(*) from public.listings c left join public.categories p on p.id=c.category_id where p.id is null
 union all select 'listing_images -> listings', count(*) from public.listing_images c left join public.listings p on p.id=c.listing_id where p.id is null
 union all select 'listing_specs -> listings', count(*) from public.listing_specs c left join public.listings p on p.id=c.listing_id where p.id is null
 union all select 'favorites -> profiles', count(*) from public.favorites c left join public.profiles p on p.id=c.user_id where p.id is null
 union all select 'favorites -> listings', count(*) from public.favorites c left join public.listings p on p.id=c.listing_id where p.id is null
 union all select 'reports -> profiles', count(*) from public.reports c left join public.profiles p on p.id=c.reporter_id where p.id is null
 union all select 'reports -> listings', count(*) from public.reports c left join public.listings p on p.id=c.listing_id where p.id is null
 union all select 'accessory_products -> profiles', count(*) from public.accessory_products c left join public.profiles p on p.id=c.seller_id where p.id is null
 union all select 'accessory_products -> accessory_categories', count(*) from public.accessory_products c left join public.accessory_categories p on p.id=c.category_id where p.id is null
 union all select 'accessory_product_images -> accessory_products', count(*) from public.accessory_product_images c left join public.accessory_products p on p.id=c.product_id where p.id is null
 union all select 'accessory_orders -> buyer profiles', count(*) from public.accessory_orders c left join public.profiles p on p.id=c.buyer_id where p.id is null
 union all select 'accessory_orders -> seller profiles', count(*) from public.accessory_orders c left join public.profiles p on p.id=c.seller_id where p.id is null
 union all select 'accessory_orders -> products', count(*) from public.accessory_orders c left join public.accessory_products p on p.id=c.product_id where p.id is null
 union all select 'discount_codes -> subscription_plans', count(*) from public.discount_codes c left join public.subscription_plans p on p.id=c.plan_id where c.plan_id is not null and p.id is null
 union all select 'discount_redemptions -> profiles', count(*) from public.discount_redemptions c left join public.profiles p on p.id=c.user_id where p.id is null
 union all select 'discount_redemptions -> discount_codes', count(*) from public.discount_redemptions c left join public.discount_codes p on p.id=c.discount_code_id where p.id is null
 union all select 'discount_redemptions -> subscription_plans', count(*) from public.discount_redemptions c left join public.subscription_plans p on p.id=c.plan_id where c.plan_id is not null and p.id is null
) checks order by relation;
