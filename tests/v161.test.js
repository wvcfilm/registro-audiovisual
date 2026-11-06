import test from 'node:test';
import assert from 'node:assert/strict';

// 1.6.1 · Simulación de la app de práctica (DemoAPI, igual que la base) con reloj falso.
const RealDate = Date;
let NOW = RealDate.parse('2026-11-08T09:00:00-05:00');
class FakeDate extends RealDate { constructor(...a) { if (a.length === 0) super(NOW); else super(...a); } static now() { return NOW; } }
globalThis.Date = FakeDate;
const setNow = (s) => { NOW = RealDate.parse(s + '-05:00'); };
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, key: (i) => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
store['ra-practice'] = '1';

const R = await import('../js/rules.js');
const { api } = await import('../js/api.js');
R.setRules({});
const at = (d, h) => R.at(d, h).toISOString();

const ids = {};
async function setup(apoyo = true) {
  api.reset();
  api.db = { teams: [], users: [], who: null, members: [], projects: [], videos: [], tasks: [], events: [], attendance: [], hires: [], log: [], corrections: [], proposals: [], claims: [], jobs: [], job_items: [] };
  api.logId = 0;
  await api.verifyCode('w@x'); ids.uw = api.db.who;
  ids.team = await api.rpc('create_team', { team_name: 'Equipo', my_name: 'Williams' });
  const code = await api.rpc('create_invite', { t: ids.team, invite_name: 'Ana', invite_role: 'socio', gets_apoyo: apoyo });
  await api.verifyCode('a@x'); ids.ua = api.db.who;
  await api.rpc('accept_invite', { code, my_name: 'Ana' });
  ids.W = api.db.members.find((m) => m.user_id === ids.uw).id;
  ids.A = api.db.members.find((m) => m.user_id === ids.ua).id;
  api.switchUser(ids.uw);
  ids.P = (await api.insert('projects', { team_id: ids.team, client: 'PerteneSer', name: 'Noviembre', budget: 1000, videos_total: 16, start_date: '2026-11-09', status: 'abierto', pct: R.DEFAULT_PCT })).id;
}
const as = (who) => api.switchUser(who === 'W' ? ids.uw : ids.ua);
const ctx = () => api.ctxFor(ids.P);
const proj = () => api.db.projects.find((p) => p.id === ids.P);
const vs = (v) => R.videoState(api.db.videos.find((x) => x.id === v.id), ctx(), new Date());
const who = (id) => (id === ids.W ? 'W' : 'A');
async function task(by, v, kind, when) { setNow(when); as(who(by)); return api.insert('tasks', { team_id: ids.team, project_id: ids.P, video_id: v.id, kind, done_by: by }); }
async function arrive(rodId, day, list = ['W', 'A']) {
  setNow(day + 'T09:59:00');
  for (const w of list) { as(w); await api.insert('attendance', { team_id: ids.team, event_id: rodId, member_id: w === 'W' ? ids.W : ids.A, claimed_at: at(day, '09:58'), arrived_at: at(day, '09:58'), confirmed_by: ids.W }); }
}
async function video(num, owner, publish, rodId) {
  as('W');
  const v = await api.insert('videos', { team_id: ids.team, project_id: ids.P, num, publish_date: publish, owner });
  const r = api.db.events.find((e) => e.id === rodId);
  r.video_ids = r.video_ids.concat([v.id]);
  return v;
}
// Lo que cobra cada uno por un video (para comprobar que el dinero cuadra video por video).
function payOf(v) {
  const c = ctx();
  const s = R.videoState(api.db.videos.find((x) => x.id === v.id), c, new Date());
  const rt = R.rates(proj());
  const out = { W: 0, A: 0 };
  const add = (t, k) => { if (t) out[who(t.done_by)] += rt[k]; };
  add(s.g, 'guion'); add(s.s, 'storyboard'); add(s.r, 'rodaje');
  if (s.delivered) { add(s.mo, 'montaje'); add(s.ac, 'acabado'); }
  return out;
}
const cents = (x) => Math.round(x * 100);

