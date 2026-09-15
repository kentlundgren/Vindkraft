/**
 * Elpris från ENTSO-E Transparency Platform (Day-ahead, dokumenttyp A44)
 * omräknat till kr/kWh med Riksbankens senaste SEK/EUR.
 *
 * Porten från ver2:s `api/elpris.js` är avsiktligt nära originalet: samma
 * EIC-koder, samma XML-läsning, samma "ta serien med flest punkter"-regel och
 * samma dygnslogik (idag → igår → imorgon).
 *
 * Här skedde en uppdatering mot ver2: `period` kan vara `dygn`, `manad` eller
 * `ar`. Månad = senaste HELA kalendermånad, år = senaste HELA kalenderår, båda
 * i svensk tid. Medelvärdet är ett enkelt medel av publicerade priser — inte
 * tidsvägt. Blandas 15- och 60-minutersserier används den med flest punkter,
 * precis som i ver2, vilket gör medlet till ett punktmedel.
 *
 * Hemligheten ENTSOE_SECURITY_TOKEN läses bara på servern.
 */

export const OMRADEN = ['SE1', 'SE2', 'SE3', 'SE4'] as const;
export const PERIODER = ['dygn', 'manad', 'ar'] as const;

export type Omrade = (typeof OMRADEN)[number];
export type Period = (typeof PERIODER)[number];

/** EIC-koder per elområde – samma som i ver2. */
const EIC: Record<Omrade, string> = {
  SE1: '10Y1001A1001A44P',
  SE2: '10Y1001A1001A45N',
  SE3: '10Y1001A1001A46L',
  SE4: '10Y1001A1001A47J',
};

const ENTSOE_URL = 'https://web-api.tp.entsoe.eu/api';
const RIKSBANK_URL =
  'https://api.riksbank.se/swea/v1/Observations/Latest/SEKEURPMI';

/** Svaret som Route Handlern skickar vidare till webbläsaren. */
export type ElprisSvar = {
  ok: true;
  omrade: Omrade;
  period: Period;
  periodStart: string;
  periodEnd: string;
  antalPunkter: number;
  prisEurMwh: number;
  prisKrKwh: number | null;
  sekPerEur?: number;
  fxDatum?: string | null;
  fxFel?: string;
  kalla: { namn: string; dokument: string; url: string };
  varning: string;
};

export type ElprisFel = { ok: false; status: number; fel: string };

export function arOmrade(varde: string): varde is Omrade {
  return (OMRADEN as readonly string[]).includes(varde);
}

export function arPeriod(varde: string): varde is Period {
  return (PERIODER as readonly string[]).includes(varde);
}

/* ---------------------------------------------------------------------------
   Huvudfunktionen
   --------------------------------------------------------------------------- */

export async function hamtaElpris(
  omrade: Omrade,
  period: Period,
  token: string
): Promise<ElprisSvar | ElprisFel> {
  const eic = EIC[omrade];

  const hamtat =
    period === 'dygn'
      ? await hamtaBastaDygn(token, eic)
      : await hamtaFonster(token, eic, fonsterFor(period));

  if ('fel' in hamtat) return hamtat;

  const medelEurMwh = medel(hamtat.priser);
  const fx = await hamtaSekPerEur();

  const svar: ElprisSvar = {
    ok: true,
    omrade,
    period,
    periodStart: hamtat.periodStart,
    periodEnd: hamtat.periodEnd,
    antalPunkter: hamtat.priser.length,
    prisEurMwh: avrunda(medelEurMwh, 2),
    prisKrKwh: null,
    kalla: {
      namn: 'ENTSO-E Transparency Platform',
      dokument: 'Day-ahead prices (A44)',
      url: 'https://transparency.entsoe.eu/',
    },
    varning:
      period === 'dygn'
        ? 'Dygnssnitt för dagen-före-marknaden (spot), utan skatt, nät och påslag. En ögonblicksbild – inte ett 25-årsantagande för intäkt för elen.'
        : 'Enkelt medel av spotpriser för hela perioden, utan skatt, nät och påslag. Historik – inte ett 25-årsantagande för intäkt för elen.',
  };

  if (fx) {
    // EUR/MWh × SEK/EUR / 1000 = kr/kWh
    svar.prisKrKwh = avrunda((medelEurMwh * fx.sekPerEur) / 1000, 4);
    svar.sekPerEur = fx.sekPerEur;
    svar.fxDatum = fx.datum;
  } else {
    svar.fxFel =
      'Riksbankens växelkurs kunde inte hämtas. Priset visas bara i EUR/MWh.';
  }

  return svar;
}

