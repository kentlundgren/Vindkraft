# Vindkraftskalkyl – Vercel ver2

Live: [https://vindkraft-ver2.vercel.app](https://vindkraft-ver2.vercel.app)  
Vercel-projekt: **vindkraft-ver2** i teamet **Effektiv** (`effektiv1`)

Den här mappen är **inte** samma statiska tvilling som GitHub Pages. Det är kalkylen
plus två valfria Vercel Functions: hämta spotpris och spara/dela scenario.

Programversionen (oförändrad) ligger kvar i [`../vindkraftskalkyl/`](../vindkraftskalkyl/).
Den statiska Vercel-tvillingen ligger kvar i [`../vindkraftskalkyl_Vercel/`](../vindkraftskalkyl_Vercel/)
och på https://vindkraft-rosy.vercel.app

**Vad som är unikt med Vercel-teknik här** (Functions, hemligheter, Git→deploy)
och hur projektet skapades, med skärmbilder:
[Vercel-teknik-ver2.md](Vercel-teknik-ver2.md).

## 🗂️ Lokalt repo

Repo-rot lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

Den här mappen lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel_ver2`

På GitHub: <https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel_ver2>

---

<a id="Vad-som-blir-battre"></a>

## Vad som blir bättre för användaren [#](#Vad-som-blir-battre)

Kalkylen känns som förut: gula indatafält, resultat direkt, fem perspektiv,
jämförelsetabell Senaste / Tidigare / Förändring. Formlerna är desamma.

Tillval (kalkylen dör inte om de strular):

1. **Hämta aktuellt spotpris** – fyller *Spotpris hushållsel* med dygnssnitt
   för valt elområde. Kryssrutan “Använd också som intäkt för elen” är av
   medvetet, för att dagens spot inte är ett 25-årsantagande.
2. **Spara och kopiera länk** – någon annan kan öppna samma indata.
3. **Kort kod** (`?s=abc123`) om Upstash Redis är kopplat; annars en längre
   men fungerande länk (`?t=...`).

---

<a id="Vad-som-ar-Vercel-specifikt"></a>

## Vad som är Vercel-specifikt [#](#Vad-som-ar-Vercel-specifikt)

| Del | Varför Vercel behövs |
|-----|----------------------|
| `GET /api/elpris` | Hemlig ENTSO-E-nyckel får inte ligga i `berakningar.js`. GitHub Pages kan inte gömma den. |
| `POST/GET /api/scenario` | Validerar fält på servern och kan spara en kort kod i Redis. |
| Environment variables | `ENTSOE_SECURITY_TOKEN` (obligatorisk för elpris). Ev. Upstash för korta koder. |

Utan Functions är kalkylen fortfarande en statisk HTML-sida. Knappen visar då ett
fel och du skriver in priset manuellt.

---

<a id="Deploy-till-effektiv1"></a>

## Deploy till teamet Effektiv (`effektiv1`) [#](#Deploy-till-effektiv1)

Det här ska vara ett **nytt Vercel-projekt i samma team**, inte ett nytt team
och inte en ersättning för projektet `vindkraft` (som pekar på
`vindkraftskalkyl_Vercel`). Team vs projekt förklaras i
[vindkraftskalkyl_Vercel/README.md](../vindkraftskalkyl_Vercel/README.md).

Kent committar och pushar själv. Därefter:

1. Öppna [https://vercel.com/effektiv1](https://vercel.com/effektiv1). Kontrollera att
   **Effektiv** är valt uppe till vänster.
2. **Add New** → **Project**.
3. Importa GitHub-repot [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft).
4. Sätt **Root Directory** till `vindkraftskalkyl_Vercel_ver2`.
5. Framework: **Other** (ingen Vite/React-build). `vercel.json` sätter `framework: null`.
6. Environment variables (Production + Preview):
   - `ENTSOE_SECURITY_TOKEN` – se [Elpriskälla](#Elpriskalla)
7. **Deploy**.
8. Valfritt för korta koder: Storage → skapa **Upstash Redis** i projektet.
   Vercel fyller i `UPSTASH_REDIS_REST_URL` och `UPSTASH_REDIS_REST_TOKEN`.

Efter första deployen: redigera i Cursor → Kent pushar → projektet bygger om.

Skärmbilder av just den här första gången (New Project, Congratulations,
dashboard, live-sidan) finns i
[Hur man arbetar med Vercel](Vercel-teknik-ver2.md#Hur-man-arbetar-med-Vercel).

Ingen hemlighet i Git. `.gitignore` i den här mappen utelämnar `.env`, `.vercel`
och `node_modules` just därför – lokala tokens och CLI-cache ska inte publiceras.

---

<a id="Elpriskalla"></a>

## Elpriskälla (ENTSO-E) [#](#Elpriskalla)

Knappen hämtar **dagen-före-pris (spot)**, dygnssnitt, för SE1–SE4.

- Marknadsplatsen är Nord Pool. Energimarknadsinspektionen pekar dit för
  aktuellt spotpris:
  https://data.nordpoolgroup.com/auction/day-ahead/prices
  ([Ei, 2026](https://ei.se/konsument/el/elmarknaden/fragor-och-svar-om-elmarknaden)).
  Nord Pools eget API är abonnemang och används inte här.
- **Maskinläsbar officiell källa i appen:** ENTSO-E Transparency Platform
  (day-ahead prices, dokumenttyp A44), som Ei också hänvisar till för historik.
  https://transparency.entsoe.eu/
- Omräkning EUR/MWh → kr/kWh med Riksbankens serie `SEKEURPMI`
  (verifierat anrop 14 september 2026 gav 11,281 SEK/EUR):
  https://api.riksbank.se/swea/v1/Observations/Latest/SEKEURPMI

Svenska kraftnäts öppna dataset för dagen-före-priser
(https://data.svk.se/sv/dataset/market_data_day_ahead_area_prices)
**används inte**: sidan säger att data inte uppdateras efter 1 juli 2026.

### Token till ENTSO-E

1. Registrera konto på https://transparency.entsoe.eu/
2. Mejla transparency@entsoe.eu med ämnet `RESTful API access` och den
   registrerade e-postadressen i kroppen.
3. När tillgången är beviljad: My Account → skapa security token.
4. Klistra in token i Vercel som `ENTSOE_SECURITY_TOKEN` (aldrig i koden).

Utan token svarar `/api/elpris` med ett tydligt fel. Kalkylen räknar ändå.

---

## Filstruktur

```
vindkraftskalkyl_Vercel_ver2/
├── README.md
├── Vercel-teknik-ver2.md ← vad som är unikt med Vercel, med skärmbilder
├── .gitignore
├── package.json          ← "type": "module", inga runtime-beroenden
├── vercel.json
├── index.html
├── stil.css
├── berakningar.js        ← samma formler som programversionen
├── lib/falt.js
├── Bilder/               ← skärmbilder från första deployen
├── api/
│   ├── elpris.js         ← GET
│   └── scenario.js       ← GET + POST
```

Ingen Vite, ingen React, inga relativa sökvägar som kräver `base: './'`-build.
HTML länkar `stil.css` och `berakningar.js` relativt. API-anropen går till
`./api/elpris` och `./api/scenario`.

---

## Köra lokalt

Statiska filer (kalkylen): öppna `index.html` eller en enkel http-server i mappen.

Functions: `npx vercel dev` i den här mappen (inloggning till Vercel, och
`.env.local` med `ENTSOE_SECURITY_TOKEN` om du vill testa skarpt elpris).
Utan `vercel dev` blir knapparna nätfel – det är förväntat, inte en död kalkyl.

---

## Källor

Energimarknadsinspektionen (2026) *Frågor och svar om elmarknaden.* Tillgänglig: https://ei.se/konsument/el/elmarknaden/fragor-och-svar-om-elmarknaden (hämtad 14 september 2026). *(Ei pekar på Nord Pools dataportal för aktuellt spotpris utan skatt och avgifter.)*

ENTSO-E (2026) *Transparency Platform.* Tillgänglig: https://transparency.entsoe.eu/ (hämtad 14 september 2026). *(Officiell EU-publicering av dagen-före-priser; HTTP 200 verifierad 14 september 2026. API-token krävs.)*

Nord Pool (2026) *Day-ahead prices – Data Portal.* Tillgänglig: https://data.nordpoolgroup.com/auction/day-ahead/prices (hämtad 14 september 2026). *(Marknadsplatsens egen visning av area prices; HTTP 200 verifierad. Deras API är betalt och används inte i appen.)*

Sveriges riksbank (2026) *Hämta räntor och valutakurser via API.* Tillgänglig: https://www.riksbank.se/sv/statistik/rantor-och-valutakurser/hamta-rantor-och-valutakurser-via-api/ (hämtad 14 september 2026). *(Öppet REST-API; serien SEKEURPMI ger SEK per euro för omräkning från ENTSO-E.)*

Svenska kraftnät (2026) *Dagen före-priser för system och per elområde.* Tillgänglig: https://data.svk.se/sv/dataset/market_data_day_ahead_area_prices/resource/cf392ef3-7345-4e98-970e-83088c185570 (hämtad 14 september 2026). *(Officiell öppen data, men resursen anger att den inte uppdateras efter 1 juli 2026 – därför inte använd som live-källa.)*

Vercel (2026) *Vercel Functions.* Tillgänglig: https://vercel.com/docs/functions (hämtad 14 september 2026). *(Serverkod vid behov – det GitHub Pages saknar.)*

---

*Uppdaterad 2026-09-14 – första ver2 med /api/elpris och /api/scenario.*
