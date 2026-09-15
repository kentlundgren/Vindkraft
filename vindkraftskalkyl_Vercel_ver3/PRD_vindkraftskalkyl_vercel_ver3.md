# PRD – Vindkraftskalkyl Vercel ver3 (Vercel-native)

**Namn:** PRD_vindkraftskalkyl_vercel_ver3
**Plats:** `vindkraftskalkyl_Vercel_ver3/PRD_vindkraftskalkyl_vercel_ver3.md`
**Skapad:** 2026-09-15
**Version:** 1.2 (Kent: “till fullo” = Next.js App Router; skillen uppdaterad; tre produktidéer inskrivna)
**Status:** **Utkast, inte fryst.** 4b är beslutad (Next.js App Router). 4j var redan beslutad. Övriga delfrågor öppna eller förslag. Ingen appkod, inget Vercel-projekt, ingen live-URL.
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

**Dual publicering** = samma HTML/CSS/JS både på GitHub Pages och Vercel, så view-source ser likadan ut. Det är mönstret för programversionen och den statiska tvillingen. ver2 bryter det redan delvis (Functions syns inte i Pages-versionen). ver3 bryter det medvetet om 4c står fast.

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

**Medvetet avsteg från skillens exempelprompt:** referensprompten är en slankare investeringskalkyl. Den här PRD:n föreslår att porta *fem-perspektiv-kalkylen* (4e). Next.js är skalet.

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

Uppdraget i chatten nämnde mappnamnet `vindkraft:Vercel_ver3`. Kolon är ogiltigt i Windows-sökvägar. Mappen skapades därför som `vindkraftskalkyl_Vercel_ver3`, i linje med `vindkraftskalkyl_Vercel_ver2`. Bekräftelse: se 4a.

De tre äldre lagren ska **inte** ersättas av den här PRD:n. ver3 är ett nytt Vercel-projekt i samma team (Effektiv / `effektiv1`), samma GitHub-repo, annan Root Directory.

