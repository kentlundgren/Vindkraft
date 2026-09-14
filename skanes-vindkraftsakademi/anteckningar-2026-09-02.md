# Anteckningar – Skånes vindkraftsakademi & vindkraft i Skåne

**Datum:** 2026-09-02
**Källa:** Sammanställt av Claude från en arbetssession med Kent Lundgren, kopplat till
styrelsearbete i Skånes vindkraftsakademi och research kring vindkraft i Skåne.

Detta är en sammanfattande logg över ämnen som togs upp under sessionen, för att
samla allt vindkraftsrelaterat på ett ställe. Respektive avsnitt kan brytas ut till
egna, fördjupade dokument vid behov.

---

## 1. Kalender – bokade händelser

Lagda i Kents Google-kalender utifrån ett mötesbildsprotokoll (verksamhetsledarens
rapport, Skånes vindkraftsakademi):

- **Studiebesök vindkraftverk**, Fjälkinge – 22 september 2026 (heldag)
- **Julmingel** – Skånes vindkraftsakademi, Biogas Syd & Solar Region Skåne –
  3 december 2026, kl. 15.00–16.30, Botulfshörnan, Stadshuset i Lund
  (påminnelse satt en vecka innan, 26 november 2026)

## 2. Att göra: ERUF-ansökan och Letter of Support

Skånes vindkraftsakademi ska medverka på ett möte kopplat till en **ERUF-ansökan**
(Europeiska regionala utvecklingsfonden) hos Region Skåne, där akademin ska bidra
med en **"Letter of Support"**. Detaljer om projektnamn, sökande organisation och
akademins konkreta åtagande är ännu inte klarlagda – återstår att stämma av.

ERUF i korthet: Regionalfonden, EU:s fond för regionalpolitiska projekt.
Tillväxtverket är förvaltande myndighet i Sverige. Skåne-Blekinge har ett eget
regionalt fondprogram 2021–2027 (uppdaterat 2026).

*Källa: Tillväxtverket (2026) Regionalfonden. https://tillvaxtverket.se/tillvaxtverket/omtillvaxtverket/eufonder/regionalfonden.3510.html*

## 3. Iskast och hänsynsavstånd till väg (t.ex. europaväg)

- **Grundregel (Trafikverket):** avstånd mellan vindkraftverk och allmän väg bör
  minst motsvara verkets totalhöjd, dock alltid minst 50 meter.
- **Iskastformel (Elforsk, via Trafikverket/Green Power Sweden):**
  `d = (D + H) × 1,5`, där D = rotordiameter (m), H = navhöjd (m).
- Iskastavståndet är i praktiken oftast det styrande avståndet för moderna, stora
  verk – större än 50-metersregeln.
- Ingen särskild, strängare regel hittades specifikt för europavägar jämfört med
  andra allmänna vägar – det är hastighet/trafikmängd (VGU-normer) som styr
  säkerhetszonens bredd, inte vägens E-beteckning i sig.
