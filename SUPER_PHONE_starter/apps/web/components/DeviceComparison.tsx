"use client";

import { useMemo, useState } from "react";

type CompareDevice = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  price: number;
  currency: string;
  condition: string;
  governorate: string;
  city: string | null;
  category: { name_ar: string; slug: string } | null;
  specs: { spec_key: string; spec_value: string }[];
};

const COPY = {
  ar: {
    title: "قارن بين جهازين",
    intro: "اختر جهازين من الإعلانات المنشورة، واعرض السعر والمواصفات جنباً إلى جنب لتحدد الأنسب لك.",
    first: "الجهاز الأول",
    second: "الجهاز الثاني",
    choose: "اختر جهازاً",
    compare: "عرض المقارنة",
    empty: "لا توجد إعلانات منشورة متاحة للمقارنة حالياً.",
    fields: ["اسم الجهاز", "الشركة والطراز", "السعر", "الحالة", "الفئة", "المحافظة", "المدينة"],
    specs: "المواصفات الإضافية",
    missing: "غير محدد",
    lower: "الأقل سعراً",
    equal: "السعر متساوٍ",
    note: "تعتمد المقارنة على المعلومات التي أضافها البائع في الإعلان. تحقق من الجهاز بنفسك قبل الشراء.",
    same: "اختر جهازين مختلفين."
  },
  en: {
    title: "Compare two devices",
    intro: "Choose two active listings and compare their prices and specifications side by side.",
    first: "First device",
    second: "Second device",
    choose: "Choose a device",
    compare: "Compare devices",
    empty: "There are no active listings available to compare right now.",
    fields: ["Device", "Brand and model", "Price", "Condition", "Category", "Governorate", "City"],
    specs: "Additional specifications",
    missing: "Not specified",
    lower: "Lower price",
    equal: "Same price",
    note: "This comparison uses details provided by sellers. Inspect the device yourself before buying.",
    same: "Choose two different devices."
  },
  ku: {
    title: "بەراوردکردنی دوو ئامێر",
    intro: "دوو ئامێری چالاک هەڵبژێرە و نرخ و تایبەتمەندییەکانیان بەراورد بکە.",
    first: "ئامێری یەکەم",
    second: "ئامێری دووەم",
    choose: "ئامێرێک هەڵبژێرە",
    compare: "بەراوردکردن",
    empty: "ئێستا هیچ ئامێرێکی چالاک نییە.",
    fields: ["ئامێر", "کۆمپانیا و مۆدێل", "نرخ", "دۆخ", "جۆر", "پارێزگا", "شار"],
    specs: "تایبەتمەندیی زیادە",
    missing: "دیاری نەکراوە",
    lower: "هەرزانتر",
    equal: "نرخەکە یەکسانە",
    note: "ئەم بەراوردە پشت بە زانیارییەکانی فرۆشیار دەبەستێت. پێش کڕین ئامێرەکە خۆت بپشکنە.",
    same: "دوو ئامێری جیاواز هەڵبژێرە."
  }
};

const SPEC_NAMES: Record<string, { ar: string; en: string; ku: string }> = {
  ram: { ar: "الذاكرة العشوائية", en: "RAM", ku: "ڕام" },
  storage: { ar: "سعة التخزين", en: "Storage", ku: "بیرگە" },
  battery_health: { ar: "صحة البطارية", en: "Battery health", ku: "تەندروستی باتری" },
  color: { ar: "اللون", en: "Color", ku: "ڕەنگ" },
  screen: { ar: "الشاشة", en: "Display", ku: "شاشە" },
  processor: { ar: "المعالج", en: "Processor", ku: "پرۆسێسەر" },
  camera: { ar: "الكاميرا", en: "Camera", ku: "کامێرا" }
};

const valueOr = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US").format(value) + " " + (currency === "IQD" ? "د.ع" : currency);

