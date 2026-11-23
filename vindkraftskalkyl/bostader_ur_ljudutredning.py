"""
bostader_ur_ljudutredning.py
----------------------------------------------------------------------------
Räknar ut hur många bostäder i Fred. Olsen Renewables ljudutredning för vindpark
Långhult som ligger i vilken ersättningszon enligt intäktsdelningslagen
(SFS 2026:1113, 12 §: zon 1 inom 5 verkshöjder, 2: 5-6, 3: 6-7, 4: 7-8, 5: 8-9).

Underlag: Akustikkonsulten i Sverige AB (2025) Ljudimmissionsberäkning av ljud från
vindkraft, vindpark Långhult, dokument 10-23221 A03, 2025-05-26.
https://fredolsenrenewables.com/media/gr1hts51/ljudberaekning.pdf

Hur det används:
  pdftotext -enc UTF-8 -layout ljudberaekning.pdf ljud.txt
  python bostader_ur_ljudutredning.py ljud.txt

Metod: verkens koordinater (tabellen Verksdata, SWEREF 99 TM) och de ljudkänsliga punkternas
koordinater (tabellen Resultat - Punktberäkning) läses ur texten. För varje punkt tas avståndet
till närmaste verk i den valda gruppen av verk (alla 20, eller bara Lunnarsbo, verk 9-20), och punkten
läggs i en zon efter avståndet i verkshöjder (270 m). Punkter längre bort än 9 verkshöjder räknas inte.

Begränsningar: punkterna är konsultens urval för bullerberäkning och behöver inte vara alla
bostadsbyggnader som ger rätt till ersättning. Punkter utan läsbara koordinater i textutdraget
(A, AD och BG) ingår inte. Avståndet mäts till punkten, inte till närmaste del av byggnaden.
"""
import math
import re
import sys

VERKSHOJD = 270
LUNNARSBO = set(range(9, 21))   # verk 9-20 ligger i söder (Y ungefär 6 381 000-6 383 700)
LANGHULT = set(range(1, 9))     # verk 1-8 ligger i norr (Y ungefär 6 389 800-6 392 300)


def las(sokvag):
    text = open(sokvag, encoding='utf-8', errors='replace').read()
    verk = {int(m.group(1)): (int(m.group(2)), int(m.group(3)))
            for m in re.finditer(r'^\s+(\d{1,2})\s+(4\d{5})\s+(6\d{6})\s+185', text, flags=re.M)}
    punkter, utan = {}, []
    for m in re.finditer(r'^\s+([A-Z]{1,3})\s+(?:(4\d{5})\s+(6\d{6})\s+)?\d{3}\s+\d+\s+40\s+(?:JA|NEJ)', text, flags=re.M):
        if m.group(2):
            punkter[m.group(1)] = (int(m.group(2)), int(m.group(3)))
        else:
            utan.append(m.group(1))
    return verk, punkter, utan


def zon(avstand):
    for i in range(1, 6):
        if avstand <= (4 + i) * VERKSHOJD:
            return i
    return 0   # längre bort än 9 verkshöjder


def rakna(verk, punkter, urval):
    antal = [0] * 6
    for x, y in punkter.values():
        d = min(math.hypot(x - vx, y - vy) for n, (vx, vy) in verk.items() if n in urval)
        antal[zon(d)] += 1
    return antal


if __name__ == '__main__':
    verk, punkter, utan = las(sys.argv[1])
    print('verk:', len(verk), '| punkter med koordinater:', len(punkter), '| utan koordinater:', utan)
    for namn, urval in (('alla 20 verk', set(verk)), ('Lunnarsbo (verk 9-20)', LUNNARSBO), ('Långhult (verk 1-8)', LANGHULT)):
        a = rakna(verk, punkter, urval)
        print(f'{namn}: zon 1-5 = {a[1:]}, summa inom 9 verkshöjder = {sum(a[1:])}, längre bort = {a[0]}')
