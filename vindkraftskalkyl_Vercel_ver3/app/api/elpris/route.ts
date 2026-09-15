/**
 * GET /api/elpris?omrade=SE4&period=manad
 *
 * Route Handler (Fluid Compute, Node-runtimen – inte edge). Den gör tre saker:
 * validerar query, letar i Redis-cachen och hämtar annars från ENTSO-E via
 * lib/elpris.ts. Ingen kalkylformel bor här.
 *
 * Kalkylen fungerar utan den här rutten. Saknas nyckeln svarar vi 503 med
 * begriplig text i stället för att krascha – de gula fälten rörs aldrig.
 */

import {
  arOmrade,
  arPeriod,
  hamtaElpris,
  OMRADEN,
  PERIODER,
  type ElprisFel,
  type ElprisSvar,
} from '@/lib/elpris';
import { redisGet, redisSet } from '@/lib/redis';

// Query-parametrarna gör rutten dynamisk; ingen förrendering vid build.
export const dynamic = 'force-dynamic';

/** Cachetid enligt SPEC: sex timmar per område och period. */
const CACHE_SEKUNDER = 6 * 60 * 60;

/**
 * Pågående hämtningar i den här instansen. Kommer tio anrop samtidigt på
 * samma nyckel delar de på ett enda ENTSO-E-anrop i stället för tio.
 */
const pagaende = new Map<string, Promise<ElprisSvar | ElprisFel>>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const omrade = (url.searchParams.get('omrade') ?? 'SE4').toUpperCase();
  const period = (url.searchParams.get('period') ?? 'dygn').toLowerCase();

  if (!arOmrade(omrade)) {
    return fel(400, `Okänt elområde. Använd ${OMRADEN.join(', ')}.`);
  }
  if (!arPeriod(period)) {
    return fel(400, `Okänd period. Använd ${PERIODER.join(', ')}.`);
  }

  const nyckel = `elpris:${omrade.toLowerCase()}:${period}`;

  // 1) Cachad hämtning? Då slipper vi både ENTSO-E och Riksbanken.
  const cachat = await redisGet(nyckel);
  if (cachat) {
    try {
      return Response.json(JSON.parse(cachat) as ElprisSvar, { status: 200 });
    } catch {
      // Trasigt cachevärde: gå vidare och hämta på nytt.
    }
  }

  // 2) Nyckeln läses bara här på servern, aldrig i webbläsaren.
  const token = process.env.ENTSOE_SECURITY_TOKEN;
  if (!token) {
    console.error('elpris: ENTSOE_SECURITY_TOKEN saknas');
    return fel(
      503,
      'Elpris kan inte hämtas ännu: nyckeln ENTSOE_SECURITY_TOKEN saknas i Vercel. Kalkylen fungerar med manuellt pris.'
    );
  }

  // 3) Hämta – och låt samtidiga anrop på samma nyckel dela på jobbet.
  let arbete = pagaende.get(nyckel);
  if (!arbete) {
    arbete = hamtaElpris(omrade, period, token).finally(() => {
      pagaende.delete(nyckel);
    });
    pagaende.set(nyckel, arbete);
  }

  let svar: ElprisSvar | ElprisFel;
  try {
    svar = await arbete;
  } catch (avbrott) {
    console.error('elpris: oväntat fel', avbrott);
    return fel(502, 'Kunde inte hämta elpris just nu. Skriv in priset manuellt.');
  }

  if (!svar.ok) {
    return fel(svar.status, svar.fel);
  }

  // 4) Skriv cachen. Misslyckas den svarar vi ändå – det är bara en genväg.
  await redisSet(nyckel, JSON.stringify(svar), CACHE_SEKUNDER);

  return Response.json(svar, { status: 200 });
}

function fel(status: number, text: string) {
  return Response.json({ ok: false, fel: text }, { status });
}
