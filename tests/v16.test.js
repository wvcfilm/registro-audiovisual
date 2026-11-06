import test from 'node:test';
import assert from 'node:assert/strict';

// 1.6 · Reloj y almacenamiento falsos para simular la app de práctica (DemoAPI) en Node.
const RealDate = Date;
let NOW = RealDate.parse('2026-11-08T09:00:00-05:00');
class FakeDate extends RealDate { constructor(...a) { if (a.length === 0) super(NOW); else super(...a); } static now() { return NOW; } }
globalThis.Date = FakeDate;
const setNow = (s) => { NOW = RealDate.parse(s + '-05:00'); };
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, key: (i) => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
Object.defineProperty(globalThis.localStorage, 'keys', { value: () => Object.keys(store) });
store['ra-practice'] = '1';

const R = await import('../js/rules.js');
const { api } = await import('../js/api.js');
R.setRules({});
const at = (d, h) => R.at(d, h).toISOString();

// ---------------- Reglas de fechas (puras) ----------------
test('1.6 · checkWeek: inicio, mismo día, 1 día con alerta, 18:00, dos rodajes el mismo día', () => {
  const now = new Date('2026-11-04T10:00:00-05:00');
  const project = { id: 'p', start_date: '2026-11-09' };
  const cw = (o) => R.checkWeek(Object.assign({ project, now, events: [] }, o));
  assert.match(cw({ rodajes: [{ date: '2026-11-09', time: '10:00' }] }).errors.r0, /desde el mar 10 nov/);
  assert.equal(cw({ rodajes: [{ date: '2026-11-10', time: '10:00' }] }).ok, true, 'rodaje un día después del inicio');
  assert.match(cw({ rodajes: [{ date: '2026-11-12', time: '10:00' }], meetings: [{ date: '2026-11-08', time: '10:00', rods: [0] }] }).errors.m0, /antes del inicio/);
  assert.match(cw({ rodajes: [{ date: '2026-11-12', time: '10:00' }], meetings: [{ date: '2026-11-12', time: '08:00', rods: [0] }] }).errors.m0, /1 día antes/);
  const one = cw({ rodajes: [{ date: '2026-11-12', time: '10:00' }], meetings: [{ date: '2026-11-11', time: '17:55', rods: [0] }] });
  assert.equal(one.ok, true); assert.equal(one.warns.m0, R.MSG_ONE_DAY);
  assert.match(cw({ rodajes: [{ date: '2026-11-12', time: '10:00' }], meetings: [{ date: '2026-11-11', time: '18:00', rods: [0] }] }).errors.m0, /18:00/);
  const two = cw({ rodajes: [{ date: '2026-11-12', time: '10:00' }], meetings: [{ date: '2026-11-10', time: '10:00', rods: [0] }] });
  assert.equal(two.ok, true); assert.match(two.info.m0, /Guion y storyboard hasta el mié 11 nov, 18:00/);
  assert.match(cw({ rodajes: [{ date: '2026-11-12', time: '10:00' }, { date: '2026-11-12', time: '16:00' }] }).errors.r1, /dos rodajes el mismo día/);
});
test('1.6 · checkWeek: una reunión para dos rodajes mide contra el primero; por separado en días seguidos ofrece juntarlas', () => {
  const now = new Date('2026-11-04T10:00:00-05:00');
  const project = { id: 'p', start_date: '2026-11-09' };
  const rods = [{ date: '2026-11-12', time: '10:00' }, { date: '2026-11-13', time: '10:00' }];
  const j = R.checkWeek({ project, now, rodajes: rods, meetings: [{ date: '2026-11-11', time: '10:00', rods: [0, 1] }] });
  assert.equal(j.ok, true); assert.equal(j.warns.m0, R.MSG_ONE_DAY, 'la alerta de 1 día va contra el primer rodaje');
  assert.match(R.checkWeek({ project, now, rodajes: rods, meetings: [{ date: '2026-11-11', time: '19:00', rods: [0, 1] }] }).errors.m0, /18:00 del mié 11/);
  const sep = R.checkWeek({ project, now, rodajes: rods, meetings: [{ date: '2026-11-10', time: '10:00', rods: [0] }, { date: '2026-11-12', time: '10:00', rods: [1] }] });
  assert.equal(sep.ok, false); assert.equal(sep.join, true); assert.match(sep.errors.m1, /No hay día libre para la segunda reunión/);
  const sep2 = R.checkWeek({ project, now, rodajes: rods, meetings: [{ date: '2026-11-10', time: '10:00', rods: [0] }, { date: '2026-11-11', time: '10:00', rods: [1] }] });
  assert.equal(sep2.ok, true, 'la segunda reunión puede ir el mié (antes del jue 18:00 y sin rodaje)');
});
test('1.6 · calendario: días apagados y con poco tiempo', () => {
  const now = new Date('2026-11-04T10:00:00-05:00');
  const project = { id: 'p', start_date: '2026-11-09' };
  const o = { project, now, events: [{ id: 'x', project_id: 'p', kind: 'rodaje', status: 'activo', starts_at: at('2026-11-19', '10:00'), video_ids: [] }], rodajes: [{ date: '2026-11-12', time: '10:00' }], meetings: [{ date: '', time: '10:00', rods: [0] }], idx: 0 };
  assert.equal(R.dayStatus('2026-11-03', 'rodaje', o).off, true, 'ya pasó');
  assert.equal(R.dayStatus('2026-11-09', 'rodaje', o).off, true, 'día de inicio');
  assert.equal(R.dayStatus('2026-11-19', 'rodaje', o).off, true, 'ya hay rodaje');
  assert.equal(R.dayStatus('2026-11-11', 'reunion', o).tight, true, '1 día antes: borde rojo');
  assert.equal(R.dayStatus('2026-11-10', 'reunion', o).off, false);
  assert.equal(R.dayStatus('2026-11-12', 'reunion', o).off, true, 'el día del rodaje');
  assert.equal(R.dayStatus('2026-11-08', 'reunion', o).off, true, 'antes del inicio');
  assert.equal(R.meetingFit(at('2026-11-11', '10:00'), at('2026-11-12', '10:00')), 'warn');
  assert.equal(R.meetingFit(at('2026-11-12', '09:00'), at('2026-11-12', '10:00')), 'block');
  assert.equal(R.meetingFit(at('2026-11-10', '10:00'), at('2026-11-12', '10:00')), 'ok');
});

