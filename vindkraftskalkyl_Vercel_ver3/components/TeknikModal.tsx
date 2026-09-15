"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Flytande teknik-knapp nere till höger + modal.
 * 'use client' behövs för öppna/stäng – layouten i övrigt är en Server Component.
 *
 * Här skedde en uppdatering mot ver2: modalen förklarar de fyra lagren
 * (Pages, rosy, ver2, ver3) i stället för att visa HTML-kalkylens originalprompt.
 */
export default function TeknikModal() {
  const [oppen, setOppen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rubrikId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (oppen) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [oppen]);

  return (
    <>
      <button
        id="teknik-knapp"
        type="button"
        className="fixed right-4 bottom-4 z-50 rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-700"
        aria-haspopup="dialog"
        aria-controls="teknik-modal"
        title="Visa hur den här appen skiljer sig från Pages, rosy och ver2"
        onClick={() => setOppen(true)}
      >
        ⚙ Teknik
      </button>

      <dialog
        ref={dialogRef}
        id="teknik-modal"
        className="fixed inset-0 m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[85vh] rounded-xl border border-slate-200 p-0 shadow-xl backdrop:bg-slate-900/50"
        aria-labelledby={rubrikId}
        onClose={() => setOppen(false)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 id={rubrikId} className="text-lg font-semibold text-slate-900">
            Fyra adresser, inte samma binär
          </h2>
          <button
            type="button"
            className="rounded px-2 text-2xl leading-none text-slate-500 hover:bg-slate-100"
            aria-label="Stäng"
            onClick={() => setOppen(false)}
          >
            ×
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-700">
          <p>
            Du tittar på <strong>ver3</strong>: en Next.js-app (App Router) som
            bara lever på Vercel. Det är inte HTML-filerna på GitHub Pages, och
            inte heller ver2:s HTML plus två Functions.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Programversion (GitHub Pages):{" "}
              <a
                className="text-teal-800 underline"
                href="https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                vindkraftskalkyl.html
              </a>
            </li>
            <li>
              Statisk Vercel-tvilling:{" "}
              <a
                className="text-teal-800 underline"
                href="https://vindkraft-rosy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                vindkraft-rosy.vercel.app
              </a>
            </li>
            <li>
              Vercel ver2 (HTML + Functions):{" "}
              <a
                className="text-teal-800 underline"
                href="https://vindkraft-ver2.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                vindkraft-ver2.vercel.app
              </a>
            </li>
            <li>
              Vercel ver3 (den här appen):{" "}
              <a
                className="text-teal-800 underline"
                href="https://vindkraft-ver3.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                vindkraft-ver3.vercel.app
              </a>{" "}
              — projektet <code>vindkraft-ver3</code> i teamet Effektiv.
            </li>
          </ul>
          <p>
            Samma kalkylidé (fem perspektiv, gula fält, LCOE/NPV/IRR). Formlerna
            portas från ver2. Månads- och årsmedel för spot räknas i servern
            som enkelt medel av ENTSO-E A44 — inte tidsvägt i v1.
          </p>
          <p>
            Mer på 15-åringssvenska:{" "}
            <a
              className="text-teal-800 underline"
              href="https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver3/Vercel-teknik-ver3.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel-teknik-ver3.md
            </a>
            .
          </p>
        </div>
      </dialog>
    </>
  );
}
