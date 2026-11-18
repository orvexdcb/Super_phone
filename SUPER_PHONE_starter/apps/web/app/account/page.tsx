import Link from "next/link";
import { redirect } from "next/navigation";
import { GOVERNORATES } from "@super-phone/shared";
import { createServerSupabase } from "../../lib/supabase-server";
import { revalidatePath } from "next/cache";

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
    })
    .eq("id", user.id);
  revalidatePath("/account");
}

export default async function AccountPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, governorate")
    .eq("id", user.id)
    .single();

  return (
    <main className="auth">
      <h1>حسابي</h1>
      <p className="meta" dir="ltr">{user.email}</p>
      <form action={saveProfile} className="auth-form">
        <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="الاسم" maxLength={80} />
        <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="رقم الهاتف" maxLength={20} dir="ltr" />
        <select name="governorate" defaultValue={profile?.governorate ?? ""}>
          <option value="">المحافظة</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button type="submit">حفظ</button>
      </form>
      <p className="alt">
        <Link href="/account/listings">إعلاناتي</Link> · <Link href="/account/listings/new">نشر إعلان</Link>
      </p>
    </main>
  );
}
