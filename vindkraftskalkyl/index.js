/* ============================================================================
   index.js – startsidan index.html (Vindkraftens ekonomi: vem får vad?)
   ----------------------------------------------------------------------------
   Gör två saker: fyller versionsraden och öppnar/stänger teknikmodalen.
   Sidan räknar ingenting och hämtar inga siffror: den länkar till kalkylerna.

   UPPDATERING 2026-11-23: sidan skapades. Version 1.0.
   ============================================================================ */
'use strict';

const VERSION = '1.0';
const VERSIONSDATUM = '2026-11-23';

document.addEventListener('DOMContentLoaded', () => {
  // Versionsrad i sidfoten (konstanterna ovan).
  const nr = document.getElementById('versionsrad-nr');
  const dat = document.getElementById('versionsrad-datum');
  if (nr) nr.textContent = VERSION;
  if (dat) dat.textContent = VERSIONSDATUM;

  // Teknikmodalen: knappen, stängknappen, ett klick utanför rutan och Esc.
  const knapp = document.getElementById('teknik-knapp');
  const modal = document.getElementById('teknik-modal');
  const stang = document.getElementById('teknik-stang');
  if (!knapp || !modal || !stang) return;
  const oppna = () => { modal.hidden = false; stang.focus(); };
  const stangModal = () => { modal.hidden = true; knapp.focus(); };
  knapp.addEventListener('click', oppna);
  stang.addEventListener('click', stangModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) stangModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) stangModal(); });
});
