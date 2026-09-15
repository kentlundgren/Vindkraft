import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';

export const metadata: Metadata = {
  title: 'Markägare – Vindkraftskalkyl ver3',
  description:
    'Markägarperspektivet: arrende per år, över hela livslängden och som nuvärde.',
};

/**
 * /kalkyl/markagare – samma formulär och samma tal som /kalkyl,
 * men arrendet ligger överst.
 */
export default function MarkagarePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Markägarperspektivet
      </h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        Vad ger arrendet? Välj modell i de gula fälten: andel av bruttointäkten
        eller ett fast belopp per MW och år.
      </p>
      <div className="mt-8">
        <CalculatorForm perspektiv="markagare" />
      </div>
    </main>
  );
}
