# PRD – nätkostnader och systemkrav i vindkraftskalkylen

**Namn:** PRD_natkostnader
**Plats:** `vindkraftskalkyl/PRD_natkostnader.md`
**Skapad:** 2026-11-22
**Version:** 0.7
**Status:** Utkast. Ingen kod är ändrad. Inga belopp är fastställda (se fas 1, avsnitt 8). Fas 1 pågår: ledaren är läst och definierar inte "nya systemkrav" eller anger belopp. Anslutning, systemkrav och löpande nätavgifter för producenter är genomgångna mot publicerade källor i [KALLOR_natkostnader.md](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/KALLOR_natkostnader.md). Svenska kraftnäts egna prislistor för 2026 och 2027 är också genomgångna. Regionnätens avgifter för 2027 och fler nätägare återstår.
**Typ:** Tilläggs-PRD till [vindkraftskalkylen](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html) (huvudversionen, GitHub Pages).

> Dokumentet säger *vad* som ska byggas och *varför*, innan kod. Det är inte en SPEC.md. Ställningstagande till SPEC.md står i avsnitt 10.

---

<a id="1-bakgrund"></a>

## 1. bakgrund [#](#1-bakgrund)

Kalkylen räknar investerarens kassaflöde så här: intäkt minus drift, arrende, kommunal ersättning och närboendeersättning, med investeringen i år 0. Därifrån kommer LCOE, NPV, IRR och payback. Kostnader för att ansluta och använda elnätet finns inte med i någon post. Resultatet blir därför för gott för projekt där nätet är en stor del av kostnaden.

Tre kostnadsslag saknas:

1. **Anslutningskostnader:** ledning till anslutningspunkten, transformatorstation och nätägarens anslutningsavgift. Engångskostnad.
2. **Nätavgifter:** löpande avgifter för att mata in el på nätet (fasta avgifter, effektavgifter, eventuell avgift per inmatad kWh).
3. **Nya systemkrav:** tekniska krav på produktionsanläggningar som ger kostnader för utrustning, provning och drift, och i vissa fall nedreglering som minskar den producerade energin.

<a id="2-mal"></a>

### ursprung [#](#ursprung)

<a id="ursprung"></a>

