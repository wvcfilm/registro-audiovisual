// Estado de la app y operaciones del día a día.
import { api, TABLES, isPractice, hasServer } from './api.js';
import { at, addDays, payouts, attendanceStatus, memberStatus, videoState, limaDate, adminAbsent, preDueFor, meetingOf as rMeetingOf } from './rules.js';

export const S = {
  ready: false, session: null, teams: [], teamId: null, me: null, projectId: null,
  data: Object.fromEntries(TABLES.map((t) => [t, []])),
  toast: null, busy: false
};

const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
export const emit = () => listeners.forEach((fn) => fn());

export function toast(msg, kind = 'ok') {
  S.toast = { msg, kind, id: Date.now() };
  emit();
  setTimeout(() => { if (S.toast && Date.now() - S.toast.id >= 2900) { S.toast = null; emit(); } }, 3000);
}

export async function boot() {
  await api.handleRedirect();
  S.session = api.session();
  if (S.session) await loadTeams();
  S.ready = true;
  emit();
}

export async function loadTeams() {
  S.teams = (await api.rpc('my_teams')) || [];
  const saved = localStorage.getItem('ra-team');
  const t = S.teams.find((x) => x.team_id === saved) || S.teams[0];
  S.teamId = t ? t.team_id : null;
  if (S.teamId) await load();
}

export async function load() {
  if (!S.teamId) return;
  const rows = await Promise.all(TABLES.map((t) => api.list(t, S.teamId)));
  TABLES.forEach((t, i) => { S.data[t] = rows[i] || []; });
  S.me = S.data.members.find((m) => m.user_id === S.session.user.id) || null;
  const open = S.data.projects.filter((p) => p.status === 'abierto');
  if (!S.projectId || !S.data.projects.find((p) => p.id === S.projectId)) {
    const saved = localStorage.getItem('ra-project');
    S.projectId = (S.data.projects.find((p) => p.id === saved) || open[open.length - 1] || S.data.projects[S.data.projects.length - 1] || {}).id || null;
  }
  emit();
}

async function run(fn, okMsg) {
  S.busy = true; emit();
  try {
    const r = await fn();
    await load();
    if (okMsg) toast(okMsg);
    return r;
  } catch (e) {
    toast(e.message || 'Algo salió mal', 'bad');
    throw e;
  } finally { S.busy = false; emit(); }
}

// ---------- Contexto para las reglas ----------
export function ctx(projectId = S.projectId) {
  const d = S.data;
  const videos = d.videos.filter((v) => !projectId || v.project_id === projectId);
  const vids = new Set(videos.map((v) => v.id));
  const events = d.events.filter((e) => !projectId || e.project_id === projectId);
  const evIds = new Set(events.map((e) => e.id));
  return {
    members: d.members,
    videos,
    tasks: d.tasks.filter((t) => vids.has(t.video_id)),
    events,
    attendance: d.attendance.filter((a) => evIds.has(a.event_id)),
    hires: d.hires.filter((h) => evIds.has(h.event_id)),
    jobs: []
  };
}

export const project = () => S.data.projects.find((p) => p.id === S.projectId) || null;
export const member = (id) => S.data.members.find((m) => m.id === id) || { name: '—', role: '' };
export const partners = () => S.data.members.filter((m) => m.active && m.user_id && (m.role === 'admin' || m.role === 'socio'));
export const isAdmin = () => !!(S.me && S.me.role === 'admin');
export const admin = () => S.data.members.find((m) => m.role === 'admin' && m.active);

// ---------- Sesión y equipo ----------
export async function sendCode(email) { await api.sendCode(email); }
export const googleUrl = () => api.googleUrl();
export async function verifyCode(email, code) {
  await api.verifyCode(email, code);
  S.session = api.session();
  await loadTeams();
  emit();
}
export async function signOut() { await api.signOut(); location.hash = '#/'; location.reload(); }

export function switchTeam(id) { S.teamId = id; localStorage.setItem('ra-team', id); S.projectId = null; return load(); }
export function switchProject(id) { S.projectId = id; localStorage.setItem('ra-project', id); emit(); }

export async function createTeam(teamName, myName) {
  const id = await api.rpc('create_team', { team_name: teamName, my_name: myName });
  localStorage.setItem('ra-team', id);
  await loadTeams();
}
export function invite(name, role, apoyo) {
  return run(() => api.rpc('create_invite', { t: S.teamId, invite_name: name, invite_role: role, gets_apoyo: !!apoyo }));
}
export const inviteInfo = (code) => api.rpc('invite_info', { code });
export async function acceptInvite(code, name) {
  const id = await api.rpc('accept_invite', { code, my_name: name });
  localStorage.setItem('ra-team', id);
  await loadTeams();
}
export const renameMember = (id, name) => run(() => api.update('members', id, { name: name.trim() }), 'Nombre actualizado');

