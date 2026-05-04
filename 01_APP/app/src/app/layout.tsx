import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video → Obsidian",
  description: "Selecciona frames y genera markdown para Obsidian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