- Kontrollerat mot Svensk Vindkraft-tidningens (tidigare namn på Green Power
  Sweden) artiklar om "Kalla klimat" (#1 2026): ordet "iskast" förekommer **inte**
  i de granskade artiklarna ("När kallt klimat blir varmare",
  "Isbildning som gemensam utmaning") – fokus ligger på isbildning/nedisning och
  avisningssystem, inte riskavstånd.

*Källor: Trafikverket (2026) Master, torn och vindkraftverk.
https://bransch.trafikverket.se/for-dig-i-branschen/Planera-och-utreda/samhallsplanering/Sakerhet-och-konflikter/Master-och-vindkraftverk/
— Green Power Sweden (2026) Islossning från vindkraftblad.
https://greenpowersweden.se/fakta/islossning-fran-vindkraftblad*

## 4. Skånes vindkraftsakademis hemsida – driftstörning

`skanesvindkraftsakademi.se` gav genomgående **HTTP 500 – WordPress kritiskt fel**
("Det har uppstått ett kritiskt fel på webbplatsen") vid kontroll 2026-09-02.
Sajten drivs på **Kinsta** (webbhotell) bakom **Cloudflare**. Sannolik orsak: ett
plugin/tema som kraschar, en PHP-versionskonflikt eller ett minnesproblem. Kräver
åtgärd av den som administrerar sajten (PHP-felloggen i Kinstas adminpanel).

Statiska filer under `wp-content/uploads/` fungerade dock fortfarande (t.ex. de
gamla kommunfaktabladen, se avsnitt 6), vilket visar att bara själva
WordPress-applikationen är nere, inte hela servern.

## 5. Intäktsdelning från vindkraft till närboende

Ny lagstiftning (gäller från 1 juli 2026):

- Bostadsägare inom **nio verkshöjder** (totalhöjd) från ett vindkraftverk får rätt
  till årlig ersättning, max två verk per husägare.
- Trappstegsmodell, andel av anläggningens årsintäkt:
  - ≤5 verkshöjder: 2,5 ‰
  - 5–6: 2,0 ‰
  - 6–7: 1,5 ‰
  - 7–8: 1,0 ‰
  - 8–9: 0,5 ‰
- **Tak:** max 2 % av anläggningens totala årsintäkt sammanlagt till alla närboende.
- **Skattefritt** för privatbostad.
- Exempel: cirka 38 400 kr/år (SE4, söder) resp. 19 200–19 400 kr/år (SE1, norr).
- Skiljer sig från **bygdepengen** till kommuner (370 mnkr 2026, betalas av staten
  till kommunen baserat på installerad effekt, inte av bolaget direkt till hushåll).

*Källor: Regeringen (u.å.) Frågor och svar om framtida vindkraft.
https://www.regeringen.se/regeringens-politik/miljo-och-klimat/fragor-och-svar-om-framtida-vindkraft/
— Energi.se (2026) Närboende till vindkraft ska få ersättning.
https://www.energi.se/artiklar/2026/mars-2026/narboende-till-vindkraft-ska-fa-ersattning/*

## 6. De 10 största vindkraftsägarna i Skåne

Ingen färdig topplista fanns publicerad – sammanställd genom direkt uttag ur
**Vindbrukskollens öppna ArcGIS-API** (Länsstyrelserna/Energimyndigheten),
388 landbaserade + 1 havsbaserad park i Skåne län (2 september 2026).

| # | Ägare | Antal verk | MW |
|---|---|---|---|
| 1 | Vattenfall Vindkraft AB (havsbaserat, Lillgrund) | 48 | 110,4 |
| 2 | Vattenfall Toledo Vind AB (landbaserat) | 18 | 37,8 |
| 3 | Akka Vind AB | 11 | 28,8 |
| 4 | RWE Renewables Sweden Operation AB | 12 | 25,0 |
| 5 | Rabbalshede Vind AB | 9 | 16,2 |
| 6 | Universal Wind AB | 9 | 14,9 |
| 7 | Västraby Gård Energi AB | 5 | 14,85 |
| 8 | Firma Ramström Vind AB | 6 | 14,6 |
| 9 | Ekovind AB | 7 | 13,1 |
| 10 | Eolus Vind AB | 6 | 12,75 |

Slås Vattenfalls två bolag ihop blir Vattenfall klar etta (148,2 MW). 72 verk
(61,7 MW) saknar registrerad ägare i datat.

*Källa: Vindbrukskollen (u.å.), öppet API.
https://ext-geodata-applikationer.lansstyrelsen.se/arcgis/rest/services/VBK/lst_vbk_wms_vindbrukskollen/MapServer*

## 7. Kommuners energiplaner och vindbruksplaner

**Rättslig grund:**
- **Energiplan** – obligatorisk för alla kommuner enligt Lag (1977:439) om
  kommunal energiplanering.
- **Översiktsplan** – obligatorisk enligt PBL 3 kap. 1 §.
- **Vindbruksplan / tematiskt tillägg till ÖP** – **frivilligt**, ingen egen lag
  kräver detta. När en kommun väljer att göra ett sådant tillägg gäller samma
  regler som för översiktsplanen i övrigt (PBL 3–4 kap.).

**Regional nivå:** Klimat- och energistrategi för Skåne 2025–2030
(Länsstyrelsen Skåne, Region Skåne, Energikontor Syd).

**Kommunöversikt (33 Skåne-kommuner):** Kartlagd via Skånes vindkraftsakademis
egna kommunfaktablad ("Projekt Vindläget", uppdaterade 30 september 2016 –
alltså ett historiskt basläge, inte dagsaktuellt). Cirka 22 av 32 kartlagda
kommuner hade då något vindkraftsspecifikt planeringsdokument; 10 saknade det
(Ängelholm, Burlöv, Klippan, Lund, Malmö, Örkelljunga, Staffanstorp, Trelleborg,
Vellinge; Östra Göinge kunde inte hämtas). Fullständig tabell finns i
sessionens svar 2026-09-02 – kan brytas ut till ett eget dokument vid behov.

*Källor: Riksdagen (u.å.) Lag (1977:439) om kommunal energiplanering.
https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1977439-om-kommunal-energiplanering_sfs-1977-439/
— Skånes vindkraftsakademi (2016) Kommunplaner.
https://skanesvindkraftsakademi.se/kommunplaner/ (sajten hade driftstörning
vid kontroll, se avsnitt 4; enskilda PDF:er under wp-content/uploads gick att nå).*

## 8. Styrelsemötets verksamhetsplan 2025–2026 – reflektioner

Kommenterat en bild av "6. Verksamhetsplan 2025-2026" (16 punkter, bl.a.
medlemsvård, LinkedIn-aktivitet, landskapsvandring, valkompass, Ramboll-webbinarium
om GIS-analys av lämpliga vindkraftsytor, webbserverbyte).

