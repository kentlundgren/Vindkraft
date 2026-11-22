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

   Filen laddas före respektive kalkyls egen fil. Funktionerna är globala i
   webbläsaren och exporteras som module.exports i Node, där test_kalkylkarna.js
   kör dem.

   Version 1.0 (2026-11-22): skapad. Funktionerna flyttades oförändrade ur
   berakningar.js och berakningar_langhult.js.
   ============================================================================ */
'use strict';

const KARNA_VERSION = '1.0';

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KARNA_VERSION, fmt, annuitet, npv, irr, payback, lcoeAvKassaflode,
    natPaverkan, natEngangTillaggAv, natSammanfattning
  };
}
