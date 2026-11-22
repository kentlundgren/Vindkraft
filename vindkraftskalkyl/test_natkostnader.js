/* ============================================================================
   test_natkostnader.js
   Kör med:  node test_natkostnader.js
   Kontrollerar nätkostnadsmodulen mot PRD_natkostnader.md (Tabell 6 och
   acceptanskriterierna i avsnitt 9) och datafilens struktur.
   ============================================================================ */
'use strict';
const N = require('./natkostnader_berakning.js');
const D = require('./natkostnader_exempel.js');

let fel = 0, ok = 0;
function lika(namn, faktiskt, forvantat, tol) {
  const t = tol === undefined ? 0.005 : tol;
  const bra = Number.isFinite(faktiskt) && Math.abs(faktiskt - forvantat) <= t;
  if (bra) ok++; else { fel++; console.log('FEL  ' + namn + ': fick ' + faktiskt + ', väntade ' + forvantat); }
}
function sant(namn, villkor) {
  if (villkor) ok++; else { fel++; console.log('FEL  ' + namn); }
}

const P = 20;                                   // MW (5 verk à 4 MW)
const brutto = P * 8760 * 0.37 * 1000;          // kWh/år = 64 824 000

// Indata ur ett fall: null/tomt blir 0, precis som tal() i kalkylen.
function indata(fall) {
  const d = {};
  N.NAT_FALT.forEach(id => { const v = fall.falt[id]; d[id] = (v === null || v === undefined) ? 0 : v; });
  d.natfaktorlag = 0.5; d.natfaktorhog = 1.5;
  return d;
}
const byid = {}; D.NAT_EXEMPEL.forEach(f => { byid[f.id] = f; });

/* Tabell 6: förväntade värden per exempelfall (läge bas, faktor 1). */
const T6 = {
  A: { fast: 3.40, rorlig: -2.62, kr: 505600, ore: 0.78, eng: 0 },
  B: { fast: 3.42, rorlig: -4.19, kr: -498100, ore: -0.77, eng: 0 },
  C: { fast: 0.43, rorlig: -3.87, kr: -2228700, ore: -3.44, eng: 6200 },
  D: { fast: 0.96, rorlig: 2.39, kr: 2169300, ore: 3.35, eng: 6200 },
  E: { fast: 0.90, rorlig: -4.04, kr: -2034900, ore: -3.14, eng: 6200 },
  F: { fast: 5.25, rorlig: 1.77, kr: 4549600, ore: 7.02, eng: 0 },
  G: { fast: 0, rorlig: 5.00, kr: 3241200, ore: 5.00, eng: 1000000 }
};
Object.keys(T6).forEach(id => {
  const r = N.beraknaNat(indata(byid[id]), 1, P, brutto);
  const t = T6[id];
  lika(id + ' fast del öre/kWh', r.lopandeOre.fastSumma, t.fast, 0.006);
  lika(id + ' rörlig del öre/kWh', r.lopandeOre.energi, t.rorlig, 0.006);
  lika(id + ' löpande kr/år', r.lopandeAr1, t.kr, 120);          // Tabell 6 är avrundad till 100 kr
  lika(id + ' löpande öre/kWh', r.lopandeOre.summa, t.ore, 0.006);
  lika(id + ' engång kr/MW', r.engangPerMW.summa, t.eng, 1);
  lika(id + ' fast + rörlig = summa', r.lopandeOre.fastSumma + r.lopandeOre.energi, r.lopandeOre.summa, 1e-9);
});

