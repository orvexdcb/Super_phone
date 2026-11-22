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
  const categoryIcons: Record<string,string> = { phone:"▯", tablet:"▱", laptop:"▰", desktop:"▦", headphones:"♫", smartwatch:"◷" };
  return <FirstRunFlow>
    <main className="sp-home">
      <section className="sp-welcome">
        <div className="sp-welcome-copy">
          <span className="sp-kicker">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <div className="sp-mark-art" aria-hidden="true"><span>SP</span><i>✦</i></div>
      </section>

      <section className="sp-primary-actions" aria-label="الأدوات الرئيسية">
        <Link href="/account/listings/new" className="sp-action sp-action-sell"><span className="sp-action-icon">＋</span><strong>{copy.sell}</strong><small>{copy.sellHint}</small></Link>
        <Link href="#sp-search" className="sp-action"><span className="sp-action-icon">⌕</span><strong>{copy.search}</strong><small>{lang==="en"?"Search all listings":lang==="ku"?"گەڕان لە هەموو ڕیکلامەکان":"ابحث في جميع الإعلانات"}</small></Link>
        <Link href="/account/favorites" className="sp-action"><span className="sp-action-icon">♡</span><strong>{copy.favorites}</strong><small>{lang==="en"?"Your saved devices":lang==="ku"?"ئامێرە پاشەکەوتکراوەکان":"الأجهزة التي حفظتها"}</small></Link>
      </section>

      <section className="sp-category-section">
        <div className="sp-section-heading"><div><span className="sp-kicker">{lang==="en"?"EXPLORE":"استكشف"}</span><h2>{copy.categories}</h2></div><span className="sp-heading-mark">✦</span></div>
        <div className="sp-category-grid">
          {categories.map(category=><Link key={category.slug} href={"/?category="+encodeURIComponent(category.slug)+"#sp-search"} className="sp-category">
            <span className="sp-category-icon">{categoryIcons[category.slug] || "▯"}</span><strong>{categoryName(lang,category.name_ar)}</strong><span className="sp-category-arrow">↗</span>
          </Link>)}
        </div>
      </section>

      <section className="sp-promo">
        <div><span className="sp-promo-label">SUPER PHONE</span><h2>{copy.promoTitle}</h2><p>{copy.promoText}</p></div>
        <div className="sp-promo-device" aria-hidden="true"><span></span></div>
      </section>

      <section className="sp-search-section" id="sp-search">
        <div className="sp-section-heading"><div><span className="sp-kicker">DISCOVER</span><h2>{copy.searchLabel}</h2></div></div>
        <form method="get" className="sp-filters">
          <input name="q" defaultValue={filters.q} placeholder={copy.searchPlaceholder}/>
          <select name="category" defaultValue={filters.category}><option value="">{copy.allCategories}</option>{categories.map(c=><option key={c.slug} value={c.slug}>{categoryName(lang,c.name_ar)}</option>)}</select>
          <select name="condition" defaultValue={filters.condition}><option value="">{copy.allConditions}</option>{Object.entries(CONDITION_LABELS).map(([k,v])=><option key={k} value={k}>{conditionName(lang,k,v)}</option>)}</select>
          <select name="governorate" defaultValue={filters.governorate}><option value="">{copy.allGovernorates}</option>{GOVERNORATES.map(g=><option key={g} value={g}>{governorateName(lang,g)}</option>)}</select>
          <input name="min" type="number" min={0} defaultValue={filters.min} placeholder={copy.min}/>
          <input name="max" type="number" min={0} defaultValue={filters.max} placeholder={copy.max}/>
          <button type="submit">{copy.viewAll}</button>
        </form>
      </section>

      <section className="sp-listings-section">
        <div className="sp-section-heading"><div><span className="sp-kicker">{lang==="en"?"JUST LISTED":"وصلت حديثاً"}</span><h2>{copy.newest}</h2></div><span className="sp-live-dot">● {lang==="en"?"Live listings":"إعلانات متاحة"}</span></div>
        {error&&<p className="notice">{copy.error}</p>}
        {!error&&listings.length===0&&<p className="notice">{copy.empty}</p>}
        <section className="sp-listing-grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</section>
        {(page>1||hasNext)&&<nav className="pager">{hasNext?<a href={pageHref(page+1)}>{lang==="en"?"Next":"التالي"} ›</a>:<span/>}<span className="meta">{page}</span>{page>1?<a href={pageHref(page-1)}>‹ {lang==="en"?"Previous":"السابق"}</a>:<span/>}</nav>}
      </section>
    </main>
  </FirstRunFlow>;
}
