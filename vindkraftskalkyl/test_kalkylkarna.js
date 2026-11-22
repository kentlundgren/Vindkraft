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

// bruttoKWh: kapacitetsfaktor (huvudkalkylen) och fullasttimmar (Långhult).
lika('bruttoKWh kapacitetsfaktor', N.bruttoKWh({ effekt: 4, antalverk: 5, kapfaktor: 0.37 }, 20), 20 * 8760 * 0.37 * 1000, 1e-3);
lika('bruttoKWh fullasttimmar', N.bruttoKWh({ effekt: 6.6, antalverk: 20, kapfaktor: 0.37, fullasttimmar: 3610 }, 132), 6.6 * 1000 * 3610 * 20, 1e-3);

// Långhult, fall A, 132 MW: löpande nätkostnad −4 938 424 kr/år (1 250 000 + 23,1·132 000 + 1,23·20·132 000 − 2,62 öre × 476 520 000 kWh).
const dL = indata(A, { effekt: 6.6, antalverk: 20, kapfaktor: 0.37, fullasttimmar: 3610 });
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

/* ---------- Alla kalkyler använder kärnan ---------- */
const KALKYLER = [
  { html: 'vindkraftskalkyl.html', js: 'berakningar.js' },
  { html: 'vindkraftskalkyl_langhult.html', js: 'berakningar_langhult.js' }
];
const FORBJUDNA = ['annuitet', 'npv', 'irr', 'payback', 'fmt', 'tal', 'text', 'radataNat', 'lcoeAvKassaflode', 'lasNatIndata', 'natPaverkan', 'natSammanfattning'];
KALKYLER.forEach(k => {
  const js = fs.readFileSync(k.js, 'utf8');
  const html = fs.readFileSync(k.html, 'utf8');
  FORBJUDNA.forEach(f => {
    sant(k.js + ' har ingen egen ' + f + '()', !new RegExp('^\\s*function\\s+' + f + '\\s*\\(', 'm').test(js));
  });
  sant(k.js + ' anropar lcoeAvKassaflode', /lcoeAvKassaflode\(/.test(js));
  sant(k.js + ' anropar natPaverkan', /natPaverkan\(/.test(js));
  sant(k.html + ' laddar kalkylkarna.js före ' + k.js, html.indexOf('<script src="kalkylkarna.js">') > -1 && html.indexOf('<script src="kalkylkarna.js">') < html.indexOf('<script src="' + k.js + '">'));
  sant(k.html + ' laddar natkostnader.css', html.indexOf('natkostnader.css') > -1);
  sant(k.html + ' har rullgardinen Kalkyler', html.indexOf('class="kalkylmeny"') > -1);
});

if (fel) { console.log(fel + ' fel, ' + ok + ' godkända'); process.exit(1); }
console.log('ALLA TESTER OK: ' + ok + ' godkända, 0 fel');
