import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "SUPER PHONE",
  description: "سوق الأجهزة الإلكترونية",
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
