-- 0005 (منفَّذ على Super_phone ومُختبَر): تعديل إعلان منشور يعيده للمراجعة
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
    if old.status = 'active' and new.status = 'active' and
       (new.title, new.description, new.price, new.currency, new.condition, new.brand, new.model,
        new.governorate, new.city, new.contact_phone, new.category_id)
       is distinct from
       (old.title, old.description, old.price, old.currency, old.condition, old.brand, old.model,
        old.governorate, old.city, old.contact_phone, old.category_id) then
      new.status := 'pending_review';
    end if;
  end if;
  return new;
end $$;

create or replace function public.requeue_listing_review()
returns trigger language plpgsql security definer set search_path = '' as $$
declare lid uuid;
begin
  if tg_op = 'DELETE' then lid := old.listing_id; else lid := new.listing_id; end if;
  if not public.is_admin() then
    update public.listings set status = 'pending_review' where id = lid and status = 'active';
  end if;
  return null;
end $$;
revoke execute on function public.requeue_listing_review() from public, anon, authenticated;

create trigger trg_images_requeue after insert or update or delete on public.listing_images
  for each row execute function public.requeue_listing_review();
create trigger trg_specs_requeue after insert or update or delete on public.listing_specs
  for each row execute function public.requeue_listing_review();
