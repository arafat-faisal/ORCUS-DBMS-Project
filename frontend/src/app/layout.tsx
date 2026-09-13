import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale";

export const metadata: Metadata = {
  title: "ORCUS — Investigation Management & Case Tracking System",
  description: "Academic DBMS Prototype for Investigation Management in Bangladesh — Fictional Demonstration Data Only",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

