/* ============================================================================
   natkostnader_exempel_sida.js
   ----------------------------------------------------------------------------
   Bygger läsarsidan natkostnader_exempel.html ur datafilen
   natkostnader_exempel.js (NAT_EXEMPEL, NAT_REGELVERK, NAT_NORMALFALL) och
   räknar med natkostnader_berakning.js (NATKOSTNAD), samma modul som kalkylen.

   VERSION och VERSIONSDATUM ska höjas vid varje ändring av sidan eller dess
   skript (regel 19 i kent-bygg-sidor).
   UPPDATERING 2026-11-22: sidan skapades. Version 1.0.
   UPPDATERING 2026-11-22 (senare igen): länk "Visa i kalkylen" vid varje fall. Version 1.2.
   UPPDATERING 2026-11-22 (senare igen): Tabell 4 (parkeffekt och nätfall) med markering av vald storlek. Version 1.8.
   UPPDATERING 2026-11-22 (senare igen): fältet för utredningsavgift per MW, Svenska kraftnäts vägledning 2026-07-01 i källistan. Version 1.7.
   UPPDATERING 2026-11-22 (senare igen): typfallet märks i Diagram 1 (ram och etikett), övriga fall tonas ned, fler källor om stamnätsanslutning. Version 1.6.
   UPPDATERING 2026-11-22 (senare igen): märkning av direktanslutna fall (C–E), förklaring vid hovring, källan om stamnätsanslutning i källistan. Version 1.5.
   UPPDATERING 2026-11-22 (senare igen): avsnittet Typfall efter parkens storlek (fall B upp till 15 MW, fall A över) ersätter normalfallstexten. Version 1.4.
   UPPDATERING 2026-11-22 (senare igen): växlare ett verk / fem verk (förvalt ett verk), förklaringar vid hovring i Diagram 1, förbehåll för ett ensamt verk, utgångspunkten i källistan. Version 1.3.
   UPPDATERING 2026-11-22 (senare): avsnittet Det som saknas anger antagandet att engångskostnaden ingår i investeringsutgiften. Version 1.1.
   ============================================================================ */
'use strict';

