"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GOVERNORATES, CONDITION_LABELS, MAX_IMAGES, MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES,
} from "@super-phone/shared";
import { createBrowserSupabase } from "../lib/supabase-browser";
import { t } from "../lib/i18n";

type Cat = { id: string; name_ar: string };
type Defaults = { phone: string; governorate: string };

const SPEC_KEYS = ["storage", "ram", "battery_health", "color"] as const;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default function ListingForm({ categories, defaults, lang = "ar" }: { categories: Cat[]; defaults: Defaults; lang?: "ar" | "en" | "ku" }) {
  const tx = (key: Parameters<typeof t>[1]) => t(lang, key);
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next = [...files, ...picked].slice(0, MAX_IMAGES);
    const bad = next.find(
      (f) => !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type) || f.size > MAX_IMAGE_BYTES
    );
    if (bad) return setError(tx("imageError"));
    setError("");
    setFiles(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const price = Number(f.get("price"));
    if (!Number.isFinite(price) || price < 0) return setError(tx("priceError"));
    if (files.length === 0) return setError(tx("photoRequired"));

    setBusy(true);
    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return router.replace("/login?next=/account/listings/new"); }

    // 1) رفع الصور إلى مجلد المستخدم
    const uploaded: string[] = [];
    for (const file of files) {
      const path = `${user.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error: upErr } = await supabase.storage.from("listing-images").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) {
        if (uploaded.length) await supabase.storage.from("listing-images").remove(uploaded);
        setBusy(false);
        return setError(tx("uploadError"));
      }
      uploaded.push(path);
    }

    // 2) إنشاء الإعلان (يدخل قيد المراجعة دائماً)
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const { data: listing, error: insErr } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        category_id: text("category_id"),
        title: text("title"),
        description: text("description") || null,
        price,
        currency: text("currency"),
        condition: text("condition"),
        brand: text("brand") || null,
        model: text("model") || null,
        governorate: text("governorate"),
        city: text("city") || null,
        contact_phone: text("contact_phone") || null,
        status: "pending_review",
      })
      .select("id")
      .single();

    if (insErr || !listing) {
      await supabase.storage.from("listing-images").remove(uploaded);
      setBusy(false);
      return setError(tx("submitError"));
    }

    // 3) الصور والمواصفات
    const { error: imgErr } = await supabase.from("listing_images").insert(
      uploaded.map((storage_path, i) => ({ listing_id: listing.id, storage_path, sort_order: i }))
    );
    const specRows = SPEC_KEYS.map((key) => ({ listing_id: listing.id, spec_key: key, spec_value: text(`spec_${key}`) }))
      .filter((s) => s.spec_value);
    const { error: specErr } = specRows.length
      ? await supabase.from("listing_specs").insert(specRows)
      : { error: null };

    setBusy(false);
    if (imgErr || specErr) return setError(tx("partialError"));
    router.replace("/account/listings?posted=1");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="auth-form wide">
      <select name="category_id" required defaultValue="">
        <option value="" disabled>{tx("category")}</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
      </select>
      <input name="title" placeholder={tx("title")} required minLength={3} maxLength={120} />
      <div className="row">
        <input name="price" type="number" min={0} step={1} placeholder={tx("price")} required inputMode="numeric" />
        <select name="currency" defaultValue="IQD">
          <option value="IQD">{tx("currencyIQD")}</option>
          <option value="USD">{tx("currencyUSD")}</option>
        </select>
      </div>
      <select name="condition" required defaultValue="">
        <option value="" disabled>{tx("condition")}</option>
        {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <div className="row">
        <input name="brand" placeholder={tx("brand")} maxLength={60} />
        <input name="model" placeholder={tx("model")} maxLength={60} />
      </div>
      <div className="row">
        <select name="governorate" required defaultValue={defaults.governorate}>
          <option value="" disabled>{tx("governorate")}</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input name="city" placeholder={tx("area")} maxLength={60} />
      </div>
      <input name="contact_phone" defaultValue={defaults.phone} placeholder={tx("contact")} maxLength={20} dir="ltr" required />

      <fieldset>
        <legend>{tx("specs")}</legend>
        {SPEC_KEYS.map((key) => (
          <input key={key} name={`spec_${key}`} placeholder={tx(key === "storage" ? "storage" : key === "ram" ? "ram" : key === "battery_health" ? "battery" : "color")} maxLength={60} />
        ))}
      </fieldset>

      <textarea name="description" placeholder={tx("description")} rows={5} maxLength={4000} />

      <div>
        <label className="file-btn">
          {tx("addPhotos")} ({files.length}/{MAX_IMAGES})
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onPick} disabled={files.length >= MAX_IMAGES} />
        </label>
        <div className="previews">
          {files.map((file, i) => (
            <div key={i} className="preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(file)} alt="" />
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={tx("delete")}>×</button>
            </div>
          ))}
        </div>
      </div>

      <p className="meta">{tx("reviewNote")}</p>
      {error && <p className="notice err">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? tx("publishing") : tx("publish")}</button>
    </form>
  );
}
