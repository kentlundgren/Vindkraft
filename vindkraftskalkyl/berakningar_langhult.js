/* ============================================================================
   berakningar_langhult.js
   ----------------------------------------------------------------------------
   Kopia av berakningar.js, anpassad till fallet vindpark Långhult
   (Jönköpings och Gislaveds kommuner). Originalet (berakningar.js) är oförändrat.

   Vad som är nytt jämfört med originalet:
     1. Indata hämtas ur Kaufmann & Westander (2026), "Intäktsdelning och ersättningar:
        Vindpark Långhult" (Westander Klimat och Energi, 2026-04-20):
        20 verk, 6,6 MW, 3 610 fullasttimmar (kapacitetsfaktor 0,4121), 270 m, 50 öre/kWh, prisfaktor 0,75, 30 år.
     2. Närboendeersättningen följer lagtexten som Kaufmann & Westander (2026) återger: fem zoner
        (2,5 / 2,0 / 1,5 / 1,0 / 0,5 promille av ETT VERKS intäkt), ersättning
        från de två närmaste verken, och ett tak på 2 % av parkens intäkter.
        Originalets linjära schablon mellan 5 och 9 verkshöjder är borttagen.
     3. Fastighetsskatt och bygdemedel är projektkostnader (Kaufmann & Westander, 2026, bilaga 1, avsnitt 4).
        Kommunstödet (cirka 20 000 kr/MW) betalas av staten och dras INTE från
        projektets resultat. Originalets schablon "kommunal ersättning" är borttagen.
     4. Realiserat pris = spotpris × prisfaktor (0,75, som Kaufmann & Westander (2026) kallar viktning och kannibalisering).
     5. Nya tabeller: projektets ekonomi, närboende per zon, känslighet för elpris
        och en kontroll mot talen i Kaufmann & Westander (2026).

   Märkning av indata i gränssnittet:
     Källmärke   = uppgift hämtad ur Kaufmann & Westander (2026), med sida
     lagstadgat = lagtext, återgiven ur Kaufmann & Westander (2026)
     antagande  = Kents standardvärde eller en förenkling, inte ur Kaufmann & Westander (2026)

   Koden är skriven i "vanilla" JavaScript (ES2020-nivå). Ingen data skickas
   någonstans: all beräkning sker i webbläsaren.
   ============================================================================ */

'use strict';

/* Versionsraden längst ned på sidan. Höj VERSION och uppdatera VERSIONSDATUM i samma ändring som innehållet ändras.
   UPPDATERING 2026-11-23 (senare igen 2): raderna om nätkostnad i Tabell 3 räknas på valt läge och förklarar negativ nätkostnad direkt och vid hovring. Version 1.3.
   UPPDATERING 2026-11-23 (senare igen): växel för parkens storlek (20 verk eller bara Lunnarsbo, 12 verk). Version 1.2.
   UPPDATERING 2026-11-23 (senare): nya nätfall I och J (Vattenfall 130 kV) i väljaren. Version 1.1.
   UPPDATERING 2026-11-23: versionsrad i sidfoten. Version 1.0 (Långhult har egen versionsnumrering, skild från huvudkalkylens). */
const VERSION = '1.3';
const VERSIONSDATUM = '2026-11-23';

/* ============================================================================
   DEL 0 – HJÄLPFUNKTIONER
   ============================================================================ */

/* tal, text och fmt ligger i kalkylkarna.js, som delas med övriga kalkyler. */

/** Miljoner kronor med en decimal, t.ex. "3,6 Mkr". */
function fmtMkr(v, dec = 1) {
  return fmt(v / 1e6, dec, ' Mkr');
}

/* ============================================================================
   DEL 1 – FINANSIELLA HJÄLPFUNKTIONER
   annuitet, npv, irr, payback och lcoeAvKassaflode ligger i kalkylkarna.js och
   räknar likadant i alla kalkyler.
   ============================================================================ */

/* ============================================================================
   DEL 1.5 – KONSTANTER FRÅN WESTANDER KLIMAT OCH ENERGI (2026) OCH LAGTEXT
   ----------------------------------------------------------------------------
   Sidhänvisningar följer sidnumreringen i Kaufmann & Westander (2026), sidnummer längst upp.
   ============================================================================ */

