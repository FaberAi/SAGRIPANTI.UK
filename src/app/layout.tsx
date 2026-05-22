import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

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
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
