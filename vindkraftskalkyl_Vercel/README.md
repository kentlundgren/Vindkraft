# Vindkraftskalkyl – Vercel-version

Denna mapp innehåller den version av vindkraftskalkylen som deployas via **Vercel**.

Den äldre (fortfarande levande) versionen finns i [`../vindkraftskalkyl/`](../vindkraftskalkyl/) och körs via **GitHub Pages**:
https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

## 🗂️ Lokalt repo

Repo-rot lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

Den här mappen lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel`

På GitHub: <https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel>

---

## Live-URL:er (två olika adresser till samma kalkyl)

| Plattform       | URL                                                                 | Kommentar |
|-----------------|---------------------------------------------------------------------|-----------|
| **Vercel**      | https://vindkraft-rosy.vercel.app                                   | Fungerar (2026-09-14). |
| **GitHub Pages**| https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html | Ursprunglig live-sida. |

Det är **två olika URL:er** som leder till **samma kalkyl** (samma HTML, CSS och JavaScript).

---

## Team och projekt på Vercel

**Ett team är inte en app.** Ett team är ett *konto/utrymme* på Vercel – ungefär en katalog – där flera **projekt** (appar) kan ligga. Ett nytt kalkylprogram ska alltså bli ett **nytt projekt i samma team**, inte ett nytt team.

| Begrepp | Vad det är | Analogi | Vad du gör |
|---------|------------|---------|------------|
| **Team** | Ett konto/utrymme med gemensam faktura, medlemmar och projektlista. Även ett Hobby-konto kallas *Hobby team*. | En katalog, eller en GitHub-organisation | Byt team uppe till vänster i dashboarden. Skapa inte ett nytt team för varje app. |
| **Projekt** | En app kopplad till ett Git-repo (eller en mapp i ett repo). Har egen URL, egna deployments och egna inställningar. | En app / ett GitHub-repo (eller en Root Directory i ett repo) | Skapa ett **nytt projekt** när en ny modell ska deployas. |
| **Deployment** | En enskild utgåva av projektet (production eller preview). | En publicerad version av appen | Skapas automatiskt vid `git push`. |

Vercel beskriver team som ytan där man samlar projekt och resurser ([Vercel, 2026a](https://vercel.com/docs/accounts)), och projekt som appen som deployas från ett Git-repo ([Vercel, 2026b](https://vercel.com/docs/projects/overview)). Ett repo kan ge flera projekt om olika mappar har olika Root Directory.

### Ditt team: Effektiv (`effektiv1`)

Ja – **`effektiv1` är ditt Vercel-team.** Visningsnamnet i dashboarden är **Effektiv**. Sluggen (adressen) är `effektiv1`. Du ser det uppe till vänster i teamväljaren och i URL:en [https://vercel.com/effektiv1](https://vercel.com/effektiv1). Planen är **Hobby**. Inloggad användare är `kentlundgren`.

Så ser teamet ut (skärmdump 2026-09-14):

![Teamet Effektiv (effektiv1) i Vercel-dashboarden, med projekten vindkraft och vindkalkyl](Bilder/Team_effektiv1_i_Vercel.jpg)

Samma bild på GitHub: [Team_effektiv1_i_Vercel.jpg](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel/Bilder/Team_effektiv1_i_Vercel.jpg)

På bilden syns bland annat:

- **Effektiv** och **Hobby** uppe till vänster – det är teamet, inte en enskild app.
- **Projects** med två kort: **vindkraft** (har production-URL `vindkraft-rosy.vercel.app`) och **vindkalkyl** (annat projekt i samma team, ännu utan production-deploy).
- Knappen **Add New** uppe till höger – där lägger du till *nästa* projekt i samma team.

| | |
|---|---|
| **Team-namn** | Effektiv |
| **Team-slug** | `effektiv1` |
| **Dashboard** | https://vercel.com/effektiv1 |
| **Team-ID** | `team_I90mljXDP0cWBiwmXIU1he27` |
| **Plan** | Hobby |

Projekt i samma team just nu:

| Projekt | GitHub-repo | Kommentar |
|---------|-------------|-----------|
| **vindkraft** | [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft) | Denna kalkyl. Root Directory = `vindkraftskalkyl_Vercel`. Live: https://vindkraft-rosy.vercel.app |
| **vindkalkyl** | [kentlundgren/Codex](https://github.com/kentlundgren/Codex) | Annan app i **samma** team – ett exempel på att teamet rymmer flera projekt. |

### Kan samma team användas till många GitHub-projekt?

**Ja – det är poängen.** Teamet Effektiv är tänkt som *ett* utrymme för många appar. Du skapar inte ett nytt team per GitHub-repo. Du skapar ett **nytt Vercel-projekt** i `effektiv1` och kopplar det till det nya GitHub-repot (eller till en mapp i ett befintligt repo).

På Hobby-planen går det att ha upp till **200 projekt** i teamet ([Vercel, 2026c](https://vercel.com/docs/plans/hobby)). Det räcker långt för personliga kalkyler och webbappar. Hobby kräver att GitHub-repot ligger under ett **personligt GitHub-konto** (här: `kentlundgren/...`), inte under en GitHub-organisation ([Vercel, 2026d](https://vercel.com/docs/limits)). Kents vanliga repon passar alltså här.

Skapa ett *nytt* Vercel-team bara om du behöver separat faktura, ett annat GitHub-konto eller samarbete med andra (Pro).

### Koppla ett nytt Git/GitHub-projekt till teamet i framtiden

Gör så här när en ny modell eller app ska få en Vercel-app:

1. **Ha koden i Git och på GitHub** under `kentlundgren/...`. Committa och pusha som vanligt från Cursor.
2. Öppna teamets dashboard: [https://vercel.com/effektiv1](https://vercel.com/effektiv1). Kontrollera att **Effektiv** är valt uppe till vänster – annars hamnar projektet i fel team.
3. Klicka **Add New** → **Project** (samma knapp som på skärmdumpen).
4. **Importa** GitHub-repot. GitHub-kontot `kentlundgren` ska redan vara kopplat till Vercel.
5. Om appen **inte** ligger i repo-roten: sätt **Root Directory** till rätt mapp (så som `vindkraftskalkyl_Vercel` är satt för det här projektet). Lämna tomt om hela repot *är* appen.
6. Klicka **Deploy**. Vercel skapar projektet i teamet Effektiv och bygger en första version ([Vercel, 2026e](https://vercel.com/docs/getting-started-with-vercel/import)).
7. Därefter: redigera i Cursor → Kent committar och pushar själv → Vercel deployar automatiskt till det projektet.

Du behöver alltså **inte** skapa ett nytt team. Du återanvänder `effektiv1` och lägger till ett projekt.

---

## Status – vad som redan är gjort (2026-09-14)

- Mappen `vindkraftskalkyl_Vercel/` skapad.
- De tre filerna (`index.html`, `stil.css`, `berakningar.js`) på plats.
- Vercel-**projektet** **vindkraft** ligger i **teamet** Effektiv (`effektiv1`) och är kopplat till det här GitHub-repot med Root Directory = denna mapp.
- https://vindkraft-rosy.vercel.app fungerar.
- README och CLAUDE.md uppdaterade med dual-publiceringsmönstret.
- Skill `vercel-github-pages-dual-publicering` skapat för att dokumentera mönstret globalt.
- GitHub-länken nere till vänster pekar på denna mapp, och Teknik-modalen nämner både programversion (GitHub Pages) och appversion (Vercel).

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

### Djuplänkar i den här README:n

GitHub hoppar till avsnittet efter `#` i adressen. **Ett avsnitt = ett ankare = en länk.** Döpa inte om id:n, och skapa inte ett andra id till samma text.