test('1.6.1 · entrega al límite: a las 12:00 pasa al líder, el montaje del socio deja de contar y el líder lo marca sin error', async () => {
  setNow('2026-11-08T09:00:00'); await setup(); as('W');
  const [r] = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-12', '10:00') }], meets: [] });
  const v = await video(1, ids.A, '2026-11-21', r);
  await task(ids.A, v, 'guion', '2026-11-10T11:00:00'); await task(ids.A, v, 'storyboard', '2026-11-10T11:30:00');
  await arrive(r, '2026-11-12'); await task(ids.A, v, 'rodaje', '2026-11-12T11:00:00');
  // Montaje después del apoyo (jue 21:00): entrega por su cuenta, pero no llega el video completo.
  await task(ids.A, v, 'montaje', '2026-11-20T07:00:00');
  setNow('2026-11-20T11:59:00');
  assert.equal(vs(v).post.phase, 'riesgo');
  setNow('2026-11-20T12:00:30');
  let s = vs(v);
  assert.equal(s.post.phase, 'pasado'); assert.equal(s.post.handoffWhy, 'auto');
  assert.equal(s.mo, null, 'a las 12:00 su montaje ya no cuenta');
  assert.equal(R.payouts(proj(), ctx(), new Date()).porMiembro[ids.A].post || 0, 0);
  // El líder marca el montaje (antes, en la práctica, salía "Esa tarea ya está marcada").
  as('A'); await assert.rejects(task(ids.A, v, 'acabado', '2026-11-20T12:05:00'), /pasó|Lo hará/);
  await task(ids.W, v, 'montaje', '2026-11-20T12:40:00');
  assert.ok(api.db.tasks.find((t) => t.video_id === v.id && t.kind === 'montaje' && t.done_by === ids.A).void, 'el de Ana queda anulado');
  await task(ids.W, v, 'acabado', '2026-11-20T15:00:00');
  setNow('2026-11-22T10:00:00');
  s = vs(v);
  assert.ok(s.delivered);
  const p = payOf(v);
  assert.equal(cents(p.W), 2500, 'el líder cobra montaje + corte final');
  assert.equal(cents(p.A + p.W), 6250, 'el video cuadra exacto');
  const ev = R.streakEvents(ids.A, ctx(), new Date()).filter((e) => /pasó a otra persona/.test(e.why));
  assert.equal(ev.length, 1); assert.equal(ev[0].pts, -3);
});

test('1.6.1 · "No me llegó el video": antes de las 12:00 vuelve a entregar; después pasa al líder', async () => {
  setNow('2026-11-08T09:00:00'); await setup(); as('W');
  const [r] = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-12', '10:00') }], meets: [] });
  const v2 = await video(2, ids.A, '2026-11-21', r);
  const v3 = await video(3, ids.A, '2026-11-21', r);
  for (const v of [v2, v3]) { await task(ids.A, v, 'guion', '2026-11-10T11:00:00'); await task(ids.A, v, 'storyboard', '2026-11-10T11:30:00'); }
  await arrive(r, '2026-11-12');
  for (const v of [v2, v3]) await task(ids.A, v, 'rodaje', '2026-11-12T11:00:00');
  await task(ids.A, v2, 'montaje', '2026-11-19T22:00:00'); await task(ids.A, v2, 'acabado', '2026-11-19T22:30:00');
  await task(ids.A, v3, 'montaje', '2026-11-20T07:00:00'); await task(ids.A, v3, 'acabado', '2026-11-20T07:30:00');
  assert.equal(vs(v2).post.phase, 'revision');
  // Solo el líder.
  setNow('2026-11-20T09:00:00'); as('A');
  await assert.rejects(api.rpc('review_missing', { v: v2.id }), /líder/);
  as('W');
  assert.equal(await api.rpc('review_missing', { v: v2.id }), 'riesgo', 'antes de las 12:00: puede volver a entregar');
  assert.ok(!vs(v2).mo && !vs(v2).ac, 'se anulan montaje y corte final');
  setNow('2026-11-20T09:05:00'); await api.rpc('review_missing_undo', { v: v2.id });
  assert.equal(vs(v2).post.phase, 'revision', 'deshacer en 10 minutos');
  setNow('2026-11-20T09:06:00'); await api.rpc('review_missing', { v: v2.id });
  setNow('2026-11-20T09:20:00'); await assert.rejects(api.rpc('review_missing_undo', { v: v2.id }), /10 minutos/);
  // Ana vuelve a entregar antes de las 12:00 y el líder aprueba.
  await task(ids.A, v2, 'montaje', '2026-11-20T10:00:00'); await task(ids.A, v2, 'acabado', '2026-11-20T10:30:00');
  assert.equal(vs(v2).post.phase, 'revision');
  setNow('2026-11-20T11:00:00'); as('W'); await api.rpc('review_video', { v: v2.id, ok: true });
  // Video 3: el líder dice que no le llegó después de las 12:00 → pasa a él.
  setNow('2026-11-20T13:00:00');
  assert.equal(await api.rpc('review_missing', { v: v3.id }), 'pasado');
  await task(ids.W, v3, 'montaje', '2026-11-20T14:00:00'); await task(ids.W, v3, 'acabado', '2026-11-20T18:00:00');
  setNow('2026-11-22T10:00:00');
  const p2 = payOf(v2), p3 = payOf(v3);
  assert.equal(cents(p2.A), 6250, 'video 2: Ana cobra todo (lo entregó de nuevo)');
  assert.equal(cents(p3.W), 2500, 'video 3: la edición es del líder');
  assert.equal(cents(p3.A + p3.W), 6250);
  const ev = R.streakEvents(ids.A, ctx(), new Date());
  assert.equal(ev.filter((e) => /Video 3 pasó a otra persona/.test(e.why)).length, 1);
  assert.equal(ev.filter((e) => /Video 2 pasó/.test(e.why)).length, 0);
  // El total del proyecto cuadra con lo que se hizo.
  const tot = Object.values(R.payouts(proj(), ctx(), new Date()).porMiembro).reduce((a, x) => a + x.total, 0);
  assert.equal(cents(tot), 2 * 6250);
});

