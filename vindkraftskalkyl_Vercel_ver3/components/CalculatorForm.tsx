'use client';

/**
 * CalculatorForm – gula indatafält + nyckeltal + jämförelsetabell.
 *
 * 'use client' behövs: fälten har state och räknar om medan man skriver.
 * Ingen formel bor här. All matte ligger i lib/calculations.ts (port av ver2).
 *
 * Här skedde en uppdatering (perspektiv-URL:erna, SPEC steg 5): samma
 * komponent används på /kalkyl och på de fem /kalkyl/<perspektiv>-sidorna.
 * Propen `perspektiv` styr bara vad som lyfts fram överst — inte beräkningen.
 * Ver2:s flikar är alltså ersatta av riktiga adresser man kan länka till.
 */

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULTS, ELOMRADE_PRIS } from '@/lib/defaults';
import { beraknaAllt, lasIndata, fmt, type Resultat } from '@/lib/calculations';
import type { FaltId } from '@/lib/falt';
import type { ElprisSvar } from '@/lib/elpris';
import { useKalkyl } from '@/components/KalkylProvider';

/* ---------------------------------------------------------------------------
   Perspektiven – en lista som både sidorna och formuläret läser.
   --------------------------------------------------------------------------- */

export type PerspektivId =
  | 'investerare'
  | 'markagare'
  | 'kommun'
  | 'andelsagare'
  | 'narboende';

export const PERSPEKTIV: {
  id: PerspektivId;
  rubrik: string;
  kort: string;
  ingress: string;
}[] = [
  {
    id: 'investerare',
    rubrik: 'Investerare',
    kort: 'Investerare',
    ingress:
      'Basen är Kent Lundgrens ursprungliga kalkyl, kompletterad med LCOE, payback, NPV och IRR.',
  },
  {
    id: 'markagare',
    rubrik: 'Markägare',
    kort: 'Markägare',
    ingress:
      'Arrendet räknas antingen som andel av bruttointäkten eller som ett fast belopp per MW och år.',
  },
  {
    id: 'kommun',
    rubrik: 'Kommun och samhälle',
    kort: 'Kommun',
    ingress:
      'Lokala intäkter (arrende, kommunal ersättning, närboendeersättning) plus värderad klimatnytta.',
  },
  {
    id: 'andelsagare',
    rubrik: 'Andelsägare',
    kort: 'Andelsägare',
    ingress:
      'Den kooperativa modellen: insats per andel mot självkostnad jämfört med hushållselens marknadspris.',
  },
  {
    id: 'narboende',
    rubrik: 'Närboende (NU20)',
    kort: 'Närboende',
    ingress:
      'Vindkraftsersättning enligt NU20 / prop. 2025/26:239 – avståndszoner, distansfaktor och taket på 2,5 ‰.',
  },
];

/* ---------------------------------------------------------------------------
   Fältdefinitioner – samma etiketter, enheter och steg som ver2:s index.html.
   --------------------------------------------------------------------------- */

type FaltDef = {
  id: FaltId;
  etikett: string;
  step?: string;
  alternativ?: { varde: string; text: string }[];
  hint?: string;
  markering?: string;
};

