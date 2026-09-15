/**
 * Route Handler för delningslänkar.
 *
 *   POST /api/scenario   { falt } → { ok, id?, token, urlNyckel, ttlDagar }
 *   GET  /api/scenario?id=abc123  → { ok, falt, via: 'id' }
 *   GET  /api/scenario?token=…    → { ok, falt, via: 'token' }
 *
 * Samma kontrakt som ver2. Ingen beräkning sker här – vi validerar bara att
 * fälten är kända kalkylfält (`rensaFalt`) och paketerar dem.
 *
 * Utan Redis lyckas POST ändå: då saknas `id` och klienten använder `?t=`.
 */

import { rensaFalt } from '@/lib/falt';
import {
  hamtaKortKod,
  MAX_TOKEN_TECKEN,
  packa,
  packaUpp,
  sparaKortKod,
  TTL_DAGAR,
} from '@/lib/scenario';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const kropp = (await request.json()) as { falt?: unknown };
    const falt = rensaFalt(kropp?.falt);
    if (!falt) {
      return fel(400, 'Inga giltiga kalkylfält att spara.');
    }

    const token = packa(falt);
    if (token.length > MAX_TOKEN_TECKEN) {
      return fel(413, 'Scenariot blev för stort att dela som länk.');
    }

    // Kort kod kräver Redis. Saknas den får användaren den långa länken.
    const id = await sparaKortKod(falt);

    return Response.json({
      ok: true,
      id,
      token,
      urlNyckel: id ? 's' : 't',
      ttlDagar: id ? TTL_DAGAR : null,
    });
  } catch (avbrott) {
    console.error('scenario POST', avbrott);
    return fel(
      500,
      'Kunde inte spara scenariot. Kalkylen fungerar ändå i webbläsaren.'
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const token = url.searchParams.get('token');

    if (id) {
      const falt = await hamtaKortKod(id);
      if (!falt) {
        return fel(
          404,
          'Den korta koden hittades inte. Den kan ha gått ut (30 dagar) eller så saknas Redis.'
        );
      }
      return Response.json({ ok: true, falt, via: 'id' });
    }

    if (token) {
      const falt = packaUpp(token);
      if (!falt) {
        return fel(400, 'Ogiltig delningskod.');
      }
      return Response.json({ ok: true, falt, via: 'token' });
    }

    return fel(400, 'Ange id eller token.');
  } catch (avbrott) {
    console.error('scenario GET', avbrott);
    return fel(500, 'Kunde inte läsa scenariot.');
  }
}

function fel(status: number, text: string) {
  return Response.json({ ok: false, fel: text }, { status });
}
