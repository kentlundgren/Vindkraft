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

/* UPPDATERING 2026-11-22: nätkostnader och systemkrav (PRD_natkostnader.md).
   Beräkningen ligger i natkostnader_berakning.js (ren modul, global NATKOSTNAD)
   och gränssnittet i natkostnader_ui.js. Här kopplas modulen in i investerarens
   investering, drift, produktion, LCOE och diagram. Förvalt läge är "ingen",
   som ger exakt samma resultat som tidigare. Versionsrad tillagd. Version 1.0.
   UPPDATERING 2026-11-22 (senare): fältet natengangingar (ja = engångskostnaderna antas ingå i
   investeringsutgiften och läggs inte till; förvalt), diskret hörnpar. Version 1.1.
   UPPDATERING 2026-11-22 (senare igen): infällbar nätgrupp, sammanfattning, delbar länk, öre/kWh vid
   fälten (natkostnader_ui.js). Version 1.2.
   UPPDATERING 2026-11-22 (senare igen): förvalt antal verk är 1 (4 MW), växlare mellan ett och fem verk,
   löpande nätkostnad i kronor per verk och för parken (tabell i panelen) och nuvärde över livslängden. Version 1.3.
   UPPDATERING 2026-11-22 (senare igen): typfall efter parkens effekt (natkostnader_ui.js, NAT_TYPFALL). Version 1.4.
   UPPDATERING 2026-11-22 (senare igen): direktanslutna fall märks, förslagsraden följer stamnätsvägledningen. Version 1.5.
   UPPDATERING 2026-11-22 (senare igen): raden Ingår inte i sammanfattningen (natkostnader_ui.js). Version 1.6.
   UPPDATERING 2026-11-22 (senare igen): utredningsavgiften räknas på parkens effekt (fast del, kkr/MW och tak), Ei:s föreskrift EIFS 2026:10 beslutad, ny version av Svenska kraftnäts vägledning. Version 1.7.
   UPPDATERING 2026-11-22 (senare igen): panelen Nätkostnader i siffror är hopfälld, med de två summorna synliga (natkostnader_ui.js). Version 1.8.
   UPPDATERING 2026-11-22 (senare igen): rutan Välj nätfall efter parkens storlek och trappan över parkeffekt och nätfall (natkostnader_ui.js). Version 1.9.
   UPPDATERING 2026-11-22 (senare igen): delningsraden med adressen till natkostnader/ och miniatyr av delningsbilden. Version 1.10.
   UPPDATERING 2026-11-22 (senare igen): fältet med länken till valet är borttaget (knappen Kopiera länk finns kvar) och delningsraden är hopfälld. Version 1.11.
   UPPDATERING 2026-11-22 (senare igen): Nätkostnader i siffror ligger sist i gruppen Nät och systemkrav och sammanfattningen mitt i gruppen är borttagen. Version 1.12.
   UPPDATERING 2026-11-22 (senare igen): radbrytning i sammanfattningen (kr per år för parken på en rad, per verk på raden under). Version 1.13.
   UPPDATERING 2026-11-22 (senare igen): rullgardinen Kalkyler (korsreferens till Långhult). Version 1.14.
   UPPDATERING 2026-11-22 (senare igen): finansmatematik, formatering och nätkopplingen flyttade till den gemensamma kärnan kalkylkarna.js (delas med Långhult). Resultaten är oförändrade. Version 1.15.
   UPPDATERING 2026-11-23: närboendeersättning enligt lagen (zoner, SFS 2026:1113) via kalkylkarna.js, prisfaktor (realiserat pris = spotpris × prisfaktor, förvalt 1) och visning av fullasttimmar. Version 1.16. */
const VERSION = '1.16';
const VERSIONSDATUM = '2026-11-22';

/* ============================================================================
   DEL 0 – HJÄLPFUNKTIONER
   ============================================================================ */

