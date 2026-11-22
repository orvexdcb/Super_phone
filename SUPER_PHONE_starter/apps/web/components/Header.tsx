import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "../lib/supabase-server";
import SignOutButton from "./SignOutButton";
import { cookies } from "next/headers";

export default async function Header() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const words = {
    ar:{tagline:"سوق الأجهزة الذكية",search:"البحث",account:"حسابي",login:"دخول",signup:"إنشاء حساب",sell:"بيع جهازك"},
    en:{tagline:"Smart device marketplace",search:"Search",account:"Account",login:"Log in",signup:"Sign up",sell:"Sell device"},
    ku:{tagline:"بازاڕی ئامێرە زیرەکەکان",search:"گەڕان",account:"هەژمار",login:"چوونەژوورەوە",signup:"هەژماری نوێ",sell:"ئامێرەکەت بفرۆشە"}
  }[lang] || {tagline:"سوق الأجهزة الذكية",search:"البحث",account:"حسابي",login:"دخول",signup:"إنشاء حساب",sell:"بيع جهازك"};
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id",user.id).single() : {data:null};
  return <header className="site-header sp-site-header">
    <nav className="topbar">
      <Link href="/" className="brand-lockup" aria-label="SUPER PHONE">
        <Image src="/pwa-icon-512.png" alt="SUPER PHONE" width={48} height={48} priority className="brand-mark"/>
        <span className="brand-copy"><strong>SUPER <i>PHONE</i></strong><small>{words.tagline}</small></span>
      </Link>
      <div className="nav-actions sp-header-actions">
        <Link href="/#sp-search">{words.search}</Link>
        {user ? <><Link href="/account/listings/new" className="cta">{words.sell}</Link><Link href="/account">{words.account}</Link>{profile?.role==="admin"&&<Link href="/founder/settings" className="sp-founder-link">المؤسس</Link>}<SignOutButton/></> : <><Link href="/login">{words.login}</Link><Link href="/signup" className="cta">{words.signup}</Link></>}
      </div>
    </nav>
  </header>;
}
