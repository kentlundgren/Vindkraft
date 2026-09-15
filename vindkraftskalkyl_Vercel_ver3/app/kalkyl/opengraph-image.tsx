/**
 * Standardbilden för /kalkyl och de fem perspektiv-sidorna (Next.js ärver
 * metadatafiler nedåt i mappträdet).
 *
 * Den här bilden visar standardkalkylen och ritas en gång vid bygget – ingen
 * funktion behöver väckas när någon delar en vanlig länk.
 *
 * Delade länkar (`?s=`/`?t=`) pekas i stället om till /api/og av sidornas
 * `generateMetadata`, eftersom den här filen aldrig får se querysträngen.
 */

import { OG_ALT, OG_STORLEK, OG_TYP, ritaOgBild } from '@/lib/og';

export const alt = OG_ALT;
export const size = OG_STORLEK;
export const contentType = OG_TYP;

export default function Image() {
  return ritaOgBild();
}
