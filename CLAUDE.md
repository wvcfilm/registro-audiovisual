# Guía para continuar · App "Registro audiovisual"

Léeme completo antes de cambiar algo. Aquí está qué es la app, cómo está hecha, todas las reglas y decisiones tomadas con el dueño (Williams, administrador), qué bocetos se eligieron y qué falta.

Versión actual: **1.6** (3 nov 2026, rama `v1.6`, publicada en `main`; incluye la 1.5). Detalle en los docs del proyecto de Claude: `claude/mejoras-1.6.md` (**todo lo de la 1.6**, con bocetos elegidos), `claude/reglas-1.5.md` (**reglas y decisiones de la 1.5**: líder, socio con o sin apoyo, horario pareja, invitación en un paso), `claude/observaciones-1.3.md`, `claude/version-1.3.md`, `claude/entregas-al-limite.md` (1.4) y `claude/integrantes-colaborador-1.4.md`.

### Lo nuevo de la 1.6 (resumen; detalle en `claude/mejoras-1.6.md`)
- **Fechas de la semana** (`R.checkWeek`, `R.dayStatus`, `R.eventProblem` en `rules.js`; en SQL `meeting_problem`, `rodaje_problem` y la constraint trigger diferida `events_dates`): rodaje desde el día siguiente a "Empieza"; ninguna reunión antes de "Empieza"; reunión al menos 1 día antes y antes de las 18:00 del día anterior (`pre`); con 1 día, alerta roja **"Con un solo día, la preproducción se puede entregar, pero no con la calidad que merece."** (`R.MSG_ONE_DAY`); no hay 2 rodajes el mismo día ni reunión en día de rodaje (por proyecto).
- **Una reunión para varios rodajes**: `events.rodaje_ids` (`rodaje_id` = el primero; `R.meetRods` / `R.meetHas`, `st.meetingsOf`). La reunión vale contra el plazo del **primer** rodaje; cada tanda conserva su plazo. Puntos de reunión y Guillermo cubren todas las tandas (usan `meeting.video_ids`, la unión).
- **RPC nuevas** (todo o nada): `plan_week(p, rods[{at, videos}], meets[{at, rods: índice o id}])` (Programar semana, Otra reunión, Programar rodaje), `move_event(e, new_at, m, m_at)` (mover rodaje y su reunión juntos), `reprogram_day(e, new_at, nota)`, `correct_record(l, tipo, args, motivo, req)`. Trigger `guard_project`: la fecha de inicio la cambia solo el líder y nada puede quedar antes.
- **Selector de hora propio** (ruedas, 24 h, de 5 en 5, `HoraB`) y **calendario del mes** (`CalendarioA`) en `js/pickers.js`; reemplazan todos los `input type=date/time`. En `app.js`: `fDate` / `fTime` (campo + registro `ui.pk`), `pickField`, `ui.fv` + `syncPicked()` conservan lo elegido en hojas si la pantalla se redibuja. Hoja de fecha con reglas: `openDt` / `dtSheet` / `dtCheck`.
- **Programar semana** (`SemanaDobleA`, estado en `ui.wk`): "+ Agregar otro día de rodaje", "Una para todos" / "Una por rodaje", prellenado con el inicio (o hoy), alerta en vivo, "Prepararlos juntos". **Reparto por tandas** (`RepartoDobleA`, `repartoView`, `ui.rep`): −/+ de 1 a 6 por rodaje, dueño alternado (jue W, W, S · vie S, S, W), tocar para cambiar, publicación con calendario, resumen de paridad.
- **Inicio**: lo del aviso grande también va en su día (minimizado, "Arriba"); reunión y rodaje se quedan hasta terminar (`eventDone`); punto en vivo `liveOf`/`livePill` (EN 45 MIN desde 2 h antes · EN CURSO / RODANDO · TARDE · N MIN en rojo toda la fila y el aviso); se quitó el aviso "Entrar a la reunión" después de llegar.
- **Etapas** (`EtapasR`): pill en vivo en las tarjetas (rojo si vas tarde, botón incluido); abajo `◀ Ver otras semanas ▶` (`weekNav` / `otherWeek`, `ui.wkOff`); todos los rodajes de la semana. **Rodaje por dentro** (`ProduccionJ`): indicador REC (`.recp`).
- **Historial C**: tocar un registro abre la hoja (de qué se trata, "Lo que tocaste", rastro); el líder **corrige** (desmarcar · quién lo hizo · a qué video · hora · llegada · quitar confirmación · reabrir reunión) con motivo y efecto calculado (`corrEffect` simula dinero y puntos); el socio **pide** la corrección. Nada se borra: el original queda tachado "Corregido", la corrección es un registro `correction` y lo que cambió lleva `data.fix`. Liquidación enviada → se reabre; pagada → no se corrige. Al socio le sale en Inicio con "Hacer una observación" (`correction.obs`).
- **Apariencia → Tus actividades**: color de fondo, borde y opacidad del aviso urgente (por defecto el color de la urgencia; `heroOwn`) y del cuadro de días (`actBg`, `actBd`, `heroBg`, `heroBd` en `look.dark/light`).

