# PRD – nätkostnader och systemkrav i vindkraftskalkylen

**Namn:** PRD_natkostnader
**Plats:** `vindkraftskalkyl/PRD_natkostnader.md`
**Skapad:** 2026-11-22
**Version:** 0.9
**Status:** Utkast. Exempelfallen A–G är godkända av Kent (2026-11-22). Faktorerna för låg och hög återstår att godkänna. Ingen kod är ändrad. Inga belopp är fastställda (se fas 1, avsnitt 8). Fas 1 pågår: ledaren är läst och definierar inte "nya systemkrav" eller anger belopp. Anslutning, systemkrav och löpande nätavgifter för producenter är genomgångna mot publicerade källor i [KALLOR_natkostnader.md](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/KALLOR_natkostnader.md). Svenska kraftnäts egna prislistor för 2026 och 2027 är också genomgångna. Regionnätens avgifter för 2027 och fler nätägare återstår.
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
| Exempelfallen i separat fil | Alla exempelfall ligger i en enda datafil, `natkostnader_exempel.js`, som både kalkylen och läsarsidan läser. Filen är `.js` och inte `.json`, eftersom kalkylen ska fungera när den öppnas direkt i webbläsaren utan server. |
| Läsarsida | En egen HTML-sida, `natkostnader_exempel.html`, visar alla fall med värden, källor och antaganden, sorterade efter löpande kostnad i öre/kWh. Sidan ska visa spridningen i fallen och inte påstå vad som är "normalt" så länge underlaget är så smalt (se avsnittet läsarsida). |

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

### fas 2: fältnamn, beräkningssteg och exempelfall [#](#fas-2)

<a id="fas-2"></a>

Det här avsnittet fastställer det som avsnitt 5 lämnade öppet: exakta fältnamn, hur nätkostnaderna kopplas in steg för steg, och vilka värden exempelfallen har. Det ersätter inte formlerna ovan, det gör dem körbara.

