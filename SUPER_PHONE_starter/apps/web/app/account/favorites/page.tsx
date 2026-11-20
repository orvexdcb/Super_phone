import { redirect } from "next/navigation";
import ListingCard from "../../../components/ListingCard";
import type { ListingCard as Listing } from "../../../lib/listings";
import { createServerSupabase } from "../../../lib/supabase-server";
import { cookies } from "next/headers";
import { t } from "../../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
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
      <h1>{t(lang, "favorites")}</h1>
      {listings.length === 0 && <p className="notice">{t(lang, "noFavorites")}</p>}
      <section className="grid">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </section>
    </main>
  );
}