### Lo nuevo de la 1.5 (resumen; detalle en `claude/reglas-1.5.md`)
- **Etiquetas**: Williams aparece como **"Socio"**; "Líder de proyecto" solo en Integrantes/Equipo. Los mensajes dicen su nombre (`LN()` en `app.js`), nunca "el administrador" (eso solo en su sección Administrador). En SQL y DemoAPI los errores dicen "el líder".
- **Socio con apoyo / sin apoyo** (`members.apoyo`): se elige al invitar y se cambia con el **interruptor de Integrantes (Opción D)**: el líder propone (`proposals.kind = 'apoyo'`, `data {member, apoyo}`), el socio acepta o rechaza desde su Inicio. Rige para videos aún no grabados (`videos.apoyo_fixed`, se fija al marcar el rodaje).
- **Modos de edición** (`R.modeOf`): `apoyo` (reglas 1.4) · `pareja` (hay algún socio sin apoyo: el socio y el líder) · `lider` (todos con apoyo: el líder entrega hasta 23:59) · `colab`. **Pareja** (día antes de publicar): montaje 12:00 (`pmon`, solo aviso) · final 18:00 (`pfin`; el del socio se revisa, el del líder no) · revisión 19:00 (`prev`, luego se aprueba sola) · corregir 21:00 (`pfix`, si no, pasa al líder) · desde 18:00 el otro (líder o socio sin apoyo) **toma directo** hasta 23:59; el dueño aún entrega tarde (−3) mientras no lo tomen · después de 23:59 "Reprogramar entrega". El socio con apoyo nunca toma ediciones. Dinero de la edición (montaje + final) solo a quien entrega el final, al entregar/aprobar. Puntos −3 dueño / +3 quien toma / −4 tomar y no entregar. SQL: `video_mode`, `pair_dues`, `review_limit`, `post_phase` (fases `p_mon`, `p_fin`, `p_tomar`…), `pass_to`, `leader_away`. Horas editables en Administrador → Entregas al límite ("Socios sin apoyo").
- **Guillermo**: 80/20 solo si contrata un socio con apoyo; cualquier otro (el líder incluido) cede el 100 % (`R.hirePct`). **Storyboard que nadie hizo**: con apoyo 50/50; sin apoyo se reparte entre todos los socios.
- **Llegadas**: la del líder vale sola y confirma las demás; si el líder no llegó o canceló, la del socio vale sola (`R.leaderAway` / `leader_away()`).
- **Invitación en un paso (InvitacionA)**: el enlace `#/i/CÓDIGO` muestra la tarjeta pública ("Williams te invita", rol, reglas con "Ver todas", casilla "Leí las reglas…", nombre editable) y **Aceptar con Google / con mi correo**. El código se guarda en `localStorage['ra-invite']` antes de salir a Google o al correo y se acepta solo al volver (`tryPendingInvite` en `store.js`), luego "¡Listo! Ya estás en el equipo" y el historial dice "X aceptó las reglas del acuerdo". Nunca muestra "Crear tu equipo" a un invitado. Cuenta que ya es del equipo → "Cambiar de cuenta" (la invitación sigue guardada). Sesión vencida → vuelve a Entrar (ya no "sin sesión"). `invite_info` devuelve también `rules` y `pct`.
- **Diseño**: Inicio **P** ("Tus actividades": aviso urgente en su tarjeta; días cuadrados, leyenda y tareas en un mismo fondo `.actbox`) · Posproducción **Edición B** (cada uno ve sus videos y los que debe atender; tarjetas minimizadas que se abren al tocar) · Integrantes **D** · **Opacidad** en Apariencia (`opRacha`, `opHero`, `opAct`, `opMeta`, `opWallet`, `opCards` → variables `--op-*`).
- **Celular**: sin zoom (viewport + bloqueo de gestos de Safari + letra ≥ 16 px en campos de iPhone); auditado sin desborde a 390 y 360 px en todas las rutas, noche y día.
- **Modo práctica**: dos ejemplos ("socio con apoyo" y "socio sin apoyo", `seedDemo('con'|'sin')`) y **reloj de práctica** en la barra (−1 h / +1 h / +6 h / +1 día / Ahora; `localStorage['ra-clock']`) para ver cómo cambian los plazos. La invitación también se prueba: crea la invitación, cierra sesión, abre el enlace y "Aceptar (práctica)".

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
| Bocetos 1.3 (canvas activo) | https://claude.ai/artifact/DbXfffsgtv8LXrddzo5MST (slug `65ffd9e2-0a3c-4bbc-a65a-56e6536eaab4`) |
| Bocetos hasta 1.2 (solo lectura) | https://claude.ai/artifact/X5LtzqC3sesmVdqUZ1NtJX |
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
- `supabase/schema.sql`: todo el esquema, **idempotente** (se puede volver a pegar entero). Cada versión agrega una sección al final (v1.1, v1.2, v1.3).
- `js/pickers.js` (1.6): calendario del mes y ruedas de hora.
- `sw.js`: caché sin conexión (`CACHE = 'registro-v10'`).
- `tests/rules.test.js`, `tests/v13.test.js`, `tests/v14.test.js`, `tests/v15.test.js` y `tests/v16.test.js` (la 1.6 simula la app de práctica en Node: semana doble, reparto 3 y 3, dinero exacto, mover, corregir): `node --test tests/*.test.js` (43 pruebas).

