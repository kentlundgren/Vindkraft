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

/* ---------- Alla kalkyler använder kärnan ---------- */
const KALKYLER = [
  { html: 'vindkraftskalkyl.html', js: 'berakningar.js' },
  { html: 'vindkraftskalkyl_langhult.html', js: 'berakningar_langhult.js' }
];
const FORBJUDNA = ['annuitet', 'npv', 'irr', 'payback', 'fmt', 'tal', 'text', 'radataNat', 'lcoeAvKassaflode', 'lasNatIndata', 'natPaverkan', 'natSammanfattning',
  'beraknaNarboende', 'beraknaNarboendeZoner', 'beraknaNarboendeSchablon', 'lasNarboendeIndata', 'zonEtikett', 'realiseratPris'];
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
  sant(k.js + ' räknar produktion med kapacitetsfaktor (inte fullasttimmar)', /kapfaktor/.test(js) && !/tal\('fullasttimmar'\)/.test(js));
  sant(k.html + ' har fältet prisfaktor', html.indexOf('id="prisfaktor"') > -1);
  sant(k.html + ' har fältet kapfaktor', html.indexOf('id="kapfaktor"') > -1);
  sant(k.html + ' laddar kalkylkarna.js före ' + k.js, html.indexOf('<script src="kalkylkarna.js">') > -1 && html.indexOf('<script src="kalkylkarna.js">') < html.indexOf('<script src="' + k.js + '">'));
  sant(k.html + ' laddar natkostnader.css', html.indexOf('natkostnader.css') > -1);
  sant(k.html + ' har rullgardinen Kalkyler', html.indexOf('class="kalkylmeny"') > -1);
});

if (fel) { console.log(fel + ' fel, ' + ok + ' godkända'); process.exit(1); }
console.log('ALLA TESTER OK: ' + ok + ' godkända, 0 fel');
