import { Suspense } from "react";
import AuthForm from "../../components/AuthForm";
import { cookies } from "next/headers";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  return <Suspense><AuthForm mode="signup" lang={lang} /></Suspense>;
}
