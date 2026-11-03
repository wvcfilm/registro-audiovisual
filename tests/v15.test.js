import test from 'node:test';
import assert from 'node:assert/strict';
import { setRules, payouts, streakEvents, canMark, videoState, dl, modeOf, at, limaTime, limaDate, leaderAway } from '../js/rules.js';

// 1.5 · Edición entre socios sin apoyo. Video de Ana (sin apoyo) que publica el sáb 21 nov 2026:
// montaje vie 20 12:00 (aviso) · final 18:00 · revisión 19:00 · corrección 21:00 · desde las 18:00 el otro lo toma hasta las 23:59.
setRules({});
const W = { id: 'W', name: 'Williams', role: 'admin', apoyo: false, active: true, user_id: 'uw' };
const A = { id: 'A', name: 'Ana', role: 'socio', apoyo: false, active: true, user_id: 'ua' };
const S = { id: 'S', name: 'Socio', role: 'socio', apoyo: true, active: true, user_id: 'us' };
const P = { id: 'P', client: 'PerteneSer', budget: 1000, videos_total: 16 };
const T = (d, h) => at(d, h);
const iso = (d, h) => T(d, h).toISOString();
const hhmm = (d) => limaDate(d) + ' ' + limaTime(d);

function ctx(owner = 'A', members = [W, A], extra = {}) {
  const v = Object.assign({ id: 'v7', num: 7, project_id: 'P', owner, publish_date: '2026-11-21' }, extra);
  return { v, c: { members, projects: [P], videos: [v], events: [], attendance: [], hires: [], claims: [], jobs: [],
    tasks: [{ id: 'r', video_id: 'v7', kind: 'rodaje', done_by: owner, done_at: iso('2026-11-16', '11:00') }] } };
}
const add = (c, kind, by, d, h, x = {}) => c.tasks.push(Object.assign({ id: kind + by, video_id: 'v7', kind, done_by: by, done_at: iso(d, h) }, x));
const pts = (id, c, now) => streakEvents(id, c, now).filter((e) => /video 7/i.test(e.why)).reduce((a, e) => a + e.pts, 0);
const post = (c, now, id) => { const p = payouts(P, c, now); return { paid: (p.porMiembro[id] || { post: 0 }).post, wait: p.espera[id] || 0 }; };

test('1.5 · modos: sin apoyo es pareja; el líder solo es pareja si hay un socio sin apoyo', () => {
  const { v, c } = ctx('A');
  assert.equal(modeOf(v, c), 'pareja');
  assert.equal(modeOf(Object.assign({}, v, { owner: 'W' }), c), 'pareja');
  const c2 = ctx('W', [W, S]).c;
  assert.equal(modeOf(c2.videos[0], c2), 'lider', 'con socio con apoyo el líder entrega hasta las 23:59');
  assert.equal(hhmm(dl(c2.videos[0], c2).finalDue), '2026-11-20 23:59');
  const c3 = ctx('S', [W, S]).c;
  assert.equal(modeOf(c3.videos[0], c3), 'apoyo');
  // El apoyo se fija en el video al grabarse
  const c4 = ctx('S', [W, Object.assign({}, S, { apoyo: false })], { apoyo_fixed: true }).c;
  assert.equal(modeOf(c4.videos[0], c4), 'apoyo', 'un video ya grabado sigue con sus reglas');
});

test('1.5 · plazos pareja y fases', () => {
  const { v, c } = ctx();
  const d = dl(v, c);
  assert.equal(hhmm(d.montajeDue), '2026-11-20 12:00');
  assert.equal(hhmm(d.ownDue), '2026-11-20 18:00');
  assert.equal(hhmm(d.revDue), '2026-11-20 19:00');
  assert.equal(hhmm(d.fixDue), '2026-11-20 21:00');
  assert.equal(hhmm(d.finalDue), '2026-11-20 23:59');
  assert.equal(videoState(v, c, T('2026-11-20', '10:00')).phase, 'p_mon');
  assert.equal(videoState(v, c, T('2026-11-20', '13:00')).phase, 'p_fin', 'a las 12:00 solo sale el aviso');
  assert.equal(videoState(v, c, T('2026-11-20', '18:30')).phase, 'p_tomar');
  assert.equal(canMark(v, 'montaje', A, c, T('2026-11-20', '18:30')).ok, true, 'el dueño aún puede entregar mientras nadie lo tome');
  assert.equal(canMark(v, 'montaje', W, c, T('2026-11-20', '17:00')).claim, undefined, 'antes de las 18:00 nadie lo toma');
  assert.equal(canMark(v, 'montaje', W, c, T('2026-11-20', '18:30')).claim, true, 'desde las 18:00 el líder lo toma directo');
  const cs = ctx('W', [W, A, S]).c;
  assert.equal(canMark(cs.videos[0], 'montaje', S, cs, T('2026-11-20', '18:30')).claim, undefined, 'el socio con apoyo nunca toma la edición');
  assert.equal(canMark(cs.videos[0], 'montaje', A, cs, T('2026-11-20', '18:30')).claim, true, 'el socio sin apoyo toma el video del líder');
});