**Tillägg 2026-09-15 kväll.** Kent läste v1 och invände mot att agenten, med stöd i den dåvarande skillen, behandlade Next.js som något man inte ska anta bara för att Vercel nämns. Uppdraget var redan “till fullo”. Överenskommelsen: *till fullo* = Next.js (App Router) bland annat, inte ett sidospår. 4b frystes. Skillen `nextjs-vercel-app-prompting` (Cursor) och referensen `vercel-resa-fran-forsta-kalkylen.md` uppdaterades samma kväll. Claude-kopian av skillen (`C:\Users\kentl\.claude\skills\nextjs-vercel-app-prompting\`) fick samma regel införd; den filen är i övrigt en äldre promptmall och är inte en full synk.

---

<a id="2-Syfte"></a>

## 2. Syfte [#](#2-Syfte)

- Bygga en vindkraftskalkyl som **är** en Vercel-app, inte bara ligger på Vercel: framework-medveten deploy, riktiga URL:er, serverkod där hemligheter krävs, preview per branch.
- Bevara kalkylens *innebörd* för användaren: fem perspektiv, transparenta antaganden, gula indatafält, LCOE/payback/NPV/IRR, kalkylen räknar även om ett API strular.
- Göra skillnaden mot GitHub Pages *kännbar och förklarad* (teknik-modal), utan att släppa in hela Vercel-katalogen i en kalkyl som inte behöver Auth, agenter eller WebSockets.
- Ha ett spårbart kravdokument innan `create-next-app` körs, så implementationen inte gissar stack, dual-publicering eller vilka Functions som ska med.

**Vad “till fullo” betyder här:** rätt arkitektur — **Next.js (App Router)**, beslutat i 4b — plus de klossar GitHub Pages inte kan *och som kalkylen vinner på*, i faser (4f, 4i, 4k). Inte att kryssa av Auth, AI Gateway, Blob, Queues, Sandbox, eve och WebSockets för att de finns i plattformen.

---

<a id="3-Omfattning"></a>

## 3. Omfattning [#](#3-Omfattning)

### Ingår (när PRD:n är fryst och, om 4g står fast, SPEC.md är skriven)

Punkterna nedan utom den redan skapade mappen är **förslag tills 4c och 4e är beslutade.** 4b är beslutad: Next.js (App Router). Fem-perspektiv-porten (4e) är fortfarande förslag.

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
- README med lokal sökväg, live-länk (när den finns) och korsreferens till de tre äldre lagren.
- `.gitignore` som utelämnar `.env*`, `.vercel`, `node_modules`, `.next`.

### Ingår i senare fas, inte i första live-versionen (förslag — se 4f)

- Cron Job som nattligen hämtar/cacherar dygnssnitt för SE1–SE4 ([Vercel, 2026d](https://vercel.com/docs/cron-jobs)). Tidzon UTC. Hobby-planens aktuella intervallgräns ska slås upp vid implementation, inte gissas här.
- Dynamisk OG-bild (`next/og`) när en delad kalkyl-länk ska se ut som ett kort, inte som en tom flik ([Next.js, 2026b](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)).
- `vercel.ts` som projektkonfiguration när cron/headers behövs ([Vercel, 2026e](https://vercel.com/docs/project-configuration/vercel-ts)). Första deployen kan räcka med Next.js nollkonfiguration.

### Ingår inte

- Att ersätta eller stänga programversionen, rosy-appen eller ver2.
- Dual publicering av *samma* Next.js-build till GitHub Pages i v1 (se 4c). Pages fortsätter hosta HTML-kalkylen.
- Nytt Vercel-team. Nytt GitHub-repo.
- Ny ekonomisk modell, nya perspektiv eller nya LCOE-formler — om inte en senare PRD säger det.
- Inloggning / Auth.
- AI-chatt, AI Gateway, eve, Vercel Sandbox, Queues, WebSockets.
- Vercel Blob eller Postgres, så länge Redis räcker för korta scenarier.
- PDF-export (nämnd som möjlig Function i ver2, inte byggd där heller).
- Att agenten committar eller pushar, eller skapar Vercel-projektet åt Kent.
- Att köra `create-next-app` innan öppna frågor i avsnitt 4 är stängda nog, och innan SPEC.md om 4g blir ja.
- Vite-regler (`base: './'`, `outDir: 'dist'`) — de gäller Vite-projekt. Next.js har eget byggsteg (`next build`, `.next/`). Medvetet undantag, inte ett glömt krav.

---

<a id="4-Fragor-och-beslut"></a>

## 4. Frågor och beslut [#](#4-Fragor-och-beslut)

<a id="4a-Mappnamn"></a>

**a) Vilket mappnamn? — FÖRSLAG UTFÖRT, VÄNTAR BEKRÄFTELSE** [#](#4a-Mappnamn)

Kent skrev `vindkraft:Vercel_ver3`. Kolon kan inte ingå i ett Windows-mappnamn. Befintligt mönster är `vindkraftskalkyl_Vercel_ver2`.

**Förslag som redan är skapat lokalt:** `vindkraftskalkyl_Vercel_ver3`.

Alternativ om Kent vill något kortare: `vindkraftskalkyl_Vercel_ver3` står ändå fast som default tills annat sägs. Byt inte tyst.

---

<a id="4b-Stack"></a>

**b) Next.js (App Router) eller mer HTML/Functions? — BESLUTAT ✓ (2026-09-15)** [#](#4b-Stack)

När Vercel-teknik ska användas **till fullo** ska Next.js (App Router) användas. Det är inte samma sak som att ordet Vercel nämns, och inte samma sak som ver2 (HTML + Functions, preset Other).

Kent invände mot v1:s försiktighet (“anta inte Next.js bara för att du sa Vercel”). Överens: *till fullo* inkluderar App Router. Skillen är rättad så att framtida agenter inte gör om samma miss.

**Beslut:** Next.js (App Router) + TypeScript + Tailwind CSS. Aktuell docs-linje vid skrivandet: Next.js 16.x via [llms.txt](https://nextjs.org/docs/llms.txt) ([Next.js, 2026c](https://nextjs.org/docs/llms.txt); agentindex visade 16.3.5 den 15 september 2026). Exakt `create-next-app`-version låses i SPEC.md / vid scaffolding, inte mot träningsdata.

Arbete *i ver2* är ett annat uppdrag och stannar på HTML tills någon uttryckligen ber om att flytta den appen.

---

<a id="4c-Dual"></a>

**c) Dual publicering (GitHub Pages + Vercel identiskt)? — FÖRSLAG, ÖPPEN** [#](#4c-Dual)

Projekt-skillen för dual publicering säger att nya modeller *bör* följa samma mönster. Next.js har ett byggsteg. View-source blir inte tre platta filer.

**Förslag:** ver3 är **Vercel-only som app**. GitHub Pages fortsätter visa programversionen. README och teknik-modal förklarar de fyra adresserna (Pages, rosy, ver2, ver3) i stället för att låtsas att de är samma binär.

Om Kent vill ha en Pages-spegel senare: exportera statiskt där det går, som ett *eget* senare beslut — inte ett dolt krav i v1.

---

<a id="4d-Vercel-projekt"></a>

**d) Vercel-projektnamn, team, Root Directory? — FÖRSLAG, ÖPPEN** [#](#4d-Vercel-projekt)

| Val | Förslag |
|-----|---------|
| Team | Effektiv (`effektiv1`) — samma som ver2, inte ett nytt team |
| Project Name | `vindkraft-ver3` |
| Root Directory | `vindkraftskalkyl_Vercel_ver3` |
| Framework | Next.js (autodetekteras) |
| Production-URL | troligen `https://vindkraft-ver3.vercel.app` (Vercel tilldelar; namnet kan krocka om det redan är taget) |

Kent skapar projektet i dashboarden efter första push, samma arbetssätt som ver2. Agenten skapar det inte.

---

<a id="4e-Kalkyl"></a>

**e) Samma kalkyl (fem perspektiv) eller en slankare investeringskalkyl? — FÖRSLAG, ÖPPEN** [#](#4e-Kalkyl)

Referensprompten för Next.js-kalkylatorn är en slankare investeringskalkyl (effekt, LCOE, känslighet). Live-kalkylen som Kent faktiskt använder är **fem perspektiv** plus NU20.

**Förslag:** porta fem-perspektiv-kalkylen (samma indata och formler som ver2). Next.js är skalet. En slankare kalkyl skulle vara ett annat verktyg, och då ska det sägas rakt.

---

<a id="4f-Klossar"></a>

**f) Vilka Vercel-klossar i första live-versionen? — FÖRSLAG, ÖPPEN** [#](#4f-Klossar)

Redan prövat i ver2, ska *återanvändas* (inte läras om): Functions/Route Handlers, env, Redis, Root Directory, Git-deploy.

**Förslag fas 1 (första live):**

1. Next.js (App Router) — det GitHub Pages och ver2 *inte* är.
2. Riktiga sidor (se 4i).
3. `GET` elpris + `GET`/`POST` scenario som Route Handlers.
4. Redis (Upstash via Marketplace, samma linje som ver2; Vercel KV är borta) ([Vercel, 2026f](https://vercel.com/docs/redis)).
5. Preview-URL per branch.
6. Teknik-modal som förklarar varför detta *inte* är rosy/ver2.

**Förslag fas 2 (när fas 1 räknar rätt i production) — se också 4k:**

7. Cron för nattlig elpris-hämtning, så dygnssnittet finns även om ingen har sidan öppen ([Vercel, 2026d](https://vercel.com/docs/cron-jobs)).
8. OG-bild för delade länkar, med tal från kalkylen ([Next.js, 2026b](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)).
9. Eventuell cache/revalidate av elpris så ENTSO-E inte anropas på varje klick.

**Medvetet senare / troligen aldrig i den här appen:** Auth, AI, Blob, WebSockets.

En kloss i taget vid implementation, även om PRD:n listar dem nu. Det är skillnaden mellan *plan* och *bygge*.

---

<a id="4g-SPEC"></a>

**g) Behövs ett SPEC.md-steg härifrån? — FÖRSLAG JA, ÖPPEN** [#](#4g-SPEC)

Stående fråga i varje PRD ([Lundgren, 2026d](https://klel.wordpress.com/2026/08/02/behover-jag-en-spec-md/)). Svaret är oftast nej. Här är förslaget **ja**.

Skäl: leveransen är tekniskt komplex och agent-driven (`create-next-app`, App Router-filer, port av `berakningar.js`, Route Handlers, env-namn, Redis-variabelpar som redan gick isär en gång i ver2). En människa fyller i “samma kalkyl” med kontext. En agent fyller i samma lucka med en gissning.

SPEC.md ska skrivas **efter att den här PRD:n frysts** (särskilt 4c, 4e, 4i, 4k; 4b är redan beslutad), **innan** scaffolding. Den ska innehålla: indatafält-id:n att porta, formelparitet mot ver2, API-kontrakt, vad som händer när token saknas, och acceptanskriterier för “kalkylen räknar utan API”.

Om Kent vill börja med en tom Next.js-hello och fylla kalkylen senare kan SPEC.md vänta till kalkyl-porten — men inte hoppas över helt.

---

<a id="4h-Utseende"></a>

**h) Behålla ver2:s utseende eller ny, “appig” design? — ÖPPEN** [#](#4h-Utseende)

Två rimliga linjer:

1. **Igenkänning:** samma palett, samma gula fält, samma fem flikar — bara skalet byts. Snabbare att jämföra formelparitet.
2. **Ny yta:** Tailwind, kortlayout, egna URL:er per perspektiv. Tydligare att det är en ny app; högre risk att “samma kalkyl” känns som en annan produkt.

Ingen av dem är vald. Första utkastet lutar mot (1) för *färger och gula fält* i fas 1. 4i:s perspektiv-URL:er kan ersätta flikar även om paletten är densamma — det är routing, inte en visuell omdesign. Kent avgör.

---

<a id="4i-Rutter"></a>

**i) Vilka URL:er, och hur App Router delas upp? — FÖRSLAG, ÖPPEN** [#](#4i-Rutter)

App Router är en sidväxlare. HTML-kalkylen har en `index.html` och låtsas att flikar är sidor. Adressen är densamma. Det är skillen som sätter den skillnaden: flikar döljer divar; App Router ger riktiga URL:er.

**Föreslagen uppdelning (arkitektur, inte bara fillista):**

| Del | Var | Varför |
|-----|-----|--------|
| Skal, ingress, källor, NU20-text | Server Components (`layout.tsx`, `/om`) | Ingen interaktivitet. Mindre JS. |
| Gula fält, nyckeltal, diagram | Client Component (t.ex. `components/CalculatorForm.tsx`) | State, `onChange`, diagram. |
| Formler | `lib/calculations.ts` | Samma tal som ver2, testbart utan UI. |
| Elpris och delning | `app/api/.../route.ts` | Hemligheter stannar på servern. Samma uppgift som ver2, ny filform. |

**Bas-URL:er:**

| URL | Fil | Innehåll |
|-----|-----|----------|
| `/` | `app/page.tsx` | Kort ingång: vad kalkylen är, länkar till kalkyl + om + de tre äldre live-URL:erna |
| `/kalkyl` | `app/kalkyl/page.tsx` | Översikt, alla fem nyckeltal (Client Component där state behövs) |
| `/om` | `app/om/page.tsx` | Antaganden, källor, skillnad mot Pages/ver2 |
| `/api/elpris` | `app/api/elpris/route.ts` | Samma uppgift som ver2 |
| `/api/scenario` | `app/api/scenario/route.ts` | Samma uppgift som ver2 |

Alternativ: kalkylen *är* `/` (som i HTML-versionerna). Då blir ingången tunnare. **Öppet.**

**Perspektiv som adresser (förslag, det HTML inte kan):**

| URL | För vem |
|-----|---------|
| `/kalkyl/investerare` | LCOE, NPV, IRR i förgrunden |
| `/kalkyl/markagare` | Arrende |
| `/kalkyl/kommun` | Lokala intäkter, schablon CO₂ |
| `/kalkyl/andelsagare` | Kooperativ modell |
| `/kalkyl/narboende` | NU20 — länken man skickar till den som berörs |

Indata är gemensam (samma layout, samma scenario via `?s=`). Det som byts är vilken historia som är i förgrunden. Fas 1 kan leva med `/kalkyl` och flikar; perspektiv-URL:erna är det som gör App Router *kännbart* för användaren, inte bara för den som tittar i `app/`. Se 4k:1.

Gemensamt skal: `app/layout.tsx` (Server Component så långt det går). `'use client'` bara där state, events eller webbläsar-API behövs.

---

<a id="4j-Vite-undantag"></a>

**j) Kents Vite-regler (`base: './'`, `dist/`)? — BESLUTAT ✓ (för den här PRD:n)** [#](#4j-Vite-undantag)

De reglerna gäller Vite-projekt. ver3 är Next.js (4b). Då är `next.config.ts` (eller motsvarande) konfigurationsfilen, inte `vite.config.js`. Relativa sökvägar på GitHub Pages är inte målet om 4c står fast. Dokumenterat så att en framtida agent inte “rättar” Next.js till Vite.

---

<a id="4k-Extra-bra"></a>

**k) Tre saker som kan bli extra bra — FÖRSLAG, ÖPPEN** [#](#4k-Extra-bra)

Inte “mer Vercel” i största allmänhet. Tre grejer GitHub Pages och ver2 *inte* kan, och som passar *den här* kalkylen. Auth, chatt och WebSockets hör inte hit.

1. **Närboendesidan som en länk man vågar skicka.**  
   `…/kalkyl/narboende?s=wqdmm7` öppnar *deras* perspektiv, inte en flik någon måste hitta. Produkt, inte ramverk. Kräver 4i:s perspektiv-URL:er. Kan vänta till efter att `/kalkyl` räknar rätt.

2. **Ett delningskort med riktiga tal.**  
   När länken klistras i mejl eller LinkedIn: en OG-bild som Vercel ritar (`next/og`) med t.ex. “LCOE 48 öre/kWh · payback 9 år · närboende X kr/år”. I ver2 är delningen en URL. Här kan delningen *se ut som kalkylen*. Fas 2.

3. **Dagens spotpris ligger där, utan knapp.**  
   Cron hämtar dygnssnittet (UTC). Sidan visar “SE4 idag …” med källa och datum. Knappen “Hämta” i ver2 är ett anrop. Här blir priset en egenskap hos sidan. Kalkylens 25-årsantagande förblir ett gult fält — dagens spot är information, inte en tyst överskrivning. Samma distinktion som ver2, men Vercel gör jobbet även när ingen har sidan öppen. Fas 2. Hobby-planens aktuella cron-gräns slås upp vid implementation, inte gissas här.

---

<a id="5-Leveranser"></a>

## 5. Leveranser [#](#5-Leveranser)

Checklista. Avbockning ska spegla avsnitt 4 — inget här är “klart” bara för att det står i PRD:n.

**Den här omgången (v1–v1.2):**

- [x] Skapa mappen `vindkraftskalkyl_Vercel_ver3/` (lokalt, 2026-09-15).
- [x] Första utkast till denna PRD.
- [x] README som säger att appen inte är byggd än, plus lokal sökväg.
- [x] `.gitignore` för framtida `.env`, `.vercel`, `node_modules`, `.next`.
- [x] v1.2: skillens roll, 4b beslutad, App Router-uppdelning, tre produktidéer (4k).
- [x] `nextjs-vercel-app-prompting` uppdaterad så “till fullo” = spår B / Next.js (App Router) som default.

**Nästa, innan kod:**

- [ ] Kent tar ställning till resterande 4a, 4c, 4e, 4g, 4h, 4i, 4k.
- [ ] Fräscha-ögon-genomläsning av hela PRD:n när Kent säger att den kan frysas (Regel 7 — inte samma sak som detta utkast).
- [ ] SPEC.md om 4g blir ja.

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
2. **Kent svarar på avsnitt 4** — dual-publicering, vilken kalkyl, rutter, 4k. (Stacken 4b är beslutad.)
3. **Frys PRD** efter en fräscha-ögon-genomläsning, inte efter första utkastet.
4. **SPEC.md** (om 4g = ja) — fält, formler, API-kontrakt, felvägar.
5. **Scaffold Next.js** i den här mappen. Visa filträdet. Ingen stealth-omdesign.
6. **Port av kalkyl + Route Handlers.** En fungerande `/kalkyl` som räknar utan API, *sedan* elpris och scenario.
7. **Kent: commit, push, skapa Vercel-projektet** (team Effektiv, Root Directory, env, ev. Redis).
8. **Verifiera production.** Först därefter cron/OG som fas 2.
9. **Dokumentera live-URL** i README, `CLAUDE.md` och rot-README.

Inte: skapa Vercel-projektet innan det finns något att bygga. Inte: byta formler samtidigt som skalet byts.

---

<a id="7-Kallor"></a>

## 7. Källor [#](#7-Kallor)

Alfabetisk, annoterad. Externa, citerbara källor först. Hämtdatum 15 september 2026 där källan är en föränderlig docs-sida. Länkarna är öppnade/kontrollerade i samma session som utkastet skrevs.

Lundgren, K. (2026a) *PRD – Generell mall (struktur för hur en PRD byggs upp i det här arbetssättet).* GitHub, `kentlundgren/AI-teknik`. Tillgänglig: https://github.com/kentlundgren/AI-teknik/blob/main/AI_modeller/Claude/olika_Claude_modeller/PRD/PRD_generell.md (hämtad 15 september 2026). *(Mall för header, avsnitt 1–8, SPEC.md-checkpoint och fräscha-ögon-vana — den här filen följer den strukturen.)*

Lundgren, K. (2026b) *Vercel-teknik – vad som är unikt med vindkraftskalkyl_Vercel_ver2.* GitHub, `kentlundgren/Vindkraft`. Tillgänglig: https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/Vercel-teknik-ver2.md (hämtad 15 september 2026). *(Vad ver2 redan gör med Functions, env och Redis — utgångspunkten ver3 inte ska lära om från noll.)*

Lundgren, K. (2026c) *Vindkraftskalkyl – Vercel ver2* (README). GitHub, `kentlundgren/Vindkraft`. Tillgänglig: https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver2/README.md (hämtad 15 september 2026). *(Deploy-steg till teamet Effektiv, elpriskälla ENTSO-E, filstruktur för HTML+Functions.)*

Lundgren, K. (2026d) *Behöver jag en spec.md?* klel.wordpress.com, 2 augusti. Tillgänglig: https://klel.wordpress.com/2026/08/02/behover-jag-en-spec-md/ (hämtad 15 september 2026). *(Varför SPEC.md är en stående fråga, inte ett obligatoriskt dokument — 4g i den här PRD:n.)*

Next.js (2026a) *Route Handlers.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started/route-handlers (hämtad 15 september 2026). *(Next.js-motsvarigheten till ver2:s `api/*.js` — Web Request/Response, inte Pages Router.)*

Next.js (2026b) *Metadata and OG images.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started/metadata-and-og-images (hämtad 15 september 2026). *(Fas 2-förslaget om delningskort; inte ett krav i första live-versionen.)*

Next.js (2026c) *llms.txt* (agentindex, Next.js 16.3.5 vid kontroll). Tillgänglig: https://nextjs.org/docs/llms.txt (hämtad 15 september 2026). *(Versionsstämplad ingång till App Router-dokumentationen; slår träningsdata.)*

Next.js (2026d) *Getting Started.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started (hämtad 15 september 2026). *(Installation, `app/`, layout/page, Server vs Client — basen för 4b/4i.)*

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

15 september 2026 kväll: mappen finns. PRD v1.2. **4b beslutad:** Next.js (App Router) är skalet när Vercel används till fullo. 4j var redan beslutad. Ingen appkod. Inget Vercel-projekt. Ingen live-URL.

Skillen `nextjs-vercel-app-prompting` (Cursor) säger nu att “till fullo” är spår B som default. Claude-kopian har samma regel införd men är i övrigt en äldre promptmall.

Öppet eller förslag: 4a (mappnamn i praktiken skapat), 4c, 4d, 4e, 4f, 4g, 4h, 4i, 4k.

Nästa handling är Kents: nicka, ändra eller stryka i det som är kvar i avsnitt 4. Därefter en fräscha-ögon-genomläsning innan någon kallar PRD:n fryst.

---

## Ändringslogg

- 2026-09-15 (v1): Första utkast. Mapp skapad. Inga delfrågor frysta utom 4j (Vite-regler gäller inte Next.js). Skrivet efter genomgång av ver2:s teknikfil, PRD-mallen, Vercel-resan och levande Vercel-/Next.js-docs samma dag.
- 2026-09-15 (v1.1): Intern genomläsning av utkastet (inte en frysning). Rättat “tre begrepp” → fyra lager i terminologin, och gjort avsnitt 3:s “Ingår” uttryckligen villkorat av 4b/4c/4e så omfattningen inte låtsas att stacken redan är beslutad.
- 2026-09-15 (v1.2): Kent: “till fullo” ska inkludera Next.js (App Router). 4b beslutad. Nytt avsnitt om hur skillen styrde v1, och en rättelse av att v1 läste “anta inte Next.js” för strikt. 4i utökad med Server/Client-uppdelning och perspektiv-URL:er. Ny 4k med tre produktidéer (närboendelänk, OG-kort, levande spotpris). Skillen `nextjs-vercel-app-prompting` (Cursor + delvis Claude-kopian) och `vercel-resa-fran-forsta-kalkylen.md` uppdaterade samma kväll. Avsnitt 3 villkorar nu 4c/4e, inte 4b.
