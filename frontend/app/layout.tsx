import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Loja — Vitrine e gestão",
    template: "%s — Loja",
  },
  description: "Vitrine pública e painel de gestão para pequenas lojas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      {/* min-h-dvh: viewport estável (melhor que 100vh em mobile); páginas herdam altura mínima coerente */}
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
