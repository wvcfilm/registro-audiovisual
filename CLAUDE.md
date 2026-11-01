# Guía para continuar · App "Registro audiovisual"

Léeme completo antes de cambiar algo. Aquí está qué es la app, cómo está hecha, todas las reglas y decisiones tomadas con el dueño (Williams, administrador), qué bocetos se eligieron y qué falta.

Versión actual: **1.2** (31 oct 2026).

---

## 1. Qué es

App web instalable en el celular (PWA) para un equipo audiovisual de dos socios: **Williams (administrador)** y **su socio**. Registra quién hace cada tarea de cada video, si fue a tiempo, las llegadas a reuniones y rodajes, y calcula cuánto le toca a cada uno según su **acuerdo de colaboración firmado** (pago por etapa).

- Proyecto en curso: **PerteneSer · Noviembre**: S/ 1,000 por 16 videos, empieza el 9 nov 2026. El proyecto de octubre se liquida fuera de la app con la regla antigua 50/50 (acuerdo 3.2).
- Williams usa Android; su socio, iPhone. Entran con Google o con un enlace al correo.
- Se trabaja de a poco, **pantalla por pantalla**, con bocetos primero y luego la app.

## 2. Enlaces

| Qué | Dónde |
|---|---|
| App publicada | https://wvcfilm.github.io/registro-audiovisual/ |
| Código | GitHub `wvcfilm/registro-audiovisual` (rama `main`). GitHub Pages publica sola en 1–2 min tras cada push |
| Base de datos y cuentas | Supabase, proyecto `kiufbnqsnjimprfzcqob` (plan gratis; se pausa si pasa 7 días sin uso) |
| Bocetos (canvas de diseño) | https://claude.ai/artifact/X5LtzqC3sesmVdqUZ1NtJX |
| Acuerdo de colaboración (doc) | https://claude.ai/artifact/BZpAwPE5xFXXWD2kCpsfRV |

Seguridad: en `js/config.js` solo va la clave **publishable** (pública). Nunca pedir ni guardar la `service_role`/`secret`, el secreto de Google ni la contraseña de la base de datos.

## 3. Cómo está hecha

- **Sin dependencias** (el entorno no tiene npm): HTML + CSS + JavaScript puro con módulos ES. Rutas por hash (`#/videos`, `#/v/ID`, `#/e/ID`, `#/admin/...`). Eventos delegados con `data-act` (clics) y `data-form` (formularios).
- **Supabase por REST**, sin supabase-js: Auth (`/auth/v1/otp`, `/verify`, `/token?grant_type=refresh_token`, Google con `/authorize?provider=google`), datos con PostgREST (`/rest/v1/tabla`), Storage (bucket `evidencia`).
- **Seguridad en la base (RLS)**: funciones `is_partner`, `is_admin`, `my_member`. La hora de cada registro la pone el servidor (`now()`), no el celular. Triggers "guard" hacen cumplir las reglas aunque alguien manipule la app. Historial `log` solo de escritura por triggers (`log_change`), nadie lo edita ni borra.
- **Modo demo / modo práctica**: `DemoAPI` en `js/api.js` imita la API en `localStorage`. Si `localStorage['ra-practice']='1'`, la app usa la demo aunque haya servidor (se entra desde Administrador → Modo práctica). `js/demo.js` carga un proyecto de ejemplo.

### Archivos
- `js/rules.js`: **todas las reglas del acuerdo** (montos, plazos, puntualidad, racha, quién puede marcar qué). Funciones puras, con pruebas.
- `js/store.js`: estado y acciones (marcar, avisos, programar semana, propuestas, ajustes…).
- `js/api.js`: conexión a Supabase y DemoAPI.
- `js/app.js`: todas las pantallas (HTML en plantillas) y manejadores `ACT`/`FORM`. `VERSION` está arriba.
- `css/app.css`: estilos. Variables de color en `:root`; modo día en `[data-theme=light]`. Desde la 1.2 hay clases con el diseño de los bocetos (`.racha`, `.hero`, `.dsq`, `.trow`, `.tbtn`, `.vcard`, `.meta`, `.wallet`, `.agrp`, `.srow`…).
- `supabase/schema.sql`: todo el esquema, **idempotente** (se puede volver a pegar entero). Cada versión agrega una sección al final (v1.1, v1.2).
- `sw.js`: caché sin conexión (`CACHE = 'registro-v5'`).
- `tests/rules.test.js`: `node --test tests/*.test.js` (14 pruebas).

