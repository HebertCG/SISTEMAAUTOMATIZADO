// Configuración del panel. La publishable key es PÚBLICA por diseño:
// el acceso real a los datos lo controla Supabase con RLS (solo staff
// autenticado lee/escribe). El service_role vive únicamente en n8n.
export const SUPABASE_URL = 'https://uzzwrfexstoyxfzaxdlb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_22PTWGC7kWEGvBdUjbM-Rw_Ep25qS5E';

// Cada cuánto se refresca el panel automáticamente (ms).
export const REFRESH_MS = 20000;

// Cuántas reservas próximas mostrar en la tabla.
export const MAX_FILAS_TABLA = 40;

// Catálogo de estados de una reserva (etiqueta visible + color).
export const ESTADOS = {
  pendiente:  { label: 'Pendiente',  color: '#B07D17' },
  confirmada: { label: 'Confirmada', color: '#1D8B68' },
  cancelada:  { label: 'Cancelada',  color: '#C0563D' },
  completada: { label: 'Completada', color: '#9C6F28' },
  no_show:    { label: 'No asistió', color: '#8A847A' },
};

// Estados que cuentan como una reserva "real" del día.
// `cancelada` y `no_show` NO ocupan mesa, así que no suman en los KPIs de hoy.
export const ESTADOS_ACTIVOS = ['pendiente', 'confirmada', 'completada'];
