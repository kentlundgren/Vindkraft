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

  /* ---------- Typfall efter parkens effekt ---------- */
  // Rutan "Välj nätfall efter parkens storlek automatiskt" styr om fallet följer parkens storlek.
  const autoPa = () => { const c = el('natautofall'); return !!(c && c.checked); };
  const sattAuto = (v) => { const c = el('natautofall'); if (c) c.checked = v; };

  function parkEffekt() {
    return (parseFloat(el('effekt').value) || 0) * (Math.max(1, Math.round(parseFloat(el('antalverk').value)) || 1));
  }
  function typfallNu() {
    return NATKOSTNAD.typfallForEffekt(parkEffekt(), NAT_TYPFALL);
  }
  function tillampaTypfall() {
    const t = typfallNu();
    el('natexempel').value = t.id;
    fyllExempel(t.id);
    sattAuto(true);
    uppdateraLank();
  }

  function uppdateraForslag(d) {
    const txt = el('nat-forslag-text'), knapp = el('nat-forslag-knapp');
    if (!txt) return;
    const P = d.effekt * d.antalverk;
    const t = NATKOSTNAD.typfallForEffekt(P, NAT_TYPFALL);
    const f = hittaFall(t.id);
    txt.textContent = '';
    const p1 = document.createElement('p');
    p1.textContent = 'Förslag för ' + fmt(P, 1) + ' MW (' + d.antalverk + ' verk): fall ' + t.id + ', ' + f.namn + '. Det här passar vilken parkeffekt:';
    txt.appendChild(p1);
    const ul = document.createElement('ul'); ul.className = 'nat-storlek';
    NAT_TYPFALL.trappa.forEach(st => {
      const li = document.createElement('li');
      const nu = P > st.franMW && P <= st.tillMW;
      li.appendChild(nu ? document.createElement('strong') : document.createTextNode(''));
      const mal = nu ? li.firstChild : li;
      mal.appendChild(document.createTextNode(st.effekt + ': ' + st.text + (nu ? ' (din park)' : '')));
      ul.appendChild(li);
    });
    txt.appendChild(ul);
    const p2 = document.createElement('p');
    p2.appendChild(document.createTextNode('Riktmärkena bygger på en vägledande figur över överföringsförmåga per spänningsnivå och är inte belagda i Vattenfalls tariff. Nätägaren avgör nivån. Fall A och B är Vattenfalls regionnät, och Ellevio och E.ON är inte genomgångna. ' +
      (t.stamnat ? 'Över cirka ' + NAT_TYPFALL.stamnatMW + ' MW är direktanslutning till stamnätet (fall C–E) ändå inte given: gränsen 100 MW (220 kV) och 300 MW (400 kV) gäller när Svenska kraftnät bygger en ny station, och anslutning sker i första hand via regionnätet. ' : '')));
    const a = document.createElement('a'); a.href = 'natkostnader_exempel.html#normalfall-rubrik'; a.textContent = 'Läs varför';
    p2.appendChild(a); p2.appendChild(document.createTextNode('. '));
    const a2 = document.createElement('a'); a2.href = 'natkostnader_exempel.html#stamnat-rubrik'; a2.textContent = 'Varför kan jag inte välja Svenska kraftnät?';
    p2.appendChild(a2);
    txt.appendChild(p2);
    if (knapp) knapp.hidden = (el('natexempel').value === t.id);
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
      o.textContent = f.id + '. ' + f.namn + (f.belagd ? '' : (f.eget ? '' : ' (ej belagd)')) + (f.typ === 'stamnät direkt' ? ' (direktansluten)' : '');
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

    sel.addEventListener('change', () => {
      fyllExempel(sel.value);
      // Eget fall: fäll ut fälten så att läsaren kan fylla i egna värden.
      if (sel.value === 'H' && el('nat-detaljer')) el('nat-detaljer').open = true;
    });

    // Typfall efter parkens effekt. Väljs automatiskt när läget går från ingen och användaren inte har
    // valt själv, och följer sedan antal verk och effekt tills användaren väljer eller ändrar ett fält.
    FALT.forEach(k => { const e = el(k); if (e) e.addEventListener('input', () => { sattAuto(false); }); });
    sel.addEventListener('change', () => { sattAuto(false); });
    const ac = el('natautofall');
    if (ac) ac.addEventListener('change', () => {
      if (ac.checked) { tillampaTypfall(); el('natlage').dispatchEvent(new Event('change', { bubbles: true })); }
    });

    let foregLage = el('natlage').value;
    el('natlage').addEventListener('change', () => {
      const ny = el('natlage').value;
      if (foregLage === 'ingen' && ny !== 'ingen' && allaNatFaltTomma() && sel.value === 'H' && autoPa()) {
        if (typeof NAT_NORMALFALL !== 'undefined' && NAT_NORMALFALL && hittaFall(NAT_NORMALFALL)) {
          sel.value = NAT_NORMALFALL;
          fyllExempel(NAT_NORMALFALL);
        } else {
          tillampaTypfall();
        }
      }
      foregLage = ny;
    });
    ['antalverk', 'effekt'].forEach(id => el(id).addEventListener('input', () => {
      if (autoPa() && sel.value !== 'H' && typfallNu().id !== sel.value) tillampaTypfall();
    }));
    const fk = el('nat-forslag-knapp');
    if (fk) fk.addEventListener('click', () => {
      tillampaTypfall();
      el('natlage').dispatchEvent(new Event('change', { bubbles: true }));
    });

    kopplaLank();
    if (typeof window.kopplaHjalp === 'function') window.kopplaHjalp();
  }

  /* ---------- Delbar länk: #Natkostnad_Bas_Exempel_B ----------
     Länken återger läge, exempelfall och om engångskostnaden ingår i
     investeringsutgiften. Värden som ändrats för hand följer inte med.
     Läge skrivs utan å, ä, ö: Ingen, Lag, Bas, Hog. */
  const LAGE_TILL_HASH = { ingen: 'Ingen', lag: 'Lag', bas: 'Bas', hog: 'Hog' };
  const HASH_TILL_LAGE = { Ingen: 'ingen', Lag: 'lag', Bas: 'bas', Hog: 'hog' };
  const HASH_MONSTER = /^#Natkostnad_(Ingen|Lag|Bas|Hog)(?:_Exempel_([A-H])|_(Typfall))?(?:_Engang_(Ja|Nej))?(?:_Verk_(1|5))?$/;

  function antalVerk() {
    const v = Math.round(parseFloat(el('antalverk').value));
    return Number.isFinite(v) ? v : 1;
  }

  /* Växlaren ett verk / fem verk visar vilket val som gäller. Ett annat antal
     verk (skrivet för hand) markerar ingen knapp. */
  function markeraVerkknappar() {
    const v = antalVerk();
    document.querySelectorAll('.nat-verkknapp').forEach(k => {
      k.setAttribute('aria-pressed', String(parseInt(k.getAttribute('data-verk'), 10) === v));
    });
  }

  function byggHash() {
    const lage = el('natlage').value, ex = el('natexempel').value, ing = el('natengangingar').value;
    const verk = antalVerk();
    if (lage === 'ingen' && (ex === 'H' || !ex) && ing === 'ja' && verk !== 5) return '';
    let h = '#Natkostnad_' + LAGE_TILL_HASH[lage];
    if (lage !== 'ingen' && autoPa() && ex === typfallNu().id) h += '_Typfall';
    else if (ex && ex !== 'H') h += '_Exempel_' + ex;
    if (ing === 'nej') h += '_Engang_Nej';
    if (verk === 5) h += '_Verk_5';
    return h;
  }

  function tillampaHash() {
    const m = HASH_MONSTER.exec(location.hash);
    if (!m) return false;
    el('natlage').value = HASH_TILL_LAGE[m[1]];
    // Utan _Verk_ i länken gäller förvalet, ett verk.
    el('antalverk').value = (m[5] === '5') ? '5' : '1';
    markeraVerkknappar();
    if (m[3] === 'Typfall') {
      tillampaTypfall();
    } else {
      const ex = m[2] || 'H';
      el('natexempel').value = ex;
      fyllExempel(ex);
      sattAuto(false);
    }
    el('natengangingar').value = (m[4] === 'Nej') ? 'nej' : 'ja';
    el('natengangingar').dispatchEvent(new Event('change'));
    return true;
  }

  let senasteLank = '';

  /* Kopierar text till urklipp, med reservväg när webbläsaren saknar clipboard-API. */
  function kopiera(text, klart) {
    const reserv = () => {
      const t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) { /* inget att göra */ }
      document.body.removeChild(t); klart();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(klart, reserv);
    else reserv();
  }

  function uppdateraLank() {
    const h = byggHash();
    try {
      history.replaceState(null, '', location.pathname + location.search + h);
    } catch (e) { /* t.ex. vissa lokala miljöer: länken visas ändå nedan */ }
    senasteLank = location.origin === 'null' || location.protocol === 'file:'
      ? location.href.split('#')[0] + h
      : location.origin + location.pathname + location.search + h;
  }

  function kopplaLank() {
    ['natlage', 'natexempel', 'natengangingar'].forEach(id => el(id).addEventListener('change', uppdateraLank));
    el('antalverk').addEventListener('input', () => { markeraVerkknappar(); uppdateraLank(); });
    document.querySelectorAll('.nat-verkknapp').forEach(k => k.addEventListener('click', () => {
      el('antalverk').value = k.getAttribute('data-verk');
      markeraVerkknappar();
      // Låt kalkylens vanliga lyssnare räkna om, och uppdatera länken.
      el('antalverk').dispatchEvent(new Event('input', { bubbles: true }));
    }));
    markeraVerkknappar();
    const knapp = el('nat-kopiera');
    if (knapp) knapp.addEventListener('click', () => {
      kopiera(senasteLank, () => { knapp.textContent = 'Kopierad'; setTimeout(() => { knapp.textContent = 'Kopiera länk till det här valet'; }, 1800); });
    });
    const dk = el('nat-dela-kopiera');
    if (dk) dk.addEventListener('click', () => {
      kopiera(el('nat-dela-falt').value, () => { dk.textContent = 'Kopierad'; setTimeout(() => { dk.textContent = 'Kopiera delningslänk'; }, 1800); });
    });
    window.addEventListener('hashchange', () => {
      if (tillampaHash()) {
        el('natlage').dispatchEvent(new Event('change', { bubbles: true }));
        el('nat-grupp').scrollIntoView();
      }
    });
    if (tillampaHash()) {
      // Räkna om efter att berakningar.js har initierat och visa gruppen.
      window.addEventListener('load', () => { el('nat-grupp').scrollIntoView(); });
    }
    uppdateraLank();
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

    uppdateraKronor(res, d);
    uppdateraTopp(res, d);
    uppdateraForslag(d);
    uppdateraExempelInfo(res, d);
    uppdateraSammanfattning(res, d);
  }

  /* Det som syns när panelen är hopfälld: summa löpande kostnader i öre/kWh och i kronor år 1. */
  function uppdateraTopp(res, d) {
    const np = res.natPanel;
    const n = Math.max(1, d.antalverk);
    satt('nat-t-ore', fmt(np.lopandeOre.summa, 2, ' öre/kWh'));
    const park = np.lopande.summa;
    satt('nat-t-kr', n === 1
      ? fmt(park, 0, ' kr/år')
      : fmt(park, 0, ' kr/år') + ' för parken (' + fmt(park / n, 0, ' kr/år') + ' per verk)');
    const t = d.natTomma || {};
    const saknas = ['natavstand', 'natledning', 'natstation', 'natforstark', 'natutredning', 'natengangschablon', 'natsyseng', 'natsyslop', 'natsysbortfall'].every(k => t[k]);
    const lage = d.natlage === 'ingen' ? 'Om nätkostnaderna togs med (läge bas)' : 'Läge ' + LAGE_TEXT[d.natlage];
    // Engångskostnaden: visas bara när något är ifyllt. Annars står den som saknad i raden Ingår inte.
    const engangFalt = ['natavstand', 'natledning', 'natstation', 'natforstark', 'natutredning', 'natengangschablon', 'natsyseng'];
    const engangSaknas = engangFalt.every(k => t[k]);
    const pe = np.engangPerMW;
    const inv = d.specinv * 1000;
    const eng = el('nat-t-engang');
    if (eng) {
      eng.hidden = engangSaknas;
      eng.textContent = engangSaknas ? '' : 'Engångskostnad: ' + fmt(pe.summa, 0, ' kr/MW') +
        (inv > 0 ? ' (' + fmt(pe.summa / inv * 100, 1, ' % av investeringsutgiften per MW') + ')' : '') +
        (d.natengangingar === 'ja' ? ', antas ingå i investeringsutgiften.' : ', läggs till investeringsutgiften.');
    }
    satt('nat-t-not', lage + ', ' + n + (n === 1 ? ' verk' : ' verk') + ' om ' + fmt(d.effekt, 1) + ' MW. ' +
      (saknas ? 'Ingår inte: anslutningskostnader och nya systemkrav saknar belopp, så totalbilden är högre. ' : '') +
      'Alla poster finns under "Visa alla nätkostnader i siffror".');
  }

  /* Tabell 1 (panelen): löpande nätkostnad i kronor, per verk och för parken.
     Kolumnen per verk är parkens belopp delat med antalet verk. En fast årsavgift
     gäller anslutningen, så uppdelningen per verk är en fördelning. Med ett verk
     är kolumnerna lika, och då visas bara en. */
  function uppdateraKronor(res, d) {
    const np = res.natPanel, lo = np.lopande;
    const t = d.natTomma || {};
    const n = Math.max(1, d.antalverk);
    const ett = n === 1;
    const kr = (x) => (Number.isFinite(x) ? fmt(x, 0) : '–');
    const rad = (id, parkVarde, ejAngiven) => {
      satt('nat-k-' + id + '-park', ejAngiven ? '–' : kr(parkVarde));
      satt('nat-k-' + id + '-verk', ejAngiven ? '–' : kr(parkVarde / n));
    };
    rad('prod', np.produktionAr1, false);
    rad('fast', lo.fast, t.natfast);
    rad('effekt', lo.effekt, t.nateffekt);
    rad('avstand', lo.avstand, t.natavstavg && t.natavstavstand ? true : (t.natavstavg || t.natavstavstand));
    rad('system', lo.system, t.natsyslop);
    rad('fastsumma', lo.fastSumma, false);
    rad('energi', lo.energi, t.natenergi);
    rad('summa', lo.summa, false);
    rad('livs', res.natLivsKr, false);
    document.querySelectorAll('#nat-kronor-tabell .kol-verk').forEach(c => { c.hidden = ett; });
    satt('nat-kol-park', ett ? 'Ett verk (hela parken)' : 'Hela parken (' + n + ' verk)');
    const vilket = d.natlage === 'ingen' ? 'läget bas (som om nätkostnaderna togs med)' : 'läget ' + LAGE_TEXT[d.natlage];
    satt('nat-kronor-info', 'Räknat på ' + vilket + ', ' + n + (ett ? ' verk' : ' verk') + ' om ' + fmt(d.effekt, 1) + ' MW. ' +
      (ett ? '' : 'Per verk är parkens belopp delat med antalet verk: en fast årsavgift gäller anslutningen och inte det enskilda verket. ') +
      'Fast del är oberoende av produktionen. Rörlig del är energiavgiften gånger produktionen och är negativ när den är en ersättning. Nuvärdet räknas med kalkylräntan över livslängden.');
  }

  /* Sammanfattning som alltid syns, öre/kWh vid varje löpande fält och
     varning när värden ändrats för hand (de följer inte med i länken). */
  function uppdateraSammanfattning(res, d) {
    const np = res.natPanel, lo = np.lopandeOre, pe = np.engangPerMW;
    const t = d.natTomma || {};
    const ingen = d.natlage === 'ingen';
    const lagetext = ingen ? 'Om nätkostnaderna togs med (läge bas)' : 'Med läget ' + LAGE_TEXT[d.natlage];
    satt('nat-sam-lopande', lagetext + ': löpande nätkostnader ' + fmt(lo.summa, 2, ' öre/kWh') +
      ' (fast del ' + fmt(lo.fastSumma, 2) + ' och rörlig del ' + fmt(lo.energi, 2) + ' öre/kWh).');
    const inv = d.specinv * 1000;
    satt('nat-sam-engang', 'Engångskostnad: ' + fmt(pe.summa, 0, ' kr/MW') +
      (inv > 0 ? ' (' + fmt(pe.summa / inv * 100, 1, ' % av investeringsutgiften per MW') + ')' : '') +
      (d.natengangingar === 'ja' ? ', antas ingå i investeringsutgiften.' : ', läggs till investeringsutgiften.'));

    // Det som inte ingår: anslutningskostnader och systemkrav utan belopp.
    const saknas = ['natavstand', 'natledning', 'natstation', 'natforstark', 'natutredning', 'natengangschablon', 'natsyseng', 'natsyslop', 'natsysbortfall'];
    const alltTomt = saknas.every(k => t[k]);
    satt('nat-sam-saknas', alltTomt
      ? 'Ingår inte: anslutningskostnader och nya systemkrav saknar belopp i källorna och är tomma. Det är två av de tre kostnadsslag som ledaren (Denli, 2026) pekar ut. Totalbilden är därför högre än siffrorna ovan.'
      : '');
    const sk = el('nat-sam-saknas'); if (sk) sk.hidden = !alltTomt;

    // Öre/kWh per löpande fält, räknat på fältets eget värde (faktor 1).
    const P = d.effekt * d.antalverk;
    const bas = NATKOSTNAD.beraknaNat(d, 1, P, P * 8760 * d.kapfaktor * 1000);
    const o = bas.lopandeOre;
    const visa = (id, ids, v) => {
      const e = el('nat-ore-' + id);
      if (e) e.textContent = ids.every(k => t[k]) ? '' : '= ' + fmt(v, 2, ' öre/kWh');
    };
    visa('natfast', ['natfast'], o.fast);
    visa('nateffekt', ['nateffekt'], o.effekt);
    visa('natavstavg', ['natavstavg', 'natavstavstand'], o.avstand);
    visa('natsyslop', ['natsyslop'], o.system);
    const summaNat = o.fast + o.effekt + o.avstand + o.energi;
    satt('nat-ore-summa', fmt(summaNat, 2, ' öre/kWh'));

    // Avvikelse mot valt exempelfall: värden ändrade för hand följer inte med i länken.
    const f = hittaFall(d.natexempel);
    const varn = el('nat-lank-varning');
    if (varn) {
      let avviker = false;
      if (f && !f.eget) {
        avviker = FALT.some(k => {
          const e = el(k); const v = e ? e.value.trim() : '';
          const fv = (f.falt[k] === null || f.falt[k] === undefined) ? '' : String(f.falt[k]);
          return v !== fv;
        });
      } else {
        avviker = !allaNatFaltTomma();
      }
      varn.hidden = !avviker;
    }
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
    if (d.antalverk === 1 && f.falt.natfast !== null && f.falt.natfast !== undefined) {
      txt += 'Obs: fallet har en fast årsavgift per anslutning. För ett enskilt verk skulle nätägaren troligen anvisa en lägre spänningsnivå med en annan fast avgift, så öre per kWh är här ett räkneexempel och inte en belagd kostnad för ett ensamt verk. ';
    }
    if (f.typ === 'stamnät direkt') {
      txt += 'Obs: fallet gäller en direktansluten anläggning, normalt en stor. En park på 4 eller 20 MW ansluts i regel via regionnätet, så fallet är inte ett alternativ för den och inte jämförbart med A och B. Engångskostnaden för en egen anslutning saknas. ';
    }
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
