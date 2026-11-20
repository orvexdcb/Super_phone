import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";
export const dynamic = "force-dynamic";
const tools = [
{title:"مراجعة الإعلانات",description:"قبول الإعلانات الجديدة أو رفضها",href:"/admin/listings",icon:"▣"},
{title:"إدارة البلاغات",description:"متابعة بلاغات المستخدمين",href:"/admin/reports",icon:"⚑"},
{title:"حساب المؤسس",description:"بيانات حسابك وصلاحيات الدخول",href:"/account",icon:"◎"}
];
export default async function FounderSettingsPage(){
const supabase=await createServerSupabase();
const {data:{user}}=await supabase.auth.getUser();
if(!user) redirect("/login?next=/founder/settings");
const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
if(profile?.role!=="admin") redirect("/account");
const [{count:pending},{count:reports}]=await Promise.all([
supabase.from("listings").select("id",{count:"exact",head:true}).eq("status","pending_review"),
supabase.from("reports").select("id",{count:"exact",head:true}).eq("status","open")
]);
return <main className="founder-shell" dir="rtl">
<section className="founder-heading"><span className="founder-kicker">SUPER PHONE · FOUNDER</span><h1>إعدادات البرنامج الكاملة</h1><p>مركز أدوات المؤسس والتحكم الإداري بالمنصة. هذه الصفحة خاصة بحساب المؤسس فقط.</p></section>
<section className="founder-stats"><article><span>إعلانات بانتظار المراجعة</span><strong>{pending??0}</strong></article><article><span>البلاغات المفتوحة</span><strong>{reports??0}</strong></article><article><span>صلاحية الحساب</span><strong className="founder-admin">مؤسس · ADMIN</strong></article></section>
<h2 className="founder-section-title">أدوات الإدارة المتاحة</h2><section className="founder-tools">{tools.map(x=><Link className="founder-tool" href={x.href} key={x.href}><span className="founder-tool-icon">{x.icon}</span><span className="founder-tool-copy"><strong>{x.title}</strong><small>{x.description}</small></span><span className="founder-arrow">←</span></Link>)}</section>
<p className="founder-note">تعرض هذه الصفحة الأدوات الإدارية الموجودة والفعالة حالياً. الأدوات الأخرى ستضاف عند تجهيز وظائفها وصلاحياتها حتى لا تظهر أزرار غير عاملة.</p></main>;
}