### Publicar una versión nueva
1. Cambiar el código. Subir `VERSION` en `js/app.js` y `CACHE` en `sw.js` (si no, los celulares siguen con la versión vieja).
2. Probar: `node --test tests/*.test.js` y la app en modo práctica (Playwright con `python3 -m http.server`, viewport 390×844).
3. Si cambió la base: agregar la sección al final de `supabase/schema.sql` y que Williams lo pegue **completo** en Supabase → SQL Editor → Run (si sale aviso de "operación destructiva", es normal: reemplaza reglas internas, no borra datos).
4. `git commit` y `git push` a `main`. Avisar a Williams que cierre y abra la app (en Equipo debe verse la versión).
5. Reiniciar datos de prueba (deja equipo e integrantes): `truncate corrections, tasks, hires, attendance, events, videos, projects, log restart identity;` (`delete from …` ya no sirve: lo bloquean los guards).

## 4. Reglas del acuerdo (así están programadas)

### Dinero
- Valor por video = presupuesto ÷ videos (S/ 1,000 ÷ 16 = **S/ 62.50**). Reparto por defecto: **preproducción 25 %** (guion 12.5 % = S/ 7.81, storyboard 12.5 % = S/ 7.81), **rodaje 35 %** (S/ 21.88), **montaje 16 %** (S/ 10), **video final/acabado 24 %** (S/ 15). Se guarda por proyecto (`projects.pct`); los nuevos toman el de los ajustes del equipo.
- Se paga a **quien hace la tarea**. La suma siempre cuadra exacto con el presupuesto (probado).
- **5.5 Apoyo en el acabado**: el socio recibe apoyo; su video final lo hace el administrador, pero **el pago es del socio si su montaje llegó a tiempo**.
- **5.7 Montaje no entregado**: si el montaje del dueño con apoyo no llega a su plazo, el video pasa al administrador (montaje + final, S/ 25).
- **Tardanza se paga** igual (solo resta racha).
- **Colaborador externo**: el proyecto cubre hasta **S/ 25 por video**; la diferencia la paga el socio que falló. El colaborador no ve el tope ni quién lo cubre. Sin racha para el colaborador.
- **Guillermo** (colaborador para la preproducción): lo contrata un socio para una reunión a la que no irá y el otro acepta. El que asiste hace esos guiones/storyboards "con Guillermo" y recibe **80 %**; el que contrató conserva 20 %. La asistencia del que contrató queda "no requerida" (ni falta ni racha).
- **Cierre**: el administrador envía la liquidación, el socio la confirma (o hace una observación), el administrador registra el pago (6.2, 3 días) y se cierra el proyecto.

### Plazos y orden (configurables en Administrador → Reglas, con aprobación del socio)
- **Guion y storyboard**: hasta el **día antes del rodaje a las 18:00**. **Desde la 1.2: vencido el plazo, el dueño ya NO puede marcarlo**; pasa a su compañero como "Tomar" (cobra él) y al dueño le resta 3 puntos. El dueño puede deshacer su preproducción hasta el plazo.
- **Rodaje**: se marca solo el día del rodaje, desde 15 min antes, con guion y storyboard hechos y la **llegada confirmada**.
- **Montaje**: 2 días antes de publicar a las 21:00 (si recibe apoyo); si no, junto con el final. Requiere rodaje.
- **Video final**: 1 día antes de publicar a las 21:00. Requiere montaje.
- **Deshacer** otras tareas: 10 min. El administrador siempre puede deshacer.
- Valores por defecto en `R.DEFAULT_RULES` (`open 15, punt 10, tol 45, pre 1080 (=18:00), mon 2, fin 1, undo 10, avr 1080, avm 24`) y en SQL con `rule_int(team, clave, defecto)` leyendo `teams.settings.rules`.

