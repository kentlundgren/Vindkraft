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
 * Här finns ingen formel. Beräkningen görs av lib/calculations.ts.
 */

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { DEFAULTS } from '@/lib/defaults';
import { beraknaAllt, lasIndata, type Resultat } from '@/lib/calculations';
import type { FaltId } from '@/lib/falt';

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
};

const KalkylContext = createContext<KalkylState | null>(null);

export function KalkylProvider({ children }: { children: ReactNode }) {
  const [falt, setFalt] = useState<Faltvarden>({ ...DEFAULTS });

  // MINNESLOGIK (som i ver2): uppdateras när ett fält LÄMNAS, inte medan man
  // skriver. Nyckeltalen räknas däremot om vid varje tangenttryckning.
  const [senaste, setSenaste] = useState<Resultat>(() =>
    beraknaAllt(lasIndata(DEFAULTS))
  );
  const [tidigare, setTidigare] = useState<Resultat | null>(null);

  function bekrafta(nyaFalt: Faltvarden = falt) {
    setTidigare(senaste);
    setSenaste(beraknaAllt(lasIndata(nyaFalt)));
  }

  return (
    <KalkylContext.Provider
      value={{ falt, setFalt, senaste, tidigare, bekrafta }}
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
