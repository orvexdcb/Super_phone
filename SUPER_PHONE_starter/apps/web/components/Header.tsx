import Link from "next/link";
import { createServerSupabase } from "../lib/supabase-server";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <nav className="topbar">
      <Link href="/" className="logo">SUPER PHONE</Link>
      <div className="nav-actions">
        {user ? (
          <>
            <Link href="/account/listings/new" className="cta">+ نشر إعلان</Link>
            <Link href="/account/favorites">المفضلة</Link>
            <Link href="/account">حسابي</Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/login">دخول</Link>
            <Link href="/signup" className="cta">حساب جديد</Link>
          </>
        )}
      </div>
    </nav>
  );
}