export default function DeviceComparison({ devices, lang }: { devices: CompareDevice[]; lang: "ar" | "en" | "ku" }) {
  const t = COPY[lang] || COPY.ar;
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [shown, setShown] = useState(false);
  const first = devices.find((device) => device.id === firstId);
  const second = devices.find((device) => device.id === secondId);
  const specKeys = useMemo(() => Array.from(new Set([...(first?.specs ?? []), ...(second?.specs ?? [])].map((item) => item.spec_key))), [first, second]);
  const firstSpecs = new Map((first?.specs ?? []).map((item) => [item.spec_key, item.spec_value]));
  const secondSpecs = new Map((second?.specs ?? []).map((item) => [item.spec_key, item.spec_value]));
  const isArabic = lang === "ar";
  const isKurdish = lang === "ku";
  const labels = t.fields;

  const rows: { label: string; a: string; b: string; price?: boolean }[] = first && second ? [
    { label: labels[0], a: first.title, b: second.title },
    { label: labels[1], a: [first.brand, first.model].filter(Boolean).join(" ") || t.missing, b: [second.brand, second.model].filter(Boolean).join(" ") || t.missing },
    { label: labels[2], a: money(first.price, first.currency), b: money(second.price, second.currency), price: true },
    { label: labels[3], a: first.condition === "new" ? (isArabic ? "جديد" : isKurdish ? "نوێ" : "New") : first.condition === "refurbished" ? (isArabic ? "مجدد" : isKurdish ? "نوێکراوە" : "Refurbished") : (isArabic ? "مستعمل" : isKurdish ? "بەکارهاتوو" : "Used"), b: second.condition === "new" ? (isArabic ? "جديد" : isKurdish ? "نوێ" : "New") : second.condition === "refurbished" ? (isArabic ? "مجدد" : isKurdish ? "نوێکراوە" : "Refurbished") : (isArabic ? "مستعمل" : isKurdish ? "بەکارهاتوو" : "Used") },
    { label: labels[4], a: first.category?.name_ar || t.missing, b: second.category?.name_ar || t.missing },
    { label: labels[5], a: first.governorate || t.missing, b: second.governorate || t.missing },
    { label: labels[6], a: first.city || t.missing, b: second.city || t.missing }
  ] : [];

  if (devices.length === 0) return <section className="sp-compare-panel"><h2>{t.title}</h2><p>{t.empty}</p></section>;

  return (
    <section className="sp-compare-panel" aria-labelledby="sp-compare-title">
      <div className="sp-compare-heading">
        <span className="sp-compare-kicker">SUPER PHONE</span>
        <h2 id="sp-compare-title">{t.title}</h2>
        <p>{t.intro}</p>
      </div>
      <div className="sp-compare-pickers">
        <label>{t.first}
          <select value={firstId} onChange={(event) => { setFirstId(event.target.value); setShown(false); }}>
            <option value="">{t.choose}</option>
            {devices.filter((device) => device.id !== secondId).map((device) => <option key={device.id} value={device.id}>{device.title}</option>)}
          </select>
        </label>
        <label>{t.second}
          <select value={secondId} onChange={(event) => { setSecondId(event.target.value); setShown(false); }}>
            <option value="">{t.choose}</option>
            {devices.filter((device) => device.id !== firstId).map((device) => <option key={device.id} value={device.id}>{device.title}</option>)}
          </select>
        </label>
      </div>
      <button className="sp-compare-button" type="button" disabled={!firstId || !secondId} onClick={() => setShown(true)}>{t.compare}</button>
      {shown && first && second && <>
        <div className="sp-compare-results" role="region" aria-live="polite" aria-label={t.title}>
          <table className="sp-compare-table">
            <thead><tr><th scope="col">{isArabic ? "المعيار" : isKurdish ? "پێوەر" : "Feature"}</th><th scope="col">{first.title}</th><th scope="col">{second.title}</th></tr></thead>
            <tbody>
              {rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.a}{row.price && first.price < second.price && <small className="sp-price-winner">{t.lower}</small>}{row.price && first.price === second.price && <small className="sp-price-winner">{t.equal}</small>}</td><td>{row.b}{row.price && second.price < first.price && <small className="sp-price-winner">{t.lower}</small>}{row.price && first.price === second.price && <small className="sp-price-winner">{t.equal}</small>}</td></tr>)}
              {specKeys.map((key) => <tr key={key}><th scope="row">{SPEC_NAMES[key]?.[lang] || key}</th><td>{firstSpecs.get(key) || t.missing}</td><td>{secondSpecs.get(key) || t.missing}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="sp-compare-note">{t.note}</p>
      </>}
      {shown && firstId === secondId && <p className="sp-compare-error">{t.same}</p>}
    </section>
  );
}
