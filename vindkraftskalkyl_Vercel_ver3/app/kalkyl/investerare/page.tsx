import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';
import { kalkylMetadata } from '@/lib/metadata';

export async function generateMetadata({
  searchParams,
}: PageProps<'/kalkyl/investerare'>): Promise<Metadata> {
  return kalkylMetadata({
    titel: 'Investerare – Vindkraftskalkyl ver3',
    beskrivning:
      'Investerarperspektivet: LCOE, payback, NPV och IRR för en vindkraftspark.',
    perspektiv: 'investerare',
    searchParams,
  });
}

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
