import { CONDITION_LABELS, GOVERNORATES } from "@super-phone/shared";
import Link from "next/link";
import ListingCard from "../../components/ListingCard";
import { fetchCategories, fetchListings, type Filters } from "../../lib/listings";
import { cookies } from "next/headers";
import { categoryName, conditionName, governorateName } from "../../lib/i18n";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const copy = {
    ar: { eyebrow:"اكتشف الأجهزة", title:"ابحث عن جهازك", searchLabel:"البحث والتصفية", searchPlaceholder:"ما الجهاز الذي تبحث عنه؟", allCategories:"جميع الفئات", allConditions:"جميع الحالات", allGovernorates:"كل المحافظات", min:"أقل سعر", max:"أعلى سعر", viewAll:"عرض النتائج", newest:"نتائج البحث", empty:"لا توجد أجهزة مطابقة حالياً.", error:"تعذر تحميل الإعلانات. حاول مجدداً." },
    en: { eyebrow:"DISCOVER DEVICES", title:"Find your device", searchLabel:"Search and filters", searchPlaceholder:"What device are you looking for?", allCategories:"All categories", allConditions:"All conditions", allGovernorates:"All governorates", min:"Min price", max:"Max price", viewAll:"Show results", newest:"Search results", empty:"No matching devices right now.", error:"Could not load listings. Please try again." },
    ku: { eyebrow:"ئامێرەکان بدۆزەرەوە", title:"بەدوای ئامێرەکەتدا بگەڕێ", searchLabel:"گەڕان و پاڵاوتن", searchPlaceholder:"بەدوای چ ئامێرێکدا دەگەڕێیت؟", allCategories:"هەموو جۆرەکان", allConditions:"هەموو دۆخەکان", allGovernorates:"هەموو پارێزگاکان", min:"کەمترین نرخ", max:"زۆرترین نرخ", viewAll:"بینینی ئەنجامەکان", newest:"ئەنجامەکانی گەڕان", empty:"هیچ ئامێرێکی گونجاو نییە.", error:"بارکردنی ڕیکلامەکان سەرکەوتوو نەبوو." }
  }[lang];
  const filters: Filters = { q: one(sp.q), category: one(sp.category), condition: one(sp.condition), governorate: one(sp.governorate), min: one(sp.min), max: one(sp.max), page: one(sp.page) };
  const [categories, result] = await Promise.all([fetchCategories(), fetchListings(filters)]);
  const { listings, error, hasNext, page } = result;
  const pageHref = (n: number) => { const p = new URLSearchParams(); (["q","category","condition","governorate","min","max"] as const).forEach(k=>{if(filters[k])p.set(k,filters[k]!)}); if(n>1)p.set("page",String(n)); return p.toString()?"/search?"+p.toString():"/search"; };
  return <main className="sp-home sp-search-page">
    <section className="sp-search-section" id="sp-search">
      <div className="sp-welcome-copy"><span className="sp-kicker">{copy.eyebrow}</span><h1>{copy.title}</h1></div>
      <div className="sp-section-heading"><div><h2>{copy.searchLabel}</h2></div></div>
      <form method="get" action="/search" className="sp-filters">
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
      <div className="sp-section-heading"><div><span className="sp-kicker">DISCOVER</span><h2>{copy.newest}</h2></div></div>
      {error&&<p className="notice">{copy.error}</p>}
      {!error&&listings.length===0&&<p className="notice">{copy.empty}</p>}
      <section className="sp-listing-grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</section>
      {(page>1||hasNext)&&<nav className="pager">{hasNext?<a href={pageHref(page+1)}>{lang==="en"?"Next":"التالي"} ›</a>:<span/>}<span className="meta">{page}</span>{page>1?<a href={pageHref(page-1)}>‹ {lang==="en"?"Previous":"السابق"}</a>:<span/>}</nav>}
    </section>
  </main>;
}
