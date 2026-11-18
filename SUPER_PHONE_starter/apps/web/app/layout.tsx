import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./superphone-theme.css";
import Header from "../components/Header";
import PWARegister from "../components/PWARegister";

export const metadata: Metadata = {
  title: "SUPER PHONE",
  description: "SUPER PHONE — سوق الهواتف والأجهزة الذكية للبيع والشراء والاستبدال في العراق.",
  applicationName: "SUPER PHONE",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "SUPER PHONE", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0b1728", colorScheme: "dark" };

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
