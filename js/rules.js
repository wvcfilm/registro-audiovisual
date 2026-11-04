// Reglas del acuerdo de colaboración, en un solo lugar.
// Todo cálculo de dinero, plazos, puntualidad y racha sale de aquí,
// para que la app de los dos socios muestre siempre lo mismo.

// ---------- Tiempo (Lima, UTC-5, sin horario de verano) ----------
export const TZ = '-05:00';

export function at(dateStr, hhmm) {
  return new Date(`${dateStr}T${hhmm}:00${TZ}`);
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00${TZ}`);
  d.setUTCDate(d.getUTCDate() + n);
  return limaDate(d);
}

export function limaDate(d) {
  const t = new Date(new Date(d).getTime() - 5 * 3600 * 1000);
  return t.toISOString().slice(0, 10);
}

export function limaTime(d) {
  const t = new Date(new Date(d).getTime() - 5 * 3600 * 1000);
  return t.toISOString().slice(11, 16);
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

export function fmtDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00${TZ}`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

export function fmtWhen(iso) {
  if (!iso) return '';
  return `${fmtDay(limaDate(iso))} · ${limaTime(iso)}`;
}

export function money(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return 'S/ ' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ---------- Valor de cada tarea (cláusula cuarta) ----------
export const DEFAULT_PCT = { pre: 25, rod: 35, mon: 16, aca: 24 };
// Reglas de registro del equipo (las ajusta el administrador con aprobación del socio).
// 1.3: take = horas antes del rodaje hasta las que se puede tomar la preproducción del compañero;
// conf = horas antes de la reunión para confirmar asistencia; madr = fin de la madrugada (minutos: 300 = 05:00).
// 1.4 · Entregas al límite (minutos del día): monh = hora del apoyo (21:00), self = entrega por su cuenta (08:00),
// auto = pasa solo al administrador (12:00), fix = corregir cambios (17:00). El video final y la revisión vencen a las 23:59.
// cli = días de apoyo propios de un cliente ({ "PerteneSer": 3 }).
export const DEFAULT_RULES = { open: 15, punt: 10, tol: 45, pre: 1080, mon: 2, fin: 1, undo: 10, avr: 1080, avm: 24, take: 5, conf: 12, madr: 300, monh: 1260, self: 480, auto: 720, fix: 1020, cli: {}, pmon: 720, pfin: 1080, prev: 1140, pfix: 1260 };
// 1.5 · Socios sin apoyo (y el líder si hay alguno): montaje 12:00 (solo aviso), video final 18:00, revisión 19:00,
// corrección 21:00; desde las 18:00 el otro lo toma directo hasta las 23:59.
// Puntos de racha nuevos (1.3).
export const PTS = { rescue: 3, claimFail: -4, noConfirm: -2, handoff: -3 };
export const RULES = Object.assign({}, DEFAULT_RULES);
export function setRules(r) { Object.assign(RULES, DEFAULT_RULES, r || {}); if (!RULES.cli || typeof RULES.cli !== 'object') RULES.cli = {}; }
export const hm = (mins) => String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
export const KINDS = ['guion', 'storyboard', 'rodaje', 'montaje', 'acabado'];
export const KIND_LABEL = { guion: 'Guion', storyboard: 'Storyboard', rodaje: 'Rodaje', montaje: 'Montaje', acabado: 'Video final' };
export const STAGE_OF = { guion: 'pre', storyboard: 'pre', rodaje: 'prod', montaje: 'post', acabado: 'post' };

export function rates(project) {
  const pct = Object.assign({}, DEFAULT_PCT, project.pct || {});
  const perVideo = Number(project.budget) / Number(project.videos_total);
  return {
    perVideo,
    guion: perVideo * pct.pre / 200,
    storyboard: perVideo * pct.pre / 200,
    rodaje: perVideo * pct.rod / 100,
    montaje: perVideo * pct.mon / 100,
    acabado: perVideo * pct.aca / 100
  };
}

// ---------- Plazos (5.6 y encargos a colaboradores) ----------
// member.apoyo = true → su acabado lo hace la otra parte (5.5), así que su montaje vence 2 días antes.
const active = (e) => !e.status || e.status === 'activo';
export function rodajeOf(video, ctx) {
  return (ctx.events || []).filter((e) => e.kind === 'rodaje' && active(e) && (e.video_ids || []).indexOf(video.id) !== -1)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0] || null;
}
export function meetingOf(video, ctx) {
  return (ctx.events || []).filter((e) => e.kind === 'reunion' && active(e) && (e.video_ids || []).indexOf(video.id) !== -1)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0] || null;
}
export function preDueFor(rodajeStart) { return at(addDays(limaDate(rodajeStart), -1), hm(RULES.pre)); }

// Días de apoyo de un video: los del cliente si tiene plazo propio; si no, los del equipo.
export function monDays(client) {
  const v = client && RULES.cli ? Number(RULES.cli[client]) : NaN;
  return v >= 2 ? v : Number(RULES.mon) || 2;
}
// 1.5 · Modo de edición de un video:
// colab (lo edita un colaborador) · apoyo (socio con apoyo) · pareja (socio sin apoyo, o el líder si hay algún socio sin apoyo) · lider.
// El apoyo queda fijado en el video cuando se graba (apoyo_fixed), así un cambio de etiqueta rige para lo que aún no se graba.
export const isSocio = (m) => !!m && m.role === 'socio' && m.active !== false;
export const apoyoOf = (video, owner) => video && video.apoyo_fixed != null ? !!video.apoyo_fixed : !!(owner && owner.apoyo);
export const pairTeam = (ctx) => (ctx.members || []).some((m) => isSocio(m) && m.user_id && !m.apoyo);
export function modeOf(video, ctx) {
  if (jobOf(video, ctx)) return 'colab';
  const owner = (ctx.members || []).find((m) => m.id === video.owner);
  if (owner && owner.role === 'admin') return pairTeam(ctx) ? 'pareja' : 'lider';
  return apoyoOf(video, owner) ? 'apoyo' : 'pareja';
}
// Quién puede tomar la edición de un video en modo pareja: el líder o un socio sin apoyo (nunca el dueño ni un socio con apoyo).
export const canTakeEdit = (me, video) => !!me && me.id !== video.owner && (me.role === 'admin' || (me.role === 'socio' && !me.apoyo));
export function deadlines(video, ownerMember, opts = {}) {
  const pub = video.publish_date;
  const collab = opts.collaborator;
  const eve = addDays(pub, -RULES.fin);
  const finalDue = collab ? at(addDays(pub, -1), '18:00') : at(eve, '23:59');
  let montajeDue = null, selfDue = null, autoDue = null, fixDue = null;
  const mode = opts.mode || (collab ? 'colab' : apoyoOf(video, ownerMember) ? 'apoyo' : 'lider');
  let ownDue = null, revDue = null;
  if (collab) montajeDue = at(addDays(pub, -3), '21:00');
  else if (mode === 'pareja') {
    montajeDue = at(eve, hm(RULES.pmon));
    ownDue = at(eve, hm(RULES.pfin));
    revDue = at(eve, hm(RULES.prev));
    fixDue = at(eve, hm(RULES.pfix));
    const pd = opts.rodaje ? preDueFor(opts.rodaje.starts_at) : (video.pre_due ? new Date(video.pre_due) : null);
    return { preDue: pd, montajeDue, apoyoDue: null, selfDue: null, autoDue: null, fixDue, finalDue, ownDue, revDue, pair: true };
  } else if (mode === 'apoyo') {
    // 1.4: con apoyo hasta N días antes a las 21:00 (o la fecha que se adelantó por un choque).
    montajeDue = video.apoyo_due ? new Date(video.apoyo_due) : at(addDays(pub, -monDays(opts.client)), hm(RULES.monh));
    selfDue = at(eve, hm(RULES.self));
    autoDue = at(eve, hm(RULES.auto));
    fixDue = at(eve, hm(RULES.fix));
  }
  const preDue = opts.rodaje ? preDueFor(opts.rodaje.starts_at) : (video.pre_due ? new Date(video.pre_due) : null);
  return { preDue, montajeDue, apoyoDue: montajeDue, selfDue, autoDue, fixDue, finalDue };
}
const clientOf = (video, ctx) => { const p = (ctx.projects || []).find((x) => x.id === video.project_id); return p ? p.client : null; };
// Plazos de un video con su modo de edición.
export function dl(video, ctx) { const owner = (ctx.members || []).find((m) => m.id === video.owner); return deadlines(video, owner, { client: clientOf(video, ctx), mode: modeOf(video, ctx) }); }

