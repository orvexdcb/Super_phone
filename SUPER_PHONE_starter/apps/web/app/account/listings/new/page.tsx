import { redirect } from "next/navigation";
import ListingForm from "../../../../components/ListingForm";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { cookies } from "next/headers";
import { t } from "../../../../lib/i18n";

export default async function NewListingPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/listings/new");

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("id, name_ar").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("phone, governorate, is_banned").eq("id", user.id).single(),
  ]);

  if (profile?.is_banned) {
    return <main className="auth"><p className="notice err">{t(lang, "actionError")}</p></main>;
  }

  return (
    <main className="auth wide">
      <h1>{t(lang, "post")}</h1>
      <ListingForm
        categories={categories ?? []}
        defaults={{ phone: profile?.phone ?? "", governorate: profile?.governorate ?? "" }}
        lang={lang}
      />
    </main>
  );
}
