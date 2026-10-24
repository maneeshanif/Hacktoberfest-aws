import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Outfit, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "700", "800"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "600"] });
const nastaliq = Noto_Nastaliq_Urdu({ variable: "--font-nastaliq", subsets: ["arabic"], weight: ["400", "700"] });
const naskh = Noto_Naskh_Arabic({ variable: "--font-naskh", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "حفاظت · Hifazat",
  description: "مشکوک پیغام؟ پہلے یہاں چیک کریں۔ A private AI scam shield, powered by Gemma 4.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ur"
      dir="rtl"
      className={`${syne.variable} ${outfit.variable} ${plexMono.variable} ${nastaliq.variable} ${naskh.variable} antialiased`}
    >
      <body className="min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