/* Acceptanskriterier (PRD avsnitt 9). */
{
  // Läge ingen ger noll i alla poster, även när fälten har värden.
  const r = N.beraknaNat(indata(byid.A), N.faktorForLage('ingen', {}), P, brutto);
  lika('ingen: natEngang', r.natEngang, 0); lika('ingen: löpande', r.lopandeAr1, 0);
  lika('ingen: bortfall', r.bortfall, 0);
  lika('ingen: produktion oförändrad', r.produktionAr1, brutto, 1e-6);

  // Engångskostnader i kr/MW: 24 000 kkr på 20 MW = 1 200 000 kr/MW = 10 % av 12 000 kkr/MW.
  const d1 = indata(byid.H); d1.natstation = 24000;
  const r1 = N.beraknaNat(d1, 1, P, brutto);
  lika('engång 24 000 kkr -> kr/MW', r1.engangPerMW.summa, 1200000, 0.5);
  lika('engång som procent av 12 000 kkr/MW', r1.engangPerMW.summa / (12000 * 1000) * 100, 10, 1e-6);

  // Löpande 100 000 kr/MW och år (2 000 000 kr/år) = cirka 3,09 öre/kWh.
  const d2 = indata(byid.H); d2.natfast = 2000000;
  lika('löpande 2 000 000 kr/år -> öre/kWh', N.beraknaNat(d2, 1, P, brutto).lopandeOre.summa, 3.085, 0.006);

  // Omvandling från kr/år och kr/kW: 2 000 000 kr/år + 15 kr/kW och år = cirka 3,55 öre/kWh.
  const d3 = indata(byid.H); d3.natfast = 2000000; d3.nateffekt = 15;
  lika('2 000 000 kr/år + 15 kr/kW -> öre/kWh', N.beraknaNat(d3, 1, P, brutto).lopandeOre.summa, 3.548, 0.006);

  // Schablon: 1 000 kkr/MW och 20 MW = 20 000 kkr = 20 000 000 kr.
  const d4 = indata(byid.H); d4.natengangschablon = 1000;
  lika('schablon 1 000 kkr/MW på 20 MW', N.beraknaNat(d4, 1, P, brutto).natEngang, 20000000, 1);

  // Produktionsbortfall 5 procent.
  const d5 = indata(byid.H); d5.natsysbortfall = 5;
  lika('bortfall 5 %: produktion', N.beraknaNat(d5, 1, P, brutto).produktionAr1, brutto * 0.95, 1);

  // Faktor: låg 0,5 och hög 1,5 skalar fast del och engång men inte energiavgiften.
  const d6 = indata(byid.A);
  const bas = N.beraknaNat(d6, 1, P, brutto), lag = N.beraknaNat(d6, 0.5, P, brutto), hog = N.beraknaNat(d6, 1.5, P, brutto);
  lika('låg: fast del halveras', lag.lopande.fastSumma, bas.lopande.fastSumma * 0.5, 1);
  lika('hög: fast del 1,5 gånger', hog.lopande.fastSumma, bas.lopande.fastSumma * 1.5, 1);
  lika('energiavgift skalas inte (låg)', lag.lopande.energi, bas.lopande.energi, 1e-6);
  lika('energiavgift skalas inte (hög)', hog.lopande.energi, bas.lopande.energi, 1e-6);

  // Negativ energidel ger negativt nyckeltal.
  sant('negativ energidel ger negativt öre/kWh (fall C)', N.beraknaNat(indata(byid.C), 1, P, brutto).lopandeOre.energi < 0);

  // Årlig förändring.
  const d7 = indata(byid.A); d7.natforandring = 2;
  const r7 = N.beraknaNat(d7, 1, P, brutto);
  lika('förändring 2 %: år 3 fast del', r7.lopandeAr(3, 0) - 0, (bas.lopande.fastSumma) * Math.pow(1.02, 2), 1);
}

