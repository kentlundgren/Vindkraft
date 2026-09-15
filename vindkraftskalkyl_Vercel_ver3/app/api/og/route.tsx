/**
 * Förhandsvisningsbild för en *delad* kalkyl.
 *
 * `GET /api/og?s=abc123&p=narboende` eller `?t=<token>&p=…`
 *
 * Varför en egen rutt och inte bara `app/kalkyl/opengraph-image.tsx`:
 * filkonventionen får bara `params` av Next.js, aldrig querysträngen. Ska
 * bilden visa det delade scenariots tal måste sidan peka ut en adress som
 * bär med sig koden – det är den här. Sidorna gör det i `generateMetadata`.
 *
 * Bilden ritas av lib/og.tsx. Går scenariot inte att läsa visas
 * standardvärdena i stället för ett fel: en trasig förhandsvisning är
 * sämre än en generisk.
 */

import { arOgPerspektiv, ritaOgBild } from '@/lib/og';
import { hamtaKortKod, packaUpp } from '@/lib/scenario';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kortKod = url.searchParams.get('s');
  const token = url.searchParams.get('t');
  const perspektivParam = url.searchParams.get('p');

  const perspektiv = arOgPerspektiv(perspektivParam)
    ? perspektivParam
    : undefined;

  let falt = null;
  try {
    if (kortKod) falt = await hamtaKortKod(kortKod);
    else if (token) falt = packaUpp(token);
  } catch (avbrott) {
    console.error('og: kunde inte läsa scenariot', avbrott);
  }

  return ritaOgBild({ falt, perspektiv });
}
