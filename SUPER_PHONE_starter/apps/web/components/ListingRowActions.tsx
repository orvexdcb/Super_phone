"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "../lib/supabase-browser";

type Props = { id: string; status: string; lang?: "ar" | "en" | "ku" };

export default function ListingRowActions({ id, status, lang = "ar" }: Props) {
  const labels = lang === "en" ? {error:"Could not complete the action.",deleteConfirm:"Delete this listing permanently?",deleteError:"Could not delete the listing.",sold:"Mark as sold",pause:"Pause",resume:"Submit for review",edit:"Edit",delete:"Delete"} : lang === "ku" ? {error:"جێبەجێکردنی کردار سەرکەوتوو نەبوو.",deleteConfirm:"ئەم ڕیکلامە بسڕیتەوە؟",deleteError:"سڕینەوە سەرکەوتوو نەبوو.",sold:"وەک فرۆشراو نیشانە بکە",pause:"وەستاندن",resume:"ناردن بۆ پشکنین",edit:"دەستکاری",delete:"سڕینەوە"} : {error:"تعذّر تنفيذ العملية.",deleteConfirm:"حذف الإعلان نهائياً؟",deleteError:"تعذّر الحذف.",sold:"تم البيع",pause:"إيقاف",resume:"إعادة للمراجعة",edit:"تعديل",delete:"حذف"};
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function setStatus(next: string) {
    setBusy(true); setErr("");
    const { error } = await createBrowserSupabase().from("listings").update({ status: next }).eq("id", id);
    setBusy(false);
    if (error) return setErr(labels.error);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(labels.deleteConfirm)) return;
    setBusy(true); setErr("");
    const supabase = createBrowserSupabase();
    const { data: imgs } = await supabase.from("listing_images").select("storage_path").eq("listing_id", id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) { setBusy(false); return setErr(labels.deleteError); }
    if (imgs?.length) await supabase.storage.from("listing-images").remove(imgs.map((i) => i.storage_path));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="row-actions">
      {status === "active" && (
        <>
          <button disabled={busy} onClick={() => setStatus("sold")}>{labels.sold}</button>
          <button disabled={busy} onClick={() => setStatus("paused")}>{labels.pause}</button>
        </>
      )}
      {(status === "paused" || status === "sold" || status === "rejected") && (
        <button disabled={busy} onClick={() => setStatus("pending_review")}>{labels.resume}</button>
      )}
      {status !== "sold" && <Link href={`/account/listings/${id}/edit`}>{labels.edit}</Link>}
      <button disabled={busy} className="danger" onClick={remove}>{labels.delete}</button>
      {err && <span className="notice err">{err}</span>}
    </div>
  );
}
