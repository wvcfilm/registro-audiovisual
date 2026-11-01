import test from 'node:test';
import assert from 'node:assert/strict';
import { payouts, streak, streakEvents, memberStatus, canMark, canUndo, band, meetingEnd, attendanceStatus, deliveries, contribution, addDays, at, rates, videoState } from '../js/rules.js';

// Escenario de noviembre: 16 videos, S/ 1,000. W y S tienen 8 videos cada uno.
// S recibe apoyo en el acabado (5.5). El montaje de uno de sus videos no llega (5.7).
function scenario() {
  const members = [
    { id: 'W', name: 'Williams', role: 'admin', apoyo: false },
    { id: 'S', name: 'Socio', role: 'socio', apoyo: true }
  ];
  const project = { id: 'P', budget: 1000, videos_total: 16 };
  const videos = [], tasks = [], events = [], attendance = [];
  let tid = 0;
  const done = (video_id, kind, by, iso) => tasks.push({ id: 't' + (++tid), project_id: 'P', video_id, kind, done_by: by, done_at: iso });
  const weeks = ['2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30'];
  let n = 0;
  weeks.forEach((meet, w) => {
    const rodaje = addDays(meet, 2);
    events.push({ id: 'R' + w, kind: 'reunion', starts_at: at(meet, '10:00').toISOString(), tolerance_min: 45 });
    events.push({ id: 'J' + w, kind: 'rodaje', starts_at: at(rodaje, '10:00').toISOString(), tolerance_min: 45 });
    const evR = events[events.length - 2], evJ = events[events.length - 1];
    evR.video_ids = []; evJ.video_ids = [];
    ['W', 'W', 'S', 'S'].forEach((owner) => {
      n++;
      const pub = addDays(meet, 10);
      const v = { id: 'v' + n, num: n, project_id: 'P', owner, publish_date: pub, pre_due: at(addDays(meet, 1), '21:00').toISOString() };
      videos.push(v); evR.video_ids.push(v.id); evJ.video_ids.push(v.id);
      const preLate = owner === 'S' && (n === 3 || n === 8);
      done(v.id, 'guion', owner, at(addDays(meet, preLate ? 1 : 0), preLate ? '22:15' : '11:30').toISOString());
      done(v.id, 'storyboard', owner, at(meet, '11:40').toISOString());
      done(v.id, 'rodaje', owner, at(rodaje, '11:40').toISOString());
      if (owner === 'W') {
        done(v.id, 'montaje', 'W', at(addDays(pub, -3), '18:00').toISOString());
        done(v.id, 'acabado', 'W', at(addDays(pub, -1), '20:10').toISOString());
      } else if (n === 4) {
        // video 4: el montaje de Socio no llegó → lo hace Williams
        done(v.id, 'montaje', 'W', at(addDays(pub, -2), '23:30').toISOString());
        done(v.id, 'acabado', 'W', at(addDays(pub, -1), '19:30').toISOString());
      } else {
        done(v.id, 'montaje', 'S', at(addDays(pub, -2), '20:41').toISOString());
        done(v.id, 'acabado', 'W', at(addDays(pub, -1), '19:00').toISOString());
      }
    });
  });
  for (const e of events) {
    attendance.push({ id: 'aW' + e.id, event_id: e.id, member_id: 'W', arrived_at: new Date(new Date(e.starts_at).getTime() - 2 * 60000).toISOString() });
    const late = e.id === 'J0' || e.id === 'J2';
    attendance.push({ id: 'aS' + e.id, event_id: e.id, member_id: 'S', arrived_at: new Date(new Date(e.starts_at).getTime() + (late ? 22 : 3) * 60000).toISOString() });
  }
  return { project, ctx: { members, videos, tasks, events, attendance } };
}

const NOW = new Date('2026-12-20T12:00:00-05:00');

test('tarifas por video de un servicio de S/ 1,000 por 16 videos', () => {
  const r = rates({ budget: 1000, videos_total: 16 });
  assert.equal(r.guion, 7.8125);
  assert.equal(r.rodaje, 21.875);
  assert.equal(r.montaje, 10);
  assert.equal(r.acabado, 15);
});

