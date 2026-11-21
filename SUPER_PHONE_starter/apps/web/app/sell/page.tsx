import { redirect } from "next/navigation";

export default function SellRoute() {
  redirect("/account/listings/new");
}
