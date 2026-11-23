import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";
import { createPlan,togglePlan,createDiscount,toggleDiscount } from "./actions";
export const dynamic="force-dynamic";
const money=(n:number,c:string)=>new Intl.NumberFormat("ar-IQ",{maximumFractionDigits:0}).format(n)+" "+(c==="USD"?"$":"د.ع");
export default async function FounderPlansPage(){
 const s=await createServerSupabase(); const {data:{user}}=await s.auth.getUser(); if(!user)redirect("/login");
 const {data:profile}=await s.from("profiles").select("role").eq("id",user.id).single(); if(profile?.role!=="admin")redirect("/account");
 const [{data:plans},{data:codes}]=await Promise.all([
  s.from("subscription_plans").select("*").order("sort_order").order("created_at",{ascending:false}),
  s.from("discount_codes").select("*,subscription_plans(name)").order("created_at",{ascending:false})
 ]);
 return <main className="founder-shell" dir="rtl">
  <section className="founder-heading"><Link href="/founder/settings" className="founder-kicker">← إعدادات المؤسس</Link><h1>الباقات والخصومات</h1><p>أنشئ باقات ثابتة وأكواد خصم للباقات ورسوم نشر الإعلانات.</p></section>
  <section className="sp-admin-panel"><h2>إنشاء باقة جديدة</h2><form action={createPlan} className="sp-product-form">
   <label>اسم الباقة<input name="name" required minLength={2} maxLength={80} placeholder="مثلاً: الباقة الذهبية"/></label>
   <label>وصف الباقة<textarea name="description" rows={2} placeholder="مميزات الباقة"/></label>
   <div className="sp-admin-row"><label>السعر<input name="price" type="number" min="0" step="1" required/></label><label>العملة<select name="currency"><option value="IQD">دينار عراقي</option><option value="USD">دولار</option></select></label></div>
   <div className="sp-admin-row"><label>المدة بالأيام<input name="duration_days" type="number" min="1" defaultValue="30" required/></label><label>عدد الإعلانات النشطة<input name="max_active_listings" type="number" min="0" defaultValue="5" required/></label><label>الإعلانات المميزة<input name="max_featured_listings" type="number" min="0" defaultValue="0"/></label></div>
   <label>ترتيب العرض<input name="sort_order" type="number" defaultValue="0"/></label><button type="submit">إنشاء الباقة</button>
  </form></section>
  <section className="sp-admin-panel"><h2>الباقات الحالية ({plans?.length||0})</h2>
   {(plans||[]).length===0?<p>لا توجد باقات بعد.</p>:(plans||[]).map(p=><article className="sp-admin-product" key={p.id}><div><strong>{p.name}</strong><p>{money(Number(p.price),p.currency)} · {p.duration_days} يوم · {p.max_active_listings} إعلانات · {p.max_featured_listings} مميزة</p><small>{p.description||"بدون وصف"}</small></div><form action={togglePlan}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="active" value={String(p.is_active)}/><button type="submit">{p.is_active?"إيقاف الباقة":"تفعيل الباقة"}</button></form></article>)}
  </section>
  <section className="sp-admin-panel"><h2>إنشاء كود خصم</h2><form action={createDiscount} className="sp-product-form">
   <label>كود الخصم<input name="code" required minLength={3} maxLength={40} placeholder="WELCOME20" style={{textTransform:"uppercase",direction:"ltr"}}/></label>
   <div className="sp-admin-row"><label>نوع الخصم<select name="discount_type"><option value="percentage">نسبة مئوية %</option><option value="fixed">مبلغ ثابت</option></select></label><label>قيمة الخصم<input name="discount_value" type="number" min="0.01" step="0.01" required/></label><label>العملة<select name="currency"><option value="IQD">دينار عراقي</option><option value="USD">دولار</option></select></label></div>
   <label>يطبق على<select name="applies_to"><option value="both">الباقات ورسوم نشر الإعلانات</option><option value="plans">الباقات فقط</option><option value="listing_fees">رسوم نشر الإعلانات فقط</option></select></label>
   <label>تخصيص لباقة (اختياري)<select name="plan_id"><option value="">كل الباقات</option>{(plans||[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <div className="sp-admin-row"><label>يبدأ في (اختياري)<input name="starts_at" type="datetime-local"/></label><label>ينتهي في (اتركه فارغاً ليكون دائماً)<input name="expires_at" type="datetime-local"/></label></div>
   <label>الحد الأقصى للاستخدام (فارغ = غير محدود)<input name="max_redemptions" type="number" min="1" placeholder="غير محدود"/></label>
   <button type="submit">إنشاء كود الخصم</button>
  </form></section>
  <section className="sp-admin-panel"><h2>أكواد الخصم ({codes?.length||0})</h2>
   {(codes||[]).length===0?<p>لا توجد أكواد خصم بعد.</p>:(codes||[]).map(c=><article className="sp-admin-product" key={c.id}><div><strong dir="ltr">{c.code}</strong><p>{c.discount_type==="percentage"?c.discount_value+"%":money(Number(c.discount_value),c.currency)} · {c.applies_to==="both"?"الباقات ورسوم النشر":c.applies_to==="plans"?"الباقات":"رسوم النشر"}</p><small>{c.expires_at?"ينتهي: "+new Date(c.expires_at).toLocaleString("ar-IQ"):"دائم"} · الاستخدامات: {c.redemption_count}{c.max_redemptions?"/"+c.max_redemptions:"/∞"} · {c.subscription_plans?.name||"كل الباقات"}</small></div><form action={toggleDiscount}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="active" value={String(c.is_active)}/><button type="submit">{c.is_active?"إيقاف الكود":"تفعيل الكود"}</button></form></article>)}
  </section>
 </main>;
}
