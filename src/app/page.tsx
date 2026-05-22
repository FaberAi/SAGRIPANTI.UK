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

const TAPPE: { anno: string; titolo: string; testo: string }[] = [
  {
    anno: "1966",
    titolo: "Le origini, a Roma",
    testo:
      "Nasce il 29 novembre a Roma, in una famiglia che lavora nella grande distribuzione.",
  },
  {
    anno: "1984",
    titolo: "GSA Ipermercato",
    testo:
      "I genitori aprono a Le Rughe, a Formello, il primo ipermercato della provincia di Roma. Seguiranno i punti vendita di Colle Prenestino, Eur-Laurentino, Spinaceto, Palombara e Bracciano.",
  },
  {
    anno: "Anni '90",
    titolo: "Tra l'azienda di famiglia e i progetti propri",
    testo:
      "Dopo gli studi entra nelle attività di famiglia e, in parallelo, avvia i primi progetti personali: consulenza aziendale, assicurazioni, finanziamenti, gestionali d'impresa.",
  },
  {
    anno: "2010",
    titolo: "Da Caffè Residence a Love Me",
    testo:
      "Rileva per concessione famigliare il Caffè Residence di Bracciano. Lo ristruttura e ne fa un marchio: nasce Love Me. Qualche anno dopo apre il secondo locale, Love Me Cafè del Corso.",
  },
  {
    anno: "Oggi",
    titolo: "Il Gruppo Sagripanti",
    testo:
      "Dagli incontri e dall'esperienza nascono nuove direzioni — editoria, organizzazione d'impresa, tecnologia. Oggi convivono sotto un'unica casa: il Gruppo Sagripanti.",
  },
];

/* ---------- palette vetrina — bianco sporco ---------- */
const BG = "#f4f1ea";        // avorio caldo
const INK = "#1b1d21";       // testo primario, quasi-nero caldo
const INK_SOFT = "#565a61";  // testo secondario
const INK_FAINT = "#8b8f96"; // testo terziario / occhielli
const HAIR = "#e4dfd4";      // linee e bordi

