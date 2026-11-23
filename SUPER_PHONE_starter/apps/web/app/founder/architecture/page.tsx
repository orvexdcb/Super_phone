"use server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

const areas = [
  { title: "واجهة الويب", tag: "Next.js 15", files: ["app/ — المسارات والشاشات", "components/ — عناصر الواجهة", "lib/ — الاتصال والوظائف المساعدة"], uses: "Supabase SSR · الحزمة المشتركة" },
  { title: "تطبيق الهاتف", tag: "Expo 52 · React Native", files: ["App.js — التنقل وتجميع الشاشات", "screens/ — شاشات المستخدم والمؤسس", "components/ — مكونات الهاتف", "lib/ — الجلسة والترجمة والاتصال"], uses: "Supabase JS · AsyncStorage" },
  { title: "المنطق المشترك", tag: "@super-phone/shared", files: ["packages/shared/src/"], uses: "أنواع وبيانات مشتركة بين التطبيقات" },
  { title: "قاعدة البيانات", tag: "Supabase · PostgreSQL", files: ["profiles · categories · listings", "listing_images · listing_specs · favorites · reports", "accessory_categories · accessory_products", "accessory_product_images · accessory_orders"], uses: "RLS · Triggers · Functions · Storage" },
  { title: "النشر", tag: "Vercel + GitHub Actions", files: ["GitHub: main / feature branches", "Vercel: مشروع super_phone", ".github/workflows/ — بناء الويب وAPK"], uses: "النشر التلقائي مرتبط بفرع الإنتاج" }
];

const relations = [
  ["المستخدم", "profiles", "هوية الحساب والصلاحية"],
  ["البائع", "listings", "إعلانات الأجهزة"],
  ["الإعلان", "listing_images / listing_specs", "صور ومواصفات الإعلان"],
  ["المستخدم", "favorites", "الأجهزة المحفوظة"],
  ["المستخدم", "reports", "بلاغات الإعلانات"],
  ["فئة الإكسسوار", "accessory_products", "تصنيف المنتجات"],
  ["المنتج", "accessory_product_images", "صور المنتج"],
  ["المنتج", "accessory_orders", "طلبات الشراء والمخزون"]
];

