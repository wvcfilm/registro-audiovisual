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
export const DEFAULT_RULES = { open: 15, punt: 10, tol: 45, pre: 1080, mon: 2, fin: 1, undo: 10, avr: 1080, avm: 24, take: 5, conf: 12, madr: 300 };
// Puntos de racha nuevos (1.3).
export const PTS = { rescue: 3, claimFail: -4, noConfirm: -2 };
export const RULES = Object.assign({}, DEFAULT_RULES);
export function setRules(r) { Object.assign(RULES, DEFAULT_RULES, r || {}); }
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

export function deadlines(video, ownerMember, opts = {}) {
  const pub = video.publish_date;
  const collab = opts.collaborator;
  const finalDue = collab ? at(addDays(pub, -1), '18:00') : at(addDays(pub, -RULES.fin), '21:00');
  let montajeDue = null;
  if (collab) montajeDue = at(addDays(pub, -3), '21:00');
  else if (ownerMember && ownerMember.apoyo) montajeDue = at(addDays(pub, -RULES.mon), '21:00');
  const preDue = opts.rodaje ? preDueFor(opts.rodaje.starts_at) : (video.pre_due ? new Date(video.pre_due) : null);
  return { preDue, montajeDue, finalDue };
}

function taskOf(tasks, videoId, kind) {
  return tasks.find((t) => t.video_id === videoId && t.kind === kind && t.done_at);
}

