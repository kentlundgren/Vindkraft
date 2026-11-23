"""Utkast till delningsbild för startsidan (1200x630). Skriver tre JPEG-filer i samma mapp som skriptet."""
import math
import os
from PIL import Image, ImageDraw, ImageFont

HAR = os.path.dirname(os.path.abspath(__file__))
W, H = 1200, 630
FONT = r'C:\Windows\Fonts'

def font(namn, storlek):
    return ImageFont.truetype(os.path.join(FONT, namn), storlek)

TUNG, MEDEL, LJUS = 'segoeuib.ttf', 'seguisb.ttf', 'segoeui.ttf'
PRIMAR, PRIMAR_LJUS = (27, 94, 90), (46, 139, 132)
VIT = (255, 255, 255)
PARTER = [('Investeraren', (227, 243, 232), (47, 143, 78)),
          ('Markägaren', (234, 243, 251), (59, 127, 182)),
          ('Kommunen och samhället', (238, 247, 246), (46, 139, 132)),
          ('Andelsägaren', (241, 234, 251), (122, 86, 182)),
          ('Den närboende', (253, 235, 224), (201, 103, 42))]

def bakgrund():
    img = Image.new('RGB', (W, H), PRIMAR)
    px = img.load()
    for y in range(H):
        for x in range(W):
            t = (x / W * 0.6 + y / H * 0.4)
            px[x, y] = tuple(int(PRIMAR[i] + (PRIMAR_LJUS[i] - PRIMAR[i]) * t) for i in range(3))
    return img

def verk(d, cx, cy, hojd, farg=VIT, vinkel=0):
    """Ritar ett vindkraftverk: torn, nav och tre blad. cy är navets höjd, hojd är tornets längd ned till marken."""
    d.polygon([(cx - hojd * 0.035, cy + hojd), (cx + hojd * 0.035, cy + hojd), (cx + hojd * 0.012, cy), (cx - hojd * 0.012, cy)], fill=farg)
    blad = hojd * 0.62
    for k in range(3):
        a = math.radians(vinkel + 120 * k - 90)
        b = math.radians(vinkel + 120 * k - 90 + 90)
        bas1 = (cx + math.cos(b) * hojd * 0.025, cy + math.sin(b) * hojd * 0.025)
        bas2 = (cx - math.cos(b) * hojd * 0.025, cy - math.sin(b) * hojd * 0.025)
        topp = (cx + math.cos(a) * blad, cy + math.sin(a) * blad)
        d.polygon([bas1, topp, bas2], fill=farg)
    r = hojd * 0.035
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=farg)

def mitt(d, text, y, f, farg=VIT, x=W / 2):
    bredd = d.textlength(text, font=f)
    d.text((x - bredd / 2, y), text, font=f, fill=farg)

def pill(d, x, y, bredd, hojd, fyll, text, f, textfarg=(28, 35, 33)):
    d.rounded_rectangle([x, y, x + bredd, y + hojd], radius=hojd / 2, fill=fyll)
    tb = d.textlength(text, font=f)
    d.text((x + (bredd - tb) / 2, y + (hojd - f.size) / 2 - 3), text, font=f, fill=textfarg)

# ------------------------------------------------------------------ Utkast 1: en park, fem parter
img = bakgrund(); d = ImageDraw.Draw(img)
d.line([(0, 560), (W, 560)], fill=(255, 255, 255, 140), width=3)
verk(d, 215, 380, 180, vinkel=15)
d.text((60, 40), 'En park.', font=font(TUNG, 72), fill=VIT)
d.text((60, 118), 'Fem parter.', font=font(TUNG, 72), fill=VIT)
for i, (namn, fyll, kant) in enumerate(PARTER):
    y = 70 + i * 96
    d.line([(226, 380), (520, y + 32)], fill=(255, 255, 255), width=3)
    pill(d, 520, y, 600, 64, fyll, namn, font(MEDEL, 32))
mitt(d, 'Vindkraftens ekonomi: vem får vad?', 575, font(MEDEL, 30), VIT)
img.save(os.path.join(HAR, 'utkast_1_en_park_fem_parter.jpg'), quality=88)

# ------------------------------------------------------------------ Utkast 2: tre kalkyler
img = bakgrund(); d = ImageDraw.Draw(img)
mitt(d, 'Tre kalkyler. Fem parter.', 38, font(TUNG, 62))
mitt(d, 'Vem får vad av en vindkraftspark?', 118, font(MEDEL, 36), (225, 240, 238))
kort = [('Huvudkalkylen', 'Fem perspektiv,', 'med nätkostnader'),
        ('Fallet Långhult', '20 verk, 132 MW', 'Jönköping, Gislaved'),
        ('Fallet Önnerup', '3 verk, SE4', 'Lomma kommun')]
for i, (rubrik, rad1, rad2) in enumerate(kort):
    x = 60 + i * 376
    d.rounded_rectangle([x, 205, x + 340, 505], radius=22, fill=VIT)
    d.rounded_rectangle([x, 205, x + 340, 217], radius=6, fill=PARTER[i][2])
    d.text((x + 28, 245), rubrik, font=font(TUNG, 38), fill=PRIMAR)
    d.text((x + 28, 318), rad1, font=font(MEDEL, 34), fill=(28, 35, 33))
    d.text((x + 28, 366), rad2, font=font(LJUS, 30), fill=(77, 92, 89))
mitt(d, 'Öppna, med källor. Du ändrar antagandena.', 548, font(MEDEL, 32))
img.save(os.path.join(HAR, 'utkast_2_tre_kalkyler.jpg'), quality=88)

# ------------------------------------------------------------------ Utkast 3: frågan i stor text
img = bakgrund(); d = ImageDraw.Draw(img)
mitt(d, 'Vem får vad', 70, font(TUNG, 150))
mitt(d, 'av en vindkraftspark?', 250, font(TUNG, 76))
x = 60
rader = [PARTER[:3], PARTER[3:]]
for rad_nr, rad in enumerate(rader):
    bredder = [int(d.textlength(n, font=font(MEDEL, 31))) + 56 for n, _, _ in rad]
    tot = sum(bredder) + 20 * (len(rad) - 1)
    x = (W - tot) / 2
    for (namn, fyll, kant), b in zip(rad, bredder):
        pill(d, x, 395 + rad_nr * 82, b, 64, fyll, namn, font(MEDEL, 31))
        x += b + 20
mitt(d, 'Öppna kalkyler med källor', 560, font(MEDEL, 30), (225, 240, 238))
img.save(os.path.join(HAR, 'utkast_3_fragan.jpg'), quality=88)
print('klart')
