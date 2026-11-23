import Link from "next/link";
import { redirect } from "next/navigation";
import architecture from "./architecture-data.json";
import ArchitectureGraph from "./architecture-graph";
import { createServerSupabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

const projectRoot = "SUPER_PHONE_starter/";
const githubRef = process.env.VERCEL_GIT_COMMIT_REF || "main";
const encodedGithubRef = encodeURIComponent(githubRef).replace(/%2F/g, "/");
const githubFile = (file: string) => `https://github.com/orvexdcb/Super_phone/blob/${encodedGithubRef}/${file}`;

export default async function FounderArchitecturePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/account");

  const databaseTables = architecture.database.tables || [];
  const commit = architecture.commitSha || process.env.VERCEL_GIT_COMMIT_SHA || "غير متاح";
  const generatedAt = architecture.generatedAt ? new Date(architecture.generatedAt).toLocaleString("ar-IQ") : "بانتظار أول عملية بناء";
  const topDependencies = architecture.dependencies.slice(0, 70);
  const sourceFiles = architecture.sourceFiles || [];
  const webRoutes = architecture.webRoutes || [];
  const mobileScreens = architecture.mobileScreens || [];
  const mobileComponents = architecture.mobileComponents || [];
  const databaseRelationships: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[] = architecture.database.relationships || [];

  return (
    <main className="founder-shell" dir="rtl">
      <style>{`
        .arch-wrap{display:grid;gap:18px}
        .arch-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
        .arch-pill{border:1px solid var(--line);border-radius:999px;padding:7px 12px;color:var(--gold-light);font-size:.78rem;overflow-wrap:anywhere}
        .arch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
        .arch-card{background:linear-gradient(150deg,#1b2a3e,#101d2e);border:1px solid var(--line);border-radius:16px;padding:15px;min-width:0}
        .arch-card h2{margin:0 0 7px;font-size:1rem}.arch-card p{color:var(--muted);margin:7px 0;font-size:.84rem}
        .arch-card ul{margin:10px 0 0;padding-right:18px;color:#e7ebf1;font-size:.82rem;line-height:1.8}
        .arch-tag{display:inline-block;color:var(--gold-light);font-size:.74rem;background:rgba(216,173,94,.1);padding:4px 9px;border-radius:999px}
        .arch-flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;align-items:stretch}
        .arch-node{border:1px solid rgba(216,173,94,.32);background:#17263a;border-radius:12px;padding:11px;text-align:center}
        .arch-node strong{display:block;color:var(--gold-light);font-size:.88rem}.arch-node small{color:var(--muted);font-size:.75rem}
        .arch-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}
        .arch-stat{background:#17263a;border:1px solid var(--line);border-radius:12px;padding:11px;min-width:0}
        .arch-stat strong{display:block;color:var(--gold-light);font-size:1.3rem;line-height:1.5}
        .arch-stat span{font-size:.76rem;color:var(--muted)}
        .arch-table-wrap{overflow-x:auto}
        .arch-table{width:100%;border-collapse:collapse;font-size:.82rem;min-width:540px}
        .arch-table th,.arch-table td{padding:9px 10px;text-align:right;border-bottom:1px solid var(--line);vertical-align:top}
        .arch-table th{color:var(--gold-light);font-weight:800}
        .arch-table code,.arch-code{font-size:.76rem;color:#d6dfeb;overflow-wrap:anywhere;white-space:normal}
        .arch-table a,.arch-links a{color:var(--gold-light);text-decoration:none}
        .arch-details{background:#17263a;border:1px solid var(--line);border-radius:12px;padding:10px 12px}
        .arch-details summary{cursor:pointer;color:var(--gold-light);font-weight:700}
        .arch-list{display:grid;gap:7px;margin-top:10px}
        .arch-item{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.8rem}
        .arch-item span:last-child{color:var(--muted);text-align:left}
        .arch-note{border-right:3px solid var(--gold);padding:10px 13px;background:rgba(216,173,94,.08);border-radius:10px;color:#e9dfca;font-size:.84rem}
        .arch-links{display:flex;gap:9px;flex-wrap:wrap}.arch-links a{border:1px solid var(--line);padding:9px 12px;border-radius:10px}
        .arch-subtitle{margin:0 0 12px;font-size:1.02rem}
        @media(max-width:600px){.arch-table{font-size:.75rem}.arch-table th,.arch-table td{padding:8px 6px}.arch-pill{font-size:.7rem}}
      `}</style>
      <section className="founder-heading">
        <span className="founder-kicker">SUPER PHONE · ARCHITECTURE CENTER</span>
        <h1>مركز هندسة المشروع</h1>
        <p>خريطة مستخرجة من ملفات المستودع، مع فحص مباشر لجداول قاعدة البيانات — للمؤسس فقط.</p>
      </section>

      <div className="arch-wrap">
        <div className="arch-top">
          <span className="arch-pill">توليد الخريطة: {generatedAt}</span>
          <span className="arch-pill">Commit: {commit.slice(0, 12)}</span>
          <span className="arch-pill">الفرع: {githubRef}</span>
        </div>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">مؤشرات حجم النظام المكتشفة</h2>
          <div className="arch-stats">
            <div className="arch-stat"><strong>{architecture.counts.sourceFiles}</strong><span>ملفات مصدر محللة</span></div>
            <div className="arch-stat"><strong>{architecture.counts.webRoutes}</strong><span>مسارات ويب</span></div>
            <div className="arch-stat"><strong>{architecture.counts.mobileScreens}</strong><span>شاشات هاتف مستوردة</span></div>
            <div className="arch-stat"><strong>{architecture.counts.localDependencies}</strong><span>روابط استيراد محلية</span></div>
            <div className="arch-stat"><strong>{architecture.counts.databaseTables}</strong><span>جداول في ملفات الترحيل</span></div>
            <div className="arch-stat"><strong>{architecture.counts.databaseRelationships}</strong><span>علاقات مفاتيح خارجية</span></div>
            <div className="arch-stat"><strong>{architecture.counts.policies}</strong><span>سياسات معرفة في SQL</span></div>
            <div className="arch-stat"><strong>{architecture.counts.functions + architecture.counts.triggers}</strong><span>دوال ومحفزات في SQL</span></div>
          </div>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">خريطة Floorplan التفاعلية</h2>
          <p className="meta">الخريطة الأصلية المولدة من تحليل الملفات والعلاقات. لا تتصل بقاعدة البيانات ولا تنفذ أي تغييرات.</p>
          <div style={{border:"1px solid var(--line)",borderRadius:14,overflow:"hidden",background:"#0d1726"}}>
            <iframe
              title="خريطة بنية SUPER PHONE"
              src="/founder/architecture/map"
              sandbox="allow-scripts allow-popups"
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{display:"block",width:"100%",height:"min(78vh, 900px)",minHeight:560,border:0,background:"#0d1726"}}
            />
          </div>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">الخريطة العامة وتدفق الاعتماد</h2>
          <div className="arch-flow">
            <div className="arch-node"><strong>تطبيق الويب</strong><small>Next.js · React</small></div>
            <div className="arch-node"><strong>تطبيق الهاتف</strong><small>Expo · React Native</small></div>
            <div className="arch-node"><strong>الحزمة المشتركة</strong><small>أنواع ووظائف مشتركة</small></div>
            <div className="arch-node"><strong>Supabase Auth</strong><small>جلسات وهوية المستخدم</small></div>
            <div className="arch-node"><strong>PostgreSQL + Storage</strong><small>بيانات وإعلانات وصور</small></div>
            <div className="arch-node"><strong>GitHub → Vercel</strong><small>مصدر الويب ونشره</small></div>
          </div>
          <p className="meta">الأسهم تمثل اعتماد التطبيقات على خدمات المصادقة والبيانات. تفاصيل استيرادات الملفات والعلاقات الفعلية مدرجة أدناه.</p>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">خريطة العلاقات والتأثير التفاعلية</h2>
          <p className="meta">اختر شاشة أو ملفاً أو جدولاً لاستكشاف ما يعتمد عليه وما قد يتأثر عند تغييره. جميع الروابط مبنية على ملفات المستودع وملفات ترحيل قاعدة البيانات.</p>
          <ArchitectureGraph
            sourceFiles={sourceFiles}
            dependencies={architecture.dependencies}
            webRoutes={webRoutes}
            mobileScreens={mobileScreens}
            mobileComponents={mobileComponents}
            tables={databaseTables}
            relationships={databaseRelationships}
          />
        </section>

        <section>
          <div className="sp-section-heading"><div><span className="founder-kicker">WEB APPLICATION</span><h2>مسارات الويب</h2></div></div>
          <div className="sp-admin-panel">
            <div className="arch-table-wrap">
              <table className="arch-table"><thead><tr><th>المسار</th><th>النوع</th><th>ملف المصدر</th><th>الاعتماديات المحلية</th></tr></thead>
                <tbody>{webRoutes.map((route) => <tr key={route.file}>
                  <td><strong>{route.route}</strong></td><td>{route.type}</td>
                  <td><a href={githubFile(route.file)} target="_blank" rel="noreferrer">{route.file.split("/").slice(-2).join("/")}</a></td>
                  <td>{route.imports.length}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <details className="arch-details" style={{marginTop:12}}>
              <summary>عرض الاستيرادات الفعلية لكل مسار</summary>
              <div className="arch-list">{webRoutes.map(route=><div className="arch-item" key={route.file}><span><strong>{route.route}</strong><br/><code>{route.imports.join(" · ") || "لا توجد استيرادات محلية مكتشفة"}</code></span><span>{route.imports.length}</span></div>)}</div>
            </details>
          </div>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">شاشات تطبيق الهاتف</h2>
          <div className="arch-grid">
            {mobileScreens.map(screen=><article className="arch-card" key={screen.file}>
              <span className="arch-tag">Mobile Screen</span><h2>{screen.name}</h2>
              <a className="arch-code" href={githubFile(screen.file)} target="_blank" rel="noreferrer">{screen.file}</a>
            </article>)}
          </div>
          <details className="arch-details" style={{marginTop:12}}>
            <summary>المكونات المشتركة في تطبيق الهاتف ({mobileComponents.length})</summary>
            <div className="arch-list">{mobileComponents.map(item=><div className="arch-item" key={item.file}><a href={githubFile(item.file)} target="_blank" rel="noreferrer">{item.name}</a><span>{item.file}</span></div>)}</div>
          </details>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">شبكة اعتماد الملفات</h2>
          <p className="meta">يستخرج الماسح الاستيرادات المحلية من ملفات TypeScript وJavaScript ويربط الملف المستهلك بالملف الذي يعتمد عليه.</p>
          <div className="arch-table-wrap">
            <table className="arch-table"><thead><tr><th>الملف المستهلك</th><th>يعتمد على</th></tr></thead><tbody>
              {topDependencies.map((edge, index)=><tr key={index}>
                <td><a href={githubFile(edge.from)} target="_blank" rel="noreferrer">{edge.from.replace(projectRoot,"")}</a></td>
                <td><a href={githubFile(edge.to)} target="_blank" rel="noreferrer">{edge.to.replace(projectRoot,"")}</a></td>
              </tr>)}
            </tbody></table>
          </div>
          <p className="meta">يعرض الجدول أول {topDependencies.length} علاقة من أصل {architecture.dependencies.length}. افتح الملفات من الروابط لعرض بقية التفاصيل.</p>
          <details className="arch-details" style={{marginTop:12}}>
            <summary>فهرس جميع ملفات المصدر ({sourceFiles.length})</summary>
            <div className="arch-list">{sourceFiles.map(file=><div className="arch-item" key={file}>
              <a href={githubFile(file)} target="_blank" rel="noreferrer">{file.replace(projectRoot,"")}</a>
              <span>{file.includes("/apps/mobile/")?"الهاتف":file.includes("/apps/web/")?"الويب":file.includes("/packages/shared/")?"مشترك":"ملف"}</span>
            </div>)}</div>
          </details>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">قاعدة البيانات وعلاقات المفاتيح الخارجية</h2>
          <div className="arch-table-wrap">
            <table className="arch-table"><thead><tr><th>الجدول</th><th>الأعمدة المستخرجة</th><th>RLS في ملفات SQL</th></tr></thead>
              <tbody>{databaseTables.map(table=><tr key={table.name}>
                <td><strong>{table.name}</strong><br/><code>{table.policies.length} سياسات</code></td>
                <td><code>{table.columns.join(" · ")}</code></td>
                <td>{table.rlsEnabled ? "مفعّل في الترحيلات" : "غير مثبت في الترحيلات"}</td>
                
              </tr>)}</tbody>
            </table>
          </div>
          <details className="arch-details" style={{marginTop:12}} open>
            <summary>علاقات الجداول ({databaseRelationships.length})</summary>
            <div className="arch-list">{databaseRelationships.map((edge,index)=><div className="arch-item" key={index}>
              <span><strong>{edge.fromTable}.{edge.fromColumn}</strong> ← {edge.toTable}.{edge.toColumn}</span><span>Foreign Key</span>
            </div>)}</div>
          </details>
        </section>

        <section className="arch-grid">
          <article className="arch-card"><span className="arch-tag">RLS</span><h2>سياسات الوصول</h2>
            <p>السياسات المستخرجة من ملفات SQL حسب الجدول.</p>
            <ul>{architecture.database.policies.map(policy=><li key={policy.name + policy.table}>{policy.name} — {policy.table}</li>)}</ul>
          </article>
          <article className="arch-card"><span className="arch-tag">PostgreSQL</span><h2>الدوال والمحفزات</h2>
            <p>تعريفات قاعدة البيانات الموجودة في ملفات الترحيل.</p>
            <ul>{architecture.database.functions.map(fn=><li key={fn.name}>{fn.name}()</li>)}{architecture.database.triggers.map(trigger=><li key={trigger.name}>{trigger.name} — {trigger.table}</li>)}</ul>
          </article>
          <article className="arch-card"><span className="arch-tag">Migrations</span><h2>ملفات الترحيل</h2>
            <p>ملفات SQL الموجودة في المستودع، وليست بحد ذاتها إثباتًا على تنفيذ كل ملف حاليًا.</p>
            <ul>{architecture.database.migrations.map(file=><li key={file}><a href={githubFile(`SUPER_PHONE_starter/supabase/migrations/${file}`)} target="_blank" rel="noreferrer">{file}</a></li>)}</ul>
          </article>
        </section>

        <section className="sp-admin-panel">
          <h2 className="arch-subtitle">ملاحظات المراجعة الأمنية</h2>
          <div className="arch-note">رصد فحص Supabase السابق أن الدالة public.is_admin() قابلة للتنفيذ من anon وauthenticated. يجب مراجعة صلاحية EXECUTE واحتياجات سياسات RLS قبل أي تغيير.</div>
          <div className="arch-note" style={{marginTop:9}}>رصد فحص Supabase السابق توصية بتفعيل حماية كلمات المرور المسربة في إعدادات Auth.</div>
          <div className="arch-note" style={{marginTop:9}}>هذه الصفحة تفحص تعريفات SQL والملفات ولا تنفذ تغييرات على قاعدة البيانات أو إعدادات المصادقة.</div>
        </section>

        <section className="arch-links">
          <Link href="/founder/settings">العودة إلى إعدادات المؤسس</Link>
          <a href={`https://github.com/orvexdcb/Super_phone/tree/${encodedGithubRef}/SUPER_PHONE_starter`} target="_blank" rel="noreferrer">فتح ملفات المشروع</a>
          <a href="https://supabase.com/dashboard/project/eqlenftagozvjezswbaf" target="_blank" rel="noreferrer">فتح قاعدة البيانات</a>
        </section>
      </div>
    </main>
  );
}