test('la liquidación cuadra exacto: W 525, S 475, total 1,000', () => {
  const { project, ctx } = scenario();
  const p = payouts(project, ctx, NOW);
  assert.equal(p.porMiembro.W.total, 525);
  assert.equal(p.porMiembro.S.total, 475);
  assert.equal(p.pagado, 1000);
  assert.equal(p.pendiente, 0);
  assert.equal(p.porMiembro.S.post, 175);
  assert.equal(p.porMiembro.W.post, 225);
});

test('apoyo en el acabado se le paga al dueño; montaje no entregado pasa al que lo hace', () => {
  const { ctx } = scenario();
  const v3 = ctx.videos.find((v) => v.num === 3);
  const v4 = ctx.videos.find((v) => v.num === 4);
  assert.equal(videoState(v3, ctx, NOW).apoyo, true);
  const s4 = videoState(v4, ctx, NOW);
  assert.equal(s4.reassigned, true);
  assert.equal(s4.apoyo, false);
});

test('racha: W 40 (24 entregas + 8 llegadas + 8 puntos de reunión); S suma 14 neto y nunca baja de cero', () => {
  const { ctx } = scenario();
  assert.equal(streak('W', ctx, NOW).pts, 40);
  assert.equal(streak('W', ctx, NOW).level.name, 'Imparable');
  const net = streakEvents('S', ctx, NOW).reduce((a, e) => a + e.pts, 0);
  assert.equal(net, 14);
  // las faltas de la primera semana chocan con el piso de cero (6.4), por eso termina más arriba
  assert.ok(streak('S', ctx, NOW).pts >= 8);
});

test('entregas propias: W 24 de 24, S 13 de 16 con 1 video perdido', () => {
  const { ctx } = scenario();
  assert.deepEqual(deliveries('W', ctx, NOW), { total: 24, onTime: 24, missed: 0 });
  assert.deepEqual(deliveries('S', ctx, NOW), { total: 16, onTime: 13, missed: 1 });
});

test('aporte real: W 41 de 64 tareas, S 23', () => {
  const { project, ctx } = scenario();
  const c = contribution(project, ctx, NOW);
  assert.equal(c.total, 64);
  assert.equal(c.units.W, 41);
  assert.equal(c.units.S, 23);
});

test('puntualidad y tolerancia (7.7)', () => {
  const e = { kind: 'rodaje', starts_at: '2026-11-11T10:00:00-05:00', tolerance_min: 45 };
  const arr = (hm) => ({ arrived_at: `2026-11-11T${hm}:00-05:00` });
  assert.equal(attendanceStatus(e, arr('10:10')).k, 'puntual');
  assert.equal(attendanceStatus(e, arr('10:22')).k, 'tarde');
  assert.equal(attendanceStatus(e, arr('10:50')).k, 'ausente');
  assert.equal(attendanceStatus(e, null, new Date('2026-11-11T10:46:00-05:00')).k, 'ausente');
});

test('avisos de inasistencia: a tiempo, fuera de plazo y fuerza mayor', () => {
  const e = { kind: 'rodaje', starts_at: '2026-11-12T10:00:00-05:00', tolerance_min: 45 };
  const n = (iso, extra) => ({ notice: Object.assign({ sent_at: iso, reason: 'normal' }, extra) });
  assert.equal(attendanceStatus(e, n('2026-11-09T09:00:00-05:00')).k, 'cancel_ok');
  assert.equal(attendanceStatus(e, n('2026-11-11T17:59:00-05:00')).k, 'cancel_ok');
  assert.equal(attendanceStatus(e, n('2026-11-11T19:00:00-05:00')).k, 'cancel_late');
  assert.equal(attendanceStatus(e, n('2026-11-11T19:00:00-05:00', { reason: 'fm', decision: 'accept' })).k, 'fm');
  assert.equal(attendanceStatus(e, n('2026-11-11T19:00:00-05:00', { reason: 'fm', decision: 'talk' })).k, 'cancel_late');
});