function taskOf(tasks, videoId, kind) {
  return tasks.find((t) => t.video_id === videoId && t.kind === kind && t.done_at && !t.void);
}

// ---------- Estado de cada video ----------
// Devuelve qué pasó con cada tarea del video: quién la hizo, si a tiempo, y a quién se le paga.
export function videoState(video, ctx, now = new Date()) {
  const { tasks, members } = ctx;
  const owner = members.find((m) => m.id === video.owner);
  const rodaje = rodajeOf(video, ctx);
  const mode = modeOf(video, ctx);
  const d = deadlines(video, owner, { rodaje, client: clientOf(video, ctx), mode });
  const g = taskOf(tasks, video.id, 'guion');
  const s = taskOf(tasks, video.id, 'storyboard');
  const r = taskOf(tasks, video.id, 'rodaje');
  let mo = taskOf(tasks, video.id, 'montaje');
  let ac = taskOf(tasks, video.id, 'acabado');
  const late = (t, due) => !!(t && due && new Date(t.done_at) > due);
  const post = postState(video, owner, d, mo, ac, ctx, now);
  post.mode = mode;
  // Si el video pasó al administrador, lo que marcó el dueño ya no cuenta.
  const ownMo = post.handoff && mo && mo.done_by === video.owner ? mo : null;
  if (post.handoff) { if (mo && mo.done_by === video.owner) mo = null; if (ac && ac.done_by === video.owner) ac = null; }
  // 1.5 · pareja: quien toma el video empieza de cero; lo del dueño ya no cuenta.
  // Entregado al cliente: final de apoyo hecho, entrega propia aprobada, o final normal.
  const delivered = !!ac && (!post.self || post.review === 'aprobada');
  // Quién tiene la entrega en sus manos (para "entrega vencida" y los puntos al reprogramar).
  const adm = (ctx.members || []).find((m) => m.role === 'admin' && m.active !== false);
  const inCharge = post.colab ? post.job.member_id : post.pair ? (post.handoff ? post.handoffTo : video.owner) : (post.handoff || (post.apoyoPath && mo)) && adm ? adm.id : video.owner;
  const overdue = !delivered && !!d.finalDue && now > d.finalDue && !!r;
  return {
    inCharge, overdue,
    owner, d, g, s, r, mo, ac, rodaje, post, ownMo,
    phase: post.phase,
    preLate: late(g, d.preDue) || late(s, d.preDue),
    montajeLate: post.apoyoPath ? false : late(mo, d.montajeDue) && !post.self,
    finalLate: post.pair && ac && ac.done_by === video.owner ? late(ac, d.ownDue) : late(ac, d.finalDue),
    // Compatibilidad: "pasó al administrador" (antes 5.7).
    montajeMissed: post.handoff, reassigned: post.handoff || !!(mo && mo.done_by !== video.owner && !isCollabTask(mo, ctx) && owner && owner.apoyo),
    apoyo: !!(post.apoyoPath && ac && ac.done_by !== video.owner && !isCollabTask(ac, ctx)),
    delivered,
    complete: !!(g && s && r && mo && delivered)
  };
}

// ---------- 1.4 · Entregas al límite (videos de quien recibe apoyo) ----------
// Fases: normal · apoyo (montaje a tiempo: el administrador hace el final) · abierto (aún puede enviar el montaje
// para recibir apoyo) · solo (entrega el video completo por su cuenta) · riesgo (se puede tomar) · revision · cambios ·
// aprobado · pasado (lo hace el administrador).
export function reviewOf(ac, d, now = new Date()) {
  if (!ac || !ac.review) return null;
  const rd = d.revDue && !ac.review_round ? d.revDue : d.finalDue; // pareja: la primera hasta las 19:00; la corrección hasta las 23:59
  if (ac.review === 'pendiente' && rd && now > rd) return 'aprobada'; // no la revisó a tiempo: se aprueba sola
  return ac.review;
}
export const JOB_LIVE = ['invitado', 'activo', 'finalizado', 'cerrado'];
// Encargo vigente a un colaborador externo que incluye este video.
export function jobOf(video, ctx) {
  return (ctx.jobs || []).find((j) => JOB_LIVE.indexOf(j.status) !== -1 && (j.video_ids || []).indexOf(video.id) !== -1) || null;
}
export function postState(video, owner, d, mo, ac, ctx, now = new Date()) {
  const out = { phase: 'normal', handoff: false, apoyoPath: false, self: false, review: null, handoffAt: null, handoffWhy: null, colab: false, job: null };
  const job = jobOf(video, ctx);
  if (job) { out.phase = 'colab'; out.colab = true; out.job = job; return out; }
  if (d.pair) return pairState(video, owner, d, mo, ac, ctx, now, out);
  if (!owner || !apoyoOf(video, owner) || !d.apoyoDue) return out;
  // 1.4: si el video ya había pasado al administrador y luego se reprogramó, sigue siendo suyo.
  if (video.handoff && video.handoff.at) { out.handoff = true; out.phase = 'pasado'; out.handoffAt = new Date(video.handoff.at); out.handoffWhy = video.handoff.why || 'auto'; return out; }
  const ownMo = mo && mo.done_by === video.owner ? mo : null;
  const ownAc = ac && ac.done_by === video.owner ? ac : null;
  if (ownMo && new Date(ownMo.done_at) <= d.apoyoDue && !(ownAc && ownAc.review)) {
    out.phase = 'apoyo'; out.apoyoPath = true; return out;
  }
  const review = reviewOf(ownAc, d, now);
  out.review = review;
  const adm = (ctx.claims || []).find((c) => c.video_id === video.id && c.kind === 'montaje' && (c.status || 'activa') === 'activa');
  const otherMo = mo && mo.done_by !== video.owner && !isCollabTask(mo, ctx) ? mo : null;
  const hand = (at, why) => { out.handoff = true; out.phase = 'pasado'; out.handoffAt = at; out.handoffWhy = why; return out; };
  if (otherMo) return hand(new Date(otherMo.done_at), 'tomado');
  if (adm) return hand(new Date(adm.created_at || now), 'tomado');
  if (review === 'rechazada') return hand(new Date(ownAc.review_at || now), 'rechazo');
  if (review === 'cambios' && now > d.fixDue) return hand(d.fixDue, 'auto');
  if (!ownAc && now > d.autoDue) return hand(d.autoDue, 'auto');
  out.self = true;
  if (review) { out.phase = review === 'aprobada' ? 'aprobado' : review === 'pendiente' ? 'revision' : 'cambios'; return out; }
  out.phase = now <= d.apoyoDue ? 'abierto' : now <= d.selfDue ? 'solo' : 'riesgo';
  out.self = out.phase !== 'abierto';
  return out;
}

// 1.5 · Edición entre socios sin apoyo (y los videos del líder cuando hay alguno).
// Fases: p_mon (hasta las 12:00) · p_fin (hasta las 18:00) · p_tomar (desde las 18:00 se puede tomar) ·
// revision · cambios · aprobado · entregado · pasado (lo tomó otro o pasó al líder).
function pairState(video, owner, d, mo, ac, ctx, now, out) {
  out.pair = true;
  const adm = (ctx.members || []).find((m) => m.role === 'admin' && m.active !== false);
  const hand = (at, why, to) => { out.handoff = true; out.phase = 'pasado'; out.handoffAt = at; out.handoffWhy = why; out.handoffTo = to; return out; };
  if (video.handoff && video.handoff.at) return hand(new Date(video.handoff.at), video.handoff.why || 'auto', video.handoff.to || (adm && adm.id));
  const claim = (ctx.claims || []).find((c) => c.video_id === video.id && c.kind === 'montaje' && (c.status || 'activa') === 'activa');
  const otherMo = mo && mo.done_by !== video.owner && !isCollabTask(mo, ctx) ? mo : null;
  if (otherMo) return hand(new Date(otherMo.done_at), 'tomado', otherMo.done_by);
  if (claim) return hand(new Date(claim.created_at || now), 'tomado', claim.member_id);
  const ownAc = ac && ac.done_by === video.owner ? ac : null;
  const needsReview = !!(owner && owner.role !== 'admin');
  if (ownAc && needsReview) {
    const rv = reviewOf(ownAc, d, now);
    out.review = rv; out.self = true;
    if (rv === 'rechazada') return hand(new Date(ownAc.review_at || now), 'rechazo', adm && adm.id);
    if (rv === 'cambios' && now > d.fixDue) return hand(d.fixDue, 'auto', adm && adm.id);
    out.phase = rv === 'aprobada' ? 'aprobado' : rv === 'pendiente' ? 'revision' : 'cambios';
    return out;
  }
  if (ownAc) { out.phase = 'entregado'; return out; }
  out.self = needsReview;
  out.phase = now <= d.montajeDue ? 'p_mon' : now <= d.ownDue ? 'p_fin' : 'p_tomar';
  return out;
}