### Publicar una versión nueva
1. Cambiar el código. Subir `VERSION` en `js/app.js` y `CACHE` en `sw.js` (si no, los celulares siguen con la versión vieja).
2. Probar: `node --test tests/*.test.js` y la app en modo práctica (Playwright con `python3 -m http.server`, viewport 390×844).
3. Si cambió la base: agregar la sección al final de `supabase/schema.sql` y que Williams lo pegue **completo** en Supabase → SQL Editor → Run (si sale aviso de "operación destructiva", es normal: reemplaza reglas internas, no borra datos).
4. `git commit` y `git push` a `main`. Avisar a Williams que cierre y abra la app (en Equipo debe verse la versión).
5. Reiniciar datos de prueba (deja equipo e integrantes): `truncate corrections, claims, job_items, jobs, tasks, hires, attendance, events, videos, projects, log restart identity;` (`delete from …` ya no sirve: lo bloquean los guards).

## 4. Reglas del acuerdo (así están programadas)

### Dinero
- Valor por video = presupuesto ÷ videos (S/ 1,000 ÷ 16 = **S/ 62.50**). Reparto por defecto: **preproducción 25 %** (guion 12.5 % = S/ 7.81, storyboard 12.5 % = S/ 7.81), **rodaje 35 %** (S/ 21.88), **montaje 16 %** (S/ 10), **video final/acabado 24 %** (S/ 15). Se guarda por proyecto (`projects.pct`); los nuevos toman el de los ajustes del equipo.
- Se paga a **quien hace la tarea**. La suma siempre cuadra exacto con el presupuesto (probado).
- **Entregas al límite (1.4, reemplaza 5.5 y 5.7)** para quien recibe apoyo (`members.apoyo`). Ejemplo: publica sáb.
  - **Con apoyo hasta jue 21:00** (`mon` 2 días + `monh` 21:00; por cliente en `rules.cli`; por video `videos.apoyo_due` si se adelantó por un choque): el socio toca "Montaje" (sin enlaces), queda **"S/ 25 en espera"** (sin animación de dinero); el administrador hace el final y ahí el socio cobra montaje + final con animación, **+1** de racha.
  - **Por su cuenta jue 21:00 → vie 08:00** (`self`): entrega el video completo; queda **por revisar** (`tasks.review = 'pendiente'`). El administrador **Aprueba** o **Pide cambios** (doble confirmación, motivo obligatorio). Aprobado: cobra S/ 25 y **0 puntos**. Sin revisar a las 23:59: se aprueba sola.
  - **Pedir cambios**: corrige hasta las **17:00** (`fix`, una sola vez, RPC `redeliver`). Si no corrige, o se rechaza la corrección, o se rechaza después de las 17:00 → pasa al administrador.
  - **En riesgo vie 08:00 → 12:00** (`auto`): si no entregó completo, el administrador puede **"Tomar el video"** (claim `montaje`); el socio aún puede entregar mientras nadie lo tome. **A las 12:00 pasa solo** al administrador.
  - **Pasó al administrador**: lo que marcó el socio queda anulado (`tasks.void`, gris con candado), mensaje azul "Equipo que cumple: … editará este video y el cliente lo recibe a tiempo". Socio **−3**; administrador **+3** al entregarlo; **−4** si lo tomó y no lo entregó.
  - Videos propios del administrador, de apoyo y tomados: hasta el **día antes de publicar a las 23:59**.
  - Fases (igual en `postState` de `rules.js` y `post_phase()` en SQL): normal · abierto · apoyo · solo · riesgo · revision · cambios · aprobado · pasado. Plazos: `post_dues()`.
  - **Aviso de choque** (Opción B) al programar la semana o repartir: si el último día del apoyo cae en un rodaje o reunión → "Adelantar el montaje de {socio}" / "Publicar un día después" / "Seguir igual"; si entre rodaje y publicación hay menos de días de apoyo + 1 → "Publicar el …" / "Seguir igual (sin apoyo)".
