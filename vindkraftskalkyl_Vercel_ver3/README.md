# Vindkraftskalkyl – Vercel ver3

**Live: <https://vindkraft-ver3.vercel.app>**  
Vercel-projekt: **vindkraft-ver3** i teamet **Effektiv** (`effektiv1`), Root Directory `vindkraftskalkyl_Vercel_ver3` — se [PRD, delfråga 4d](PRD_vindkraftskalkyl_vercel_ver3.md#4d-Vercel-projekt). Varje push till `main` deployar om appen automatiskt.

| Sida | Adress |
|------|--------|
| Kalkylen | <https://vindkraft-ver3.vercel.app/kalkyl> |
| Närboende (NU20) | <https://vindkraft-ver3.vercel.app/kalkyl/narboende> |
| Om kalkylen | <https://vindkraft-ver3.vercel.app/om> |

Next.js (App Router) 16.3.5 är uppsatt i den här mappen. Starta lokalt med `npm run dev` (port 3000). Sidorna `/`, `/om`, `/kalkyl` och de fem perspektiven finns.

Beräkningen är portad från ver2 och ligger i `lib/calculations.ts`. `npm test` jämför den mot ver2:s egna tal.

`/kalkyl` har alla 33 gula indatafält, nyckeltalen (LCOE, överskott, payback, NPV, IRR, produktion), jämförelsetabellen Senaste/Tidigare/Förändring och de fem perspektiven. Allt räknas i webbläsaren — inget serveranrop och ingen API-nyckel behövs.

`GET /api/elpris?omrade=SE4&period=manad` hämtar spotpris från ENTSO-E (dagen-före, A44) och räknar om till kr/kWh med Riksbankens SEK/EUR. `period` kan vara `dygn`, `manad` (senaste hela kalendermånad) eller `ar` (senaste hela kalenderår). Svaret cachas sex timmar per elområde och period om Redis finns. Priset visas som information och fylls bara i "Spotpris hushållsel" efter ett klick — "Intäkt för elen" rörs aldrig av hämtningen.

För att testa hämtningen lokalt: lägg `ENTSOE_SECURITY_TOKEN=…` i `.env.local` (den filen är ignorerad av Git). Utan nyckel svarar rutten 503 med en begriplig text och kalkylen fungerar som vanligt med manuellt pris. Så skaffar man nyckeln: [Hur-skaffa-nyckel-hos-ENTSO-E.md](../vindkraftskalkyl_Vercel_ver2/Hur-skaffa-nyckel-hos-ENTSO-E.md).

Kalkylen går att dela som länk. `POST /api/scenario` packar de gula fälten och ger antingen en kort kod (`?s=`, sparad i Redis i 30 dagar) eller en lång token (`?t=`, hela fältbilden gzippad i adressen, ingen tidsgräns). Utan Redis blir det alltid en lång länk — inget går sönder. Länken behåller det perspektiv du står på, så `/kalkyl/narboende?s=…` öppnar närboendevyn med rätt indata. Nyckeltalen delas aldrig; de räknas om hos mottagaren.

När länken klistras in någonstans ritar servern en förhandsvisningsbild (1200×630) med kalkylens tal: LCOE, payback och nuvärde — eller NU20-ersättningen per bostad på `/kalkyl/narboende`. En vanlig länk får en standardbild som ritas vid bygget; en delad länk får sina egna siffror via `/api/og`. Bildmotorn är `lib/og.tsx`, och den räknar med samma `beraknaAllt` som gränssnittet.

Varje perspektiv har en egen adress som går att länka till: `/kalkyl/investerare`, `/kalkyl/markagare`, `/kalkyl/kommun`, `/kalkyl/andelsagare` och `/kalkyl/narboende`. Ver2:s flikar är alltså ersatta av riktiga URL:er. Indata följer med när man byter perspektiv, eftersom fältens state ligger i den delade layouten `app/kalkyl/layout.tsx`.

**Krav:** [PRD_vindkraftskalkyl_vercel_ver3.md](PRD_vindkraftskalkyl_vercel_ver3.md) (fryst v1.14)  
**Ritning:** [SPEC.md](SPEC.md)  
**Teknik på 15-åringssvenska:** [Vercel-teknik-ver3.md](Vercel-teknik-ver3.md)

De tre tidigare lagren ligger kvar oförändrade:

| Lager | Adress |
|-------|--------|
| Programversion (GitHub Pages) | [vindkraftskalkyl.html](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html) |
| Statisk Vercel-tvilling | [vindkraft-rosy.vercel.app](https://vindkraft-rosy.vercel.app) |
| Vercel ver2 (HTML + Functions) | [vindkraft-ver2.vercel.app](https://vindkraft-ver2.vercel.app) |

## 🗂️ Lokalt repo

Repo-rot lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

Den här mappen lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel_ver3`

På GitHub: <https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel_ver3>
*(länken blir giltig först när mappen committas och pushas.)*

---

## Kvar att sätta i Vercel

Appen är deployad och räknar, men två frivilliga inställningar saknas ännu i projektet. Båda kan läggas till när som helst utan kodändring:

| Inställning | Vad den ger | Utan den |
|-------------|-------------|----------|
| `ENTSOE_SECURITY_TOKEN` | Knappen "Hämta månads- och årsmedel" | Rutten svarar 503 med en förklarande text; kalkylen fungerar med manuellt pris |
| Upstash Redis (Storage) | Korta delningslänkar `?s=` i 30 dagar, plus cache för elpriset | Alla delningar blir långa `?t=`-länkar, som fungerar men är otympligare |

---

*Uppdaterad 2026-09-16: appen är live på <https://vindkraft-ver3.vercel.app>. Hela v1 enligt SPEC.md är byggd och verifierad i produktion — kalkyl, perspektiv-URL:er, elpris-felväg, delningslänkar och OG-bild.*
