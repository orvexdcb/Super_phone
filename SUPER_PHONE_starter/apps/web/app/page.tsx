import { CONDITION_LABELS, GOVERNORATES } from "@super-phone/shared";
import ListingCard from "../components/ListingCard";
import { fetchCategories, fetchListings, type Filters } from "../lib/listings";
import FirstRunFlow from "../components/FirstRunFlow";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: Filters = { q: one(sp.q), category: one(sp.category), condition: one(sp.condition), governorate: one(sp.governorate), min: one(sp.min), max: one(sp.max), page: one(sp.page) };
  const [categories, result] = await Promise.all([fetchCategories(), fetchListings(filters)]);
  const { listings, error, hasNext, page } = result;
  const pageHref = (n: number) => { const p = new URLSearchParams(); (["q","category","condition","governorate","min","max"] as const).forEach(k=>{if(filters[k])p.set(k,filters[k]!)}); if(n>1)p.set("page",String(n)); return p.toString()?"/?"+p.toString():"/"; };
  return <FirstRunFlow><main>
    <header className="hero"><p className="eyebrow">بيع • شراء • استبدال</p><h1>سوقك المتخصص للأجهزة الإلكترونية</h1><p>اعثر على جهازك القادم، أو اعرض جهازك للبيع بسهولة وأمان.</p></header>
    <div className="home-actions">
      <a className="home-action primary" href="/account/listings/new">بيع هاتفك</a>
      <a className="home-action" href="#search">بحث</a>
      <a className="home-action" href="/account/favorites">المفضلة</a>
    </div>
    <section className="search-panel" id="search" aria-label="البحث والتصفية"><form method="get" className="filters">
      <input name="q" defaultValue={filters.q} placeholder="ابحث عن جهاز..." />
      <select name="category" defaultValue={filters.category}><option value="">كل التصنيفات</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.name_ar}</option>)}</select>
      <select name="condition" defaultValue={filters.condition}><option value="">كل الحالات</option>{Object.entries(CONDITION_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
      <select name="governorate" defaultValue={filters.governorate}><option value="">كل المحافظات</option>{GOVERNORATES.map(g=><option key={g}>{g}</option>)}</select>
      <input name="min" type="number" min={0} defaultValue={filters.min} placeholder="أدنى سعر" />
      <input name="max" type="number" min={0} defaultValue={filters.max} placeholder="أعلى سعر" />
      <button type="submit">بحث</button><a href="/" className="reset">مسح</a>
    </form></section>
    <div className="section-head"><h2>أحدث الأجهزة المعروضة</h2></div>
    {error&&<p className="notice">تعذّر تحميل الإعلانات. حاول مرة أخرى.</p>}
    {!error&&listings.length===0&&<p className="notice">لا توجد إعلانات مطابقة حالياً.</p>}
    <section className="grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</section>
    {(page>1||hasNext)&&<nav className="pager">{hasNext?<a href={pageHref(page+1)}>الصفحة التالية ›</a>:<span/>}<span className="meta">صفحة {page}</span>{page>1?<a href={pageHref(page-1)}>‹ الصفحة السابقة</a>:<span/>}</nav>}
  </main></FirstRunFlow>;
}