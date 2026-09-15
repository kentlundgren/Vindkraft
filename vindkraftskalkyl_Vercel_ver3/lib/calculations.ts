/* ============================================================================
   calculations.ts
   ----------------------------------------------------------------------------
   Port av `vindkraftskalkyl_Vercel_ver2/berakningar.js` (DEL 0–3) till ren
   TypeScript. Samma formler, samma tal – bara ny filform.

   Här skedde en uppdatering mot ver2: funktionerna läser INTE längre från DOM
   (`document.getElementById`). De tar ett vanligt objekt med strängvärden.
   Därför kan samma kod köras i webbläsaren, i en Route Handler och i OG-bilden.

   Presentation (satt/skrivUt/Chart.js) portas inte hit. Det är React:s jobb.
   Ingen ES2023-specifik syntax används.
   ============================================================================ */

// Explicit .ts-ändelse: så kan både Next.js och Node:s testlöpare resolva filen.
import type { Falt, FaltId } from './falt.ts';
import { DEFAULTS } from './defaults.ts';

/* ============================================================================
   DEL 0 – HJÄLPFUNKTIONER
   ============================================================================ */

/** Läser ett fält som tal. 0 om det saknas eller inte är ett tal (som ver2). */
function tal(falt: Partial<Record<FaltId, string>>, id: FaltId): number {
  const v = parseFloat(String(falt[id] ?? ''));
  return Number.isFinite(v) ? v : 0;
}

/** Läser ett fält som text (t.ex. select). Tom sträng om det saknas. */
function text(falt: Partial<Record<FaltId, string>>, id: FaltId): string {
  return falt[id] ?? '';
}

/**
 * Formaterar ett tal med svenska tusentalsavgränsare (`sv-SE`).
 * Används av UI och av OG-bilden, så den bor här och inte i en komponent.
 */
