'use client';

/**
 * KalkylProvider – de gula fältens gemensamma minne.
 *
 * Varför den finns: perspektiven är egna adresser (/kalkyl/narboende osv.),
 * inte flikar. Om varje sida hade haft eget state skulle indata nollställas
 * vid varje byte. App Router behåller däremot layouten när man navigerar
 * mellan sidor under samma mapp, så state som bor i /kalkyl-layouten överlever
 * bytet. Ingen sessionStorage behövs.
 *
 * Här skedde en uppdatering (delningslänkar): finns `?s=` eller `?t=` i
 * adressen hämtas fälten innan formuläret ritas. Det görs med React 19:s
 * `use()` på en cachad promise – inte i en effekt som sedan sätter state,
 * vilket både ger ett hopp i gränssnittet och bryter mot lint-reglerna.
 * Därför ligger providern bakom en <Suspense> i layouten.
 *
 * Här finns ingen formel. Beräkningen görs av lib/calculations.ts.
 */

import {
  createContext,
  use,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { medDefaults } from '@/lib/defaults';
import { beraknaAllt, lasIndata, type Resultat } from '@/lib/calculations';
import { rensaFalt, type Falt, type FaltId } from '@/lib/falt';

/** Alla gula fält som strängar – samma form som ver2 delar via `?s=`/`?t=`. */
export type Faltvarden = Record<FaltId, string>;

type KalkylState = {
  falt: Faltvarden;
  setFalt: Dispatch<SetStateAction<Faltvarden>>;
  /** Resultatet vid senaste bekräftade ändring (jämförelsetabellens kolumn 1). */
  senaste: Resultat;
  /** Resultatet dessförinnan (kolumn 2). Null före första ändringen. */
  tidigare: Resultat | null;
  /** Kallas när ett fält lämnas: flyttar Senaste → Tidigare. */
  bekrafta: (nyaFalt?: Faltvarden) => void;
  /** Satt om adressen innehöll en delningskod som inte gick att läsa. */
  delningsFel: string | null;
};

const KalkylContext = createContext<KalkylState | null>(null);

/**
 * Hämtningar per delningskod. Cachen behövs för att `use()` ska få samma
 * promise vid varje omrendering – annars hämtar vi om i all oändlighet.
 */
const hamtningar = new Map<string, Promise<Falt | null | undefined>>();

function hamtaDelning(urlNyckel: 's' | 't', varde: string) {
  // På servern finns ingen adress att göra ett relativt anrop mot. I bygget
  // hoppar Next över den här delen ändå (den ligger bakom Suspense och läser
  // adressen), men dev-serverns SSR skulle annars få ett fel och visa
  // "kunde inte läsas". Vi låter webbläsaren sköta hämtningen.
  if (typeof window === 'undefined') {
    return Promise.resolve(undefined);
  }

  const cacheNyckel = `${urlNyckel}:${varde}`;
  let hamtning = hamtningar.get(cacheNyckel);

  if (!hamtning) {
    const fraga =
      urlNyckel === 's'
        ? `id=${encodeURIComponent(varde)}`
        : `token=${encodeURIComponent(varde)}`;

    hamtning = fetch(`/api/scenario?${fraga}`)
      .then((svar) => svar.json())
      .then((kropp) => (kropp?.ok ? rensaFalt(kropp.falt) : null))
      .catch(() => null);

    hamtningar.set(cacheNyckel, hamtning);
  }

  return hamtning;
}

export function KalkylProvider({ children }: { children: ReactNode }) {
  const parametrar = useSearchParams();
  const kortKod = parametrar.get('s');
  const langToken = parametrar.get('t');

  // `use()` får anropas villkorligt – till skillnad från vanliga hooks.
  // null = koden gick inte att läsa. undefined = inte avgjort än (servern).
  const delat = kortKod
    ? use(hamtaDelning('s', kortKod))
    : langToken
      ? use(hamtaDelning('t', langToken))
      : null;

  const delningsFel =
    (kortKod || langToken) && delat === null
      ? 'Delningslänken kunde inte läsas (fel kod, utgången eller ingen databas). Standardvärdena används.'
      : null;

  const [falt, setFalt] = useState<Faltvarden>(() => medDefaults(delat));

  // MINNESLOGIK (som i ver2): uppdateras när ett fält LÄMNAS, inte medan man
  // skriver. Nyckeltalen räknas däremot om vid varje tangenttryckning.
  const [senaste, setSenaste] = useState<Resultat>(() =>
    beraknaAllt(lasIndata(medDefaults(delat)))
  );
  const [tidigare, setTidigare] = useState<Resultat | null>(null);

  function bekrafta(nyaFalt: Faltvarden = falt) {
    setTidigare(senaste);
    setSenaste(beraknaAllt(lasIndata(nyaFalt)));
  }

  return (
    <KalkylContext.Provider
      value={{ falt, setFalt, senaste, tidigare, bekrafta, delningsFel }}
    >
      {children}
    </KalkylContext.Provider>
  );
}

export function useKalkyl(): KalkylState {
  const kalkyl = useContext(KalkylContext);
  if (!kalkyl) {
    throw new Error('useKalkyl måste användas inuti <KalkylProvider>.');
  }
  return kalkyl;
}
