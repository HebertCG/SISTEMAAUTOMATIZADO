import { sb } from './supabase.js';
import { REFRESH_MS } from './config.js';

let intervalo = null;
let canalRT = null;

// Arranca el refresco periódico + la suscripción Realtime a `reservations`.
// `onCambio` se ejecuta en cada tick y en cada cambio de la tabla.
export function iniciarTiempoReal(onCambio) {
  if (!intervalo) intervalo = setInterval(onCambio, REFRESH_MS);
  if (!canalRT) {
    canalRT = sb.channel('reservas-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => onCambio())
      .subscribe();
  }
}

export function detenerTiempoReal() {
  if (intervalo) { clearInterval(intervalo); intervalo = null; }
  if (canalRT) { sb.removeChannel(canalRT); canalRT = null; }
}
