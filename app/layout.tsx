import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flip Stories | A quiet place for good stories",
  description: "Read, write, and share the stories that stay with you.",
  other: {
    "barrion-site-verification": "barrion-site-verification=86fc478b7099cb1660b521be690d4798"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}