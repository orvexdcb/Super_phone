import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchRoute({ searchParams }: { searchParams: SearchParams }) {
  const values = await searchParams;
  const params = new URLSearchParams();
  (["q", "category", "condition", "governorate", "min", "max", "page"] as const).forEach((key) => {
    const value = values[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  });
  const query = params.toString();
  redirect(query ? "/?" + query + "#search" : "/#search");
}
