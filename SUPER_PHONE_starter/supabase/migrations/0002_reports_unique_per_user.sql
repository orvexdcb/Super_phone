-- 0002 (منفَّذ على Super_phone): بلاغ واحد لكل مستخدم على كل إعلان
alter table public.reports add constraint reports_one_per_user unique (listing_id, reporter_id);
