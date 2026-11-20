import Link from "next/link";
import { redirect } from "next/navigation";
import { GOVERNORATES } from "@super-phone/shared";
import { createServerSupabase } from "../../lib/supabase-server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { t, governorateName } from "../../lib/i18n";

async function saveProfile(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const gov = String(formData.get("governorate") ?? "");
  await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim().slice(0, 80),
      phone: String(formData.get("phone") ?? "").trim().slice(0, 20),
      governorate: (GOVERNORATES as readonly string[]).includes(gov) ? gov : null,
      city: String(formData.get("city") ?? "").trim().slice(0, 60) || null,
      city: String(formData.get("city") ?? "").trim().slice(0, 60) || null,
    })
    .eq("id", user.id);
  revalidatePath("/account");
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, governorate, city")
    .eq("id", user.id)
    .single();

  return (
    <main className="auth">
      <h1>{t(lang, "account")}</h1>
      <p className="meta" dir="ltr">{user.email}</p>
      <form action={saveProfile} className="auth-form">
        <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder={t(lang, "name")} maxLength={80} />
        <input name="phone" defaultValue={profile?.phone ?? ""} placeholder={t(lang, "phone")} maxLength={20} dir="ltr" />
        <input name="city" defaultValue={profile?.city ?? ""} placeholder={lang === "en" ? "City / area" : lang === "ku" ? "شار / ناوچە" : "المدينة / المنطقة"} maxLength={60} />
        <select name="governorate" defaultValue={profile?.governorate ?? ""}>
          <option value="">{t(lang, "governorate")}</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{governorateName(lang, g)}</option>)}
        </select>
        <button type="submit">{t(lang, "save")}</button>
      </form>
      <p className="alt">
        <Link href="/account/listings">{t(lang, "myListings")}</Link> · <Link href="/account/listings/new">{t(lang, "post")}</Link>
      </p>
    </main>
  );
}
