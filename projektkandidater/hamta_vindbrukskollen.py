"""
hamta_vindbrukskollen.py
----------------------------------------------------------------------------
Hämtar vindkraftverk ur Vindbrukskollen (Länsstyrelserna, i samarbete med Energimyndigheten),
slår ihop dem till projekteringsområden och föreslår kandidater för nya vindkraftskalkyler:
projekt där det är lätt att få fram data (antal verk, effekt, beräknad årsproduktion, höjd,
verksamhetsutövare) och som är aktuella (under handläggning, beviljade eller överklagade).

Källa: Länsstyrelsernas karttjänst Vindbrukskollen, den öppna REST-tjänsten
  https://ext-geodata-applikationer.lansstyrelsen.se/arcgis/rest/services/VBK/lst_vbk_wms_vindbrukskollen/MapServer
Villkor: data får kopieras, bearbetas och distribueras fritt om Länsstyrelsen anges som källa
  (https://www.lansstyrelsen.se/nationellt-innehall/om-oss/vara-tjanster/oppna-data.html).
Den nedladdningsbara shapefilen (ShapeExport/lst.VKOLLEN_VINDKRAFTVERK.zip) är senast ändrad 2022-03-07
och används därför inte.

Användning (från den här mappen):
  python hamta_vindbrukskollen.py                 hämtar (om cachen saknas) och skriver kandidater.csv och kandidater.md
  python hamta_vindbrukskollen.py --uppdatera     hämtar om från tjänsten
  python hamta_vindbrukskollen.py --min-verk 8 --min-mw 40 --topp 50

Rådata sparas i data_raw/ (ingår inte i git). Bara Pythons standardbibliotek används.

Enhet: MAXEFFEKT är MW per verk och CALPROD är beräknad årsproduktion i GWh per verk (den sökandes beräkning).
Fullasttimmar = summa CALPROD * 1000 / summa MAXEFFEKT. Kapacitetsfaktor = fullasttimmar / 8760.
"""
import argparse
import csv
import datetime
import json
import os
import statistics
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict

BAS = 'https://ext-geodata-applikationer.lansstyrelsen.se/arcgis/rest/services/VBK/lst_vbk_wms_vindbrukskollen/MapServer'
# Lager i tjänsten, per status. Vi söker projekt i prövning eller beviljade; uppförda används som referens för fullasttimmar.
LAGER = {'Beviljat': 6, 'Handlaggs': 8, 'Overklagat': 10, 'Uppfort': 5}
AKTUELLA = ('Handlaggs', 'Beviljat', 'Overklagat')
HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, 'data_raw')
TIMMAR_PER_AR = 8760
STATUSNAMN = {'Beviljat': 'Beviljat', 'Handlaggs': 'Handläggs', 'Overklagat': 'Överklagat', 'Uppfort': 'Uppfört'}
# Tjänsten anger elområdet med namnet på den ort som området är uppkallat efter: SE1 Luleå, SE2 Sundsvall, SE3 Stockholm, SE4 Malmö.
ELOMRADE = {'Luleå': 'SE1', 'Sundsvall': 'SE2', 'Stockholm': 'SE3', 'Malmö': 'SE4'}
AVVIKELSE_FAKTOR = 1.5   # fullasttimmar utanför kvartilerna ± 1,5 × kvartilavståndet markeras som avvikande


