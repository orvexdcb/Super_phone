"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "../lib/supabase-browser";
import { safeNext } from "../lib/safe-next";
import { t } from "../lib/i18n";

export default function AuthForm({ mode, lang = "ar" }: { mode: "login" | "signup"; lang?: "ar" | "en" | "ku" }) {
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

    const strongPassword =
      password.length >= 12 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (mode === "signup" && !strongPassword) {
      setError(t(lang, "passwordLength"));
      return;
    }
    setLoading(true);
    const supabase = createBrowserSupabase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(t(lang, "loginError"));
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
      if (error) return setError(t(lang, "signupError"));
      if (data.session) {
        router.replace(next);
        router.refresh();
      } else {
        setInfo(t(lang, "confirmEmail"));
      }
    }
  }

  return (
    <main className="auth">
      <h1>{mode === "login" ? t(lang, "login") : t(lang, "signup")}</h1>
      <form onSubmit={onSubmit} className="auth-form">
        {mode === "signup" && (
          <input name="full_name" placeholder={t(lang, "name")} required maxLength={80} autoComplete="name" />
        )}
        <input name="email" type="email" placeholder={t(lang, "email")} required autoComplete="email" dir="ltr" />
        <input
          name="password"
          type="password"
          placeholder={t(lang, "password")}
          required
          minLength={mode === "signup" ? 12 : undefined}
          maxLength={128}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          dir="ltr"
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : mode === "login" ? t(lang, "enter") : t(lang, "create")}
        </button>
      </form>
      {error && <p className="notice err">{error}</p>}
      {info && <p className="notice ok">{info}</p>}
      <p className="alt">
        {mode === "login" ? (
          <>{t(lang, "noAccount")} <Link href="/signup">{t(lang, "createLink")}</Link></>
        ) : (
          <>{t(lang, "haveAccount")} <Link href="/login">{t(lang, "loginLink")}</Link></>
        )}
      </p>
    </main>
  );
}
