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

// Realiserat pris: spotpris × prisfaktor, med text som uppdateras
lika('realiserat pris Långhult: 0,50 × 0,75', K.realiseratPris(0.5, 0, 0.75, 1), 0.375);
sant('realpristext: 0,5 × 0,75 = 0,375', K.realpristext(0.5, 0.75).replace(/\s/g, ' ') === '0,5 kr/kWh × 0,75 = 0,375 kr/kWh');
sant('realpristext: 0,6 × 1 = 0,6 (huvudkalkylen)', K.realpristext(0.6, 1).replace(/\s/g, ' ') === '0,6 kr/kWh × 1 = 0,6 kr/kWh');
sant('realpristext: ändrad prisfaktor 0,8 ger 0,48', /= 0,48 kr\/kWh/.test(K.realpristext(0.6, 0.8)));
sant('realpristext: 0,55 × 0,75 visas exakt som 0,4125', /= 0,4125 kr\/kWh/.test(K.realpristext(0.55, 0.75)));
sant('realpristext: ogiltigt värde ger tankstreck', K.realpristext(NaN, 1) === '–');
{
  const neg = { natlage: 'bas', nat: { lopandeOre: { fastSumma: 2.5, energi: -3.9, summa: -1.4 }, engangPerMW: { summa: 0 } } };
  const pos = { natlage: 'bas', nat: { lopandeOre: { fastSumma: 2.5, energi: 0.5, summa: 3 }, engangPerMW: { summa: 0 } } };
  const ing = { natlage: 'ingen', nat: { lopandeOre: { fastSumma: 0, energi: 0, summa: 0 }, engangPerMW: { summa: 0 } } };
  sant('natLopandeNot: negativ nätkostnad beskrivs som ersättning', /ersättning \(kredit\)/.test(K.natLopandeNot(neg)));
  sant('natLopandeNot: positiv nätkostnad beskrivs som kostnad', /kostnad för parken/.test(K.natLopandeNot(pos)));
  sant('natLopandeNot: läge ingen säger 0', /Läge ingen.*0/.test(K.natLopandeNot(ing)));
  const fk = K.natLopandeForklaring(neg).replace(/\s/g, ' ');
  sant('natLopandeForklaring: negativ förklaras med kredit, förlustersättning, avsnitt 5.3 och att anslutningsavgiften saknas', /kredit/.test(fk) && /förlusterna/.test(fk) && /5\.3/.test(fk) && /anslutningsavgiften/.test(fk));
  sant('natLopandeForklaring: visar fast del, energi och summa', /2,50 öre\/kWh/.test(fk) && /−3,90 öre\/kWh/.test(fk) && /−1,40 öre\/kWh/.test(fk));
  sant('natLopandeForklaring: läge ingen ger 0 och ingen kreditförklaring', /ingen/.test(K.natLopandeForklaring(ing)) && !/kredit/.test(K.natLopandeForklaring(ing)));
  sant('JAMFOR_NAT: ingen ger 0 i båda raderna', K.JAMFOR_NAT[0].hamta(ing) === 0 && K.JAMFOR_NAT[1].hamta(ing) === 0);
}
sant('totalEffektText: 20 × 6,6 = 132 MW', K.totalEffektText(6.6, 20).replace(/\s/g, ' ') === '20 × 6,6 MW = 132 MW');
sant('totalEffektText: 5 × 4 = 20 MW', K.totalEffektText(4, 5).replace(/\s/g, ' ') === '5 × 4 MW = 20 MW');
sant('totalEffektText: ogiltigt värde ger tankstreck', K.totalEffektText(NaN, 5) === '–');