/* De fem avståndszonerna (NARBOENDE_ZONER, 12 §) och närboendemetoden ligger i kalkylkarna.js. */
const ZONER = NARBOENDE_ZONER;

/** Elpriser (kr/kWh) för känslighetstabellerna. Kaufmann & Westander (2026, s. 16) visar 30–70 öre. 100 öre
    är tillagt som ett högt scenario (antagande, inte ur Kaufmann & Westander (2026)). */
const PRISER = [0.30, 0.40, 0.50, 0.60, 0.70, 1.00];

/** Talen i Kaufmann & Westander (2026), för kontrolltabellen (Tabell 6). Enhet kr om inget annat. */
const PM_REF = {
  produktionVerkGWh: 23.8,                         // s. 11, 16
  zonVerk50: [22300, 17900, 13400, 8900, 4500],    // Tabell 2 i Kaufmann & Westander (2026), s. 16, 50 öre
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
    // Anläggning
    antalverk:        Math.max(1, Math.round(tal('antalverk'))),
    effekt:           tal('effekt'),                   // MW per verk
    kapfaktor:        tal('kapfaktor'),                // 0–1 (Kaufmann & Westander (2026): 3 610 h / 8 760 h)
    verkshojd:        tal('verkshojd'),                // m
    livslangd:        Math.max(1, Math.round(tal('livslangd'))),
    elpris:           tal('elpris'),                   // spotpris, kr/kWh
    prisfaktor:       tal('prisfaktor'),               // 0,75 (Kaufmann & Westander (2026): viktning)
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

    // Kommun, bygd och skatt
    ...lasKommunIndata(),                          // fskatt1, fskattaar, fskatt2, bygdemedel, kommunstod (kalkylkarna.js)
    verkgislaved:     Math.max(0, Math.round(tal('verkgislaved'))),
    co2faktor:        tal('co2faktor'),
    co2varde:         tal('co2varde'),

    // Närboende
    ...lasNarboendeIndata(),                       // bost[5], verkperbostad, tak (kalkylkarna.js)

    // Andelsägare (antagande)
    antalandelar:     tal('antalandelar'),
    kwhperandel:      tal('kwhperandel'),
    insatsperandel:   tal('insatsperandel'),
    driftpaslag:      tal('driftpaslag'),
    spotpris:         tal('spotpris'),
    elhandelspaslag:  tal('elhandelspaslag'),
    energiskatt:      tal('energiskatt'),
    momssats:         tal('momssats') / 100,

    // Nätkostnader och systemkrav (kalkylkarna.js, lasNatIndata). Förvalt läge: ingen.
    ...lasNatIndata()
  };
}

/* ============================================================================
   DEL 3 – BERÄKNINGAR
   ============================================================================ */

/* Fastighetsskatt, bygdemedel och kommunstöd (fastighetsskattPerVerk, kommunPoster) ligger i kalkylkarna.js. */

