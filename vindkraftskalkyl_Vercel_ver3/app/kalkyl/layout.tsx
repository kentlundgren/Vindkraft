import { Suspense, type ReactNode } from 'react';
import { KalkylProvider } from '@/components/KalkylProvider';

/**
 * Delad layout för /kalkyl och de fem perspektiv-sidorna.
 *
 * Layouten monteras om bara när man lämnar /kalkyl-grenen. Därför ligger
 * indatafältens state här (i KalkylProvider) – då följer värdena med när man
 * klickar mellan Översikt, Investerare, Markägare, Kommun, Andelsägare och
 * Närboende, utan att kalkylen räknas om från standardvärden.
 *
 * Suspense behövs eftersom providern läser adressens `?s=`/`?t=` och kan
 * behöva vänta in ett svar från /api/scenario innan fälten kan fyllas.
 */
export default function KalkylLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-8 text-slate-600">
          Laddar kalkylen …
        </main>
      }
    >
      <KalkylProvider>{children}</KalkylProvider>
    </Suspense>
  );
}