test('colaborador: el presupuesto cubre hasta S/ 25 por video y la suma sigue en S/ 1,000', () => {
  const { project, ctx } = scenario();
  ctx.members.push({ id: 'E', name: 'Editor', role: 'colaborador' });
  ctx.jobs = [{ member_id: 'E', project_id: 'P', price_per_video: 40 }];
  // el editor hace montaje y acabado de los videos 15 y 16 (de Socio)
  for (const num of [15, 16]) {
    const v = ctx.videos.find((x) => x.num === num);
    for (const t of ctx.tasks.filter((x) => x.video_id === v.id && (x.kind === 'montaje' || x.kind === 'acabado'))) t.done_by = 'E';
  }
  const p = payouts(project, ctx, NOW);
  assert.equal(p.porMiembro.E.total, 50);
  assert.equal(Math.round(p.excedente.E * 100) / 100, 30);
  const sum = Object.values(p.porMiembro).reduce((a, m) => a + m.total, 0);
  assert.equal(Math.round(sum * 100) / 100, 1000);
});

test('Guillermo al 80 %: el que asiste cobra el 80 % de la preproducción hecha por Guillermo; la suma sigue en S/ 1,000', () => {
  const { project, ctx } = scenario();
  // Semana 2 (videos 5-8): Socio contrató a Guillermo; Williams hizo con él los guiones y storyboards de los videos 7 y 8
  ctx.hires = [{ id: 'H1', event_id: 'R1', hired_by: 'S', present: 'W', pct: 80, status: 'aceptada' }];
  for (const num of [7, 8]) {
    const v = ctx.videos.find((x) => x.num === num);
    for (const t of ctx.tasks.filter((x) => x.video_id === v.id && (x.kind === 'guion' || x.kind === 'storyboard'))) { t.done_by = 'W'; t.hire_id = 'H1'; t.done_at = v.pre_due; }
  }
  const p = payouts(project, ctx, NOW);
  // 2 videos × 15.625 = 31.25 → 80 % = 25 para Williams, 6.25 se queda con Socio
  assert.equal(p.porMiembro.W.total, 525 + 25);
  assert.equal(p.porMiembro.S.total, 475 - 25);
  assert.equal(p.guillermo.S.amount, 25);
  assert.equal(p.guillermo.S.tasks, 4);
  assert.equal(p.pagado, 1000);
});

test('Guillermo: la asistencia del que lo contrata es "no requerida" y no suma ni resta racha', () => {
  const { ctx } = scenario();
  const base = streak('S', ctx, NOW).pts;
  ctx.hires = [{ id: 'H1', event_id: 'R1', hired_by: 'S', present: 'W', pct: 80, status: 'aceptada' }];
  ctx.attendance = ctx.attendance.filter((a) => !(a.event_id === 'R1' && a.member_id === 'S'));
  const e = ctx.events.find((x) => x.id === 'R1');
  assert.equal(memberStatus(e, 'S', ctx, NOW).k, 'no_req');
  assert.equal(memberStatus(e, 'W', ctx, NOW).k, 'puntual');
  // sin Guillermo, faltar a esa reunión restaría 5; con Guillermo no cambia nada (solo deja de sumar el +1 de llegar puntual)
  assert.ok(streak('S', ctx, NOW).pts >= base - 1);
});


