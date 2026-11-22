# PRD – nätkostnader och systemkrav i vindkraftskalkylen

**Namn:** PRD_natkostnader
**Plats:** `vindkraftskalkyl/PRD_natkostnader.md`
**Skapad:** 2026-11-22
**Version:** 0.2
**Status:** Utkast. Ingen kod är ändrad. Inga belopp är fastställda (se fas 1, avsnitt 8). Fas 1 pågår: ledaren som inlägget hänvisar till är inte hittad än.
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

Uppdraget föddes ur ett LinkedIn-inlägg som Svensk Vindkraft publicerade 2026-11-19: [inlägget](https://www.linkedin.com/posts/svensk-vindkraft_i-senaste-numret-av-v%C3%A5r-tidning-svensk-vindkraft-activity-7529084415403253761-pt5K). Inlägget återger inledningen på en ledare i tidningen *Svensk Vindkraft*, "Vindkraftens ekonomi handlar om mer än elpriset", skriven av SD, styrelseledamot i Svensk Vindkraftförening ([Svensk Vindkraft, 2026](https://www.linkedin.com/posts/svensk-vindkraft_i-senaste-numret-av-v%C3%A5r-tidning-svensk-vindkraft-activity-7529084415403253761-pt5K), inlägg på LinkedIn, hämtat 2026-11-22). Själva ledaren är inte läst än (fas 1).

Det inlägget säger om nätkostnader, med egna ord: nätavgifter, anslutningskostnader och nya systemkrav kan få stor betydelse för investeringar som ska bära sig i flera decennier, och när kostnaderna är svåra att förutse ökar osäkerheten inför investeringsbesluten. Därför är det enligt inlägget också en fråga om att attrahera kapital till ny elproduktion.

Vad inlägget ger PRD:n:

- **Avgränsningen:** de tre kostnadsslagen i avsnitt 1 är inläggets egna.
- **Kravet på osäkerhet:** att kostnaderna är svåra att förutse är själva poängen. Därför ska kalkylen kunna visa ett spann (låg, bas, hög) och inte bara ett värde (avsnitt 5 och 9).
- **Producentens perspektiv:** Svensk Vindkraft är en branschorganisation för producenterna och vill "lyfta producenternas perspektiv". Inlägget är ett underlag för vad som behöver modelleras, inte en källa till belopp.

Vad inlägget inte ger: inga belopp för nätkostnader, ingen definition av "nya systemkrav" och ingen hänvisning till vilka regler som avses. Det är fas 1:s uppgift att hitta det i ledaren och i primärkällor. Siffrorna om datacenter i inlägget används inte i kalkylen.

## 2. mål och icke-mål [#](#2-mal)

**Mål**

- Investerarens kassaflöde, LCOE, NPV, IRR och payback inkluderar de tre kostnadsslagen.
- Varje nytt indatafält är märkt som lagstadgat, schablon eller antagande, och varje belopp har en källa med författare, år och sida, enligt samma princip som Långhult-kopian.
- Nätkostnaderna kan visas som ett spann (låg, bas, hög) så att läsaren ser hur osäkerheten slår mot NPV, IRR och LCOE (se ursprung).
- Läsaren ser hur stor del av kostnaden som är nät (kr/kWh och andel av LCOE).
- Med alla nya fält satta till 0 blir alla nyckeltal identiska med dagens.

**Icke-mål (första versionen)**

- Ingen modell av en enskild nätägares tariff. Schabloner med få fält.
- Ingen modellering av andelsägarens egen elnätsavgift som konsument.
- Ingen spotprisprofil, kannibalisering eller balanskostnad. Det är andra kostnadsslag än de tre ovan.
- Ingen ändring av Långhult-kopian, ver2 eller ver3 (se fas 5).

<a id="3-beslut"></a>

## 3. beslut redan tagna [#](#3-beslut)

Tabell 1. Beslut från planeringssamtalet 2026-11-22 [#](#tabell-1)

<a id="tabell-1"></a>

| Fråga | Beslut |
| --- | --- |
| Vad är "nya systemkrav"? | Tekniska krav på produktionsanläggningar (nätkoder) med kostnad för utrustning, provning och drift, samt eventuell nedreglering. Exakt vilka krav som avses fastställs i fas 1 med källa. |
| Vilken sida av nätet? | Producentens kostnader (inmatning och anslutning). |
| Detaljnivå | Schabloner med få fält per post. Förvalda värden per elområde bara om fas 1 visar att avgifterna skiljer sig åt mellan områdena. |
| Systemkrav och produktion | Ett fält "produktionsbortfall, %" minskar produktionen. |

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

<a id="tabell-3"></a>

| Post | Fält | Enhet | Förvalt värde |
| --- | --- | --- | --- |
| Anslutning | avstånd till anslutningspunkt | km | fastställs i fas 1 |
| Anslutning | ledningskostnad | kkr/km | fastställs i fas 1 |
| Anslutning | station och fast del | kkr | fastställs i fas 1 |
| Anslutning | nätägarens anslutningsavgift | kkr/MW | fastställs i fas 1 |
| Nätavgift | fast årsavgift | kr/år | fastställs i fas 1 |
| Nätavgift | effektavgift | kr/kW/år | fastställs i fas 1 |
| Nätavgift | inmatningsavgift | öre/kWh | fastställs i fas 1 |
| Nätavgift | årlig förändring av nätavgifter | %/år | 0 (real kalkyl, som elpriset) |
| Systemkrav | engångskostnad | kkr/MW | fastställs i fas 1 |
| Systemkrav | löpande kostnad (provning, drift) | kr/MW/år | fastställs i fas 1 |
| Systemkrav | produktionsbortfall | % av produktionen | fastställs i fas 1 |

**Formler**

- Produktion med bortfall: `produktionkWh_ar1 = P_tot × 8760 × kapfaktor × 1000 × (1 − bortfall)`. Alla serier som bygger på produktionen (`prodkWhAr`, `intaktAr`, arrende, närboende, LCOE-nämnare) följer av det.
- Engångskostnad för nät och systemkrav, tillägg till `investering` (år 0):
  `natEngang = avstånd × ledningskostnad × 1000 + station × 1000 + anslutningsavgift × 1000 × P_tot + systemEngang × 1000 × P_tot`.
  Kapitalkostnaden (annuiteten) räknas på den större investeringen.
- Löpande nätkostnad år t, tillägg till `driftAr[t]`:
  `natLopande[t] = (fastAvgift + effektavgift × P_tot × 1000 + systemLopande × P_tot) × (1 + förändring)^(t−1) + inmatning/100 × prodkWhAr[t] × (1 + förändring)^(t−1)`.
- `driftkostnadAr1` får `natLopande[1]`, så att `totalkostnad`, `kostnadPerkWh` och andelsägarens självkostnad följer med.
- LCOE: `natEngang` ingår i `investering` och `natLopande[t]` i `driftAr[t]`, så formeln för `disKostnad` behöver ingen ändring.
- **Spann:** en väljare "nätkostnad: låg / bas / hög" (förvalt bas) multiplicerar de belopp som är kostnader i tabell 3 med en faktor per läge. Faktorerna och om de ska gälla alla poster lika fastställs i fas 1 ur källornas spridning, annars märks de som antagande. En liten tabell visar NPV, IRR och LCOE för de tre lägena.
- Nya utdata: nätkostnad per kWh (diskonterad engångs- och löpande kostnad delat med diskonterad energi) och nätkostnadens andel av LCOE.

<a id="6-granssnitt"></a>

## 6. gränssnitt [#](#6-granssnitt)

- Ny indatasektion "Nät och systemkrav" efter "Drift & livscykel". Gula fält (`#FFF9C4`) bara på indatafälten. Varje fält har märkning (lagstadgat, schablon, antagande) och en förklaring vid hovring, fokus och tryck.
- Investerarfliken får tre nya rader: nätkostnad per kWh, andel av LCOE, och total nätkostnad över livslängden.
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
| 3 | Bygg i huvudkalkylen: indata, beräkning, utskrift, diagram, hjälptexter, källor, README, version | Acceptanskriterierna i avsnitt 9 uppfylls |
| 4 | Test: nollfall, handräkning, känslighet | Tabell 5 avprickad |
| 5 | Senare steg, var för sig: Långhult-kopian, ver2, ver3 | Eget beslut per version |

<a id="9-acceptanskriterier"></a>

## 9. acceptanskriterier [#](#9-acceptanskriterier)

Tabell 5. Tester som ska passera [#](#tabell-5)

<a id="tabell-5"></a>

| Test | Förväntat resultat |
| --- | --- |
| Alla nya fält = 0 | Alla nyckeltal, kassaflöden och diagram identiska med dagens |
| Anslutningskostnad ökar med X kr | `investering` ökar med X, kapitalkostnad enligt annuitet, NPV minskar med X |
| Fast årsavgift Y kr/år, `n` år | Driftkostnad år 1 ökar med Y, NPV minskar med diskonterad summa av Y |
| Produktionsbortfall 5 % | Produktion och intäkt minskar med 5 %, procentbaserat arrende och närboendeersättning minskar med samma andel |
| Spann låg / bas / hög | Bas ger samma resultat som utan väljare; hög ger lägre NPV och IRR än bas, låg ger högre |
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

1. Vilka konkreta "nya systemkrav" avser Kent? Inlägget som uppdraget utgår från nämner "nya systemkrav" utan att definiera dem. Tolkningen i tabell 1 är en arbetshypotes tills fas 1 har gett källor (ledaren, Svenska kraftnät).
2. Ska nätavgifterna få en årlig förändring (förvalt 0) eller hållas konstanta i den första versionen?
3. Ska förvalda värden skilja på elområde? Beror på vad fas 1 visar.
4. Ska Långhult-kopian få egna nätvärden ur samma källa som övriga indata, och i så fall när?
