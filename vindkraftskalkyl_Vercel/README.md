# Vindkraftskalkyl – Vercel-version

Denna mapp innehåller den version av vindkraftskalkylen som deployas via **Vercel**.

Den äldre (fortfarande levande) versionen finns i [`../vindkraftskalkyl/`](../vindkraftskalkyl/) och körs via **GitHub Pages**:
https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

---

## Live-URL:er (två olika adresser till samma kalkyl)

| Plattform       | URL                                                                 | Kommentar |
|-----------------|---------------------------------------------------------------------|-----------|
| **Vercel**      | https://vindkraft-rosy.vercel.app                                   | Ny deployment under teamet Effektiv. |
| **GitHub Pages**| https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html | Ursprunglig live-sida. |

Det är **två olika URL:er** som leder till **samma kalkyl** (samma HTML, CSS och JavaScript).

---

## Upplever användaren någon skillnad?

**Nej – som vanlig användare/läsare ska man i princip inte märka någon skillnad.**

När du öppnar antingen Vercel-URL:en eller GitHub Pages-URL:en ser du **exakt samma kalkyl** – samma flikar, samma beräkningar, samma diagram och samma gula indatafält. Det är medvetet. En välgjord webbapp ska kännas densamma oavsett vilken plattform som serverar den.

### Varför ser view-source likadan ut – och hur hittar appen CSS och JavaScript?

Om du öppnar **view-source** på båda adresserna ser du i princip samma HTML. Det beror på att det *är* samma HTML-fil (bara serverad från olika ställen).

Appen får reda på stil och funktionalitet genom **relativa länkar** i HTML-filen:

```html
<link rel="stylesheet" href="stil.css">
...
<script src="berakningar.js"></script>
```

När webbläsaren laddar `index.html` (eller `vindkraftskalkyl.html`) frågar den efter `stil.css` och `berakningar.js` **i samma mapp**. Det spelar ingen roll om sidan ligger på GitHub Pages eller på Vercel – så länge de tre filerna ligger tillsammans fungerar länkarna. Därför ser både källkoden och beteendet likadana ut.

---

## Vad skiljer sig då – och varför har man Vercel?

Skillnaden ligger **bakom kulisserna**, inte i det användaren ser:

| Aspekt                    | GitHub Pages                              | Vercel                                      |
|---------------------------|-------------------------------------------|---------------------------------------------|
| **Vad användaren ser**    | Samma kalkyl                              | Samma kalkyl                                |
| **Hosting**               | Enkel statisk hosting från GitHub         | Professionell plattform med globalt CDN     |
| **Deploy**                | Manuell / via GitHub Actions              | Automatisk vid varje `git push`             |
| **Preview**               | Begränsat                                 | Varje branch får egen preview-URL           |
| **Prestanda & tillförlitlighet** | Bra för enkla sidor                  | Oftast snabbare och mer robust              |
| **Framtidssäkring**       | Begränsat (mest statiskt)                 | Lätt att lägga till mer (API, auth, analytics, AI-funktioner m.m.) |
| **Arbetssätt**            | Bra för enkla publiceringar               | Bättre när man vill bygga vidare på appen   |

**Cursor gör skillnaden ännu tydligare.**  
När du arbetar via **Cursor** (med Claude eller annan AI) får du ett kraftfullt sätt att hantera Git och GitHub: redigera, committa, pusha och granska skillnader direkt i editorn. Det betyder att fördelarna under *Hosting / Deploy / Preview* i tabellen ovan blir praktiska i vardagen – du pushar från Cursor och Vercel deployar automatiskt. Du behöver inte lämna editorn för att få ut en ny version av appen.

**Kort sagt:**

- För **användaren** ska det inte spela någon roll vilken URL man öppnar.
- För **dig som skapare** ger Vercel + Cursor en stabilare, mer automatiserad och framtidssäker publiceringskedja.

Poängen med Vercel är alltså **inte** att kalkylen ska se annorlunda ut. Poängen är att du får en modern deploy-pipeline medan användaren fortfarande bara upplever "en vanlig bra webbapp".

---

## Skillnad mellan "program" och "app"

| Begrepp     | Betydelse |
|-------------|-----------|
| **Program** | Generellt begrepp för kod med funktionalitet och logik (beräkningar, LCOE, NPV, IRR). |
| **App**     | Användarorienterad, interaktiv produkt – särskilt webbappar. Fokus på gränssnitt och upplevelse. |

Vindkraftskalkylen är både ett **program** (beräkningsmotor) och en **webbapp** (interaktiva flikar, diagram, reaktiva fält).

---

## Hur Vercel, Git och GitHub arbetar ihop (via Cursor)

```
Cursor / Claude  →  lokala filer  →  git commit + push (från Cursor)  →  GitHub
                                                                          ↓
                                                                     Vercel (lyssnar)
                                                                          ↓
                                                                Automatisk deploy
                                                                          ↓
                                                                Publik URL (*.vercel.app)
```

1. **Git** = versionshantering lokalt (hanteras smidigt via Cursor).
2. **GitHub** = central lagring + källa som Vercel hämtar från.
3. **Vercel** = tar koden, serverar den som webbapp med HTTPS och CDN.

Vercel *deployar* kod – den skapar inte koden åt dig på samma sätt som Claude. Bästa långsiktiga rutinen är:

> Claude/Cursor skriver koden → du pushar till GitHub (från Cursor) → Vercel deployar.

---

## Filstruktur

```
vindkraftskalkyl_Vercel/
├── README.md          ← den här filen
├── index.html         ← startsidan (samma innehåll som vindkraftskalkyl.html)
├── stil.css
└── berakningar.js
```

Ingen build behövs. Vercel serverar filerna direkt som statisk webbplats.

---

## GitHub-länk och Teknik-modal i appen

I den ursprungliga versionen finns:
- en diskret **GitHub-länk** nere till vänster
- en **Teknik & prompt**-knapp nere till höger som öppnar en modal med originalprompten

I Vercel-versionen bör GitHub-länken peka på just denna mapp:
https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel

Teknik-modalen kan i framtiden utökas så att den tydligt nämner att det finns både en programversion (GitHub Pages) och en appversion (Vercel). Det är en naturlig vidareutveckling när fler modeller läggs till i repot.

---

## Framåtblick – automatisk app när nya modeller skapas

När nya vindkraftskalkyl-modeller/program skapas i detta repo i framtiden är intentionen att de också ska kunna få en motsvarande Vercel-app automatiskt (via samma Git-integration). Det bör dokumenteras i `CLAUDE.md` (och eventuellt i relevant skill) så att både Claude, Cursor och Grok känner till mönstret:

- Kod i mapp under `Vindkraft/`
- Vercel-projekt kopplat till repot (med lämplig Root Directory)
- Automatisk deploy vid push

---

*Uppdaterad 2026-09-14 – Cursor-fördelar, view-source-förklaring och framåtblick tillagda.*
