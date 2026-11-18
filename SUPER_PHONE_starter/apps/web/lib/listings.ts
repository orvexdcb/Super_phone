import { supabase } from "./supabase";

export type ListingCard = {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: "new" | "used" | "refurbished";
  governorate: string;
  city: string | null;
  created_at: string;
  categories: { slug: string; name_ar: string };
  listing_images: { storage_path: string; sort_order: number }[];
};

export type Filters = {
  q?: string;
  category?: string;
  condition?: string;
  governorate?: string;
  min?: string;
  max?: string;
  page?: string;
};

const PAGE_SIZE = 24;

export async function fetchCategories() {
  const { data } = await supabase
    .from("categories")
    .select("slug, name_ar")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchListings(f: Filters) {
  let query = supabase
    .from("listings")
    .select(
      "id,title,price,currency,condition,governorate,city,created_at,categories!inner(slug,name_ar),listing_images(storage_path,sort_order)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (f.q) query = query.ilike("title", `%${f.q.replace(/[%_,]/g, " ").trim()}%`);
  if (f.category) query = query.eq("categories.slug", f.category);
  if (f.condition && ["new", "used", "refurbished"].includes(f.condition))
    query = query.eq("condition", f.condition);
  if (f.governorate) query = query.eq("governorate", f.governorate);
  const min = Number(f.min);
  const max = Number(f.max);
  if (f.min && Number.isFinite(min)) query = query.gte("price", min);
  if (f.max && Number.isFinite(max)) query = query.lte("price", max);

  const page = Math.max(1, Math.floor(Number(f.page)) || 1);
  const from = (page - 1) * PAGE_SIZE;
  // نجلب عنصراً زائداً لمعرفة وجود صفحة تالية
  const { data, error } = await query.range(from, from + PAGE_SIZE);
  if (error) return { listings: [] as ListingCard[], error: error.message, hasNext: false, page };
  const rows = (data ?? []) as unknown as ListingCard[];
  return { listings: rows.slice(0, PAGE_SIZE), error: null, hasNext: rows.length > PAGE_SIZE, page };
}
