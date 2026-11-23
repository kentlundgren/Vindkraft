# Långhult: underlag och verktyg

- **Live:** [https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_langhult.html](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_langhult.html)

Den här mappen samlar underlag och verktyg som hör till fallet vindpark Långhult (Jönköpings och Gislaveds kommuner). Själva kalkylsidan, dess skript och stilar ligger kvar i den överordnade mappen, eftersom sidans adress är delad (blogg, Studier, LinkedIn) och sidan delar kärna och stilar med huvudkalkylen.

## Vad som ligger här

| Fil | Ansvar |
| --- | --- |
| [`bostader_ur_ljudutredning.py`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/langhult/bostader_ur_ljudutredning.py) | Räknar bostäder per ersättningszon (SFS 2026:1113, 12 §) ur koordinaterna i Fred. Olsens ljudutredning. Ger alternativen 66 bostäder (alla 20 verk) och 29 (bara Lunnarsbo) i gruppen Närboende i kalkylen. |

## Köra beräkningen av bostäder

```powershell
pdftotext -enc UTF-8 -layout ljudberaekning.pdf ljud.txt
python bostader_ur_ljudutredning.py ljud.txt
```

Skriptet skriver ut antal bostäder per zon för alla 20 verk, för Lunnarsbo (verk 9–20) och för Långhult (verk 1–8). Siffrorna i `BOSTADSALTERNATIV` i [`berakningar_langhult.js`](https://github.com/kentlundgren/Vindkraft/blob/main/vindkraftskalkyl/berakningar_langhult.js) är hämtade därifrån.

## Begränsningar

- Punkterna är konsultens urval för bullerberäkning och behöver inte vara alla bostäder som ger rätt till ersättning. Kaufmann & Westander (2026) uppskattar cirka 200 bostäder.
- Dokumentet anger 74 punkter, tabellen visar 72, och 69 har läsbara koordinater. Punkterna A, AD och BG saknar koordinater i textutdraget.
- Avståndet mäts till punkten, inte till närmaste del av byggnaden. Bostäder längre bort än 9 verkshöjder (270 m) räknas inte.

## Källor

- Akustikkonsulten i Sverige AB (2025) *Ljudimmissionsberäkning av ljud från vindkraft, vindpark Långhult.* Dokument 10-23221 A03, 2025-05-26. [Original på Fred. Olsen Renewables webbplats](https://fredolsenrenewables.com/media/gr1hts51/ljudberaekning.pdf) (hämtad 2026-11-23).
- Kaufmann, W. & Westander, H. (2026) *Intäktsdelning och ersättningar: Vindpark Långhult.* Westander Klimat och Energi, 2026-04-20. [Original (Gislaved)](https://fredolsenrenewables.com/media/1gpjqw0l/pm-intaektsdelning-vindpark-laanghult_gislaved.pdf).
- Fred. Olsen Renewables (u.å.) [*Långhult*](https://fredolsenrenewables.com/all-projects/laanghult) (projektsidan, hämtad 2026-11-23).

## Repo

- GitHub: https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl/langhult
- Lokal sökväg: `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\vindkraftskalkyl\langhult`