- **Entrega vencida (1.4): nunca se bloquea.** Pasado el plazo del video final, la tarjeta se pone roja: quien lo tiene a cargo (`videoState().inCharge`) puede **"Entregar igual"** (cuenta como tarde) y el **administrador** puede **"Reprogramar entrega"** (RPC `reprogram_delivery`: nueva fecha de publicación desde mañana, nota opcional; mueve los plazos y queda en `videos.reprog`). Reprogramar sirve para **cualquier video sin entregar**, vencido o no; solo lo hace el administrador (lo coordina por fuera con el cliente). Puntos: reprogramar una entrega vencida que estaba a su cargo **−3** (en vez del −4); entregar tarde **−3**; no entregar a tiempo **−3**; si la tenía tomada y la reprograma, no se suma el −4. Si el video ya había pasado al administrador, se queda con él (`videos.handoff`).
- **Tardanza se paga** igual (solo resta racha).
- **Colaborador externo (editor, 1.4)**: tablas `jobs` (encargo) y `job_items` (avance por video). El **administrador arma el encargo** (`#/encargo/nuevo`: editor nuevo o existente, videos sin montaje, monto por video, Drive) → **el otro socio lo aprueba** (`propuesto → invitado`) → el editor entra con su enlace y **acepta las condiciones** (`job_accept` → `activo`) → por video: **Entregué el montaje** → revisión 1 (los socios envían observaciones, una por línea, o aprueban) → ajustes en **checklist** → **Entregué el video final** → revisión 2 → últimos ajustes → **subir a Drive** (`{Cliente}_Video{n}_FINAL.mp4`) → **Servicio finalizado** (`job_finish`) → un socio **confirma y registra el pago** (`cerrado`). Todo por RPC `job_step` / `job_undo` (10 min). El proyecto cubre hasta **montaje + final por video** (S/ 25); el **excedente** lo paga el dueño del video, **a medias** o **por definir** (`jobs.payer` = owner / half / tbd; "por definir" sale aparte en el Cierre). El editor **no ve** el tope ni quién cubre (`colab_home` está saneada), no ve las tablas del equipo, no tiene racha y solo ve su vista "Mis videos". Mientras el video está en un encargo, ningún socio puede marcar su montaje/final (`post_phase = 'colab'`).
- **Integrantes (1.4, Opción C)** en Administrador → Integrantes (`#/admin/integrantes`): grupos Socios y Colaboradores (+ Guillermo, su WhatsApp va en `teams.settings.guillermo`), nombre con lápiz, chip de rol, WhatsApp +51 con ✓ y "Probar chat", invitaciones pendientes (WhatsApp / Copiar / Enlace nuevo `renew_invite` / Cancelar), "Invitar integrante" eligiendo rol (Socio → enlace; Colaborador → arma el encargo) y **Guardar** ("Integrantes guardados · queda en el historial"). La invitación usa `md5(gen_random_uuid())` (ya no `gen_random_bytes`, que en Supabase vive en el esquema `extensions`). Equipo (engranaje) ya no repite la lista: el socio ve solo su ficha.
- **Guillermo** (colaborador para la preproducción): lo contrata un socio para una reunión a la que no irá y el otro acepta. El que asiste hace esos guiones/storyboards "con Guillermo" y recibe **80 %**; el que contrató conserva 20 %. La asistencia del que contrató queda "no requerida" (ni falta ni racha).
- **Cierre**: el administrador envía la liquidación, el socio la confirma (o hace una observación), el administrador registra el pago (6.2, 3 días) y se cierra el proyecto.

