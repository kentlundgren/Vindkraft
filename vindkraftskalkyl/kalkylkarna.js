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

   Version 1.7 (2026-11-23): uträkningsmarkering och förklaringar i sammanställningen, och arrendeförklaring. Version 1.6: raderna JAMFOR_OVERSKOTT för sammanställningen. Version 1.5: tabell över extra bostäder under taket, förklaring per zon och länkar till dolda flikar. Version 1.4: fastighetsskatt som första åren + därefter (fskatt2) och uppgift om när närboendetaket nås. Version 1.3: kommunposter (fastighetsskatt, bygdemedel, kommunstöd). Version 1.2: fastställda grupprubriker (INDATAGRUPPER). Version 1.1: närboendeersättning och prisfaktor. Version 1.0: skapad. Funktionerna flyttades oförändrade ur
   berakningar.js och berakningar_langhult.js.
   ============================================================================ */
'use strict';

const KARNA_VERSION = '1.7';

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

/**
 * Förklaring av hur arrendet räknas, med resultatets egna tal. Modellen är antingen procent av bruttointäkten eller kr per MW och år.
 * Resultatobjektet ska ha arrendeInfo { modell, procent, krmw }, arrendeAr1, intaktAr1, produktionMWh_ar1, realPris_ar1, antalverk och P_tot.
 */
function arrendeForklaring(r) {
  const a = r.arrendeInfo;
  if (!a) return '';
  if (a.modell === 'procent') {
    const perVerk = r.arrendeAr1 / Math.max(1, r.antalverk);
    return 'Arrendet är ' + fmt(a.procent * 100, 1) + ' % av bruttointäkten. Bruttointäkten år 1 är ' + fmt(r.intaktAr1, 0) + ' kr (' +
      fmt(r.produktionMWh_ar1, 0) + ' MWh × ' + fmt(r.realPris_ar1, 3) + ' kr/kWh), och ' + fmt(a.procent * 100, 1) + ' % av den är ' +
      fmt(r.arrendeAr1, 0) + ' kr per år' +
      (r.antalverk > 1 ? ', alltså ' + fmt(perVerk, 0) + ' kr per verk × ' + r.antalverk + ' verk' : '') +
      '. Arrendet följer intäkten: dubbelt så många verk ger dubbelt så stor intäkt och dubbelt så stort arrende.';
  }
  return 'Arrendet är ' + fmt(a.krmw, 0) + ' kr per MW och år × ' + fmt(r.P_tot, 1) + ' MW = ' + fmt(r.arrendeAr1, 0) + ' kr per år. Det beror på effekten och inte på intäkten.';
}

/** Skriver arrendeförklaringen i elementet mark-arrende-forklaring och tonar ned det arrendefält som inte används. */
function visaArrendeForklaring(r) {
  const e = document.getElementById('mark-arrende-forklaring');
  if (e) e.textContent = arrendeForklaring(r);
  const modell = r.arrendeInfo ? r.arrendeInfo.modell : '';
  [['arrendeprocent', 'procent'], ['arrendekrmw', 'krmw']].forEach(([id, m]) => {
    const f = document.getElementById(id), lab = f && f.closest ? f.closest('label') : null;
    if (lab) lab.classList.toggle('oanvand', modell !== '' && modell !== m);
  });
}

/**
 * Raderna i sammanställningen (jämförelsetabellen) som visar hur överskottet räknas fram, i samma ordning i alla kalkyler:
 * överskott före lokala poster (intäkt − drift − kapitalkostnad), därefter det som dras av (arrende, fastighetsskatt, bygdemedel och
 * ersättning till närboende), och till sist överskott efter lokala poster. NPV och IRR räknas efter de lokala posterna, och LCOE före dem.
 * Resultatobjektet ska ha overskott, intaktAr1, driftkostnadAr1, kapitalkostnad, arrendeAr1, fskattAr1, bygdeAr1, antalverk, nar,
 * narboendeAr1 (eller narboendeTotalAr1) och overskottNetto. `klass` markerar raden som en del av uträkningen (start, avdrag, summa)
 * och `forklara` ger texten i förklaringsrutan vid raden.
 */