const VERSION = '1.8';
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
  let radSenaste = [];

  function indata() {
    const P = Math.max(1, parseFloat(el('p-effekt').value) || 4);
    const kf = Math.min(0.7, Math.max(0.05, parseFloat(el('p-kapfaktor').value) || 0.37));
    return { P, kf, brutto: P * 8760 * kf * 1000 };
  }

  function markeraKnappar(P) {
    document.querySelectorAll('.nat-verkknapp').forEach(k => {
      k.setAttribute('aria-pressed', String(parseFloat(k.getAttribute('data-mw')) === P));
    });
    const not = el('ensamt-verk-not');
    if (not) not.hidden = !(P <= 4);
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

  /* Kort förklaring vid hovring på en stapel i Diagram 1. Siffrorna räknas om
     för vald effekt, så texten gäller det som visas just nu. */
  function bryt(text, bredd) {
    const ord = text.split(' '); const rader = []; let rad = '';
    ord.forEach(o => {
      if ((rad + ' ' + o).trim().length > bredd) { rader.push(rad.trim()); rad = o; } else { rad += ' ' + o; }
    });
    if (rad.trim()) rader.push(rad.trim());
    return rader;
  }
  function forklaringStapel(f, r) {
    const typ = NATKOSTNAD.typfallForEffekt(indata().P, NAT_TYPFALL).id;
    const rubrik = f.id === typ ? 'Typfall för vald storlek (rimligt nätalternativ). ' :
      (f.typ === 'stamnät direkt' ? 'Inte ett alternativ för vald storlek (direktansluten). ' :
      (f.belagd && !f.sarfall ? 'Inte typfallet för vald storlek (typfallet är ' + typ + '). ' : ''));
    const e = sv(r.lopandeOre.energi, 2), fast = sv(r.lopandeOre.fastSumma, 2), tot = sv(r.lopandeOre.summa, 2);
    let t;
    if (f.id === 'C' || f.id === 'E') {
      t = 'Negativ nätkostnad (en ersättning): i södra Sverige minskar inmatningen stamnätets förluster, så Svenska kraftnäts energiavgift blir en kredit (' + e + ' öre/kWh). Den är större än den fasta delen (' + fast + ' öre/kWh), så producenten får netto ' + sv(-r.lopandeOre.summa, 2) + ' öre/kWh. Gäller en direktansluten anläggning, normalt stor, och är inte ett alternativ för 4 eller 20 MW. Engångskostnaden för egen anslutning saknas.';
    } else if (f.id === 'A' || f.id === 'B') {
      const naraNoll = Math.abs(r.lopandeOre.summa) < 1;
      t = 'Energiersättningen (' + e + ' öre/kWh) och de fasta avgifterna (' + fast + ' öre/kWh) ' +
        (naraNoll ? 'tar nästan ut varandra, så nätkostnaden blir nära noll (' + tot + ').'
                  : 'tar inte ut varandra: ' + (r.lopandeOre.summa > 0 ? 'de fasta avgifterna väger tyngre' : 'ersättningen väger tyngre') + ' (' + tot + ' öre/kWh).') +
        ' Den fasta årsavgiften (' + sv(f.falt.natfast / 1000, 0) + ' kkr/år) är per anslutning och slås ut på produktionen: fler verk ger lägre öre per kWh, ett verk ger högre.';
    } else if (f.id === 'D') {
      t = 'Positiv nätkostnad: i norr ökar inmatningen stamnätets förluster (positiv förlustkoefficient), så producenten betalar energiavgiften (' + e + ' öre/kWh) utöver effektavgiften. Ingen fast årsavgift, så parkens storlek påverkar inte öre per kWh. Gäller en direktansluten anläggning.';
    } else if (f.id === 'F') {
      t = 'Hög nätkostnad: ett lokalnät som en vindkraftutvecklare äger, med hög effektavgift (170 kr/kW) och positiv överföringsavgift (' + e + ' öre/kWh). Särfall, inte representativt.';
    } else if (f.id === 'G') {
      t = 'Kents uppfattning, ej belagd: ungefär 5 öre/kWh i rörlig nätavgift. Fast löpande del saknas, så fallet är inte jämförbart rakt av.';
    } else {
      t = 'Löpande nätkostnad ' + tot + ' öre/kWh.';
    }
    return bryt(rubrik + t, 42);
  }

  function bygg() {
    const x = indata();
    markeraKnappar(x.P);
    const tk = el('tabell-typfall-kropp');
    if (tk && typeof NAT_TYPFALL !== 'undefined' && NAT_TYPFALL.trappa) {
      tk.textContent = '';
      NAT_TYPFALL.trappa.forEach(st => {
        const tr = document.createElement('tr');
        if (x.P > st.franMW && x.P <= st.tillMW) tr.className = 'nu';
        tr.appendChild(td(st.effekt));
        tr.appendChild(td(st.kV));
        tr.appendChild(td(st.text));
        tk.appendChild(tr);
      });
    }
    const fall = NAT_EXEMPEL.filter(f => !f.eget);
    const rader = fall.map(f => ({ f, r: raknaFall(f, x) }));
    rader.sort((a, b) => a.r.lopandeOre.summa - b.r.lopandeOre.summa);
    radSenaste = rader;

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
      if (f.typ === 'stamnät direkt') namnCell.appendChild(marke('direktansluten', 'direkt'));
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
    const typ = NATKOSTNAD.typfallForEffekt(x.P, NAT_TYPFALL).id;
    const etikettFor = (f) => {
      if (f.id === typ) return [f.id, 'typfall'];
      if (f.typ === 'stamnät direkt') return [f.id, 'direktansluten'];
      if (f.sarfall) return [f.id, 'särfall'];
      if (!f.belagd) return [f.id, 'uppfattning'];
      return [f.id, 'annan storlek'];
    };
    const etiketter = rader.map(({ f }) => etikettFor(f));
    const varden = rader.map(({ r }) => Math.round(r.lopandeOre.summa * 100) / 100);
    const grund = (f) => !f.belagd ? '#9e9e9e' : (f.sarfall ? '#c77f2e' : '#2e8b84');
    // Typfallet har full färg och tjock ram, övriga tonas ned.
    const farger = rader.map(({ f }) => f.id === typ ? grund(f) : grund(f) + '66');
    const ramfarg = rader.map(({ f }) => f.id === typ ? '#0b3d3a' : 'rgba(0,0,0,0)');
    const ramtjocklek = rader.map(({ f }) => f.id === typ ? 3 : 0);
    const tt = el('diagram-typfall-text');
    if (tt) tt.textContent = 'Typfall för ' + sv(x.P, 1) + ' MW: fall ' + typ + ' (stapeln med tjock ram). Fall C–E är direktanslutna och inte ett alternativ för den här storleken, och fallet som hör till en annan storlek är tonat. F är ett särfall och G en uppfattning.';
    const ctx = el('diagram-fall');
    if (typeof Chart !== 'undefined' && ctx) {
      if (diagram) {
        diagram.data.labels = etiketter; diagram.data.datasets[0].data = varden; diagram.data.datasets[0].backgroundColor = farger; diagram.data.datasets[0].borderColor = ramfarg; diagram.data.datasets[0].borderWidth = ramtjocklek; diagram.update();
      } else {
        diagram = new Chart(ctx, {
          type: 'bar',
          data: { labels: etiketter, datasets: [{ label: 'Löpande nätkostnad (öre/kWh)', data: varden, backgroundColor: farger, borderColor: ramfarg, borderWidth: ramtjocklek }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => sv(c.parsed.y, 2, ' öre/kWh'), afterLabel: (c) => forklaringStapel(radSenaste[c.dataIndex].f, radSenaste[c.dataIndex].r) } } },
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
    const tf = (typeof NAT_TYPFALL !== 'undefined') ? NAT_TYPFALL : null;
    if (tf) {
      const fl = NAT_EXEMPEL.find(f => f.id === tf.litet), fs = NAT_EXEMPEL.find(f => f.id === tf.stort);
      const p1 = document.createElement('p');
      p1.appendChild(document.createTextNode('Olika nätanslutningar passar olika stora anläggningar. Kalkylen föreslår fall ' + tf.litet + ' (' + fl.namn + ') för en park upp till ' + tf.gransMW + ' MW, och fall ' + tf.stort + ' (' + fs.namn + ') för en större. Ett verk om 4 MW passar därmed fall ' + tf.litet + ', och fem verk om 4 MW (20 MW) fall ' + tf.stort + '. Gränsen ' + tf.gransMW + ' MW är Kents val.'));
      nf.appendChild(p1);
      const p2 = document.createElement('p');
      p2.appendChild(document.createTextNode('Skälet är en vägledande figur över sannolik överföringsförmåga per spänningsnivå: ungefär 10 MW vid 10 kV, 15 MW vid 20 kV och 40 MW vid 40 kV (' ));
      p2.appendChild(lank(tf.kalla.url, 'Vindkraftutredning för Norrbottens kust- och skärgårdsområde, s. 32–33'));
      p2.appendChild(document.createTextNode(', där figuren anger Energimyndigheten 2007 som källa). Det är ett riktmärke och inte belagt i Vattenfalls tariff: nätägaren avgör anslutningsnivån efter nätets kapacitet och avstånd. Fall A och B är Vattenfalls regionnät, och Ellevio och E.ON är inte genomgångna. Över cirka ' + tf.stamnatMW + ' MW är direktanslutning till stamnätet (fall C–E) ändå inte given: gränsen 100 MW för 220 kV och 300 MW för 400 kV gäller när Svenska kraftnät bygger en ny station, och anslutning sker i första hand via regionnätet. Se '));
      p2.appendChild(lank('#stamnat-rubrik', 'Varför kan jag inte välja Svenska kraftnät?'));
      p2.lastChild.removeAttribute('target');
      nf.appendChild(p2);
      const p3 = document.createElement('p');
      p3.appendChild(document.createTextNode('I kalkylen väljs förslaget automatiskt när läget går från ingen, om användaren inte har valt ett fall eller ändrat ett fält. Förslaget följer sedan antal verk och effekt tills användaren väljer själv.'));
      nf.appendChild(p3);
    }
  }

  /* ---- Regelverk (Tabell 3), fall i detalj och källor ---- */
  const FALTETIKETTER = [
    ['natavstand', 'Avstånd till anslutningspunkt', 'km'],
    ['natledning', 'Ledningskostnad', 'kkr/km'],
    ['natstation', 'Station och fast del', 'kkr'],
    ['natforstark', 'Förstärkning och anslutningsavgift', 'kkr'],
    ['natutredning', 'Utredning och förprojektering, fast del', 'kkr'],
    ['natutredningpermw', 'Utredning, del per MW', 'kkr/MW'],
    ['natutredningtak', 'Utredning, tak', 'kkr'],
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
      if (f.belagd || f.id === 'G') {
        const pl = document.createElement('p');
        const al = document.createElement('a');
        al.href = 'vindkraftskalkyl.html#Natkostnad_Bas_Exempel_' + f.id;
        al.textContent = 'Visa fall ' + f.id + ' i kalkylen (läge bas)';
        pl.appendChild(al); inre.appendChild(pl);
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
    (typeof NAT_UTGANGSPUNKT !== 'undefined' ? NAT_UTGANGSPUNKT : []).forEach(k => { unika[k.url] = k; });
    if (typeof NAT_TYPFALL !== 'undefined' && NAT_TYPFALL.kalla) unika[NAT_TYPFALL.kalla.url] = NAT_TYPFALL.kalla;
    (typeof NAT_STAMNATSKALLOR !== 'undefined' ? NAT_STAMNATSKALLOR : []).forEach(k => { unika[k.url] = k; });
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
    document.querySelectorAll('.nat-verkknapp').forEach(k => k.addEventListener('click', () => {
      el('p-effekt').value = k.getAttribute('data-mw');
      bygg();
    }));
    kopplaModal();
    if (typeof window.kopplaHjalp === 'function') window.kopplaHjalp();
    // Fungerar även om en term skapades efter första anropet: koppla om efter bygg.
  });
})();
