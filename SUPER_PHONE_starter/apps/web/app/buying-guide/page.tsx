import Link from "next/link";
import { cookies } from "next/headers";

export const metadata = {
  title: "Buying guide | SUPER PHONE",
  description: "Practical checks before buying a used phone or electronic device."
};

const CONTENT = {
  ar: {
    title: "دليل شراء الأجهزة",
    subtitle: "خطوات بسيطة تساعدك على فحص الجهاز قبل الاتفاق.",
    cards: [
      ["01", "افحص الشاشة", "اختبر اللمس في جميع أطراف الشاشة، وتأكد من عدم وجود بقع أو خطوط أو كسور."],
      ["02", "اختبر الوظائف", "جرّب الكاميرات والميكروفون والسماعات والاتصال والشحن والأزرار."],
      ["03", "تحقق من البطارية", "راجع صحة البطارية وسرعة استنزافها، وتأكد من عدم ارتفاع حرارة الجهاز بشكل غير طبيعي."],
      ["04", "طابق بيانات الجهاز", "تحقق من رقم IMEI ومعلومات الطراز، ولا تشترِ جهازاً عليه قفل حساب لا يستطيع البائع إزالته."]
    ],
    safety: "السلامة أولاً",
    tips: ["قابل البائع في مكان عام وآمن.", "افحص الجهاز بنفسك قبل الدفع.", "لا تحوّل عربوناً أو مبلغاً مقدماً لشخص لم تتحقق منه.", "اتفق بوضوح على السعر والملحقات وحالة الجهاز."],
    button: "تصفح الأجهزة المعروضة"
  },
  en: {
    title: "Device buying guide",
    subtitle: "A practical checklist to follow before agreeing on a purchase.",
    cards: [
      ["01", "Inspect the display", "Test touch response across the full screen and look for spots, lines or cracks."],
      ["02", "Test the functions", "Check cameras, microphone, speakers, network, charging and physical buttons."],
      ["03", "Check the battery", "Review battery health and drain, and watch for unusual overheating."],
      ["04", "Verify device details", "Check the IMEI and model. Avoid devices with account locks the seller cannot remove."]
    ],
    safety: "Stay safe",
    tips: ["Meet the seller in a public, safe place.", "Inspect the device yourself before paying.", "Do not send deposits to people you have not verified.", "Agree clearly on the price, accessories and device condition."],
    button: "Browse available devices"
  },
  ku: {
    title: "ڕێنمایی کڕینی ئامێر",
    subtitle: "چەند هەنگاوێک بۆ پشکنینی ئامێر پێش کڕین.",
    cards: [
      ["01", "شاشە بپشکنە", "تاچی هەموو بەشەکانی شاشە تاقی بکەرەوە و بگەڕێ بۆ هێڵ و خاڵ و شکاوی."],
      ["02", "کارکردن تاقی بکەرەوە", "کامێرا و مایک و سپیکەر و تۆڕ و شارژ و دوگمەکان بپشکنە."],
      ["03", "باتری بپشکنە", "تەندروستی باتری و خێرایی بەتاڵبوونەوەی بپشکنە و ئاگاداری گەرمی نائاسایی بە."],
      ["04", "زانیاری ئامێر بسەلمێنە", "ژمارەی IMEI و مۆدێل بپشکنە و ئامێری قفڵکراو مەکڕە."]
    ],
    safety: "سەلامەتی گرنگە",
    tips: ["لە شوێنێکی گشتی و سەلامەت ببینەوە.", "پێش پارەدان ئامێرەکە خۆت بپشکنە.", "پارەی پێشەکی بۆ کەسێک مەگوازەرەوە کە نەتناسێت.", "لەسەر نرخ و ئاکسسوارات و دۆخی ئامێر ڕێک بکەون."],
    button: "بینینی ئامێرەکان"
  }
};

export default async function BuyingGuidePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const t = CONTENT[lang] || CONTENT.ar;

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">SUPER PHONE</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>
      <section className="grid">
        {t.cards.map(([number, title, body]) => (
          <article key={number} className="card">
            <div className="body">
              <p className="price">{number}</p>
              <h3>{title}</h3>
              <p className="meta">{body}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="safety" style={{ marginTop: 22 }}>
        <h2>{t.safety}</h2>
        <ul>{t.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
      </section>
      <p style={{ textAlign: "center", marginTop: 24 }}>
        <Link className="cta-link" href="/">{t.button}</Link>
      </p>
    </main>
  );
}