const GRUPPER: { rubrik: string; falt: FaltDef[] }[] = [
  {
    rubrik: 'Anläggning & investering',
    falt: [
      { id: 'elpris', etikett: 'Intäkt för elen (kr/kWh)', step: '0.01' },
      {
        id: 'elomrade',
        etikett: 'Elområde',
        alternativ: [
          { varde: 'SE1', text: 'SE1 (norra)' },
          { varde: 'SE2', text: 'SE2' },
          { varde: 'SE3', text: 'SE3 (mellersta)' },
          { varde: 'SE4', text: 'SE4 (södra)' },
        ],
        hint: 'Byte fyller i ett schablonpris för området (kan ändras).',
      },
      {
        id: 'elprisforandring',
        etikett: 'Elprisbana – årlig förändring (%/år)',
        step: '0.1',
        hint: '0 = platt elprisbana.',
      },
      { id: 'kapfaktor', etikett: 'Kapacitetsfaktor (0–1)', step: '0.01' },
      { id: 'livslangd', etikett: 'Livslängd (år)', step: '1' },
      { id: 'effekt', etikett: 'Effekt per verk (MW)', step: '0.1' },
      { id: 'antalverk', etikett: 'Antal verk', step: '1' },
      {
        id: 'verkshojd',
        etikett: 'Verkshöjd (m)',
        step: '1',
        hint: 'Styr närboendes avståndszoner (5 och 9 verkshöjder).',
      },
      {
        id: 'degradering',
        etikett: 'Degradering (%/år)',
        step: '0.1',
        hint: 'Minskad produktion per år. 0 = ingen degradering.',
      },
      {
        id: 'specinv',
        etikett: 'Specifik investeringskostnad (kkr/MW)',
        step: '10',
      },
      { id: 'kalkylranta', etikett: 'Kalkylränta (0–1)', step: '0.0001' },
    ],
  },
  {
    rubrik: 'Drift & livscykel',
    falt: [
      { id: 'rorlig', etikett: 'Rörlig driftskostnad (kr/kWh)', step: '0.01' },
      { id: 'fast', etikett: 'Fast driftskostnad (kr/MW/år)', step: '100' },
      {
        id: 'nedmontering',
        etikett: 'Nedmonteringskostnad (kkr/MW)',
        step: '10',
        markering: 'antagande',
      },
      {
        id: 'restvarde',
        etikett: 'Restvärde (kkr/MW)',
        step: '10',
        markering: 'antagande',
      },
    ],
  },
  {
    rubrik: 'Markägare (arrende)',
    falt: [
      {
        id: 'arrendemodell',
        etikett: 'Arrendemodell',
        alternativ: [
          { varde: 'procent', text: '% av bruttointäkt' },
          { varde: 'krmw', text: 'kr/MW/år' },
        ],
      },
      {
        id: 'arrendeprocent',
        etikett: 'Arrende (% av bruttointäkt)',
        step: '0.1',
        markering: 'antagande',
      },
      {
        id: 'arrendekrmw',
        etikett: 'Arrende (kr/MW/år)',
        step: '1000',
        markering: 'antagande',
      },
    ],
  },
  {
    rubrik: 'Kommun & samhälle',
    falt: [
      {
        id: 'kommunersattning',
        etikett: 'Kommunal ersättning (kr/MW/år)',
        step: '1000',
        markering: 'schablon',
      },
      {
        id: 'co2faktor',
        etikett: 'CO₂-faktor, undviken (kg/kWh)',
        step: '0.01',
        markering: 'antagande',
      },
      {
        id: 'co2varde',
        etikett: 'Värdering av CO₂ (kr/kg)',
        step: '0.1',
        markering: 'antagande',
      },
    ],
  },
  {
    rubrik: 'Andelsägare (kooperativ)',
    falt: [
      { id: 'antalandelar', etikett: 'Antal andelar', step: '1' },
      {
        id: 'kwhperandel',
        etikett: 'Elmängd per andel (kWh/år)',
        step: '100',
        markering: 'antagande',
      },
      {
        id: 'insatsperandel',
        etikett: 'Insats per andel (kr)',
        step: '100',
        markering: 'antagande',
      },
      {
        id: 'driftpaslag',
        etikett: 'Föreningens driftpåslag (öre/kWh)',
        step: '0.5',
        markering: 'antagande',
      },
      {
        id: 'spotpris',
        etikett: 'Spotpris hushållsel (kr/kWh)',
        step: '0.01',
        hint: 'Kan senare fyllas från /api/elpris. Aldrig automatiskt.',
      },
      {
        id: 'elhandelspaslag',
        etikett: 'Elhandelspåslag (kr/kWh)',
        step: '0.01',
        markering: 'antagande',
      },
      {
        id: 'energiskatt',
        etikett: 'Energiskatt (kr/kWh, exkl. moms)',
        step: '0.001',
        markering: 'antagande',
      },
      { id: 'momssats', etikett: 'Moms (%)', step: '1' },
    ],
  },
  {
    rubrik: 'Närboende (vindkraftsersättning, NU20)',
    falt: [
      { id: 'avstand', etikett: 'Avstånd till närmaste verk (m)', step: '10' },
      { id: 'verkinom5', etikett: 'Antal verk inom fem verkshöjder', step: '1' },
      {
        id: 'antalbostader',
        etikett: 'Antal ersättningsberättigade bostäder',
        step: '1',
        markering: 'antagande',
      },
      {
        id: 'maxpromille',
        etikett: 'Maximal andel av intäkter (‰)',
        step: '0.1',
        markering: 'lagstadgat tak',
      },
    ],
  },
];

