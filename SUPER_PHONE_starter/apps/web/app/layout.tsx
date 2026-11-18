import type { Metadata } from "next";
import "./globals.css";
import "./superphone-theme.css";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "SUPER PHONE",
  description: "SUPER PHONE — سوق الهواتف والأجهزة الذكية للبيع والشراء والاستبدال في العراق.",
  applicationName: "SUPER PHONE",
  appleWebApp: { capable: true, title: "SUPER PHONE", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
