-- SUPER PHONE
-- Seed categories
-- Already applied to the production Supabase database.
-- Do not execute again on the existing database.

INSERT INTO public.categories (id, slug, name_ar, is_active, sort_order)
VALUES
('1787bc16-11cd-4e10-b14c-4eb40501a96c', 'phone', 'هواتف', true, 1),
('b061d075-9202-4703-bbb3-98e2ebb52a4d', 'tablet', 'تابلت', true, 2),
('c2d1d79f-2c42-4a5d-aa3c-064259a20139', 'laptop', 'لابتوب', true, 3),
('097201b4-8a75-4494-b70e-bcb569ebe2a7', 'desktop', 'كمبيوتر مكتبي', true, 4),
('8c576946-db55-41eb-ad1d-bc8ca02fec4e', 'headphones', 'سماعات', true, 5),
('31cea8f8-28d6-45ea-9515-0780ddfc8159', 'smartwatch', 'ساعات ذكية', true, 6)
ON CONFLICT DO NOTHING;
