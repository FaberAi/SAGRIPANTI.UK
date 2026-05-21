import NavBar from "@/components/NavBar";

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
