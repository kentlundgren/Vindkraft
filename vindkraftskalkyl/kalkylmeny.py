#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kalkylmeny.py: rullgardin "Kalkyler" med korsreferenser mellan kalkylsidorna i den här mappen.

Användning:  python kalkylmeny.py
Läser listan "kalkyler" i dokument.json och skriver in ett <details>-block direkt efter
brödsmulorna (efter markeringen brodsmulor:slut) i varje kalkylsida. Kör om hur många gånger som helst:
blocket mellan kalkylmeny:start och kalkylmeny:slut ersätts. brodsmulor.py rör inte blocket.
Ny kalkyl: lägg en rad i "kalkyler" i dokument.json och kör skriptet.
"""
import html, json, os, re

MAPP = os.path.dirname(os.path.abspath(__file__))
START = '<!-- kalkylmeny:start (genereras av kalkylmeny.py från dokument.json: ändra dokument.json, inte här) -->'
SLUT = '<!-- kalkylmeny:slut -->'
RE_BLOCK = re.compile(r'<!-- kalkylmeny:start.*?<!-- kalkylmeny:slut -->[ \t]*(\r?\n)?', re.S)
e = lambda s: html.escape(s, quote=True)


def meny(kalkyler, nu):
    rad = []
    for k in kalkyler:
        if k['fil'] == nu:
            rad.append('<li><span aria-current="page"><strong>%s</strong> (du är här)</span><small>%s</small></li>' % (e(k['namn']), e(k['beskr'])))
        else:
            rad.append('<li><a href="%s">%s</a><small>%s</small></li>' % (e(k['fil']), e(k['namn']), e(k['beskr'])))
    namn = [k['namn'] for k in kalkyler if k['fil'] == nu]
    return (START + '\n<div class="kalkylmeny"><details>'
            '<summary>Kalkyler: %s ▾</summary>'
            '<ul>%s</ul></details></div>\n' % (e(namn[0] if namn else 'välj'), ''.join(rad)) + SLUT + '\n')


def main():
    with open(os.path.join(MAPP, 'dokument.json'), encoding='utf-8') as f:
        data = json.load(f)
    for k in data['kalkyler']:
        sokv = os.path.join(MAPP, k['fil'])
        with open(sokv, encoding='utf-8', newline='') as f:
            t = f.read()
        t = RE_BLOCK.sub('', t)
        m = re.search(r'<!-- brodsmulor:slut -->[ \t]*(\r?\n)?', t)
        if not m:
            print('OBS: %s saknar brödsmulor, kör brodsmulor.py först' % k['fil']); continue
        t = t[:m.end()] + meny(data['kalkyler'], k['fil']) + t[m.end():]
        if 'kalkylmeny.css' not in t:
            t = re.sub(r'(</head>)', lambda mm: '<link rel="stylesheet" href="kalkylmeny.css">\n' + mm.group(1), t, count=1, flags=re.I)
        with open(sokv, 'w', encoding='utf-8', newline='') as f:
            f.write(t)
        print('Uppdaterade', k['fil'])


main()
