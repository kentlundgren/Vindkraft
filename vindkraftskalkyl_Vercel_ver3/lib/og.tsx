/**
 * Bildmotorn för förhandsvisningar (Open Graph).
 *
 * En enda layout ritar alla varianter – standardkalkylen och delade scenarier,
 * med eller utan perspektiv. Bilden ritas på servern med `next/og`
 * (Satori + resvg): ingen webbläsare, ingen klient-JS. Den som klistrar in en
 * länk i LinkedIn, Slack eller iMessage ser alltså kalkylens tal, inte en tom
 * vit ruta – crawlers kör aldrig React.
 *
 * Talen kommer från samma `beraknaAllt` som gränssnittet. Ingen formel bor här.
 *
 * Observera: `next/og` förstår bara en delmängd av CSS (flexbox, inline-stilar).
 * Tailwind-klasser fungerar inte, och varje element med flera barn måste ha
 * `display: 'flex'` utskrivet.
 */

import { ImageResponse } from 'next/og';
import { beraknaAllt, lasIndata } from './calculations.ts';
import { medDefaults } from './defaults.ts';
import type { Falt } from './falt.ts';

/** Standardmåttet för Open Graph-bilder. Facebook, LinkedIn och X vill ha det. */
export const OG_STORLEK = { width: 1200, height: 630 };
export const OG_TYP = 'image/png';
export const OG_ALT =
  'Vindkraftskalkyl – LCOE, payback och ersättning enligt NU20.';

export type OgPerspektiv =
  | 'investerare'
  | 'markagare'
  | 'kommun'
  | 'andelsagare'
  | 'narboende';

const PERSPEKTIVRUBRIK: Record<OgPerspektiv, string> = {
  investerare: 'Investerarperspektivet',
  markagare: 'Markägarperspektivet',
  kommun: 'Kommun och samhälle',
  andelsagare: 'Andelsägarperspektivet',
  narboende: 'Närboende (NU20)',
};

const FARG = {
  botten: '#f8fafc',
  band: '#0f766e',
  rubrik: '#134e4a',
  text: '#0f172a',
  dampad: '#475569',
  kant: '#e2e8f0',
  indata: '#fff3b0',
};

export function arOgPerspektiv(varde: unknown): varde is OgPerspektiv {
  return (
    typeof varde === 'string' && varde in PERSPEKTIVRUBRIK
  );
}

/**
 * Ritar bilden. `falt` är ett delat scenario (från `?s=`/`?t=`) eller null –
 * då används standardvärdena, precis som en tom kalkyl visar dem.
 */
export function ritaOgBild({
  falt = null,
  perspektiv,
}: {
  falt?: Falt | null;
  perspektiv?: OgPerspektiv;
} = {}) {
  const varden = medDefaults(falt);
  const r = beraknaAllt(lasIndata(varden));

  const park = `${tal(Number(varden.antalverk), 0)} verk × ${tal(
    Number(varden.effekt),
    1
  )} MW · ${varden.elomrade} · ${tal(Number(varden.livslangd), 0)} år`;

  // Tredje talet byter innebörd på närboende-URL:en: där är NU20 poängen.
  const tredje =
    perspektiv === 'narboende'
      ? {
          etikett: 'NU20 per bostad',
          varde: tal(r.narboendeEnskildAr1, 0),
          enhet: 'kr/år',
        }
      : {
          etikett: 'Nuvärde (NPV)',
          varde: tal(r.npvInvest, 0),
          enhet: 'kr',
        };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: FARG.botten,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grön ribba längst upp – samma färgspråk som appen. */}
        <div style={{ display: 'flex', height: 16, backgroundColor: FARG.band }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '48px 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ fontSize: 68, fontWeight: 700, color: FARG.rubrik }}
            >
              Vindkraftskalkyl
            </div>
            <div style={{ fontSize: 26, color: FARG.dampad }}>
              {falt ? 'delad kalkyl' : 'standardvärden'}
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: 12, fontSize: 32, color: FARG.dampad }}>
            {perspektiv ? PERSPEKTIVRUBRIK[perspektiv] : 'Fem perspektiv på samma park'}
          </div>

          {/* Parkens storlek gör talen begripliga för den som bara ser bilden. */}
          <div
            style={{
              display: 'flex',
              marginTop: 20,
              alignSelf: 'flex-start',
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: FARG.indata,
              fontSize: 26,
              color: FARG.text,
            }}
          >
            {park}
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 'auto' }}>
            <Ruta etikett="LCOE" varde={tal(r.lcoe, 2)} enhet="kr/kWh" />
            <Ruta
              etikett="Payback"
              varde={
                r.paybackInvest === null
                  ? '> livslängd'
                  : tal(r.paybackInvest, 1)
              }
              enhet={r.paybackInvest === null ? '' : 'år'}
            />
            <Ruta
              etikett={tredje.etikett}
              varde={tredje.varde}
              enhet={tredje.enhet}
            />
          </div>

          <div style={{ display: 'flex', marginTop: 28, fontSize: 22, color: FARG.dampad }}>
            Samma formler som programversionen och ver2. Öppna länken för att
            ändra de gula fälten.
          </div>
        </div>
      </div>
    ),
    OG_STORLEK
  );
}

/**
 * Talet på en rad, enheten på nästa. Annars bryter långa belopp mitt i
 * enheten ("0,62 kr/ kWh"), vilket ser slarvigt ut i ett flöde.
 */
function Ruta({
  etikett,
  varde,
  enhet,
}: {
  etikett: string;
  varde: string;
  enhet: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '24px 28px',
        borderRadius: 16,
        border: `2px solid ${FARG.kant}`,
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: FARG.dampad,
        }}
      >
        {etikett}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 50,
          fontWeight: 700,
          color: FARG.text,
          whiteSpace: 'nowrap',
        }}
      >
        {varde}
      </div>
      {enhet ? (
        <div style={{ marginTop: 2, fontSize: 26, color: FARG.dampad }}>
          {enhet}
        </div>
      ) : null}
    </div>
  );
}

/** Svensk taluppställning, samma decimaler som gränssnittet visar. */
function tal(varde: number, decimaler: number): string {
  if (!Number.isFinite(varde)) return '–';
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: decimaler,
    maximumFractionDigits: decimaler,
  }).format(varde);
}
