import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';

export const metadata: Metadata = {
  title: 'Andelsägare – Vindkraftskalkyl ver3',
  description:
    'Den kooperativa modellen: insats per andel, självkostnad och besparing mot hushållselens pris.',
};

/**
 * /kalkyl/andelsagare – samma formulär som /kalkyl, med den kooperativa
 * modellen överst.
 */
export default function AndelsagarePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Andelsägarperspektivet
      </h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        Lönar sig andelarna för hushållet? Självkostnaden jämförs med
        marknadspriset på hushållsel inklusive påslag, energiskatt och moms.
      </p>
      <div className="mt-8">
        <CalculatorForm perspektiv="andelsagare" />
      </div>
    </main>
  );
}