const JAMFOR_OVERSKOTT = [
  { etikett: 'Överskott/år före lokala poster (kr)', klass: 'rak-start', dec: 0, hamta: r => r.overskott,
    forklara: r => 'Intäkt ' + fmt(r.intaktAr1, 0) + ' − drift ' + fmt(r.driftkostnadAr1, 0) + ' − kapitalkostnad ' + fmt(r.kapitalkostnad, 0) + ' kr per år. Därefter dras de lokala posterna av.' },
  { etikett: 'Dras av: arrende (kr/år)', klass: 'rak-avdrag', dec: 0, hamta: r => 0 - r.arrendeAr1,
    forklara: r => arrendeForklaring(r) },
  { etikett: 'Dras av: fastighetsskatt (kr/år)', klass: 'rak-avdrag', dec: 0, hamta: r => 0 - r.fskattAr1,
    forklara: r => r.fskattAr1 > 0
      ? 'Fastighetsskatt per verk år 1 × antal verk: ' + fmt(r.fskattAr1 / Math.max(1, r.antalverk), 0) + ' × ' + r.antalverk + ' = ' + fmt(r.fskattAr1, 0) + ' kr per år. Skatten går till staten.'
      : 'Fastighetsskatt saknar belopp (0 kr). Fyll i den i gruppen Kommun & samhälle.' },
  { etikett: 'Dras av: bygdemedel (kr/år)', klass: 'rak-avdrag', dec: 0, hamta: r => 0 - r.bygdeAr1,
    forklara: r => r.bygdeAr1 > 0
      ? 'Bygdemedel för hela parken: ' + fmt(r.bygdeAr1, 0) + ' kr per år. Frivilligt, och inte reglerat av intäktsdelningslagen.'
      : 'Bygdemedel saknar belopp (0 kr). Fyll i det i gruppen Kommun & samhälle.' },
  { etikett: 'Dras av: närboendeersättning (kr/år)', klass: 'rak-avdrag', dec: 0,
    hamta: r => 0 - (r.narboendeAr1 !== undefined ? r.narboendeAr1 : r.narboendeTotalAr1),
    forklara: r => r.nar && r.nar.metod === 'zoner'
      ? 'Ersättningen per zon summerar till ' + fmt(r.nar.fore, 0) + ' kr före tak. Taket är 2 % av intäkten, ' + fmt(r.nar.cap, 0) + ' kr, och utbetalt blir ' + fmt(r.nar.utbetalt, 0) + ' kr per år. Se tabellen över närboende i fliken Närboende.'
      : 'Ersättning till närboende enligt vald metod.' },
  { etikett: 'Överskott/år efter lokala poster (kr)', klass: 'rak-summa', dec: 0, hamta: r => r.overskottNetto,
    forklara: r => 'Överskott före lokala poster − arrende − fastighetsskatt − bygdemedel − närboendeersättning = ' + fmt(r.overskottNetto, 0) + ' kr per år.' }
];

/**
 * Markerar en rad i sammanställningen som en del av uträkningen (klassen) och lägger en förklaringsruta vid radens namn.
 * @param {HTMLElement} tr      raden
 * @param {HTMLElement} tdNamn  cellen med radens namn
 * @param {object} nt           radens definition (klass, forklara)
 * @param {object} res          senaste resultatet, eller null
 */
