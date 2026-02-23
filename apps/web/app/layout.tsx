import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slackbracket",
  description: "Have-it-your-way March Madness bracket builder"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
