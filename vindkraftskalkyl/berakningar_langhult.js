/* ============================================================================
   berakningar_langhult.js
   ----------------------------------------------------------------------------
   Kopia av berakningar.js, anpassad till fallet vindpark Långhult
   (Jönköpings och Gislaveds kommuner). Originalet (berakningar.js) är oförändrat.

   Vad som är nytt jämfört med originalet:
     1. Indata hämtas ur promemorian (PM) "Intäktsdelning och ersättningar:
        Vindpark Långhult" (Westander Klimat och Energi, 2026-04-20):
        20 verk, 6,6 MW, 3 610 fullasttimmar, 270 m, 50 öre/kWh, vikt 0,75, 30 år.
     2. Närboendeersättningen följer lagtexten som PM:et återger: fem zoner
        (2,5 / 2,0 / 1,5 / 1,0 / 0,5 promille av ETT VERKS intäkt), ersättning
        från de två närmaste verken, och ett tak på 2 % av parkens intäkter.
        Originalets linjära schablon mellan 5 och 9 verkshöjder är borttagen.
     3. Fastighetsskatt och bygdemedel är projektkostnader (PM bilaga 1, avsnitt 4).
        Kommunstödet (cirka 20 000 kr/MW) betalas av staten och dras INTE från
        projektets resultat. Originalets schablon "kommunal ersättning" är borttagen.
     4. Realiserat pris = spotpris × viktning (0,75, "kannibalisering").
     5. Nya tabeller: projektets ekonomi, närboende per zon, känslighet för elpris
        och en kontroll mot PM:ets egna tal.

   Märkning av indata i gränssnittet:
     PM         = uppgift hämtad ur PM:et (sida anges)
     lagstadgat = lagtext, återgiven ur PM:et
     antagande  = Kents standardvärde eller en förenkling, inte ur PM:et

   Koden är skriven i "vanilla" JavaScript (ES2020-nivå). Ingen data skickas
   någonstans: all beräkning sker i webbläsaren.
   ============================================================================ */

'use strict';

/* ============================================================================
   DEL 0 – HJÄLPFUNKTIONER
   ============================================================================ */

/** Hämtar det numeriska värdet ur ett indatafält via dess id (0 om tomt). */
function tal(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return Number.isFinite(v) ? v : 0;
}

/** Hämtar textvärdet (t.ex. för select) via id. */
function text(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/**
 * Formaterar ett tal med svenska tusentalsavgränsare (toLocaleString('sv-SE')).
 * @param {number} v      talet
 * @param {number} dec    antal decimaler
 * @param {string} suffix enhet efter talet, t.ex. " kr/år"
 */
function fmt(v, dec = 0, suffix = '') {
  if (!Number.isFinite(v)) return '–';
  const str = v.toLocaleString('sv-SE', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
  return str + suffix;
}

/** Miljoner kronor med en decimal, t.ex. "3,6 Mkr". */
function fmtMkr(v, dec = 1) {
  return fmt(v / 1e6, dec, ' Mkr');
}

/* ============================================================================
   DEL 1 – FINANSIELLA HJÄLPFUNKTIONER (oförändrade från originalet)
   ============================================================================ */

/** Annuitet: kapitalkostnad = Investering × r / (1 − (1 + r)^(−n)). */
function annuitet(investering, r, n) {
  if (r === 0) return investering / n;
  return investering * r / (1 - Math.pow(1 + r, -n));
}

/** Nettonuvärde: NPV = Σ CF_t / (1 + r)^t, där CF_0 är år 0. */
function npv(r, cashflows) {
  let summa = 0;
  for (let t = 0; t < cashflows.length; t++) {
    summa += cashflows[t] / Math.pow(1 + r, t);
  }
  return summa;
}

/** Internränta (IRR) med bisektion mellan −90 % och +100 %. NaN om ingen rot. */
function irr(cashflows) {
  const f = (r) => npv(r, cashflows);
  let lo = -0.9, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-6) return mid;
    if (flo * fmid < 0) { hi = mid; fhi = fmid; }
    else { lo = mid; flo = fmid; }
  }
  return (lo + hi) / 2;
}

/** Enkel payback på nominella kassaflöden. null om aldrig återbetald. */
function payback(cashflows) {
  let kum = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const foreg = kum;
    kum += cashflows[t];
    if (kum >= 0 && t > 0) {
      const andel = foreg < 0 ? (-foreg / (kum - foreg)) : 0;
      return (t - 1) + andel;
    }
  }
  return null;
}

/* ============================================================================
   DEL 1.5 – KONSTANTER FRÅN PM OCH LAGTEXT
   ----------------------------------------------------------------------------
   Sidhänvisningar gäller PM:ets egen sidnumrering (sidnummer längst upp).
   ============================================================================ */

/** Livslängd som PM:et räknar med (s. 3, 17–18). Används för fastighetsskattens
    jämnade slutperiod, se fastighetsskattPerVerk(). */
const PM_LIVSLANGD = 30;

/**
 * De fem avståndszonerna (lagtext återgiven ur PM:et s. 14–15, "12 §").
 * `till` anges i antal verkshöjder: 5, 6, 7, 8 och 9. Andelen är promille av
 * ETT VERKS intäkt. Första zonen börjar vid verket (0).
 */
const ZONER = [
  { fran: 0, till: 5, promille: 2.5 },
  { fran: 5, till: 6, promille: 2.0 },
  { fran: 6, till: 7, promille: 1.5 },
  { fran: 7, till: 8, promille: 1.0 },
  { fran: 8, till: 9, promille: 0.5 }
];

/** Elpriser (kr/kWh) för känslighetstabellerna. PM:et visar 30–70 öre. 100 öre
    är tillagt som ett högt scenario (antagande, inte ur PM:et). */
const PRISER = [0.30, 0.40, 0.50, 0.60, 0.70, 1.00];