// ---------- Proyectos y reparto ----------
export async function createProject(p) {
  const r = await run(() => api.insert('projects', Object.assign({ team_id: S.teamId, status: 'abierto' }, p)), 'Proyecto creado');
  switchProject(r.id);
  return r;
}

// Programar semana: primero el rodaje, luego su reunión de preproducción (antes del plazo).
export function planWeek(w) {
  return run(async () => {
    const rStart = at(w.rodaje_date, w.rodaje_time);
    const mStart = at(w.meeting_date, w.meeting_time);
    if (mStart >= preDueFor(rStart)) throw new Error('La reunión tiene que ser antes del plazo de preproducción (día antes del rodaje, 18:00)');
    const rod = await api.insert('events', { team_id: S.teamId, project_id: S.projectId, kind: 'rodaje', status: 'activo', starts_at: rStart.toISOString(), tolerance_min: 45, video_ids: [] });
    await api.insert('events', { team_id: S.teamId, project_id: S.projectId, kind: 'reunion', status: 'activo', rodaje_id: rod.id, starts_at: mStart.toISOString(), tolerance_min: 45, video_ids: [] });
    return rod;
  }, 'Semana programada');
}
export function extraMeeting(rodaje, date, time) {
  return run(async () => {
    const open = S.data.events.find((e) => e.kind === 'reunion' && e.rodaje_id === rodaje.id && (!e.status || e.status === 'activo') && !e.ended_at);
    if (open) throw new Error('Ese rodaje ya tiene una reunión sin finalizar');
    const mStart = at(date, time);
    if (mStart >= preDueFor(rodaje.starts_at)) throw new Error('Tiene que ser antes del plazo de preproducción');
    return api.insert('events', { team_id: S.teamId, project_id: rodaje.project_id, kind: 'reunion', status: 'activo', rodaje_id: rodaje.id, starts_at: mStart.toISOString(), tolerance_min: 45, video_ids: rodaje.video_ids });
  }, 'Reunión agendada');
}
// Reparto de la reunión: crea los videos y los asigna al rodaje y a la reunión de esa semana.
export function reparto(rodaje, videos) {
  return run(async () => {
    const p = project();
    let num = S.data.videos.filter((v) => v.project_id === p.id).reduce((m, v) => Math.max(m, v.num), 0);
    const ids = [];
    for (const v of videos) { num++; ids.push((await api.insert('videos', { team_id: S.teamId, project_id: p.id, num, publish_date: v.publish_date, owner: v.owner })).id); }
    const all = rodaje.video_ids.concat(ids);
    await api.update('events', rodaje.id, { video_ids: all });
    for (const m of S.data.events.filter((e) => e.kind === 'reunion' && e.rodaje_id === rodaje.id && (!e.status || e.status === 'activo'))) await api.update('events', m.id, { video_ids: all });
  }, 'Reparto guardado');
}
export function endMeeting(e) {
  if (S.me.role === 'admin' || adminAbsent(e, ctx(e.project_id))) return run(() => api.update('events', e.id, { ended_at: new Date().toISOString() }), 'Reunión finalizada');
  return run(() => api.update('events', e.id, { end_requested_at: new Date().toISOString(), end_requested_by: S.me.id }), 'Solicitud enviada al administrador');
}
export const confirmEnd = (e) => run(() => api.update('events', e.id, { ended_at: e.end_requested_at || new Date().toISOString() }), 'Reunión finalizada');
export const cancelEvent = (e, note) => run(() => api.update('events', e.id, { status: 'cancelado', cancel_note: note || null }), 'Cancelado');
export const deleteEvent = (e) => run(() => api.remove('events', e.id), 'Borrado');
export const moveEvent = (e, date, time) => run(() => api.update('events', e.id, { starts_at: at(date, time).toISOString() }), 'Fecha cambiada');
// Reprogramar el rodaje completo: nuevo rodaje con los mismos videos; el anterior queda como "reprogramado".
export function reprogramDay(e, date, time, note) {
  return run(async () => {
    const nu = await api.insert('events', { team_id: S.teamId, project_id: e.project_id, kind: 'rodaje', status: 'activo', starts_at: at(date, time).toISOString(), tolerance_min: e.tolerance_min || 45, video_ids: e.video_ids, note: 'Reprogramado' });
    await api.update('events', e.id, { status: 'reprogramado', replaced_by: nu.id, cancel_note: note || null });
    for (const m of S.data.events.filter((x) => x.kind === 'reunion' && x.rodaje_id === e.id)) await api.update('events', m.id, { rodaje_id: nu.id });
    return nu;
  }, 'Rodaje reprogramado');
}
export const deleteProject = (p) => run(() => api.remove('projects', p.id), 'Proyecto borrado');
export const archiveProject = (p, on) => run(() => api.update('projects', p.id, { status: on ? 'archivado' : 'abierto' }), on ? 'Proyecto archivado' : 'Proyecto reabierto');
export const undoOwn = (taskId) => run(() => api.remove('tasks', taskId), 'Deshecho');

