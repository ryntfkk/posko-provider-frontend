import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Gunakan import ini
import "./globals.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Konfigurasi Font dari Google (Otomatis Download)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Posko - Jasa Terdekat",
  description: "Aplikasi penyedia jasa profesional terdekat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning={true}
      >
        <LanguageSwitcher />
        {children}
      </body>
    </html>
  );
}