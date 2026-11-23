/* ============================================================================
   kalkylkarna.js
   ----------------------------------------------------------------------------
   Gemensam kärna för alla vindkraftskalkyler i den här mappen
   (vindkraftskalkyl.html och vindkraftskalkyl_langhult.html, senare fler).
   Det som ska räknas lika i alla kalkyler ligger här. Ändras ett räknesätt här
   får det genomslag i samtliga kalkyler. Det som är specifikt för en kalkyl
   (till exempel Långhults produktion, viktning och närboendezoner) ligger kvar
   i den kalkylens egen fil (berakningar.js, berakningar_langhult.js).

   Innehåll:
     1. Läsa och formatera värden: tal, text, fmt.
     2. Finansiella funktioner: annuitet, npv, irr, payback, lcoeAvKassaflode.
     3. Nätkostnader och systemkrav, den del som hör ihop med investerarens
        kalkyl: radataNat, lasNatIndata, natPaverkan, natSammanfattning.
        (Själva nätmodellen finns i natkostnader_berakning.js, global NATKOSTNAD.)
     4. Närboendeersättning (vindkraftsersättning): två metoder, en aktiv.
        NARBOENDE_METOD väljer vilken. Aktiv är 'zoner' (SFS 2026:1113, 12–14 §§).
        Metoden 'schablon' är den äldre förenklingen (linjär avtrappning 5–9 verkshöjder).
        Den är kvar men inaktiv, så att ett byte av metod görs på ett ställe.
     5. Pris: realiserat pris = spotpris × prisfaktor (realiseratPris).
     6. Kommunposter: fastighetsskatt och bygdemedel (projektkostnader) och kommunstöd (statligt).

   Filen laddas före respektive kalkyls egen fil. Funktionerna är globala i
   webbläsaren och exporteras som module.exports i Node, där test_kalkylkarna.js
   kör dem.

   Version 1.3 (2026-11-23): kommunposter (fastighetsskatt, bygdemedel, kommunstöd). Version 1.2: fastställda grupprubriker (INDATAGRUPPER). Version 1.1: närboendeersättning och prisfaktor. Version 1.0: skapad. Funktionerna flyttades oförändrade ur
   berakningar.js och berakningar_langhult.js.
   ============================================================================ */
'use strict';

const KARNA_VERSION = '1.3';

/**
 * Indatagrupperna i alla vindkraftskalkyler: rubrikerna och deras ordning är fastställda här, så att kalkylerna ser
 * likadana ut och en ny kalkyl får samma. Ordningen följer flikarna i resultatet (investerare, markägare, kommun,
 * andelsägare, närboende). Projektspecifika fält läggs INOM en befintlig grupp (till exempel fastighetsskatt under
 * Kommun & samhälle), inte som en ny grupp med eget namn. test_kalkylkarna.js kontrollerar rubrikerna i varje kalkylsida.
 */
const INDATAGRUPPER = [
  'Anläggning & investering',
  'Drift & livscykel',
  'Nät och systemkrav',
  'Markägare (arrende)',
  'Kommun & samhälle',
  'Andelsägare (kooperativ)',
  'Närboende (vindkraftsersättning, SFS 2026:1113)'
];

/* ============================================================================
   1. LÄSA OCH FORMATERA VÄRDEN
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
 * Formaterar ett tal med svenska tusentalsavgränsare (toLocaleString('sv-SE')).
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

/**
 * Visar fullasttimmar (kapacitetsfaktor × 8 760 h) i elementet kf-timmar, om det finns. Kapacitetsfaktorn är det
 * som anges och räknas med. Timmarna är bara en omräkning, till exempel för jämförelse med en källa.
 */
function visaFullasttimmar(kapfaktor) {
  const e = document.getElementById('kf-timmar');
  if (e) e.textContent = '= ' + fmt(kapfaktor * 8760, 0, ' fullasttimmar per år (kapacitetsfaktor × 8 760 h)');
}

/* ============================================================================
   2. FINANSIELLA FUNKTIONER
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

/**
 * LCOE (Levelized Cost of Energy):
 *   LCOE = ( Investering + Σ drift_t/(1+r)^t + nedmontering/(1+r)^n − restvärde/(1+r)^n )
 *          / ( Σ energi_t(kWh)/(1+r)^t )
 * Både kostnader och energi diskonteras – standardmetod. Arrende, skatter,
 * bygdemedel och närboendeersättning ingår inte (de är fördelning, inte kostnad
 * för att producera). Returnerar också den diskonterade energin, som
 * natSammanfattning behöver.
 * @param {number}   investering  investeringsutgift (kr), inklusive nätens engångsdel om den läggs till
 * @param {number[]} driftAr      driftkostnad per år 1..n (kr)
 * @param {number[]} prodkWhAr    produktion per år 1..n (kWh)
 * @param {number}   r            kalkylränta
 * @param {number}   nedmonteringTot  kr, i slutet
 * @param {number}   restvardeTot     kr, i slutet
 */