export default async function FounderArchitecturePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/account");

  const tableNames = ["profiles","categories","listings","listing_images","listing_specs","favorites","reports","accessory_categories","accessory_products","accessory_product_images","accessory_orders"];
  const counts = await Promise.all(tableNames.map(async (name) => {
    const { count, error } = await supabase.from(name).select("*", { count: "exact", head: true });
    return { name, count: error ? null : count };
  }));
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || "غير متاح في بيئة المعاينة";
  return (
    <main className="founder-shell" dir="rtl">
      <style>{`
        .arch-wrap{display:grid;gap:18px}
        .arch-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
        .arch-pill{border:1px solid var(--line);border-radius:999px;padding:7px 12px;color:var(--gold-light);font-size:.8rem}
        .arch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
        .arch-card{background:linear-gradient(150deg,#1b2a3e,#101d2e);border:1px solid var(--line);border-radius:17px;padding:16px;min-width:0}
        .arch-card h2{margin:0 0 6px;font-size:1.02rem}.arch-card p{color:var(--muted);margin:7px 0;font-size:.86rem}
        .arch-card ul{margin:12px 0 0;padding-right:18px;color:#e7ebf1;font-size:.84rem;line-height:1.9}
        .arch-tag{display:inline-block;color:var(--gold-light);font-size:.76rem;background:rgba(216,173,94,.1);padding:4px 9px;border-radius:999px}
        .arch-flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:9px;align-items:stretch}
        .arch-node{border:1px solid rgba(216,173,94,.32);background:#17263a;border-radius:13px;padding:12px;text-align:center}
        .arch-node strong{display:block;color:var(--gold-light);font-size:.9rem}.arch-node small{color:var(--muted)}
        .arch-table{width:100%;border-collapse:collapse;font-size:.86rem}.arch-table th,.arch-table td{padding:10px;text-align:right;border-bottom:1px solid var(--line)}.arch-table th{color:var(--gold-light);font-weight:700}
        .arch-counts{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}
        .arch-count{background:#17263a;border:1px solid var(--line);border-radius:12px;padding:11px}.arch-count strong{display:block;color:var(--gold-light);font-size:1.2rem}.arch-count span{font-size:.78rem;color:var(--muted);overflow-wrap:anywhere}
        .arch-note{border-right:3px solid var(--gold);padding:10px 13px;background:rgba(216,173,94,.08);border-radius:10px;color:#e9dfca;font-size:.86rem}
        .arch-links{display:flex;gap:10px;flex-wrap:wrap}.arch-links a{color:var(--gold-light);text-decoration:none;border:1px solid var(--line);padding:9px 12px;border-radius:10px}
        @media(max-width:600px){.arch-table{font-size:.75rem}.arch-table th,.arch-table td{padding:8px 5px}}
      `}</style>
      <section className="founder-heading">
        <span className="founder-kicker">SUPER PHONE · ARCHITECTURE CENTER</span>
        <h1>مركز هندسة المشروع</h1>
        <p>خريطة مكونات النظام، تدفق البيانات، وعلاقات قاعدة البيانات — مخصصة للمؤسس.</p>
      </section>
      <div className="arch-wrap">
        <div className="arch-top">
          <span className="arch-pill">فحص حي لقاعدة البيانات</span>
          <span className="arch-pill">Commit: {commit.slice(0, 12)}</span>
        </div>
        <section className="sp-admin-panel">
          <h2>الخريطة العامة للنظام</h2>
          <div className="arch-flow">
            <div className="arch-node"><strong>الويب</strong><small>Next.js 15</small></div>
            <div className="arch-node"><strong>الهاتف</strong><small>Expo / React Native</small></div>
            <div className="arch-node"><strong>الحزمة المشتركة</strong><small>Types & Logic</small></div>
            <div className="arch-node"><strong>Supabase</strong><small>Auth · DB · Storage</small></div>
            <div className="arch-node"><strong>GitHub</strong><small>Source Control</small></div>
            <div className="arch-node"><strong>Vercel</strong><small>Web Deployment</small></div>
          </div>
          <p className="meta">المسار المنطقي: واجهات الويب والهاتف ← المصادقة وواجهات Supabase ← PostgreSQL وStorage. GitHub يحفظ المصدر وVercel ينشر نسخة الويب.</p>
        </section>
        <section>
          <div className="sp-section-heading"><div><span className="founder-kicker">SYSTEM MAP</span><h2>أجزاء المشروع</h2></div></div>
          <div className="arch-grid">
            {areas.map(area => <article className="arch-card" key={area.title}><span className="arch-tag">{area.tag}</span><h2>{area.title}</h2><ul>{area.files.map(file=><li key={file}>{file}</li>)}</ul><p>{area.uses}</p></article>)}
          </div>
        </section>
        <section className="sp-admin-panel">
          <h2>علاقات البيانات المكتشفة</h2>
          <div style={{overflowX:"auto"}}>
            <table className="arch-table"><thead><tr><th>المصدر</th><th>الجدول المرتبط</th><th>العلاقة</th></tr></thead><tbody>
              {relations.map((r,i)=><tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}
            </tbody></table>
          </div>
        </section>
        <section className="sp-admin-panel">
          <h2>حالة الجداول — قراءة مباشرة</h2>
          <div className="arch-counts">{counts.map(row=><div className="arch-count" key={row.name}><strong>{row.count===null?"—":row.count}</strong><span>{row.name}</span></div>)}</div>
          <p className="meta">العدد يمثل إجمالي الصفوف كما تسمح به صلاحيات جلسة المؤسس الحالية؛ لا يتم تعديل أي بيانات من هذه الصفحة.</p>
        </section>
        <section className="sp-admin-panel">
          <h2>ملاحظات الفحص الأولي</h2>
          <div className="arch-note">تنبيه أمني: أداة Supabase Advisors رصدت أن public.is_admin() قابلة للتنفيذ من anon وauthenticated بصلاحية SECURITY DEFINER. يلزم مراجعة الاعتماد عليها في سياسات RLS قبل تغيير الصلاحيات.</div>
          <div className="arch-note" style={{marginTop:9}}>تحسين أمني موصى به: تفعيل حماية كلمات المرور المسربة في إعدادات Supabase Auth.</div>
          <div className="arch-note" style={{marginTop:9}}>تحسين أداء: مفتاح أجنبي في reports.reporter_id بلا فهرس مغطٍ. كما ظهرت فهارس غير مستخدمة؛ لا يُنصح بحذفها قبل وجود حركة استخدام فعلية.</div>
          <p className="meta">هذه ملاحظات فحص وليست تغييرات منفذة. تمت المحافظة على قاعدة البيانات دون أي تعديل.</p>
        </section>
        <section className="arch-links">
          <Link href="/founder/settings">العودة إلى إعدادات المؤسس</Link>
          <a href="https://github.com/orvexdcb/Super_phone/tree/main/SUPER_PHONE_starter" target="_blank" rel="noreferrer">فتح ملفات المشروع</a>
          <a href="https://supabase.com/dashboard/project/eqlenftagozvjezswbaf" target="_blank" rel="noreferrer">فتح قاعدة البيانات</a>
        </section>
      </div>
    </main>
  );
}