/* Nyckeltal i jämförelsetabellen – samma rader och decimaler som ver2. */
const JAMFOR_NYCKELTAL: {
  etikett: string;
  hamta: (r: Resultat) => number;
  dec: number;
}[] = [
  { etikett: 'Produktion (MWh/år)', hamta: (r) => r.produktionMWh_ar1, dec: 0 },
  { etikett: 'Intäkt/år (kr)', hamta: (r) => r.intaktAr1, dec: 0 },
  { etikett: 'Investeringsutgift (kr)', hamta: (r) => r.investering, dec: 0 },
  { etikett: 'Årlig kapitalkostnad (kr)', hamta: (r) => r.kapitalkostnad, dec: 0 },
  { etikett: 'Kostnad per kWh (kr)', hamta: (r) => r.kostnadPerkWh, dec: 3 },
  { etikett: 'Överskott/år (kr)', hamta: (r) => r.overskott, dec: 0 },
  { etikett: 'LCOE (kr/kWh)', hamta: (r) => r.lcoe, dec: 3 },
  { etikett: 'NPV (kr)', hamta: (r) => r.npvInvest, dec: 0 },
  { etikett: 'IRR (%)', hamta: (r) => r.irrInvest * 100, dec: 1 },
  {
    etikett: 'Närboendeersättning tot/år (kr)',
    hamta: (r) => r.narboendeTotalAr1,
    dec: 0,
  },
];

/** Raderna per perspektiv. Alla läser samma resultatobjekt. */
function perspektivRader(r: Resultat): Record<PerspektivId, [string, string][]> {
  const payback =
    r.paybackInvest === null ? '> livslängd' : fmt(r.paybackInvest, 1, ' år');
  const irr = Number.isFinite(r.irrInvest)
    ? fmt(r.irrInvest * 100, 1, ' %')
    : 'ej definierad';

  return {
    investerare: [
      ['Produktion', fmt(r.produktionMWh_ar1, 0, ' MWh/år')],
      ['Intäkt totalt per år', fmt(r.intaktAr1, 0, ' kr/år')],
      ['Årlig driftskostnad', fmt(r.driftkostnadAr1, 0, ' kr/år')],
      ['Investeringsutgift', fmt(r.investering, 0, ' kr')],
      ['Investeringsutgift per årskWh', fmt(r.invPerkWh, 2, ' kr/årskWh')],
      ['Årlig kapitalkostnad (annuitet)', fmt(r.kapitalkostnad, 0, ' kr/år')],
      ['Årlig total kostnad', fmt(r.totalkostnad, 0, ' kr/år')],
      ['Kostnad per kWh', fmt(r.kostnadPerkWh, 2, ' kr/kWh')],
      ['Överskott per år (bas)', fmt(r.overskott, 0, ' kr/år')],
      [
        'Överskott per år efter lokala ersättningar',
        fmt(r.overskottNetto, 0, ' kr/år'),
      ],
      ['LCOE', fmt(r.lcoe, 2, ' kr/kWh')],
      ['Payback (enkel)', payback],
      ['NPV (nettonuvärde)', fmt(r.npvInvest, 0, ' kr')],
      ['IRR (internränta)', irr],
    ],
    markagare: [
      ['Årlig arrendeintäkt (år 1)', fmt(r.arrendeAr1, 0, ' kr/år')],
      ['Total arrendeintäkt (hela livslängden)', fmt(r.arrendeTotal, 0, ' kr')],
      ['Nuvärde av arrendet', fmt(r.arrendeNuvarde, 0, ' kr')],
    ],
    kommun: [
      [
        'Lokala intäkter år 1 (arrende + kommun + närboende)',
        fmt(r.lokalaIntakterAr1, 0, ' kr/år'),
      ],
      [
        'Lokala intäkter, hela livslängden',
        fmt(r.lokalaIntakterTotal, 0, ' kr'),
      ],
      ['Kommunal ersättning år 1', fmt(r.kommunAr, 0, ' kr/år')],
      ['Undviken CO₂', fmt(r.co2Ton, 0, ' ton/år')],
      ['Värderad samhällsnytta', fmt(r.samhallsnytta, 0, ' kr/år')],
    ],
    andelsagare: [
      ['Årlig elmängd från andelarna', fmt(r.elmangd, 0, ' kWh/år')],
      ['Total insats', fmt(r.totalInsats, 0, ' kr')],
      ['Självkostnad', fmt(r.sjalvkostnadkWh, 2, ' kr/kWh')],
      ['Marknadspris hushållsel (år 1)', fmt(r.marknadsprisAr1, 2, ' kr/kWh')],
      ['Årlig besparing', fmt(r.besparingAr1, 0, ' kr/år')],
      ['Alternativkostnad för insatsen', fmt(r.alternativkostnad, 0, ' kr/år')],
      ['Nettoresultat år 1', fmt(r.nettoAr1, 0, ' kr/år')],
      [
        'Återbetalningstid på insatsen',
        r.aterbetalning === null
          ? 'aldrig (ingen besparing)'
          : fmt(r.aterbetalning, 1, ' år'),
      ],
      ['Nettonuvärde för hushållet', fmt(r.nuvardeAndel, 0, ' kr')],
    ],
    narboende: [
      ['Fem verkshöjder', fmt(r.femhojder, 0, ' m')],
      ['Nio verkshöjder', fmt(r.niohojder, 0, ' m')],
      [
        'Inom ersättningszonen',
        r.inomZon ? 'Ja' : 'Nej (utanför 9 verkshöjder)',
      ],
      ['Distansfaktor', fmt(r.distansfaktor, 2)],
      [
        'Ersättning till en enskild bostad',
        fmt(r.narboendeEnskildAr1, 0, ' kr/år'),
      ],
      [
        'Total ersättning som belastar utövaren',
        fmt(r.narboendeTotalAr1, 0, ' kr/år'),
      ],
    ],
  };
}

