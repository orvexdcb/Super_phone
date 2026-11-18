-- 0004 (منفَّذ على Super_phone): الحذف والتعديل في Storage يتطلبان صلاحية قراءة أيضاً
create policy "listing images select own folder" on storage.objects for select to authenticated
  using (bucket_id = 'listing-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
