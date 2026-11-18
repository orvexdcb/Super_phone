-- 0003 (منفَّذ على Super_phone): منع استدعاء دوال الـtriggers عبر REST
revoke execute on function public.handle_new_user()        from public, anon, authenticated;
revoke execute on function public.protect_listing_status() from public, anon, authenticated;
revoke execute on function public.protect_profile_fields() from public, anon, authenticated;
-- is_admin() تبقى قابلة للتنفيذ عمداً: سياسات RLS تستدعيها، ولا تكشف إلا حالة المستخدم نفسه.