**Huvudpunkter i reflektionen:**
- Planen saknar tydlig prioritering/ägarskap per punkt.
- Punkt 16 (byta webbserver) bör prioriteras upp – bekräftat akut av den faktiska
  driftstörningen, se avsnitt 4.
- Konkreta förslag på medlemsvärvning: tydliggör medlemsvärde på hemsidan,
  segmentera målgrupper (kommunala energistrateger, akademi, närboende-grupper
  pga. nya intäktsdelningslagen), använd Ramboll-webbinariet som värvningstillfälle,
  sätt mätbara mål, aktivera befintliga medlemmar som ambassadörer.

## 9. Whiteboard-anteckningar (styrelsemöte)

Transkriberade punkter markerade med "x" (tolkat som "fortsätt arbeta med"):
energiförsörjning/konflikter (Hormuz), nya ersättningssystem/lokal acceptans,
ökad ö-drift/resiliens, valet/politiskt läge, energiberedskapsläget (EM),
"varje kommun ska ha energiplan", auktionssystemet (havsbaserad, kabelkostnaden),
obalansansvar för små producenter, ekonomiska kalkyler VK vs. annat kraftslag
(inkl. VK-stödet till närboende). Några ord osäkra i tolkningen – se full
transkribering i sessionen 2026-09-02.

## 10. Önnerupsprojektet – tre vindkraftverk, Lomma kommun

Uppdatering till Kents blogginlägg
[Önnerupsprojektet (2021)](https://kentlundgren.blogspot.com/2021/08/onnerupsprojektet.html).

**Bakgrund:** Västanby AB har sedan 2010 planerat tre vindkraftverk i Önnerup
(Västra Kannikemarken), Lomma kommun. Avslag av kommunens miljö- och
byggnadsnämnd 2016/2019, avslag i MÖD 2018 (P 8280-17).

**Nytt sedan 2021:** MÖD:s dom **P 14634-20 (2022-01-27)** river upp nämndens
avslag och återförvisar ärendet för fortsatt handläggning. Inget publicerat,
senare beslut från nämnden hittades.

**Tekniska fakta (från domstolshandlingarna):**
- Navhöjd 100 m, maximal totalhöjd 150 m
- Beräknad årsproduktion: 22 704 MWh/år (efter 10 % säkerhetsmarginal) – motsvarar
  ca 4 540 villors elbehov, ~75 % av samtliga villors elbehov i Lomma kommun

**Västanby AB:s egen projektsida (idag):** 10 MW installerad vindkraftseffekt +
batterilager 10 MW/40 MWh, uppgiven årsproduktion ~39 000 MWh/år (högre än
domstolens siffra – orsak till avvikelsen ej verifierad).

**Om "3,3 MW × 3 = strax under 10 MW" (enligt ML):** Sannolik
förklaring: Miljöprövningsförordningen (2013:251) 21 kap. utlöser
**tillståndsplikt** (B-verksamhet, kräver länsstyrelsens miljöprövningsdelegation)
för verk med totalhöjd över 150 m, eller 7+ verk över 50 m – reglerna är avsedda
att träffa anläggningar med förväntad uteffekt 10–25 MW. Tre verk, exakt 150 m
totalhöjd, strax under 10 MW – håller sig sannolikt medvetet under gränsen till
den tyngre tillståndsprocessen, vilket stämmer med att ärendet hela tiden
hanterats som bygglov hos kommunen. Ej bekräftat som medvetet designval.

**Öppna frågor** (uppföljs med ML, tidigare Vestas):
Vestas som turbinleverantör, exakt byggstart/tidsplan, ev. nytt beslut från
Lomma kommuns nämnd efter 2022.

*Källor: Mark- och miljööverdomstolen (2022) Dom 2022-01-27, mål nr P 14634-20.
https://www.domstol.se/globalassets/filer/domstol/markochmiljooverdomstolen/avgoranden/2022/p-14634-20-dom-2022-01-27.pdf
— Naturvårdsverket (u.å.) Anmälnings- och tillståndsplikt enligt
miljöprövningsförordningen.
https://www.naturvardsverket.se/vagledning-och-stod/miljobalken/anmalnings--och-tillstandsplikt-enligt-miljoprovningsforordningen/
— Västanby AB (u.å.) Aktuella vindkraftsprojekt. https://vastanby.se/vindkraftsprojekt/*

## 11. Uppföljningsmaterial framtaget

- Utkast till uppdateringsavsnitt för blogginlägget om Önnerupsprojektet
  (källförteckning i Harvardstil, redo att klistras in).
- Tre alternativa LinkedIn-meddelanden till ML för att följa upp
  samtalet (kort/rakt, utförligt, mjukt öppnande).
- Kents faktiska skickade meddelande till ML (2026-09-02) refererar
  MÖD-domen P 14634-20 och länkar till blogginlägget, samt föreslår
  fika/AW för uppföljning.