test('1.5 · entrega de Ana: revisión hasta 19:00 (se aprueba sola), dinero solo al aprobarse', () => {
  const { v, c } = ctx();
  add(c, 'montaje', 'A', '2026-11-20', '11:00');
  assert.deepEqual(post(c, T('2026-11-20', '12:00'), 'A'), { paid: 0, wait: 0 }, 'el montaje solo no paga');
  add(c, 'acabado', 'A', '2026-11-20', '17:40', { review: 'pendiente' });
  assert.equal(videoState(v, c, T('2026-11-20', '18:00')).phase, 'revision');
  assert.deepEqual(post(c, T('2026-11-20', '18:00'), 'A'), { paid: 0, wait: 25 });
  assert.equal(canMark(v, 'acabado', W, c, T('2026-11-20', '18:00')).toReview, true);
  assert.equal(videoState(v, c, T('2026-11-20', '19:01')).phase, 'aprobado', 'sin revisar a las 19:00 se aprueba sola');
  assert.deepEqual(post(c, T('2026-11-20', '19:01'), 'A'), { paid: 25, wait: 0 });
  assert.equal(pts('A', c, T('2026-11-21', '10:00')), 1, 'a tiempo +1');
});

test('1.5 · pedir cambios: corrige hasta las 21:00; si no, pasa al líder', () => {
  const { v, c } = ctx();
  add(c, 'montaje', 'A', '2026-11-20', '11:00');
  add(c, 'acabado', 'A', '2026-11-20', '17:40', { review: 'cambios', review_round: 1, review_at: iso('2026-11-20', '18:30'), review_by: 'W' });
  assert.equal(videoState(v, c, T('2026-11-20', '20:00')).phase, 'cambios');
  assert.equal(canMark(v, 'acabado', A, c, T('2026-11-20', '20:00')).fix, true);
  const s = videoState(v, c, T('2026-11-20', '21:01'));
  assert.equal(s.phase, 'pasado');
  assert.equal(s.inCharge, 'W');
  assert.equal(canMark(v, 'montaje', W, c, T('2026-11-20', '21:05')).ok, true);
  assert.equal(pts('A', c, T('2026-11-21', '10:00')), -3);
  // La corrección entregada se revisa hasta las 23:59
  const c2 = ctx().c;
  add(c2, 'montaje', 'A', '2026-11-20', '11:00');
  add(c2, 'acabado', 'A', '2026-11-20', '17:40', { review: 'pendiente', review_round: 1, redelivered_at: iso('2026-11-20', '20:30') });
  assert.equal(videoState(c2.videos[0], c2, T('2026-11-20', '22:00')).phase, 'revision');
});

test('1.5 · tomar desde las 18:00: el que toma cobra la edición completa (+3); al dueño −3', () => {
  const { v, c } = ctx();
  add(c, 'montaje', 'A', '2026-11-20', '11:00', { void: true });
  c.claims.push({ id: 'cl', video_id: 'v7', kind: 'montaje', member_id: 'W', created_at: iso('2026-11-20', '18:10'), limit_at: iso('2026-11-20', '23:59') });
  const now = T('2026-11-20', '18:20');
  const s = videoState(v, c, now);
  assert.equal(s.phase, 'pasado');
  assert.equal(s.inCharge, 'W');
  assert.equal(canMark(v, 'montaje', A, c, now).gone, true);
  add(c, 'montaje', 'W', '2026-11-20', '19:00');
  add(c, 'acabado', 'W', '2026-11-20', '23:00');
  const after = T('2026-11-21', '09:00');
  assert.deepEqual(post(c, after, 'W'), { paid: 25, wait: 0 });
  assert.equal(post(c, after, 'A').paid, 0);
  assert.equal(pts('W', c, after), 3);
  assert.equal(pts('A', c, after), -3);
  // Tomarlo y no entregarlo: −4
  const c2 = ctx().c;
  c2.claims.push({ id: 'cl', video_id: 'v7', kind: 'montaje', member_id: 'W', created_at: iso('2026-11-20', '18:10'), limit_at: iso('2026-11-20', '23:59') });
  assert.equal(streakEvents('W', c2, T('2026-11-21', '09:00')).reduce((a, e) => a + e.pts, 0), -4);
});

