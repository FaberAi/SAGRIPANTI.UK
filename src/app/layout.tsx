import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "SAGRIPANTI.UK — Trading Terminal",
  description: "Terminale di trading professionale — Gruppo Sagripanti",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <NavBar />
        <main style={{ padding: "16px", maxWidth: "1800px", margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
