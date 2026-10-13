import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Citrina Fit · Criadoras",
  description: "Central das criadoras de conteúdo da Citrina Fit",
  icons: { icon: "/selo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