function lcoeAvKassaflode(investering, driftAr, prodkWhAr, r, nedmonteringTot, restvardeTot) {
  const n = driftAr.length;
  let disKostnad = investering;
  let disEnergi = 0;
  for (let t = 1; t <= n; t++) {
    disKostnad += driftAr[t - 1] / Math.pow(1 + r, t);
    disEnergi += prodkWhAr[t - 1] / Math.pow(1 + r, t);
  }
  disKostnad += nedmonteringTot / Math.pow(1 + r, n);
  disKostnad -= restvardeTot / Math.pow(1 + r, n);
  return { lcoe: disEnergi > 0 ? disKostnad / disEnergi : 0, disEnergi };
}

/* ============================================================================
   3. NÄTKOSTNADER OCH SYSTEMKRAV (investerarens kalkyl)
   Nätmodellen (NATKOSTNAD, natkostnader_berakning.js) är ren och delas av
   alla kalkyler. Här ligger det som kopplar den till en kalkyls investerare,
   så att varje kalkyl räknar nätets inverkan på samma sätt.
   ============================================================================ */

/** Rådata (textvärden) för nätkostnadsfälten. Tomt fält = "ej angivet". */
function radataNat() {
  const r = {};
  if (typeof NATKOSTNAD === 'undefined') return r;
  NATKOSTNAD.NAT_FALT.forEach(id => {
    const el = document.getElementById(id);
    r[id] = el ? el.value.trim() : '';
  });
  return r;
}

/** Läser nätkostnadsfälten ur formuläret. Tomt fält räknas som 0 (PRD_natkostnader.md). */
function lasNatIndata() {
  return {
    natlage:          text('natlage') || 'ingen',
    natengangingar:   text('natengangingar') || 'ja',   // ja = ingår i investeringsutgiften (antagande)
    natexempel:       text('natexempel'),
    natavstand:       tal('natavstand'),               // km
    natledning:       tal('natledning'),               // kkr/km
    natstation:       tal('natstation'),               // kkr
    natforstark:      tal('natforstark'),              // kkr
    natutredning:     tal('natutredning'),             // kkr, fast del
    natutredningpermw: tal('natutredningpermw'),       // kkr/MW
    natutredningtak:  tal('natutredningtak'),          // kkr, högst
    natengangschablon: tal('natengangschablon'),       // kkr/MW
    natfast:          tal('natfast'),                  // kr/år
    nateffekt:        tal('nateffekt'),                // kr/kW och år
    natavstavg:       tal('natavstavg'),               // kr/kW och km
    natavstavstand:   tal('natavstavstand'),           // km
    natenergi:        tal('natenergi'),                // öre/kWh (negativt = ersättning)
    natforandring:    tal('natforandring'),            // %/år
    natsyseng:        tal('natsyseng'),                // kkr/MW
    natsyslop:        tal('natsyslop'),                // kr/MW och år
    natsysbortfall:   tal('natsysbortfall'),           // %
    natfaktorlag:     tal('natfaktorlag'),             // gånger
    natfaktorhog:     tal('natfaktorhog'),             // gånger
    natTomma:         (typeof NATKOSTNAD !== 'undefined') ? NATKOSTNAD.tommaFalt(radataNat()) : {}
  };
}

/**
 * Nätens inverkan i det valda läget (ingen = 0 överallt) och för panelen
 * "Nätkostnader i siffror", som räknas på läget bas när läget är ingen så att
 * storleken syns utan att resultaten påverkas.
 * @param {object} d         indata med nat*-fält och natlage
 * @param {number} P_tot     parkens effekt (MW)
 * @param {number} bruttoKWh produktion år 1 före bortfall från systemkrav (kWh)
 * @returns {{nat: object, natPanel: object}}
 */
