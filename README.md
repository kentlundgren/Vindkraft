# Vindkraft

Det här repot handlar om **vindkraftens ekonomi** – och innehåller ett
interaktivt verktyg som räknar på den. Nedan finns först en allmän introduktion
till vindkraft, därefter en länk vidare till själva **vindkraftskalkylen**.

---

## 🗂️ Lokalt repo

`C:\Users\kentl\OneDrive\Kent – Personligt\AI\Cursor\Intressen\Vindkraft`

Ligger *inte* under `AI\Claude\`-strukturen där Ekonomi- och Ovrigt-repona
finns, utan under en egen gren: `AI\Cursor\Intressen\`. Ingen av
föräldramapparna (`Intressen`, `Cursor`, `AI`, `Kent – Personligt`) verkar
vara ett eget git-repo – ingen `.git`-mapp syns i någon av dem när dolda
filer visas i utforskaren (kontrollerat 2026-09-02). Repot ska alltså vara
fristående, till skillnad från Ekonomi som ligger nästlat inuti ett annat
repo (se [Ekonomi-repots README](https://github.com/kentlundgren/Ekonomi#%EF%B8%8F-nested-git-repo)
för det motsatta exemplet).

Vill du ha 100 % säkerhet: öppna en terminal i mappen och kör
`git rev-parse --show-toplevel` – svaret ska vara just denna sökväg.

---

## Vad är vindkraft?

Vindkraft omvandlar rörelseenergin i vinden till elektricitet. Vindens kraft
sätter rotorbladen i rörelse, som via en generator producerar el. Ju högre och
större verk, desto mer energi kan fångas – moderna landbaserade verk är i dag
ofta över 200 meter höga i tornhöjd plus rotorblad.

Vindkraft är en av de snabbast växande förnybara energikällorna i Sverige och
står för en betydande och ökande andel av elproduktionen. Produktionen varierar
med vinden och beskrivs ofta med en **kapacitetsfaktor** – hur stor andel av den
teoretiskt maximala produktionen ett verk faktiskt levererar över ett år.

Sverige är indelat i fyra **elområden (SE1–SE4)**, från norr till söder, där
elpriset kan skilja sig åt. Det påverkar i sin tur vindkraftens lönsamhet på
olika platser i landet.

## Vindkraftens ekonomi – flera perspektiv

Vindkraftens ekonomi ser olika ut beroende på vem man frågar. Samma anläggning
berör flera parter samtidigt:

- **Investeraren** – som bär investeringen och söker avkastning.
- **Markägaren** – som upplåter mark mot arrende.
- **Kommunen/samhället** – som får lokala intäkter och samhällsnytta (t.ex.
  undviken klimatpåverkan).
- **Andelsägaren** – som via en kooperativ modell kan köpa el till
  självkostnadspris.
- **Den närboende** – som från och med 1 juli 2026 kan få del av intäkterna
  genom den nya lagen om intäktsdelning (prop. 2025/26:239, NU20).

Viktiga storheter som avgör lönsamheten är bland annat elpris, kapacitetsfaktor,
investeringskostnad, drift- och underhållskostnader, livslängd och kalkylränta.
För att jämföra olika projekt används ofta nyckeltalet **LCOE** (Levelized Cost
of Energy) tillsammans med payback, nettonuvärde (NPV) och internränta (IRR).

## Verktyget: Vindkraftskalkyl

I mappen [`vindkraftskalkyl/`](vindkraftskalkyl/) finns ett interaktivt verktyg
som beräknar och visualiserar vindkraftens ekonomi **samtidigt ur alla fem
perspektiven ovan**. Ändra ett indatafält så räknas allt om direkt.

- **Kör verktyget direkt (Live Page):**
  [Öppna Vindkraftskalkylen](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html)
- **Läs mer om verktyget:**
  [README i mappen `vindkraftskalkyl/`](vindkraftskalkyl/README.md)

Verktyget bygger vidare på Kent Lundgrens befintliga kalkyl
([kentlundgren.se/kalkyler/vindkraftskalkyl.html](https://kentlundgren.se/kalkyler/vindkraftskalkyl.html))
och är byggt med enbart HTML, CSS och JavaScript (Chart.js för diagram).

## 🗂️ Lokalt repo

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

## Relaterade vindkraftskalkyler

Kent har flera vindkraftskalkyler på olika ställen, lokalt och på GitHub:

| Kalkyl | GitHub | Live Page | Lokal sökväg |
| --- | --- | --- | --- |
| **Vindkraftskalkyl – fem perspektiv** ← *du är här* | [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl) | [Öppna](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html) | `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl` |
| Investeringskalkylator (4 MW, Gemini 3) | [kentlundgren/AI-teknik](https://github.com/kentlundgren/AI-teknik/tree/main/Vindkraft/260814/Gemini3) | [Öppna](https://kentlundgren.github.io/AI-teknik/Vindkraft/260814/Gemini3/vindkraftskalkyl_260814.html) | `C:\Users\kentl\OneDrive\AI\AI-teknik\Vindkraft\260814\Gemini3` |
| Ursprunglig vindkraftskalkyl | *(ej i git)* | [kentlundgren.se](https://kentlundgren.se/kalkyler/vindkraftskalkyl.html) | – |
| Vindkraftskalkyler (Python, tidigt utkast 2024) | *(ej i git)* | – | `C:\Users\kentl\PycharmProjects\Vindkraftskalkyler` |

## Innehåll i repot

| Sökväg | Beskrivning |
| --- | --- |
| [`vindkraftskalkyl/`](vindkraftskalkyl/) | Det interaktiva beräkningsverktyget (HTML/CSS/JS) med egen README. |
| [`vindkraftskalkyl_Vercel/`](vindkraftskalkyl_Vercel/) | Samma kalkyl som statisk Vercel-app. Live: [vindkraft-rosy.vercel.app](https://vindkraft-rosy.vercel.app). |
| [`vindkraftskalkyl_Vercel_ver2/`](vindkraftskalkyl_Vercel_ver2/) | Kalkylen med två Vercel Functions (elpris, delningslänkar). Live: [vindkraft-ver2.vercel.app](https://vindkraft-ver2.vercel.app). |
| [`vindkraftskalkyl_Vercel_ver3/`](vindkraftskalkyl_Vercel_ver3/) | Kalkylen ombyggd som Next.js-app (App Router) med egna adresser per perspektiv, elpris från ENTSO-E, delningslänkar och serverritade förhandsvisningsbilder. Live: [vindkraft-ver3.vercel.app](https://vindkraft-ver3.vercel.app). |
| [`skanes-vindkraftsakademi/`](skanes-vindkraftsakademi/) | Anteckningar och research kopplat till styrelsearbete i Skånes vindkraftsakademi (ERUF/Letter of Support, iskast, vindkraftsägare i Skåne, kommunernas energi-/vindbruksplaner, Önnerupsprojektet m.m.). |
| `README.md` | Denna fil – allmän introduktion till vindkraft. |
| `.gitignore` | Ignorerar OS-/editorfiler och eventuella framtida beroenden. |

## Källor

- Regeringen (2026) *Proposition 2025/26:239 Vindkraft i kommuner.*
  [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/proposition/vindkraft-i-kommuner_hd03239/)
- Sveriges riksdag (2026) *Vindkraft i kommuner. Betänkande 2025/26:NU20.*
  [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/vindkraft-i-kommuner_hd01nu20/)
- Energimyndigheten (2026) *Vindkraft.*
  [energimyndigheten.se](https://www.energimyndigheten.se/fornybart/vindkraft/)
- Energimyndigheten (2024) *Kostnaden för att bygga vindkraft fortsätter att öka.*
  [energimyndigheten.se](https://www.energimyndigheten.se/nyhetsarkiv/2024/kostnaden-for-att-bygga-vindkraft-fortsatter-att-oka/)