// Modo práctica: la app usa la demo local aunque haya base de datos real.
export const practice = () => isPractice;
export const canPractice = () => hasServer;
export function setPractice(on) { try { if (on) localStorage.setItem('ra-practice', '1'); else localStorage.removeItem('ra-practice'); } catch (e) { /* */ } location.hash = '#/'; location.reload(); }

// Reunión semanal: crea los videos de la semana, la reunión (o usa la ya agendada) y el rodaje (5.8).

export const changeOwner = (videoId, owner) => run(() => api.update('videos', videoId, { owner }), 'Intercambio registrado');

// ---------- Tareas ----------
export function markTask(video, kind, extra = {}, msg) {
  return run(() => api.insert('tasks', Object.assign({ team_id: S.teamId, project_id: video.project_id, video_id: video.id, kind, done_by: S.me.id, done_at: new Date().toISOString() }, extra)), msg === undefined ? 'Listo, quedó registrado' : msg);
}
export const undoTask = (taskId) => run(() => api.remove('tasks', taskId), 'Tarea desmarcada');

// ---------- Asistencia y avisos (7.2 a 7.10) ----------
function attOf(eventId, memberId) { return S.data.attendance.find((a) => a.event_id === eventId && a.member_id === memberId); }

// Llegada: el socio la marca y el administrador la confirma (si el administrador no está, vale sola).
export function checkIn(event) {
  return run(async () => {
    const now = new Date().toISOString();
    const a = attOf(event.id, S.me.id);
    const patch = { claimed_at: now };
    if (api.mode === 'demo' && (S.me.role === 'admin' || adminAbsent(event, ctx(event.project_id)))) patch.arrived_at = now;
    if (a) return api.update('attendance', a.id, patch);
    return api.insert('attendance', Object.assign({ team_id: S.teamId, event_id: event.id, member_id: S.me.id }, patch));
  }, S.me.role === 'admin' ? 'Llegada registrada' : 'Llegada enviada: el administrador la confirma');
}
export function confirmArrival(att, mode) {
  return run(() => api.update('attendance', att.id, { arrived_at: mode === 'claimed' ? att.claimed_at : new Date().toISOString(), confirmed_by: S.me.id }), 'Llegada confirmada');
}

export function sendNotice(event, n) {
  return run(async () => {
    const a = attOf(event.id, S.me.id);
    const notice = Object.assign({ sent_at: new Date().toISOString(), decision: null }, n);
    if (a) return api.update('attendance', a.id, { notice });
    return api.insert('attendance', { team_id: S.teamId, event_id: event.id, member_id: S.me.id, notice });
  }, 'Aviso enviado');
}

export function decideNotice(att, decision) {
  return run(() => api.update('attendance', att.id, { notice: Object.assign({}, att.notice, { decision, decided_at: new Date().toISOString(), decided_by: S.me.id }) }), 'Respuesta registrada');
}

// Rodaje: grabar los videos de quien no vino (7.3) o reprogramarlos (5.10).
export function recordVideos(event, videoIds) {
  return run(async () => {
    for (const id of videoIds) {
      const v = S.data.videos.find((x) => x.id === id);
      if (!S.data.tasks.find((t) => t.video_id === id && t.kind === 'rodaje')) {
        await api.insert('tasks', { team_id: S.teamId, project_id: v.project_id, video_id: id, kind: 'rodaje', done_by: S.me.id, done_at: new Date().toISOString() });
      }
    }
  }, 'Rodaje registrado');
}

export function reprogram(event, videoIds, date, time) {
  return run(async () => {
    const starts = at(date, time).toISOString();
    let target = S.data.events.find((e) => e.kind === 'rodaje' && e.project_id === event.project_id && e.starts_at === starts);
    if (target) await api.update('events', target.id, { video_ids: Array.from(new Set(target.video_ids.concat(videoIds))) });
    else await api.insert('events', { team_id: S.teamId, project_id: event.project_id, kind: 'rodaje', starts_at: starts, tolerance_min: 45, video_ids: videoIds });
    await api.update('events', event.id, { video_ids: event.video_ids.filter((id) => videoIds.indexOf(id) === -1) });
  }, 'Videos reprogramados');
}

