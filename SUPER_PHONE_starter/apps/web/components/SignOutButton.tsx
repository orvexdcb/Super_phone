"use client";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="link-btn"
      onClick={async () => {
        await createBrowserSupabase().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      خروج
    </button>
  );
}
