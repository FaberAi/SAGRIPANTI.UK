"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Splash d'ingresso: pioggia di codice nero (Matrix invertito) che si coagula
 * su sfondo bianco sporco e forma la scritta SAGRIPANTI in acciaio brunito
 * (font Orbitron, spigoloso). Tutto su canvas, ~5,5s, poi sfuma e rivela la
 * landing chiara. Una volta per sessione.
 */

interface Particle {
  sx: number; sy: number; // posizione di partenza
  tx: number; ty: number; // posizione finale (dentro la scritta)
  char: string;
  delay: number;
}

const BG = "#f5f4f1"; // bianco sporco — coerente con la vetrina

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネ0123456789ﾊﾋﾌﾍﾎ<>=/{}*+#$".split("");
const pick = () => CHARS[(Math.random() * CHARS.length) | 0];
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function IntroSplash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"play" | "fading" | "gone">("play");

  useEffect(() => {
    if (sessionStorage.getItem("saguk_splash") === "1") {
      setState("gone");
      return;
    }
    sessionStorage.setItem("saguk_splash", "1");

    let raf = 0;
    let cancelled = false;

    const run = async () => {
      // Carica Orbitron prima di campionare/disegnare, per coerenza con la home.
      try {
        await document.fonts.load("900 120px 'Orbitron'");
      } catch {
        /* in mancanza si ricade sul font di sistema */
      }
      if (cancelled) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = window.innerWidth;
      const H = window.innerHeight;
      // Su mobile lo splash è il punto critico per il jank. Alleggeriamo il
      // carico di rendering per-frame SENZA toccare la timeline (così resta
      // sincronizzato con l'ingresso della hero, INTRO in page.tsx): backing
      // store più piccolo, meno particelle, meno colonne di pioggia.
      const mobile = W < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      // Timeline (ms)
      const T_RAIN = reduce ? 150 : 1850;
      const T_FORM = reduce ? 350 : 1750;
      const T_STEEL = 850;
      const T_HOLD = 1150;
      const TOTAL = T_RAIN + T_FORM + T_STEEL + T_HOLD;
      const steelStart = T_RAIN + T_FORM;

      // --- pioggia Matrix ---
      const cell = mobile ? 22 : 16;
      const cols = Math.ceil(W / cell);
      const drops = Array.from({ length: cols }, () => Math.random() * -H);

      // --- campiona "SAGRIPANTI" in punti bersaglio ---
      const word = "SAGRIPANTI";
      const cx = W / 2;
      const cy = H / 2;
      let fs = Math.min(W * 0.115, 168);
      const fontOf = (s: number) => `900 ${s}px 'Orbitron','Arial Black',sans-serif`;
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const octx = off.getContext("2d", { willReadFrequently: true });
      const particles: Particle[] = [];
      if (octx) {
        octx.font = fontOf(fs);
        while (octx.measureText(word).width > W * 0.9 && fs > 22) {
          fs -= 4;
          octx.font = fontOf(fs);
        }
        octx.fillStyle = "#fff"; // solo per campionare l'alpha della maschera
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.fillText(word, cx, cy);
        const data = octx.getImageData(0, 0, W, H).data;
        const gap = mobile ? 11 : 9;
        for (let y = 0; y < H; y += gap) {
          for (let x = 0; x < W; x += gap) {
            if (data[(y * W + x) * 4 + 3] > 130) {
              particles.push({
                sx: Math.random() * W,
                sy: Math.random() * H,
                tx: x + (Math.random() - 0.5) * 2,
                ty: y + (Math.random() - 0.5) * 2,
                char: pick(),
                delay: Math.random() * 320,
              });
            }
          }
        }
      }

      const drawSteel = (alpha: number, shine: number) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = fontOf(fs);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // acciaio brunito: legge su bianco sporco, alternanza chiaro/scuro
        const g = ctx.createLinearGradient(0, cy - fs / 2, 0, cy + fs / 2);
        g.addColorStop(0.0, "#6b7178");
        g.addColorStop(0.22, "#2a2d31");
        g.addColorStop(0.42, "#585d63");
        g.addColorStop(0.56, "#16181b");
        g.addColorStop(0.72, "#4a4e54");
        g.addColorStop(1.0, "#1f2225");
        ctx.shadowColor = "rgba(35,30,20,0.32)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = g;
        ctx.fillText(word, cx, cy);
        ctx.shadowColor = "transparent";
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.strokeText(word, cx, cy);
        if (shine > 0 && shine < 1) {
          ctx.globalCompositeOperation = "source-atop";
          const bx = -W * 0.4 + shine * W * 1.8;
          const sg = ctx.createLinearGradient(bx, 0, bx + W * 0.34, 0);
          sg.addColorStop(0, "rgba(255,255,255,0)");
          sg.addColorStop(0.5, "rgba(255,255,255,0.85)");
          sg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = sg;
          ctx.fillRect(0, cy - fs, W, fs * 2);
        }
        ctx.restore();
      };

      const startedAt = performance.now();
      let lastFlip = 0;

      const frame = (now: number) => {
        const t = now - startedAt;

        if (t < steelStart) {
          // trail fade: velo di bianco sporco semi-trasparente
          ctx.fillStyle = "rgba(244,241,234,0.18)";
          ctx.fillRect(0, 0, W, H);
          const rainA = t < T_RAIN ? 1 : Math.max(0, 1 - (t - T_RAIN) / T_FORM);
          ctx.font = "16px 'JetBrains Mono',monospace";
          for (let i = 0; i < cols; i++) {
            const x = i * cell;
            const y = drops[i];
            // testa della goccia: quasi-nero netto
            ctx.fillStyle = `rgba(18,18,20,${0.92 * rainA})`;
            ctx.fillText(pick(), x, y);
            // scia: grigio medio che sfuma
            ctx.fillStyle = `rgba(70,72,78,${0.5 * rainA})`;
            ctx.fillText(pick(), x, y - cell);
            ctx.fillText(pick(), x, y - cell * 2);
            drops[i] = y > H + Math.random() * 240 ? Math.random() * -120 : y + cell;
          }
        } else {
          ctx.fillStyle = BG;
          ctx.fillRect(0, 0, W, H);
        }

        const flip = now - lastFlip > 70;
        if (flip) lastFlip = now;

        if (t >= T_RAIN && t < steelStart + T_STEEL) {
          const ft = t - T_RAIN;
          const steelA = t < steelStart ? 0 : clamp01((t - steelStart) / T_STEEL);
          ctx.font = "bold 13px 'JetBrains Mono',monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const local = clamp01((ft - p.delay) / (T_FORM * 0.72));
            const e = easeOut(local);
            const x = p.sx + (p.tx - p.sx) * e;
            const y = p.sy + (p.ty - p.sy) * e;
            if (flip && local < 1) p.char = pick();
            const set = local >= 1;
            const a = (set ? 1 : 0.45 + 0.55 * local) * (1 - steelA);
            // glifo a posto = nero pieno; ancora in volo = grigio scuro
            ctx.fillStyle = set ? `rgba(18,19,22,${a})` : `rgba(58,61,66,${a})`;
            ctx.fillText(p.char, x, y);
          }
        }

        if (t >= steelStart) {
          const st = t - steelStart;
          drawSteel(easeInOut(clamp01(st / T_STEEL)), st / (T_STEEL + 520));
          const subA = clamp01((st - T_STEEL) / 420);
          if (subA > 0) {
            ctx.save();
            ctx.globalAlpha = subA;
            ctx.font = "600 13px 'JetBrains Mono',monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#6f7378";
            ctx.fillText("I L   F U T U R O", cx, cy + fs * 0.62);
            ctx.restore();
          }
        }

        if (t < TOTAL && !cancelled) {
          raf = requestAnimationFrame(frame);
        } else if (!cancelled) {
          setState("fading");
          window.setTimeout(() => setState("gone"), 750);
        }
      };
      raf = requestAnimationFrame(frame);
    };

    run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (state === "gone") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: BG,
        opacity: state === "fading" ? 0 : 1,
        transition: "opacity 0.75s ease",
        pointerEvents: state === "fading" ? "none" : "auto",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
