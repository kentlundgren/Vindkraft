# SPEC – Vindkraftskalkyl Vercel ver3

**Namn:** SPEC.md  
**Plats:** `vindkraftskalkyl_Vercel_ver3/SPEC.md`  
**Skapad:** 2026-09-15  
**Gäller:** fryst [PRD v1.14](PRD_vindkraftskalkyl_vercel_ver3.md)  
**Status:** Stomme, `/` `/om` och `/kalkyl` med alla 33 gula fält, nyckeltal, jämförelsetabell och de fem perspektiven. Paritetstestet är grönt. Kvar: perspektiv-URL:er, Route Handlers (elpris, scenario) och OG-bild.

Det här dokumentet är agentens ritning: *exakt hur*, inte *vad och varför*. Vad och varför står i PRD:n. Gissa inte luckor — om något saknas här, fråga Kent.

Lokalt: `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel_ver3`

---

## 1. Icke-mål (upprepat så koden inte glider)

- Inte ersätta Pages, rosy eller ver2.
- Inte dual-publicera samma Next.js-build till GitHub Pages.
- Inte ny ekonomisk modell, nya perspektiv eller nya LCOE-formler.
- Inte Auth, AI-chatt i appen, Blob, Postgres, PDF, WebSockets.
- Inte `runtime = 'edge'`.
- Inte commit/push. Inte skapa Vercel-projektet.
- Inte tyst skriva över gula 25-årsfält med hämtat spot.

---

## 2. Stack (låst)

| Val | Krav |
|-----|------|
| Ramverk | Next.js **App Router** (mappen `app/`). Inte Pages Router. |
| Språk | TypeScript |
| CSS | Tailwind CSS |
| Pakethanterare | npm |
| Katalog | Ingen `src/`-mapp. `app/` ligger i Root Directory. |
| Alias | `@/*` → projektroten |
| Functions | Fluid Compute default. Route Handlers = Web `Request`/`Response`. |
| Beräkning | `lib/calculations.ts` — ingen formel i React-komponenter. |
| Client | `'use client'` bara där state, events eller `window` behövs. |

