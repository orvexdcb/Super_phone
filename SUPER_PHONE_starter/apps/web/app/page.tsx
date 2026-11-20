import { CONDITION_LABELS, GOVERNORATES } from "@super-phone/shared";
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
  const copy = { ar: { eyebrow:"بيع • شراء • استبدال", title:"سوقك المتخصص للأجهزة الإلكترونية", intro:"اعثر على جهازك القادم، أو اعرض جهازك للبيع بسهولة وأمان.", sell:"بيع هاتفك", search:"بحث", favorites:"المفضلة", searchLabel:"البحث والتصفية", searchPlaceholder:"ابحث عن جهاز...", allCategories:"كل التصنيفات", allConditions:"كل الحالات", allGovernorates:"كل المحافظات", min:"أدنى سعر", max:"أعلى سعر", newest:"أحدث الأجهزة المعروضة", error:"تعذّر تحميل الإعلانات. حاول مرة أخرى.", empty:"لا توجد إعلانات مطابقة حالياً.", next:"الصفحة التالية", previous:"الصفحة السابقة", page:"صفحة" }, en: { eyebrow:"BUY • SELL • TRADE", title:"Your marketplace for electronic devices", intro:"Find your next device or list yours for sale easily and safely.", sell:"Sell your phone", search:"Search", favorites:"Favorites", searchLabel:"Search and filters", searchPlaceholder:"Search devices...", allCategories:"All categories", allConditions:"All conditions", allGovernorates:"All governorates", min:"Min price", max:"Max price", newest:"Latest listings", error:"Could not load listings. Please try again.", empty:"No matching listings right now.", next:"Next page", previous:"Previous page", page:"Page" }, ku: { eyebrow:"بکڕە • بفرۆشە • ئاڵوگۆڕ", title:"بازاڕی تایبەت بە ئامێرە ئەلیکترۆنییەکان", intro:"ئامێری داهاتووت بدۆزەرەوە یان بە ئاسانی و بە سەلامەتی ئامێرەکەت بفرۆشە.", sell:"مۆبایلەکەت بفرۆشە", search:"گەڕان", favorites:"دڵخوازەکان", searchLabel:"گەڕان و پاڵاوتن", searchPlaceholder:"بگەڕێ بۆ ئامێر...", allCategories:"هەموو پۆلەکان", allConditions:"هەموو دۆخەکان", allGovernorates:"هەموو پارێزگاکان", min:"کەمترین نرخ", max:"زۆرترین نرخ", newest:"نوێترین ئامێرەکان", error:"بارکردنی ڕیکلامەکان سەرکەوتوو نەبوو.", empty:"هیچ ڕیکلامێکی گونجاو نییە.", next:"پەڕەی داهاتوو", previous:"پەڕەی پێشوو", page:"پەڕە" } }[lang] || { eyebrow:"بيع • شراء • استبدال", title:"سوقك المتخصص للأجهزة الإلكترونية", intro:"اعثر على جهازك القادم، أو اعرض جهازك للبيع بسهولة وأمان.", sell:"بيع هاتفك", search:"بحث", favorites:"المفضلة", searchLabel:"البحث والتصفية", searchPlaceholder:"ابحث عن جهاز...", allCategories:"كل التصنيفات", allConditions:"كل الحالات", allGovernorates:"كل المحافظات", min:"أدنى سعر", max:"أعلى سعر", newest:"أحدث الأجهزة المعروضة", error:"تعذّر تحميل الإعلانات. حاول مرة أخرى.", empty:"لا توجد إعلانات مطابقة حالياً.", next:"الصفحة التالية", previous:"الصفحة السابقة", page:"صفحة" };
  const filters: Filters = { q: one(sp.q), category: one(sp.category), condition: one(sp.condition), governorate: one(sp.governorate), min: one(sp.min), max: one(sp.max), page: one(sp.page) };
  const [categories, result] = await Promise.all([fetchCategories(), fetchListings(filters)]);
  const { listings, error, hasNext, page } = result;
  const pageHref = (n: number) => { const p = new URLSearchParams(); (["q","category","condition","governorate","min","max"] as const).forEach(k=>{if(filters[k])p.set(k,filters[k]!)}); if(n>1)p.set("page",String(n)); return p.toString()?"/?"+p.toString():"/"; };
  return <FirstRunFlow><main>
    <header className="hero marketplace-hero"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.intro}</p></header>
    <div className="home-actions">
      <a className="home-action primary" href="/account/listings/new">{copy.sell}</a>
      <a className="home-action" href="#search">{copy.search}</a>
      <a className="home-action" href="/account/favorites">{copy.favorites}</a>
    </div>
    <section className="marketplace-banner"><div><span className="banner-kicker">SUPER PHONE</span><h2>{lang === "en" ? "Your next phone is closer" : lang === "ku" ? "مۆبایلی داهاتووت لێرەیە" : "هاتفك القادم أقرب مما تتخيل"}</h2><p>{lang === "en" ? "Browse trusted listings and compare devices in one place." : lang === "ku" ? "ڕیکلامەکان ببینە و ئامێرەکان لە یەک شوێن بەراورد بکە." : "تصفح إعلانات الهواتف وقارن الأجهزة بسهولة من مكان واحد."}</p></div><span className="banner-device" aria-hidden="true">▯</span></section>
    <section className="search-panel" id="search" aria-label={copy.searchLabel}><form method="get" className="filters">
      <input name="q" defaultValue={filters.q} placeholder={copy.searchPlaceholder} />
      <select name="category" defaultValue={filters.category}><option value="">{copy.allCategories}</option>{categories.map(c=><option key={c.slug} value={c.slug}>{categoryName(lang, c.name_ar)}</option>)}</select>
      <select name="condition" defaultValue={filters.condition}><option value="">{copy.allConditions}</option>{Object.entries(CONDITION_LABELS).map(([k,v])=><option key={k} value={k}>{conditionName(lang, k, v)}</option>)}</select>
      <select name="governorate" defaultValue={filters.governorate}><option value="">{copy.allGovernorates}</option>{GOVERNORATES.map(g=><option key={g} value={g}>{governorateName(lang, g)}</option>)}</select>
      <input name="min" type="number" min={0} defaultValue={filters.min} placeholder={copy.min} />
      <input name="max" type="number" min={0} defaultValue={filters.max} placeholder={copy.max} />
      <button type="submit">{copy.search}</button><a href="/" className="reset">{lang === "en" ? "Clear" : lang === "ku" ? "پاککردنەوە" : "مسح"}</a>
    </form></section>
    <div className="section-head"><h2>{copy.newest}</h2><span className="section-note">● {lang === "en" ? "Recently added" : lang === "ku" ? "تازە زیادکراوەکان" : "أضيفت حديثاً"}</span></div>
    {error&&<p className="notice">{copy.error}</p>}
    {!error&&listings.length===0&&<p className="notice">{copy.empty}</p>}
    <section className="grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</section>
    {(page>1||hasNext)&&<nav className="pager">{hasNext?<a href={pageHref(page+1)}>{copy.next} ›</a>:<span/>}<span className="meta">{copy.page} {page}</span>{page>1?<a href={pageHref(page-1)}>‹ {copy.previous}</a>:<span/>}</nav>}
  </main></FirstRunFlow>;
}