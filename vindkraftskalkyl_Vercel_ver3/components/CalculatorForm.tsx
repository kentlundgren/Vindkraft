'use client';

/**
 * CalculatorForm – gula indatafält + nyckeltal + jämförelsetabell.
 *
 * 'use client' behövs: fälten har state och räknar om medan man skriver.
 * Ingen formel bor här. All matte ligger i lib/calculations.ts (port av ver2).
 *
 * Här skedde en uppdatering mot ver2: flikarna är borta. Perspektiven visas
 * under varandra i översikten; egna URL:er per perspektiv byggs i nästa steg.
 */

import { useState } from 'react';
import { DEFAULTS, ELOMRADE_PRIS } from '@/lib/defaults';
import { beraknaAllt, lasIndata, fmt, type Resultat } from '@/lib/calculations';
import type { FaltId } from '@/lib/falt';

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

/* ---------------------------------------------------------------------------
   Komponenten
   --------------------------------------------------------------------------- */

export default function CalculatorForm() {
  const [falt, setFalt] = useState<Record<FaltId, string>>({ ...DEFAULTS });

  // MINNESLOGIK (som i ver2): "Senaste" och "Tidigare" uppdateras när ett fält
  // LÄMNAS (blur/change) – inte medan man skriver. Korten ovanför räknar live.
  const [senaste, setSenaste] = useState<Resultat>(() =>
    beraknaAllt(lasIndata(DEFAULTS))
  );
  const [tidigare, setTidigare] = useState<Resultat | null>(null);

  const resultat = beraknaAllt(lasIndata(falt));

  /** Skriver medan man knappar – live-omräkning, ingen tabelluppdatering. */
  function andra(id: FaltId, varde: string) {
    setFalt((fore) => ({ ...fore, [id]: varde }));
  }

  /** Bekräftad ändring: flytta Senaste → Tidigare och spara nytt Senaste. */
  function bekrafta(nyaFalt: Record<FaltId, string> = falt) {
    setTidigare(senaste);
    setSenaste(beraknaAllt(lasIndata(nyaFalt)));
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
    setTidigare(senaste);
    setSenaste(beraknaAllt(lasIndata(nyaFalt)));
  }

  return (
    <div className="space-y-8">
      {/* ---- Nyckeltal, alltid överst ---- */}
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
          direkt, utan serveranrop.
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

      {/* ---- De fem perspektiven i översikt ---- */}
      <section aria-labelledby="perspektiv-rubrik" className="space-y-4">
        <h2 id="perspektiv-rubrik" className="text-xl font-semibold">
          De fem perspektiven
        </h2>

        <Perspektiv
          rubrik="Investerare"
          rader={[
            ['Produktion', fmt(resultat.produktionMWh_ar1, 0, ' MWh/år')],
            ['Intäkt totalt per år', fmt(resultat.intaktAr1, 0, ' kr/år')],
            ['Årlig driftskostnad', fmt(resultat.driftkostnadAr1, 0, ' kr/år')],
            ['Investeringsutgift', fmt(resultat.investering, 0, ' kr')],
            [
              'Investeringsutgift per årskWh',
              fmt(resultat.invPerkWh, 2, ' kr/årskWh'),
            ],
            [
              'Årlig kapitalkostnad (annuitet)',
              fmt(resultat.kapitalkostnad, 0, ' kr/år'),
            ],
            ['Årlig total kostnad', fmt(resultat.totalkostnad, 0, ' kr/år')],
            ['Kostnad per kWh', fmt(resultat.kostnadPerkWh, 2, ' kr/kWh')],
            ['Överskott per år (bas)', fmt(resultat.overskott, 0, ' kr/år')],
            [
              'Överskott per år efter lokala ersättningar',
              fmt(resultat.overskottNetto, 0, ' kr/år'),
            ],
            ['LCOE', fmt(resultat.lcoe, 2, ' kr/kWh')],
            [
              'Payback (enkel)',
              resultat.paybackInvest === null
                ? '> livslängd'
                : fmt(resultat.paybackInvest, 1, ' år'),
            ],
            ['NPV (nettonuvärde)', fmt(resultat.npvInvest, 0, ' kr')],
            [
              'IRR (internränta)',
              Number.isFinite(resultat.irrInvest)
                ? fmt(resultat.irrInvest * 100, 1, ' %')
                : 'ej definierad',
            ],
          ]}
        />

        <Perspektiv
          rubrik="Markägare"
          rader={[
            ['Årlig arrendeintäkt (år 1)', fmt(resultat.arrendeAr1, 0, ' kr/år')],
            [
              'Total arrendeintäkt (hela livslängden)',
              fmt(resultat.arrendeTotal, 0, ' kr'),
            ],
            ['Nuvärde av arrendet', fmt(resultat.arrendeNuvarde, 0, ' kr')],
          ]}
        />

        <Perspektiv
          rubrik="Kommun/samhälle"
          rader={[
            [
              'Lokala intäkter år 1 (arrende + kommun + närboende)',
              fmt(resultat.lokalaIntakterAr1, 0, ' kr/år'),
            ],
            [
              'Lokala intäkter, hela livslängden',
              fmt(resultat.lokalaIntakterTotal, 0, ' kr'),
            ],
            ['Kommunal ersättning år 1', fmt(resultat.kommunAr, 0, ' kr/år')],
            ['Undviken CO₂', fmt(resultat.co2Ton, 0, ' ton/år')],
            ['Värderad samhällsnytta', fmt(resultat.samhallsnytta, 0, ' kr/år')],
          ]}
        />

        <Perspektiv
          rubrik="Andelsägare"
          rader={[
            ['Årlig elmängd från andelarna', fmt(resultat.elmangd, 0, ' kWh/år')],
            ['Total insats', fmt(resultat.totalInsats, 0, ' kr')],
            ['Självkostnad', fmt(resultat.sjalvkostnadkWh, 2, ' kr/kWh')],
            [
              'Marknadspris hushållsel (år 1)',
              fmt(resultat.marknadsprisAr1, 2, ' kr/kWh'),
            ],
            ['Årlig besparing', fmt(resultat.besparingAr1, 0, ' kr/år')],
            [
              'Alternativkostnad för insatsen',
              fmt(resultat.alternativkostnad, 0, ' kr/år'),
            ],
            ['Nettoresultat år 1', fmt(resultat.nettoAr1, 0, ' kr/år')],
            [
              'Återbetalningstid på insatsen',
              resultat.aterbetalning === null
                ? 'aldrig (ingen besparing)'
                : fmt(resultat.aterbetalning, 1, ' år'),
            ],
            ['Nettonuvärde för hushållet', fmt(resultat.nuvardeAndel, 0, ' kr')],
          ]}
        />

        <Perspektiv
          rubrik="Närboende (NU20)"
          rader={[
            ['Fem verkshöjder', fmt(resultat.femhojder, 0, ' m')],
            ['Nio verkshöjder', fmt(resultat.niohojder, 0, ' m')],
            [
              'Inom ersättningszonen',
              resultat.inomZon ? 'Ja' : 'Nej (utanför 9 verkshöjder)',
            ],
            ['Distansfaktor', fmt(resultat.distansfaktor, 2)],
            [
              'Ersättning till en enskild bostad',
              fmt(resultat.narboendeEnskildAr1, 0, ' kr/år'),
            ],
            [
              'Total ersättning som belastar utövaren',
              fmt(resultat.narboendeTotalAr1, 0, ' kr/år'),
            ],
          ]}
        />

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
  rader,
}: {
  rubrik: string;
  rader: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-teal-900">{rubrik}</h3>
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