function jamforRadExtras(tr, tdNamn, nt, res) {
  if (nt.klass) tr.className = nt.klass;
  if (nt.forklara && res) {
    const s = document.createElement('span');
    s.className = 'hjalp'; s.tabIndex = 0; s.textContent = '?';
    s.setAttribute('data-hjalp', nt.forklara(res));
    tdNamn.appendChild(document.createTextNode(' '));
    tdNamn.appendChild(s);
  }
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
    bostPerZon: d.bost.slice(), verkPerBostad, verkIntakt,
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
  skrivZonHjalp(nar, H);
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

/**
 * Hur många bostäder som kan få ersättning innan taket (2 %, 14 §) nås, med samma fördelning på zoner som angetts.
 * Fördelningen skalas upp eller ned tills summan före tak är lika med taket. Returnerar null utan bostäder eller utan zonmetod.
 * @param {object} nar        resultat från beraknaNarboendeZoner
 * @param {number} antalverk  antal verk i parken
 */
function narboendeTakniva(nar, antalverk) {
  if (nar.metod !== 'zoner' || !(nar.fore > 0) || !(nar.antal > 0)) return null;
  const bostader = nar.antal * nar.cap / nar.fore;
  return { bostader, perVerk: bostader / Math.max(1, antalverk), nasRedan: nar.taketNas };
}

/**
 * Hur många bostäder till som får full ersättning innan taket (2 %, 14 §) nås.
 * Taket är cap kr per år. De bostäder som redan är angivna får fore kr före tak. Det som är kvar under taket är cap − fore.
 * En extra bostad i zon i kostar perBostadFore[i] kr per år, så antalet extra bostäder är kvarvarande belopp delat på det,
 * avrundat nedåt. Tre fall räknas: alla extra bostäder i en viss zon, extra bostäder jämnt fördelade (lika många i varje zon)
 * och extra bostäder med samma fördelning som de angivna.
 * @param {object} nar  resultat från beraknaNarboendeZoner
 */
function narboendeExtra(nar) {
  if (nar.metod !== 'zoner') return null;
  const kvar = nar.cap - nar.fore;
  const golv = (x) => Math.floor(x + 1e-9);
  const rader = nar.perBostadFore.map((p, i) => ({ zon: i + 1, perBostad: p, extra: kvar > 0 && p > 0 ? golv(kvar / p) : 0 }));
  const summa = nar.perBostadFore.reduce((a, b) => a + b, 0);
  const omgangar = kvar > 0 && summa > 0 ? golv(kvar / summa) : 0;
  const samma = nar.antal > 0 && nar.fore > 0 ? Math.max(0, golv(nar.antal * nar.cap / nar.fore - nar.antal)) : null;
  return { kvar: Math.max(0, kvar), taketNasRedan: kvar <= 0, cap: nar.cap, fore: nar.fore, rader,
           jamnt: { omgangar, extra: omgangar * NARBOENDE_ZONER.length, perOmgang: summa }, sammaFordelning: samma };
}

/** Förklaringstext för en zon: vad en bostad i zonen får per år och hur det räknas. */
function zonHjalpText(nar, i, H) {
  if (nar.metod !== 'zoner') return '';
  const z = NARBOENDE_ZONER[i];
  let t = 'Zon ' + (i + 1) + ' (' + z.fran + '–' + z.till + ' verkshöjder, ' + zonEtikett(z, H) + '): en bostad här får ' +
    fmt(nar.perBostadEfter[i], 0) + ' kr per år. Beräkning: ' + fmt(z.promille, 1) + ' ‰ av ett verks intäkt (' +
    fmt(nar.verkIntakt, 0) + ' kr per år) × ' + nar.verkPerBostad + ' verk.';
  if (nar.taketNas) t += ' Taket (2 %) har nåtts, så beloppet är sänkt från ' + fmt(nar.perBostadFore[i], 0) + ' kr.';
  return t;
}

/** Skriver förklaringen i elementen zon-hjalp-1..5 (attributet data-hjalp), så att den visas vid hovring, fokus och tryck. */
function skrivZonHjalp(nar, H) {
  for (let i = 0; i < NARBOENDE_ZONER.length; i++) {
    const e = document.getElementById('zon-hjalp-' + (i + 1));
    if (e) e.setAttribute('data-hjalp', zonHjalpText(nar, i, H) || 'Fyll i antal bostäder för att se.');
  }
}

/** Fyller tabellen med extra bostäder (kropp prefix-extra-kropp) och förklarande text (prefix-extra-text). */
function ritaNarboendeExtra(prefix, nar) {
  const kropp = document.getElementById(prefix + '-extra-kropp');
  const text = document.getElementById(prefix + '-extra-text');
  const x = narboendeExtra(nar);
  if (!kropp || !x) return;
  kropp.innerHTML = '';
  const rad = (a, b, c2, klass) => {
    const tr = document.createElement('tr');
    if (klass) tr.className = klass;
    [a, b, c2].forEach((v, i) => { const td = document.createElement(i === 0 ? 'th' : 'td'); if (i === 0) td.scope = 'row'; else td.className = 'tal'; td.textContent = v; tr.appendChild(td); });
    kropp.appendChild(tr);
  };
  x.rader.forEach(r => rad('Zon ' + r.zon, r.perBostad > 0 ? fmt(r.perBostad, 0) : '–', r.perBostad > 0 ? fmt(r.extra, 0) : '–'));
  rad('Jämnt fördelade, lika många i varje zon', x.jamnt.perOmgang > 0 ? fmt(x.jamnt.perOmgang, 0) + ' per omgång om fem' : '–', x.jamnt.perOmgang > 0 ? fmt(x.jamnt.extra, 0) : '–');
  rad('Med samma fördelning som du angett', '–', x.sammaFordelning === null ? '–' : fmt(x.sammaFordelning, 0), 'summa');
  if (text) {
    text.textContent = 'Så räknas det: taket är 2 % av parkens intäkt år 1, alltså ' + fmt(x.cap, 0, ' kr') + ' per år. De bostäder du angett får ' +
      fmt(x.fore, 0, ' kr') + ' före tak. ' +
      (x.taketNasRedan
        ? 'Taket nås redan, så fler bostäder får inte full ersättning: alla ersättningar sänks i proportion. '
        : 'Det som är kvar under taket är ' + fmt(x.kvar, 0, ' kr') + '. ') +
      'En extra bostad i en zon kostar den zonens belopp per år, så antalet extra bostäder är det som är kvar delat på beloppet, avrundat nedåt. ' +
      'Bostäder närmast verket kostar mest, så färre får plats där.';
  }
}

/**
 * Öppnar den resultatflik som innehåller ett element, om fliken är dold, och rullar dit. Länkar till en tabell eller rubrik
 * inne i en dold flik fungerar därför. Anropas en gång när sidan är byggd.
 */
function kopplaAnkareTillFlikar() {
  const oppna = (id) => {
    const el = document.getElementById(id);
    const panel = el && el.closest ? el.closest('.flik-panel') : null;
    if (!panel) return false;
    if (panel.hidden) {
      const knapp = document.querySelector('.flik-knapp[data-flik="' + panel.id.replace(/^panel-/, '') + '"]');
      if (knapp) knapp.click();
    }
    el.scrollIntoView();
    return true;
  };
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (id && oppna(id)) { ev.preventDefault(); try { history.replaceState(null, '', '#' + id); } catch (e) { /* ingen länkuppdatering */ } }
  });
  if (location.hash.length > 1) oppna(decodeURIComponent(location.hash.slice(1)));
}