/* ---------- Alla kalkyler använder kärnan ---------- */
const KALKYLER = [
  { html: 'vindkraftskalkyl.html', js: 'berakningar.js' },
  { html: 'vindkraftskalkyl_langhult.html', js: 'berakningar_langhult.js' },
  { html: 'vindkraftskalkyl_Onnerup.html', js: 'berakningar.js' }
];
const FORBJUDNA = ['annuitet', 'npv', 'irr', 'payback', 'fmt', 'tal', 'text', 'radataNat', 'lcoeAvKassaflode', 'lasNatIndata', 'natPaverkan', 'natSammanfattning',
  'beraknaNarboende', 'beraknaNarboendeZoner', 'beraknaNarboendeSchablon', 'lasNarboendeIndata', 'zonEtikett', 'realiseratPris',
  'fastighetsskattPerVerk', 'lasKommunIndata', 'kommunPoster', 'kommunSaknasText', 'arrendeForklaring', 'visaArrendeForklaring', 'jamforRadExtras',
  'realpristext', 'visaRealiseratPris', 'totalEffektText', 'visaTotalEffekt', 'natLopandeForklaring', 'natLopandeNot', 'natEngangForklaring', 'narboendeStorleksordning', 'skrivNarboendeStorleksordning', 'takOrePerKWh'];
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
  sant(k.js + ' visar det realiserade priset', /visaRealiseratPris\(/.test(js));
  sant(k.html + ' har texten för realiserat pris', html.indexOf('id="realpris-visning"') > -1);
  sant(k.js + ' visar totala effekten', /visaTotalEffekt\(/.test(js));
  sant(k.js + ' använder JAMFOR_NAT för nätraderna i jämförelsetabellen', /\.\.\.JAMFOR_NAT/.test(js) && !/natPanel\.lopandeOre\.summa,\s*dec/.test(js));
  // Versionsrad längst ned i varje kalkyl: nummer och datum, båda höjs när något ändras.
  sant(k.js + ' har VERSION (X.Y) och VERSIONSDATUM (ÅÅÅÅ-MM-DD)', /^const VERSION = '\d+\.\d+';/m.test(js) && /^const VERSIONSDATUM = '\d{4}-\d{2}-\d{2}';/m.test(js));
  sant(k.js + ' visar versionsraden', /visaVersionsrad\(VERSION, VERSIONSDATUM\)/.test(js));
  sant(k.html + ' har versionsrad i sidfoten', html.indexOf('id="versionsrad-nr"') > -1 && html.indexOf('id="versionsrad-datum"') > -1 && html.indexOf('id="versionsrad-nr"') > html.indexOf('<footer'));
  sant(k.html + ' har raden Total effekt', html.indexOf('id="total-effekt-visning"') > -1);
  // Fälten i första gruppen står i samma ordning i alla kalkyler (INDATAORDNING_ANLAGGNING); ett fält som saknas hoppas över.
  const grupp = html.slice(html.indexOf('<legend>Anläggning &amp; investering</legend>'));
  const gruppSlut = grupp.slice(0, grupp.indexOf('</fieldset>'));
  const idn = [];
  const reId = /<(?:input|select|div|p)[^>]*\bid="([^"]+)"/g;
  let mi;
  while ((mi = reId.exec(gruppSlut))) if (K.INDATAORDNING_ANLAGGNING.indexOf(mi[1]) > -1) idn.push(mi[1]);
  const forvantat = K.INDATAORDNING_ANLAGGNING.filter(i => idn.indexOf(i) > -1);
  if (JSON.stringify(idn) !== JSON.stringify(forvantat)) console.log('  ' + k.html + ' har ordningen: ' + idn.join(', '));
  sant(k.html + ' har fälten i Anläggning & investering i fast ordning', idn.length >= 11 && JSON.stringify(idn) === JSON.stringify(forvantat));
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

