// Punto de entrada del panel. Conecta auth, datos, render, acciones y tiempo real.
import { $, toast } from './ui.js';
import { cargarDatos } from './data.js';
import { renderKpis, renderEstado, renderDias, renderTabla } from './render.js';
import { setupAuth, haySesion } from './auth.js';
import { setupAcciones } from './actions.js';
import { iniciarTiempoReal, detenerTiempoReal } from './realtime.js';

// Trae los datos y repinta todo el panel. Si falla, avisa al staff.
async function cargar() {
  try {
    const { reservas, porDia } = await cargarDatos();
    renderKpis(reservas);
    renderEstado(reservas);
    renderDias(porDia);
    renderTabla(reservas);
    $('updated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit',
    });
  } catch (error) {
    toast('No se pudieron cargar las reservas: ' + error.message, 'err');
  }
}

// Alterna entre la pantalla de login y el panel.
function mostrarApp(logueado) {
  $('app').hidden = !logueado;
  $('login').style.display = logueado ? 'none' : 'flex';
  if (logueado) { iniciarTiempoReal(cargar); cargar(); }
  else { detenerTiempoReal(); }
}

setupAuth(mostrarApp);
setupAcciones(cargar);

(async function init() {
  mostrarApp(await haySesion());
})();