/** Sammanfattningsraderna under zontabellen. prefix = id-prefix, t.ex. 't2' ger t2-fore, t2-tak, t2-nas, t2-skal, t2-snitt. */
function skrivNarboendeSummering(prefix, nar, antalverk) {
  if (nar.metod !== 'zoner') return;
  const satt = (id, v) => { const e = document.getElementById(prefix + '-' + id); if (e) e.textContent = v; };
  satt('fore', fmt(nar.fore, 0, ' kr/år'));
  satt('tak', fmt(nar.cap, 0, ' kr/år'));
  satt('skal', nar.taketNas ? fmt(nar.skal * 100, 1, ' % av beloppet före tak') : '100 % (taket nås inte)');
  satt('snitt', fmt(nar.snitt, 0, ' kr/bostad och år'));
  satt('nas', nar.taketNas ? 'Ja, taket nås och alla ersättningar sätts ned i proportion' : 'Nej, summan ligger under taket');
  ritaNarboendeExtra(prefix, nar);
  const tn = narboendeTakniva(nar, antalverk);
  satt('takbost', tn
    ? 'Cirka ' + fmt(tn.bostader, 0) + ' bostäder (cirka ' + fmt(tn.perVerk, 1) + ' per verk) med fördelningen i tabellen. Du har angett ' + fmt(nar.antal, 0) + '.'
    : 'Fyll i bostäder för att se.');
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
   Modellen: första åren (fskattaar) beloppet fskatt1, därefter ett jämnt belopp fskatt2 per år. Så får modellen samma
   form oavsett livslängd. Taxeringsvärdet skrivs ned med verkets ålder (Nvi-tabellen i Skatteverkets allmänna råd
   SKV A 2024:11), vilket gör skatten lägre efter de första åren. Kaufmann & Westander (2026) ger för ett verk på 6,6 MW
   i elområde 3 334 398 kr de första fyra åren och 6,64 Mkr över 30 år, alltså cirka 204 049 kr per år därefter.
   ============================================================================ */

/* ---------- Schablon för fastighetsskatt för vindkraftverk (Skatteverket AFT25) ----------
   Källa: Skatteverket (2024) SKV A 2024:11, Riktvärdeangivelser och grunderna för taxeringen och värdesättningen av
   elproduktionsenheter vid 2025 års allmänna fastighetstaxering (finns i repot: underlag/SKV_A_2024_11.pdf), avsnitt 2.1
   (riktvärde 8 600 kr/kW för vindkraftverk, mark och byggnad), 2.3.1 (elprisfaktorer) och 2.3.3 (fullasttimmar).
   Fördelningen 73,5 % byggnad och 1,5 % mark, avrundningen nedåt till hela miljoner och skattesatsen 0,5 % kommer ur
   Kaufmann & Westander (2026, bilaga 1, s. 17–18), vars exempel (6,6 MW, elområde 3, 3 609,85 fullasttimmar) ger 334 398 kr.
   Avrundningen nedåt är hämtad ur det exemplet. Den står inte i Skatteverkets text, och för små verk ger den en lägre siffra.
   Skatten första åren beräknas här. Åren därefter är skatten lägre eftersom taxeringsvärdet skrivs ned med verkets ålder (Nvi-tabellen,
   bilaga 2). Kvoten mot första årens belopp, cirka 0,61, är hämtad ur Kaufmann & Westanders totalsumma (6,64 Mkr över 30 år). */
const FSKATT_SCHABLON = {
  riktvarde: 8600,                 // kr per kW, nybyggt vindkraftverk, mark och byggnad
  byggandel: 0.735,                // andel av riktvärdet som avser byggnaden (verket)
  markandel: 0.015,                // markens värde som andel av riktvärdet
  skattesats: 0.005,               // 0,5 % av taxeringsvärdet
  elprisfaktor: { SE1: -0.160, SE2: -0.192, SE3: 0.190, SE4: 0.348 },   // justering av riktvärdet per elområde
  nedskrivningKvot: 204049 / 334398 // skatt åren därefter / skatt första åren
};

/** Justeringsfaktor för avvikande fullasttimmar per år (SKV A 2024:11, avsnitt 2.3.3). Faktorn adderas till 1. */
const FULLAST_JUSTERING = [
  [5601, 1.12], [5401, 1.04], [5201, 0.96], [5001, 0.88], [4801, 0.81], [4601, 0.73], [4401, 0.65], [4201, 0.58],
  [4001, 0.50], [3801, 0.42], [3601, 0.35], [3401, 0.27], [3201, 0.19], [3001, 0.12], [2801, 0.04], [2400, 0.00],
  [2200, -0.04], [2000, -0.12], [1800, -0.19], [1600, -0.27], [1400, -0.35], [1200, -0.42], [1000, -0.50], [800, -0.58], [0, -0.65]
];

function fullastJustering(timmar) {
  for (const [fran, j] of FULLAST_JUSTERING) if (timmar >= fran) return j;
  return FULLAST_JUSTERING[FULLAST_JUSTERING.length - 1][1];
}

/**
 * Schablon för fastighetsskatt per verk.
 * @param {number} kwPerVerk     installerad effekt per verk (kW)
 * @param {string} elomrade      'SE1'..'SE4'
 * @param {number} fullasttimmar årsproduktion / installerad effekt (kapacitetsfaktor × 8 760)
 * @returns {{fskatt1:number, fskatt2:number, taxeringsvarde:number, elprisfaktor:number, fullastfaktor:number}}
 */
function fastighetsskattSchablon(kwPerVerk, elomrade, fullasttimmar) {
  const S = FSKATT_SCHABLON;
  const ep = 1 + (S.elprisfaktor[elomrade] !== undefined ? S.elprisfaktor[elomrade] : S.elprisfaktor.SE3);
  const ff = 1 + fullastJustering(fullasttimmar);
  const grund = Math.floor(S.byggandel * S.riktvarde * kwPerVerk / 1e6) * 1e6;     // avrundat nedåt till hela miljoner
  const taxeringsvarde = grund * ep * ff + S.markandel * S.riktvarde * kwPerVerk * ep;
  const fskatt1 = S.skattesats * taxeringsvarde;
  return { fskatt1, fskatt2: fskatt1 * S.nedskrivningKvot, taxeringsvarde, elprisfaktor: ep, fullastfaktor: ff };
}

/** Läser kommunposterna ur formuläret. Fält som saknas i en kalkyl räknas som 0. */
function lasKommunIndata() {
  return {
    fskatt1:    tal('fskatt1'),                          // kr per verk och år, första åren
    fskattaar:  Math.max(0, Math.round(tal('fskattaar'))), // antal år med den första nivån
    fskatt2:    tal('fskatt2'),                          // kr per verk och år, åren därefter
    bygdemedel: tal('bygdemedel'),                       // kr per år, hela parken
    kommunstod: tal('kommunstod')                        // kr per MW och år (staten betalar)
  };
}

/**
 * Fastighetsskatt för ett verk år t (kr): fskatt1 de första fskattaar åren, därefter fskatt2.
 * @param {number} t  år 1..n
 * @param {object} d  indata: fskatt1, fskattaar, fskatt2
 */
function fastighetsskattPerVerk(t, d) {
  return t <= d.fskattaar ? d.fskatt1 : d.fskatt2;
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
      fskatt: !(d.fskatt1 > 0) && !(d.fskatt2 > 0),
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
    KARNA_VERSION, INDATAGRUPPER, JAMFOR_OVERSKOTT, arrendeForklaring, fmt, annuitet, npv, irr, payback, lcoeAvKassaflode,
    natPaverkan, natEngangTillaggAv, natSammanfattning,
    lasKommunIndata, fastighetsskattPerVerk, kommunPoster, kommunSaknasText, narboendeTakniva, narboendeExtra, zonHjalpText,
    FSKATT_SCHABLON, fullastJustering, fastighetsskattSchablon,
    NARBOENDE_METOD, NARBOENDE_ZONER, beraknaNarboende, beraknaNarboendeZoner, beraknaNarboendeSchablon, realiseratPris
  };
}
