import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';

export const metadata: Metadata = {
  title: 'Investerare – Vindkraftskalkyl ver3',
  description:
    'Investerarperspektivet: LCOE, payback, NPV och IRR för en vindkraftspark.',
};

/**
 * /kalkyl/investerare – tunn wrapper runt samma CalculatorForm som /kalkyl.
 * Propen `perspektiv` lyfter fram investerartalen; formlerna är desamma.
 */
export default function InvesterarePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Investerarperspektivet
      </h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        Lönar sig parken för den som bygger den? Ändra de gula fälten så räknas
        LCOE, payback, NPV och IRR om direkt.
      </p>
      <div className="mt-8">
        <CalculatorForm perspektiv="investerare" />
      </div>
    </main>
  );
}
