# Vindkraftskalkyl – fem perspektiv

Ett interaktivt webbaserat verktyg som beräknar och visualiserar vindkraftens
ekonomi **samtidigt ur fem perspektiv**: investeraren, markägaren,
kommunen/samhället, andelsägaren och den närboende.

Verktyget bygger vidare på Kent Lundgrens befintliga kalkyl
([kentlundgren.se/kalkyler/vindkraftskalkyl.html](https://kentlundgren.se/kalkyler/vindkraftskalkyl.html))
och kompletterar den med bland annat LCOE, payback, NPV, IRR och den nya
vindkraftsersättningen till närboende enligt NU20.

> Detta är README för själva verktyget. En mer allmän text om vindkraft finns i
> [repots huvud-README](../README.md).

## Live Page (kör verktyget i webbläsaren)

**Klicka här för att öppna verktyget direkt:**
**[Öppna Vindkraftskalkylen (Live Page)](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html)**

Adress: `https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html`

**Fall Långhult (kopia med värden ur Kaufmann & Westander, 2026): [Öppna Långhult-kalkylen (Live Page)](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_langhult.html)**

Adress: `https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_langhult.html`

## Fall Långhult (kopia av kalkylen)

Kopian [`vindkraftskalkyl_langhult.html`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_langhult.html) (Live Page) lägger in vindpark Långhult
(20 verk, Jönköpings och Gislaveds kommuner) med värden ur
[Kaufmann & Westander (2026)](https://fredolsenrenewables.com/media/1gpjqw0l/pm-intaektsdelning-vindpark-laanghult_gislaved.pdf),
*Intäktsdelning och ersättningar: Vindpark Långhult*, en konsultpromemoria från den 20 april 2026 som är publicerad av Fred. Olsen Renewables
(samma fil finns som [kopia i Kents repo Studier](https://github.com/kentlundgren/Studier/blob/main/2026_host/Policy_i_energi_och_klimat/Yttre_dialog/Intaktsdelning/pm-intaektsdelning-vindpark-laanghult_gislaved.pdf)).
Kalkylräntan 5,2 % real kommer ur [Energiforsk (2021)](https://energiforsk.se/media/30970/el-fra-n-nya-anla-ggningar-energiforskrapport-2021-714.pdf).
Varje indatafält är märkt med författare, år och sida (Kaufmann & Westander, 2026, s. N), lagstadgat eller antagande.
Filerna är `vindkraftskalkyl_langhult.html`, `stil_langhult.css` och `berakningar_langhult.js`. Originalet är oförändrat.

## 🗂️ Lokalt repo

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl`

## Relaterade vindkraftskalkyler

Kent har flera vindkraftskalkyler på olika ställen, lokalt och på GitHub:

| Kalkyl | GitHub | Live Page | Lokal sökväg |
| --- | --- | --- | --- |
| **Vindkraftskalkyl – fem perspektiv** ← *du är här* | [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl) | [Öppna](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html) | `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl` |
| Investeringskalkylator (4 MW, Gemini 3) | [kentlundgren/AI-teknik](https://github.com/kentlundgren/AI-teknik/tree/main/Vindkraft/260814/Gemini3) | [Öppna](https://kentlundgren.github.io/AI-teknik/Vindkraft/260814/Gemini3/vindkraftskalkyl_260814.html) | `C:\Users\kentl\OneDrive\AI\AI-teknik\Vindkraft\260814\Gemini3` |
| Ursprunglig vindkraftskalkyl | *(ej i git)* | [kentlundgren.se](https://kentlundgren.se/kalkyler/vindkraftskalkyl.html) | – |
| Vindkraftskalkyler (Python, tidigt utkast 2024) | *(ej i git)* | – | `C:\Users\kentl\PycharmProjects\Vindkraftskalkyler` |

## Kom igång lokalt

Öppna filen `vindkraftskalkyl.html` direkt i en webbläsare – inget byggsteg
eller någon server behövs.

## Filstruktur

Projektet består av tre huvudfiler i denna mapp, plus en förklaringsruta och en delningsbild:

| Fil | Ansvar |
| --- | --- |
| `vindkraftskalkyl.html` | Struktur och innehåll (semantisk HTML5), inklusive delningstaggarna (Open Graph). |
| `stil.css` | All formatering (responsiv design, gula indatafält, flikar, förklaringsrutan). |
| `berakningar.js` | All beräknings- och interaktionslogik. |
| [`narboende_info.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/narboende_info.js) | Förklaringsruta för "närboende" (hovring, fokus, tryck) med länk till information om lag (2026:1113). |
| [`og-bild.jpg`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/og-bild.jpg) | Delningsbild, 1200×630 px, för länkförhandsvisning på LinkedIn, X och Facebook. |
| [`natkostnader_berakning.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/natkostnader_berakning.js) | Ren beräkningsmodul för nätkostnader och systemkrav (engång i kr/MW, löpande i öre/kWh). Går att köra i Node. |
| [`natkostnader_ui.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/natkostnader_ui.js) | Gränssnitt: exempelfallsväljare, panelen "Nätkostnader i siffror". |
| [`natkostnader_hjalp.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/natkostnader_hjalp.js) | Förklaringsrutor vid hovring, fokus och tryck. |
| [`natkostnader_exempel.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/natkostnader_exempel.js) | Datafil med exempelfall och regelverk. Läses av både kalkylen och läsarsidan. |
| [`natkostnader_exempel.html`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/natkostnader_exempel.html) | Läsarsida: exempelfall, källor, spridning och regelverk. Med [`natkostnader_exempel_sida.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/natkostnader_exempel_sida.js) och [`natkostnader_exempel.css`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/natkostnader_exempel.css). |
| [`test_natkostnader.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/test_natkostnader.js) | Test för nätkostnadsmodulen och datafilen: `node test_natkostnader.js`. |
| [`PRD_natkostnader.md`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/PRD_natkostnader.md) | PRD för nätkostnader (version 1.6, fryst). |
| [`KALLOR_natkostnader.md`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/KALLOR_natkostnader.md) | Källor och räkneexempel för nätkostnader. |
| [`dokument.json`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/dokument.json) | Lista över dokumenten i mappen för brödsmulorna (`brodsmulor.css`). |

CSS länkas i `<head>` och JavaScript strax före `</body>`, båda med relativa
sökvägar. [Chart.js](https://www.chartjs.org/) laddas via CDN och används endast
för diagrammen.

## Funktioner

- **Fem perspektiv som flikar** – ett i taget, medan nyckeltalsrad och
  jämförelsetabell alltid ligger synliga.
- **Reaktiv omräkning utan ramverk** – all utdata räknas om automatiskt när ett
  indatafält ändras, via `addEventListener` (ingen React eller annat ramverk).
- **Jämförelsetabell** – kolumnerna *Senaste*, *Tidigare* och *Förändring* visar
  effekten av just den ändring man nyss gjort.
- **Nyckeltal** – LCOE, payback, NPV och IRR över livslängden.
- **Närboendeersättning (NU20)** – modellerar den nya lagen om intäktsdelning
  (prop. 2025/26:239, i kraft 1 juli 2026). Lagstadgade tal och antaganden/
  schabloner är tydligt märkta i gränssnittet.
- **Nätkostnader och systemkrav** – valfritt läge (ingen, låg, bas, hög), där
  "ingen" är förvalt och ger samma resultat som tidigare. Engångskostnader visas i
  kr per MW (jämfört med investeringsutgiften per MW) och löpande kostnader i öre
  per kWh, delat i fast och rörlig del. Exempelfall och regelverk redovisas på
  [läsarsidan](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/natkostnader_exempel.html).
  Siffrorna är räkneexempel ur publicerade tariffer, inte kvalitetssäkrade.
- **Diagram** – kassaflöde per år och kostnadsnedbrytning där
  närboendeersättningen syns som en egen post.
- **Teknik & prompt-knapp** – en knapp nere till höger visar den ursprungliga
  prompten som verktyget skapades utifrån (transparens).

## Perspektiven i korthet

- **Investerare** – produktion, intäkter, drifts- och kapitalkostnad
  (annuitet), kostnad per kWh, överskott samt LCOE, payback, NPV och IRR.
- **Markägare** – årlig och total arrendeintäkt samt nuvärde av arrendet.
- **Kommun/samhälle** – summerade lokala intäkter och en schabloniserad post för
  samhällsnytta (undviken CO₂).
- **Andelsägare** – klassisk kooperativ modell där en andel ger en fast årlig
  elmängd till självkostnadspris; besparing, nettoresultat och återbetalningstid.
- **Närboende** – vindkraftsersättning enligt avstånd till verk, med
  rimlighetskontroll mot lagens riktmärken (~38 000 kr/år i SE4, ~19 000 kr/år i
  SE1).

## Källor

- Regeringen (2026) *Proposition 2025/26:239 Vindkraft i kommuner.*
  [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/proposition/vindkraft-i-kommuner_hd03239/)
- Sveriges riksdag (2026) *Vindkraft i kommuner. Betänkande 2025/26:NU20.*
  [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/vindkraft-i-kommuner_hd01nu20/)
- Energimyndigheten (2024) *Kostnaden för att bygga vindkraft fortsätter att öka.*
  [energimyndigheten.se](https://www.energimyndigheten.se/nyhetsarkiv/2024/kostnaden-for-att-bygga-vindkraft-fortsatter-att-oka/)
- Energimyndigheten (2026) *Vindkraft.*
  [energimyndigheten.se](https://www.energimyndigheten.se/fornybart/vindkraft/)

## Teknik

Enbart HTML, CSS och JavaScript (vanilla, ES2020-nivå). Chart.js via CDN.
Inget byggsteg och inga övriga beroenden.
