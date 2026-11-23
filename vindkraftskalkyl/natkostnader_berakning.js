/* ============================================================================
   natkostnader_berakning.js
   ----------------------------------------------------------------------------
   Ren beräkningsmodul för nätkostnader och systemkrav (PRD_natkostnader.md,
   avsnittet "fas 2"). Modulen rör inte DOM och kan därför köras både i
   webbläsaren (global NATKOSTNAD) och i Node (module.exports), där
   test_natkostnader.js använder den.

   Begrepp (se PRD):
   - Engångskostnad (kr): allt en producent betalar för att ansluta vid
     uppförandet. Visas som kr/MW.
   - Löpande kostnad (kr/år): en fast del (fast årsavgift, effektavgift,
     avståndsavgift, löpande systemkrav) och en rörlig del (energiavgift,
     kan vara negativ = ersättning). Visas som öre/kWh.
   - Faktor per läge: ingen = 0, låg = natfaktorlag, bas = 1, hög = natfaktorhog.
     Faktorn multiplicerar alla poster utom energiavgiften.
   ============================================================================ */

(function (rot) {
  'use strict';

  /** Fältens id i HTML. Tomt fält = "ej angivet" (räknas som 0). */
  const NAT_FALT = [
    'natavstand', 'natledning', 'natstation', 'natforstark', 'natutredning', 'natutredningpermw', 'natutredningtak',
    'natengangschablon', 'natfast', 'nateffekt', 'natavstavg', 'natavstavstand',
    'natenergi', 'natforandring', 'natsyseng', 'natsyslop', 'natsysbortfall'
  ];

  /** Faktorn för ett läge. Okänt läge behandlas som "ingen". */
  function faktorForLage(lage, d) {
    if (lage === 'bas') return 1;
    if (lage === 'lag') return Number.isFinite(d.natfaktorlag) ? d.natfaktorlag : 0.5;
    if (lage === 'hog') return Number.isFinite(d.natfaktorhog) ? d.natfaktorhog : 1.5;
    return 0;
  }

  /**
   * Beräknar alla nätposter för en given faktor.
   * @param {object} d             indata (nat*-fält som tal, tomma = 0)
   * @param {number} faktor        faktor enligt läge
   * @param {number} P_tot         total effekt (MW)
   * @param {number} produktionBrutto  produktion år 1 före bortfall (kWh)
   */
  function beraknaNat(d, faktor, P_tot, produktionBrutto) {
    const n = (x) => (Number.isFinite(x) ? x : 0);

    // Bortfall av produktion (systemkrav), högst 100 procent.
    const bortfall = Math.min(1, Math.max(0, faktor * n(d.natsysbortfall) / 100));
    const produktionAr1 = produktionBrutto * (1 - bortfall);

    // Utredningsavgiften räknas på parkens effekt: fast del + kkr/MW × MW, högst taket om ett tak anges.
    let utredningKkr = n(d.natutredning) + n(d.natutredningpermw) * P_tot;
    if (n(d.natutredningtak) > 0) utredningKkr = Math.min(utredningKkr, n(d.natutredningtak));

    // Engångsposter (kr), före faktor.
    const e = {
      ledning:     n(d.natavstand) * n(d.natledning) * 1000,
      station:     n(d.natstation) * 1000,
      forstarkning: n(d.natforstark) * 1000,
      utredning:   utredningKkr * 1000,
      system:      n(d.natsyseng) * 1000 * P_tot,
      schablon:    n(d.natengangschablon) * 1000 * P_tot
    };
    Object.keys(e).forEach(k => { e[k] = faktor * e[k]; });
    const natEngang = e.ledning + e.station + e.forstarkning + e.utredning + e.system + e.schablon;

    // Löpande poster år 1 (kr/år), fast del före faktor.
    const l = {
      fast:    n(d.natfast),
      effekt:  n(d.nateffekt) * P_tot * 1000,
      avstand: n(d.natavstavg) * n(d.natavstavstand) * P_tot * 1000,
      system:  n(d.natsyslop) * P_tot
    };
    Object.keys(l).forEach(k => { l[k] = faktor * l[k]; });
    const fastSumma = l.fast + l.effekt + l.avstand + l.system;
    // Energiavgiften (rörlig del) skalas inte av läget låg/hög, men är 0 i läget
    // ingen (faktor 0), så att läget ingen sätter alla nätkostnader till 0.
    const energiPa = faktor > 0 ? 1 : 0;
    const energiAr1 = energiPa * n(d.natenergi) / 100 * produktionAr1;
    const lopandeAr1 = fastSumma + energiAr1;

    const forandring = n(d.natforandring) / 100;

    /** Löpande kostnad år t (t = 1..n) givet produktionen år t (kWh). */
    function lopandeAr(t, produktionT) {
      const upp = Math.pow(1 + forandring, t - 1);
      return (fastSumma + energiPa * n(d.natenergi) / 100 * produktionT) * upp;
    }

    // Nyckeltal enligt Kents regel: engång i kr/MW, löpande i öre/kWh.
    const perMW = (x) => (P_tot > 0 ? x / P_tot : NaN);
    const ore = (x) => (produktionAr1 > 0 ? x / produktionAr1 * 100 : NaN);

    return {
      faktor, bortfall, produktionAr1,
      engang: Object.assign({ summa: natEngang }, e),
      engangPerMW: {
        ledning: perMW(e.ledning), station: perMW(e.station), forstarkning: perMW(e.forstarkning),
        utredning: perMW(e.utredning), system: perMW(e.system), schablon: perMW(e.schablon),
        summa: perMW(natEngang)
      },
      lopande: Object.assign({ fastSumma, energi: energiAr1, summa: lopandeAr1 }, l),
      lopandeOre: {
        fast: ore(l.fast), effekt: ore(l.effekt), avstand: ore(l.avstand), system: ore(l.system),
        fastSumma: ore(fastSumma), energi: ore(energiAr1), summa: ore(lopandeAr1)
      },
      lopandePerMWAr: perMW(lopandeAr1),
      natEngang, lopandeAr1, lopandeAr
    };
  }

  /** Vilka fält är tomma ("ej angivet")? Returnerar en mängd av id. */
  function tommaFalt(varden) {
    const t = {};
    NAT_FALT.forEach(id => {
      const v = varden[id];
      if (v === '' || v === null || v === undefined) t[id] = true;
    });
    return t;
  }

  /** Typfall efter total effekt (MW): ur `trappa` när den finns, annars `litet` upp till gransMW och `stort` över. `stamnat` är sant över stamnatMW. */
  function typfallForEffekt(P, t) {
    // Trappan (t.trappa) är den fullständiga uppdelningen efter parkeffekt. Utan trappa gäller litet/stort vid gransMW.
    const st = (t.trappa || []).find(s => P > s.franMW && P <= s.tillMW);
    if (st) return { id: st.id, stamnat: P > t.stamnatMW };
    return { id: P > t.gransMW ? t.stort : t.litet, stamnat: P > t.stamnatMW };
  }

  /**
   * Parkens produktion år 1 före bortfall från systemkrav (kWh): effekt × 8 760 h × kapacitetsfaktor.
   * Samma formel i alla kalkyler, så att den antagna kapacitetsfaktorn syns. Fullasttimmar = kapacitetsfaktor × 8 760.
   */
  function bruttoKWh(d, P_tot) {
    return P_tot * 8760 * d.kapfaktor * 1000;
  }

  const API = { NAT_FALT, faktorForLage, beraknaNat, tommaFalt, typfallForEffekt, bruttoKWh };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else rot.NATKOSTNAD = API;
})(typeof window !== 'undefined' ? window : this);
