import { ESTADOS, ESTADOS_ACTIVOS, MAX_FILAS_TABLA } from './config.js';
import { $, escapeHtml, animarNumero } from './ui.js';
import { hoyPeru } from './data.js';

// Chart.js se carga como global (UMD) desde el <script> del index.
const Chart = window.Chart;

let chartDias, chartEstado, kpisBuilt = false;

// --- KPIs ------------------------------------------------------------------
export function renderKpis(reservas) {
  const hoy = hoyPeru();

  // FIX: una reserva del día solo cuenta si está ACTIVA. Las canceladas o
  // no_show no ocupan mesa, así que no deben sumar en "Reservas hoy" ni en
  // "Comensales hoy". (Antes se contaba por fecha sin mirar el estado.)
  const resHoyActivas = reservas.filter(
    (x) => x.fecha === hoy && ESTADOS_ACTIVOS.includes(x.estado)
  );

  // Pendientes/Confirmadas: solo de hoy en adelante (lo accionable), igual que
  // la tabla. Una reserva pendiente cuya fecha ya pasó es dato viejo y no debe
  // inflar el KPI.
  const proximas = reservas.filter((x) => x.fecha >= hoy);

  const vals = {
    'k-hoy': resHoyActivas.length,
    'k-com': resHoyActivas.reduce((s, x) => s + (x.personas || 0), 0),
    'k-pen': proximas.filter((x) => x.estado === 'pendiente').length,
    'k-con': proximas.filter((x) => x.estado === 'confirmada').length,
  };

  if (!kpisBuilt) {
    const defs = [
      { id: 'k-hoy', label: 'Reservas hoy', ic: '📅', cls: '' },
      { id: 'k-com', label: 'Comensales hoy', ic: '👥', cls: '' },
      { id: 'k-pen', label: 'Pendientes', ic: '🕒', cls: 'amber' },
      { id: 'k-con', label: 'Confirmadas', ic: '✓', cls: 'green' },
    ];
    $('kpis').innerHTML = defs.map((d, i) =>
      `<div class="kpi" style="animation-delay:${(i * 0.06).toFixed(2)}s"><div class="label"><span class="ic">${d.ic}</span>${d.label}</div><div class="value ${d.cls}" id="${d.id}">0</div></div>`
    ).join('');
    kpisBuilt = true;
  }
  for (const [id, to] of Object.entries(vals)) animarNumero($(id), to);
}

// --- Gráfico por estado (dona) --------------------------------------------
export function renderEstado(reservas) {
  // Misma ventana que los KPIs y la tabla: de hoy en adelante.
  const hoy = hoyPeru();
  const proximas = reservas.filter((x) => x.fecha >= hoy);
  const counts = {};
  proximas.forEach((x) => { counts[x.estado] = (counts[x.estado] || 0) + 1; });
  const keys = Object.keys(ESTADOS).filter((k) => counts[k]);
  const labels = keys.map((k) => ESTADOS[k].label);
  const data = keys.map((k) => counts[k]);
  const colors = keys.map((k) => ESTADOS[k].color);

  $('estadoLegend').innerHTML = keys.map((k) =>
    `<span><span class="dot" style="background:${ESTADOS[k].color}"></span>${ESTADOS[k].label} ${counts[k]}</span>`
  ).join('') || '<span>Sin datos aún</span>';

  if (chartEstado) {
    chartEstado.data.labels = labels;
    chartEstado.data.datasets[0].data = data;
    chartEstado.data.datasets[0].backgroundColor = colors;
    chartEstado.update();
    return;
  }
  chartEstado = new Chart($('chartEstado'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { display: false } } },
  });
}

// --- Gráfico de reservas por día (barras) ----------------------------------
export function renderDias(porDia) {
  const last = porDia.slice(-14);
  const labels = last.map((d) =>
    new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  );
  const data = last.map((d) => Number(d.total_reservas) || 0);

  if (chartDias) {
    chartDias.data.labels = labels;
    chartDias.data.datasets[0].data = data;
    chartDias.update();
    return;
  }
  chartDias = new Chart($('chartDias'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Reservas', data, backgroundColor: '#C99B4E', borderRadius: 6, maxBarThickness: 30 }] },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: '#8A847A' }, grid: { color: '#EFEBE3' } },
        x: { ticks: { color: '#8A847A' }, grid: { display: false } },
      },
    },
  });
}

// --- Tabla de reservas con filtros por fecha -------------------------------