| Avsnitt | Länk |
|---------|------|
| Kan Vercel göra kalkylen bättre | https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel#Kan-Vercel-gora-kalkylen-battre |
| Förslag på prompt | https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel#Forslag_pa_promt |

Mer om Functions, API-yta och `vindkraftskalkyl_Vercel_ver2` finns i [Vercel-teknik.md](Vercel-teknik.md).

---

<a id="Kan-Vercel-gora-kalkylen-battre"></a>

## Kan Vercel göra kalkylen bättre – om man kodar för plattformen? [#](#Kan-Vercel-gora-kalkylen-battre)

Den nuvarande kalkylen på GitHub Pages
([vindkraftskalkyl.html](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html))
är medvetet ett **statiskt program**: tre filer, beräkning i webbläsaren, ingen server. Samma kod ligger på Vercel. Därför blir appen **inte** bättre bara för att den deployas där.

Frågan är en annan: *om man från början visste att kalkylen skulle ligga på Vercel – hade den kunnat kodas klokare, så att den blev lättare och smidigare att använda?*

**Kort svar:** Ja, men bara om man *använder* det Vercel kan som GitHub Pages inte kan. Att byta host räcker inte. Att skriva om allt i React räcker heller inte i sig. Det som gör skillnad för användaren är nya *förmågor* – inte ett nytt ramverk för samma kalkyl.

