import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./superphone-theme.css";
import Header from "../components/Header";
import PWARegister from "../components/PWARegister";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "SUPER PHONE",
  description: "SUPER PHONE — سوق الهواتف والأجهزة الذكية للبيع والشراء والاستبدال في العراق.",
  applicationName: "SUPER PHONE",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "SUPER PHONE", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#c8102e", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("sp_lang")?.value || "ar") as "ar" | "en" | "ku";
  return (
    <html lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <body>
        <Header />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
