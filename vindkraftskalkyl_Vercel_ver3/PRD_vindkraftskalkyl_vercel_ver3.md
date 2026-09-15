# PRD – Vindkraftskalkyl Vercel ver3 (Vercel-native)

**Namn:** PRD_vindkraftskalkyl_vercel_ver3
**Plats:** `vindkraftskalkyl_Vercel_ver3/PRD_vindkraftskalkyl_vercel_ver3.md`
**Skapad:** 2026-09-15
**Version:** 1.12 (fryst efter fräscha-ögon-genomläsning; SPEC.md skriven samma kväll)
**Status:** **Fryst 2026-09-15.** Avsnitt 4 beslutat. SPEC.md finns. Ingen appkod. Inget Vercel-projekt skapat. Ingen live-URL.
**Typ:** Grund-PRD (helt ny app i befintligt repo), inte en tilläggs-PRD till ver2.

> Det här dokumentet följer mallen i
> [PRD_generell.md](https://github.com/kentlundgren/AI-teknik/blob/main/AI_modeller/Claude/olika_Claude_modeller/PRD/PRD_generell.md)
> ([Lundgren, 2026a](https://github.com/kentlundgren/AI-teknik/blob/main/AI_modeller/Claude/olika_Claude_modeller/PRD/PRD_generell.md)):
> vad och varför, innan kod. Det är *inte* en SPEC.md (exakt hur, gränsfall,
> acceptanskriterier) — se 4g.

---

<a id="Terminologi"></a>

## Terminologi [#](#Terminologi)

Fyra lager som låter lika men inte är samma sak:

| Begrepp | Vad det betyder här |
|---------|---------------------|
| **Programversion** | HTML/CSS/JS på GitHub Pages. Ingen server. [Live](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html). |
| **Statisk Vercel-tvilling** | Samma tre filer, hostade på Vercel. Ingen Function. Projektet `vindkraft`, [vindkraft-rosy.vercel.app](https://vindkraft-rosy.vercel.app). |
| **ver2** | Samma kalkyl *plus* två Vercel Functions (`/api/elpris`, `/api/scenario`). Framework **Other**. [vindkraft-ver2.vercel.app](https://vindkraft-ver2.vercel.app). |
| **ver3 (den här PRD:n)** | Tänkt som en *ny* app: Next.js (App Router) som Vercel känner igen och bygger. Inte en tredje kopia av `index.html`. |

**Dual publicering** = samma HTML/CSS/JS både på GitHub Pages och Vercel, så view-source ser likadan ut. Det är mönstret för programversionen och den statiska tvillingen. ver2 bryter det redan delvis (Functions syns inte i Pages-versionen). ver3 bryter det medvetet (4c: Vercel-only som app).

**Vercel-native** = appen är byggd för plattformen (framework, routing, serverkod, hemligheter, preview), inte bara uppladdad dit.

**Vercel Function** = serverkod som körs vid anrop ([Vercel, 2026a](https://vercel.com/docs/functions)). I ver2 ligger den i `api/*.js`. I Next.js (App Router) är motsvarigheten **Route Handlers** (`app/api/.../route.ts`) ([Next.js, 2026a](https://nextjs.org/docs/app/getting-started/route-handlers)).

**App Router** (samma sak som **App Routing** i den här kontexten) = Next.js routing via mappen `app/` (moderna systemet). Inte Pages Router (`pages/`). Skriv alltid “Next.js (App Router)” så ingen modell blandar ihop dem.

---

<a id="Hur-skillen-styrde"></a>

## Hur `nextjs-vercel-app-prompting` styrde utkastet [#](#Hur-skillen-styrde)

Skillen bor centralt på datorn, inte i det här repot:

`C:\Users\kentl\.cursor\skills\nextjs-vercel-app-prompting\SKILL.md`

v1 av den här PRD:n *använde* skillen som arbetssätt men nämnde den bara en gång, längst ner bland interna referenser. Det var för tunt. Det som faktiskt kom därifrån:

- Klassificera innan kod: spår A (mer Vercel i HTML) kontra spår B (Next.js App Router).
- ver2 som referenspunkt: HTML + Functions, preset Other — inte en Next.js-mall.
- Stack: TypeScript, Tailwind, `lib/calculations.ts`, `'use client'` bara där state behövs, sidor `/` `/kalkyl` `/om`.
- Levande docs (`llms.txt`, Vercel MCP), inte träningsdata eller team-dashboarden.
- Dual publicering frågas, inte antas. En kloss i taget. Kalkylen räknar om API:t strular. Inget commit/push.

**Medvetet avsteg från skillens exempelprompt:** referensprompten är en slankare investeringskalkyl. Den här PRD:n portar *fem-perspektiv-kalkylen* (4e). Next.js är skalet.

**Rättelse 15 september 2026 kväll:** v1 läste skillens rad “nämns bara Vercel: anta inte Next.js” för strikt mot ett uppdrag som redan sa *till fullo*. Kent påpekade att det är märkligt. Överens: när Vercel-teknik ska användas till fullo ska Next.js (App Router) ingå. Skillen är uppdaterad samma kväll så att “till fullo” / Vercel-native är **spår B som default**, medan “lägg en Function i ver2” fortfarande är spår A. Se 4b.

---

<a id="1-Bakgrund"></a>

## 1. Bakgrund [#](#1-Bakgrund)

Repot `kentlundgren/Vindkraft` har tre publicerade lager av samma kalkyl (fem perspektiv, gula indatafält, LCOE/NPV/IRR):

1. GitHub Pages – bara filer.
2. Vercel som host (`vindkraft` / rosy) – samma filer, automatisk deploy.
3. Vercel ver2 – host **och** teknik i kalkylen: Functions, environment variables, Upstash Redis för korta länkar. Dokumenterat i [Vercel-teknik-ver2.md](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/Vercel-teknik-ver2.md).

ver2 är medvetet *inte* Next.js. I Vercel är preset **Other**. Det var rätt första steg: lära Functions, env och Redis utan att byta UI-skal.

Kent bad 15 september 2026 om en **tredje** kalkyl som *till fullo tar fördel av Vercel-tekniken*, i en ny mapp, med en PRD först. Det är spår B i den dokumenterade Vercel-resan: Next.js (App Router) som skal, samma beräkningslogik i botten — inte “mer HTML i ver2”.

Uppdraget i den här Cursor-sessionen nämnde mappnamnet `vindkraft:Vercel_ver3`. Kolon är ogiltigt i Windows-sökvägar. Mappen skapades därför som `vindkraftskalkyl_Vercel_ver3`, i linje med `vindkraftskalkyl_Vercel_ver2`. Bekräftelse: se 4a.

De tre äldre lagren ska **inte** ersättas av den här PRD:n. ver3 är ett nytt Vercel-projekt i samma team (Effektiv / `effektiv1`), samma GitHub-repo, annan Root Directory.

**Tillägg 2026-09-15 kväll.** Kent läste v1 och invände mot att agenten, med stöd i den dåvarande skillen, behandlade Next.js som något man inte ska anta bara för att Vercel nämns. Uppdraget var redan “till fullo”. Överenskommelsen: *till fullo* = Next.js (App Router) bland annat, inte ett sidospår. 4b frystes. Skillen `nextjs-vercel-app-prompting` (Cursor) och referensen `vercel-resa-fran-forsta-kalkylen.md` uppdaterades samma kväll. Claude-kopian av skillen (`C:\Users\kentl\.claude\skills\nextjs-vercel-app-prompting\`) fick samma regel införd; den filen är i övrigt en äldre promptmall och är inte en full synk.

**Tillägg 2026-09-15 kväll (elpris).** Kent: ett dygnssnitt säger för lite, eftersom spotpriset svänger kraftigt från dag till dag. Önskan att appen på ett smart sätt ska kunna visa **genomsnittligt månadspris** och **genomsnittligt årspris** per elområde (SE1–SE4). Först skrivet som “undersök senare”. Samma kväll: undersök *nu* och lägg svaret i den här PRD:n. Se 4l.

---

<a id="2-Syfte"></a>

## 2. Syfte [#](#2-Syfte)

- Bygga en vindkraftskalkyl som **är** en Vercel-app, inte bara ligger på Vercel: framework-medveten deploy, riktiga URL:er, serverkod där hemligheter krävs, preview per branch.
- Bevara kalkylens *innebörd* för användaren: fem perspektiv, transparenta antaganden, gula indatafält, LCOE/payback/NPV/IRR, kalkylen räknar även om ett API strular.
- Göra skillnaden mot GitHub Pages *kännbar och förklarad* (teknik-modal), utan att släppa in hela Vercel-katalogen i en kalkyl som inte behöver Auth, agenter eller WebSockets.
- Ha ett spårbart kravdokument innan `create-next-app` körs, så implementationen inte gissar stack, dual-publicering eller vilka Functions som ska med.

**Vad “till fullo” betyder här:** rätt arkitektur — **Next.js (App Router)**, beslutat i 4b — plus de klossar GitHub Pages inte kan *och som kalkylen vinner på*, i faser (4f, 4i, 4k, 4l). Inte att kryssa av Auth, AI Gateway, Blob, Queues, Sandbox, eve och WebSockets för att de finns i plattformen.

---

<a id="3-Omfattning"></a>

## 3. Omfattning [#](#3-Omfattning)

### Ingår (när SPEC.md är skriven — 4g = ja)

Punkterna nedan gäller den frysta PRD:n. 4a–4k är beslutade. 4l:s metod är i PRD:n; detaljerna (perioddefinition, Redis-nycklar, medel) låses i [SPEC.md](SPEC.md).

- En ny mapp i det här repot: `vindkraftskalkyl_Vercel_ver3/` (skapad i v1 av den här PRD:n).
- En Next.js-app (App Router) med TypeScript och Tailwind CSS, redo för Vercel. Vercel detekterar Next.js utan extra preset-trick ([Vercel, 2026b](https://vercel.com/docs/frameworks/nextjs)).
- Port av beräkningslogiken från `vindkraftskalkyl_Vercel_ver2/berakningar.js` till `lib/` (t.ex. `lib/calculations.ts`) — samma formler, inte en ny ekonomisk modell.
- Gula indatafält (stående regel för indata i Kents webbappar).
- GitHub-hörna + teknik-modal som par (stående sidregel), med GitHub-länk till *den här* mappen.
- Vercel-projekt i teamet **Effektiv** (`effektiv1`), Root Directory = den här mappen. Kent skapar projektet och pushar själv.
- Environment variables för ENTSO-E-token (samma källa som ver2). Aldrig i Git.
- Route Handlers som motsvarar ver2:s tunna API-yta: elpris och scenario. Redis för korta koder, lång `?t=` som reserv.
- Preview-deployments när en annan branch än `main` pushas ([Vercel, 2026c](https://vercel.com/docs/environment-variables)).
- Fluid Compute som default för Functions — inte `runtime = 'edge'` ([Vercel, 2026a](https://vercel.com/docs/functions)).
- Dynamisk OG-bild (`next/og`) för delade kalkyl-länkar redan i första live (4k:2).
- README med lokal sökväg, live-länk (när den finns) och korsreferens till de tre äldre lagren.
- `.gitignore` som utelämnar `.env*`, `.vercel`, `node_modules`, `.next`.

### Ingår i senare fas, inte i första live-versionen (se 4f)

- Cron Job som nattligen hämtar/cacherar månad + år (och ev. dygn) för SE1–SE4 ([Vercel, 2026d](https://vercel.com/docs/cron-jobs)). Tidzon UTC. Hobby-planens aktuella intervallgräns ska slås upp vid implementation, inte gissas här.
- `vercel.ts` som projektkonfiguration när cron/headers behövs ([Vercel, 2026e](https://vercel.com/docs/project-configuration/vercel-ts)). Första deployen kan räcka med Next.js nollkonfiguration.

### Rekommenderad elpris-yta, när Route Handler finns (se 4l)

- Genomsnittligt **månadspris** och **årspris** per elområde (SE1–SE4), samma A44-serie som ver2:s dygn, medel räknat i servern, visat som information bredvid de gula 25-årsantagandena. Undersökningen är gjord i 4l (15 september 2026). Inte ett krav att första hello-world visar talen, men `/api/elpris` ska *designas* med `period=dygn|manad|ar` från början så ytan inte målas in i bara-dygn.

### Ingår inte

- Att ersätta eller stänga programversionen, rosy-appen eller ver2.
- Dual publicering av *samma* Next.js-build till GitHub Pages i v1 (se 4c). Pages fortsätter hosta HTML-kalkylen.
- Nytt Vercel-team. Nytt GitHub-repo.
- Ny ekonomisk modell, nya perspektiv eller nya LCOE-formler — om inte en senare PRD säger det.
- Inloggning / Auth.
- AI-chatt / meddelandefunktion i appen, AI Gateway, eve, Vercel Sandbox, Queues, WebSockets.
- Vercel Blob eller Postgres, så länge Redis räcker för korta scenarier.
- PDF-export (nämnd som möjlig Function i ver2, inte byggd där heller).
- Att agenten committar eller pushar, eller skapar Vercel-projektet åt Kent.
- Att köra `create-next-app` innan SPEC.md är skriven (4g).
- Vite-regler (`base: './'`, `outDir: 'dist'`) — de gäller Vite-projekt. Next.js har eget byggsteg (`next build`, `.next/`). Medvetet undantag, inte ett glömt krav.

---

<a id="4-Fragor-och-beslut"></a>

## 4. Frågor och beslut [#](#4-Fragor-och-beslut)

<a id="4a-Mappnamn"></a>

**a) Vilket mappnamn? — BESLUTAT ✓ (2026-09-15)** [#](#4a-Mappnamn)

Kent skrev `vindkraft:Vercel_ver3`. Kolon kan inte ingå i ett Windows-mappnamn. Befintligt mönster är `vindkraftskalkyl_Vercel_ver2`.

**Beslut:** `vindkraftskalkyl_Vercel_ver3` (redan skapad lokalt). Byt inte tyst.

---

<a id="4b-Stack"></a>

**b) Next.js (App Router) eller mer HTML/Functions? — BESLUTAT ✓ (2026-09-15)** [#](#4b-Stack)

När Vercel-teknik ska användas **till fullo** ska Next.js (App Router) användas. Det är inte samma sak som att ordet Vercel nämns, och inte samma sak som ver2 (HTML + Functions, preset Other).

Kent invände mot v1:s försiktighet (“anta inte Next.js bara för att du sa Vercel”). Överens: *till fullo* inkluderar App Router. Skillen är rättad så att framtida agenter inte gör om samma miss.

**Beslut:** Next.js (App Router) + TypeScript + Tailwind CSS. Aktuell docs-linje vid skrivandet: Next.js 16.x via [llms.txt](https://nextjs.org/docs/llms.txt) ([Next.js, 2026c](https://nextjs.org/docs/llms.txt); agentindex visade 16.3.5 den 15 september 2026). Exakt `create-next-app`-version låses i SPEC.md / vid scaffolding, inte mot träningsdata.

Arbete *i ver2* är ett annat uppdrag och stannar på HTML tills någon uttryckligen ber om att flytta den appen.

---

<a id="4c-Dual"></a>

**c) Dual publicering (GitHub Pages + Vercel identiskt)? — BESLUTAT ✓ (2026-09-15)** [#](#4c-Dual)

Projekt-skillen för dual publicering säger att nya modeller *bör* följa samma mönster. Next.js har ett byggsteg. View-source blir inte tre platta filer. Hemlig nyckel, elpris-API, Redis-delning och dynamiska delningskort kräver server — det GitHub Pages inte har.

Kent: när Vercel används till fullo kan man inte ha samma program med samma funktionalitet på Pages. Det stämmer. Därför är dual publicering av *samma binär* inte målet här.

**Beslut:** ver3 är **Vercel-only som app**. GitHub Pages fortsätter visa programversionen. rosy och ver2 ligger kvar. README och teknik-modal förklarar de fyra adresserna i stället för att låtsas att de är samma binär.

En Pages-spegel senare är ett *eget* senare beslut — inte ett dolt krav i v1.

---

<a id="4d-Vercel-projekt"></a>

**d) Vercel-projektnamn, team, Root Directory? — BESLUTAT ✓ (2026-09-15)** [#](#4d-Vercel-projekt)

| Val | Beslut |
|-----|--------|
| Team | Effektiv (`effektiv1`) — samma som ver2, inte ett nytt team |
| Project Name | `vindkraft-ver3` |
| Root Directory | `vindkraftskalkyl_Vercel_ver3` |
| Framework | Next.js (autodetekteras) |
| Production-URL | troligen `https://vindkraft-ver3.vercel.app` (Vercel tilldelar; namnet kan krocka om det redan är taget) |

Kent skapar projektet i dashboarden efter första push, samma arbetssätt som ver2. Agenten skapar det inte.

---

<a id="4e-Kalkyl"></a>

**e) Samma kalkyl (fem perspektiv) eller en slankare investeringskalkyl? — BESLUTAT ✓ (2026-09-15)** [#](#4e-Kalkyl)

Referensprompten för Next.js-kalkylatorn är en slankare investeringskalkyl (effekt, LCOE, känslighet). Live-kalkylen som Kent faktiskt använder är **fem perspektiv** plus NU20.

**Beslut:** porta fem-perspektiv-kalkylen (samma indata och formler som ver2). Next.js är skalet. En slankare kalkyl vore ett annat verktyg.

---

<a id="4f-Klossar"></a>

**f) Vilka Vercel-klossar i första live-versionen? — BESLUTAT ✓ (2026-09-15)** [#](#4f-Klossar)

Redan prövat i ver2, ska *återanvändas* (inte läras om): Functions/Route Handlers, env, Redis, Root Directory, Git-deploy.

**Beslut fas 1 (första live):**

1. Next.js (App Router) — det GitHub Pages och ver2 *inte* är.
2. Riktiga sidor (se 4i).
3. `GET` elpris + `GET`/`POST` scenario som Route Handlers. Elpris-kontraktet tar `period=dygn|manad|ar` redan i första versionen av handlern (4l), även om cron/cache kommer i fas 2.
4. Redis (Upstash via Marketplace, samma linje som ver2; Vercel KV är borta) ([Vercel, 2026f](https://vercel.com/docs/redis)).
5. Preview-URL per branch.
6. Teknik-modal som förklarar varför detta *inte* är rosy/ver2.
7. OG-bild för delade länkar, med tal från kalkylen ([Next.js, 2026b](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)). Se 4k:2.

**Beslut fas 2 (när fas 1 räknar rätt i production):**

8. Cron för nattlig elpris-hämtning (dygn **och** senaste hela månad + år per SE1–SE4), så talen finns även om ingen har sidan öppen ([Vercel, 2026d](https://vercel.com/docs/cron-jobs)). Se 4l.
9. Redis-cache / revalidate av elpris så ENTSO-E inte anropas på varje klick.

**OG-bild (delningskort):** i **första live** (Kent, efter förklaring av vad kortet är). Inte en chatt i appen.

**Inte en separat “fas 3-research”:** hur månads- och årsmedel hämtas är besvarat i 4l. Bygget sker när elpris-handlern skrivs. Dygnssnitt kan finnas kvar som komplement.

**Medvetet senare / troligen aldrig i den här appen:** Auth, AI, Blob, WebSockets.

En kloss i taget vid implementation, även om PRD:n listar dem nu. Det är skillnaden mellan *plan* och *bygge*.

---

<a id="4g-SPEC"></a>

**g) Behövs ett SPEC.md-steg härifrån? — BESLUTAT ✓ JA (2026-09-15)** [#](#4g-SPEC)

Stående fråga i varje PRD ([Lundgren, 2026d](https://klel.wordpress.com/2026/08/02/behover-jag-en-spec-md/)). Svaret är oftast nej. Här är svaret **ja**.

Skäl: leveransen är tekniskt komplex och agent-driven (`create-next-app`, App Router-filer, port av `berakningar.js`, Route Handlers, env-namn, Redis-variabelpar som redan gick isär en gång i ver2). En människa fyller i “samma kalkyl” med kontext. En agent fyller i samma lucka med en gissning.

**Beslut:** SPEC.md skrivs **efter att den här PRD:n frysts**, **innan** scaffolding. Den ska innehålla: indatafält-id:n att porta, formelparitet mot ver2, API-kontrakt (`period=dygn|manad|ar`), vad som händer när token saknas, OG-kortets minimikrav, och acceptanskriterier för “kalkylen räknar utan API”.

Inte: tom Next.js-hello före SPEC. Inte: hoppa SPEC och koda direkt från PRD:n.

---

<a id="4h-Utseende"></a>

**h) Behålla ver2:s utseende eller ny, “appig” design? — BESLUTAT ✓ (2026-09-15)** [#](#4h-Utseende)

Kent: Vercel till fullo betyder **ny app-känsla**, inte en HTML-kalkyl i ny kostym. Ett undantag är stående: **indatafält har gul bakgrund**, så det syns var man ska skriva. Defaultvärden finns som tidigare.

**Beslut:** ny yta (Tailwind, kortlayout, egna URL:er per perspektiv). Inte ver2:s palett i övrigt. Gula indatafält + defaults är krav, inte ett färgtema att kopiera rakt av.

---

<a id="4i-Rutter"></a>

**i) Vilka URL:er, och hur App Router delas upp? — BESLUTAT ✓ (2026-09-15)** [#](#4i-Rutter)

App Router är en sidväxlare. HTML-kalkylen har en `index.html` och låtsas att flikar är sidor. Adressen är densamma. Det är skillen som sätter den skillnaden: flikar döljer divar; App Router ger riktiga URL:er.

**Arkitektur (låst som princip):**

| Del | Var | Varför |
|-----|-----|--------|
| Skal, ingress, källor, NU20-text | Server Components (`layout.tsx`, `/om`) | Ingen interaktivitet. Mindre JS. |
| Gula fält, nyckeltal, diagram | Client Component (t.ex. `components/CalculatorForm.tsx`) | State, `onChange`, diagram. |
| Formler | `lib/calculations.ts` | Samma tal som ver2, testbart utan UI. |
| Elpris och delning | `app/api/.../route.ts` | Hemligheter stannar på servern. Samma uppgift som ver2, ny filform. |

**Beslutade bas-URL:er:**

| URL | Fil | Innehåll |
|-----|-----|----------|
| `/` | `app/page.tsx` | Kort ingång: vad kalkylen är, länkar till kalkyl + om + de tre äldre live-URL:erna |
| `/kalkyl` | `app/kalkyl/page.tsx` | Översikt, alla fem nyckeltal (Client Component där state behövs) |
| `/om` | `app/om/page.tsx` | Antaganden, källor, skillnad mot Pages/ver2 |
| `/api/elpris` | `app/api/elpris/route.ts` | Spot per SE1–SE4: `period=dygn|manad|ar` (4l). Samma A44 som ver2. |
| `/api/scenario` | `app/api/scenario/route.ts` | Samma uppgift som ver2 |

Kalkylen är **inte** `/`. Ingången är `/`, kalkylen är `/kalkyl`.

**Perspektiv som adresser — så snart kalkylen räknar** (inte en evig “senare”):

| URL | För vem |
|-----|---------|
| `/kalkyl/investerare` | LCOE, NPV, IRR i förgrunden |
| `/kalkyl/markagare` | Arrende |
| `/kalkyl/kommun` | Lokala intäkter, schablon CO₂ |
| `/kalkyl/andelsagare` | Kooperativ modell |
| `/kalkyl/narboende` | NU20 — länken man skickar till den som berörs |

Indata är gemensam (samma layout, samma scenario via `?s=`). Det som byts är vilken historia som är i förgrunden. Se 4k:1.

Gemensamt skal: `app/layout.tsx` (Server Component så långt det går). `'use client'` bara där state, events eller webbläsar-API behövs.

---

<a id="4j-Vite-undantag"></a>

**j) Kents Vite-regler (`base: './'`, `dist/`)? — BESLUTAT ✓ (för den här PRD:n)** [#](#4j-Vite-undantag)

De reglerna gäller Vite-projekt. ver3 är Next.js (4b). Då är `next.config.ts` (eller motsvarande) konfigurationsfilen, inte `vite.config.js`. Relativa sökvägar på GitHub Pages är inte målet (4c: Vercel-only). Dokumenterat så att en framtida agent inte “rättar” Next.js till Vite.

---

<a id="4k-Extra-bra"></a>

**k) Tre saker som kan bli extra bra — BESLUTAT ✓ (2026-09-15)** [#](#4k-Extra-bra)

Inte “mer Vercel” i största allmänhet. Tre grejer GitHub Pages och ver2 *inte* kan, och som passar *den här* kalkylen. Inloggning, **chatt eller meddelanden inne i kalkylen**, och WebSockets hör inte hit.

1. **Närboendesidan som en länk man vågar skicka — ja, så snart kalkylen räknar.**  
   `…/kalkyl/narboende?s=wqdmm7` öppnar *deras* perspektiv, inte en flik någon måste hitta. Produkt, inte ramverk. Låst av 4i.

2. **Ett delningskort med riktiga tal — ja, i första live.**  
   Inte en chatt i kalkylen. När länken klistras i mejl, Teams eller LinkedIn kan de programmen visa en förhandsvisning (OG-bild som Vercel ritar med `next/og`), t.ex. “LCOE 48 öre/kWh · payback 9 år · närboende X kr/år”. I ver2 är delningen en URL. Här kan delningen *se ut som kalkylen*. Kent frågade vad “OG-kort” är; efter förklaring: in i första live, inte fas 2.

3. **Spotpriset ligger där, utan knapp — månad och år som huvudtal.**  
   API-kontraktet `period=dygn|manad|ar` hör till första elpris-handlern (4f, 4l). Nattlig cron och cache är **fas 2**. Tills cron finns kan handlern hämta vid behov och visa talen, utan att tyst skriva över det gula 25-årsfältet.

---

<a id="4l-Manads-arspris"></a>

**l) Månads- och årsmedelpris per elområde — UNDERSÖKT 2026-09-15, DETALJER I SPEC** [#](#4l-Manads-arspris)

Kent: det är inte tillräckligt att bara lägga in **medelpriset för ett dygn**. Spotpriset kan skilja sig kraftigt från dag till dag. Ett **månadsmedel** och ett **årsmedel**, per region (SE1–SE4), säger mer för den som räknar på lönsamhet.

Första skrivningen av 4l (v1.4) sa “undersök inom kort, inte fas 1”. Samma kväll: undersök **nu** och lägg svaret i PRD:n. Det här avsnittet *är* den undersökningen. Ingen appkod är skriven. Inget skarpt ENTSO-E-anrop för en hel månad gjordes i den här sessionen (token ligger i Vercel, inte i Git). Metoden nedan bygger på ver2:s redan skrivna Function, på repots egen ENTSO-E-fil, och på öppnade källor 15 september 2026.

### Svar i korthet

Det går. Appen ska **inte** leta efter en färdig “månadsmedel-knapp” hos ENTSO-E. Dagen-före-priserna kommer som en tidsserie (timme eller kvart). Ett medel för månad eller år räknar **servern** genom att hämta fönstret och ta medel av punkterna — samma princip som ver2 redan gör för *ett dygn* ([Lundgren, 2026e](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/Hur-skaffa-nyckel-hos-ENTSO-E.md#Genomsnittliga-elpriser)).

### Hur appen ska hämta det

1. **Källa (samma som ver2).** ENTSO-E Transparency Platform, dokumenttyp **A44** (dagen-före-pris / 12.1.D), elområde via samma EIC som i `api/elpris.js`: SE1 `10Y1001A1001A44P`, SE2 `…A45N`, SE3 `…A46L`, SE4 `…A47J`. `in_Domain` och `out_Domain` samma kod. Token: `ENTSOE_SECURITY_TOKEN`. Endpoint: `https://web-api.tp.entsoe.eu/api`. Officiell guide för A44 visar ett **helt kalenderår i ett anrop** och anger *one year range limit* ([ENTSO-E, 2024](https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide_prod_backup_06_11_2024.html)).
2. **Ett anrop per period, inte 365 dygnsklick.** Månad = `periodStart`–`periodEnd` för den kalendermånaden. År = ett anrop för högst tolv månader (gränsen är ett år per request). Hjälpguidens exempel för Tjeckien 2016 är just ett årsfönster i en GET. Det är därför årsmedel är realistiskt i en Vercel Function, inte bara i en nattjobbs-loop mot 365 dygn.
3. **Medel i servern.** v1: enkelt medel av publicerade intervallpunkter, samma som ver2:s dygn. Flagga i SPEC om 15-minuters- och 60-minuterspunkter blandas: då är *tidsvägt* medel mer rättvist. Inte en ny ekonomisk modell — bara hur snittet bildas.
4. **Valuta.** EUR/MWh → kr/kWh med Riksbankens öppna REST, serien `SEKEURPMI`, samma som ver2 ([Sveriges riksbank, 2026](https://www.riksbank.se/sv/statistik/rantor-och-valutakurser/hamta-rantor-och-valutakurser-via-api/)). För v1: **en** kurs (senaste notering) för visningen, dokumenterat som förenkling. Inte ett dagligt FX-medel över året — det kan SPEC:en öppna senare.
5. **API-kontrakt i ver3** (design från första Route Handler, så ytan inte låses till bara dygn):

   `GET /api/elpris?omrade=SE4&period=manad`  
   `GET /api/elpris?omrade=SE4&period=ar`  
   `GET /api/elpris?omrade=SE4&period=dygn` (default, ver2-kompatibel)

   Svaret ska bära periodens start/slut, antal punkter, kr/kWh, EUR/MWh, källa och en varning att det är spot utan skatt, nät och påslag.
6. **Cache, inte varje sidvisning.** ENTSO-E tillåter 400 anrop per minut och nyckel/IP; över det HTTP 429 och tillfälligt stopp ([ENTSO-E, 2024](https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide_prod_backup_06_11_2024.html)). En månad eller ett år är *ett* anrop, så kvoten är inte problemet — *latensen och artigheten* är det. Nattlig cron (UTC) räknar om fyra områden × månad + år (åtta A44-anrop) och lägger JSON i Redis. Sidan läser cache. Vid cache-miss får handlern hämta en gång och skriva cache, inte 50 parallella ENTSO-E-anrop från samma sidladdning.
7. **Vad som visas.** Två informationsrader (plus ev. dygn som komplement) **bredvid** det gula 25-årsfältet, med period och källa. Ingen tyst överskrivning. Användaren kan *välja* att kopiera ett medel till antagandet — medvetet klick, inte default.

**Föreslagen betydelse av “månad” och “år” tills SPEC säger annat:** senaste *hela* kalendermånad, och senaste *hela* kalenderår. Öppet: om “hittills i år” eller rullande tolv månader ska ligga bredvid. Energimarknadsbyrån visar månad *och* ett årsmedel hittills för samma Nord Pool-siffror ([Energimarknadsbyrån, 2026](https://www.energimarknadsbyran.se/el/dina-elavtal-och-kostnader/elhandelsavtalet/elpriser-statistik/manadspriser-pa-elborsen/)) — det är en mänsklig kontrollista, inte appens hämtväg.

### Vad appen inte ska hämta som *spot*

| Källa | Varför inte som huvudtal i kalkylen |
|-------|-------------------------------------|
| **SCB EN0301** elhandelspriser per avtalstyp/elområde | Färdiga *månadstal*, men det är **erbjudna avtal** (rörligt, fast, anvisat), med handlarnas påslag — inte dagen-före-spot. Tabellen säger det själv ([SCB, 2026a](https://www.scb.se/hitta-statistik/statistik-efter-amne/energi/prisutvecklingen-inom-energiomradet/elpriser-och-elavtal/); [SCB, 2026b](https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__EN__EN0301__EN0301A/SSDManadElhandelpris/)). Kan bli en *tilläggsrad* “vad hushåll erbjöds”, aldrig ersättning för producentens spot. |
| **Nord Pools eget API** | Abonnemang. Används inte i ver2. Marknadsplatsen syns på dataportalen för människa, inte som appens nyckel. |
| **Svenska kraftnäts öppna dataset** | Titeln säger fortfarande att data inte uppdateras efter 1 juli 2026 ([Svenska kraftnät, 2026](https://data.svk.se/sv/dataset/market_data_day_ahead_area_prices)). Inte live-källa. |
| **Skrapa Energimarknadsbyrån** | De *visar* månadsmedelspot från Nord Pool, till och med årsmedel hittills 2026 per SE1–SE4. Bra att jämföra mot när handlern är byggd. Inte ett API att binda kalkylen vid. |

**Vad “smart” inte betyder.** Inte en AI som gissar framtida elpris. Smart = rätt period, rätt område, synlig källa, ett anrop per fönster, cache så det är snabbt och snällt mot API:t.

**Varför Vercel (och inte Pages):** nyckel, XML-svar, medelvärde och Redis hör hemma i en Route Handler. GitHub Pages kan bara visa ett tal någon klistrat in för hand.

**Vad som fortfarande är öppet (låses i SPEC.md, inte i en ny research-runda):** kalenderår kontra rullande 12; tidsvägt medel när MTU blandas; om “hittills i år” ska med; exakt Redis-nyckel (`elpris:SE4:manad` o.d.). Se [SPEC.md](SPEC.md).

Implementation: när `/api/elpris` skrivs i ver3, inte som en tredje grund-PRD. Första hello-world behöver inte visa talen. Första elpris-handlern ska däremot inte låsa kontraktet till bara dygn.

---

<a id="5-Leveranser"></a>

## 5. Leveranser [#](#5-Leveranser)

Checklista. Avbockning ska spegla avsnitt 4 — inget här är “klart” bara för att det står i PRD:n.

**Den här omgången (v1–v1.12):**

- [x] Skapa mappen `vindkraftskalkyl_Vercel_ver3/` (lokalt, 2026-09-15).
- [x] Första utkast till denna PRD.
- [x] README som säger att appen inte är byggd än, plus lokal sökväg.
- [x] `.gitignore` för framtida `.env`, `.vercel`, `node_modules`, `.next`.
- [x] v1.2: skillens roll, 4b beslutad, App Router-uppdelning, tre produktidéer (4k).
- [x] `nextjs-vercel-app-prompting` uppdaterad så “till fullo” = spår B / Next.js (App Router) som default.
- [x] v1.4: 4l — månads- och årsmedelpris per elområde som önskan att undersöka, inte fas 1.
- [x] v1.5: 4l undersökt samma kväll — källa A44, ett anrop per månad/år, cache/cron, vad som *inte* är spot. Metod i PRD:n. Inte byggd.
- [x] v1.6: Kent nickade 4a (mappnamn) och 4d (Vercel-projekt `vindkraft-ver3` i teamet Effektiv).
- [x] v1.7: Kent nickade 4e (fem-perspektiv-port). 4c inte stängd: Kent frågade om samma funktionalitet kan ligga på GitHub Pages när Vercel används till fullo.
- [x] v1.8: Kent nickade 4c (Vercel-only som app). Pages/rosy/ver2 ligger kvar. Dual publicering av samma Next.js-binär är inte målet.
- [x] v1.9: Kent: ny app-känsla (4h), gula indatafält med defaults. 4i: `/` `/kalkyl` `/om`, perspektiv-URL:er så snart kalkylen räknar.
- [x] v1.10: Kent nickade 4f:s faser (första live = sidor + elpris/scenario + Redis; cron/cache i fas 2). 4k närboendelänk ja. OG-kortets tidpunkt öppen tills “vad är OG?” är svarat.
- [x] v1.11: Kent: OG-kort i första live. 4g SPEC.md ja, efter frysning, innan scaffolding. Avsnitt 4 nickat.
- [x] v1.12: Fräscha-ögon-genomläsning. Rättat eftersläpning (OG som “fas 2” i källor och produktionsordning; “om 4c står fast”). PRD fryst. SPEC.md skriven.

**Nästa, innan kod:**

- [x] Fräscha-ögon-genomläsning (Regel 7, v1.12).
- [x] SPEC.md (4g = ja).

**Därefter, implementation (inte påbörjad):**

- [ ] Scaffolda Next.js (App Router) i mappen. Visa strukturen innan mängder av filer skrivs.
- [ ] Porta beräkningar + UI enligt fryst 4e/4h/4i.
- [ ] Route Handlers + env-dokumentation (ingen token i Git).
- [ ] Lokal körning (`npm run dev`); Functions mot `vercel dev` eller Route Handlers i Next-dev.
- [ ] Kent skapar Vercel-projektet `vindkraft-ver3` efter push.
- [ ] Uppdatera repo-rotens `CLAUDE.md` och rot-README med ver3 (live-URL, Root Directory) — *efter* första deploy, inte innan.
- [ ] Verifiera i webbläsare: indata → nyckeltal, elpris-felväg, delningslänk, GitHub-hörna, teknik-modal, mobil + desktop.

---

<a id="6-Produktionsordning"></a>

## 6. Produktionsordning [#](#6-Produktionsordning)

Ordningen är medveten: krav före spec före scaffolding före Vercel-projekt.

1. **PRD (nu)** — vad och varför, öppna frågor synliga.
2. **Kent svarar på avsnitt 4** — gjort 15 september 2026 kväll.
3. **Frys PRD** efter en fräscha-ögon-genomläsning, inte efter första utkastet.
4. **SPEC.md** — skriven 15 september 2026 ([SPEC.md](SPEC.md)).
5. **Scaffold Next.js** i den här mappen. Visa filträdet. Ingen stealth-omdesign.
6. **Port av kalkyl + Route Handlers.** En fungerande `/kalkyl` som räknar utan API, *sedan* elpris (`period=dygn|manad|ar`) och scenario.
7. **Kent: commit, push, skapa Vercel-projektet** (team Effektiv, Root Directory, env, ev. Redis).
8. **Verifiera production.** Cron/cache är fas 2. OG-kortet hör till första live (4k:2), inte till fas 2.
9. **Dokumentera live-URL** i README, `CLAUDE.md` och rot-README.

Inte: skapa Vercel-projektet innan det finns något att bygga. Inte: byta formler samtidigt som skalet byts.

---

<a id="7-Kallor"></a>

## 7. Källor [#](#7-Kallor)

Alfabetisk, annoterad. Externa, citerbara källor först. Hämtdatum 15 september 2026 där källan är en föränderlig docs-sida. Länkarna är öppnade/kontrollerade i samma session som utkastet skrevs (4l-källorna i v1.5 samma kväll).

Energimarknadsbyrån (2026) *Månadspriser på elbörsen.* Tillgänglig: https://www.energimarknadsbyran.se/el/dina-elavtal-och-kostnader/elhandelsavtalet/elpriser-statistik/manadspriser-pa-elborsen/ (hämtad 15 september 2026). *(Månadsmedelspot från Nord Pool per SE1–SE4, plus årsmedel hittills; mänsklig kontrollista, inte appens API.)*

ENTSO-E (2024) *REST API – User Guide* (Transparency Platform, snapshot 6 november 2024). Tillgänglig: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide_prod_backup_06_11_2024.html (hämtad 15 september 2026). *(Avsnitt 4.2.10 Day Ahead Prices [12.1.D]: A44, samma in/out-domain, one year range; exempel-GET för hela 2016. Avsnitt 1.8: 400 anrop/minut per IP och token, därefter HTTP 429. Den aktuella Guide.html svarade HTTP 400 vid kontroll 15 september 2026; den här backup-filen öppnades och innehöll avsnitten.)*

Lundgren, K. (2026a) *PRD – Generell mall (struktur för hur en PRD byggs upp i det här arbetssättet).* GitHub, `kentlundgren/AI-teknik`. Tillgänglig: https://github.com/kentlundgren/AI-teknik/blob/main/AI_modeller/Claude/olika_Claude_modeller/PRD/PRD_generell.md (hämtad 15 september 2026). *(Mall för header, avsnitt 1–8, SPEC.md-checkpoint och fräscha-ögon-vana — den här filen följer den strukturen.)*

Lundgren, K. (2026b) *Vercel-teknik – vad som är unikt med vindkraftskalkyl_Vercel_ver2.* GitHub, `kentlundgren/Vindkraft`. Tillgänglig: https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/Vercel-teknik-ver2.md (hämtad 15 september 2026). *(Vad ver2 redan gör med Functions, env och Redis — utgångspunkten ver3 inte ska lära om från noll.)*

Lundgren, K. (2026c) *Vindkraftskalkyl – Vercel ver2* (README). GitHub, `kentlundgren/Vindkraft`. Tillgänglig: https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/README.md (hämtad 15 september 2026). *(Deploy-steg till teamet Effektiv, elpriskälla ENTSO-E, filstruktur för HTML+Functions.)*

Lundgren, K. (2026d) *Behöver jag en spec.md?* klel.wordpress.com, 2 augusti. Tillgänglig: https://klel.wordpress.com/2026/08/02/behover-jag-en-spec-md/ (hämtad 15 september 2026). *(Varför SPEC.md är en stående fråga, inte ett obligatoriskt dokument — 4g i den här PRD:n.)*

Lundgren, K. (2026e) *Hur man skaffar nyckel hos ENTSO-E* (avsnittet *Kan man få genomsnittspriser för dygn, vecka, månad och år?*). GitHub, `kentlundgren/Vindkraft`. Tillgänglig: https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/Hur-skaffa-nyckel-hos-ENTSO-E.md#Genomsnittliga-elpriser (hämtad 15 september 2026). *(ver2: A44 är en tidsserie utan månadsknapp; dygn är byggt, månad/år är samma princip men inte implementerat där.)*

Next.js (2026a) *Route Handlers.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started/route-handlers (hämtad 15 september 2026). *(Next.js-motsvarigheten till ver2:s `api/*.js` — Web Request/Response, inte Pages Router.)*

Next.js (2026b) *Metadata and OG images.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started/metadata-and-og-images (hämtad 15 september 2026). *(Delningskort med `next/og` — krav i första live, 4k:2.)*

Next.js (2026c) *llms.txt* (agentindex, Next.js 16.3.5 vid kontroll). Tillgänglig: https://nextjs.org/docs/llms.txt (hämtad 15 september 2026). *(Versionsstämplad ingång till App Router-dokumentationen; slår träningsdata.)*

Next.js (2026d) *Getting Started.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started (hämtad 15 september 2026). *(Installation, `app/`, layout/page, Server vs Client — basen för 4b/4i.)*

SCB (2026a) *Elpriser och elavtal.* Tillgänglig: https://www.scb.se/hitta-statistik/statistik-efter-amne/energi/prisutvecklingen-inom-energiomradet/elpriser-och-elavtal/ (hämtad 15 september 2026). *(EN0301: elhandels- och elnätspriser per avtalstyp; Energimyndigheten ansvarar. Inte dagen-före-spot.)*

SCB (2026b) *Elhandelspriser på elenergi … efter avtalstyp, elområde och kundkategori. Månad* (PxWeb, SSDManadElhandelpris). Tillgänglig: https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__EN__EN0301__EN0301A/SSDManadElhandelpris/ (hämtad 15 september 2026). *(Färdiga månadstal per SE1–SE4, men “genomsnittliga erbjudna priser för nytecknade avtal” — därför inte appens spotkälla.)*

Svenska kraftnät (2026) *Dagen före-priser för system och per elområde.* Tillgänglig: https://data.svk.se/sv/dataset/market_data_day_ahead_area_prices (hämtad 15 september 2026). *(Öppen data, men titeln säger att den inte uppdateras efter 1 juli 2026 — därför inte live-källa i 4l.)*

Sveriges riksbank (2026) *Hämta räntor och valutakurser via API.* Tillgänglig: https://www.riksbank.se/sv/statistik/rantor-och-valutakurser/hamta-rantor-och-valutakurser-via-api/ (hämtad 15 september 2026). *(Öppet REST; SEKEURPMI för EUR/MWh → kr/kWh, samma omräkning som ver2.)*

Vercel (2026a) *Vercel Functions.* Tillgänglig: https://vercel.com/docs/functions (hämtad 15 september 2026). *(Request-driven serverkod, Fluid Compute som default, Route Handlers för Next.js App Router.)*

Vercel (2026b) *Next.js on Vercel.* Tillgänglig: https://vercel.com/docs/frameworks/nextjs (hämtad 15 september 2026). *(Framework-nollkonfiguration — skälet att ver3 inte ska sättas till preset Other.)*

Vercel (2026c) *Environment Variables.* Tillgänglig: https://vercel.com/docs/environment-variables (hämtad 15 september 2026). *(Hemligheter utanför Git; Production/Preview/Development — samma mönster som ENTSO-E-token i ver2.)*

Vercel (2026d) *Cron Jobs.* Tillgänglig: https://vercel.com/docs/cron-jobs (hämtad 15 september 2026). *(Schema i UTC mot en Function; det GitHub Pages inte kan. Fas 2, inte v1.)*

Vercel (2026e) *Project config with vercel.ts.* Tillgänglig: https://vercel.com/docs/project-configuration/vercel-ts (hämtad 15 september 2026). *(TypeScript-konfig som kan bära cron m.m.; valfri i fas 1.)*

Vercel (2026f) *Redis on Vercel.* Tillgänglig: https://vercel.com/docs/redis (hämtad 15 september 2026). *(Marketplace/Upstash; Vercel KV borta. Samma linje ver2 redan använder för `?s=`.)*

**Interna projektreferenser (inte Harvard-citerade som externa verk):**

- Live ver2: https://vindkraft-ver2.vercel.app
- Team-yta (arbetsyta, inte docs): https://vercel.com/effektiv1
- Dual-publicerings-skill i det här repot: `.cursor/skills/vercel-github-pages-dual-publicering/SKILL.md`
- Next.js/Vercel-prompt-skill (Cursor, kanonisk för två spår + “till fullo”): `C:\Users\kentl\.cursor\skills\nextjs-vercel-app-prompting\SKILL.md` — uppdaterad 15 september 2026 kväll.
- Samma skills Claude-kopia (äldre promptmall + till-fullo-regeln införd, inte full synk): `C:\Users\kentl\.claude\skills\nextjs-vercel-app-prompting\SKILL.md`

---

<a id="8-Status"></a>

## 8. Status [#](#8-Status)

15 september 2026 kväll: **PRD fryst (v1.12)** efter fräscha-ögon-genomläsning. Avsnitt 4 nickat. SPEC.md skriven samma kväll. Ingen appkod. Inget Vercel-projekt skapat. Ingen live-URL.

Nästa handling: scaffolda Next.js (App Router) i den här mappen enligt SPEC.md. Visa filträdet innan mängder av filer skrivs. Inte `create-next-app` utan att följa SPEC. Kent committar och pushar själv.

---

## Ändringslogg

- 2026-09-15 (v1): Första utkast. Mapp skapad. Inga delfrågor frysta utom 4j (Vite-regler gäller inte Next.js). Skrivet efter genomgång av ver2:s teknikfil, PRD-mallen, Vercel-resan och levande Vercel-/Next.js-docs samma dag.
- 2026-09-15 (v1.1): Intern genomläsning av utkastet (inte en frysning). Rättat “tre begrepp” → fyra lager i terminologin, och gjort avsnitt 3:s “Ingår” uttryckligen villkorat av 4b/4c/4e så omfattningen inte låtsas att stacken redan är beslutad.
- 2026-09-15 (v1.2): Kent: “till fullo” ska inkludera Next.js (App Router). 4b beslutad. Nytt avsnitt om hur skillen styrde v1, och en rättelse av att v1 läste “anta inte Next.js” för strikt. 4i utökad med Server/Client-uppdelning och perspektiv-URL:er. Ny 4k med tre produktidéer (närboendelänk, OG-kort, levande spotpris). Skillen `nextjs-vercel-app-prompting` (Cursor + delvis Claude-kopian) och `vercel-resa-fran-forsta-kalkylen.md` uppdaterade samma kväll. Avsnitt 3 villkorar nu 4c/4e, inte 4b.
- 2026-09-15 (v1.3): Förtydligat att kalkylen inte får en chatt. “Chatt” i bakgrunden bytt till Cursor-sessionen. 4k och “Ingår inte” skiljer meddelanden *i appen* från förhandsvisningskort i mejl/Teams/LinkedIn.
- 2026-09-15 (v1.4): Kent: dygnssnitt räcker inte som ensam elprissiffra. Ny 4l — månads- och årsmedel per SE1–SE4 som önskan att undersöka inom snar framtid (källa, aggregering, cache/cron). Inte fas 1. Gula 25-årsfältet skrivs inte över tyst. 4k:3 pekar hit.
- 2026-09-15 (v1.5): Kent ångrade “undersök senare”. 4l omarbetad till undersökt metod: samma A44 som ver2, ett anrop per månad/år (ENTSO-E one-year limit), Redis + cron, SCB/Nord Pool-API/SVK/skrapning avvisade som spotkälla. API-kontrakt `period=dygn|manad|ar`. Inte byggd.
- 2026-09-15 (v1.6): Kent nickade 4a (`vindkraftskalkyl_Vercel_ver3`) och 4d (projekt `vindkraft-ver3`, team Effektiv, Root Directory = mappen).
- 2026-09-15 (v1.7): Kent nickade 4e (porta fem-perspektiv-kalkylen). 4c väntar: Kent hade rätt i att till-fullo-appen inte kan ha samma funktionalitet på GitHub Pages.
- 2026-09-15 (v1.8): Kent nickade 4c: ver3 är Vercel-only som app. Pages, rosy och ver2 ligger kvar. Dual publicering av samma Next.js-binär är inte målet.
- 2026-09-15 (v1.9): Kent: 4h ny app-känsla, men indatafält alltid gula med defaults. 4i `/` `/kalkyl` `/om`; perspektiv-URL:er så snart kalkylen räknar.
- 2026-09-15 (v1.10): Kent nickade 4f:s faser. 4k: närboendelänk ja. OG-kort förklaras innan tidpunkten låses (Kent frågade vad det är, och kryssade både fas 2 i 4f och “första live” i 4k).
- 2026-09-15 (v1.11): Kent: OG-kort i första live. 4g SPEC.md ja — efter frysning, innan scaffolding. Avsnitt 4 nickat.
- 2026-09-15 (v1.12): Fräscha-ögon-genomläsning (Regel 7). Rättat: dual-publicering/4c som redan beslutad; 4e inte längre “förslag”; OG inte fas 2 i källan Next.js 2026b eller i produktionsordning steg 8; Vite-undantaget utan “om 4c står fast”. PRD fryst. SPEC.md skriven.