### Plazos y orden (configurables en Administrador → Reglas, con aprobación del socio)
- **Guion y storyboard**: hasta el **día antes del rodaje a las 18:00**. **Desde la 1.2: vencido el plazo, el dueño ya NO puede marcarlo**; pasa a su compañero como "Tomar" (cobra él) y al dueño le resta 3 puntos. El dueño puede deshacer su preproducción hasta el plazo.
- **Rodaje**: se marca solo el día del rodaje, desde 15 min antes, con guion y storyboard hechos y la **llegada confirmada**.
- **Montaje**: con apoyo, ver "Entregas al límite"; si no, junto con el final. Requiere rodaje.
- **Video final**: 1 día antes de publicar a las **23:59** (1.4). Requiere montaje.
- **Deshacer (1.4)**: todo se puede deshacer **10 min, y nunca después del plazo de esa acción** (`undo_limit()` / `R.undoUntil`): tareas, Tomar, entrega y corrección, aprobar / pedir cambios (`review_undo`), llegada y su confirmación, finalizar reunión, cancelar, respuesta a un aviso. El administrador puede desmarcar tareas siempre (corrección, queda en el historial). Guion y storyboard: hasta su plazo. En la app: "Deshacer" en la barra de abajo 8 s y en la tarjeta los 10 min.
- Valores por defecto en `R.DEFAULT_RULES` (`open 15, punt 10, tol 45, pre 1080 (=18:00), mon 2, fin 1, undo 10, avr 1080, take 5, conf 12, madr 300`, 1.4: `monh 1260, self 480, auto 720, fix 1020, cli {}`; `avm` ya no se usa) y en SQL con `rule_int(team, clave, defecto)` leyendo `teams.settings.rules`.