/** PM:ets egna tal, för kontrolltabellen (Tabell 6). Enhet kr om inget annat. */
const PM_REF = {
  produktionVerkGWh: 23.8,                         // s. 11, 16
  zonVerk50: [22300, 17900, 13400, 8900, 4500],    // Tabell 2 i PM:et, s. 16, 50 öre
  narboendeAr: 3.6e6,                              // s. 3, 4, 16
  narboende30: 107e6,                              // s. 3, 16
  snittBostad: 18000,                              // "drygt 18 000", s. 4
  bostader: 200,                                   // "~200", s. 4, 16
  kommunstodGislavedAr: 0.9e6,                     // s. 3, 9
  kommunstodGislaved30: 27.7e6,                    // s. 3, 9
  fskattVerkAr1: 334398,                           // bilaga 1, s. 17–18
  fskatt7Ar1: 2.3e6,                               // s. 4, 18
  fskatt7_30: 46.5e6,                              // s. 3, 4, 18
  bygdemedelAr: 400000,                            // s. 3, 4, 12
  bygdemedel30: 12e6                               // s. 12
};

/* ============================================================================
   DEL 2 – LÄSA INDATA
   ============================================================================ */

function lasIndata() {
  return {
    // Anläggning (PM)
    antalverk:        Math.max(1, Math.round(tal('antalverk'))),
    effekt:           tal('effekt'),                   // MW per verk
    fullasttimmar:    tal('fullasttimmar'),            // h/år
    verkshojd:        tal('verkshojd'),                // m
    livslangd:        Math.max(1, Math.round(tal('livslangd'))),
    elpris:           tal('elpris'),                   // spotpris, kr/kWh
    viktning:         tal('viktning'),                 // 0,75
    elprisforandring: tal('elprisforandring') / 100,
    degradering:      tal('degradering') / 100,

    // Investering och drift (antagande)
    specinv:          tal('specinv'),                  // kkr/MW
    kalkylranta:      tal('kalkylranta'),
    rorlig:           tal('rorlig'),                   // kr/kWh
    fast:             tal('fast'),                     // kr/MW/år
    nedmontering:     tal('nedmontering'),             // kkr/MW
    restvarde:        tal('restvarde'),                // kkr/MW

    // Markägare (antagande)
    arrendemodell:    text('arrendemodell'),
    arrendeprocent:   tal('arrendeprocent') / 100,
    arrendekrmw:      tal('arrendekrmw'),

    // Kommun, bygd och skatt (PM)
    fskatt1:          tal('fskatt1'),                  // kr/verk/år, första åren
    fskattaar:        Math.max(0, Math.round(tal('fskattaar'))),
    fskattotal:       tal('fskattotal'),               // kr/verk över 30 år
    bygdemedel:       tal('bygdemedel'),               // kr/år, hela parken
    kommunstod:       tal('kommunstod'),               // kr/MW/år (staten betalar)
    verkgislaved:     Math.max(0, Math.round(tal('verkgislaved'))),
    co2faktor:        tal('co2faktor'),
    co2varde:         tal('co2varde'),

    // Närboende
    bost:             [1, 2, 3, 4, 5].map(i => Math.max(0, Math.round(tal('bost' + i)))),
    verkperbostad:    Math.min(2, Math.max(1, Math.round(tal('verkperbostad')))),
    tak:              tal('tak') / 100,                // % av parkens intäkt

    // Andelsägare (antagande)
    antalandelar:     tal('antalandelar'),
    kwhperandel:      tal('kwhperandel'),
    insatsperandel:   tal('insatsperandel'),
    driftpaslag:      tal('driftpaslag'),
    spotpris:         tal('spotpris'),
    elhandelspaslag:  tal('elhandelspaslag'),
    energiskatt:      tal('energiskatt'),
    momssats:         tal('momssats') / 100
  };
}

/* ============================================================================
   DEL 3 – BERÄKNINGAR
   ============================================================================ */

/**
 * Fastighetsskatt per verk och år (kr).
 * PM:et anger (bilaga 1): 334 398 kr per verk de första fyra åren och 46,5 Mkr
 * för sju verk över 30 år, alltså cirka 6,64 Mkr per verk. PM:ets tabell med
 * nedskrivningsfaktorer ger sänkningen i steg; den här kalkylen FÖRENKLAR genom
 * att jämna ut resten: (totalsumma − första åren) fördelas lika över övriga år.
 */
function fastighetsskattPerVerk(t, d) {
  if (t <= d.fskattaar) return d.fskatt1;
  const kvar = Math.max(1, PM_LIVSLANGD - d.fskattaar);
  return Math.max(0, (d.fskattotal - d.fskattaar * d.fskatt1) / kvar);
}

/**
 * Närboendeersättning ett givet år.
 * @param {number} verkIntakt  ett verks intäkt (kr/år) = parkens intäkt / antal verk
 * @param {number} parkIntakt  parkens intäkt (kr/år)
 * @param {object} d           indata
 * Lagtext (återgiven ur PM:et):
 *   - andelen av ETT VERKS intäkt beror på avståndet (fem zoner, promille)
 *   - en bostad får ersättning från högst de två verk som ger mest
 *   - sammanlagt högst 2 % av anläggningens intäkter; överskjutande del
 *     sätts ned i proportion till respektive ägares andel
 */
function beraknaNarboende(verkIntakt, parkIntakt, d) {
  const perBostadFore = ZONER.map(z => (z.promille / 1000) * verkIntakt * d.verkperbostad);
  const zonFore = perBostadFore.map((v, i) => v * d.bost[i]);
  const fore = zonFore.reduce((a, b) => a + b, 0);
  const cap = d.tak * parkIntakt;
  const utbetalt = Math.min(fore, cap);
  const skal = fore > cap && fore > 0 ? cap / fore : 1;
  const perBostadEfter = perBostadFore.map(v => v * skal);
  const zonEfter = zonFore.map(v => v * skal);
  const antal = d.bost.reduce((a, b) => a + b, 0);
  return {
    perBostadFore, perBostadEfter, zonFore, zonEfter,
    fore, cap, utbetalt, skal, antal,
    taketNas: fore > cap,
    snitt: antal > 0 ? utbetalt / antal : 0
  };
}

