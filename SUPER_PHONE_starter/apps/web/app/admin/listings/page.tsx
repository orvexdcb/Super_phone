import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { formatPrice } from "@super-phone/shared";
import { createServerSupabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/listings");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") notFound();
  return supabase;
}

async function approve(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  await supabase.from("listings").update({ status: "active", rejection_reason: null })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/listings");
}

async function reject(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || "لا يطابق شروط النشر";
  await supabase.from("listings").update({ status: "rejected", rejection_reason: reason })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/listings");
}

export default async function AdminListings() {
  const supabase = await requireAdmin();
  const { data: pending } = await supabase
    .from("listings")
    .select("id,title,price,currency,governorate,description,contact_phone,created_at,categories(name_ar)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  return (
    <main>
      <h1>مراجعة الإعلانات ({pending?.length ?? 0})</h1>
      <p className="alt"><Link href="/admin/reports">البلاغات</Link></p>
      {(!pending || pending.length === 0) && <p className="notice">لا توجد إعلانات بانتظار المراجعة.</p>}
      <div className="admin-list">
        {(pending ?? []).map((l) => (
          <article key={l.id} className="admin-item">
            <h3><Link href={`/listing/${l.id}`} target="_blank">{l.title}</Link></h3>
            <p className="price">{formatPrice(Number(l.price), l.currency)}</p>
            <p className="meta">{l.categories?.name_ar} · {l.governorate} · {l.contact_phone}</p>
            {l.description && <p className="desc">{l.description}</p>}
            <div className="admin-actions">
              <form action={approve}>
                <input type="hidden" name="id" value={l.id} />
                <button type="submit" className="ok-btn">قبول</button>
              </form>
              <form action={reject}>
                <input type="hidden" name="id" value={l.id} />
                <input name="reason" placeholder="سبب الرفض" maxLength={300} />
                <button type="submit" className="no-btn">رفض</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
