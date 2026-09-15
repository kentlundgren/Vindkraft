import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Om – Vindkraftskalkyl ver3",
};

/**
 * Server Component: statisk text, inget 'use client'.
 */
export default function OmPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Om kalkylen</h1>
      <p className="mt-4 leading-relaxed text-slate-700">
        ver3 är samma ekonomiska modell som HTML-kalkylen och ver2: fem
        perspektiv, LCOE, payback, NPV och IRR. Skalet är Next.js (App Router)
        på Vercel. GitHub Pages hostar inte den här binären.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Antaganden i v1</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Inga nya formler. Port från ver2:s <code>berakningar.js</code>.</li>
        <li>Gula fält för allt som ska knappas in. Defaults samma som ver2.</li>
        <li>
          Hämtat månads-/årsmedel (ENTSO-E A44) är information, inte ett tyst
          25-årselpris.
        </li>
        <li>
          Närboende (NU20) är schablon tills förordningen spikar kurvan. 2,5 ‰
          är lagens tak.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Skillnad mot Pages och ver2</h2>
      <p className="mt-3 leading-relaxed text-slate-700">
        Pages = tre filer i webbläsaren. rosy = samma filer på Vercel. ver2 =
        samma kalkyl plus <code>/api/elpris</code> och <code>/api/scenario</code>
        . ver3 = riktiga URL:er (<code>/</code>, <code>/kalkyl</code>,{" "}
        <code>/om</code>), Route Handlers och OG-kort. Öppna teknik-knappen nere
        till höger för de fyra adresserna.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Källor</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
        <li>
          <a
            className="text-teal-800 underline"
            href="https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver3/PRD_vindkraftskalkyl_vercel_ver3.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            PRD v1.14
          </a>{" "}
          och{" "}
          <Link className="text-teal-800 underline" href="/">
            hem
          </Link>
          .
        </li>
        <li>
          <a
            className="text-teal-800 underline"
            href="https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver3/SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            SPEC.md
          </a>
        </li>
        <li>
          ENTSO-E Transparency Platform, Day-ahead prices (A44); Riksbanken
          SEKEURPMI för EUR/MWh → kr/kWh.
        </li>
        <li>
          Regeringen (2026) prop. 2025/26:239; Sveriges riksdag (2026)
          betänkande 2025/26:NU20.
        </li>
      </ul>
    </main>
  );
}
