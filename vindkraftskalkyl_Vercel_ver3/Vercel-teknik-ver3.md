# Vad som blir annorlunda när Vercel används till fullo

Det här är **texten om skillnaden mot GitHub Pages** — skriven så att den ska gå att läsa utan att kunna Next.js. Appen ver3 är inte byggd än. Filen ska fyllas på senare (deploy, skärmbilder, exakta adresser). Just nu är poängen: *vad kalkylen kan göra då, som en sida med bara filer inte kan.*

Live: *ingen ännu.*  
Tänkt app: **vindkraft-ver3** i teamet Effektiv.  
Programversionen (GitHub Pages, bara filer) ligger kvar: [vindkraftskalkyl.html](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html).

## 🗂️ Lokalt repo

Repo-rot lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft`

Den här filen lokalt:

`C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl_Vercel_ver3\Vercel-teknik-ver3.md`

På GitHub: <https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl_Vercel_ver3/Vercel-teknik-ver3.md>
*(länken blir giltig först när filen committas och pushas.)*

---

<a id="Samma-rakning"></a>

## 1. Formlerna byts inte [#](#Samma-rakning)

En vindkraftskalkyl svarar på frågor som:

- Vad kostar elen att *producera* över hela livet? (LCOE — ungefär “snittpris per kWh när allt är med.”)
- När har investeringen betalat sig? (payback)
- Är projektet värt pengarna *idag*, om man räknar med ränta? (NPV)
- Vad tjänar markägaren, kommunen, andelsägaren, den närboende?

De frågorna kan GitHub Pages redan räkna. Du fyller **gula fält** (effekt, elpris, kalkylränta …). Webbläsaren räknar. Inget magiskt moln behövs för plus, minus och nuvärde.

**Vercel till fullo gör inte kalkylen “smartare på matte”.**  
Den gör kalkylen **bättre på verkligheten runt matten**: färskare priser, samma scenario hos två personer, och att rätt person landar på *sin* sida — med talen synliga redan i länken.

Om du bara vill räkna med siffror du själv skriver in räcker Pages. Skillnaden syns när du vill att kalkylen ska *hänga ihop med marknaden och med någon annan*.

---

<a id="Pages-ar-filer"></a>

## 2. GitHub Pages är ett räknehäfte du fyller i själv [#](#Pages-ar-filer)

Tänk GitHub Pages som ett **häfte på nätet**:

1. Du öppnar sidan.
2. Du skriver indata i gula rutor.
3. Häftet räknar **i din dator**.

Det är starkt. Det är också slutet. Häftet kan inte:

- gå ut och hämta **dagens officiella elpris** utan att lägga nyckeln i koden, där vem som helst kan läsa den med “visa källa”
- **vakna klockan fem** och uppdatera priset när ingen har sidan öppen
- **spara** ett ifyllt läge så att en kompis på en annan dator får samma gula fält, utan att du klistrar in en jättelång adress
- **rita ett förhandsvisningskort** med “LCOE 48 öre · payback 9 år” som syns när du klistrar länken i mejl, Teams, LinkedIn eller liknande — de programmen hämtar en bild från servern, de kör inte kalkylen

GitHub Pages är **bara filer** ([GitHub, 2026](https://docs.github.com/en/pages)). Ingen egen liten server. Ingen hemlig nyckel. Ingen nattlig hämtning.

Den statiska Vercel-adressen [vindkraft-rosy.vercel.app](https://vindkraft-rosy.vercel.app) är samma sorts häfte — Vercel används där som *hylla*, inte som *teknik i kalkylen*.

---

<a id="Vad-fullt-ut-betyder"></a>

## 3. Vad “Vercel till fullo” betyder i en kalkyl [#](#Vad-fullt-ut-betyder)

“Till fullo” är inte att slå på allt Vercel säljer (inloggning, chattrobotar, live-uppkoppling). I *den här* kalkylen betyder det:

Häftet får en **liten server bakom sig**, och kalkylen blir en **app med riktiga adresser** — inte en enda HTML-fil med flikar som låtsas vara sidor.

Servern kan tre saker en fil inte kan ([Vercel, 2026a](https://vercel.com/docs/functions)):

1. **Gömma en nyckel** och hämta data åt dig (spotpris från ENTSO-E, omräknat till kr/kWh).
2. **Komma ihåg ett paket** med gula fält under en kort kod, så länken blir kort.
3. **Göra något på en tidpunkt**, t.ex. hämta nattens dygnssnitt, även om noll personer har sidan öppen ([Vercel, 2026d](https://vercel.com/docs/cron-jobs)).

Adresserna kan tre saker en flik inte kan:

4. Öppna **närboende** som egen sida, inte som en flik någon måste hitta.
5. Visa **samma indata** men med *deras* nyckeltal överst.
6. Låta en delad länk **se ut som resultatet** (ett kort med tal), inte som en tom webbadress.

Räkningen av LCOE och NPV ligger kvar hos dig i webbläsaren. Om servern strular ska de gula fälten fortfarande gå att använda. Samma princip som i ver2.

---

<a id="Vad-som-blir-battre"></a>

## 4. Vad som blir bättre *i kalkylerna* [#](#Vad-som-blir-battre)

Här är skillnaden i kalkyl-språk, inte i ramverks-språk.

### A. Elpriset kan vara dagens marknad — inte bara din gissning

På Pages skriver du elpriset för hand. Det är okej för en 25-årskalkyl: då *ska* det vara ett antagande, inte gårdagens spot.

Men det är lätt att blanda ihop “vad kostar elen *idag* i SE4?” med “vilket pris räknar jag med i 25 år?”. Med Vercel till fullo kan sidan visa **två olika tal**:

| Tal | Vad det är | Vem som sätter det |
|-----|------------|---------------------|
| Dagens dygnssnitt | Marknaden just nu, med källa och datum | Servern, gärna utan att du klickar “Hämta” |
| Intäkt / kalkylpris i de gula fälten | Antagande över livslängden | Du |

Dagens spot ska **inte** tyst skriva över 25-årsantagandet. Det är information bredvid kalkylen, inte en genväg som ljuger om lönsamheten.

På Pages kan du inte hämta det officiella priset säkert: nyckeln skulle ligga i JavaScript. På Vercel ligger nyckeln i environment variables, utanför koden ([Vercel, 2026c](https://vercel.com/docs/environment-variables)).

### B. Två personer kan räkna på *samma* case

På Pages är kalkylen din. Kompisen ser sina egna tomma gula rutor (eller så mejlar du en skärmdump).

Med Vercel kan du skicka en länk som **fyller i samma indata** hos den andra. Kort kod (`?s=…`) om servern har en låda att lägga paketet i. Lång kod (`?t=…`) om paketet ska ligga i adressen och hålla för alltid.

Då kan ni jämföra LCOE mot varandra utan att läsa upp siffror i telefon. Det är kalkylens version av “samma Excel-fil”, utan e-postbilaga.

### C. Rätt person får rätt sida

Samma verk. Fem ekonomier.

På Pages är det **en adress och flikar**. Investeraren, markägaren och den närboende öppnar samma sida. Den närboende ska själv klicka rätt flik.

Till fullo: en länk kan gå rakt till **närboende**. Samma gula indata, men överskottet som NU20 ger ligger överst. Du skickar inte “kalkylen” — du skickar *deras* kalkyl.

Det ändrar inte formeln. Det ändrar **vilken sanning som möter ögat först**. I lönsamhetsdiskussioner är det halva jobbet.

### D. Länken kan *visa talen* innan någon klickar

Det här är **inte** en chatt inne i kalkylen. Ingen skriver meddelanden till varandra via appen.

Det handlar om vad som händer *utanför* kalkylen, när du klistrar in adressen i till exempel mejl, Teams, Slack eller LinkedIn. Många sådana program visar då en liten förhandsvisning (titel, ibland en bild) — samma slags kort som när du delar en nyhetsartikel.

På Pages (och i ver2) är en delad länk oftast bara en adress. Förhandsvisningen blir i bästa fall sidans titel. Inte “payback 9 år”.

Till fullo kan servern rita ett **kort** med de nyckeltal som just det scenariot gav: LCOE, payback, kanske närboendes kr/år. Då syns kalkylens *resultat* redan i mejlet, innan någon öppnar länken. Det går inte med bara statiska filer, för kortet måste ritas utifrån just de siffrorna, på servern, när mejlprogrammet ber om förhandsvisningen ([Next.js, 2026b](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)).

---

<a id="Tabell"></a>

## 5. Sida vid sida [#](#Tabell)

| Du vill … | GitHub Pages | Vercel till fullo |
|-----------|--------------|-------------------|
| Räkna LCOE, payback, NPV, IRR från gula fält | Ja | Ja, samma slags matte |
| Se fem perspektiv | Ja, som flikar på samma adress | Ja, och som **egna adresser** (t.ex. närboende) |
| Hämta dagens spotpris med hemlig nyckel | Nej, nyckeln skulle synas | Ja |
| Ha ett färskt dygnssnitt på sidan *utan* att någon klickar | Nej | Ja, om nattjobb (cron) är på |
| Skicka samma ifyllda case till en kompis | Bara om allt ligger i en jättelång URL, eller skärmdump | Ja, kort kod eller lång — servern kan validera fälten |
| Se LCOE i mejl/Teams *innan* någon öppnar länken | Nej | Ja, som ett förhandsvisningskort — ingen chatt i kalkylen |
| Räkna även om nätet till elpriset är nere | Ja (du skriver själv) | Ja — servern är tillval, inte ett krav för matten |

Det som **inte** blir bättre av Vercel: själva definitionen av LCOE, valet av kalkylränta, eller om 25 års elpris är 50 eller 80 öre. Det är fortfarande ditt omdöme i de gula fälten.

---

<a id="Tre-saker-att-kanna"></a>

## 6. Tre saker du ska kunna *känna* [#](#Tre-saker-att-kanna)

När appen finns ska skillnaden mot Pages inte bara stå i en teknik-ruta. Den ska märkas så här:

1. **Du skickar en närboendelänk.** Mottagaren landar i *sin* ekonomi, inte på en startsida med fem flikar.
2. **Du klistrar en länk i mejl eller Teams.** Där syns tal, inte bara en titel. (Inte en chatt i kalkylen.)
3. **Du öppnar kalkylen en morgon.** Dagens spot för valt elområde står där, med datum — som en notis bredvid de gula antagandena, inte som en tyst överskrivning.

Kan du inte peka på minst en av de tre, är Vercel fortfarande mest en annan webbadress. Då är vi tillbaka på rosy-läget: hylla, inte teknik i kalkylen.

---

<a id="Vad-som-inte-ar-punkten"></a>

## 7. Vad det här *inte* är [#](#Vad-som-inte-ar-punkten)

- Inte en ny ekonomisk modell.
- Inte “appen räknar i molnet, därför blir NPV mer sant.” NPV blir sant om *antagandena* är ärliga.
- Inte inloggning, AI-chatt eller live-uppdatering av kurvor i realtid. Det skulle se ut som mer teknik och göra kalkylen sämre att förstå.

ver2 har redan en bit av servern: knapp för spotpris, och delning som länk. **Till fullo** är steget efter: riktiga sidor per perspektiv, pris som kan leva utan klick, och ett kort som *visar* kalkylen när du delar den.

---

## Källor

GitHub (2026) *GitHub Pages documentation.* Tillgänglig: https://docs.github.com/en/pages (hämtad 15 september 2026). *(Vad Pages är: publicerade filer, ingen egen backend — gränsen den här texten utgår från.)*

Next.js (2026b) *Metadata and OG images.* Next.js Documentation (App Router). Tillgänglig: https://nextjs.org/docs/app/getting-started/metadata-and-og-images (hämtad 15 september 2026). *(Hur servern kan rita ett förhandsvisningskort med tal — det en statisk fil inte gör när mejl eller Teams bara hämtar metadata.)*

Vercel (2026a) *Vercel Functions.* Tillgänglig: https://vercel.com/docs/functions (hämtad 15 september 2026). *(Den lilla servern som startar vid anrop: nyckel, hämtning, delning.)*

Vercel (2026c) *Environment Variables.* Tillgänglig: https://vercel.com/docs/environment-variables (hämtad 15 september 2026). *(Hemligheter utanför koden — skälet att spotpris går på Vercel men inte i Pages-JavaScript.)*

Vercel (2026d) *Cron Jobs.* Tillgänglig: https://vercel.com/docs/cron-jobs (hämtad 15 september 2026). *(Kod på en klockslag, även om ingen har kalkylen öppen.)*

**Interna referenser**

- Programversionen: https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html
- ver2, redan en liten server: [Vercel-teknik-ver2.md](../vindkraftskalkyl_Vercel_ver2/Vercel-teknik-ver2.md)
- Krav för ver3: [PRD_vindkraftskalkyl_vercel_ver3.md](PRD_vindkraftskalkyl_vercel_ver3.md) (särskilt 4i och 4k)

---

*Första utkast 2026-09-15. Bara den här förklaringen — ingen app, inga skärmbilder. Ska uppdateras när ver3 finns live.*
