import type { Metadata } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dierenasiel Ninove VZW - Geef een dier een tweede kans",
    template: "%s | Dierenasiel Ninove",
  },
  description:
    "Dierenasiel Ninove VZW vangt honden, katten en andere dieren op en helpt hen een nieuw thuis te vinden. Adopteer een dier en verander een leven.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "nl_BE",
    siteName: "Dierenasiel Ninove VZW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl-BE" className={`${nunito.variable} ${playfair.variable}`}>
      <body className="font-body antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
