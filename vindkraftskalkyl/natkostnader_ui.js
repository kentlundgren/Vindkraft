/* ============================================================================
   natkostnader_ui.js
   ----------------------------------------------------------------------------
   Gränssnittet för nätkostnader och systemkrav i vindkraftskalkylen:
     1. Väljaren "exempelfall" fyller nät-fälten ur natkostnader_exempel.js.
     2. Normalfallet (om Kent har utsett ett) läses in när läget går från
        "ingen" till ett annat läge och alla nät-fält är orörda.
     3. Panelen "Nätkostnader i siffror": engång i kr/MW, löpande i öre/kWh.
     4. Förklaringar vid hovring, fokus och tryck (`.hjalp`).
   Beräkningarna ligger i natkostnader_berakning.js (ren modul). Filen laddas
   före berakningar.js, så att väljaren fylls och lyssnarna kopplas innan de
   generella lyssnarna räknar om.
   ============================================================================ */
'use strict';

(function () {
  const FALT = NATKOSTNAD.NAT_FALT;
  const el = (id) => document.getElementById(id);
  const satt = (id, v) => { const e = el(id); if (e) e.textContent = v; };

  function hittaFall(id) {
    return NAT_EXEMPEL.find(f => f.id === id) || null;
  }

  function fyllExempel(id) {
    const f = hittaFall(id);
    if (!f) return;
    FALT.forEach(k => {
      const e = el(k);
      if (e) e.value = (f.falt[k] === null || f.falt[k] === undefined) ? '' : String(f.falt[k]);
    });
  }

  function allaNatFaltTomma() {
    return FALT.every(k => { const e = el(k); return !e || e.value.trim() === ''; });
  }

  /* ---------- Koppling av väljare ---------- */
  function kopplaNat() {
    const sel = el('natexempel');
    if (!sel) return;
    NAT_EXEMPEL.forEach(f => {
      const o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.id + '. ' + f.namn + (f.belagd ? '' : (f.eget ? '' : ' (ej belagd)'));
      sel.appendChild(o);
    });
    sel.value = 'H';

    // Tomma fält visar vad som gäller: ingår i investeringsutgiften (ja) eller ej angivet.
    const ingar = el('natengangingar');
    const ENGANG = ['natavstand', 'natledning', 'natstation', 'natforstark', 'natengangschablon', 'natsyseng'];
    function uppdateraPlatshallare() {
      ENGANG.forEach(k => { const e = el(k); if (e) e.placeholder = (ingar && ingar.value === 'ja') ? 'ingår i investeringsutgiften' : 'ej angivet'; });
    }
    if (ingar) { ingar.addEventListener('change', uppdateraPlatshallare); uppdateraPlatshallare(); }

    sel.addEventListener('change', () => { fyllExempel(sel.value); });

    let foregLage = el('natlage').value;
    el('natlage').addEventListener('change', () => {
      const ny = el('natlage').value;
      if (foregLage === 'ingen' && ny !== 'ingen' && allaNatFaltTomma() &&
          typeof NAT_NORMALFALL !== 'undefined' && NAT_NORMALFALL && hittaFall(NAT_NORMALFALL)) {
        sel.value = NAT_NORMALFALL;
        fyllExempel(NAT_NORMALFALL);
      }
      foregLage = ny;
    });

    if (typeof window.kopplaHjalp === 'function') window.kopplaHjalp();
  }

  /* ---------- Panelen "Nätkostnader i siffror" ---------- */
  const LAGE_TEXT = { ingen: 'ingen', lag: 'låg', bas: 'bas', hog: 'hög' };

  // En post visas som "–" (ej angiven) om alla dess fält är tomma.
  function post(tomma, ids, varde, dec, suffix) {
    const ejAngiven = ids.every(id => tomma[id]);
    return ejAngiven ? '–' : fmt(varde, dec, suffix);
  }

  function skrivUtNat(res, d) {
    const np = res.natPanel;
    const t = d.natTomma || {};
    const pe = np.engangPerMW, lo = np.lopandeOre;
    const ingen = d.natlage === 'ingen';

    // Engång, kr per MW
    satt('nat-e-ledning', post(t, ['natavstand', 'natledning'], pe.ledning, 0, ' kr/MW'));
    satt('nat-e-station', post(t, ['natstation'], pe.station, 0, ' kr/MW'));
    satt('nat-e-forstark', post(t, ['natforstark'], pe.forstarkning, 0, ' kr/MW'));
    satt('nat-e-utredning', post(t, ['natutredning'], pe.utredning, 0, ' kr/MW'));
    satt('nat-e-system', post(t, ['natsyseng'], pe.system, 0, ' kr/MW'));
    satt('nat-e-schablon', post(t, ['natengangschablon'], pe.schablon, 0, ' kr/MW'));
    satt('nat-e-summa', fmt(pe.summa, 0, ' kr/MW'));
    const inv_per_mw = d.specinv * 1000;
    satt('nat-e-procent', inv_per_mw > 0
      ? fmt(pe.summa / inv_per_mw * 100, 1, ' % av ' + fmt(d.specinv, 0, ' kkr/MW'))
      : '–');

    // Löpande, öre per kWh
    satt('nat-l-fast', post(t, ['natfast'], lo.fast, 2, ' öre/kWh'));
    satt('nat-l-effekt', post(t, ['nateffekt'], lo.effekt, 2, ' öre/kWh'));
    satt('nat-l-avstand', post(t, ['natavstavg', 'natavstavstand'], lo.avstand, 2, ' öre/kWh'));
    satt('nat-l-system', post(t, ['natsyslop'], lo.system, 2, ' öre/kWh'));
    satt('nat-l-fastsumma', fmt(lo.fastSumma, 2, ' öre/kWh'));
    satt('nat-l-energi', post(t, ['natenergi'], lo.energi, 2, ' öre/kWh'));
    satt('nat-l-summa', fmt(lo.summa, 2, ' öre/kWh'));
    satt('nat-l-permwar', fmt(np.lopandePerMWAr, 0, ' kr'));

    // Sekundära nyckeltal (bara när nätkostnaderna ingår i resultaten)
    const livs = ingen ? '–' : fmt(res.natPerkWhLivs * 100, 2, ' öre/kWh');
    const andel = (ingen || !Number.isFinite(res.natAndelLcoe)) ? '–' : fmt(res.natAndelLcoe * 100, 1, ' %');
    satt('nat-s-livs', livs);
    satt('nat-s-andel', andel);
    satt('inv-nat-livs', livs);
    satt('inv-nat-andel', andel);

    // Informationsrad
    const info = ingen
      ? 'Läget är ingen: nätkostnaderna ingår inte i resultaten, som därför är desamma som utan nätkostnader. Panelen visar vad fältens värden motsvarar i läget bas.'
      : 'Läget är ' + LAGE_TEXT[d.natlage] + ': nätkostnaderna ingår i investeringsutgiften, driftkostnaden och alla nyckeltal.';
    const tillagg = d.natengangingar === 'nej'
      ? ' Engångskostnaderna läggs till investeringsutgiften.'
      : ' Engångskostnaderna antas ingå i investeringsutgiften (12 000 kkr/MW) och läggs därför inte till. Antagandet är inte belagt i någon källa.';
    satt('nat-info', info + tillagg);

    uppdateraExempelInfo(res, d);
  }

  /* Rad om valt exempelfall: värde, spridning över belagda fall och regelverk. */
  function uppdateraExempelInfo(res, d) {
    const rad = el('nat-exempel-info');
    if (!rad) return;
    rad.textContent = '';
    const f = hittaFall(d.natexempel);
    if (!f || f.eget) {
      rad.textContent = 'Inget exempelfall valt. Välj ett fall ovan eller fyll i egna värden. Alla fall och källor finns på sidan ';
      const a = document.createElement('a'); a.href = 'natkostnader_exempel.html'; a.textContent = 'Exempelfall och källor';
      rad.appendChild(a); rad.appendChild(document.createTextNode('.'));
      return;
    }
    const P = d.effekt * d.antalverk;
    const brutto = P * 8760 * d.kapfaktor * 1000;
    const orePerFall = (fall) => {
      const x = {};
      FALT.forEach(k => { const v = fall.falt[k]; x[k] = (v === null || v === undefined) ? 0 : v; });
      return NATKOSTNAD.beraknaNat(x, 1, P, brutto).lopandeOre.summa;
    };
    const belagda = NAT_EXEMPEL.filter(x => x.belagd && !x.sarfall);
    const varden = belagda.map(orePerFall);
    const mn = Math.min.apply(null, varden), mx = Math.max.apply(null, varden);
    const detta = orePerFall(f);

    let txt = 'Fall ' + f.id + ' (' + f.typ + ', ' + (f.ar || '') + '): löpande ' + fmt(detta, 2, ' öre/kWh') + ' vid dina effekt- och produktionsvärden. ';
    if (f.belagd) {
      txt += 'Spridning över belagda, representativa fall: ' + fmt(mn, 2) + ' till ' + fmt(mx, 2, ' öre/kWh') + '. ';
    } else {
      txt += 'Fallet är inte belagt i en källa och ingår inte i spridningen (' + fmt(mn, 2) + ' till ' + fmt(mx, 2, ' öre/kWh') + '). ';
    }
    if (f.sarfall) txt += 'Fallet är ett särfall och inte representativt. ';
    rad.appendChild(document.createTextNode(txt));

    const regl = (f.regelverk || []).map(id => NAT_REGELVERK.find(r => r.id === id)).filter(Boolean);
    if (regl.length) {
      const utkast = regl.filter(r => r.status === 'remissutkast');
      rad.appendChild(document.createTextNode('Regelverk: ' + regl.map(r => (r.kort || r.titel) + ' (' + r.status + ')').join('; ') + '. '));
      if (utkast.length) {
        const varn = document.createElement('strong');
        varn.textContent = 'Obs: ' + utkast.length + ' av regelverken är remissutkast och kan ändras. ';
        rad.appendChild(varn);
      }
    }
    const a = document.createElement('a'); a.href = 'natkostnader_exempel.html#regelverk'; a.textContent = 'Se regelverk, källor och antaganden';
    rad.appendChild(a); rad.appendChild(document.createTextNode('.'));
  }

  window.skrivUtNat = skrivUtNat;
  document.addEventListener('DOMContentLoaded', kopplaNat);
})();
