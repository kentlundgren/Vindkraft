/* ============================================================================
   test_kalkylkarna.js
   Kör med:  node test_kalkylkarna.js
   Kontrollerar den gemensamma kärnan (kalkylkarna.js) och att alla kalkyler
   i mappen använder den i stället för egna kopior. Ändrar någon ett räknesätt i
   kärnan slår det igenom i alla kalkyler. Skulle en kalkyl återinföra en egen
   annuitet, npv, irr, payback, fmt, tal eller text fångar testet det.
   ============================================================================ */
'use strict';
const fs = require('fs');
const K = require('./kalkylkarna.js');
const N = require('./natkostnader_berakning.js');
const D = require('./natkostnader_exempel.js');

let fel = 0, ok = 0;
function lika(namn, faktiskt, forvantat, tol) {
  const t = tol === undefined ? 1e-6 : tol;
  if (Number.isFinite(faktiskt) && Math.abs(faktiskt - forvantat) <= t) ok++;
  else { fel++; console.log('FEL  ' + namn + ': fick ' + faktiskt + ', väntade ' + forvantat); }
}
function sant(namn, villkor) { if (villkor) ok++; else { fel++; console.log('FEL  ' + namn); } }

/* ---------- Finansiella funktioner ---------- */
// Annuitet: 1 000 000 kr, 5 %, 10 år = 129 504,57 kr per år.
lika('annuitet 5 % 10 år', K.annuitet(1e6, 0.05, 10), 129504.57, 0.01);
lika('annuitet 0 % ränta', K.annuitet(1e6, 0, 10), 100000);
// NPV: −100 nu, 60 om ett år, 60 om två år, 10 % = 4,1322…
lika('npv', K.npv(0.10, [-100, 60, 60]), 4.132231, 1e-5);
// IRR för samma serie: ≈ 13,07 %
lika('irr', K.irr([-100, 60, 60]), 0.130662, 1e-4);
sant('irr utan teckenväxling ger NaN', Number.isNaN(K.irr([-100, -10, -10])));
// Payback: −100, +60, +60 → betalar tillbaka efter 1 + 40/60 år.
lika('payback', K.payback([-100, 60, 60]), 1 + 40 / 60, 1e-9);
sant('payback saknas om aldrig positivt', K.payback([-100, 10, 10]) === null);
// Formatering
sant('fmt tusental och suffix', K.fmt(1234567, 0, ' kr').replace(/\s/g, ' ') === '1 234 567 kr');
sant('fmt ej tal ger tankstreck', K.fmt(NaN) === '–');

/* ---------- LCOE ---------- */
// Investering 100, drift 10/år i 2 år, produktion 100 kWh/år, 0 % ränta, ingen nedmontering → (100 + 20) / 200 = 0,6
lika('lcoe 0 % ränta', K.lcoeAvKassaflode(100, [10, 10], [100, 100], 0, 0, 0).lcoe, 0.6);
// Med nedmontering 10 och restvärde 4 (0 % ränta): (100 + 20 + 10 − 4) / 200 = 0,63
lika('lcoe med nedmontering och restvärde', K.lcoeAvKassaflode(100, [10, 10], [100, 100], 0, 10, 4).lcoe, 0.63);
lika('lcoe diskonterad energi', K.lcoeAvKassaflode(100, [10, 10], [100, 100], 0.1, 0, 0).disEnergi, 100 / 1.1 + 100 / 1.21, 1e-9);

/* ---------- Nätkopplingen ---------- */
function indata(fall, extra) {
  const d = { natlage: 'bas', natengangingar: 'ja', natfaktorlag: 0.5, natfaktorhog: 1.5 };
  N.NAT_FALT.forEach(id => { const v = fall.falt[id]; d[id] = (v === null || v === undefined) ? 0 : v; });
  return Object.assign(d, extra);
}
const A = D.NAT_EXEMPEL.filter(f => f.id === 'A')[0];

