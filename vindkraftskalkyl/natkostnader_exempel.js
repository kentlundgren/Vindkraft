/* ============================================================================
   natkostnader_exempel.js
   ----------------------------------------------------------------------------
   Exempelfall och regelverk som nätkostnaderna i vindkraftskalkylen bygger på.
   Den här filen är den enda källan: både kalkylen (vindkraftskalkyl.html) och
   läsarsidan (natkostnader_exempel.html) läser den.

   Hur filen uppdateras:
   - Tarifferna ändras varje årsskifte. Svenska kraftnäts styrelse beslutar i
     september om nästa års avgifter. Uppdatera då fallens värden, `ar`,
     `kontrollerad` och källor.
   - Ett fall med `kontrollerad` äldre än ett år får en varning på läsarsidan.
   - Normalfall: Kent anger ett exempel som många anser vanligt. Lägg in det
     som ett fall och sätt NAT_NORMALFALL till fallets id och
     NAT_NORMALFALL_ANGIVELSE till hans angivelse och datum.
   - Regelverk som ändras: uppdatera status och datum i NAT_REGELVERK.

   Fältvärden: `null` betyder "ej angivet" (tomt fält i kalkylen). Det är inte
   samma sak som 0. Se PRD_natkostnader.md, avsnittet fas 2.

   Fältens enheter: natfast kr/år, nateffekt kr/kW och år, natavstavg kr/kW och
   km, natavstavstand km, natenergi öre/kWh (negativt = ersättning),
   natutredning kkr, natengangschablon kkr/MW.

   Version 1.3 · 2026-11-22 (källan om stamnätsanslutning, NAT_STAMNATSKALLA, tillagd)
   ============================================================================ */

var NAT_DATA_VERSION = '1.3';
var NAT_DATA_DATUM = '2026-11-22';

/** Utgångspunkten för analysen: ledaren och inlägget som återger den. Ingår i källistan. */
var NAT_UTGANGSPUNKT = [
  { text: 'Denli, S. (2026) Vindkraftens ekonomi handlar om mer än elpriset, ledare i Svensk Vindkraft, 16 november (ledaren pekar ut nätavgifter, anslutningskostnader och nya systemkrav som svåra att förutse, utan belopp)', url: 'https://svenskvindkraft.com/vindkraftens-ekonomi-handlar-om-mer-an-elpriset/', hamtad: '2026-11-22' },
  { text: 'Svensk Vindkraft (2026) LinkedIn-inlägg 19 november som återger ledarens inledning (visar att branschorganisationen lyfter frågan)', url: 'https://www.linkedin.com/posts/svensk-vindkraft_i-senaste-numret-av-v%C3%A5r-tidning-svensk-vindkraft-activity-7529084415403253761-pt5K', hamtad: '2026-11-22' }
];

/** Källan om vem som kan ansluta till stamnätet. Ingår i källistan. */
var NAT_STAMNATSKALLA = {
  text: 'Svenska kraftnät (2025a) Principer och vägledning för anslutning till Stamnätet, version 2025-07-01 (lägsta lämpliga spänningsnivå, regionnätsföretaget ansöker, gränsen 100 MW och 300 MW gäller ny station)',
  url: 'https://www.svk.se/49e695/siteassets/aktorsportalen/anslut-till-transmissionsnatet/principer-och-vagledning-for-anslutning-till-stamnatet/principer-och-vagledning-for-anslutning-till-stamnatet.pdf',
  hamtad: '2026-11-22'
};

/** Typfall efter parkens totala effekt. Kalkylen föreslår (och väljer, om användaren inte valt själv)
    fallet `litet` upp till `gransMW` och fallet `stort` över den. Gränsen 15 MW är Kents val (2026-11-22)
    och följer en vägledande figur över sannolik överföringsförmåga per spänningsnivå: ungefär 10 MW vid 10 kV,
    15 MW vid 20 kV och 40 MW vid 40 kV. Det är ett riktmärke och inte belagt i Vattenfalls tariff. Över
    `stamnatMW` hänvisar kalkylen till avsnittet om stamnätsanslutning: gränsen 100 MW (220 kV) och 300 MW (400 kV) gäller
    när Svenska kraftnät bygger en ny station, och anslutning sker i första hand via regionnätet. */
