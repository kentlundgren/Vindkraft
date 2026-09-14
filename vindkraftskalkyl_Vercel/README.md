# Vindkraftskalkyl – Vercel-version

Denna mapp innehåller den version av vindkraftskalkylen som deployas via **Vercel**.

Den äldre (fortfarande levande) versionen finns i [`../vindkraftskalkyl/`](../vindkraftskalkyl/) och körs via **GitHub Pages**:
https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

---

## Live-URL:er (två olika adresser till samma kalkyl)

| Plattform       | URL                                                                 | Kommentar |
|-----------------|---------------------------------------------------------------------|-----------|
| **Vercel**      | https://vindkraft-rosy.vercel.app                                   | Ny deployment under teamet Effektiv. |
| **GitHub Pages**| https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html | Ursprunglig live-sida. |

Det är **två olika URL:er** som leder till **samma kalkyl** (samma HTML, CSS och JavaScript).

---

## Upplever användaren någon skillnad?

**Nej – som vanlig användare/läsare ska man i princip inte märka någon skillnad.**

När du öppnar antingen
- https://vindkraft-rosy.vercel.app  eller
- https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

så ser du **exakt samma kalkyl**, samma flikar, samma beräkningar, samma diagram och samma gula indatafält. Kalkylen beter sig identiskt.

Det är medvetet. En välgjord webbapp ska kännas densamma oavsett vilken plattform som serverar den. Användaren ska tänka på *innehållet* (vindkraftens ekonomi), inte på *hur* sidan hostas.

### Vad skiljer sig då – och varför har man Vercel?

Skillnaden ligger **bakom kulisserna**, inte i det användaren ser:

| Aspekt                    | GitHub Pages                              | Vercel                                      |
|---------------------------|-------------------------------------------|---------------------------------------------|
| **Vad användaren ser**    | Samma kalkyl                              | Samma kalkyl                                |
| **Hosting**               | Enkel statisk hosting från GitHub         | Professionell plattform med globalt CDN     |
| **Deploy**                | Manuell / via GitHub Actions              | Automatisk vid varje `git push`             |
| **Preview**               | Begränsat                                 | Varje branch får egen preview-URL           |
| **Prestanda & tillförlitlighet** | Bra för enkla sidor                  | Oftast snabbare och mer robust              |
| **Framtidssäkring**       | Begränsat (mest statiskt)                 | Lätt att lägga till mer (API, auth, analytics, AI-funktioner m.m.) |
| **Arbetssätt**            | Bra för enkla publiceringar               | Bättre när man vill bygga vidare på appen   |

**Kort sagt:**

- För **användaren** ska det inte spela någon roll vilken URL man öppnar.
- För **dig som skapare** ger Vercel ett modernare, mer automatiserat och framtidssäkert sätt att publicera och vidareutveckla appen.

Poängen med Vercel är alltså **inte** att kalkylen ska se annorlunda ut. Poängen är att du får en stabil, snabb och automatiserad publiceringskedja, och att det blir lättare att växa appen över tid (t.ex. lägga till mer interaktivitet, datahämtning, inloggning eller AI-stöd senare) utan att byta plattform.

En bra Vercel-app (och en bra webbapp överhuvudtaget) ska kännas som "bara en vanlig bra webbsida" för den som använder den. All teknik under huven ska vara osynlig för användaren.

---

## Skillnad mellan "program" och "app"

| Begrepp     | Betydelse |
|-------------|-----------|
| **Program** | Generellt begrepp för kod med funktionalitet och logik (beräkningar, LCOE, NPV, IRR). |
| **App**     | Användarorienterad, interaktiv produkt – särskilt webbappar. Fokus på gränssnitt och upplevelse. |

Vindkraftskalkylen är både ett **program** (beräkningsmotor) och en **webbapp** (interaktiva flikar, diagram, reaktiva fält).

---

## Hur Vercel, Git och GitHub arbetar ihop

```
Cursor / Claude  →  lokala filer  →  git commit + push  →  GitHub
                                                              ↓
                                                         Vercel (lyssnar)
                                                              ↓
                                                    Automatisk deploy
                                                              ↓
                                                    Publik URL (*.vercel.app)
```

1. **Git** = versionshantering lokalt.
2. **GitHub** = central lagring + källa som Vercel hämtar från.
3. **Vercel** = tar koden, serverar den som webbapp med HTTPS och CDN.

### Rekommenderat arbetssätt (Cursor + Claude + Vercel)

| Steg | Verktyg              | Vad du gör |
|------|----------------------|------------|
| 1    | Claude (Cursor/chatt)| Idé, design, kod |
| 2    | Cursor               | Redigera filer i rätt mapp |
| 3    | Git                  | commit + push |
| 4    | GitHub               | Koden landar i repot |
| 5    | Vercel               | Automatisk deploy → URL |
| 6    | Webbläsare           | Testa resultatet |

Vercel *deployar* kod – den skapar inte koden åt dig på samma sätt som Claude. Bästa långsiktiga rutinen är:

> Claude/Cursor skriver koden → du pushar till GitHub → Vercel deployar.

Detta behåller din kontroll och Claude-kompassen.

### Claude-kompassen

Claude-kompassen (se [AI-teknik / Claude-modeller](https://github.com/kentlundgren/AI-teknik/tree/main/AI_modeller/Claude/olika_Claude_modeller)) behöver uppdateras med Vercel som deploy-yta. Det är en naturlig utveckling – inte en ersättning av arbetssättet.

---

## Filstruktur

```
vindkraftskalkyl_Vercel/
├── README.md          ← den här filen
├── index.html         ← startsidan (kopierad från vindkraftskalkyl.html)
├── stil.css
└── berakningar.js
```

Ingen build behövs. Vercel serverar filerna direkt som statisk webbplats.

---

## Vad som gjordes 2026-09-14

1. Skapade mappen `vindkraftskalkyl_Vercel/`.
2. Skrev och förbättrade denna README.
3. Kopplade Vercel-projektet **vindkraft** (team Effektiv) till GitHub-repot med Root Directory = `vindkraftskalkyl_Vercel`.
4. Kopierade de tre filerna från den gamla mappen.
5. Första deployen gav 404 tills index.html fanns på plats. Nu fungerar https://vindkraft-rosy.vercel.app.

---

*Uppdaterad 2026-09-14 – tydligare förklaring av vad användaren upplever (och inte upplever).*
