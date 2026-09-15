# Vindkraftskalkyl – Vercel ver3

Live: *ingen ännu – appen är inte deployad.*  
Tänkt Vercel-projekt: **vindkraft-ver3** i teamet **Effektiv** (`effektiv1`) — se [PRD, delfråga 4d](PRD_vindkraftskalkyl_vercel_ver3.md#4d-Vercel-projekt).

Next.js (App Router) 16.3.5 är uppsatt i den här mappen. Starta lokalt med `npm run dev` (port 3000). Sidorna `/`, `/om`, `/kalkyl` och de fem perspektiven finns.

Beräkningen är portad från ver2 och ligger i `lib/calculations.ts`. `npm test` jämför den mot ver2:s egna tal.

`/kalkyl` har alla 33 gula indatafält, nyckeltalen (LCOE, överskott, payback, NPV, IRR, produktion), jämförelsetabellen Senaste/Tidigare/Förändring och de fem perspektiven. Allt räknas i webbläsaren — inget serveranrop och ingen API-nyckel behövs.

`GET /api/elpris?omrade=SE4&period=manad` hämtar spotpris från ENTSO-E (dagen-före, A44) och räknar om till kr/kWh med Riksbankens SEK/EUR. `period` kan vara `dygn`, `manad` (senaste hela kalendermånad) eller `ar` (senaste hela kalenderår). Svaret cachas sex timmar per elområde och period om Redis finns. Priset visas som information och fylls bara i "Spotpris hushållsel" efter ett klick — "Intäkt för elen" rörs aldrig av hämtningen.

För att testa hämtningen lokalt: lägg `ENTSOE_SECURITY_TOKEN=…` i `.env.local` (den filen är ignorerad av Git). Utan nyckel svarar rutten 503 med en begriplig text och kalkylen fungerar som vanligt med manuellt pris. Så skaffar man nyckeln: [Hur-skaffa-nyckel-hos-ENTSO-E.md](../vindkraftskalkyl_Vercel_ver2/Hur-skaffa-nyckel-hos-ENTSO-E.md).

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

*Uppdaterad 2026-09-15: Next.js-stommen ligger i mappen. Kalkylen byggs enligt SPEC.md.*
