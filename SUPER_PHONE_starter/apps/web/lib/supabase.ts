import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// مفتاح عام فقط؛ الحماية الفعلية تتم عبر سياسات RLS في قاعدة البيانات.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export function listingImageUrl(path: string): string {
  return `${url}/storage/v1/object/public/listing-images/${path}`;
}
