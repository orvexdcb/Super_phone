create or replace function public.prepare_accessory_order()
returns trigger language plpgsql set search_path = ''
as $$
declare p record;
begin
 select seller_id,price,currency,stock,status into p
 from public.accessory_products where id=new.product_id for update;
 if not found or p.status<>'active' then raise exception 'Product is not available'; end if;
 if p.stock<new.quantity then raise exception 'Insufficient stock'; end if;
 new.seller_id:=p.seller_id; new.unit_price:=p.price; new.currency:=p.currency;
 new.buyer_id:=(select auth.uid()); return new;
end;
$$;
revoke all on function public.prepare_accessory_order() from public,anon,authenticated;
create trigger trg_prepare_accessory_order before insert on public.accessory_orders
for each row execute function public.prepare_accessory_order();
drop policy if exists accessory_products_insert on public.accessory_products;
create policy accessory_products_insert on public.accessory_products for insert to authenticated
with check(public.is_admin() or (seller_id=(select auth.uid()) and status in ('draft','pending_review') and is_featured=false and not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_banned)));
drop policy if exists accessory_products_update on public.accessory_products;
create policy accessory_products_update on public.accessory_products for update to authenticated
using(seller_id=(select auth.uid()) or public.is_admin())
with check(public.is_admin() or (seller_id=(select auth.uid()) and status in ('draft','pending_review','paused','out_of_stock') and is_featured=false));
