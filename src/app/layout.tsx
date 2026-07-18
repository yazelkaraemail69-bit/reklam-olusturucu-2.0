import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
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
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080b11] text-slate-100">{children}</body>
    </html>
  );
}