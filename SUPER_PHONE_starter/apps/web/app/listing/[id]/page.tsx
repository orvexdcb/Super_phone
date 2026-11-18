import { notFound } from "next/navigation";
import { CONDITION_LABELS, formatPrice } from "@super-phone/shared";
import { createServerSupabase } from "../../../lib/supabase-server";
import { listingImageUrl } from "../../../lib/supabase";
import { toWhatsApp } from "../../../lib/phone";
import ListingActions from "../../../components/ListingActions";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPEC_LABELS: Record<string, string> = {
  storage: "التخزين", ram: "الذاكرة", battery_health: "صحة البطارية", color: "اللون",
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createServerSupabase();
  const { data: l } = await supabase
    .from("listings")
    .select("*, categories(name_ar), listing_images(storage_path, sort_order), listing_specs(spec_key, spec_value)")
    .eq("id", id)
    .maybeSingle();
  if (!l) notFound(); // RLS: غير المنشور لا يراه إلا صاحبه أو الإدارة

  const { data: { user } } = await supabase.auth.getUser();
  let isFav = false;
  if (user) {
    const { data: f } = await supabase.from("favorites").select("listing_id")
      .eq("listing_id", id).eq("user_id", user.id).maybeSingle();
    isFav = !!f;
  }
  const images = [...l.listing_images].sort((a, b) => a.sort_order - b.sort_order);
  const wa = l.contact_phone ? toWhatsApp(l.contact_phone) : null;

  return (
    <main className="detail">
      {l.status !== "active" && <p className="notice">هذا الإعلان غير منشور حالياً (معاينة لك فقط).</p>}
      <div className="gallery">
        {images.length === 0 && <div className="thumb"><span>بدون صورة</span></div>}
        {images.map((im) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={im.storage_path} src={listingImageUrl(im.storage_path)} alt={l.title} />
        ))}
      </div>
      <h1>{l.title}</h1>
      <p className="price big">{formatPrice(Number(l.price), l.currency)}</p>
      <p className="meta">
        {CONDITION_LABELS[l.condition as keyof typeof CONDITION_LABELS]} · {l.categories?.[0]?.name_ar} · {l.governorate}
        {l.city ? ` — ${l.city}` : ""}
      </p>
      {(l.brand || l.model) && <p className="meta">{[l.brand, l.model].filter(Boolean).join(" ")}</p>}

      {l.listing_specs.length > 0 && (
        <table className="specs">
          <tbody>
            {l.listing_specs.map((s: { spec_key: string; spec_value: string }) => (
              <tr key={s.spec_key}><th>{SPEC_LABELS[s.spec_key] ?? s.spec_key}</th><td>{s.spec_value}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {l.description && <p className="desc">{l.description}</p>}

      {l.contact_phone && (
        <div className="contact">
          <a href={`tel:${l.contact_phone.replace(/[^\d+]/g, "")}`} className="cta-link">اتصال</a>
          {wa && <a href={`https://wa.me/${wa}`} className="cta-link wa" target="_blank" rel="noopener noreferrer">واتساب</a>}
        </div>
      )}
      <ListingActions
        listingId={l.id}
        userId={user?.id ?? null}
        initialFav={isFav}
        canReport={user?.id !== l.seller_id && l.status === "active"}
      />
      <p className="meta safety">
        نصيحة: افحص الجهاز بنفسك قبل الدفع، وقابل البائع في مكان عام، ولا تحوّل مبالغ مقدماً.
      </p>
    </main>
  );
}