function natPaverkan(d, P_tot, bruttoKWh) {
  // I webbläsaren är nätmodulen global (NATKOSTNAD). I Node läses den med require.
  const NAT = (typeof NATKOSTNAD !== 'undefined') ? NATKOSTNAD : require('./natkostnader_berakning.js');
  const nat = NAT.beraknaNat(d, NAT.faktorForLage(d.natlage, d), P_tot, bruttoKWh);
  const natPanel = (d.natlage === 'ingen') ? NAT.beraknaNat(d, 1, P_tot, bruttoKWh) : nat;
  return { nat, natPanel };
}

/**
 * Engångskostnaden läggs till investeringsutgiften bara när fältet natengangingar är "nej".
 * Förvalt (ja): engångskostnaderna antas ingå i investeringsutgiften.
 */
function natEngangTillaggAv(d, nat) {
  return (d.natengangingar === 'nej') ? nat.natEngang : 0;
}

/**
 * Nätkostnad per kWh över livslängden och dess andel av LCOE, nätens
 * löpande kostnad i kronor (nuvärde) och diagrammets nätpost.
 * @param {object} p  { nat, natPanel, natEngangTillagg, investeringGrund, investering, prodkWhAr, r, n, lcoe, disEnergi }
 */
function natSammanfattning(p) {
  const { nat, natPanel, natEngangTillagg, investeringGrund, investering, prodkWhAr, r, n, lcoe, disEnergi } = p;
  // Diskonterad engångs- och löpande nätkostnad delat med diskonterad energi.
  let disNat = natEngangTillagg;
  for (let t = 1; t <= n; t++) {
    disNat += nat.lopandeAr(t, prodkWhAr[t - 1]) / Math.pow(1 + r, t);
  }
  // Panelens löpande nätkostnad i kronor över livslängden (nuvärde), även i läget ingen.
  let natLivsKr = 0;
  for (let t = 1; t <= n; t++) {
    natLivsKr += natPanel.lopandeAr(t, prodkWhAr[t - 1]) / Math.pow(1 + r, t);
  }
  const natPerkWhLivs = disEnergi > 0 ? disNat / disEnergi : NaN;
  const natAndelLcoe = (lcoe > 0 && natPerkWhLivs === natPerkWhLivs) ? natPerkWhLivs / lcoe : NaN;
  // Diagrammets nätpost: löpande nätkostnad år 1 + annuiteten på engångsdelen.
  const kapitalkostnadGrund = annuitet(investeringGrund, r, n);
  const natChart = nat.lopandeAr1 + (annuitet(investering, r, n) - kapitalkostnadGrund);
  return { natPerkWhLivs, natAndelLcoe, natLivsKr, natChart, kapitalkostnadGrund };
}

/* ============================================================================
   4. NÄRBOENDEERSÄTTNING (vindkraftsersättning)
   Lagtext: SFS 2026:1113, 11–14 §§ (https://data.riksdagen.se/dokument/sfs-2026-1113.html).
     11 §  Verkets intäkt = anläggningens intäkt / antal verk. Intäkten är marknadsvärdet av elen
           (produktion × dagen-före-pris per timme), alltså spotpris viktat med produktionen.
     12 §  Andelen av ETT VERKS intäkt beror på avståndet: 2,5 / 2,0 / 1,5 / 1,0 / 0,5 promille
           vid högst 5, 5–6, 6–7, 7–8 och 8–9 gånger verkets höjd.
     13 §  Om flera verk ligger inom avstånden räknas de två som ger mest.
     14 §  Högst 2 % av anläggningens intäkter. Överskjutande del sätts ned i proportion.
   ============================================================================ */

/** Metoden som används av alla kalkyler. 'zoner' (lagen) eller 'schablon' (inaktiv, äldre förenkling). */
const NARBOENDE_METOD = 'zoner';

/** De fem avståndszonerna (12 §). `till` i antal verkshöjder. Andelen är promille av ETT VERKS intäkt. */
const NARBOENDE_ZONER = [
  { fran: 0, till: 5, promille: 2.5 },
  { fran: 5, till: 6, promille: 2.0 },
  { fran: 6, till: 7, promille: 1.5 },
  { fran: 7, till: 8, promille: 1.0 },
  { fran: 8, till: 9, promille: 0.5 }
];

/** Läser närboendefälten ur formuläret. Fält som saknas i en kalkyl räknas som 0. */
function lasNarboendeIndata() {
  return {
    // Zonmetoden (aktiv)
    bost:          [1, 2, 3, 4, 5].map(i => Math.max(0, Math.round(tal('bost' + i)))),
    verkperbostad: Math.min(2, Math.max(1, Math.round(tal('verkperbostad')))),
    tak:           tal('tak') / 100,                    // % av parkens intäkt → andel
    // Schablonmetoden (inaktiv): fälten finns inte i formulären just nu
    avstand:       tal('avstand'),                     // m
    verkinom5:     Math.max(0, Math.round(tal('verkinom5'))),
    antalbostader: Math.max(0, Math.round(tal('antalbostader'))),
    maxpromille:   tal('maxpromille') / 1000           // ‰ → andel
  };
}

