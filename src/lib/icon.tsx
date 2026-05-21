import { ImageResponse } from "next/og";

// Icona dell'app: wordmark "S" su fondo scuro coerente col sito.
// Lo sfondo riempie tutto il quadrato → valida anche come icona maskable.
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(155deg, #1a2740 0%, #070b12 72%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: size * 0.6,
            fontWeight: 900,
            color: "#eef2f6",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          S
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