function beraknaAllt(d) {
  const r = d.kalkylranta;
  const n = d.livslangd;
  const P_tot = d.effekt * d.antalverk;                     // MW, hela parken

  /* ---------- 3.1 Produktion och investerarens grundstorheter ------------- */
  // Produktion per verk år 1 = effekt (kW) × fullasttimmar (PM: 6,6 MW × 3 610 h).
  const prodVerkkWh_ar1 = d.effekt * 1000 * d.fullasttimmar;
  const produktionkWh_ar1 = prodVerkkWh_ar1 * d.antalverk;
  const produktionMWh_ar1 = produktionkWh_ar1 / 1000;

  // Realiserat pris = spotpris × viktning (PM s. 12, 16: 0,75).
  const realPris_ar1 = d.elpris * d.viktning;
  const intaktAr1 = produktionkWh_ar1 * realPris_ar1;

  const driftkostnadAr1 = produktionkWh_ar1 * d.rorlig + d.fast * P_tot;
  const investering = d.specinv * 1000 * P_tot;
  const invPerkWh = produktionkWh_ar1 > 0 ? investering / produktionkWh_ar1 : 0;
  const kapitalkostnad = annuitet(investering, r, n);
  const totalkostnad = driftkostnadAr1 + kapitalkostnad;
  const kostnadPerkWh = produktionkWh_ar1 > 0 ? totalkostnad / produktionkWh_ar1 : 0;
  const overskott = intaktAr1 - totalkostnad;

  /* ---------- 3.2 Årsserier ----------------------------------------------- */
  const prodkWhAr = [];
  const intaktAr = [];
  const driftAr = [];
  for (let t = 1; t <= n; t++) {
    const spot = d.elpris * Math.pow(1 + d.elprisforandring, t - 1);
    const prod = produktionkWh_ar1 * Math.pow(1 - d.degradering, t - 1);
    prodkWhAr.push(prod);
    intaktAr.push(prod * spot * d.viktning);
    driftAr.push(prod * d.rorlig + d.fast * P_tot);
  }

  /* ---------- 3.3 Markägare ---------------------------------------------- */
  const arrendeAr = [];
  for (let t = 0; t < n; t++) {
    arrendeAr.push(d.arrendemodell === 'procent'
      ? intaktAr[t] * d.arrendeprocent
      : d.arrendekrmw * P_tot);
  }
  const arrendeAr1 = arrendeAr[0] || 0;
  const arrendeTotal = arrendeAr.reduce((a, b) => a + b, 0);
  const arrendeNuvarde = arrendeAr.reduce((s, v, i) => s + v / Math.pow(1 + r, i + 1), 0);

  /* ---------- 3.4 Fastighetsskatt och bygdemedel (projektkostnader, PM) ---- */
  const fskattAr = [];     // hela parken, kr/år
  const bygdeAr = [];
  for (let t = 1; t <= n; t++) {
    fskattAr.push(fastighetsskattPerVerk(t, d) * d.antalverk);
    bygdeAr.push(d.bygdemedel);
  }
  const fskattAr1 = fskattAr[0] || 0;
  const bygdeAr1 = bygdeAr[0] || 0;

  /* ---------- 3.5 Kommunstöd (betalas av staten, ingen projektkostnad) ----- */
  const kommunstodGisl = d.kommunstod * d.effekt * d.verkgislaved;
  const kommunstodJonk = d.kommunstod * d.effekt * Math.max(0, d.antalverk - d.verkgislaved);
  // Om kommunen i stället fick den faktiska fastighetsskatten (PM s. 8–9):
  const fskattGislAr1 = fastighetsskattPerVerk(1, d) * d.verkgislaved;
  let fskattGislTotal = 0;
  for (let t = 1; t <= n; t++) fskattGislTotal += fastighetsskattPerVerk(t, d) * d.verkgislaved;

  /* ---------- 3.6 Närboende --------------------------------------------- */
  const narAr = [];                                    // objekt per år
  for (let t = 0; t < n; t++) {
    narAr.push(beraknaNarboende(intaktAr[t] / d.antalverk, intaktAr[t], d));
  }
  const nar1 = narAr[0];
  const narboendeAr = narAr.map(x => x.utbetalt);
  const narboendeAr1 = nar1.utbetalt;
  const narboendeTotal = narboendeAr.reduce((a, b) => a + b, 0);

  /* ---------- 3.7 Kassaflöde, LCOE, NPV, IRR, payback --------------------- */
  const nedmonteringTot = d.nedmontering * 1000 * P_tot;
  const restvardeTot = d.restvarde * 1000 * P_tot;

  const cf = [-investering];
  for (let t = 0; t < n; t++) {
    let netto = intaktAr[t] - driftAr[t] - arrendeAr[t] - fskattAr[t] - bygdeAr[t] - narboendeAr[t];
    if (t === n - 1) netto += restvardeTot - nedmonteringTot;
    cf.push(netto);
  }
  const npvInvest = npv(r, cf);
  const irrInvest = irr(cf);
  const paybackInvest = payback(cf);

  // Överskott år 1 efter ALLA lokala poster och skatt.
  const overskottNetto = intaktAr1 - totalkostnad - arrendeAr1 - fskattAr1 - bygdeAr1 - narboendeAr1;

  // LCOE (oförändrad definition: investering + drift + nedmontering − restvärde,
  // delat med diskonterad energi; arrende, skatt, bygdemedel och närboende ingår inte).
  let disKostnad = investering;
  let disEnergi = 0;
  for (let t = 1; t <= n; t++) {
    disKostnad += driftAr[t - 1] / Math.pow(1 + r, t);
    disEnergi += prodkWhAr[t - 1] / Math.pow(1 + r, t);
  }
  disKostnad += nedmonteringTot / Math.pow(1 + r, n);
  disKostnad -= restvardeTot / Math.pow(1 + r, n);
  const lcoe = disEnergi > 0 ? disKostnad / disEnergi : 0;

  /* ---------- 3.8 Livstidssummor för Tabell 1 ----------------------------- */
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const livs = {
    prodMWh: sum(prodkWhAr) / 1000,
    intakt: sum(intaktAr),
    drift: sum(driftAr),
    kapital: kapitalkostnad * n,
    arrende: arrendeTotal,
    fskatt: sum(fskattAr),
    bygde: sum(bygdeAr),
    narboende: narboendeTotal,
    nedRest: restvardeTot - nedmonteringTot
  };
  livs.overskott = livs.intakt - livs.drift - livs.kapital - livs.arrende
                 - livs.fskatt - livs.bygde - livs.narboende + livs.nedRest;

  /* ---------- 3.9 Kommun/samhälle: sammanställning ------------------------ */
  const lokalaAr1 = arrendeAr1 + bygdeAr1 + narboendeAr1;           // betalas av projektet
  const lokalaTotal = arrendeTotal + livs.bygde + narboendeTotal;
  const co2Ton = produktionkWh_ar1 * d.co2faktor / 1000;
  const samhallsnytta = produktionkWh_ar1 * d.co2faktor * d.co2varde;

  /* ---------- 3.10 Andelsägare (oförändrad logik) ------------------------- */
  const elmangd = d.antalandelar * d.kwhperandel;
  const totalInsats = d.antalandelar * d.insatsperandel;
  const sjalvkostnadkWh = kostnadPerkWh + d.driftpaslag / 100;
  const marknadsprisAr1 = (d.spotpris + d.elhandelspaslag + d.energiskatt) * (1 + d.momssats);
  const besparingAr1 = elmangd * (marknadsprisAr1 - sjalvkostnadkWh);
  const alternativkostnad = totalInsats * r;
  const nettoAr1 = besparingAr1 - alternativkostnad;
  const aterbetalning = besparingAr1 > 0 ? totalInsats / besparingAr1 : null;
  let nuvardeAndel = -totalInsats;
  for (let t = 1; t <= n; t++) {
    const spot_t = d.spotpris * Math.pow(1 + d.elprisforandring, t - 1);
    const marknad_t = (spot_t + d.elhandelspaslag + d.energiskatt) * (1 + d.momssats);
    nuvardeAndel += elmangd * (marknad_t - sjalvkostnadkWh) / Math.pow(1 + r, t);
  }

  return {
    // Anläggning
    P_tot, prodVerkkWh_ar1, realPris_ar1,
    // Investerare
    produktionMWh_ar1, intaktAr1, driftkostnadAr1, investering, invPerkWh,
    kapitalkostnad, totalkostnad, kostnadPerkWh, overskott, overskottNetto,
    lcoe, paybackInvest, npvInvest, irrInvest, cf, livs,
    // Markägare
    arrendeAr1, arrendeTotal, arrendeNuvarde,
    // Skatt och bygd
    fskattAr1, bygdeAr1,
    // Kommun
    kommunstodGisl, kommunstodJonk, fskattGislAr1, fskattGislTotal,
    lokalaAr1, lokalaTotal, co2Ton, samhallsnytta,
    // Närboende
    nar: nar1, narboendeAr1, narboendeTotal,
    // Andelsägare
    elmangd, totalInsats, sjalvkostnadkWh, marknadsprisAr1, besparingAr1,
    alternativkostnad, nettoAr1, aterbetalning, nuvardeAndel,
    // Diagram
    driftAr1: driftkostnadAr1
  };
}

