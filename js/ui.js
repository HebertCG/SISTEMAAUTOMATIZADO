// Utilidades de UI: selector corto, escape de HTML, toast, modal y animación de números.

export const $ = (id) => document.getElementById(id);

// Escapa texto antes de inyectarlo como HTML. Imprescindible para datos que
// vienen del cliente de WhatsApp (p. ej. el nombre), que NO son de confianza.
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// Notificación efímera abajo al centro.
export function toast(msg, tipo = 'ok') {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'toast ' + tipo;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 250);
  }, 3200);
}

// Modal de confirmación. Devuelve una promesa que resuelve true/false.
export function confirmar(titulo, mensaje, peligro = false) {
  return new Promise((resolve) => {
    $('modalTitle').textContent = titulo;
    $('modalMsg').textContent = mensaje;
    $('modalOk').className = 'm-ok' + (peligro ? ' danger' : '');
    $('modalOk').textContent = peligro ? 'Sí, cancelar' : 'Sí';
    $('modal').hidden = false;
    const cerrar = (val) => {
      $('modal').hidden = true;
      $('modalOk').onclick = $('modalCancel').onclick = $('modal').onclick = null;
      resolve(val);
    };
    $('modalOk').onclick = () => cerrar(true);
    $('modalCancel').onclick = () => cerrar(false);
    $('modal').onclick = (ev) => { if (ev.target === $('modal')) cerrar(false); };
  });
}

// Anima un número de su valor actual hasta `to` (easing cúbico).
export function animarNumero(el, to) {
  const from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
  if (from === to) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 650;
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
