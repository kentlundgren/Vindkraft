/* ============================================================================
   berakningar.js
   ----------------------------------------------------------------------------
   All BERÄKNINGS- och INTERAKTIONSLOGIK för vindkraftskalkylen.
   Presentationen (struktur/formatering) ligger i vindkraftskalkyl.html och
   stil.css. Denna fil ansvarar för att:

     1. Läsa alla indatafält.
     2. Utföra beräkningarna för de fem perspektiven.
     3. Skriva resultaten till gränssnittet.
     4. Sköta den REAKTIVA uppdateringen (helt utan React – se avsnitt längst ned).
     5. Hantera minnet för jämförelsetabellen (Senaste / Tidigare / Förändring).
     6. Rita och uppdatera diagram (Chart.js).

   Koden är skriven i "vanilla" JavaScript (ES2020-nivå). Inga ES2023-specifika
   funktioner används, så inga särskilda kommentarer om ES2023 behövs här.
   ============================================================================ */

'use strict';

/* ============================================================================
   DEL 0 – HJÄLPFUNKTIONER
   ============================================================================ */

/**
 * Hämtar det numeriska värdet ur ett indatafält via dess id.
 * Returnerar 0 om fältet saknas eller inte innehåller ett tal, så att
 * beräkningarna aldrig kraschar på tomma fält.
 */
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
 * Formaterar ett tal med svenska tusentalsavgränsare.
 * Använder toLocaleString('sv-SE') enligt kravet.
 * @param {number} v      talet
 * @param {number} dec    antal decimaler (default 0)
 * @param {string} suffix enhet som läggs efter, t.ex. " kr/år"
 */
function fmt(v, dec = 0, suffix = '') {
  if (!Number.isFinite(v)) return '–';
  const str = v.toLocaleString('sv-SE', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
  return str + suffix;
}

/* ============================================================================
   DEL 1 – FINANSIELLA HJÄLPFUNKTIONER
   ============================================================================ */

/**
 * Annuitet – Kent Lundgrens ursprungliga logik för årlig kapitalkostnad.
 * Formel:  kapitalkostnad = Investering × r / (1 − (1 + r)^(−n))
 * Detta fördelar investeringen jämnt över livslängden givet kalkylräntan.
 */
function annuitet(investering, r, n) {
  if (r === 0) return investering / n;               // specialfall: 0 % ränta
  return investering * r / (1 - Math.pow(1 + r, -n));
}

/**
 * Nettonuvärde (NPV) av en serie kassaflöden.
 * cashflows[0] är år 0 (diskonteras inte), cashflows[t] år t (diskonteras).
 * NPV = Σ  CF_t / (1 + r)^t
 */
function npv(r, cashflows) {
  let summa = 0;
  for (let t = 0; t < cashflows.length; t++) {
    summa += cashflows[t] / Math.pow(1 + r, t);
  }
  return summa;
}

/**
 * Internränta (IRR) – den ränta där NPV = 0.
 * Löses numeriskt med bisektion (robust och enkelt) mellan −90 % och +100 %.
 * Returnerar NaN om ingen teckenväxling hittas (t.ex. om projektet aldrig går
 * med vinst).
 */
function irr(cashflows) {
  const f = (r) => npv(r, cashflows);
  let lo = -0.9, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  // Om båda ändpunkterna har samma tecken finns ingen rot i intervallet.
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-6) return mid;           // tillräckligt nära noll
    if (flo * fmid < 0) { hi = mid; fhi = fmid; }
    else { lo = mid; flo = fmid; }
  }
  return (lo + hi) / 2;
}

/**
 * Enkel payback (återbetalningstid) på nominella (ej diskonterade) kassaflöden.
 * Går igenom kumulativt kassaflöde och interpolerar inom det år då summan
 * passerar noll. Returnerar null om investeringen aldrig betalar tillbaka sig.
 */
function payback(cashflows) {
  let kum = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const foreg = kum;
    kum += cashflows[t];
    if (kum >= 0 && t > 0) {
      // Linjär interpolation inom år t för en mjukare siffra.
      const andel = foreg < 0 ? (-foreg / (kum - foreg)) : 0;
      return (t - 1) + andel;
    }
  }
  return null;
}

