import Link from "next/link";
import { createServerSupabase } from "../lib/supabase-server";
import SignOutButton from "./SignOutButton";
import { cookies } from "next/headers";

export default async function Header() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const words = {
    ar:{tagline:"سوق الأجهزة الذكية",search:"بحث",favorites:"المفضلة",sell:"بيع جهازك",signup:"إنشاء حساب"},
    en:{tagline:"Smart device marketplace",search:"Search",favorites:"Favorites",sell:"Sell device",signup:"Create account"},
    ku:{tagline:"بازاڕی ئامێرە زیرەکەکان",search:"گەڕان",favorites:"دڵخوازەکان",sell:"ئامێرەکەت بفرۆشە",signup:"هەژماری نوێ"}
  }[lang];
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id",user.id).single() : {data:null};
  return <header className="site-header sp-site-header">
    <nav className="topbar sp-topbar">
      <Link href="/" className="brand-lockup" aria-label="SUPER PHONE">
        <img src="/pwa-icon-192.png" alt="" width="46" height="46" className="brand-mark"/>
        <span className="brand-copy"><strong>SUPER PHONE</strong><small>{words.tagline}</small></span>
      </Link>
      <div className="nav-actions sp-header-actions">
        <Link href="/account/listings/new" className="sp-nav-action sp-nav-sell" data-guide="sell"><span>＋</span>{words.sell}</Link>
        <Link href="/#sp-search" className="sp-nav-action" data-guide="search"><span>⌕</span>{words.search}</Link>
        <Link href="/account/favorites" className="sp-nav-action" data-guide="favorites"><span>♡</span>{words.favorites}</Link>
        {user ? <><SignOutButton/><>{profile?.role==="admin"&&<Link href="/founder/settings" className="sp-founder-link">المؤسس</Link>}</></> : <Link href="/signup" className="sp-nav-action sp-nav-account" data-guide="account">{words.signup}</Link>}
      </div>
    </nav>
  </header>;
}
