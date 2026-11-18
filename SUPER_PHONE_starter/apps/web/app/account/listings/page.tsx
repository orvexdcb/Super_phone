import Link from "next/link";
import { redirect } from "next/navigation";
import { STATUS_LABELS, formatPrice, type ListingStatus } from "@super-phone/shared";
import { createServerSupabase } from "../../../lib/supabase-server";
import { listingImageUrl } from "../../../lib/supabase";
import ListingRowActions from "../../../components/ListingRowActions";

export const dynamic = "force-dynamic";

export default async function MyListingsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
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
        <h1>إعلاناتي</h1>
        <Link href="/account/listings/new" className="cta-link">+ إعلان جديد</Link>
      </div>
      {sp.edited && <p className="notice ok">تم حفظ التعديلات.</p>}
      {sp.posted && <p className="notice ok">تم إرسال إعلانك للمراجعة، وسيظهر بعد الموافقة.</p>}
      {(!listings || listings.length === 0) && <p className="notice">لم تنشر أي إعلان بعد.</p>}
      <section className="grid">
        {(listings ?? []).map((l) => {
          const first = [...l.listing_images].sort((a, b) => a.sort_order - b.sort_order)[0];
          return (
            <article key={l.id} className="card">
              <div className="thumb">
                {first ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listingImageUrl(first.storage_path)} alt={l.title} loading="lazy" />
                ) : <span>بدون صورة</span>}
              </div>
              <div className="body">
                <h3>{l.title}</h3>
                <p className="price">{formatPrice(Number(l.price), l.currency)}</p>
                <p className={`badge s-${l.status}`}>{STATUS_LABELS[l.status as ListingStatus]}</p>
                {l.status === "rejected" && l.rejection_reason && (
                  <p className="meta">السبب: {l.rejection_reason}</p>
                )}
                <ListingRowActions id={l.id} status={l.status} />
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
