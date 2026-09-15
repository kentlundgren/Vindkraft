/**
 * Formelparitet mot ver2 (SPEC avsnitt 4 och acceptanskriterium 13).
 *
 * FIXTUREN nedan är inte handskriven. Den togs fram 15 september 2026 genom
 * att köra `vindkraftskalkyl_Vercel_ver2/berakningar.js` (DEL 0–3) i Node med
 * en DOM-shim och ver2:s egna defaultvärden. Om ett tal här ändras betyder det
 * att ver3 har glidit från ver2 – fixa porten, sänk inte ribban.
 *
 * Körs med Node:s inbyggda testlöpare: `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lasIndata, beraknaAllt, annuitet, npv, payback } from './calculations.ts';
import { DEFAULTS } from './defaults.ts';
import { TILLATNA_FALT, rensaFalt } from './falt.ts';

/** Referensvärden ur ver2, defaultkalkylen (5 × 4 MW, SE3-fälten som de står). */
const VER2 = {
  produktionMWh_ar1: 64824,
  intaktAr1: 38894400,
  driftkostnadAr1: 7972640,
  investering: 240000000,
  invPerkWh: 3.702332469455757,
  kapitalkostnad: 30918904.02708464,
  totalkostnad: 38891544.02708464,
  kostnadPerkWh: 0.5999559426614316,
  overskott: 2855.9729153588414,
  overskottNetto: -2436336.027084641,
  lcoe: 0.6179227766329816,
  paybackInvest: 8.594685192408202,
  npvInvest: -27114035.41950692,
  irrInvest: 0.10429046909478239,
  arrendeAr1: 1361304.0000000002,
  arrendeTotal: 32066810.878564984,
  arrendeNuvarde: 10221214.489257503,
  lokalaIntakterAr1: 2439192,
  lokalaIntakterTotal: 57890702.80917355,
  kommunAr: 300000,
  co2Ton: 19447.2,
  samhallsnytta: 19447200,
  elmangd: 10000,
  totalInsats: 60000,
  sjalvkostnadkWh: 0.6299559426614316,
  marknadsprisAr1: 1.3849999999999998,
  besparingAr1: 7550.440573385682,
  alternativkostnad: 7290,
  nettoAr1: 260.440573385682,
  aterbetalning: 7.946556153490191,
  nuvardeAndel: -1391.6568315235572,
  femhojder: 1000,
  niohojder: 1800,
  distansfaktor: 1,
  narboendeEnskildAr1: 38894.4,
  narboendeTotalAr1: 777888,
};

/** Relativ jämförelse – avrundning i flyttal ska inte fälla testet. */
function naraNog(faktisk: number, forvantad: number, namn: string) {
  const tolerans = Math.max(Math.abs(forvantad) * 1e-9, 1e-9);
  assert.ok(
    Math.abs(faktisk - forvantad) <= tolerans,
    `${namn}: ${faktisk} avviker från ver2:s ${forvantad}`
  );
}

test('defaultkalkylen ger samma nyckeltal som ver2', () => {
  const res = beraknaAllt(lasIndata());
  for (const [namn, forvantad] of Object.entries(VER2)) {
    const faktisk = res[namn as keyof typeof VER2];
    assert.equal(typeof faktisk, 'number', `${namn} saknas i resultatet`);
    naraNog(faktisk as number, forvantad, namn);
  }
});

test('kassaflödet har samma form som i ver2', () => {
  const res = beraknaAllt(lasIndata());
  assert.equal(res.cf.length, 26, 'år 0 plus 25 driftår');
  naraNog(res.cf[0], -240000000, 'cf[0]');
  naraNog(res.cf[1], 28482568, 'cf[1]');
  naraNog(res.cf[25], 13124727.214284703, 'cf[25] med nedmontering');
  assert.equal(res.inomZon, true);
});

test('NU20-ersättningen ligger i lagens storleksordning', () => {
  // Rimlighetskontroll från prompten: ca 38 000 kr/år vid SE4-prisnivå
  // och minst två verk inom fem verkshöjder.
  const res = beraknaAllt(lasIndata({ elpris: '0.6', verkinom5: '2' }));
  assert.ok(res.narboendeEnskildAr1 > 30000 && res.narboendeEnskildAr1 < 45000);

  // Utanför nio verkshöjder ska ersättningen vara noll.
  const utanfor = beraknaAllt(lasIndata({ avstand: '2000' }));
  assert.equal(utanfor.distansfaktor, 0);
  assert.equal(utanfor.narboendeEnskildAr1, 0);
  assert.equal(utanfor.inomZon, false);
});

test('procentomvandlingarna följer ver2:s lasIndata', () => {
  const d = lasIndata({ elprisforandring: '2', momssats: '25', maxpromille: '2.5' });
  naraNog(d.elprisforandring, 0.02, 'elprisforandring');
  naraNog(d.momssats, 0.25, 'momssats');
  naraNog(d.maxpromille, 0.0025, 'maxpromille');
  assert.equal(d.livslangd, 25);
});

test('finansfunktionerna beter sig som i ver2', () => {
  naraNog(annuitet(1000, 0, 10), 100, 'annuitet utan ränta');
  naraNog(npv(0.1, [-100, 110]), 0, 'npv med exakt återbetalning');
  assert.equal(payback([-100, 50, 50]), 2, 'payback på jämna år');
  assert.equal(payback([-100, 10]), null, 'aldrig återbetald');
});

test('fältlistan är oförändrad mot ver2', () => {
  assert.equal(TILLATNA_FALT.length, 33);
  assert.equal(Object.keys(DEFAULTS).length, 33);
  for (const id of TILLATNA_FALT) {
    assert.ok(DEFAULTS[id] !== undefined, `default saknas för ${id}`);
  }
  // Okända id:n och för långa värden ska rensas bort.
  assert.deepEqual(rensaFalt({ elpris: ' 0.7 ', hittepa: '1' }), {
    elpris: '0.7',
  });
  assert.equal(rensaFalt({ elpris: 'x'.repeat(41) }), null);
});
