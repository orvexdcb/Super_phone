import type { Metadata } from "next";
import "./globals.css";
import "./superphone-theme.css";
import Header from "../components/Header";
import PWARegister from "../components/PWARegister";

export const metadata: Metadata = {
  title: "SUPER PHONE",
  description: "SUPER PHONE — سوق الهواتف والأجهزة الذكية للبيع والشراء والاستبدال في العراق.",
  applicationName: "SUPER PHONE",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b1728",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "SUPER PHONE", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Header />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
