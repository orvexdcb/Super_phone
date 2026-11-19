import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "../lib/supabase-server";
import SignOutButton from "./SignOutButton";

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
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <>
      <header className="site-header">
        <nav className="topbar">
          <Link href="/" className="brand-lockup" aria-label="SUPER PHONE - الرئيسية">
            <Image src="/pwa-icon-512.png" alt="شعار SUPER PHONE" width={54} height={54} priority className="brand-mark" />
            <span className="brand-copy"><strong>SUPER <i>PHONE</i></strong><small>سوق الهواتف والأجهزة الذكية</small></span>
          </Link>
          <div className="nav-actions">
            <Link href="/#search">البحث</Link>
            {user ? (
              <>
                <Link href="/account/listings/new" className="cta">＋ نشر إعلان</Link>
                <Link href="/account/favorites">المفضلة</Link>
                <Link href="/account">حسابي</Link>
                <SignOutButton />
              </>
            ) : (
              <><Link href="/login">دخول</Link><Link href="/signup" className="cta">حساب جديد</Link></>
            )}
          </div>
        </nav>
      </header>
      <nav className="mobile-dock" aria-label="التنقل الرئيسي">
        <Link href="/" className="dock-item"><Icon name="home" /><span>الرئيسية</span></Link>
        <Link href="/#search" className="dock-item"><Icon name="search" /><span>البحث</span></Link>
        <Link href={user ? "/account/listings/new" : "/login?next=/account/listings/new"} className="dock-add"><Icon name="plus" /><span>إعلان جديد</span></Link>
        <Link href={user ? "/account/favorites" : "/login?next=/account/favorites"} className="dock-item"><Icon name="heart" /><span>المفضلة</span></Link>
        <Link href={user ? "/account" : "/login?next=/account"} className="dock-item"><Icon name="user" /><span>حسابي</span></Link>
      </nav>
    </>
  );
}