export const ceilCent = (x) => Math.ceil(Math.round(x * 1e6) / 1e4) / 100;
// El otro socio (para repartir el storyboard no hecho).
export function other(ctx, memberId) {
  const m = (ctx.members || []).find((x) => x.id !== memberId && (x.role === 'admin' || x.role === 'socio') && x.active !== false);
  return m ? m.id : memberId;
}

function isCollabTask(task, ctx) {
  const m = ctx.members.find((x) => x.id === task.done_by);
  return !!(m && m.role === 'colaborador');
}

// ---------- Quién cobra qué (cláusula quinta y 14.2.1) ----------
// Devuelve { porMiembro: {id: {pre, prod, post, total}}, colaboradores: {...}, pendiente, presupuesto }
export function payouts(project, ctx, now = new Date()) {
  const R = rates(project);
  const out = {};
  const add = (id, stage, amt) => {
    if (!out[id]) out[id] = { pre: 0, prod: 0, post: 0, total: 0 };
    out[id][stage] += amt; out[id].total += amt;
  };
  const jobs = ctx.jobs || [];
  const collabExtra = {}; // excedente por fuera, por colaborador
  const guillermo = {}; // por socio que lo contrató: { to, tasks, amount }
  let paid = 0;
  const espera = {}; // 1.4: pagos en espera por integrante
  for (const v of ctx.videos.filter((x) => x.project_id === project.id)) {
    const st = videoState(v, ctx, now);
    for (const kind of KINDS) {
      const t = taskOf(ctx.tasks, v.id, kind);
      if (!t) continue;
      const value = R[kind];
      let to = t.done_by;
      if (kind === 'acabado' && st.apoyo) to = v.owner;
      // 1.4: lo que marcó el dueño de un video que pasó al administrador no se paga.
      if (st.post.handoff && t.done_by === v.owner && (kind === 'montaje' || kind === 'acabado')) continue;
      // 1.5 · pareja: montaje y final se pagan juntos, solo cuando el video se entrega (y se aprueba).
      if ((kind === 'montaje' || kind === 'acabado') && st.post.pair && !st.delivered) {
        if (kind === 'acabado' && t.done_by === v.owner) espera[v.owner] = (espera[v.owner] || 0) + R.montaje + R.acabado;
        continue;
      }
      // 1.4: "en espera" hasta que el final de apoyo esté hecho o la entrega propia esté aprobada.
      if ((kind === 'montaje' || kind === 'acabado') && t.done_by === v.owner && !st.delivered && (st.post.apoyoPath || st.post.self)) {
        if (kind === 'montaje') espera[v.owner] = (espera[v.owner] || 0) + R.montaje + R.acabado; // el video completo: montaje + final
        continue;
      }
      const doer = ctx.members.find((m) => m.id === t.done_by);
      const hire = t.hire_id ? (ctx.hires || []).find((h) => h.id === t.hire_id) : null;
      if (hire) {
        // Hecho por Guillermo: el % va a quien lo hizo con él; el resto sigue siendo del dueño del video.
        // 1.5: el 80/20 es solo para el socio con apoyo; cualquier otro que contrata cede el 100 %.
        const pct = hirePct(hire, ctx.members);
        add(t.done_by, STAGE_OF[kind], value * pct);
        if (value * (1 - pct) > 1e-9) add(v.owner, STAGE_OF[kind], value * (1 - pct));
        guillermo[hire.hired_by] = guillermo[hire.hired_by] || { to: t.done_by, tasks: 0, amount: 0 };
        guillermo[hire.hired_by].tasks++; guillermo[hire.hired_by].amount += value * pct;
      } else if (doer && doer.role === 'colaborador') {
        // El presupuesto cubre hasta el valor de la tarea (tope S/ 25 por video); si cobra menos, el saldo queda con el dueño del video.
        const job = jobs.find((j) => j.member_id === doer.id && (j.video_ids || []).indexOf(v.id) !== -1) || jobs.find((j) => j.member_id === doer.id && j.project_id === project.id);
        const price = job ? Number(job.price != null ? job.price : job.price_per_video) : value;
        const share = job ? price * (value / (R.montaje + R.acabado)) : value;
        const covered = Math.min(share, value);
        add(doer.id, STAGE_OF[kind], covered);
        if (value - covered > 1e-9) add(v.owner, STAGE_OF[kind], value - covered);
        const extra = share - value;
        if (extra > 1e-9) {
          // 1.4: el excedente lo pone quien se acordó (el dueño del video, a medias o por definir).
          const payer = (job && job.payer) || 'owner';
          if (payer === 'tbd') collabExtra[doer.id] = (collabExtra[doer.id] || 0) + extra;
          else {
            add(doer.id, STAGE_OF[kind], extra);
            if (payer === 'half') { const ps = (ctx.members || []).filter((m) => (m.role === 'admin' || m.role === 'socio') && m.active !== false); ps.forEach((m) => add(m.id, STAGE_OF[kind], -extra / ps.length)); }
            else add(payer === 'owner' ? v.owner : payer, STAGE_OF[kind], -extra);
          }
        }
      } else if (t.split) {
        // 1.3: grabado sin storyboard → su valor se reparte mitad y mitad; el centavo extra es del dueño del video.
        const ow = ctx.members.find((m) => m.id === v.owner);
        const ps = (ctx.members || []).filter((m) => (m.role === 'admin' || m.role === 'socio') && m.active !== false);
        if (ow && ow.role === 'socio' && apoyoOf(v, ow) || ps.length <= 2) {
          const own = ceilCent(value / 2);
          add(v.owner, STAGE_OF[kind], own);
          add(t.split_with || other(ctx, v.owner), STAGE_OF[kind], value - own);
        } else {
          // 1.5: con socios sin apoyo, entre todos los socios del proyecto (el centavo extra al dueño).
          const each = Math.floor(value / ps.length * 100) / 100;
          ps.forEach((m) => add(m.id, STAGE_OF[kind], m.id === v.owner ? value - each * (ps.length - 1) : each));
        }
      } else {
        add(to, STAGE_OF[kind], value);
      }
      paid += value;
    }
  }
  const budget = Number(project.budget);
  return { porMiembro: out, excedente: collabExtra, guillermo, espera, pagado: paid, pendiente: budget - paid, presupuesto: budget, rates: R };
}

// ---------- Asistencia (7.2, 7.3, 7.4, 7.7) ----------
// 1.3: plazo para confirmar asistencia (y para avisar a tiempo que no irás).
// Rodaje: el día anterior a las 18:00. Reunión: 12 h antes; si eso cae de madrugada (00:00 a 04:59),
// el plazo pasa a las 23:59 del día anterior.
export function confirmDeadline(event) {
  if (event.kind === 'rodaje') return at(addDays(limaDate(event.starts_at), -1), hm(RULES.avr));
  const t = new Date(new Date(event.starts_at).getTime() - RULES.conf * 3600 * 1000);
  const [h, m] = limaTime(t).split(':').map(Number);
  if (h * 60 + m < RULES.madr) return at(addDays(limaDate(t), -1), '23:59');
  return t;
}
export function noticeDeadline(event) { return confirmDeadline(event); }
// La confirmación existe desde la 1.3: lo anterior no resta.
export const V13_FROM = new Date('2026-11-02T00:00:00-05:00');

