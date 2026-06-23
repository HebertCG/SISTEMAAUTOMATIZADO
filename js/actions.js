import { actualizarEstado } from './data.js';
import { $, toast, confirmar } from './ui.js';

const MENSAJES = {
  confirmada: 'Reserva confirmada',
  completada: 'Reserva completada',
  cancelada: 'Reserva cancelada',
};

// Maneja los botones Confirmar / Completar / Cancelar de la tabla (delegación).
// `onActualizado` se llama tras un cambio exitoso para recargar el panel.
export function setupAcciones(onActualizado) {
  $('tablaWrap').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-accion]');
    if (!btn) return;

    const { accion, id } = btn.dataset;

    if (accion === 'cancelada') {
      const ok = await confirmar(
        'Cancelar reserva',
        'Esta reserva quedará marcada como cancelada. ¿Quieres continuar?',
        true
      );
      if (!ok) return;
    }

    const grupo = btn.closest('.acciones');
    grupo.querySelectorAll('button').forEach((b) => { b.disabled = true; });

    try {
      await actualizarEstado(id, accion);
    } catch (error) {
      grupo.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      toast('No se pudo actualizar: ' + error.message, 'err');
      return;
    }

    toast(MENSAJES[accion] || 'Reserva actualizada', accion === 'cancelada' ? 'info' : 'ok');
    onActualizado();
  });
}
