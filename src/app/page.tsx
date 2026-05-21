"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import IntroSplash from "@/components/IntroSplash";

/* ---------- helper: rivela al scroll ---------- */
function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="reveal" style={{ animationDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ---------- dati ---------- */
interface Division {
  n: string;
  name: string;
  cat: string;
  desc: string;
  href?: string;
  link?: string;
  sub?: { t: string; u: string }[];
}

const DIVISIONS: Division[] = [
  {
    n: "01",
    name: "FaberAi",
    cat: "Tecnologia & Intelligenza Artificiale",
    desc: "Software e automazione che lavorano al posto delle imprese. La divisione tech del Gruppo.",
    href: "https://faberai.it",
    link: "faberai.it",
  },
  {
    n: "02",
    name: "Editoria",
    cat: "Tre testate digitali",
    desc: "Magazine che raccontano città, territorio e cultura, ognuno con la sua voce.",
    sub: [
      { t: "Everylife", u: "https://everylifemagazine.it" },
      { t: "Aqua e Sale", u: "https://aquaesalemagazine.it" },
      { t: "PetPolitan", u: "https://petpolitan.it" },
    ],
  },
  {
    n: "03",
    name: "PolizzaDoc",
    cat: "Insurtech",
    desc: "Il comparatore che rende le assicurazioni finalmente semplici da capire e scegliere.",
    href: "https://polizzadoc.it",
    link: "polizzadoc.it",
  },
  {
    n: "04",
    name: "Love Me",
    cat: "Ospitalità",
    desc: "Due caffè nel cuore di Bracciano. L'accoglienza fatta come si deve.",
  },
];

const PROFILO: { k: string; v: string }[] = [
  {
    k: "Ruolo",
    v: "Fondatore e presidente del Gruppo Sagripanti. Imprenditore: progetto e porto sul mercato prodotti digitali e attività reali.",
  },
  {
    k: "Le imprese",
    v: "FaberAi (tecnologia), tre testate editoriali, PolizzaDoc (insurtech) e Love Me (ospitalità).",
  },
  {
    k: "Come lavoro",
    v: "Strategia di prodotto, direzione tecnica ed esperienza d'uso — dall'idea iniziale al prodotto online, con l'intelligenza artificiale come leva operativa.",
  },
  {
    k: "Società",
    v: "Trade Consulting Italia S.r.l.s. — titolare e fornitrice dei prodotti del Gruppo.",
  },
];

/* ---------- pagina ---------- */
export default function LandingPage() {
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <>
      <IntroSplash />

      <div style={{ background: "#070b12", color: "#e2e8f0", overflowX: "hidden" }}>
        {/* top bar */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 28px",
            background: "linear-gradient(180deg,rgba(7,11,18,0.92),rgba(7,11,18,0))",
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontWeight: 700, letterSpacing: "0.22em", fontSize: 13 }}>
            SAGRIPANTI
          </span>
          <Link
            href="/login"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              fontWeight: 600,
              color: "#9aa6b4",
              textDecoration: "none",
              border: "1px solid #243349",
              padding: "8px 16px",
              borderRadius: 3,
            }}
          >
            ACCEDI AL TERMINALE →
          </Link>
        </header>

        {/* HERO */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.5em",
              color: "#5b6b7a",
              marginBottom: 26,
              animation: "saguk-rise 1s ease 0.2s both",
            }}
          >
            G R U P P O &nbsp;·&nbsp; EST. 2026
          </div>
          <h1
            className="metal-text"
            style={{
              fontSize: "clamp(52px, 13vw, 170px)",
              fontWeight: 900,
              letterSpacing: "0.02em",
              lineHeight: 0.95,
              margin: 0,
              animation: "saguk-rise 1.1s cubic-bezier(0.2,0.7,0.2,1) 0.35s both",
            }}
          >
            SAGRIPANTI
          </h1>
          <p
            style={{
              marginTop: 30,
              fontSize: "clamp(15px, 2.2vw, 22px)",
              color: "#aeb9c6",
              fontWeight: 500,
              animation: "saguk-rise 1s ease 0.6s both",
            }}
          >
            Un gruppo. Molte direzioni.
          </p>
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              letterSpacing: "0.06em",
              color: "#5b6b7a",
              maxWidth: 540,
              animation: "saguk-rise 1s ease 0.75s both",
            }}
          >
            Tecnologia, editoria, ospitalità e servizi — costruiti con un solo
            principio: fare le cose come si deve.
          </p>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "center",
              animation: "saguk-rise 1s ease 0.9s both",
            }}
          >
            <a
              href="#divisioni"
              style={{
                background: "linear-gradient(180deg,#e9edf0,#9aa2a8)",
                color: "#0a0e17",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.1em",
                padding: "13px 26px",
                borderRadius: 3,
                textDecoration: "none",
              }}
            >
              SCOPRI IL GRUPPO
            </a>
            <Link
              href="/login"
              style={{
                border: "1px solid #2c3e54",
                color: "#aeb9c6",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.1em",
                padding: "13px 26px",
                borderRadius: 3,
                textDecoration: "none",
              }}
            >
              TRADING TERMINAL
            </Link>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 28,
              fontSize: 20,
              color: "#33485f",
              animation: "saguk-rise 1s ease 1.2s both",
            }}
          >
            ↓
          </div>
        </section>

        {/* MANIFESTO */}
        <section style={{ padding: "100px 24px", maxWidth: 880, margin: "0 auto" }}>
          <Reveal>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                color: "#5b6b7a",
                marginBottom: 28,
              }}
            >
              IL GRUPPO
            </div>
            <p
              style={{
                fontSize: "clamp(20px, 3vw, 32px)",
                lineHeight: 1.5,
                fontWeight: 500,
                color: "#cdd6e0",
              }}
            >
              Il Gruppo Sagripanti riunisce imprese che costruiscono, pubblicano e
              accolgono. Realtà diverse — software, magazine, caffè, servizi
              assicurativi — tenute insieme da{" "}
              <span className="metal-text" style={{ fontWeight: 800 }}>
                un solo modo di lavorare
              </span>
              : cura, ambizione, e zero scorciatoie.
            </p>
          </Reveal>
        </section>

        {/* DIVISIONI */}
        <section
          id="divisioni"
          style={{ padding: "40px 24px 110px", maxWidth: 1140, margin: "0 auto" }}
        >
          <Reveal>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 16,
                marginBottom: 44,
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(26px, 4vw, 44px)",
                  fontWeight: 800,
                  margin: 0,
                  color: "#e8edf2",
                }}
              >
                Le divisioni
              </h2>
              <span style={{ color: "#5b6b7a", fontSize: 13 }}>
                — quattro anime, una sola visione
              </span>
            </div>
          </Reveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {DIVISIONS.map((d, i) => (
              <Reveal key={d.name} delay={i * 110}>
                <div className="div-card" style={{ height: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <span
                      className="metal-text"
                      style={{ fontSize: 30, fontWeight: 900 }}
                    >
                      {d.n}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        color: "#5b6b7a",
                        textAlign: "right",
                        maxWidth: 150,
                      }}
                    >
                      {d.cat.toUpperCase()}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#f0f4f8",
                      marginBottom: 10,
                    }}
                  >
                    {d.name}
                  </div>
                  <p style={{ color: "#8b97a6", fontSize: 13, lineHeight: 1.6 }}>
                    {d.desc}
                  </p>
                  {d.href && (
                    <a
                      href={d.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="saguk-link"
                      style={{
                        display: "inline-block",
                        marginTop: 16,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {d.link} →
                    </a>
                  )}
                  {d.sub && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px 14px",
                        marginTop: 16,
                      }}
                    >
                      {d.sub.map((s) => (
                        <a
                          key={s.t}
                          href={s.u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="saguk-link"
                          style={{ fontSize: 12, fontWeight: 600 }}
                        >
                          {s.t} →
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FONDATORE */}
        <section
          style={{
            padding: "20px 24px 110px",
            maxWidth: 1040,
            margin: "0 auto",
          }}
        >
          <Reveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px, 360px) 1fr",
                gap: 48,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "4 / 5",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #1e2d40",
                  background:
                    "linear-gradient(160deg,#10192a,#0a111c)",
                }}
              >
                {photoOk ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/fabrizio.jpg"
                    alt="Fabrizio Sagripanti"
                    onError={() => setPhotoOk(false)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "grayscale(1) contrast(1.05)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#33485f",
                      fontSize: 11,
                      letterSpacing: "0.16em",
                      textAlign: "center",
                      padding: 20,
                    }}
                  >
                    FOTO
                    <br />
                    public/fabrizio.jpg
                  </div>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    color: "#5b6b7a",
                    marginBottom: 18,
                  }}
                >
                  IL FONDATORE
                </div>
                <h2
                  style={{
                    fontSize: "clamp(26px, 3.6vw, 40px)",
                    fontWeight: 800,
                    margin: 0,
                    color: "#eef2f6",
                  }}
                >
                  Fabrizio Sagripanti
                </h2>
                <div
                  style={{
                    color: "#00d4ff",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    marginTop: 8,
                    fontWeight: 600,
                  }}
                >
                  IMPRENDITORE · FONDATORE & PRESIDENTE
                </div>
                <p
                  style={{
                    color: "#9aa6b4",
                    fontSize: 16,
                    lineHeight: 1.75,
                    marginTop: 22,
                  }}
                >
                  Ho sempre pensato che un&apos;idea valga poco finché non
                  diventa qualcosa che una persona può aprire, usare, pagare.
                  Tutto il resto è una conversazione.
                </p>
              </div>
            </div>
          </Reveal>

          {/* il racconto */}
          <Reveal>
            <div
              style={{
                maxWidth: 740,
                marginTop: 60,
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <p style={{ color: "#9aa6b4", fontSize: 16, lineHeight: 1.8 }}>
                Per anni, tra l&apos;idea e il prodotto c&apos;era di mezzo
                un&apos;azienda intera: un team, un budget, tempi lunghi. Quella
                distanza fermava la maggior parte delle idee. Poi si è
                accorciata: con gli strumenti giusti — e sapendo <em>cosa</em>{" "}
                costruire e <em>perché</em> — oggi una sola persona può portare
                un prodotto dall&apos;idea al mercato. Non un prototipo: un
                prodotto vivo, con clienti veri.
              </p>
              <p style={{ color: "#9aa6b4", fontSize: 16, lineHeight: 1.8 }}>
                Da qui è nato il Gruppo Sagripanti: non un singolo progetto, ma
                una casa per imprese diverse — la tecnologia di FaberAi, le
                testate editoriali, l&apos;insurtech di PolizzaDoc, i caffè Love
                Me a Bracciano. Il mio mestiere non è scrivere codice riga per
                riga: è decidere cosa costruire, come dev&apos;essere fatto
                dentro e come si vende — e usare l&apos;intelligenza artificiale
                come leva per realizzarlo. Da solo, mando avanti un portafoglio
                di prodotti che fino a pochi anni fa avrebbe richiesto una
                squadra.
              </p>
              <p style={{ color: "#9aa6b4", fontSize: 16, lineHeight: 1.8 }}>
                Love Me, in particolare, è il mio banco di prova: un&apos;attività
                vera, fatta di persone, di cassa e di fornitori, dove ogni giorno
                metto alla prova il software che vendo agli altri. Un principio
                tiene insieme tutto quanto:{" "}
                <span className="metal-text" style={{ fontWeight: 700 }}>
                  se non è sensibilmente migliore di quello che si otterrebbe con
                  poco sforzo, non è pronto.
                </span>
              </p>
            </div>
          </Reveal>

          {/* la scheda */}
          <Reveal>
            <div
              style={{
                marginTop: 60,
                borderTop: "1px solid #16202f",
                paddingTop: 44,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: "#5b6b7a",
                  marginBottom: 30,
                }}
              >
                IN SINTESI
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "30px 44px",
                }}
              >
                {PROFILO.map((r) => (
                  <div key={r.k}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        color: "#00d4ff",
                        fontWeight: 700,
                        marginBottom: 9,
                      }}
                    >
                      {r.k.toUpperCase()}
                    </div>
                    <div
                      style={{
                        color: "#cdd6e0",
                        fontSize: 14,
                        lineHeight: 1.65,
                      }}
                    >
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            borderTop: "1px solid #16202f",
            padding: "48px 24px",
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: 1140,
            margin: "0 auto",
          }}
        >
          <div>
            <div
              className="metal-text"
              style={{ fontWeight: 900, fontSize: 18, letterSpacing: "0.08em" }}
            >
              GRUPPO SAGRIPANTI
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
              Trade Consulting Italia S.r.l.s. · © {new Date().getFullYear()}
            </div>
          </div>
          <Link
            href="/login"
            className="saguk-link"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            Accedi al Trading Terminal →
          </Link>
        </footer>
      </div>
    </>
  );
}
