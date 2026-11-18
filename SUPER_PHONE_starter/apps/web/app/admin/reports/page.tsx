import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createServerSupabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/reports");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") notFound();
  return supabase;
}

async function dismiss(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  await supabase.from("reports").update({ status: "dismissed" }).eq("id", String(formData.get("id")));
  revalidatePath("/admin/reports");
}

async function pauseListing(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  await supabase.from("listings").update({ status: "paused" }).eq("id", String(formData.get("listing_id")));
  await supabase.from("reports").update({ status: "reviewed" }).eq("id", String(formData.get("id")));
  revalidatePath("/admin/reports");
}

export default async function AdminReports() {
  const supabase = await requireAdmin();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, created_at, listing_id, listings(title, status)")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  return (
    <main>
      <h1>البلاغات ({reports?.length ?? 0})</h1>
      <p className="alt"><Link href="/admin/listings">مراجعة الإعلانات</Link></p>
      {(!reports || reports.length === 0) && <p className="notice">لا توجد بلاغات مفتوحة.</p>}
      <div className="admin-list">
        {(reports ?? []).map((r) => {
          const l = r.listings as unknown as { title: string; status: string } | null;
          return (
            <article key={r.id} className="admin-item">
              <h3><Link href={`/listing/${r.listing_id}`} target="_blank">{l?.title ?? "إعلان محذوف"}</Link></h3>
              <p className="desc">{r.reason}</p>
              <div className="admin-actions">
                <form action={pauseListing}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="listing_id" value={r.listing_id} />
                  <button type="submit" className="no-btn">إيقاف الإعلان</button>
                </form>
                <form action={dismiss}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="ok-btn">تجاهل البلاغ</button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
