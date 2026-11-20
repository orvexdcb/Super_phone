import { notFound } from "next/navigation";
import { CONDITION_LABELS, formatPrice } from "@super-phone/shared";
import { createServerSupabase } from "../../../lib/supabase-server";
import { listingImageUrl } from "../../../lib/supabase";
import { toWhatsApp } from "../../../lib/phone";
import ListingActions from "../../../components/ListingActions";
import { cookies } from "next/headers";
import { t } from "../../../lib/i18n";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPEC_LABELS: Record<string, string> = {
  storage: "التخزين", ram: "الذاكرة", battery_health: "صحة البطارية", color: "اللون",
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
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
      {l.status !== "active" && <p className="notice">{t(lang, "notPublished")}</p>}
      <div className="gallery">
        {images.length === 0 && <div className="thumb"><span>{t(lang, "noImage")}</span></div>}
        {images.map((im) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={im.storage_path} src={listingImageUrl(im.storage_path)} alt={l.title} />
        ))}
      </div>
      <h1>{l.title}</h1>
      <p className="price big">{formatPrice(Number(l.price), l.currency)}</p>
      <p className="meta">
        {lang === "en" ? ({new:"New",like_new:"Like new",used:"Used",for_parts:"For parts"}[l.condition] || CONDITION_LABELS[l.condition as keyof typeof CONDITION_LABELS]) : lang === "ku" ? ({new:"نوێ",like_new:"وەک نوێ",used:"بەکارهاتوو",for_parts:"بۆ پارچە"}[l.condition] || CONDITION_LABELS[l.condition as keyof typeof CONDITION_LABELS]) : CONDITION_LABELS[l.condition as keyof typeof CONDITION_LABELS]} · {l.categories?.[0]?.name_ar} · {l.governorate}
        {l.city ? ` — ${l.city}` : ""}
      </p>
      {(l.brand || l.model) && <p className="meta">{[l.brand, l.model].filter(Boolean).join(" ")}</p>}

      {l.listing_specs.length > 0 && (
        <table className="specs">
          <tbody>
            {l.listing_specs.map((s: { spec_key: string; spec_value: string }) => (
              <tr key={s.spec_key}><th>{lang === "en" ? ({storage:"Storage",ram:"RAM",battery_health:"Battery health",color:"Color"}[s.spec_key] ?? s.spec_key) : lang === "ku" ? ({storage:"بیرگە",ram:"ڕام",battery_health:"تەندروستی باتری",color:"ڕەنگ"}[s.spec_key] ?? s.spec_key) : SPEC_LABELS[s.spec_key] ?? s.spec_key}</th><td>{s.spec_value}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {l.description && <p className="desc">{l.description}</p>}

      {l.contact_phone && (
        <div className="contact">
          <a href={`tel:${l.contact_phone.replace(/[^\d+]/g, "")}`} className="cta-link">{t(lang, "call")}</a>
          {wa && <a href={`https://wa.me/${wa}`} className="cta-link wa" target="_blank" rel="noopener noreferrer">{t(lang, "whatsapp")}</a>}
        </div>
      )}
      <ListingActions
        listingId={l.id}
        userId={user?.id ?? null}
        lang={lang}
        initialFav={isFav}
        canReport={user?.id !== l.seller_id && l.status === "active"}
      />
      <p className="meta safety">
        {t(lang, "safety")}
      </p>
    </main>
  );
}