/* ---------------------------------------------------------------------------
   Tidsfönster
   --------------------------------------------------------------------------- */

type Fonster = { start: Date; slut: Date; periodStart: string; periodEnd: string };

/**
 * Senaste hela kalendermånad respektive kalenderår, räknat i svensk tid.
 * Innevarande (ofullständig) månad/år används medvetet inte.
 */
function fonsterFor(period: Exclude<Period, 'dygn'>): Fonster {
  const idag = stockholmYmd(new Date());
  const ar = Number(idag.slice(0, 4));
  const manad = Number(idag.slice(5, 7));

  if (period === 'ar') {
    const forra = ar - 1;
    return {
      start: stockholmMidnattUtc(`${forra}-01-01`),
      slut: stockholmMidnattUtc(`${ar}-01-01`),
      periodStart: `${forra}-01-01`,
      periodEnd: `${forra}-12-31`,
    };
  }

  const forraAr = manad === 1 ? ar - 1 : ar;
  const forraManad = manad === 1 ? 12 : manad - 1;
  const mm = String(forraManad).padStart(2, '0');
  const sistaDagen = new Date(Date.UTC(forraAr, forraManad, 0)).getUTCDate();

  return {
    start: stockholmMidnattUtc(`${forraAr}-${mm}-01`),
    slut: stockholmMidnattUtc(`${ar}-${String(manad).padStart(2, '0')}-01`),
    periodStart: `${forraAr}-${mm}-01`,
    periodEnd: `${forraAr}-${mm}-${String(sistaDagen).padStart(2, '0')}`,
  };
}

/** Ett ENTSO-E-anrop för hela perioden. Inte 365 dygnsanrop. */
async function hamtaFonster(
  token: string,
  eic: string,
  fonster: Fonster
): Promise<{ priser: number[]; periodStart: string; periodEnd: string } | ElprisFel> {
  const svar = await hamtaEntsoeXml(token, eic, fonster.start, fonster.slut);
  if ('fel' in svar) return svar;

  const priser = lasPriserUrXml(svar.xml);
  if (priser.length === 0) {
    return {
      ok: false,
      status: 502,
      fel: 'ENTSO-E hade inga prisvärden för perioden. Skriv in priset manuellt.',
    };
  }
  return {
    priser,
    periodStart: fonster.periodStart,
    periodEnd: fonster.periodEnd,
  };
}

/**
 * Dygn: försök idag, sedan igår, sedan imorgon – så att vi får ett helt
 * leveransdygn (publiceras ca kl. 13 dagen före) och inte tre dygns medel.
 * Samma ordning som ver2.
 */
async function hamtaBastaDygn(
  token: string,
  eic: string
): Promise<{ priser: number[]; periodStart: string; periodEnd: string } | ElprisFel> {
  const dygn = 24 * 60 * 60 * 1000;
  const dagar = [
    stockholmYmd(new Date()),
    stockholmYmd(new Date(Date.now() - dygn)),
    stockholmYmd(new Date(Date.now() + dygn)),
  ];

  for (const dag of dagar) {
    const start = stockholmMidnattUtc(dag);
    const slut = new Date(start.getTime() + dygn);
    const svar = await hamtaEntsoeXml(token, eic, start, slut);

    if ('fel' in svar) {
      // Avvisad nyckel är slutgiltigt – då hjälper det inte att prova fler dygn.
      if (svar.status === 502 && /nyckeln/i.test(svar.fel)) return svar;
      continue;
    }

    const priser = lasPriserUrXml(svar.xml);
    if (priser.length > 0) {
      return { priser, periodStart: dag, periodEnd: dag };
    }
  }

  return {
    ok: false,
    status: 502,
    fel: 'ENTSO-E hade inga prisvärden för valt elområde just nu. Skriv in priset manuellt.',
  };
}

