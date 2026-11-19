/* ============================================================================
   narboende_info.js – förklaringsruta för "närboende" och "ersättning till närboende".
   Elementen med klassen "nb-info" (och tabindex="0") visar en ruta med en länk
   till mer information om lag (2026:1113) om intäktsdelning från
   vindkraftsanläggningar. Rutan öppnas vid hovring (mus), fokus (tangentbord)
   och tryck (pekskärm), och stängs med Esc, nytt tryck eller klick utanför.
   UPPDATERING 2026-11-19: ny fil. Rutan skapas av skriptet, så den fungerar även
   för text som andra skript bygger senare (delegerade händelser på document).
   ============================================================================ */
(function () {
  'use strict';

  var LANK = 'https://controllerutangranser.wordpress.com/2026/11/11/besked-fore-beslut-att-forbattra-intaktsdelningen-fran-vindkraft-till-narboende/';

  var ruta = document.createElement('div');
  ruta.id = 'nb-ruta';
  ruta.className = 'nb-ruta';
  ruta.setAttribute('role', 'tooltip');
  ruta.hidden = true;
  ruta.innerHTML =
    '<p>Ny vindkraft kan ge närboende en andel av intäkterna enligt ' +
    '<strong>lag (2026:1113) om intäktsdelning från vindkraftsanläggningar</strong>.</p>' +
    '<p><a href="' + LANK + '" target="_blank" rel="noopener">Läs mer om intäktsdelningen ' +
    '(blogginlägg 2026-11-11) →</a></p>';
  document.body.appendChild(ruta);

  var aktivt = null;      // elementet rutan hör till just nu
  var stangTimer = null;

  function placera(el) {
    var r = el.getBoundingClientRect();
    var bredd = Math.min(320, window.innerWidth - 16);
    ruta.style.width = bredd + 'px';
    var vanster = Math.max(8, Math.min(r.left, window.innerWidth - bredd - 8));
    ruta.style.left = (vanster + window.scrollX) + 'px';
    // Ovanför om det inte får plats nedanför
    var hojd = ruta.offsetHeight;
    var under = r.bottom + 6;
    var y = (under + hojd > window.innerHeight && r.top - hojd - 6 > 0) ? r.top - hojd - 6 : under;
    ruta.style.top = (y + window.scrollY) + 'px';
  }

  function oppna(el) {
    clearTimeout(stangTimer);
    if (aktivt && aktivt !== el) { aktivt.removeAttribute('aria-describedby'); }
    aktivt = el;
    el.setAttribute('aria-describedby', 'nb-ruta');
    ruta.hidden = false;
    placera(el);
  }

  function stang() {
    clearTimeout(stangTimer);
    ruta.hidden = true;
    if (aktivt) { aktivt.removeAttribute('aria-describedby'); }
    aktivt = null;
  }

  function stangSnart() {
    clearTimeout(stangTimer);
    stangTimer = setTimeout(stang, 250);   // ger musen tid att nå länken i rutan
  }

  function malet(e) {
    return e.target.closest ? e.target.closest('.nb-info') : null;
  }

  document.addEventListener('mouseover', function (e) {
    var el = malet(e);
    if (el) { oppna(el); }
  });
  document.addEventListener('mouseout', function (e) {
    if (malet(e)) { stangSnart(); }
  });
  ruta.addEventListener('mouseenter', function () { clearTimeout(stangTimer); });
  ruta.addEventListener('mouseleave', stangSnart);

  document.addEventListener('focusin', function (e) {
    var el = malet(e);
    if (el) { oppna(el); }
  });
  document.addEventListener('focusout', function (e) {
    if (malet(e)) { stangSnart(); }
  });
  ruta.addEventListener('focusin', function () { clearTimeout(stangTimer); });
  ruta.addEventListener('focusout', stangSnart);

  // Tryck på pekskärm: växla. Klick utanför stänger.
  document.addEventListener('click', function (e) {
    var el = malet(e);
    if (el) {
      if (aktivt === el && !ruta.hidden && e.detail > 0 && e.pointerType === 'touch') { stang(); }
      else { oppna(el); }
    } else if (!ruta.contains(e.target)) {
      stang();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { stang(); }
  });

  window.addEventListener('scroll', function () { if (aktivt && !ruta.hidden) { placera(aktivt); } }, { passive: true });
  window.addEventListener('resize', function () { if (aktivt && !ruta.hidden) { placera(aktivt); } });
})();
