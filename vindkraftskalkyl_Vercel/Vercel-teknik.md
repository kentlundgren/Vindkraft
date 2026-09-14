# Vercel-teknik – vad en `ver2` kan som vanlig HTML/CSS/JS inte kan

Den här filen förklarar **Vercel-teknik** i förhållande till vindkraftskalkylen. Den nuvarande appen
([GitHub Pages](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html)
och [vindkraft-rosy.vercel.app](https://vindkraft-rosy.vercel.app)) är tre statiska filer. Allt räknas i webbläsaren. Det är medvetet enkelt.

En tänkt **`vindkraftskalkyl_Vercel_ver2`** skulle *fortfarande* kunna ha HTML, CSS och JavaScript – men *dessutom* använda saker som GitHub Pages inte har. Då blir Vercel mer än en annan adress till samma kalkyl.

Se också README: [Kan Vercel göra kalkylen bättre](https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel#Kan-Vercel-gora-kalkylen-battre) och [förslag på prompt](https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel#Forslag_pa_promt).

## 🗂️ Lokalt repo

Repo-rot lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

Den här filen lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel\Vercel-teknik.md`

På GitHub: <https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel/Vercel-teknik.md>

---

<a id="Vad-statisk-kod-inte-kan"></a>

## Vad “normal” HTML, CSS och JS *inte* kan

I [programversionen](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html) händer tre saker:

1. Webbläsaren hämtar `vindkraftskalkyl.html`, `stil.css` och `berakningar.js`.
2. Användaren skriver indata.
3. JavaScript räknar och ritar resultatet **på användarens dator**.

Det går inte, utan att läcka hemligheter eller lita på någon annans server, att:

- Gömma en API-nyckel (allt i `.js` kan läsas med “visa källa”).
- Hämta data från en källa som **blockerar anrop direkt från webbläsaren** (CORS), eller som kräver en hemlig nyckel.
- Spara ett scenario så att *en annan person på en annan dator* kan öppna samma kalkyl-läge, om du inte bara klistrar allt i URL:en.
- Köra kod på en tidpunkt (“varje morgon, hämta elpris”) oberoende av om någon har sidan öppen.
- Generera en PDF eller en tyngre fil på servern.

GitHub Pages är **bara filer**. Ingen egen backend.

---

<a id="Vercel-Functions"></a>

## Vercel Functions – “en liten server”

En **Vercel Function** är en bit serverkod som Vercel kör **när någon anropar den** – till exempel när kalkylen ber om `/api/elpris`. Du installerar ingen virtuell maskin och håller ingen server på dygnet. Vercel startar funktionen vid behov och stänger ner den när det är tyst ([Vercel, 2026f](https://vercel.com/docs/functions)).

Tänk: webbläsaren får fortfarande HTML/CSS/JS. Men *vissa* knappar får lov att fråga servern:

```
Webbläsare (kalkylen)  →  GET /api/elpris?omrade=SE4  →  Vercel Function
                                                      →  hämtar data med ev. hemlig nyckel
                                                      →  skickar tillbaka ett tal till kalkylen
```

I en `ver2` kan funktionen ligga som t.ex. `api/elpris.js` i projektmappen. Adressen blir då något i stil med `https://din-app.vercel.app/api/elpris`.

**Vad det kan åstadkomma i en vindkraftskalkyl**

- Hämta ett aktuellt eller typiskt elpris från en officiell källa *utan* att lägga nyckeln i `berakningar.js`.
- Kontrollera eller avrunda svaret på servern, så att klienten bara får ett rent tal plus källa och datum.
- Senare: en kort förklaringstext via en språkmodell, där API-nyckeln stannar på servern.

**Vad det *inte* är:** en ersättning för själva LCOE/NPV-räkningen. Den bör ligga kvar i webbläsaren så kalkylen är snabb även om API:t strular.

---

<a id="Tunn-API-yta"></a>

## Tunn API-yta (`/api/...`)

“Tunn API-yta” är inte en separat Vercel-produkt. Det är ett **sätt att organisera** Functions: några få, tydliga adresser som kalkylen får anropa.

Exempel för en `ver2`:

| Adress | Gör | Kan statisk HTML/JS göra det ensam? |
|--------|-----|--------------------------------------|
| `/api/elpris` | Returnerar ett elpris + källa | Nej, inte säkert/hemligt mot en skyddad källa |
| `/api/scenario` | Sparar eller hämtar ett indata-set | Bara delvis (localStorage / lång URL) |
| `/api/export` | Bygger PDF eller CSV på servern | Svårt / tungt i ren webbläsare |

“Tunn” betyder: **få endpoints, en uppgift var**, ingen stor egen webbserver. Kalkylens gränssnitt förblir HTML/CSS/JS.

---

<a id="Environment-variables"></a>

## Environment variables – hemligheter utanför koden

På Vercel kan du lagra nycklar i projektets **Environment Variables** (dashboard eller `vercel env`). De läses av Functions vid körning. De ska **inte** checkas in i Git ([Vercel, 2026g](https://vercel.com/docs/environment-variables)).

I en statisk `.js`-fil på GitHub Pages finns inget motsvarande: allt som webbläsaren behöver är synligt.

---

<a id="Annat-Vercel-kan"></a>

## Andra Vercel-delar som kan spela roll i en `ver2`

Dessa är *möjliga* byggklossar – inte ett krav att använda allt på en gång.

| Teknik | Vad det är | Exempel i kalkylen |
|--------|------------|--------------------|
| **CDN** | Filerna serveras från många noder nära användaren | Snabbare sidladdning än en enda GitHub Pages-nod, i många fall |
| **Preview-URL** | Varje Git-branch kan få en egen webbadress | Testa `ver2` utan att röra production |
| **Cron Jobs** | Vercel anropar en Function på schema | T.ex. förvärma/elpris-cache (om en källa tillåter det) |
| **Blob / databas** (Marketplace) | Lagring av filer eller rader | Sparade scenarion med kort kod (`abc12`) som en kollega kan öppna |
| **Auth** (tillägg) | Inloggning | Bara om kalkylen en dag ska ha *privata* projekt – överkurs nu |

Hobby-teamet Effektiv (`effektiv1`) räcker för att *börja* med Functions. En `ver2` ska ligga som **nytt projekt eller ny mapp i samma team**, inte som ett nytt team.

---

<a id="Vad-ver2-kan-asta"></a>

## Vad `vindkraftskalkyl_Vercel_ver2` kan åstadkomma – konkret

Jämfört med [den nuvarande kalkylen](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html):

**Fortsätt göra i webbläsaren (som idag)**  
Indata, LCOE, payback, NPV, IRR, fem perspektiv, jämförelsetabell, gula fält.

**Lägg till via Vercel, om Kent väljer det i första steget**

1. Knapp “Hämta elpris” som fyller fältet via `/api/elpris` (källa verifieras *innan* kodning).
2. “Kopiera delningslänk” – antingen korta URL-parametrar (går även statiskt) eller en server-sparad kod (kräver lagring).
3. Förval (SE4 / 5 verk) – det är mest UX och *kräver inte* Functions, men hör hemma i samma `ver2` om det gör kalkylen smidigare.
4. Om API:t misslyckas: kalkylen fungerar ändå med manuellt pris.

`ver2` är inte byggd än. Befintlig mapp ska inte rivas förrän Kent säger vilken väg: uppdatera `vindkraftskalkyl_Vercel/` eller ny mapp `vindkraftskalkyl_Vercel_ver2/`.

---

<a id="Prompten-i-Claude-Cursor-och-Grok"></a>

## Prompten i Claude, Cursor och Grok [#](#Prompten-i-Claude-Cursor-och-Grok)

Prompten i README
([#Forslag_pa_promt](https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel#Forslag_pa_promt))
är **vanlig instruktionstext**. Den är inte låst till ett företag eller ett chattfönster. Du kan klistra in den i Claude, i Cursor och i Grok.

Det som skiljer är **vad verktyget kan göra efteråt**, inte om prompten “förstås”.

| Var du klistrar in den | Fungerar prompten? | Vad du kan förvänta dig | Behövs anpassning? |
|------------------------|--------------------|-------------------------|---------------------|
| **Cursor** (Claude, Grok eller annan modell i editorn) | Ja | Agenten kan läsa repot, skapa `api/`-filer, följa PowerShell-regeln och (om webbläsarverktyg finns) klicka i kalkylen. Vercel-plugin/MCP kan lista team och projekt. | **Kör som den är.** Bäst passform. |
| **Claude Code** (terminal) | Ja | Kan skriva filer om rätt mapp är öppen. Commit/push bara om du ber om det. Ingen Cursor-webbläsare. | Lägg till en rad: *skriv filerna i den öppna mappen; verifiera med lokal server om webbläsare saknas.* |
| **claude.ai** (webbchatten) | Delvis | Kan skriva HTML/JS/Function-utkast. Kan **inte** själv pusha till GitHub eller deploya till teamet `effektiv1`. | Lägg till: *lämna fullständiga filinnehåll som jag klistrar in i Cursor. Deployar gör jag själv.* |
| **Claude Cowork** | Delvis / ja | Om Cowork har mappåtkomst liknar det mer Claude Code. | Samma som Claude Code om mappen är kopplad; annars som claude.ai. |
| **Grok på grok.com / X** | Delvis | Bra på att diskutera och skriva kodblock. Ingen tillgång till ditt lokala repo eller Vercel-konto. | Samma tillägg som claude.ai: *kod att klistra in, ingen deploy.* |
| **Grok inuti Cursor** | Ja | Samma som Cursor-raden ovan – det är editorn som ger filer och Git, inte namnet “Grok”. | **Kör som den är.** |

**Kort tumregel**

- Promptens *krav* (fråga innan kod, gul indata, Functions i `/api/`, inget nytt Vercel-team, Kent committar själv) ska vara **desamma** överallt.
- Promptens *leveransmening* (“verifiera i webbläsaren”, “uppdatera README i repot”) gäller fullt ut bara där agenten har **fil- och webbläsaråtkomst** – i praktiken **Cursor**.
- I Claude.ai och Grok på webben: be om filer + en checklista som *du* utför i Cursor (spara, committa, pusha, kolla [https://vercel.com/effektiv1](https://vercel.com/effektiv1)).

Du behöver alltså **inte tre olika promptar**. En källprompt i README, plus en mening om *var* den körs, räcker.

---

## Källor

Vercel (2026f) *Vercel Functions.* Tillgänglig: https://vercel.com/docs/functions (hämtad 14 september 2026). *(Förklarar request-driven serverkod utan egen server – grunden för en tunn API-yta.)*

Vercel (2026g) *Environment Variables.* Tillgänglig: https://vercel.com/docs/environment-variables (hämtad 14 september 2026). *(Hemligheter som Functions kan läsa, men som inte ska ligga i klientens JavaScript.)*

---

*Skapad 2026-09-14.*