test('1.5 · Williams en pareja: entrega hasta las 18:00 sin revisión; tarde −3', () => {
  const { v, c } = ctx('W');
  add(c, 'montaje', 'W', '2026-11-20', '11:00');
  add(c, 'acabado', 'W', '2026-11-20', '18:30');
  const s = videoState(v, c, T('2026-11-20', '19:00'));
  assert.equal(s.delivered, true);
  assert.equal(s.phase, 'entregado');
  assert.equal(pts('W', c, T('2026-11-21', '10:00')), -3);
});

test('1.5 · Guillermo: 80/20 solo con apoyo; los demás ceden el 100 %. Storyboard repartido entre todos sin apoyo', () => {
  const hire = (by, present) => ({ id: 'h', event_id: 'e', hired_by: by, present, status: 'aceptada', pct: 80 });
  const base = (owner, by, present, members) => {
    const v = { id: 'v1', num: 1, project_id: 'P', owner, publish_date: '2026-11-21' };
    return { members, projects: [P], videos: [v], events: [], attendance: [], claims: [], jobs: [], hires: [hire(by, present)],
      tasks: [{ id: 'g', video_id: 'v1', kind: 'guion', done_by: present, done_at: iso('2026-11-10', '10:00'), hire_id: 'h' }] };
  };
  const g = 1000 / 16 * 0.125;
  let p = payouts(P, base('S', 'S', 'W', [W, S]));
  assert.ok(Math.abs(p.porMiembro.W.pre - g * 0.8) < 1e-9 && Math.abs(p.porMiembro.S.pre - g * 0.2) < 1e-9, 'socio con apoyo 80/20');
  p = payouts(P, base('W', 'W', 'S', [W, S]));
  assert.ok(Math.abs(p.porMiembro.S.pre - g) < 1e-9 && !p.porMiembro.W, 'el líder cede el 100 %');
  p = payouts(P, base('A', 'A', 'W', [W, A]));
  assert.ok(Math.abs(p.porMiembro.W.pre - g) < 1e-9, 'sin apoyo cede el 100 %');
  // Storyboard que nadie hizo, con tres socios sin apoyo: entre todos (el centavo extra al dueño)
  const B = { id: 'B', name: 'Beto', role: 'socio', apoyo: false, active: true, user_id: 'ub' };
  const v = { id: 'v1', num: 1, project_id: 'P', owner: 'A', publish_date: '2026-11-21' };
  const c = { members: [W, A, B], projects: [P], videos: [v], events: [], attendance: [], claims: [], jobs: [], hires: [],
    tasks: [{ id: 's', video_id: 'v1', kind: 'storyboard', done_by: 'A', done_at: iso('2026-11-15', '10:00'), split: true, split_with: 'W' }] };
  p = payouts(P, c);
  const sum = ['W', 'A', 'B'].reduce((a, id) => a + p.porMiembro[id].pre, 0);
  assert.ok(Math.abs(sum - g) < 1e-9, 'cuadra');
  assert.ok(p.porMiembro.A.pre >= p.porMiembro.B.pre);
});

test('1.5 · llegadas: si el líder aún no llegó, la del socio vale sola', () => {
  const e = { id: 'e', kind: 'reunion', status: 'activo', starts_at: iso('2026-11-10', '10:00'), tolerance_min: 45 };
  const c = { members: [W, A], attendance: [], hires: [] };
  assert.equal(leaderAway(e, c, T('2026-11-10', '09:55')), true);
  c.attendance.push({ event_id: 'e', member_id: 'W', arrived_at: iso('2026-11-10', '09:50') });
  assert.equal(leaderAway(e, c, T('2026-11-10', '09:55')), false);
});