/* ============================================================================
   DEL 4 – PRESENTATION
   ============================================================================ */

function satt(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/** Källmärken (statisk, egen text – ingen användardata). */
const M = {
  pm:   (s) => '<span class="badge pm">PM</span> ' + s,
  lag:  (s) => '<span class="badge lagstadgat">lagstadgat</span> ' + s,
  ant:  (s) => '<span class="badge antagande">antagande</span> ' + s,
  ber:  (s) => '<span class="badge beraknat">beräknat</span> ' + s
};

/** Lägger till en tabellrad. `celler` = lista av {t: text} eller {h: html}. */
function laggRad(kropp, celler, klass) {
  const tr = document.createElement('tr');
  if (klass) tr.className = klass;
  celler.forEach((c, i) => {
    const td = document.createElement('td');
    if (c.h !== undefined) td.innerHTML = c.h; else td.textContent = c.t;
    if (c.k) td.className = c.k;
    tr.appendChild(td);
  });
  kropp.appendChild(tr);
}

function zonEtikett(z, H) {
  const fran = z.fran === 0 ? '0' : fmt(z.fran * H, 0);
  return fran + '–' + fmt(z.till * H, 0) + ' m';
}

/* ---- Tabell 1: projektets ekonomi ---- */
function ritaTabell1(res, d) {
  const k = document.getElementById('t1-kropp');
  if (!k) return;
  k.innerHTML = '';
  const L = res.livs;
  const neg = (v) => fmt(-v, 0);
  laggRad(k, [{t: 'Produktion (MWh)'}, {t: fmt(res.produktionMWh_ar1, 0), k: 'tal'}, {t: fmt(L.prodMWh, 0), k: 'tal'},
    {h: M.pm('6,6 MW × 3 610 fullasttimmar × 20 verk (s. 11, 16)')}]);
  laggRad(k, [{t: 'Intäkt (spotpris × viktning)'}, {t: fmt(res.intaktAr1, 0), k: 'tal'}, {t: fmt(L.intakt, 0), k: 'tal'},
    {h: M.pm('50 öre/kWh och vikt 0,75 (s. 12, 16)')}]);
  laggRad(k, [{t: 'Driftskostnad (rörlig + fast)'}, {t: neg(res.driftkostnadAr1), k: 'tal'}, {t: neg(L.drift), k: 'tal'},
    {h: M.ant('kalkylens standardvärden, ej ur PM:et')}]);
  laggRad(k, [{t: 'Kapitalkostnad (annuitet)'}, {t: neg(res.kapitalkostnad), k: 'tal'}, {t: neg(L.kapital), k: 'tal'},
    {h: M.ant('investering och ränta ur kalkylens standardvärden, ej ur PM:et')}]);
  laggRad(k, [{t: 'Arrende till markägare'}, {t: neg(res.arrendeAr1), k: 'tal'}, {t: neg(L.arrende), k: 'tal'},
    {h: M.ant('3,5 % av bruttointäkten, ej ur PM:et')}]);
  laggRad(k, [{t: 'Fastighetsskatt'}, {t: neg(res.fskattAr1), k: 'tal'}, {t: neg(L.fskatt), k: 'tal'},
    {h: M.pm('334 398 kr/verk första fyra åren, 46,5 Mkr för sju verk på 30 år (bilaga 1, s. 17–18)') + ' ' + M.ant('resten jämnas ut')}]);
  laggRad(k, [{t: 'Bygdemedel'}, {t: neg(res.bygdeAr1), k: 'tal'}, {t: neg(L.bygde), k: 'tal'},
    {h: M.pm('minst 400 000 kr/år för hela parken (s. 4, 12)')}]);
  laggRad(k, [{t: 'Närboendeersättning (efter tak)'}, {t: neg(res.narboendeAr1), k: 'tal'}, {t: neg(L.narboende), k: 'tal'},
    {h: M.lag('zoner, två verk, tak 2 %') + ' ' + M.ant('antal bostäder per zon')}]);
  laggRad(k, [{t: 'Nedmontering och restvärde'}, {t: '–', k: 'tal'}, {t: fmt(L.nedRest, 0), k: 'tal'},
    {h: M.ant('nedmontering 600 kkr/MW, restvärde 0, ej ur PM:et')}]);
  laggRad(k, [{t: 'Överskott efter allt'}, {t: fmt(res.overskottNetto, 0), k: 'tal'}, {t: fmt(L.overskott, 0), k: 'tal'},
    {h: M.ber('intäkt minus alla kostnadsposter ovan')}], 'summa');
  laggRad(k, [{t: 'Betalas av staten, inte av projektet (information)'}, {t: ''}, {t: ''}, {t: ''}], 'delrubrik');
  laggRad(k, [{t: 'Kommunstöd till Gislaveds kommun (' + d.verkgislaved + ' verk)'}, {t: fmt(res.kommunstodGisl, 0), k: 'tal'},
    {t: fmt(res.kommunstodGisl * d.livslangd, 0), k: 'tal'},
    {h: M.pm('cirka 20 000 kr per installerad MW (s. 7–9)')}]);
  laggRad(k, [{t: 'Kommunstöd till Jönköpings kommun (' + Math.max(0, d.antalverk - d.verkgislaved) + ' verk)'}, {t: fmt(res.kommunstodJonk, 0), k: 'tal'},
    {t: fmt(res.kommunstodJonk * d.livslangd, 0), k: 'tal'},
    {h: M.ber('samma schablon × MW i Jönköping (PM:et räknar bara Gislaved)')}]);
  laggRad(k, [{t: 'Om Gislaved fick den faktiska fastighetsskatten'}, {t: fmt(res.fskattGislAr1, 0), k: 'tal'}, {t: fmt(res.fskattGislTotal, 0), k: 'tal'},
    {h: M.pm('2,3 Mkr/år de första fyra åren, 46,5 Mkr totalt (s. 8–9, 18)')}]);
}

/* ---- Tabell 2: närboende per zon ---- */
function ritaTabell2(res, d) {
  const k = document.getElementById('t2-kropp');
  if (!k) return;
  k.innerHTML = '';
  const n = res.nar;
  ZONER.forEach((z, i) => {
    laggRad(k, [
      {t: 'Zon ' + (i + 1)},
      {t: zonEtikett(z, d.verkshojd) + (z.fran === 0 ? ' (inom ' + z.till + ' verkshöjder)' : ' (' + z.fran + '–' + z.till + ' verkshöjder)')},
      {t: fmt(z.promille, 1) + ' ‰', k: 'tal'},
      {t: fmt(d.bost[i], 0), k: 'tal'},
      {t: fmt(n.perBostadFore[i], 0), k: 'tal'},
      {t: fmt(n.perBostadEfter[i], 0), k: 'tal'},
      {t: fmt(n.zonEfter[i], 0), k: 'tal'}
    ]);
  });
  laggRad(k, [{t: 'Summa'}, {t: ''}, {t: ''}, {t: fmt(n.antal, 0), k: 'tal'}, {t: ''}, {t: ''}, {t: fmt(n.utbetalt, 0), k: 'tal'}], 'summa');
  satt('t2-fore', fmt(n.fore, 0, ' kr/år'));
  satt('t2-tak', fmt(n.cap, 0, ' kr/år'));
  satt('t2-skal', n.taketNas ? fmt(n.skal * 100, 1, ' % av beloppet före tak') : '100 % (taket nås inte)');
  satt('t2-snitt', fmt(n.snitt, 0, ' kr/bostad och år'));
  satt('t2-nas', n.taketNas ? 'Ja, taket nås och alla ersättningar sätts ned i proportion' : 'Nej, summan ligger under taket');
}

function skrivUt(res, d) {
  /* ---- Nyckeltalsrad ---- */
  satt('nt-lcoe', fmt(res.lcoe, 2, ' kr/kWh'));
  satt('nt-overskott', fmtMkr(res.overskottNetto) + '/år');
  satt('nt-payback', res.paybackInvest === null ? '> livslängd' : fmt(res.paybackInvest, 1, ' år'));
  satt('nt-npv', fmtMkr(res.npvInvest, 0));
  satt('nt-irr', Number.isFinite(res.irrInvest) ? fmt(res.irrInvest * 100, 1, ' %') : 'ej def.');
  satt('nt-narboende', fmtMkr(res.narboendeAr1, 2) + '/år');
  satt('nt-snitt', fmt(res.nar.snitt, 0, ' kr/bostad'));

  ritaTabell1(res, d);
  ritaTabell2(res, d);

  /* ---- Investerare ---- */
  satt('inv-produktion', fmt(res.produktionMWh_ar1, 0, ' MWh/år'));
  satt('inv-realpris', fmt(res.realPris_ar1, 3, ' kr/kWh'));
  satt('inv-intakt', fmt(res.intaktAr1, 0, ' kr/år'));
  satt('inv-driftkostnad', fmt(res.driftkostnadAr1, 0, ' kr/år'));
  satt('inv-investering', fmt(res.investering, 0, ' kr'));
  satt('inv-invperkwh', fmt(res.invPerkWh, 2, ' kr/årskWh'));
  satt('inv-kapitalkostnad', fmt(res.kapitalkostnad, 0, ' kr/år'));
  satt('inv-totalkostnad', fmt(res.totalkostnad, 0, ' kr/år'));
  satt('inv-kostnadperkwh', fmt(res.kostnadPerkWh, 2, ' kr/kWh'));
  satt('inv-overskott', fmt(res.overskott, 0, ' kr/år'));
  satt('inv-overskottnetto', fmt(res.overskottNetto, 0, ' kr/år'));
  satt('inv-lcoe', fmt(res.lcoe, 2, ' kr/kWh'));
  satt('inv-payback', res.paybackInvest === null ? '> livslängd' : fmt(res.paybackInvest, 1, ' år'));
  satt('inv-npv', fmt(res.npvInvest, 0, ' kr'));
  satt('inv-irr', Number.isFinite(res.irrInvest) ? fmt(res.irrInvest * 100, 1, ' %') : 'ej definierad');

  /* ---- Markägare ---- */
  satt('mark-arrende-ar', fmt(res.arrendeAr1, 0, ' kr/år'));
  satt('mark-arrende-total', fmt(res.arrendeTotal, 0, ' kr'));
  satt('mark-arrende-nuvarde', fmt(res.arrendeNuvarde, 0, ' kr'));

  /* ---- Kommun, bygd och samhälle ---- */
  satt('kom-lokala-ar', fmt(res.lokalaAr1, 0, ' kr/år'));
  satt('kom-lokala-total', fmt(res.lokalaTotal, 0, ' kr'));
  satt('kom-stod-gisl', fmt(res.kommunstodGisl, 0, ' kr/år'));
  satt('kom-stod-jonk', fmt(res.kommunstodJonk, 0, ' kr/år'));
  satt('kom-bygde', fmt(res.bygdeAr1, 0, ' kr/år'));
  satt('kom-co2-ton', fmt(res.co2Ton, 0, ' ton/år'));
  satt('kom-samhallsnytta', fmt(res.samhallsnytta, 0, ' kr/år'));

  /* ---- Andelsägare ---- */
  satt('and-elmangd', fmt(res.elmangd, 0, ' kWh/år'));
  satt('and-insats', fmt(res.totalInsats, 0, ' kr'));
  satt('and-sjalvkostnad', fmt(res.sjalvkostnadkWh, 2, ' kr/kWh'));
  satt('and-marknadspris', fmt(res.marknadsprisAr1, 2, ' kr/kWh'));
  satt('and-besparing', fmt(res.besparingAr1, 0, ' kr/år'));
  satt('and-alternativkostnad', fmt(res.alternativkostnad, 0, ' kr/år'));
  satt('and-netto', fmt(res.nettoAr1, 0, ' kr/år'));
  satt('and-aterbetalning', res.aterbetalning === null ? 'aldrig (ingen besparing)' : fmt(res.aterbetalning, 1, ' år'));
  satt('and-nuvarde', fmt(res.nuvardeAndel, 0, ' kr'));

  /* ---- Närboende (flik) ---- */
  const n = res.nar;
  satt('nar-verkintakt', fmt(res.intaktAr1 / d.antalverk, 0, ' kr/år'));
  satt('nar-fore', fmt(n.fore, 0, ' kr/år'));
  satt('nar-tak', fmt(n.cap, 0, ' kr/år'));
  satt('nar-total', fmt(n.utbetalt, 0, ' kr/år'));
  satt('nar-snitt', fmt(n.snitt, 0, ' kr/bostad och år'));
  satt('nar-total-livs', fmt(res.narboendeTotal, 0, ' kr'));
  satt('nar-bostader', fmt(n.antal, 0, ' st'));
  satt('nar-intaktsandel', res.intaktAr1 > 0 ? fmt(n.utbetalt / res.intaktAr1 * 100, 2, ' % av parkens intäkt') : '–');

  /* ---- Tabell 4–6 och diagram ---- */
  ritaKanslighet(d);
  ritaKontroll(res, d);
  uppdateraDiagram(res, d);
}

/* ---- Tabell 4: ett verk, zon × elpris (motsvarar PM:ets Tabell 2) ---- */
function ritaKanslighet(d) {
  const k4 = document.getElementById('t4-kropp');
  const k5 = document.getElementById('t5-kropp');
  if (k4) {
    k4.innerHTML = '';
    const prodVerk = d.effekt * 1000 * d.fullasttimmar;
    ZONER.forEach((z, i) => {
      const celler = [{t: zonEtikett(z, d.verkshojd)}];
      PRISER.forEach(p => {
        const verkIntakt = prodVerk * p * d.viktning;
        celler.push({t: fmt((z.promille / 1000) * verkIntakt, 0), k: 'tal'});
      });
      laggRad(k4, celler);
    });
  }
  /* ---- Tabell 5: hela projektet vid olika elpris ---- */
  if (k5) {
    k5.innerHTML = '';
    const rader = [
      ['Intäkt, hela parken (Mkr/år)', r => fmt(r.intaktAr1 / 1e6, 1)],
      ['Närboende före tak (Mkr/år)', r => fmt(r.nar.fore / 1e6, 2)],
      ['Tak 2 % (Mkr/år)', r => fmt(r.nar.cap / 1e6, 2)],
      ['Närboende utbetalt (Mkr/år)', r => fmt(r.nar.utbetalt / 1e6, 2)],
      ['Snitt per bostad (kr/år)', r => fmt(r.nar.snitt, 0)],
      ['Överskott efter allt, år 1 (Mkr)', r => fmt(r.overskottNetto / 1e6, 1)],
      ['Nettonuvärde (Mkr)', r => fmt(r.npvInvest / 1e6, 0)]
    ];
    const resPerPris = PRISER.map(p => beraknaAllt(Object.assign({}, d, { elpris: p })));
    rader.forEach(([namn, f]) => {
      const celler = [{t: namn}];
      resPerPris.forEach(r => celler.push({t: f(r), k: 'tal'}));
      laggRad(k5, celler);
    });
  }
}

/* ---- Tabell 6: kontroll mot PM:ets egna tal ---- */
function ritaKontroll(res, d) {
  const k = document.getElementById('t6-kropp');
  if (!k) return;
  k.innerHTML = '';
  const n = res.nar;
  // rakat och pm är TAL; formateringen sker här så att avvikelsen kan räknas.
  const rad = (namn, rakat, pm, sida, anm, dec = 0, decPm = dec) => {
    const avv = (Number.isFinite(rakat) && Number.isFinite(pm) && pm !== 0) ? (rakat - pm) / pm * 100 : NaN;
    laggRad(k, [{t: namn}, {t: fmt(rakat, dec), k: 'tal'}, {t: fmt(pm, decPm), k: 'tal'}, {t: sida},
      {t: Number.isFinite(avv) ? fmt(avv, 1, ' %') : '–', k: 'tal'}, {t: anm}]);
  };
  rad('Produktion per verk (GWh/år)', res.prodVerkkWh_ar1 / 1e6, PM_REF.produktionVerkGWh, 's. 11, 16', 'PM:et avrundar 23,826 till 23,8', 2, 1);
  ZONER.forEach((z, i) => {
    const verkIntakt = res.prodVerkkWh_ar1 * d.elpris * d.viktning;
    const v = (z.promille / 1000) * verkIntakt;
    rad('Zon ' + (i + 1) + ' per verk (kr/år, 50 öre)', v, PM_REF.zonVerk50[i], 'Tabell 2, s. 16', 'PM:et avrundar till hundratal');
  });
  rad('Närboende, hela parken (kr/år)', n.utbetalt, PM_REF.narboendeAr, 's. 3, 16', 'PM:et anger taket 2 %, avrundat till 3,6 Mkr');
  rad('Närboende på 30 år (kr)', res.narboendeTotal, PM_REF.narboende30, 's. 3, 16', 'Förutsätter 30 år och oförändrat pris');
  rad('Snitt per bostad (kr/år)', n.snitt, PM_REF.snittBostad, 's. 4', 'PM:et skriver "drygt 18 000"');
  rad('Antal bostäder (st)', n.antal, PM_REF.bostader, 's. 4, 16', 'PM:et skriver "cirka 200"; fördelningen på zoner är ett antagande');
  rad('Kommunstöd Gislaved (kr/år)', res.kommunstodGisl, PM_REF.kommunstodGislavedAr, 's. 3, 9', 'PM:et skriver "cirka 0,9 miljoner"');
  rad('Kommunstöd Gislaved, 30 år (kr)', res.kommunstodGisl * 30, PM_REF.kommunstodGislaved30, 's. 3, 9', 'PM:et skriver 27,7 Mkr');
  rad('Fastighetsskatt, sju verk, år 1 (kr)', res.fskattGislAr1, PM_REF.fskatt7Ar1, 's. 4, 18', 'PM:et skriver 2,3 Mkr');
  rad('Fastighetsskatt, sju verk, 30 år (kr)', res.fskattGislTotal, PM_REF.fskatt7_30, 's. 3, 18', 'Samma som PM:et genom konstruktion (summan är en indata)');
  rad('Bygdemedel, 30 år (kr)', res.bygdeAr1 * 30, PM_REF.bygdemedel30, 's. 12', 'Minst 400 000 kr/år enligt PM:et');
}

/* ============================================================================
   DEL 5 – DIAGRAM (Chart.js)
   ============================================================================ */

let diagramKassaflode = null;
let diagramKostnader = null;

function uppdateraDiagram(res, d) {
  if (typeof Chart === 'undefined') return;

  /* --- Diagram 1: kassaflöde per år --- */
  const arLabels = res.cf.map((_, i) => 'År ' + i);
  const kassaData = res.cf;
  const ctx1 = document.getElementById('diagram-kassaflode');
  if (ctx1) {
    if (diagramKassaflode) {
      diagramKassaflode.data.labels = arLabels;
      diagramKassaflode.data.datasets[0].data = kassaData;
      diagramKassaflode.data.datasets[0].backgroundColor = kassaData.map(v => v < 0 ? '#b3261e' : '#2e8b84');
      diagramKassaflode.update();
    } else {
      diagramKassaflode = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: arLabels,
          datasets: [{
            label: 'Netto kassaflöde (kr)',
            data: kassaData,
            backgroundColor: kassaData.map(v => v < 0 ? '#b3261e' : '#2e8b84')
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => fmt(c.parsed.y, 0, ' kr') } }
          },
          scales: { y: { ticks: { callback: (v) => v.toLocaleString('sv-SE') } } }
        }
      });
    }
  }

  /* --- Diagram 2: kostnadsnedbrytning år 1 --- */
  const kostLabels = ['Kapitalkostnad', 'Driftskostnad', 'Arrende', 'Fastighetsskatt', 'Bygdemedel', 'Närboendeersättning'];
  const kostData = [res.kapitalkostnad, res.driftAr1, res.arrendeAr1, res.fskattAr1, res.bygdeAr1, res.narboendeAr1];
  const ctx2 = document.getElementById('diagram-kostnader');
  if (ctx2) {
    if (diagramKostnader) {
      diagramKostnader.data.datasets[0].data = kostData;
      diagramKostnader.update();
    } else {
      diagramKostnader = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: kostLabels,
          datasets: [{
            data: kostData,
            backgroundColor: ['#1b5e5a', '#2e8b84', '#5b7fa6', '#c77f2e', '#7a5ca8', '#b3261e']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: (c) => c.label + ': ' + fmt(c.parsed, 0, ' kr/år') } }
          }
        }
      });
    }
  }
}

