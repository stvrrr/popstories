import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flip Stories | A quiet place for good stories",
  description: "Read, write, and share the stories that stay with you."
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