def hamta_lager(namn, lagerid, uppdatera=False):
    """Hämtar alla verk i ett lager (sidindelat, 2 000 åt gången) och cachar svaret i data_raw/."""
    os.makedirs(RAW, exist_ok=True)
    fil = os.path.join(RAW, 'lager_%s.json' % namn)
    if os.path.exists(fil) and not uppdatera:
        return json.load(open(fil, encoding='utf-8'))
    poster, forskjutning = [], 0
    while True:
        q = urllib.parse.urlencode({'where': '1=1', 'outFields': '*', 'returnGeometry': 'true', 'outSR': 3006,
                                    'orderByFields': 'OBJECTID', 'resultOffset': forskjutning, 'resultRecordCount': 2000, 'f': 'json'})
        req = urllib.request.Request('%s/%d/query?%s' % (BAS, lagerid, q), headers={'User-Agent': 'Mozilla/5.0 (vindkraftskalkyl, privat analys)'})
        with urllib.request.urlopen(req, timeout=60) as svar:
            d = json.load(svar)
        if 'error' in d:
            raise RuntimeError('Tjänsten svarade med fel för lager %s: %s' % (namn, d['error']))
        for f in d.get('features', []):
            a = {k: (v.strip().replace(' ', '') if isinstance(v, str) else v) for k, v in f['attributes'].items()}   # tjänsten fyller texter med blanksteg
            g = f.get('geometry') or {}
            a['E'], a['N'] = g.get('x'), g.get('y')
            poster.append(a)
        if not d.get('exceededTransferLimit') and len(d.get('features', [])) < 2000:
            break
        forskjutning += 2000
        time.sleep(0.5)
    json.dump({'hamtad': datetime.datetime.now().isoformat(timespec='seconds'), 'lager': lagerid, 'poster': poster},
              open(fil, 'w', encoding='utf-8'), ensure_ascii=False)
    return {'hamtad': datetime.datetime.now().isoformat(timespec='seconds'), 'lager': lagerid, 'poster': poster}


def tal(x):
    return x if isinstance(x, (int, float)) else None


def datum(ms):
    return datetime.datetime.fromtimestamp(ms / 1000, datetime.timezone.utc).date().isoformat() if isinstance(ms, (int, float)) else ''


def sla_ihop(poster_per_status):
    """Slår ihop verk till projekteringsområden (OMRID). Returnerar en lista med en post per område."""
    omr = defaultdict(list)
    for status, poster in poster_per_status.items():
        for p in poster:
            p = dict(p)
            p['_status'] = status
            omr[p.get('OMRID') or p.get('VERKID')].append(p)
    ut = []
    for omrid, verk in omr.items():
        effekt = [tal(v.get('MAXEFFEKT')) for v in verk]
        prod = [tal(v.get('CALPROD')) for v in verk]
        har_effekt = all(e is not None and e > 0 for e in effekt)
        har_prod = all(p is not None and p > 0 for p in prod)
        mw = sum(e for e in effekt if e) if har_effekt else None
        gwh = sum(p for p in prod if p) if har_prod else None
        timmar = (gwh * 1000 / mw) if (mw and gwh) else None
        falt = ['MAXEFFEKT', 'CALPROD', 'TOTALHOJD', 'NAVHOJD', 'ROTDIAMETER', 'ORGNAMN']
        fyllda = sum(1 for f in falt for v in verk if v.get(f) not in (None, '', 0)) / (len(falt) * len(verk))
        statusar = Counter(v['_status'] for v in verk)
        ut.append({
            'omrid': omrid,
            'projekt': next((v.get('PROJNAMN') for v in verk if v.get('PROJNAMN')), ''),
            'kommun': ', '.join(sorted({v.get('KOMNAMN') for v in verk if v.get('KOMNAMN')})),
            'lan': ', '.join(sorted({v.get('LANSNAMN') for v in verk if v.get('LANSNAMN')})),
            'elomrade': ', '.join(sorted({ELOMRADE.get(v.get('EL_NAMN'), v.get('EL_NAMN')) for v in verk if v.get('EL_NAMN')})),
            'verk': len(verk),
            'mw': mw,
            'mw_per_verk': (mw / len(verk)) if mw else None,
            'totalhojd_max': max([tal(v.get('TOTALHOJD')) or 0 for v in verk]) or None,
            'gwh_ar': gwh,
            'fullasttimmar': timmar,
            'kapacitetsfaktor': (timmar / TIMMAR_PER_AR) if timmar else None,
            'status': ', '.join('%s %d' % (STATUSNAMN.get(k, k), n) for k, n in statusar.most_common()),
            'status_lista': list(statusar),
            'handlingstyp': ', '.join(sorted({v.get('HANDLINGSTYP') for v in verk if v.get('HANDLINGSTYP')})),
            'utovare': ', '.join(sorted({v.get('ORGNAMN') for v in verk if v.get('ORGNAMN')})),
            'placering': ', '.join(sorted({v.get('PLACERING') for v in verk if v.get('PLACERING')})),
            'e': statistics.fmean([v['E'] for v in verk if v.get('E')]) if any(v.get('E') for v in verk) else None,
            'n': statistics.fmean([v['N'] for v in verk if v.get('N')]) if any(v.get('N') for v in verk) else None,
            'senast_uppdaterad': max([datum(v.get('SenasteUppdatering')) for v in verk] or ['']),
            'datakompletthet': fyllda,
        })
    return ut


