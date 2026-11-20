import Link from "next/link";
import { CONDITION_LABELS, formatPrice } from "@super-phone/shared";
import { cookies } from "next/headers";
import { conditionName, governorateName, categoryName } from "../lib/i18n";
import { listingImageUrl } from "../lib/supabase";
import type { ListingCard as Listing } from "../lib/listings";

export default async function ListingCard({ listing }: { listing: Listing }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  const first = [...listing.listing_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <Link href={`/listing/${listing.id}`} className="card-link">
    <article className="card">
      <div className="thumb">
        {first ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listingImageUrl(first.storage_path)} alt={listing.title} loading="lazy" />
        ) : (
          <span>{lang === "en" ? "No image" : lang === "ku" ? "بێ وێنە" : "بدون صورة"}</span>
        )}
      </div>
      <div className="body">
        <h3>{listing.title}</h3>
        <p className="price">{formatPrice(listing.price, listing.currency)}</p>
        <p className="meta">
          {conditionName(lang, listing.condition, CONDITION_LABELS[listing.condition])} · {categoryName(lang, listing.categories?.[0]?.name_ar || "")}
        </p>
        <p className="meta">
          {governorateName(lang, listing.governorate)}
          {listing.city ? ` — ${listing.city}` : ""}
        </p>
      </div>
    </article>
    </Link>
  );
}
