# Vindkraftskalkyl – Vercel-version

Denna mapp innehåller den version av vindkraftskalkylen som deployas via **Vercel**.

Den äldre (fortfarande levande) versionen finns i [`../vindkraftskalkyl/`](../vindkraftskalkyl/) och körs via **GitHub Pages**:
https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

---

## Live-URL:er (två olika adresser till samma kalkyl)

| Plattform       | URL                                                                 | Kommentar |
|-----------------|---------------------------------------------------------------------|-----------|
| **Vercel**      | https://vindkraft-rosy.vercel.app                                   | Fungerar (2026-09-14). |
| **GitHub Pages**| https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html | Ursprunglig live-sida. |

Det är **två olika URL:er** som leder till **samma kalkyl** (samma HTML, CSS och JavaScript).

---

## Status – vad som redan är gjort (2026-09-14)

- Mappen `vindkraftskalkyl_Vercel/` skapad.
- De tre filerna (`index.html`, `stil.css`, `berakningar.js`) på plats.
- Vercel-projektet **vindkraft** (team Effektiv) kopplat till repot med Root Directory = denna mapp.
- https://vindkraft-rosy.vercel.app fungerar.
- README och CLAUDE.md uppdaterade med dual-publiceringsmönstret.
- Skill `vercel-github-pages-dual-publicering` skapat för att dokumentera mönstret globalt.
- **Återstår (görs via Cursor):** uppdatera GitHub-länken nere till vänster så den pekar på denna mapp, och anpassa Teknik-modalen så den nämner både programversion och Vercel-app.

---

## Upplever användaren någon skillnad?

**Nej – som vanlig användare/läsare ska man i princip inte märka någon skillnad.**

När du öppnar antingen Vercel-URL:en eller GitHub Pages-URL:en ser du **exakt samma kalkyl**. Det är medvetet.

### Varför ser view-source likadan ut – och hur hittar appen CSS och JavaScript?

HTML-källan ser likadan ut eftersom det *är* samma fil (bara serverad från olika ställen).

Appen får reda på stil och funktionalitet genom **relativa länkar**:

```html
<link rel="stylesheet" href="stil.css">
...
<script src="berakningar.js"></script>
```

Webbläsaren hämtar filerna från samma mapp. Det spelar ingen roll om sidan ligger på GitHub Pages eller Vercel.

---

## Vad skiljer sig då – och varför har man Vercel?

Skillnaden ligger **bakom kulisserna**:

| Aspekt                    | GitHub Pages                              | Vercel                                      |
|---------------------------|-------------------------------------------|---------------------------------------------|
| **Vad användaren ser**    | Samma kalkyl                              | Samma kalkyl                                |
| **Hosting**               | Enkel statisk hosting från GitHub         | Professionell plattform med globalt CDN     |
| **Deploy**                | Manuell / via GitHub Actions              | Automatisk vid varje `git push`             |
| **Preview**               | Begränsat                                 | Varje branch får egen preview-URL           |
| **Prestanda & tillförlitlighet** | Bra för enkla sidor                  | Oftast snabbare och mer robust              |
| **Framtidssäkring**       | Begränsat (mest statiskt)                 | Lätt att lägga till mer (API, auth, analytics, AI-funktioner m.m.) |
| **Arbetssätt**            | Bra för enkla publiceringar               | Bättre när man vill bygga vidare på appen   |

**Cursor gör skillnaden praktisk.** Du redigerar, commit:ar och push:ar från Cursor – Vercel deployar automatiskt. Du behöver inte lämna editorn.

Poängen med Vercel är **inte** att kalkylen ska se annorlunda ut. Poängen är en modern, automatiserad deploy-pipeline medan användaren fortfarande bara upplever "en vanlig bra webbapp".

---

## Alternativ till Vercel – och vad "build" betyder

Du kan skapa en liknande app på flera sätt. Vercel är ett av alternativen.

### Utan build (nuvarande lösning)
Vanlig HTML + CSS + vanilla JavaScript. Fungerar direkt. Inget kompileringssteg. Enkelt att förstå och debugga. Det är det vi använder här.

### Med build (Vite, React, Vue, Svelte m.fl.)
**Build** = att ta modern källkod (komponenter, JSX, TypeScript, import/export) och **omvandla** den till vanliga filer som webbläsaren förstår (HTML, CSS, minifierad JS).

Typiskt flöde med Vite + React:
1. Du skriver komponenter i JSX/TypeScript.
2. Du kör `npm run build` (eller motsvarande).
3. Vite skapar en `dist/`-mapp med optimerade filer.
4. Du publicerar `dist/` till GitHub Pages, Netlify, Cloudflare Pages **eller** Vercel.

**Poängen med build:**
- Bättre struktur för stora appar (komponenter, routing, state).
- Modern utvecklarupplevelse (hot reload, typsäkerhet).
- Optimerad kod till användaren (minifiering, tree-shaking, code-splitting).
- Kräver mer verktyg och ett extra steg – ofta överkill för enkla kalkyler som denna.

**Andra publiceringsalternativ:**
- **Netlify** – liknande Vercel, bra för statiska och JAMstack-appar.
- **Cloudflare Pages** – snabb CDN, generös gratisnivå.
- **GitHub Pages** – enklast för rena statiska sidor (som den ursprungliga kalkylen).
- **Vite + valfri host** – du bygger själv och laddar upp resultatet.

Vercel utmärker sig med extremt enkel Git-integration och preview-deployments per branch.

---

## Skillnad mellan "program" och "app"

| Begrepp     | Betydelse |
|-------------|-----------|
| **Program** | Generellt begrepp för kod med funktionalitet och logik. |
| **App**     | Användarorienterad, interaktiv produkt – särskilt webbappar. |

Vindkraftskalkylen är både ett program och en webbapp.

---

## Filstruktur

```
vindkraftskalkyl_Vercel/
├── README.md          ← den här filen
├── index.html         ← startsidan
├── stil.css
└── berakningar.js
```

Ingen build behövs. Vercel serverar filerna direkt.

---

## GitHub-länk och Teknik-modal (återstår)

GitHub-länken nere till vänster bör peka på:
https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel

Teknik-modalen bör nämna att det finns både en programversion (GitHub Pages) och en appversion (Vercel), och kort förklara fördelen med den automatiska deployen.

Detta görs enklast via Cursor (se prompt i chatten).

---

## Framåtblick

Nya modeller i detta repo bör följa samma dual-mönster. Mönstret är dokumenterat i:
- denna README
- `CLAUDE.md`
- skill:et `vercel-github-pages-dual-publicering`

---

*Uppdaterad 2026-09-14 – status, alternativ till Vercel och build-förklaring tillagda.*
