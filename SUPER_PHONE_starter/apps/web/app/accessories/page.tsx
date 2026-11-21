import Link from "next/link";
import { cookies } from "next/headers";
import { fetchCategories } from "../../lib/listings";
import { categoryName } from "../../lib/i18n";

export const dynamic = "force-dynamic";

const ACCESSORY_SLUGS = new Set(["headphones", "smartwatch", "accessories"]);

export default async function AccessoriesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const words = {
    ar: {
      title: "السماعات والساعات الذكية",
      subtitle: "تصفح الملحقات والأجهزة القابلة للارتداء المعروضة للبيع.",
      choose: "اختر الفئة",
      empty: "لا توجد فئات ملحقات مفعّلة حالياً.",
      browse: "العودة إلى جميع الأجهزة",
      hint: "اعرض الإعلانات المتاحة داخل الفئة المختارة."
    },
    en: {
      title: "Audio & wearables",
      subtitle: "Browse headphones and smart watches listed for sale.",
      choose: "Choose a category",
      empty: "No accessory categories are active right now.",
      browse: "Browse all devices",
      hint: "See available listings in the selected category."
    },
    ku: {
      title: "دەنگ و کاتژمێری زیرەک",
      subtitle: "سەیری گوێگر و کاتژمێرە زیرەکەکان بکە.",
      choose: "پۆلێک هەڵبژێرە",
      empty: "ئێستا هیچ پۆلێکی ئاکسسوارات چالاک نییە.",
      browse: "گەڕان بە هەموو ئامێرەکاندا",
      hint: "ڕیکلامە بەردەستەکان لە پۆلی هەڵبژێردراو ببینە."
    }
  }[lang] || {
    title: "السماعات والساعات الذكية", subtitle: "تصفح الملحقات والأجهزة القابلة للارتداء المعروضة للبيع.",
    choose: "اختر الفئة", empty: "لا توجد فئات ملحقات مفعّلة حالياً.", browse: "العودة إلى جميع الأجهزة.",
    hint: "اعرض الإعلانات المتاحة داخل الفئة المختارة."
  };

  const categories = await fetchCategories();
  const accessoryCategories = categories.filter((category) =>
    ACCESSORY_SLUGS.has(category.slug) || /سماعات|ساعات|إكسسوارات|اكسسوارات/i.test(category.name_ar || "")
  );

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">SUPER PHONE</p>
        <h1>{words.title}</h1>
        <p>{words.subtitle}</p>
      </header>
      <h2>{words.choose}</h2>
      {accessoryCategories.length === 0 ? (
        <p className="notice">{words.empty} <Link href="/">{words.browse}</Link></p>
      ) : (
        <section className="category-strip">
          {accessoryCategories.map((category) => (
            <Link key={category.slug} href={"/?category=" + encodeURIComponent(category.slug) + "#search"} className="category-tile">
              <span className="category-symbol" aria-hidden="true">
                {category.slug === "headphones" ? "♫" : category.slug === "smartwatch" ? "◷" : "▯"}
              </span>
              <span>
                <strong>{categoryName(lang, category.name_ar)}</strong>
                <small>{words.hint}</small>
              </span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