// Suma `n` días a una fecha 'YYYY-MM-DD' (a mediodía UTC para evitar saltos por DST).
function sumarDias(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Domingo de la semana en curso (para el control de fin de semana).
function finDeSemana(iso) {
  const dow = new Date(iso + 'T12:00:00Z').getUTCDay(); // 0 = domingo
  return sumarDias(iso, dow === 0 ? 0 : 7 - dow);
}

// Filtros disponibles: etiqueta + predicado sobre la fecha de la reserva.
function construirFiltros(hoy) {
  const manana = sumarDias(hoy, 1);
  const pasado = sumarDias(hoy, 2);
  const finSem = finDeSemana(hoy);
  return [
    { key: 'hoy',    label: 'Hoy',    sub: 'hoy',           test: (f) => f === hoy },
    { key: 'manana', label: 'Mañana', sub: 'mañana',        test: (f) => f === manana },
    { key: 'pasado', label: 'Pasado', sub: 'pasado mañana', test: (f) => f === pasado },
    { key: 'semana', label: 'Semana', sub: 'esta semana',   test: (f) => f >= hoy && f <= finSem },
    { key: 'todas',  label: 'Todas',  sub: 'historial completo', test: () => true },
  ];
}

let ultimasReservas = [];
let filtroTabla = 'hoy'; // por defecto: control del día
let filtrosWired = false;

export function renderTabla(reservas) {
  ultimasReservas = reservas;
  const hoy = hoyPeru();
  const filtros = construirFiltros(hoy);
  const activo = filtros.find((f) => f.key === filtroTabla) || filtros[0];

  // Chips de filtro, cada uno con su conteo.
  $('filtros').innerHTML = filtros.map((f) => {
    const n = reservas.filter((x) => f.test(x.fecha)).length;
    return `<button class="chip${f.key === activo.key ? ' active' : ''}" data-filtro="${f.key}">${f.label}<span class="n">${n}</span></button>`;
  }).join('');

  if (!filtrosWired) {
    $('filtros').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filtro]');
      if (!btn) return;
      filtroTabla = btn.dataset.filtro;
      renderTabla(ultimasReservas);
    });
    filtrosWired = true;
  }

  // "Todas" (historial) ordena de la más reciente a la más antigua;
  // el resto en orden cronológico ascendente.
  const asc = (a, b) => (a.fecha_hora > b.fecha_hora ? 1 : -1);
  const desc = (a, b) => (a.fecha_hora < b.fecha_hora ? 1 : -1);
  const filas = reservas
    .filter((x) => activo.test(x.fecha))
    .sort(filtroTabla === 'todas' ? desc : asc)
    .slice(0, MAX_FILAS_TABLA);

  $('tablaSub').textContent = filas.length
    ? `${filas.length} reserva${filas.length === 1 ? '' : 's'} · ${activo.sub}`
    : activo.sub;

  if (!filas.length) {
    $('tablaWrap').innerHTML = `<div class="empty">No hay reservas para ${activo.sub}.</div>`;
    return;
  }
  const cuerpo = filas.map((x) => {
    const fecha = new Date(x.fecha_hora).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });
    const est = ESTADOS[x.estado] || { label: x.estado };
    // `cliente` viene de WhatsApp → se escapa para evitar XSS.
    return `<tr><td class="name">${escapeHtml(x.cliente) || '—'}</td><td>${escapeHtml(fecha)}</td><td>${escapeHtml(x.hora)}</td><td>${escapeHtml(x.personas)}</td><td><span class="badge b-${escapeHtml(x.estado)}">${escapeHtml(est.label)}</span></td><td>${accionesHTML(x)}</td></tr>`;
  }).join('');
  $('tablaWrap').innerHTML = `<table><thead><tr><th>Cliente</th><th>Fecha</th><th>Hora</th><th>Personas</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${cuerpo}</tbody></table>`;
}

// Botones de acción según el estado actual (el id es un UUID de Supabase, seguro).
function accionesHTML(x) {
  const id = escapeHtml(x.id);
  if (x.estado === 'pendiente') {
    return '<div class="acciones">'
      + `<button class="btn-act confirmar" data-accion="confirmada" data-id="${id}">Confirmar</button>`
      + `<button class="btn-act cancelar" data-accion="cancelada" data-id="${id}">Cancelar</button>`
      + '</div>';
  }
  if (x.estado === 'confirmada') {
    return '<div class="acciones">'
      + `<button class="btn-act completar" data-accion="completada" data-id="${id}">Completar</button>`
      + `<button class="btn-act cancelar" data-accion="cancelada" data-id="${id}">Cancelar</button>`
      + '</div>';
  }
  return '<span class="acciones-none">—</span>';
}