/**
 * Zonmetoden (aktiv). Närboendeersättning ett givet år.
 * @param {number} verkIntakt  ett verks intäkt (kr/år) = parkens intäkt / antal verk (11 §)
 * @param {number} parkIntakt  parkens intäkt (kr/år)
 * @param {object} d           indata: bost[5], verkperbostad (1–2), tak (andel), antalverk
 */
function beraknaNarboendeZoner(verkIntakt, parkIntakt, d) {
  // 13 §: högst två verk, och aldrig fler verk än parken har.
  const verkPerBostad = Math.min(d.verkperbostad, Math.max(1, d.antalverk || 1));
  const perBostadFore = NARBOENDE_ZONER.map(z => (z.promille / 1000) * verkIntakt * verkPerBostad);
  const zonFore = perBostadFore.map((v, i) => v * d.bost[i]);
  const fore = zonFore.reduce((a, b) => a + b, 0);
  const cap = d.tak * parkIntakt;
  const utbetalt = Math.min(fore, cap);
  const skal = fore > cap && fore > 0 ? cap / fore : 1;
  const perBostadEfter = perBostadFore.map(v => v * skal);
  const zonEfter = zonFore.map(v => v * skal);
  const antal = d.bost.reduce((a, b) => a + b, 0);
  return {
    metod: 'zoner',
    perBostadFore, perBostadEfter, zonFore, zonEfter,
    bostPerZon: d.bost.slice(), verkPerBostad,
    fore, cap, utbetalt, skal, antal,
    taketNas: fore > cap,
    snitt: antal > 0 ? utbetalt / antal : 0
  };
}

/**
 * Schablonmetoden (INAKTIV, äldre förenkling): ett avstånd, linjärt avtagande mellan 5 och 9 verkshöjder,
 * maxpromille × distansfaktor × (verkets intäkt × antal verk inom fem verkshöjder) per bostad.
 * Kvar så att metoden kan väljas igen genom NARBOENDE_METOD = 'schablon'. Kräver fälten avstand, verkshojd,
 * verkinom5, antalbostader och maxpromille. Inget tak tillämpas (som i den ursprungliga schablonen).
 */
function beraknaNarboendeSchablon(verkIntakt, parkIntakt, d) {
  const femhojder = 5 * d.verkshojd;
  const niohojder = 9 * d.verkshojd;
  let distansfaktor;
  if (d.avstand > niohojder) distansfaktor = 0;
  else if (d.avstand <= femhojder) distansfaktor = 1;
  else distansfaktor = (niohojder - d.avstand) / (niohojder - femhojder);
  const enskild = d.maxpromille * distansfaktor * (verkIntakt * d.verkinom5);
  const utbetalt = enskild * d.antalbostader;
  return {
    metod: 'schablon',
    perBostadFore: [enskild], perBostadEfter: [enskild], zonFore: [utbetalt], zonEfter: [utbetalt],
    bostPerZon: [d.antalbostader],
    fore: utbetalt, cap: Infinity, utbetalt, skal: 1, antal: d.antalbostader,
    taketNas: false,
    snitt: d.antalbostader > 0 ? utbetalt / d.antalbostader : 0,
    femhojder, niohojder, distansfaktor, inomZon: d.avstand <= niohojder
  };
}

/** Närboendeersättning ett givet år, med den aktiva metoden (NARBOENDE_METOD). */
function beraknaNarboende(verkIntakt, parkIntakt, d) {
  return NARBOENDE_METOD === 'schablon'
    ? beraknaNarboendeSchablon(verkIntakt, parkIntakt, d)
    : beraknaNarboendeZoner(verkIntakt, parkIntakt, d);
}

/** Zonens avstånd i meter, t.ex. "0–1 350 m", för en verkshöjd H (m). */
function zonEtikett(z, H) {
  const fran = z.fran === 0 ? '0' : fmt(z.fran * H, 0);
  return fran + '–' + fmt(z.till * H, 0) + ' m';
}