def valj_kandidater(omraden, min_verk, min_mw, senast_uppdaterad, bara_land=True):
    """Aktuella projekt (handläggs, beviljade, överklagade) med tillräcklig storlek och fullständig effekt- och produktionsdata."""
    ut = []
    for o in omraden:
        if not set(o['status_lista']) & set(AKTUELLA):
            continue
        if o['verk'] < min_verk or not o['mw'] or o['mw'] < min_mw:
            continue
        if not o['gwh_ar'] or not o['kapacitetsfaktor']:
            continue
        if bara_land and 'Land' not in o['placering']:
            continue
        if o['senast_uppdaterad'] < senast_uppdaterad:
            continue
        ut.append(o)
    ut.sort(key=lambda o: (-o['datakompletthet'], -o['mw']))
    return ut


def utan_effekt(omraden, min_verk, senast_uppdaterad, bara_land=True):
    """Aktuella områden som har beräknad produktion men saknar effekt för minst ett verk. Effekten måste hämtas ur projektets egna handlingar."""
    ut = []
    for o in omraden:
        if not set(o['status_lista']) & set(AKTUELLA) or o['verk'] < min_verk:
            continue
        if o['mw'] or not o['gwh_ar']:
            continue
        if bara_land and 'Land' not in o['placering']:
            continue
        if o['senast_uppdaterad'] < senast_uppdaterad:
            continue
        ut.append(o)
    ut.sort(key=lambda o: -o['gwh_ar'])
    return ut


def avvikande(timmar, referens):
    """Sant om fullasttimmarna ligger utanför referensspannet (kvartiler ± AVVIKELSE_FAKTOR × kvartilavstånd)."""
    if not referens or timmar is None:
        return False
    iqr = referens['q3'] - referens['q1']
    return timmar < referens['q1'] - AVVIKELSE_FAKTOR * iqr or timmar > referens['q3'] + AVVIKELSE_FAKTOR * iqr


def f(x, dec=0):
    return '' if x is None else ('{:,.%df}' % dec).format(x).replace(',', ' ').replace('.', ',')


KOLUMNER = [('projekt', 'Projekt'), ('omrid', 'Område-ID'), ('kommun', 'Kommun'), ('lan', 'Län'), ('elomrade', 'Elområde'), ('verk', 'Verk'),
            ('mw', 'MW'), ('mw_per_verk', 'MW per verk'), ('totalhojd_max', 'Högsta totalhöjd (m)'), ('gwh_ar', 'GWh per år'),
            ('fullasttimmar', 'Fullasttimmar'), ('kapacitetsfaktor', 'Kapacitetsfaktor'), ('status', 'Status'), ('handlingstyp', 'Handlingstyp'),
            ('utovare', 'Verksamhetsutövare'), ('senast_uppdaterad', 'Senast uppdaterad'), ('e', 'E (SWEREF 99 TM)'), ('n', 'N (SWEREF 99 TM)')]