export const setTolerance = (event, minutes) => run(() => api.update('events', event.id, { tolerance_min: minutes }), 'Tolerancia actualizada');

// ---------- Guillermo (colaborador de preproducción al 80 %) ----------
export function hireGuillermo(event) {
  const other = partners().find((m) => m.id !== S.me.id);
  return run(() => api.insert('hires', { team_id: S.teamId, project_id: event.project_id, event_id: event.id, hired_by: S.me.id, present: other.id, pct: 80, status: 'pendiente' }), 'Contratación enviada');
}
export const decideHire = (h, status) => run(() => api.update('hires', h.id, { status, decided_at: new Date().toISOString() }), status === 'aceptada' ? 'Guillermo contratado para esta reunión' : status === 'cancelada' ? 'Contratación cancelada' : 'Contratación rechazada');
export const hireFor = (eventId, status = 'aceptada') => S.data.hires.find((h) => h.event_id === eventId && h.status === status) || null;
export const hireOpen = (eventId) => S.data.hires.find((h) => h.event_id === eventId && (h.status === 'pendiente' || h.status === 'aceptada')) || null;
// Reunión en la que se repartió un video (para saber si ahí trabajó Guillermo).
export const meetingOf = (videoId) => { const v = S.data.videos.find((x) => x.id === videoId); return v ? rMeetingOf(v, ctx(v.project_id)) : null; };
// Rodaje nuevo para videos que se quedaron sin rodaje (por ejemplo, si se canceló).
export const newRodaje = (projectId, videoIds, date, time) => run(() => api.insert('events', { team_id: S.teamId, project_id: projectId, kind: 'rodaje', status: 'activo', starts_at: at(date, time).toISOString(), tolerance_min: 45, video_ids: videoIds }), 'Rodaje programado');

// ---------- Cierre del proyecto (6.2 y liquidación) ----------
export function sendSettlement(p) {
  const pay = payouts(p, ctx(p.id));
  const amounts = Object.fromEntries(Object.entries(pay.porMiembro).map(([k, v]) => [k, Math.round(v.total * 100) / 100]));
  return run(() => api.update('projects', p.id, { settlement: { sent_at: new Date().toISOString(), sent_by: S.me.id, amounts, total: pay.pagado } }), 'Liquidación enviada');
}
export const confirmSettlement = (p) => run(() => api.update('projects', p.id, { settlement: Object.assign({}, p.settlement, { confirmed_at: new Date().toISOString(), confirmed_by: S.me.id, observation: null }) }), 'Liquidación confirmada');
export const observeSettlement = (p, text) => run(() => api.update('projects', p.id, { settlement: Object.assign({}, p.settlement, { sent_at: null, observation: { text, by: S.me.id, at: new Date().toISOString() } }) }), 'Observación enviada');
export const paySettlement = (p, proof) => run(() => api.update('projects', p.id, { status: 'cerrado', settlement: Object.assign({}, p.settlement, { paid_at: new Date().toISOString(), proof: proof || null }) }), 'Proyecto cerrado');

// ---------- Historial ----------
export const requestCorrection = (logId, text) => run(() => api.insert('corrections', { team_id: S.teamId, log_id: logId, requested_by: S.me.id, text }), 'Corrección pedida');
export const decideCorrection = (c, status) => run(() => api.update('corrections', c.id, { status, decided_by: S.me.id, decided_at: new Date().toISOString() }), status === 'aprobada' ? 'Corrección aprobada' : 'Corrección rechazada');

export async function uploadPhoto(file) { return api.upload(S.teamId, file); }
export const fileUrl = (p) => api.fileUrl(p);

// ---------- Demo ----------
export const isDemo = () => api.mode === 'demo';
export function demoUsers() { return isDemo() ? api.db.users : []; }
export async function demoSwitch(userId) { api.switchUser(userId); S.session = api.session(); await loadTeams(); emit(); }
export function demoReset() { api.reset(); location.hash = '#/'; location.reload(); }

// ---------- Utilidades de lectura ----------
export function videoCtx(v) { return videoState(v, ctx(v.project_id)); }
export function eventStatus(e, memberId, now) { return memberStatus(e, memberId, ctx(e.project_id), now); }
export { attOf, limaDate };
