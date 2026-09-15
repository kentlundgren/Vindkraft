import type { Falt, FaltId } from './falt.ts';

/**
 * Standardvärden – hämtade ur ver2:s `index.html` (value="…" på varje fält).
 * Samma tal, så att en tom kalkyl i ver3 ger samma nyckeltal som ver2.
 *
 * Värdena ligger som strängar eftersom de kommer från (och delas som) formulär-
 * fält. `lasIndata` i calculations.ts gör om dem till tal.
 */
export const DEFAULTS: Record<FaltId, string> = {
  // Anläggning & investering
  elpris: '0.6',
  elomrade: 'SE3',
  elprisforandring: '0',
  kapfaktor: '0.37',
  livslangd: '25',
  effekt: '4',
  antalverk: '5',
  verkshojd: '200',
  degradering: '0.5',
  specinv: '12000',
  kalkylranta: '0.1215',

  // Drift & livscykel
  rorlig: '0.11',
  fast: '42100',
  nedmontering: '600',
  restvarde: '0',

  // Markägare
  arrendemodell: 'procent',
  arrendeprocent: '3.5',
  arrendekrmw: '40000',

  // Kommun/samhälle
  kommunersattning: '15000',
  co2faktor: '0.3',
  co2varde: '1.0',

  // Andelsägare
  antalandelar: '10',
  kwhperandel: '1000',
  insatsperandel: '6000',
  driftpaslag: '3',
  spotpris: '0.6',
  elhandelspaslag: '0.08',
  energiskatt: '0.428',
  momssats: '25',

  // Närboende (NU20)
  avstand: '800',
  verkinom5: '2',
  antalbostader: '20',
  maxpromille: '2.5',
};

/** Schablonpriser per elområde (kr/kWh) – fylls i när området byts. */
export const ELOMRADE_PRIS: Record<string, number> = {
  SE1: 0.3,
  SE2: 0.35,
  SE3: 0.55,
  SE4: 0.6,
};

/** Defaults plus eventuella delade fält (från `?s=` / `?t=`). */
export function medDefaults(falt?: Falt | null): Record<FaltId, string> {
  return { ...DEFAULTS, ...(falt ?? {}) };
}