test('1.1 · solo se marca lo que ya puede haber pasado', () => {
  const { ctx } = scenario();
  const W = ctx.members[0], S = ctx.members[1];
  // video nuevo de Socio en un rodaje de la semana próxima, sin nada hecho
  const meet = '2026-12-21', rod = '2026-12-23';
  ctx.events.push({ id: 'Rx', kind: 'reunion', starts_at: at(meet, '10:00').toISOString(), video_ids: ['vx'] });
  ctx.events.push({ id: 'Jx', kind: 'rodaje', starts_at: at(rod, '10:00').toISOString(), video_ids: ['vx'] });
  ctx.videos.push({ id: 'vx', num: 99, project_id: 'P', owner: 'S', publish_date: '2027-01-02' });
  const now = new Date('2026-12-21T12:00:00-05:00');
  const vx = ctx.videos.find((v) => v.id === 'vx');
  assert.equal(canMark(vx, 'guion', S, ctx, now).ok, true);
  assert.equal(canMark(vx, 'guion', W, ctx, now).ok, false); // aún no vence su plazo
  assert.equal(canMark(vx, 'rodaje', S, ctx, now).ok, false); // no es el día
  assert.equal(canMark(vx, 'montaje', S, ctx, now).ok, false); // no se grabó
  assert.equal(canMark(vx, 'acabado', W, ctx, now).ok, false); // no hay montaje
  // después del plazo (22 dic 18:00), Williams puede tomar la preproducción
  assert.equal(canMark(vx, 'guion', W, ctx, new Date('2026-12-22T18:01:00-05:00')).take, true);
  // el día del rodaje, con guion y storyboard y llegada confirmada
  ctx.tasks.push({ id: 'g', video_id: 'vx', kind: 'guion', done_by: 'S', done_at: '2026-12-21T11:00:00-05:00' });
  ctx.tasks.push({ id: 's', video_id: 'vx', kind: 'storyboard', done_by: 'S', done_at: '2026-12-21T11:30:00-05:00' });
  const day = new Date('2026-12-23T10:30:00-05:00');
  assert.equal(canMark(vx, 'rodaje', S, ctx, day).ok, false); // sin llegada
  ctx.attendance.push({ event_id: 'Jx', member_id: 'S', claimed_at: '2026-12-23T09:58:00-05:00' });
  assert.match(canMark(vx, 'rodaje', S, ctx, day).why, /confirmación/);
  ctx.attendance[ctx.attendance.length - 1].arrived_at = '2026-12-23T09:58:00-05:00';
  assert.equal(canMark(vx, 'rodaje', S, ctx, day).ok, true);
});

test('1.1 · deshacer: preproducción hasta su plazo; lo demás 10 minutos', () => {
  const { ctx } = scenario();
  const S = ctx.members[1];
  ctx.events.push({ id: 'Jx', kind: 'rodaje', starts_at: at('2026-12-23', '10:00').toISOString(), video_ids: ['vx'] });
  ctx.videos.push({ id: 'vx', num: 99, project_id: 'P', owner: 'S', publish_date: '2027-01-02' });
  const g = { id: 'g', video_id: 'vx', kind: 'guion', done_by: 'S', done_at: '2026-12-21T11:00:00-05:00' };
  assert.equal(canUndo(g, S, ctx, new Date('2026-12-22T17:59:00-05:00')), true);
  assert.equal(canUndo(g, S, ctx, new Date('2026-12-22T18:01:00-05:00')), false);
  const m = { id: 'm', video_id: 'vx', kind: 'montaje', done_by: 'S', done_at: '2026-12-28T20:00:00-05:00' };
  assert.equal(canUndo(m, S, ctx, new Date('2026-12-28T20:09:00-05:00')), true);
  assert.equal(canUndo(m, S, ctx, new Date('2026-12-28T20:11:00-05:00')), false);
});

test('1.1 · franjas de "Te toca" y fin de reunión', () => {
  const now = new Date('2026-11-10T12:00:00-05:00');
  assert.equal(band(new Date('2026-11-10T21:00:00-05:00'), now), 0);
  assert.equal(band(new Date('2026-11-09T21:00:00-05:00'), now), 0);
  assert.equal(band(new Date('2026-11-12T18:00:00-05:00'), now), 1);
  assert.equal(band(new Date('2026-11-15T18:00:00-05:00'), now), 2);
  const e = { starts_at: '2026-11-09T10:00:00-05:00', end_requested_at: '2026-11-09T12:30:00-05:00', ended_at: '2026-11-09T14:00:00-05:00' };
  assert.equal(meetingEnd(e).toISOString(), new Date('2026-11-09T12:30:00-05:00').toISOString());
  assert.equal(meetingEnd({ starts_at: '2026-11-09T10:00:00-05:00' }).toISOString(), new Date('2026-11-09T16:00:00-05:00').toISOString());
});
