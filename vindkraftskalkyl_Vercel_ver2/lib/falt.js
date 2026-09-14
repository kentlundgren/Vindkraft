/**
 * Tillåtna indatafält – samma id:n som i index.html.
 * Används av /api/scenario så att bara kända kalkylfält sparas (ingen extra data).
 * Beräkningsformlerna ligger kvar i berakningar.js och rörs inte härifrån.
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
  'maxpromille'
];