/* ============================================================================
   DEL 2 – LÄSA INDATA
   Samlar alla indatafält i ett objekt. En central funktion så att övriga
   beräkningar alltid arbetar mot samma, färska ögonblicksbild av indata.
   ============================================================================ */

/** Schablonpriser per elområde (kr/kWh) som fylls i när området byts. */
const ELOMRADE_PRIS = { SE1: 0.30, SE2: 0.35, SE3: 0.55, SE4: 0.60 };

function lasIndata() {
  return {
    // Anläggning & investering
    elpris:           tal('elpris'),
    elomrade:         text('elomrade'),
    elprisforandring: tal('elprisforandring') / 100,   // %/år → andel
    kapfaktor:        tal('kapfaktor'),
    livslangd:        Math.max(1, Math.round(tal('livslangd'))),
    effekt:           tal('effekt'),                   // MW per verk
    antalverk:        Math.max(1, Math.round(tal('antalverk'))),
    verkshojd:        tal('verkshojd'),
    degradering:      tal('degradering') / 100,        // %/år → andel
    specinv:          tal('specinv'),                  // kkr/MW
    kalkylranta:      tal('kalkylranta'),

    // Drift & livscykel
    rorlig:           tal('rorlig'),                   // kr/kWh
    fast:             tal('fast'),                     // kr/MW/år
    nedmontering:     tal('nedmontering'),             // kkr/MW
    restvarde:        tal('restvarde'),                // kkr/MW

    // Markägare
    arrendemodell:    text('arrendemodell'),
    arrendeprocent:   tal('arrendeprocent') / 100,     // % → andel
    arrendekrmw:      tal('arrendekrmw'),              // kr/MW/år

    // Kommun/samhälle
    kommunersattning: tal('kommunersattning'),         // kr/MW/år
    co2faktor:        tal('co2faktor'),                // kg CO2/kWh
    co2varde:         tal('co2varde'),                 // kr/kg

    // Andelsägare
    antalandelar:     tal('antalandelar'),
    kwhperandel:      tal('kwhperandel'),
    insatsperandel:   tal('insatsperandel'),
    driftpaslag:      tal('driftpaslag'),              // öre/kWh
    spotpris:         tal('spotpris'),                 // kr/kWh
    elhandelspaslag:  tal('elhandelspaslag'),          // kr/kWh
    energiskatt:      tal('energiskatt'),              // kr/kWh exkl moms
    momssats:         tal('momssats') / 100,           // % → andel

    // Närboende (NU20)
    avstand:          tal('avstand'),                  // m
    verkinom5:        Math.max(0, Math.round(tal('verkinom5'))),
    antalbostader:    Math.max(0, Math.round(tal('antalbostader'))),
    maxpromille:      tal('maxpromille') / 1000        // ‰ → andel
  };
}

/* ============================================================================
   DEL 3 – SJÄLVA BERÄKNINGARNA (ett objekt med alla resultat)
   Här hålls beräkningslogiken helt skild från presentationen.
   ============================================================================ */