test('1.6.1 · fin del rodaje: lo no grabado queda sin rodaje, "Sí se grabó" hasta el día siguiente y reprogramar varios', async () => {
  setNow('2026-11-08T09:00:00'); await setup(); as('W');
  const [r] = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-16', '10:00') }], meets: [] });
  const v4 = await video(4, ids.A, '2026-11-24', r);
  const v5 = await video(5, ids.W, '2026-11-24', r);
  const v6 = await video(6, ids.A, '2026-11-24', r);
  const v7 = await video(7, ids.A, '2026-11-24', r);
  for (const v of [v4, v5, v7]) { await task(v.owner, v, 'guion', '2026-11-13T11:00:00'); await task(v.owner, v, 'storyboard', '2026-11-13T11:30:00'); }
  await arrive(r, '2026-11-16');
  await task(ids.W, v5, 'rodaje', '2026-11-16T11:00:00');
  const rod = () => api.db.events.find((e) => e.id === r);
  assert.equal(R.fmtWhen(R.rodajeEnd(rod())), 'lun 16 nov · 23:59');
  // Al día siguiente ya no se marca.
  await assert.rejects(task(ids.A, v4, 'rodaje', '2026-11-17T08:00:00'), /terminó/);
  as('A'); assert.equal(await api.rpc('close_rodajes', { p: ids.P }), 3);
  assert.equal(await api.rpc('close_rodajes', { p: ids.P }), 0, 'una sola vez');
  assert.deepEqual(rod().video_ids, [v5.id]);
  assert.ok(api.db.videos.find((x) => x.id === v4.id).unshot);
  assert.equal(api.db.log.filter((l) => l.type === 'rodaje.sin_grabar').length, 1);
  // "Sí se grabó": solo el líder, a nombre de quien estuvo (Ana estuvo: va a su nombre).
  await assert.rejects(api.rpc('late_shot', { v: v4.id, who: ids.A }), /Solo el líder/);
  as('W');
  await assert.rejects(api.rpc('late_shot', { v: v4.id, who: ids.W }), /Ana estuvo/);
  await api.rpc('late_shot', { v: v4.id, who: ids.A });
  assert.ok(vs(v4).r && vs(v4).r.done_by === ids.A);
  assert.ok(rod().video_ids.indexOf(v4.id) !== -1, 'vuelve a su rodaje');
  assert.equal(api.db.videos.find((x) => x.id === v4.id).unshot, null);
  await assert.rejects(api.rpc('late_shot', { v: v6.id, who: ids.A }), /Sin guion/);
  // Reprogramar varios a un rodaje nuevo: ya no están sin rodaje y el guion vuelve a tener plazo.
  const nr = await api.rpc('move_videos', { vids: [v6.id], to_rodaje: null, new_at: at('2026-11-19', '10:00') });
  assert.equal(api.db.videos.find((x) => x.id === v6.id).unshot, null);
  assert.equal(R.fmtWhen(vs(v6).d.preDue), 'mié 18 nov · 18:00');
  await task(ids.A, v6, 'guion', '2026-11-17T12:00:00');
  // Pasado el día siguiente, "Sí se grabó" ya no se puede.
  setNow('2026-11-18T00:00:30'); as('W');
  await assert.rejects(api.rpc('late_shot', { v: v7.id, who: ids.A }), /Ya pasó el plazo/);
  // A un rodaje que ya existe.
  await api.rpc('move_videos', { vids: [v7.id], to_rodaje: nr });
  assert.deepEqual(api.db.events.find((e) => e.id === nr).video_ids.sort(), [v6.id, v7.id].sort());
  // El rodaje del video 4 se paga a Ana; el dinero cuadra.
  assert.equal(cents(payOf(v4).A), 6250 - 1000 - 1500, 'guion, storyboard y rodaje (aún sin edición)');
});

