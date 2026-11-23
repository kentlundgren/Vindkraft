# Projektkandidater: vindkraftsprojekt att bygga nya kalkyler för

Den här mappen hittar aktuella vindkraftsprojekt där det är lätt att få fram data till en kalkyl. Ingen live-sida finns än: resultatet läses i [kandidater.md](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/kandidater.md) (lista) och [kandidater.csv](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/kandidater.csv) (alla kandidater, för Excel).

Analysen ligger här och inte i `vindkraftskalkyl/`, eftersom den gäller många projekt och inte ett enskilt fall, och för att kalkylsidornas mapp inte ska fyllas med analysfiler.

## Vad som ligger här

| Fil | Ansvar |
| --- | --- |
| [`hamta_vindbrukskollen.py`](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/hamta_vindbrukskollen.py) | Hämtar vindkraftverk ur Vindbrukskollen, slår ihop dem till projekteringsområden, väljer kandidater och skriver `kandidater.csv` och `kandidater.md`. Bara Pythons standardbibliotek. |
| [`test_kandidater.py`](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/test_kandidater.py) | Test av sammanslagning och urval, utan nätverk: `python -m unittest test_kandidater`. |
| [`kandidater.csv`](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/kandidater.csv) och [`kandidater.md`](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/kandidater.md) | Resultatet, med hämtdatum. Skrivs om vid varje körning. |
| [`riktvarden.json`](https://github.com/kentlundgren/Vindkraft/blob/main/projektkandidater/riktvarden.json) | Riktvärdet för kapacitetsfaktorn (37 %, 3 241 fullasttimmar, spann 33,9–38,1 %) som en maskinläsbar post. Skrivs av skriptet. Kalkylernas `KAPACITETSFAKTOR_RIKTVARDE` i `kalkylkarna.js` ska ha samma värden, och `test_kalkylkarna.js` kontrollerar det. |
| `data_raw/` | Rådata från tjänsten (cache). Ingår inte i git och skapas av skriptet. |

## Köra

```powershell
python hamta_vindbrukskollen.py                  # använder cachen om den finns
python hamta_vindbrukskollen.py --uppdatera      # hämtar om från tjänsten
python hamta_vindbrukskollen.py --min-verk 8 --min-mw 40 --topp 50
```

## När skriptet körs om

Kör `python hamta_vindbrukskollen.py --uppdatera`. Ändras `riktvarden.json` faller testet i `vindkraftskalkyl/` tills `KAPACITETSFAKTOR_RIKTVARDE` i `kalkylkarna.js` har uppdaterats till samma värden. Därefter höjs versionen på de tre kalkylsidorna.

## Källa och villkor

Vindbrukskollen ges ut av Länsstyrelserna i samarbete med Energimyndigheten. Skriptet läser den öppna REST-tjänsten [lst_vbk_wms_vindbrukskollen](https://ext-geodata-applikationer.lansstyrelsen.se/arcgis/rest/services/VBK/lst_vbk_wms_vindbrukskollen/MapServer), lagren Beviljade, Handläggs, Överklagade och Uppförda. Länsstyrelsens sida [Öppna data](https://www.lansstyrelsen.se/nationellt-innehall/om-oss/vara-tjanster/oppna-data.html) säger att data får kopieras, bearbetas och distribueras fritt om Länsstyrelsen anges som källa.

Den nedladdningsbara shapefilen är senast ändrad 2022-03-07 och saknar till exempel Långhult, så den används inte.

## Begränsningar

- Uppgifterna är de som den sökande har registrerat. Beräknad årsproduktion (`CALPROD`, GWh per verk) är den sökandes beräkning.
- Vindbrukskollen saknar investeringsutgift, arrende, bostäder per avståndszon, nätanslutning och nätkostnad.
- Långhult finns i Vindbrukskollen med 20 verk, 270 m och 21 GWh per verk, men utan effekt (`MAXEFFEKT`). Områden som saknar effekt redovisas i en egen lista i `kandidater.md`.

## Repo

- GitHub: https://github.com/kentlundgren/Vindkraft/tree/main/projektkandidater
- Lokal sökväg: `C:\Users\kentl\OneDrive\AI\Cursor\Intressen\Vindkraft\projektkandidater`
