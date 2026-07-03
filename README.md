# Vindkraftens ekonomi – fem perspektiv

Ett interaktivt webbaserat verktyg som beräknar och visualiserar vindkraftens
ekonomi **samtidigt ur fem perspektiv**: investeraren, markägaren,
kommunen/samhället, andelsägaren och den närboende.

Verktyget bygger vidare på Kent Lundgrens befintliga kalkyl
([kentlundgren.se/kalkyler/vindkraftskalkyl.html](https://kentlundgren.se/kalkyler/vindkraftskalkyl.html))
och kompletterar den med bland annat LCOE, payback, NPV, IRR och den nya
vindkraftsersättningen till närboende enligt NU20.

## Live Page (kör verktyget i webbläsaren)

**Klicka här för att öppna verktyget direkt:**
**[Öppna Vindkraftskalkylen (Live Page)](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html)**

Adress: `https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html`

> **Obs:** Länken fungerar först när GitHub Pages är aktiverat för repot (se nedan).
> Så länge Pages inte är aktiverat visas en 404-sida.

### Så aktiverar du GitHub Pages (görs en gång)

1. Gå till repot på GitHub → **Settings** (Inställningar).
2. Välj **Pages** i menyn till vänster.
3. Under **Build and deployment → Source**, välj **Deploy from a branch**.
4. Under **Branch**, välj `main` och mappen `/ (root)`, klicka sedan **Save**.
5. Vänta någon minut. Live Page-länken ovan fungerar därefter.

## Kom igång lokalt

Öppna filen `vindkraftskalkyl/vindkraftskalkyl.html` direkt i en webbläsare –
inget byggsteg eller någon server behövs.

## Filstruktur

Projektet består av tre separata filer i mappen `vindkraftskalkyl/`:

| Fil | Ansvar |
| --- | --- |
| `vindkraftskalkyl.html` | Struktur och innehåll (semantisk HTML5). |
| `stil.css` | All formatering (responsiv design, gula indatafält, flikar). |
| `berakningar.js` | All beräknings- och interaktionslogik. |

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
- **Diagram** – kassaflöde per år och kostnadsnedbrytning där
  närboendeersättningen syns som en egen post.

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
