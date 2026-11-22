"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type TabIconProps = { name: "account" | "store" | "guide" | "home"; active: boolean };

function TabIcon({ name, active }: TabIconProps) {
  const color = active ? "#C8102E" : "#454545";
  const common = { fill: "none", stroke: color, strokeWidth: 2.15, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "account") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...common}>
      <circle cx="32" cy="21" r="11" />
      <path d="M12 53c2-12 9-19 20-19s18 7 20 19" />
      <circle cx="32" cy="32" r="29" strokeWidth="1.8" />
    </svg>;
  }
  if (name === "store") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...common}>
      <path d="M23 22v-5c0-7 4-11 9-11s9 4 9 11v5" />
      <rect x="10" y="20" width="44" height="38" rx="8" />
      <path d="M10 29h44" opacity=".45" />
    </svg>;
  }
  if (name === "guide") {
    return <svg viewBox="0 0 64 64" aria-hidden="true" {...common}>
      <ellipse cx="32" cy="32" rx="29" ry="13" transform="rotate(45 32 32)" />
      <ellipse cx="32" cy="32" rx="29" ry="13" transform="rotate(-45 32 32)" />
    </svg>;
  }
  return <svg viewBox="0 0 64 64" aria-hidden="true" {...common}>
    <path d="M5 29 32 7l27 22" />
    <path d="M12 26v31h40V26" />
    <path d="M25 57V37h14v20" />
  </svg>;
}

const items = [
  { key: "account", label: "حسابي", en: "Account", ku: "هەژمار", href: "/account" },
  { key: "store", label: "المتجر", en: "Store", ku: "فرۆشگا", href: "/#sp-category-section" },
  { key: "guide", label: "إرشاد", en: "Guide", ku: "ڕێنمایی", href: "/buying-guide" },
  { key: "home", label: "البداية", en: "Home", ku: "سەرەکی", href: "/" },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [pathname]);

  const activeKey = pathname.startsWith("/account") || pathname === "/login" || pathname === "/signup"
    ? "account"
    : pathname.startsWith("/buying-guide") || pathname.startsWith("/guide")
      ? "guide"
      : pathname === "/" && hash === "#sp-category-section"
        ? "store"
        : "home";

  return (
    <nav className="sp-bottom-nav" aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const active = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`sp-bottom-nav-item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="sp-bottom-nav-icon">
              <TabIcon name={item.key} active={active} />
              {item.key === "store" && <span className="sp-bottom-nav-new">جديد</span>}
            </span>
            <span className="sp-bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
