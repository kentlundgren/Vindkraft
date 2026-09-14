# CLAUDE.md – Vindkraft-repot

**Repo:** [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft)
**Live (GitHub Pages):** https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html
**Live (Vercel-app, statisk):** https://vindkraft-rosy.vercel.app
**Live (Vercel-app, Functions):** https://vindkraft-ver2.vercel.app
**Senast uppdaterad:** 2026-09-15
**Version:** 1.6

---

## Om detta repo

Samlar vindkraftsrelaterat innehåll:

| Mapp | Innehåll |
| ---- | -------- |
| `vindkraftskalkyl/` | Interaktivt beräkningsverktyg (HTML/CSS/JS) – GitHub Pages-version. |
| `vindkraftskalkyl_Vercel/` | Samma kalkyl som statisk Vercel-app (projektet "vindkraft", https://vindkraft-rosy.vercel.app). |
| `vindkraftskalkyl_Vercel_ver2/` | Vercel-anpassad kalkyl med Functions (`/api/elpris`, `/api/scenario`). Nytt projekt i teamet Effektiv (`effektiv1`), inte en ersättning för den statiska appen. Live: https://vindkraft-ver2.vercel.app. Token till spotpris: `Hur-skaffa-nyckel-hos-ENTSO-E.md`. |
| `.cursor/skills/` | Projekt-skills som Cursor läser automatiskt. Dual-publiceringsmönstret ligger här. |
| `skanes-vindkraftsakademi/` | Anteckningar och research kopplat till styrelsearbete i Skånes vindkraftsakademi. |

---

## Dual publicering (viktigt mönster)

Det finns **två live-URL:er** till samma kalkyl:

- GitHub Pages = den "vanliga" programversionen
- Vercel = den deployade app-versionen

För användaren ska de kännas identiska (samma HTML/CSS/JS, relativa länkar).
Skillnaden ligger bakom kulisserna: Vercel ger automatisk deploy vid push, bättre CDN och enklare vidareutveckling.

**Projekt-skill (Cursor upptäcker den härifrån):**
`.cursor/skills/vercel-github-pages-dual-publicering/SKILL.md`

Cursor ska använda detta skill när arbetet handlar om publicering, deploy eller jämförelser mellan GitHub Pages och Vercel. Sökvägen är den som Cursor faktiskt läser – inte en fristående `skills/`-mapp i repo-roten.

När nya modeller/program skapas i detta repo är intentionen att de också ska kunna få en motsvarande Vercel-app (via Git-integration + Root Directory), som **nytt projekt i samma Vercel-team** (Effektiv / `effektiv1`), inte som ett nytt team. Dokumentera nya appar i README och här.

Arbete sker bäst via **Cursor**: redigera → Kent committar och pushar själv → Vercel deployar automatiskt.

---

## 📌 Regel – Personnamn i GitHub-innehåll (initialer)

I text som hamnar på GitHub (README:er, anteckningar, commit-meddelanden,
issues m.m.) ska Claude vara försiktig med personnamn:

- **Använd endast initialer** (t.ex. `ML` för Marcus Larsson) för personer som
  nämns informellt i konversationen (kollegor, kontakter, styrelseledamöter,
  m.fl.).
- **Undantag:** fullständiga namn är okej om de bygger på en **formell,
  offentlig källa** som redan innehåller namnet i klartext — t.ex.
  domstolshandlingar, myndighetsbeslut, publicerade rapporter eller
  nyhetsartiklar. Ange i så fall källan.
- Gäller inte Kents eget namn (redan offentligt kopplat till hans egna repon).

Denna regel gäller **övergripande** för alla Kents repon (se samma regel i
Ovrigt-repots `CLAUDE.md`, och bör även finnas i den globala filen
`AI\Claude\CLAUDE.md` på Kents lokala maskin).

---

## 📌 Regel – Commit och push

**Kent commitar och pushar själv.** Claude/Cursor commitar endast om Kent uttryckligen ber om det. Push kräver en egen, separat begäran – en begäran om commit är inte en begäran om push.

---

## 📌 Regel – Ett avsnitt, en djuplänk

När ett README-avsnitt ska kunna länkas med `#` (t.ex. ett promptavsnitt): **ett avsnitt får bara ha ett ankare och en publicerad länk.** Skapa inte ett extra id, alias eller en andra rad i länktabellen till samma text – även om flera URL-förslag dyker upp i chatten. Välj ett id, skriv in det, och återanvänd den länken överallt.

Gällande promptavsnitt i Vercel-README: `#Forslag_pa_promt`
(https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel#Forslag_pa_promt).

---

## Uppdateringslogg

- 2026-09-15 (v1.6): `Hur-skaffa-nyckel-hos-ENTSO-E.md` i ver2; live-URL för `vindkraft-ver2`.
- 2026-09-14 (v1.5): `vindkraftskalkyl_Vercel_ver2/` – Vercel-anpassad kalkyl med Functions, nytt projekt i teamet `effektiv1`.
- 2026-09-14 (v1.4): Regel om djuplänkar – ett avsnitt, ett ankare, en länk (promptavsnittet är `#Forslag_pa_promt`).
- 2026-09-14 (v1.3): Flyttat dual-publicerings-skillen till `.cursor/skills/` (rätt plats för Cursor), tagit bort den gamla `skills/`-sökvägen, och förtydligat commit/push samt att nya appar ska vara projekt i samma Vercel-team.
- 2026-09-14 (v1.2): Lagt till lokal skill under `skills/vercel-github-pages-dual-publicering/` och pekat ut den i CLAUDE.md.
- 2026-09-14 (v1.1): Lagt till Vercel-appen, dual-publiceringsmönster och Cursor-arbetssätt.
- 2026-09-02 (v1.0): Skapad, med regeln om initialer för personnamn i
  GitHub-innehåll.

---

_CLAUDE.md v1.6, 2026-09-15_
