# Registro audiovisual

App web (se instala en el celular) para registrar las tareas del equipo, sus plazos y lo que le corresponde a cada uno según el acuerdo de colaboración.

- Sin dependencias: HTML, CSS y JavaScript puro. Se publica tal cual en GitHub Pages.
- Datos y cuentas: Supabase (plan gratuito). Entrar con Google o con un código al correo.
- Si `js/config.js` está vacío, la app funciona en **modo demo** (todo en el navegador).

## Archivos
- `js/rules.js` — reglas del acuerdo: montos por tarea, apoyo (5.5), montaje no entregado (5.7), plazos, puntualidad y tolerancia (7.7), avisos (7.8–7.10), racha (6.4), tope de colaborador (14.2.1).
- `js/store.js` — operaciones del día a día.
- `js/api.js` — conexión a Supabase por REST y modo demo.
- `js/app.js` — pantallas.
- `supabase/schema.sql` — tablas, seguridad por equipo, historial que no se puede editar, hora puesta por el servidor.
- `tests/` — pruebas de las reglas: `node --test tests/*.test.js`.

## Poner en marcha
1. Supabase → SQL Editor → pegar `supabase/schema.sql` → Run.
2. Copiar la URL del proyecto y la clave `anon public` en `js/config.js`.
3. Subir la carpeta a un repositorio de GitHub y activar Pages (rama `main`, carpeta raíz).
4. En Supabase → Authentication → URL Configuration, poner la dirección de GitHub Pages como Site URL y en Redirect URLs.
5. (Google) Crear el ID de cliente OAuth en Google Cloud con la redirección `https://<proyecto>.supabase.co/auth/v1/callback` y activarlo en Authentication → Providers → Google.
