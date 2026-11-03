import test from 'node:test';
import assert from 'node:assert/strict';
import { setRules, payouts, streakEvents, canMark, canUndo, canUndoReview, canUndoRedeliver, videoState, deadlines, at, limaTime, limaDate } from '../js/rules.js';

// 1.4 · Entregas al límite. Video de Socio (recibe apoyo) que publica el sáb 21 nov 2026:
// apoyo hasta jue 19, 21:00 · por su cuenta hasta vie 20, 08:00 · en riesgo hasta 12:00 · corregir hasta 17:00 · final 23:59.
setRules({});
const W = { id: 'W', name: 'Williams', role: 'admin', apoyo: false, active: true };
const S = { id: 'S', name: 'Socio', role: 'socio', apoyo: true, active: true };
const P = { id: 'P', client: 'PerteneSer', budget: 1000, videos_total: 16 };
const T = (d, h) => at(d, h);
const iso = (d, h) => T(d, h).toISOString();
const R = { montaje: 10, acabado: 15 };

function one(extra = {}) {
  const v = Object.assign({ id: 'v7', num: 7, project_id: 'P', owner: 'S', publish_date: '2026-11-21' }, extra);
  return {
    v,
    c: { members: [W, S], projects: [P], videos: [v], events: [], attendance: [], hires: [], claims: [],
      tasks: [{ id: 'r', video_id: 'v7', kind: 'rodaje', done_by: 'S', done_at: iso('2026-11-16', '11:00') }] }
  };
}
const hhmm = (d) => limaDate(d) + ' ' + limaTime(d);
const pay = (c, now, id) => { const p = payouts(P, c, now); return { paid: (p.porMiembro[id] || { post: 0 }).post, wait: p.espera[id] || 0 }; };
const pts = (id, c, now) => streakEvents(id, c, now).filter((e) => /video 7/i.test(e.why)).reduce((a, e) => a + e.pts, 0);

test('1.4 · plazos: apoyo jue 21:00, por su cuenta vie 08:00, en riesgo hasta 12:00, corregir 17:00, final 23:59', () => {
  const { v } = one();
  const d = deadlines(v, S, {});
  assert.equal(hhmm(d.apoyoDue), '2026-11-19 21:00');
  assert.equal(hhmm(d.selfDue), '2026-11-20 08:00');
  assert.equal(hhmm(d.autoDue), '2026-11-20 12:00');
  assert.equal(hhmm(d.fixDue), '2026-11-20 17:00');
  assert.equal(hhmm(d.finalDue), '2026-11-20 23:59');
  assert.equal(hhmm(deadlines(Object.assign({}, v, { owner: 'W' }), W, {}).finalDue), '2026-11-20 23:59', 'videos propios también a las 23:59');
  // Plazo propio del cliente y montaje adelantado por un choque
  setRules({ cli: { PerteneSer: 3 } });
  assert.equal(hhmm(deadlines(v, S, { client: 'PerteneSer' }).apoyoDue), '2026-11-18 21:00');
  assert.equal(hhmm(deadlines(v, S, { client: 'Otro' }).apoyoDue), '2026-11-19 21:00');
  setRules({});
  assert.equal(hhmm(deadlines(Object.assign({}, v, { apoyo_due: iso('2026-11-18', '21:00') }), S, {}).apoyoDue), '2026-11-18 21:00');
});

test('1.4 · con apoyo: el montaje queda en espera (S/ 25) y se paga cuando el administrador termina el final; +1 de racha', () => {
  const { v, c } = one();
  const now = T('2026-11-19', '20:30');
  assert.equal(canMark(v, 'montaje', S, c, now).ok, true);
  c.tasks.push({ id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'S', done_at: now.toISOString() });
  assert.equal(videoState(v, c, now).phase, 'apoyo');
  assert.deepEqual(pay(c, now, 'S'), { paid: 0, wait: R.montaje + R.acabado });
  assert.equal(canMark(v, 'acabado', S, c, now).ok, false, 'el final lo hace el administrador');
  assert.equal(canMark(v, 'acabado', W, c, now).apoyo, true);
  c.tasks.push({ id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'W', done_at: iso('2026-11-20', '15:00') });
  const later = T('2026-11-20', '16:00');
  assert.deepEqual(pay(c, later, 'S'), { paid: 25, wait: 0 });
  assert.equal(pts('S', c, later), 1);
  assert.equal(pts('W', c, later), 0, 'el apoyo no suma');
});