Vid `create-next-app`: slå upp aktuell 16.x via [https://nextjs.org/docs/llms.txt](https://nextjs.org/docs/llms.txt). Kryssa App Router, TypeScript, Tailwind, ESLint. Inte `src/`. Inte `next.config` som sätter `output: 'export'` (då dör Route Handlers).

PowerShell: inga `&&`. Ett kommando i taget. Kör scaffolding **i** `vindkraftskalkyl_Vercel_ver3` (mappen finns, den är inte tom — PRD/README/SPEC/.gitignore ligger där). Om CLI klagar på icke-tom mapp: initiera i mappen med flaggan som tillåter det, eller visa Kent felet innan du tvingar.

---

## 3. Filträd (visa detta innan mängder av filer skrivs)

Första live, efter scaffolding. Inga extra mappar “för att det kan behövas senare”.

```
vindkraftskalkyl_Vercel_ver3/
├── PRD_vindkraftskalkyl_vercel_ver3.md
├── SPEC.md                          ← den här filen
├── Vercel-teknik-ver3.md
├── README.md
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── app/
│   ├── layout.tsx                   ← skal, språk sv, GitHub-hörna + teknik-modal
│   ├── page.tsx                     ← /
│   ├── globals.css
│   ├── kalkyl/
│   │   ├── page.tsx                 ← /kalkyl
│   │   ├── opengraph-image.tsx      ← OG 1200×630, läser ?s= / ?t=
│   │   ├── investerare/page.tsx
│   │   ├── markagare/page.tsx
│   │   ├── kommun/page.tsx
│   │   ├── andelsagare/page.tsx
│   │   └── narboende/page.tsx
│   ├── om/page.tsx
│   └── api/
│       ├── elpris/route.ts
│       └── scenario/route.ts
├── components/
│   ├── CalculatorForm.tsx           ← 'use client'
│   ├── GithubHorna.tsx
│   └── TeknikModal.tsx
├── lib/
│   ├── calculations.ts              ← port av berakningar.js (ren TS, ingen DOM)
│   ├── falt.ts                      ← TILLATNA_FALT
│   ├── defaults.ts                  ← samma defaultvärden som ver2 index.html
│   ├── elpris.ts                    ← ENTSO-E A44 + Riksbanken + medel
│   └── scenario.ts                  ← packa/packaUpp + Redis vk:
└── public/                          ← ev. favicon; inga hemligheter
```

Perspektiv-sidorna ska **återanvända** `CalculatorForm` med prop `perspektiv`. Inte fem kopior av formlerna.

Tester: `lib/calculations.test.ts`, kört med Node:s inbyggda testlöpare (`npm test` → `node --experimental-strip-types --test`). Ingen ny testram installerad. Fixturen är tagen genom att köra ver2:s `berakningar.js` mot ver2:s defaults, inte handräknad.

Relativa importer inuti `lib/` skrivs med `.ts`-ändelse (och `allowImportingTsExtensions` i `tsconfig.json`), annars hittar Node:s testlöpare inte filerna. App-kod importerar som vanligt via `@/lib/...`.

---

## 4. Formelparitet

Port från `vindkraftskalkyl_Vercel_ver2/berakningar.js`. Samma tal, ny filform.

**Måste med, oförändrad logik:**

- `tal` / procent-omvandlingar som i `lasIndata` (bl.a. `/ 100` och `maxpromille / 1000`).
- `ELOMRADE_PRIS = { SE1: 0.30, SE2: 0.35, SE3: 0.55, SE4: 0.60 }` som **default** när elområde byts — inte som “hämtat spot”.
- Produktion år 1: `effekt × antalverk × 8760 × kapfaktor` (MWh).
- Investering: `specinv × 1000 × P_tot`.
- Annuitet, årsserier (elprisförändring, degradering), arrende procent/fast, kommun schablon, NU20 (5/9 verkshöjder, distansfaktor, 2,5 ‰), kassaflöde med nedmontering/restvärde sista året, LCOE, NPV, IRR, payback.
- Närboendeersättning är kostnad i investerarens kassaflöde.

**Får inte:**

- Räkna i API-routes.
- Byta 8760 mot 8784 “för att det är skottår” utan ny PRD.
- Införa tidsvägt LCOE eller annan diskontering än ver2.

`beraknaAllt` tar ett indataobjekt och returnerar ett resultatobjekt. UI anropar den. Tester anropar den. OG-bilden anropar den på servern.

DOM-funktioner i ver2 (`satt`, `skrivUt`, `kopplaFlikar`, `kopplaVercelVerktyg`) portas **inte**. De ersätts av React.

Jämförelsetabellen (`JAMFOR_NYCKELTAL`) ska finnas på `/kalkyl` med samma nyckeltal och decimaler som ver2.

---

## 5. Indatafält (id:n att porta)

Samma id:n som `vindkraftskalkyl_Vercel_ver2/lib/falt.js`. Inga nya id:n i v1. Inga borttagna.

```
elpris, elomrade, elprisforandring, kapfaktor, livslangd, effekt, antalverk,
verkshojd, degradering, specinv, kalkylranta, rorlig, fast, nedmontering,
restvarde, arrendemodell, arrendeprocent, arrendekrmw, kommunersattning,
co2faktor, co2varde, antalandelar, kwhperandel, insatsperandel, driftpaslag,
spotpris, elhandelspaslag, energiskatt, momssats, avstand, verkinom5,
antalbostader, maxpromille
```

**Gula fält:** varje indata (text, number, select) har tydligt gul bakgrund. Defaultvärden samma som ver2:s `index.html`. `elpris` och `spotpris` är **två fält**. Hämtat månads-/årsmedel får fyllas i `spotpris` bara efter medvetet klick, aldrig i `elpris` som default.

Validering vid scenario-API: sträng, trim, max 40 tecken, bara kända id:n (samma `rensaFalt` som ver2).

---

## 6. UI och sidor

Svenska i all synlig text. Ny app-känsla (Tailwind, kort). Inte ver2:s palett, utom gult på indata.

Stående par på **alla** sidor som publiceras: GitHub-hörna (länk till `https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel_ver3`) + teknik-modal (varför detta inte är Pages/rosy/ver2; fyra adresser när ver3 är live).

| URL | Krav |
|-----|------|
| `/` | Kort ingång. Länkar till `/kalkyl`, `/om`, Pages, rosy, ver2. Inte själva kalkylen. |
| `/kalkyl` | Alla fem nyckeltal i översikt. Gula fält. Räknar utan API. |
| `/kalkyl/investerare` … `/kalkyl/narboende` | Samma indata/state. Annan förgrund. `/kalkyl/narboende` är länken man skickar. |
| `/om` | Antaganden, källor, skillnad mot Pages/ver2. Server Component så långt det går. |

Delad indata via `?s=` (kort Redis-kod) eller `?t=` (lång token), samma semantik som ver2. Perspektiv-URL + query: `/kalkyl/narboende?s=……` ska fylla fälten och visa närboende-förgrunden.

Responsiv: desktop och smal viewport. Kalkylen ska gå att använda på telefon.

---

## 7. API-kontrakt

### 7.1 `GET /api/elpris`

Query:

| Parameter | Tillåtet | Default |
|-----------|----------|---------|
| `omrade` | `SE1` `SE2` `SE3` `SE4` | `SE4` |
| `period` | `dygn` `manad` `ar` | `dygn` |

Okänt område eller period → `400` `{ ok: false, fel }`.

**Lyckat svar (200):**

```json
{
  "ok": true,
  "omrade": "SE4",
  "period": "manad",
  "periodStart": "2026-08-01",
  "periodEnd": "2026-08-31",
  "antalPunkter": 2976,
  "prisEurMwh": 72.4,
  "prisKrKwh": 0.817,
  "sekPerEur": 11.281,
  "fxDatum": "2026-09-14",
  "kalla": {
    "namn": "ENTSO-E Transparency Platform",
    "dokument": "Day-ahead prices (A44)",
    "url": "https://transparency.entsoe.eu/"
  },
  "varning": "Spot utan skatt, nät och påslag. Inte ett 25-årsantagande."
}
```

`prisKrKwh` får vara `null` om Riksbanken strular; då finns `fxFel` och `prisEurMwh` ändå.

**Perioddefinition (låst här, inte öppet längre):**

| `period` | Fönster (tidszon Europe/Stockholm) |
|----------|--------------------------------------|
| `dygn` | Samma som ver2: försök idag, sen igår, sen imorgon — ett helt leveransdygn. |
| `manad` | Senaste **hela** kalendermånad. Inte innevarande ofullständiga månad. |
| `ar` | Senaste **hela** kalenderår. Inte rullande 12. Inte “hittills i år” i v1. |

**Aggregering v1:** enkelt medel av publicerade `price.amount`. Samma som ver2:s dygn. Om 15 min och 60 min blandas: ta serien med **flest punkter** (samma XML-regel som ver2). Inte tidsvägt medel i v1 — dokumentera begränsningen i teknik-modal.

**Valuta v1:** en kurs, senaste `SEKEURPMI`. Inte dagligt FX-medel.

**Källa:** `https://web-api.tp.entsoe.eu/api`, `documentType=A44`, samma `in_Domain`/`out_Domain` EIC som ver2:

```
SE1 10Y1001A1001A44P
SE2 10Y1001A1001A45N
SE3 10Y1001A1001A46L
SE4 10Y1001A1001A47J
```

Ett ENTSO-E-anrop per period (år ≤ 1 år, det är API-taket). Inte 365 dygnsklick.

**Cache (fas 1, utan cron):** Redis-nyckel `elpris:{omrade}:{period}` (gemener), JSON, TTL 6 timmar. Vid miss: ett hämt, skriv cache, svara. Om tio klienter kommer samtidigt: låt dem gärna köa bakom samma nyckel så gott det går; **förbjudet** är 50 parallella A44-anrop för samma nyckel från en sidladdning. UI ska anropa månad + år (två GET), inte spam.

**Cron (fas 2, inte v1):** nattlig UTC-jobb som fyller 4 områden × `manad`+`ar` (8 anrop). Samma nycklar. Bygg inte cron i första live.

**Fel:**

| Situation | HTTP | Effekt i UI |
|-----------|------|-------------|
| `ENTSOE_SECURITY_TOKEN` saknas | 503 | Tydlig text. Kalkylen räknar med manuellt pris. |
| Token avvisad (401/403) | 502 | Samma. Inte krasch. |
| Ingen data / Acknowledgement 999 | 502 | Samma. |
| ENTSO-E 429 | 502 | “För många anrop, försök senare.” Inte loop-retry i klienten. |
| Nätfel | 502 | Samma princip. |

UI visar månad och år som **information** bredvid gula fält. Knapp “Använd som spotpris hushållsel” är tillåten. Ingen knapp som tyst sätter `elpris` (intäkt/LCOE) utan extra bekräftelse.

### 7.2 `GET` / `POST /api/scenario`

Samma kontrakt som ver2 `api/scenario.js`:

- `POST { falt }` → `{ ok, id?, token, urlNyckel: 's'|'t', ttlDagar }`
- `GET ?id=` → Redis `vk:{id}`, TTL 30 dagar
- `GET ?token=` → gzip+base64url, max 4000 tecken
- Kort kod: 6 tecken alfabet `abcdefghjkmnpqrstuvwxyz23456789`
- Redis-env: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, fallback `KV_REST_API_URL` / `KV_REST_API_TOKEN` (samma fälla som i ver2)
- Utan Redis: POST lyckas ändå med `token` och `urlNyckel: 't'`. Ingen 500 bara för att Redis saknas.

Klient-URL: `?s=` för kort kod, `?t=` för token.

### 7.3 OG-bild (första live)

Fil: `app/kalkyl/opengraph-image.tsx` (gäller `/kalkyl` och, om Next.js ärver metadata, perspektiv-rutter — om arv inte räcker: samma bild under varje perspektiv-mapp eller en `opengraph-image` i `app/kalkyl/[...]/` enligt App Router-regler). Mål: **en** bildmotor, inte fem olika layoutkoder.

Teknik: `ImageResponse` / `next/og`. Storlek **1200×630**. Ingen klient-JS. Crawlers kör inte kalkylen.

Bilden ska innehålla minst:

- Rubrik “Vindkraftskalkyl”
- LCOE (kr/kWh, 2 decimaler)
- Payback (år, eller “> livslängd”)
- På närboende-URL: NU20 enskild kr/år

Talen räknas på servern från `?s=` / `?t=` + defaults. Saknas scenario → defaults. Saknas Redis för `?s=` → defaults + ingen krasch (HTTP 200 på sidan; bilden får visa defaults).

Det här är **inte** en chatt. Ingen in-app-meddelandeyta.

---

## 8. Environment variables

Aldrig i Git. Sätts i Vercel (Production + Preview + Development) och i `.env.local` lokalt (redan i `.gitignore`).

| Namn | Krävs för | Om saknas |
|------|-----------|-----------|
| `ENTSOE_SECURITY_TOKEN` | `/api/elpris` | 503, kalkylen lever |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | korta `?s=` | lång `?t=` fungerar |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | fallback, samma som ver2 | — |

Inga andra hemligheter i v1.

---

## 9. Acceptanskriterier (första live)

1. `npm run dev` startar. `/` `/kalkyl` `/om` svarar 200.
2. Tom kalkyl (defaults) visar LCOE, payback, NPV, IRR, produktion utan något API-anrop (nätverk till ENTSO-E avstängt eller token saknas).
3. Ändra ett gult fält → nyckeltal uppdateras. Fälten är visuellt gula.
4. Fem perspektiv-URL:er öppnar samma indata, annan förgrund. `/kalkyl/narboende` visar NU20 överst.
5. `GET /api/elpris?omrade=SE4&period=manad` och `period=ar` är implementerade (även om token saknas: 503 med begriplig JSON, inte 404).
6. Token saknas: UI förklarar. Inga stack traces mot användaren. Gula fält orörda.
7. POST scenario utan Redis ger lång länk `?t=`. Med Redis: `?s=` och TTL 30 dagar.
8. Delad `?s=` / `?t=` fyller fälten och räknar om. Ogiltig kod: tydligt fel, defaults kvar.
9. OG: klistra `/kalkyl?...` i en Open Graph-debugger eller `curl -I`; `og:image` pekar på en PNG som servern ritar. Inte en tom flik som enda förhandsvisning.
10. GitHub-hörna + teknik-modal syns. Modal nämner Pages, rosy, ver2 och att ver3 är Vercel-only.
11. Mobil viewport: indata och nyckeltal går att läsa och ändra.
12. Ingen token, inget `.env`, ingen Redis-URL i committade filer.
13. Formelparitet: samma default-indata som ver2 ger samma LCOE och NPV inom avrundning (jämför mot en fixture tagen ur ver2, inte mot en ny modell).

---

## 10. Byggordning (en kloss i taget)

1. Scaffold Next.js i den här mappen. Visa trädet. Stoppa om CLI vill skriva över PRD/SPEC.
2. `layout` + `/` + `/om` (statisk text, hörna, modal).
3. `lib/calculations.ts` + test/fixture. Ingen UI än.
4. `/kalkyl` med gula fält som räknar.
5. Perspektiv-URL:er som wrapper runt samma form.
6. `/api/elpris` med `period`, cache-nycklar, felvägar. UI: info bredvid fält, ingen tyst överskrivning.
7. `/api/scenario` + `?s=` / `?t=`.
8. OG-bild.
9. Kent: commit, push, skapa projektet `vindkraft-ver3` i Effektiv, Root Directory = den här mappen, env, ev. Redis, redeploy.
10. Verifiera production i webbläsare (indata → tal, elpris-felväg, delning, OG, modal, mobil + desktop).
11. **Inte i den här omgången:** cron, `vercel.ts` bara för cron.

---

## 11. Kommentarer i kod

Svenska kommentarer vid viktiga funktioner. Vid port från ver2: notera att formeln är medvetet densamma. Vid elpris-utökning mot ver2: “här skedde en uppdatering: period=manad|ar …”. ES2023: använd inte ny syntax utan att kommentera det; `Intl` och `base64url` som i ver2 är tillåtna.

---

## 12. Källor för den som implementerar

Inte en ny Harvard-lista. Primära artefakter:

- [PRD_vindkraftskalkyl_vercel_ver3.md](PRD_vindkraftskalkyl_vercel_ver3.md) (fryst v1.14)
- `vindkraftskalkyl_Vercel_ver2/berakningar.js`
- `vindkraftskalkyl_Vercel_ver2/lib/falt.js`
- `vindkraftskalkyl_Vercel_ver2/api/elpris.js`
- `vindkraftskalkyl_Vercel_ver2/api/scenario.js`
- `vindkraftskalkyl_Vercel_ver2/index.html` (defaultvärden)
- PRD avsnitt 7 för ENTSO-E A44, Riksbanken, vad som *inte* är spot

*SPEC v1, 2026-09-15. Skrivs om bara om PRD:n öppnas igen eller om scaffolding visar att ett krav är omöjligt — då fråga Kent, inte tyst sänka ribban.*