// ---------------- Simulación completa en el modo práctica ----------------
const ids = {};
async function setup() {
  api.reset();
  api.db = { teams: [], users: [], who: null, members: [], projects: [], videos: [], tasks: [], events: [], attendance: [], hires: [], log: [], corrections: [], proposals: [], claims: [], jobs: [], job_items: [] };
  api.logId = 0;
  await api.verifyCode('w@x'); ids.uw = api.db.who;
  ids.team = await api.rpc('create_team', { team_name: 'Equipo', my_name: 'Williams' });
  const code = await api.rpc('create_invite', { t: ids.team, invite_name: 'Ana', invite_role: 'socio', gets_apoyo: true });
  await api.verifyCode('a@x'); ids.ua = api.db.who;
  await api.rpc('accept_invite', { code, my_name: 'Ana' });
  ids.W = api.db.members.find((m) => m.user_id === ids.uw).id;
  ids.A = api.db.members.find((m) => m.user_id === ids.ua).id;
  api.switchUser(ids.uw);
  ids.P = (await api.insert('projects', { team_id: ids.team, client: 'PerteneSer', name: 'Noviembre', budget: 1000, videos_total: 16, start_date: '2026-11-09', status: 'abierto', pct: R.DEFAULT_PCT })).id;
}
const as = (who) => api.switchUser(who === 'W' ? ids.uw : ids.ua);
const ctxNow = () => api.ctxFor(ids.P);
const proj = () => api.db.projects.find((p) => p.id === ids.P);
const mem = (id) => api.db.members.find((m) => m.id === id);
// Llegada de los dos al rodaje (como en la base: el rodaje se marca con la llegada confirmada).
async function arrive(rodId, day) {
  setNow(day + 'T09:59:00');
  for (const [w, id] of [['W', ids.W], ['A', ids.A]]) { as(w); await api.insert('attendance', { team_id: ids.team, event_id: rodId, member_id: id, claimed_at: at(day, '09:58'), arrived_at: at(day, '09:58'), confirmed_by: ids.W }); }
}
async function task(by, v, kind, when) { setNow(when); as(by === ids.W ? 'W' : 'A'); return api.insert('tasks', { team_id: ids.team, project_id: ids.P, video_id: v.id, kind, done_by: by }); }

