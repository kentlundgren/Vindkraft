import Link from "next/link";

const ADRESSER = [
  {
    namn: "Programversion (GitHub Pages)",
    href: "https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html",
  },
  {
    namn: "Statisk Vercel-tvilling",
    href: "https://vindkraft-rosy.vercel.app",
  },
  {
    namn: "Vercel ver2 (HTML + Functions)",
    href: "https://vindkraft-ver2.vercel.app",
  },
];

/** Startsida: ingång, inte själva kalkylen. */
export default function Hem() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
        Vercel ver3
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Vindkraftskalkyl
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700">
        En ny app-yta för samma fem perspektiv. Formlerna kommer från ver2.
        Den här sidan är bara dörren in — kalkylen ligger under{" "}
        <Link className="font-medium text-teal-800 underline" href="/kalkyl">
          /kalkyl
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/kalkyl"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-700"
        >
          <h2 className="font-semibold">Öppna kalkylen</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gula fält och nyckeltal byggs i nästa avsnitt. Länken finns redan.
          </p>
        </Link>
        <Link
          href="/om"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-700"
        >
          <h2 className="font-semibold">Om kalkylen</h2>
          <p className="mt-2 text-sm text-slate-600">
            Antaganden, källor och skillnaden mot Pages och ver2.
          </p>
        </Link>
      </div>

      <section className="mt-10" aria-labelledby="andra-lager">
        <h2 id="andra-lager" className="text-lg font-semibold">
          De tre äldre lagren
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {ADRESSER.map((a) => (
            <li key={a.href}>
              <a
                className="text-teal-800 underline"
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.namn}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
