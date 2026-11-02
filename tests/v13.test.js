import test from 'node:test';
import assert from 'node:assert/strict';
import { setRules, payouts, streakEvents, canMark, confirmDeadline, rsvpState, takeLimit, claimOf, at, ceilCent, limaTime, limaDate } from '../js/rules.js';

setRules({});
const W = { id: 'W', name: 'Williams', role: 'admin', apoyo: false };
const S = { id: 'S', name: 'Socio', role: 'socio', apoyo: true };
const P = { id: 'P', budget: 1000, videos_total: 16 };

// Semana de prueba: reunión lun 9 nov 10:00, rodaje mié 11 nov 10:00 (plazo de preproducción mar 10, 18:00).
function week() {
  const v = (n, owner) => ({ id: 'v' + n, num: n, project_id: 'P', owner, publish_date: '2026-11-20' });
  const videos = [v(1, 'W'), v(2, 'W'), v(3, 'S'), v(4, 'S')];
  const ids = videos.map((x) => x.id);
  const events = [
    { id: 'R', kind: 'reunion', status: 'activo', starts_at: at('2026-11-09', '10:00').toISOString(), tolerance_min: 45, video_ids: ids, created_at: '2026-11-01T10:00:00-05:00' },
    { id: 'J', kind: 'rodaje', status: 'activo', starts_at: at('2026-11-11', '10:00').toISOString(), tolerance_min: 45, video_ids: ids, created_at: '2026-11-01T10:00:00-05:00' }
  ];
  return { members: [W, S], videos, tasks: [], events, attendance: [], hires: [], claims: [] };
}
const T = (d, h) => at(d, h);

test('1.3 · plazo para confirmar: reunión 12 h antes; de madrugada pasa a las 23:59 del día anterior; rodaje 18:00 del día anterior', () => {
  const at10 = confirmDeadline({ kind: 'reunion', starts_at: at('2026-11-09', '10:00').toISOString() });
  assert.equal(limaDate(at10) + ' ' + limaTime(at10), '2026-11-08 22:00');
  const at14 = confirmDeadline({ kind: 'reunion', starts_at: at('2026-11-09', '14:00').toISOString() });
  assert.equal(limaDate(at14) + ' ' + limaTime(at14), '2026-11-08 23:59', '02:00 es madrugada');
  const at1659 = confirmDeadline({ kind: 'reunion', starts_at: at('2026-11-09', '16:59').toISOString() });
  assert.equal(limaDate(at1659) + ' ' + limaTime(at1659), '2026-11-08 23:59', '04:59 todavía es madrugada');
  const at17 = confirmDeadline({ kind: 'reunion', starts_at: at('2026-11-09', '17:00').toISOString() });
  assert.equal(limaDate(at17) + ' ' + limaTime(at17), '2026-11-09 05:00', '05:00 ya no es madrugada');
  const rod = confirmDeadline({ kind: 'rodaje', starts_at: at('2026-11-11', '10:00').toISOString() });
  assert.equal(limaDate(rod) + ' ' + limaTime(rod), '2026-11-10 18:00');
});

test('1.3 · no confirmar a tiempo resta 2; responder a tiempo (voy, no iré o Guillermo) no resta', () => {
  const c = week();
  const after = T('2026-11-12', '12:00');
  assert.equal(rsvpState(c.events[0], 'W', c, after).missed, true);
  const pts = (id) => streakEvents(id, c, after).filter((e) => /no confirmaste/.test(e.why)).reduce((a, e) => a + e.pts, 0);
  assert.equal(pts('W'), -4, 'reunión y rodaje sin confirmar');
  c.attendance.push({ id: 'a1', event_id: 'R', member_id: 'W', rsvp: 'voy', rsvp_at: T('2026-11-08', '20:00').toISOString(), arrived_at: T('2026-11-09', '09:58').toISOString() });
  c.attendance.push({ id: 'a2', event_id: 'J', member_id: 'W', notice: { sent_at: T('2026-11-10', '17:00').toISOString() } });
  assert.equal(pts('W'), 0);
  c.hires.push({ id: 'h', event_id: 'R', hired_by: 'S', present: 'W', status: 'pendiente', created_at: T('2026-11-08', '21:00').toISOString() });
  c.attendance.push({ id: 'a3', event_id: 'J', member_id: 'S', rsvp: 'voy', rsvp_at: T('2026-11-10', '18:30').toISOString() });
  assert.equal(pts('S'), -2, 'Guillermo a tiempo en la reunión; el rodaje lo confirmó tarde');
  // Un evento agendado después de su plazo no resta.
  c.events.push({ id: 'X', kind: 'reunion', status: 'activo', starts_at: T('2026-11-12', '09:00').toISOString(), video_ids: [], created_at: T('2026-11-11', '23:00').toISOString() });
  assert.equal(rsvpState(c.events[2], 'W', c, after).missed, false);
});