/* ============================================================================
   DEL 6 – JÄMFÖRELSETABELL (Tabell 3): Senaste / Tidigare / Förändring
   ----------------------------------------------------------------------------
   Minneslogik: vid varje bekräftad ändring (händelsen "change", alltså när
   fältet lämnas) flyttas "Senaste" till "Tidigare", nya värden beräknas och
   läggs i "Senaste", och differensen visas. Vid första beräkningen visas "–".
   ============================================================================ */

const JAMFOR_NYCKELTAL = [
  { etikett: 'Intäkt, hela parken (kr/år)',        hamta: r => r.intaktAr1,         dec: 0 },
  { etikett: 'Investeringsutgift (kr)',            hamta: r => r.investering,       dec: 0 },
  { etikett: 'Överskott efter allt, år 1 (kr)',    hamta: r => r.overskottNetto,    dec: 0 },
  { etikett: 'LCOE (kr/kWh)',                      hamta: r => r.lcoe,              dec: 3 },
  { etikett: 'NPV (kr)',                           hamta: r => r.npvInvest,         dec: 0 },
  { etikett: 'IRR (%)',                            hamta: r => r.irrInvest * 100,   dec: 1 },
  { etikett: 'Fastighetsskatt, år 1 (kr)',         hamta: r => r.fskattAr1,         dec: 0 },
  { etikett: 'Närboende utbetalt, hela parken (kr/år)', hamta: r => r.nar.utbetalt, dec: 0 },
  { etikett: 'Närboende, snitt per bostad (kr/år)', hamta: r => r.nar.snitt,        dec: 0 }
];