/* tal, text, fmt, annuitet, npv, irr, payback, lcoeAvKassaflode och nätkopplingen (radataNat, lasNatIndata,
   natPaverkan, natSammanfattning) ligger i kalkylkarna.js, som delas med övriga kalkyler. */

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
    prisfaktor:       tal('prisfaktor'),               // 0–1, realiserat pris / spotpris (capture rate)
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

    // Närboende (kalkylkarna.js, lasNarboendeIndata: bost[5], verkperbostad, tak)
    ...lasNarboendeIndata(),

    // Nätkostnader och systemkrav (kalkylkarna.js, lasNatIndata)
    ...lasNatIndata()
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

  // Nätkostnader och systemkrav (gemensam kärna, se kalkylkarna.js och natkostnader_berakning.js).
  // `nat` gäller i det valda läget (ingen = 0 överallt). `natPanel` används av
  // panelen "Nätkostnader i siffror" och räknas på läget bas när läget är ingen.
  const natBrutto = NATKOSTNAD.bruttoKWh(d, P_tot);              // kWh/år före bortfall
  const { nat, natPanel } = natPaverkan(d, P_tot, natBrutto);

  // Produktion år 1 i MWh:  Effekt(MW) × 8760 h × kapacitetsfaktor × (1 − bortfall från systemkrav)
  const produktionMWh_ar1 = P_tot * 8760 * d.kapfaktor * (1 - nat.bortfall);
  const produktionkWh_ar1 = produktionMWh_ar1 * 1000;

  // Intäkt totalt per år (år 1):  produktion(kWh) × realiserat pris (spotpris × prisfaktor, kalkylkarna.js)
  const realPris_ar1 = realiseratPris(d.elpris, d.elprisforandring, d.prisfaktor, 1);
  const intaktAr1 = produktionkWh_ar1 * realPris_ar1;

  // Årlig driftskostnad (år 1):  rörlig × produktion(kWh) + fast × total effekt
  // Nätens löpande kostnader (år 1) ingår i driftkostnaden när läget inte är ingen.
  const driftkostnadAr1 = produktionkWh_ar1 * d.rorlig + d.fast * P_tot + nat.lopandeAr1;

  // Investeringsutgift:  specifik investering(kkr/MW) × 1000 × total effekt(MW)
  // plus nätens engångskostnader (tillägg, 0 i läget ingen).
  const investeringGrund = d.specinv * 1000 * P_tot;
  // Förvalt (ja): engångskostnaderna antas ingå i investeringsutgiften och läggs inte till.
  const natEngangTillagg = natEngangTillaggAv(d, nat);
  const investering = investeringGrund + natEngangTillagg;

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
     - Realiserat pris år t = spotpris × (1 + elprisförändring)^(t−1) × prisfaktor
     - Produktion år t = produktion_år1 × (1 − degradering)^(t−1)
  */
  const elprisAr = [];      // kr/kWh per år
  const prodkWhAr = [];     // kWh per år
  const intaktAr = [];      // kr per år
  const driftAr = [];       // kr per år
  for (let t = 1; t <= n; t++) {
    const pris = realiseratPris(d.elpris, d.elprisforandring, d.prisfaktor, t);
    const prod = produktionkWh_ar1 * Math.pow(1 - d.degradering, t - 1);
    elprisAr.push(pris);
    prodkWhAr.push(prod);
    intaktAr.push(prod * pris);
    driftAr.push(prod * d.rorlig + d.fast * P_tot + nat.lopandeAr(t, prod));
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

  /* ---------- 3.5 Närboende – beräknas här eftersom både närboende- och
     investerarperspektivet behöver den totala ersättningen. Räknesättet ligger i
     kalkylkarna.js (beraknaNarboende, aktiv metod NARBOENDE_METOD = zoner, SFS 2026:1113 11–14 §§)
     och delas med övriga kalkyler. -------------------------------------------- */
  const narAr = [];                                    // objekt per år
  for (let t = 0; t < n; t++) {
    narAr.push(beraknaNarboende(intaktAr[t] / d.antalverk, intaktAr[t], d));
  }
  const nar1 = narAr[0];
  const narboendeTotalAr = narAr.map(x => x.utbetalt);    // kr/år som belastar verksamhetsutövaren
  const narboendeTotalAr1 = nar1.utbetalt;

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

  /* LCOE (gemensam definition, kalkylkarna.js: lcoeAvKassaflode). Nätkostnad per kWh över livslängden och
     dess andel av LCOE, nätens löpande kostnad i kronor och diagrammets nätpost: natSammanfattning. */
  const { lcoe, disEnergi } = lcoeAvKassaflode(investering, driftAr, prodkWhAr, r, nedmonteringTot, restvardeTot);
  const { natPerkWhLivs, natAndelLcoe, natLivsKr, natChart, kapitalkostnadGrund } = natSammanfattning({
    nat, natPanel, natEngangTillagg, investeringGrund, investering, prodkWhAr, r, n, lcoe, disEnergi
  });

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
    produktionMWh_ar1, realPris_ar1, intaktAr1, driftkostnadAr1, investering, invPerkWh,
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
    nar: nar1, narboendeTotalAr1,

    // Nätkostnader och systemkrav
    nat, natPanel, natEngangTillagg, natPerkWhLivs, natAndelLcoe, natChart, natLivsKr,

    // Hjälpvärden till diagram (driftkostnaden utan nät och kapitalkostnaden
    // utan nätens engångsdel, så att nätposten inte dubbelräknas)
    driftAr1: driftkostnadAr1 - nat.lopandeAr1, kapitalChart: kapitalkostnadGrund,
    arrendeChart: arrendeAr1, kommunChart: kommunAr,
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
  visaFullasttimmar(d.kapfaktor);
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

  /* ---- Närboende (tabell och summering delas med övriga kalkyler, kalkylkarna.js) ---- */
  ritaNarboendeZonTabell('nar-zon-kropp', res.nar, d.verkshojd);
  skrivNarboendeSummering('nar', res.nar);
  satt('nar-total', fmt(res.narboendeTotalAr1, 0, ' kr/år'));

  // Rimlighetskontroll: högsta ersättning per bostad (zon 1, efter tak).
  const rimEl = document.getElementById('nar-rimlighet');
  if (rimEl) {
    rimEl.textContent =
      'Rimlighetskontroll: högsta ersättning per bostad (zon 1, efter tak) är ' +
      fmt(res.nar.perBostadEfter[0], 0, ' kr/år') + ' och genomsnittet per bostad ' +
      fmt(res.nar.snitt, 0, ' kr/år') + '.';
  }

  /* ---- Nätkostnader i siffror (panel, investerarrader, exempelinfo) ---- */
  if (typeof skrivUtNat === 'function') skrivUtNat(res, d);

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
  // Nätposten = löpande nätkostnad år 1 + annuiteten på nätens engångsdel. Ett
  // cirkeldiagram kan inte visa en negativ post, så en nätersättning visas som 0
  // (värdet finns i panelen Nätkostnader i siffror).
  const kostLabels = ['Kapitalkostnad', 'Driftskostnad', 'Arrende', 'Kommunal ersättning', 'Närboendeersättning', 'Nät och systemkrav'];
  const kostData = [res.kapitalChart, res.driftAr1, res.arrendeChart, res.kommunChart, res.narboendeChart, Math.max(0, res.natChart)];
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
            backgroundColor: ['#1b5e5a', '#2e8b84', '#e0c93a', '#c77f2e', '#b3261e', '#5b6fb3']
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
  { etikett: 'Närboendeersättning tot/år (kr)', hamta: r => r.narboendeTotalAr1, dec: 0, suffix: '' },
  { etikett: 'Nätkostnad, engång (kr/MW)', hamta: r => r.natPanel.engangPerMW.summa, dec: 0, suffix: '' },
  { etikett: 'Nätkostnad, löpande (öre/kWh)', hamta: r => r.natPanel.lopandeOre.summa, dec: 2, suffix: '' }
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

  // Versionsrad i sidfoten (konstanterna VERSION och VERSIONSDATUM överst i filen).
  const vNr = document.getElementById('versionsrad-nr');
  const vDat = document.getElementById('versionsrad-datum');
  if (vNr) vNr.textContent = VERSION;
  if (vDat) vDat.textContent = VERSIONSDATUM;

  // Första beräkningen vid sidladdning.
  senasteResultat = omrakna();   // fyller "Senaste"
  tidigareResultat = null;       // inget tidigare finns ännu → "–"
  ritaJamforelse();              // ritar tabellen (Tidigare/Förändring = "–")
});