test('1.6.1 · duración máxima del rodaje: 12 h y 24 h desde que empieza', async () => {
  const r = { starts_at: at('2026-11-16', '10:00') };
  R.setRules({ rdur: 720 }); assert.equal(R.fmtWhen(R.rodajeEnd(r)), 'lun 16 nov · 22:00');
  R.setRules({ rdur: 1440 }); assert.equal(R.fmtWhen(R.rodajeEnd(r)), 'mar 17 nov · 10:00');
  assert.equal(R.fmtWhen(R.lateShotUntil(r)), 'mié 18 nov · 10:00');
  R.setRules({});
});

test('1.6.1 · reglas: las aprueban los socios sin apoyo; con todos con apoyo el líder las cambia directo; porcentajes siempre con aprobación', async () => {
  setNow('2026-11-08T09:00:00'); await setup(true); as('W');
  const p1 = await api.insert('proposals', { team_id: ids.team, kind: 'rules', data: { tol: 30 } });
  assert.equal(p1.status, 'aprobada');
  assert.equal(api.db.teams[0].settings.rules.tol, 30);
  await assert.rejects(api.insert('proposals', { team_id: ids.team, kind: 'rules', data: { rdur: 100 } }), /23:59, 12 horas o 24 horas/);
  const pc = await api.insert('proposals', { team_id: ids.team, kind: 'pct', data: { pre: 25, rod: 35, mon: 15, aca: 25 } });
  assert.equal(pc.status, 'pendiente', 'los porcentajes siempre esperan al socio');
  as('A'); await assert.rejects(api.insert('proposals', { team_id: ids.team, kind: 'rules', data: { tol: 20 } }), /las cambia el líder/);
  await api.update('proposals', pc.id, { status: 'aprobada' });
  // Ana sin apoyo: las reglas quedan pendientes y las aprueba ella.
  api.db.members.find((m) => m.id === ids.A).apoyo = false;
  as('W'); const p2 = await api.insert('proposals', { team_id: ids.team, kind: 'rules', data: { rdur: 720 } });
  assert.equal(p2.status, 'pendiente');
  as('A'); await api.update('proposals', p2.id, { status: 'aprobada' });
  assert.equal(api.db.teams[0].settings.rules.rdur, 720);
});

test('1.6.1 · mover un rodaje con videos sin guion: vuelven a tener plazo, solo se pueden tomar o ya no se graban', async () => {
  setNow('2026-11-08T09:00:00'); await setup(); as('W');
  const [r] = await api.rpc('plan_week', { p: ids.P, rods: [{ at: at('2026-11-10', '10:00') }], meets: [] });
  const v = await video(11, ids.A, '2026-11-20', r);
  const c = ctx();
  setNow('2026-11-11T20:44:00');
  const now = new Date();
  assert.equal(R.guionRisk([v.id], at('2026-11-12', '01:00'), c, now).level, 'bad', 'jueves 12 a la 01:00: ya pasó su plazo y el límite para tomarlo (5 h antes)');
  const g = R.guionRisk([v.id], at('2026-11-13', '10:00'), c, now);
  assert.equal(g.level, 'ok'); assert.equal(g.from, '2026-11-13');
  assert.equal(R.guionRisk([v.id], at('2026-11-12', '10:00'), c, now).level, 'take', 'su compañero puede tomarlo hasta 5 h antes');
});