def skriv_csv(kandidater, sokvag):
    with open(sokvag, 'w', encoding='utf-8-sig', newline='') as fil:
        w = csv.writer(fil, delimiter=';')
        w.writerow([namn for _, namn in KOLUMNER])
        for o in kandidater:
            rad = []
            for k, _ in KOLUMNER:
                v = o[k]
                rad.append(('%.4f' % v).replace('.', ',') if isinstance(v, float) else ('' if v is None else v))
            w.writerow(rad)


def kapacitetsstatistik(poster):
    """Medel, median, effektviktat medel, minsta och största kapacitetsfaktor över projekt med känd kapacitetsfaktor.
    Medelvärdet väger alla projekt lika, det effektviktade medelvärdet väger efter installerad effekt (summa GWh / (summa MW * 8760))."""
    kf = [o['kapacitetsfaktor'] for o in poster if o['kapacitetsfaktor']]
    if not kf:
        return None
    mw = sum(o['mw'] for o in poster if o['kapacitetsfaktor'])
    gwh = sum(o['gwh_ar'] for o in poster if o['kapacitetsfaktor'])
    return {'antal': len(kf), 'medel': statistics.fmean(kf), 'median': statistics.median(kf), 'viktat': gwh * 1000 / (mw * TIMMAR_PER_AR),
            'min': min(kf), 'max': max(kf), 'mw': mw}


def riktvarde(s):
    """Riktvärde för kapacitetsfaktorn i hela procent: medelvärdet av medianen och det effektviktade medelvärdet."""
    return None if not s else round((s['median'] + s['viktat']) / 2 * 100)


def kandidatgrupper(kandidater, referens, uppforda_ref=None):
    """Grupperna som kapacitetsfaktorn redovisas för. Den tredje (utan de som avviker) ligger till grund för riktvärdet."""
    return [('Alla kandidater', kandidater),
            ('Kandidater i SE3 och SE4', [o for o in kandidater if o['elomrade'] in ('SE3', 'SE4')]),
            ('Kandidater utan de som avviker', [o for o in kandidater if not avvikande(o['fullasttimmar'], referens)]),
            ('Uppförda projekt (referens)', uppforda_ref or [])]


def riktvarden_data(kandidater, referens, hamtad, uppforda_ref=None):
    """Riktvärdet för kapacitetsfaktorn som en liten maskinläsbar post. Kalkylsidorna (kalkylkarna.js, KAPACITETSFAKTOR_RIKTVARDE) ska ha samma värden, och testet kontrollerar det."""
    grupper = kandidatgrupper(kandidater, referens, uppforda_ref)
    rik_grupp = kapacitetsstatistik(grupper[2][1])
    procent = riktvarde(rik_grupp)
    if not procent:
        return None
    varden = [x * 100 for _, p in grupper[:3] for s_ in [kapacitetsstatistik(p)] if s_ for x in (s_['median'], s_['viktat'])]
    return {
        'kapacitetsfaktor_procent': procent,
        'fullasttimmar': round(procent / 100 * TIMMAR_PER_AR),
        'spann_procent': [round(min(varden), 1), round(max(varden), 1)],
        'antal_projekt': rik_grupp['antal'],
        'median_procent': round(rik_grupp['median'] * 100, 1),
        'effektviktat_procent': round(rik_grupp['viktat'] * 100, 1),
        'metod': 'Medelvärdet av medianen och det effektviktade medelvärdet av kapacitetsfaktorn för kandidaterna utan de som avviker från de uppförda projektens spann. Beräknad produktion (CALPROD), inte uppmätt.',
        'hamtad': hamtad[:10],
        'kalla': 'Länsstyrelserna (2026) Vindbrukskollen',
        'url': 'https://ext-webbgis.lansstyrelsen.se/vbk/',
    }


