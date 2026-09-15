import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import GithubHorna from "@/components/GithubHorna";
import TeknikModal from "@/components/TeknikModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Adressen som relativa og:image-länkar räknas ut från. Utan den skriver Next
 * ut localhost i bygget, och då hittar ingen crawler bilden.
 * Vercel sätter variablerna åt oss; lokalt faller vi tillbaka på dev-servern.
 */
const platsUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(platsUrl),
  title: "Vindkraftskalkyl ver3",
  description:
    "Vercel-native vindkraftskalkyl (Next.js App Router). Fem perspektiv, samma formler som ver2.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav
            className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm font-medium"
            aria-label="Huvudmeny"
          >
            <Link className="text-teal-900 hover:underline" href="/">
              Hem
            </Link>
            <Link className="text-teal-900 hover:underline" href="/kalkyl">
              Kalkyl
            </Link>
            <Link className="text-teal-900 hover:underline" href="/om">
              Om
            </Link>
          </nav>
        </header>
        <div className="flex-1 pb-24">{children}</div>
        <GithubHorna />
        <TeknikModal />
      </body>
    </html>
  );
}
