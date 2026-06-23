# Tayanti · Panel de Reservas

Dashboard web del sistema de reservas de Tayanti Restaurante.

- **Frontend:** HTML + CSS + JS modular (ES Modules, sin build), gráficos con Chart.js.
- **Datos:** Supabase (lectura de vistas `v_reservas`, `v_reservas_por_dia`).
- **Seguridad:** login con Supabase Auth + RLS. Solo la *publishable key* (pública) está en el cliente; los secretos viven en el servidor (n8n). El nombre del cliente se escapa antes de pintarse (anti-XSS).
- **Tiempo real:** refresco automático (20s) + suscripción a cambios de Supabase.

## Estructura

```
dashboard/
├── index.html          # Solo markup
├── css/
│   └── styles.css       # Estilos y tokens de diseño
└── js/
    ├── config.js        # URL/llave pública, constantes, catálogo de estados
    ├── supabase.js      # Cliente único de Supabase
    ├── ui.js            # $(), escapeHtml, toast, modal, animarNumero
    ├── data.js          # Consultas a las vistas y update de estado
    ├── render.js        # KPIs, gráficos y tabla
    ├── auth.js          # Login / logout / sesión
    ├── actions.js       # Confirmar / completar / cancelar
    ├── realtime.js      # Refresco periódico + Realtime
    └── app.js           # Punto de entrada (orquesta todo)
```

## Reglas de negocio

- **Reservas hoy / Comensales hoy** cuentan solo reservas *activas*
  (`pendiente`, `confirmada`, `completada`). Las `cancelada` y `no_show`
  no ocupan mesa, por eso no suman. Ver `js/config.js → ESTADOS_ACTIVOS`.

## Despliegue (Coolify)

Coolify detecta el `Dockerfile` (nginx) y sirve `index.html` + `css/` + `js/`.
Cada push a `main` redespliega.
