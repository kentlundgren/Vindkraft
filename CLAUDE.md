# CLAUDE.md – Vindkraft-repot

**Repo:** [kentlundgren/Vindkraft](https://github.com/kentlundgren/Vindkraft)
**Live (GitHub Pages):** https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html
**Live (Vercel-app, statisk):** https://vindkraft-rosy.vercel.app
**Live (Vercel-app, Functions):** https://vindkraft-ver2.vercel.app
**Live (Vercel-app, Next.js App Router):** https://vindkraft-ver3.vercel.app
**Senast uppdaterad:** 2026-11-24
**Version:** 1.21

---

## Om detta repo

Samlar vindkraftsrelaterat innehåll:

| Mapp | Innehåll |
| ---- | -------- |
| `vindkraftskalkyl/` | Interaktivt beräkningsverktyg (HTML/CSS/JS) – GitHub Pages-version, med startsidan `index.html` (adressen `…/vindkraftskalkyl/`). Fallmapparna `langhult/` och `onnerup/` ligger i den. |
| `projektkandidater/` | Analys över många projekt: kandidater för nya kalkyler ur Vindbrukskollen (skript, test, `kandidater.csv` och `kandidater.md`). Rådata i `data_raw/` ingår inte i git. |
| `vindkraftskalkyl_Vercel/` | Samma kalkyl som statisk Vercel-app (projektet "vindkraft", https://vindkraft-rosy.vercel.app). |
| `vindkraftskalkyl_Vercel_ver2/` | Vercel-anpassad kalkyl med Functions (`/api/elpris`, `/api/scenario`). Nytt projekt i teamet Effektiv (`effektiv1`), inte en ersättning för den statiska appen. Live: https://vindkraft-ver2.vercel.app. Token till spotpris: `Hur-skaffa-nyckel-hos-ENTSO-E.md`. |
| `vindkraftskalkyl_Vercel_ver3/` | Kalkylen ombyggd som Next.js-app (App Router, TypeScript, Tailwind). Egna adresser per perspektiv, `/api/elpris`, `/api/scenario` med delningslänkar och serverritad OG-bild. Projektet `vindkraft-ver3` i teamet Effektiv, Root Directory = mappen. Live: https://vindkraft-ver3.vercel.app. Formlerna är portade från ver2 och testas mot ver2:s egna tal (`npm test`). |
| `.cursor/skills/` | Projekt-skills som Cursor läser automatiskt. Dual-publiceringsmönstret ligger här. |
| `skanes-vindkraftsakademi/` | Anteckningar och research kopplat till styrelsearbete i Skånes vindkraftsakademi. |

---

## Regel – En gemensam räknekärna för alla kalkyler

Kalkylerna i `vindkraftskalkyl/` (huvudkalkylen, Långhult och Önnerup) **delar kärnan `kalkylkarna.js`** (annuitet, NPV, IRR, payback, LCOE, formatering och nätkopplingen) och nätmodellen `natkostnader_berakning.js`. Det som ska räknas lika i alla kalkyler läggs där, aldrig som en kopia i en kalkyls egen fil.
- Önnerup är huvudkalkylens HTML med egna förvalda värden och delar `berakningar.js`. En ny kalkyl som bara behöver andra förval ska göras så, och ingen ny beräkningsfil.
- En ny kalkyl laddar `kalkylkarna.js` före sin egen fil, lägger bara det som är specifikt för den (till exempel produktion, viktning, närboendezoner) i sin egen `berakningar_*.js`, och läggs i `kalkyler` i `dokument.json` (kör `python kalkylmeny.py`) så att rullgardinen Kalkyler får den.
- **Gemensamma benämningar och metoder:** produktion = effekt × 8 760 h × **kapacitetsfaktor** (fullasttimmar är en härledd visning). Realiserat pris = spotpris × **prisfaktor** (0–1, engelska capture rate, EIFO 2026; Kaufmann & Westander (2026) säger viktning). **Närboendeersättning** räknas med zonmetoden (SFS 2026:1113, 11–14 §§) via `NARBOENDE_METOD` i `kalkylkarna.js`. Schablonen finns kvar men är inaktiv. Byte av metod görs på det stället, och metodens fält måste då finnas i formuläret.
- **Kommunposterna är gemensamma:** fastighetsskatt och bygdemedel är kostnader för projektet, och kommunstödet betalas av staten och dras inte från projektets resultat (`kommunPoster` i `kalkylkarna.js`). Saknar en kalkyl beloppet står posten på 0 och sidan visar en varning, så att den inte glöms bort.
- **Samma indatagrupper i alla kalkyler:** rubrikerna och ordningen står i `INDATAGRUPPER` i `kalkylkarna.js` (Anläggning & investering, Drift & livscykel, Nät och systemkrav, Markägare, Kommun & samhälle, Andelsägare, Närboende). Projektspecifika fält läggs inom en befintlig grupp, aldrig som en ny grupp med eget namn. Testet kontrollerar varje `vindkraftskalkyl*.html`.
- **Samma fasta delar i varje kalkyl:** versionsrad längst ned (`Version X.Y · ÅÅÅÅ-MM-DD · Kent Lundgren`, via `visaVersionsrad(VERSION, VERSIONSDATUM)` i `kalkylkarna.js` och konstanterna överst i kalkylens egen fil), totala effekten under Effekt per verk (`visaTotalEffekt`) och fälten i första gruppen i ordningen `INDATAORDNING_ANLAGGNING`. Versionen och datumet höjs i samma ändring som innehållet, och testet kontrollerar att de finns.
- **Nätraderna i jämförelsetabellen** (`JAMFOR_NAT` i `kalkylkarna.js`) räknas på valt läge: läget ingen ger 0 i rutor, tabeller och nyckeltal, och det hypotetiska värdet visas bara som märkt "om läget vore bas". Raden "Nätkostnad, löpande" har en kort text direkt och en utförlig förklaring vid hovring (`natLopandeForklaring`), som visar de faktiska talen och att en negativ nätkostnad är en ersättning (kredit) som bara gäller om inmatningen minskar förlusterna.
- **Typfallet** väljs ur trappan `NAT_TYPFALL.trappa` (över 40 MW är det fall I, Vattenfall PL1). Fall J (PT0, 130 kV i station från stamnät) väljs aldrig automatiskt.
- **Långhult har två egna val:** växeln för parkens storlek (hela parken, 20 verk och 132 MW, eller bara Lunnarsbo, 12 verk och 79,2 MW) och alternativen för bostäder per zon (`BOSTADSALTERNATIV`, räknade av `langhult/bostader_ur_ljudutredning.py`). Växeln ändrar bara antal verk, inte bostäderna.
- **Riktvärde för kapacitetsfaktorn** (37 %, 3 241 fullasttimmar) visas som en blänkare under fältet Kapacitetsfaktor i alla kalkyler (`KAPACITETSFAKTOR_RIKTVARDE` och `visaKapacitetsRiktvarde` i `kalkylkarna.js`, elementet `kf-riktvarde`). Värdena ska vara desamma som i `projektkandidater/riktvarden.json`, som skriptet `hamta_vindbrukskollen.py` skriver, och testet kontrollerar det. Det är ett riktvärde för nya projekts beräknade produktion, inte något som ändrar förvalen. Skriv inte "normalt" eller "gäller" om det.
- Kör `node test_kalkylkarna.js` och `node test_natkostnader.js` före leverans. Det första testet fångar om en kalkyl återinför en egen kopia av en kärnfunktion.
- Vercel-apparna (`vindkraftskalkyl_Vercel*`) har egna kopior och ingår inte än.

---

## Regel – Mappstruktur: sidorna ligger kvar, underlag och verktyg per fall i egen mapp

- **Sidor, skript, stilar och delningsbilder** för kalkylerna ligger i `vindkraftskalkyl/`. Adresserna är delade (blogg, Studier, LinkedIn) och bilderna har absoluta adresser i metataggarna, så en flytt ger trasiga länkar. Flytta dem inte utan omdirigeringssidor på de gamla adresserna.
- **Underlag, verktyg, datafiler och anteckningar som bara hör till ett fall** ligger i `vindkraftskalkyl/<fall>/`: gemena bokstäver utan å, ä och ö, till exempel `langhult/` och `onnerup/`. Varje fallmapp har en `README.md` (Live-länk överst, `## Repo` sist, filnamn som länkar).
- **Allmänt underlag** som flera fall använder ligger i `vindkraftskalkyl/underlag/`. Nätkostnadernas delningssida ligger i `vindkraftskalkyl/natkostnader/`.
- **Flytta filer med `git mv`** så att historiken följer med. Uppdatera därefter länkarna på sidan och README-tabellen. Testet i `test_kalkylkarna.js` kontrollerar att repo-länkarna i Långhult-sidan pekar på filer som finns.

## Regel – Analyser över många projekt ligger i egen mapp i repots rot

En analys som gäller flera projekt, som kandidatlistan ur Vindbrukskollen, hör inte hemma i ett fall (`vindkraftskalkyl/langhult/`) och inte bland kalkylsidorna. Den får en egen mapp i repots rot, namngiven efter syftet (`projektkandidater/`), med `README.md`, skript, test och små resultatfiler. Rådata läggs i `data_raw/` och ignoreras av git, och skriptet hämtar den på nytt. Börja platt. Dela upp i `skript/`, `data/` och `rapporter/` först när mappen har minst tre analyser. Ett eget repo för vindkraftsdata övervägs när datan återanvänds av flera repon. **När jag lägger in något nytt redovisar jag var det hamnar och vilka alternativ som fanns** (global `CLAUDE.md`, skillen `kent-projektstruktur`).

## Regel – Startsidan index.html

`vindkraftskalkyl/index.html` (med `index.css` och `index.js`) är mappens startsida och presenterar poängen med kalkylerna: en park, fem parter. Kalkylsidornas brödsmulor börjar med den (`start` i `dokument.json`, och `brodsmulor.py` skriver blocket).
- **Texten följer kalkylerna.** Beskrivningarna av de fem parterna och de tre kalkylkorten ska stämma med vad kalkylerna visar. Ändras en kalkyl på ett sätt som syns för parterna uppdateras startsidan.
- **Siffror på startsidan** (riktvärdet 37 % och 3 241 timmar, 22 projekt, och antalet kandidater 27 och 9) kontrolleras av `test_kalkylkarna.js` mot `KAPACITETSFAKTOR_RIKTVARDE` och `projektkandidater/kandidater.md`. En ny körning av skriptet som ändrar dem kräver att startsidan uppdateras.
- **Nya kalkyler** läggs som ett nytt kort under "Tre kalkyler" (och i `dokument.json`).
- Startsidan har egen källförteckning, alfabetisk och osiffrad, och samma hörnpar som kalkylerna.

## Regel – Mallen: samma fält och standardvärden, och det unika syns

Alla kalkyler har samma indatafält i samma ordning (`INDATAORDNING_ANLAGGNING`) och samma standardvärden. Huvudkalkylen är mallen. Ett fall får ha egna, aktuella värden som passar just det, men läsaren ska se vilka värden som avviker från mallen eller schablonen.
- **Elområde finns i varje kalkyl** (fältet `elomrade`, SE1–SE4, klass `indata`, direkt före Spotpris), också när fallet inte räknar med schabloner. Det styr fyra saker och inget annat. När området väljs, eller när knappen `Använd standardvärden` (`elomrade-standard`, direkt efter rullgardinen, text `Använd standardvärden för SE4`) klickas, byts kalkylens värden mot områdets standard (kalkylens change-lyssnare anropar `fyllElomradeStandard()` före omräkningen, och knappen skickar `change` på elområdet, så att det är samma väg): Spotpris (`ELOMRADE_PRIS`, SE1 0,30, SE2 0,35, SE3 0,55, SE4 0,60 kr/kWh), Prisfaktor (`ELOMRADE_PRISFAKTOR`, SE1 0,80, SE2 0,75, SE3 0,85, SE4 0,90, antaganden), Kalkylränta (`KALKYLRANTA_STANDARD`, 0,052 real i alla områden) och fastighetsskatt år 1 och därefter (`fastighetsskattSchablon` för verkets effekt och fullasttimmar, räknad med områdets elprisfaktor). Elområdet ändrar ingen annan beräkning. Knappen är det sättet att gå från kalkylens egna värden till standard utan att byta område, och det skriver över fältens värden, också ett eget värde i ett fall.
- **Förklaringen vid rubriken:** `<abbr class="fk" id="elomrade-hjalp" tabindex="0" data-f="">?</abbr>` direkt efter etiketten Elområde. Kärnan skriver texten (`elomradeForklaring()`, byggd på samma konstanter som räkningen) vid hovring, fokus och tryck. Ändra texten bara där.
- **Mallens Spotpris är schablonpriset för valt område.** Huvudkalkylen har SE4 och 0,60 kr/kWh. Dess Prisfaktor (1) och Kalkylränta (0,1215) är de gamla värdena från tidigare kalkyler och står kvar för jämförelse, så schablonnotisen visar att de avviker.
- **Standardvärdena och deras stöd:** prisfaktorerna är antaganden (0,80, 0,75, 0,85, 0,90). De stöds av att vindkraftens capture rate 2021–2023 låg mellan 0,68 och 0,92 i områdena (egen beräkning av öppna timdata från Energy-Charts, som får användas bara privat och internt och därför inte står som källa på sidorna). KYOS (2025), som prognostiserar 0,68, 0,69, 0,77 och 0,66 för 2026–2035, och EIFO (2026), som visar utfallet 0,50 i SE2 år 2025, står i varje kalkyls källförteckning (`ref-kyos`, `ref-eifo`) som försiktigare jämförelser. Kaufmann & Westander (2026) använder 0,75 för Långhult (SE3). Ingen källa ger olika kalkylränta per område. Ändras ett standardvärde ändras konstanten i `kalkylkarna.js`, texten i källposterna och testet.
- **Schablonnotis under Spotpris, Prisfaktor, Kalkylränta, Fastighetsskatt första åren och åren därefter** (`elpris-schablon`, `prisfaktor-schablon`, `kalkylranta-schablon`, `fskatt1-schablon`, `fskatt2-schablon`). Sidans init anropar `kopplaForklaringar()` och `kopplaElomradeOchSchablon()` (kärnan) efter sina egna lyssnare. Notisen säger "Schablonvärdet för SE4", "Avviker från schablonen för SE3 (0,55 kr/kWh): ett eget värde för den här kalkylen" (blå) eller "Uppgift saknas". Ett fall som har ett eget värde, till exempel Långhults spotpris 0,50 ur Kaufmann & Westander eller Önnerups prisfaktor 0,75, behåller det och får märkningen automatiskt. Fallet anger dessutom källan vid fältet (`badge pm` för en källa, `badge antagande` för ett antagande) och en mening vid elområdet om att fallet använder sitt eget värde.
- **Kalkylränta:** standard för en ny kalkyl är real kalkylränta 0,052 (5,2 %, Energiforsk 2021, s. 18, spann 2,6–7,5 %, tolv projekt under byggnation 2020), märkt `antagande`, med texten om källan, att Energimyndigheten (2016) använde 6,8 % (5–8 %) och att räntans utveckling efter 2020 inte är med, och med `ref-energiforsk` och `ref-er2016` i källförteckningen (som Långhult och Önnerup). Etiketten är "Kalkylränta, real (0–1)" med förklaring av vad real betyder. Huvudkalkylen har texten och källorna men behåller kalkylräntan 0,1215 (Kents ursprungliga värde) för jämförelse med de tidigare kalkylerna.
- **Egna värden märks, aldrig tyst:** ett värde som avviker från mallen (antal verk, effekt, kapacitetsfaktor, investeringskostnad, ränta, spotpris, skatt) har en källmärkning vid fältet och en mening om varför det avviker. Gäller det Spotpris eller fastighetsskatt tillkommer schablonnotisen automatiskt.
- **Förklaringarna `abbr.fk`** ritas av CSS (`stil.css` och `stil_langhult.css`) och får fokus vid tryck via `kopplaForklaringar()` i kärnan. Egen kopia av någon av funktionerna ovan i en kalkyls fil fångas av testet.

## Regel – Ny kalkyl eller nytt fall: checklista

1. Sidan laddar `kalkylkarna.js` före sin egen fil och följer `INDATAGRUPPER` och `INDATAORDNING_ANLAGGNING`. Den har totala effekten under Effekt per verk, nätraderna `JAMFOR_NAT` i jämförelsetabellen och versionsraden (`VERSION`, `VERSIONSDATUM`, `visaVersionsrad`).
2. Sidan läggs i `kalkyler` i `dokument.json`, och `python kalkylmeny.py` körs. Brödsmulorna sätts upp med `brodsmulor.py`.
3. Delningsbild `og-bild-<fall>.jpg` (1200×630 px, under 300 kB) och taggarna för LinkedIn, X och Facebook.
4. Mappen `<fall>/` med `README.md` för fallets underlag och verktyg.
5. Tjänster och databaser som är kända under ett eget namn (till exempel Vindbrukskollen, utgiven av Länsstyrelserna) har en hänvisningspost på namnets plats i källförteckningen ("Vindbrukskollen: se Länsstyrelserna (2026)."), och blänkaren om riktvärdet hänvisar med `Lundgren (år och bokstav)` till sammanställningen `kandidater.md`, som är en egen källpost. Testet kontrollerar att hänvisningen pekar på en post som finns.
6. Tabellerna är numrerade 1, 2, 3 … i läsordning utan luckor och dubbletter, och nättabellen i panelen heter Nättabell 1. Ett nytt avsnitt med tabeller placeras sist, eller så numreras alla om i läsordning. Källornas egna tabellnummer ändras aldrig. Testet kontrollerar numrering, `id` och länkar.
7. Källförteckningen är alfabetisk och osiffrad (`<ul class="kallforteckning">`, varje källa en egen post, en ny källa på sin alfabetiska plats). Testet kontrollerar det i varje kalkylsida.
8. Fältet Elområde med förklaring och schablonnotiser enligt regeln om mallen. Spotpris är schablonpriset för valt område, eller ett eget värde med källa och en mening om varför. Real kalkylränta 0,052 med texten och de två källorna, om fallet inte har ett eget värde med källa.
9. Varje värde som avviker från mallen har källmärkning vid fältet och en mening om varför.
10. `node test_kalkylkarna.js` och `node test_natkostnader.js` ger inga fel, och sidan är provad lokalt.

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

## 📌 Regel – Namn och struktur på anteckningsfiler

Anteckningar och mötessammanfattningar (t.ex. i `skanes-vindkraftsakademi/`) sparas
med **samma namn och struktur varje gång**, så att filerna blir snygga och lätta
att hitta:

- **Filnamn:** datum först, `ÅÅÅÅ-MM-DD-anteckningar.md` (t.ex.
  `2026-10-05-anteckningar.md`). Då hamnar filerna automatiskt i datumordning.
  Använd bara tecken som fungerar i alla system (ingen å, ä, ö i filnamnet).
- **Struktur:** rubrik `# Anteckningar – <sammanhang>`, därefter `**Datum:**`,
  `**Källa:**` och en länk till föregående anteckningar, en kort inledning, en
  linje (`---`) och numrerade avsnitt (`## 1.`, `## 2.` …). Källor i Harvardstil
  i kursiv text sist i det avsnitt de hör till. Avsluta med att-göra och
  uppföljningsmaterial, och koppla alltid till föregående anteckningar.
- Förebild: [`skanes-vindkraftsakademi/2026-09-02-anteckningar.md`](skanes-vindkraftsakademi/2026-09-02-anteckningar.md)
  och [`skanes-vindkraftsakademi/2026-10-05-anteckningar.md`](skanes-vindkraftsakademi/2026-10-05-anteckningar.md).
- Byt inte namn på befintliga anteckningsfiler utan att fråga Kent, eftersom
  externa länkar kan peka på dem.

Denna regel gäller **övergripande** för alla Kents repon och bör även finnas i
den globala filen `AI\Claude\CLAUDE.md` på Kents lokala maskin.

---

## Uppdateringslogg

- 2026-11-24 (v1.21): Knappen Använd standardvärden vid Elområde, fastighetsskatten ingår i standarden och prisfaktorerna är 0,80, 0,75, 0,85 och 0,90.
- 2026-11-24 (v1.20): Elområdet fyller också Prisfaktor och Kalkylränta (standard per område med källor KYOS och EIFO), och notiser under dem.
- 2026-11-24 (v1.19): Regeln om mallen (elområde i varje kalkyl med förklaring och schablonnotiser, kalkylränta som standard, egna värden märks) och checklistan utökad.
- 2026-11-23 (v1.18): Startsidan `index.html` med regel om att texten och siffrorna följer kalkylerna, och brödsmulor som börjar med den.
- 2026-11-23 (v1.17): Hänvisningspost för Vindbrukskollen i källförteckningarna och sammanställningen kandidater.md som egen källpost.
- 2026-11-23 (v1.16): Blänkare om riktvärdet för kapacitetsfaktorn i kalkylerna, och `projektkandidater/riktvarden.json` som testet jämför mot.
- 2026-11-23 (v1.15): Mappen `projektkandidater/` och regeln om analyser över många projekt, och att jag redovisar var nya filer hamnar och vilka alternativ som fanns.
- 2026-11-23 (v1.14): Tabellerna i kalkylsidorna numreras i läsordning utan dubbletter (nättabellen är Nättabell 1), kontrollerat av testet, och ingår i checklistan för ny kalkyl.
- 2026-11-23 (v1.13): Källförteckningen i kalkylsidorna är alfabetisk och osiffrad, kontrollerad av testet, och ingår i checklistan för ny kalkyl.
- 2026-11-23 (v1.12): Mappstruktur (fallmappar `langhult/` och `onnerup/`, sidorna ligger kvar), checklista för ny kalkyl eller nytt fall, och regler för nätraderna i Tabell 3, typfallet och Långhults egna val.
- 2026-11-23 (v1.11): Fasta delar i varje kalkyl: versionsrad, total effekt och fast fältordning.
- 2026-11-23 (v1.10): Gemensamma benämningar och metoder (kapacitetsfaktor, prisfaktor, närboendezoner) i regeln om räknekärnan.
- 2026-11-22 (v1.9): Regel om gemensam räknekärna (`kalkylkarna.js`) för alla kalkyler, och rullgardinen Kalkyler.
- 2026-10-05 (v1.8): Regel om namn och struktur på anteckningsfiler (datum först, samma struktur varje gång). Äldre fil `anteckningar-2026-09-02.md` bytt till `2026-09-02-anteckningar.md`. Mötessammanfattningen 2026-10-05 lades till i `skanes-vindkraftsakademi/`.
- 2026-09-16 (v1.7): `vindkraftskalkyl_Vercel_ver3/` live på https://vindkraft-ver3.vercel.app. Ver3 är en Next.js-app (App Router) och den enda av lagren som *inte* går att spegla på GitHub Pages — den behöver en server. Rot-README:n fick en rad per Vercel-app.
- 2026-09-15 (v1.6): `Hur-skaffa-nyckel-hos-ENTSO-E.md` i ver2; live-URL för `vindkraft-ver2`.
- 2026-09-14 (v1.5): `vindkraftskalkyl_Vercel_ver2/` – Vercel-anpassad kalkyl med Functions, nytt projekt i teamet `effektiv1`.
- 2026-09-14 (v1.4): Regel om djuplänkar – ett avsnitt, ett ankare, en länk (promptavsnittet är `#Forslag_pa_promt`).
- 2026-09-14 (v1.3): Flyttat dual-publicerings-skillen till `.cursor/skills/` (rätt plats för Cursor), tagit bort den gamla `skills/`-sökvägen, och förtydligat commit/push samt att nya appar ska vara projekt i samma Vercel-team.
- 2026-09-14 (v1.2): Lagt till lokal skill under `skills/vercel-github-pages-dual-publicering/` och pekat ut den i CLAUDE.md.
- 2026-09-14 (v1.1): Lagt till Vercel-appen, dual-publiceringsmönster och Cursor-arbetssätt.
- 2026-09-02 (v1.0): Skapad, med regeln om initialer för personnamn i
  GitHub-innehåll.

---

_CLAUDE.md v1.21, 2026-11-24_