/* ---------- Storleksordning: närboendeersättningen i öre per kWh ---------- */
{
  lika('takOrePerKWh: 2 % av 50 öre/kWh är 1 öre/kWh', K.takOrePerKWh(50, 2), 1, 1e-9);
  lika('takOrePerKWh: 2 % av 37,5 öre/kWh är 0,75 öre/kWh', K.takOrePerKWh(37.5, 2), 0.75, 1e-9);
  const intakt = 178694802, prod = 476520;   // kr och MWh, Långhult 20 verk, 0,375 kr/kWh
  const r = { intaktAr1: intakt, overskott: 22080209, produktionMWh_ar1: prod, realPris_ar1: 0.375,
    nar: { cap: intakt * 0.02, fore: 5000000, utbetalt: intakt * 0.02, snitt: 17869, antal: 200, taketNas: true } };
  const so = K.narboendeStorleksordning(r);
  lika('storleksordning: realiserat pris 37,5 öre/kWh', so.realOre, 37.5, 1e-9);
  lika('storleksordning: taket 0,75 öre/kWh', so.takOre, 0.75, 0.001);
  lika('storleksordning: taket är 2,0 % av intäkten', so.takProcent, 2, 1e-9);
  lika('storleksordning: utbetald andel av intäkten 2,0 %', so.andelIntakt, 2, 1e-9);
  sant('storleksordning: taket nås och utbetalt är lägre än före tak i öre/kWh', so.taketNas && so.utbetaltOre < so.foreOre);
  sant('storleksordning: utan produktion eller närboende ges null', K.narboendeStorleksordning({ nar: null }) === null && K.narboendeStorleksordning({ nar: r.nar, produktionMWh_ar1: 0, intaktAr1: 1 }) === null);
  const lhHtml2 = fs.readFileSync('vindkraftskalkyl_langhult.html', 'utf8');
  sant('Långhult har avsnittet Storleksordning med Tabell 8 och 9', ['Storleksordning', 'Tabell8', 'Tabell9', 'so-pris-kropp'].every(id => lhHtml2.indexOf('id="' + id + '"') > -1));
  sant('tabellen över taket markerar raden 50 öre/kWh, och 2 % av den är 1 öre/kWh', K.TAK_PRISER_ORE.indexOf(K.TAK_MARKERAD_ORE) > -1 && K.TAK_MARKERAD_ORE === 50 && K.takOrePerKWh(K.TAK_MARKERAD_ORE, 2) === 1 && /1 öre\/kWh/.test(K.TAK_MARKERAD_FORKLARING));
  sant('hjälpen visar förklaring för hela rader (data-hjalp-rad)', /data-hjalp-rad/.test(fs.readFileSync('natkostnader_hjalp.js', 'utf8')));
  sant('Långhult har källan BO (2026) med adress utan spårningsparametrar', /id="ref-bo"[\s\S]*?https:\/\/x\.com\/bengtxyz\/status\/2124776225822363881"/.test(lhHtml2));
  sant('Långhult anropar skrivNarboendeStorleksordning', /skrivNarboendeStorleksordning\(res\)/.test(fs.readFileSync('berakningar_langhult.js', 'utf8')));
}

/* ---------- Tabellernas nummer: i läsordning, utan luckor och dubbletter (nättabellen i panelen är en egen serie, Nättabell 1) ---------- */
fs.readdirSync('.').filter(f => /^vindkraftskalkyl.*\.html$/.test(f)).forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const nr = (html.match(/<caption[^>]*>\s*Tabell (\d+)\./g) || []).map(t => +t.match(/Tabell (\d+)\./)[1]);
  const vantat = nr.map((_, i) => i + 1);
  if (JSON.stringify(nr) !== JSON.stringify(vantat)) console.log('  ' + f + ' har tabellerna i ordningen: ' + nr.join(', '));
  sant(f + ': tabellerna är numrerade 1, 2, 3 … i läsordning, utan dubbletter', nr.length > 0 && JSON.stringify(nr) === JSON.stringify(vantat));
  sant(f + ': nättabellen i panelen heter Nättabell 1', /<caption id="NatTabell1">Nättabell 1\./.test(html));
  const ider = (html.match(/<table[^>]*id="Tabell(\d+)"/g) || []).map(t => +t.match(/Tabell(\d+)"/)[1]);
  sant(f + ': tabellernas id följer rubrikernas nummer', JSON.stringify(ider) === JSON.stringify(nr));
  const lank = [...html.matchAll(/<a href="#Tabell(\d+)">Tabell (\d+)<\/a>/g)];
  sant(f + ': varje länk till en tabell har samma nummer i adress och text, och tabellen finns', lank.every(m => m[1] === m[2] && nr.indexOf(+m[1]) > -1));
});

/* ---------- Riktvärdet för kapacitetsfaktorn: samma värden som projektkandidater/riktvarden.json, och blänkare i varje kalkyl ---------- */
{
  const json = JSON.parse(fs.readFileSync('../projektkandidater/riktvarden.json', 'utf8'));
  const R = K.KAPACITETSFAKTOR_RIKTVARDE;
  sant('riktvärdet i kalkylkärnan är samma som i riktvarden.json (procent, fullasttimmar, spann, antal, hämtdatum)',
    R.procent === json.kapacitetsfaktor_procent && R.fullasttimmar === json.fullasttimmar && R.lag === json.spann_procent[0] && R.hog === json.spann_procent[1] &&
    R.antal === json.antal_projekt && R.hamtad === json.hamtad);
  sant('riktvärdet 37 % motsvarar 3 241 fullasttimmar', Math.round(R.procent / 100 * 8760) === R.fullasttimmar);
  const norm = (t) => t.replace(/\s/g, ' ');
  sant('jämförelse: 0,37 är i nivå med riktvärdet', /i nivå med riktvärdet/.test(norm(K.jamforMedRiktvarde(0.37))));
  sant('jämförelse: 0,4121 är 4,2 procentenheter över', /Här: 41,2 %, 4,2 procentenheter över riktvärdet\./.test(norm(K.jamforMedRiktvarde(0.4121))));
  sant('jämförelse: 0,2618 är 10,8 procentenheter under', /Här: 26,2 %, 10,8 procentenheter under riktvärdet\./.test(norm(K.jamforMedRiktvarde(0.2618))));
  sant('jämförelse: ogiltigt värde ger tom text', K.jamforMedRiktvarde(NaN) === '' && K.jamforMedRiktvarde(0) === '');
  fs.readdirSync('.').filter(f => /^vindkraftskalkyl.*\.html$/.test(f)).forEach(f => {
    const html = fs.readFileSync(f, 'utf8');
    sant(f + ' har blänkaren om riktvärdet (kf-riktvarde) under kapacitetsfaktorn', html.indexOf('id="kf-riktvarde"') > html.indexOf('id="kapfaktor"') && html.indexOf('id="kf-riktvarde"') < html.indexOf('id="verkshojd"'));
    sant(f + ' har källan Länsstyrelserna (2026) Vindbrukskollen i källförteckningen', /Länsstyrelserna \(2026\) <em>Vindbrukskollen/.test(html));
    const ar = (html.match(/id="kf-riktvarde" data-berakning-ar="([^"]+)"/) || [])[1];
    sant(f + ': blänkarens år och bokstav (' + ar + ') finns som källpost Lundgren, K. för sammanställningen', !!ar && new RegExp('Lundgren, K\\. \\(' + ar + '\\) <em>Kandidater för nya vindkraftskalkyler').test(html));
    sant(f + ' har en hänvisning på V: Vindbrukskollen, se Länsstyrelserna (2026)', /Vindbrukskollen: se <a href="#ref-lst-vbk">Länsstyrelserna \(2026\)<\/a>/.test(html));
  });
}

/* ---------- Startsidan index.html ---------- */
{
  const idx = fs.readFileSync('index.html', 'utf8'), idxJs = fs.readFileSync('index.js', 'utf8');
  sant('startsidan har hörnparet (GitHub och teknik) och teknikmodalen', /id="github-lank"/.test(idx) && /id="teknik-knapp"/.test(idx) && /id="teknik-modal"/.test(idx) && /<h3 class="modal-delrubrik">Tekniken/.test(idx) && /<h3 class="modal-delrubrik">Metoden/.test(idx));
  sant('startsidan har versionsrad och VERSION/VERSIONSDATUM i index.js', /id="versionsrad-nr"/.test(idx) && /^const VERSION = '\d+\.\d+';/m.test(idxJs) && /^const VERSIONSDATUM = '\d{4}-\d{2}-\d{2}';/m.test(idxJs));
  sant('startsidan har delningstaggar (og:image med absolut adress, twitter:card)', /<meta property="og:image" content="https:\/\/kentlundgren\.github\.io\/Vindkraft\/vindkraftskalkyl\//.test(idx) && /summary_large_image/.test(idx));
  sant('startsidan är inte en AI-märkt sida', !/AI-stöd|AI-assisterad|framtagen med/i.test(idx));
  const rubriker = (idx.match(/<h[123] id="(?!teknik-modal-rubrik)[^"]+"/g) || []).length;   // modalens rubrik har id för aria-labelledby, inget ankare
  sant('startsidan har ankare (#-länk) på varje rubrik', rubriker > 0 && (idx.match(/<a class="ankare"/g) || []).length === rubriker);
  ['vindkraftskalkyl.html', 'vindkraftskalkyl_langhult.html', 'vindkraftskalkyl_Onnerup.html'].forEach(f => {
    sant('startsidan länkar till ' + f, idx.indexOf('href="' + f + '"') > -1);
    sant(f + ' har brödsmulan Vindkraftens ekonomi: start som länkar till index.html', /<a href="index\.html">Vindkraftens ekonomi: start<\/a>/.test(fs.readFileSync(f, 'utf8')));
  });
  // Alla interna länkar leder till en fil som finns, och ankare till ett id som finns.
  const lankar = [...idx.matchAll(/href="([^"#:]*)(#[^"]*)?"/g)].map(m => ({ fil: m[1], id: m[2] ? m[2].slice(1) : '' })).filter(l => !/^https?/.test(l.fil));
  lankar.forEach(l => {
    const fil = l.fil || 'index.html';
    const finns = fs.existsSync(fil);
    const idFinns = !l.id || (finns && fs.readFileSync(fil, 'utf8').indexOf('id="' + l.id + '"') > -1);
    sant('startsidans länk ' + fil + (l.id ? '#' + l.id : '') + ' pekar på något som finns', finns && idFinns);
  });
  // Siffrorna på startsidan stämmer med riktvärdet och med kandidatlistan.
  const R = K.KAPACITETSFAKTOR_RIKTVARDE;
  const idxText = idx.replace(/\s+/g, ' ');
  const timmarText = String(R.fullasttimmar).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  sant('startsidans riktvärde (' + R.procent + ' % och ' + timmarText + ' fullasttimmar) stämmer med kalkylkärnan', idxText.indexOf('Riktvärde för kapacitetsfaktorn: ' + R.procent + ' %') > -1 && idxText.indexOf('motsvarande ' + timmarText + ' fullasttimmar') > -1);
  sant('startsidan nämner ' + R.antal + ' aktuella projekt', idx.indexOf(R.antal + ' aktuella projekt') > -1);
  const kmd = fs.readFileSync('../projektkandidater/kandidater.md', 'utf8');
  const antalKand = (kmd.match(/\*\*(\d+) kandidater\*\*/) || [])[1], antalSyd = (kmd.match(/(\d+) av kandidaterna ligger i SE3 eller SE4/) || [])[1];
  sant('startsidans antal kandidater (' + antalKand + ') och i SE3/SE4 (' + antalSyd + ') stämmer med kandidater.md', !!antalKand && !!antalSyd && idx.indexOf(antalKand + ' aktuella projekt uppfyller urvalet') > -1 && idx.indexOf(antalSyd + ' av dem ligger i elområde SE3 eller SE4') > -1);
}

/* ---------- Källförteckningen: alfabetisk och osiffrad (Harvard, kent-referens-skill punkt 8 och 18) ---------- */
fs.readdirSync('.').filter(f => /^(vindkraftskalkyl.*|index)\.html$/.test(f)).forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const sek = html.match(/<section class="kallor"[\s\S]*?<\/section>/);
  if (!sek) return;
  sant(f + ': källförteckningen är inte en numrerad lista (<ol>)', !/<ol[\s>]/.test(sek[0]));
  const poster = (sek[0].match(/<li[^>]*>[\s\S]*?<\/li>/g) || []).map(p => p.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim());
  const nycklar = poster.map(t => {
    const kors = t.match(/^(.+?): se (.+?)\.?$/);                      // hänvisningspost, till exempel "Vindbrukskollen: se Länsstyrelserna (2026)."
    if (kors) return { namn: kors[1], ar: 0, bokst: '', se: kors[2] };
    const m = t.match(/^(.+?) \((?:(\d{4})([a-z]?)|u\.å\.)/);
    return m ? { namn: m[1], ar: m[2] ? +m[2] : 9999, bokst: m[3] || '' } : null;
  });
  nycklar.filter(n => n && n.se).forEach(n => sant(f + ': hänvisningen "' + n.namn + ': se ' + n.se + '" pekar på en källpost som finns', poster.some(p => !/: se /.test(p) && p.startsWith(n.se))));
  sant(f + ': varje källpost börjar med författare eller titel och år (inga sammansatta stycken)', poster.length > 0 && nycklar.every(Boolean));
  const kol = new Intl.Collator('sv');
  let ordnad = true, forst = '';
  for (let i = 1; i < nycklar.length && nycklar.every(Boolean); i++) {
    const a = nycklar[i - 1], b = nycklar[i];
    const d = kol.compare(a.namn, b.namn) || (a.ar - b.ar) || kol.compare(a.bokst, b.bokst);
    if (d > 0) { ordnad = false; forst = forst || (a.namn + ' (' + a.ar + a.bokst + ') före ' + b.namn + ' (' + b.ar + b.bokst + ')'); }
  }
  if (!ordnad) console.log('  ' + f + ' är inte alfabetisk: ' + forst);
  sant(f + ': källförteckningen är alfabetisk efter författare eller organisation, och kronologisk inom samma författare', ordnad);
  const lika = nycklar.filter(Boolean).map(n => n.namn + n.ar + n.bokst);
  sant(f + ': inga dubbla poster med samma författare, år och bokstav', new Set(lika).size === lika.length);
});

/* ---------- Långhult: alternativ för bostäder per zon och växeln för parkens storlek ---------- */
{
  const lh = fs.readFileSync('berakningar_langhult.js', 'utf8'), lhHtml = fs.readFileSync('vindkraftskalkyl_langhult.html', 'utf8');
  const alt = {};
  const re = /(forval|ljud20|ljudlun):\s*\[([^\]]+)\]/g; let m;
  while ((m = re.exec(lh))) alt[m[1]] = m[2].split(',').map(Number);
  const summa = (a) => a.reduce((x, y) => x + y, 0);
  sant('Långhult: förvalet för bostäder är 200 och står som förval i fälten', summa(alt.forval) === 200 && [62, 27, 32, 37, 42].every((v, i) => alt.forval[i] === v) && /id="bost1"[^>]*value="62"/.test(lhHtml));
  sant('Långhult: ljudutredningens alternativ är 66 (alla 20 verk) och 29 (bara Lunnarsbo) bostäder', summa(alt.ljud20) === 66 && summa(alt.ljudlun) === 29);
  sant('Långhult: knapparna för bostäder och för parkens storlek har egna behållare', /id="bost-alt"/.test(lhHtml) && /id="park-variant"/.test(lhHtml) && /#park-variant \.park-knapp/.test(lh));
  sant('Långhult: ljudutredningen finns i källistan', /id="ref-ljud"/.test(lhHtml));
  // Länkar till filer i det här repot ska peka på filer som finns (så att en flytt inte lämnar en trasig länk).
  const blob = /github\.com\/kentlundgren\/Vindkraft\/blob\/main\/vindkraftskalkyl\/([^"\s)]+)/g; let bm;
  while ((bm = blob.exec(lhHtml))) sant('Långhult: länken till ' + bm[1] + ' pekar på en fil som finns', fs.existsSync(bm[1]));
  sant('mapparna langhult och onnerup har README', fs.existsSync('langhult/README.md') && fs.existsSync('onnerup/README.md'));
}

/* ---------- Långhult: Karta 1 (Var ligger parken?) ---------- */
{
  const lh = fs.readFileSync('vindkraftskalkyl_langhult.html', 'utf8');
  sant('Långhult har avsnittet Var ligger parken? (#Lage) och Karta 1 (#Karta1) med ankare', /<h2 id="Lage">/.test(lh) && /<h3 id="Karta1">Karta 1\./.test(lh) && /href="#Karta1"/.test(lh));
  const bilder = [...lh.matchAll(/<img src="(langhult\/[^"]+)"[^>]*alt="([^"]+)"/g)];
  sant('Karta 1 har två bilder med alt-text', bilder.length === 2 && bilder.every(m => m[2].length > 40));
  bilder.forEach(m => sant('kartbilden ' + m[1] + ' finns och är under 200 kB', fs.existsSync(m[1]) && fs.statSync(m[1]).size < 200 * 1024));
  sant('Karta 1 har två flikar och två paneler, och källraden länkar till Länsstyrelserna (2026)', (lh.match(/role="tab" id="karta-flik-/g) || []).length === 2 && (lh.match(/role="tabpanel" id="karta-panel-/g) || []).length === 2 && /Skärmdumpar ur Vindbrukskollen \(<a href="#ref-lst-vbk">/.test(lh));
  sant('Lage står före Lasguide i Långhult-sidan', lh.indexOf('id="Lage"') > -1 && lh.indexOf('id="Lage"') < lh.indexOf('id="Lasguide"'));
}

/* ---------- Delningsbilder för kalkylerna ---------- */
[['vindkraftskalkyl_langhult.html', 'og-bild-langhult.jpg'], ['vindkraftskalkyl_Onnerup.html', 'og-bild-onnerup.jpg'], ['index.html', 'og-bild-start.jpg']].forEach(([sida, bild]) => {
  const html = fs.readFileSync(sida, 'utf8');
  if (fs.existsSync(bild)) {
    const b = fs.readFileSync(bild); let i = 2, bredd = 0, hojd = 0;   // JPEG: leta upp SOF-markören
    while (i < b.length) { if (b[i] !== 0xFF) { i++; continue; } const m = b[i + 1]; if (m >= 0xC0 && m <= 0xC3) { hojd = b.readUInt16BE(i + 5); bredd = b.readUInt16BE(i + 7); break; } i += 2 + b.readUInt16BE(i + 2); }
    sant(bild + ' är 1200×630 px', bredd === 1200 && hojd === 630);
  }
  sant(sida + ' har og:image med absolut adress till ' + bild, html.indexOf('<meta property="og:image" content="https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/' + bild + '">') > -1);
  sant(sida + ': bilden ' + bild + ' finns och är under 300 kB', fs.existsSync(bild) && fs.statSync(bild).size < 300 * 1024);
  sant(sida + ' har og:title, og:description och twitter:card', /og:title/.test(html) && /og:description/.test(html) && /summary_large_image/.test(html));
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