/** Fyller en tabellkropp (tbody) med närboendeersättning per zon. Delas av alla kalkyler med närboende. */
function ritaNarboendeZonTabell(kroppId, nar, H) {
  const k = document.getElementById(kroppId);
  if (!k || nar.metod !== 'zoner') return;
  k.innerHTML = '';
  const rad = (celler, klass) => {
    const tr = document.createElement('tr');
    if (klass) tr.className = klass;
    celler.forEach((c, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'row';
      td.textContent = c.t;
      if (c.k) td.className = c.k;
      tr.appendChild(td);
    });
    k.appendChild(tr);
  };
  NARBOENDE_ZONER.forEach((z, i) => {
    rad([
      { t: 'Zon ' + (i + 1) },
      { t: zonEtikett(z, H) + (z.fran === 0 ? ' (inom ' + z.till + ' verkshöjder)' : ' (' + z.fran + '–' + z.till + ' verkshöjder)') },
      { t: fmt(z.promille, 1) + ' ‰', k: 'tal' },
      { t: fmt(nar.bostPerZon[i], 0), k: 'tal' },
      { t: fmt(nar.perBostadFore[i], 0), k: 'tal' },
      { t: fmt(nar.perBostadEfter[i], 0), k: 'tal' },
      { t: fmt(nar.zonEfter[i], 0), k: 'tal' }
    ]);
  });
  rad([{ t: 'Summa' }, { t: '' }, { t: '' }, { t: fmt(nar.antal, 0), k: 'tal' }, { t: '' }, { t: '' }, { t: fmt(nar.utbetalt, 0), k: 'tal' }], 'summa');
}

/** Sammanfattningsraderna under zontabellen. prefix = id-prefix, t.ex. 't2' ger t2-fore, t2-tak, t2-nas, t2-skal, t2-snitt. */
function skrivNarboendeSummering(prefix, nar) {
  if (nar.metod !== 'zoner') return;
  const satt = (id, v) => { const e = document.getElementById(prefix + '-' + id); if (e) e.textContent = v; };
  satt('fore', fmt(nar.fore, 0, ' kr/år'));
  satt('tak', fmt(nar.cap, 0, ' kr/år'));
  satt('skal', nar.taketNas ? fmt(nar.skal * 100, 1, ' % av beloppet före tak') : '100 % (taket nås inte)');
  satt('snitt', fmt(nar.snitt, 0, ' kr/bostad och år'));
  satt('nas', nar.taketNas ? 'Ja, taket nås och alla ersättningar sätts ned i proportion' : 'Nej, summan ligger under taket');
}

/* ============================================================================
   5. PRIS: realiserat pris = spotpris × prisfaktor
   Prisfaktorn (0–1) är vindkraftens genomsnittliga intäktspris delat med genomsnittligt spotpris.
   Den kallas på engelska capture rate: EIFO (2026), "Emerging trends in renewable power market earnings:
   Analysis of capture rates in Western Europe", definierar capture price som vad producenterna tjänar och capture
   rate som den som andel av genomsnittligt marknadspris (https://eifo.dk/media/s1bjgkkq/capture-rate-analysis-marts-2026.pdf).
   Kaufmann & Westander (2026) kallar den viktning och talar om kannibalisering.
   1,0 betyder att elen säljs till genomsnittligt spotpris. Lagen (SFS 2026:1113, 11 §) räknar närboendeersättningen
   på marknadsvärdet av elen, alltså produktion × dagen-före-pris per timme, vilket är samma sak som spotpris × prisfaktor.
   ============================================================================ */

/** Realiserat pris (kr/kWh) år t, med elprisbana (andel per år) och prisfaktor. */
function realiseratPris(spotprisAr1, elprisforandring, prisfaktor, t) {
  return spotprisAr1 * Math.pow(1 + elprisforandring, t - 1) * prisfaktor;
}


/* ============================================================================
   6. KOMMUN OCH LOKALA POSTER: fastighetsskatt, bygdemedel och kommunstöd
   Tre poster som finns i de flesta vindkraftsprojekt, och som därför ska finnas i alla kalkyler:
     Fastighetsskatt  Kostnad för projektet, per verk och år. 0,5 % av taxeringsvärdet. Beloppet beror på verkets
                      storlek och elområde. Skatten är högre de första åren och sjunker när taxeringsvärdet skrivs ned
                      med verkets ålder (Kaufmann & Westander, 2026, bilaga 1, s. 17–18).
     Bygdemedel       Kostnad för projektet, kr per år för hela parken. Frivilligt: regleras inte av intäktsdelningslagen
                      (SFS 2026:1113), men betalas i de flesta projekt (Green Power Sweden, enligt anteckningarna 2026-11-19).
     Kommunstöd       Betalas av STATEN till kommunen, fördelat efter installerad effekt, och motsvarar fastighetsskatten.
                      Belastar inte projektet och dras därför inte från projektets resultat. Förordning är utlovad men inte
                      beslutad (anteckningarna 2026-11-19), och cirka 20 000 kr/MW anges av Kaufmann & Westander (2026, s. 7–9).
   Modellen är Kaufmann & Westanders (2026): första åren ett belopp, därefter ett jämnt belopp så att summan över
   livslängden blir fskattotal.
   ============================================================================ */