// Respuesta de asistencia de un integrante: voy / no / guillermo (o nada).
export function rsvpOf(event, memberId, ctx) {
  const att = (ctx.attendance || []).find((a) => a.event_id === event.id && a.member_id === memberId);
  const h = (ctx.hires || []).find((x) => x.event_id === event.id && x.hired_by === memberId && (x.status === 'pendiente' || x.status === 'aceptada'));
  if (h) return { k: 'guillermo', at: h.created_at ? new Date(h.created_at) : null, hire: h };
  if (att && att.notice && att.notice.sent_at) return { k: 'no', at: new Date(att.notice.sent_at), att };
  if (att && att.rsvp === 'voy') return { k: 'voy', at: att.rsvp_at ? new Date(att.rsvp_at) : null, att };
  return { k: null, att: att || null };
}
// Confirmación: ¿ya respondió, puede cambiar, o venció sin responder (−2)?
export function rsvpState(event, memberId, ctx, now = new Date()) {
  const due = confirmDeadline(event);
  const r = rsvpOf(event, memberId, ctx);
  const answeredInTime = !!(r.k && (!r.at || r.at <= due));
  const created = event.created_at ? new Date(event.created_at) : null;
  const missed = active(event) && now > due && due >= V13_FROM && !answeredInTime && !(created && created > due);
  return { due, k: r.k, open: now <= due && active(event), missed, answeredInTime, r };
}
export function attendanceStatus(event, att, now = new Date()) {
  const start = new Date(event.starts_at);
  const tol = Number(event.tolerance_min || 45);
  const notice = att && att.notice;
  if (!active(event)) return { k: event.status, label: event.status === 'cancelado' ? 'Cancelado' : 'Reprogramado', pts: 0 };
  if (notice && notice.sent_at) {
    if (notice.reason === 'fm' && notice.decision === 'accept') return { k: 'fm', label: 'Fuerza mayor aceptada', pts: 0 };
    const onTime = new Date(notice.sent_at) <= noticeDeadline(event);
    if (notice.reason === 'fm' && notice.decision !== 'talk') return { k: 'fm_pend', label: 'Fuerza mayor por aceptar', pts: 0 };
    if (onTime) return { k: 'cancel_ok', label: 'Canceló a tiempo', pts: 0 };
    const afterStart = new Date(notice.sent_at) > new Date(start.getTime() + tol * 60000);
    if (afterStart) return { k: 'ausente', label: 'Inasistencia sin aviso', pts: -5 };
    return { k: 'cancel_late', label: 'Canceló fuera de plazo', pts: -3 };
  }
  if (att && att.claimed_at && !att.arrived_at) return { k: 'por_confirmar', label: 'Por confirmar · ' + limaTime(att.claimed_at), pts: 0 };
  if (att && att.arrived_at) {
    const mins = (new Date(att.arrived_at) - start) / 60000;
    if (mins <= RULES.punt) return { k: 'puntual', label: 'Puntual', pts: 1, mins };
    if (mins <= tol) return { k: 'tarde', label: 'Tardanza · se paga', pts: -1, mins };
    return { k: 'ausente', label: 'Inasistencia', pts: -5, mins };
  }
  if (now > new Date(start.getTime() + tol * 60000)) return { k: 'ausente', label: 'Inasistencia sin aviso', pts: -5 };
  return { k: 'pendiente', label: 'Por llegar', pts: 0 };
}

// Guillermo: colaborador de preproducción que un socio contrata para una reunión (cobra el % de la preproducción).
export const GUILLERMO = 'Guillermo';
// 1.5: el 80/20 solo vale cuando contrata un socio con apoyo; cualquier otro (el líder incluido) cede el 100 %.
export function hirePct(hire, members) {
  const hirer = (members || []).find((m) => m.id === (hire && (hire.hired_by || hire.id || hire)));
  return hirer && hirer.role === 'socio' && hirer.apoyo ? Number((hire && hire.pct) || 80) / 100 : 1;
}
export function hireFor(eventId, ctx, status = 'aceptada') {
  return (ctx.hires || []).find((h) => h.event_id === eventId && h.status === status) || null;
}
export function adminAbsent(event, ctx, now = new Date()) {
  const adm = (ctx.members || []).find((m) => m.role === 'admin' && m.active !== false);
  if (!adm) return true;
  const a = (ctx.attendance || []).find((x) => x.event_id === event.id && x.member_id === adm.id);
  if (a && a.notice && a.notice.sent_at) return true;
  const h = hireFor(event.id, ctx);
  if (h && h.hired_by === adm.id) return true;
  const tol = Number(event.tolerance_min || 45);
  return now > new Date(new Date(event.starts_at).getTime() + tol * 60000) && !(a && a.arrived_at);
}
// 1.5: si cuando el socio marca "Llegué" el líder aún no llegó (o no irá), la llegada del socio vale sola.
export function leaderAway(event, ctx, now = new Date()) {
  const adm = (ctx.members || []).find((m) => m.role === 'admin' && m.active !== false);
  if (!adm || adminAbsent(event, ctx, now)) return true;
  const a = (ctx.attendance || []).find((x) => x.event_id === event.id && x.member_id === adm.id);
  return !(a && a.arrived_at);
}
// Fin efectivo de una reunión: la solicitud o la finalización, o 6 horas después de empezar.
export function meetingEnd(event) {
  const auto = new Date(new Date(event.starts_at).getTime() + 6 * 3600 * 1000);
  const ts = [event.end_requested_at, event.ended_at].filter(Boolean).map((x) => new Date(x));
  return ts.length ? new Date(Math.min(auto, ...ts)) : auto;
}
export function meetingOpen(event, now = new Date()) {
  return active(event) && now >= new Date(new Date(event.starts_at).getTime() - RULES.open * 60000) && now < meetingEnd(event) && !event.ended_at;
}

export function memberStatus(event, memberId, ctx, now = new Date()) {
  const h = hireFor(event.id, ctx);
  if (h && h.hired_by === memberId) return { k: 'no_req', label: 'No requerida · contrató a Guillermo', pts: 0 };
  const att = (ctx.attendance || []).find((a) => a.event_id === event.id && a.member_id === memberId);
  return attendanceStatus(event, att, now);
}

export function canCheckIn(event, now = new Date()) {
  const start = new Date(event.starts_at);
  const tol = Number(event.tolerance_min || 45);
  return now >= new Date(start.getTime() - RULES.open * 60000) && now <= new Date(start.getTime() + tol * 60000);
}

// ---------- Racha (6.4) ----------
export const LEVELS = [
  { min: 20, name: 'Imparable', color: '#B98CFF' },
  { min: 10, name: 'Responsable', color: '#5CC8FF' },
  { min: 5, name: 'Constante', color: '#FF9F2E' },
  { min: 1, name: 'Cumplidor', color: '#FFB547' },
  { min: 0, name: 'Sin racha', color: '#6B6B75' }
];

export function level(points) {
  return LEVELS.find((l) => points >= l.min);
}

export function nextLevel(points) {
  const ups = LEVELS.filter((l) => l.min > points).sort((a, b) => a.min - b.min);
  return ups[0] || null;
}