test('1.6 · simulación: semana con 2 rodajes y 1 reunión, reparto 3 y 3, dinero exacto y puntos de reunión', async () => {
  setNow('2026-11-08T09:00:00');
  await setup();
  as('W');
  // Errores de la base (DemoAPI igual que guard_event): rodaje el día de inicio; reunión desde las 18:00 del día anterior.
  await assert.rejects(api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-09', '10:00') }], meets: [] }), /1 día después|desde el mar 10/);
  await assert.rejects(api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-12', '10:00') }], meets: [{ at: at('2026-11-11', '18:00'), rods: [0] }] }), /plazo de preproducción/);
  assert.equal(api.db.events.length, 0, 'lo que falla no deja nada a medias');
  const rids = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-12', '10:00') }, { at: at('2026-11-13', '10:00') }], meets: [{ at: at('2026-11-10', '10:00'), rods: [0, 1] }] });
  assert.equal(rids.length, 2);
  const mt = api.db.events.find((e) => e.kind === 'reunion');
  assert.deepEqual(mt.rodaje_ids, rids); assert.equal(mt.rodaje_id, rids[0]);
  await assert.rejects(api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-12', '17:00') }], meets: [] }), /dos rodajes el mismo día/);
  await assert.rejects(api.rpc('plan_week', { p: ids.P, rods: [], meets: [{ at: at('2026-11-11', '10:00'), rods: [rids[1]] }] }), /reunión sin finalizar/);
  // Reparto en la reunión: jue W, W, A · vie A, A, W (como store.reparto).
  setNow('2026-11-10T10:05:00');
  const owners = [[ids.W, ids.W, ids.A], [ids.A, ids.A, ids.W]];
  let num = 0;
  for (let t = 0; t < 2; t++) {
    const rod = api.db.events.find((e) => e.id === rids[t]);
    const vs = [];
    for (let i = 0; i < 3; i++) vs.push((await api.insert('videos', { team_id: ids.team, project_id: ids.P, num: ++num, publish_date: R.addDays(R.limaDate(rod.starts_at), 5 + i), owner: owners[t][i] })).id);
    await api.update('events', rod.id, { video_ids: rod.video_ids.concat(vs) });
    await api.update('events', mt.id, { video_ids: [...new Set(api.db.events.find((e) => e.id === mt.id).video_ids.concat(vs))] });
  }
  assert.equal(api.db.events.find((e) => e.id === mt.id).video_ids.length, 6, 'la reunión prepara los 6 videos');
  // Llegadas y guiones/storyboards durante la reunión.
  as('W'); await api.insert('attendance', { team_id: ids.team, event_id: mt.id, member_id: ids.W, claimed_at: at('2026-11-10', '09:58'), arrived_at: at('2026-11-10', '09:58') });
  as('A'); await api.insert('attendance', { team_id: ids.team, event_id: mt.id, member_id: ids.A, claimed_at: at('2026-11-10', '10:02'), arrived_at: at('2026-11-10', '10:02'), confirmed_by: ids.W });
  const vids = api.db.videos.slice().sort((a, b) => a.num - b.num);
  for (const v of vids) { await task(v.owner, v, 'guion', '2026-11-10T11:00:00'); await task(v.owner, v, 'storyboard', '2026-11-10T11:30:00'); }
  setNow('2026-11-10T13:00:00'); as('W'); await api.update('events', mt.id, { ended_at: at('2026-11-10', '12:45') });
  const c = ctxNow();
  const meetPts = (id) => R.streakEvents(id, c, new Date()).filter((e) => /Punto de reunión/.test(e.why)).length;
  assert.equal(meetPts(ids.W), 3, 'Williams: +1 por cada uno de sus 3 videos (de los dos rodajes)');
  assert.equal(meetPts(ids.A), 3, 'Ana: +1 por cada uno de sus 3 videos');
  // Cada tanda conserva su plazo.
  const dl = (v) => R.videoState(v, c, new Date()).d;
  assert.equal(R.fmtWhen(dl(vids[0]).preDue), 'mié 11 nov · 18:00');
  assert.equal(R.fmtWhen(dl(vids[3]).preDue), 'jue 12 nov · 18:00');
  // Rodajes, montaje y final de todos: el dinero de 6 videos cuadra exacto (6 × S/ 62.50).
  await arrive(rids[0], '2026-11-12'); await arrive(rids[1], '2026-11-13');
  for (const v of vids.slice(0, 3)) await task(v.owner, v, 'rodaje', '2026-11-12T11:00:00');
  for (const v of vids.slice(3)) await task(v.owner, v, 'rodaje', '2026-11-13T11:00:00');
  for (const v of vids) {
    const ow = mem(v.owner);
    const d0 = R.dl(v, ctxNow());
    if (ow.apoyo) { await task(v.owner, v, 'montaje', R.limaDate(d0.apoyoDue) + 'T' + '12:00:00'); await task(ids.W, v, 'acabado', R.limaDate(d0.finalDue) + 'T' + '15:00:00'); }
    else { await task(v.owner, v, 'montaje', R.limaDate(d0.finalDue) + 'T10:00:00'); await task(v.owner, v, 'acabado', R.limaDate(d0.finalDue) + 'T15:00:00'); }
  }
  setNow('2026-11-25T10:00:00');
  const pay = R.payouts(proj(), ctxNow(), new Date());
  const tot = Object.values(pay.porMiembro).reduce((a, x) => a + x.total, 0);
  assert.equal(Math.round(tot * 100), 6 * 6250, 'S/ 375.00 por 6 videos completos');
  assert.ok(vids.every((v) => R.videoState(v, ctxNow(), new Date()).delivered));
});

test('1.6 · simulación: mover rodaje y reunión juntos, reprogramar el día y la fecha de inicio', async () => {
  setNow('2026-11-08T09:00:00');
  await setup(); as('W');
  const [r1] = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-13', '10:00') }], meets: [{ at: at('2026-11-11', '10:00'), rods: [0] }] });
  const m1 = api.db.events.find((e) => e.kind === 'reunion');
  await assert.rejects(api.rpc('move_event', { e: r1, new_at: at('2026-11-11', '15:00') }), /reunión/, 'su reunión quedaría el mismo día');
  assert.equal(api.db.events.find((e) => e.id === r1).starts_at, at('2026-11-13', '10:00'), 'si falla no cambia nada');
  await api.rpc('move_event', { e: r1, new_at: at('2026-11-12', '10:00') });
  await api.rpc('move_event', { e: r1, new_at: at('2026-11-11', '10:00'), m: m1.id, m_at: at('2026-11-10', '09:00') });
  assert.equal(R.limaDate(api.db.events.find((e) => e.id === m1.id).starts_at), '2026-11-10');
  await assert.rejects(api.update('projects', ids.P, { start_date: '2026-11-11' }), /rodaje/);
  as('A'); await assert.rejects(api.update('projects', ids.P, { start_date: '2026-11-05' }), /líder/);
  as('W'); await api.update('projects', ids.P, { start_date: '2026-11-10' });
  const nid = await api.rpc('reprogram_day', { e: r1, new_at: at('2026-11-14', '10:00'), nota: 'lluvia' });
  assert.deepEqual(api.db.events.find((e) => e.id === m1.id).rodaje_ids, [nid]);
  assert.equal(api.db.events.find((e) => e.id === r1).status, 'reprogramado');
  // Con llegadas ya no se cambia la hora.
  setNow('2026-11-10T08:55:00');
  await api.insert('attendance', { team_id: ids.team, event_id: m1.id, member_id: ids.W, claimed_at: at('2026-11-10', '08:55'), arrived_at: at('2026-11-10', '08:55') });
  await assert.rejects(api.rpc('move_event', { e: m1.id, new_at: at('2026-11-10', '11:00') }), /llegadas/);
});

test('1.6 · simulación: corregir un registro (cadena, dinero, una sola vez, liquidación)', async () => {
  setNow('2026-11-08T09:00:00');
  await setup(); as('W');
  const [r1] = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-12', '10:00') }], meets: [{ at: at('2026-11-10', '10:00'), rods: [0] }] });
  const v1 = await api.insert('videos', { team_id: ids.team, project_id: ids.P, num: 1, publish_date: '2026-11-18', owner: ids.A });
  const v2 = await api.insert('videos', { team_id: ids.team, project_id: ids.P, num: 2, publish_date: '2026-11-18', owner: ids.A });
  await api.update('events', r1, { video_ids: [v1.id, v2.id] });
  const g1 = await task(ids.A, v1, 'guion', '2026-11-10T11:00:00');
  await task(ids.A, v1, 'storyboard', '2026-11-10T11:10:00');
  const g2 = await task(ids.A, v2, 'guion', '2026-11-10T11:20:00');
  await arrive(r1, '2026-11-12');
  await task(ids.A, v1, 'rodaje', '2026-11-12T11:00:00');
  setNow('2026-11-12T15:00:00');
  const logOf = (t) => api.db.log.find((l) => l.type === 'tasks.insert' && l.data.new.id === t.id).id;
  const before = R.payouts(proj(), ctxNow(), new Date());
  as('A'); await assert.rejects(api.rpc('correct_record', { l: logOf(g2), tipo: 'unmark', args: {}, motivo: 'x' }), /Solo el líder/);
  as('W');
  await assert.rejects(api.rpc('correct_record', { l: logOf(g2), tipo: 'unmark', args: {}, motivo: '  ' }), /motivo/);
  await assert.rejects(api.rpc('correct_record', { l: logOf(g1), tipo: 'unmark', args: {}, motivo: 'no' }), /ya se grabó/);
  // Cambiar quién lo hizo: el guion del video 1 lo escribió Williams → su dinero pasa a Williams; el total no cambia.
  await api.rpc('correct_record', { l: logOf(g1), tipo: 'who', args: { member: ids.W, text: 'El guion del video 1 lo hizo Williams' }, motivo: 'lo escribió Williams' });
  const after = R.payouts(proj(), ctxNow(), new Date());
  const r = R.rates(proj()).guion;
  assert.equal(Math.round((after.porMiembro[ids.W].total - (before.porMiembro[ids.W] || { total: 0 }).total) * 100), Math.round(r * 100));
  assert.equal(Math.round((after.porMiembro[ids.A].total - before.porMiembro[ids.A].total) * 100), -Math.round(r * 100));
  assert.equal(Math.round(after.pagado * 100), Math.round(before.pagado * 100), 'la suma sigue cuadrando');
  await assert.rejects(api.rpc('correct_record', { l: logOf(g1), tipo: 'time', args: { at: at('2026-11-10', '10:30') }, motivo: 'hora' }), /ya se corrigió/);
  // Cambiar a qué video y desmarcar (el guion del video 2 no tiene nada después).
  await api.rpc('correct_record', { l: logOf(g2), tipo: 'unmark', args: {}, motivo: 'lo marcó por error' });
  assert.equal(api.db.tasks.some((t) => t.id === g2.id), false);
  const corr = api.db.log.filter((l) => l.type === 'correction');
  assert.equal(corr.length, 2); assert.equal(corr[1].data.member, ids.A);
  assert.ok(api.db.log.some((l) => l.type === 'tasks.delete' && l.data.fix === logOf(g2)), 'lo que cambia la corrección queda marcado');
  // Liquidación enviada → se reabre; pagada → no se corrige.
  await api.update('projects', ids.P, { settlement: { sent_at: new Date().toISOString(), amounts: {} } });
  const s1 = await task(ids.A, v2, 'guion', '2026-11-12T16:00:00');
  as('W'); await api.rpc('correct_record', { l: logOf(s1), tipo: 'time', args: { at: at('2026-11-10', '11:20'), text: 'hora' }, motivo: 'se marcó tarde' });
  assert.equal(proj().settlement.sent_at, undefined); assert.ok(proj().settlement.reopened_at);
  await api.update('projects', ids.P, { settlement: { paid_at: new Date().toISOString() } });
  const s2 = await task(ids.A, v2, 'storyboard', '2026-11-12T16:10:00');
  as('W'); await assert.rejects(api.rpc('correct_record', { l: logOf(s2), tipo: 'unmark', args: {}, motivo: 'x' }), /ya se pagó/);
});
