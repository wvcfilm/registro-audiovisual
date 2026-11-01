// Proyecto de ejemplo para el modo demo (solo cuando no hay base de datos conectada).
import { api } from './api.js';
import { at, addDays, limaDate } from './rules.js';

export async function seedDemo() {
  if (api.mode !== 'demo') return;
  api.reset();
  api.db = { teams: [], users: [], who: null, members: [], projects: [], videos: [], tasks: [], events: [], attendance: [], log: [], corrections: [] };
  api.logId = 0;
  api.seeding = true;
  await api.verifyCode('williams@demo');
  const wUser = api.db.who;
  const team = await api.rpc('create_team', { team_name: 'Williams Velasquez · Audiovisual', my_name: 'Williams' });
  const code = await api.rpc('create_invite', { t: team, invite_name: 'Socio', invite_role: 'socio', gets_apoyo: true });
  await api.verifyCode('socio@demo');
  const sUser = api.db.who;
  await api.rpc('accept_invite', { code, my_name: 'Socio' });
  const W = api.db.members.find((m) => m.user_id === wUser).id;
  const S = api.db.members.find((m) => m.user_id === sUser).id;
  const as = (u) => api.switchUser(u === W ? wUser : sUser);

  const D = limaDate(new Date());
  as(W);
  const p = await api.insert('projects', { team_id: team, client: 'PerteneSer', name: 'Noviembre', budget: 1000, videos_total: 16, start_date: addDays(D, -9), status: 'abierto' });
  const iso = (d, t) => at(d, t).toISOString();

  async function week(meet, rodaje, pubs, owners) {
    as(W);
    const vids = [];
    let n = api.db.videos.filter((v) => v.project_id === p.id).length;
    for (let i = 0; i < pubs.length; i++) {
      n++;
      vids.push(await api.insert('videos', { team_id: team, project_id: p.id, num: n, publish_date: pubs[i], owner: owners[i] }));
    }
    const rod = await api.insert('events', { team_id: team, project_id: p.id, kind: 'rodaje', status: 'activo', starts_at: iso(rodaje, '10:00'), tolerance_min: 45, video_ids: vids.map((v) => v.id) });
    const reu = await api.insert('events', { team_id: team, project_id: p.id, kind: 'reunion', status: 'activo', rodaje_id: rod.id, starts_at: iso(meet, '10:00'), ended_at: iso(meet, '12:30'), tolerance_min: 45, video_ids: vids.map((v) => v.id) });
    return { vids, reu, rod };
  }
  async function task(by, v, kind, when) { as(by); await api.insert('tasks', { team_id: team, project_id: p.id, video_id: v.id, kind, done_by: by, done_at: when }); }
  async function arrive(by, e, when) { as(by); await api.insert('attendance', { team_id: team, event_id: e.id, member_id: by, claimed_at: when, arrived_at: when, confirmed_by: W }); }

  // Semana 1: ya grabada. El montaje del video 4 (de Socio) no llegó.
  const m1 = addDays(D, -9), r1 = addDays(D, -7);
  const w1 = await week(m1, r1, [D, D, addDays(D, 1), addDays(D, 1)], [W, W, S, S]);
  await arrive(W, w1.reu, iso(m1, '09:56')); await arrive(S, w1.reu, iso(m1, '10:03'));
  for (const v of w1.vids) {
    await task(v.owner, v, 'guion', iso(m1, '11:20'));
    await task(v.owner, v, 'storyboard', v.num === 4 ? iso(addDays(m1, 1), '22:15') : iso(m1, '11:40'));
  }
  await arrive(W, w1.rod, iso(r1, '09:58')); await arrive(S, w1.rod, iso(r1, '10:22'));
  for (const v of w1.vids) await task(v.owner, v, 'rodaje', iso(r1, '11:40'));
  await task(W, w1.vids[0], 'montaje', iso(addDays(D, -4), '18:00'));
  await task(W, w1.vids[0], 'acabado', iso(addDays(D, -2), '20:10'));
  await task(W, w1.vids[1], 'montaje', iso(addDays(D, -3), '17:00'));
  await task(W, w1.vids[1], 'acabado', iso(addDays(D, -1), '19:30'));
  await task(S, w1.vids[2], 'montaje', iso(addDays(D, -2), '20:41'));

  // Semana 2: reunión hecha, rodaje mañana.
  const m2 = addDays(D, -2), r2 = addDays(D, 1);
  const w2 = await week(m2, r2, [addDays(D, 7), addDays(D, 7), addDays(D, 9), addDays(D, 9)], [W, W, S, S]);
  await arrive(W, w2.reu, iso(m2, '09:55')); await arrive(S, w2.reu, iso(m2, '10:04'));
  for (const v of w2.vids) {
    if (v.num === 8) continue;
    await task(v.owner, v, 'guion', iso(m2, '11:30'));
    await task(v.owner, v, 'storyboard', iso(m2, '11:50'));
  }
  await task(S, w2.vids[3], 'guion', iso(m2, '12:10'));
  as(W);
  api.seeding = false;
  api.db.log.sort((a, b) => new Date(a.at) - new Date(b.at)).forEach((l, i) => { l.id = i + 1; });
  api.logId = api.db.log.length;
  api.persist();
}
