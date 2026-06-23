# Tayanti · Panel de Reservas

Dashboard web del sistema de reservas de Tayanti Restaurante.

- **Frontend:** HTML + CSS + JS (sin build), gráficos con Chart.js.
- **Datos:** Supabase (lectura de vistas `v_reservas`, `v_reservas_por_dia`).
- **Seguridad:** login con Supabase Auth + RLS. Solo la *publishable key* (pública) está en el cliente; los secretos viven en el servidor (n8n).
- **Tiempo real:** refresco automático + suscripción a cambios de Supabase.

## Despliegue (Coolify)

Coolify detecta el `Dockerfile` (nginx) y sirve `index.html`. Cada push a `main` redespliega.
