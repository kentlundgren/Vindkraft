# Vindkraftskalkyl – Vercel-version

Denna mapp innehåller den version av vindkraftskalkylen som deployas via **Vercel**.

Den äldre (fortfarande levande) versionen finns i [`../vindkraftskalkyl/`](../vindkraftskalkyl/) och körs via **GitHub Pages**:
https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html

---

## Live-URL:er (två olika adresser till samma kalkyl)

| Plattform       | URL                                                                 | Kommentar |
|-----------------|---------------------------------------------------------------------|-----------|
| **Vercel**      | https://vindkraft-rosy.vercel.app                                   | Ny deployment under teamet Effektiv. CDN + automatisk deploy. |
| **GitHub Pages**| https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html | Ursprunglig live-sida. |

Det är **två olika URL:er** som leder till **samma kalkyl** (samma HTML/CSS/JS). Skillnaden ligger bara i hur de serveras.

---

## Vad som gjordes 2026-09-14

1. Skapade mappen `vindkraftskalkyl_Vercel/`.
2. Skrev denna README som förklarar arbetssättet.
3. Kopplade Vercel-projektet **vindkraft** (team Effektiv) till GitHub-repot med Root Directory = `vindkraftskalkyl_Vercel`.
4. Kopierade de tre filerna från den gamla mappen (index.html, stil.css, berakningar.js).
5. Första deployen gav 404 tills index.html fanns på plats.

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

## Nästa steg

- Kontrollera att https://vindkraft-rosy.vercel.app fungerar efter att filerna är på plats.
- Uppdatera Claude-kompassen när flödet känns stabilt.
- Eventuellt lägga till custom domain senare.

*Uppdaterad 2026-09-14.*