| Nivå | Vad det är | Blir kalkylen bättre för användaren? |
|------|------------|--------------------------------------|
| **1. Samma statiska kod på Vercel** (nu) | HTML + CSS + JS, identisk med GitHub Pages | Nej. Samma klick, samma fält, samma resultat. |
| **2. Bättre gränssnitt, fortfarande statiskt** | T.ex. spara scenario i webbläsaren, dela via URL, tydligare flöde, bättre mobil | Ja – men det fungerar lika bra på GitHub Pages. Kräver inte Vercel. |
| **3. Kod skriven för Vercel** | Vercel Functions (en liten server), hemliga nycklar, ev. lagring | Ja, för saker som *inte går* på GitHub Pages: aktuella elpriser från en källa, spara/dela scenario på servern, PDF/export på servern, valfri AI-hjälp utan att läcka nycklar i webbläsaren. |

Vercel Functions är serverkod som körs vid behov, utan att du driver en egen server ([Vercel, 2026f](https://vercel.com/docs/functions)). GitHub Pages kan inte det. Det är den egentliga öppningen.

**Vad som är klokt att behålla även i en Vercel-anpassad app**

- Beräkningarna i webbläsaren (snabbt, fungerar utan väntan på server).
- Gula indatafält, fem perspektiv, jämförelsetabellen – det användaren redan förstår.
- Programversionen på GitHub Pages som en enkel, alltid-tillgänglig kalkyl.

**Vad som vore klokare *för att* det ska vara en Vercel-app**

- En tunn API-yta (`/api/...`) för sådant som kräver server: hämta elpris, spara ett scenario, exportera.
- Hemligheter (API-nycklar) i Vercels environment variables – aldrig i JavaScript-filen.
- Appen ska fungera även om API:t tillfälligt strular (progressiv förbättring: kalkylen räknar som idag, extrafunktionerna är tillval).
- Inte bygga ett nytt team. Nytt *projekt* i teamet Effektiv (`effektiv1`), eller vidareutveckling av projektet `vindkraft`.

Det här är en **önskan framåt**, inte något som är byggt än. Befintlig kalkyl ska inte rivas förrän Kent uttryckligen ber om en ny version (befintlig mapp eller ny `..._verX`). Vad Functions, API-yta och liknande faktiskt *är* förklaras i [Vercel-teknik.md](Vercel-teknik.md).

<a id="Forslag_pa_promt"></a>

### Förslag på prompt (för en Vercel-anpassad, smidigare kalkyl) [#](#Forslag_pa_promt)

Kopiera och anpassa vid behov. Prompten är skriven så att agenten ska *fråga* innan den kodar, och inte blanda ihop GitHub Pages-programmet med en rikare Vercel-app.

```text
Mål
Gör vindkraftskalkylen lättare och smidigare att använda, genom att koda en
version som är anpassad för att deployas på Vercel – inte bara flytta samma
statiska filer. Behåll beräkningslogiken och de fem perspektiven. Gör inte
om allt i React om det inte behövs för målet.

Utgångspunkt (ändra inte förrän jag sagt ja)
- Programversion (GitHub Pages):
  https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html
- Nuvarande Vercel-app (samma statiska kod):
  https://vindkraft-rosy.vercel.app
- Lokal mapp: vindkraftskalkyl_Vercel/
- Vercel-team: Effektiv (slug effektiv1). Nytt blir ett projekt i SAMMA team,
  inte ett nytt team.

Innan du kodar – fråga mig
1. Ska den befintliga mappen vindkraftskalkyl_Vercel/ uppdateras, eller ska en
   ny mapp skapas (t.ex. vindkraftskalkyl_Vercel_ver2/)?
2. Vilka tre förbättringar ska med i första steget? Föreslå en kort lista med
   (A) det som ger mest nytta för användaren och (B) det som faktiskt kräver
   Vercel. Jag väljer.
3. Vilken officiell källa ska användas för ev. aktuellt elpris? Verifiera
   länken innan du lovar den.

Så ska appen kännas
- Fortfarande en kalkyl man förstår: gula indatafält, resultat som räknas om
  direkt, flikar för de fem perspektiven, jämförelsetabell Senaste / Tidigare /
  Förändring.
- Smidigare än idag, t.ex. minst tre av:
  • spara/återställ scenario (minst i webbläsaren; gärna även via länk)
  • förval / startlägen (t.ex. SE4, 5 verk) med en klick
  • hämta ett aktuellt elpris via Vercel Function (valfritt att använda)
  • dela resultatet som länk
  • tydligare första vy på mobil (indata inte i vägen för nyckeltalen)
- Om ett API-anrop misslyckas ska kalkylen ändå fungera med manuellt inskrivet
  elpris – ingen död sida.

Teknik (anpassad för Vercel, men enkel)
- HTML, CSS och JavaScript i separata filer. Kommentera på svenska.
- Indatafält har gul bakgrund.
- Ingen React om du inte kan visa att det behövs för just de valda
  funktionerna. Föredra vanilla JS + eventuella Vercel Functions i /api/.
- Hemligheter bara i Vercel environment variables, aldrig i klientkoden.
- Relativa sökvägar. Om Vite används: base: './' och build.outDir = 'dist',
  emptyOutDir: true.
- Rör inte beräkningsformlerna utan att förklara varför.
- GitHub-hörna + Teknik-modal. GitHub-länken ska peka på den mapp som gäller
  för Vercel-versionen. Modalens originalprompt ska vara oförändrad om du
  bygger vidare på befintlig sida; lägg nya saker i en egen sektion.
- Kent committar och pushar själv, om han inte uttryckligen ber om annat.
  PowerShell: använd inte && mellan kommandon.

Leverans
1. Kort plan (vad som blir bättre för användaren, vad som är Vercel-specifikt).
2. Kod i överenskommen mapp.
3. Verifiera i webbläsaren: kalkyl + minst en Vercel-funktion (eller förklara
   vad som inte kunde verifieras lokalt).
4. Uppdatera README med hur man deployar till teamet effektiv1.
```

**Kan samma prompt köras i Claude, Cursor och Grok?** Ja som *text* – den är vanlig svenska, inte bunten till ett enda verktyg. **Utförandet** skiljer sig: Cursor (oavsett modell) kan skriva i repot och verifiera i webbläsaren; Claude.ai och Grok på webben kan skriva kodförslag som du klistrar in. Full förklaring: [Vercel-teknik.md – Prompten i Claude, Cursor och Grok](Vercel-teknik.md#Prompten-i-Claude-Cursor-och-Grok).

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
├── Vercel-teknik.md   ← Functions, API-yta, vad ver2 kan som statisk HTML inte kan
├── index.html         ← startsidan
├── stil.css
├── berakningar.js
└── Bilder/
    └── Team_effektiv1_i_Vercel.jpg
```

Ingen build behövs. Vercel serverar filerna direkt.

---

## GitHub-länk och Teknik-modal

Gjort (2026-09-14). GitHub-länken nere till vänster pekar på:
https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel

Teknik-modalen nämner att det finns både en programversion (GitHub Pages) och en appversion (Vercel), och förklarar kort fördelen med den automatiska deployen.

---

## Framåtblick

Nya modeller i detta repo bör följa samma dual-mönster. Mönstret är dokumenterat i:
- denna README
- `CLAUDE.md`
- skill:et `.cursor/skills/vercel-github-pages-dual-publicering/`

En *rikare* Vercel-app finns nu i [`../vindkraftskalkyl_Vercel_ver2/`](../vindkraftskalkyl_Vercel_ver2/)
(Functions för elpris och delningsscenario). Den här statiska mappen och
https://vindkraft-rosy.vercel.app ska ligga kvar som programtvilling till GitHub Pages.

---

## Källor

Vercel (2026a) *Account Management.* Tillgänglig: https://vercel.com/docs/accounts (hämtad 14 september 2026). *(Vercels översikt över konton och team: ett team är utrymmet där projekt och resurser samlas, även på Hobby-planen.)*

Vercel (2026b) *Projects overview.* Tillgänglig: https://vercel.com/docs/projects/overview (hämtad 14 september 2026). *(Definierar projekt som en app kopplad till ett Git-repo, med flera deployments under samma projekt.)*

Vercel (2026c) *Hobby Plan.* Tillgänglig: https://vercel.com/docs/plans/hobby (hämtad 14 september 2026). *(Hobby tillåter upp till 200 projekt i ett team.)*

Vercel (2026d) *Limits.* Tillgänglig: https://vercel.com/docs/limits (hämtad 14 september 2026). *(Hobby kan kopplas till Git-repon under ett personligt konto, inte under en GitHub-organisation.)*

Vercel (2026e) *Getting started with Vercel.* Tillgänglig: https://vercel.com/docs/getting-started-with-vercel/import (hämtad 14 september 2026). *(Hur ett GitHub-repo importeras som nytt Vercel-projekt från dashboarden.)*

Vercel (2026f) *Vercel Functions.* Tillgänglig: https://vercel.com/docs/functions (hämtad 14 september 2026). *(Serverkod som körs vid behov – det GitHub Pages saknar, och det som kan göra en Vercel-app mer än en statisk kalkyl.)*

---

*Uppdaterad 2026-09-14 – djuplänkar (#-ankare), Vercel-teknik.md och hur prompten fungerar i Claude, Cursor och Grok.*
