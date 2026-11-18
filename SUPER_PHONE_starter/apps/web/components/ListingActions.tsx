"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../lib/supabase-browser";

type Props = { listingId: string; userId: string | null; initialFav: boolean; canReport: boolean };

export default function ListingActions({ listingId, userId, initialFav, canReport }: Props) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFav);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [msg, setMsg] = useState("");

  const needLogin = () => router.push(`/login?next=/listing/${listingId}`);

  async function toggleFav() {
    if (!userId) return needLogin();
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { error } = fav
      ? await supabase.from("favorites").delete().eq("listing_id", listingId).eq("user_id", userId)
      : await supabase.from("favorites").insert({ listing_id: listingId, user_id: userId });
    setBusy(false);
    if (!error) setFav(!fav);
  }

  async function sendReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return needLogin();
    const reason = String(new FormData(e.currentTarget).get("reason") ?? "").trim();
    if (reason.length < 3) return setMsg("اكتب سبب البلاغ.");
    setBusy(true);
    const { error } = await createBrowserSupabase()
      .from("reports")
      .insert({ listing_id: listingId, reporter_id: userId, reason });
    setBusy(false);
    setReporting(false);
    setMsg(error?.code === "23505" ? "سبق أن أبلغت عن هذا الإعلان." : error ? "تعذّر إرسال البلاغ." : "شكراً، وصل بلاغك للإدارة.");
  }

  return (
    <div className="actions">
      <button type="button" className="ghost" onClick={toggleFav} disabled={busy}>
        {fav ? "★ في المفضلة" : "☆ أضف للمفضلة"}
      </button>
      {canReport && (
        <button type="button" className="ghost" onClick={() => (userId ? setReporting(!reporting) : needLogin())}>
          ⚑ إبلاغ
        </button>
      )}
      {reporting && (
        <form onSubmit={sendReport} className="report-form">
          <input name="reason" placeholder="سبب البلاغ (احتيال، سعر وهمي، محتوى مخالف...)" maxLength={500} required />
          <button type="submit" disabled={busy}>إرسال</button>
        </form>
      )}
      {msg && <p className="meta">{msg}</p>}
    </div>
  );
}
