import { CONDITION_LABELS, GOVERNORATES } from "@super-phone/shared";
import Link from "next/link";
import ListingCard from "../components/ListingCard";
import { fetchCategories, fetchListings, type Filters } from "../lib/listings";
import FirstRunFlow from "../components/FirstRunFlow";
import { cookies } from "next/headers";
import { categoryName, conditionName, governorateName } from "../lib/i18n";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const copy = {
    ar: { eyebrow:"منصتك للأجهزة الذكية", title:"كل الأجهزة التي تبحث عنها… في مكان واحد", intro:"اكتشف الأجهزة المعروضة للبيع، قارن بينها، أو اعرض جهازك بسهولة.", sell:"بيع جهازك", search:"ابحث عن جهاز", favorites:"المفضلة", categories:"تصفح حسب الفئة", searchLabel:"ابحث وصَفِّ النتائج", searchPlaceholder:"ما الجهاز الذي تبحث عنه؟", allCategories:"جميع الفئات", allConditions:"جميع الحالات", allGovernorates:"كل المحافظات", min:"أقل سعر", max:"أعلى سعر", newest:"أحدث الأجهزة", viewAll:"عرض النتائج", empty:"لا توجد أجهزة مطابقة حالياً.", error:"تعذر تحميل الإعلانات. حاول مجدداً.", promoTitle:"اعثر على جهازك المناسب", promoText:"تصفح الإعلانات وقارن الأسعار والمواصفات قبل التواصل مع البائع.", sellHint:"أضف الصور والتفاصيل والسعر ليصل إعلانك إلى المهتمين." },
    en: { eyebrow:"YOUR SMART DEVICE MARKETPLACE", title:"Find your next device in one place", intro:"Discover devices for sale, compare options, or list your own in minutes.", sell:"Sell your device", search:"Find a device", favorites:"Favorites", categories:"Browse by category", searchLabel:"Search and filter", searchPlaceholder:"What device are you looking for?", allCategories:"All categories", allConditions:"All conditions", allGovernorates:"All governorates", min:"Min price", max:"Max price", newest:"Latest devices", viewAll:"Show results", empty:"No matching devices right now.", error:"Could not load listings. Please try again.", promoTitle:"Your next device is waiting", promoText:"Browse listings and compare prices and details before contacting sellers.", sellHint:"Add photos, details and a price to reach interested buyers." },
    ku: { eyebrow:"بازاڕی ئامێرە زیرەکەکان", title:"هەموو ئامێرەکان لە یەک شوێندا", intro:"ئامێرەکان ببینە، بەراوردیان بکە یان ئامێرەکەت بە ئاسانی بفرۆشە.", sell:"ئامێرەکەت بفرۆشە", search:"گەڕان بۆ ئامێر", favorites:"دڵخوازەکان", categories:"گەڕان بەپێی جۆر", searchLabel:"گەڕان و پاڵاوتن", searchPlaceholder:"بەدوای چ ئامێرێکدا دەگەڕێیت؟", allCategories:"هەموو جۆرەکان", allConditions:"هەموو دۆخەکان", allGovernorates:"هەموو پارێزگاکان", min:"کەمترین نرخ", max:"زۆرترین نرخ", newest:"نوێترین ئامێرەکان", viewAll:"بینینی ئەنجامەکان", empty:"هیچ ئامێرێکی گونجاو نییە.", error:"بارکردنی ڕیکلامەکان سەرکەوتوو نەبوو.", promoTitle:"ئامێری دڵخوازت بدۆزەرەوە", promoText:"ڕیکلامەکان ببینە و نرخ و تایبەتمەندییەکان بەراورد بکە.", sellHint:"وێنە و زانیاری و نرخ زیاد بکە بۆ ڕاکێشانی کڕیار." }
  }[lang];
  const filters: Filters = { q: one(sp.q), category: one(sp.category), condition: one(sp.condition), governorate: one(sp.governorate), min: one(sp.min), max: one(sp.max), page: one(sp.page) };
  const [categories, result] = await Promise.all([fetchCategories(), fetchListings(filters)]);
  const { listings, error, hasNext, page } = result;
  const pageHref = (n: number) => { const p = new URLSearchParams(); (["q","category","condition","governorate","min","max"] as const).forEach(k=>{if(filters[k])p.set(k,filters[k]!)}); if(n>1)p.set("page",String(n)); return p.toString()?"/?"+p.toString():"/"; };
  const iconSvg = (slug: string) => {
    const common = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
    switch (slug) {
      case "phone": return <svg {...common}><rect x="14" y="4" width="20" height="40" rx="4"/><path d="M21 9h6M22 38h4"/></svg>;
      case "tablet": return <svg {...common}><rect x="8" y="4" width="32" height="40" rx="4"/><path d="M21 9h6M22 39h4"/></svg>;
      case "laptop": return <svg {...common}><rect x="11" y="7" width="26" height="25" rx="2"/><path d="M5 37h38l-3 5H8z"/></svg>;
      case "desktop": return <svg {...common}><rect x="5" y="5" width="38" height="28" rx="3"/><path d="M24 33v8M16 42h16M19 12h10M19 18h10"/></svg>;
      case "headphones": return <svg {...common}><path d="M7 25v-4a17 17 0 0 1 34 0v4"/><rect x="6" y="23" width="8" height="15" rx="3"/><rect x="34" y="23" width="8" height="15" rx="3"/><path d="M34 38c-2 4-6 5-11 5"/></svg>;
      case "smartwatch": return <svg {...common}><path d="M17 4h14l2 9H15zM15 35h18l-2 9H17z"/><rect x="11" y="13" width="26" height="22" rx="5"/><path d="M24 18v6l5 3"/></svg>;
      default: return <svg {...common}><rect x="14" y="4" width="20" height="40" rx="4"/></svg>;
    }
  };
  return <FirstRunFlow>
    <main className="sp-home">
      <section className="sp-welcome">
        <div className="sp-welcome-copy">
          <span className="sp-kicker">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <div className="sp-mark-art" aria-hidden="true"><img src="/pwa-icon-192.png" alt="" /></div>
      </section>

      <section id="sp-category-section" className="sp-category-section">
        <div className="sp-section-heading"><div><span className="sp-kicker">{lang==="en"?"EXPLORE":"استكشف"}</span><h2>{copy.categories}</h2></div><span className="sp-heading-mark">✦</span></div>
        <div className="sp-category-grid">
          {categories.map(category=><Link key={category.slug} href={"/search?category="+encodeURIComponent(category.slug)+"#sp-search"} className="sp-category">
            <span className="sp-category-icon">{iconSvg(category.slug)}</span><strong>{categoryName(lang,category.name_ar)}</strong><span className="sp-category-arrow">↗</span>
          </Link>)}
        </div>
      </section>

      <section className="sp-listings-section">
        <div className="sp-section-heading"><div><span className="sp-kicker">{lang==="en"?"JUST LISTED":"وصلت حديثاً"}</span><h2>{copy.newest}</h2></div><span className="sp-live-dot">● {lang==="en"?"Live listings":"إعلانات متاحة"}</span></div>
        {error&&<p className="notice">{copy.error}</p>}
        {!error&&listings.length===0&&<p className="notice">{copy.empty}</p>}
        <section className="sp-listing-grid">{listings.flatMap((l,index)=>[
          ...(index>0&&index%5===0?[<aside className="sp-inline-ad" key={`promo-${index}`}><span>{lang==="en"?"SPONSORED SPACE":lang==="ku"?"شوێنی ڕیکلام":"مساحة إعلانية"}</span><strong>{lang==="en"?"Promote your device on SUPER PHONE":lang==="ku"?"ئامێرەکەت لە SUPER PHONE بەرز بکەرەوە":"روّج لجهازك على SUPER PHONE"}</strong><p>{lang==="en"?"Reach buyers looking for their next device.":lang==="ku"?"بگەیەنە بە کڕیارانی بەدوای ئامێری نوێدا.":"اعرض جهازك أمام الباحثين عن أجهزتهم القادمة."}</p><Link href="/account/listings/new">{lang==="en"?"Create a listing":lang==="ku"?"دانانی ڕیکلام":"أضف إعلانك"} ←</Link></aside>]:[]),
          <ListingCard key={l.id} listing={l}/>
        ])}</section>
        {(page>1||hasNext)&&<nav className="pager">{hasNext?<a href={pageHref(page+1)}>{lang==="en"?"Next":"التالي"} ›</a>:<span/>}<span className="meta">{page}</span>{page>1?<a href={pageHref(page-1)}>‹ {lang==="en"?"Previous":"السابق"}</a>:<span/>}</nav>}
      </section>
    </main>
  </FirstRunFlow>;
}