let senasteResultat = null;
let tidigareResultat = null;

function ritaJamforelse() {
  const kropp = document.getElementById('jamforelse-kropp');
  if (!kropp) return;
  kropp.innerHTML = '';

  JAMFOR_NYCKELTAL.forEach(nt => {
    const senasteVal = senasteResultat ? nt.hamta(senasteResultat) : NaN;
    const tidigareVal = tidigareResultat ? nt.hamta(tidigareResultat) : NaN;
    const tr = document.createElement('tr');

    const tdNamn = document.createElement('td');
    tdNamn.textContent = nt.etikett;
    tr.appendChild(tdNamn);

    const tdSenaste = document.createElement('td');
    tdSenaste.textContent = Number.isFinite(senasteVal) ? fmt(senasteVal, nt.dec) : '–';
    tr.appendChild(tdSenaste);

    const tdTidigare = document.createElement('td');
    tdTidigare.textContent = Number.isFinite(tidigareVal) ? fmt(tidigareVal, nt.dec) : '–';
    tr.appendChild(tdTidigare);

    const tdForandring = document.createElement('td');
    if (Number.isFinite(senasteVal) && Number.isFinite(tidigareVal)) {
      const diff = senasteVal - tidigareVal;
      tdForandring.textContent = (diff > 0 ? '+' : '') + fmt(diff, nt.dec);
      tdForandring.className = diff > 0 ? 'forandring-positiv' : (diff < 0 ? 'forandring-negativ' : 'forandring-neutral');
    } else {
      tdForandring.textContent = '–';
      tdForandring.className = 'forandring-neutral';
    }
    tr.appendChild(tdForandring);
    kropp.appendChild(tr);
  });
}