/* ---------------------------------------------------------------------------
   Komponenten
   --------------------------------------------------------------------------- */

export default function CalculatorForm({
  perspektiv,
}: {
  /** Utelämnad = översikten på /kalkyl. Satt = det perspektiv som lyfts fram. */
  perspektiv?: PerspektivId;
}) {
  // Fälten och jämförelseminnet bor i /kalkyl-layouten (KalkylProvider), inte
  // här. Därför nollställs inget när man byter perspektiv-adress.
  const { falt, setFalt, senaste, tidigare, bekrafta, delningsFel } =
    useKalkyl();

  const resultat = beraknaAllt(lasIndata(falt));
  const rader = perspektivRader(resultat);
  const valt = PERSPEKTIV.find((p) => p.id === perspektiv);
  const ovriga = PERSPEKTIV.filter((p) => p.id !== perspektiv);

  /** Skriver medan man knappar – live-omräkning, ingen tabelluppdatering. */
  function andra(id: FaltId, varde: string) {
    setFalt((fore) => ({ ...fore, [id]: varde }));
  }

  /** Elområde: fyller schablonpris i det gula elpris-fältet (redigerbart). */
  function bytElomrade(varde: string) {
    const schablon = ELOMRADE_PRIS[varde];
    const nyaFalt = {
      ...falt,
      elomrade: varde,
      ...(schablon !== undefined ? { elpris: String(schablon) } : {}),
    };
    setFalt(nyaFalt);
    bekrafta(nyaFalt);
  }

  function aterstall() {
    const nyaFalt = { ...DEFAULTS };
    setFalt(nyaFalt);
    bekrafta(nyaFalt);
  }

  /**
   * Fyller ENBART "Spotpris hushållsel" – aldrig "Intäkt för elen".
   * Ett hämtat dygns- eller månadspris är en ögonblicksbild och duger inte
   * som 25-årsantagande för parkens intäkt.
   */
  function anvandSomSpotpris(prisKrKwh: number) {
    const nyaFalt = { ...falt, spotpris: String(prisKrKwh) };
    setFalt(nyaFalt);
    bekrafta(nyaFalt);
  }

  return (
    <div className="space-y-8">
      {/* Trasig delningslänk: säg det rakt ut, behåll standardvärdena. */}
      {delningsFel ? (
        <p
          role="status"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {delningsFel}
        </p>
      ) : null}

      {/* ---- Perspektivväljare: adresser, inte flikar ---- */}
      <nav aria-label="Perspektiv" className="flex flex-wrap gap-2">
        <PerspektivLank href="/kalkyl" aktiv={!perspektiv}>
          Översikt
        </PerspektivLank>
        {PERSPEKTIV.map((p) => (
          <PerspektivLank
            key={p.id}
            href={`/kalkyl/${p.id}`}
            aktiv={p.id === perspektiv}
          >
            {p.kort}
          </PerspektivLank>
        ))}
      </nav>

      {/* ---- Nyckeltal, alltid synliga oavsett perspektiv ---- */}
      <section aria-labelledby="nyckeltal-rubrik">
        <h2 id="nyckeltal-rubrik" className="sr-only">
          Sammanfattande nyckeltal
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Nyckeltal etikett="LCOE" varde={fmt(resultat.lcoe, 2, ' kr/kWh')} />
          <Nyckeltal
            etikett="Överskott/år"
            varde={fmt(resultat.overskott, 0, ' kr/år')}
          />
          <Nyckeltal
            etikett="Payback"
            varde={
              resultat.paybackInvest === null
                ? '> livslängd'
                : fmt(resultat.paybackInvest, 1, ' år')
            }
          />
          <Nyckeltal etikett="NPV" varde={fmt(resultat.npvInvest, 0, ' kr')} />
          <Nyckeltal
            etikett="IRR"
            varde={
              Number.isFinite(resultat.irrInvest)
                ? fmt(resultat.irrInvest * 100, 1, ' %')
                : 'ej def.'
            }
          />
          <Nyckeltal
            etikett="Produktion"
            varde={fmt(resultat.produktionMWh_ar1, 0, ' MWh/år')}
          />
        </div>
      </section>

      {/* ---- Dela kalkylen: kort kod eller lång token ---- */}
      <Delningsknappar falt={falt} />

      {/* ---- Förgrunden: det valda perspektivet ligger överst ---- */}
      {valt ? (
        <Perspektiv
          rubrik={valt.rubrik}
          ingress={valt.ingress}
          rader={rader[valt.id]}
          framhavd
        />
      ) : null}

      {/* ---- Indata: gula fält ---- */}
      <section aria-labelledby="indata-rubrik">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="indata-rubrik" className="text-xl font-semibold">
            Indata
          </h2>
          <button
            type="button"
            onClick={aterstall}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:border-teal-700"
          >
            Återställ till standardvärden
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Alla fält med <span className="rounded bg-[#fff3b0] px-1">gul
          bakgrund</span> är värden du kan mata in och ändra. Kalkylen räknar om
          direkt, utan serveranrop. Värdena följer med när du byter perspektiv.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {GRUPPER.map((grupp) => (
            <fieldset
              key={grupp.rubrik}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <legend className="px-1 text-sm font-semibold text-teal-900">
                {grupp.rubrik}
              </legend>
              <div className="space-y-3">
                {grupp.falt.map((def) => (
                  <label key={def.id} className="block text-sm">
                    <span className="flex flex-wrap items-center gap-2 font-medium text-slate-700">
                      {def.etikett}
                      {def.markering ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">
                          {def.markering}
                        </span>
                      ) : null}
                    </span>

                    {def.alternativ ? (
                      <select
                        id={def.id}
                        className="indata mt-1 w-full"
                        value={falt[def.id]}
                        onChange={(e) => {
                          if (def.id === 'elomrade') {
                            bytElomrade(e.target.value);
                          } else {
                            const nyaFalt = {
                              ...falt,
                              [def.id]: e.target.value,
                            };
                            setFalt(nyaFalt);
                            bekrafta(nyaFalt);
                          }
                        }}
                      >
                        {def.alternativ.map((alt) => (
                          <option key={alt.varde} value={alt.varde}>
                            {alt.text}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={def.id}
                        type="number"
                        step={def.step}
                        className="indata mt-1 w-full"
                        value={falt[def.id]}
                        onChange={(e) => andra(def.id, e.target.value)}
                        onBlur={() => bekrafta()}
                      />
                    )}

                    {def.hint ? (
                      <span className="mt-1 block text-xs text-slate-500">
                        {def.hint}
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      {/* ---- Hämtat spotpris: information bredvid fälten ---- */}
      <Spotprishamtare
        elomrade={falt.elomrade}
        anvand={anvandSomSpotpris}
      />

      {/* ---- Jämförelsetabell: Senaste / Tidigare / Förändring ---- */}
      <section aria-labelledby="jamforelse-rubrik">
        <h2 id="jamforelse-rubrik" className="text-xl font-semibold">
          Jämförelse mot föregående ändring
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          När du ändrar ett fält och lämnar det flyttas det tidigare
          “Senaste”-värdet till “Tidigare”, det nya hamnar i “Senaste” och
          skillnaden visas i “Förändring”. Vid första beräkningen visas “–”.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Nyckeltal
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Senaste resultatet
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Tidigare resultatet
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Förändringen
                </th>
              </tr>
            </thead>
            <tbody>
              {JAMFOR_NYCKELTAL.map((nt) => {
                const senasteVal = nt.hamta(senaste);
                const tidigareVal = tidigare ? nt.hamta(tidigare) : NaN;
                const harDiff =
                  Number.isFinite(senasteVal) && Number.isFinite(tidigareVal);
                const diff = harDiff ? senasteVal - tidigareVal : NaN;
                return (
                  <tr key={nt.etikett} className="border-t border-slate-100">
                    <td className="px-3 py-2">{nt.etikett}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {Number.isFinite(senasteVal)
                        ? fmt(senasteVal, nt.dec)
                        : '–'}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-600">
                      {Number.isFinite(tidigareVal)
                        ? fmt(tidigareVal, nt.dec)
                        : '–'}
                    </td>
                    <td
                      className={
                        'px-3 py-2 tabular-nums ' +
                        (harDiff && diff > 0
                          ? 'text-teal-700'
                          : harDiff && diff < 0
                            ? 'text-red-700'
                            : 'text-slate-500')
                      }
                    >
                      {harDiff
                        ? (diff > 0 ? '+' : '') + fmt(diff, nt.dec)
                        : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Övriga perspektiv (alla fem när man står på översikten) ---- */}
      <section aria-labelledby="perspektiv-rubrik" className="space-y-4">
        <h2 id="perspektiv-rubrik" className="text-xl font-semibold">
          {valt ? 'Övriga perspektiv' : 'De fem perspektiven'}
        </h2>

        {ovriga.map((p) => (
          <Perspektiv
            key={p.id}
            rubrik={p.rubrik}
            rader={rader[p.id]}
            lank={`/kalkyl/${p.id}`}
          />
        ))}

        {/* Rimlighetskontrollen hör till NU20 och visas där siffran finns. */}
        <p className="text-sm text-slate-600">
          Rimlighetskontroll: högsta ersättning per bostad hamnar enligt lagens
          storleksordning på ca 38 000 kr/år i SE4 och ca 19 000 kr/år i SE1 vid
          minst två verk inom fem verkshöjder. Aktuellt värde:{' '}
          {fmt(resultat.narboendeEnskildAr1, 0, ' kr/år')}.
        </p>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Små presentationsdelar
   --------------------------------------------------------------------------- */

function PerspektivLank({
  href,
  aktiv,
  children,
}: {
  href: string;
  aktiv: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={aktiv ? 'page' : undefined}
      className={
        'rounded-full border px-3 py-1.5 text-sm font-medium ' +
        (aktiv
          ? 'border-teal-700 bg-teal-700 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-teal-700 hover:text-teal-800')
      }
    >
      {children}
    </Link>
  );
}

/**
 * Delningsknappar – kort länk (Redis, 30 dagar) eller lång länk (allt i URL:en).
 *
 * Båda packar in alla gula indatafält, aldrig nyckeltalen: LCOE, NPV och IRR
 * räknas om när mottagaren öppnar länken. Länken behåller det perspektiv man
 * står på, så `/kalkyl/narboende?s=…` öppnar närboendevyn med rätt indata.
 */
function Delningsknappar({ falt }: { falt: Record<FaltId, string> }) {
  const sokvag = usePathname();
  const [status, setStatus] = useState<string | null>(null);
  const [lank, setLank] = useState<string | null>(null);
  const [jobbar, setJobbar] = useState(false);

  async function dela(onskad: 'kort' | 'lang') {
    setJobbar(true);
    setStatus(null);
    setLank(null);

    try {
      const svar = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ falt }),
      });
      const kropp = await svar.json();

      if (!svar.ok || !kropp?.ok) {
        setStatus(kropp?.fel ?? 'Kunde inte skapa länken just nu.');
        return;
      }

      // Kort kod finns bara om servern har Redis. Annars blir det lång länk.
      const kort = onskad === 'kort' && kropp.id;
      const url = new URL(sokvag, window.location.origin);
      url.searchParams.set(kort ? 's' : 't', kort ? kropp.id : kropp.token);
      const text = url.toString();

      setLank(text);

      const beskrivning = kort
        ? `Kort länk skapad. Den gäller ${kropp.ttlDagar} dagar.`
        : onskad === 'kort'
          ? 'Ingen databas kopplad, så du fick en lång länk i stället. Den har ingen tidsgräns.'
          : 'Lång länk skapad. Den har ingen tidsgräns.';

      try {
        await navigator.clipboard.writeText(text);
        setStatus(`${beskrivning} Den ligger nu i urklipp.`);
      } catch {
        // Webbläsaren kan neka kopiering. Länken syns ändå i rutan nedan.
        setStatus(`${beskrivning} Kopiera den från rutan nedan.`);
      }
    } catch {
      setStatus('Ingen kontakt med servern. Försök igen senare.');
    } finally {
      setJobbar(false);
    }
  }

  return (
    <section
      aria-labelledby="dela-rubrik"
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <h2 id="dela-rubrik" className="text-xl font-semibold">
        Dela kalkylen genom att kopiera indata
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Båda länkarna packar in <em>alla gula indatafält</em> – inte LCOE eller
        NPV, för de räknas om när länken öppnas. Länken pekar på det perspektiv
        du står på.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => dela('kort')}
          disabled={jobbar}
          className="rounded-md border border-slate-300 bg-[#fff3b0] px-3 py-1.5 text-sm font-medium hover:border-teal-700 disabled:opacity-60"
        >
          Kort länk (30 dagar)
        </button>
        <button
          type="button"
          onClick={() => dela('lang')}
          disabled={jobbar}
          className="rounded-md border border-slate-300 bg-[#fff3b0] px-3 py-1.5 text-sm font-medium hover:border-teal-700 disabled:opacity-60"
        >
          Lång länk (håller)
        </button>
      </div>

      {status ? (
        <p role="status" className="mt-3 text-sm text-slate-700">
          {status}
        </p>
      ) : null}

      {lank ? (
        <input
          readOnly
          value={lank}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Delningslänk"
          className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs"
        />
      ) : null}
    </section>
  );
}

/**
 * Spotpris från ENTSO-E via /api/elpris – månadsmedel och årsmedel.
 *
 * Talen visas som INFORMATION bredvid de gula fälten. Ingenting fylls i
 * automatiskt; användaren måste klicka för att lägga priset i "Spotpris
 * hushållsel". "Intäkt för elen" (som styr LCOE) rörs aldrig härifrån.
 */
function Spotprishamtare({
  elomrade,
  anvand,
}: {
  elomrade: string;
  anvand: (prisKrKwh: number) => void;
}) {
  const [laddar, setLaddar] = useState(false);
  const [manad, setManad] = useState<ElprisSvar | null>(null);
  const [ar, setAr] = useState<ElprisSvar | null>(null);
  const [felmeddelande, setFelmeddelande] = useState<string | null>(null);

  async function hamta() {
    setLaddar(true);
    setFelmeddelande(null);
    setManad(null);
    setAr(null);

    // Två anrop, ett per period. Servern cachar dem sex timmar per elområde.
    const [svarManad, svarAr] = await Promise.all([
      hamtaElprisFranApi(elomrade, 'manad'),
      hamtaElprisFranApi(elomrade, 'ar'),
    ]);

    if (svarManad.ok) setManad(svarManad.data);
    if (svarAr.ok) setAr(svarAr.data);
    if (!svarManad.ok && !svarAr.ok) setFelmeddelande(svarManad.fel);

    setLaddar(false);
  }

  return (
    <section
      aria-labelledby="spotpris-rubrik"
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <h2 id="spotpris-rubrik" className="text-xl font-semibold">
        Spotpris från ENTSO-E
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Hämtar månadsmedel och årsmedel för {elomrade} från dagen-före-marknaden
        (A44). Priset är utan skatt, nät och påslag, och fylls aldrig i
        automatiskt. Kalkylen fungerar även om hämtningen misslyckas.
      </p>

      <button
        type="button"
        onClick={hamta}
        disabled={laddar}
        className="mt-3 rounded-md border border-teal-700 bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {laddar ? 'Hämtar …' : `Hämta månads- och årsmedel för ${elomrade}`}
      </button>

      {felmeddelande ? (
        <p role="status" className="mt-3 text-sm text-red-700">
          {felmeddelande}
        </p>
      ) : null}

      {manad || ar ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {manad ? (
            <Elpriskort
              rubrik="Senaste hela månaden"
              svar={manad}
              anvand={anvand}
            />
          ) : null}
          {ar ? (
            <Elpriskort rubrik="Senaste hela året" svar={ar} anvand={anvand} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Ett anrop mot vår egen Route Handler. Nyckeln stannar på servern. */
async function hamtaElprisFranApi(
  omrade: string,
  period: 'dygn' | 'manad' | 'ar'
): Promise<{ ok: true; data: ElprisSvar } | { ok: false; fel: string }> {
  try {
    const svar = await fetch(
      `/api/elpris?omrade=${encodeURIComponent(omrade)}&period=${period}`
    );
    const kropp = await svar.json();
    if (!svar.ok || !kropp?.ok) {
      return {
        ok: false,
        fel: kropp?.fel ?? 'Elpriset kunde inte hämtas just nu.',
      };
    }
    return { ok: true, data: kropp as ElprisSvar };
  } catch {
    return { ok: false, fel: 'Ingen kontakt med servern. Försök igen senare.' };
  }
}

function Elpriskort({
  rubrik,
  svar,
  anvand,
}: {
  rubrik: string;
  svar: ElprisSvar;
  anvand: (prisKrKwh: number) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="font-semibold text-teal-900">{rubrik}</h3>
      <p className="text-xs text-slate-600">
        {svar.periodStart} – {svar.periodEnd} · {svar.antalPunkter} prispunkter
      </p>
      <p className="mt-2 text-lg font-semibold tabular-nums">
        {svar.prisKrKwh !== null
          ? fmt(svar.prisKrKwh, 3, ' kr/kWh')
          : 'kurs saknas'}
      </p>
      <p className="text-sm text-slate-600 tabular-nums">
        {fmt(svar.prisEurMwh, 2, ' EUR/MWh')}
        {svar.sekPerEur
          ? ` · ${fmt(svar.sekPerEur, 3)} kr/EUR (${svar.fxDatum ?? 'okänt datum'})`
          : ''}
      </p>
      {svar.fxFel ? (
        <p className="mt-1 text-xs text-red-700">{svar.fxFel}</p>
      ) : null}

      {svar.prisKrKwh !== null ? (
        <button
          type="button"
          onClick={() => anvand(svar.prisKrKwh as number)}
          className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:border-teal-700"
        >
          Använd som spotpris hushållsel
        </button>
      ) : null}
    </div>
  );
}

function Nyckeltal({ etikett, varde }: { etikett: string; varde: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
        {etikett}
      </span>
      <span className="mt-1 block text-lg font-semibold tabular-nums">
        {varde}
      </span>
    </div>
  );
}

function Perspektiv({
  rubrik,
  ingress,
  rader,
  lank,
  framhavd = false,
}: {
  rubrik: string;
  ingress?: string;
  rader: [string, string][];
  lank?: string;
  framhavd?: boolean;
}) {
  return (
    <div
      className={
        'rounded-xl border p-4 ' +
        (framhavd
          ? 'border-teal-700 bg-teal-50/60 shadow-sm'
          : 'border-slate-200 bg-white')
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-teal-900">{rubrik}</h3>
        {lank ? (
          <Link
            href={lank}
            className="text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-600"
          >
            Öppna som egen sida
          </Link>
        ) : null}
      </div>
      {ingress ? (
        <p className="mt-1 text-sm text-slate-700">{ingress}</p>
      ) : null}
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rader.map(([etikett, varde]) => (
          <div
            key={etikett}
            className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-1"
          >
            <dt className="text-sm text-slate-600">{etikett}</dt>
            <dd className="text-sm font-medium tabular-nums">{varde}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
