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
  title: "Gruppo Sagripanti",
  description:
    "Gruppo Sagripanti — tecnologia, editoria, ospitalità e servizi. La casa di FaberAi, Love Me, delle testate e di PolizzaDoc.",
  applicationName: "Gruppo Sagripanti",
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