// Eventos de racha de un integrante: solo sus propias tareas y llegadas (el apoyo no suma).
export function streakEvents(memberId, ctx, now = new Date()) {
  const ev = [];
  for (const v of ctx.videos) {
    // 1.4: reprogramar una entrega ya vencida resta 3 a quien la tenía en sus manos.
    const lateRep = (v.reprog || []).filter((r) => r.late && r.charge === memberId);
    for (const r of lateRep) ev.push({ at: new Date(r.at), pts: PTS.handoff, why: `Reprogramaste la entrega vencida del video ${v.num}` });
    // 1.4: el administrador suma +3 al entregar a tiempo un video que pasó a él; −3 si lo entrega tarde o no lo entrega.
    if (v.owner !== memberId) {
      const so = videoState(v, ctx, now);
      if (so.post.handoff && so.inCharge === memberId && !lateRep.length) {
        const mine = so.ac && so.ac.done_by === memberId;
        const took = (ctx.claims || []).some((c) => c.video_id === v.id && c.kind === 'montaje' && c.member_id === memberId && (c.status || 'activa') === 'activa');
        if (mine) { const tarde = new Date(so.ac.done_at) > so.d.finalDue; ev.push({ at: new Date(so.ac.done_at), pts: tarde ? PTS.handoff : PTS.rescue, why: tarde ? `Video ${v.num} entregado tarde` : `Rescataste el video ${v.num}` }); }
        else if (!so.ac && now > so.d.finalDue && !took) ev.push({ at: so.d.finalDue, pts: PTS.handoff, why: `Video ${v.num} sin entregar a tiempo` });
      }
      continue;
    }
    const st = videoState(v, ctx, now);
    if (st.g && st.s && !st.g.hire_id && !st.s.hire_id) {
      const t = new Date(Math.max(new Date(st.g.done_at), new Date(st.s.done_at)));
      ev.push({ at: t, pts: st.preLate ? -3 : 1, why: st.preLate ? `Guion o storyboard del video ${v.num} fuera de plazo` : `Preproducción del video ${v.num} a tiempo` });
      const mt = meetingOf(v, ctx);
      const att = mt && (ctx.attendance || []).find((a) => a.event_id === mt.id && a.member_id === memberId);
      if (mt && att && att.arrived_at && t >= new Date(new Date(mt.starts_at).getTime() - RULES.open * 60000) && t <= meetingEnd(mt)) {
        ev.push({ at: t, pts: 1, why: `Punto de reunión · video ${v.num}` });
      }
    }
    if (st.post.pair) {
      // 1.5: entrega a tiempo (18:00) +1; tarde −3; si te lo tomaron o pasó al líder −3.
      if (st.post.handoff) ev.push({ at: st.post.handoffAt, pts: PTS.handoff, why: `Video ${v.num} pasó a otra persona` });
      else if (st.ac && st.ac.done_by === memberId) ev.push({ at: new Date(st.ac.done_at), pts: st.finalLate ? PTS.handoff : 1, why: st.finalLate ? `Video ${v.num} entregado tarde` : `Video ${v.num} entregado a tiempo` });
    } else if (st.d.apoyoDue) {
      // 1.4: montaje a tiempo para el apoyo +1; entrega propia aprobada 0; si pasó al administrador −3.
      if (st.post.handoff) ev.push({ at: st.post.handoffAt, pts: PTS.handoff, why: `Video ${v.num} pasó a otra persona` });
      else if (st.post.apoyoPath && st.mo && st.mo.done_by === memberId) ev.push({ at: new Date(st.mo.done_at), pts: 1, why: `Montaje del video ${v.num} a tiempo` });
    } else {
      if (st.mo && st.mo.done_by === memberId) ev.push({ at: new Date(st.mo.done_at), pts: st.finalLate ? 0 : 1, why: `Montaje del video ${v.num}` });
      if (st.ac && st.ac.done_by === memberId) ev.push({ at: new Date(st.ac.done_at), pts: st.finalLate ? -3 : 1, why: st.finalLate ? `Video ${v.num} entregado tarde` : `Video ${v.num} entregado a tiempo` });
    }
  }
  // 1.3: rescate (+3 por entregable tomado y entregado) y compromiso incumplido (−4).
  for (const c of (ctx.claims || []).filter((x) => x.member_id === memberId && (x.status || 'activa') === 'activa')) {
    const v = ctx.videos.find((x) => x.id === c.video_id);
    if (!v) continue;
    const t = taskOf(ctx.tasks, v.id, c.kind);
    const rNow = rodajeOf(v, ctx);
    if (!t && PRE[c.kind] && (!rNow || rNow.id !== c.rodaje_id)) continue; // se reprogramó: el compromiso anterior no cuenta
    if (c.kind === 'montaje') { if (!(v.reprog || []).some((r) => r.late && r.charge === memberId) && claimFailed(c, v, ctx, now)) ev.push({ at: new Date(c.limit_at || takeLimit(v, c.kind, ctx)), pts: PTS.claimFail, why: `Tomaste el video ${v.num} y no lo entregaste` }); continue; }
    if (t && t.done_by === memberId && !t.split) ev.push({ at: new Date(t.done_at), pts: PTS.rescue, why: `Rescataste el ${c.kind} del video ${v.num}` }); // 1.3: también el montaje (5.7)
    else if (claimFailed(c, v, ctx, now)) ev.push({ at: new Date(c.limit_at || takeLimit(v, c.kind, ctx)), pts: PTS.claimFail, why: `Tomaste el ${c.kind} del video ${v.num} y no lo entregaste` });
  }
  const isPartner = (ctx.members || []).some((m) => m.id === memberId && (m.role === 'admin' || m.role === 'socio'));
  for (const e of (ctx.events || []).filter(active)) {
    const att = (ctx.attendance || []).find((a) => a.event_id === e.id && a.member_id === memberId);
    if (isPartner) { const rs = rsvpState(e, memberId, ctx, now); if (rs.missed) ev.push({ at: rs.due, pts: PTS.noConfirm, why: `${e.kind === 'rodaje' ? 'Rodaje' : 'Reunión'}: no confirmaste asistencia` }); }
    const s = memberStatus(e, memberId, ctx, now);
    if (s.k === 'pendiente' || s.k === 'no_req') continue;
    if (s.pts !== 0) ev.push({ at: att && att.arrived_at ? new Date(att.arrived_at) : new Date(e.starts_at), pts: s.pts, why: `${e.kind === 'rodaje' ? 'Rodaje' : 'Reunión'}: ${s.label.toLowerCase()}` });
  }
  return ev.sort((a, b) => a.at - b.at);
}

export function streak(memberId, ctx, now = new Date(), start = 0) {
  let pts = start;
  let best = start;
  for (const e of streakEvents(memberId, ctx, now)) {
    pts = Math.max(0, pts + e.pts);
    best = Math.max(best, pts);
  }
  return { pts, best, level: level(pts), next: nextLevel(pts) };
}

// ---------- Aporte real (privado) ----------
// 4 unidades por video: preproducción (guion 0.5 + storyboard 0.5), rodaje, montaje, acabado.
export function contribution(project, ctx, now = new Date()) {
  const units = {};
  let total = 0;
  const add = (id, u) => { units[id] = (units[id] || 0) + u; };
  for (const v of ctx.videos.filter((x) => x.project_id === project.id)) {
    for (const kind of KINDS) {
      const t = taskOf(ctx.tasks, v.id, kind);
      const u = kind === 'guion' || kind === 'storyboard' ? 0.5 : 1;
      total += u;
      if (t) add(t.done_by, u);
    }
  }
  return { units, total };
}

// Entregas propias a tiempo (indicador privado y del equipo).
export function deliveries(memberId, ctx, now = new Date()) {
  let total = 0, onTime = 0, missed = 0;
  for (const v of ctx.videos) {
    if (v.owner !== memberId) continue;
    const st = videoState(v, ctx, now);
    if (st.g && st.s && !st.g.hire_id && !st.s.hire_id) { total++; if (!st.preLate) onTime++; }
    if (st.d.apoyoDue || st.post.pair) {
      if (st.post.handoff) { total++; missed++; }
      else if (st.delivered) { total++; onTime++; }
    } else {
      if (st.mo && st.mo.done_by === memberId) { total++; if (!st.finalLate) onTime++; }
      if (st.ac && st.ac.done_by === memberId) { total++; if (!st.finalLate) onTime++; }
    }
  }
  return { total, onTime, missed };
}

const PRE = { guion: 1, storyboard: 1 };
// ---------- 1.3 · Tomar = comprometerse y luego entregar ----------
// Hasta cuándo se puede tomar (y entregar) lo del compañero: preproducción hasta 5 h antes del rodaje;
// montaje que pasó al administrador (5.7) hasta el plazo del video final.
export function takeLimit(video, kind, ctx) {
  if (PRE[kind]) { const r = rodajeOf(video, ctx); return r ? new Date(new Date(r.starts_at).getTime() - RULES.take * 3600 * 1000) : null; }
  if (kind === 'montaje') return dl(video, ctx).finalDue;
  return null;
}
// Compromiso vigente sobre una tarea (si el video se reprogramó, el compromiso anterior ya no cuenta).
export function claimOf(video, kind, ctx) {
  const r = PRE[kind] ? rodajeOf(video, ctx) : null;
  return (ctx.claims || []).find((c) => c.video_id === video.id && c.kind === kind && (c.status || 'activa') === 'activa' && (!PRE[kind] || (r && c.rodaje_id === r.id))) || null;
}
// Compromisos incumplidos: se pasó el límite y no se entregó.
export function claimFailed(c, video, ctx, now = new Date()) {
  const lim = c.limit_at ? new Date(c.limit_at) : takeLimit(video, c.kind, ctx);
  const t = taskOf(ctx.tasks, video.id, c.kind === 'montaje' ? 'acabado' : c.kind);
  return !!(lim && now > lim && !(t && t.done_by === c.member_id));
}

