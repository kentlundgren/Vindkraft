---
name: vercel-github-pages-dual-publicering
description: Mönster för dual publicering av statiska webbappar – samma HTML/CSS/JS både via GitHub Pages (programversion) och Vercel (appversion). Används när användaren publicerar interaktiva kalkyler eller webbverktyg, vill ha automatisk deploy via Cursor + Git, eller jämför Vercel med alternativ som Vite + React. Triggerord inkluderar Vercel app, dual publicering, GitHub Pages vs Vercel, view-source samma, relativa länkar, build Vite React, automatisk deploy.
metadata:
  type: workflow
  version: "1.0"
  created_via: conversation
  purpose: dokumentera och återanvända mönstret för dual publicering (GitHub Pages + Vercel) samt förklara build-begreppet och alternativ
  last_updated: 2026-09-14 15:15 CEST (Stockholm)
---

## Senaste ändringar
- **2026-09-14 15:15 CEST (Stockholm)**: Kopierad in i Vindkraft-repot under skills/ så att Claude och Cursor kan läsa det lokalt i projektet.
- **2026-09-14 14:15 CEST (Stockholm)**: Skapad globalt. Innehåller dual-publiceringsmönstret från vindkraftskalkyl_Vercel, förklaring av view-source/relativa länkar, Cursor-arbetssätt, alternativ till Vercel (Vite m.fl.) och build-begreppet.

# Dual publicering – GitHub Pages + Vercel (statiska webbappar)

## När detta skill ska användas
- När en interaktiv kalkyl eller webbapp ska publiceras både som "program" (GitHub Pages) och som "app" (Vercel).
- När användaren frågar varför view-source ser likadan ut, hur CSS/JS hittas, eller vad poängen med Vercel är jämfört med GitHub Pages.
- När nya modeller skapas under ett repo och ska få automatisk Vercel-deploy.
- När alternativ till Vercel (Vite, React, Netlify, Cloudflare Pages m.fl.) ska förklaras och när "build" behövs.

## Kärnmönstret (dual publicering)

```
Samma tre filer (index.html / *.html + stil.css + *.js)
        │
        ├─→ GitHub Pages  →  https://...github.io/.../fil.html
        │
        └─→ Vercel (Root Directory = mappen)  →  https://....vercel.app
```

- **Användaren ser ingen skillnad** – samma kalkyl, samma beteende.
- **Skillnaden ligger bakom kulisserna**: automatisk deploy, CDN, preview-URL:er, enklare vidareutveckling.
- **Relativa länkar** är nyckeln: `<link href="stil.css">` och `<script src="berakningar.js">` fungerar oavsett host så länge filerna ligger i samma mapp.

## Arbetssätt via Cursor
1. Redigera i Cursor (med Claude eller annan AI).
2. Commit + push från Cursor.
3. Vercel (om kopplat till repot med rätt Root Directory) deployar automatiskt.
4. GitHub Pages uppdateras också via samma push.

Fördel: du lämnar inte editorn. Deploy blir en naturlig del av arbetsflödet.

## Vad "build" betyder (Vite, React m.fl.)

**Build** = att ta källkod (ofta i modern syntax, komponenter, TypeScript, JSX) och **omvandla** den till vanliga filer som webbläsaren förstår (HTML, CSS, minifierad JS).

| Utan build (nuvarande vindkraftskalkyl) | Med build (Vite + React t.ex.) |
|-----------------------------------------|--------------------------------|
| Vanlig HTML + CSS + vanilla JS          | Komponenter, JSX, TypeScript, import/export |
| Ingen kompileringssteg                  | `npm run build` skapar en `dist/`-mapp |
| Fungerar direkt i webbläsaren           | Kräver byggsteg innan publicering |
| Enkel att förstå och debugga            | Bättre struktur för stora appar |

**Poängen med build (Vite/React m.fl.):**
- Möjliggör modern utvecklarupplevelse (hot reload, komponenter, typsäkerhet).
- Ger optimerad, snabbare kod till användaren (minifiering, tree-shaking, code-splitting).
- Gör det lättare att växa appen (många sidor, state management, routing).
- Kräver däremot mer verktyg och ett byggsteg – överkill för enkla kalkyler.

**Alternativ till Vercel för att publicera en app:**
- **Vite + React/Vue/Svelte** → bygg lokalt eller i CI → publicera `dist/` till GitHub Pages, Netlify, Cloudflare Pages eller Vercel.
- **Netlify** – liknande Vercel, bra för statiska och JAMstack-appar.
- **Cloudflare Pages** – snabb CDN, bra gratisnivå.
- **GitHub Pages** – enklast för rena statiska sidor (som den ursprungliga kalkylen).

Vercel utmärker sig med extremt enkel Git-integration och preview-deployments per branch.

## Konkreta regler för detta repo (Vindkraft)
- Mapp `vindkraftskalkyl/` = GitHub Pages-version.
- Mapp `vindkraftskalkyl_Vercel/` = Vercel-version (Root Directory i Vercel-projektet "vindkraft").
- GitHub-länken i Vercel-appen ska peka på `.../tree/main/vindkraftskalkyl_Vercel`.
- Teknik-modalen bör nämna att det finns både programversion (GitHub Pages) och appversion (Vercel).
- Nya modeller i framtiden bör följa samma dual-mönster och dokumenteras i CLAUDE.md + README.

## Cross-references
- Använd tillsammans med `vindkrafts-kalkyl` när beräkningslogik diskuteras.
- Se `ekosystem-analys-claude-kompassen` när arbetssätt (Claude + Cursor + Vercel) ska uppdateras.
- Se `github-program-katalog` för översikt över publika program och live-sidor.
- Se `readme-live-lank` – varje README med GitHub Pages-sida ska ha synlig live-länk.

## Framtida optimering med SkillOpt (när du sitter vid dator)
När du har tillgång till en dator med Python-miljö och LLM API-nycklar, använd **Microsoft SkillOpt** (https://github.com/microsoft/SkillOpt/tree/main) för att optimera detta skill.

**Snabbstart:**
1. `git clone https://github.com/microsoft/SkillOpt.git && cd SkillOpt`
2. `pip install skillopt`
3. Förbered task/benchmark för dual-publiceringsfrågor.
4. Kör optimiseringsloop och granska `best_skill.md`.

## Referenser
- Vercel dokumentation om Git-integration och static sites: https://vercel.com/docs (hämtad 2026-09-14).
- Vite guide: https://vitejs.dev/guide/ (hämtad 2026-09-14).
- GitHub Pages: https://docs.github.com/en/pages (hämtad 2026-09-14).
