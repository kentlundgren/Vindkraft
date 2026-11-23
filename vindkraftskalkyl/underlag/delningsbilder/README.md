# Delningsbilder för startsidan

- **Live:** [https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/) (startsidan som bilden hör till)

Tre förslag på delningsbild (Open Graph, 1200×630 px) till [startsidan](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/). Förslag 1 är vald och ligger som [`og-bild-start.jpg`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/og-bild-start.jpg) i `vindkraftskalkyl/`. De andra sparas här om jag vill byta senare.

| Fil | Bild | Status |
| --- | --- | --- |
| [`utkast_1_en_park_fem_parter.jpg`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/underlag/delningsbilder/utkast_1_en_park_fem_parter.jpg) | "En park. Fem parter." med verk och fem rutor | Vald, kopia i `og-bild-start.jpg` |
| [`utkast_2_tre_kalkyler.jpg`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/underlag/delningsbilder/utkast_2_tre_kalkyler.jpg) | "Tre kalkyler. Fem parter." med tre kort | Reserv |
| [`utkast_3_fragan.jpg`](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/underlag/delningsbilder/utkast_3_fragan.jpg) | "Vem får vad av en vindkraftspark?" i stor text | Reserv |
| [`skapa_utkast.py`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/underlag/delningsbilder/skapa_utkast.py) | Skriptet som ritar bilderna (Pillow, teckensnitten Segoe UI från Windows) | Ändra texten och kör om |

## Byta bild

1. Kopiera den valda filen till `vindkraftskalkyl/og-bild-start.jpg` (eller ett nytt namn, och ändra då `og:image` och `twitter:image` i `index.html`).
2. Höj versionen på startsidan (`index.js` och `UPPDATERING`-raden i `index.html`). Testet kontrollerar att bilden finns, är 1200×630 och under 300 kB.
3. Efter push: LinkedIn cachar bilder, så kör Post Inspector på startsidans adress.

## Repo

- GitHub: https://github.com/kentlundgren/Vindkraft
- Lokal sökväg: `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl\underlag\delningsbilder`