// ---------- Qué se puede marcar y deshacer (lo mismo que exige la base de datos) ----------
export function canMark(video, kind, me, ctx, now = new Date(), opts = {}) {
  const st = videoState(video, ctx, now);
  const owner = st.owner || {};
  const isOwner = video.owner === me.id;
  let done = st[{ guion: 'g', storyboard: 's', rodaje: 'r', montaje: 'mo', acabado: 'ac' }[kind]];
  if (kind === 'acabado' && st.post.self && st.post.review && st.post.review !== 'aprobada') done = null; // entrega por revisar o con cambios
  if (kind === 'montaje' && st.post.self && done && done.done_by === video.owner && !isOwner) done = null; // tomar el video en riesgo
  if (done) return { ok: false, why: 'Hecho' };
  if (PRE[kind]) {
    if (opts.hire) return { ok: true };
    const c = claimOf(video, kind, ctx);
    const lim = takeLimit(video, kind, ctx);
    if (isOwner) {
      if (st.d.preDue && now > st.d.preDue) return { ok: false, gone: true, by: c ? c.member_id : null, why: c ? 'Lo hará tu compañero' : 'Venció el plazo: pasó a tu compañero' };
      return { ok: true };
    }
    if (me.role !== 'admin' && me.role !== 'socio') return { ok: false, why: `Es de ${owner.name}` };
    if (!st.d.preDue || now <= st.d.preDue) return { ok: false, why: st.d.preDue ? `Es de ${owner.name}. Si no la entrega, podrás tomarla después del ${fmtWhen(st.d.preDue)}` : `Es de ${owner.name}` };
    if (c && c.member_id === me.id) return lim && now > lim ? { ok: false, late: true, why: 'Pasó el límite para entregarlo' } : { ok: true, take: true, claimed: true, limit: lim };
    if (c) return { ok: false, why: 'Ya lo tomó otra persona' };
    if (lim && now > lim) return { ok: false, late: true, why: 'Pasó el límite para tomarlo' };
    return { ok: false, claim: true, limit: lim, why: 'Tómalo para hacerlo' };
  }
  if (kind === 'rodaje') {
    const r = st.rodaje;
    if (!r) return { ok: false, why: 'Primero agenda el rodaje' };
    const open = new Date(new Date(r.starts_at).getTime() - RULES.open * 60000);
    if (now < open) return { ok: false, why: `Se habilita el ${fmtWhen(open)}` };
    if (limaDate(now) !== limaDate(r.starts_at)) return { ok: false, why: 'El día del rodaje ya pasó: reprográmalo' };
    // 1.3: sin guion no se graba (se reprograma); sin storyboard sí se graba y su valor se reparte.
    if (!st.g) return { ok: false, noGuion: true, why: 'Sin guion no se graba: reprográmalo' };
    const mine = (ctx.attendance || []).find((a) => a.event_id === r.id && a.member_id === me.id);
    if (!mine || !mine.arrived_at) return { ok: false, why: mine && mine.claimed_at ? 'Tu llegada espera que ' + adminName(ctx) + ' la confirme' : 'Primero registra tu llegada al rodaje' };
    const split = !st.s;
    if (isOwner) return { ok: true, split };
    const oa = (ctx.attendance || []).find((a) => a.event_id === r.id && a.member_id === video.owner);
    if (oa && oa.arrived_at) return { ok: false, why: `${owner.name} está en el rodaje: lo marca él` };
    if (oa && oa.notice && oa.notice.sent_at && new Date(oa.notice.sent_at) <= noticeDeadline(r) && oa.notice.choice !== 'other') return { ok: false, why: `${owner.name} avisó a tiempo: sus videos se reprograman` };
    return { ok: true, take: true, split };
  }
  if ((kind === 'montaje' || kind === 'acabado') && st.post.colab) {
    const cm = (ctx.members || []).find((m) => m.id === st.post.job.member_id);
    return { ok: false, colab: true, why: 'Lo edita ' + (cm ? String(cm.name).split(' ')[0] : 'el colaborador') };
  }
  if ((kind === 'montaje' || kind === 'acabado') && st.post.pair) return canMarkPair(video, kind, me, ctx, now, st);
  if (kind === 'montaje') {
    if (!st.r) return { ok: false, why: 'Primero tiene que grabarse el video' };
    const P = st.post;
    if (isOwner) {
      if (P.handoff) return { ok: false, gone: true, why: 'Lo hará ' + adminName(ctx) };
      return { ok: true, due: P.phase === 'abierto' ? st.d.apoyoDue : null };
    }
    if (owner.apoyo && me.role === 'admin') {
      const c = claimOf(video, kind, ctx);
      const lim = takeLimit(video, kind, ctx);
      if (P.handoff) {
        if (c && c.member_id !== me.id) return { ok: false, why: 'Ya lo tomó otra persona' };
        // 1.4: nunca se bloquea; vencido se entrega igual (o se reprograma la entrega).
        return { ok: true, take: true, claimed: !!c, limit: lim, late: !!(lim && now > lim) };
      }
      if (P.phase === 'riesgo') return { ok: false, claim: true, limit: st.d.autoDue, why: 'Puedes tomar el video' };
      return { ok: false, why: `Es de ${owner.name}` };
    }
    return { ok: false, why: `Es de ${owner.name}` };
  }
  if (kind === 'acabado') {
    const P = st.post;
    if (isOwner && P.handoff) return { ok: false, gone: true, why: 'Lo hará ' + adminName(ctx) };
    if (!st.mo) return { ok: false, why: 'Primero tiene que estar el montaje' };
    if (owner.apoyo && st.d.apoyoDue) {
      if (isOwner) {
        if (P.handoff) return { ok: false, gone: true, why: 'Lo hará ' + adminName(ctx) };
        if (P.apoyoPath) return { ok: false, why: 'Tu video final lo hace ' + adminName(ctx) + ' como apoyo' };
        if (P.phase === 'revision') return { ok: false, review: true, why: 'Entregado · ' + adminName(ctx) + ' revisa tu video' };
        if (P.phase === 'cambios') return { ok: true, fix: true, due: st.d.fixDue };
        return { ok: true, self: true, due: P.phase === 'riesgo' ? st.d.autoDue : st.d.selfDue };
      }
      if (me.role === 'admin') {
        if (P.apoyoPath) return { ok: true, apoyo: true, due: st.d.finalDue };
        if (P.handoff) return st.mo.done_by === me.id ? { ok: true, take: true, due: st.d.finalDue } : { ok: false, why: 'Primero el montaje' };
        if (P.phase === 'revision') return { ok: false, toReview: true, why: 'Revisa la entrega' };
      }
      return { ok: false, why: `Es de ${owner.name}` };
    }
    if (isOwner) return { ok: true };
    if (me.role === 'admin') return { ok: true, apoyo: !st.reassigned };
    return { ok: false, why: `Es de ${owner.name}` };
  }
  return { ok: false, why: '' };
}

// 1.5 · Qué se puede marcar en la edición entre socios sin apoyo.
function canMarkPair(video, kind, me, ctx, now, st) {
  const P = st.post;
  const isOwner = video.owner === me.id;
  const owner = st.owner || {};
  const nameOf = (id) => { const m = (ctx.members || []).find((x) => x.id === id); return m ? String(m.name).split(' ')[0] : 'tu compañero'; };
  if (!st.r) return { ok: false, why: 'Primero tiene que grabarse el video' };
  if (P.handoff) {
    if (isOwner) return { ok: false, gone: true, why: 'Lo hará ' + nameOf(P.handoffTo) };
    if (P.handoffTo !== me.id) return { ok: false, why: 'Lo hará ' + nameOf(P.handoffTo) };
    if (kind === 'acabado' && !(st.mo && st.mo.done_by === me.id)) return { ok: false, why: 'Primero el montaje' };
    return { ok: true, take: true, claimed: true, limit: st.d.finalDue, late: now > st.d.finalDue };
  }
  if (isOwner) {
    if (kind === 'montaje') return { ok: true, due: st.d.montajeDue, late: now > st.d.ownDue };
    if (!st.mo) return { ok: false, why: 'Primero tiene que estar el montaje' };
    if (P.phase === 'revision') return { ok: false, review: true, why: 'Entregado · ' + adminName(ctx) + ' revisa tu video' };
    if (P.phase === 'cambios') return { ok: true, fix: true, due: st.d.fixDue };
    return { ok: true, self: P.self, due: st.d.ownDue, late: now > st.d.ownDue };
  }
  if (kind === 'acabado' && P.phase === 'revision' && me.role === 'admin') return { ok: false, toReview: true, why: 'Revisa la entrega' };
  if (P.phase === 'p_tomar' && canTakeEdit(me, video)) return { ok: false, claim: true, limit: st.d.finalDue, why: 'Puedes tomar el video' };
  return { ok: false, why: `Es de ${owner.name}` };
}

