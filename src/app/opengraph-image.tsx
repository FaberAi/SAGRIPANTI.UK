import { ImageResponse } from "next/og";

/* Card di condivisione (Open Graph / Twitter) generata on-demand.
   Coerente con la vetrina: fondo celeste acciaio, logotipo netto, filetto
   editoriale. Satori non supporta il gradiente sul testo → acciaio pieno. */
export const alt = "Gruppo Sagripanti — tecnologia, editoria, ospitalità e servizi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #f4f8fb 0%, #dbe6f0 100%)",
          position: "relative",
        }}
      >
        {/* filetto editoriale inset */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "1px solid #c4d2e0",
            borderRadius: 10,
          }}
        />

        {/* occhiello */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 34,
          }}
        >
          <div style={{ width: 40, height: 1, background: "#8499a6" }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 10,
              color: "#7a90a0",
              fontWeight: 600,
            }}
          >
            GRUPPO · EST. 2026
          </div>
          <div style={{ width: 40, height: 1, background: "#8499a6" }} />
        </div>

        {/* logotipo */}
        <div
          style={{
            fontSize: 142,
            fontWeight: 900,
            letterSpacing: 6,
            color: "#243240",
            lineHeight: 1,
          }}
        >
          SAGRIPANTI
        </div>

        {/* tagline */}
        <div
          style={{
            marginTop: 36,
            fontSize: 34,
            color: "#4f6473",
            fontStyle: "italic",
          }}
        >
          Un gruppo. Molte direzioni.
        </div>

        {/* riga inferiore */}
        <div
          style={{
            position: "absolute",
            bottom: 70,
            fontSize: 20,
            letterSpacing: 4,
            color: "#8499a6",
            fontWeight: 600,
          }}
        >
          sagripanti.uk
        </div>
      </div>
    ),
    { ...size }
  );
}