### 1.3 · Tomar, confirmar asistencia y reparto del storyboard
- **Tomar = comprometerse**: pasado el plazo del dueño, el otro socio "toma" (tabla `claims`, no paga) y luego marca "Hecho" (ahí cobra). Guion y storyboard: hasta **5 h antes del rodaje** (`take`). Montaje que pasó al administrador (5.7): hasta el plazo del video final. Entregar lo tomado **+3**; tomarlo y no entregarlo **−4**. Si el video se reprograma, el compromiso anterior ya no cuenta. Deshacer un "Tomar": 10 min y sin entregar. Al dueño le sale "Equipo que cumple: {nombre} hará el … y el rodaje sigue en pie".
- **Sin guion no se graba**: botón "Reprogramar" (RPC `move_video`: pasa el video a otro rodaje; se reabre el plazo del dueño). **Sin storyboard sí se graba**: la base crea el storyboard "repartido" (`tasks.split`, `split_with`) y su valor va mitad y mitad (el centavo extra al dueño); queda cerrado. Al dueño −3.
- **Confirmar asistencia** (`attendance.rsvp = 'voy'`; "no iré" es el aviso; "Guillermo" es la contratación): reunión hasta **12 h antes** (`conf`); si cae de **madrugada (00:00–04:59, `madr`)**, hasta las 23:59 del día anterior. Rodaje hasta las 18:00 del día anterior (`avr`). Ese mismo plazo vale para "avisar a tiempo". Sin responder: **−2** y botón de WhatsApp (puede ir igual). Solo cuenta desde el 2 nov 2026 (`V13_FROM`).
- **Tarjeta de racha** (ventana): al rescatar algo, y al terminar todo lo tuyo de la semana en preproducción o en posproducción.
- **WhatsApp** de cada integrante: `members.phone` (9 dígitos, empieza con 9), lo cambia el administrador o cada uno el suyo.
- **Apariencia C**: `teams.settings.look.dark` y `.light` (principal, urgencia, cuadros de etapas con opacidades, racha por nivel, meta y billetera).

### Asistencia (7.7–7.10)
- Llegada se marca desde 15 min antes. **Puntual ≤ 10 min**, **tardanza ≤ 45 min** (se paga), después es inasistencia.
- **El socio marca "Llegué" y el administrador confirma** ("Sí, llegó a las HH:MM" o "Llegó ahora"). La llegada del administrador vale sola. Si el administrador no asiste, la del socio vale sola. Sin foto (en celulares daba "memoria insuficiente").
- **Aviso de que no irá**: rodaje a tiempo **hasta las 18:00 del día anterior**; reunión con **12 h** (1.3; antes 24 h). A tiempo: no resta racha; el otro elige **reprogramar el día completo** o **grabar solo sus propios videos** (los del que canceló no los toma sin su permiso). Fuera de plazo: el otro elige reprogramar o **tomar el día completo** (cobra esos rodajes) y resta 3. Fuerza mayor (7.4/7.9): hasta 24 h después; el otro la acepta y no cuenta como falta.

### Semana y reuniones
- **Programar semana**: primero el **rodaje**, luego **una reunión por rodaje** (antes del plazo de preproducción). El reparto de videos (2 y 2 por defecto) se hace en la reunión; cada video puede tener **tema** (nombre).
- **Finalizar reunión**: el administrador la finaliza; el socio puede pedirlo y el administrador confirma (vale la hora del pedido); si el administrador no está, el socio la finaliza; se cierra sola a las 6 h. Otra reunión para el mismo rodaje solo después de finalizar la primera.
- Borrar solo lo vacío (reunión o proyecto sin datos); lo demás se **cancela** (solo administrador) o se **archiva** (proyecto). Cambiar hora solo si nadie marcó llegada.