Tabell 6. Fältnamn (id i HTML och `lasIndata()`) [#](#tabell-6)

<a id="tabell-6"></a>

| id | Etikett | Enhet | Typ | Förvalt |
| --- | --- | --- | --- | --- |
| `natlage` | Nätkostnader | ingen / låg / bas / hög | select | ingen |
| `natexempel` | Exempelfall | lista (Tabell 7) | select | eget |
| `natavstand` | Avstånd till anslutningspunkt | km | number | 0 |
| `natledning` | Ledningskostnad | kkr/km | number | 0 |
| `natstation` | Station och fast del | kkr | number | 0 |
| `natforstark` | Andel av förstärkning och nätägarens anslutningsavgift | kkr | number | 0 |
| `natutredning` | Utredning och förprojektering | kkr | number | 0 |
| `natfast` | Fast årsavgift (inklusive kundspecifik avgift) | kr/år | number | 0 |
| `nateffekt` | Effektavgift eller fast avgift per kW | kr/kW och år | number | 0 |
| `natavstavg` | Avståndsberoende avgift | kr/kW och km | number | 0 |
| `natavstavstand` | Avstånd för avståndsberoende avgift | km | number | 0 |
| `natenergi` | Energiavgift (negativt = ersättning) | öre/kWh | number | 0 |
| `natforandring` | Årlig förändring av nätavgifter | %/år | number | 0 |
| `natsyseng` | Systemkrav, engångskostnad | kkr/MW | number | 0 |
| `natsyslop` | Systemkrav, löpande kostnad | kr/MW och år | number | 0 |
| `natsysbortfall` | Systemkrav, produktionsbortfall | % | number | 0 |
| `natfaktorlag` | Faktor i läget låg | gånger | number | 0,5 (antagande) |
| `natfaktorhog` | Faktor i läget hög | gånger | number | 1,5 (antagande) |

Alla fält utom väljarna är gula (`#FFF9C4`) indatafält. Alla belopp står på 0 tills ett exempelfall väljs eller läsaren fyller i egna värden, eftersom ingen källa anger belopp för ledning, station, förstärkning och systemkrav.

**Beräkningssteg (i `beraknaAllt`)**

1. Hjälpfunktionen `beraknaNat(d, faktor, produktionkWh)` returnerar alla poster i kr (engång) respektive kr per år (löpande) för en given faktor. Den läser bara de nya fälten.
2. Faktorn för läget är `ingen = 0`, `låg = natfaktorlag`, `bas = 1`, `hög = natfaktorhog`. Faktorn multiplicerar alla poster utom energiavgiften, som följer marknad och förluster och inte skalas.
3. Produktion med bortfall: `bortfall = min(1, faktor × natsysbortfall / 100)`, och `produktionkWh_ar1 = P_tot × 8760 × kapfaktor × 1000 × (1 − bortfall)`.
4. Engångsposter i kr: `ledning = natavstand × natledning × 1000`, `station = natstation × 1000`, `forstarkning = natforstark × 1000`, `utredning = natutredning × 1000`, `system = natsyseng × 1000 × P_tot`. Summan `natEngang = faktor × (ledning + station + forstarkning + utredning + system)`.
5. Löpande poster år 1 i kr: `fast = natfast`, `effekt = nateffekt × P_tot × 1000`, `avstand = natavstavg × natavstavstand × P_tot × 1000`, `system = natsyslop × P_tot`, `energi = natenergi / 100 × produktionkWh_ar1`. Faktorn multiplicerar de fyra första. År t: `natLopande[t] = (faktor × (fast + effekt + avstand + system) + natenergi / 100 × prodkWhAr[t]) × (1 + natforandring / 100)^(t−1)`.
6. Koppling in i kalkylen: `investering += natEngang`, `driftAr[t] += natLopande[t]`. Resten (annuitet, LCOE, NPV, IRR, payback, andelsägarens självkostnad) följer av de befintliga formlerna.
7. Panelen "Nätkostnader i siffror" räknas med `beraknaNat(d, faktorPanel, …)` där `faktorPanel = faktor` om läget inte är ingen, annars 1 (bas). Då visas storleken även i läget ingen, utan att nyckeltalen NPV, IRR, LCOE och payback ändras.
8. Huvudnyckeltalen i panelen: engångsposter `post / P_tot` i kr/MW, och summan som procent av `specinv × 1000`. Löpande poster `post / produktionkWh_ar1 × 100` i öre/kWh. Är produktionen 0 visas "–".
9. Sekundära nyckeltal: löpande summa per MW och år, total nätkostnad per kWh över livslängden `(natEngang + Σ natLopande[t] / (1 + r)^t) / disEnergi`, och dess andel av LCOE. Andelen av LCOE visas som "–" i läget ingen.

Tabell 7. Exempelfall (värden ur källfilen, 20 MW som i kalkylens förvalda värden) [#](#tabell-7)

<a id="tabell-7"></a>

| Exempelfall | `natfast` kr/år | `nateffekt` kr/kW | `natavstavg` kr/kW,km | `natavstavstand` km | `natenergi` öre/kWh | `natutredning` kkr | Källa och kommentar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Vattenfall PT1 (50–30 kV) med Svenska kraftnät, södra Sverige | 1 250 000 | 23,1 | 1,23 | 20 | −2,62 | 0 | Vattenfall: fast 1 250 tkr, effekt 17, avstånd 1,23, energiersättning −1,12. Svenska kraftnät via Vattenfall: 6,1 kr/kW och −1,5 öre/kWh, enligt min läsning ovanpå. Avståndet 20 km är ett antagande. |
| B. Vattenfall PT2 (20–6 kV) med Svenska kraftnät, södra Sverige | 680 000 | 19,1 | 2,89 | 20 | −4,19 | 0 | Vattenfall: fast 680 tkr, effekt 13, avstånd 2,89, energiersättning −2,69, plus Svenska kraftnät som i A. |
| C. Svenska kraftnät direkt, söder, 2026 (Alvesta) | 0 | 14 | 0 | 0 | −3,87 | 124 | Effektavgift 14 kr/kW, förlustkoefficient −6,3 procent vid elpriset 0,60 kr/kWh: (600 + 15) × −0,063 = −38,7 kr/MWh. Utredning: 100 kkr + 1,2 kkr/MW (2025). |
| D. Svenska kraftnät direkt, norr, 2026 (Messaure) | 0 | 31 | 0 | 0 | 2,39 | 124 | Effektavgift 31 kr/kW, koefficient 7,6 procent vid elpriset 0,30 kr/kWh: (300 + 15) × 0,076 = 23,9 kr/MWh. |
| E. Svenska kraftnät direkt, söder, 2027 (Alvesta) | 144 000 | 22 | 0 | 0 | −4,04 | 124 | Fast avgift 22 kr/kW och år, kundspecifik avgift 12 000 kr/månad, koefficient −7,3 procent och fördelningsfaktor 0,9 vid elpriset 0,60 kr/kWh. Svenska kraftnäts reducering av energiavgiften är inte inräknad. |
| F. Lokalnät för en vindpark (OX2 Brobacken Nät) | 0 | 170,21 | 0 | 0 | 1,77 | 0 | Inmatningsabonnemang 170,21 kr/kW och 17,67 kr/MWh. Ett nät som en vindkraftutvecklare äger, inte representativt. |
| G. Eget | 0 | 0 | 0 | 0 | 0 | 0 | Läsarens egna värden. |

Engångsposterna för ledning, station, förstärkning och systemkrav står på 0 i alla exempelfall, eftersom ingen publicerad källa anger belopp. Hjälptexten säger att beloppen kommer ur nätägarens offert.

Tabell 8. Förväntade resultat för exempelfallen, som test (20 MW, kapacitetsfaktor 0,37, 64 824 000 kWh per år, läge bas) [#](#tabell-8)

<a id="tabell-8"></a>

| Exempelfall | Löpande totalt, kr per år | Löpande totalt, öre per kWh | Engångsposter, kr per MW |
| --- | --- | --- | --- |
| A | 505 600 | 0,78 | 0 |
| B | −498 100 | −0,77 | 0 |
| C | −2 231 600 | −3,44 | 6 200 |
| D | 2 171 900 | 3,35 | 6 200 |
| E | −2 035 200 | −3,14 | 6 200 |
| F | 4 549 600 | 7,02 | 0 |

Fas 2 är klar när formlerna ovan har granskats mot källfilens enheter (klart i den här versionen) och Kent har godkänt exempelfallen och faktorerna 0,5 och 1,5.

<a id="6-granssnitt"></a>

## 6. gränssnitt [#](#6-granssnitt)

- Ny indatasektion "Nät och systemkrav" efter "Drift & livscykel". Gula fält (`#FFF9C4`) bara på indatafälten. Varje fält har märkning (lagstadgat, schablon, antagande) och en förklaring vid hovring, fokus och tryck.
- En panel "Nätkostnader i siffror" under indatasektionen, med två block: **Engångskostnader (kr/MW)** med varje post, summan och jämförelsen mot investeringsutgiften per MW, och **Löpande kostnader (öre/kWh)** med varje post och summan. Panelen visas alltid. Investerarfliken får dessutom raderna för andel av LCOE och total nätkostnad över livslängden.
- Valfri väljare "exempelfall" som fyller fälten med ett belagt exempel eller lämnar dem för egna värden.
- Kostnadsdiagrammet (år 1) får en egen post "Nät och systemkrav" = löpande nätkostnad år 1 + annuiteten på engångsdelen. Hur diagrammet delar upp kapitalkostnaden kontrolleras i fas 2, så att annuiteten på engångsdelen inte dubbelräknas.
- Källor och antaganden-sektionen får de nya källorna i Harvardform med klickbara, verifierade länkar.
- Jämförelsetabellen (Senaste / Tidigare / Förändring) fungerar som i dag för de nya nyckeltalen.
- Vid väljaren "exempelfall" finns länken "Se alla exempelfall och källor" till läsarsidan. När ett fall är valt visas en rad med fallets öre/kWh och spannet över alla fall. Läsarens egna värden placeras på samma sätt i spannet.
- Versionsrad: sidan har ingen versionsrad i dag. Den läggs till (`VERSION` och `VERSIONSDATUM` i JS) enligt regel 19 i `kent-bygg-sidor`, och höjs sedan vid varje ändring.

### läsarsida för exempelfallen [#](#lasarsida)

<a id="lasarsida"></a>

Syftet är att läsaren lätt ska kunna se vilka fall nätkostnaderna bygger på, vad som ligger under och över, och att Kent och Claude vid en framtida genomgång ska se om ett fall ligger utanför det vanliga.

**Datafilen `natkostnader_exempel.js`** definierar `NAT_EXEMPEL`, en lista där varje fall har:

- bokstav och namn, nättyp (regionnät, stamnät direkt, lokalnät) och tariffår,
- alla fältvärden i Tabell 7 (`natfast`, `nateffekt`, `natavstavg`, `natavstavstand`, `natenergi`, `natutredning`),
- källa i Harvardform med klickbar länk och hämtdatum, och sidhänvisning där det går,
- antaganden (till exempel avståndet 20 km) och vad som inte är medräknat (till exempel Svenska kraftnäts reducering av energiavgiften),
- datum då fallet senast kontrollerades, och en markering `sarfall` för fall som inte är representativa (lokalnät som en vindkraftutvecklare äger).

**Sidan `natkostnader_exempel.html`** ska ha:

1. En tabell över fallen, sorterad från lägsta till högsta löpande kostnad i öre/kWh, med värden, källa, antaganden och "senast kontrollerad". Tabellen och diagrammet har nummer, namn och eget `#`-ankare.
2. Ett diagram över löpande nätkostnad per fall i öre/kWh. Negativa värden (ersättningar) syns som staplar åt andra hållet.
3. Ett avsnitt "spridning": lägsta, högsta och medianen av de representativa fallen. Fall märks som "under" eller "över" medianen, och särfall märks som särfall. Texten använder inte ordet "normal" förrän fler nätägare finns med (Ellevio, E.ON).
4. Ett avsnitt "det som saknas": engångsposterna (ledning, station, förstärkning, systemkrav) har inga belagda fall. Det står uttryckligen, så att läsaren ser vad som är okänt.
5. En varning för fall vars kontrolldatum är äldre än ett år, och en notis om att tarifferna ändras varje årsskifte.
6. Förklaringar vid hovring, fokus och tryck för förkortningar och namn (PT1, PT2, kr/kW,km, förlustkoefficient, kundspecifik avgift).
7. Hörnparet `{ } GitHub` och `</> teknik` med modal ("Tekniken" och "Metoden"), kopierat från `Presentationer/Nr1/`, versionsrad (`VERSION` och `VERSIONSDATUM`, början på 1.0) och en länk tillbaka till kalkylen. Sidan och kalkylen delar mapp, så brödsmulor och "Fler dokument i samma mapp" sätts upp med `dokument.json` enligt regel 17 i `kent-bygg-sidor`. Huvuddokument är kalkylen.

**Underhåll:** datafilen uppdateras varje årsskifte, efter att Svenska kraftnäts styrelse fattat sitt beslut om nästa års avgifter (i september). Ett test räknar om varje fall med formlerna i fas 2 och jämför med Tabell 8, så att ett värde inte kan ändras utan att det syns. Provet kan köras i webbläsaren eller med Node.

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
| 2 | Formler, fältnamn och exempelfall fastställs i detalj (avsnittet fas 2) | Formlerna är överens med fas 1:s enheter och Kent har godkänt exempelfallen och faktorerna |
| 3 | Bygg i huvudkalkylen: indata, beräkning, panelen Nätkostnader i siffror, diagram, hjälptexter, källor, README, version. Bygg även datafilen `natkostnader_exempel.js` och läsarsidan `natkostnader_exempel.html`. | Acceptanskriterierna i avsnitt 9 uppfylls |
| 4 | Test: nollfall, handräkning, känslighet, exempelfallens testvärden | Tabell 5 avprickad |
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
| Exempelfall mot Tabell 8 | Varje exempelfall i datafilen ger de förväntade värdena i Tabell 8 när det räknas med fas 2:s formler |
| En datakälla | Väljaren i kalkylen och läsarsidan visar samma fall med samma värden, eftersom båda läser `natkostnader_exempel.js` |
| Läsarsidan | Tabellen är sorterad efter öre/kWh, negativa värden syns åt andra hållet i diagrammet, särfall är märkta och ordet "normal" förekommer inte |
| Gammalt fall | Ett fall med kontrolldatum äldre än ett år visas med varning |
| Version | `VERSION` och `VERSIONSDATUM` är satta och uppdaterade i samma ändring, på kalkylen och på läsarsidan |

<a id="10-spec"></a>

## 10. SPEC.md-checkpoint [#](#10-spec)

Behövs ett SPEC.md-steg härifrån? **Nej.** Ändringen är begränsad (ett fåtal fält, en beräkningsfunktion och några utskriftsrader), formlerna står i avsnitt 5 och acceptanskriterierna i avsnitt 9. Frågan tas upp igen om nätkostnaderna porteras till ver3, där TypeScript-formlerna ska testas mot samma tal.

<a id="11-risker"></a>

## 11. risker [#](#11-risker)

- **Falsk precision:** nätkostnader varierar mycket mellan projekt. Schabloner kan se mer exakta ut än de är. Åtgärd: tydlig märkning och en uppmaning att kontrollera mot nätägaren.
- **Regler som ändras:** nätkoder och tariffer revideras. Åtgärd: årtal och hämtdatum vid varje källa.
- **Dubbelräkning:** annuiteten på engångskostnaden får inte synas både i "kapitalkostnad" och i nätposten i diagrammet. Åtgärd: testet i tabell 5.
- **Fall som blir gamla:** tarifferna ändras varje årsskifte. Åtgärd: kontrolldatum per fall, varning efter ett år och en årlig uppdatering efter Svenska kraftnäts beslut i september.
- **För få fall för att säga "normalt":** underlaget är i huvudsak Vattenfall, Svenska kraftnät och ett lokalnät. Åtgärd: sidan visar spridning, inte normalvärde, tills fler nätägare finns med.
- **Fyra kopior av kalkylen:** huvudversion, Långhult, ver2 och ver3 kan komma att visa olika resultat. Åtgärd: README anger vilken version som har nätkostnader.

<a id="12-oppna-fragor"></a>

## 12. öppna frågor [#](#12-oppna-fragor)

Modellfrågorna är avgjorda (Tabell 1). Kvar är sådant som bara källor eller Kent kan avgöra:

1. Vilka belopp gäller för nya systemkrav? Ingen källa anger något. Fälten står på 0 tills det finns belägg eller Kent anger ett antagande.
2. Godkänner Kent faktorerna 0,5 (låg) och 1,5 (hög)? De är antaganden. Exempelfallen A–G är godkända.
3. Vill Kent ange ett illustrativt antagande för ledning, station och förstärkning (kkr), tydligt märkt som antagande, så att engångsposten i kr/MW inte står på 0 i exempelfallen? Ingen publicerad källa anger belopp.
4. Har Ei beslutat föreskrifterna om anslutningsavgifter och om krav för kraftproduktionsmoduler? Båda är i källfilen remissutkast.
5. Regionnätens avgifter för 2027 och fler nätägare (Ellevio, E.ON) behöver genomgås, så att exempelfallen speglar mer än Vattenfall. Först då kan läsarsidan säga något om vad som är normalt.
6. Hur ofta behöver exempelfallen uppdateras, och vem gör det när tarifferna ändras varje årsskifte?
