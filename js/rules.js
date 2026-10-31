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
export function deadlines(video, ownerMember, opts = {}) {
  const pub = video.publish_date;
  const collab = opts.collaborator;
  const finalDue = collab ? at(addDays(pub, -1), '18:00') : at(addDays(pub, -1), '21:00');
  let montajeDue = null;
  if (collab) montajeDue = at(addDays(pub, -3), '21:00');
  else if (ownerMember && ownerMember.apoyo) montajeDue = at(addDays(pub, -2), '21:00');
  const preDue = video.pre_due ? new Date(video.pre_due) : null;
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
  const d = deadlines(video, owner);
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
    owner, d, g, s, r, mo, ac,
    preLate: late(g, d.preDue) || late(s, d.preDue),
    montajeLate: late(mo, d.montajeDue),
    finalLate: late(ac, d.finalDue),
    montajeMissed, reassigned, apoyo,
    delivered: !!ac,
    complete: !!(g && s && r && mo && ac)
  };
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
export function attendanceStatus(event, att, now = new Date()) {
  const start = new Date(event.starts_at);
  const tol = Number(event.tolerance_min || 45);
  const notice = att && att.notice;
  if (notice && notice.sent_at) {
    if (notice.reason === 'fm' && notice.decision === 'accept') return { k: 'fm', label: 'Fuerza mayor aceptada', pts: 0 };
    const hours = event.kind === 'rodaje' ? 48 : 24;
    const onTime = (start - new Date(notice.sent_at)) >= hours * 3600 * 1000;
    if (notice.reason === 'fm' && notice.decision !== 'talk') return { k: 'fm_pend', label: 'Fuerza mayor por aceptar', pts: 0 };
    if (onTime) return { k: 'cancel_ok', label: 'Canceló a tiempo', pts: 0 };
    const afterStart = new Date(notice.sent_at) > new Date(start.getTime() + tol * 60000);
    if (afterStart) return { k: 'ausente', label: 'Inasistencia sin aviso', pts: -5 };
    return { k: 'cancel_late', label: 'Canceló fuera de plazo', pts: -3 };
  }
  if (att && att.arrived_at) {
    const mins = (new Date(att.arrived_at) - start) / 60000;
    if (mins <= 10) return { k: 'puntual', label: 'Puntual', pts: 1, mins };
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
export function memberStatus(event, memberId, ctx, now = new Date()) {
  const h = hireFor(event.id, ctx);
  if (h && h.hired_by === memberId) return { k: 'no_req', label: 'No requerida · contrató a Guillermo', pts: 0 };
  const att = (ctx.attendance || []).find((a) => a.event_id === event.id && a.member_id === memberId);
  return attendanceStatus(event, att, now);
}

export function canCheckIn(event, now = new Date()) {
  const start = new Date(event.starts_at);
  const tol = Number(event.tolerance_min || 45);
  return now >= new Date(start.getTime() - 15 * 60000) && now <= new Date(start.getTime() + tol * 60000);
}

// ---------- Racha (6.4) ----------
export const LEVELS = [
  { min: 20, name: 'Imparable', color: '#B98CFF' },
  { min: 10, name: 'Responsable', color: '#FF5A36' },
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
    }
    if (st.d.montajeDue) {
      if (st.montajeMissed) ev.push({ at: st.d.montajeDue, pts: -3, why: `Video ${v.num} pasó a otra persona (5.7)` });
      else if (st.mo && st.mo.done_by === memberId) ev.push({ at: new Date(st.mo.done_at), pts: 1, why: `Montaje del video ${v.num} a tiempo` });
    } else {
      if (st.mo && st.mo.done_by === memberId) ev.push({ at: new Date(st.mo.done_at), pts: st.finalLate ? 0 : 1, why: `Montaje del video ${v.num}` });
      if (st.ac && st.ac.done_by === memberId) ev.push({ at: new Date(st.ac.done_at), pts: st.finalLate ? -3 : 1, why: st.finalLate ? `Video ${v.num} entregado tarde` : `Video ${v.num} entregado a tiempo` });
    }
  }
  for (const e of ctx.events || []) {
    const att = (ctx.attendance || []).find((a) => a.event_id === e.id && a.member_id === memberId);
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
