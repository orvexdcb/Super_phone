import Link from "next/link";
import { redirect } from "next/navigation";
import { STATUS_LABELS, formatPrice, type ListingStatus } from "@super-phone/shared";
import { createServerSupabase } from "../../../lib/supabase-server";
import { listingImageUrl } from "../../../lib/supabase";
import ListingRowActions from "../../../components/ListingRowActions";
import { cookies } from "next/headers";
import { t } from "../../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function MyListingsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/listings");

  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,price,currency,status,rejection_reason,created_at,listing_images(storage_path,sort_order)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main>
      <div className="page-head">
        <h1>{t(lang, "myListings")}</h1>
        <Link href="/account/listings/new" className="cta-link">+ {t(lang, "newPost")}</Link>
      </div>
      {sp.edited && <p className="notice ok">{t(lang, "edited")}</p>}
      {sp.posted && <p className="notice ok">{t(lang, "posted")}</p>}
      {(!listings || listings.length === 0) && <p className="notice">{t(lang, "noListings")}</p>}
      <section className="grid">
        {(listings ?? []).map((l) => {
          const first = [...l.listing_images].sort((a, b) => a.sort_order - b.sort_order)[0];
          return (
            <article key={l.id} className="card">
              <div className="thumb">
                {first ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listingImageUrl(first.storage_path)} alt={l.title} loading="lazy" />
                ) : <span>{t(lang, "noImage")}</span>}
              </div>
              <div className="body">
                <h3>{l.title}</h3>
                <p className="price">{formatPrice(Number(l.price), l.currency)}</p>
                <p className={`badge s-${l.status}`}>{t(lang, l.status === "active" ? "published" : l.status === "pending_review" ? "pending" : l.status === "rejected" ? "rejected" : l.status === "paused" ? "paused" : "sold")}</p>
                {l.status === "rejected" && l.rejection_reason && (
                  <p className="meta">{t(lang, "reason")}: {l.rejection_reason}</p>
                )}
                <ListingRowActions id={l.id} status={l.status} lang={lang} />
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
