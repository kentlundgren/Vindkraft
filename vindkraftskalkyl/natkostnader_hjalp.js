/* ============================================================================
   natkostnader_hjalp.js
   Förklaringsrutor vid hovring, fokus och tryck för element med klassen
   `hjalp` och attributet `data-hjalp`. Används av kalkylen och läsarsidan.
   Händelserna delegeras från dokumentet, så element som skapas senare (till
   exempel när läsarsidan byggs om) fungerar också.
   ============================================================================ */
'use strict';

(function () {
  function kopplaHjalp() {
    if (window.__hjalpKopplad) return;
    window.__hjalpKopplad = true;

    const ruta = document.createElement('div');
    ruta.className = 'hjalp-ruta';
    ruta.setAttribute('role', 'tooltip');
    ruta.hidden = true;
    document.body.appendChild(ruta);

    let aktiv = null;
    const hitta = (t) => (t && t.closest) ? t.closest('.hjalp[data-hjalp]') : null;

    function visa(e) {
      aktiv = e;
      ruta.textContent = e.getAttribute('data-hjalp');
      ruta.hidden = false;
      const r = e.getBoundingClientRect();
      const bredd = Math.min(320, window.innerWidth - 24);
      ruta.style.maxWidth = bredd + 'px';
      let left = r.left + window.scrollX;
      left = Math.min(left, window.scrollX + window.innerWidth - bredd - 12);
      ruta.style.left = Math.max(window.scrollX + 8, left) + 'px';
      ruta.style.top = (r.bottom + window.scrollY + 6) + 'px';
    }
    function dolj() { ruta.hidden = true; aktiv = null; }

    document.addEventListener('mouseover', (ev) => { const e = hitta(ev.target); if (e) visa(e); });
    document.addEventListener('mouseout', (ev) => { if (hitta(ev.target)) dolj(); });
    document.addEventListener('focusin', (ev) => { const e = hitta(ev.target); if (e) visa(e); });
    document.addEventListener('focusout', (ev) => { if (hitta(ev.target)) dolj(); });
    document.addEventListener('click', (ev) => {
      const e = hitta(ev.target);
      if (e) { ev.preventDefault(); if (aktiv === e) dolj(); else visa(e); }
      else dolj();
    });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') dolj(); });
  }
  window.kopplaHjalp = kopplaHjalp;
})();
