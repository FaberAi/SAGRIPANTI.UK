import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

/* Sistema tipografico editoriale:
   — Inter: sans neutro e professionale per corpo, UI, label.
   — Fraunces: serif display ad alto contrasto per i momenti editoriali
     (titoli, manifesto, bio del fondatore). Dà gravitas e lega all'anima
     editoriale del Gruppo. Orbitron resta SOLO per il logotipo SAGRIPANTI. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sagripanti.uk"),
  title: {
    default: "Gruppo Sagripanti — Un gruppo. Molte direzioni.",
    template: "%s · Gruppo Sagripanti",
  },
  description:
    "Gruppo Sagripanti — tecnologia, editoria, ospitalità e servizi. La casa di FaberAi, Love Me, delle testate e di PolizzaDoc.",
  applicationName: "Gruppo Sagripanti",
  keywords: [
    "Gruppo Sagripanti",
    "Fabrizio Sagripanti",
    "FaberAi",
    "PolizzaDoc",
    "Love Me",
    "Everylife",
    "tecnologia",
    "editoria",
    "ospitalità",
    "Bracciano",
  ],
  authors: [{ name: "Fabrizio Sagripanti" }],
  creator: "Fabrizio Sagripanti",
  publisher: "Trade Consulting Italia S.r.l.s.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://sagripanti.uk",
    siteName: "Gruppo Sagripanti",
    title: "Gruppo Sagripanti — Un gruppo. Molte direzioni.",
    description:
      "Tecnologia, editoria, ospitalità e servizi sotto un solo tetto. Un solo modo di lavorare: fare le cose come si deve.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gruppo Sagripanti — Un gruppo. Molte direzioni.",
    description:
      "Tecnologia, editoria, ospitalità e servizi sotto un solo tetto.",
  },
  appleWebApp: {
    capable: true,
    title: "Sagripanti",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef3f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
