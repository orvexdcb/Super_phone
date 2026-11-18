import Link from "next/link";
import { CONDITION_LABELS, formatPrice } from "@super-phone/shared";
import { listingImageUrl } from "../lib/supabase";
import type { ListingCard as Listing } from "../lib/listings";

export default function ListingCard({ listing }: { listing: Listing }) {
  const first = [...listing.listing_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <Link href={`/listing/${listing.id}`} className="card-link">
    <article className="card">
      <div className="thumb">
        {first ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listingImageUrl(first.storage_path)} alt={listing.title} loading="lazy" />
        ) : (
          <span>بدون صورة</span>
        )}
      </div>
      <div className="body">
        <h3>{listing.title}</h3>
        <p className="price">{formatPrice(listing.price, listing.currency)}</p>
        <p className="meta">
          {CONDITION_LABELS[listing.condition]} · {listing.categories.name_ar}
        </p>
        <p className="meta">
          {listing.governorate}
          {listing.city ? ` — ${listing.city}` : ""}
        </p>
      </div>
    </article>
    </Link>
  );
}