const adminName = (ctx) => { const a = (ctx.members || []).find((m) => m.role === 'admin' && m.active !== false); return a ? String(a.name).split(' ')[0] : 'el líder'; };

// 1.4 · Deshacer: 10 minutos, y nunca después del plazo de esa acción. El administrador puede desmarcar tareas siempre.
export function undoUntil(task, ctx) {
  const v = (ctx.videos || []).find((x) => x.id === task.video_id);
  const ten = new Date(new Date(task.done_at).getTime() + RULES.undo * 60000);
  if (!v) return ten;
  const d = dl(v, ctx);
  let lim = null;
  if (d.pair && task.done_by === v.owner && (task.kind === 'montaje' || task.kind === 'acabado')) lim = task.kind === 'acabado' ? (task.review_round ? d.fixDue : d.ownDue) : d.finalDue;
  else if (task.kind === 'montaje' && task.done_by === v.owner && d.apoyoDue) lim = new Date(task.done_at) <= d.apoyoDue ? d.apoyoDue : d.autoDue;
  else if (task.kind === 'acabado' && task.done_by === v.owner && d.apoyoDue) lim = task.review_round ? d.fixDue : d.autoDue;
  else if (task.kind === 'montaje' || task.kind === 'acabado') lim = d.finalDue;
  else if (task.kind === 'rodaje') lim = at(addDays(limaDate(task.done_at), 1), '00:00');
  if (lim && lim < new Date(task.done_at)) return ten; // ya estaba vencido: solo los 10 minutos
  return lim && lim < ten ? lim : ten;
}
export function canUndo(task, me, ctx, now = new Date()) {
  if (me.role === 'admin') return true;
  if (task.done_by !== me.id || task.split) return false;
  if (PRE[task.kind]) {
    const v = (ctx.videos || []).find((x) => x.id === task.video_id);
    const r = v ? rodajeOf(v, ctx) : null;
    return !r || now <= preDueFor(r.starts_at);
  }
  // Lo que ya se revisó, o un montaje con su video final encima, no se deshace.
  if (task.kind === 'acabado' && ((task.review && task.review !== 'pendiente') || task.redelivered_at)) return false;
  if (task.kind === 'montaje' && (ctx.tasks || []).some((t) => t.video_id === task.video_id && t.kind === 'acabado' && !t.void)) return false;
  return now <= undoUntil(task, ctx);
}
// Decisiones del administrador sobre una entrega (aprobar, pedir cambios, rechazar): 10 min y antes del plazo de revisión.
export function canUndoReview(task, me, ctx, now = new Date()) {
  if (!task || !task.review || task.review === 'pendiente' || !task.review_at || task.review_by !== me.id) return false;
  if (task.redelivered_at && new Date(task.redelivered_at) > new Date(task.review_at)) return false;
  const v = (ctx.videos || []).find((x) => x.id === task.video_id);
  const d = v ? dl(v, ctx) : {};
  const ten = new Date(new Date(task.review_at).getTime() + RULES.undo * 60000);
  const lim = d.revDue || d.finalDue;
  return now <= ten && (!lim || now <= lim || !!(d.pair && task.review === 'cambios' && now <= d.fixDue));
}
// La entrega corregida: 10 min y antes de las 17:00, si aún no la revisó.
export function canUndoRedeliver(task, me, ctx, now = new Date()) {
  if (!task || task.review !== 'pendiente' || !task.redelivered_at || task.done_by !== me.id) return false;
  const v = (ctx.videos || []).find((x) => x.id === task.video_id);
  const d = v ? dl(v, ctx) : {};
  return now <= new Date(new Date(task.redelivered_at).getTime() + RULES.undo * 60000) && (!d.fixDue || now <= d.fixDue);
}
// Llegada y otras decisiones con hora propia: 10 min.
export const within = (iso, now = new Date()) => !!iso && now - new Date(iso) <= RULES.undo * 60000 && now >= new Date(iso);

// Franja de urgencia para "Te toca": 0 urgente (vencido o hoy), 1 próximo (1-2 días), 2 con margen.
export const STAGE_RANK = { guion: 0, storyboard: 0, reunion: 0, rodaje: 1, montaje: 2, acabado: 2 };
export function band(due, now = new Date()) {
  if (!due) return 2;
  const today = limaDate(now);
  const d = limaDate(due);
  if (due < now || d === today) return 0;
  if (d <= addDays(today, 2)) return 1;
  return 2;
}

