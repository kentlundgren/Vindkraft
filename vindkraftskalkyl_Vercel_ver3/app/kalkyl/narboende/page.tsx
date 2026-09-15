import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';

export const metadata: Metadata = {
  title: 'Närboende (NU20) – Vindkraftskalkyl ver3',
  description:
    'Vindkraftsersättning enligt NU20: avståndszoner, distansfaktor och taket på 2,5 promille.',
};

/**
 * /kalkyl/narboende – den URL som är tänkt att skickas vidare.
 * Samma formulär som /kalkyl, men NU20-talen ligger överst.
 */
export default function NarboendePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Närboendeperspektivet
      </h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        Vad får den som bor nära? Ersättningen enligt NU20 (prop. 2025/26:239)
        beror på avstånd, verkshöjd och antal verk inom fem verkshöjder – och
        får högst uppgå till 2,5 promille av parkens intäkter.
      </p>
      <div className="mt-8">
        <CalculatorForm perspektiv="narboende" />
      </div>
    </main>
  );
}
