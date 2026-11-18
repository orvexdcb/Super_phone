import { redirect } from "next/navigation";
import ListingForm from "../../../../components/ListingForm";
import { createServerSupabase } from "../../../../lib/supabase-server";

export default async function NewListingPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/listings/new");

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("id, name_ar").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("phone, governorate, is_banned").eq("id", user.id).single(),
  ]);

  if (profile?.is_banned) {
    return <main className="auth"><p className="notice err">حسابك موقوف عن نشر الإعلانات.</p></main>;
  }

  return (
    <main className="auth wide">
      <h1>نشر إعلان</h1>
      <ListingForm
        categories={categories ?? []}
        defaults={{ phone: profile?.phone ?? "", governorate: profile?.governorate ?? "" }}
      />
    </main>
  );
}
