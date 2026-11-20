import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "../lib/supabase-server";
import SignOutButton from "./SignOutButton";
import { cookies } from "next/headers";

function Icon({ name }: { name: "home" | "search" | "heart" | "plus" | "user" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    heart: <path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default async function Header() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("sp_lang")?.value || "ar";
  const words = { ar: { tagline:"سوق الهواتف والأجهزة الذكية", home:"الرئيسية", search:"البحث", sell:"＋ نشر إعلان", favorites:"المفضلة", account:"حسابي", login:"دخول", signup:"حساب جديد", post:"إعلان جديد" }, en: { tagline:"Phones and smart devices marketplace", home:"Home", search:"Search", sell:"＋ Post a listing", favorites:"Favorites", account:"Account", login:"Log in", signup:"Sign up", post:"New listing" }, ku: { tagline:"بازاڕی مۆبایل و ئامێرە زیرەکەکان", home:"سەرەکی", search:"گەڕان", sell:"＋ ڕیکلام دابنێ", favorites:"دڵخوازەکان", account:"هەژمار", login:"چوونەژوورەوە", signup:"هەژماری نوێ", post:"ڕیکلامی نوێ" } }[lang] || { tagline:"سوق الهواتف والأجهزة الذكية", home:"الرئيسية", search:"البحث", sell:"＋ نشر إعلان", favorites:"المفضلة", account:"حسابي", login:"دخول", signup:"حساب جديد", post:"إعلان جديد" };
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <>
      <header className="site-header">
        <nav className="topbar">
          <Link href="/" className="brand-lockup" aria-label={`SUPER PHONE - ${words.home}`}>
            <Image src="/pwa-icon-512.png" alt="SUPER PHONE" width={54} height={54} priority className="brand-mark" />
            <span className="brand-copy"><strong>SUPER <i>PHONE</i></strong><small>{words.tagline}</small></span>
          </Link>
          <div className="nav-actions">
            <Link href="/#search">{words.search}</Link>
            {user ? (
              <>
                <Link href="/account/listings/new" className="cta">{words.sell}</Link>
                <Link href="/account/favorites">{words.favorites}</Link>
                <Link href="/account">{words.account}</Link>
                <SignOutButton />
              </>
            ) : (
              <><Link href="/login">{words.login}</Link><Link href="/signup" className="cta">{words.signup}</Link></>
            )}
          </div>
        </nav>
      </header>
      <nav className="mobile-dock" aria-label="التنقل الرئيسي">
        <Link href="/" className="dock-item"><Icon name="home" /><span>{words.home}</span></Link>
        <Link href="/#search" className="dock-item"><Icon name="search" /><span>{words.search}</span></Link>
        <Link href={user ? "/account/listings/new" : "/login?next=/account/listings/new"} className="dock-add"><Icon name="plus" /><span>{words.post}</span></Link>
        <Link href={user ? "/account/favorites" : "/login?next=/account/favorites"} className="dock-item"><Icon name="heart" /><span>{words.favorites}</span></Link>
        <Link href={user ? "/account" : "/login?next=/account"} className="dock-item"><Icon name="user" /><span>{words.account}</span></Link>
      </nav>
    </>
  );
}
