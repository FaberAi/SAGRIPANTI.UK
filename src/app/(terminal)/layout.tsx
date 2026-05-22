import type { Viewport } from "next";
import NavBar from "@/components/NavBar";

// Il terminale resta dark anche se la vetrina è passata al bianco sporco:
// override del themeColor (la status bar PWA segue la sezione).
export const viewport: Viewport = {
  themeColor: "#0a0e17",
};

// Layout del terminale di trading: barra di navigazione + contenitore.
// La landing pubblica usa il root layout, senza NavBar.
export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main style={{ padding: "16px", maxWidth: "1800px", margin: "0 auto" }}>
        {children}
      </main>
    </>
  );
}
