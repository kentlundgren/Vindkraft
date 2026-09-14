# Vindkraftskalkyl – Vercel-version

Denna mapp är avsedd för den version av vindkraftskalkylen som byggs och deployas via **Vercel**.

Den äldre (och fortfarande levande) versionen finns i mappen [`../vindkraftskalkyl/`](../vindkraftskalkyl/) och körs via GitHub Pages:
https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

---

## Skillnad mellan "program" och "app"

I praktiken används orden ofta omväxlande, men det finns en nyttig distinktion:

| Begrepp | Betydelse i den här kontexten |
|---------|-------------------------------|
| **Program** | Ett mer generellt begrepp. Kan vara ett kommandoradsverktyg, ett skript, en desktop-applikation eller en webbkalkyl. Fokus ligger på *funktionalitet* och *logik*. |
| **App** (applikation) | Oftast en användarorienterad, interaktiv produkt – särskilt webbappar eller mobilappar. Fokus ligger på *användarupplevelse*, *gränssnitt* och att den körs i en webbläsare eller på en enhet. |

Vindkraftskalkylen är både:
- ett **program** (den innehåller beräkningslogik, LCOE, NPV, IRR m.m.), och
- en **webbapp** (den körs i webbläsaren, har interaktiva flikar, diagram och reaktiva indatafält).

När vi säger "skapa en app i Vercel" menar vi oftast en webbapp som deployas och får en publik URL.

---

## Hur Vercel, Git och GitHub arbetar ihop (bästa praxis)

### Grundprincipen

```
Cursor / Claude  →  lokala filer  →  git commit + push  →  GitHub
                                                              ↓
                                                         Vercel (lyssnar)
                                                              ↓
                                                    Automatisk deploy
                                                              ↓
                                                    Publik URL (t.ex. *.vercel.app)
```

1. **Git** är versionshanteringssystemet (lokalt på din dator).
2. **GitHub** är den centrala platsen där koden lagras och där andra (och Vercel) kan hämta den.
3. **Vercel** är plattformen som tar koden från GitHub, bygger den (om det behövs) och serverar den som en webbapp med HTTPS, CDN och automatiska preview-deployments.

### Rekommenderat arbetssätt för dig (Cursor + Claude + Vercel)

Du har redan en stark rutin med **Claude-kompassen** (se [AI-teknik / Claude-modeller](https://github.com/kentlundgren/AI-teknik/tree/main/AI_modeller/Claude/olika_Claude_modeller) och live-sidan).

När Vercel kommer in i bilden blir flödet så här:

| Steg | Verktyg | Vad du gör |
|------|---------|------------|
| 1. Idé & design | Claude (i Cursor eller chatt) | Diskutera, skriv prompt, skapa/uppdatera kod |
| 2. Redigera lokalt | Cursor | Claude (eller du) skriver filer i rätt mapp |
| 3. Versionshantera | Git (via Cursor/terminal) | `git add` → `git commit` → `git push` |
| 4. Lagra | GitHub | Koden landar i `kentlundgren/Vindkraft` |
| 5. Deploy | Vercel | Ser pushen → bygger automatiskt → ger URL |
| 6. Granska | Webbläsare | Öppna preview- eller production-URL |

**Viktigt:** Vercel skapar inte koden åt dig på samma sätt som Claude gör. Vercel *deployar* den kod som redan finns i GitHub. Du kan däremot använda Vercels AI-verktyg (v0, Agent m.m.) för att generera kod, men den bästa långsiktiga rutinen är fortfarande:

> Claude/Cursor skriver koden → du pushar till GitHub → Vercel deployar.

Detta behåller din kontroll, din Claude-kompass och gör det lätt att jämföra versioner.

### Claude-kompassen behöver uppdateras

Claude-kompassen beskriver ytor (surfaces) och harness för Claude. Nu när Vercel är ett aktivt verktyg bör kompassen utökas med:

- Vercel som *deploy-yta* och eventuell *genereringsyta* (v0/Agent).
- Tydlig rollfördelning: Claude = kod och resonemang, Vercel = hosting + automatisk CI/CD.
- Hur man håller ihop "lokal Cursor-session → GitHub → Vercel" utan att tappa spårbarhet.

Detta är en naturlig utveckling av arbetssättet – inte en ersättning.

---

## Så här kopplar du det här Vercel-projektet till GitHub

Du har redan skapat projektet **vindkalkyl** under teamet **Effektiv** (Hobby) på Vercel. Det har ännu ingen Production Deployment.

### Steg-för-steg (dashboard)

1. Gå till projektet: https://vercel.com/effektiv1 (eller klicka på **vindkalkyl**).
2. Gå till **Settings** → **Git**.
3. Klicka **Connect Git Repository** (eller "Connect").
4. Välj GitHub och auktorisera om det behövs.
5. Välj repot **kentlundgren/Vindkraft**.
6. Under **Root Directory** – skriv (eller välj) `vindkraftskalkyl_Vercel`.
7. Framework Preset: **Other** (static site) eller låt Vercel detektera.
8. Build Command: lämna tomt (ingen build behövs för ren HTML/CSS/JS).
9. Output Directory: lämna tomt.
10. Spara / Deploy.

Efter första lyckade deployen får du en URL i stil med:

- `https://vindkalkyl.vercel.app`  (eller liknande baserat på projektnamnet)
- Alternativt en mer specifik URL under teamet.

Du kan sedan lägga till en custom domain om du vill.

### Alternativ: skapa nytt projekt från GitHub

Om du vill börja om rent:

1. Gå till https://vercel.com/new
2. Importera **kentlundgren/Vindkraft**
3. Sätt Root Directory till `vindkraftskalkyl_Vercel`
4. Deploy

---

## Vad som ska ligga i den här mappen

När du (eller Claude i Cursor) skapar/uppdaterar den Vercel-baserade kalkylen ska filerna ligga här, t.ex.:

```
vindkraftskalkyl_Vercel/
├── README.md          ← den här filen
├── index.html         ← huvudfilen (eller vindkraftskalkyl.html)
├── stil.css
├── berakningar.js
└── (eventuellt vercel.json om specialkonfiguration behövs)
```

Tips: Börja med att kopiera de tre filerna från `../vindkraftskalkyl/` hit och justera vid behov. Då har du en fungerande baseline direkt.

---

## Nästa steg (för dig just nu)

1. Bekräfta att den här mappen och README:n ser bra ut.
2. Koppla Vercel-projektet **vindkalkyl** till det här repot + root directory enligt stegen ovan.
3. Pusha eventuell kod hit via Cursor (som vanligt).
4. Titta på den URL som Vercel ger dig efter deploy.
5. Uppdatera Claude-kompassen när du har testat flödet ett par gånger.

Fråga gärna om något steg känns oklart – det är helt normalt första gången man kopplar ihop Vercel med ett befintligt GitHub-repo.

---

*Skapad 2026-09-14. Uppdateras när arbetssättet stabiliserats.*