// bruttoKWh: effekt × 8 760 h × kapacitetsfaktor, samma formel i alla kalkyler.
lika('bruttoKWh kapacitetsfaktor', N.bruttoKWh({ effekt: 4, antalverk: 5, kapfaktor: 0.37 }, 20), 20 * 8760 * 0.37 * 1000, 1e-3);
// Långhult: 3 610 fullasttimmar = kapacitetsfaktor 3 610 / 8 760 (förvalt värde 0,4121 i fältet).
lika('bruttoKWh Långhult (3 610 h)', N.bruttoKWh({ effekt: 6.6, antalverk: 20, kapfaktor: 3610 / 8760 }, 132), 6.6 * 1000 * 3610 * 20, 1e-3);
lika('kapacitetsfaktor 0,4121 ger 3 610 h inom 0,01 h', 0.4121 * 8760, 3610, 0.01);

// Långhult, fall A, 132 MW: löpande nätkostnad −4 938 424 kr/år (1 250 000 + 23,1·132 000 + 1,23·20·132 000 − 2,62 öre × 476 520 000 kWh).
const dL = indata(A, { effekt: 6.6, antalverk: 20, kapfaktor: 3610 / 8760 });
const brL = N.bruttoKWh(dL, 132);
const pL = K.natPaverkan(dL, 132, brL);
lika('Långhult fall A löpande kr/år', pL.nat.lopandeAr1, 1250000 + 23.1 * 132000 + 1.23 * 20 * 132000 - 0.0262 * 476520000, 1);
lika('Långhult fall A öre/kWh', pL.nat.lopandeOre.summa, -1.0363, 0.001);

// Läge ingen: ingen påverkan på kalkylen, men panelen visar bas.
const pI = K.natPaverkan(Object.assign({}, dL, { natlage: 'ingen' }), 132, brL);
lika('läge ingen: nat löpande = 0', pI.nat.lopandeAr1, 0);
lika('läge ingen: nat engång = 0', pI.nat.natEngang, 0);
lika('läge ingen: nat bortfall = 0', pI.nat.bortfall, 0);
lika('läge ingen: panelen räknar som bas', pI.natPanel.lopandeAr1, pL.nat.lopandeAr1, 1e-6);

// Engångskostnad läggs bara till när natengangingar = nej.
sant('engång ingår (ja): inget tillägg', K.natEngangTillaggAv({ natengangingar: 'ja' }, { natEngang: 500 }) === 0);
sant('engång läggs till (nej)', K.natEngangTillaggAv({ natengangingar: 'nej' }, { natEngang: 500 }) === 500);

// natSammanfattning: nätkostnad per kWh över livslängden = diskonterad nätkostnad / diskonterad energi.
const n = 3, r = 0.05, prod = [1000, 1000, 1000];
const natLiten = { lopandeAr: (t, p) => 10, lopandeAr1: 10 };
const S = K.natSammanfattning({ nat: natLiten, natPanel: natLiten, natEngangTillagg: 0, investeringGrund: 1000, investering: 1000, prodkWhAr: prod, r, n, lcoe: 1, disEnergi: 1000 / 1.05 + 1000 / 1.05 ** 2 + 1000 / 1.05 ** 3 });
lika('nät per kWh över livslängden', S.natPerkWhLivs, 10 / 1000, 1e-9);
lika('nätens andel av LCOE', S.natAndelLcoe, 10 / 1000, 1e-9);
lika('diagrampost utan engång = löpande år 1', S.natChart, 10, 1e-9);

