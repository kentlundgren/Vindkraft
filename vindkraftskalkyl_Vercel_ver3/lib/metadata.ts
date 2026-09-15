/**
 * Metadata för kalkylsidorna, på ett ställe.
 *
 * Utan delningskod i adressen låter vi Next.js filkonvention sköta bilden
 * (`app/kalkyl/opengraph-image.tsx`, ritad vid bygget). Finns `?s=` eller
 * `?t=` pekar vi i stället ut /api/og med koden med sig, så att
 * förhandsvisningen visar det delade scenariots egna tal.
 *
 * Priset: att läsa `searchParams` gör sidan server-renderad vid varje anrop
 * i stället för statisk. Det är ett medvetet val (SPEC 7.3).
 */

import type { Metadata } from 'next';
import { OG_ALT, OG_STORLEK, type OgPerspektiv } from './og.tsx';

/** Next.js skickar sökparametrarna som ett löfte sedan version 15. */
type Sokparametrar = Promise<{
  [nyckel: string]: string | string[] | undefined;
}>;

/**
 * Riktigt långa `?t=`-tokens gör og:image-adressen opraktisk – vissa tjänster
 * kapar långa URL:er. Då får det bli standardbilden i stället.
 */
const MAX_TOKEN_I_BILDLANK = 1500;

export async function kalkylMetadata({
  titel,
  beskrivning,
  perspektiv,
  searchParams,
}: {
  titel: string;
  beskrivning: string;
  perspektiv?: OgPerspektiv;
  searchParams: Sokparametrar;
}): Promise<Metadata> {
  const grund: Metadata = { title: titel, description: beskrivning };
  const sok = await searchParams;

  const kortKod = forsta(sok.s);
  const token = forsta(sok.t);
  const anvandToken = token && token.length <= MAX_TOKEN_I_BILDLANK;

  if (!kortKod && !anvandToken) return grund;

  const fraga = new URLSearchParams();
  if (kortKod) fraga.set('s', kortKod);
  else if (token) fraga.set('t', token);
  if (perspektiv) fraga.set('p', perspektiv);

  const bild = `/api/og?${fraga.toString()}`;

  return {
    ...grund,
    openGraph: {
      title: titel,
      description: beskrivning,
      type: 'website',
      locale: 'sv_SE',
      images: [{ url: bild, ...OG_STORLEK, alt: OG_ALT }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titel,
      description: beskrivning,
      images: [bild],
    },
  };
}

function forsta(varde: string | string[] | undefined): string | undefined {
  return Array.isArray(varde) ? varde[0] : varde;
}
