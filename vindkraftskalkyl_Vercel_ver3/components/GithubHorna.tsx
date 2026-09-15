/**
 * Diskret GitHub-länk, fast nere till vänster.
 * Samma sidregel som i HTML-kalkylen, men länken pekar på ver3-mappen.
 */
export default function GithubHorna() {
  return (
    <a
      id="github-lank"
      className="fixed left-4 bottom-4 z-50 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 font-mono text-sm font-semibold text-slate-700 shadow-sm opacity-80 hover:opacity-100 hover:border-teal-700 hover:text-teal-800"
      href="https://github.com/kentlundgren/Vindkraft/tree/main/vindkraftskalkyl_Vercel_ver3"
      target="_blank"
      rel="noopener noreferrer"
      title="Öppna källkoden för Vercel ver3 på GitHub"
    >
      {"{ }"} GitHub
    </a>
  );
}