test('1.4 · por su cuenta: entrega el video completo, queda por revisar; aprobado cobra S/ 25 y 0 puntos; sin revisar se aprueba sola', () => {
  const { v, c } = one();
  const now = T('2026-11-19', '23:00');
  assert.equal(videoState(v, c, now).phase, 'solo');
  c.tasks.push({ id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'S', done_at: iso('2026-11-19', '23:30') });
  const t2 = T('2026-11-20', '07:40');
  assert.equal(canMark(v, 'acabado', S, c, t2).self, true);
  const ac = { id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'S', done_at: t2.toISOString(), review: 'pendiente' };
  c.tasks.push(ac);
  assert.equal(videoState(v, c, t2).phase, 'revision');
  assert.equal(canMark(v, 'acabado', W, c, t2).toReview, true);
  assert.deepEqual(pay(c, t2, 'S'), { paid: 0, wait: 25 });
  // Sin revisar a las 23:59: se aprueba sola
  assert.deepEqual(pay(c, T('2026-11-21', '00:05'), 'S'), { paid: 25, wait: 0 });
  // Aprobada
  Object.assign(ac, { review: 'aprobada', review_at: iso('2026-11-20', '09:00'), review_by: 'W' });
  assert.deepEqual(pay(c, T('2026-11-20', '09:01'), 'S'), { paid: 25, wait: 0 });
  assert.equal(pts('S', c, T('2026-11-21', '10:00')), 0);
  assert.equal(videoState(v, c, T('2026-11-20', '09:01')).delivered, true);
});

test('1.4 · pedir cambios: corrige hasta las 17:00; si no, pasa al administrador (−3 al socio, +3 al administrador al entregarlo)', () => {
  const { v, c } = one();
  c.tasks.push({ id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'S', done_at: iso('2026-11-19', '23:30') });
  const ac = { id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'S', done_at: iso('2026-11-20', '07:40'), review: 'cambios', review_round: 1, review_at: iso('2026-11-20', '09:00'), review_by: 'W', review_note: 'Audio' };
  c.tasks.push(ac);
  const t = T('2026-11-20', '10:00');
  assert.equal(videoState(v, c, t).phase, 'cambios');
  assert.equal(canMark(v, 'acabado', S, c, t).fix, true);
  assert.deepEqual(pay(c, t, 'S'), { paid: 0, wait: 25 });
  const late = T('2026-11-20', '17:01');
  const st = videoState(v, c, late);
  assert.equal(st.post.handoff, true);
  assert.equal(st.ownMo.id, 'm', 'su montaje queda bloqueado');
  assert.deepEqual(pay(c, late, 'S'), { paid: 0, wait: 0 });
  assert.equal(pts('S', c, late), -3);
  assert.equal(canMark(v, 'montaje', W, c, late).ok, true);
  // El administrador lo hace: su montaje reemplaza al del socio
  ac.void = true; c.tasks.find((x) => x.id === 'm').void = true;
  c.tasks.push({ id: 'm2', video_id: 'v7', kind: 'montaje', done_by: 'W', done_at: iso('2026-11-20', '18:00') });
  c.tasks.push({ id: 'a2', video_id: 'v7', kind: 'acabado', done_by: 'W', done_at: iso('2026-11-20', '22:00') });
  const end = T('2026-11-21', '10:00');
  assert.deepEqual(pay(c, end, 'W'), { paid: 25, wait: 0 });
  assert.equal(pts('W', c, end), 3);
  assert.equal(pts('S', c, end), -3);
});

test('1.4 · rechazo y automático a las 12:00', () => {
  const { v, c } = one();
  // Sin entrega completa a las 12:00 → pasa solo al administrador
  c.tasks.push({ id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'S', done_at: iso('2026-11-20', '06:00') });
  assert.equal(videoState(v, c, T('2026-11-20', '09:00')).phase, 'riesgo');
  assert.equal(canMark(v, 'montaje', W, c, T('2026-11-20', '09:00')).claim, true);
  assert.equal(canMark(v, 'acabado', S, c, T('2026-11-20', '11:59')).ok, true, 'aún puede entregar mientras nadie lo tome');
  const noon = T('2026-11-20', '12:01');
  assert.equal(videoState(v, c, noon).post.handoffWhy, 'auto');
  assert.equal(canMark(v, 'acabado', S, c, noon).gone, true);
  // Rechazo después de las 17:00 → pasa directo
  const b = one();
  b.c.tasks.push({ id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'S', done_at: iso('2026-11-19', '23:00') });
  b.c.tasks.push({ id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'S', done_at: iso('2026-11-20', '07:00'), review: 'rechazada', review_at: iso('2026-11-20', '18:00'), review_by: 'W' });
  assert.equal(videoState(b.v, b.c, T('2026-11-20', '18:05')).post.handoffWhy, 'rechazo');
});

