import type { Metadata } from 'next';
import CalculatorForm from '@/components/CalculatorForm';
import { kalkylMetadata } from '@/lib/metadata';

/**
 * Metadata läses per anrop för att en delad länk (`?s=`/`?t=`) ska få en
 * förhandsvisningsbild med scenariots egna tal.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<'/kalkyl'>): Promise<Metadata> {
  return kalkylMetadata({
    titel: 'Kalkyl – Vindkraftskalkyl ver3',
    beskrivning:
      'Fem perspektiv på vindkraftens ekonomi: LCOE, payback, NPV, IRR och NU20-ersättning.',
    searchParams,
  });
}

/**
 * /kalkyl – Server Component som bara sätter ramen.
 * Fälten och omräkningen ligger i CalculatorForm ('use client').
 * Ingen API-nyckel och inget serveranrop behövs för att räkna.
 */
export default function KalkylPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Vindkraftskalkyl</h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        Samma formler som programversionen och ver2. Ändra ett gult fält så
        räknas nyckeltalen om direkt i webbläsaren.
      </p>
      <div className="mt-8">
        <CalculatorForm />
      </div>
    </main>
  );
}