function beraknaAllt(d) {
  const r = d.kalkylranta;
  const n = d.livslangd;
  const P_tot = d.effekt * d.antalverk;               // total effekt (MW)

  /* ---------- 3.1 Investerare: grundstorheter (Kents ursprungslogik) -------- */

  // Produktion år 1 i MWh:  Effekt(MW) × 8760 h × kapacitetsfaktor
  const produktionMWh_ar1 = P_tot * 8760 * d.kapfaktor;
  const produktionkWh_ar1 = produktionMWh_ar1 * 1000;

  // Intäkt totalt per år (år 1):  produktion(kWh) × elpris
  const intaktAr1 = produktionkWh_ar1 * d.elpris;

  // Årlig driftskostnad (år 1):  rörlig × produktion(kWh) + fast × total effekt
  const driftkostnadAr1 = produktionkWh_ar1 * d.rorlig + d.fast * P_tot;

  // Investeringsutgift:  specifik investering(kkr/MW) × 1000 × total effekt(MW)
  const investering = d.specinv * 1000 * P_tot;

  // Investeringsutgift per årskWh:  investering / produktion(kWh) år 1
  const invPerkWh = produktionkWh_ar1 > 0 ? investering / produktionkWh_ar1 : 0;

  // Årlig kapitalkostnad (annuitet) – bevarar Kents ursprungliga logik.
  const kapitalkostnad = annuitet(investering, r, n);

  // Årlig total kostnad = driftskostnad + kapitalkostnad
  const totalkostnad = driftkostnadAr1 + kapitalkostnad;

  // Kostnad per kWh = total kostnad / produktion(kWh)
  const kostnadPerkWh = produktionkWh_ar1 > 0 ? totalkostnad / produktionkWh_ar1 : 0;

  // Överskott per år (bas) = intäkt − total kostnad  (som i ursprungskalkylen)
  const overskott = intaktAr1 - totalkostnad;

  /* ---------- 3.2 Årsserier för elpris, produktion, intäkt och drift -------
     Vi bygger vektorer per år (1..n) för att kunna räkna LCOE, NPV, IRR och
     payback korrekt med elprisbana och degradering.
     - Elpris år t   = elpris × (1 + elprisförändring)^(t−1)
     - Produktion år t = produktion_år1 × (1 − degradering)^(t−1)
  */
  const elprisAr = [];      // kr/kWh per år
  const prodkWhAr = [];     // kWh per år
  const intaktAr = [];      // kr per år
  const driftAr = [];       // kr per år
  for (let t = 1; t <= n; t++) {
    const pris = d.elpris * Math.pow(1 + d.elprisforandring, t - 1);
    const prod = produktionkWh_ar1 * Math.pow(1 - d.degradering, t - 1);
    elprisAr.push(pris);
    prodkWhAr.push(prod);
    intaktAr.push(prod * pris);
    driftAr.push(prod * d.rorlig + d.fast * P_tot);
  }

  /* ---------- 3.3 Markägare: arrende ---------------------------------------
     Två modeller: procent av bruttointäkt ELLER fast kr/MW/år.
  */
  const arrendeAr = [];     // kr per år
  for (let t = 0; t < n; t++) {
    if (d.arrendemodell === 'procent') {
      arrendeAr.push(intaktAr[t] * d.arrendeprocent);
    } else {
      arrendeAr.push(d.arrendekrmw * P_tot);
    }
  }
  const arrendeAr1 = arrendeAr[0] || 0;
  const arrendeTotal = arrendeAr.reduce((a, b) => a + b, 0);
  // Nuvärde av arrendet (diskonterat med kalkylräntan).
  const arrendeNuvarde = arrendeAr.reduce((s, v, i) => s + v / Math.pow(1 + r, i + 1), 0);

  /* ---------- 3.4 Kommunal ersättning (schablon) --------------------------- */
  const kommunAr = d.kommunersattning * P_tot;        // kr/år, konstant

  /* ---------- 3.5 Närboende (NU20) – beräknas här eftersom både närboende- och
     investerarperspektivet behöver den totala ersättningen ------------------
     Modell (delvis schablon – exakt kurva fastställs i förordning):
       - Ersättningszon: bostäder inom 9 verkshöjder får ersättning.
       - Distansfaktor f: 1 inom 5 verkshöjder, linjärt avtagande till 0 vid 9.
       - Bas B = årsintäkt per verk × antal verk inom fem verkshöjder.
       - Ersättning per bostad = maxpromille × f × B (maxpromille = 2,5 ‰ lag).
     Rimlighet: ~38 000 kr/år i SE4 och ~19 000 kr/år i SE1 vid ≥2 verk inom
     fem verkshöjder – vilket faller ut av modellen eftersom SE4-priset (0,60)
     är ungefär dubbelt SE1-priset (0,30).
  */
  const femhojder = 5 * d.verkshojd;
  const niohojder = 9 * d.verkshojd;

  // Distansfaktor beroende på avstånd (år-oberoende).
  let distansfaktor;
  if (d.avstand > niohojder) {
    distansfaktor = 0;                                 // utanför zonen
  } else if (d.avstand <= femhojder) {
    distansfaktor = 1;                                 // full ersättning nära
  } else {
    // Linjärt avtagande mellan 5 och 9 verkshöjder.
    distansfaktor = (niohojder - d.avstand) / (niohojder - femhojder);
  }
  const inomZon = d.avstand <= niohojder;

  // Bas per år = årsintäkt per verk (år t) × antal verk inom fem verkshöjder.
  // Årsintäkt per verk = intäkt totalt år t / antal verk.
  const narboendeEnskildAr = [];   // kr/år till EN bostad
  const narboendeTotalAr = [];     // kr/år som belastar verksamhetsutövaren
  for (let t = 0; t < n; t++) {
    const arsintaktPerVerk = intaktAr[t] / d.antalverk;
    const bas = arsintaktPerVerk * d.verkinom5;
    const enskild = d.maxpromille * distansfaktor * bas;
    narboendeEnskildAr.push(enskild);
    // Total = antal bostäder × ersättning per bostad (schablon).
    narboendeTotalAr.push(enskild * d.antalbostader);
  }
  const narboendeEnskildAr1 = narboendeEnskildAr[0] || 0;
  const narboendeTotalAr1 = narboendeTotalAr[0] || 0;

  /* ---------- 3.6 Investerarens kassaflöde, LCOE, NPV, IRR, payback ---------
     Netto per år = intäkt − drift − arrende − kommunal ersättning − närboende.
     Vi kopplar alltså tillbaka närboendeersättningen som en KOSTNADSPOST.
  */
  const nedmonteringTot = d.nedmontering * 1000 * P_tot;  // kr, i slutet
  const restvardeTot = d.restvarde * 1000 * P_tot;        // kr, i slutet

  const cf = [-investering];                          // år 0: investeringen ut
  for (let t = 0; t < n; t++) {
    let netto = intaktAr[t] - driftAr[t] - arrendeAr[t] - kommunAr - narboendeTotalAr[t];
    if (t === n - 1) {
      // Sista året: nedmontering (kostnad) och eventuellt restvärde (intäkt).
      netto += restvardeTot - nedmonteringTot;
    }
    cf.push(netto);
  }

  const npvInvest = npv(r, cf);
  const irrInvest = irr(cf);
  const paybackInvest = payback(cf);

  // Överskott efter lokala ersättningar (år 1) – jämförelse mot basöverskottet.
  const overskottNetto = intaktAr1 - totalkostnad - arrendeAr1 - kommunAr - narboendeTotalAr1;

  /* LCOE (Levelized Cost of Energy):
     LCOE = ( Investering + Σ drift_t/(1+r)^t + nedmontering/(1+r)^n − restvärde/(1+r)^n )
            / ( Σ energi_t(kWh)/(1+r)^t )
     Både kostnader och energi diskonteras – standardmetod. */
  let disKostnad = investering;
  let disEnergi = 0;
  for (let t = 1; t <= n; t++) {
    disKostnad += driftAr[t - 1] / Math.pow(1 + r, t);
    disEnergi += prodkWhAr[t - 1] / Math.pow(1 + r, t);
  }
  disKostnad += nedmonteringTot / Math.pow(1 + r, n);
  disKostnad -= restvardeTot / Math.pow(1 + r, n);
  const lcoe = disEnergi > 0 ? disKostnad / disEnergi : 0;

  /* ---------- 3.7 Kommun/samhälle: sammanställning ------------------------- */
  const lokalaIntakterAr1 = arrendeAr1 + kommunAr + narboendeTotalAr1;
  let lokalaIntakterTotal = 0;
  for (let t = 0; t < n; t++) {
    lokalaIntakterTotal += arrendeAr[t] + kommunAr + narboendeTotalAr[t];
  }
  const co2Ton = produktionkWh_ar1 * d.co2faktor / 1000;   // kg → ton
  const samhallsnytta = produktionkWh_ar1 * d.co2faktor * d.co2varde; // kr/år

  /* ---------- 3.8 Andelsägare (kooperativ modell) --------------------------
     - Årlig elmängd = antal andelar × kWh per andel.
     - Självkostnad/kWh = investerarens kostnad per kWh + föreningens driftpåslag.
     - Marknadspris hushållsel = (spot + elhandelspåslag + energiskatt) × (1 + moms).
     - Årlig besparing = elmängd × (marknadspris − självkostnad).
     - Alternativkostnad = bunden insats × kalkylränta (utebliven avkastning).
     - Nettoresultat = besparing − alternativkostnad.
  */
  const elmangd = d.antalandelar * d.kwhperandel;
  const totalInsats = d.antalandelar * d.insatsperandel;
  const sjalvkostnadkWh = kostnadPerkWh + d.driftpaslag / 100;   // öre → kr
  const marknadsprisAr1 = (d.spotpris + d.elhandelspaslag + d.energiskatt) * (1 + d.momssats);
  const besparingAr1 = elmangd * (marknadsprisAr1 - sjalvkostnadkWh);
  const alternativkostnad = totalInsats * r;
  const nettoAr1 = besparingAr1 - alternativkostnad;
  const aterbetalning = besparingAr1 > 0 ? totalInsats / besparingAr1 : null;

  // Nettonuvärde för hushållet: −insats + Σ besparing_t/(1+r)^t.
  // Marknadspriset följer elprisbanan (via spotpris-förändring antas samma bana),
  // självkostnaden hålls konstant (schablon).
  let nuvardeAndel = -totalInsats;
  for (let t = 1; t <= n; t++) {
    const spot_t = d.spotpris * Math.pow(1 + d.elprisforandring, t - 1);
    const marknad_t = (spot_t + d.elhandelspaslag + d.energiskatt) * (1 + d.momssats);
    const besp_t = elmangd * (marknad_t - sjalvkostnadkWh);
    nuvardeAndel += besp_t / Math.pow(1 + r, t);
  }

  /* ---------- 3.9 Returnera allt i ett strukturerat objekt ----------------- */
  return {
    // Investerare
    produktionMWh_ar1, intaktAr1, driftkostnadAr1, investering, invPerkWh,
    kapitalkostnad, totalkostnad, kostnadPerkWh, overskott, overskottNetto,
    lcoe, paybackInvest, npvInvest, irrInvest, cf,

    // Markägare
    arrendeAr1, arrendeTotal, arrendeNuvarde,

    // Kommun/samhälle
    lokalaIntakterAr1, lokalaIntakterTotal, kommunAr, co2Ton, samhallsnytta,

    // Andelsägare
    elmangd, totalInsats, sjalvkostnadkWh, marknadsprisAr1, besparingAr1,
    alternativkostnad, nettoAr1, aterbetalning, nuvardeAndel,

    // Närboende
    femhojder, niohojder, inomZon, distansfaktor,
    narboendeEnskildAr1, narboendeTotalAr1,

    // Hjälpvärden till diagram
    driftAr1: driftkostnadAr1, arrendeChart: arrendeAr1, kommunChart: kommunAr,
    narboendeChart: narboendeTotalAr1
  };
}

