import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';
import { kalkylMetadata } from '@/lib/metadata';

export async function generateMetadata({
  searchParams,
}: PageProps<'/kalkyl/markagare'>): Promise<Metadata> {
  return kalkylMetadata({
    titel: 'Markägare – Vindkraftskalkyl ver3',
    beskrivning:
      'Markägarperspektivet: arrende per år, över hela livslängden och som nuvärde.',
    perspektiv: 'markagare',
    searchParams,
  });
}

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