test('1.4 · deshacer: 10 min y nunca después del plazo de esa acción', () => {
  const { v, c } = one();
  const m = { id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'S', done_at: iso('2026-11-19', '20:55') };
  c.tasks.push(m);
  assert.equal(canUndo(m, S, c, T('2026-11-19', '20:59')), true);
  assert.equal(canUndo(m, S, c, T('2026-11-19', '21:01')), false, 'pasó el plazo del apoyo');
  const m2 = Object.assign({}, m, { done_at: iso('2026-11-19', '15:00') });
  assert.equal(canUndo(m2, S, c, T('2026-11-19', '15:09')), true);
  assert.equal(canUndo(m2, S, c, T('2026-11-19', '15:11')), false, 'más de 10 min');
  // Decisión del administrador
  const ac = { id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'S', done_at: iso('2026-11-20', '07:00'), review: 'aprobada', review_at: iso('2026-11-20', '23:55'), review_by: 'W' };
  assert.equal(canUndoReview(ac, W, c, T('2026-11-20', '23:58')), true);
  assert.equal(canUndoReview(ac, W, c, T('2026-11-21', '00:01')), false, 'venció la revisión');
  assert.equal(canUndoReview(ac, S, c, T('2026-11-20', '23:58')), false, 'solo quien decidió');
  // Entrega corregida
  const fx = { id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'S', done_at: iso('2026-11-20', '07:00'), review: 'pendiente', review_round: 1, redelivered_at: iso('2026-11-20', '16:55') };
  assert.equal(canUndoRedeliver(fx, S, c, T('2026-11-20', '16:59')), true);
  assert.equal(canUndoRedeliver(fx, S, c, T('2026-11-20', '17:01')), false);
  assert.equal(canUndo(fx, S, c, T('2026-11-20', '16:59')), false, 'la corrección se deshace aparte');
  assert.equal(canUndo(m, W, c, T('2026-11-25', '10:00')), true, 'el administrador desmarca tareas siempre');
});

test('1.4 · la suma sigue cuadrando: cuatro videos por los cuatro caminos', () => {
  const v = (n, owner) => ({ id: 'v' + n, num: n, project_id: 'P', owner, publish_date: '2026-11-21' });
  const videos = [v(1, 'W'), v(2, 'S'), v(3, 'S'), v(4, 'S')];
  const tasks = [];
  const add = (vid, kind, by, d, h, x = {}) => tasks.push(Object.assign({ id: vid + kind + by, video_id: vid, kind, done_by: by, done_at: iso(d, h) }, x));
  for (const x of videos) { add(x.id, 'guion', x.owner, '2026-11-14', '10:00'); add(x.id, 'storyboard', x.owner, '2026-11-14', '11:00'); add(x.id, 'rodaje', x.owner, '2026-11-16', '10:00'); }
  add('v1', 'montaje', 'W', '2026-11-19', '10:00'); add('v1', 'acabado', 'W', '2026-11-20', '20:00');
  add('v2', 'montaje', 'S', '2026-11-19', '18:00'); add('v2', 'acabado', 'W', '2026-11-20', '20:00'); // apoyo
  add('v3', 'montaje', 'S', '2026-11-19', '23:00'); add('v3', 'acabado', 'S', '2026-11-20', '07:00', { review: 'aprobada', review_at: iso('2026-11-20', '09:00'), review_by: 'W' });
  add('v4', 'montaje', 'S', '2026-11-20', '06:00', { void: true }); add('v4', 'montaje', 'W', '2026-11-20', '13:00'); add('v4', 'acabado', 'W', '2026-11-20', '22:00');
  const c = { members: [W, S], projects: [P], videos, tasks, events: [], attendance: [], hires: [], claims: [] };
  const p = payouts(Object.assign({}, P, { videos_total: 4, budget: 250 }), c, T('2026-11-22', '10:00'));
  assert.equal(Math.round(p.pagado * 100) / 100, 250);
  const tot = (id) => Math.round(p.porMiembro[id].total * 100) / 100;
  assert.equal(tot('W') + tot('S'), 250);
  assert.equal(Math.round(p.porMiembro.S.post * 100) / 100, 50, 'S cobra el video 2 (apoyo) y el 3 (aprobado)');
  assert.equal(Math.round(p.porMiembro.W.post * 100) / 100, 50, 'W cobra el 1 (suyo) y el 4 (pasó a él)');
});