/** Läser kommunposterna ur formuläret. Fält som saknas i en kalkyl räknas som 0. */
function lasKommunIndata() {
  return {
    fskatt1:    tal('fskatt1'),                          // kr per verk och år, första åren
    fskattaar:  Math.max(0, Math.round(tal('fskattaar'))), // antal år med den första nivån
    fskattotal: tal('fskattotal'),                       // kr per verk, totalt över livslängden
    bygdemedel: tal('bygdemedel'),                       // kr per år, hela parken
    kommunstod: tal('kommunstod')                        // kr per MW och år (staten betalar)
  };
}

/**
 * Fastighetsskatt för ett verk år t (kr). Första fskattaar åren fskatt1. Därefter fördelas resten av totalsumman
 * (fskattotal − fskattaar × fskatt1) lika över årens resterande del av livslängden.
 * @param {number} t  år 1..n
 * @param {object} d  indata: fskatt1, fskattaar, fskattotal, livslangd
 */
function fastighetsskattPerVerk(t, d) {
  if (t <= d.fskattaar) return d.fskatt1;
  const kvar = Math.max(1, d.livslangd - d.fskattaar);
  return Math.max(0, (d.fskattotal - d.fskattaar * d.fskatt1) / kvar);
}

/**
 * Projektets kommunposter per år. Fastighetsskatt och bygdemedel är kostnader för projektet. Kommunstödet betalas av
 * staten och ingår inte i projektets resultat, men visas för kommunen.
 * @param {object} d      indata (kommunfälten, antalverk, livslangd)
 * @param {number} P_tot  parkens effekt (MW)
 */
function kommunPoster(d, P_tot) {
  const n = d.livslangd;
  const fskattAr = [];       // hela parken, kr/år
  const bygdeAr = [];
  for (let t = 1; t <= n; t++) {
    fskattAr.push(fastighetsskattPerVerk(t, d) * d.antalverk);
    bygdeAr.push(d.bygdemedel);
  }
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  return {
    fskattAr, bygdeAr,
    fskattAr1: fskattAr[0] || 0, bygdeAr1: bygdeAr[0] || 0,
    fskattTotal: sum(fskattAr), bygdeTotal: sum(bygdeAr),
    kommunstodAr1: d.kommunstod * P_tot,
    saknas: {
      fskatt: !(d.fskatt1 > 0) && !(d.fskattotal > 0),
      bygde: !(d.bygdemedel > 0),
      kommunstod: !(d.kommunstod > 0)
    }
  };
}

/** Text om vilka kommunposter som saknar belopp, eller tom sträng. Visas så att en saknad post inte glöms bort. */
function kommunSaknasText(poster) {
  const s = poster.saknas, lista = [];
  if (s.fskatt) lista.push('fastighetsskatt');
  if (s.bygde) lista.push('bygdemedel');
  if (s.kommunstod) lista.push('kommunstöd');
  if (!lista.length) return '';
  const och = lista.length > 1 ? lista.slice(0, -1).join(', ') + ' och ' + lista[lista.length - 1] : lista[0];
  return 'Ingår inte: ' + och + ' saknar belopp (0 kr). ' +
    (s.fskatt || s.bygde ? 'Projektets kostnader är då lägre än i verkligheten. ' : '') +
    'Fyll i beloppen i gruppen Kommun & samhälle.';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KARNA_VERSION, INDATAGRUPPER, fmt, annuitet, npv, irr, payback, lcoeAvKassaflode,
    natPaverkan, natEngangTillaggAv, natSammanfattning,
    lasKommunIndata, fastighetsskattPerVerk, kommunPoster, kommunSaknasText,
    NARBOENDE_METOD, NARBOENDE_ZONER, beraknaNarboende, beraknaNarboendeZoner, beraknaNarboendeSchablon, realiseratPris
  };
}
