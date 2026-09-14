/**
 * Vercel Function: GET /api/elpris?omrade=SE4
 *
 * Hämtar dygnssnitt för dagen-före-pris (spot) från ENTSO-E Transparency
 * Platform och räknar om EUR/MWh → kr/kWh med Riksbankens senaste SEK/EUR.
 *
 * Hemlighet: ENTSOE_SECURITY_TOKEN i Vercel environment variables – aldrig
 * i klientkoden. Om anropet misslyckas svarar vi med JSON-fel; kalkylen
 * i webbläsaren fortsätter med manuellt inskrivet pris.
 *
 * Beräkningsformlerna i berakningar.js ändras inte här. Detta är bara ett
 * valfritt sätt att fylla fältet "Spotpris hushållsel".
 */

const EIC = {
  SE1: '10Y1001A1001A44P',
  SE2: '10Y1001A1001A45N',
  SE3: '10Y1001A1001A46L',
  SE4: '10Y1001A1001A47J'
};

const ENTSOE_URL = 'https://web-api.tp.entsoe.eu/api';
const RIKSBANK_URL = 'https://api.riksbank.se/swea/v1/Observations/Latest/SEKEURPMI';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const omrade = (url.searchParams.get('omrade') || 'SE4').toUpperCase();
    const eic = EIC[omrade];
    if (!eic) {
      return jsonFel(400, 'Okänt elområde. Använd SE1, SE2, SE3 eller SE4.');
    }

    const token = process.env.ENTSOE_SECURITY_TOKEN;
    if (!token) {
      console.error('elpris: ENTSOE_SECURITY_TOKEN saknas');
      return jsonFel(
        503,
        'Elpris kan inte hämtas ännu: nyckeln ENTSOE_SECURITY_TOKEN saknas i Vercel. Kalkylen fungerar med manuellt pris.'
      );
    }

    const hamtat = await hamtaBastaDygn({ token, eic });
    if (hamtat && hamtat.fel) {
      return jsonFel(hamtat.status || 502, hamtat.fel);
    }
    if (!hamtat || !hamtat.priser) {
      return jsonFel(
        502,
        'ENTSO-E hade inga prisvärden för valt elområde just nu. Skriv in priset manuellt.'
      );
    }

    const { leveransdag, priser } = hamtat;
    const medelEurMwh = medel(priser);
    const fx = await hamtaSekPerEur();
    const kropp = {
      ok: true,
      omrade,
      leveransdag,
      antalPunkter: priser.length,
      prisEurMwh: avrunda(medelEurMwh, 2),
      kalla: {
        namn: 'ENTSO-E Transparency Platform',
        dokument: 'Day-ahead prices (A44)',
        url: 'https://transparency.entsoe.eu/'
      },
      varning:
        'Dygnssnitt för dagen-före-marknaden (spot), utan skatt, nät och påslag. Det är en ögonblicksbild – inte ett 25-årsantagande för intäkt för elen.'
    };

    if (fx) {
      // EUR/MWh × SEK/EUR / 1000 = kr/kWh
      kropp.prisKrKwh = avrunda((medelEurMwh * fx.sekPerEur) / 1000, 4);
      kropp.sekPerEur = fx.sekPerEur;
      kropp.fxDatum = fx.datum;
      kropp.fxKalla = {
        namn: 'Sveriges riksbank',
        serie: 'SEKEURPMI',
        url: 'https://www.riksbank.se/sv/statistik/rantor-och-valutakurser/hamta-rantor-och-valutakurser-via-api/'
      };
    } else {
      kropp.prisKrKwh = null;
      kropp.fxFel = 'Riksbankens växelkurs kunde inte hämtas. Priset visas bara i EUR/MWh.';
    }

    return Response.json(kropp, { status: 200 });
  } catch (err) {
    console.error('elpris: oväntat fel', err);
    return jsonFel(502, 'Kunde inte hämta elpris just nu. Skriv in priset manuellt.');
  }
}

function jsonFel(status, fel) {
  return Response.json({ ok: false, fel }, { status });
}

