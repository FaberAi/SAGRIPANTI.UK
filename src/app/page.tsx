"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  animate,
} from "framer-motion";
import IntroSplash from "@/components/IntroSplash";

/* ---------- helper: rivela al scroll con framer-motion ---------- */
function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.9,
        delay: delay / 1000,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ---------- helper: wrapper "magnetico" — segue il cursore ---------- */
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.4);
    y.set((e.clientY - r.top - r.height / 2) * 0.4);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, display: "inline-block" }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- helper: contatore che si anima quando entra in vista ---------- */
function CountUp({
  to,
  duration = 1.7,
}: {
  to: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return <span ref={ref}>{Math.round(val)}</span>;
}

/* ---------- nastro scorrevole dei marchi del Gruppo ---------- */
const MARQUEE = [
  "FaberAi",
  "Everylife",
  "Aqua e Sale",
  "PetPolitan",
  "PolizzaDoc",
  "Love Me",
  "KONTRO",
  "Trading Terminal",
];

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div
      className="saguk-marquee-mask"
      style={{
        overflow: "hidden",
        borderTop: `1px solid ${HAIR}`,
        borderBottom: `1px solid ${HAIR}`,
        padding: "20px 0",
      }}
    >
      <motion.div
        style={{ display: "flex", width: "max-content", whiteSpace: "nowrap" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 34, ease: "linear", repeat: Infinity }}
      >
        {items.map((t, i) => (
          <span
            key={i}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <span
              className="wordmark"
              style={{
                fontSize: 17,
                letterSpacing: "0.1em",
                color: INK,
                padding: "0 30px",
              }}
            >
              {t}
            </span>
            <span style={{ color: INK_FAINT, fontSize: 9 }}>◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- Componente Division Card: spotlight + tilt 3D ---------- */
function DivisionCard({ d, i }: { d: Division; i: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Tilt 3D: il puntatore inclina la card (range ±6°), con molla per
  // ammorbidire e ritorno fluido all'uscita.
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });

  function onMouseMove(e: React.MouseEvent) {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const px = e.clientX - left;
    const py = e.clientY - top;
    mouseX.set(px);
    mouseY.set(py);
    ry.set(((px / width) - 0.5) * 12); // sinistra/destra
    rx.set((0.5 - py / height) * 12); // su/giù
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <Reveal delay={i * 110} style={{ height: "100%", perspective: 900 }}>
      <motion.div
        className="div-card-light saguk-tilt"
        onMouseMove={onMouseMove}
        onMouseLeave={onLeave}
        style={{
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: BG,
          rotateX: rx,
          rotateY: ry,
        }}
      >
        {/* Spotlight Effect */}
        <motion.div
          style={{
            position: "absolute",
            inset: -1,
            zIndex: 0,
            background: useMotionTemplate`
              radial-gradient(
                350px circle at ${mouseX}px ${mouseY}px,
                rgba(27, 29, 33, 0.05),
                transparent 80%
              )
            `,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <span className="metal-ink wordmark" style={{ fontSize: 30 }}>
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
      </motion.div>
    </Reveal>
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

/* Numeri del Gruppo — animati allo scroll. */
const STATS: { n: number; label: string; suffix?: string }[] = [
  { n: 4, label: "Divisioni" },
  { n: 8, label: "Marchi" },
  { n: 3, label: "Testate editoriali" },
  { n: 2, label: "Caffè a Bracciano" },
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
const BG = "#f5f4f1";        // bianco sporco — neutro, non beige
const INK = "#1b1d21";       // testo primario, quasi-nero caldo
const INK_SOFT = "#565a61";  // testo secondario
const INK_FAINT = "#8b8f96"; // testo terziario / occhielli
const HAIR = "#e4dfd4";      // linee e bordi

/* palette terminale (dark) — coerente col Trading Terminal interno */
const TERM_BG = "#0a0e17";
const TERM_PANEL = "#0e1626";
const TERM_BORDER = "#1e2d40";
const CYAN = "#00d4ff";
const TGREEN = "#00ff88";
const TRED = "#ff4466";

/* Le animazioni one-shot della hero partono dopo l'IntroSplash (~5,6s):
   altrimenti SAGRIPANTI comparirebbe lettera-per-lettera dietro lo splash. */
const INTRO = 5.6;

/* ---------- sparkline "live" del terminale — deterministica (niente random,
   così non rompe l'idratazione SSR): un profilo che tende al rialzo, ripetuto
   due volte e fatto scorrere a sinistra per dare il senso del tempo reale. ---------- */
const SPARK_VALS = [
  34, 40, 36, 45, 41, 49, 46, 54, 50, 47, 55, 60, 56, 63, 59, 67, 71, 66, 73,
  69, 77, 74, 80, 85,
];
const SPARK_STEP = 26;
const SPARK_W = (SPARK_VALS.length - 1) * SPARK_STEP; // larghezza di un ciclo
const SPARK_H = 100;
function sparkPoints(vals: number[]) {
  return vals
    .map((v, i) => `${i * SPARK_STEP},${(SPARK_H - (v / 100) * SPARK_H).toFixed(1)}`)
    .join(" ");
}
const SPARK_LINE = sparkPoints(SPARK_VALS);
const SPARK_AREA = `0,${SPARK_H} ${SPARK_LINE} ${SPARK_W},${SPARK_H}`;

/* chip "ticker" del pannello — stilizzati, è un'anteprima del terminale */
const TICKERS: { sym: string; val: string; chg: string; up: boolean }[] = [
  { sym: "FABER", val: "128.40", chg: "+2.4%", up: true },
  { sym: "GRP·INDEX", val: "1 042", chg: "+1.1%", up: true },
  { sym: "VOL", val: "3.7M", chg: "-0.6%", up: false },
];

/* ---------- fondo "circuito" — sensazione tecnologica senza costo per-frame:
   pattern SVG statico di tracce e nodi, molto tenue, con un respiro lento di
   sola opacità (cheap) e una maschera radiale che lo dissolve ai bordi. ---------- */
function CircuitBg() {
  return (
    <div
      aria-hidden
      className="saguk-circuit"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        WebkitMaskImage:
          "radial-gradient(125% 85% at 50% 36%, #000 30%, transparent 76%)",
        maskImage:
          "radial-gradient(125% 85% at 50% 36%, #000 30%, transparent 76%)",
      }}
    >
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <pattern
            id="saguk-circuit-tile"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke="#1b1d21" strokeWidth="1.1">
              <path d="M0 34 H44 V82 H104 V22 H160" />
              <path d="M24 160 V112 H80 V64 H134 V0" />
              <path d="M0 124 H34 V160" />
              <path d="M160 102 H116 V146" />
              <path d="M44 34 V0" />
              <path d="M80 64 H80 M104 22 V0" />
            </g>
            <g fill="#1b1d21">
              <circle cx="44" cy="82" r="3" />
              <circle cx="104" cy="22" r="3" />
              <circle cx="80" cy="64" r="3" />
              <circle cx="134" cy="64" r="3" />
              <circle cx="34" cy="124" r="3" />
              <circle cx="116" cy="102" r="3" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#saguk-circuit-tile)" />
      </svg>
    </div>
  );
}

/* ---------- Banda "I numeri del Gruppo" — contatori animati ---------- */
function StatsBand() {
  return (
    <section style={{ padding: "0 24px", maxWidth: 1140, margin: "70px auto 0" }}>
      <Reveal>
        <div className="saguk-stats">
          {STATS.map((s) => (
            <div key={s.label} className="saguk-stat">
              <div
                className="metal-ink wordmark"
                style={{ fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1 }}
              >
                <CountUp to={s.n} />
                {s.suffix ?? ""}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: INK_FAINT,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Sezione "Trading Terminal" — pannello dark, colpo a effetto ---------- */
function TerminalTeaser() {
  return (
    <section style={{ padding: "30px 24px 110px", maxWidth: 1140, margin: "0 auto" }}>
      <Reveal>
        <motion.div
          className="saguk-term-panel"
          whileHover={{ scale: 1.004 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          style={{
            background: TERM_BG,
            border: `1px solid ${TERM_BORDER}`,
            borderRadius: 16,
            padding: "44px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* alone cyan in alto a destra */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -120,
              right: -80,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,212,255,0.16), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div className="saguk-term-grid" style={{ position: "relative", zIndex: 1 }}>
            {/* colonna testo */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  color: CYAN,
                  marginBottom: 22,
                  fontWeight: 600,
                }}
              >
                <span className="saguk-live-dot" />
                ACCESSO RISERVATO · LIVE
              </div>
              <h2
                className="wordmark"
                style={{
                  fontSize: "clamp(28px, 4.4vw, 46px)",
                  color: "#e8eef6",
                  margin: 0,
                  letterSpacing: "0.02em",
                  lineHeight: 1.05,
                }}
              >
                TRADING TERMINAL
              </h2>
              <p
                style={{
                  color: "#8aa0bd",
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginTop: 20,
                  maxWidth: 420,
                }}
              >
                Il motore che gira sotto al Gruppo: dati di mercato in tempo
                reale, grafici, backtest e bot operativi. Costruito su misura,
                riservato a chi ha le chiavi.
              </p>
              <Magnetic>
                <Link
                  href="/login"
                  className="saguk-term-cta"
                  style={{
                    display: "inline-block",
                    marginTop: 30,
                    background: CYAN,
                    color: TERM_BG,
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    padding: "14px 28px",
                    borderRadius: 4,
                    textDecoration: "none",
                  }}
                >
                  ENTRA NEL TERMINALE →
                </Link>
              </Magnetic>
            </div>

            {/* colonna grafico "live" */}
            <div
              style={{
                background: TERM_PANEL,
                border: `1px solid ${TERM_BORDER}`,
                borderRadius: 10,
                padding: 16,
              }}
            >
              {/* intestazione finestra */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: TRED }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#f5b14c" }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: TGREEN }} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "#5b6b8a",
                  }}
                >
                  SAGRIPANTI · TERMINAL
                </span>
              </div>

              {/* grafico area che scorre */}
              <div style={{ overflow: "hidden", borderRadius: 6 }}>
                <motion.div
                  style={{ display: "flex", width: "200%" }}
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 9, ease: "linear", repeat: Infinity }}
                >
                  {[0, 1].map((k) => (
                    <svg
                      key={k}
                      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                      preserveAspectRatio="none"
                      style={{ width: "50%", height: 150, display: "block" }}
                    >
                      <defs>
                        <linearGradient id={`spark-fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CYAN} stopOpacity="0.32" />
                          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={SPARK_AREA} fill={`url(#spark-fill-${k})`} />
                      <polyline
                        points={SPARK_LINE}
                        fill="none"
                        stroke={CYAN}
                        strokeWidth="1.6"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  ))}
                </motion.div>
              </div>

              {/* riga ticker */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 14,
                  flexWrap: "wrap",
                }}
              >
                {TICKERS.map((t) => (
                  <div
                    key={t.sym}
                    style={{
                      flex: "1 1 0",
                      minWidth: 92,
                      background: TERM_BG,
                      border: `1px solid ${TERM_BORDER}`,
                      borderRadius: 6,
                      padding: "9px 11px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        color: "#5b6b8a",
                        marginBottom: 4,
                      }}
                    >
                      {t.sym}
                    </div>
                    <div style={{ fontSize: 14, color: "#e8eef6", fontWeight: 700 }}>
                      {t.val}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.up ? TGREEN : TRED,
                        marginTop: 2,
                      }}
                    >
                      {t.chg}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Reveal>
    </section>
  );
}

/* ---------- pagina ---------- */
export default function LandingPage() {
  const [photoOk, setPhotoOk] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Avanzamento scroll dell'intera pagina → barra in cima.
  const { scrollYProgress } = useScroll();
  const barScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallasse della hero: il contenuto deriva verso l'alto e sfuma.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 130]);
  const heroOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);

  // Spotlight della hero che segue il cursore (desktop; su mobile resta fermo
  // fuori campo, nessun costo). Mole morbida via spring.
  const spotX = useMotionValue(-600);
  const spotY = useMotionValue(-600);
  const ssx = useSpring(spotX, { stiffness: 140, damping: 22 });
  const ssy = useSpring(spotY, { stiffness: 140, damping: 22 });
  const heroSpotlight = useMotionTemplate`radial-gradient(420px circle at ${ssx}px ${ssy}px, rgba(120,140,170,0.22), transparent 70%)`;

  function onHeroMove(e: React.MouseEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    spotX.set(e.clientX - r.left);
    spotY.set(e.clientY - r.top);
  }

  // La linea della timeline si "disegna" mentre scorri la sezione.
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: lineProgress } = useScroll({
    target: timelineRef,
    offset: ["start 75%", "end 55%"],
  });
  const lineScale = useSpring(lineProgress, { stiffness: 120, damping: 30 });

  // Navbar: passa allo stato compatto dopo i primi 50px di scroll.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="grain-overlay" />
      <IntroSplash />

      {/* barra di avanzamento scroll */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: INK,
          transformOrigin: "0% 50%",
          scaleX: barScale,
          zIndex: 101,
        }}
      />

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
            padding: scrolled ? "12px 28px" : "20px 28px",
            background: scrolled ? "rgba(244,241,234,0.85)" : "transparent",
            backdropFilter: scrolled ? "blur(12px)" : "none",
            borderBottom: scrolled ? `1px solid ${HAIR}` : "1px solid transparent",
            transition: "all 0.4s cubic-bezier(0.2, 0.7, 0.2, 1)",
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
              color: scrolled ? INK : INK_SOFT,
              textDecoration: "none",
              border: `1px solid ${scrolled ? INK : "#cdc8bb"}`,
              padding: "8px 16px",
              borderRadius: 3,
              transition: "all 0.3s ease",
            }}
          >
            ACCEDI AL TERMINALE →
          </Link>
        </header>

        {/* HERO */}
        <section
          ref={heroRef}
          onMouseMove={onHeroMove}
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
          <CircuitBg />

          {/* spotlight che segue il cursore */}
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              background: heroSpotlight,
            }}
          />

          {/* macchie di luce che derivano lente dietro il titolo */}
          <div
            className="saguk-blob"
            style={{
              width: 520,
              height: 520,
              top: "-12%",
              left: "-6%",
              background: "rgba(150,162,184,0.30)",
              animation: "saguk-drift 24s ease-in-out infinite",
            }}
          />
          <div
            className="saguk-blob"
            style={{
              width: 460,
              height: 460,
              bottom: "-10%",
              right: "-4%",
              background: "rgba(200,184,150,0.34)",
              animation: "saguk-drift 30s ease-in-out infinite reverse",
            }}
          />

          <motion.div
            style={{
              y: heroY,
              opacity: heroOpacity,
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: INTRO + 0.1 }}
              style={{
                fontSize: 12,
                letterSpacing: "0.5em",
                color: INK_FAINT,
                marginBottom: 26,
              }}
            >
              G R U P P O &nbsp;·&nbsp; EST. 2026
            </motion.div>
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                justifyContent: "center",
              }}
            >
            {/* La parola INTERA "SAGRIPANTI" entra dal centro dello schermo
               (scale dal centro + fade), non più lettera-per-lettera. Lo scale
               sta sul contenitore <h1>; il gradiente acciaio sta sullo span
               interno SENZA transform, così background-clip:text non si rompe su
               Chrome/Firefox (un elemento con clip + transform viene promosso a
               layer GPU e perde la maschera). Più leggero del reveal a 10 lettere. */}
            <motion.h1
              className="wordmark"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.0, delay: INTRO + 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: "clamp(32px, 8vw, 122px)",
                letterSpacing: "0.01em",
                lineHeight: 1,
                margin: 0,
                maxWidth: "100%",
                display: "inline-block",
                willChange: "transform, opacity",
              }}
            >
              <span className="metal-ink" style={{ display: "inline-block" }}>
                SAGRIPANTI
              </span>
            </motion.h1>

            {/* riflesso a specchio sotto la scritta — assoluto, non altera il
                layout; il transform sta sul wrapper e il gradiente sullo span
                interno (niente clip+transform insieme, così resta visibile su
                Chrome/Firefox). La maschera lo dissolve allontanandosi. */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: INTRO + 1.25 }}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 3,
                textAlign: "center",
                lineHeight: 1,
                transform: "scaleY(-1)",
                pointerEvents: "none",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 52%, rgba(0,0,0,0.5) 100%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 52%, rgba(0,0,0,0.5) 100%)",
              }}
            >
              <span
                className="metal-ink wordmark"
                style={{
                  display: "inline-block",
                  fontSize: "clamp(32px, 8vw, 122px)",
                  letterSpacing: "0.01em",
                }}
              >
                SAGRIPANTI
              </span>
            </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: INTRO + 1.5 }}
              style={{
                marginTop: 58,
                fontSize: "clamp(15px, 2.2vw, 22px)",
                color: "#3c3f44",
                fontWeight: 500,
              }}
            >
              Un gruppo. Molte direzioni.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: INTRO + 1.65 }}
              style={{
                marginTop: 10,
                fontSize: 13,
                letterSpacing: "0.06em",
                color: INK_FAINT,
                maxWidth: 540,
              }}
            >
              Tecnologia, editoria, ospitalità e servizi — costruiti con un solo
              principio: fare le cose come si deve.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: INTRO + 1.8 }}
              style={{
                marginTop: 40,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Magnetic>
                <a
                  href="#divisioni"
                  style={{
                    display: "inline-block",
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
              </Magnetic>
              <Magnetic>
                <Link
                  href="/login"
                  style={{
                    display: "inline-block",
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
              </Magnetic>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 9, 0] }}
            transition={{
              opacity: { duration: 1, delay: INTRO + 2.2 },
              y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              position: "absolute",
              bottom: 28,
              fontSize: 20,
              color: "#bdbfc3",
              zIndex: 1,
            }}
          >
            ↓
          </motion.div>
        </section>

        {/* NASTRO MARCHI */}
        <Marquee />

        {/* NUMERI DEL GRUPPO */}
        <StatsBand />

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
              <DivisionCard key={d.name} d={d} i={i} />
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
              <motion.div
                className="founder-photo"
                whileHover={{ scale: 1.02, rotateX: 5, rotateY: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  position: "relative",
                  aspectRatio: "4 / 5",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: `1px solid ${HAIR}`,
                  background: "linear-gradient(160deg,#ebeae6,#f5f4f1)",
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
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
                      pointerEvents: "none",
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
              </motion.div>
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
          <div style={{ maxWidth: 760, marginTop: 64, position: "relative" }}>
            <Reveal>
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
            </Reveal>

            <div ref={timelineRef} style={{ position: "relative" }}>
              {/* Binario grigio della timeline */}
              <div
                style={{
                  position: "absolute",
                  left: 100,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: HAIR,
                }}
              />
              {/* Linea che si "disegna" mentre scorri */}
              <motion.div
                style={{
                  position: "absolute",
                  left: 100,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: "linear-gradient(180deg,#3c3f44,#8b8f96)",
                  transformOrigin: "top",
                  scaleY: lineScale,
                }}
              />

              {TAPPE.map((t, i) => (
                <Reveal key={t.anno} delay={i * 80}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "96px 1fr",
                      marginBottom: i === TAPPE.length - 1 ? 0 : 34,
                    }}
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
                        paddingLeft: 26,
                        position: "relative",
                      }}
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        style={{
                          position: "absolute",
                          left: -5,
                          top: 4,
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: "linear-gradient(180deg,#3c3f44,#8b8f96)",
                          zIndex: 2,
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
                </Reveal>
              ))}
            </div>
          </div>

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

        {/* TRADING TERMINAL — colpo a effetto */}
        <TerminalTeaser />

        {/* FOOTER */}
        <footer
          style={{
            borderTop: `1px solid ${HAIR}`,
            padding: "80px 24px",
            maxWidth: 1140,
            margin: "0 auto",
          }}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            marginBottom: 60,
          }}>
            <div>
              <div className="metal-ink wordmark" style={{ fontSize: 16, letterSpacing: "0.06em", marginBottom: 20 }}>
                SAGRIPANTI
              </div>
              <p style={{ color: INK_SOFT, fontSize: 13, lineHeight: 1.6, maxWidth: 240 }}>
                Tecnologia, editoria e ospitalità sotto un solo tetto. Imprese diverse, un solo modo di lavorare: fare le cose come si deve.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: INK, marginBottom: 20 }}>DIVISIONI</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DIVISIONS.map(d => (
                  <a key={d.name} href="#divisioni" style={{ fontSize: 13, color: INK_SOFT, textDecoration: "none" }}>{d.name}</a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: INK, marginBottom: 20 }}>MARCHI</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href="https://faberai.it" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: INK_SOFT, textDecoration: "none" }}>FaberAi →</a>
                <a href="https://polizzadoc.it" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: INK_SOFT, textDecoration: "none" }}>PolizzaDoc →</a>
                <Link href="/login" style={{ fontSize: 13, color: INK_SOFT, textDecoration: "none" }}>Trading Terminal →</Link>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: `1px solid ${HAIR}`,
            paddingTop: 30,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}>
            <div style={{ color: INK_FAINT, fontSize: 11 }}>
              {/* TODO Fabrizio: inserire la P.IVA reale al posto del placeholder rimosso. */}
              Trade Consulting Italia S.r.l.s. · © {new Date().getFullYear()} Gruppo Sagripanti
            </div>
            {/* TODO Fabrizio: dammi gli URL reali di LinkedIn/Instagram e li ricollego qui. */}
            <div style={{ display: "flex", gap: 24 }}>
              <a href="https://faberai.it" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: INK_SOFT, textDecoration: "none", fontWeight: 600 }}>FABERAI.IT</a>
              <a href="https://polizzadoc.it" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: INK_SOFT, textDecoration: "none", fontWeight: 600 }}>POLIZZADOC.IT</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