/* ============================================================================
   DEL 4 – PRESENTATION: SKRIV RESULTAT TILL GRÄNSSNITTET
   ============================================================================ */

/** Liten hjälpfunktion: sätter textinnehåll för ett element via id. */
function satt(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function skrivUt(res, d) {
  /* ---- Nyckeltalsrad (alltid synlig) ---- */
  satt('nt-lcoe', fmt(res.lcoe, 2, ' kr/kWh'));
  satt('nt-overskott', fmt(res.overskott, 0, ' kr/år'));
  satt('nt-payback', res.paybackInvest === null ? '> livslängd' : fmt(res.paybackInvest, 1, ' år'));
  satt('nt-npv', fmt(res.npvInvest, 0, ' kr'));
  satt('nt-irr', Number.isFinite(res.irrInvest) ? fmt(res.irrInvest * 100, 1, ' %') : 'ej def.');
  satt('nt-produktion', fmt(res.produktionMWh_ar1, 0, ' MWh/år'));

  /* ---- Investerare ---- */
  satt('inv-produktion', fmt(res.produktionMWh_ar1, 0, ' MWh/år'));
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

  /* ---- Kommun/samhälle ---- */
  satt('kom-lokala-ar', fmt(res.lokalaIntakterAr1, 0, ' kr/år'));
  satt('kom-lokala-total', fmt(res.lokalaIntakterTotal, 0, ' kr'));
  satt('kom-kommun-ar', fmt(res.kommunAr, 0, ' kr/år'));
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

  /* ---- Närboende ---- */
  satt('nar-femhojder', fmt(res.femhojder, 0, ' m'));
  satt('nar-niohojder', fmt(res.niohojder, 0, ' m'));
  satt('nar-inom', res.inomZon ? 'Ja' : 'Nej (utanför 9 verkshöjder)');
  satt('nar-faktor', fmt(res.distansfaktor, 2));
  satt('nar-enskild', fmt(res.narboendeEnskildAr1, 0, ' kr/år'));
  satt('nar-total', fmt(res.narboendeTotalAr1, 0, ' kr/år'));

  // Rimlighetskontroll: jämför enskild ersättning mot lagens riktmärken.
  const rimEl = document.getElementById('nar-rimlighet');
  if (rimEl) {
    rimEl.textContent =
      'Rimlighetskontroll: högsta ersättning per bostad hamnar enligt lagens ' +
      'storleksordning på ca 38 000 kr/år i SE4 och ca 19 000 kr/år i SE1 vid ' +
      'minst två verk inom fem verkshöjder. Aktuellt värde (enskild): ' +
      fmt(res.narboendeEnskildAr1, 0, ' kr/år') + '.';
  }

  /* ---- Diagram ---- */
  uppdateraDiagram(res, d);
}

/* ============================================================================
   DEL 5 – DIAGRAM (Chart.js)
   Två diagram: kassaflöde per år samt kostnadsnedbrytning år 1 (där
   närboendeersättningen syns som en egen post).
   ============================================================================ */

let diagramKassaflode = null;   // referens så vi kan uppdatera i stället för att rita om
let diagramKostnader = null;

function uppdateraDiagram(res, d) {
  if (typeof Chart === 'undefined') return;           // säkerhet om CDN ej laddats

  /* --- Diagram 1: kassaflöde per år (netto, nominellt) --- */
  const arLabels = res.cf.map((_, i) => 'År ' + i);
  const kassaData = res.cf;
  const ctx1 = document.getElementById('diagram-kassaflode');
  if (ctx1) {
    if (diagramKassaflode) {
      // Uppdatera befintligt diagram (snabbare och undviker minnesläckor).
      diagramKassaflode.data.labels = arLabels;
      diagramKassaflode.data.datasets[0].data = kassaData;
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
  const kostLabels = ['Kapitalkostnad', 'Driftskostnad', 'Arrende', 'Kommunal ersättning', 'Närboendeersättning'];
  const kostData = [res.kapitalkostnad, res.driftAr1, res.arrendeChart, res.kommunChart, res.narboendeChart];
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
            backgroundColor: ['#1b5e5a', '#2e8b84', '#e0c93a', '#c77f2e', '#b3261e']
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
   DEL 6 – JÄMFÖRELSETABELL (minneslogik: Senaste / Tidigare / Förändring)
   ----------------------------------------------------------------------------
   MINNESLOGIKEN – utförligt förklarad:

   Vi vill att användaren direkt ska se effekten av just den ändring hen nyss
   gjorde. Därför sparar vi föregående beräkningsresultat i ett JavaScript-objekt
   i minnet (variabeln `senasteResultat` nedan).

   • Vid sidladdning beräknas allt en gång. Detta blir det första "Senaste".
     Eftersom det inte finns något tidigare värde visas "–" i kolumnerna
     Tidigare och Förändring.

   • Varje gång användaren ändrar ett fält och LÄMNAR det (händelsen "change",
     alltså INTE medan man skriver "input"):
        1. Det som just nu ligger i `senasteResultat` flyttas till `tidigareResultat`.
        2. Nya värden beräknas och läggs i `senasteResultat`.
        3. Förändringen = Senaste − Tidigare beräknas och visas.
     På så sätt "rullar" tabellen ett steg per bekräftad ändring.

   Vilka nyckeltal som visas definieras i listan `JAMFOR_NYCKELTAL`.
   ============================================================================ */

// De nyckeltal som visas i jämförelsetabellen. `hamta` plockar värdet ur
// resultatobjektet, `dec`/`suffix` styr formateringen.
const JAMFOR_NYCKELTAL = [
  { etikett: 'Produktion (MWh/år)',        hamta: r => r.produktionMWh_ar1, dec: 0, suffix: '' },
  { etikett: 'Intäkt/år (kr)',             hamta: r => r.intaktAr1,         dec: 0, suffix: '' },
  { etikett: 'Investeringsutgift (kr)',    hamta: r => r.investering,       dec: 0, suffix: '' },
  { etikett: 'Årlig kapitalkostnad (kr)',  hamta: r => r.kapitalkostnad,    dec: 0, suffix: '' },
  { etikett: 'Kostnad per kWh (kr)',       hamta: r => r.kostnadPerkWh,     dec: 3, suffix: '' },
  { etikett: 'Överskott/år (kr)',          hamta: r => r.overskott,         dec: 0, suffix: '' },
  { etikett: 'LCOE (kr/kWh)',              hamta: r => r.lcoe,              dec: 3, suffix: '' },
  { etikett: 'NPV (kr)',                   hamta: r => r.npvInvest,         dec: 0, suffix: '' },
  { etikett: 'IRR (%)',                    hamta: r => r.irrInvest * 100,   dec: 1, suffix: '' },
  { etikett: 'Närboendeersättning tot/år (kr)', hamta: r => r.narboendeTotalAr1, dec: 0, suffix: '' }
];

// Minnesvariabler – lever mellan omräkningarna (därav utanför funktionerna).
let senasteResultat = null;    // objektet från förra bekräftade beräkningen
let tidigareResultat = null;   // objektet från beräkningen dessförinnan

/**
 * Bygger/uppdaterar jämförelsetabellen utifrån minnesvariablerna.
 * Anropas dels vid init (då tidigareResultat är null → "–"), dels vid varje
 * bekräftad ändring (change).
 */
function ritaJamforelse() {
  const kropp = document.getElementById('jamforelse-kropp');
  if (!kropp) return;
  kropp.innerHTML = '';                               // rensa tidigare rader

  JAMFOR_NYCKELTAL.forEach(nt => {
    const senasteVal = senasteResultat ? nt.hamta(senasteResultat) : NaN;
    const tidigareVal = tidigareResultat ? nt.hamta(tidigareResultat) : NaN;

    const tr = document.createElement('tr');

    // Kolumn 1: nyckeltalets namn
    const tdNamn = document.createElement('td');
    tdNamn.textContent = nt.etikett;
    tr.appendChild(tdNamn);

    // Kolumn 2: Senaste resultatet
    const tdSenaste = document.createElement('td');
    tdSenaste.textContent = Number.isFinite(senasteVal) ? fmt(senasteVal, nt.dec, nt.suffix) : '–';
    tr.appendChild(tdSenaste);

    // Kolumn 3: Tidigare resultatet ("–" om det inte finns någon tidigare)
    const tdTidigare = document.createElement('td');
    tdTidigare.textContent = Number.isFinite(tidigareVal) ? fmt(tidigareVal, nt.dec, nt.suffix) : '–';
    tr.appendChild(tdTidigare);

    // Kolumn 4: Förändringen = Senaste − Tidigare, färgmarkerad.
    const tdForandring = document.createElement('td');
    if (Number.isFinite(senasteVal) && Number.isFinite(tidigareVal)) {
      const diff = senasteVal - tidigareVal;
      // Visa med tecken (+/−) för tydlighet.
      const tecken = diff > 0 ? '+' : '';
      tdForandring.textContent = tecken + fmt(diff, nt.dec, nt.suffix);
      if (diff > 0) tdForandring.className = 'forandring-positiv';
      else if (diff < 0) tdForandring.className = 'forandring-negativ';
      else tdForandring.className = 'forandring-neutral';
    } else {
      tdForandring.textContent = '–';
      tdForandring.className = 'forandring-neutral';
    }
    tr.appendChild(tdForandring);

    kropp.appendChild(tr);
  });
}

/* ============================================================================
   DEL 7 – REAKTIVITET (helt utan React!)
   ----------------------------------------------------------------------------
   HUR DEN REAKTIVA UPPDATERINGEN FUNGERAR:

   Vi använder inbyggda DOM-händelser via addEventListener på varje indatafält.
   Två olika händelser med olika syfte:

     • "input"  – utlöses vid VARJE tangenttryckning/ändring medan man skriver.
                  Här kör vi en central omräkning (`omrakna`) som läser alla
                  indata, räknar om ALLT och skriver resultaten till skärmen.
                  Detta ger den "levande" känslan – utdata uppdateras direkt.

     • "change" – utlöses först när fältet LÄMNAS (blur) efter en ändring.
                  Här bekräftar vi jämförelsen: nuvarande "Senaste" flyttas till
                  "Tidigare", nya värden beräknas och läggs i "Senaste", och
                  jämförelsetabellen ritas om. På så vis speglar tabellen just
                  den ändring användaren nyss slutförde.

   Allt detta sker utan att sidan laddas om och utan något ramverk – enbart
   vanilla JavaScript.
   ============================================================================ */

/**
 * Central omräkningsfunktion. Läser indata, beräknar och skriver ut.
 * Returnerar resultatobjektet (används av change-hanteraren).
 */
function omrakna() {
  const d = lasIndata();
  const res = beraknaAllt(d);
  skrivUt(res, d);
  return res;
}

/**
 * Kopplar händelselyssnare till alla indatafält (klassen "indata").
 */
function kopplaLyssnare() {
  const falt = document.querySelectorAll('.indata');

  falt.forEach(el => {
    // 1) LEVANDE omräkning medan man skriver/ändrar.
    el.addEventListener('input', () => {
      omrakna();
    });

    // 2) BEKRÄFTAD ändring när fältet lämnas → uppdatera jämförelsetabellen.
    el.addEventListener('change', () => {
      // Specialfall: om elområde ändras fyller vi i schablonpris (redigerbart).
      if (el.id === 'elomrade') {
        const nyttPris = ELOMRADE_PRIS[el.value];
        if (nyttPris !== undefined) {
          document.getElementById('elpris').value = nyttPris;
        }
      }

      // MINNESLOGIK: flytta "Senaste" → "Tidigare", beräkna nytt "Senaste".
      tidigareResultat = senasteResultat;   // det gamla blir tidigare
      senasteResultat = omrakna();          // räkna om och spara som senaste
      ritaJamforelse();                     // uppdatera tabellen med differens
    });
  });
}

/* ============================================================================
   DEL 8 – FLIKAR (perspektivväxling)
   Endast presentationslogik: visar en panel i taget. Nyckeltalsraden och
   jämförelsetabellen ligger utanför flikarna och är därför alltid synliga.
   ============================================================================ */

function kopplaFlikar() {
  const knappar = document.querySelectorAll('.flik-knapp');

  knappar.forEach(knapp => {
    knapp.addEventListener('click', () => {
      const flik = knapp.getAttribute('data-flik');

      // Nollställ alla knappar och paneler.
      knappar.forEach(k => {
        k.classList.remove('aktiv');
        k.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.flik-panel').forEach(p => {
        p.classList.remove('aktiv');
        p.hidden = true;
      });

      // Aktivera den valda.
      knapp.classList.add('aktiv');
      knapp.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('panel-' + flik);
      if (panel) {
        panel.classList.add('aktiv');
        panel.hidden = false;
      }
    });
  });
}

/* ============================================================================
   DEL 8.5 – TEKNIK-MODAL (uppdatering 2026-07-03)
   ----------------------------------------------------------------------------
   Här skedde en uppdatering: logik för den flytande "teknik"-knappen och dess
   modal som visar den ursprungliga prompten. Ren presentationsinteraktion –
   ingen påverkan på beräkningarna.
   Modalen öppnas när knappen klickas och stängs via stängknappen, klick på den
   mörka bakgrunden eller tangenten Escape. Attributet `hidden` styr synlighet.
   ============================================================================ */

function kopplaTeknikModal() {
  const knapp = document.getElementById('teknik-knapp');
  const modal = document.getElementById('teknik-modal');
  const stang = document.getElementById('teknik-stang');
  if (!knapp || !modal || !stang) return;

  // Öppna modalen.
  function oppna() {
    modal.hidden = false;
  }
  // Stäng modalen.
  function stangModal() {
    modal.hidden = true;
  }

  // Klick på knappen öppnar.
  knapp.addEventListener('click', oppna);

  // Klick på stängknappen stänger.
  stang.addEventListener('click', stangModal);

  // Klick på den mörka bakgrunden (men inte på själva rutan) stänger.
  modal.addEventListener('click', (e) => {
    if (e.target === modal) stangModal();
  });

  // Tangenten Escape stänger modalen om den är öppen.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) stangModal();
  });
}

/* ============================================================================
   DEL 9 – INITIERING
   Körs när DOM är färdigladdad. Sätter upp allt och gör en första beräkning.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  kopplaLyssnare();     // reaktiva lyssnare på indatafälten
  kopplaFlikar();       // flikväxling
  kopplaTeknikModal();  // teknik-knapp + modal med originalprompten

  // Första beräkningen vid sidladdning.
  senasteResultat = omrakna();   // fyller "Senaste"
  tidigareResultat = null;       // inget tidigare finns ännu → "–"
  ritaJamforelse();              // ritar tabellen (Tidigare/Förändring = "–")
});
