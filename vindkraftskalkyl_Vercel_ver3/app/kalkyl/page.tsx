import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkyl – Vindkraftskalkyl ver3",
};

/**
 * Platshållare så att / och menyn inte ger 404.
 * Själva gula fälten och beräkningen kommer i nästa kodavsnitt.
 */
export default function KalkylPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Kalkyl</h1>
      <p className="mt-4 leading-relaxed text-slate-700">
        Nästa avsnitt: porta beräkningen och visa gula indatafält. Inget räknas
        här ännu.
      </p>
    </main>
  );
}
