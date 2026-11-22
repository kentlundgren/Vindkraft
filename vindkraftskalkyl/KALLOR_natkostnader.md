# Källor för nätkostnader (fas 1)

**Hör till:** [PRD_natkostnader.md](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/PRD_natkostnader.md)
**Skapad:** 2026-11-22
**Version:** 0.1
**Status:** Pågående. Första delen: anslutning och nya systemkrav. Nätavgifter (löpande) återstår.
**Hämtdatum för alla webbkällor:** 2026-11-22

> Texten återger vad källorna säger, med sidor eller paragrafer där det går. Inga belopp för vindkraft är fastställda. Kontrollera mot källan innan något återges.

---

<a id="1-vad-kallorna-visar"></a>

## 1. vad källorna visar hittills [#](#1-vad-kallorna-visar)

Tabell 1. Fynd per kostnadspost [#](#tabell-1)

<a id="tabell-1"></a>

| Post | Fynd | Källa |
| --- | --- | --- |
| Anslutning, princip | Avgiften för anslutning ska utformas så att nätkoncessionshavarens skäliga kostnader för anslutningen täcks, med särskild hänsyn till anslutningspunktens geografiska läge och den avtalade effekten. | Ellag (1997:857), 4 kap. 10 § första stycket |
| Anslutning, statligt finansierade åtgärder | Har staten finansierat åtgärder som ökar nätets kapacitet för att underlätta anslutning av förnybar elproduktion, ska den som ansluter ersätta nätföretagets kostnader för åtgärderna i den del som svarar mot anläggningens andel av kapacitetsökningen. | Ellag (1997:857), 4 kap. 10 § andra stycket |
| Anslutning, stamnätet | Avgiften är en engångsavgift för kundspecifika åtgärder (till exempel åtgärder i den anslutande stationen, nya stationer och radiella ledningar som bara kommer kunden till nytta). Åtgärder i det maskade stamnätet bekostas i regel inte av kunden. Avgiften grundas på faktiska kostnader och kan bli högre eller lägre än i anslutningsavtalet. | Svenska kraftnät (2026), avsnitt 2 och 3.2.4 |
| Anslutning, stamnätet, utredning | Utredningsavgift före handläggning: fast del 100 000 kr och rörlig del 1 200 kr/MW (år 2025), justeras årligen med KPI. Utredningsavgiften ingår inte i anslutningsavgiften. Kostnaden för förprojektering debiteras även om kunden inte genomför anslutningen. | Svenska kraftnät (2026), avsnitt 3.1 och 3.2.2 |
| Anslutning, lokalnät och regionnät | Kunder som ansluter via ett distributionssystem omfattas av principerna för det distributionssystem där anslutningspunkten ligger. | Svenska kraftnät (2026), avsnitt 1.1 |
| Anslutning, kommande regler | Ei har föreslagit föreskrifter om anslutningsavgifter för elektriska anläggningar (remissutkast, ännu inte beslutade). Avgiften ska utgå från den kundspecifika andelen av kostnaderna för åtgärder från närmaste faktiskt matande transformatorstation fram till anslutningspunkten. En ny ledning som bara den anslutande anläggningen använder bär 100 procent av ledningskostnaden. Schablonvärden får användas. Utkastet anger ikraftträdande 1 januari 2027. | Energimarknadsinspektionen (2026a) |
| Nya systemkrav | Ei har föreslagit nya föreskrifter om generellt tillämpliga krav för nätanslutning av kraftproduktionsmoduler som ersätter EIFS 2018:2 (remissutkast, ikraftträdande föreslaget 1 juli 2026 med övergångsregler till 31 december 2026). Fler krav ska fastställas platsspecifikt av systemansvariga i stället för i föreskrift. Ei bedömer att kostnaderna sammantaget minskar, men att hur mycket är svårt att kvantifiera. | Energimarknadsinspektionen (2026b), sammanfattning och avsnitt 4 |
| Nya systemkrav, kostnadsnivå | Kostnader för utbyte av anläggningsdelar och produktionsstopp vid sent fastställda eller nytillkomna krav kan uppgå till tiotals miljoner kronor, beroende på åtgärder. Utredningstid vid sent fastställda platsspecifika krav uppskattas till cirka 150–300 timmar per anläggning. Siffrorna avser kostnader som föreslagna regler ska hjälpa till att undvika, inte en schablon per MW. | Energimarknadsinspektionen (2026b), avsnitt 4 |
| Osäkerhet | Aktörer har framfört att oproportionerliga krav och komplexa regelverk riskerar att ge höga kostnader vid anslutning och att investeringar kan utebli. | Energimarknadsinspektionen (2026b), avsnitt 1.1 |
| Flexibel anslutning | Regeringen eller en myndighet får meddela föreskrifter om tekniska krav (bland annat effektregleringssystem) för anläggningar som ansluts med villkor att begränsa eller kontrollera inmatning. | Ellag (1997:857), 4 kap. 4 a § |
| Små anläggningar | Ingen anslutningsavgift för en produktionsanläggning med inmatning på högst 43,5 kW som ansluts där en uttagsanläggning redan finns, under vissa villkor. Omfattar alltså inte anläggningar över 43,5 kW, som en vindkraftpark. | Ellag (1997:857), 4 kap. 11 § |

## 2. vad det betyder för kalkylens fält [#](#2-betydelse-for-falten)

<a id="2-betydelse-for-falten"></a>

- **Anslutning:** de fält som PRD:n föreslår (avstånd, ledningskostnad, station, avgift per MW) stämmer med principen kundspecifika åtgärder. Fältet "nätägarens anslutningsavgift kkr/MW" bör ersättas av "andel av förstärkning" (kr) eftersom källorna beskriver kostnaden som kundspecifik åtgärd och inte som ett belopp per MW.
- **Utredningsavgift:** gäller anslutning till stamnätet. Ett fält är motiverat bara om kalkylen ska stödja stamnätsanslutning.
- **Systemkrav:** källorna ger inga belopp per MW. Fälten för systemkrav fylls därför som antaganden, och spannet låg/bas/hög är det ärliga sättet att visa osäkerheten.
- **Regeländringar 2026–2027** (Ei:s utkast) är själva osäkerheten som Svensk Vindkraft pekar på. Kalkylen kan visa det som en förklaring vid fälten.

## 3. källor [#](#3-kallor)

<a id="3-kallor"></a>

Alfabetiskt.

- Energimarknadsinspektionen (2026a) *Energimarknadsinspektionens föreskrifter och allmänna råd om anslutningsavgifter för elektriska anläggningar* (remissutkast, EIFS 20ÅÅ:nr). Eskilstuna: Energimarknadsinspektionen. Tillgänglig: [ei.se](https://ei.se/download/18.c64bc1a19b353d7ad72d854/1770105807164/Remissutkast%20F%C3%B6reskrifter%20Anslutningsavgifter.pdf) (hämtad 2026-11-22). *(Utkast till föreskrift om hur nätföretag utformar anslutningsavgifter; 3 kap. gäller alla anläggningar, 4 kap. bara anläggningar med mätarsäkring om högst 25 ampere.)*
- Energimarknadsinspektionen (2026b) *Konsekvensutredning avseende Energimarknadsinspektionens föreskrifter och allmänna råd om fastställande av generellt tillämpliga krav för nätanslutning av kraftproduktionsmoduler* (remissutkast, ärendenummer 2025-103407, 2026-02-19). Eskilstuna: Energimarknadsinspektionen. Tillgänglig: [ei.se](https://ei.se/download/18.1825c33b19c47ab9719fc38/1771849540664/Remissutkast-Konsekvensutredning-Eis-f%C3%B6reskrifter-och-allm%C3%A4nna-r%C3%A5d-om-fastst%C3%A4llande-av-generellt-till%C3%A4mpliga-krav-f%C3%B6r-n%C3%A4tanslutning-av-kraftproduktionsmoduler.pdf) (hämtad 2026-11-22). *(Beskriver varför föreskriften EIFS 2018:2 föreslås ersättas, vilka krav som flyttas till platsspecifik kravställning och vilka kostnader som påverkas.)*
- Ellag (1997:857). Stockholm: Sveriges riksdag. Tillgänglig: [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/ellag-1997857_sfs-1997-857/) (hämtad 2026-11-22). *(Lagtexten för anslutning i 4 kap., bland annat 4 a, 10, 11 och 12 §§.)*
- Svenska kraftnät (2026) *Vägledning kostnadsfördelning anslutningsavgift* (ärendenummer 2025/5008, 2026-04-29). Sundbyberg: Svenska kraftnät. Tillgänglig: [svk.se](https://www.svk.se/4993dd/siteassets/om-oss/rapporter/2026/vagledning_kostnadsfordelning_anslutningavgift_20260429.pdf) (hämtad 2026-11-22). *(Svenska kraftnäts principer för anslutningsavgiften till stamnätet, avgifter i anslutningsprocessen och utredningsavgiftens storlek.)*

## 4. att läsa härnäst [#](#4-att-lasa-harnast)

<a id="4-att-lasa-harnast"></a>

- Ei:s rapport R2026:04 om förutsägbarhet och träffsäkerhet för anslutnings- och överföringsavgifter (på remiss hos regeringen med svar senast 2026-12-07).
- Svenska kraftnäts *Principer och vägledning för anslutning till stamnätet* (2026-07-01).
- Ei:s remissutkast till konsekvensutredning om anslutningsavgifter (för producenter med större anläggningar).
- Ett nätbolags publicerade principer för kostnadsfördelning vid teknisk anpassning (4 kap. 12 § ellagen) och regionnätstariff, för nätavgifter och anslutning via distributionsnät.
- Status: har Ei beslutat någon av de två föreskrifterna? Ellagens nuvarande lydelse och en eventuell ny elmarknadslag ska kontrolleras mot gällande SFS-text.
- Nätavgifter för producenter (fast avgift, effektavgift, inmatningsavgift) i regionnätstariffer och Svenska kraftnäts tariff.

## Repo

- GitHub: <https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl>
- Lokal sökväg: `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl`
