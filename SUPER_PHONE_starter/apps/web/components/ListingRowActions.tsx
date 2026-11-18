"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "../lib/supabase-browser";

type Props = { id: string; status: string };

export default function ListingRowActions({ id, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function setStatus(next: string) {
    setBusy(true); setErr("");
    const { error } = await createBrowserSupabase().from("listings").update({ status: next }).eq("id", id);
    setBusy(false);
    if (error) return setErr("تعذّر تنفيذ العملية.");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("حذف الإعلان نهائياً؟")) return;
    setBusy(true); setErr("");
    const supabase = createBrowserSupabase();
    const { data: imgs } = await supabase.from("listing_images").select("storage_path").eq("listing_id", id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) { setBusy(false); return setErr("تعذّر الحذف."); }
    if (imgs?.length) await supabase.storage.from("listing-images").remove(imgs.map((i) => i.storage_path));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="row-actions">
      {status === "active" && (
        <>
          <button disabled={busy} onClick={() => setStatus("sold")}>تم البيع</button>
          <button disabled={busy} onClick={() => setStatus("paused")}>إيقاف</button>
        </>
      )}
      {(status === "paused" || status === "sold" || status === "rejected") && (
        <button disabled={busy} onClick={() => setStatus("pending_review")}>إعادة للمراجعة</button>
      )}
      {status !== "sold" && <Link href={`/account/listings/${id}/edit`}>تعديل</Link>}
      <button disabled={busy} className="danger" onClick={remove}>حذف</button>
      {err && <span className="notice err">{err}</span>}
    </div>
  );
}
