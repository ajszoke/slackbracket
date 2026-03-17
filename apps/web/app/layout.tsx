import type { Metadata } from "next";
import { Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-hero",
  weight: ["700", "800", "900"]
});

const siteUrl = "https://slackbracket.com";

export const metadata: Metadata = {
  title: "Slackbracket — March Madness Bracket Builder",
  description:
    "Build your March Madness bracket with AI-powered ELO predictions. Dial the chaos from chalk to sicko mode and challenge your friends.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Slackbracket",
    description: "March Madness. Your way. AI-powered bracket builder with ELO predictions.",
    url: siteUrl,
    siteName: "Slackbracket",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Slackbracket — March Madness Bracket Builder" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slackbracket",
    description: "March Madness. Your way. AI-powered bracket builder with ELO predictions.",
    images: ["/api/og"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${orbitron.variable}`} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var d=document.documentElement;d.setAttribute('data-theme',localStorage.getItem('slackbracket:theme')||'light');d.setAttribute('data-quality',localStorage.getItem('slackbracket:quality')||'medium')}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
