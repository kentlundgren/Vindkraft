import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';

export const metadata: Metadata = {
  title: 'Kommun och samhälle – Vindkraftskalkyl ver3',
  description:
    'Kommunperspektivet: lokala intäkter, kommunal ersättning och värderad klimatnytta.',
};

/**
 * /kalkyl/kommun – samma formulär som /kalkyl, med de lokala intäkterna
 * och samhällsnyttan överst.
 */
export default function KommunPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Kommun- och samhällsperspektivet
      </h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        Vad stannar i bygden? Arrende, kommunal ersättning och
        närboendeersättning år 1 och över hela livslängden, plus undviken CO₂.
      </p>
      <div className="mt-8">
        <CalculatorForm perspektiv="kommun" />
      </div>
    </main>
  );
}
