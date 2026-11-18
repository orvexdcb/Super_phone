import { redirect } from "next/navigation";
import ListingCard from "../../../components/ListingCard";
import type { ListingCard as Listing } from "../../../lib/listings";
import { createServerSupabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/favorites");

  // inner join: الإعلانات غير المنشورة تختفي تلقائياً بسبب RLS
  const { data } = await supabase
    .from("favorites")
    .select("created_at, listings!inner(id,title,price,currency,condition,governorate,city,created_at,categories(slug,name_ar),listing_images(storage_path,sort_order))")
    .eq("user_id", user.id)
    .eq("listings.status", "active")
    .order("created_at", { ascending: false });

  const listings = (data ?? []).map((r) => r.listings as unknown as Listing);

  return (
    <main>
      <h1>المفضلة</h1>
      {listings.length === 0 && <p className="notice">لم تضف أي إعلان للمفضلة بعد.</p>}
      <section className="grid">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </section>
    </main>
  );
}