test('1.3 · Tomar = comprometerse: después del plazo y hasta 5 h antes del rodaje; solo marca quien lo tomó', () => {
  const c = week();
  const v3 = c.videos[2]; // de Socio
  assert.equal(canMark(v3, 'storyboard', W, c, T('2026-11-10', '17:00')).ok, false, 'antes del plazo es de Socio');
  const r1 = canMark(v3, 'storyboard', W, c, T('2026-11-10', '19:00'));
  assert.equal(r1.ok, false); assert.equal(r1.claim, true, 'se puede tomar');
  assert.equal(limaTime(takeLimit(v3, 'storyboard', c)), '05:00');
  assert.equal(canMark(v3, 'storyboard', S, c, T('2026-11-10', '19:00')).gone, true, 'el dueño ya no lo marca');
  c.claims.push({ id: 'c1', video_id: v3.id, kind: 'storyboard', member_id: 'W', rodaje_id: 'J', status: 'activa', limit_at: takeLimit(v3, 'storyboard', c).toISOString() });
  const r2 = canMark(v3, 'storyboard', W, c, T('2026-11-10', '23:00'));
  assert.equal(r2.ok, true); assert.equal(r2.claimed, true);
  assert.equal(canMark(v3, 'storyboard', W, c, T('2026-11-11', '05:01')).ok, false, 'pasó el límite');
  assert.equal(canMark(c.videos[3], 'guion', W, c, T('2026-11-11', '05:01')).claim, undefined, 'ya no se puede tomar');
});

test('1.3 · rescate +3 al entregar lo tomado; tomar y no entregar −4; reprogramar anula el compromiso', () => {
  const c = week();
  const lim = takeLimit(c.videos[2], 'guion', c).toISOString();
  c.claims.push({ id: 'c1', video_id: 'v3', kind: 'guion', member_id: 'W', rodaje_id: 'J', status: 'activa', limit_at: lim });
  c.claims.push({ id: 'c2', video_id: 'v4', kind: 'storyboard', member_id: 'W', rodaje_id: 'J', status: 'activa', limit_at: lim });
  c.tasks.push({ id: 't1', video_id: 'v3', kind: 'guion', done_by: 'W', done_at: T('2026-11-10', '22:00').toISOString() });
  const ev = streakEvents('W', c, T('2026-11-12', '12:00'));
  assert.equal(ev.find((e) => /Rescataste/.test(e.why)).pts, 3);
  assert.equal(ev.find((e) => /no lo entregaste/.test(e.why)).pts, -4);
  // Se reprograma el video 4 a otro rodaje: el compromiso viejo ya no cuenta.
  c.events[1].video_ids = ['v1', 'v2', 'v3'];
  c.events.push({ id: 'J2', kind: 'rodaje', status: 'activo', starts_at: T('2026-11-18', '10:00').toISOString(), video_ids: ['v4'], created_at: T('2026-11-11', '12:00').toISOString() });
  assert.equal(claimOf(c.videos[3], 'storyboard', c), null);
  const ev2 = streakEvents('W', c, T('2026-11-12', '12:00'));
  assert.equal(ev2.filter((e) => /no lo entregaste/.test(e.why)).length, 0);
});

test('1.3 · rodaje: sin guion no se graba; sin storyboard sí, y su valor se reparte mitad y mitad (centavo al dueño)', () => {
  const c = week();
  const now = T('2026-11-11', '10:30');
  c.attendance.push({ id: 'aW', event_id: 'J', member_id: 'W', arrived_at: T('2026-11-11', '09:58').toISOString() });
  c.tasks.push({ id: 'g1', video_id: 'v1', kind: 'guion', done_by: 'W', done_at: T('2026-11-09', '11:00').toISOString() });
  assert.equal(canMark(c.videos[1], 'rodaje', W, c, now).noGuion, true);
  const r = canMark(c.videos[0], 'rodaje', W, c, now);
  assert.equal(r.ok, true); assert.equal(r.split, true);
  c.tasks.push({ id: 'r1', video_id: 'v1', kind: 'rodaje', done_by: 'W', done_at: now.toISOString() });
  c.tasks.push({ id: 's1', video_id: 'v1', kind: 'storyboard', done_by: 'W', split: true, split_with: 'S', done_at: now.toISOString() });
  const pay = payouts(P, c, now);
  assert.equal(Math.round(pay.porMiembro.W.pre * 100) / 100, Math.round((7.8125 + 3.91) * 100) / 100);
  assert.equal(Math.round(pay.porMiembro.S.pre * 1e4) / 1e4, 3.9025);
  assert.equal(ceilCent(7.8125 / 2), 3.91);
  assert.equal(Math.abs(pay.pagado - (7.8125 * 2 + 21.875)) < 1e-9, true, 'la suma sigue exacta');
  const ev = streakEvents('W', c, T('2026-11-12', '12:00'));
  assert.equal(ev.find((e) => /video 1/.test(e.why)).pts, -3, 'al dueño se le cuenta como entrega vencida');
});