Uppdraget föddes ur ett LinkedIn-inlägg som Svensk Vindkraft publicerade 2026-11-19: [inlägget](https://www.linkedin.com/posts/svensk-vindkraft_i-senaste-numret-av-v%C3%A5r-tidning-svensk-vindkraft-activity-7529084415403253761-pt5K). Inlägget återger inledningen på en ledare i tidningen *Svensk Vindkraft*, "Vindkraftens ekonomi handlar om mer än elpriset", skriven av SD, styrelseledamot i Svensk Vindkraftförening ([SD, 2026](https://svenskvindkraft.com/vindkraftens-ekonomi-handlar-om-mer-an-elpriset/), ledare publicerad 2026-11-16 på svenskvindkraft.com, hämtad 2026-11-22). Ledaren är kort och har samma text som LinkedIn-inlägget ([Svensk Vindkraft, 2026](https://www.linkedin.com/posts/svensk-vindkraft_i-senaste-numret-av-v%C3%A5r-tidning-svensk-vindkraft-activity-7529084415403253761-pt5K), hämtat 2026-11-22).

Det inlägget säger om nätkostnader, med egna ord: nätavgifter, anslutningskostnader och nya systemkrav kan få stor betydelse för investeringar som ska bära sig i flera decennier, och när kostnaderna är svåra att förutse ökar osäkerheten inför investeringsbesluten. Därför är det enligt inlägget också en fråga om att attrahera kapital till ny elproduktion.

Vad inlägget ger PRD:n:

- **Avgränsningen:** de tre kostnadsslagen i avsnitt 1 är inläggets egna.
- **Kravet på osäkerhet:** att kostnaderna är svåra att förutse är själva poängen. Därför ska kalkylen kunna visa ett spann (låg, bas, hög) och inte bara ett värde (avsnitt 5 och 9).
- **Producentens perspektiv:** Svensk Vindkraft är en branschorganisation för producenterna och vill "lyfta producenternas perspektiv". Inlägget är ett underlag för vad som behöver modelleras, inte en källa till belopp.

Vad inlägget inte ger: inga belopp för nätkostnader, ingen definition av "nya systemkrav" och ingen hänvisning till vilka regler som avses. Det är fas 1:s uppgift att hitta det i primärkällor (Svenska kraftnät, Ei, nätbolag). Siffrorna om datacenter i inlägget används inte i kalkylen.

## 2. mål och icke-mål [#](#2-mal)

**Mål**

- Investerarens kassaflöde, LCOE, NPV, IRR och payback inkluderar de tre kostnadsslagen.
- Varje nytt indatafält är märkt som lagstadgat, schablon eller antagande, och varje belopp har en källa med författare, år och sida, enligt samma princip som Långhult-kopian.
- **Förvalt läge är "ingen nätkostnad".** Kalkylen visar då exakt samma resultat som före ändringen, vilket Kent kan jämföra mot sina övriga vindkraftskalkyler som har samma förvalda värden. Läsaren väljer själv att ta med nätkostnader.
- Nätkostnaderna kan visas som ett spann (låg, bas, hög) så att läsaren ser hur osäkerheten slår mot NPV, IRR och LCOE (se ursprung).
- **Alla engångsnätkostnader visas som kronor per MW**, så att de går att jämföra direkt med investeringsutgiften per MW (förvalt 12 000 kkr/MW). **Alla löpande nätkostnader visas som öre per kWh**, så att läsaren ser vad nätet kostar per producerad kWh. Varje post visas för sig och som summa. Se avsnitt 5.
- I läget "ingen" (förvalt) blir alla nyckeltal identiska med dagens, oavsett vad de nya fälten innehåller.

**Icke-mål (första versionen)**

- Ingen modell av en enskild nätägares tariff. Schabloner med få fält.
- Ingen modellering av andelsägarens egen elnätsavgift som konsument.
- Ingen spotprisprofil, kannibalisering eller balanskostnad. Det är andra kostnadsslag än de tre ovan.
- Ingen ändring av Långhult-kopian, ver2 eller ver3 (se fas 5).

<a id="3-beslut"></a>

## 3. beslut redan tagna [#](#3-beslut)

Tabell 1. Beslut om modellen (planeringssamtal 2026-11-22) [#](#tabell-1)

<a id="tabell-1"></a>

| Fråga | Beslut |
| --- | --- |
| Vad är "nya systemkrav"? | Tekniska krav på produktionsanläggningar (nätkoder) med kostnad för utrustning, provning och drift, samt eventuell nedreglering. Exakt vilka krav som avses fastställs i fas 1 med källa. |
| Vilken sida av nätet? | Producentens kostnader (inmatning och anslutning). |
| Detaljnivå | Schabloner med få fält per post. Förvalda värden per elområde bara om fas 1 visar att avgifterna skiljer sig åt mellan områdena. |
| Systemkrav och produktion | Ett fält "produktionsbortfall, %" minskar produktionen. |
| Så visas nätkostnaderna | Engångskostnader omvandlas till kr per MW och jämförs med investeringsutgiften per MW. Löpande kostnader omvandlas till öre per kWh. Det är de två huvudnyckeltalen. |
| Förvalt läge | "Ingen nätkostnad". Resultatet är då identiskt med dagens. |
| Energiavgiftens form | Ett fast belopp i öre/kWh med tecken (negativt = ersättning). Det är så regionnätens tariffer anges, och de flesta vindparker är anslutna till regionnät. Svenska kraftnäts form (procent av börspriset) kan uttryckas som ett öre/kWh vid kalkylens elpris, och en hjälptext räknar ut det. Elprisbanan påverkar inte energiavgiften i första versionen. |
| 2026 kontra 2027 | Ingen separat modell. Svenska kraftnäts nya fasta avgift per kW och år läggs i fältet för effektavgift, och den kundspecifika avgiften per år i fältet för fast årsavgift. Hjälptexter anger vilket år en källa avser. |
| Årlig förändring av nätavgifter | Fältet finns, förvalt 0 procent per år (real kalkyl, som elpriset). |
| Förvalda värden per elområde | Nej. Nätägaren påverkar mer än elområdet (Tabell 3 och 5 i källfilen). I stället finns en valfri väljare "exempelfall" som fyller fälten med ett dokumenterat fall (till exempel Vattenfall PT1 eller Svenska kraftnät söder och norr) eller lämnar dem för egna värden. |
| Systemkravens belopp | Källorna anger inga belopp. Fälten för systemkrav står på 0 och märks "ingen källa med belopp, fyll i vid behov". Spannet låg/hög påverkar bara fält med värde. |
| Långhult, ver2, ver3 | Inte i första versionen. Tas var för sig efter att huvudversionen är godkänd. |

<a id="4-perspektiv"></a>

## 4. perspektiv som påverkas [#](#4-perspektiv)

Tabell 2. Vilka perspektiv nätkostnaderna slår igenom i [#](#tabell-2)

<a id="tabell-2"></a>

| Perspektiv | Påverkan |
| --- | --- |
| Investerare | Direkt: högre investering, högre driftkostnad, lägre produktion. Alla nyckeltal. |
| Andelsägare | Via självkostnaden per kWh (`kostnadPerkWh`), som bygger på investerarens kostnader. Ingår, eftersom föreningens elpris måste täcka anslutningen. |
| Markägare | Indirekt, bara om arrendet är procent av intäkten och produktionen minskar av bortfallet. |
| Närboende | Indirekt, eftersom ersättningen följer intäkten. |
| Kommun/samhälle | Ingen direkt påverkan. |

<a id="5-modell"></a>

## 5. modell [#](#5-modell)

Beteckningar följer [berakningar.js](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/berakningar.js): `P_tot` = total effekt (MW), `n` = livslängd, `r` = kalkylränta, `prodkWhAr[t]` = produktion år t (kWh).

Tabell 3. Nya indatafält (förslag, namn och enheter slutgiltigt fastställs i fas 2) [#](#tabell-3)

Kolumnen "Förvalt värde" anger varifrån värdet kommer. De faktiska talen läggs in i fas 2, ur de exempelfall som är belagda i [källfilen](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/KALLOR_natkostnader.md).

<a id="tabell-3"></a>

| Post | Fält | Enhet | Förvalt värde |
| --- | --- | --- | --- |
| Läge | nätkostnader: ingen / låg / bas / hög | val | ingen |
| Anslutning | avstånd till anslutningspunkt | km | exempelfall, antagande |
| Anslutning | ledningskostnad | kkr/km | exempelfall, antagande |
| Anslutning | station och fast del | kkr | exempelfall, antagande |
| Anslutning | andel av förstärkning och nätägarens anslutningsavgift | kkr | exempelfall, antagande |
| Anslutning | utredning och förprojektering | kkr | exempelfall (Svenska kraftnät: 100 kkr + 1,2 kkr/MW, 2025) |
| Nätavgift | fast årsavgift (inklusive kundspecifik avgift) | kr/år | exempelfall (källfilen, Tabell 2 och 4) |
| Nätavgift | effektavgift eller fast avgift per kW | kr/kW och år | exempelfall |
| Nätavgift | avståndsberoende effektavgift (gäller regionnät) | kr/kW och km | exempelfall |
| Nätavgift | avstånd för avståndsberoende avgift | km | exempelfall, antagande |
| Nätavgift | energiavgift (negativt tecken = ersättning) | öre/kWh | exempelfall |
| Nätavgift | årlig förändring av nätavgifter | %/år | 0 (real kalkyl, som elpriset) |
| Systemkrav | engångskostnad | kkr/MW | 0 (ingen källa med belopp) |
| Systemkrav | löpande kostnad (provning, drift) | kr/MW och år | 0 (ingen källa med belopp) |
| Systemkrav | produktionsbortfall | % av produktionen | 0 (ingen källa med belopp) |

**Formler**

- Produktion med bortfall: `produktionkWh_ar1 = P_tot × 8760 × kapfaktor × 1000 × (1 − bortfall)`. Alla serier som bygger på produktionen (`prodkWhAr`, `intaktAr`, arrende, närboende, LCOE-nämnare) följer av det.
- Engångskostnad för nät och systemkrav, tillägg till `investering` (år 0):
  `natEngang = (avstånd × ledningskostnad + station + förstärkning + utredning) × 1000 + systemEngang × 1000 × P_tot`.
  Kapitalkostnaden (annuiteten) räknas på den större investeringen.
- Löpande nätkostnad år t, tillägg till `driftAr[t]`:
  `natLopande[t] = (fastAvgift + (effektavgift + avståndsavgift × avstånd) × P_tot × 1000 + systemLopande × P_tot) × (1 + förändring)^(t−1) + energiavgift/100 × prodkWhAr[t] × (1 + förändring)^(t−1)`. Energiavgiften kan vara negativ.
- `driftkostnadAr1` får `natLopande[1]`, så att `totalkostnad`, `kostnadPerkWh` och andelsägarens självkostnad följer med.
- LCOE: `natEngang` ingår i `investering` och `natLopande[t]` i `driftAr[t]`, så formeln för `disKostnad` behöver ingen ändring.
- **Läge och spann:** en väljare "nätkostnader: ingen / låg / bas / hög" med **ingen som förvalt**. Fältens värden i tabell 3 gäller i läget bas. Läget ingen sätter alla nätkostnader till 0, så att beräkningen blir identisk med dagens. Låg och hög multiplicerar kostnaderna med en faktor per läge. Faktorerna och om de ska gälla alla poster lika fastställs i fas 2 ur källornas spridning, annars märks de som antagande. En liten tabell visar NPV, IRR och LCOE för de fyra lägena.
- **Två huvudnyckeltal** (Kents regel: engångskostnader i kr/MW, löpande i öre/kWh):
  - *Engångskostnader, kr per MW:* varje engångspost (anslutning: ledning, station, förstärkning och avgift, utredning; systemkrav: utrustning) omvandlas till kr/MW genom att delas med `P_tot`. Summan jämförs med investeringsutgiften per MW (fältet `specinv`, förvalt 12 000 kkr/MW) både som kronor och som procent av den.
  - *Löpande kostnader, öre per kWh:* varje löpande post (fast årsavgift, effektavgift, avståndsavgift, energiavgift, löpande systemkrav) omvandlas till öre/kWh genom att delas med produktionen år 1 (`produktionkWh_ar1`) och multipliceras med 100. Kr per år och kr per kW och år blir på så sätt öre/kWh. Summan visas också.
  - *Teckenregeln:* energidelen kan vara negativ (ersättning för minskade förluster, vilket förekommer i södra Sverige). Nyckeltalen får därför vara negativa och visas med minustecken och förklaring.
- **Sekundära nyckeltal** (visas mindre framträdande): löpande kostnad i kr/MW och år, nätkostnadens andel av LCOE och total nätkostnad per kWh över hela livslängden (diskonterad).
- **Nyckeltalen visas alltid**, även i läget "ingen". De räknas då på fältens värden (läget bas), så att läsaren kan se vad nätkostnader skulle vara utan att slå på dem i kalkylen. Beräkningen av NPV, IRR, LCOE och payback påverkas bara av läget som är valt.

<a id="6-granssnitt"></a>

## 6. gränssnitt [#](#6-granssnitt)

- Ny indatasektion "Nät och systemkrav" efter "Drift & livscykel". Gula fält (`#FFF9C4`) bara på indatafälten. Varje fält har märkning (lagstadgat, schablon, antagande) och en förklaring vid hovring, fokus och tryck.
- En panel "Nätkostnader i siffror" under indatasektionen, med två block: **Engångskostnader (kr/MW)** med varje post, summan och jämförelsen mot investeringsutgiften per MW, och **Löpande kostnader (öre/kWh)** med varje post och summan. Panelen visas alltid. Investerarfliken får dessutom raderna för andel av LCOE och total nätkostnad över livslängden.
- Valfri väljare "exempelfall" som fyller fälten med ett belagt exempel eller lämnar dem för egna värden.
- Kostnadsdiagrammet (år 1) får en egen post "Nät och systemkrav" = löpande nätkostnad år 1 + annuiteten på engångsdelen. Hur diagrammet delar upp kapitalkostnaden kontrolleras i fas 2, så att annuiteten på engångsdelen inte dubbelräknas.
- Källor och antaganden-sektionen får de nya källorna i Harvardform med klickbara, verifierade länkar.
- Jämförelsetabellen (Senaste / Tidigare / Förändring) fungerar som i dag för de nya nyckeltalen.
- Versionsrad: sidan har ingen versionsrad i dag. Den läggs till (`VERSION` och `VERSIONSDATUM` i JS) enligt regel 19 i `kent-bygg-sidor`, och höjs sedan vid varje ändring.

<a id="7-kallor"></a>

## 7. krav på källor [#](#7-kallor)

- Inga belopp skrivs in ur minnet. Varje förvalt värde har källa (författare, år, sida) eller är märkt som antagande.
- Källor som ska prövas i fas 1 är Svenska kraftnäts publicerade tariffer och föreskrifter för produktionsanläggningar, Energimarknadsinspektionens publikationer om anslutning och nätavgifter, och nätbolags publicerade anslutningsvillkor. Länkar läggs in först när de är hämtade och verifierade.
- Går ett värde inte att belägga lämnas fältet som tydligt märkt antagande, med en kommentar om att läsaren ska kontrollera mot sin nätägare.

<a id="8-faser"></a>

## 8. faser [#](#8-faser)

Tabell 4. Faser med resultat och kontroll [#](#tabell-4)

<a id="tabell-4"></a>

| Fas | Innehåll | Klart när |
| --- | --- | --- |
| 0 | Den här PRD:n | Kent har godkänt, och en genomläsning med fräscha ögon är gjord |
| 1 | Källinsamling: verifierade källor och en tabell med värde, enhet, år, sida och källa per fält | Alla fält i tabell 3 har värde med källa eller är märkta antaganden |
| 2 | Formler och fältnamn fastställs i detalj | Formlerna i avsnitt 5 är överens med fas 1:s enheter |
| 3 | Bygg i huvudkalkylen: indata, exempelfall, beräkning, panelen Nätkostnader i siffror, diagram, hjälptexter, källor, README, version | Acceptanskriterierna i avsnitt 9 uppfylls |
| 4 | Test: nollfall, handräkning, känslighet | Tabell 5 avprickad |
| 5 | Senare steg, var för sig: Långhult-kopian, ver2, ver3 | Eget beslut per version |

<a id="9-acceptanskriterier"></a>

## 9. acceptanskriterier [#](#9-acceptanskriterier)

Tabell 5. Tester som ska passera [#](#tabell-5)

<a id="tabell-5"></a>

| Test | Förväntat resultat |
| --- | --- |
| Läge ingen (förvalt) | Alla nyckeltal, kassaflöden och diagram identiska med dagens, även när de nya fälten har värden |
| Sidan öppnas | Läget är "ingen" och resultaten är desamma som före ändringen |
| Anslutningskostnad ökar med X kr | `investering` ökar med X, kapitalkostnad enligt annuitet, NPV minskar med X |
| Fast årsavgift Y kr/år, `n` år | Driftkostnad år 1 ökar med Y, NPV minskar med diskonterad summa av Y |
| Produktionsbortfall 5 % | Produktion och intäkt minskar med 5 %, procentbaserat arrende och närboendeersättning minskar med samma andel |
| Spann låg / bas / hög | Bas använder fältens värden oförändrade; hög ger lägre NPV och IRR än bas, låg ger högre; alla tre ger lägre NPV än läget ingen |
| Engångskostnader i kr/MW | 20 MW och engångsposter på totalt 24 000 kkr visas som 1 200 000 kr/MW, vilket är 10 procent av 12 000 kkr/MW |
| Löpande kostnader i öre/kWh | 20 MW, kapacitetsfaktor 0,37 och en löpande kostnad på 100 000 kr/MW och år (2 000 000 kr/år) visas som cirka 3,09 öre/kWh |
| Omvandling från kr/år och kr/kW | Fast avgift 2 000 000 kr/år och effektavgift 15 kr/kW och år (300 000 kr/år på 20 MW) ger tillsammans cirka 3,55 öre/kWh |
| Negativ energidel | En energiersättning ger negativ löpande nätkostnad och negativt nyckeltal, med minustecken och förklaring |
| Nyckeltal i läget ingen | Nyckeltalen visas och räknas på fältens värden, medan NPV, IRR, LCOE och payback är oförändrade |
| Nätkostnad per kWh | Diskonterad nätkostnad delat med diskonterad energi stämmer med handräkning |
| Diagram | Posterna summerar till `totalkostnad` plus övriga lokala poster, utan dubbelräkning |
| Fält | Nya indatafält är gula, märkta och har förklaring; inga andra element är gula |
| Version | `VERSION` och `VERSIONSDATUM` är satta och uppdaterade i samma ändring |

<a id="10-spec"></a>

## 10. SPEC.md-checkpoint [#](#10-spec)

Behövs ett SPEC.md-steg härifrån? **Nej.** Ändringen är begränsad (ett fåtal fält, en beräkningsfunktion och några utskriftsrader), formlerna står i avsnitt 5 och acceptanskriterierna i avsnitt 9. Frågan tas upp igen om nätkostnaderna porteras till ver3, där TypeScript-formlerna ska testas mot samma tal.

<a id="11-risker"></a>

## 11. risker [#](#11-risker)

- **Falsk precision:** nätkostnader varierar mycket mellan projekt. Schabloner kan se mer exakta ut än de är. Åtgärd: tydlig märkning och en uppmaning att kontrollera mot nätägaren.
- **Regler som ändras:** nätkoder och tariffer revideras. Åtgärd: årtal och hämtdatum vid varje källa.
- **Dubbelräkning:** annuiteten på engångskostnaden får inte synas både i "kapitalkostnad" och i nätposten i diagrammet. Åtgärd: testet i tabell 5.
- **Fyra kopior av kalkylen:** huvudversion, Långhult, ver2 och ver3 kan komma att visa olika resultat. Åtgärd: README anger vilken version som har nätkostnader.

<a id="12-oppna-fragor"></a>

## 12. öppna frågor [#](#12-oppna-fragor)

Modellfrågorna är avgjorda (Tabell 1). Kvar är sådant som bara källor eller Kent kan avgöra:

1. Vilka belopp gäller för nya systemkrav? Ingen källa anger något. Fälten står på 0 tills det finns belägg eller Kent anger ett antagande.
2. Vilka exempelfall ska finnas, och vilka värden ska de ha? Förslag: Vattenfall PT1 och PT2, Svenska kraftnät söder och norr, samt ett eget fall. Värdena läggs in i fas 2.
3. Vilka faktorer ska låg och hög ha? Fastställs ur källornas spridning i fas 2, annars märkta antaganden.
4. Har Ei beslutat föreskrifterna om anslutningsavgifter och om krav för kraftproduktionsmoduler? Båda är i källfilen remissutkast.
5. Regionnätens avgifter för 2027 och fler nätägare (Ellevio, E.ON) behöver genomgås, så att exempelfallen speglar mer än Vattenfall.
6. Hur ofta behöver exempelfallen uppdateras, och vem gör det när tarifferna ändras varje årsskifte?