### Racha (motivación; nunca cambia el pago)
- Niveles con colores 1.3 (sin rojo): ámbar, naranja, azul, violeta. +3 rescate · −4 tomar y no entregar · −2 no confirmar asistencia (1.3).
- +1 entrega propia a tiempo o llegada puntual · **+1 punto de reunión** por video si guion y storyboard se terminan durante la reunión · −1 tardanza · −3 entrega tarde, video tomado o cancelación tardía · −5 inasistencia sin aviso · mínimo 0.
- Niveles: **Cumplidor 1**, **Constante 5**, **Responsable 10**, **Imparable 20**. Se llama "puntos", no "bono".
- El "aporte real" y la racha de cada uno son privados.

### Ajustes y propuestas (1.2)
- `teams.settings` (jsonb): `rules`, `pct`, `look` (color principal y colores de urgencia), `reminders`.
- **Con aprobación del socio** (tabla `proposals`): reglas de registro y porcentajes. El administrador propone; el socio aprueba o rechaza desde su Inicio; queda en el historial. Porcentajes nuevos rigen desde el **próximo proyecto**.
- **Libres** (solo administrador, RPC `save_settings`): apariencia y recordatorios.
- **Día/noche**: botón sol/luna arriba, por celular (`localStorage['ra-theme']`).

## 5. Pantallas de la app y su boceto

**1.4** (canvas 1.3, fila "Entregas al límite"): Posproducción y detalle del video con **EntregaSocioA** (línea de tiempo de plazos con marcador "ahora", cuadros Montaje / Video final, "S/ 25 en espera", Revisar entrega, Tomar el video) · Administrador → **Entregas al límite A** (`#/admin/entregas`) · aviso de choque **ChoqueB** (hoja al programar o repartir).

**1.3** (canvas 1.3): Inicio **M** (Te toca con botón directo: llegada → Entrar/Abrir, Tomar → Hecho, tarea de hoy, confirmar Voy/No iré/Guillermo, no confirmaste, todo al día) · Etapas **N** (pre y rodaje) y **P** (posproducción) · reunión por dentro **F + reparto G** · rodaje por dentro **G/H** + Rodajes pasados (`#/rodajes`) · Apariencia **C** · Integrantes **C** (WhatsApp, en Equipo) · Detalle del video: la 1.2 con los botones nuevos (el rediseño B "más moderno" sigue pendiente).

Tabla de la 1.2:

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
| Equipo / integrantes | Hecho con el diseño (1.4) | **Integrantes C** (canvas 1.3) |
| Entrar / invitación | Funciona | `AccesoA.dc.html` |
| Notificaciones | **No hay aún** | `NotifSocioE.dc.html` (elegida), `NotifReunion`, `NotifColabA` |
| Colaborador externo | Hecho (1.4) | `EncargoA`, `AccesoB`, `ColaboradorA` (`NotifColabA` pendiente) |

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

0. **1.3 / 1.4**: detalle del video más moderno (boceto B pendiente de rediseño); actualizar el acuerdo firmado con las reglas de la 1.3 y la 1.4 (entregas al límite cambian el reparto de dinero); manual de la app. Textos de doble confirmación: se usaron Aprobar A (con "puedes deshacerlo en 10 minutos") y Pedir cambios B.
1. **Notificaciones al celular** (la pantalla de Recordatorios ya guarda la configuración en `teams.settings.reminders`): Web Push con claves VAPID + Supabase Edge Function + tarea programada; en iPhone requiere la app instalada en la pantalla de inicio. Diseño elegido: `NotifSocioE`.
2. **Rediseñar con el estilo de los bocetos**: reunión/rodaje por dentro (`ProduccionC`, `AvisoA`), Cierre (`CierreA`), Equipo/integrantes, Entrar.
3. Colaborador externo: hecho en la 1.4. Falta el aviso al celular (`NotifColabA`) y que el editor suba archivos desde la app (hoy marca y sube a Drive por fuera).
4. **Acuerdo**: agregar la regla de la 1.2 (preproducción vencida pasa al compañero; el dueño ya no la puede marcar).
5. **Pregunta abierta para Williams**: si la preproducción vence y nadie la toma antes del rodaje, el video no se puede grabar. ¿Se deja así o la app debe avisar?
6. Mejoras menores: el ícono de "Equipo" (personas) abre la pantalla antigua; textos del modo práctica.

