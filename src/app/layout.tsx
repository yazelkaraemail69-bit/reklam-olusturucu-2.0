import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reklam Oluşturucu - AI Destekli Reklam Görseli ve Metin Üretici",
  description:
    "Yapay zeka ile profesyonel reklam görselleri ve Instagram reklam metinleri oluşturun. Ürün bilgilerinizi girin, AI sizin için reklam içeriğiniz hazırlasın.",
  keywords: [
    "reklam oluşturucu",
    "AI reklam",
    "instagram reklam metni",
    "reklam görseli",
    "yapay zeka reklam",
  ],
  openGraph: {
    title: "Reklam Oluşturucu - AI Destekli Reklam Görseli ve Metin Üretici",
    description:
      "Yapay zeka ile profesyonel reklam görselleri ve Instagram reklam metinleri oluşturun.",
    type: "website",
    locale: "tr_TR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}