var NAT_TYPFALL = {
  gransMW: 15,
  stamnatMW: 100,
  litet: 'B',
  stort: 'A',
  kalla: {
    text: 'Vindkraftutredning för Norrbottens kust- och skärgårdsområde, avsnitt 2.6 Elnät och befintlig kraftproduktion, s. 32–33, figur 2.6:1 Sannolik överföringsförmåga av effekt vid olika systemspänning (figuren anger Energimyndigheten 2007 som källa; utredningens utgivningsår är inte kontrollerat)',
    url: 'https://www.kalix.se/globalassets/filer/bygga-bo-och-miljo/planer/vindkraftsutredning/s32-33.pdf',
    hamtad: '2026-11-22'
  }
};

/** Id på det fall Kent har utsett till normalfall, eller null. */
var NAT_NORMALFALL = null;
var NAT_NORMALFALL_ANGIVELSE = null;

var NAT_REGELVERK = [
  {
    id: 'ellag-4kap',
    kort: 'Ellagen 4 kap.',
    titel: 'Ellag (1997:857), 4 kap. (anslutning), bland annat 10 §',
    styr: 'Avgiften för anslutning ska täcka nätföretagets skäliga kostnader. Särskild hänsyn ska tas till anslutningspunktens läge och avtalad effekt.',
    status: 'gällande',
    datum: 'Gäller. Ei har föreslagit en föreskrift som ska ersätta 10 §.',
    kalla: { text: 'Sveriges riksdag, Ellag (1997:857)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/ellag-1997857_sfs-1997-857/', hamtad: '2026-11-22' }
  },
  {
    id: 'ei-fs-anslutningsavgifter',
    kort: 'Ei-utkast om anslutningsavgifter',
    titel: 'Ei:s föreskrifter och allmänna råd om anslutningsavgifter för elektriska anläggningar',
    styr: 'Hur nätföretag utformar anslutningsavgifter: kundspecifik andel av kostnaderna från närmaste matande transformatorstation, engångsavgift, schabloner för små anläggningar.',
    status: 'remissutkast',
    datum: 'Föreslaget ikraftträdande 2027-01-01. Inte beslutad enligt det jag har läst.',
    kalla: { text: 'Energimarknadsinspektionen (2026a), remissutkast', url: 'https://ei.se/download/18.c64bc1a19b353d7ad72d854/1770105807164/Remissutkast%20F%C3%B6reskrifter%20Anslutningsavgifter.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'eifs-2018-2',
    kort: 'EIFS 2018:2',
    titel: 'EIFS 2018:2, krav för nätanslutning av generatorer (nuvarande föreskrift)',
    styr: 'Nationella krav på produktionsanläggningar, bland annat reaktiv effekt för kraftparksmoduler (vindkraftverk).',
    status: 'gällande',
    datum: 'Gäller. Ei har föreslagit att den ersätts.',
    kalla: { text: 'Energimarknadsinspektionen (2026b), konsekvensutredning', url: 'https://ei.se/download/18.1825c33b19c47ab9719fc38/1771849540664/Remissutkast-Konsekvensutredning-Eis-f%C3%B6reskrifter-och-allm%C3%A4nna-r%C3%A5d-om-fastst%C3%A4llande-av-generellt-till%C3%A4mpliga-krav-f%C3%B6r-n%C3%A4tanslutning-av-kraftproduktionsmoduler.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'ei-fs-kraftproduktionsmoduler',
    kort: 'Ei-utkast om krav för kraftproduktionsmoduler',
    titel: 'Ei:s föreskrifter om generellt tillämpliga krav för nätanslutning av kraftproduktionsmoduler (ersätter EIFS 2018:2)',
    styr: 'Fler krav fastställs platsspecifikt av systemansvariga. Ei bedömer att kostnaderna sammantaget minskar men att det är svårt att kvantifiera.',
    status: 'remissutkast',
    datum: 'Föreslaget ikraftträdande 2026-07-01 med övergångsregler till 2026-12-31. Om utkastet är beslutat har jag inte kontrollerat.',
    kalla: { text: 'Energimarknadsinspektionen (2026b), konsekvensutredning', url: 'https://ei.se/download/18.1825c33b19c47ab9719fc38/1771849540664/Remissutkast-Konsekvensutredning-Eis-f%C3%B6reskrifter-och-allm%C3%A4nna-r%C3%A5d-om-fastst%C3%A4llande-av-generellt-till%C3%A4mpliga-krav-f%C3%B6r-n%C3%A4tanslutning-av-kraftproduktionsmoduler.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'eu-rfg',
    kort: 'RfG (EU 2016/631)',
    titel: 'Kommissionens förordning (EU) 2016/631 (RfG), krav för nätanslutning av generatorer',
    styr: 'EU-krav som direkt gäller i Sverige men som behöver kompletteras med nationella och platsspecifika krav.',
    status: 'gällande',
    datum: 'Gäller.',
    kalla: { text: 'Energimarknadsinspektionen (2026b), konsekvensutredning', url: 'https://ei.se/download/18.1825c33b19c47ab9719fc38/1771849540664/Remissutkast-Konsekvensutredning-Eis-f%C3%B6reskrifter-och-allm%C3%A4nna-r%C3%A5d-om-fastst%C3%A4llande-av-generellt-till%C3%A4mpliga-krav-f%C3%B6r-n%C3%A4tanslutning-av-kraftproduktionsmoduler.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'eu-elmarknadsforordning-18',
    kort: 'Elmarknadsförordningen art. 18',
    titel: 'Förordning (EU) 2019/943, artikel 18 (avgifter för nätanslutning)',
    styr: 'Anslutningsavgiften ska spegla de faktiska kostnaderna, vara transparent och tillämpas icke-diskriminerande.',
    status: 'gällande',
    datum: 'Gäller.',
    kalla: { text: 'Svenska kraftnät (2026e), vägledning kostnadsfördelning anslutningsavgift', url: 'https://www.svk.se/4993dd/siteassets/om-oss/rapporter/2026/vagledning_kostnadsfordelning_anslutningavgift_20260429.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'svk-vagledning',
    kort: 'Svenska kraftnäts vägledning om anslutningsavgift',
    titel: 'Svenska kraftnät, vägledning kostnadsfördelning anslutningsavgift (2026-04-29)',
    styr: 'Anslutningsavgiften till stamnätet: kundspecifika åtgärder, utredningsavgift 100 kkr + 1,2 kkr/MW (2025), förprojektering.',
    status: 'gällande',
    datum: 'Daterad 2026-04-29.',
    kalla: { text: 'Svenska kraftnät (2026e)', url: 'https://www.svk.se/4993dd/siteassets/om-oss/rapporter/2026/vagledning_kostnadsfordelning_anslutningavgift_20260429.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'svk-prislista-2026',
    kort: 'Svenska kraftnäts prislista 2026',
    titel: 'Svenska kraftnät, prislista 2026 för transmissionsnätet',
    styr: 'Effektavgift per anslutningspunkt och energiavgift (börspris + 15 kr/MWh) × marginalförlustkoefficient.',
    status: 'gällande',
    datum: 'Gäller från 2026-01-01.',
    kalla: { text: 'Svenska kraftnät (2026b)', url: 'https://www.svk.se/4a909a/siteassets/aktorsportalen/anslut-till-transmissionsnatet/transmissionsnatstariff/aktuella-prislistor/prislista-transmissionsnatet-20262.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'svk-prislista-2027',
    kort: 'Svenska kraftnäts prislista 2027',
    titel: 'Svenska kraftnät, prislista 2027 för transmissionsnätet (ny avgiftsmodell)',
    styr: 'Fast avgift per kW och år, kundspecifik avgift 12 000 kr/månad, energiavgift med fördelningsfaktor, ingen effektavgift 2027.',
    status: 'beslutad',
    datum: 'Beslutad 2026-09-28, gäller från 2027-01-01.',
    kalla: { text: 'Svenska kraftnät (2026c)', url: 'https://www.svk.se/4a90bc/siteassets/aktorsportalen/anslut-till-transmissionsnatet/transmissionsnatstariff/aktuella-prislistor/prislista-transmissionsnatet-2027.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'vf-regionnat-2026',
    kort: 'Vattenfalls regionnätstariff 2026',
    titel: 'Vattenfall Eldistribution, tillämpningsbestämmelser och nättariffer för regionnätet 2026-01-01',
    styr: 'Tariff för inmatning: fast avgift, årseffektavgift, avståndsberoende avgift, energiavgift eller energiersättning. Svenska kraftnäts avgifter förs vidare.',
    status: 'gällande',
    datum: 'Gäller från 2026-01-01.',
    kalla: { text: 'Vattenfall Eldistribution (2026)', url: 'https://www.vattenfalleldistribution.se/globalassets/2.-foretag/abonnemang-och-avgifter/avtal-och-elnatsavgift/tillampningsbestammelser-och-nattariffer-for-vattenfall-eldistributions-regionnat-2026-01-01.pdf', hamtad: '2026-11-22' }
  },
  {
    id: 'ox2-brobacken-2026',
    kort: 'OX2 Brobacken Nät 2026',
    titel: 'OX2, tariffer Brobacken Nät AB 2026',
    styr: 'Inmatningsabonnemang i ett nät som en vindkraftutvecklare äger.',
    status: 'gällande',
    datum: 'Daterad 2026-01-30.',
    kalla: { text: 'OX2 (2026)', url: 'https://www.ox2.com/files/Sweden_documents/Natbolag/tariff-brobacken-nat-2026.pdf', hamtad: '2026-11-22' }
  }
];

var NAT_REGELVERK_SYSTEMKRAV = ['eifs-2018-2', 'ei-fs-kraftproduktionsmoduler', 'eu-rfg'];

/** Alla nät-fält med värde null, så att varje fall anger samma fält. */
function natTomtFalt() {
  return {
    natavstand: null, natledning: null, natstation: null, natforstark: null,
    natutredning: null, natengangschablon: null, natfast: null, nateffekt: null,
    natavstavg: null, natavstavstand: null, natenergi: null, natforandring: null,
    natsyseng: null, natsyslop: null, natsysbortfall: null
  };
}
function natFall(extra) {
  var f = natTomtFalt();
  Object.keys(extra).forEach(function (k) { f[k] = extra[k]; });
  return f;
}

var NAT_EXEMPEL = [
  {
    id: 'A',
    namn: 'Vattenfall regionnät PT1 (50–30 kV) med Svenska kraftnät, södra Sverige',
    typ: 'regionnät',
    ar: 2026,
    falt: natFall({ natfast: 1250000, nateffekt: 23.1, natavstavg: 1.23, natavstavstand: 20, natenergi: -2.62 }),
    belagd: true, sarfall: false,
    komplett: { lopande: true, engang: false },
    kalla: [
      { text: 'Vattenfall Eldistribution (2026), bilaga 2: fast avgift 1 250 tkr, årseffektavgift 17 kr/kW, avståndsberoende 1,23 kr/kW och km, energiersättning −1,12 öre/kWh', url: 'https://www.vattenfalleldistribution.se/globalassets/2.-foretag/abonnemang-och-avgifter/avtal-och-elnatsavgift/tillampningsbestammelser-och-nattariffer-for-vattenfall-eldistributions-regionnat-2026-01-01.pdf', hamtad: '2026-11-22' },
      { text: 'Svenska kraftnäts avgifter via Vattenfalls bilaga 2, södra Sverige: 6,1 kr/kW och −1,5 öre/kWh', url: 'https://www.vattenfalleldistribution.se/globalassets/2.-foretag/abonnemang-och-avgifter/avtal-och-elnatsavgift/tillampningsbestammelser-och-nattariffer-for-vattenfall-eldistributions-regionnat-2026-01-01.pdf', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Avståndet 20 km till närmaste stamnätspunkt är ett antagande.',
      'Svenska kraftnäts avgifter antas läggas ovanpå Vattenfalls (min läsning av avsnitt 5.5 och 5.6, inte uttryckligen bekräftad).',
      'Effektavgift = 17 + 6,1 = 23,1 kr/kW. Energi = −1,12 + (−1,5) = −2,62 öre/kWh (energiersättning, gäller om inmatningen minskar förlusterna).',
      'Fast avgift 1 250 tkr tolkas som per år (Vattenfall avsnitt 2.1: erläggs med en tolftedel per månad).'
    ],
    ejMedraknat: ['Anslutningskostnad (ledning, station, förstärkning) saknar belägg.', 'Systemkrav saknar belopp.'],
    regelverk: ['vf-regionnat-2026', 'svk-prislista-2026', 'ellag-4kap', 'ei-fs-anslutningsavgifter'].concat(NAT_REGELVERK_SYSTEMKRAV),
    kontrollerad: '2026-11-22'
  },
  {
    id: 'B',
    namn: 'Vattenfall regionnät PT2 (20–6 kV) med Svenska kraftnät, södra Sverige',
    typ: 'regionnät',
    ar: 2026,
    falt: natFall({ natfast: 680000, nateffekt: 19.1, natavstavg: 2.89, natavstavstand: 20, natenergi: -4.19 }),
    belagd: true, sarfall: false,
    komplett: { lopande: true, engang: false },
    kalla: [
      { text: 'Vattenfall Eldistribution (2026), bilaga 2: fast avgift 680 tkr, årseffektavgift 13 kr/kW, avståndsberoende 2,89 kr/kW och km, energiersättning −2,69 öre/kWh', url: 'https://www.vattenfalleldistribution.se/globalassets/2.-foretag/abonnemang-och-avgifter/avtal-och-elnatsavgift/tillampningsbestammelser-och-nattariffer-for-vattenfall-eldistributions-regionnat-2026-01-01.pdf', hamtad: '2026-11-22' },
      { text: 'Svenska kraftnäts avgifter via Vattenfalls bilaga 2, södra Sverige: 6,1 kr/kW och −1,5 öre/kWh', url: 'https://www.vattenfalleldistribution.se/globalassets/2.-foretag/abonnemang-och-avgifter/avtal-och-elnatsavgift/tillampningsbestammelser-och-nattariffer-for-vattenfall-eldistributions-regionnat-2026-01-01.pdf', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Avståndet 20 km är ett antagande.',
      'Svenska kraftnäts avgifter antas läggas ovanpå Vattenfalls.',
      'Effektavgift = 13 + 6,1 = 19,1 kr/kW. Energi = −2,69 + (−1,5) = −4,19 öre/kWh (energiersättning).'
    ],
    ejMedraknat: ['Anslutningskostnad (ledning, station, förstärkning) saknar belägg.', 'Systemkrav saknar belopp.'],
    regelverk: ['vf-regionnat-2026', 'svk-prislista-2026', 'ellag-4kap', 'ei-fs-anslutningsavgifter'].concat(NAT_REGELVERK_SYSTEMKRAV),
    kontrollerad: '2026-11-22'
  },
  {
    id: 'C',
    namn: 'Svenska kraftnät, direktansluten i söder, 2026 (Alvesta, elområde 4)',
    typ: 'stamnät direkt',
    ar: 2026,
    falt: natFall({ nateffekt: 14, natenergi: -3.87, natutredning: 124 }),
    belagd: true, sarfall: false,
    komplett: { lopande: true, engang: false },
    kalla: [
      { text: 'Svenska kraftnät (2026b), prislista 2026: effektavgift inmatning 14 kr/kW, förlustkoefficient −6,3 procent', url: 'https://www.svk.se/4a909a/siteassets/aktorsportalen/anslut-till-transmissionsnatet/transmissionsnatstariff/aktuella-prislistor/prislista-transmissionsnatet-20262.pdf', hamtad: '2026-11-22' },
      { text: 'Svenska kraftnät (2026e), vägledning: utredningsavgift 100 kkr + 1,2 kkr/MW (2025)', url: 'https://www.svk.se/4993dd/siteassets/om-oss/rapporter/2026/vagledning_kostnadsfordelning_anslutningavgift_20260429.pdf', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Elpriset 0,60 kr/kWh (kalkylens förvalda för elområde 4): (600 + 15) × −0,063 = −38,7 kr/MWh = −3,87 öre/kWh.',
      'Utredningsavgiften är 2025 års nivå, uträknad för 20 MW: 100 + 1,2 × 20 = 124 kkr.',
      'Svenska kraftnäts reducering av energiavgiften med flaskhalsinkomster är inte inräknad.'
    ],
    ejMedraknat: ['Själva anslutningsavgiften (kundspecifika åtgärder) saknar belopp.', 'Systemkrav saknar belopp.'],
    regelverk: ['svk-prislista-2026', 'svk-vagledning', 'ellag-4kap', 'ei-fs-anslutningsavgifter', 'eu-elmarknadsforordning-18'].concat(NAT_REGELVERK_SYSTEMKRAV),
    kontrollerad: '2026-11-22'
  },
  {
    id: 'D',
    namn: 'Svenska kraftnät, direktansluten i norr, 2026 (Messaure, elområde 1)',
    typ: 'stamnät direkt',
    ar: 2026,
    falt: natFall({ nateffekt: 31, natenergi: 2.39, natutredning: 124 }),
    belagd: true, sarfall: false,
    komplett: { lopande: true, engang: false },
    kalla: [
      { text: 'Svenska kraftnät (2026b), prislista 2026: effektavgift inmatning 31 kr/kW, förlustkoefficient 7,6 procent', url: 'https://www.svk.se/4a909a/siteassets/aktorsportalen/anslut-till-transmissionsnatet/transmissionsnatstariff/aktuella-prislistor/prislista-transmissionsnatet-20262.pdf', hamtad: '2026-11-22' },
      { text: 'Svenska kraftnät (2026e), vägledning: utredningsavgift 100 kkr + 1,2 kkr/MW (2025)', url: 'https://www.svk.se/4993dd/siteassets/om-oss/rapporter/2026/vagledning_kostnadsfordelning_anslutningavgift_20260429.pdf', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Elpriset 0,30 kr/kWh (kalkylens förvalda för elområde 1): (300 + 15) × 0,076 = 23,9 kr/MWh = 2,39 öre/kWh.',
      'Utredningsavgiften är 2025 års nivå för 20 MW: 124 kkr.',
      'Svenska kraftnäts reducering av energiavgiften är inte inräknad.'
    ],
    ejMedraknat: ['Själva anslutningsavgiften saknar belopp.', 'Systemkrav saknar belopp.'],
    regelverk: ['svk-prislista-2026', 'svk-vagledning', 'ellag-4kap', 'ei-fs-anslutningsavgifter', 'eu-elmarknadsforordning-18'].concat(NAT_REGELVERK_SYSTEMKRAV),
    kontrollerad: '2026-11-22'
  },
  {
    id: 'E',
    namn: 'Svenska kraftnät, direktansluten i söder, 2027 (Alvesta, ny avgiftsmodell)',
    typ: 'stamnät direkt',
    ar: 2027,
    falt: natFall({ natfast: 144000, nateffekt: 22, natenergi: -4.04, natutredning: 124 }),
    belagd: true, sarfall: false,
    komplett: { lopande: true, engang: false },
    kalla: [
      { text: 'Svenska kraftnät (2026c), prislista 2027: fast avgift 22 kr/kW och år, kundspecifik avgift 12 000 kr/månad, koefficient −7,3 procent, fördelningsfaktor 0,9', url: 'https://www.svk.se/4a90bc/siteassets/aktorsportalen/anslut-till-transmissionsnatet/transmissionsnatstariff/aktuella-prislistor/prislista-transmissionsnatet-2027.pdf', hamtad: '2026-11-22' },
      { text: 'Svenska kraftnät (2026a), beslut 2026-09-28', url: 'https://www.svk.se/press-och-nyheter/nyheter/elmarknad-allmant/2026/beslutad-transmissionsnatsavgift-och-avgifter-for-balansansvariga-parter-2027/', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Kundspecifik avgift 12 000 kr/månad = 144 000 kr/år läggs i fältet för fast årsavgift. Fast avgift 22 kr/kW och år läggs i fältet för effektavgift.',
      'Elpriset 0,60 kr/kWh: (600 + 15) × −0,073 × 0,9 = −40,4 kr/MWh = −4,04 öre/kWh.',
      'Svenska kraftnäts reducering av energiavgiften (80 procent av 2025 års debiterade energiavgift) är inte inräknad. Den beror på kundens egen debitering 2025.'
    ],
    ejMedraknat: ['Själva anslutningsavgiften saknar belopp.', 'Systemkrav saknar belopp.'],
    regelverk: ['svk-prislista-2027', 'svk-vagledning', 'ellag-4kap', 'ei-fs-anslutningsavgifter', 'eu-elmarknadsforordning-18'].concat(NAT_REGELVERK_SYSTEMKRAV),
    kontrollerad: '2026-11-22'
  },
  {
    id: 'F',
    namn: 'Lokalnät som en vindkraftutvecklare äger (OX2 Brobacken Nät)',
    typ: 'lokalnät',
    ar: 2026,
    falt: natFall({ nateffekt: 170.21, natenergi: 1.767 }),
    belagd: true, sarfall: true,
    komplett: { lopande: true, engang: false },
    kalla: [
      { text: 'OX2 (2026), tariffer Brobacken Nät AB 2026: årseffektavgift 170,21 kr/kW, överföringsavgift vid inmatning 17,67 kr/MWh', url: 'https://www.ox2.com/files/Sweden_documents/Natbolag/tariff-brobacken-nat-2026.pdf', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Prislistan är en tabell utan tydliga etiketter i alla led. Jag har tolkat 170,21 kr/kW och 17,67 kr/MWh som inmatningens avgifter.',
      'Särfall: nätet ägs av en vindkraftutvecklare, så avgiften speglar just den parkens nätkostnad och är inte representativ.'
    ],
    ejMedraknat: ['Anslutningskostnad saknar belägg.', 'Systemkrav saknar belopp.'],
    regelverk: ['ox2-brobacken-2026', 'ellag-4kap'].concat(NAT_REGELVERK_SYSTEMKRAV),
    kontrollerad: '2026-11-22'
  },
  {
    id: 'G',
    namn: 'Kents ungefärliga uppfattning (ej belagd)',
    typ: 'uppfattning',
    ar: 2026,
    falt: natFall({ natengangschablon: 1000, natenergi: 5 }),
    belagd: false, sarfall: false,
    komplett: { lopande: false, engang: true },
    kalla: [
      { text: 'Kent Lundgren, 2026-11-22: ungefär 1 miljon kr per MW i engångskostnad och ungefär 5 öre/kWh i rörlig nätavgift. Ingen publicerad källa.', url: '', hamtad: '2026-11-22' }
    ],
    antaganden: [
      'Engångskostnaden är Kents uppfattning om hela kostnaden för nätet, inte uppdelad i ledning, station och förstärkning.',
      'Den fasta löpande delen saknas. Fallet är därför inte jämförbart rakt av med A–F.',
      'Ersätts när belägg finns (till exempel en nätägares offert).'
    ],
    ejMedraknat: ['Fast löpande del saknas.', 'Systemkrav saknar belopp.'],
    regelverk: [],
    kontrollerad: '2026-11-22'
  },
  {
    id: 'H',
    namn: 'Eget fall (tomma fält)',
    typ: 'eget',
    ar: null,
    falt: natTomtFalt(),
    belagd: false, sarfall: false, eget: true,
    komplett: { lopande: false, engang: false },
    kalla: [],
    antaganden: ['Läsarens egna värden.'],
    ejMedraknat: [],
    regelverk: [],
    kontrollerad: null
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NAT_EXEMPEL: NAT_EXEMPEL, NAT_REGELVERK: NAT_REGELVERK, NAT_NORMALFALL: NAT_NORMALFALL, NAT_NORMALFALL_ANGIVELSE: NAT_NORMALFALL_ANGIVELSE, natTomtFalt: natTomtFalt, NAT_UTGANGSPUNKT: NAT_UTGANGSPUNKT, NAT_TYPFALL: NAT_TYPFALL, NAT_STAMNATSKALLA: NAT_STAMNATSKALLA };
}