function beraknaAllt(d) {
  const r = d.kalkylranta;
  const n = d.livslangd;
  const P_tot = d.effekt * d.antalverk;                     // MW, hela parken

  /* ---------- 3.1 Produktion och investerarens grundstorheter ------------- */
  // Produktion per verk år 1 = effekt (kW) × 8 760 h × kapacitetsfaktor (Kaufmann & Westander, 2026: 6,6 MW × 3 610 h = 0,4121).
  // Nätens systemkrav kan ge ett bortfall (nat.bortfall, 0 i läget ingen), se kalkylkarna.js och natkostnader_berakning.js.
  const natBrutto = NATKOSTNAD.bruttoKWh(d, P_tot);                // kWh/år före bortfall
  const { nat, natPanel } = natPaverkan(d, P_tot, natBrutto);
  const prodVerkkWh_ar1 = natBrutto / d.antalverk * (1 - nat.bortfall);
  const produktionkWh_ar1 = prodVerkkWh_ar1 * d.antalverk;
  const produktionMWh_ar1 = produktionkWh_ar1 / 1000;

  // Realiserat pris = spotpris × prisfaktor (kalkylkarna.js, realiseratPris; Kaufmann & Westander, 2026, s. 12, 16: 0,75).
  const realPris_ar1 = realiseratPris(d.elpris, d.elprisforandring, d.prisfaktor, 1);
  const intaktAr1 = produktionkWh_ar1 * realPris_ar1;

  // Nätens löpande kostnad år 1 ingår i driften och nätens engångskostnad i investeringen (om den inte antas ingå).
  const driftkostnadAr1 = produktionkWh_ar1 * d.rorlig + d.fast * P_tot + nat.lopandeAr1;
  const investeringGrund = d.specinv * 1000 * P_tot;
  const natEngangTillagg = natEngangTillaggAv(d, nat);
  const investering = investeringGrund + natEngangTillagg;
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
    const prod = produktionkWh_ar1 * Math.pow(1 - d.degradering, t - 1);
    prodkWhAr.push(prod);
    intaktAr.push(prod * realiseratPris(d.elpris, d.elprisforandring, d.prisfaktor, t));
    driftAr.push(prod * d.rorlig + d.fast * P_tot + nat.lopandeAr(t, prod));
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

  /* ---------- 3.4 Fastighetsskatt och bygdemedel (projektkostnader) ---- */
  const kp = kommunPoster(d, P_tot);                    // kalkylkarna.js
  const fskattAr = kp.fskattAr;     // hela parken, kr/år
  const bygdeAr = kp.bygdeAr;
  const fskattAr1 = kp.fskattAr1;
  const bygdeAr1 = kp.bygdeAr1;

  /* ---------- 3.5 Kommunstöd (betalas av staten, ingen projektkostnad) ----- */
  const kommunstodGisl = d.kommunstod * d.effekt * d.verkgislaved;
  const kommunstodJonk = d.kommunstod * d.effekt * Math.max(0, d.antalverk - d.verkgislaved);
  // Om kommunen i stället fick den faktiska fastighetsskatten (Kaufmann & Westander, 2026, s. 8–9):
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

  // LCOE: gemensam definition (kalkylkarna.js, lcoeAvKassaflode): investering + drift + nedmontering − restvärde,
  // delat med diskonterad energi. Arrende, skatt, bygdemedel och närboende ingår inte.
  const { lcoe, disEnergi } = lcoeAvKassaflode(investering, driftAr, prodkWhAr, r, nedmonteringTot, restvardeTot);
  const { natPerkWhLivs, natAndelLcoe, natLivsKr, natChart, kapitalkostnadGrund } = natSammanfattning({
    nat, natPanel, natEngangTillagg, investeringGrund, investering, prodkWhAr, r, n, lcoe, disEnergi
  });

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
    arrendeInfo: { modell: d.arrendemodell, procent: d.arrendeprocent, krmw: d.arrendekrmw }, antalverk: d.antalverk, P_tot,
    // Skatt och bygd
    fskattAr1, bygdeAr1, kommunPoster: kp,
    // Kommun
    kommunstodGisl, kommunstodJonk, fskattGislAr1, fskattGislTotal,
    lokalaAr1, lokalaTotal, co2Ton, samhallsnytta,
    // Närboende
    nar: nar1, narboendeAr1, narboendeTotal,
    // Andelsägare
    elmangd, totalInsats, sjalvkostnadkWh, marknadsprisAr1, besparingAr1,
    alternativkostnad, nettoAr1, aterbetalning, nuvardeAndel,
    // Nätkostnader och systemkrav
    natlage: d.natlage, nat, natPanel, natEngangTillagg, natPerkWhLivs, natAndelLcoe, natChart, natLivsKr,
    // Diagram: driften utan nät och kapitalkostnaden utan nätens engångsdel, så att nätposten inte dubbelräknas
    driftAr1: driftkostnadAr1 - nat.lopandeAr1, kapitalChart: kapitalkostnadGrund
  };
}

/* ============================================================================
   DEL 4 – PRESENTATION
   ============================================================================ */

