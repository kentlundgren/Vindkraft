# Vindkraftskalkyl – Vercel ver3

Live: *ingen ännu – kalkylen är inte portad.*  
Tänkt Vercel-projekt: **vindkraft-ver3** i teamet **Effektiv** (`effektiv1`) — se [PRD, delfråga 4d](PRD_vindkraftskalkyl_vercel_ver3.md#4d-Vercel-projekt).

Next.js (App Router) 16.3.5 är uppsatt i den här mappen. Starta lokalt med `npm run dev` (port 3000). Det du ser då är fortfarande Next.js startsida, inte kalkylen.

**Krav:** [PRD_vindkraftskalkyl_vercel_ver3.md](PRD_vindkraftskalkyl_vercel_ver3.md) (fryst v1.14)  
**Ritning:** [SPEC.md](SPEC.md)  
**Teknik på 15-åringssvenska:** [Vercel-teknik-ver3.md](Vercel-teknik-ver3.md)

De tre tidigare lagren ligger kvar oförändrade:

| Lager | Adress |
|-------|--------|
| Programversion (GitHub Pages) | [vindkraftskalkyl.html](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html) |
| Statisk Vercel-tvilling | [vindkraft-rosy.vercel.app](https://vindkraft-rosy.vercel.app) |
| Vercel ver2 (HTML + Functions) | [vindkraft-ver2.vercel.app](https://vindkraft-ver2.vercel.app) |

## 🗂️ Lokalt repo

Repo-rot lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

Den här mappen lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel_ver3`

På GitHub: <https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel_ver3>
*(länken blir giltig först när mappen committas och pushas.)*

---

*Uppdaterad 2026-09-15: Next.js-stommen ligger i mappen. Kalkylen byggs enligt SPEC.md.*
