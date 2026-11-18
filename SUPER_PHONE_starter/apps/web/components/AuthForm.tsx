"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "../lib/supabase-browser";
import { safeNext } from "../lib/safe-next";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setInfo("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "").trim();

    if (mode === "signup" && password.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }
    setLoading(true);
    const supabase = createBrowserSupabase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError("البريد أو كلمة المرور غير صحيحة.");
      router.replace(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      if (error) return setError("تعذّر إنشاء الحساب. تحقق من البيانات أو جرّب بريداً آخر.");
      if (data.session) {
        router.replace(next);
        router.refresh();
      } else {
        setInfo("أرسلنا رابط تأكيد إلى بريدك. افتحه لإكمال التسجيل.");
      }
    }
  }

  return (
    <main className="auth">
      <h1>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
      <form onSubmit={onSubmit} className="auth-form">
        {mode === "signup" && (
          <input name="full_name" placeholder="الاسم" required maxLength={80} autoComplete="name" />
        )}
        <input name="email" type="email" placeholder="البريد الإلكتروني" required autoComplete="email" dir="ltr" />
        <input
          name="password"
          type="password"
          placeholder="كلمة المرور"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          dir="ltr"
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>
      </form>
      {error && <p className="notice err">{error}</p>}
      {info && <p className="notice ok">{info}</p>}
      <p className="alt">
        {mode === "login" ? (
          <>ليس لديك حساب؟ <Link href="/signup">أنشئ حساباً</Link></>
        ) : (
          <>لديك حساب؟ <Link href="/login">سجّل الدخول</Link></>
        )}
      </p>
    </main>
  );
}