/* Datafilens struktur. */
sant('minst sju exempelfall', D.NAT_EXEMPEL.length >= 7);
const ids = {}; D.NAT_REGELVERK.forEach(r => { ids[r.id] = r; });
D.NAT_EXEMPEL.forEach(f => {
  sant(f.id + ' har alla nätfält', N.NAT_FALT.every(k => Object.prototype.hasOwnProperty.call(f.falt, k)));
  sant(f.id + ' pekar bara på kända regelverk', f.regelverk.every(r => ids[r]));
  if (f.belagd) sant(f.id + ' belagt fall har kontrolldatum', !!f.kontrollerad);
  if (f.belagd) sant(f.id + ' belagt fall har källa med länk', f.kalla.length > 0 && f.kalla.every(k => k.url));
});
sant('fall G är markerat som ej belagt', byid.G.belagd === false);
sant('inget normalfall är utsett än', D.NAT_NORMALFALL === null);
sant('alla belagda fall har komplett.lopande', D.NAT_EXEMPEL.filter(f => f.belagd).every(f => f.komplett.lopande));


/* Ett verk (4 MW) mot fem verk (20 MW): fast årsavgift per anslutning ger fler öre/kWh för ett verk. */
{
  const P1 = 4, b1 = P1 * 8760 * 0.37 * 1000;
  const o = (id, PP, bb) => N.beraknaNat(indata(byid[id]), 1, PP, bb).lopandeOre.summa;
  lika('fall A, fem verk', o('A', P, brutto), 0.78, 0.01);
  lika('fall A, ett verk', o('A', P1, b1), 8.49, 0.01);
  lika('fall B, fem verk', o('B', P, brutto), -0.77, 0.01);
  lika('fall B, ett verk', o('B', P1, b1), 3.43, 0.01);
  lika('fall E, fem verk', o('E', P, brutto), -3.14, 0.01);
  lika('fall E, ett verk', o('E', P1, b1), -2.25, 0.01);
  ['C', 'D', 'F', 'G'].forEach(id => lika('fall ' + id + ' oförändrat med antal verk', o(id, P1, b1), o(id, P, brutto), 1e-9));
  // Fast årsavgift i kronor är densamma för ett verk och fem verk.
  lika('fall A: fast årsavgift i kr, ett verk', N.beraknaNat(indata(byid.A), 1, P1, b1).lopande.fast, 1250000, 1e-6);
  lika('fall A: fast årsavgift i kr, fem verk', N.beraknaNat(indata(byid.A), 1, P, brutto).lopande.fast, 1250000, 1e-6);
  sant('utgångspunkten finns med länk', D.NAT_UTGANGSPUNKT.length === 2 && D.NAT_UTGANGSPUNKT.every(k => k.url));
}


/* Typfall efter parkens effekt: B upp till 15 MW, A över. */
{
  const T = D.NAT_TYPFALL;
  sant('typfall: gränsen är 15 MW', T.gransMW === 15);
  sant('typfall: 4 MW ger B', N.typfallForEffekt(4, T).id === 'B');
  sant('typfall: 8 MW ger B', N.typfallForEffekt(8, T).id === 'B');
  sant('typfall: exakt 15 MW ger B', N.typfallForEffekt(15, T).id === 'B');
  sant('typfall: 20 MW ger A', N.typfallForEffekt(20, T).id === 'A');
  sant('typfall: 20 MW är inte stamnät', N.typfallForEffekt(20, T).stamnat === false);
  sant('typfall: 150 MW ger stamnätsnotis', N.typfallForEffekt(150, T).stamnat === true);
  sant('typfallens fall finns i datafilen', !!byid[T.litet] && !!byid[T.stort]);
  sant('typfallets källa har länk', !!T.kalla.url);
}


/* Källan om stamnätsanslutning och märkning av direktanslutna fall. */
{
  sant('stamnätskällan har länk', !!D.NAT_STAMNATSKALLA && /^https:\/\//.test(D.NAT_STAMNATSKALLA.url));
  const direkta = D.NAT_EXEMPEL.filter(f => f.typ === 'stamnät direkt').map(f => f.id).sort().join('');
  sant('direktanslutna fall är C, D och E', direkta === 'CDE');
}

console.log((fel === 0 ? 'ALLA TESTER OK' : 'TESTFEL') + ': ' + ok + ' godkända, ' + fel + ' fel');
process.exit(fel === 0 ? 0 : 1);