/* ---------- pagina ---------- */
export default function LandingPage() {
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <>
      <IntroSplash />

      <div style={{ background: BG, color: INK, overflowX: "hidden" }}>
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
            background: "linear-gradient(180deg,rgba(244,241,234,0.94),rgba(244,241,234,0))",
            backdropFilter: "blur(4px)",
          }}
        >
          <span className="wordmark" style={{ letterSpacing: "0.14em", fontSize: 13, color: INK }}>
            SAGRIPANTI
          </span>
          <Link
            href="/login"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              fontWeight: 600,
              color: INK_SOFT,
              textDecoration: "none",
              border: "1px solid #cdc8bb",
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
              color: INK_FAINT,
              marginBottom: 26,
              animation: "saguk-rise 1s ease 0.2s both",
            }}
          >
            G R U P P O &nbsp;·&nbsp; EST. 2026
          </div>
          <h1
            className="metal-ink wordmark"
            style={{
              fontSize: "clamp(32px, 8vw, 122px)",
              letterSpacing: "0.01em",
              lineHeight: 1,
              margin: 0,
              maxWidth: "100%",
              animation: "saguk-rise 1.1s cubic-bezier(0.2,0.7,0.2,1) 0.35s both",
            }}
          >
            SAGRIPANTI
          </h1>
          <p
            style={{
              marginTop: 30,
              fontSize: "clamp(15px, 2.2vw, 22px)",
              color: "#3c3f44",
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
              color: INK_FAINT,
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
                background: INK,
                color: BG,
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
                border: "1px solid #cdc8bb",
                color: INK_SOFT,
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
              color: "#bdbfc3",
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
                color: INK_FAINT,
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
                color: "#3c3f44",
              }}
            >
              Il Gruppo Sagripanti riunisce imprese che costruiscono, pubblicano e
              accolgono. Realtà diverse — software, magazine, caffè, servizi
              assicurativi — tenute insieme da{" "}
              <span className="metal-ink" style={{ fontWeight: 800 }}>
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
                  color: INK,
                }}
              >
                Le divisioni
              </h2>
              <span style={{ color: INK_FAINT, fontSize: 13 }}>
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
                <div className="div-card-light" style={{ height: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <span
                      className="metal-ink wordmark"
                      style={{ fontSize: 30 }}
                    >
                      {d.n}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        color: INK_FAINT,
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
                      color: INK,
                      marginBottom: 10,
                    }}
                  >
                    {d.name}
                  </div>
                  <p style={{ color: INK_SOFT, fontSize: 13, lineHeight: 1.6 }}>
                    {d.desc}
                  </p>
                  {d.href && (
                    <a
                      href={d.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="saguk-link-ink"
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
                          className="saguk-link-ink"
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
            <div className="founder-grid">
              <div
                className="founder-photo"
                style={{
                  position: "relative",
                  aspectRatio: "4 / 5",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: `1px solid ${HAIR}`,
                  background:
                    "linear-gradient(160deg,#ece8df,#f4f1ea)",
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
                      color: "#b0aa9c",
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
                    color: INK_FAINT,
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
                    color: INK,
                  }}
                >
                  Fabrizio Sagripanti
                </h2>
                <div
                  style={{
                    color: INK_SOFT,
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    marginTop: 8,
                    fontWeight: 600,
                  }}
                >
                  FONDATORE DEL GRUPPO · PRODUCT BUILDER
                </div>
                <p
                  style={{
                    color: INK_SOFT,
                    fontSize: 16,
                    lineHeight: 1.75,
                    marginTop: 22,
                  }}
                >
                  Progetto idee di business e le porto fino al prodotto online,
                  dominio incluso: software gestionali e piattaforme editoriali
                  con pagamenti, multi-utente e infrastruttura cloud. Non
                  prototipi — prodotti veri, con clienti veri.
                </p>
              </div>
            </div>
          </Reveal>

          {/* il percorso — timeline */}
          <Reveal>
            <div style={{ maxWidth: 760, marginTop: 64 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: INK_FAINT,
                  marginBottom: 32,
                }}
              >
                IL PERCORSO
              </div>
              {TAPPE.map((t, i) => (
                <div
                  key={t.anno}
                  style={{ display: "grid", gridTemplateColumns: "96px 1fr" }}
                >
                  <div
                    className="wordmark"
                    style={{
                      fontSize: 13,
                      color: INK_FAINT,
                      paddingTop: 1,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {t.anno}
                  </div>
                  <div
                    style={{
                      borderLeft: `1px solid ${HAIR}`,
                      paddingLeft: 26,
                      paddingBottom: i === TAPPE.length - 1 ? 0 : 34,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -5,
                        top: 4,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "linear-gradient(180deg,#3c3f44,#8b8f96)",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: INK,
                        marginBottom: 7,
                      }}
                    >
                      {t.titolo}
                    </div>
                    <div
                      style={{ color: INK_SOFT, fontSize: 14, lineHeight: 1.65 }}
                    >
                      {t.testo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* il metodo */}
          <Reveal>
            <div
              style={{
                maxWidth: 760,
                marginTop: 56,
                borderTop: `1px solid ${HAIR}`,
                paddingTop: 44,
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: INK_FAINT,
                }}
              >
                IL METODO
              </div>
              <p style={{ color: INK_SOFT, fontSize: 16, lineHeight: 1.8 }}>
                Il mio mestiere non è scrivere il codice riga per riga: è
                decidere <em>cosa</em> costruire e <em>perché</em>, dirigere
                l&apos;architettura e il prodotto, riconoscere quando una
                soluzione è sbagliata. Lo sviluppo lo realizzo con
                l&apos;intelligenza artificiale come leva — come un direttore di
                produzione non monta personalmente la pellicola.
              </p>
              <p style={{ color: INK_SOFT, fontSize: 16, lineHeight: 1.8 }}>
                È una scelta di metodo, non una scorciatoia: oggi permette a una
                sola persona di mandare avanti un portfolio di prodotti veri —
                da KONTRO, gestionale SaaS con pagamenti e multi-utente, alle
                testate editoriali — che fino a pochi anni fa avrebbe richiesto
                una squadra intera. Un principio tiene insieme tutto quanto:{" "}
                <span className="metal-ink" style={{ fontWeight: 700 }}>
                  se non è sensibilmente migliore di quello che si otterrebbe
                  con poco sforzo, non è pronto.
                </span>
              </p>
              <p style={{ color: INK_FAINT, fontSize: 13, marginTop: 4 }}>
                Sposato con Maria Teresa, padre di Alessia e Giulia.
              </p>
            </div>
          </Reveal>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            borderTop: `1px solid ${HAIR}`,
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
              className="metal-ink wordmark"
              style={{ fontSize: 14, letterSpacing: "0.06em" }}
            >
              GRUPPO SAGRIPANTI
            </div>
            <div style={{ color: INK_FAINT, fontSize: 11, marginTop: 6 }}>
              Trade Consulting Italia S.r.l.s. · © {new Date().getFullYear()}
            </div>
          </div>
          <Link
            href="/login"
            className="saguk-link-ink"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            Accedi al Trading Terminal →
          </Link>
        </footer>
      </div>
    </>
  );
}