/* ---------- Närboendeersättning (SFS 2026:1113, 11–14 §§) ---------- */
sant('aktiv närboendemetod är zoner', K.NARBOENDE_METOD === 'zoner');
lika('fem zoner', K.NARBOENDE_ZONER.length, 5);
lika('zon 1 promille', K.NARBOENDE_ZONER[0].promille, 2.5);
lika('zon 5 promille', K.NARBOENDE_ZONER[4].promille, 0.5);
// Ett verks intäkt 1 000 000 kr, två verk per bostad, 10 bostäder i zon 1 (2,5 ‰): 2,5 ‰ × 1 000 000 × 2 × 10 = 50 000 kr.
const nb = { bost: [10, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 20 };
const z1 = K.beraknaNarboendeZoner(1e6, 20e6, nb);
lika('zon 1: summa före tak', z1.fore, 50000);
lika('zon 1: per bostad före tak', z1.perBostadFore[0], 5000);
sant('taket nås inte', !z1.taketNas && z1.utbetalt === 50000);
// Alla fem zoner med en bostad var: (2,5 + 2,0 + 1,5 + 1,0 + 0,5) ‰ × 1 000 000 × 2 = 15 000 kr.
lika('en bostad per zon', K.beraknaNarboendeZoner(1e6, 20e6, { bost: [1, 1, 1, 1, 1], verkperbostad: 2, tak: 0.02, antalverk: 20 }).fore, 15000);
// 14 §: taket 2 % av 20 000 000 = 400 000 kr. 100 bostäder i zon 1 ger 500 000 före tak → sätts ned i proportion.
const ztak = K.beraknaNarboendeZoner(1e6, 20e6, { bost: [100, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 20 });
lika('taket: före tak', ztak.fore, 500000);
lika('taket: utbetalt', ztak.utbetalt, 400000);
lika('taket: nedsättning', ztak.skal, 0.8);
lika('taket: per bostad efter tak', ztak.perBostadEfter[0], 4000);
sant('taket: taketNas', ztak.taketNas);
// 13 §: aldrig ersättning från fler verk än parken har. Ett verk: 2,5 ‰ × 1 000 000 × 1 × 10 = 25 000 kr.
lika('ett verk ger ersättning från ett verk', K.beraknaNarboendeZoner(1e6, 1e6, { bost: [10, 0, 0, 0, 0], verkperbostad: 2, tak: 1, antalverk: 1 }).fore, 25000);
// Den aktiva metoden används av beraknaNarboende.
lika('beraknaNarboende = zoner', K.beraknaNarboende(1e6, 20e6, nb).utbetalt, z1.utbetalt);
sant('metod markeras på resultatet', K.beraknaNarboende(1e6, 20e6, nb).metod === 'zoner');

// Den inaktiva schablonen finns kvar och räknar som förut: 2,5 ‰ × distansfaktor × (verkets intäkt × verk inom 5) × bostäder.
const sch = { verkshojd: 200, avstand: 800, verkinom5: 2, antalbostader: 20, maxpromille: 0.0025 };
const s1 = K.beraknaNarboendeSchablon(1e6, 20e6, sch);
lika('schablon: inom fem verkshöjder (distansfaktor 1)', s1.utbetalt, 0.0025 * 1 * (1e6 * 2) * 20);
lika('schablon: distansfaktor', s1.distansfaktor, 1);
// 7 verkshöjder (1 400 m) = mitt emellan 5 (1 000 m) och 9 (1 800 m) → faktor 0,5
lika('schablon: linjär avtrappning', K.beraknaNarboendeSchablon(1e6, 20e6, Object.assign({}, sch, { avstand: 1400 })).distansfaktor, 0.5);
lika('schablon: utanför nio verkshöjder', K.beraknaNarboendeSchablon(1e6, 20e6, Object.assign({}, sch, { avstand: 1900 })).utbetalt, 0);
// Zonmetoden med 20 bostäder i zon 1 och ingen tak-påverkan ger samma belopp som schablonen inom fem verkshöjder.
lika('zoner och schablon stämmer inom fem verkshöjder', K.beraknaNarboendeZoner(1e6, 1e9, { bost: [20, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 5 }).utbetalt, s1.utbetalt);

/* ---------- Pris: realiserat pris = spotpris × prisfaktor ---------- */
lika('realiserat pris år 1, prisfaktor 1', K.realiseratPris(0.6, 0, 1, 1), 0.6);
lika('realiserat pris år 1, prisfaktor 0,75', K.realiseratPris(0.5, 0, 0.75, 1), 0.375);
lika('realiserat pris år 3 med 2 %/år', K.realiseratPris(0.5, 0.02, 0.75, 3), 0.5 * 1.02 ** 2 * 0.75, 1e-12);

/* ---------- Kommunposter: fastighetsskatt, bygdemedel, kommunstöd ---------- */
// Långhult (Kaufmann & Westander, 2026): 334 398 kr per verk de första 4 åren, därefter cirka 204 049 kr per år (6,64 Mkr över 30 år).
const dK = { fskatt1: 334398, fskattaar: 4, fskatt2: 204049, bygdemedel: 400000, kommunstod: 20000, antalverk: 20, livslangd: 30 };
lika('fastighetsskatt år 1', K.fastighetsskattPerVerk(1, dK), 334398);
lika('fastighetsskatt år 4', K.fastighetsskattPerVerk(4, dK), 334398);
lika('fastighetsskatt år 5', K.fastighetsskattPerVerk(5, dK), 204049);
const kp = K.kommunPoster(dK, 132);
lika('summa fastighetsskatt per verk över 30 år ≈ 6,64 Mkr', kp.fskattTotal / 20, 6643000, 1000);
lika('fastighetsskatt år 1, hela parken', kp.fskattAr1, 334398 * 20);
lika('bygdemedel år 1', kp.bygdeAr1, 400000);
lika('bygdemedel totalt', kp.bygdeTotal, 400000 * 30);
lika('kommunstöd år 1 = kr/MW × MW', kp.kommunstodAr1, 20000 * 132);
sant('inget saknas med Långhults värden', !kp.saknas.fskatt && !kp.saknas.bygde && !kp.saknas.kommunstod && K.kommunSaknasText(kp) === '');
// Livslängd 25 år: samma belopp per år, kortare summa.
lika('livslängd 25 år: summa = 4 × år 1 + 21 × därefter', K.kommunPoster(Object.assign({}, dK, { livslangd: 25 }), 132).fskattTotal / 20, 4 * 334398 + 21 * 204049, 1e-6);
// Tomma värden ger varning, och posterna är 0.
const dTom = { fskatt1: 0, fskattaar: 4, fskatt2: 0, bygdemedel: 0, kommunstod: 20000, antalverk: 3, livslangd: 25 };
const kpTom = K.kommunPoster(dTom, 9.9);
lika('tomma värden: fastighetsskatt 0', kpTom.fskattTotal, 0);
sant('tomma värden: varning nämner fastighetsskatt och bygdemedel', /fastighetsskatt och bygdemedel saknar belopp/.test(K.kommunSaknasText(kpTom)));
sant('tomma värden: kommunstöd saknas inte', !kpTom.saknas.kommunstod);

// Schablonen för fastighetsskatt (kalkylkarna.js, fastighetsskattSchablon): SKV A 2024:11 och Kaufmann & Westander (2026, bilaga 1).
const sch63 = K.fastighetsskattSchablon(6600, 'SE3', 3609.85);
lika('schablon: 6,6 MW i elområde 3 = 334 398 kr (Kaufmann & Westander, 2026)', sch63.fskatt1, 334398, 1);
lika('schablon: taxeringsvärde 66,9 Mkr', sch63.taxeringsvarde, 66879666, 1000);
lika('schablon: elprisfaktor SE3', sch63.elprisfaktor, 1.19);
lika('schablon: fullasttidsfaktor 3 610 h', sch63.fullastfaktor, 1.35);
lika('schablon: 6,6 MW i elområde 4', K.fastighetsskattSchablon(6600, 'SE4', 3609.85).fskatt1, 378797, 1);
lika('schablon: SE4 per MW (57 394 kr/MW)', K.fastighetsskattSchablon(6600, 'SE4', 3609.85).fskatt1 / 6.6, 57394, 1);
lika('schablon: åren därefter ≈ 204 049 kr i SE3', sch63.fskatt2, 204049, 1);
// Fullasttidsjustering enligt tabellen i avsnitt 2.3.3
lika('fullasttid 2 400 h: ingen justering', K.fullastJustering(2400), 0);
lika('fullasttid 2 800 h: ingen justering', K.fullastJustering(2800), 0);
lika('fullasttid 2 801 h', K.fullastJustering(2801), 0.04);
lika('fullasttid 3 241 h (huvudkalkylen)', K.fullastJustering(3241), 0.19);
lika('fullasttid 3 610 h', K.fullastJustering(3610), 0.35);
lika('fullasttid 2 399 h', K.fullastJustering(2399), -0.04);
lika('fullasttid 2 293 h (Önnerup)', K.fullastJustering(2293), -0.04);
lika('fullasttid under 800 h', K.fullastJustering(500), -0.65);
// Önnerup: 3,3 MW i elområde 4 med 2 293 h: grundriktvärde 20 Mkr × 1,348 × 0,96 + mark, × 0,5 %
lika('schablon: Önnerup (3,3 MW, SE4, 2 293 h)', K.fastighetsskattSchablon(3300, 'SE4', 0.2618 * 8760).fskatt1, 0.005 * (20e6 * 1.348 * 0.96 + 0.015 * 8600 * 3300 * 1.348), 1);

// Taket för närboendeersättning: 10 bostäder i zon 1 ger 50 000 kr före tak mot taket 400 000 kr, alltså 80 bostäder (4 per verk vid 20 verk).
const tn = K.narboendeTakniva(K.beraknaNarboendeZoner(1e6, 20e6, { bost: [10, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 20 }), 20);
lika('taknivå: bostäder när taket nås', tn.bostader, 80);
lika('taknivå: per verk', tn.perVerk, 4);
sant('taknivå: taket nås inte med 10 bostäder', !tn.nasRedan);
sant('taknivå: ingen uppgift utan bostäder', K.narboendeTakniva(K.beraknaNarboendeZoner(1e6, 20e6, { bost: [0, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 20 }), 20) === null);

// Extra bostäder under taket: 10 bostäder i zon 1 (50 000 kr före tak), taket 400 000 kr, ett verks intäkt 1 000 000 kr, två verk per bostad.
const nbx = K.beraknaNarboendeZoner(1e6, 20e6, { bost: [10, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 20 });
const ex = K.narboendeExtra(nbx);
lika('extra: kvar under taket', ex.kvar, 350000);
lika('extra: bostäder till i zon 1 (5 000 kr per bostad)', ex.rader[0].extra, 70);
lika('extra: bostäder till i zon 5 (1 000 kr per bostad)', ex.rader[4].extra, 350);
lika('extra: jämnt fördelat, kostnad per omgång om fem', ex.jamnt.perOmgang, 15000);
lika('extra: jämnt fördelat, antal omgångar', ex.jamnt.omgangar, 23);
lika('extra: jämnt fördelat, antal bostäder', ex.jamnt.extra, 115);
lika('extra: samma fördelning (80 − 10)', ex.sammaFordelning, 70);
sant('extra: taket nås inte', !ex.taketNasRedan);
const exTak = K.narboendeExtra(K.beraknaNarboendeZoner(1e6, 20e6, { bost: [100, 0, 0, 0, 0], verkperbostad: 2, tak: 0.02, antalverk: 20 }));
sant('extra: taket nås redan, inga extra bostäder', exTak.taketNasRedan && exTak.rader[0].extra === 0 && exTak.sammaFordelning === 0);
// Förklaring per zon
const zt = K.zonHjalpText(K.beraknaNarboendeZoner(1e6, 20e6, { bost: [1, 1, 1, 1, 1], verkperbostad: 2, tak: 0.02, antalverk: 20 }), 0, 150);
sant('zonförklaring nämner beloppet 5 000 kr och 2,5 ‰', /5 000 kr/.test(zt.replace(/\s/g, ' ')) && /2,5 ‰/.test(zt));

/* ---------- Sammanställningens rader för överskottet ---------- */
const rJ = { overskott: 1000, arrendeAr1: 100, fskattAr1: 50, bygdeAr1: 25, narboendeAr1: 200, overskottNetto: 625 };
const vJ = K.JAMFOR_OVERSKOTT.map(x => x.hamta(rJ));
lika('sammanställning: före lokala poster', vJ[0], 1000);
lika('sammanställning: avdragen är negativa', vJ[1] + vJ[2] + vJ[3] + vJ[4], -375);
lika('sammanställning: före + avdrag = efter', vJ[0] + vJ[1] + vJ[2] + vJ[3] + vJ[4], vJ[5]);
sant('sammanställning: ett avdrag som är noll visas som 0, inte −0', Object.is(K.JAMFOR_OVERSKOTT[2].hamta({ fskattAr1: 0 }), 0));
lika('sammanställning: närboende via narboendeTotalAr1 (huvudkalkylen)', K.JAMFOR_OVERSKOTT[4].hamta({ narboendeTotalAr1: 70 }), -70);

// Uträkningsmarkering och förklaringar i sammanställningen
sant('sammanställning: första raden är start, sista är summa', K.JAMFOR_OVERSKOTT[0].klass === 'rak-start' && K.JAMFOR_OVERSKOTT[5].klass === 'rak-summa');
sant('sammanställning: de fyra mittersta är avdrag', K.JAMFOR_OVERSKOTT.slice(1, 5).every(x => x.klass === 'rak-avdrag'));
sant('sammanställning: varje rad har en förklaring', K.JAMFOR_OVERSKOTT.every(x => typeof x.forklara === 'function'));
// Arrende: 3,5 % av en bruttointäkt på 7 778 880 kr = 272 261 kr, och fem verk ger fem gånger så mycket (1 361 304 kr).
const rA1 = { arrendeInfo: { modell: 'procent', procent: 0.035, krmw: 40000 }, arrendeAr1: 0.035 * 7778880, intaktAr1: 7778880, produktionMWh_ar1: 12965, realPris_ar1: 0.6, antalverk: 1, P_tot: 4 };
const rA5 = { arrendeInfo: { modell: 'procent', procent: 0.035, krmw: 40000 }, arrendeAr1: 0.035 * 38894400, intaktAr1: 38894400, produktionMWh_ar1: 64825, realPris_ar1: 0.6, antalverk: 5, P_tot: 20 };
lika('arrende ett verk', rA1.arrendeAr1, 272260.8, 0.01);
lika('arrende fem verk', rA5.arrendeAr1, 1361304, 0.01);
lika('arrende fem verk = 5 × ett verk', rA5.arrendeAr1, 5 * rA1.arrendeAr1, 1e-6);
const tA = K.arrendeForklaring(rA5).replace(/\s/g, ' ');
sant('arrendeförklaring: procent, intäkt och per verk', /3,5 %/.test(tA) && /38 894 400/.test(tA) && /272 261 kr per verk × 5 verk/.test(tA));
const tK = K.arrendeForklaring({ arrendeInfo: { modell: 'krmw', procent: 0.035, krmw: 40000 }, arrendeAr1: 160000, P_tot: 4 }).replace(/\s/g, ' ');
sant('arrendeförklaring: kr per MW', /40 000 kr per MW och år × 4,0 MW = 160 000 kr/.test(tK));

/* ---------- Alla kalkyler använder kärnan ---------- */
const KALKYLER = [
  { html: 'vindkraftskalkyl.html', js: 'berakningar.js' },
  { html: 'vindkraftskalkyl_langhult.html', js: 'berakningar_langhult.js' },
  { html: 'vindkraftskalkyl_Onnerup.html', js: 'berakningar.js' }
];
const FORBJUDNA = ['annuitet', 'npv', 'irr', 'payback', 'fmt', 'tal', 'text', 'radataNat', 'lcoeAvKassaflode', 'lasNatIndata', 'natPaverkan', 'natSammanfattning',
  'beraknaNarboende', 'beraknaNarboendeZoner', 'beraknaNarboendeSchablon', 'lasNarboendeIndata', 'zonEtikett', 'realiseratPris',
  'fastighetsskattPerVerk', 'lasKommunIndata', 'kommunPoster', 'kommunSaknasText', 'arrendeForklaring', 'visaArrendeForklaring', 'jamforRadExtras'];
KALKYLER.forEach(k => {
  const js = fs.readFileSync(k.js, 'utf8');
  const html = fs.readFileSync(k.html, 'utf8');
  FORBJUDNA.forEach(f => {
    sant(k.js + ' har ingen egen ' + f + '()', !new RegExp('^\\s*function\\s+' + f + '\\s*\\(', 'm').test(js));
  });
  sant(k.js + ' anropar lcoeAvKassaflode', /lcoeAvKassaflode\(/.test(js));
  sant(k.js + ' anropar natPaverkan', /natPaverkan\(/.test(js));
  sant(k.js + ' anropar beraknaNarboende', /beraknaNarboende\(/.test(js));
  sant(k.js + ' anropar realiseratPris', /realiseratPris\(/.test(js));
  sant(k.js + ' anropar kommunPoster', /kommunPoster\(/.test(js));
  sant(k.js + ' använder JAMFOR_OVERSKOTT i sammanställningen', /JAMFOR_OVERSKOTT/.test(js));
  sant(k.js + ' markerar uträkningen och förklarar raderna', /jamforRadExtras\(/.test(js));
  sant(k.html + ' har arrendeförklaringen', html.indexOf('id="mark-arrende-forklaring"') > -1);
  sant(k.html + ' kan länkas till med #kalkylsammanstallning', html.indexOf('id="kalkylsammanstallning"') > -1);
  sant(k.js + ' kopplar länkar till flikar', /kopplaAnkareTillFlikar\(\)/.test(js));
  sant(k.html + ' har förklaring per zon', html.indexOf('id="zon-hjalp-1"') > -1 && html.indexOf('id="zon-hjalp-5"') > -1);
  ['fskatt1', 'fskattaar', 'fskatt2', 'bygdemedel', 'kommunstod'].forEach(f => sant(k.html + ' har fältet ' + f, html.indexOf('id="' + f + '"') > -1));
  sant(k.js + ' räknar produktion med kapacitetsfaktor (inte fullasttimmar)', /kapfaktor/.test(js) && !/tal\('fullasttimmar'\)/.test(js));
  sant(k.html + ' har fältet prisfaktor', html.indexOf('id="prisfaktor"') > -1);
  sant(k.html + ' har fältet kapfaktor', html.indexOf('id="kapfaktor"') > -1);
  sant(k.html + ' laddar kalkylkarna.js före ' + k.js, html.indexOf('<script src="kalkylkarna.js">') > -1 && html.indexOf('<script src="kalkylkarna.js">') < html.indexOf('<script src="' + k.js + '">'));
  sant(k.html + ' laddar natkostnader.css', html.indexOf('natkostnader.css') > -1);
  sant(k.html + ' har rullgardinen Kalkyler', html.indexOf('class="kalkylmeny"') > -1);
});

/* ---------- Rubriker och ordning på indatagrupperna, och att varje kalkylsida är med i rullgardinen ---------- */
const dokument = JSON.parse(fs.readFileSync('dokument.json', 'utf8'));
const medMeny = dokument.kalkyler.map(x => x.fil);
fs.readdirSync('.').filter(f => /^vindkraftskalkyl.*\.html$/.test(f)).forEach(f => {
  sant(f + ' finns i kalkyler i dokument.json (rullgardinen Kalkyler)', medMeny.indexOf(f) > -1);
  const html = fs.readFileSync(f, 'utf8');
  const grupper = [];
  const re = /<fieldset class="indata-grupp"[^>]*>\s*<legend>([\s\S]*?)<\/legend>/g;
  let m;
  while ((m = re.exec(html))) {
    grupper.push(m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim());
  }
  const lika = grupper.length === K.INDATAGRUPPER.length && grupper.every((g, i) => g === K.INDATAGRUPPER[i]);
  if (!lika) console.log('  ' + f + ' har grupperna: ' + JSON.stringify(grupper));
  sant(f + ' har samma indatagrupper, med samma rubriker och i samma ordning, som INDATAGRUPPER', lika);
});

if (fel) { console.log(fel + ' fel, ' + ok + ' godkända'); process.exit(1); }
console.log('ALLA TESTER OK: ' + ok + ' godkända, 0 fel');
