/**
 * Tillåtna indatafält – exakt samma id:n som i ver2 (`lib/falt.js`).
 * Används av /api/scenario så att bara kända kalkylfält sparas och delas.
 *
 * Inga nya id:n i v1, inga borttagna (SPEC avsnitt 5).
 */
export const TILLATNA_FALT = [
  'elpris',
  'elomrade',
  'elprisforandring',
  'kapfaktor',
  'livslangd',
  'effekt',
  'antalverk',
  'verkshojd',
  'degradering',
  'specinv',
  'kalkylranta',
  'rorlig',
  'fast',
  'nedmontering',
  'restvarde',
  'arrendemodell',
  'arrendeprocent',
  'arrendekrmw',
  'kommunersattning',
  'co2faktor',
  'co2varde',
  'antalandelar',
  'kwhperandel',
  'insatsperandel',
  'driftpaslag',
  'spotpris',
  'elhandelspaslag',
  'energiskatt',
  'momssats',
  'avstand',
  'verkinom5',
  'antalbostader',
  'maxpromille',
] as const;

/** Fält-id som en union-typ, så att stavfel fångas av TypeScript. */
export type FaltId = (typeof TILLATNA_FALT)[number];

/** Rå fältbild: samma sak som ver2 skickar till /api/scenario (strängar). */
export type Falt = Partial<Record<FaltId, string>>;

/**
 * Samma validering som ver2:s `rensaFalt`: bara kända id:n, trimmade strängar,
 * max 40 tecken. Returnerar null om ingenting giltigt fanns kvar.
 */
export function rensaFalt(inFalt: unknown): Falt | null {
  if (!inFalt || typeof inFalt !== 'object') return null;
  const kalla = inFalt as Record<string, unknown>;
  const ut: Falt = {};
  for (const namn of TILLATNA_FALT) {
    if (!Object.prototype.hasOwnProperty.call(kalla, namn)) continue;
    const v = kalla[namn];
    if (v === null || v === undefined) continue;
    const text = String(v).trim();
    if (text.length > 40) continue;
    ut[namn] = text;
  }
  return Object.keys(ut).length ? ut : null;
}