### Asistencia (7.7–7.10)
- Llegada se marca desde 15 min antes. **Puntual ≤ 10 min**, **tardanza ≤ 45 min** (se paga), después es inasistencia.
- **El socio marca "Llegué" y el administrador confirma** ("Sí, llegó a las HH:MM" o "Llegó ahora"). La llegada del administrador vale sola. Si el administrador no asiste, la del socio vale sola. Sin foto (en celulares daba "memoria insuficiente").
- **Aviso de que no irá**: rodaje a tiempo **hasta las 18:00 del día anterior**; reunión con **24 h**. A tiempo: no resta racha; el otro elige **reprogramar el día completo** o **grabar solo sus propios videos** (los del que canceló no los toma sin su permiso). Fuera de plazo: el otro elige reprogramar o **tomar el día completo** (cobra esos rodajes) y resta 3. Fuerza mayor (7.4/7.9): hasta 24 h después; el otro la acepta y no cuenta como falta.

### Semana y reuniones
- **Programar semana**: primero el **rodaje**, luego **una reunión por rodaje** (antes del plazo de preproducción). El reparto de videos (2 y 2 por defecto) se hace en la reunión; cada video puede tener **tema** (nombre).
- **Finalizar reunión**: el administrador la finaliza; el socio puede pedirlo y el administrador confirma (vale la hora del pedido); si el administrador no está, el socio la finaliza; se cierra sola a las 6 h. Otra reunión para el mismo rodaje solo después de finalizar la primera.
- Borrar solo lo vacío (reunión o proyecto sin datos); lo demás se **cancela** (solo administrador) o se **archiva** (proyecto). Cambiar hora solo si nadie marcó llegada.

### Racha (motivación; nunca cambia el pago)
- +1 entrega propia a tiempo o llegada puntual · **+1 punto de reunión** por video si guion y storyboard se terminan durante la reunión · −1 tardanza · −3 entrega tarde, video tomado o cancelación tardía · −5 inasistencia sin aviso · mínimo 0.
- Niveles: **Cumplidor 1**, **Constante 5**, **Responsable 10**, **Imparable 20**. Se llama "puntos", no "bono".
- El "aporte real" y la racha de cada uno son privados.

### Ajustes y propuestas (1.2)
- `teams.settings` (jsonb): `rules`, `pct`, `look` (color principal y colores de urgencia), `reminders`.
- **Con aprobación del socio** (tabla `proposals`): reglas de registro y porcentajes. El administrador propone; el socio aprueba o rechaza desde su Inicio; queda en el historial. Porcentajes nuevos rigen desde el **próximo proyecto**.
- **Libres** (solo administrador, RPC `save_settings`): apariencia y recordatorios.
- **Día/noche**: botón sol/luna arriba, por celular (`localStorage['ra-theme']`).

## 5. Pantallas de la app (1.2) y su boceto

| Pantalla | Estado en la app | Boceto elegido |
|---|---|---|
| Inicio | Hecha con el diseño | **Inicio 1.2 · Opción K** (`InicioK.dc.html`), con botón día/noche de la **Opción L** (`InicioL` / `InicioLDia`) |
| Etapas (lista) | Hecha con el diseño | **Etapas 1.2 · Opción F** (`EtapasF.dc.html`) |
| Detalle del video | Hecha con el diseño | **Etapas 1.2 · Detalle del video** (`EtapaVideoA.dc.html`) |
| Administrador | Hecho con el diseño | **Admin 1.2 Opción F** (`AdminF.dc.html`, con Modo práctica) + `AdminAparienciaA`, `AdminReglasC`, `AdminRecordatoriosA`, `AdminPorcentajesA`, `AdminPracticaA` |
| Resumen | Hecho (1.1); Williams lo aprobó | **Resumen · Opción O** (`ResumenO.dc.html`) |
| Historial | Hecho; aprobado | `HistorialA.dc.html` |
| Cierre / liquidación | Funciona, diseño antiguo | `CierreA.dc.html` (y `CierreB` para editor externo con tope S/ 25) |
| Reunión / rodaje por dentro | Funciona, diseño antiguo | `ProduccionC.dc.html` (elegida), `AvisoA.dc.html`, `GuillermoA.dc.html` |
| Equipo / integrantes | Funciona, diseño antiguo | `IntegranteA.dc.html`, `AccesoA.dc.html` |
| Entrar / invitación | Funciona | `AccesoA.dc.html` |
| Notificaciones | **No hay aún** | `NotifSocioE.dc.html` (elegida), `NotifReunion`, `NotifColabA` |
| Colaborador externo | **No hay aún** | `EncargoA`, `AccesoB`, `NotifColabA`, `ColaboradorA` |

