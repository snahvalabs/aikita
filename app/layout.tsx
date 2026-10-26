import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIKITA — Asisten Pengetahuan Frayas Academy",
  description: "Ruang pengetahuan dan asisten dokumen internal Frayas Academy. Berjalan sepenuhnya lokal.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