// ================= 1.6 · Fechas de la semana =================
// Días entre dos fechas 'YYYY-MM-DD' (b − a).
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
export const MSG_ONE_DAY = 'Con un solo día, la preproducción se puede entregar, pero no con la calidad que merece.';
// Rodajes de una reunión (1.6: una reunión puede preparar varios rodajes).
export const meetRods = (m) => (m && m.rodaje_ids && m.rodaje_ids.length ? m.rodaje_ids : m && m.rodaje_id ? [m.rodaje_id] : []);
export const meetHas = (m, rodId) => meetRods(m).indexOf(rodId) !== -1;
// Revisa una semana antes de guardarla, con las mismas reglas que la base (rodajeProblem / meetingProblem).
// rodajes [{date, time, id?}] · meetings [{date, time, rods: [índice del rodaje nuevo o id de uno que ya existe], id?}]
// events: los del proyecto (los que se están moviendo se reemplazan por id). Devuelve
// { errors: {r0: '…', m0: '…'}, warns: {m0: '…'}, info: {m0: '…'}, join: bool, ok }.
export function checkWeek({ project, events = [], rodajes = [], meetings = [], now = new Date() }) {
  const errors = {}, warns = {}, info = {};
  const today = limaDate(now);
  const pid = project ? project.id : 'p';
  const rid = (r, i) => r.id || 'nuevo-r' + i;
  const mine = new Set(rodajes.map((r) => r.id).concat(meetings.map((m) => m.id)).filter(Boolean));
  const evs = events.filter((e) => !mine.has(e.id));
  rodajes.forEach((r, i) => { if (r.date) evs.push(Object.assign({}, events.find((e) => e.id === r.id) || {}, { id: rid(r, i), project_id: pid, kind: 'rodaje', status: 'activo', starts_at: at(r.date, r.time || '10:00').toISOString() })); });
  meetings.forEach((m, j) => {
    if (!m.date) return;
    const rods = (m.rods || []).map((x) => (typeof x === 'number' ? rid(rodajes[x] || {}, x) : x));
    evs.push(Object.assign({}, events.find((e) => e.id === m.id) || {}, { id: m.id || 'nuevo-m' + j, project_id: pid, kind: 'reunion', status: 'activo', ended_at: null, starts_at: at(m.date, m.time || '10:00').toISOString(), rodaje_ids: rods, rodaje_id: rods[0] }));
  });
  const mids = new Set(meetings.map((m, j) => m.id || 'nuevo-m' + j));
  rodajes.forEach((r, i) => {
    const k = 'r' + i;
    if (!r.date) { errors[k] = 'Elige la fecha del rodaje.'; return; }
    const t = at(r.date, r.time || '10:00');
    if (t <= now) { errors[k] = r.date < today ? `El ${fmtDay(r.date)} ya pasó.` : 'Esa hora ya pasó.'; return; }
    const e = evs.find((x) => x.id === rid(r, i));
    const p = rodajeProblem(e, evs.filter((x) => !mids.has(x.id)), project, now);
    if (p) errors[k] = p;
    else if (evs.some((x) => x.kind === 'reunion' && (x.status || 'activo') === 'activo' && !String(x.id).startsWith('nuevo-') && limaDate(x.starts_at) === r.date && !liveMeeting(x, now))) warns[k] = `Ya hay una reunión el ${fmtDay(r.date)}.`;
  });
  meetings.forEach((m, j) => {
    const k = 'm' + j;
    if (!m.date) { errors[k] = 'Elige la fecha de la reunión.'; return; }
    const t = at(m.date, m.time || '10:00');
    if (t <= now) { errors[k] = m.date < today ? `El ${fmtDay(m.date)} ya pasó.` : 'Esa hora ya pasó.'; return; }
    const e = evs.find((x) => x.id === (m.id || 'nuevo-m' + j));
    const p = meetingProblem(e, evs, project, now);
    const f = firstRodaje(e, evs);
    if (p) errors[k] = p;
    else if (f) {
      const gap = daysBetween(m.date, limaDate(f.starts_at));
      if (gap === 1) warns[k] = MSG_ONE_DAY;
      else info[k] = meetRods(e).map((id) => evs.find((x) => x.id === id)).filter(Boolean).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
        .map((r, n, all) => (all.length > 1 ? `Rodaje del ${fmtDay(limaDate(r.starts_at))}: ` : 'Guion y storyboard hasta el ') + `${fmtDay(addDays(limaDate(r.starts_at), -1))}, ${hm(RULES.pre)}`).join(' · ');
      if (!warns[k] && evs.some((x) => x.id !== e.id && x.kind === 'reunion' && (x.status || 'activo') === 'activo' && limaDate(x.starts_at) === m.date)) warns[k] = `Ya hay una reunión el ${fmtDay(m.date)}.`;
    }
  });
  // Una reunión por rodaje con rodajes en días seguidos: el plazo de la segunda tanda cae el día del primer rodaje.
  let join = false;
  meetings.forEach((m, j) => {
    if (!errors['m' + j]) return;
    const e = evs.find((x) => x.id === (m.id || 'nuevo-m' + j));
    const f = e && firstRodaje(e, evs);
    if (f && evs.some((r) => r.kind === 'rodaje' && (r.status || 'activo') === 'activo' && r.id !== f.id && limaDate(r.starts_at) === addDays(limaDate(f.starts_at), -1))) {
      join = meetings.length > 1;
      if (join) errors['m' + j] = `No hay día libre para la segunda reunión: su plazo vence el ${fmtDay(addDays(limaDate(f.starts_at), -1))} a las ${hm(RULES.pre)}, día del otro rodaje. Elige un día antes o prepáralos juntos.`;
    }
  });
  return { errors, warns, info, join, ok: !Object.keys(errors).length };
}
// Días que el calendario apaga o marca para un campo de la semana (kind 'rodaje' | 'reunion').
export function dayStatus(date, kind, opts) {
  const { project, now = new Date() } = opts;
  const today = limaDate(now);
  const st = project && project.start_date ? String(project.start_date).slice(0, 10) : null;
  if (date < today) return { off: true, why: `El ${fmtDay(date)} ya pasó` };
  if (kind === 'rodaje' && st && date <= st) return { off: true, why: `El rodaje va desde el ${fmtDay(addDays(st, 1))}: el servicio empieza el ${fmtDay(st)}` };
  if (kind === 'reunion' && st && date < st) return { off: true, why: `Antes del inicio del servicio (${fmtDay(st)})` };
  const r = checkWeek(Object.assign({}, opts, kind === 'rodaje'
    ? { rodajes: opts.rodajes.map((x, i) => (i === opts.idx ? Object.assign({}, x, { date }) : x)), meetings: [] }
    : { meetings: opts.meetings.map((x, i) => (i === opts.idx ? Object.assign({}, x, { date, time: x.time && at(date, x.time) > now ? x.time : '09:00' }) : x)).filter((x, i) => i === opts.idx) }));
  const k = (kind === 'rodaje' ? 'r' : 'm') + opts.idx;
  if (r.errors[k]) return { off: true, why: r.errors[k] };
  return { off: false, tight: r.warns[k] === MSG_ONE_DAY, why: r.warns[k] || r.info[k] || '' };
}
// Al cambiar la fecha de un rodaje: ¿cómo queda su reunión abierta? ('ok' | 'warn' | 'block')
export function meetingFit(meetingStart, rodajeStart) {
  const md = limaDate(meetingStart), rd = limaDate(rodajeStart);
  const gap = daysBetween(md, rd);
  if (gap < 1 || new Date(meetingStart) >= preDueFor(rodajeStart)) return 'block';
  return gap === 1 ? 'warn' : 'ok';
}
// ---- Lo mismo que revisa la base al guardar (meeting_problem / rodaje_problem en schema.sql) ----
const evOn = (e) => (e.status || 'activo') === 'activo';
export const liveMeeting = (m, now = new Date()) => !!m && m.kind === 'reunion' && evOn(m) && !m.ended_at && new Date(m.starts_at).getTime() + 6 * 3600e3 > now.getTime();
export function firstRodaje(m, events) {
  return meetRods(m).map((id) => events.find((e) => e.id === id)).filter((r) => r && r.kind === 'rodaje' && evOn(r) && r.project_id === m.project_id)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0] || null;
}
export function meetingProblem(m, events, project, now = new Date()) {
  if (!liveMeeting(m, now)) return null;
  const st = project && project.start_date ? String(project.start_date).slice(0, 10) : null;
  const d = limaDate(m.starts_at);
  const f = firstRodaje(m, events);
  if (!f) return 'Primero agenda el rodaje';
  if (st && d < st) return `La reunión no puede ser antes del inicio del servicio (${fmtDay(st)})`;
  if (d >= limaDate(f.starts_at)) return 'La reunión tiene que ser al menos 1 día antes del rodaje';
  if (new Date(m.starts_at) >= preDueFor(f.starts_at)) return `La reunión tiene que ser antes de las ${hm(RULES.pre)} del ${fmtDay(addDays(limaDate(f.starts_at), -1))} (plazo de preproducción)`;
  if (events.some((r) => r.project_id === m.project_id && r.kind === 'rodaje' && evOn(r) && limaDate(r.starts_at) === d)) return `El ${fmtDay(d)} hay rodaje: la reunión va otro día`;
  const mine = meetRods(m);
  if (events.some((o) => o.id !== m.id && o.project_id === m.project_id && liveMeeting(o, now) && meetRods(o).some((id) => mine.indexOf(id) !== -1))) return 'Ese rodaje ya tiene una reunión sin finalizar';
  return null;
}
export function rodajeProblem(r, events, project, now = new Date()) {
  if (!r || r.kind !== 'rodaje' || !evOn(r)) return null;
  const st = project && project.start_date ? String(project.start_date).slice(0, 10) : null;
  const d = limaDate(r.starts_at);
  if (st && d <= st) return `El rodaje tiene que ser desde el ${fmtDay(addDays(st, 1))}: el servicio empieza el ${fmtDay(st)}`;
  if (events.some((o) => o.id !== r.id && o.project_id === r.project_id && o.kind === 'rodaje' && evOn(o) && limaDate(o.starts_at) === d)) return 'No se pueden programar dos rodajes el mismo día';
  if (events.some((o) => o.project_id === r.project_id && liveMeeting(o, now) && limaDate(o.starts_at) === d)) return `El ${fmtDay(d)} hay una reunión: el rodaje va otro día`;
  for (const m of events.filter((o) => o.project_id === r.project_id && liveMeeting(o, now) && meetHas(o, r.id))) { const p = meetingProblem(m, events, project, now); if (p) return p; }
  return null;
}
export const eventProblem = (e, events, project, now = new Date()) => (e.kind === 'rodaje' ? rodajeProblem(e, events, project, now) : meetingProblem(e, events, project, now));

// ---- 1.6 · Corrección del historial: qué depende de una tarea ----
export function laterStep(t, tasks) {
  const has = (k) => tasks.some((x) => x.video_id === t.video_id && x.kind === k && !x.void);
  if ((t.kind === 'guion' || t.kind === 'storyboard') && has('rodaje')) return 'el video ya se grabó';
  if (t.kind === 'rodaje' && (has('montaje') || has('acabado'))) return 'el video ya tiene edición';
  if (t.kind === 'montaje' && has('acabado')) return 'el video final ya se entregó';
  return null;
}