function avrunda(n, dec) {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}

function medel(tal) {
  return tal.reduce((s, x) => s + x, 0) / tal.length;
}

/**
 * Försök idag, sedan igår, sedan imorgon – så att vi får ett helt dygn
 * (publiceras ca kl. 13 dagen före) och inte tre dygns medelvärde.
 */
async function hamtaBastaDygn({ token, eic }) {
  const dagar = [
    stockholmYmd(new Date()),
    stockholmYmd(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    stockholmYmd(new Date(Date.now() + 24 * 60 * 60 * 1000))
  ];
  for (const dag of dagar) {
    const start = stockholmMidnattUtc(dag);
    const slut = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const svar = await hamtaEntsoeXml({
      token,
      eic,
      periodStart: tillEntsoeStampel(start),
      periodEnd: tillEntsoeStampel(slut)
    });
    if (!svar.ok) {
      if (/nyckeln/i.test(svar.fel || '')) {
        return { fel: svar.fel, status: svar.status };
      }
      continue;
    }
    const priser = lasPriserUrXml(svar.xml);
    if (priser.length > 0) return { leveransdag: dag, priser };
  }
  return null;
}

function stockholmYmd(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function tzOffsetMinuter(tz, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const namn = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0';
  const m = namn.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return 0;
  const tecken = m[1] === '-' ? -1 : 1;
  return tecken * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function stockholmMidnattUtc(ymd) {
  const probe = new Date(`${ymd}T12:00:00Z`);
  const offset = tzOffsetMinuter('Europe/Stockholm', probe);
  const start = new Date(Date.UTC(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10)),
    0, 0, 0
  ));
  start.setUTCMinutes(start.getUTCMinutes() - offset);
  return start;
}

function tillEntsoeStampel(date) {
  return date.toISOString().replace(/[-:T]/g, '').slice(0, 12);
}

async function hamtaEntsoeXml({ token, eic, periodStart, periodEnd }) {
  const q = new URL(ENTSOE_URL);
  q.searchParams.set('securityToken', token);
  q.searchParams.set('documentType', 'A44');
  q.searchParams.set('in_Domain', eic);
  q.searchParams.set('out_Domain', eic);
  q.searchParams.set('periodStart', periodStart);
  q.searchParams.set('periodEnd', periodEnd);

  const res = await fetch(q, { headers: { Accept: 'application/xml, text/xml, */*' } });
  const xml = await res.text();

  if (!res.ok) {
    console.error('elpris: ENTSO-E HTTP', res.status);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: 502, fel: 'ENTSO-E avvisade nyckeln. Kontrollera ENTSOE_SECURITY_TOKEN.' };
    }
    return { ok: false, status: 502, fel: 'ENTSO-E svarade inte som väntat. Skriv in priset manuellt.' };
  }

  if (/Acknowledgement_MarketDocument/i.test(xml) || />999</.test(xml)) {
    return {
      ok: false,
      status: 502,
      fel: 'ENTSO-E hade ingen matchande prisdata för perioden. Skriv in priset manuellt.'
    };
  }

  return { ok: true, xml };
}

/**
 * Plockar price.amount ur Publication_MarketDocument.
 * Om flera TimeSeries finns (t.ex. olika upplösning) används den med flest punkter.
 */
function lasPriserUrXml(xml) {
  const delar = xml.split(/<TimeSeries[\s>]/i).slice(1);
  const kandidater = delar.length > 0 ? delar : [xml];
  let basta = [];
  for (const del of kandidater) {
    const priser = [...del.matchAll(/price\.amount>\s*([+-]?\d+(?:\.\d+)?)/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n));
    if (priser.length > basta.length) basta = priser;
  }
  return basta;
}

async function hamtaSekPerEur() {
  try {
    const res = await fetch(RIKSBANK_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const sekPerEur = Number(data?.value);
    if (!Number.isFinite(sekPerEur) || sekPerEur <= 0) return null;
    return { sekPerEur, datum: data.date || null };
  } catch (err) {
    console.error('elpris: Riksbanken', err);
    return null;
  }
}