test('1.4 · entrega vencida: nunca se bloquea; tarde −3, sin entregar −3 (−4 si la tomó), reprogramar vencida −3', () => {
  const { v, c } = one();
  const late = T('2026-11-21', '09:00'); // pasó el final (vie 20, 23:59) y nadie lo tomó: pasó solo a las 12:00
  const cm = canMark(v, 'montaje', W, c, late);
  assert.equal(cm.ok, true, 'el administrador puede entregarlo igual');
  assert.equal(cm.late, true);
  assert.equal(videoState(v, c, late).overdue, true);
  assert.equal(pts('W', c, late), -3, 'sin entregar a tiempo');
  c.tasks.push({ id: 'm2', video_id: 'v7', kind: 'montaje', done_by: 'W', done_at: iso('2026-11-21', '09:10') });
  c.tasks.push({ id: 'a2', video_id: 'v7', kind: 'acabado', done_by: 'W', done_at: iso('2026-11-21', '10:00') });
  assert.equal(pts('W', c, T('2026-11-21', '11:00')), -3, 'entregado tarde');
  assert.equal(canUndo(c.tasks[2], W, c, T('2026-11-21', '10:05')), true);
  // Tomado y sin entregar: −4; si reprograma la entrega vencida: −3 (en lugar de −4)
  const b = one();
  b.c.claims.push({ id: 'cl', video_id: 'v7', kind: 'montaje', member_id: 'W', status: 'activa', created_at: iso('2026-11-20', '09:00'), limit_at: iso('2026-11-20', '23:59') });
  assert.equal(pts('W', b.c, T('2026-11-21', '09:00')), -4);
  b.v.reprog = [{ from: '2026-11-21', to: '2026-11-24', at: iso('2026-11-21', '09:30'), by: 'W', late: true, charge: 'W' }];
  b.v.publish_date = '2026-11-24';
  b.v.handoff = { at: iso('2026-11-20', '09:00'), why: 'tomado' };
  b.c.claims[0].limit_at = iso('2026-11-23', '23:59');
  assert.equal(pts('W', b.c, T('2026-11-21', '10:00')), -3);
  assert.equal(videoState(b.v, b.c, T('2026-11-21', '10:00')).post.handoff, true, 'después de reprogramar sigue siendo del administrador');
  assert.equal(pts('S', b.c, T('2026-11-21', '10:00')), -3, 'los −3 del socio se quedan');
});

test('1.4 · colaborador: los socios no marcan sus videos; el excedente a medias reparte el descuento y la suma cuadra', () => {
  const { v, c } = one();
  const E = { id: 'E', name: 'Editor', role: 'colaborador', active: true };
  c.members.push(E);
  c.jobs = [{ id: 'J', member_id: 'E', project_id: 'P', video_ids: ['v7'], price: 40, payer: 'half', status: 'activo' }];
  assert.equal(canMark(v, 'montaje', S, c, T('2026-11-18', '10:00')).colab, true);
  assert.equal(canMark(v, 'acabado', W, c, T('2026-11-18', '10:00')).ok, false);
  assert.equal(videoState(v, c, T('2026-11-18', '10:00')).phase, 'colab');
  c.tasks.push({ id: 'm', video_id: 'v7', kind: 'montaje', done_by: 'E', done_at: iso('2026-11-18', '10:00') });
  c.tasks.push({ id: 'a', video_id: 'v7', kind: 'acabado', done_by: 'E', done_at: iso('2026-11-20', '10:00') });
  const P1 = Object.assign({}, P, { videos_total: 1, budget: 62.5 });
  const p = payouts(P1, c, T('2026-11-22', '10:00'));
  assert.equal(Math.round(p.porMiembro.E.total * 100) / 100, 40);
  assert.equal(Math.round(Object.values(p.porMiembro).reduce((a, m) => a + m.total, 0) * 100) / 100, Math.round(p.pagado * 100) / 100, 'el excedente sale de los socios: la suma no cambia');
  assert.equal(Math.round((p.porMiembro.W.total) * 100) / 100, -7.5, 'Williams pone la mitad del excedente (S/ 7.50)');
});
