# CLAUDE.md – Vindkraft-repot

**Repo:** [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft)
**Live (GitHub Pages):** https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html
**Live (Vercel-app):** https://vindkraft-rosy.vercel.app
**Senast uppdaterad:** 2026-09-14
**Version:** 1.2

---

## Om detta repo

Samlar vindkraftsrelaterat innehåll:

| Mapp | Innehåll |
| ---- | -------- |
| `vindkraftskalkyl/` | Interaktivt beräkningsverktyg (HTML/CSS/JS) – GitHub Pages-version. |
| `vindkraftskalkyl_Vercel/` | Samma kalkyl deployad som app via Vercel (Root Directory för projektet "vindkraft"). |
| `skills/` | Lokala skills för Claude/Cursor, bl.a. dual-publiceringsmönstret. |
| `skanes-vindkraftsakademi/` | Anteckningar och research kopplat till styrelsearbete i Skånes vindkraftsakademi. |

---

## Dual publicering (viktigt mönster)

Det finns **två live-URL:er** till samma kalkyl:

- GitHub Pages = den "vanliga" programversionen
- Vercel = den deployade app-versionen

För användaren ska de kännas identiska (samma HTML/CSS/JS, relativa länkar).  
Skillnaden ligger bakom kulisserna: Vercel ger automatisk deploy vid push, bättre CDN och enklare vidareutveckling.

**Lokalt skill i detta repo:**  
`skills/vercel-github-pages-dual-publicering/SKILL.md`

Claude och Cursor ska läsa detta skill när de arbetar med publicering, deploy eller jämförelser mellan GitHub Pages och Vercel i detta projekt.

När nya modeller/program skapas i detta repo är intentionen att de också ska kunna få en motsvarande Vercel-app (via Git-integration + Root Directory). Dokumentera nya appar i README och här.

Arbete sker bäst via **Cursor** (med Claude): redigera → commit/push från Cursor → Vercel deployar automatiskt.

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

**Kent commitar och pushar själv.** Claude commitar endast om Kent uttryckligen ber om det.

---

## Uppdateringslogg

- 2026-09-14 (v1.2): Lagt till lokal skill under `skills/vercel-github-pages-dual-publicering/` och pekat ut den i CLAUDE.md.
- 2026-09-14 (v1.1): Lagt till Vercel-appen, dual-publiceringsmönster och Cursor-arbetssätt.
- 2026-09-02 (v1.0): Skapad, med regeln om initialer för personnamn i
  GitHub-innehåll.

---

_CLAUDE.md v1.2, 2026-09-14_