Decisiones de diseño que hay que respetar:
- La app debe verse **igual que los bocetos** (colores, tarjetas, íconos, animaciones), no solo tener su estructura.
- Íconos por etapa en todo: **lápiz** preproducción, **cámara** rodaje, **tijera** posproducción, **estrella** video final/entregados.
- Urgencia: **rojo urgente** (hoy o vencido), **naranja próximo** (1–2 días), **gris "con tiempo"** (nunca "margen").
- En "Te toca": ícono a la izquierda, botón **"Hecho"** o **"Tomar"** a la derecha, **sin montos** en las filas; el dinero aparece solo animado ("+ S/ …") al marcar, y "Deshacer" lo resta.
- Arriba de "Te toca" va un **aviso urgente** (Llegué / confirmar llegada / tarea por vencer). Debajo, **cuadrados por día** (HOY, DOM, LUN…) coloreados por urgencia.
- Al final de Inicio: **Meta del equipo** (porcentaje + guiones, rodaje, montaje, entregados) y **"En la billetera"** (no "tu pago").
- La racha es grande y protagonista.
- En Etapas no se repite el nombre del dueño: basta su **insignia** (W / S). Se ve el **nombre del video** y la **fecha límite**, y se nota que la fila se puede tocar.
- Clientes y proyectos se crean desde el **selector "PerteneSer · Noviembre"** de arriba, no desde Administrador.
- Al iterar bocetos: **nunca reemplazar** una opción; cada cambio es una opción nueva (A, B, C…) y se marca "ELEGIDA" en el título del artboard.

## 6. Cómo trabajar con los bocetos

El canvas está en la cuenta de Williams (enlace arriba). Para leerlo o editarlo en un chat nuevo: herramientas de artifacts (`list_files`, `read_file` con el slug `f38d6583-4692-4a31-97d7-e7942a00682c`). Cada pantalla es un archivo `project/<Nombre>.dc.html` y el índice es `project/canvas.json` (posiciones y títulos). Leer `SKILL.md` del canvas antes de editar. Las secciones nuevas de la 1.2 están abajo del canvas ("Inicio · versión 1.2", "Etapas · versión 1.2", "Administrador · versión 1.2").

## 7. Pendiente

1. **Notificaciones al celular** (la pantalla de Recordatorios ya guarda la configuración en `teams.settings.reminders`): Web Push con claves VAPID + Supabase Edge Function + tarea programada; en iPhone requiere la app instalada en la pantalla de inicio. Diseño elegido: `NotifSocioE`.
2. **Rediseñar con el estilo de los bocetos**: reunión/rodaje por dentro (`ProduccionC`, `AvisoA`), Cierre (`CierreA`), Equipo/integrantes, Entrar.
3. **Flujo del colaborador externo** (encargo, revisiones en checklist, Drive, "servicio finalizado", tope S/ 25): bocetos `EncargoA`, `AccesoB`, `NotifColabA`.
4. **Acuerdo**: agregar la regla de la 1.2 (preproducción vencida pasa al compañero; el dueño ya no la puede marcar).
5. **Pregunta abierta para Williams**: si la preproducción vence y nadie la toma antes del rodaje, el video no se puede grabar. ¿Se deja así o la app debe avisar?
6. Mejoras menores: el ícono de "Equipo" (personas) abre la pantalla antigua; textos del modo práctica.

## 8. Historial de versiones

- **1.0**: primera versión real: equipo e invitaciones, proyectos, reparto, marcar tareas, avisos, Guillermo, resumen, cierre, historial con correcciones, Google y correo.
- **1.1**: orden de marcado y ventanas (también en la base), llegada confirmada por el administrador, avisos de rodaje hasta las 18:00, programar semana (rodaje → reunión → reparto), finalizar reunión y puntos de reunión, pestaña Etapas, borrar/cancelar/archivar, modo práctica, Resumen como boceto O.
- **1.2**: diseño de los bocetos en Inicio (K), Etapas (F) y detalle del video; Administrador (apariencia, reglas y porcentajes con propuesta, recordatorios, modo práctica); botón día/noche; tema de cada video; la preproducción vencida pasa al compañero.