export function fmt(v: number, dec = 0, suffix = ''): string {
  if (!Number.isFinite(v)) return '–';
  const str = v.toLocaleString('sv-SE', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
  return str + suffix;
}

/* ============================================================================
   DEL 1 – FINANSIELLA HJÄLPFUNKTIONER
   ============================================================================ */

/**
 * Annuitet – Kents ursprungliga logik för årlig kapitalkostnad.
 * kapitalkostnad = Investering × r / (1 − (1 + r)^(−n))
 */
export function annuitet(investering: number, r: number, n: number): number {
  if (r === 0) return investering / n; // specialfall: 0 % ränta
  return (investering * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Nettonuvärde (NPV). cashflows[0] är år 0 (diskonteras inte).
 * NPV = Σ CF_t / (1 + r)^t
 */
export function npv(r: number, cashflows: number[]): number {
  let summa = 0;
  for (let t = 0; t < cashflows.length; t++) {
    summa += cashflows[t] / Math.pow(1 + r, t);
  }
  return summa;
}

/**
 * Internränta (IRR) – räntan där NPV = 0, löst med bisektion mellan −90 %
 * och +100 %. NaN om ingen teckenväxling finns i intervallet.
 */
export function irr(cashflows: number[]): number {
  const f = (r: number) => npv(r, cashflows);
  let lo = -0.9;
  let hi = 1.0;
  let flo = f(lo);
  const fhi = f(hi);
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-6) return mid; // tillräckligt nära noll
    if (flo * fmid < 0) {
      hi = mid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Enkel payback på nominella kassaflöden, med linjär interpolation inom det
 * år då kumulativa flödet passerar noll. null = betalar aldrig tillbaka sig.
 */
export function payback(cashflows: number[]): number | null {
  let kum = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const foreg = kum;
    kum += cashflows[t];
    if (kum >= 0 && t > 0) {
      const andel = foreg < 0 ? -foreg / (kum - foreg) : 0;
      return t - 1 + andel;
    }
  }
  return null;
}

/* ============================================================================
   DEL 2 – LÄSA INDATA
   ============================================================================ */

/** Färdigtolkad indata: procent är omräknade till andelar, som i ver2. */
export type Indata = {
  elpris: number;
  elomrade: string;
  elprisforandring: number;
  kapfaktor: number;
  livslangd: number;
  effekt: number;
  antalverk: number;
  verkshojd: number;
  degradering: number;
  specinv: number;
  kalkylranta: number;
  rorlig: number;
  fast: number;
  nedmontering: number;
  restvarde: number;
  arrendemodell: string;
  arrendeprocent: number;
  arrendekrmw: number;
  kommunersattning: number;
  co2faktor: number;
  co2varde: number;
  antalandelar: number;
  kwhperandel: number;
  insatsperandel: number;
  driftpaslag: number;
  spotpris: number;
  elhandelspaslag: number;
  energiskatt: number;
  momssats: number;
  avstand: number;
  verkinom5: number;
  antalbostader: number;
  maxpromille: number;
};

/**
 * Samma omvandlingar som ver2:s `lasIndata` – inklusive `/ 100` för procent
 * och `/ 1000` för promille. Saknade fält faller tillbaka på ver2:s defaults.
 */
export function lasIndata(inFalt?: Falt | null): Indata {
  const falt = { ...DEFAULTS, ...(inFalt ?? {}) };
  return {
    // Anläggning & investering
    elpris: tal(falt, 'elpris'),
    elomrade: text(falt, 'elomrade'),
    elprisforandring: tal(falt, 'elprisforandring') / 100, // %/år → andel
    kapfaktor: tal(falt, 'kapfaktor'),
    livslangd: Math.max(1, Math.round(tal(falt, 'livslangd'))),
    effekt: tal(falt, 'effekt'), // MW per verk
    antalverk: Math.max(1, Math.round(tal(falt, 'antalverk'))),
    verkshojd: tal(falt, 'verkshojd'),
    degradering: tal(falt, 'degradering') / 100, // %/år → andel
    specinv: tal(falt, 'specinv'), // kkr/MW
    kalkylranta: tal(falt, 'kalkylranta'),

    // Drift & livscykel
    rorlig: tal(falt, 'rorlig'), // kr/kWh
    fast: tal(falt, 'fast'), // kr/MW/år
    nedmontering: tal(falt, 'nedmontering'), // kkr/MW
    restvarde: tal(falt, 'restvarde'), // kkr/MW

    // Markägare
    arrendemodell: text(falt, 'arrendemodell'),
    arrendeprocent: tal(falt, 'arrendeprocent') / 100, // % → andel
    arrendekrmw: tal(falt, 'arrendekrmw'), // kr/MW/år

    // Kommun/samhälle
    kommunersattning: tal(falt, 'kommunersattning'), // kr/MW/år
    co2faktor: tal(falt, 'co2faktor'), // kg CO2/kWh
    co2varde: tal(falt, 'co2varde'), // kr/kg

    // Andelsägare
    antalandelar: tal(falt, 'antalandelar'),
    kwhperandel: tal(falt, 'kwhperandel'),
    insatsperandel: tal(falt, 'insatsperandel'),
    driftpaslag: tal(falt, 'driftpaslag'), // öre/kWh
    spotpris: tal(falt, 'spotpris'), // kr/kWh
    elhandelspaslag: tal(falt, 'elhandelspaslag'), // kr/kWh
    energiskatt: tal(falt, 'energiskatt'), // kr/kWh exkl moms
    momssats: tal(falt, 'momssats') / 100, // % → andel

    // Närboende (NU20)
    avstand: tal(falt, 'avstand'), // m
    verkinom5: Math.max(0, Math.round(tal(falt, 'verkinom5'))),
    antalbostader: Math.max(0, Math.round(tal(falt, 'antalbostader'))),
    maxpromille: tal(falt, 'maxpromille') / 1000, // ‰ → andel
  };
}

/* ============================================================================
   DEL 3 – SJÄLVA BERÄKNINGARNA
   ============================================================================ */

/** Allt som kalkylen räknar fram, i ett objekt (som ver2:s returvärde). */
export type Resultat = {
  // Investerare
  produktionMWh_ar1: number;
  intaktAr1: number;
  driftkostnadAr1: number;
  investering: number;
  invPerkWh: number;
  kapitalkostnad: number;
  totalkostnad: number;
  kostnadPerkWh: number;
  overskott: number;
  overskottNetto: number;
  lcoe: number;
  paybackInvest: number | null;
  npvInvest: number;
  irrInvest: number;
  cf: number[];

  // Markägare
  arrendeAr1: number;
  arrendeTotal: number;
  arrendeNuvarde: number;

  // Kommun/samhälle
  lokalaIntakterAr1: number;
  lokalaIntakterTotal: number;
  kommunAr: number;
  co2Ton: number;
  samhallsnytta: number;

  // Andelsägare
  elmangd: number;
  totalInsats: number;
  sjalvkostnadkWh: number;
  marknadsprisAr1: number;
  besparingAr1: number;
  alternativkostnad: number;
  nettoAr1: number;
  aterbetalning: number | null;
  nuvardeAndel: number;

  // Närboende
  femhojder: number;
  niohojder: number;
  inomZon: boolean;
  distansfaktor: number;
  narboendeEnskildAr1: number;
  narboendeTotalAr1: number;

  // Hjälpvärden till diagram/nedbrytning
  driftAr1: number;
  arrendeChart: number;
  kommunChart: number;
  narboendeChart: number;
};

export function beraknaAllt(d: Indata): Resultat {
  const r = d.kalkylranta;
  const n = d.livslangd;
  const P_tot = d.effekt * d.antalverk; // total effekt (MW)

  /* ---------- 3.1 Investerare: grundstorheter ----------------------------- */

  // Produktion år 1 i MWh: Effekt(MW) × 8760 h × kapacitetsfaktor.
  // 8760 är medvetet fast – inte 8784 för skottår (se SPEC avsnitt 4).
  const produktionMWh_ar1 = P_tot * 8760 * d.kapfaktor;
  const produktionkWh_ar1 = produktionMWh_ar1 * 1000;

  const intaktAr1 = produktionkWh_ar1 * d.elpris;
  const driftkostnadAr1 = produktionkWh_ar1 * d.rorlig + d.fast * P_tot;
  const investering = d.specinv * 1000 * P_tot;
  const invPerkWh = produktionkWh_ar1 > 0 ? investering / produktionkWh_ar1 : 0;
  const kapitalkostnad = annuitet(investering, r, n);
  const totalkostnad = driftkostnadAr1 + kapitalkostnad;
  const kostnadPerkWh =
    produktionkWh_ar1 > 0 ? totalkostnad / produktionkWh_ar1 : 0;
  const overskott = intaktAr1 - totalkostnad;

  /* ---------- 3.2 Årsserier för elpris, produktion, intäkt och drift ------
     Elpris år t    = elpris × (1 + elprisförändring)^(t−1)
     Produktion år t = produktion_år1 × (1 − degradering)^(t−1)            */
  const elprisAr: number[] = [];
  const prodkWhAr: number[] = [];
  const intaktAr: number[] = [];
  const driftAr: number[] = [];
  for (let t = 1; t <= n; t++) {
    const pris = d.elpris * Math.pow(1 + d.elprisforandring, t - 1);
    const prod = produktionkWh_ar1 * Math.pow(1 - d.degradering, t - 1);
    elprisAr.push(pris);
    prodkWhAr.push(prod);
    intaktAr.push(prod * pris);
    driftAr.push(prod * d.rorlig + d.fast * P_tot);
  }

  /* ---------- 3.3 Markägare: arrende (procent eller fast kr/MW/år) -------- */
  const arrendeAr: number[] = [];
  for (let t = 0; t < n; t++) {
    if (d.arrendemodell === 'procent') {
      arrendeAr.push(intaktAr[t] * d.arrendeprocent);
    } else {
      arrendeAr.push(d.arrendekrmw * P_tot);
    }
  }
  const arrendeAr1 = arrendeAr[0] || 0;
  const arrendeTotal = arrendeAr.reduce((a, b) => a + b, 0);
  const arrendeNuvarde = arrendeAr.reduce(
    (s, v, i) => s + v / Math.pow(1 + r, i + 1),
    0
  );

  /* ---------- 3.4 Kommunal ersättning (schablon) -------------------------- */
  const kommunAr = d.kommunersattning * P_tot; // kr/år, konstant

  /* ---------- 3.5 Närboende (NU20) ---------------------------------------
     Ersättningszon: bostäder inom 9 verkshöjder.
     Distansfaktor f: 1 inom 5 verkshöjder, linjärt avtagande till 0 vid 9.
     Bas B = årsintäkt per verk × antal verk inom fem verkshöjder.
     Ersättning per bostad = maxpromille × f × B (2,5 ‰ är lagens tak).     */
  const femhojder = 5 * d.verkshojd;
  const niohojder = 9 * d.verkshojd;

  let distansfaktor: number;
  if (d.avstand > niohojder) {
    distansfaktor = 0; // utanför zonen
  } else if (d.avstand <= femhojder) {
    distansfaktor = 1; // full ersättning nära
  } else {
    distansfaktor = (niohojder - d.avstand) / (niohojder - femhojder);
  }
  const inomZon = d.avstand <= niohojder;

  const narboendeEnskildAr: number[] = []; // kr/år till EN bostad
  const narboendeTotalAr: number[] = []; // kr/år som belastar utövaren
  for (let t = 0; t < n; t++) {
    const arsintaktPerVerk = intaktAr[t] / d.antalverk;
    const bas = arsintaktPerVerk * d.verkinom5;
    const enskild = d.maxpromille * distansfaktor * bas;
    narboendeEnskildAr.push(enskild);
    narboendeTotalAr.push(enskild * d.antalbostader);
  }
  const narboendeEnskildAr1 = narboendeEnskildAr[0] || 0;
  const narboendeTotalAr1 = narboendeTotalAr[0] || 0;

  /* ---------- 3.6 Kassaflöde, LCOE, NPV, IRR, payback --------------------
     Närboendeersättningen är en KOSTNADSPOST i investerarens kassaflöde.   */
  const nedmonteringTot = d.nedmontering * 1000 * P_tot; // kr, i slutet
  const restvardeTot = d.restvarde * 1000 * P_tot; // kr, i slutet

  const cf: number[] = [-investering]; // år 0: investeringen ut
  for (let t = 0; t < n; t++) {
    let netto =
      intaktAr[t] - driftAr[t] - arrendeAr[t] - kommunAr - narboendeTotalAr[t];
    if (t === n - 1) {
      netto += restvardeTot - nedmonteringTot;
    }
    cf.push(netto);
  }

  const npvInvest = npv(r, cf);
  const irrInvest = irr(cf);
  const paybackInvest = payback(cf);

  const overskottNetto =
    intaktAr1 - totalkostnad - arrendeAr1 - kommunAr - narboendeTotalAr1;

  /* LCOE: både kostnader och energi diskonteras (standardmetod).
     Inte tidsvägt eller annan diskontering än ver2 (SPEC avsnitt 4).       */
  let disKostnad = investering;
  let disEnergi = 0;
  for (let t = 1; t <= n; t++) {
    disKostnad += driftAr[t - 1] / Math.pow(1 + r, t);
    disEnergi += prodkWhAr[t - 1] / Math.pow(1 + r, t);
  }
  disKostnad += nedmonteringTot / Math.pow(1 + r, n);
  disKostnad -= restvardeTot / Math.pow(1 + r, n);
  const lcoe = disEnergi > 0 ? disKostnad / disEnergi : 0;

  /* ---------- 3.7 Kommun/samhälle ----------------------------------------- */
  const lokalaIntakterAr1 = arrendeAr1 + kommunAr + narboendeTotalAr1;
  let lokalaIntakterTotal = 0;
  for (let t = 0; t < n; t++) {
    lokalaIntakterTotal += arrendeAr[t] + kommunAr + narboendeTotalAr[t];
  }
  const co2Ton = (produktionkWh_ar1 * d.co2faktor) / 1000; // kg → ton
  const samhallsnytta = produktionkWh_ar1 * d.co2faktor * d.co2varde; // kr/år

  /* ---------- 3.8 Andelsägare (kooperativ modell) ------------------------- */
  const elmangd = d.antalandelar * d.kwhperandel;
  const totalInsats = d.antalandelar * d.insatsperandel;
  const sjalvkostnadkWh = kostnadPerkWh + d.driftpaslag / 100; // öre → kr
  const marknadsprisAr1 =
    (d.spotpris + d.elhandelspaslag + d.energiskatt) * (1 + d.momssats);
  const besparingAr1 = elmangd * (marknadsprisAr1 - sjalvkostnadkWh);
  const alternativkostnad = totalInsats * r;
  const nettoAr1 = besparingAr1 - alternativkostnad;
  const aterbetalning = besparingAr1 > 0 ? totalInsats / besparingAr1 : null;

  // Nuvärde för hushållet: −insats + Σ besparing_t/(1+r)^t.
  // Marknadspriset följer elprisbanan; självkostnaden hålls konstant (schablon).
  let nuvardeAndel = -totalInsats;
  for (let t = 1; t <= n; t++) {
    const spot_t = d.spotpris * Math.pow(1 + d.elprisforandring, t - 1);
    const marknad_t =
      (spot_t + d.elhandelspaslag + d.energiskatt) * (1 + d.momssats);
    const besp_t = elmangd * (marknad_t - sjalvkostnadkWh);
    nuvardeAndel += besp_t / Math.pow(1 + r, t);
  }

  /* ---------- 3.9 Returnera allt ----------------------------------------- */
  return {
    produktionMWh_ar1,
    intaktAr1,
    driftkostnadAr1,
    investering,
    invPerkWh,
    kapitalkostnad,
    totalkostnad,
    kostnadPerkWh,
    overskott,
    overskottNetto,
    lcoe,
    paybackInvest,
    npvInvest,
    irrInvest,
    cf,

    arrendeAr1,
    arrendeTotal,
    arrendeNuvarde,

    lokalaIntakterAr1,
    lokalaIntakterTotal,
    kommunAr,
    co2Ton,
    samhallsnytta,

    elmangd,
    totalInsats,
    sjalvkostnadkWh,
    marknadsprisAr1,
    besparingAr1,
    alternativkostnad,
    nettoAr1,
    aterbetalning,
    nuvardeAndel,

    femhojder,
    niohojder,
    inomZon,
    distansfaktor,
    narboendeEnskildAr1,
    narboendeTotalAr1,

    driftAr1: driftkostnadAr1,
    arrendeChart: arrendeAr1,
    kommunChart: kommunAr,
    narboendeChart: narboendeTotalAr1,
  };
}

/** Bekvämlighet: från rå fältbild (delad länk eller formulär) till resultat. */
export function raknaFranFalt(falt?: Falt | null): Resultat {
  return beraknaAllt(lasIndata(falt));
}
