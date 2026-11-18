import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../../../lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function save(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!UUID.test(id)) notFound();
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const price = Number(formData.get("price"));
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3 || !Number.isFinite(price) || price < 0) redirect(`/account/listings/${id}/edit?error=1`);

  const currency = formData.get("currency") === "USD" ? "USD" : "IQD";
  const { error } = await supabase
    .from("listings")
    .update({
      title,
      price,
      currency,
      city: String(formData.get("city") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim().slice(0, 20),
      description: String(formData.get("description") ?? "").trim().slice(0, 4000) || null,
    })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) redirect(`/account/listings/${id}/edit?error=1`);
  revalidatePath("/account/listings");
  redirect("/account/listings?edited=1");
}

export default async function EditListing({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/listings/${id}/edit`);

  const { data: l } = await supabase.from("listings").select("*").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!l) notFound();

  return (
    <main className="auth wide">
      <h1>تعديل الإعلان</h1>
      {l.status === "active" && (
        <p className="notice">تنبيه: تعديل إعلان منشور يعيده للمراجعة، وسيختفي حتى تتم الموافقة.</p>
      )}
      <form action={save} className="auth-form wide">
        <input type="hidden" name="id" value={l.id} />
        <input name="title" defaultValue={l.title} required minLength={3} maxLength={120} />
        <div className="row">
          <input name="price" type="number" min={0} step={1} defaultValue={Number(l.price)} required />
          <select name="currency" defaultValue={l.currency}>
            <option value="IQD">دينار عراقي</option>
            <option value="USD">دولار</option>
          </select>
        </div>
        <input name="city" defaultValue={l.city ?? ""} placeholder="المدينة / المنطقة" maxLength={60} />
        <input name="contact_phone" defaultValue={l.contact_phone ?? ""} required maxLength={20} dir="ltr" />
        <textarea name="description" defaultValue={l.description ?? ""} rows={5} maxLength={4000} />
        {sp.error && <p className="notice err">تحقق من الحقول وحاول مرة أخرى.</p>}
        <button type="submit">حفظ التعديلات</button>
      </form>
    </main>
  );
}