/* ============================================================================
   DEL 7 – REAKTIVITET (utan ramverk)
   "input" = räkna om medan man skriver. "change" = bekräfta ändringen och
   uppdatera jämförelsetabellen (Senaste → Tidigare).
   ============================================================================ */

function omrakna() {
  const d = lasIndata();
  const res = beraknaAllt(d);
  skrivUt(res, d);
  return res;
}

function kopplaLyssnare() {
  document.querySelectorAll('.indata').forEach(el => {
    el.addEventListener('input', () => { omrakna(); });
    el.addEventListener('change', () => {
      tidigareResultat = senasteResultat;
      senasteResultat = omrakna();
      ritaJamforelse();
    });
  });
}

/* ============================================================================
   DEL 8 – FLIKAR
   ============================================================================ */

function kopplaFlikar() {
  const knappar = document.querySelectorAll('.flik-knapp');
  knappar.forEach(knapp => {
    knapp.addEventListener('click', () => {
      const flik = knapp.getAttribute('data-flik');
      knappar.forEach(k => {
        k.classList.remove('aktiv');
        k.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.flik-panel').forEach(p => {
        p.classList.remove('aktiv');
        p.hidden = true;
      });
      knapp.classList.add('aktiv');
      knapp.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('panel-' + flik);
      if (panel) { panel.classList.add('aktiv'); panel.hidden = false; }
    });
  });
}

