/* ============================================================================
   natkostnader_exempel_sida.js
   ----------------------------------------------------------------------------
   Bygger läsarsidan natkostnader_exempel.html ur datafilen
   natkostnader_exempel.js (NAT_EXEMPEL, NAT_REGELVERK, NAT_NORMALFALL) och
   räknar med natkostnader_berakning.js (NATKOSTNAD), samma modul som kalkylen.

   VERSION och VERSIONSDATUM ska höjas vid varje ändring av sidan eller dess
   skript (regel 19 i kent-bygg-sidor).
   UPPDATERING 2026-11-22: sidan skapades. Version 1.0.
   ============================================================================ */
'use strict';

const VERSION = '1.0';
const VERSIONSDATUM = '2026-11-22';

(function () {
  const el = (id) => document.getElementById(id);
  const sv = (v, dec, suffix) => {
    if (!Number.isFinite(v)) return '–';
    return v.toLocaleString('sv-SE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (suffix || '');
  };

  /* Förklaringar vid hovring, fokus och tryck för termer. */
  const TERMER = {
    PT1: 'Vattenfalls tariffnivå för anslutningspunkter vid 50–30 kV i stationer med nedtransformering från regionalt överföringsnät.',
    PT2: 'Vattenfalls tariffnivå för anslutningspunkter vid 20–6 kV i stationer efter nedtransformering från 50–20 kV.',
    'kr/kW och km': 'En avgift per kW som multipliceras med avståndet i km till närmaste stamnätspunkt ansluten till regionnätet.',
    förlustkoefficient: 'Hur stamnätets totala energiförluster påverkas när ytterligare en MWh matas in i punkten. Positivt värde betyder ökade förluster (debitering), negativt minskade (kreditering).',
    'kundspecifik avgift': 'Svenska kraftnäts nya avgift från 2027: 12 000 kr per månad och abonnemangspunkt.',
    kkr: 'Tusen kronor.',
    median: 'Mittenvärdet när fallen sorteras från lägst till högst.',
    särfall: 'Ett fall som inte är representativt, till exempel ett nät som en vindkraftutvecklare själv äger. Det ingår inte i spridningen.',
    remissutkast: 'Ett förslag som skickats ut för synpunkter. Det är inte beslutat och kan ändras eller utebli.'
  };
  function term(text, nyckel) {
    const s = document.createElement('span');
    s.className = 'hjalp hjalp-term';
    s.tabIndex = 0;
    s.setAttribute('data-hjalp', TERMER[nyckel || text] || '');
    s.textContent = text;
    return s;
  }
  function td(text, klass) {
    const c = document.createElement('td');
    if (klass) c.className = klass;
    if (text instanceof Node) c.appendChild(text); else c.textContent = text;
    return c;
  }
  function th(text) { const c = document.createElement('th'); c.scope = 'col'; c.textContent = text; return c; }
  function marke(text, klass) { const m = document.createElement('span'); m.className = 'markering ' + klass; m.textContent = text; return m; }
  function lank(url, text) {
    const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text; return a;
  }

  let diagram = null;

  function indata() {
    const P = Math.max(1, parseFloat(el('p-effekt').value) || 20);
    const kf = Math.min(0.7, Math.max(0.05, parseFloat(el('p-kapfaktor').value) || 0.37));
    return { P, kf, brutto: P * 8760 * kf * 1000 };
  }

  function raknaFall(f, x) {
    const d = {};
    NATKOSTNAD.NAT_FALT.forEach(k => { const v = f.falt[k]; d[k] = (v === null || v === undefined) ? 0 : v; });
    return NATKOSTNAD.beraknaNat(d, 1, x.P, x.brutto);
  }

  function median(v) {
    const s = v.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function aeldreAnEttAr(datum) {
    if (!datum) return false;
    const dagar = (Date.now() - new Date(datum).getTime()) / 86400000;
    return dagar > 365;
  }

  function bygg() {
    const x = indata();
    const fall = NAT_EXEMPEL.filter(f => !f.eget);
    const rader = fall.map(f => ({ f, r: raknaFall(f, x) }));
    rader.sort((a, b) => a.r.lopandeOre.summa - b.r.lopandeOre.summa);

    /* ---- Tabell 1 ---- */
    const huvud = el('tabell-fall-huvud'); huvud.textContent = '';
    const hr = document.createElement('tr');
    ['Fall', 'Typ och år', 'Fast del, öre/kWh', 'Rörlig del, öre/kWh', 'Löpande totalt, öre/kWh', 'Engångskostnad, kr/MW (belagd del)', 'Komplett', 'Kontrollerad']
      .forEach(t => hr.appendChild(th(t)));
    huvud.appendChild(hr);

    const kropp = el('tabell-fall-kropp'); kropp.textContent = '';
    const gamla = [];
    rader.forEach(({ f, r }) => {
      const tr = document.createElement('tr');
      if (!f.belagd) tr.className = 'ej-belagd'; else if (f.sarfall) tr.className = 'sarfall';
      const namn = document.createElement('a'); namn.href = '#fall-' + f.id; namn.textContent = f.id + '. ' + f.namn;
      const namnCell = document.createElement('span'); namnCell.appendChild(namn);
      if (f.sarfall) namnCell.appendChild(marke('särfall', 'sarfall'));
      if (!f.belagd) namnCell.appendChild(marke('ej belagd', 'ejbelagd'));
      tr.appendChild(td(namnCell));
      tr.appendChild(td(f.typ + (f.ar ? ', ' + f.ar : '')));
      const fastSaknas = f.falt.natfast === null && f.falt.nateffekt === null && f.falt.natavstavg === null && f.falt.natsyslop === null;
      tr.appendChild(td(fastSaknas ? '–' : sv(r.lopandeOre.fastSumma, 2), 'tal'));
      tr.appendChild(td(f.falt.natenergi === null ? '–' : sv(r.lopandeOre.energi, 2), 'tal'));
      tr.appendChild(td(sv(r.lopandeOre.summa, 2), 'tal'));
      const eng = r.engangPerMW.summa;
      tr.appendChild(td(eng === 0 && !f.komplett.engang ? '–' : sv(eng, 0) + (f.falt.natengangschablon !== null ? ' (hela, uppfattning)' : (f.falt.natutredning !== null ? ' (utredning)' : '')), 'tal'));
      tr.appendChild(td('löpande ' + (f.komplett.lopande ? 'ja' : 'nej') + ', engång ' + (f.komplett.engang ? (f.belagd ? 'ja' : 'ja, ej belagd') : 'nej')));
      const kontroll = document.createElement('span');
      kontroll.textContent = f.kontrollerad || '–';
      if (f.belagd && aeldreAnEttAr(f.kontrollerad)) { kontroll.appendChild(marke('äldre än ett år', 'gammalt')); gamla.push(f.id); }
      tr.appendChild(td(kontroll));
      kropp.appendChild(tr);
    });

    const varn = el('varning-gamla');
    if (gamla.length) { varn.hidden = false; varn.textContent = 'Fall ' + gamla.join(', ') + ' har ett kontrolldatum som är äldre än ett år. Tarifferna ändras varje årsskifte: kontrollera mot källan.'; }
    else varn.hidden = true;

    /* ---- Diagram 1 ---- */
    const etiketter = rader.map(({ f }) => f.id);
    const varden = rader.map(({ r }) => Math.round(r.lopandeOre.summa * 100) / 100);
    const farger = rader.map(({ f }) => !f.belagd ? '#9e9e9e' : (f.sarfall ? '#c77f2e' : '#2e8b84'));
    const ctx = el('diagram-fall');
    if (typeof Chart !== 'undefined' && ctx) {
      if (diagram) {
        diagram.data.labels = etiketter; diagram.data.datasets[0].data = varden; diagram.data.datasets[0].backgroundColor = farger; diagram.update();
      } else {
        diagram = new Chart(ctx, {
          type: 'bar',
          data: { labels: etiketter, datasets: [{ label: 'Löpande nätkostnad (öre/kWh)', data: varden, backgroundColor: farger }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => sv(c.parsed.y, 2, ' öre/kWh') } } },
            scales: { y: { title: { display: true, text: 'öre per kWh' } } }
          }
        });
      }
    }

    /* ---- Spridning ---- */
    const ingar = rader.filter(({ f }) => f.belagd && !f.sarfall);
    const v = ingar.map(({ r }) => r.lopandeOre.summa);
    const med = median(v);
    const txt = el('spridning-text'); txt.textContent = '';
    txt.appendChild(document.createTextNode('Bland de belagda fall som inte är '));
    txt.appendChild(term('särfall'));
    txt.appendChild(document.createTextNode(' (' + ingar.map(({ f }) => f.id).join(', ') + ') ligger den löpande nätkostnaden mellan ' +
      sv(Math.min.apply(null, v), 2) + ' och ' + sv(Math.max.apply(null, v), 2) + ' öre/kWh, med '));
    txt.appendChild(term('median', 'median'));
    txt.appendChild(document.createTextNode(' ' + sv(med, 2) + ' öre/kWh. Underlaget är i huvudsak Vattenfall och Svenska kraftnät, och det är för smalt för att säga vad som är vanligt. Spridningen visar vad de fall som finns ger, inte ett genomsnitt.'));

    const lage = el('tabell-lage-kropp'); lage.textContent = '';
    rader.forEach(({ f, r }) => {
      const tr = document.createElement('tr');
      tr.appendChild(td(f.id + '. ' + f.namn));
      tr.appendChild(td(sv(r.lopandeOre.summa, 2), 'tal'));
      let text;
      if (!f.belagd) text = 'ej belagd, ingår inte';
      else if (f.sarfall) text = 'särfall, ingår inte';
      else if (r.lopandeOre.summa < med - 1e-9) text = 'under medianen';
      else if (r.lopandeOre.summa > med + 1e-9) text = 'över medianen';
      else text = 'vid medianen';
      tr.appendChild(td(text));
      lage.appendChild(tr);
    });

    /* ---- Normalfall ---- */
    const nf = el('normalfall-text'); nf.textContent = '';
    const nfFall = (typeof NAT_NORMALFALL !== 'undefined' && NAT_NORMALFALL) ? NAT_EXEMPEL.find(f => f.id === NAT_NORMALFALL) : null;
    if (nfFall) {
      nf.textContent = 'Kent har utsett fall ' + nfFall.id + ' (' + nfFall.namn + ') till normalfall. ' + (NAT_NORMALFALL_ANGIVELSE || '') +
        ' Det läses in i kalkylen när läget går från ingen till bas och alla nätfält är orörda.';
    } else {
      nf.textContent = 'Inget normalfall är utsett än. Ett normalfall utses av Kent genom att han anger en anslutning som många anser vara vanlig. Den läggs då in som ett fall i datafilen och läses in i kalkylen när läget går från ingen till bas och alla nätfält är orörda.';
    }
  }

  /* ---- Regelverk (Tabell 3), fall i detalj och källor ---- */
  const FALTETIKETTER = [
    ['natavstand', 'Avstånd till anslutningspunkt', 'km'],
    ['natledning', 'Ledningskostnad', 'kkr/km'],
    ['natstation', 'Station och fast del', 'kkr'],
    ['natforstark', 'Förstärkning och anslutningsavgift', 'kkr'],
    ['natutredning', 'Utredning och förprojektering', 'kkr'],
    ['natengangschablon', 'Engångskostnad, schablon', 'kkr/MW'],
    ['natfast', 'Fast årsavgift (inklusive kundspecifik avgift)', 'kr/år'],
    ['nateffekt', 'Effektavgift eller fast avgift per kW', 'kr/kW och år'],
    ['natavstavg', 'Avståndsberoende avgift', 'kr/kW och km'],
    ['natavstavstand', 'Avstånd för avståndsberoende avgift', 'km'],
    ['natenergi', 'Energiavgift (negativt = ersättning)', 'öre/kWh'],
    ['natforandring', 'Årlig förändring', '%/år'],
    ['natsyseng', 'Systemkrav, engångskostnad', 'kkr/MW'],
    ['natsyslop', 'Systemkrav, löpande kostnad', 'kr/MW och år'],
    ['natsysbortfall', 'Systemkrav, produktionsbortfall', '%']
  ];

  function byggStatisk() {
    // Regelverk
    const rk = el('tabell-regelverk-kropp'); rk.textContent = '';
    NAT_REGELVERK.forEach(r => {
      const tr = document.createElement('tr');
      const namn = document.createElement('span');
      namn.appendChild(document.createTextNode(r.titel + ' '));
      if (r.status === 'remissutkast') namn.appendChild(marke('remissutkast', 'utkast'));
      tr.appendChild(td(namn));
      tr.appendChild(td(r.styr));
      tr.appendChild(td(r.status + '. ' + r.datum));
      tr.appendChild(td(r.kalla && r.kalla.url ? lank(r.kalla.url, r.kalla.text + ' (hämtad ' + r.kalla.hamtad + ')') : '–'));
      const anv = NAT_EXEMPEL.filter(f => f.regelverk.indexOf(r.id) >= 0).map(f => f.id);
      tr.appendChild(td(anv.length ? anv.join(', ') : '–'));
      rk.appendChild(tr);
    });

    // Fall i detalj
    const dv = el('fall-detalj'); dv.textContent = '';
    NAT_EXEMPEL.filter(f => !f.eget).forEach(f => {
      const d = document.createElement('details'); d.id = 'fall-' + f.id;
      const s = document.createElement('summary'); s.textContent = f.id + '. ' + f.namn; d.appendChild(s);
      const inre = document.createElement('div');

      const dl = document.createElement('dl'); dl.className = 'falt';
      FALTETIKETTER.forEach(([k, etikett, enhet]) => {
        const v = f.falt[k];
        const dt = document.createElement('dt'); dt.textContent = etikett;
        const dd = document.createElement('dd'); dd.textContent = (v === null || v === undefined) ? '–' : sv(v, v % 1 === 0 ? 0 : 3) + ' ' + enhet;
        dl.appendChild(dt); dl.appendChild(dd);
      });
      inre.appendChild(dl);

      const k1 = document.createElement('h4'); k1.textContent = 'Källor'; inre.appendChild(k1);
      const ul1 = document.createElement('ul');
      f.kalla.forEach(k => { const li = document.createElement('li'); li.appendChild(k.url ? lank(k.url, k.text) : document.createTextNode(k.text)); li.appendChild(document.createTextNode(' (hämtad ' + k.hamtad + ')')); ul1.appendChild(li); });
      inre.appendChild(ul1);

      const k2 = document.createElement('h4'); k2.textContent = 'Antaganden och tolkningar'; inre.appendChild(k2);
      const ul2 = document.createElement('ul'); f.antaganden.forEach(a => { const li = document.createElement('li'); li.textContent = a; ul2.appendChild(li); }); inre.appendChild(ul2);

      if (f.ejMedraknat && f.ejMedraknat.length) {
        const k3 = document.createElement('h4'); k3.textContent = 'Ej medräknat'; inre.appendChild(k3);
        const ul3 = document.createElement('ul'); f.ejMedraknat.forEach(a => { const li = document.createElement('li'); li.textContent = a; ul3.appendChild(li); }); inre.appendChild(ul3);
      }
      const reg = (f.regelverk || []).map(id => NAT_REGELVERK.find(r => r.id === id)).filter(Boolean);
      if (reg.length) {
        const k4 = document.createElement('h4'); k4.textContent = 'Regelverk'; inre.appendChild(k4);
        const ul4 = document.createElement('ul');
        reg.forEach(r => { const li = document.createElement('li'); li.textContent = (r.kort || r.titel) + ' (' + r.status + ')'; ul4.appendChild(li); });
        inre.appendChild(ul4);
      }
      const p = document.createElement('p'); p.className = 'hint';
      p.textContent = 'Senast kontrollerad: ' + (f.kontrollerad || '–') + '. Nättyp: ' + f.typ + '.';
      inre.appendChild(p);
      d.appendChild(inre);
      dv.appendChild(d);
    });

    // Källor, alfabetiskt
    const kl = el('kallor-lista'); kl.textContent = '';
    const unika = {};
    NAT_EXEMPEL.forEach(f => f.kalla.forEach(k => { if (k.url) unika[k.url] = k; }));
    NAT_REGELVERK.forEach(r => { if (r.kalla && r.kalla.url) unika[r.kalla.url] = r.kalla; });
    Object.keys(unika).map(u => unika[u]).sort((a, b) => a.text.localeCompare(b.text, 'sv')).forEach(k => {
      const li = document.createElement('li');
      li.appendChild(lank(k.url, k.text));
      li.appendChild(document.createTextNode(' (hämtad ' + k.hamtad + ')'));
      kl.appendChild(li);
    });
  }

  function kopplaModal() {
    const knapp = el('techBtn'), modal = el('techModal'), stang = el('techStang');
    if (!knapp || !modal || !stang) return;
    knapp.addEventListener('click', () => { modal.hidden = false; });
    stang.addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) modal.hidden = true; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    el('versionsrad-nr').textContent = VERSION;
    el('versionsrad-datum').textContent = VERSIONSDATUM;
    el('data-version').textContent = (typeof NAT_DATA_VERSION !== 'undefined' ? NAT_DATA_VERSION : '–') + ' (' + (typeof NAT_DATA_DATUM !== 'undefined' ? NAT_DATA_DATUM : '–') + ')';
    byggStatisk();
    bygg();
    ['p-effekt', 'p-kapfaktor'].forEach(id => el(id).addEventListener('input', bygg));
    kopplaModal();
    if (typeof window.kopplaHjalp === 'function') window.kopplaHjalp();
    // Fungerar även om en term skapades efter första anropet: koppla om efter bygg.
  });
})();