// ---------- Estado de cada video ----------
// Devuelve qué pasó con cada tarea del video: quién la hizo, si a tiempo, y a quién se le paga.
export function videoState(video, ctx, now = new Date()) {
  const { tasks, members } = ctx;
  const owner = members.find((m) => m.id === video.owner);
  const rodaje = rodajeOf(video, ctx);
  const d = deadlines(video, owner, { rodaje });
  const g = taskOf(tasks, video.id, 'guion');
  const s = taskOf(tasks, video.id, 'storyboard');
  const r = taskOf(tasks, video.id, 'rodaje');
  const mo = taskOf(tasks, video.id, 'montaje');
  const ac = taskOf(tasks, video.id, 'acabado');
  const late = (t, due) => !!(t && due && new Date(t.done_at) > due);
  const ownerMontajeOk = !!(mo && mo.done_by === video.owner && (!d.montajeDue || new Date(mo.done_at) <= d.montajeDue));
  // 5.7: si el dueño necesitaba apoyo y su montaje no llegó a la hora límite, el video pasa al administrador.
  const montajeMissed = !!(d.montajeDue && now > d.montajeDue && !ownerMontajeOk);
  const reassigned = montajeMissed || !!(mo && mo.done_by !== video.owner && !isCollabTask(mo, ctx));
  // 5.5: acabado de apoyo → se le paga al dueño si su montaje llegó a tiempo.
  const apoyo = !!(ac && ac.done_by !== video.owner && ownerMontajeOk && !isCollabTask(ac, ctx));
  return {
    owner, d, g, s, r, mo, ac, rodaje,
    preLate: late(g, d.preDue) || late(s, d.preDue),
    montajeLate: late(mo, d.montajeDue),
    finalLate: late(ac, d.finalDue),
    montajeMissed, reassigned, apoyo,
    delivered: !!ac,
    complete: !!(g && s && r && mo && ac)
  };
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
  for (const v of ctx.videos.filter((x) => x.project_id === project.id)) {
    const st = videoState(v, ctx, now);
    for (const kind of KINDS) {
      const t = taskOf(ctx.tasks, v.id, kind);
      if (!t) continue;
      const value = R[kind];
      let to = t.done_by;
      if (kind === 'acabado' && st.apoyo) to = v.owner;
      const doer = ctx.members.find((m) => m.id === t.done_by);
      const hire = t.hire_id ? (ctx.hires || []).find((h) => h.id === t.hire_id) : null;
      if (hire) {
        // Hecho por Guillermo: el % va a quien lo hizo con él; el resto sigue siendo del dueño del video.
        const pct = Number(hire.pct || 80) / 100;
        add(t.done_by, STAGE_OF[kind], value * pct);
        if (value * (1 - pct) > 1e-9) add(v.owner, STAGE_OF[kind], value * (1 - pct));
        guillermo[hire.hired_by] = guillermo[hire.hired_by] || { to: t.done_by, tasks: 0, amount: 0 };
        guillermo[hire.hired_by].tasks++; guillermo[hire.hired_by].amount += value * pct;
      } else if (doer && doer.role === 'colaborador') {
        // El presupuesto cubre hasta el valor de la tarea; si cobra menos, el saldo queda con el dueño del video.
        const job = jobs.find((j) => j.member_id === doer.id && j.project_id === project.id);
        const share = job ? job.price_per_video * (value / (R.montaje + R.acabado)) : value;
        const covered = Math.min(share, value);
        add(doer.id, STAGE_OF[kind], covered);
        if (value - covered > 1e-9) add(v.owner, STAGE_OF[kind], value - covered);
        if (share - value > 1e-9) collabExtra[doer.id] = (collabExtra[doer.id] || 0) + (share - value);
      } else if (t.split) {
        // 1.3: grabado sin storyboard → su valor se reparte mitad y mitad; el centavo extra es del dueño del video.
        const own = ceilCent(value / 2);
        add(v.owner, STAGE_OF[kind], own);
        add(t.split_with || other(ctx, v.owner), STAGE_OF[kind], value - own);
      } else {
        add(to, STAGE_OF[kind], value);
      }
      paid += value;
    }
  }
  const budget = Number(project.budget);
  return { porMiembro: out, excedente: collabExtra, guillermo, pagado: paid, pendiente: budget - paid, presupuesto: budget, rates: R };
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
    if (v.owner !== memberId) continue;
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
    if (st.d.montajeDue) {
      if (st.montajeMissed) ev.push({ at: st.d.montajeDue, pts: -3, why: `Video ${v.num} pasó a otra persona (5.7)` });
      else if (st.mo && st.mo.done_by === memberId) ev.push({ at: new Date(st.mo.done_at), pts: 1, why: `Montaje del video ${v.num} a tiempo` });
    } else {
      if (st.mo && st.mo.done_by === memberId) ev.push({ at: new Date(st.mo.done_at), pts: st.finalLate ? 0 : 1, why: `Montaje del video ${v.num}` });
      if (st.ac && st.ac.done_by === memberId) ev.push({ at: new Date(st.ac.done_at), pts: st.finalLate ? -3 : 1, why: st.finalLate ? `Video ${v.num} entregado tarde` : `Video ${v.num} entregado a tiempo` });
    }
  }
  // 1.3: rescate (+3 por entregable tomado y entregado) y compromiso incumplido (−4).
  for (const c of (ctx.claims || []).filter((x) => x.member_id === memberId && (x.status || 'activa') === 'activa' && PRE[x.kind])) {
    const v = ctx.videos.find((x) => x.id === c.video_id);
    if (!v) continue;
    const t = taskOf(ctx.tasks, v.id, c.kind);
    const rNow = rodajeOf(v, ctx);
    if (!t && (!rNow || rNow.id !== c.rodaje_id)) continue; // se reprogramó: el compromiso anterior no cuenta
    if (t && t.done_by === memberId && !t.split) ev.push({ at: new Date(t.done_at), pts: PTS.rescue, why: `Rescataste el ${c.kind} del video ${v.num}` });
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
    if (st.d.montajeDue) {
      if (st.montajeMissed) { total++; missed++; }
      else if (st.mo) { total++; onTime++; }
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
  if (kind === 'montaje') { const owner = (ctx.members || []).find((m) => m.id === video.owner); return deadlines(video, owner, {}).finalDue; }
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
  return !!(lim && now > lim && !taskOf(ctx.tasks, video.id, c.kind));
}

// ---------- Qué se puede marcar y deshacer (lo mismo que exige la base de datos) ----------
export function canMark(video, kind, me, ctx, now = new Date(), opts = {}) {
  const st = videoState(video, ctx, now);
  const owner = st.owner || {};
  const isOwner = video.owner === me.id;
  const done = st[{ guion: 'g', storyboard: 's', rodaje: 'r', montaje: 'mo', acabado: 'ac' }[kind]];
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
    if (!mine || !mine.arrived_at) return { ok: false, why: mine && mine.claimed_at ? 'Tu llegada espera confirmación del administrador' : 'Primero registra tu llegada al rodaje' };
    const split = !st.s;
    if (isOwner) return { ok: true, split };
    const oa = (ctx.attendance || []).find((a) => a.event_id === r.id && a.member_id === video.owner);
    if (oa && oa.arrived_at) return { ok: false, why: `${owner.name} está en el rodaje: lo marca él` };
    if (oa && oa.notice && oa.notice.sent_at && new Date(oa.notice.sent_at) <= noticeDeadline(r) && oa.notice.choice !== 'other') return { ok: false, why: `${owner.name} avisó a tiempo: sus videos se reprograman` };
    return { ok: true, take: true, split };
  }
  if (kind === 'montaje') {
    if (!st.r) return { ok: false, why: 'Primero tiene que grabarse el video' };
    if (isOwner) return st.montajeMissed ? { ok: false, why: 'Venció el plazo del montaje: pasa al administrador (5.7)' } : { ok: true };
    if (me.role === 'admin' && st.montajeMissed) {
      const c = claimOf(video, kind, ctx);
      const lim = takeLimit(video, kind, ctx);
      if (c && c.member_id === me.id) return { ok: true, take: true, claimed: true, limit: lim };
      if (lim && now > lim) return { ok: false, late: true, why: 'Pasó el plazo del video final' };
      return { ok: false, claim: true, limit: lim, why: 'Tómalo para hacerlo' };
    }
    return { ok: false, why: `Es de ${owner.name}` };
  }
  if (kind === 'acabado') {
    if (!st.mo) return { ok: false, why: 'Primero tiene que estar el montaje' };
    if (isOwner && !owner.apoyo) return { ok: true };
    if (me.role === 'admin' && !isOwner) return { ok: true, apoyo: !st.reassigned };
    if (isOwner && owner.apoyo) return { ok: false, why: 'Tu video final lo hace el administrador como apoyo (5.5)' };
    return { ok: false, why: `Es de ${owner.name}` };
  }
  return { ok: false, why: '' };
}

export function canUndo(task, me, ctx, now = new Date()) {
  if (me.role === 'admin') return true;
  if (task.done_by !== me.id) return false;
  if (PRE[task.kind]) {
    const v = (ctx.videos || []).find((x) => x.id === task.video_id);
    const r = v ? rodajeOf(v, ctx) : null;
    return !r || now <= preDueFor(r.starts_at);
  }
  return now - new Date(task.done_at) <= RULES.undo * 60000;
}

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