function satt(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/** Originalet (Kaufmann & Westander, 2026), publicerat av Fred. Olsen Renewables. */
const KALLA_URL = 'https://fredolsenrenewables.com/media/1gpjqw0l/pm-intaektsdelning-vindpark-laanghult_gislaved.pdf';

/** Källmärken (statisk, egen text – ingen användardata). */
const M = {
  // Märke med författare, år och sida, länkat till rätt sida i originalet (Harvardform).
  pm:   (sid, s) => '<a class="badge pm" href="' + KALLA_URL + '#page=' + (String(sid).match(/\d+/) || [1])[0] +
                    '" target="_blank" rel="noopener">Kaufmann &amp; Westander, 2026, ' + sid + '</a> ' + s,
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

/* ---- Tabell 1: projektets ekonomi ---- */
function ritaTabell1(res, d) {
  const k = document.getElementById('t1-kropp');
  if (!k) return;
  k.innerHTML = '';
  const L = res.livs;
  const neg = (v) => fmt(-v, 0);
  laggRad(k, [{t: 'Produktion (MWh)'}, {t: fmt(res.produktionMWh_ar1, 0), k: 'tal'}, {t: fmt(L.prodMWh, 0), k: 'tal'},
    {h: M.pm('s. 11, 16', '6,6 MW × 3 610 fullasttimmar × 20 verk')}]);
  laggRad(k, [{t: 'Intäkt (spotpris × prisfaktor)'}, {t: fmt(res.intaktAr1, 0), k: 'tal'}, {t: fmt(L.intakt, 0), k: 'tal'},
    {h: M.pm('s. 12, 16', '50 öre/kWh och viktning 0,75 (här prisfaktor)')}]);
  laggRad(k, [{t: 'Driftskostnad (rörlig + fast)'}, {t: neg(res.driftkostnadAr1), k: 'tal'}, {t: neg(L.drift), k: 'tal'},
    {h: M.ant('kalkylens standardvärden, ej ur Kaufmann &amp; Westander (2026)')}]);
  laggRad(k, [{t: 'Kapitalkostnad (annuitet)'}, {t: neg(res.kapitalkostnad), k: 'tal'}, {t: neg(L.kapital), k: 'tal'},
    {h: M.ant('investering ur kalkylens standardvärde, ränta 5,2 % real ur Energiforsk (2021), ej ur Kaufmann &amp; Westander (2026)')}]);
  laggRad(k, [{t: 'Arrende till markägare'}, {t: neg(res.arrendeAr1), k: 'tal'}, {t: neg(L.arrende), k: 'tal'},
    {h: M.ant('3,5 % av bruttointäkten, ej ur Kaufmann &amp; Westander (2026)')}]);
  laggRad(k, [{t: 'Fastighetsskatt'}, {t: neg(res.fskattAr1), k: 'tal'}, {t: neg(L.fskatt), k: 'tal'},
    {h: M.pm('bilaga 1, s. 17–18', '334 398 kr/verk första fyra åren, 46,5 Mkr för sju verk på 30 år') + ' ' + M.ant('resten jämnas ut')}]);
  laggRad(k, [{t: 'Bygdemedel'}, {t: neg(res.bygdeAr1), k: 'tal'}, {t: neg(L.bygde), k: 'tal'},
    {h: M.pm('s. 4, 12', 'minst 400 000 kr/år för hela parken')}]);
  laggRad(k, [{t: 'Närboendeersättning (efter tak)'}, {t: neg(res.narboendeAr1), k: 'tal'}, {t: neg(L.narboende), k: 'tal'},
    {h: M.lag('zoner, två verk, tak 2 %') + ' ' + M.ant('antal bostäder per zon')}]);
  laggRad(k, [{t: 'Nedmontering och restvärde'}, {t: '–', k: 'tal'}, {t: fmt(L.nedRest, 0), k: 'tal'},
    {h: M.ant('nedmontering 600 kkr/MW, restvärde 0, ej ur Kaufmann &amp; Westander (2026)')}]);
  laggRad(k, [{t: 'Överskott efter allt'}, {t: fmt(res.overskottNetto, 0), k: 'tal'}, {t: fmt(L.overskott, 0), k: 'tal'},
    {h: M.ber('intäkt minus alla kostnadsposter ovan')}], 'summa');
  laggRad(k, [{t: 'Betalas av staten, inte av projektet (information)'}, {t: ''}, {t: ''}, {t: ''}], 'delrubrik');
  laggRad(k, [{t: 'Kommunstöd till Gislaveds kommun (' + d.verkgislaved + ' verk)'}, {t: fmt(res.kommunstodGisl, 0), k: 'tal'},
    {t: fmt(res.kommunstodGisl * d.livslangd, 0), k: 'tal'},
    {h: M.pm('s. 7–9', 'cirka 20 000 kr per installerad MW')}]);
  laggRad(k, [{t: 'Kommunstöd till Jönköpings kommun (' + Math.max(0, d.antalverk - d.verkgislaved) + ' verk)'}, {t: fmt(res.kommunstodJonk, 0), k: 'tal'},
    {t: fmt(res.kommunstodJonk * d.livslangd, 0), k: 'tal'},
    {h: M.ber('samma schablon × MW i Jönköping (Kaufmann &amp; Westander (2026) räknar bara Gislaved)')}]);
  laggRad(k, [{t: 'Om Gislaved fick den faktiska fastighetsskatten'}, {t: fmt(res.fskattGislAr1, 0), k: 'tal'}, {t: fmt(res.fskattGislTotal, 0), k: 'tal'},
    {h: M.pm('s. 8–9, 18', '2,3 Mkr/år de första fyra åren, 46,5 Mkr totalt')}]);
}

/* ---- Tabell 2: närboende per zon ---- */
function ritaTabell2(res, d) {
  // Tabellen och sammanfattningen delas med övriga kalkyler (kalkylkarna.js).
  ritaNarboendeZonTabell('t2-kropp', res.nar, d.verkshojd);
  skrivNarboendeSummering('t2', res.nar, d.antalverk);
}

function skrivUt(res, d) {
  visaFullasttimmar(d.kapfaktor);
  visaRealiseratPris(d.elpris, d.prisfaktor);
  visaTotalEffekt(d.effekt, d.antalverk);
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
  visaArrendeForklaring(res);

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

  /* ---- Nätkostnader i siffror (panel, investerarrader, exempelinfo) ---- */
  if (typeof skrivUtNat === 'function') skrivUtNat(res, d);

  /* ---- Tabell 4–6 och diagram ---- */
  ritaKanslighet(d);
  ritaKontroll(res, d);
  uppdateraDiagram(res, d);
}

/* ---- Tabell 4: ett verk, zon × elpris (motsvarar Tabell 2 i Kaufmann & Westander (2026)) ---- */
function ritaKanslighet(d) {
  const k4 = document.getElementById('t4-kropp');
  const k5 = document.getElementById('t5-kropp');
  if (k4) {
    k4.innerHTML = '';
    const prodVerk = d.effekt * 1000 * 8760 * d.kapfaktor;
    ZONER.forEach((z, i) => {
      const celler = [{t: zonEtikett(z, d.verkshojd)}];
      PRISER.forEach(p => {
        const verkIntakt = prodVerk * p * d.prisfaktor;
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

/* ---- Tabell 6: kontroll mot talen i Kaufmann & Westander (2026) ---- */
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
  rad('Produktion per verk (GWh/år)', res.prodVerkkWh_ar1 / 1e6, PM_REF.produktionVerkGWh, 's. 11, 16', 'Kaufmann & Westander (2026) avrundar 23,826 till 23,8', 2, 1);
  ZONER.forEach((z, i) => {
    const verkIntakt = res.prodVerkkWh_ar1 * d.elpris * d.prisfaktor;
    const v = (z.promille / 1000) * verkIntakt;
    rad('Zon ' + (i + 1) + ' per verk (kr/år, 50 öre)', v, PM_REF.zonVerk50[i], 'Tabell 2, s. 16', 'Kaufmann & Westander (2026) avrundar till hundratal');
  });
  rad('Närboende, hela parken (kr/år)', n.utbetalt, PM_REF.narboendeAr, 's. 3, 16', 'Kaufmann & Westander (2026) anger taket 2 %, avrundat till 3,6 Mkr');
  rad('Närboende på 30 år (kr)', res.narboendeTotal, PM_REF.narboende30, 's. 3, 16', 'Förutsätter 30 år och oförändrat pris');
  rad('Snitt per bostad (kr/år)', n.snitt, PM_REF.snittBostad, 's. 4', 'Kaufmann & Westander (2026) skriver "drygt 18 000"');
  rad('Antal bostäder (st)', n.antal, PM_REF.bostader, 's. 4, 16', 'Kaufmann & Westander (2026) skriver "cirka 200"; fördelningen på zoner är ett antagande');
  rad('Kommunstöd Gislaved (kr/år)', res.kommunstodGisl, PM_REF.kommunstodGislavedAr, 's. 3, 9', 'Kaufmann & Westander (2026) skriver "cirka 0,9 miljoner"');
  rad('Kommunstöd Gislaved, 30 år (kr)', res.kommunstodGisl * 30, PM_REF.kommunstodGislaved30, 's. 3, 9', 'Kaufmann & Westander (2026) skriver 27,7 Mkr');
  rad('Fastighetsskatt, sju verk, år 1 (kr)', res.fskattGislAr1, PM_REF.fskatt7Ar1, 's. 4, 18', 'Kaufmann & Westander (2026) skriver 2,3 Mkr');
  rad('Fastighetsskatt, sju verk, 30 år (kr)', res.fskattGislTotal, PM_REF.fskatt7_30, 's. 3, 18', 'Samma som Kaufmann & Westander (2026) genom konstruktion (summan är en indata)');
  rad('Bygdemedel, 30 år (kr)', res.bygdeAr1 * 30, PM_REF.bygdemedel30, 's. 12', 'Minst 400 000 kr/år enligt Kaufmann & Westander (2026)');
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
  // Nätposten = löpande nätkostnad år 1 + annuiteten på nätens engångsdel. Ett cirkeldiagram kan inte visa en
  // negativ post, så en nätersättning visas som 0 (värdet finns i panelen Nätkostnader i siffror).
  const kostLabels = ['Kapitalkostnad', 'Driftskostnad', 'Arrende', 'Fastighetsskatt', 'Bygdemedel', 'Närboendeersättning', 'Nät och systemkrav'];
  const kostData = [res.kapitalChart, res.driftAr1, res.arrendeAr1, res.fskattAr1, res.bygdeAr1, res.narboendeAr1, Math.max(0, res.natChart)];
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
            backgroundColor: ['#1b5e5a', '#2e8b84', '#5b7fa6', '#c77f2e', '#7a5ca8', '#b3261e', '#6b7b8c']
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
  ...JAMFOR_OVERSKOTT,                                  // överskott före, avdragen och överskott efter (kalkylkarna.js)
  { etikett: 'LCOE (kr/kWh)',                      hamta: r => r.lcoe,              dec: 3 },
  { etikett: 'NPV (kr)',                           hamta: r => r.npvInvest,         dec: 0 },
  { etikett: 'IRR (%)',                            hamta: r => r.irrInvest * 100,   dec: 1 },
  { etikett: 'Närboende, snitt per bostad (kr/år)', hamta: r => r.nar.snitt,        dec: 0 },
  ...JAMFOR_NAT                                        // nätkostnad engång och löpande, med förklaring (kalkylkarna.js)
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
    jamforRadExtras(tr, tdNamn, nt, senasteResultat);
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

/* Växeln för parkens storlek: knapparna sätter antal verk (20 eller 12) och räknar om. Ett annat antal, skrivet för hand, markerar ingen knapp. */
function kopplaParkvariant() {
  const knappar = document.querySelectorAll('.park-knapp');
  const inp = document.getElementById('antalverk');
  if (!knappar.length || !inp) return;
  const markera = () => {
    const v = Math.round(parseFloat(inp.value));
    knappar.forEach(k => k.setAttribute('aria-pressed', String(parseInt(k.getAttribute('data-verk'), 10) === v)));
  };
  knappar.forEach(k => k.addEventListener('click', () => {
    inp.value = k.getAttribute('data-verk');
    markera();
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }));
  inp.addEventListener('input', markera);
  markera();
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
  kopplaAnkareTillFlikar();
  kopplaTeknikModal();
  kopplaForklaringar();
  kopplaParkvariant();
  visaVersionsrad(VERSION, VERSIONSDATUM);

  senasteResultat = omrakna();
  tidigareResultat = null;
  ritaJamforelse();
});