/* ---------------------------------------------------------------------------
   ENTSO-E och Riksbanken
   --------------------------------------------------------------------------- */

async function hamtaEntsoeXml(
  token: string,
  eic: string,
  start: Date,
  slut: Date
): Promise<{ xml: string } | ElprisFel> {
  const q = new URL(ENTSOE_URL);
  q.searchParams.set('securityToken', token);
  q.searchParams.set('documentType', 'A44');
  q.searchParams.set('in_Domain', eic);
  q.searchParams.set('out_Domain', eic);
  q.searchParams.set('periodStart', tillEntsoeStampel(start));
  q.searchParams.set('periodEnd', tillEntsoeStampel(slut));

  const res = await fetch(q, {
    headers: { Accept: 'application/xml, text/xml, */*' },
    cache: 'no-store',
  });
  const xml = await res.text();

  if (!res.ok) {
    console.error('elpris: ENTSO-E HTTP', res.status);
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 502,
        fel: 'ENTSO-E avvisade nyckeln. Kontrollera ENTSOE_SECURITY_TOKEN.',
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        status: 502,
        fel: 'För många anrop mot ENTSO-E, försök senare.',
      };
    }
    return {
      ok: false,
      status: 502,
      fel: 'ENTSO-E svarade inte som väntat. Skriv in priset manuellt.',
    };
  }

  // Acknowledgement + felkod 999 = "ingen matchande data".
  if (/Acknowledgement_MarketDocument/i.test(xml) || />999</.test(xml)) {
    return {
      ok: false,
      status: 502,
      fel: 'ENTSO-E hade ingen matchande prisdata för perioden. Skriv in priset manuellt.',
    };
  }

  return { xml };
}

/**
 * Plockar price.amount ur Publication_MarketDocument. Finns flera TimeSeries
 * (t.ex. 15 och 60 minuter) används den med flest punkter – samma regel som ver2.
 */
function lasPriserUrXml(xml: string): number[] {
  const delar = xml.split(/<TimeSeries[\s>]/i).slice(1);
  const kandidater = delar.length > 0 ? delar : [xml];
  let basta: number[] = [];
  for (const del of kandidater) {
    const priser = [...del.matchAll(/price\.amount>\s*([+-]?\d+(?:\.\d+)?)/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n));
    if (priser.length > basta.length) basta = priser;
  }
  return basta;
}

async function hamtaSekPerEur(): Promise<{
  sekPerEur: number;
  datum: string | null;
} | null> {
  try {
    const res = await fetch(RIKSBANK_URL, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { value?: unknown; date?: string };
    const sekPerEur = Number(data?.value);
    if (!Number.isFinite(sekPerEur) || sekPerEur <= 0) return null;
    return { sekPerEur, datum: data.date ?? null };
  } catch (fel) {
    console.error('elpris: Riksbanken', fel);
    return null;
  }
}

/* ---------------------------------------------------------------------------
   Småverktyg (oförändrade från ver2)
   --------------------------------------------------------------------------- */

function avrunda(n: number, dec: number): number {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}

function medel(tal: number[]): number {
  return tal.reduce((s, x) => s + x, 0) / tal.length;
}

/** Datum som "2026-09-15" i svensk tid, oavsett var servern står. */
function stockholmYmd(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function tzOffsetMinuter(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const namn = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0';
  const m = namn.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return 0;
  const tecken = m[1] === '-' ? -1 : 1;
  return tecken * (Number(m[2]) * 60 + Number(m[3] || 0));
}

/** Midnatt svensk tid för ett datum, uttryckt i UTC (sommartid hanterad). */
function stockholmMidnattUtc(ymd: string): Date {
  const probe = new Date(`${ymd}T12:00:00Z`);
  const offset = tzOffsetMinuter('Europe/Stockholm', probe);
  const start = new Date(
    Date.UTC(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(5, 7)) - 1,
      Number(ymd.slice(8, 10)),
      0,
      0,
      0
    )
  );
  start.setUTCMinutes(start.getUTCMinutes() - offset);
  return start;
}

/** ENTSO-E vill ha "yyyyMMddHHmm" i UTC. */
function tillEntsoeStampel(date: Date): string {
  return date.toISOString().replace(/[-:T]/g, '').slice(0, 12);
}
