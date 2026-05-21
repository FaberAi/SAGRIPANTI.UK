import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gruppo Sagripanti",
  description:
    "Gruppo Sagripanti — tecnologia, editoria, ospitalità e servizi. La casa di FaberAi, Love Me, delle testate e di PolizzaDoc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