/* ============================================================================
   DEL 8.5 – TEKNIK-MODAL
   Öppnas av knappen, stängs av ×, klick utanför rutan eller Escape.
   ============================================================================ */

function kopplaTeknikModal() {
  const knapp = document.getElementById('teknik-knapp');
  const modal = document.getElementById('teknik-modal');
  const stang = document.getElementById('teknik-stang');
  if (!knapp || !modal || !stang) return;
  const oppna = () => { modal.hidden = false; };
  const stangModal = () => { modal.hidden = true; };
  knapp.addEventListener('click', oppna);
  stang.addEventListener('click', stangModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) stangModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) stangModal();
  });
}

/* ============================================================================
   DEL 8.6 – HÄNVISNINGAR OCH FÖRKLARINGAR
   ----------------------------------------------------------------------------
   Förklaringar (abbr.fk) visas vid hovring, tangentbordsfokus och tryck
   (tabindex="0"). Rutan ritas av CSS ur attributet data-f.
   Tryck på en förklaring på pekskärm ger fokus, och rutan visas.
   ============================================================================ */

function kopplaForklaringar() {
  document.querySelectorAll('abbr.fk').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); el.focus(); });
  });
}

/* ============================================================================
   DEL 9 – INITIERING
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  kopplaLyssnare();
  kopplaFlikar();
  kopplaTeknikModal();
  kopplaForklaringar();

  senasteResultat = omrakna();
  tidigareResultat = null;
  ritaJamforelse();
});