def skriv_md(kandidater, referens, ofullstandiga, antal_aktuella, sokvag, args, hamtad, uppforda_ref=None):
    rader = []
    rader.append('# Kandidater för nya vindkraftskalkyler, ur Vindbrukskollen\n')
    rader.append('Hämtad %s ur [Vindbrukskollen](https://ext-webbgis.lansstyrelsen.se/vbk/) (Länsstyrelserna, i samarbete med Energimyndigheten). ' % hamtad[:10] +
                 'Källa: Länsstyrelserna. Data får användas fritt om Länsstyrelsen anges som källa ([villkor](https://www.lansstyrelsen.se/nationellt-innehall/om-oss/vara-tjanster/oppna-data.html)).\n')
    rader.append('**Tillbaka till kalkylerna:** riktvärdet för kapacitetsfaktorn nedan visas under fältet Kapacitetsfaktor i vindkraftskalkylerna, som räknar på hur fem parter påverkas av en vindkraftspark (investeraren, markägaren, kommunen och samhället, andelsägaren och den närboende): ' +
                 '[huvudkalkylen](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl.html), ' +
                 '[fallet Långhult](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_langhult.html) och ' +
                 '[fallet Önnerup](https://kentlundgren.github.io/Vindkraft/vindkraftskalkyl/vindkraftskalkyl_Onnerup.html).\n')
    rader.append('## Urval\n')
    rader.append('- Aktuella områden: status handläggs, beviljat eller överklagat (%d områden i Vindbrukskollen), på land.' % antal_aktuella)
    rader.append('- Minst %d verk och minst %d MW, och effekt och beräknad årsproduktion angivna för **alla** verk i området.' % (args.min_verk, args.min_mw))
    rader.append('- Senast uppdaterad %s eller senare.' % args.senast)
    rader.append('- Sorterat efter hur fullständiga uppgifterna är (effekt, produktion, höjder, verksamhetsutövare) och därefter efter effekt.')
    rader.append('- **%d kandidater** uppfyller urvalet. De %d första visas. Hela listan finns i [kandidater.csv](kandidater.csv).\n' % (len(kandidater), min(args.topp, len(kandidater))))
    if referens:
        rader.append('## Referens: uppförda projekt\n')
        rader.append('Fullasttimmar för uppförda projekt med angiven produktion (%d områden): median %s, nedre kvartil %s, övre kvartil %s timmar per år. ' % (
            referens['antal'], f(referens['median']), f(referens['q1']), f(referens['q3'])) +
            'En kandidat med fullasttimmar långt utanför det spannet bör granskas: produktionen är den sökandes beräkning.\n')
    grupper = kandidatgrupper(kandidater, referens, uppforda_ref)
    rader.append('## Kapacitetsfaktor i kandidaterna\n')
    rader.append('Kapacitetsfaktor är beräknad årsproduktion delad med vad verken skulle ge vid full effekt hela året (summa GWh per år / (summa MW × 8 760 timmar)). ' +
                 'Medelvärdet väger alla projekt lika. Det effektviktade medelvärdet väger efter installerad effekt och styrs därför av de stora projekten.\n')
    rader.append('| Grupp | Projekt | Medel | Median | Effektviktat medel | Lägsta | Högsta | Median i fullasttimmar |')
    rader.append('|---|---|---|---|---|---|---|---|')
    rik = riktvarde(kapacitetsstatistik(grupper[2][1]))
    for namn, poster in grupper:
        s = kapacitetsstatistik(poster)
        if s:
            procent = [f(s[k] * 100, 1) + ' %' for k in ('medel', 'median', 'viktat', 'min', 'max')]
            rad = '| %s | %d | %s | %s |' % (namn, s['antal'], ' | '.join(procent), f(s['median'] * TIMMAR_PER_AR))
            if poster is grupper[2][1] and rik:
                rad = '| **%s ◀ riktvärde %d %%** | **%d** | %s | **%s** |' % (namn, rik, s['antal'], ' | '.join('**%s**' % p for p in procent), f(s['median'] * TIMMAR_PER_AR))
            rader.append(rad)
    rader.append('')
    if rik:
        stat = [kapacitetsstatistik(p) for _, p in grupper[:3]]
        varden = [x * 100 for s_ in stat if s_ for x in (s_['median'], s_['viktat'])]
        syd = stat[1]
        rader.append(
            '**Riktvärde för kapacitetsfaktorn i nya projekt: {rik} %.** Det är medelvärdet av medianen och det effektviktade medelvärdet för kandidaterna utan de som avviker från de uppförda projektens spann. '
            'Medianen och det viktade medelvärdet ligger nära varandra, så värdet påverkas varken av enstaka avvikare eller av projektens storlek. '
            'Det är kandidaternas beräknade produktion, inte en uppmätt kapacitetsfaktor. '
            'Medianerna och de viktade medelvärdena i de tre kandidatgrupperna ligger mellan {lag} och {hog} %, och för SE3 och SE4 är medianen {syd}. '
            'För ett enskilt projekt gäller projektets egen siffra.\n'.format(
                rik=rik, lag=f(min(varden), 1), hog=f(max(varden), 1), syd=(f(syd['median'] * 100, 1) + ' %') if syd else '–'))
    rader.append('Både kandidaternas och de uppförda projektens produktion är beräknad årsproduktion (`CALPROD`) som den sökande har registrerat, inte uppmätt produktion. Jämförelsen visar om kandidaternas siffror är rimliga i förhållande till de uppförda projektens.\n')
    rader.append('## Kandidater\n')
    vis = [('projekt', 'Projekt'), ('kommun', 'Kommun'), ('elomrade', 'Elområde'), ('verk', 'Verk'), ('mw', 'MW'), ('totalhojd_max', 'Höjd (m)'),
           ('gwh_ar', 'GWh/år'), ('fullasttimmar', 'Fullasttimmar'), ('status', 'Status'), ('utovare', 'Utövare')]

    def tabell(poster):
        t = ['| ' + ' | '.join(n for _, n in vis) + ' |', '|' + '|'.join('---' for _ in vis) + '|']
        for o in poster:
            celler = []
            for k, _ in vis:
                v = o[k]
                c = f(v, 1) if k in ('mw', 'gwh_ar') else f(v) if isinstance(v, float) else str(v if v is not None else '').replace('|', '/')
                if k == 'fullasttimmar' and avvikande(o['fullasttimmar'], referens):
                    c += ' (avviker)'
                celler.append(c)
            t.append('| ' + ' | '.join(celler) + ' |')
        return t

    rader.extend(tabell(kandidater[:args.topp]))
    rader.append('')
    syd = [o for o in kandidater if o['elomrade'] in ('SE3', 'SE4')]
    rader.append('### Söder om Dalälven (elområde SE3 och SE4)\n')
    rader.append('Här bor fler människor nära verken, så intäktsdelningen till närboende väger tyngre. %d av kandidaterna ligger i SE3 eller SE4.\n' % len(syd))
    rader.extend(tabell(syd[:args.topp]))
    rader.append('')
    rader.append('## Aktuella projekt där effekten saknas i Vindbrukskollen\n')
    rader.append('Dessa områden har beräknad årsproduktion men saknar effekt för minst ett verk, och kommer därför inte med i urvalet ovan. ' +
                 'Effekten måste hämtas ur projektets handlingar. Långhult är ett exempel: Vindbrukskollen anger 20 verk, 270 m och 21 GWh per verk, men ingen effekt.\n')
    vis2 = [('projekt', 'Projekt'), ('kommun', 'Kommun'), ('verk', 'Verk'), ('totalhojd_max', 'Höjd (m)'), ('gwh_ar', 'GWh/år'), ('status', 'Status'), ('utovare', 'Utövare')]
    rader.append('| ' + ' | '.join(n for _, n in vis2) + ' |')
    rader.append('|' + '|'.join('---' for _ in vis2) + '|')
    for o in ofullstandiga[:args.topp]:
        rader.append('| ' + ' | '.join((f(o[k], 1) if k == 'gwh_ar' else f(o[k]) if isinstance(o[k], float) else str(o[k] if o[k] is not None else '').replace('|', '/')) for k, _ in vis2) + ' |')
    rader.append('')
    rader.append('## Så läser du listan\n')
    rader.append('- Uppgifterna är de som den sökande har registrerat. Beräknad årsproduktion är den sökandes beräkning och inte en uppmätt produktion.')
    rader.append('- Vindbrukskollen innehåller inte investeringsutgift, arrende, bostäder per avståndszon, nätanslutning eller nätkostnad. Det som saknas måste hämtas ur projektets egna handlingar (ansökan, MKB, ljudberäkning).')
    rader.append('- Ett projekt är lätt att bygga en kalkyl för när det också har en offentlig ansökan eller MKB med ljudberäkning (bostäder och verk med koordinater) och en känd nätägare. Det går inte att se i Vindbrukskollen.\n')
    open(sokvag, 'w', encoding='utf-8').write('\n'.join(rader))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--uppdatera', action='store_true', help='hämta om från tjänsten')
    ap.add_argument('--min-verk', type=int, default=5)
    ap.add_argument('--min-mw', type=float, default=30)
    ap.add_argument('--senast', default='2024-01-01', help='senast uppdaterad (ÅÅÅÅ-MM-DD)')
    ap.add_argument('--topp', type=int, default=40)
    args = ap.parse_args()

    data = {n: hamta_lager(n, i, args.uppdatera) for n, i in LAGER.items()}
    hamtad = min(d['hamtad'] for d in data.values())
    omraden = sla_ihop({n: d['poster'] for n, d in data.items() if n in AKTUELLA})
    kandidater = valj_kandidater(omraden, args.min_verk, args.min_mw, args.senast)
    uppforda = sla_ihop({'Uppfort': data['Uppfort']['poster']})
    tim = sorted(o['fullasttimmar'] for o in uppforda if o['fullasttimmar'] and o['mw'] and o['mw'] >= 5 and 800 < o['fullasttimmar'] < 6000)
    referens = None
    if len(tim) >= 8:
        k = statistics.quantiles(tim, n=4)
        referens = {'antal': len(tim), 'median': statistics.median(tim), 'q1': k[0], 'q3': k[2]}
    ofullstandiga = utan_effekt(omraden, args.min_verk, args.senast)
    uppforda_ref = [o for o in uppforda if o['fullasttimmar'] and o['mw'] and o['mw'] >= 5 and 800 < o['fullasttimmar'] < 6000]
    rik = riktvarden_data(kandidater, referens, hamtad, uppforda_ref)
    if rik:
        with open(os.path.join(HAR, 'riktvarden.json'), 'w', encoding='utf-8') as fil:
            json.dump(rik, fil, ensure_ascii=False, indent=2)
            fil.write('\n')
    skriv_csv(kandidater, os.path.join(HAR, 'kandidater.csv'))
    skriv_md(kandidater, referens, ofullstandiga, len(omraden), os.path.join(HAR, 'kandidater.md'), args, hamtad, uppforda_ref)
    print('hämtat', hamtad, '| områden i prövning/beviljade:', len(omraden), '| kandidater:', len(kandidater), '| utan effekt:', len(ofullstandiga))
    lh = [o for o in omraden if 'nghult' in o['projekt'] or 'unnarsbo' in o['projekt']]
    for o in lh:
        print('kontroll Långhult:', o['projekt'], o['verk'], 'verk', o['mw'], 'MW', o['gwh_ar'], 'GWh', o['fullasttimmar'], 'timmar', o['status'])


if __name__ == '__main__':
    main()
