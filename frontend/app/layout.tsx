/*
 * DESIGN CONTRACT
 * THESIS: the page is a guard's ledger. A forest-green field, a stud-grid shield that works (sweeps violet while Gemma reads,
 *   then lands a lime check), and ruled evidence. It refuses the blue SaaS hero with same-size icon cards.
 * OWN-WORLD: ink / chalk / forest, lime for the one action, violet for live, verdict colours only on verdicts. Syne + Outfit
 *   + IBM Plex Mono, Noto Nastaliq/Naskh for Urdu. Flat colour, ruled lines, 16px radii, pill controls.
 * STORY: an anxious elder or their child sees the message checked in seconds and knows the one thing to do.
 * FIRST VIEWPORT: full-bleed forest hero, giant headline left with a lime action, phone showing a flagged example over the
 *   large stud shield on the right.
 * FORM: PRD section 9 (Conclave AI system), pinned by the brief.
 */
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Outfit, Syne } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import { DICTIONARIES } from "@/lib/dictionaries";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "700", "800"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plex = IBM_Plex_Mono({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"] });
const nastaliq = Noto_Nastaliq_Urdu({ variable: "--font-nastaliq", subsets: ["arabic"], weight: ["400", "700"] });
const naskh = Noto_Naskh_Arabic({ variable: "--font-naskh", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: DICTIONARIES.en.meta.title,
  description: DICTIONARIES.en.meta.description,
  applicationName: "Hifazat",
  appleWebApp: { capable: true, title: "Hifazat", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#14302a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${syne.variable} ${outfit.variable} ${plex.variable} ${nastaliq.variable} ${naskh.variable} antialiased`}
    >
      <body className="min-h-screen overflow-x-hidden">
        <I18nProvider>{children}</I18nProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
