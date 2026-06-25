// Vista "Registro": historial mensual de TODAS las reservas para control general.
// Independiente del panel principal: navegación por mes, resumen y exportación CSV.
import { ESTADOS } from './config.js';
import { $, escapeHtml } from './ui.js';
import { hoyPeru } from './data.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Tarjetas de resumen del mes (clave de estado + etiqueta + clase de color).
const STATS = [
  { key: 'total',      label: 'Reservas',   cls: '' },
  { key: 'comensales', label: 'Comensales', cls: '' },
  { key: 'completada', label: 'Completadas', cls: 'green' },
  { key: 'confirmada', label: 'Confirmadas', cls: 'green' },
  { key: 'pendiente',  label: 'Pendientes', cls: 'amber' },
  { key: 'cancelada',  label: 'Canceladas', cls: 'red' },
];

let reservas = [];
let mesSel = hoyPeru().slice(0, 7); // 'YYYY-MM'
let busqueda = '';
let wired = false;

const mesLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
};

const cambiarMes = (ym, delta) => {
  let [y, m] = ym.split('-').map(Number);
  m += delta;
  if (m < 1) { m = 12; y -= 1; }
  if (m > 12) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
};

export function renderRegistro(data) {
  reservas = data;
  if (!wired) { wireControles(); wired = true; }
  pintar();
}

function wireControles() {
  $('mesPrev').addEventListener('click', () => { mesSel = cambiarMes(mesSel, -1); pintar(); });
  $('mesNext').addEventListener('click', () => { mesSel = cambiarMes(mesSel, 1); pintar(); });
  $('regBuscar').addEventListener('input', (e) => { busqueda = e.target.value.trim().toLowerCase(); pintar(); });
  $('regCsv').addEventListener('click', exportarCsv);
}

// Reservas del mes seleccionado, ordenadas de la más reciente a la más antigua.
function reservasDelMes() {
  return reservas
    .filter((x) => x.fecha && x.fecha.slice(0, 7) === mesSel)
    .sort((a, b) => (a.fecha_hora < b.fecha_hora ? 1 : -1));
}

function pintar() {
  $('mesLabel').textContent = mesLabel(mesSel);
  const delMes = reservasDelMes();

  // --- Resumen del mes ---
  const conteo = {
    total: delMes.length,
    comensales: delMes.reduce((s, x) => s + (x.personas || 0), 0),
  };
  Object.keys(ESTADOS).forEach((k) => { conteo[k] = delMes.filter((x) => x.estado === k).length; });
  $('regStats').innerHTML = STATS.map((s) =>
    `<div class="reg-stat"><div class="v ${s.cls}">${conteo[s.key] || 0}</div><div class="l">${s.label}</div></div>`
  ).join('');

  // --- Tabla (con búsqueda por cliente) ---
  const filas = busqueda
    ? delMes.filter((x) => (x.cliente || '').toLowerCase().includes(busqueda))
    : delMes;

  $('registroSub').textContent = `${filas.length} reserva${filas.length === 1 ? '' : 's'} · ${mesLabel(mesSel)}`;

  if (!filas.length) {
    $('registroTabla').innerHTML = `<div class="empty">No hay reservas en ${mesLabel(mesSel)}${busqueda ? ' para esa búsqueda' : ''}.</div>`;
    return;
  }

  const cuerpo = filas.map((x) => {
    const fecha = new Date(x.fecha_hora).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });
    const est = ESTADOS[x.estado] || { label: x.estado };
    return `<tr><td class="name">${escapeHtml(x.cliente) || '—'}</td><td>${escapeHtml(x.telefono) || '—'}</td><td>${escapeHtml(fecha)}</td><td>${escapeHtml(x.hora)}</td><td>${escapeHtml(x.personas)}</td><td><span class="badge b-${escapeHtml(x.estado)}">${escapeHtml(est.label)}</span></td></tr>`;
  }).join('');
  $('registroTabla').innerHTML = `<table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Hora</th><th>Personas</th><th>Estado</th></tr></thead><tbody>${cuerpo}</tbody></table>`;
}

// Exporta el mes visible (respetando la búsqueda) a un CSV descargable.
function exportarCsv() {
  const delMes = reservasDelMes();
  const filas = busqueda
    ? delMes.filter((x) => (x.cliente || '').toLowerCase().includes(busqueda))
    : delMes;
  if (!filas.length) return;

  const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const cabecera = ['Cliente', 'Telefono', 'Fecha', 'Hora', 'Personas', 'Estado'];
  const lineas = filas.map((x) => [
    x.cliente || '', x.telefono || '', x.fecha || '', x.hora || '',
    x.personas ?? '', (ESTADOS[x.estado] || { label: x.estado }).label,
  ].map(escapeCsv).join(','));

  // BOM para que Excel lea bien los acentos.
  const csv = '﻿' + [cabecera.join(','), ...lineas].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `reservas-tayanti-${mesSel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