## 8. Historial de versiones

- **1.0**: primera versión real: equipo e invitaciones, proyectos, reparto, marcar tareas, avisos, Guillermo, resumen, cierre, historial con correcciones, Google y correo.
- **1.1**: orden de marcado y ventanas (también en la base), llegada confirmada por el administrador, avisos de rodaje hasta las 18:00, programar semana (rodaje → reunión → reparto), finalizar reunión y puntos de reunión, pestaña Etapas, borrar/cancelar/archivar, modo práctica, Resumen como boceto O.
- **1.2**: diseño de los bocetos en Inicio (K), Etapas (F) y detalle del video; Administrador (apariencia, reglas y porcentajes con propuesta, recordatorios, modo práctica); botón día/noche; tema de cada video; la preproducción vencida pasa al compañero.
- **1.3**: Tomar = comprometerse (+3/−4, también el montaje 5.7), confirmar asistencia (12 h / 18:00, −2, WhatsApp), sin guion se reprograma y sin storyboard se reparte 50/50, Inicio M, Etapas N/P, reunión con reparto y entregables, rodaje por dentro nuevo, tarjeta de racha, Apariencia C con noche y día, WhatsApp de cada integrante, botones sin texto negro.
- **1.3.1**: arreglo del parpadeo: la pantalla ya no se vuelve a dibujar si nada cambió (cada toque la redibujaba 4 veces y al volver a la app 1 vez), y las animaciones de entrada de las tarjetas solo corren la primera vez que se abre una pantalla (`#app[data-settled]` en `render()`).
- **1.4** (además): Integrantes C completo (arreglo de la invitación y del desborde en el celular), colaborador editor con revisiones en checklist y Drive, entrega vencida nunca bloqueada con "Reprogramar entrega" (solo administrador, −3 si ya estaba vencida).
- **1.5**: Williams como Socio (líder solo en Integrantes), socio con o sin apoyo con interruptor y aceptación, horario pareja (12:00 / 18:00 / 19:00 / 21:00 / 23:59, tomar directo), Guillermo 80/20 solo con apoyo, storyboard entre todos sin apoyo, llegada del socio vale sola si el líder no está, invitación en un paso, Inicio P (Tus actividades), Edición B minimizable, Integrantes D, opacidades, reloj de práctica, sin zoom ni desborde.
- **1.6**: fechas de la semana con reglas (inicio, 1 día con alerta, sin 2 rodajes el mismo día), una reunión para varios rodajes, reparto por tandas (1–6 por rodaje), mover rodaje y reunión juntos, editar la fecha de inicio, calendario y hora propios, Inicio con punto en vivo y eventos hasta terminar, Etapas con otras semanas, rodaje con REC, Historial C con correcciones que se aplican, Apariencia de "Tus actividades".
- **1.4**: entregas al límite (apoyo hasta 2 días antes 21:00, entrega por su cuenta con revisión, pedir cambios hasta 17:00, en riesgo 08:00–12:00 con Tomar el video, pasa solo a las 12:00, −3/+3/−4), "S/ … en espera" en la billetera, Administrador → Entregas al límite (con propuesta y plazo por cliente), aviso de choque al programar o repartir, deshacer en 10 min en todas las decisiones, final a las 23:59. Bocetos: `EntregaSocioA`, `EntregasLimiteA`, `ChoqueB` (canvas 1.3, fila "Entregas al límite").
