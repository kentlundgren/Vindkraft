import type { ReactNode } from 'react';
import { KalkylProvider } from '@/components/KalkylProvider';

/**
 * Delad layout för /kalkyl och de fem perspektiv-sidorna.
 *
 * Layouten monteras om bara när man lämnar /kalkyl-grenen. Därför ligger
 * indatafältens state här (i KalkylProvider) – då följer värdena med när man
 * klickar mellan Översikt, Investerare, Markägare, Kommun, Andelsägare och
 * Närboende, utan att kalkylen räknas om från standardvärden.
 */
export default function KalkylLayout({ children }: { children: ReactNode }) {
  return <KalkylProvider>{children}</KalkylProvider>;
}
