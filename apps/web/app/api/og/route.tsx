import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          background: "linear-gradient(135deg, #050a18 0%, #0d1529 50%, #1a1040 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orb glow - user side */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60%",
            height: "80%",
            background: "radial-gradient(ellipse, rgba(0,240,255,0.15) 0%, transparent 70%)",
          }}
        />
        {/* Orb glow - AI side */}
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "60%",
            height: "80%",
            background: "radial-gradient(ellipse, rgba(124,77,255,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            background: "linear-gradient(135deg, #00f0ff, #7c4dff)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
          }}
        >
          SLACKBRACKET
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.04em",
          }}
        >
          March Madness. Your way.
        </div>

        {/* Year badge */}
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 16,
          }}
        >
          2026 NCAA Tournament
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
