import * as st from './store.js';
import { S } from './store.js';
import * as R from './rules.js';
import { seedDemo } from './demo.js';

export const VERSION = '1.4';
const $app = document.getElementById('app');
const $toast = document.getElementById('toast');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROLE = { admin: 'Administrador', socio: 'Socio', colaborador: 'Colaborador' };
const COLOR = { admin: ['#FFB547', '#1A1203'], socio: ['#8AB4FF', '#0B1530'], colaborador: ['#FF8A65', '#1A0E08'] };
let sheetHtml = null;
let ui = { scope: 'p', histF: 'all' };

const ini = (name) => { const w = String(name || '?').trim().split(/\s+/); return (w[0][0] + (w[1] ? w[1][0] : '')).toUpperCase(); };
const av = (m, size = 34) => { const c = COLOR[m.role] || ['#22242C', '#C9C9D1']; return `<span class="av" style="width:${size}px;height:${size}px;background:${c[0]};color:${c[1]}">${esc(ini(m.name))}</span>`; };
const first = (m) => esc(String(m.name || '').split(' ')[0]);
const icon = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  vids: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
  sum: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11M12 20V5M19 20v-6"/></svg>',
  hist: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  flame: (c, s = 40) => `<svg class="flame" width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2c1.2 3.4 6 5.6 6 11.2a6 6 0 0 1-12 0c0-3.4 2.3-4.6 2.3-6.8 1.1 1.1 2.3 2.3 3.4 2.3 0-2.3-1.1-4.5.3-6.7z" fill="${c}"/><path d="M12 11c.6 1.6 3 2.8 3 5.4a3 3 0 0 1-6 0c0-1.6 1.1-2.2 1.1-3.3.6.6 1.2 1.1 1.7 1.1 0-1.1-.4-2.1.2-3.2z" fill="#FFF1C2"/></svg>`
};
const banner = (tone, title, text, extra = '') => `<div class="banner bn-${tone}"><div style="flex:1"><b>${title}</b>${text ? `<p>${text}</p>` : ''}${extra}</div></div>`;
Object.assign(icon, {
  lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  tick: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  layers: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
  pen: (c, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>`,
  cam: (c, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>`,
  cut: (c, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.5 8.5 20 19M8.5 15.5 20 5"/></svg>`,
  star: (c, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>`,
  bell: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/></svg>`,
  pie: (c) => `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 4"/></svg>`,
  sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  shield: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  palette: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18c1.7 0 2-1.3 1.3-2.4-.7-1.2 0-2.6 1.4-2.6H17a4 4 0 0 0 4-4 9 9 0 0 0-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="11" r="1"/></svg>',
  flask: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B98CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/></svg>',
  users: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8AB4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8.2 5 2.4 5 5.5"/></svg>'
});
const active = (e) => !e.status || e.status === 'activo';
const PRE = { guion: 1, storyboard: 1 };
const KEY = { guion: 'g', storyboard: 's', rodaje: 'r', montaje: 'mo', acabado: 'ac' };
const projOf = (id) => S.data.projects.find((p) => p.id === id);
const hireOf = (v) => { const mt = st.meetingOf(v.id); return mt ? st.hireFor(mt.id) : null; };
const wasReprogrammed = (e) => !!(e && S.data.events.some((x) => x.replaced_by === e.id));
const backTo = (href, label) => `<a href="${href}" class="row muted" style="text-decoration:none">${icon.back} ${label}</a>`;
// Lo que gana quien marca la tarea (el apoyo en el acabado se le paga al dueño, 5.5).
function gain(v, k, cm, viaHire) {
  const r = R.rates(projOf(v.project_id))[k];
  if (cm && (cm.apoyo || cm.self || cm.fix)) return 0;
  // 1.4: el montaje de quien recibe apoyo queda en espera hasta que el video esté entregado.
  if (k === 'montaje' && v.owner === S.me.id && st.member(v.owner).apoyo) return 0;
  return viaHire ? r * 0.8 : r;
}
function myTotal(p) { const x = R.payouts(p, st.ctx(p.id)).porMiembro[S.me.id]; return x ? x.total : 0; }
function countdown(due, now = new Date()) {
  const m = Math.round((due - now) / 60000);
  if (m < 0) { const h = Math.round(-m / 60); return h < 1 ? 'venció hace minutos' : h < 48 ? `venció hace ${h} h` : `venció hace ${Math.round(h / 24)} días`; }
  if (m < 60) return `en ${m} min`;
  if (m < 48 * 60) return `en ${Math.round(m / 60)} h`;
  return `en ${Math.round(m / 1440)} días`;
}

// ==================================================================
// Lo pendiente de cada persona (Te toca)
// ==================================================================
function taskItems(now) {
  const me = S.me, c = st.ctx(), out = [];
  for (const v of c.videos) {
    const vs = R.videoState(v, c, now);
    const owner = st.member(v.owner);
    const hire = hireOf(v);
    const byG = !!(hire && hire.hired_by === v.owner);
    const rod = vs.rodaje;
    const vname = `video ${v.num}`;
    const push = (k, due, title, sub, o = {}) => {
      const cm = R.canMark(v, k, me, c, now, { hire: o.viaHire ? hire : null });
      out.push(Object.assign({ type: 'task', video: v, kind: k, due, title, sub, cm, repro: k === 'rodaje' && wasReprogrammed(rod), hire: o.viaHire ? hire : null, gain: gain(v, k, cm, o.viaHire), rod }, o));
    };
    if (!(vs.g && vs.s)) {
      for (const k of ['guion', 'storyboard']) {
        if (vs[KEY[k]]) continue;
        const t = `${R.KIND_LABEL[k]} · ${vname}`;
        if (byG) { if (hire.present === me.id) push(k, vs.d.preDue, t, `De ${first(owner)} · con Guillermo (80 %)`, { viaHire: true }); continue; }
        if (v.owner === me.id) push(k, vs.d.preDue, t, v.title ? esc(v.title) : 'Tu preproducción');
        else if (vs.d.preDue && now > vs.d.preDue && me.role !== 'colaborador') {
          const cm = R.canMark(v, k, me, c, now);
          if (cm.claim || cm.claimed) push(k, cm.limit || vs.d.preDue, t, cm.claimed ? 'Lo tomaste' : `De ${first(owner)} · no llegó a tiempo`, { take: true });
        }
      }
    } else if (!vs.r) {
      if (!rod) { if (v.owner === me.id) out.push({ type: 'norod', video: v, due: null, title: `Video ${v.num} sin rodaje`, sub: 'Prográmalo en Etapas → Rodaje' }); }
      else {
        const cm = R.canMark(v, 'rodaje', me, c, now);
        if (cm.ok) push('rodaje', new Date(rod.starts_at), `Rodaje · ${vname}`, v.owner === me.id ? (v.title ? esc(v.title) : 'Tu video') : `De ${first(owner)} · lo grabas tú`, { take: v.owner !== me.id });
      }
    } else if (vs.post && vs.post.phase === 'colab') {
      continue; // 1.4: lo edita un colaborador; la revisión aparece como "Revisar" del encargo
    } else if (!vs.delivered) {
      const P = vs.post;
      const A = first(st.admin() || { name: 'el administrador' });
      if (owner.apoyo && vs.d.apoyoDue) {
        // 1.4 · Entregas al límite
        if (v.owner === me.id) {
          const left = (vs.d.apoyoDue - now) / 60000;
          if (P.phase === 'abierto' && !vs.mo) push('montaje', vs.d.apoyoDue, `Montaje · ${vname}`, left <= 60 ? 'Falta 1 h para enviar tu montaje y recibir apoyo en el video final.' : `Envíalo a tiempo y ${A} hace tu video final`);
          else if (P.phase === 'solo' || P.phase === 'riesgo') {
            const due = P.phase === 'solo' ? vs.d.selfDue : vs.d.autoDue;
            if (!vs.mo) push('montaje', due, `Montaje · ${vname}`, 'Venció el apoyo · entrega el video completo', { urgent: true });
            else push('acabado', due, `Video completo · ${vname}`, P.phase === 'solo' ? 'Venció el apoyo · entrégalo por tu cuenta' : `Al mediodía pasa a ${A}`, { urgent: true });
          } else if (P.phase === 'cambios') out.push({ type: 'fix', video: v, kind: 'acabado', due: vs.d.fixDue, title: `Corregir · ${vname}`, sub: `${A} pidió cambios: ${esc(vs.ac.review_note || '')}`, urgent: true });
        } else if (me.role === 'admin') {
          if (P.phase === 'apoyo' && !vs.ac) push('acabado', vs.d.finalDue, `Video final · ${vname}`, `De ${first(owner)} · apoyo: el pago es de él`);
          else if (P.phase === 'revision') out.push({ type: 'review', video: v, kind: 'acabado', due: vs.d.finalDue, title: `Revisar entrega · ${vname}`, sub: `${first(owner)} entregó el video completo`, urgent: true });
          else if (P.phase === 'riesgo') push('montaje', vs.d.autoDue, `Tomar el video · ${vname}`, `${first(owner)} no entregó · a las ${R.limaTime(vs.d.autoDue)} pasa a ti`, { take: true });
          else if (P.phase === 'pasado') { if (!vs.mo) push('montaje', vs.d.finalDue, `Montaje y final · ${vname}`, `De ${first(owner)} · pasó a ti`, { take: true }); else if (!vs.ac) push('acabado', vs.d.finalDue, `Video final · ${vname}`, `De ${first(owner)} · pasó a ti`, { take: true }); }
        }
      } else if (!vs.mo) {
        if (v.owner === me.id) push('montaje', vs.d.finalDue, `Montaje · ${vname}`, v.title ? esc(v.title) : 'Tu video');
      } else if (!vs.ac) {
        if (v.owner === me.id) push('acabado', vs.d.finalDue, `Video final · ${vname}`, v.title ? esc(v.title) : 'Tu video');
      }
    }
  }
  return out;
}

function pending(now = new Date()) {
  const me = S.me; if (!me) return [];
  const out = [];
  const c = st.ctx();
  const p = st.project();
  if (p && p.status === 'abierto') {
    out.push(...taskItems(now));
    for (const e of c.events.filter(active)) {
      const start = new Date(e.starts_at);
      const isR = e.kind === 'rodaje';
      const s = st.eventStatus(e, me.id, now);
      const nums = e.video_ids.map((id) => (c.videos.find((v) => v.id === id) || {}).num).filter(Boolean).sort((a, b) => a - b);
      const vtxt = nums.length ? (nums.length === 1 ? 'video ' + nums[0] : 'videos ' + nums.slice(0, -1).join(', ') + ' y ' + nums[nums.length - 1]) : 'sin videos aún';
      if (s.k === 'pendiente' && start - now < 7 * 864e5) out.push({ type: 'event', event: e, due: start, title: (isR ? 'Rodaje · ' : 'Reunión · ') + vtxt, sub: `${R.fmtWhen(e.starts_at)} · tolerancia hasta ${R.limaTime(new Date(start.getTime() + e.tolerance_min * 60000))}`, repro: isR && wasReprogrammed(e), kind: isR ? 'rodaje' : 'reunion' });
      if (isR && !e.video_ids.length && me.role !== 'colaborador') {
        const mt = S.data.events.find((x) => x.kind === 'reunion' && x.rodaje_id === e.id && active(x));
        out.push({ type: 'reparto', event: e, due: mt ? new Date(mt.starts_at) : start, title: 'Repartir los videos', sub: `Rodaje del ${R.fmtWhen(e.starts_at)} · se decide en la reunión`, kind: 'reunion' });
      }
      if (me.role === 'admin') {
        for (const a of c.attendance.filter((x) => x.event_id === e.id && x.claimed_at && !x.arrived_at && x.member_id !== me.id)) out.push({ type: 'claim', event: e, att: a, due: new Date(a.claimed_at), title: `Llegada de ${first(st.member(a.member_id))}`, sub: `Marcó a las ${R.limaTime(a.claimed_at)} · ${isR ? 'rodaje' : 'reunión'}`, urgent: true, kind: isR ? 'rodaje' : 'reunion' });
        if (e.end_requested_at && !e.ended_at) out.push({ type: 'endreq', event: e, due: new Date(e.end_requested_at), title: `${first(st.member(e.end_requested_by))} pidió finalizar la reunión`, sub: `A las ${R.limaTime(e.end_requested_at)} · confírmalo`, urgent: true, kind: 'reunion' });
      }
      for (const a of c.attendance.filter((x) => x.event_id === e.id && x.member_id !== me.id && x.notice && x.notice.sent_at && !x.notice.decision)) {
        out.push({ type: 'notice', event: e, att: a, due: start, title: `${first(st.member(a.member_id))} avisó que no irá`, sub: (isR ? 'Rodaje · ' : 'Reunión · ') + R.fmtWhen(e.starts_at), urgent: true, kind: isR ? 'rodaje' : 'reunion' });
      }
    }
    for (const h of S.data.hires.filter((x) => x.status === 'pendiente' && x.present === me.id && x.project_id === p.id)) {
      const ev = S.data.events.find((e) => e.id === h.event_id);
      if (ev) out.push({ type: 'hire', event: ev, due: new Date(ev.starts_at), title: `${first(st.member(h.hired_by))} quiere contratar a Guillermo`, sub: 'Reunión · ' + R.fmtWhen(ev.starts_at), urgent: true, kind: 'reunion' });
    }
    // 1.4 · Colaborador externo: aprobar el encargo, revisar entregas y confirmar el servicio.
    if (isPartner(me)) for (const j of (S.data.jobs || []).filter((x) => x.project_id === p.id)) {
      const E = first(st.member(j.member_id));
      if (j.status === 'propuesto' && j.proposed_by !== me.id) out.push({ type: 'job', job: j, due: new Date(j.created_at), title: `${first(st.member(j.proposed_by))} propone contratar a ${E}`, sub: `Edición · ${j.video_ids.length} ${j.video_ids.length === 1 ? 'video' : 'videos'} · apruébalo o recházalo`, urgent: true });
      if (j.status === 'activo') for (const it of st.jobItems(j.id).filter((i) => i.stage === 'rev1' || i.stage === 'rev2')) {
        const v = S.data.videos.find((x) => x.id === it.video_id);
        if (v) out.push({ type: 'job', job: j, kind: 'montaje', btn: 'Revisar', due: new Date(it.stage === 'rev1' ? it.montaje_at : it.final_at), title: `Revisar ${it.stage === 'rev1' ? 'montaje' : 'video final'} · video ${v.num}`, sub: `Lo entregó ${E} · envíale tus observaciones`, urgent: true });
      }
      if (j.status === 'finalizado') out.push({ type: 'job', job: j, due: new Date(j.finished_at || j.created_at), title: `${E} terminó el servicio`, sub: 'Revisa Drive, confirma y registra su pago', urgent: true });
    }
    const se = p.settlement;
    if (se && se.sent_at && !se.confirmed_at && me.role !== 'admin') out.push({ type: 'settle', due: now, title: 'Revisa y confirma la liquidación', sub: esc(p.client) + ' · ' + esc(p.name), urgent: true });
    if (se && se.confirmed_at && !se.paid_at && me.role === 'admin') out.push({ type: 'settle', due: now, title: 'Registra el pago de la liquidación', sub: esc(p.client) + ' · ' + esc(p.name), urgent: true });
    if (se && se.observation && !se.sent_at && me.role === 'admin') out.push({ type: 'settle', due: now, title: 'Hay una observación en la liquidación', sub: esc(se.observation.text), urgent: true });
  }
  for (const pr of st.proposals().filter((x) => x.status === 'pendiente' && x.proposed_by !== me.id)) out.push({ type: 'proposal', prop: pr, due: new Date(pr.created_at), title: `${first(st.member(pr.proposed_by))} propone cambiar ${pr.kind === 'pct' ? 'los porcentajes' : 'las reglas'}`, sub: 'Revísalo y apruébalo o recházalo', urgent: true });
  for (const cr of S.data.corrections.filter((x) => x.status === 'pendiente' && x.requested_by !== me.id)) out.push({ type: 'corr', corr: cr, due: new Date(cr.created_at), title: `${first(st.member(cr.requested_by))} pidió una corrección`, sub: esc(cr.text), urgent: true });
  for (const x of out) {
    x.band = x.urgent ? 0 : R.band(x.due, now);
    x.rank = x.type === 'task' ? R.STAGE_RANK[x.kind] : x.event ? R.STAGE_RANK[x.event.kind] : 3;
  }
  return out.sort((a, b) => a.band - b.band || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || a.rank - b.rank || (a.due || Infinity) - (b.due || Infinity));
}

// Ícono de etapa: lápiz (preproducción), cámara (rodaje), tijera (posproducción), estrella (final).
function stageOf(x) {
  if (x.type === 'review' || x.type === 'fix') return 'post';
  if (x.type === 'job') return x.kind ? 'post' : 'info';
  if (x.type === 'task') return { guion: 'pre', storyboard: 'pre', rodaje: 'prod', montaje: 'post', acabado: 'post' }[x.kind];
  if (x.kind === 'rodaje') return 'prod';
  if (x.kind === 'reunion') return 'pre';
  return 'info';
}
function stageIc(k, size = 18) {
  if (k === 'pre') return icon.pen('var(--c-pre)', size);
  if (k === 'prod') return icon.cam('var(--c-prod)', size);
  if (k === 'post') return icon.cut('var(--c-post)', size);
  if (k === 'star') return icon.star('var(--c-prod)', size);
  return icon.bell('var(--tx3)', size);
}
function rowBtn(x, now) {
  const ev = x.event;
  if (x.type === 'task') {
    const cm = x.cm;
    if (cm.claim) return `<button class="tbtn t-take" data-act="claim" data-v="${x.video.id}" data-k="${x.kind}">Tomar</button>`;
    if (cm.ok) return `<button class="tbtn ${x.hire ? 't-g' : 't-done'}" data-act="quick" data-v="${x.video.id}" data-k="${x.kind}"${x.hire ? ` data-h="${x.hire.id}"` : ''}>Hecho</button>`;
    if (cm.gone) return `<span class="tbtn t-gone">Venció</span>`;
    const r = x.rod;
    const lockTxt = x.kind === 'rodaje' && r ? (R.limaDate(now) === R.limaDate(r.starts_at) ? R.limaTime(new Date(new Date(r.starts_at).getTime() - R.RULES.open * 60000)) : dowShort(r.starts_at)) : 'Espera';
    return `<span class="tbtn t-lock">${icon.lock}${lockTxt}</span>`;
  }
  if (x.type === 'event') {
    if (R.canCheckIn(ev, now)) return `<button class="tbtn t-arr" data-act="checkin" data-e="${ev.id}">Llegué</button>`;
    return `<span class="tbtn t-lock">${icon.lock}${R.limaDate(now) === R.limaDate(ev.starts_at) ? R.limaTime(new Date(new Date(ev.starts_at).getTime() - R.RULES.open * 60000)) : dowShort(ev.starts_at)}</span>`;
  }
  if (x.type === 'review') return `<button class="tbtn t-take" data-act="review" data-v="${x.video.id}" data-k="ask">Revisar</button>`;
  if (x.type === 'job') return `<a class="tbtn t-take" href="#/encargo/${x.job.id}">${x.btn || 'Ver'}</a>`;
  if (x.type === 'fix') return `<button class="tbtn t-done" data-act="redeliver" data-v="${x.video.id}">Entregar</button>`;
  if (x.type === 'claim') return `<button class="tbtn t-arr" data-act="confirmArr" data-a="${x.att.id}" data-m="claimed">Sí, ${R.limaTime(x.att.claimed_at)}</button>`;
  if (x.type === 'endreq') return `<button class="tbtn t-done" data-act="confirmEnd" data-e="${ev.id}">Confirmar</button>`;
  return `<a class="tbtn t-ghost" href="${rowHref(x)}">Ver</a>`;
}
function rowHref(x) {
  if (x.type === 'task' || x.type === 'norod' || x.type === 'review' || x.type === 'fix') return '#/v/' + x.video.id;
  if (x.type === 'reparto') return '#/semana/' + x.event.id;
  if (x.type === 'settle') return '#/cierre';
  if (x.type === 'corr') return '#/historial';
  if (x.type === 'proposal') return '#/propuesta/' + x.prop.id;
  if (x.type === 'job') return '#/encargo/' + x.job.id;
  return x.event ? '#/e/' + x.event.id : '#/';
}
function dueLine(x, now) {
  if (x.type !== 'task' && x.type !== 'event') return '';
  if (x.type === 'task' && x.cm.gone) return `<span class="due-l u0">Venció ${R.fmtWhen(x.due)} · pasó a tu compañero</span>`;
  if (x.type === 'task' && x.cm.claim) return `<span class="due-l u0">Puedes tomarlo hasta ${R.fmtWhen(x.cm.limit)}</span>`;
  if (x.type === 'task' && x.cm.claimed) return `<span class="due-l u0">Entrégalo antes de ${R.fmtWhen(x.cm.limit)}</span>`;
  if (x.type === 'task' && !x.cm.ok && x.cm.why) return `<span class="due-l">${esc(x.cm.why)}</span>`;
  if (!x.due) return '';
  return `<span class="due-l u${x.band}">${x.type === 'event' ? '' : 'Entrega: '}${R.fmtWhen(x.due)} · ${countdown(x.due, now)}</span>`;
}
function pendItem(x, now = new Date(), i = 0) {
  const k = stageOf(x);
  return `<div class="trow" style="animation-delay:${(i * 0.04).toFixed(2)}s">
    <a class="tic tint-${k}" href="${rowHref(x)}" aria-label="Ver detalle">${stageIc(k)}</a>
    <a class="ttx" href="${rowHref(x)}"><b${x.type === 'task' && (x.cm.gone || (!x.cm.ok && !x.cm.claim)) ? ' class="dim"' : ''}>${x.title}${x.repro ? ' <em class="tag-red">Reprogramado</em>' : ''}</b><span>${x.sub || ''}</span>${dueLine(x, now)}</a>
    ${rowBtn(x, now)}</div>`;
}
const DOW = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
function dowShort(iso) { const d = R.limaDate(iso); return DOW[new Date(d + 'T12:00:00-05:00').getUTCDay()].charAt(0) + DOW[new Date(d + 'T12:00:00-05:00').getUTCDay()].slice(1).toLowerCase(); }
function dayDiff(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }

// ==================================================================
// Pantallas
// ==================================================================
function layout(tab, body) {
  const p = st.project();
  const n = pending().filter((x) => x.urgent || (x.type === 'task' && x.band === 0 && x.cm.ok)).length;
  const light = theme() === 'light';
  return `<div class="wrap">
  <header class="top">
    <button class="ibtn pjbtn" data-act="pickProject" aria-label="Cambiar proyecto">
      <span class="pj"><b>${p ? esc(p.client) + ' · ' + esc(p.name) : 'Sin proyecto'}</b></span>${icon.down}
    </button>
    <button class="ibtn" data-act="theme" aria-label="${light ? 'Cambiar a modo noche' : 'Cambiar a modo día'}" style="color:${light ? 'var(--tx3)' : 'var(--amber)'}">${light ? icon.moon : icon.sun}</button>
    ${st.isAdmin() ? `<a class="ibtn" href="#/admin" aria-label="Administrador" style="color:var(--amber)">${icon.shield}</a>` : ''}
    <a class="ibtn" href="#/equipo" aria-label="Equipo">${icon.gear}</a>
  </header>
  <main>${st.isDemo() ? demoBar() : ''}${body}</main>
  <nav class="tabs"><div>
    <a href="#/" class="${tab === 'home' ? 'on' : ''}"><span class="${n ? 'dot' : ''}">${icon.home}</span>Inicio</a>
    <a href="#/videos" class="${tab === 'vids' ? 'on' : ''}">${icon.layers}Etapas</a>
    <a href="#/resumen" class="${tab === 'sum' ? 'on' : ''}">${icon.sum}Resumen</a>
    <a href="#/historial" class="${tab === 'hist' ? 'on' : ''}">${icon.hist}Historial</a>
  </div></nav></div>`;
}

function demoBar() {
  const users = st.demoUsers();
  const btns = users.map((u) => {
    const m = S.data.members.find((x) => x.user_id === u.id);
    const on = S.session && S.session.user.id === u.id;
    const nm = m ? m.name : String(u.email).split('@')[0]; return `<button class="btn sm ${on ? 'b-amber' : 'b-ghost'}" data-act="demoAs" data-id="${u.id}">${esc(nm.charAt(0).toUpperCase() + nm.slice(1))}</button>`;
  }).join('');
  const pr = st.practice();
  return `<div class="demo${pr ? ' demo-pr' : ''}"><div class="between" style="align-items:center"><span class="muted">${pr ? '<b style="color:#C9B2FF">Modo práctica</b> · nada llega a la base real' : '<b style="color:#FFC978">Modo demo</b> · solo en este navegador'}</span><span class="row" style="gap:6px"><button class="btn sm b-ghost" data-act="demoReset">${pr ? 'Reiniciar' : 'Borrar demo'}</button>${pr ? '<button class="btn sm b-purple" data-act="practiceOff">Salir</button>' : ''}</span></div>${users.length > 1 ? `<div class="row" style="flex-wrap:wrap;gap:6px"><span class="muted">Ver como:</span>${btns}</div>` : ''}</div>`;
}

function vLogin(inviteCode) {
  const demo = st.isDemo();
  return `<div class="wrap"><main style="padding-bottom:40px;justify-content:center;min-height:100vh">
  <div style="display:flex;gap:6px">${['#12271E:#6EE7B7', '#2A2416:#FFB547', '#2A1810:#FF8A65'].map((c) => `<span style="width:46px;height:46px;border-radius:14px;background:${c.split(':')[0]}"></span>`).join('')}</div>
  <h1 style="font-size:30px;line-height:1.1">Registra el trabajo de tu equipo audiovisual</h1>
  <p class="sub" style="font-size:15px">Quién hizo cada tarea, a tiempo o no, y cuánto le corresponde a cada uno.</p>
  ${inviteCode ? `<div id="invbox">${banner('wait', 'Tienes una invitación', 'Entra con tu correo para aceptarla.')}</div>` : ''}
  ${demo ? `<div class="demo">${st.practice() ? banner('fm', 'Modo práctica', 'Prueba todo con un proyecto de ejemplo. Se guarda solo en este celular y no toca los datos reales.') : banner('warn', 'Modo demo', 'Todavía no está conectada la base de datos. Puedes probar todo: se guarda solo en este navegador.')}<button class="btn b-amber" data-act="seed">Cargar proyecto de ejemplo</button>${st.practice() ? '<button class="btn b-ghost" data-act="practiceOff">Salir del modo práctica</button>' : ''}</div>` : ''}
  ${demo ? '' : `<button class="btn" data-act="google" style="background:#F4F4F5;color:#0B0C10"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>Continuar con Google</button>
  <p class="muted" style="text-align:center;margin:0">o con un código a tu correo</p>`}
  <form data-form="sendCode" class="card">
    <label class="field"><span>Tu correo</span><input class="in" name="email" type="email" required autocomplete="email" placeholder="tucorreo@gmail.com" value="${esc(ui.email || '')}"></label>
    <button class="btn b-amber">${demo ? 'Entrar (demo)' : 'Enviarme el código'}</button>
  </form>
  ${ui.codeSent && !demo ? `<form data-form="verify" class="card">
    <p class="sub" style="margin:0">Te enviamos un correo a <b>${esc(ui.email)}</b>. <b style="color:#fff">Ábrelo en este mismo celular y toca el enlace</b>: entrarás directo. Si no llega en 2 minutos, revisa Spam.</p>
    <p class="muted" style="margin:0">¿Tu correo trae un código de 6 dígitos? Escríbelo aquí:</p>
    <label class="field"><span>Código (opcional)</span><input class="in num" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required style="font-size:22px;letter-spacing:.3em"></label>
    <button class="btn b-amber">Entrar</button>
  </form>` : ''}
  </main></div>`;
}

function vNoTeam(code) {
  return `<div class="wrap"><main style="padding-bottom:40px">
  <h1>Bienvenido</h1><p class="sub">Entraste como ${esc(S.session.user.email)}.</p>
  ${code ? vAccept(code) : ''}
  <form data-form="createTeam" class="card">
    <h3>Crear tu equipo</h3>
    <p class="sub" style="margin:0">Quedas como administrador: invitas a tu socio, propones las reglas y cierras cada proyecto.</p>
    <label class="field"><span>Tu nombre</span><input class="in" name="me" required placeholder="Williams José Velasquez Chambi"></label>
    <label class="field"><span>Nombre del equipo</span><input class="in" name="team" required placeholder="Williams Velasquez · Audiovisual"></label>
    <button class="btn b-amber">Crear equipo</button>
  </form>
  ${code ? '' : `<form data-form="goInvite" class="card"><h3>Tengo una invitación</h3><label class="field"><span>Código de invitación</span><input class="in mono" name="code" required placeholder="A1B2C3D4" style="text-transform:uppercase"></label><button class="btn b-blue">Continuar</button></form>`}
  <button class="btn b-ghost" data-act="signOut">Salir</button>
  </main></div>`;
}

function vAccept(code) {
  const info = ui.inviteInfo;
  if (!info || info.code !== code) { st.inviteInfo(code).then((r) => { ui.inviteInfo = Object.assign({ code }, r || { missing: true }); render(); }).catch(() => { ui.inviteInfo = { code, missing: true }; render(); }); return `<div class="card"><p class="muted">Buscando la invitación…</p></div>`; }
  if (info.missing) return banner('bad', 'Invitación no encontrada', 'Revisa el código o pide uno nuevo.');
  if (info.used) return banner('bad', 'Esta invitación ya se usó', '');
  if (info.expired) return banner('bad', 'La invitación venció', 'Pide a quien te invitó que te envíe una nueva.');
  const isSocio = info.role === 'socio';
  return `<form data-form="accept" class="card" style="border-color:#24345A">
    <input type="hidden" name="code" value="${esc(code)}">
    <p class="lbl" style="color:#A9C7FF">Invitación</p>
    <h2>${esc(info.team)}</h2>
    <span class="chip c-info" style="align-self:flex-start">${ROLE[info.role]}</span>
    ${isSocio ? `<div class="list small" style="color:#D4D4D8;line-height:1.5">
      <div>✓ Ver las etapas de todos los videos y marcar los tuyos.</div>
      <div>✓ Aprobar la liquidación de cada proyecto.</div>
      <div>🔒 Tu racha y tu aporte real solo los ves tú.</div></div>
      <div class="banner bn-warn"><div><b>Antes de entrar</b><p>La app sigue el acuerdo que firmaron: pago por etapa (guion y storyboard S/ 7.81, rodaje S/ 21.88, montaje S/ 10, acabado S/ 15 por video de S/ 62.50), plazos a las 21:00, tolerancia de 10 y 45 min, confirmar el rodaje hasta las 18:00 del día anterior y la reunión con 12 h. La racha nunca cambia lo que cobras.</p></div></div>
      <label class="row small" style="gap:10px"><input type="checkbox" name="ok" required style="width:20px;height:20px"> Leí las reglas y son las mismas del acuerdo que firmé</label>` : ''}
    <label class="field"><span>Tu nombre (así aparecerás)</span><input class="in" name="name" value="${esc(info.name)}" required></label>
    <button class="btn b-blue">Entrar al equipo</button>
  </form>`;
}

// ---------- Inicio ----------
const LVS = {
  'Sin racha': { n: 0, color: '#6B6B75', text: 'var(--tx2)', size: 40, speed: '2.2s', embers: 0, cls: 'lv0' },
  Cumplidor: { n: 1, color: '#FFB547', text: '#FFD08A', size: 44, speed: '1.8s', embers: 2, cls: 'lv1' },
  Constante: { n: 2, color: '#FF9F2E', text: '#FFC978', size: 52, speed: '1.3s', embers: 4, cls: 'lv2' },
  Responsable: { n: 3, color: '#5CC8FF', text: '#A8E1FF', size: 62, speed: '.9s', embers: 7, cls: 'lv3' },
  Imparable: { n: 4, color: '#B98CFF', text: '#D6C2FF', size: 66, speed: '.7s', embers: 9, cls: 'lv4' }
};
const LVCHIP = { 0: '#22242C', 1: '#2A2010', 2: '#2E1D0A', 3: '#0E2533', 4: '#221838' };
function rachaCard(sk) {
  const lv0 = LVS[sk.level.name] || LVS.Cumplidor;
  const rc = lv0.n ? lookFor(theme())['r' + lv0.n] : null;
  const lv = rc ? Object.assign({}, lv0, { color: rc[2], text: rc[3] }) : lv0;
  const min = sk.level.min || 0;
  const lit = sk.next ? Math.round((sk.pts - min) / (sk.next.min - min) * 10) : 10;
  const lefts = [18, 70, 40, 82, 28, 58, 10, 48, 76];
  const embers = Array.from({ length: lv.embers }, (_, i) => `<span class="ember" style="left:${lefts[i]}%;background:${i % 2 ? '#FFF1C2' : lv.color};animation-duration:${(1.4 + (i % 3) * 0.4).toFixed(1)}s;animation-delay:${(i * 0.23).toFixed(2)}s"></span>`).join('');
  const burst = ui.burst && Date.now() - ui.burst < 2200;
  const left = sk.next ? sk.next.min - sk.pts : 0;
  return `<section class="racha ${lv.cls}"${rc ? ` style="background:${rc[0]};border-color:${rc[1]}"` : ''}>
    <div class="rfire"><span class="rglow" style="background:${lv.color}"></span>${burst ? `<span class="rring" style="border-color:${lv.color}"></span>` : ''}${embers}
      <div class="${burst ? 'burst' : ''}">${icon.flame(lv.color, lv.size).replace('class="flame"', `class="flame" style="transform-origin:50% 90%;animation:flick ${lv.speed} ease-in-out infinite"`)}</div></div>
    <div class="rtx"><p class="lbl" style="color:${lv.text}">Tu racha</p>
      <div class="row" style="align-items:baseline;gap:8px"><b class="num" style="font-size:44px;line-height:1;color:${lv.text}">${sk.pts}</b><span class="small" style="color:var(--r-sub)">puntos</span></div>
      <span class="rlv" style="--lvc:${lv.color};--lvt:${lv.text};--lvchip:color-mix(in srgb,${lv.color} 16%,transparent)">Nivel ${lv.n} · ${sk.level.name}</span>
      <div class="rdots">${Array.from({ length: 10 }, (_, i) => `<i style="background:${i < lit ? lv.color : 'var(--r-off)'}"></i>`).join('')}</div>
      <span style="font-size:11px;color:var(--r-sub)">${sk.next ? `${left} ${left === 1 ? 'punto más' : 'puntos más'} para ser ${sk.next.name.toLowerCase()}` : 'Nivel máximo: sigue así'}</span></div>
</section>`;
}
function heroItemCard(x, now) {
  const k = stageOf(x);
  const ev = x.event;
  let when, btn, urgent = true;
  if (x.type === 'event') {
    when = new Date(ev.starts_at) <= now ? 'Empezó a las ' + R.limaTime(ev.starts_at) : 'Empieza a las ' + R.limaTime(ev.starts_at);
    btn = `<button class="hbtn h-arr" data-act="checkin" data-e="${ev.id}">${icon.check}Llegué</button>`;
  } else if (x.type === 'task') {
    when = (x.due < now ? countdown(x.due, now).replace(/^v/, 'V') : 'Vence ' + countdown(x.due, now)) + ' · ' + R.fmtWhen(x.due);
    btn = `<button class="hbtn ${x.take ? 'h-take' : ''}" data-act="quick" data-v="${x.video.id}" data-k="${x.kind}"${x.hire ? ` data-h="${x.hire.id}"` : ''}>${icon.check}${x.take ? 'Tomar' : 'Hecho'}</button>`;
  } else if (x.type === 'claim') {
    when = 'Espera tu confirmación';
    btn = `<div class="grid2"><button class="hbtn h-arr" data-act="confirmArr" data-a="${x.att.id}" data-m="claimed">Sí, a las ${R.limaTime(x.att.claimed_at)}</button><button class="hbtn h-ghost" data-act="confirmArr" data-a="${x.att.id}" data-m="now">Llegó ahora</button></div>`;
  } else if (x.type === 'review') {
    when = 'Revisa hasta ' + whenRel(x.due, now);
    btn = `<div class="grid2"><button class="hb x-red" data-act="review" data-v="${x.video.id}" data-k="no" style="font-size:14px">Pedir cambios</button><button class="hb x-green" data-act="review" data-v="${x.video.id}" data-k="ok" style="font-size:14px">Aprobar</button></div>`;
  } else if (x.type === 'fix') {
    when = 'Corrige hasta ' + R.limaTime(x.due);
    btn = `<button class="hb x-green" data-act="redeliver" data-v="${x.video.id}">${icon.check}Entregar corrección</button>`;
  } else if (x.type === 'endreq') {
    when = 'Espera tu confirmación';
    btn = `<button class="hbtn" data-act="confirmEnd" data-e="${ev.id}">${icon.check}Confirmar fin de la reunión</button>`;
  } else {
    when = 'Te toca responder';
    btn = `<a class="hbtn h-ghost" href="${rowHref(x)}">Ver y responder</a>`;
  }
  return `<section class="hero ${urgent ? 'h-urg' : ''}">
    <div class="row" style="gap:8px"><span class="hdot"></span><span class="lbl hwhen">${when}</span></div>
    <div class="row" style="gap:12px;align-items:flex-start"><span class="tic big tint-${k}">${stageIc(k, 20)}</span>
      <div style="flex:1;min-width:0"><b class="num" style="font-size:20px;line-height:1.2;display:block">${x.title}</b><p class="sub" style="margin:4px 0 0">${x.sub || ''}</p></div></div>
    ${btn}</section>`;
}
// ---------- 1.3 · "Te toca" con botón directo según el momento ----------
const byStart = (a, b) => new Date(a.starts_at) - new Date(b.starts_at);
const evTitle = (e, c) => {
  const nums = e.video_ids.map((id) => (c.videos.find((v) => v.id === id) || {}).num).filter(Boolean).sort((a, b) => a - b);
  const vt = nums.length ? (nums.length === 1 ? 'video ' + nums[0] : 'videos ' + (nums.length > 2 && nums[nums.length - 1] - nums[0] === nums.length - 1 ? nums[0] + ' a ' + nums[nums.length - 1] : nums.slice(0, -1).join(', ') + ' y ' + nums[nums.length - 1])) : '';
  return { t: e.kind === 'rodaje' ? 'Rodaje' + (vt ? ' · ' + vt : '') : 'Reunión de preproducción', vt };
};
const goTxt = (e) => e.kind === 'rodaje' ? 'Abrir rodaje' : 'Entrar a la reunión';
const arrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const waIc = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/></svg>';
const pinIc = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const handIc = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.6 15a1.6 1.6 0 0 1 2.6-1.9L7 14"/></svg>';
const xIc = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const isPartner = (m) => !!m && (m.role === 'admin' || m.role === 'socio');
const otherPartner = () => st.partners().find((m) => m.id !== S.me.id) || null;
// Qué respondió cada uno (para la insignia del compañero).
function rsvpLabel(e, m, c, now) {
  if (!m) return { t: '', cls: 'wait' };
  const r = R.rsvpOf(e, m.id, c);
  const n = first(m);
  if (r.k === 'voy') return { t: `${n} confirmó asistencia`, cls: '', k: 'voy' };
  if (r.k === 'no') return { t: `${n} no irá`, cls: 'wait', k: 'no' };
  if (r.k === 'guillermo') return { t: `${n} envía a Guillermo`, cls: 'wait', k: 'g' };
  return { t: `${n} aún no confirma`, cls: 'wait', k: null };
}
function heroOf(items, now) {
  const me = S.me, c = st.ctx();
  const evs = c.events.filter(active).sort(byStart);
  // 1. Llegada (desde 15 min antes) y, ya marcada, el botón para entrar
  for (const e of evs) {
    const s = st.eventStatus(e, me.id, now);
    const start = new Date(e.starts_at);
    if (s.k === 'pendiente' && R.canCheckIn(e, now)) return { kind: 'arr', event: e };
    const live = e.kind === 'reunion' ? R.meetingOpen(e, now) : R.limaDate(now) === R.limaDate(start) && now >= new Date(start.getTime() - R.RULES.open * 60000) && e.video_ids.some((id) => !S.data.tasks.find((t) => t.video_id === id && t.kind === 'rodaje'));
    if (live && ['puntual', 'tarde', 'por_confirmar'].indexOf(s.k) !== -1) return { kind: 'in', event: e, s };
  }
  // 2. Confirmaciones que solo puede dar el administrador
  for (const t of ['claim', 'endreq', 'review', 'fix']) { const f = items.find((x) => x.type === t); if (f) return { kind: 'item', item: f }; }
  // 3. Tomar lo del compañero (o entregar lo que ya tomaste)
  const take = items.find((x) => x.type === 'task' && (x.cm.claim || x.cm.claimed));
  if (take) return { kind: 'take', item: take };
  // 4. Tarea propia que vence hoy
  const today = items.find((x) => x.type === 'task' && x.band === 0 && x.cm.ok);
  if (today) return { kind: 'task', item: today };
  if (isPartner(me) && st.partners().length > 1) {
    // 5. Confirmar asistencia (la más próxima a vencer)
    const conf = evs.map((e) => ({ e, rs: R.rsvpState(e, me.id, c, now) })).filter((x) => x.rs.open && !x.rs.k).sort((a, b) => a.rs.due - b.rs.due)[0];
    if (conf) return { kind: 'conf', event: conf.e, rs: conf.rs };
    // 6. No confirmaste a tiempo
    const miss = evs.map((e) => ({ e, rs: R.rsvpState(e, me.id, c, now) })).find((x) => x.rs.missed && now < new Date(new Date(x.e.starts_at).getTime() + x.e.tolerance_min * 60000) && R.rsvpOf(x.e, me.id, c).k !== 'no');
    if (miss) return { kind: 'miss', event: miss.e, rs: miss.rs };
  }
  // 7. Lo demás que espera tu respuesta
  for (const t of ['notice', 'hire', 'proposal', 'settle', 'corr']) { const f = items.find((x) => x.type === t); if (f) return { kind: 'item', item: f }; }
  // 8. Todo al día: lo próximo
  const next = evs.find((e) => new Date(e.starts_at) > now);
  return next ? { kind: 'idle', event: next } : null;
}
function heroCard(h, now) {
  const c = st.ctx();
  const me = S.me;
  if (h.kind === 'item') return heroItemCard(h.item, now);
  const card = (tone, when, ic, title, sub, body) => `<section class="hero ${tone}">
    <div class="row" style="gap:8px"><span class="hdot"></span><span class="lbl hwhen">${when}</span></div>
    <div class="row" style="gap:12px;align-items:flex-start"><span class="tic big tint-${ic === 'miss' ? 'post' : ic}">${stageIc(ic === 'miss' ? 'post' : ic, 20)}</span>
      <div style="flex:1;min-width:0"><b class="num" style="font-size:20px;line-height:1.2;display:block">${title}</b>${sub ? `<p class="sub" style="margin:4px 0 0">${sub}</p>` : ''}</div></div>${body}</section>`;
  if (h.kind === 'take' || h.kind === 'task') {
    const x = h.item;
    const k = stageOf(x);
    if (x.cm.claim) return card('h-calm', `Puedes tomarlo hasta ${R.limaTime(x.cm.limit)}`, k, x.title, x.kind === 'montaje' ? x.sub : `De ${first(st.member(x.video.owner))} · no llegó a tiempo`,
      `<button class="hb x-blue" data-act="claim" data-v="${x.video.id}" data-k="${x.kind}">${handIc}Tomar</button>`);
    if (x.cm.claimed) return card('h-calm', `Lo tomaste · hasta ${R.fmtWhen(x.cm.limit)}`, k, x.title, `De ${first(st.member(x.video.owner))}`,
      `<div class="claimrow">${av(me, 22)}Entrégalo antes de ${R.fmtWhen(x.cm.limit)}</div><button class="hb x-green" data-act="quick" data-v="${x.video.id}" data-k="${x.kind}">${icon.check}Hecho</button>`);
    const when = (x.due < now ? countdown(x.due, now).replace(/^v/, 'V') : 'Vence ' + countdown(x.due, now)) + ' · ' + R.limaTime(x.due);
    return card('h-urg', when, k, x.title, x.sub, `<button class="hb ${x.hire ? 'x-violet' : 'x-green'}" data-act="quick" data-v="${x.video.id}" data-k="${x.kind}"${x.hire ? ` data-h="${x.hire.id}"` : ''}>${icon.check}${x.hire ? 'Hecho con Guillermo' : 'Hecho'}</button>`);
  }
  const e = h.event;
  const T = evTitle(e, c);
  const ic = e.kind === 'rodaje' ? 'prod' : 'pre';
  const start = new Date(e.starts_at);
  const go = (primary) => `<a class="hb ${primary ? 'x-amber' : 'x-ghost'}" href="#/e/${e.id}" style="font-size:15px">${goTxt(e)}${arrow}</a>`;
  if (h.kind === 'arr') {
    const punt = R.limaTime(new Date(start.getTime() + R.RULES.punt * 60000));
    return card('h-urg', (start <= now ? 'Empezó a las ' : 'Empieza a las ') + R.limaTime(start), ic, T.t, (e.kind === 'reunion' && T.vt ? T.vt.charAt(0).toUpperCase() + T.vt.slice(1) + ' · ' : '') + 'puntual hasta ' + punt,
      `<button class="hb x-green" data-act="checkin" data-e="${e.id}">${pinIc}Llegué</button>${go(false)}`);
  }
  if (h.kind === 'in') {
    const a = st.attOf(e.id, me.id);
    const t = a && a.arrived_at ? `Llegaste ${R.limaTime(a.arrived_at)} · ${h.s.k === 'puntual' ? 'puntual' : 'con tardanza'}` : `Marcaste ${R.limaTime(a.claimed_at)} · ${first(st.admin() || { name: 'el administrador' })} la confirma`;
    return card('h-ok', e.kind === 'rodaje' ? 'Rodaje en curso' : 'Reunión en curso', ic, T.t, '', `<div class="okrow">${icon.check}${t}</div>${go(true)}`);
  }
  if (h.kind === 'conf') {
    const o = otherPartner();
    const pl = rsvpLabel(e, o, c, now);
    const g = e.kind === 'reunion' && now < start;
    return card('h-calm', 'Confirma hasta ' + R.fmtWhen(h.rs.due), ic, T.t, R.fmtWhen(e.starts_at) + (e.kind === 'reunion' && T.vt ? ' · ' + T.vt : ''),
      `<div style="display:flex;flex-direction:column;gap:10px"><div class="row" style="gap:8px"><span class="confbadge">CONFIRMA</span><b class="num" style="font-size:17px">¿Asistirás?</b></div>
      ${o ? `<div class="partner ${pl.cls}">${av(o, 26)}<span>${pl.t}</span></div>` : ''}
      ${rsvpButtons(e, g)}</div>`);
  }
  if (h.kind === 'miss') {
    const o = otherPartner();
    const msg = `Hola ${o ? first(o) : ''}, sobre ${e.kind === 'rodaje' ? 'el rodaje' : 'la reunión'} del ${R.fmtWhen(e.starts_at)}: `;
    return card('h-miss', 'No confirmaste · venció ' + R.fmtWhen(h.rs.due), ic, T.t, R.fmtWhen(e.starts_at),
      `<div class="missrow">${icon.bell('#FF8A7A', 18)}<p>Avisa a ${o ? first(o) : 'tu compañero'} si asistirás o no.</p><span class="pts-neg">−2</span></div>
      <a class="hb x-green" href="${st.waLink(o, msg)}" target="_blank" rel="noopener" style="font-size:14px">${waIc}Escribir a ${o ? first(o) : 'tu compañero'} por WhatsApp</a>${go(false)}`);
  }
  if (h.kind === 'idle') return card('h-idle', 'Al día · lo próximo', ic, T.t, R.fmtWhen(e.starts_at), `<a class="hb x-ghost" href="#/videos" style="font-size:15px">Ver en etapas${arrow}</a>`);
  return '';
}
// Voy · No iré · Guillermo (Guillermo solo en reuniones)
function rsvpButtons(e, withG) {
  return `<div class="rsrow">
    <button class="rs x-green" data-act="rsvp" data-e="${e.id}" data-k="voy">${icon.check}Voy</button>
    <button class="rs x-ghost" data-act="rsvp" data-e="${e.id}" data-k="no">${xIc}${e.kind === 'rodaje' ? 'No podré ir' : 'No iré'}</button>
    ${withG ? `<button class="rs x-violet" data-act="rsvp" data-e="${e.id}" data-k="guillermo"><span class="gav">G</span>Guillermo</button>` : ''}</div>`;
}
// Aviso positivo al dueño cuando su compañero toma lo suyo.
function teamMsgs(now) {
  const me = S.me, c = st.ctx();
  return (c.claims || []).filter((cl) => cl.member_id !== me.id && (cl.status || 'activa') === 'activa').map((cl) => {
    const v = c.videos.find((x) => x.id === cl.video_id);
    if (!v || v.owner !== me.id || cl.kind === 'montaje') return null;
    if (R.claimOf(v, cl.kind, c) !== cl) return null;
    if (S.data.tasks.find((t) => t.video_id === v.id && t.kind === cl.kind)) return null;
    const what = cl.kind === 'montaje' ? 'el montaje' : 'el ' + cl.kind;
    return `Equipo que cumple: ${first(st.member(cl.member_id))} hará ${what} del video ${v.num} y ${cl.kind === 'montaje' ? 'la entrega' : 'el rodaje'} sigue en pie.`;
  }).filter(Boolean);
}
// 1.4: el video que pasó al administrador (tomado o automático), mientras no se entregue.
function handoffMsgs(now) {
  const me = S.me, c = st.ctx();
  const A = first(st.admin() || { name: 'el administrador' });
  return c.videos.filter((v) => v.owner === me.id).map((v) => { const s = R.videoState(v, c, now); return s.post.handoff && !s.ac ? `Equipo que cumple: ${A} editará el video ${v.num} y el cliente lo recibe a tiempo.` : null; }).filter(Boolean);
}
const msgCard = (t) => `<section class="msgcard"><span class="tic" style="background:#1D2638">${icon.bell('#8AB4FF', 18)}</span><p>${esc(t)}</p></section>`;

// ---------- 1.3 · Tarjeta de racha al cumplir (solo al rescatar o al terminar tu última entrega de la semana) ----------
const LVBOX = { 0: ['#15161C', '#262830'], 1: ['#17130C', '#3A3220'], 2: ['#1C130A', '#4A3414'], 3: ['#0C1720', '#1E3A52'], 4: ['#160F22', '#3E2C63'] };
const PHRASE = { 0: 'Cada entrega a tiempo suma.', 1: 'Buen comienzo: cada entrega a tiempo suma.', 2: 'Vas constante. ¡Sigue así!', 3: 'El equipo puede contar contigo.', 4: 'Imparable. Nada te detiene.' };
function afterMark(v, k, cm, before) {
  const c = st.ctx(v.project_id);
  const now = new Date();
  const after = R.streak(S.me.id, c, now).pts;
  let rot = 0; try { rot = Number(localStorage.getItem('ra-rot') || 0); localStorage.setItem('ra-rot', String(rot + 1)); } catch (e) { /* */ }
  if (k === 'acabado' && cm && cm.take && v.owner !== S.me.id) {
    const T = ['¡Video rescatado!', 'Gracias a ti, el cliente lo recibe a tiempo', `Salvaste el video ${v.num}`];
    ui.rpop = { title: T[rot % 3], from: before, to: after, chips: ['+' + R.PTS.rescue + ' rescate'] };
    render(); return;
  }
  if (k === 'montaje' && cm && cm.take) return;
  if (k === 'montaje' || k === 'acabado') { postDone(v, c, now, before, after, rot); return; }
  if (cm && cm.claimed && PRE[k]) {
    const T = ['¡Entregable rescatado!', 'Gracias a ti, el rodaje sigue en pie', `Salvaste el ${k} del video ${v.num}`];
    ui.rpop = { title: T[rot % 3], from: before, to: after, chips: ['+' + R.PTS.rescue + ' rescate'] };
    render(); return;
  }
  if (!PRE[k] || v.owner !== S.me.id) return;
  const rod = R.rodajeOf(v, c);
  if (!rod) return;
  const mine = rod.video_ids.map((id) => c.videos.find((x) => x.id === id)).filter((x) => x && x.owner === S.me.id);
  const allDone = mine.every((x) => { const s = R.videoState(x, c, now); return s.g && s.s; });
  if (!allDone) return;
  const mt = R.meetingOf(v, c);
  const reu = R.streakEvents(S.me.id, c, now).filter((e) => /Punto de reunión/.test(e.why) && mine.some((x) => e.why.endsWith('video ' + x.num))).length;
  const T = ['¡Entregables listos!', '¡Cumpliste!', '¡Listo para el rodaje!', 'Tu parte está completa'];
  ui.rpop = { title: T[rot % 4], from: before, to: after, chips: ['+' + mine.length + ' a tiempo'].concat(reu && mt ? ['+' + reu + ' de reunión'] : []) };
  render();
}
// Posproducción: al entregar lo último que te toca de los videos de ese rodaje, la misma tarjeta.
function postDone(v, c, now, before, after, rot) {
  const me = S.me;
  const rod = R.rodajeOf(v, c) || c.events.find((e) => e.kind === 'rodaje' && e.video_ids.indexOf(v.id) !== -1);
  const group = (rod ? rod.video_ids : [v.id]).map((id) => c.videos.find((x) => x.id === id)).filter(Boolean);
  let own = 0, apoyo = 0, pend = 0;
  for (const x of group) {
    const s = R.videoState(x, c, now);
    const o = st.member(x.owner);
    const cl = R.claimOf(x, 'montaje', c);
    // 1.4: los videos con apoyo cuentan cuando están entregados (final de apoyo hecho o entrega aprobada).
    if (o.apoyo && x.owner === me.id) { if (s.post.handoff) continue; if (s.delivered) own++; else pend++; continue; }
    const mineM = (x.owner === me.id && !s.montajeMissed) || (cl && cl.member_id === me.id) || (me.role === 'admin' && s.post.handoff);
    const mineF = (x.owner === me.id && !o.apoyo) || (me.role === 'admin' && x.owner !== me.id && (o.apoyo || s.reassigned));
    if (mineM) { if (s.mo) { if (x.owner === me.id) own++; } else pend++; }
    if (mineF) { if (s.ac) { if (x.owner === me.id || s.reassigned) own++; else apoyo++; } else pend++; }
  }
  if (pend || !(own + apoyo)) return;
  // La tarjeta muestra lo que sumó la entrega de esa semana (no solo el último toque).
  const nums = group.map((x) => x.num);
  const re = new RegExp('(Montaje del video|montaje del video|Video) (' + nums.join('|') + ')( |$)');
  const got = R.streakEvents(me.id, c, now).filter((e) => re.test(e.why)).reduce((a, e) => a + e.pts, 0);
  before = Math.max(0, after - Math.max(0, got));
  const T = ['¡Videos entregados!', '¡Cumpliste!', '¡Semana entregada al cliente!', 'Tu parte está completa'];
  ui.rpop = { title: T[rot % 4], from: before, to: after, chips: (own ? [own + (own === 1 ? ' entrega' : ' entregas')] : []).concat(apoyo ? [`Apoyo: ${apoyo} ${apoyo === 1 ? 'final' : 'finales'}`] : []) };
  render();
}
function rachaPop(P) {
  const lvTo = R.level(P.to), lvFrom = R.level(P.from);
  const lv = LVS[lvTo.name] || LVS.Cumplidor;
  const box = LVBOX[lv.n] || LVBOX[1];
  const up = (LVS[lvTo.name] || {}).n > (LVS[lvFrom.name] || {}).n;
  const min = lvTo.min || 0; const nx = R.nextLevel(P.to);
  const lit = nx ? Math.round((P.to - min) / (nx.min - min) * 10) : 10;
  const lefts = [18, 70, 40, 82, 28, 58, 10, 48, 76];
  const embers = Array.from({ length: lv.embers }, (_, i) => `<span class="ember" style="left:${lefts[i]}%;background:${i % 2 ? '#FFF1C2' : lv.color};animation-duration:${(1.4 + (i % 3) * 0.4).toFixed(1)}s;animation-delay:${(i * 0.23).toFixed(2)}s"></span>`).join('');
  const fresh = !P.seen; P.seen = true;
  return `<div class="rpop"${fresh ? ' data-fresh' : ''} role="dialog" aria-label="${esc(P.title)}"><section style="background:${box[0]};border-color:${box[1]}">
    <div class="rfire" style="width:120px;height:120px"><span class="rglow" style="background:${lv.color};width:96px;height:96px"></span>${up ? `<span class="rring" style="border-color:${lv.color}"></span>` : ''}${embers}
      <div class="${up ? 'burst' : ''}">${icon.flame(lv.color, lv.size + 14).replace('class="flame"', `class="flame" style="transform-origin:50% 90%;animation:flick ${lv.speed} ease-in-out infinite"`)}</div></div>
    <div><h2>${esc(up ? '¡Subiste a ' + lvTo.name + '!' : P.title)}</h2><p style="margin:6px 0 0;font-size:14px;color:${lv.text};line-height:1.4">${PHRASE[lv.n] || ''}</p></div>
    <div class="row" style="gap:8px;align-items:baseline;justify-content:center"><b class="num" data-popcount="${P.to}" data-popfrom="${P.from}"${P.counted ? ' data-done="1"' : ''} style="font-size:52px;line-height:1;color:${lv.text}">${P.counted ? P.to : P.from}</b><span style="font-size:14px;color:${lv.text};opacity:.8">puntos</span>${P.to > P.from ? `<b class="num" style="margin-left:4px;font-size:18px;color:#C9F7E3">+${P.to - P.from}</b>` : ''}</div>
    <span class="rlv" style="align-self:center;--lvc:${lv.color};--lvt:${lv.text};--lvchip:${LVCHIP[lv.n] || '#22242C'}">Nivel ${lv.n} · ${lvTo.name}</span>
    <div class="rdots" style="width:100%">${Array.from({ length: 10 }, (_, i) => `<i style="background:${i < lit ? lv.color : 'rgba(255,255,255,.1)'}"></i>`).join('')}</div>
    <div class="rchips">${P.chips.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
    <button class="hb x-ghost" data-act="popClose" style="color:#F4F4F5!important">Seguir</button></section></div>`;
}
function animatePop() {
  const el = document.querySelector('[data-popcount]');
  if (!el || el.dataset.done) return;
  el.dataset.done = '1';
  const to = Number(el.dataset.popcount), from = Number(el.dataset.popfrom);
  const t0 = performance.now() + 450;
  const step = (t) => { const k = Math.max(0, Math.min(1, (t - t0) / 1400)); const e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1 && document.body.contains(el)) requestAnimationFrame(step); else if (ui.rpop) ui.rpop.counted = true; };
  requestAnimationFrame(step);
}

function vHome() {
  const me = S.me;
  const now = new Date();
  const c = st.ctx();
  const p = st.project();
  const sk = R.streak(me.id, c, now);
  let html = `<div class="row"><div style="flex:1;min-width:0"><p class="sub" style="margin:0">Hola,</p><h1 style="font-size:28px">${first(me)}</h1></div>${av(me, 44)}</div>`;
  html += rachaCard(sk);
  if (!p) return html + `<div class="card">${banner('wait', 'Todavía no hay proyectos', S.me.role === 'admin' ? 'Crea el primero tocando el nombre del proyecto arriba.' : 'Cuando el administrador cree uno, aparecerá aquí.')}${isAdminBtn('<a class="btn b-amber" href="#/proyecto/nuevo">Crear proyecto</a>')}</div>`;
  let items = pending(now);
  // Los videos de un rodaje aún no habilitado se representan con el rodaje mismo.
  items = items.filter((x) => !(x.type === 'task' && x.kind === 'rodaje' && !x.cm.ok));
  const hero = heroOf(items, now);
  const rest = items.filter((x) => !hero || (x !== hero.item && !(hero.event && x.type === 'event' && x.event === hero.event)));
  const today = R.limaDate(now);
  const idx = (x) => { if (!x.due || x.urgent) return 0; const d = dayDiff(today, R.limaDate(x.due)); return d < 0 ? 0 : d > 4 ? 5 : d; };
  const days = [[], [], [], [], [], []];
  rest.forEach((x) => days[idx(x)].push(x));
  const nDays = days[5].length ? 6 : 5;
  if (ui.day == null || ui.dayFor !== today) { ui.day = Math.max(0, days.findIndex((d) => d.length)); ui.dayFor = today; }
  const sel = Math.min(ui.day, nDays - 1);
  const pendCount = items.length;
  html += `<div class="between" style="margin-top:2px;align-items:baseline"><p class="num" style="margin:0;font-size:20px;font-weight:700">Te toca</p><span class="muted">${pendCount ? pendCount + (pendCount === 1 ? ' pendiente' : ' pendientes') : 'Todo al día'}</span></div>`;
  html += teamMsgs(now).concat(handoffMsgs(now)).map(msgCard).join('');
  if (hero) html += heroCard(hero, now);
  const sq = Array.from({ length: nDays }, (_, i) => {
    const d = R.addDays(today, i);
    const list = days[i];
    const b = list.length ? Math.min(...list.map((x) => x.band)) : null;
    const dt = new Date(d + 'T12:00:00-05:00');
    return `<button role="tab" aria-selected="${i === sel}" class="dsq ${b === null ? 'd-none' : 'd-u' + b} ${i === sel ? 'on' : ''}" data-act="day" data-i="${i}">
      <span class="dw">${i === 0 ? 'HOY' : i === 5 ? 'LUEGO' : DOW[dt.getUTCDay()]}</span><b class="num">${i === 5 ? '+' : Number(d.slice(8, 10))}</b><span class="dn">${list.length ? list.length + (list.length === 1 ? ' tarea' : ' tareas') : '—'}</span></button>`;
  }).join('');
  html += `<div style="display:flex;flex-direction:column;gap:8px"><div class="dsqs" role="tablist" aria-label="Día">${sq}</div>
    <div class="legend"><span><i class="lg u0"></i>Urgente</span><span><i class="lg u1"></i>Próximo</span><span><i class="lg u2"></i>Con tiempo</span></div></div>`;
  const list = days[sel];
  const d0 = R.addDays(today, sel);
  const dt0 = new Date(d0 + 'T12:00:00-05:00');
  const LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const bsel = list.length ? Math.min(...list.map((x) => x.band)) : null;
  const dayTitle = sel === 5 ? 'Más adelante' : (sel === 0 ? 'Hoy, ' : '') + LONG[dt0.getUTCDay()] + ' ' + Number(d0.slice(8, 10));
  html += `<section class="tlist"><p class="lbl ${bsel === null ? '' : 'c-u' + bsel}" style="margin:10px 0 4px;font-size:10px">${dayTitle}${bsel === null ? '' : ' · ' + ['urgente', 'próximo', 'con tiempo'][bsel]}</p>
    ${list.map((x, i) => pendItem(x, now, i)).join('') || '<p class="tempty">Nada para este día.</p>'}</section>`;
  // Meta del equipo
  const st8 = c.videos.map((v) => R.videoState(v, c, now));
  const cnt = (f) => st8.filter(f).length;
  const T = p.videos_total;
  const delivered = cnt((s) => s.delivered);
  const pct = Math.round(delivered / T * 100);
  html += `<section class="meta"><div class="between" style="align-items:center"><span class="lbl" style="color:var(--meta-bar,var(--amber))">Meta del equipo</span><div style="display:flex">${st.partners().map((m, i) => `<span style="margin-left:${i ? -8 : 0}px;border:2px solid var(--meta-bg);border-radius:50%">${av(m, 26)}</span>`).join('')}</div></div>
    <div class="between" style="align-items:baseline"><b class="num" style="font-size:44px;line-height:1">${pct}%</b><span class="small" style="color:var(--meta-sub);text-align:right">${delivered} de ${T} videos<br>entregados al cliente</span></div>
    <div class="mbar"><div style="width:${pct}%"><span class="sheen"></span></div></div>
    <div class="mstats">
      <div>${icon.pen('var(--c-pre)', 18)}<b class="num">${cnt((s) => s.g && s.s)}/${T}</b><span>Guiones</span></div>
      <div>${icon.cam('var(--c-prod)', 18)}<b class="num">${cnt((s) => s.r)}/${T}</b><span>Rodaje</span></div>
      <div>${icon.cut('var(--c-post)', 18)}<b class="num">${cnt((s) => s.mo)}/${T}</b><span>Montaje</span></div>
      <div>${icon.star('var(--c-prod)', 18)}<b class="num">${delivered}/${T}</b><span>Entregados</span></div></div></section>`;
  // En la billetera
  const total = myTotal(p);
  const prev = ui.wallet == null ? 0 : ui.wallet;
  ui.walletFrom = prev; ui.wallet = total;
  html += `<section class="wallet"><div class="between" style="align-items:center"><span class="lbl" style="color:var(--w-title,var(--mint))">En la billetera</span><span class="muted" style="color:var(--w-sub)">${icon.lock} Solo tú</span></div>
    <b class="num wmoney" data-wallet="${total.toFixed(2)}" data-from="${prev.toFixed(2)}">${R.money(prev)}</b>
    ${(() => { const w = (R.payouts(p, c, now).espera || {})[me.id] || 0; return w > 0.004 ? `<p class="wwait">${icon.clock}+ ${R.money(w)} en espera · se suma al entregarse el video</p>` : ''; })()}
    <p class="small" style="margin:0;color:var(--w-sub)">${esc(p.client)} · ${esc(p.name)} · se cobra al cerrar el proyecto</p></section>`;
  return html;
}

function isAdminBtn(h) { return st.isAdmin() ? h : ''; }

// ---------- Etapas ----------
function evChip(e, now = new Date()) {
  if (e.status === 'cancelado') return '<span class="chip c-mute">Cancelado</span>';
  if (e.status === 'reprogramado') return '<span class="chip c-mute">Reprogramado</span>';
  if (e.kind === 'reunion' && e.ended_at) return '<span class="chip c-ok">Finalizada</span>';
  if (e.kind === 'reunion' && e.end_requested_at) return '<span class="chip c-late">Por confirmar fin</span>';
  if (e.kind === 'reunion' && R.meetingOpen(e, now)) return '<span class="chip c-late">En curso</span>';
  if (new Date(e.starts_at) < now) return '<span class="chip c-mute">Pasó</span>';
  return '<span class="chip c-info">Programado</span>';
}
function vrow(v, c, now, stage) {
  const s = R.videoState(v, c, now);
  const o = st.member(v.owner);
  const col = COLOR[o.role] || ['#22242C', '#C9C9D1'];
  const ok = (t, late) => t ? (late ? 'late' : 'ok') : null;
  let steps = [], due = '', dueC = '';
  const urg = (d) => { const b = R.band(d, now); return 'u' + b; };
  if (stage === 'pre') {
    const vencido = s.d.preDue && now > s.d.preDue;
    steps = [['G', 'Guion', ok(s.g, s.preLate) || (vencido ? 'urg' : 'p')], ['S', 'Storyboard', ok(s.s, s.preLate) || (vencido ? 'urg' : 'p')]];
    if (s.g && s.s) { const last = new Date(Math.max(new Date(s.g.done_at), new Date(s.s.done_at))); due = s.preLate ? 'Entregado ' + R.fmtWhen(last) + ' · fuera de plazo' : 'Listo · ' + R.fmtWhen(last); dueC = s.preLate ? 'u1' : 'okc'; }
    else if (!s.d.preDue) { due = 'Sin rodaje: sin plazo'; dueC = ''; }
    else if (vencido) { due = 'Venció ' + R.fmtWhen(s.d.preDue) + ' · para tomar'; dueC = 'u0'; }
    else { due = 'Entrega: ' + R.fmtWhen(s.d.preDue) + ' · ' + countdown(s.d.preDue, now); dueC = urg(s.d.preDue); }
  } else if (stage === 'rod') {
    steps = [['R', 'Rodaje', s.r ? 'ok' : s.rodaje ? 'lock' : 'urg']];
    if (s.r) { due = 'Grabado ' + R.fmtWhen(s.r.done_at) + (s.r.done_by !== v.owner ? ' · por ' + first(st.member(s.r.done_by)) : ''); dueC = 'okc'; }
    else if (!s.rodaje) { due = 'Sin rodaje programado'; dueC = 'u0'; }
    else if (!(s.g && s.s)) { due = 'Falta ' + (!s.g ? 'el guion' : 'el storyboard') + ' para poder grabar'; dueC = 'u0'; }
    else { due = R.fmtWhen(s.rodaje.starts_at) + ' · llegada desde ' + R.limaTime(new Date(new Date(s.rodaje.starts_at).getTime() - R.RULES.open * 60000)); dueC = urg(new Date(s.rodaje.starts_at)); }
  } else {
    const mDue = s.d.montajeDue || s.d.finalDue;
    steps = [['M', 'Montaje', s.mo ? (s.montajeLate ? 'late' : 'ok') : s.montajeMissed ? 'urg' : s.r ? 'p' : 'lock'], ['F', 'Video final', s.ac ? (s.finalLate ? 'late' : 'ok') : s.mo ? 'p' : 'lock']];
    if (s.ac) { due = 'Entregado ' + R.fmtWhen(s.ac.done_at) + (s.finalLate ? ' · tarde' : ' · a tiempo'); dueC = s.finalLate ? 'u1' : 'okc'; }
    else if (s.montajeMissed && !s.mo) { due = 'Montaje no llegó · pasó a ' + first(st.admin() || { name: 'el administrador' }) + ' (5.7)'; dueC = 'u0'; }
    else if (!s.r) { due = 'Final ' + R.fmtWhen(s.d.finalDue) + ' · después del rodaje'; dueC = ''; }
    else if (!s.mo) { due = 'Montaje: ' + R.fmtWhen(mDue) + ' · ' + countdown(mDue, now); dueC = urg(mDue); }
    else { due = 'Final: ' + R.fmtWhen(s.d.finalDue) + ' · ' + countdown(s.d.finalDue, now) + (s.apoyo || o.apoyo ? ' · apoyo' : ''); dueC = urg(s.d.finalDue); }
  }
  const warn = dueC === 'u0' && !(stage === 'post' && s.ac);
  return `<a class="vcard${warn ? ' warn' : ''}" href="#/v/${v.id}" aria-label="Ver detalle del video ${v.num}">
    <span class="vnum"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span></span>
    <span class="vtx"><b>${v.title ? esc(v.title) : 'Video ' + v.num}</b><span class="due-l ${dueC}">${icon.clock}${due}</span></span>
    <span class="vsteps">${steps.map(([sh, name, k]) => `<i class="vs vs-${k}" title="${name}">${k === 'ok' || k === 'late' ? icon.tick : sh}</i>`).join('')}</span>
    ${icon.chev}</a>`;
}

// ---------- Etapas 1.3 (N y O): cuadros de etapa, solo esta semana, confirmaciones que se minimizan ----------
const STC = {
  pre: { t: 'Preproducción', ic: 'pre', c: 'var(--st-pre-c)', solid: 'var(--st-pre)', bg: '#12271E', bd: '#2F6B4F' },
  rod: { t: 'Rodaje', ic: 'prod', c: 'var(--st-rod-c)', solid: 'var(--st-rod)', bg: '#2A2416', bd: '#6B4A1A' },
  post: { t: 'Posproducción', ic: 'post', c: 'var(--st-post-c)', solid: 'var(--st-post)', bg: '#2A1810', bd: '#6B3A22' }
};
const DOWL = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const calTile = (iso, cls) => { const d = R.limaDate(iso); const dt = new Date(d + 'T12:00:00-05:00'); return `<span class="calt ${cls}"><small>${DOWL[dt.getUTCDay()]}</small><b>${Number(d.slice(8, 10))}</b></span>`; };
// Rodaje de "esta semana": el próximo (o el de hoy) que aún tiene algo por grabar.
function weekRodaje(c, now) {
  const today = R.limaDate(now);
  const rods = c.events.filter((e) => e.kind === 'rodaje' && active(e)).sort(byStart);
  return rods.find((e) => R.limaDate(e.starts_at) >= today) || null;
}
function meetingFor(rod) { return rod ? S.data.events.filter((x) => x.kind === 'reunion' && x.rodaje_id === rod.id && active(x)).sort(byStart).pop() || null : null; }
// Avatares con su respuesta (✓ va · ✗ no va · G Guillermo).
function whoMini(e, c) {
  return st.partners().map((m) => {
    const r = R.rsvpOf(e, m.id, c);
    const dot = r.k === 'voy' ? `<i style="background:#133626">${icon.tick.replace('width="13" height="13"', 'width="8" height="8"').replace('currentColor', '#6EE7B7')}</i>` : r.k === 'no' ? '<i style="background:#2A1212;color:#FF8A7A;font-size:9px;font-weight:700">×</i>' : r.k === 'guillermo' ? '<i style="background:#C9B2FF;color:#160F22;font-size:8px;font-weight:700">G</i>' : '<i style="background:#22242C"></i>';
    return `<span class="avd">${av(m, 28)}${dot}</span>`;
  }).join('');
}
// Tarjeta de confirmación (reunión o rodaje). Al responder se minimiza; al tocarla se abre.
function confCard(e, now, bare) {
  const c = st.ctx(e.project_id);
  const me = S.me;
  const isR = e.kind === 'rodaje';
  const cls = isR ? 'rod' : 'pre';
  const rs = R.rsvpState(e, me.id, c, now);
  const start = new Date(e.starts_at);
  const open = (ui.evOpen || {})[e.id];
  const started = now >= new Date(start.getTime() - R.RULES.open * 60000);
  const rod = isR ? null : S.data.events.find((x) => x.id === e.rodaje_id);
  const title = isR ? `Rodaje · ${R.limaTime(start)}` : `Reunión · ${R.fmtDay(R.limaDate(start))}, ${R.limaTime(start)}`;
  const sub = isR ? evTitle(e, c).vt || 'Sin videos aún' : rod ? 'Para el rodaje del ' + R.fmtDay(R.limaDate(rod.starts_at)) : '';
  const ic = stageIc(isR ? 'prod' : 'pre', 20);
  const go = (primary) => `<a class="hb ${primary ? 'x-amber' : 'x-ghost'}" href="#/e/${e.id}" style="font-size:15px">${goTxt(e)}${arrow}</a>`;
  const o = otherPartner();
  const ask = isPartner(me) && rs.open && (!rs.k || open === 'ask');
  // Minimizada: ya respondió (o ya no hay nada que responder) y no la abrió.
  if (!ask && !rs.missed && !open && !started && !bare) {
    return `<button class="evmin ${cls}" data-act="evToggle" data-e="${e.id}" aria-expanded="false">${calTile(e.starts_at, cls)}
      <span style="flex:1;min-width:0"><b style="display:block;font-size:14px">${title}</b><span class="muted" style="display:block;margin-top:2px">${sub}</span></span>
      <span class="row" style="gap:4px">${whoMini(e, c)}</span>${icon.down}</button>`;
  }
  let body = '';
  if (ask) {
    const pl = rsvpLabel(e, o, c, now);
    body = `<div style="display:flex;flex-direction:column;gap:8px"><div class="row" style="gap:8px"><span class="confbadge">CONFIRMA</span><b class="num" style="font-size:17px">¿Asistirás?</b></div>
      ${o ? `<div class="partner ${pl.cls}">${av(o, 24)}<span>${pl.t}</span></div>` : ''}
      <p class="muted" style="margin:0;font-weight:600">Confirma hasta ${R.fmtWhen(rs.due)}</p>${rsvpButtons(e, !isR && now < start)}</div>`;
  } else if (rs.missed && !rs.k) {
    const msg = `Hola ${o ? first(o) : ''}, sobre ${isR ? 'el rodaje' : 'la reunión'} del ${R.fmtWhen(e.starts_at)}: `;
    body = `<div class="missrow">${icon.bell('#FF8A7A', 18)}<p>No confirmaste. Avisa por WhatsApp a tu compañero si asistirás o no.</p><span class="pts-neg">−2</span></div>
      <a class="hb x-green" href="${st.waLink(o, msg)}" target="_blank" rel="noopener" style="font-size:14px">${waIc}Escribir a ${o ? first(o) : 'tu compañero'} por WhatsApp</a>${go(started)}`;
  } else {
    const k = rs.k;
    const t = k === 'voy' ? 'Vas' : k === 'no' ? (isR ? 'No podrás ir' : 'No irás') : k === 'guillermo' ? 'Va Guillermo por ti' : 'Sin respuesta';
    const SH = { voy: 'Va', no: 'No va', g: 'Guillermo' };
    body = `<div class="row" style="gap:8px">${st.partners().map((m) => { const l = rsvpLabel(e, m, c, now); return `<span class="partner ${m.id === me.id ? (k === 'voy' ? '' : 'wait') : l.cls}" style="flex:1">${av(m, 22)}<span>${m.id === me.id ? t : (SH[l.k] || 'Sin respuesta')}</span></span>`; }).join('')}</div>
      <div class="row" style="gap:8px"><span style="flex:1">${go(k === 'voy' || started)}</span>${rs.open && isPartner(me) ? `<button class="btn sm b-ghost" data-act="rsvpChange" data-e="${e.id}" style="min-height:52px">Cambiar</button>` : ''}</div>
      ${rs.open ? `<p class="muted" style="margin:0;font-weight:600">Puedes cambiar hasta ${R.fmtWhen(rs.due)}</p>` : ''}`;
  }
  if (bare) return `<section class="evcard ${rs.missed && !rs.k ? 'late' : cls}">${body}</section>`;
  return `<section class="evcard ${rs.missed && !rs.k ? 'late' : cls}">
    <div class="row" style="gap:12px">${calTile(e.starts_at, cls)}<div style="flex:1;min-width:0"><b style="display:block;font-size:15px">${title}</b><span class="muted" style="display:block;margin-top:2px">${sub}</span></div>
    ${open && !ask ? `<button class="ibtn" data-act="evToggle" data-e="${e.id}" aria-label="Minimizar" style="transform:rotate(180deg)">${icon.down}</button>` : ''}</div>${body}</section>`;
}
// Línea de avance de un video: guion, storyboard, cámara, tijera, estrella.
function vTrack(v, c, now) {
  const s = R.videoState(v, c, now);
  const steps = [['g', 'pre'], ['s', 'pre'], ['r', 'prod'], ['mo', 'post'], ['ac', 'star']];
  let cur = steps.findIndex(([k]) => !s[k]);
  return `<div class="vtrack" aria-hidden="true">${steps.map(([k, ic], i) => {
    const done = !!s[k];
    const miss = !done && ((k === 'g' || k === 's') && s.d.preDue && now > s.d.preDue || (k === 'mo' && s.montajeMissed));
    const isCur = i === cur;
    const bg = done ? '#12271E' : miss ? '#2A1212' : 'transparent';
    const ring = done ? '#2F6B4F' : miss ? '#FF6B5B' : isCur ? '#FFB547' : '#3A3D46';
    const col = done ? '#6EE7B7' : miss ? '#FF9B8F' : isCur ? '#FFB547' : '#5A5D67';
    const svg = (ic === 'pre' ? icon.pen(col, 14) : ic === 'prod' ? icon.cam(col, 14) : ic === 'post' ? icon.cut(col, 14) : icon.star(col, 14));
    return `<div style="flex:${i < 4 ? 1 : 0}"><span class="tc" style="background:${bg};border-color:${ring};border-style:${done || miss || isCur ? 'solid' : 'dashed'}">${svg}</span>${i < 4 ? `<span class="tl" style="background:${done ? '#2F6B4F' : '#2C2F38'}"></span>` : ''}</div>`;
  }).join('')}</div>`;
}
function vEtapas() {
  const p = st.project();
  if (!p) return `<div class="card">${banner('wait', 'Sin proyecto', 'Crea un proyecto para empezar.')}${isAdminBtn('<a class="btn b-amber" href="#/proyecto/nuevo">Crear proyecto</a>')}</div>`;
  const c = st.ctx();
  const now = new Date();
  const tab = ui.stage || 'pre';
  const open = p.status === 'abierto';
  const left = p.videos_total - c.videos.length;
  const items = pending(now);
  const nOf = (k) => items.filter((x) => (x.type === 'task' && stageOf(x) === (k === 'rod' ? 'prod' : k) && (x.cm.ok || x.cm.claim)) || (k === 'post' && (x.type === 'review' || x.type === 'fix')) || (x.event && x.event.kind === (k === 'pre' ? 'reunion' : k === 'rod' ? 'rodaje' : '-'))).length;
  const vOf = (ids) => ids.map((id) => c.videos.find((v) => v.id === id)).filter(Boolean).sort((a, b) => a.num - b.num);
  let html = `<div class="between" style="align-items:center"><h1 style="font-size:28px">Etapas</h1>${open && left > 0 && isPartner(S.me) ? `<a class="btn sm x-amber" href="#/semana" style="border-radius:13px">${icon.plus}Programar semana</a>` : ''}</div>`;
  html += `<div class="stiles" role="tablist" aria-label="Etapa">${['pre', 'rod', 'post'].map((k) => {
    const T = STC[k]; const on = k === tab; const n = nOf(k);
    return `<button role="tab" aria-selected="${on}" class="stile" data-act="stage" data-k="${k}" style="background:color-mix(in srgb,${T.solid} ${on ? 'var(--st-on)' : 'var(--st-off)'},transparent);border-color:color-mix(in srgb,${T.c} ${on ? '100%' : 'var(--st-bdop)'},transparent);color:${on ? 'var(--st-fg-on)' : 'var(--tx)'};box-shadow:${on ? '0 10px 24px -10px ' + T.c : 'none'}">
      ${(T.ic === 'pre' ? icon.pen : T.ic === 'prod' ? icon.cam : icon.cut)(on ? 'var(--st-fg-on)' : T.c, 26).replace(/stroke="(var\([^)]*\))"/, 'stroke="currentColor" style="color:$1"')}<span>${T.t}</span>${n ? `<b class="sn" style="background:${on ? 'var(--st-fg-on)' : 'var(--u0)'};color:${on ? T.solid : '#FFFFFF'}">${n}</b>` : ''}</button>`;
  }).join('')}</div>`;
  html += `<div class="legend wrapl"><span><i class="vs vs-ok mini">${icon.tick}</i>Hecho</span><span><i class="vs vs-late mini"></i>Tarde</span><span><i class="vs vs-p mini"></i>Pendiente</span><span>${st.partners().map((m) => { const col = COLOR[m.role]; return `<i class="vins mini" style="background:${col[0]};color:${col[1]}">${esc(ini(m.name)).charAt(0)}</i>`; }).join('')}de quién es</span></div>`;
  const rod = weekRodaje(c, now);
  const pastBtn = (t, n, href, k) => `<${href ? `a href="${href}"` : `button data-act="pastToggle" data-k="${k}"`} class="pastbtn">${icon.hist.replace('width="22" height="22"', 'width="18" height="18"')}${t}<span class="cnt">${n}</span>${icon.chev}</${href ? 'a' : 'button'}>`;
  if (tab === 'pre') {
    const nextMt = c.events.filter((e) => e.kind === 'reunion' && active(e) && !e.ended_at && R.meetingEnd(e) > now).sort(byStart)[0];
    const mt = nextMt || meetingFor(rod);
    const rodM = mt ? S.data.events.find((x) => x.id === mt.rodaje_id) || rod : rod;
    html += `<div class="between" style="align-items:baseline"><b class="num" style="font-size:20px">Esta semana</b><span class="muted">${rodM ? evTitle(rodM, c).vt.replace(/^v/, 'V') : ''}</span></div>`;
    if (!rodM) html += `<div class="card"><p class="empty">${isPartner(S.me) && open ? 'No hay rodaje programado. Usa "Programar semana": primero el rodaje, luego la reunión.' : 'No hay nada programado esta semana.'}</p></div>`;
    else if (!mt) html += `<div class="card"><p class="empty">Este rodaje todavía no tiene reunión de preproducción.</p></div>`;
    else {
      html += confCard(mt, now);
      const vs = vOf(mt.video_ids.length ? mt.video_ids : rodM.video_ids);
      html += `<div class="slots">${vs.length ? vs.map((v) => { const s = R.videoState(v, c, now); const done = s.g && s.s; const miss = !done && s.d.preDue && now > s.d.preDue; return `<a class="slot ${done ? 'ok' : miss ? 'miss' : 'p'}" href="#/v/${v.id}"><small>VIDEO</small><b>${v.num}</b></a>`; }).join('') : Array.from({ length: Math.min(4, Math.max(left, 0)) }, (_, i) => `<span class="slot empty"><small>VIDEO</small><b>${c.videos.length + i + 1}</b></span>`).join('')}</div>`;
      const faltan = c.videos.filter((v) => { const s = R.videoState(v, c, now); return !s.r && !(s.g && s.s) && s.d.preDue && now > s.d.preDue; });
      html += faltan.map((v) => vrow(v, c, now, 'pre')).join('');
    }
    const pastM = c.events.filter((e) => e.kind === 'reunion' && (!mt || e.id !== mt.id) && (e.ended_at || !active(e) || new Date(e.starts_at) < now)).sort(byStart).reverse();
    if (pastM.length) {
      html += pastBtn('Reuniones pasadas', pastM.length, null, 'pre');
      if ((ui.past || {}).pre) html += pastM.map((e) => `<section class="vgroup dim"><div class="vghead"><span class="tic tint-pre">${stageIc('pre', 17)}</span><div style="flex:1;min-width:0"><b class="num" style="font-size:15px">${R.fmtDay(R.limaDate(e.starts_at))} · ${evTitle(e, c).vt}</b></div><a href="#/e/${e.id}" class="gchip g-done" style="text-decoration:none">${e.ended_at ? 'Finalizada' : !active(e) ? 'Cancelada' : 'Pasó'}</a></div>${vOf(e.video_ids).map((v) => vrow(v, c, now, 'pre')).join('')}</section>`).join('');
    }
  } else if (tab === 'rod') {
    html += `<div class="between" style="align-items:baseline"><b class="num" style="font-size:20px">Esta semana</b><span class="muted">${rod ? R.fmtWhen(rod.starts_at) : ''}</span></div>`;
    if (!rod) html += `<div class="card"><p class="empty">No hay rodaje programado.</p></div>`;
    else {
      html += confCard(rod, now);
      if (!(ui.evOpen || {})[rod.id] && !R.rsvpState(rod, S.me.id, c, now).missed) html += `<a class="hb x-amber" href="#/e/${rod.id}" style="font-size:15px">Abrir rodaje${arrow}</a>`;
      html += vOf(rod.video_ids).map((v) => { const o = st.member(v.owner); const col = COLOR[o.role] || ['#22242C', '#C9C9D1']; const s = R.videoState(v, c, now); const miss = !s.g || (s.d.preDue && now > s.d.preDue && !s.s);
        return `<a class="vcard13${miss ? ' miss' : ''}" href="#/v/${v.id}" style="text-decoration:none;color:inherit"><div class="vhead"><span class="vnum"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span></span><span class="ttl"><p>${v.title ? esc(v.title) : 'Video ' + v.num}</p></span>${icon.chev}</div>${vTrack(v, c, now)}</a>`; }).join('');
    }
    const pastR = c.events.filter((e) => e.kind === 'rodaje' && (!rod || e.id !== rod.id) && R.limaDate(e.starts_at) < R.limaDate(now)).length;
    const loose = c.videos.filter((v) => !R.rodajeOf(v, c) && !R.videoState(v, c, now).r);
    if (loose.length) html += `<section class="vgroup"><div class="vghead"><span class="tic tint-prod">${stageIc('prod', 17)}</span><div style="flex:1"><b class="num" style="font-size:16px">Videos sin rodaje</b><p class="muted" style="margin:1px 0 0">Se cancelaron o reprogramaron</p></div></div>${loose.map((v) => vrow(v, c, now, 'rod')).join('')}${open && isPartner(S.me) ? `<button class="btn sm x-amber" data-act="newRod" style="align-self:stretch">Programar rodaje para estos videos</button>` : ''}</section>`;
    if (pastR) html += pastBtn('Rodajes pasados', pastR, '#/rodajes');
  } else {
    html += vPost(c, now);
  }
  return html;
}
// Posproducción (O): montaje y video final por video, con el apoyo y el "Tomar" del 5.7.
function vPost(c, now) {
  const me = S.me;
  const shot = c.videos.filter((v) => R.videoState(v, c, now).r);
  const last = c.events.filter((e) => e.kind === 'rodaje' && active(e) && new Date(e.starts_at) <= now).sort(byStart).pop();
  const weekIds = last ? last.video_ids : [];
  const weekV = c.videos.filter((v) => weekIds.indexOf(v.id) !== -1).sort((a, b) => a.num - b.num);
  const older = shot.filter((v) => weekIds.indexOf(v.id) === -1 && !R.videoState(v, c, now).delivered).sort((a, b) => a.num - b.num);
  const delivered = shot.filter((v) => weekIds.indexOf(v.id) === -1 && R.videoState(v, c, now).delivered).sort((a, b) => b.num - a.num);
  const ent = weekV.filter((v) => R.videoState(v, c, now).delivered).length;
  let html = '';
  if (weekV.length) html += `<section class="card postweek" style="gap:10px"><div class="between"><b class="num" style="font-size:18px">Esta semana</b><b class="num" style="font-size:15px">${ent}<span class="muted" style="font-size:15px"> / ${weekV.length} entregados</span></b></div>
    <div class="ebar" style="background:color-mix(in srgb,var(--st-post) 18%,transparent)"><i style="width:${Math.round(ent / weekV.length * 100)}%;background:#FF8A65"></i></div><span class="muted">Rodaje del ${R.fmtDay(R.limaDate(last.starts_at))} · ${evTitle(last, c).vt}</span></section>`;
  else html += `<div class="card"><p class="empty">Todavía no hay videos grabados.</p></div>`;
  const card = (v) => postCard(v, c, now);
  html += weekV.map(card).join('') + older.map(card).join('');
  if (delivered.length) {
    html += `<button class="pastbtn" data-act="pastToggle" data-k="post">${icon.star('#FF8A65', 18)}Entregados al cliente<span class="cnt">${delivered.length}</span>${icon.chev}</button>`;
    if ((ui.past || {}).post) html += `<section class="tlist" style="padding:4px 14px">${delivered.map((v) => vrow(v, c, now, 'post')).join('')}</section>`;
  }
  return html;
}
// Rodajes pasados: cada rodaje plegado; al tocarlo se abre con llegadas y chips.
function vRodajesPasados() {
  const c = st.ctx();
  const now = new Date();
  const rods = c.events.filter((e) => e.kind === 'rodaje' && R.limaDate(e.starts_at) < R.limaDate(now)).sort(byStart).reverse();
  let html = `${backTo('#/videos', 'Etapas')}<h1>Rodajes pasados</h1>`;
  if (!rods.length) return html + '<div class="card"><p class="empty">Todavía no hay rodajes pasados.</p></div>';
  html += rods.map((e) => {
    const vs = e.video_ids.map((id) => c.videos.find((v) => v.id === id)).filter(Boolean).sort((a, b) => a.num - b.num);
    const n = vs.filter((v) => R.videoState(v, c, now).r).length;
    const openE = (ui.past || {})['r' + e.id];
    return `<section class="vcard13"><button class="evmin rod" data-act="pastToggle" data-k="r${e.id}" style="border:none;padding:0;background:transparent">${calTile(e.starts_at, 'rod')}<span style="flex:1;min-width:0"><b style="display:block">${R.fmtWhen(e.starts_at)}${!active(e) ? ' · ' + (e.status === 'reprogramado' ? 'reprogramado' : 'cancelado') : ''}</b><span class="row" style="gap:4px;margin-top:6px">${vs.map((v) => `<span class="slot ${R.videoState(v, c, now).r ? 'ok' : 'miss'}" style="flex:0 0 34px;min-height:34px"><b style="font-size:13px;margin:0">${v.num}</b></span>`).join('')}</span></span><b class="num">${n}/${vs.length}</b></button>
      ${openE ? `<div class="list">${st.partners().map((m) => { const s = st.eventStatus(e, m.id, now); return `<div class="li">${av(m, 26)}<span class="t"><b>${esc(m.name)}</b></span>${attChip(s)}</div>`; }).join('')}</div>${vs.map((v) => { const s = R.videoState(v, c, now); return `<a class="li" href="#/v/${v.id}"><span class="t"><b>Video ${v.num}${v.title ? ' · ' + esc(v.title) : ''}</b></span><span class="chips"><span class="chip13 ${s.g ? 'ok' : 'no'}">Guion</span><span class="chip13 ${s.s ? (s.s.split ? 'blue' : 'ok') : 'no'}">${s.s && s.s.split ? 'Storyboard repartido' : 'Storyboard'}</span><span class="chip13 ${s.r ? 'ok' : 'no'}">${s.r ? 'Grabado' : 'Sin grabar'}</span></span></a>`; }).join('')}<a class="btn sm b-ghost" href="#/e/${e.id}">Ver rodaje</a>` : ''}</section>`;
  }).join('');
  return html;
}

function attChip(s) {
  const K = { puntual: 'c-ok', tarde: 'c-late', ausente: 'c-bad', cancel_ok: 'c-mute', cancel_late: 'c-late', fm: 'c-fm', fm_pend: 'c-fm', pendiente: 'c-info', no_req: 'c-fm', por_confirmar: 'c-late', cancelado: 'c-mute', reprogramado: 'c-mute' };
  return `<span class="chip ${K[s.k] || 'c-mute'}">${s.label}</span>`;
}

// ---------- Programar semana: rodaje → reunión → reparto ----------
function vWeek(rodId) {
  if (rodId) return vReparto(rodId);
  const today = R.limaDate(new Date());
  const rd = R.addDays(today, 3);
  return `${backTo('#/videos', 'Etapas')}
  <h1>Programar semana</h1><p class="sub">Primero el rodaje. Luego la reunión de preproducción, que tiene que ser antes del plazo: el día anterior al rodaje, 18:00. Los videos se reparten en la reunión.</p>
  <form data-form="plan" class="card">
    <p class="lbl" style="color:#FFB547">1 · Rodaje</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="rd" value="${rd}" required></label><label class="field"><span>Hora</span><input class="in" type="time" name="rt" value="10:00" required></label></div>
    <p class="lbl" style="color:#A9C7FF">2 · Reunión de preproducción</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="md" value="${R.addDays(rd, -2)}" required></label><label class="field"><span>Hora</span><input class="in" type="time" name="mt" value="10:00" required></label></div>
    <p class="muted" style="margin:0">Guiones y storyboards vencen el día antes del rodaje a las 18:00. Si alguien no entrega los suyos, su compañero puede tomarlos. Una reunión por rodaje: otra solo después de finalizar la primera.</p>
    <button class="btn b-amber">Programar</button>
  </form>`;
}
function vReparto(rodId) {
  const rod = S.data.events.find((e) => e.id === rodId);
  if (!rod) return `<p class="empty">Rodaje no encontrado.</p>`;
  const p = projOf(rod.project_id);
  const ps = st.partners();
  const adm = ps.find((m) => m.role === 'admin') || S.me;
  const soc = ps.find((m) => m.role === 'socio');
  const c = st.ctx(p.id);
  const left = p.videos_total - c.videos.length;
  const n = Math.min(4, left);
  const pubBase = R.addDays(R.limaDate(rod.starts_at), 5);
  const mt = S.data.events.find((e) => e.kind === 'reunion' && e.rodaje_id === rod.id && active(e));
  const h = mt ? st.hireFor(mt.id) : null;
  const rows = Array.from({ length: n }, (_, i) => {
    const owner = soc ? (i < Math.ceil(n / 2) ? adm.id : soc.id) : adm.id;
    return `<div class="row" style="gap:8px"><span class="chip c-mute" style="min-width:34px;justify-content:center">${c.videos.length + i + 1}</span>
      <input class="in" type="date" name="pub${i}" value="${R.addDays(pubBase, Math.floor(i / 2) * 2)}" style="flex:1;min-width:0">
      <select class="in" name="own${i}" style="flex:1;min-width:0">${ps.map((m) => `<option value="${m.id}" ${m.id === owner ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
      <input class="in" name="tit${i}" placeholder="Tema del video ${c.videos.length + i + 1} (opcional)" maxlength="80" style="margin:-4px 0 6px">`;
  }).join('');
  return `${backTo('#/videos', 'Etapas')}
  <h1>Repartir videos</h1><p class="sub">Rodaje del ${R.fmtWhen(rod.starts_at)}${mt ? ' · reunión del ' + R.fmtWhen(mt.starts_at) : ''}. Quedan ${left} videos por repartir (por defecto 2 y 2).</p>
  ${h ? `<div class="banner bn-fm"><div><b>Guillermo trabaja por ${esc(st.member(h.hired_by).name)} en esta reunión</b><p>Asigna sus videos y luego marca sus guiones y storyboards "con Guillermo". Recibes el 80 % de esa preproducción.</p></div></div>` : ''}
  <form data-form="reparto" class="card"><input type="hidden" name="r" value="${rod.id}"><input type="hidden" name="n" value="${n}">
    <p class="lbl">Videos · fecha de publicación y dueño</p>
    ${rows || '<p class="empty">Ya se repartieron todos los videos.</p>'}
    <p class="muted" style="margin:0">Guion y storyboard: hasta ${R.fmtWhen(R.preDueFor(rod.starts_at))}. Montaje: 2 días antes de publicar (si recibe apoyo) · final: 1 día antes, a las 21:00.</p>
    <button class="btn b-amber" ${n ? '' : 'disabled'}>Guardar reparto</button>
  </form>`;
}

// ---------- Detalle de video ----------
function vVideo(id) {
  const v = S.data.videos.find((x) => x.id === id);
  if (!v) return `<p class="empty">Video no encontrado.</p>`;
  const now = new Date();
  const c = st.ctx(v.project_id);
  const vs = R.videoState(v, c, now);
  const o = st.member(v.owner);
  const col = COLOR[o.role] || ['#22242C', '#C9C9D1'];
  const me = S.me;
  const p = projOf(v.project_id);
  const rate = R.rates(p);
  const open = p.status === 'abierto';
  const isOwner = v.owner === me.id;
  const ev = vs.rodaje;
  const hire = hireOf(v);
  const STAGE = { guion: 'pre', storyboard: 'pre', rodaje: 'prod', montaje: 'post', acabado: 'star' };
  const track = R.KINDS.map((k, i) => {
    const t = vs[KEY[k]];
    const missed = (PRE[k] && !t && vs.d.preDue && now > vs.d.preDue) || (k === 'montaje' && vs.montajeMissed && !t);
    const cls = t ? 'tk-ok' : missed ? 'tk-urg' : 'tk-p';
    return `<div class="tk${i === R.KINDS.length - 1 ? ' last' : ''}"><span class="tkc ${cls}">${stageIc(STAGE[k], 16).replace(/var\(--c-[a-z]+\)/, t ? 'var(--mint)' : missed ? 'var(--u0)' : 'var(--tx4)')}</span>${i < R.KINDS.length - 1 ? `<i class="${t ? 'on' : ''}"></i>` : ''}</div>`;
  }).join('');
  const helped = !!(o.apoyo && vs.d.apoyoDue && vs.r) || !!(vs.post && vs.post.phase === 'colab') || (vs.overdue && !!vs.r);
  const rows = R.KINDS.filter((k) => !(helped && (k === 'montaje' || k === 'acabado'))).map((k) => {
    const t = vs[KEY[k]];
    const due = PRE[k] ? vs.d.preDue : k === 'montaje' ? (vs.d.montajeDue || vs.d.finalDue) : k === 'acabado' ? vs.d.finalDue : (ev ? new Date(ev.starts_at) : null);
    let right = '', sub = '', subC = '', dim = false;
    if (t) {
      const by = st.member(t.done_by);
      const late = PRE[k] ? !!(vs.d.preDue && new Date(t.done_at) > vs.d.preDue) : k === 'montaje' ? vs.montajeLate : k === 'acabado' ? vs.finalLate : false;
      const hh = t.hire_id ? S.data.hires.find((x) => x.id === t.hire_id) : null;
      sub = `${hh ? `Guillermo · contratado por ${esc(st.member(hh.hired_by).name)} · registró ${first(by)}` : (t.done_by === me.id ? 'Tú' : esc(by.name))} · ${R.fmtWhen(t.done_at)}${late ? ' · tarde' : ' · a tiempo'}${t.link ? ` · <a href="${esc(t.link)}" target="_blank" rel="noopener">enlace</a>` : ''}`;
      if (k === 'acabado' && vs.apoyo) sub += ' · apoyo: el pago es del dueño (5.5)';
      right = `<span class="dstack"><span class="dchip ${late ? 'late' : ''}">${icon.tick}Hecho</span>${open && R.canUndo(t, me, c, now) ? `<button class="linkbtn" data-act="undo" data-id="${t.id}">Deshacer</button>` : ''}</span>`;
    } else {
      sub = due ? 'Entrega: ' + R.fmtWhen(due) + ' · ' + countdown(due, now) : (k === 'rodaje' ? 'Sin rodaje programado' : '');
      const viaG = PRE[k] && hire && hire.hired_by === v.owner;
      let cm;
      if (viaG) cm = hire.present === me.id ? R.canMark(v, k, me, c, now, { hire }) : { ok: false, why: isOwner ? 'Lo hace Guillermo (lo contrataste)' : `Lo hace ${first(st.member(hire.present))} con Guillermo` };
      else cm = R.canMark(v, k, me, c, now);
      if (!open) cm = { ok: false, why: 'Proyecto cerrado' };
      if (cm.claim) { right = `<button class="tbtn t-take" data-act="claim" data-v="${v.id}" data-k="${k}">Tomar</button>`; sub = `Puedes tomarlo hasta ${R.fmtWhen(cm.limit)} · cobras al entregarlo`; subC = 'u0'; }
      else if (cm.ok) right = `<button class="tbtn ${viaG ? 't-g' : 't-done'}" data-act="mark" data-v="${v.id}" data-k="${k}"${viaG ? ` data-h="${hire.id}"` : ''}>${viaG ? 'Con Guillermo' : 'Hecho'}</button>`;
      else if (cm.gone) { const cl = R.claimOf(v, k, c); right = `<span class="tbtn t-gone">${cl ? 'Tomado' : 'Venció'}</span>`; sub = cl ? 'Lo hará ' + first(st.member(cl.member_id)) : 'Venció ' + R.fmtWhen(due) + ' · pasó a tu compañero'; subC = cl ? '' : 'u0'; }
      else if (cm.noGuion && isPartner(me)) { right = `<button class="tbtn t-gone" data-act="reproVideo" data-v="${v.id}" style="cursor:pointer">Reprogramar</button>`; sub = 'Sin guion no se graba'; subC = 'u0'; }
      else { right = `<span class="tbtn t-lock">${icon.lock}${k === 'rodaje' && ev ? (R.limaDate(now) === R.limaDate(ev.starts_at) ? R.limaTime(new Date(new Date(ev.starts_at).getTime() - R.RULES.open * 60000)) : dowShort(ev.starts_at)) : 'Espera'}</span>`; if (cm.why) sub = esc(cm.why) + (due ? ' · ' + R.fmtWhen(due) : ''); dim = true; }
      if (cm.claimed && cm.ok) { sub = `Lo tomaste · entrégalo antes de ${R.fmtWhen(cm.limit)}`; subC = 'u0'; }
    }
    return `<div class="trow"><span class="tic tint-${STAGE[k]}${dim ? ' dimmed' : ''}">${stageIc(STAGE[k])}</span><span class="ttx"><b${dim ? ' class="dim"' : ''}>${R.KIND_LABEL[k]} <span class="muted" style="font-weight:500">· ${R.money(rate[k])}</span></b><span class="${subC ? 'c-' + subC : ''}">${sub}</span></span>${right}</div>`;
  }).join('');
  const changeOwner = open && (me.role === 'admin' || isOwner || (hire && hire.present === me.id)) && !vs.mo && !vs.g && !vs.s ? `<button class="btn b-ghost" data-act="swap" data-v="${v.id}">Intercambiar con mi compañero</button>` : '';
  const canTitle = open && (me.role === 'admin' || isOwner);
  return `${backTo('#/videos', 'Etapas')}
  <section class="card" style="gap:18px"><div class="row" style="gap:14px">
    <span class="vnum big"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span></span>
    <div style="flex:1;min-width:0"><b class="num" style="font-size:21px;line-height:1.2;display:block">${v.title ? esc(v.title) : 'Video ' + v.num}</b><p class="sub" style="margin:4px 0 0">De ${esc(o.name)} · publica ${R.fmtDay(v.publish_date)}</p>
    ${canTitle ? `<button class="linkbtn" data-act="title" data-v="${v.id}" style="margin-top:4px">${v.title ? 'Cambiar tema' : 'Ponerle tema'}</button>` : ''}</div></div>
    <div class="track" aria-label="Avance del video">${track}</div></section>
  ${helped ? `<p class="lbl" style="margin:4px 4px -4px">Posproducción · ${R.money(postValue(v))}</p>${postCard(v, c, now, true)}` : ''}
  <section class="tlist" style="padding:4px 14px">${rows}</section>
  <p class="muted" style="margin:-6px 4px 0;line-height:1.45">Se marca en orden: guion y storyboard, luego el rodaje (el día del rodaje, con tu llegada confirmada), el montaje y el video final.</p>
  ${ev ? `<a class="btn b-ghost" href="#/e/${ev.id}">${icon.cam('var(--c-prod)', 16)}Ver rodaje · ${R.fmtWhen(ev.starts_at)}</a>` : ''}
  ${open && me.role === 'admin' && !vs.delivered && !vs.overdue ? `<button class="btn b-ghost" data-act="reprog" data-v="${v.id}">${icon.clock.replace('width="12" height="12"', 'width="16" height="16"')}Reprogramar entrega</button>` : ''}
  ${(v.reprog || []).length ? `<section class="card" style="padding:12px 16px"><p class="lbl">Entregas reprogramadas</p><div class="list">${reprogLines(v)}</div></section>` : ''}
  ${changeOwner}`;
}

// ==================================================================
// 1.4 · Entregas al límite: el video de quien recibe apoyo, sus plazos y la revisión
// ==================================================================
const DOWN = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const dowOf = (iso) => DOWN[new Date(R.limaDate(iso) + 'T12:00:00-05:00').getUTCDay()];
// "hoy 08:00", "mañana 08:00" o "vie 6, 08:00"
function whenRel(d, now = new Date()) {
  const k = dayDiff(R.limaDate(now), R.limaDate(d));
  const t = R.limaTime(d);
  if (k === 0) return 'hoy ' + t;
  if (k === 1) return 'mañana ' + t;
  return dowOf(d) + ' ' + Number(R.limaDate(d).slice(8, 10)) + ', ' + t;
}
const helpedOf = (v, s) => !!(s.owner && s.owner.apoyo && s.d.apoyoDue);
const postValue = (v) => { const r = R.rates(projOf(v.project_id)); return r.montaje + r.acabado; };
// Barra de plazos: verde apoyo · ámbar por su cuenta · rojo en riesgo · azul pasa al administrador · estrella publica.
function postTimeline(v, s, now) {
  const d = s.d;
  const T0 = d.apoyoDue.getTime() - 4 * 3600000;
  const T1 = d.finalDue.getTime() + 3 * 3600000;
  const pos = (t) => Math.max(0, Math.min(100, (new Date(t).getTime() - T0) / (T1 - T0) * 100));
  const ph = s.post.phase;
  const seg = [[T0, d.apoyoDue, '#2F9E6E', 'abierto'], [d.apoyoDue, d.selfDue, '#D98A00', 'solo'], [d.selfDue, d.autoDue, '#E5484D', 'riesgo'], [d.autoDue, d.finalDue, '#3D6BB8', 'pasado'], [d.finalDue, T1, '#FFB547', 'pub']];
  const curSeg = ph === 'revision' || ph === 'cambios' ? (now <= d.selfDue ? 'solo' : now <= d.autoDue ? 'riesgo' : 'pasado') : ph;
  const marks = [[d.apoyoDue, dowOf(d.apoyoDue) + ' ' + R.limaTime(d.apoyoDue), '#9FD9BF'], [d.selfDue, R.limaTime(d.selfDue), '#FFC978'], [d.autoDue, R.limaTime(d.autoDue), '#FF9B8F']]
    .concat(ph === 'cambios' ? [[d.fixDue, R.limaTime(d.fixDue), '#FFC2BA']] : []).concat([[d.finalDue, '23:59', '#A9C7FF']]);
  const nx = pos(now);
  const nowC = { abierto: '#6EE7B7', solo: '#FFC978', riesgo: '#FF9B8F' }[curSeg] || '#A9C7FF';
  return `<div class="ptl" aria-hidden="true"><div class="ptl-bar">${seg.map(([a, b, c, k]) => `<i style="width:${(pos(b) - pos(a)).toFixed(2)}%;background:${c};opacity:${k === curSeg ? 1 : 0.35}"></i>`).join('')}</div>
    ${marks.map(([t, l, c], i) => { const x = pos(t); const close = i > 0 && x - pos(marks[i - 1][0]) < 13; marks[i].low = close && !marks[i - 1].low; return `<span class="ptl-m${marks[i].low ? ' low' : ''}" style="left:${x.toFixed(2)}%"></span><span class="ptl-l${marks[i].low ? ' low' : ''}" style="left:${x.toFixed(2)}%;color:${c}">${l}</span>`; }).join('')}
    <span class="ptl-star" style="left:${(pos(d.finalDue) + 100) / 2}%">${icon.star('#FFD08A', 13)}</span>
    <span class="ptl-now" style="left:${nx.toFixed(2)}%"><i style="box-shadow:0 0 0 2px ${nowC}"></i></span></div>`;
}
const pmsg = (tone, text, extra = '') => `<div class="pmsg pm-${tone}"><span class="pdot"></span><p>${text}</p>${extra}</div>`;
const undoLink = (act, attrs, label = 'Deshacer') => `<button class="linkbtn undo13" data-act="${act}" ${attrs}>${label}</button>`;
function ptile(k, cls, sub, attrs = '', extra = '') {
  const ic = k === 'montaje' ? icon.cut('currentColor', 18) : icon.star('currentColor', 18);
  const name = k === 'montaje' ? 'Montaje' : 'Video final';
  const ck = cls === 'mine' || cls === 'other' || cls === 'pend' || extra === 'ck' ? `<span class="ck">${icon.tick}</span>` : '';
  const lk = cls === 'lock' || extra === 'lock' ? icon.lock : '';
  const tag = attrs ? 'button' : 'div';
  return `<${tag} class="tile ${cls}"${attrs ? ' ' + attrs : ''}><span class="tt">${ic}<b>${name}</b>${ck}${lk}</span><small>${sub}</small></${tag}>`;
}
// Tarjeta de posproducción de un video (Etapas → Posproducción y detalle del video).
function postCard(v, c, now, inDetail) {
  const me = S.me;
  const s = R.videoState(v, c, now);
  const o = st.member(v.owner);
  const col = COLOR[o.role] || ['#22242C', '#C9C9D1'];
  const A = first(st.admin() || { name: 'el administrador' });
  const O = first(o);
  const isOwner = v.owner === me.id;
  const isAdm = me.role === 'admin';
  const P = s.post;
  const val = postValue(v);
  const t = (x) => R.limaDate(x) === R.limaDate(now) ? R.limaTime(x) : R.fmtWhen(x);
  let tiles = '', msg = '', extra = '', tone = '', wait = false, timeline = false, after = '';
  const myUndo = (task) => task && task.done_by === me.id && R.canUndo(task, me, c, now) && (!isAdm || R.within(task.done_at, now)) ? undoLink('undo', `data-id="${task.id}"`) : '';
  if (P && P.phase === 'colab') {
    // 1.4: lo edita un colaborador externo; los socios revisan desde el encargo.
    const j = P.job; const it = (S.data.job_items || []).find((i) => i.job_id === j.id && i.video_id === v.id) || { stage: 'montaje' };
    const E = first(st.member(j.member_id));
    const ch = JOB_CH[it.stage] || JOB_CH.montaje;
    const past = (k) => ['montaje', 'rev1', 'aj1', 'final', 'rev2', 'aj2', 'upload', 'done'].indexOf(it.stage) > ['montaje', 'rev1', 'aj1', 'final', 'rev2', 'aj2', 'upload', 'done'].indexOf(k);
    tiles = (s.mo ? ptile('montaje', 'other', E + ' · ' + t(s.mo.done_at)) : ptile('montaje', 'wait', s.r ? 'Lo edita ' + E : 'Después del rodaje'))
      + (s.ac ? ptile('acabado', 'other', E + ' · ' + t(s.ac.done_at)) : ptile('acabado', past('rev1') ? 'pend' : 'wait', ch[1]));
    if (j.status === 'invitado') { tone = 'amber'; msg = `Encargado a ${E} · esperando que acepte las condiciones.`; }
    else if (it.stage === 'rev1' || it.stage === 'rev2') { tone = 'amber'; msg = `${E} entregó ${it.stage === 'rev1' ? 'el montaje' : 'el video final'} · revísalo y envía tus observaciones.`; }
    else if (it.stage !== 'done') { tone = 'blue'; msg = `Lo edita ${E} (colaborador) · ${ch[1].toLowerCase()}.`; }
    after = isPartner(me) ? `<a class="hb ${it.stage === 'rev1' || it.stage === 'rev2' ? 'x-amber' : 'x-ghost'}" href="#/encargo/${j.id}" style="font-size:14px">${it.stage === 'rev1' || it.stage === 'rev2' ? 'Revisar' : 'Ver encargo'}${arrow}</a>` : '';
  } else if (!s.r) {
    tiles = ptile('montaje', 'lock', 'Después del rodaje') + ptile('acabado', 'lock', 'Después del rodaje');
  } else if (!helpedOf(v, s)) {
    // Video sin apoyo (los tuyos): montaje y final del dueño, hasta el día antes a las 23:59.
    const tl = (k) => {
      const x = s[KEY[k]];
      if (x) return ptile(k, x.done_by === me.id ? 'mine' : 'other', 'Hecho ' + t(x.done_at));
      if (k === 'acabado' && !s.mo) return ptile(k, 'lock', 'Después del montaje');
      const cm = R.canMark(v, k, me, c, now);
      if (cm.ok) return ptile(k, 'todo post', 'Hasta ' + whenRel(s.d.finalDue, now), `data-act="quick" data-v="${v.id}" data-k="${k}"`);
      return ptile(k, 'wait', O + ' · hasta ' + whenRel(s.d.finalDue, now));
    };
    tiles = tl('montaje') + tl('acabado');
    extra = myUndo(s.ac) || myUndo(s.mo);
  } else if (P.phase === 'abierto' || P.phase === 'apoyo') {
    timeline = P.phase === 'abierto';
    if (isOwner) {
      tiles = (s.mo ? ptile('montaje', 'mine', 'Enviado ' + t(s.mo.done_at)) : ptile('montaje', 'todo post', 'Tocar al enviar · hasta ' + whenRel(s.d.apoyoDue, now), `data-act="quick" data-v="${v.id}" data-k="montaje"`))
        + (s.ac ? ptile('acabado', 'other', A + ' lo terminó') : ptile('acabado', 'wait', 'Lo hace ' + A + ' · apoyo'));
      wait = !!s.mo && !s.ac;
      const left = Math.round((s.d.apoyoDue - now) / 60000);
      if (!s.mo && left <= 60) { tone = 'red'; msg = `Falta${left > 1 ? 'n ' + left + ' min' : ' 1 min'} para enviar tu montaje y recibir apoyo en el video final.`; if (left >= 55) msg = 'Falta 1 h para enviar tu montaje y recibir apoyo en el video final.'; }
      else if (s.mo && !s.ac) { tone = 'green'; msg = `Montaje enviado a tiempo · ${A} hace tu video final.`; }
      else if (s.ac && R.within(s.ac.done_at, now)) { tone = 'green'; msg = `${A} terminó tu video final · recibiste ${R.money(val)}.`; }
      extra = myUndo(s.mo);
    } else {
      tiles = (s.mo ? ptile('montaje', 'other', 'Recibido ' + t(s.mo.done_at)) : ptile('montaje', 'wait', O + ' · hasta ' + whenRel(s.d.apoyoDue, now)))
        + (s.ac ? ptile('acabado', s.ac.done_by === me.id ? 'mine' : 'other', 'Hecho ' + t(s.ac.done_at)) : s.mo && isAdm ? ptile('acabado', 'todo post', 'Tocar al terminar · hasta ' + whenRel(s.d.finalDue, now), `data-act="quick" data-v="${v.id}" data-k="acabado"`) : ptile('acabado', 'lock', 'Después del montaje'));
      if (!s.mo && s.d.apoyoDue - now <= 2 * 3600000) { tone = 'amber'; msg = `${O} aún no envía su montaje · tiene hasta las ${R.limaTime(s.d.apoyoDue)} para recibir tu apoyo.`; }
      else if (s.mo && !s.ac && isAdm) { tone = 'green'; msg = `Te toca el video final de apoyo · el pago es de ${O}.`; }
      else if (s.ac && R.within(s.ac.done_at, now)) { tone = 'green'; msg = `Entregado · a ${O} le llegan ${R.money(val)} (montaje + final de apoyo).`; }
      extra = myUndo(s.ac);
    }
  } else if (P.phase === 'solo' || P.phase === 'riesgo') {
    timeline = true;
    if (isOwner) {
      const cmA = R.canMark(v, 'acabado', me, c, now);
      tiles = (s.mo ? ptile('montaje', 'mine', 'Listo ' + t(s.mo.done_at)) : ptile('montaje', 'todo post', 'Tocar al terminar', `data-act="quick" data-v="${v.id}" data-k="montaje"`))
        + (s.mo && cmA.ok ? ptile('acabado', 'todo post', 'Tocar al entregar', `data-act="quick" data-v="${v.id}" data-k="acabado"`) : ptile('acabado', 'lock', 'Después del montaje'));
      wait = !!s.mo;
      tone = 'red';
      msg = P.phase === 'solo' ? `Venció el plazo para recibir apoyo. Puedes entregar el video completo hasta ${whenRel(s.d.selfDue, now)}.` : `Para asegurar la entrega, el video se asignará automáticamente a ${A} al mediodía.`;
      extra = myUndo(s.mo);
    } else {
      tiles = ptile('montaje', s.mo ? 'other' : 'wait', s.mo ? O + ' lo terminó' : O + ' · hasta ' + R.limaTime(s.d.selfDue)) + ptile('acabado', 'wait', O + ' · hasta ' + R.limaTime(s.d.selfDue));
      if (P.phase === 'riesgo') { tone = 'red'; msg = `${O} no entregó · puedes tomar el video. A las ${R.limaTime(s.d.autoDue)} pasa a ti solo.`; }
      else { tone = 'amber'; msg = `Venció el apoyo · ${O} puede entregar el video completo hasta ${whenRel(s.d.selfDue, now)}.`; }
      if (P.phase === 'riesgo' && isAdm) after = `<button class="hb x-blue" data-act="claim" data-v="${v.id}" data-k="montaje">${handIc}Tomar el video</button>`;
    }
  } else if (P.phase === 'revision') {
    timeline = true;
    const k = s.ac;
    if (isOwner) {
      tiles = ptile('montaje', 'pend', 'Por confirmar') + ptile('acabado', 'pend', 'Por confirmar');
      wait = true; tone = 'blue'; msg = `Entregado · ${A} revisa tu video.`;
      extra = R.canUndoRedeliver(k, me, c, now) ? undoLink('redeliverUndo', `data-v="${v.id}"`) : myUndo(k);
    } else {
      tiles = ptile('montaje', 'pend', 'Por revisar') + ptile('acabado', 'pend', 'Por revisar');
      if (isAdm) msg = '';
      tone = '';
      const at = k.redelivered_at || k.done_at;
      extra = isAdm ? `<div class="revbox"><b class="num">Revisar entrega</b><span>${O} entregó ${k.redelivered_at ? 'la corrección' : 'el video completo'} a las ${R.limaTime(at)} · revisa hasta ${whenRel(s.d.finalDue, now)}</span>
        <div class="grid2"><button class="hb x-red" data-act="review" data-v="${v.id}" data-k="no" style="font-size:14px">Pedir cambios</button><button class="hb x-green" data-act="review" data-v="${v.id}" data-k="ok" style="font-size:14px">Aprobar</button></div></div>` : '';
    }
  } else if (P.phase === 'cambios') {
    timeline = true;
    const k = s.ac;
    if (isOwner) {
      tiles = ptile('montaje', 'mine', 'Listo') + ptile('acabado', 'todo post', 'Entregar corrección', `data-act="redeliver" data-v="${v.id}"`);
      wait = true; tone = 'red'; msg = `${A} pidió cambios: ${esc(k.review_note || '')} · corrige hasta las ${R.limaTime(s.d.fixDue)}.`;
    } else {
      tiles = ptile('montaje', 'wait', 'Corrigiendo · hasta ' + R.limaTime(s.d.fixDue)) + ptile('acabado', 'wait', 'Corrigiendo · hasta ' + R.limaTime(s.d.fixDue));
      tone = 'amber'; msg = `Pediste cambios: ${esc(k.review_note || '')} · ${O} corrige hasta las ${R.limaTime(s.d.fixDue)}. Si no, el video pasa a ti.`;
      extra = R.canUndoReview(k, me, c, now) ? undoLink('reviewUndo', `data-v="${v.id}"`) : '';
    }
  } else if (P.phase === 'aprobado') {
    const k = s.ac;
    tiles = ptile('montaje', isOwner ? 'mine' : 'other', 'Aprobado') + ptile('acabado', isOwner ? 'mine' : 'other', 'Aprobado');
    const fresh = k.review_at && R.within(k.review_at, now);
    if (fresh || !k.review_at) { tone = 'green'; msg = !k.review_at ? `Se aprobó sola · ${isOwner ? 'recibiste ' + R.money(val) : 'a ' + O + ' le llegan ' + R.money(val)}.` : isOwner ? `${A} aprobó tu entrega · recibiste ${R.money(val)}.` : `Aprobaste la entrega · a ${O} le llegan ${R.money(val)}.`; }
    extra = R.canUndoReview(k, me, c, now) ? undoLink('reviewUndo', `data-v="${v.id}"`) : '';
  } else if (P.phase === 'pasado') {
    if (isOwner) {
      tiles = ptile('montaje', 'lock', s.ownMo ? 'Lo marcaste · ya no cuenta' : s.mo ? A + ' lo hizo' : 'Lo hará ' + A, '', s.ownMo ? 'ck' : '') + ptile('acabado', 'lock', s.ac ? A + ' lo entregó' : 'Lo hará ' + A);
    } else {
      const cmM = R.canMark(v, 'montaje', me, c, now);
      const cmA = R.canMark(v, 'acabado', me, c, now);
      tiles = (s.mo ? ptile('montaje', s.mo.done_by === me.id ? 'mine' : 'other', 'Hecho ' + t(s.mo.done_at)) : cmM.ok ? ptile('montaje', 'todo post', 'Tomado · hasta ' + whenRel(s.d.finalDue, now), `data-act="quick" data-v="${v.id}" data-k="montaje"`) : ptile('montaje', 'by', 'Lo hará ' + A))
        + (s.ac ? ptile('acabado', s.ac.done_by === me.id ? 'mine' : 'other', 'Hecho ' + t(s.ac.done_at)) : s.mo && cmA.ok ? ptile('acabado', 'todo post', 'Hasta ' + whenRel(s.d.finalDue, now), `data-act="quick" data-v="${v.id}" data-k="acabado"`) : ptile('acabado', 'lock', 'Después del montaje'));
      const cl = R.claimOf(v, 'montaje', c);
      extra = myUndo(s.ac) || myUndo(s.mo) || (cl && cl.member_id === me.id && !s.mo && R.within(cl.created_at, now) ? undoLink('unclaim', `data-id="${cl.id}"`, 'Soltar') : '');
    }
    if (!s.ac || R.within(s.ac.done_at, now)) { tone = 'blue'; msg = `Equipo que cumple: ${A} editará este video y el cliente lo recibe a tiempo.`; }
  }
  // 1.4: una entrega vencida nunca se bloquea: "Entregar igual" o "Reprogramar entrega" (solo el administrador).
  if (s.overdue && P && P.phase === 'colab') {
    tone = 'red'; msg = `La entrega venció ${whenRel(s.d.finalDue, now)} y el editor aún no termina.${isAdm ? ' Puedes reprogramar la entrega con el cliente.' : ''}`;
    if (isAdm) after += `<button class="hb x-red" data-act="reprog" data-v="${v.id}" style="font-size:14px">${icon.clock.replace('width="12" height="12"', 'width="16" height="16"')}Reprogramar entrega</button>`;
  } else if (s.overdue) {
    tiles = tiles.replace(/(class="tile todo post"[^>]*>[\s\S]*?<small>)[^<]*(<\/small>)/g, '$1Vencido · entregar igual$2');
    const who = s.inCharge === me.id ? 'tú' : first(st.member(s.inCharge));
    tone = 'red';
    msg = s.inCharge === me.id ? `La entrega venció ${whenRel(s.d.finalDue, now)}. ${isAdm ? 'Entrégalo igual o reprograma la entrega con el cliente.' : 'Entrégalo igual: todavía cuenta, con tardanza.'}` : `La entrega venció ${whenRel(s.d.finalDue, now)} · la tiene ${who}. ${isAdm ? 'Puedes reprogramar la entrega con el cliente.' : A + ' puede reprogramarla con el cliente.'}`;
    if (isAdm) after += `<button class="hb x-red" data-act="reprog" data-v="${v.id}" style="font-size:14px">${icon.clock.replace('width="12" height="12"', 'width="16" height="16"')}Reprogramar entrega</button>`;
  }
  const done = s.delivered;
  const cls = done ? ' good' : tone === 'red' ? ' miss' : '';
  const chip = done ? `<span class="chip13 ok">${icon.star('currentColor', 12)}Entregado</span>` : wait && isOwner ? `<span class="chip13 wait13">${icon.clock}${R.money(val)} en espera</span>` : '';
  const head = inDetail ? '' : `<div class="vhead"><a class="vnum" href="#/v/${v.id}" style="text-decoration:none;color:inherit"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span></a><span class="ttl"><p>${v.title ? esc(v.title) : 'Video ' + v.num}</p><span style="color:${done ? 'var(--mint)' : '#B79C8F'}">Publica ${R.fmtDay(v.publish_date)}</span></span>${chip}</div>`;
  return `<section class="vcard13${cls}"${inDetail ? ' style="gap:12px"' : ''}>${head}${inDetail && chip ? `<div class="row" style="justify-content:flex-end">${chip}</div>` : ''}
    ${timeline && !done ? postTimeline(v, s, now) : ''}
    <div class="tiles">${tiles}</div>${msg ? pmsg(tone || 'blue', msg) : ''}${after}${extra ? `<div class="pextra">${extra}</div>` : ''}</section>`;
}
// Revisar la entrega: Aprobar o Pedir cambios, con doble confirmación.
function sheetReview(v, step) {
  const c = st.ctx(v.project_id);
  const s = R.videoState(v, c, new Date());
  const O = first(st.member(v.owner));
  const val = R.money(postValue(v));
  if (step === 'ok') return `<h2>¿Aprobar la entrega del video ${v.num}?</h2><p class="sub" style="margin:0">${O} recibirá ${val}. Puedes deshacerlo durante 10 minutos.</p>
    <button class="hb x-green" data-act="reviewGo" data-v="${v.id}" data-ok="1">${icon.check}Sí, aprobar</button><button class="btn b-ghost" data-act="close">Volver</button>`;
  if (step === 'no1') return `<form data-form="reviewNote" style="display:contents"><input type="hidden" name="v" value="${v.id}"><h2>Pedir cambios</h2>
    <p class="sub" style="margin:0">Escribe qué debe corregir. ${O} tiene hasta las ${R.limaTime(s.d.fixDue)}.</p>
    <label class="field"><span>¿Qué debe corregir?</span><textarea class="in" name="note" rows="3" required maxlength="300" placeholder="Ej.: el audio se corta en 0:42" style="min-height:96px;padding-top:12px">${esc(ui.revNote || '')}</textarea></label>
    <button class="hb x-red">Continuar</button><button type="button" class="btn b-ghost" data-act="close">Volver</button></form>`;
  const first2 = !(s.ac && s.ac.review_round) && new Date() <= s.d.fixDue;
  return `<h2>¿Seguro que el video ${v.num} no está listo?</h2><p class="sub" style="margin:0">${first2 ? `${O} no cobra hasta corregirlo. Si a las ${R.limaTime(s.d.fixDue)} no lo corrige, el video pasa a ti.` : `Ya ${s.ac && s.ac.review_round ? 'pediste cambios una vez' : 'pasó el plazo para corregir'}: el video pasa a ti y tú lo editas.`}</p>
    <div class="pmsg pm-amber"><span class="pdot"></span><p>${esc(ui.revNote || '')}</p></div>
    <button class="hb x-red" data-act="reviewGo" data-v="${v.id}" data-ok="0">${first2 ? 'Sí, pedir cambios' : 'Sí, el video pasa a mí'}</button><button class="btn b-ghost" data-act="close">Volver</button>`;
}
// Aviso con "Deshacer" en la barra de abajo (8 s); la tarjeta mantiene el botón los 10 minutos.
function offerUndo(text, fn) {
  const id = Date.now();
  ui.undo = { id: 'x' + id, fn, text, until: Date.now() + 8000 };
  render();
  setTimeout(() => { if (ui.undo && ui.undo.id === 'x' + id) { ui.undo = null; render(); } }, 8000);
}

// ---------- Administrador → Entregas al límite ----------
const ENT_KEYS = ['mon', 'monh', 'self', 'auto', 'fix'];
function entBase() { const r = Object.assign({}, R.DEFAULT_RULES, st.settings().rules || {}); return { mon: r.mon, monh: r.monh, self: r.self, auto: r.auto, fix: r.fix, cli: Object.assign({}, r.cli || {}) }; }
function vAdminEntregas() {
  const base = entBase();
  const cur = Object.assign({}, base, ui.ent || {}, { cli: Object.assign({}, base.cli, (ui.ent || {}).cli || {}) });
  const pend = st.pendingProposal('rules');
  const soc = otherPartner();
  const SN = soc ? first(soc) : 'tu socio';
  // Línea de tiempo de ejemplo: publica el sábado.
  const days = cur.mon;
  const span = days * 1440 + 9 * 60;
  const pos = (dayFromStart, m) => ((dayFromStart * 1440 + m) / span * 100);
  const last = days - 1; // índice del día anterior a la publicación
  const pA = pos(0, cur.monh), pT = pos(last, cur.self), pU = pos(last, cur.auto), pE = pos(last, 1440);
  const segs = [[pA, '#2F9E6E'], [pT - pA, '#D98A00'], [pU - pT, '#E5484D'], [pE - pU, '#3D6BB8'], [100 - pE, '#FFB547']];
  const DN = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const dayLbl = Array.from({ length: days }, (_, i) => DN[(6 - days + i + 7) % 7]);
  const leg = [['Con tu apoyo', 'hasta ' + dayLbl[0] + ' ' + R.hm(cur.monh), '#2F9E6E', '#9FD9BF'], ['Lo entrega él solo', 'hasta ' + dayLbl[last] + ' ' + R.hm(cur.self), '#D98A00', '#FFC978'], ['En riesgo · se puede tomar', 'hasta ' + R.hm(cur.auto), '#E5484D', '#FF9B8F'], ['Pasa a ti', 'hasta ' + dayLbl[last] + ' 23:59', '#3D6BB8', '#A9C7FF']];
  const row = (k, name, sub, step, min, max, fmt, c, line = true) => {
    const ch = cur[k] !== base[k];
    return `<div class="srow ent"${line ? '' : ' style="border-top:none"'}><span class="sq" style="background:${c}"></span><span class="ttx"><b>${name}</b><span>${ch ? 'Antes: ' + fmt(base[k]) + ' · ' : ''}${sub}</span></span><button class="sb" data-act="entStep" data-k="${k}" data-d="${-step}" data-min="${min}" data-max="${max}" aria-label="Menos" ${cur[k] - step < min ? 'disabled' : ''}>−</button><b class="num sval${ch ? ' ch' : ''}">${fmt(cur[k])}</b><button class="sb" data-act="entStep" data-k="${k}" data-d="${step}" data-min="${min}" data-max="${max}" aria-label="Más" ${cur[k] + step > max ? 'disabled' : ''}>+</button></div>`;
  };
  const dd = (x) => x + ' días';
  let html = `${backTo('#/admin', 'Administrador')}<div><h1 style="font-size:28px">Entregas al límite</h1><p class="sub">Qué pasa con un video de ${SN} cuando el montaje se atrasa.</p></div>`;
  if (pend) html += `<section class="pendbox row" style="flex-direction:row;align-items:center"><span style="flex:1;min-width:0"><b class="small" style="color:#C9D8FF">Propuesta esperando a ${SN}</b><br><span class="muted">${propSummary(pend)}</span></span><button class="btn sm b-ghost" data-act="propWithdraw" data-id="${pend.id}">Retirar</button></section>`;
  html += `<section class="card" style="gap:10px"><div class="between" style="align-items:baseline"><p class="lbl" style="margin:0">Así queda</p><span class="small" style="font-weight:700;color:#FFD08A">Ejemplo: publica sáb</span></div>
    <div class="row" style="gap:0;font-size:11px;font-weight:700;color:var(--tx4)">${dayLbl.map((dl) => `<span style="width:${(1440 / span * 100).toFixed(2)}%;text-align:center">${dl.toUpperCase()}</span>`).join('')}<span style="width:${(540 / span * 100).toFixed(2)}%;text-align:center;color:#FFD08A">★</span></div>
    <div class="ptl-bar" style="height:14px">${segs.map(([w, c]) => `<i style="width:${w.toFixed(2)}%;background:${c}"></i>`).join('')}</div>
    <div style="display:flex;flex-direction:column;gap:7px">${leg.map(([tt, vv, c, fc]) => `<div class="row" style="gap:10px;font-size:13px"><span class="sq" style="background:${c}"></span><span style="flex:1;font-weight:600">${tt}</span><b class="num" style="color:${fc}">${vv}</b></div>`).join('')}</div></section>`;
  html += `<div class="agrp">
    ${row('mon', 'Días de apoyo', 'antes de publicar', 1, 2, 5, dd, '#2F9E6E', false)}
    ${row('monh', 'Hora del apoyo', 'último envío del montaje', 60, 720, 1380, R.hm, '#2F9E6E')}
    ${row('self', 'Entrega por su cuenta', 'hasta esta hora · luego se puede tomar', 60, 300, cur.auto - 60, R.hm, '#D98A00')}
    ${row('auto', 'Pasa solo a ti', 'si nadie lo tomó', 60, cur.self + 60, cur.fix - 60, R.hm, '#E5484D')}
    ${row('fix', 'Corregir cambios', 'si pediste cambios', 60, cur.auto + 60, 1320, R.hm, '#8A4A30')}
    <div class="srow ent"><span class="sq" style="background:#3D6BB8"></span><span class="ttx"><b>Entrega y revisión</b><span>Tus videos, los de apoyo y los tomados</span></span><b class="num sval" style="color:var(--tx4)">23:59</b></div></div>`;
  html += `<section class="msgcard" style="align-items:center">${icon.cam('#8AB4FF', 20)}<p>Entre rodaje y publicación deben pasar al menos <b>${cur.mon + 1} días</b>. Si no, te avisa al programar.</p></section>`;
  const clients = Array.from(new Set(S.data.projects.map((p) => p.client).filter(Boolean)));
  if (clients.length) {
    html += `<div><p class="lbl alb">Por cliente</p><div style="display:flex;flex-direction:column;gap:8px">${clients.map((cl, i) => {
      const own = cur.cli[cl] != null;
      const d = own ? cur.cli[cl] : cur.mon;
      return `<div class="entcli${own ? ' on' : ''}"><div class="row" style="gap:12px"><span class="entav">${esc(cl.charAt(0).toUpperCase())}</span><span style="flex:1;min-width:0"><b style="display:block;font-size:14px">${esc(cl)}</b><span class="muted">${own ? `Plazo propio · ${d} días de apoyo` : `Usa el del equipo · ${cur.mon} días`}</span></span>
        <button class="sw13${own ? ' on' : ''}" role="switch" aria-checked="${own}" aria-label="Plazo propio para ${esc(cl)}" data-act="entCli" data-i="${i}"><i></i></button></div>
        ${own ? `<div class="row" style="gap:12px;padding-top:10px;border-top:1px solid var(--line)"><span style="flex:1;font-size:13px;font-weight:600">Días de apoyo para este cliente</span><button class="sb" data-act="entCliStep" data-i="${i}" data-d="-1" ${d <= 2 ? 'disabled' : ''} aria-label="Menos">−</button><b class="num sval">${d} días</b><button class="sb" data-act="entCliStep" data-i="${i}" data-d="1" ${d >= 6 ? 'disabled' : ''} aria-label="Más">+</button></div>` : ''}</div>`;
    }).join('')}</div></div>`;
  }
  const diffs = ENT_KEYS.filter((k) => cur[k] !== base[k]).map((k) => k === 'mon' ? `apoyo ${base.mon} → ${cur.mon} días` : `${R.hm(base[k])} → ${R.hm(cur[k])}`);
  const cliCh = JSON.stringify(cur.cli) !== JSON.stringify(base.cli);
  if (cliCh) diffs.push('por cliente: ' + (Object.entries(cur.cli).map(([k, x]) => `${k} ${x} días`).join(', ') || 'ninguno'));
  if (diffs.length) html += `<div class="propbar"><span style="flex:1;min-width:0"><b>${diffs.length} ${diffs.length === 1 ? 'cambio' : 'cambios'} por proponer</b><br><span class="muted">Se aplican cuando ${SN} los aprueba.</span></span><button class="btn sm b-ghost" data-act="entDiscard">Descartar</button><button class="btn sm b-blue" data-act="entPropose" ${pend ? 'disabled' : ''}>Proponer a ${SN}</button></div><div style="height:70px"></div>`;
  else html += `<p class="muted" style="margin:0 4px;text-align:center">Los cambios se aplican cuando ${SN} los aprueba.</p>`;
  return html;
}

// ---------- Aviso de choque al programar o repartir (Opción B) ----------
// Para cada video de quien recibe apoyo: ¿el último día del apoyo cae en un rodaje o reunión? ¿hay días suficientes?
function choquesDe(items, extraBusy = []) {
  const p = st.project();
  const busy = {};
  for (const e of S.data.events.filter((x) => active(x))) { const d = R.limaDate(e.starts_at); busy[d] = busy[d] || (e.kind === 'rodaje' ? 'rodaje' : 'reunión'); }
  for (const [d, k] of extraBusy) busy[d] = busy[d] || k;
  const out = [];
  items.forEach((it, i) => {
    const o = st.member(it.owner);
    if (!o.apoyo) return;
    const mon = R.monDays(p ? p.client : null);
    if (it.rodajeDate && dayDiff(it.rodajeDate, it.publish_date) < mon + 1) { out.push({ i, it, kind: 'gap', mon, need: R.addDays(it.rodajeDate, mon + 1) }); return; }
    const apoyoDay = it.apoyo_due ? R.limaDate(it.apoyo_due) : R.addDays(it.publish_date, -mon);
    if (busy[apoyoDay] && !(it.rodajeDate && apoyoDay <= it.rodajeDate)) out.push({ i, it, kind: 'clash', mon, apoyoDay, what: busy[apoyoDay], canAdvance: !it.rodajeDate || R.addDays(apoyoDay, -1) > it.rodajeDate });
  });
  return out;
}
const dShort = (d) => dowOf(d + 'T12:00:00-05:00') + ' ' + Number(d.slice(8, 10));
function sheetChoque() {
  const ch = ui.choque;
  const blocks = ch.list.map((x, n) => {
    const it = x.it;
    const O = first(st.member(it.owner));
    const pick = ch.picks[n];
    const num = it.num ? 'video ' + it.num : 'este video';
    const start = it.rodajeDate || R.addDays(x.apoyoDay || it.publish_date, -2);
    const end = R.addDays(it.publish_date, 1);
    const days = []; for (let d = start; d <= end && days.length < 8; d = R.addDays(d, 1)) days.push(d);
    let ap = x.kind === 'clash' ? x.apoyoDay : null, pub = it.publish_date;
    if (pick === 'mas') ap = R.addDays(x.apoyoDay, -1);
    if (pick === 'pub') { pub = x.kind === 'gap' ? x.need : R.addDays(it.publish_date, 1); if (x.kind === 'clash') ap = R.addDays(x.apoyoDay, 1); }
    if (pub > end) days.push(pub);
    const cell = (d) => {
      const items = [];
      if (d === it.rodajeDate) items.push(['cam', 'Rodaje', 'b']);
      else if (x.kind === 'clash' && d === x.apoyoDay) items.push(['cam', x.what === 'rodaje' ? 'Rodaje' : 'Reunión', 'b']);
      if (ap && d === ap) items.push(['cut', 'Montaje ' + O.charAt(0), !pick && x.kind === 'clash' ? 'r' : 'g']);
      if (d === pub) items.push(['star', 'Publica', 'a']);
      const bad = !pick && ((x.kind === 'clash' && d === x.apoyoDay) || (x.kind === 'gap' && d > it.rodajeDate && d < pub));
      return `<div class="chd${bad ? ' bad' : ''}"><span>${dShort(d).toUpperCase()}</span><div>${items.map(([ic, l, cc]) => `<i class="chi c-${cc}">${ic === 'cam' ? icon.cam('currentColor', 13) : ic === 'cut' ? icon.cut('currentColor', 13) : icon.star('currentColor', 13)}<small>${l}</small></i>`).join('')}</div></div>`;
    };
    const alert = !pick
      ? (x.kind === 'clash' ? `El ${dShort(x.apoyoDay)} hay ${x.what} y ese mismo día vence el montaje de ${O} (${num}).` : `Entre el rodaje y la publicación hay ${dayDiff(it.rodajeDate, it.publish_date)} ${dayDiff(it.rodajeDate, it.publish_date) === 1 ? 'día' : 'días'}. Para que ${O} reciba apoyo hacen falta ${x.mon + 1}.`)
      : pick === 'igual' ? (x.kind === 'clash' ? `Se queda igual · el montaje de ${O} vence el ${dShort(x.apoyoDay)}, día de ${x.what}.` : 'Se queda igual · este video no tendrá apoyo en el video final.')
      : pick === 'mas' ? `Listo · el ${dShort(x.apoyoDay)} queda libre para ${x.what === 'rodaje' ? 'el rodaje' : 'la reunión'}.` : 'Listo · ya no se cruzan.';
    const opts = x.kind === 'clash'
      ? [['mas', `Adelantar el montaje de ${O}`, `Lo envía hasta el ${dShort(R.addDays(x.apoyoDay, -1))}, ${R.hm(R.RULES.monh)} · el ${dShort(it.publish_date)} no cambia`, x.canAdvance], ['pub', 'Publicar un día después', `${num.charAt(0).toUpperCase() + num.slice(1)} publica el ${dShort(R.addDays(it.publish_date, 1))} · montaje hasta el ${dShort(R.addDays(x.apoyoDay, 1))}, ${R.hm(R.RULES.monh)}`, true], ['igual', 'Seguir igual', `El montaje vence el día ${x.what === 'rodaje' ? 'del rodaje' : 'de la reunión'}`, true]]
      : [['pub', `Publicar el ${dShort(x.need)}`, `Así ${O} puede recibir apoyo en el video final`, true], ['igual', 'Seguir igual', 'Sin apoyo para este video', true]];
    return `<section class="chq"><div class="chstrip">${days.map(cell).join('')}</div>
      ${pmsg(!pick ? 'red' : pick === 'igual' ? 'amber' : 'green', alert)}
      ${opts.filter((o) => o[3]).map(([k, tt, sub]) => `<button class="chopt${pick === k ? ' on' : ''}" data-act="choquePick" data-n="${n}" data-k="${k}"><span class="rdo"><i></i></span><span><b>${tt}</b><small>${sub}</small></span></button>`).join('')}</section>`;
  }).join('');
  const all = ch.list.every((_, n) => ch.picks[n]);
  return `<h2>${ch.list.some((x) => x.kind === 'clash') ? 'Choque de plazos' : 'Poco tiempo para editar'}</h2>${blocks}
    <button class="hb ${all ? 'x-blue' : 'x-off'}" data-act="choqueSave" ${all ? '' : 'disabled'}>Guardar semana</button><button class="btn b-ghost" data-act="close">Volver</button>`;
}
// Aplica lo elegido: a filas nuevas (reparto) o a videos que ya existen (programar semana).
function choqueApply(x, pick) {
  const it = x.it;
  if (pick === 'mas') return { apoyo_due: R.at(R.addDays(x.apoyoDay, -1), R.hm(R.RULES.monh)).toISOString() };
  if (pick === 'pub') return x.kind === 'gap' ? { publish_date: x.need } : { publish_date: R.addDays(it.publish_date, 1) };
  return {};
}

// ---------- Reunión o rodaje ----------

// ---------- 1.3 · Reunión por dentro (F + reparto G) y rodaje por dentro (G/H) ----------
function vEvent(id) {
  const e = S.data.events.find((x) => x.id === id);
  if (!e) return `${backTo('#/videos', 'Etapas')}<p class="empty">No encontrado.</p>`;
  return e.kind === 'reunion' ? vMeeting(e) : vShoot(e);
}
// Llegadas de los dos (con la confirmación del administrador).
function arrivalsRow(e, now) {
  const c = st.ctx(e.project_id);
  const h = st.hireFor(e.id);
  return `<div class="row" style="gap:14px;flex-wrap:wrap">${st.partners().map((m) => {
    if (h && h.hired_by === m.id) return `<span class="row" style="gap:8px"><span class="avd"><span class="av" style="width:30px;height:30px;background:#C9B2FF;color:#160F22">G</span></span><span class="small" style="font-weight:600;color:var(--v-fg)">Guillermo · por ${first(m)}</span></span>`;
    const a = st.attOf(e.id, m.id);
    const s = st.eventStatus(e, m.id, now);
    const me = m.id === S.me.id;
    const t = a && a.arrived_at ? (me ? 'Llegaste ' : 'Llegó ') + R.limaTime(a.arrived_at) : a && a.claimed_at ? 'Marcó ' + R.limaTime(a.claimed_at) + ' · por confirmar' : a && a.notice && a.notice.sent_at ? 'Avisó que no irá' : s.k === 'ausente' ? 'No llegó' : R.rsvpOf(e, m.id, c).k === 'voy' ? 'Confirmó · por llegar' : 'Por llegar';
    const col = a && a.arrived_at ? '#6EE7B7' : a && a.claimed_at ? '#FFC978' : s.k === 'ausente' ? '#FF8A7A' : 'var(--tx4)';
    const un = me && a && a.claimed_at && R.within(a.claimed_at) && (!a.arrived_at || !a.confirmed_by) ? undoLink('undoArr', `data-a="${a.id}"`)
      : !me && a && a.arrived_at && a.confirmed_by === S.me.id && R.within(a.confirmed_at) ? undoLink('undoArr', `data-a="${a.id}"`) : '';
    return `<span class="row" style="gap:8px"><span class="avd">${av(m, 30)}<i style="background:${col}"></i></span><span class="small" style="font-weight:600;color:${col === 'var(--tx4)' ? 'var(--tx3)' : col}">${t}</span>${un}</span>`;
  }).join('')}</div>`;
}
function adminConfirm(e) {
  const me = S.me;
  if (me.role !== 'admin' || !active(e)) return '';
  return S.data.attendance.filter((a) => a.event_id === e.id && a.claimed_at && !a.arrived_at && a.member_id !== me.id).map((a) => `<div class="card tight"><b>${esc(st.member(a.member_id).name)} marcó su llegada a las ${R.limaTime(a.claimed_at)}</b><div class="grid2"><button class="btn sm x-green" data-act="confirmArr" data-a="${a.id}" data-m="claimed">Sí, a las ${R.limaTime(a.claimed_at)}</button><button class="btn sm b-ghost" data-act="confirmArr" data-a="${a.id}" data-m="now">Llegó ahora</button></div></div>`).join('');
}
function myArrival(e, now) {
  const myS = st.eventStatus(e, S.me.id, now);
  if (!active(e) || myS.k !== 'pendiente' || !isPartner(S.me)) return '';
  if (R.canCheckIn(e, now)) return `<button class="hb x-green" data-act="checkin" data-e="${e.id}">${pinIc}Llegué</button>`;
  return '';
}
// Pequeños bloques de siempre: avisos del otro, fuerza mayor, Guillermo y opciones.
function eventExtras(e, now) {
  const me = S.me;
  const isRod = e.kind === 'rodaje';
  const c = st.ctx(e.project_id);
  const p = projOf(e.project_id);
  const open = p && p.status === 'abierto';
  const act = active(e);
  const myS = st.eventStatus(e, me.id, now);
  const start = new Date(e.starts_at);
  const tolEnd = new Date(start.getTime() + e.tolerance_min * 60000);
  const atts = S.data.attendance.filter((x) => x.event_id === e.id);
  const vids = e.video_ids.map((vid) => S.data.videos.find((v) => v.id === vid)).filter(Boolean);
  let html = '';
  if (!isRod && e.ended_at && e.ended_by === me.id && R.within(e.ended_set_at)) html += banner('ok', 'Reunión finalizada', 'Puedes deshacerlo durante 10 minutos.', undoLink('undoEnd', `data-e="${e.id}"`));
  if (act && myS.k === 'por_confirmar') html += banner('wait', 'Tu llegada espera confirmación', `La marcaste a las ${R.limaTime(st.attOf(e.id, me.id).claimed_at)}. Si el administrador la confirma, vale esa hora.`);
  const rs = R.rsvpState(e, me.id, c, now);
  if (act && myS.k === 'pendiente' && !rs.open && R.rsvpOf(e, me.id, c).k !== 'no' && now < tolEnd && isPartner(me)) html += `<button class="btn b-ghost" data-act="notice" data-e="${e.id}">No podré ir</button>`;
  if (act && myS.k === 'ausente' && (!st.attOf(e.id, me.id) || !st.attOf(e.id, me.id).notice) && now - tolEnd < 24 * 3600000) html += `<button class="btn x-violet" data-act="notice" data-e="${e.id}" data-fm="1">Fue fuerza mayor</button>`;
  if (!isRod && act) html += guillermoBlock(e, myS, now);
  for (const a of atts.filter((x) => x.member_id !== me.id && x.notice && x.notice.sent_at)) {
    const who = st.member(a.member_id);
    const s = st.eventStatus(e, a.member_id, now);
    const n = a.notice;
    if (n.decision) { html += banner('ok', `Respondiste el aviso de ${esc(who.name)}`, decisionText(n.decision), n.decided_by === me.id && R.within(n.decided_at) ? undoLink('undoDecision', `data-a="${a.id}"`) : ''); continue; }
    if (!act) continue;
    const want = n.choice === 'other' ? 'Pide que grabes sus videos.' : n.choice === 'repro' ? 'Pide reprogramar.' : '';
    if (n.reason === 'fm') html += `<div class="card" style="border-color:#3E2C63;background:#160F22"><b>${esc(who.name)} marcó fuerza mayor</b><p class="sub" style="margin:0">Motivo: ${esc(n.fm_kind || '')}. ${want}</p><div class="grid2"><button class="btn x-violet" data-act="decide" data-a="${a.id}" data-d="accept">Acepto</button><button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="talk">Conversarlo</button></div></div>`;
    else if (!isRod) html += `<div class="card"><b>${esc(who.name)} ${s.k === 'cancel_ok' ? 'avisó a tiempo que no irá' : 'avisó fuera de plazo'}</b><button class="btn x-amber" data-act="decide" data-a="${a.id}" data-d="ok">Entendido</button></div>`;
    else if (s.k === 'cancel_ok') html += `<div class="card"><b>${esc(who.name)} avisó a tiempo que no irá</b><p class="sub" style="margin:0">${want} Puedes reprogramar el día o grabar solo tus videos.</p><div class="grid2"><button class="btn x-amber" data-act="reday" data-e="${e.id}" data-a="${a.id}">Reprogramar el día</button><button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="own">Grabo solo los míos</button></div>${n.choice === 'other' ? `<button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="record">Grabo también los suyos</button>` : ''}</div>`;
    else html += `<div class="card" style="border-color:#4A3414;background:#1C130A"><b>${esc(who.name)} avisó fuera de plazo</b><p class="sub" style="margin:0">${want} Reprograma el día o toma el día completo.</p><div class="grid2"><button class="btn b-ghost" data-act="reday" data-e="${e.id}" data-a="${a.id}">Reprogramar el día</button><button class="btn x-amber" data-act="decide" data-a="${a.id}" data-d="record">Tomo el día completo</button></div></div>`;
  }
  if (act && open && isPartner(me)) {
    const tools = [];
    const anyShot = vids.some((v) => S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje'));
    if (isRod && now > start && vids.some((v) => !S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje'))) tools.push(`<button class="btn b-ghost" data-act="repro" data-e="${e.id}">Reprogramar videos no grabados</button>`);
    if (isRod && !anyShot && (me.role === 'admin' || atts.some((a) => a.member_id !== me.id && a.notice && a.notice.sent_at))) tools.push(`<button class="btn b-ghost" data-act="reday" data-e="${e.id}">Reprogramar el rodaje completo</button>`);
    const someoneArrived = atts.some((a) => a.arrived_at || a.claimed_at);
    if (me.role === 'admin' && !someoneArrived) tools.push(`<button class="btn b-ghost" data-act="moveEv" data-e="${e.id}">Cambiar fecha u hora</button>`);
    if (me.role === 'admin' && now < start) tools.push(`<button class="btn b-ghost" data-act="tol" data-e="${e.id}">Cambiar tolerancia (${e.tolerance_min} min)</button>`);
    if (me.role === 'admin' && !e.video_ids.length && !atts.length && !S.data.hires.some((h) => h.event_id === e.id)) tools.push(`<button class="btn b-red" data-act="delEv" data-e="${e.id}">Borrar ${isRod ? 'rodaje' : 'reunión'}</button>`);
    else if (me.role === 'admin') tools.push(`<button class="btn b-red" data-act="cancelEv" data-e="${e.id}">Cancelar ${isRod ? 'rodaje' : 'reunión'}</button>`);
    if (!isRod && e.ended_at) { const rod = S.data.events.find((x) => x.id === e.rodaje_id); if (rod && active(rod) && now < R.preDueFor(rod.starts_at) && !S.data.events.some((x) => x.kind === 'reunion' && x.rodaje_id === rod.id && active(x) && !x.ended_at)) tools.push(`<button class="btn b-ghost" data-act="extraMeet" data-r="${rod.id}">Agendar otra reunión para este rodaje</button>`); }
    if (tools.length) html += `<p class="lbl" style="margin-top:6px">Opciones</p>` + tools.join('');
  }
  return html;
}
function statusBanners(e) {
  if (e.status === 'reprogramado') { const nu = S.data.events.find((x) => x.id === e.replaced_by); return banner('bad', 'Este rodaje se reprogramó', (nu ? 'Nueva fecha: ' + R.fmtWhen(nu.starts_at) + '. ' : '') + (e.cancel_note ? esc(e.cancel_note) : ''), nu ? `<a class="btn sm b-ghost" href="#/e/${nu.id}" style="margin-top:8px">Ver el nuevo rodaje</a>` : ''); }
  if (e.status === 'cancelado') return banner('bad', 'Cancelado', esc(e.cancel_note || ''), S.me.role === 'admin' && R.within(e.canceled_at) ? undoLink('undoCancel', `data-e="${e.id}"`) : '');
  return '';
}
// Cuadro Guion / Storyboard de un video en la reunión.
function preTile(v, k, c, now, mt) {
  const me = S.me;
  const s = R.videoState(v, c, now);
  const t = s[KEY[k]];
  const name = k === 'guion' ? 'Guion' : 'Storyboard';
  const ic = k === 'guion' ? icon.pen('currentColor', 18) : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/></svg>';
  const tt = (extra = '') => `<span class="tt">${ic}<b>${name}</b>${extra}</span>`;
  if (t) {
    if (t.split) return `<div class="tile by">${tt()}<small>Repartido al grabar</small></div>`;
    const mine = t.done_by === me.id;
    return `<div class="tile ${mine ? 'mine' : 'other'}">${tt(`<span class="ck">${icon.tick}</span>`)}<small>${t.hire_id ? 'Con Guillermo · ' : ''}Hecho ${R.limaDate(t.done_at) === R.limaDate(now) ? R.limaTime(t.done_at) : R.fmtWhen(t.done_at)}</small></div>`;
  }
  const hire = mt ? st.hireFor(mt.id) : null;
  if (hire && hire.hired_by === v.owner) {
    if (hire.present === me.id) { const cm = R.canMark(v, k, me, c, now, { hire }); if (cm.ok) return `<button class="tile g" data-act="quick" data-v="${v.id}" data-k="${k}" data-h="${hire.id}">${tt()}<small>Lo haces tú con Guillermo</small></button>`; }
    else return `<div class="tile wait">${tt()}<small>Lo hace ${first(st.member(hire.present))} con Guillermo</small></div>`;
  }
  const cm = R.canMark(v, k, me, c, now);
  if (cm.claim) return `<button class="tile take" data-act="claim" data-v="${v.id}" data-k="${k}">${tt()}<small>Tomar</small></button>`;
  if (cm.ok) return `<button class="tile todo" data-act="quick" data-v="${v.id}" data-k="${k}">${tt()}<small>${cm.claimed ? 'Tomado · hasta ' + R.fmtWhen(cm.limit) : mt && R.meetingOpen(mt, now) ? 'Tocar al terminar' : 'Hasta ' + R.fmtWhen(s.d.preDue)}</small></button>`;
  if (cm.gone) { const cl = R.claimOf(v, k, c); return cl ? `<div class="tile by">${tt()}<small>Lo hará ${first(st.member(cl.member_id))}</small></div>` : `<div class="tile late">${tt()}<small>Venció ${R.fmtWhen(s.d.preDue)}</small></div>`; }
  if (cm.late) return `<div class="tile late">${tt()}<small>Venció</small></div>`;
  const o = st.member(v.owner);
  return `<div class="tile wait">${tt()}<small>${mt && R.meetingOpen(mt, now) ? 'Lo marca ' + first(o) : first(o) + ' · hasta ' + R.fmtWhen(s.d.preDue)}</small></div>`;
}
function vMeeting(e) {
  const now = new Date();
  const me = S.me;
  const c = st.ctx(e.project_id);
  const p = projOf(e.project_id);
  const open = p && p.status === 'abierto';
  const rod = S.data.events.find((x) => x.id === e.rodaje_id);
  const vids = e.video_ids.map((vid) => c.videos.find((v) => v.id === vid)).filter(Boolean).sort((a, b) => a.num - b.num);
  const start = new Date(e.starts_at);
  const live = R.meetingOpen(e, now);
  const preDue = rod ? R.preDueFor(rod.starts_at) : null;
  const late = preDue && now > preDue;
  const done = vids.reduce((a, v) => { const s = R.videoState(v, c, now); return a + (s.g ? 1 : 0) + (s.s ? 1 : 0); }, 0);
  const total = vids.length * 2;
  const end = R.meetingEnd(e);
  const bonusOf = (v) => { const s = R.videoState(v, c, now); if (!s.g || !s.s) return false; const t = new Date(Math.max(new Date(s.g.done_at), new Date(s.s.done_at))); return t >= new Date(start.getTime() - R.RULES.open * 60000) && t <= end && !s.g.hire_id && !s.s.hire_id; };
  const myBonus = vids.filter((v) => v.owner === me.id && bonusOf(v)).length;
  const stTxt = !active(e) ? (e.status === 'cancelado' ? 'CANCELADA' : 'REPROGRAMADA') : e.ended_at ? 'FINALIZADA ' + R.limaTime(e.ended_at) : live ? 'EN CURSO' : now < start ? 'PROGRAMADA' : 'FINALIZADA';
  const stC = live ? '#6EE7B7' : 'var(--tx4)';
  let html = `${backTo('#/videos', 'Etapas')}${statusBanners(e)}`;
  html += `<section class="mhead${late && done < total ? ' late' : ''}"><div class="row" style="gap:14px">${calTile(e.starts_at, 'pre')}<div style="flex:1;min-width:0"><b class="num" style="font-size:17px;display:block">Reunión de preproducción</b><p class="sub" style="margin:3px 0 0">${R.limaTime(start)}${rod ? ' · para el rodaje del ' + R.fmtDay(R.limaDate(rod.starts_at)) : ''}</p></div>
    <span class="row" style="gap:6px;font-size:11px;font-weight:700;color:${stC};white-space:nowrap"><span class="hdot" style="background:${stC};animation:${live ? 'pulse 1.6s ease-in-out infinite' : 'none'}"></span>${stTxt}</span></div>
    ${arrivalsRow(e, now)}
    ${vids.length ? `<div style="display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:1px solid #1F2A24"><div class="between"><b class="small" style="font-size:13px;color:${late && done < total ? 'var(--r-fg2)' : 'var(--g-fg)'}">Entregables</b><b class="num" style="font-size:15px">${done}<span class="muted" style="font-size:15px"> / ${total}</span></b></div>
      <div class="ebar"><i style="width:${total ? Math.round(done / total * 100) : 0}%"></i></div>
      <div class="between" style="align-items:center"><span class="row small" style="gap:6px;font-weight:600;color:#FFD9A0">${icon.flame('#FFB547', 14)}${myBonus ? '+' + myBonus + (myBonus === 1 ? ' punto de reunión' : ' puntos de reunión') : e.ended_at || !live ? 'Sin puntos de reunión' : 'Termina guion y storyboard aquí: +1 por video'}</span><span class="small" style="font-weight:600;color:${late ? '#FF8A7A' : 'var(--tx4)'}">${preDue ? (late ? 'Venció ' : 'Plazo: ') + R.fmtWhen(preDue) : ''}</span></div></div>` : ''}</section>`;
  html += adminConfirm(e) + myArrival(e, now);
  if (active(e) && now < start && R.rsvpState(e, me.id, c, now).open && !R.rsvpState(e, me.id, c, now).k) html += confCard(e, now, true);
  html += teamMsgs(now).filter((t) => vids.some((v) => t.indexOf('video ' + v.num + ' ') !== -1)).map(msgCard).join('');
  if (!vids.length && active(e) && open && rod && isPartner(me)) html += repartoForm(e, rod);
  else if (!vids.length) html += `<div class="card"><p class="empty">Los videos se reparten en la reunión.</p></div>`;
  html += vids.map((v, i) => {
    const o = st.member(v.owner);
    const col = COLOR[o.role] || ['#22242C', '#C9C9D1'];
    const s = R.videoState(v, c, now);
    const miss = late && !(s.g && s.s);
    const bonus = bonusOf(v);
    const undoT = ['guion', 'storyboard'].map((k) => s[KEY[k]]).filter((t) => t && t.done_by === me.id && !t.split && R.canUndo(t, me, c, now));
    return `<section class="vcard13${miss ? ' miss' : bonus ? ' good' : ''}" style="animation-delay:${(i * 0.05).toFixed(2)}s"><div class="vhead"><a class="vnum" href="#/v/${v.id}" style="text-decoration:none;color:inherit" aria-label="Detalle del video ${v.num}"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span></a><span class="ttl"><p>${v.title ? esc(v.title) : 'Sin tema'}</p></span>${bonus ? `<span class="chip13" style="background:#2A2010;border:1px solid #6B4A1A;color:#FFD9A0">${icon.flame('#FFB547', 12)}+1 reunión</span>` : ''}</div>
      <div class="tiles">${preTile(v, 'guion', c, now, e)}${preTile(v, 'storyboard', c, now, e)}</div>
      ${undoT.length ? `<div class="row" style="justify-content:flex-end;gap:12px;margin-top:-6px">${undoT.map((t) => `<button class="linkbtn" data-act="undo" data-id="${t.id}">Deshacer ${t.kind}</button>`).join('')}</div>` : ''}</section>`;
  }).join('');
  if (active(e) && open && vids.length) {
    if (e.ended_at) html += `<button class="btn" disabled>Reunión finalizada · ${R.limaTime(e.ended_at)}</button>`;
    else if (e.end_requested_at) html += me.role === 'admin' ? `<button class="hb x-amber" data-act="confirmEnd" data-e="${e.id}">Confirmar fin de la reunión (${R.limaTime(e.end_requested_at)})</button>` : banner('wait', 'Pediste finalizar a las ' + R.limaTime(e.end_requested_at), 'El administrador lo confirma.');
    else if (live && (me.role === 'admin' || ['puntual', 'tarde'].indexOf(st.eventStatus(e, me.id, now).k) !== -1)) { const direct = me.role === 'admin' || R.adminAbsent(e, c, now); html += `<button class="hb ${done === total ? 'x-green' : 'x-ghost'}" data-act="endMeeting" data-e="${e.id}">${direct ? 'Finalizar reunión' : 'Pedir finalizar la reunión'}</button>`; }
  }
  html += eventExtras(e, now);
  return html;
}
// Reparto dentro de la reunión: tema y dueño de cada video (2 y 2 por defecto).
function repartoForm(mt, rod) {
  const p = projOf(rod.project_id);
  const ps = st.partners();
  const adm = ps.find((m) => m.role === 'admin') || S.me;
  const soc = ps.find((m) => m.role === 'socio');
  const c = st.ctx(p.id);
  const left = p.videos_total - c.videos.length;
  const n = Math.min(4, left);
  if (!n) return `<div class="card"><p class="empty">Ya se repartieron todos los videos del proyecto.</p></div>`;
  const pubBase = R.addDays(R.limaDate(rod.starts_at), 5);
  const h = st.hireFor(mt.id);
  const rows = Array.from({ length: n }, (_, i) => {
    const owner = soc ? (i < Math.ceil(n / 2) ? adm.id : soc.id) : adm.id;
    const num = c.videos.length + i + 1;
    return `<section class="vcard13" style="animation-delay:${(i * 0.05).toFixed(2)}s"><div class="vhead"><span class="vnum"><span class="vbox"><small>VIDEO</small><b class="num">${num}</b></span></span><input class="tema" name="tit${i}" placeholder="Tema del video" maxlength="80" aria-label="Tema del video ${num}"></div>
      <div class="row" role="radiogroup" aria-label="Quién hace el video ${num}" style="gap:8px">${ps.map((m) => { const k = m.role === 'admin' ? 'W' : 'S'; return `<label class="own${m.id === owner ? ' on-' + k : ''}" data-k="${k}"><input type="radio" class="hide" name="own${i}" value="${m.id}" ${m.id === owner ? 'checked' : ''}>${av(m, 22)}${esc(first(m))}</label>`; }).join('')}</div>
      <label class="row small" style="gap:8px;color:var(--tx3)">Publica <input class="in" type="date" name="pub${i}" value="${R.addDays(pubBase, Math.floor(i / 2) * 2)}" style="min-height:38px;flex:1"></label></section>`;
  }).join('');
  return `<form data-form="reparto" style="display:flex;flex-direction:column;gap:12px"><input type="hidden" name="r" value="${rod.id}"><input type="hidden" name="n" value="${n}">
    <div class="between" style="align-items:center"><b class="num" style="font-size:19px">Reparte los videos</b><span class="row" style="gap:6px" data-owncount>${ps.map((m) => `<span class="cnt13" style="background:${m.role === 'admin' ? '#2A2010' : '#131A2A'};color:${m.role === 'admin' ? '#FFD08A' : '#A9C7FF'}">${av(m, 20)}<b data-n="${m.id}">0</b></span>`).join('')}</span></div>
    ${h ? banner('fm', `Guillermo trabaja por ${esc(st.member(h.hired_by).name)}`, 'Asigna sus videos y marca sus guiones y storyboards "con Guillermo".') : ''}
    ${rows}<button class="hb x-green">${icon.check}Confirmar reparto</button></form>`;
}
// Rodaje por dentro (G/H): "Por grabar" / "✓ Grabado" para los dos; sin guion, Reprogramar.
function vShoot(e) {
  const now = new Date();
  const me = S.me;
  const c = st.ctx(e.project_id);
  const p = projOf(e.project_id);
  const open = p && p.status === 'abierto' && active(e);
  const vids = e.video_ids.map((vid) => c.videos.find((v) => v.id === vid)).filter(Boolean).sort((a, b) => a.num - b.num);
  const start = new Date(e.starts_at);
  const today = R.limaDate(now) === R.limaDate(start);
  const myS = st.eventStatus(e, me.id, now);
  const amHere = ['puntual', 'tarde'].indexOf(myS.k) !== -1;
  let html = `${backTo('#/videos', 'Etapas')}${statusBanners(e)}`;
  html += `<section class="evcard rod"><div class="row" style="gap:12px">${calTile(e.starts_at, 'rod')}<div style="flex:1;min-width:0"><b class="num" style="font-size:17px;display:block">Rodaje · ${R.limaTime(start)}</b><span class="muted" style="display:block;margin-top:2px">${evTitle(e, c).vt}${e.note ? ' · ' + esc(e.note) : ''}</span></div><span class="small" style="font-weight:700;color:var(--tx4)">${today ? (now >= start ? 'HOY · EN CURSO' : 'HOY') : now > start ? 'PASÓ' : R.fmtDay(R.limaDate(start)).toUpperCase()}</span></div>${arrivalsRow(e, now)}</section>`;
  html += adminConfirm(e) + myArrival(e, now);
  if (active(e) && now < new Date(start.getTime() - R.RULES.open * 60000) && (R.rsvpState(e, me.id, c, now).open && !R.rsvpState(e, me.id, c, now).k || R.rsvpState(e, me.id, c, now).missed)) html += confCard(e, now, true);
  html += teamMsgs(now).filter((t) => vids.some((v) => t.indexOf('video ' + v.num + ' ') !== -1)).map(msgCard).join('');
  html += vids.map((v, i) => {
    const o = st.member(v.owner);
    const col = COLOR[o.role] || ['#22242C', '#C9C9D1'];
    const s = R.videoState(v, c, now);
    const miss = !s.g || !s.s;
    const chip = (k) => { const t = s[KEY[k]]; return `<span class="chip13 ${t ? (t.split ? 'blue' : 'ok') : 'no'}">${t ? icon.tick : '×'}${k === 'guion' ? 'Guion' : t && t.split ? 'Storyboard repartido' : 'Storyboard'}</span>`; };
    let act = '';
    if (s.r) act = `<span class="hb x-done" style="cursor:default;font-size:15px;${s.r.done_by !== v.owner ? '' : ''}">${icon.check}Grabado${s.r.done_by !== v.owner ? ' · por ' + first(st.member(s.r.done_by)) : ''}</span>`;
    else if (open) {
      const cm = R.canMark(v, 'rodaje', me, c, now);
      if (cm.noGuion) act = isPartner(me) ? `<button class="hb x-red" data-act="reproVideo" data-v="${v.id}" style="font-size:15px">Reprogramar</button>` : '';
      else if (cm.ok) act = `<button class="hb x-amber" data-act="quick" data-v="${v.id}" data-k="rodaje">${icon.cam('currentColor', 18)}Por grabar</button>`;
      else act = `<span class="hb x-off" title="${esc(cm.why || '')}">${icon.cam('currentColor', 18)}Por grabar</span>${v.owner === me.id && !amHere && today ? '' : ''}`;
      // La noche anterior: tomar lo que falta del compañero
      const takes = ['guion', 'storyboard'].map((k) => { if (s[KEY[k]]) return ''; const cmk = R.canMark(v, k, me, c, now); if (cmk.claim) return `<button class="btn sm x-blue" data-act="claim" data-v="${v.id}" data-k="${k}">Tomar ${k}</button>`; if (cmk.ok && cmk.claimed) return `<button class="btn sm x-green" data-act="quick" data-v="${v.id}" data-k="${k}">${k === 'guion' ? 'Guion' : 'Storyboard'} hecho</button>`; return ''; }).join('');
      if (takes) act = `<div class="row" style="gap:8px">${takes}</div>` + act;
    }
    return `<section class="vcard13${miss && !s.r ? ' miss' : ''}" style="animation-delay:${(i * 0.05).toFixed(2)}s"><div class="vhead"><a class="vnum" href="#/v/${v.id}" style="text-decoration:none;color:inherit"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span></a><span class="ttl"><p>${v.title ? esc(v.title) : 'Video ' + v.num}</p></span></div>
      <div class="chips">${chip('guion')}${chip('storyboard')}</div>${act}</section>`;
  }).join('');
  if (!vids.length) html += `<div class="card"><p class="empty">Todavía no hay videos en este rodaje.</p></div>`;
  html += eventExtras(e, now);
  const pastN = c.events.filter((x) => x.kind === 'rodaje' && x.id !== e.id && R.limaDate(x.starts_at) < R.limaDate(now)).length;
  if (pastN) html += `<a class="pastbtn" href="#/rodajes">${icon.hist.replace('width="22" height="22"', 'width="18" height="18"')}Rodajes pasados<span class="cnt">${pastN}</span>${icon.chev}</a>`;
  return html;
}

function guillermoBlock(e, myS, now) {
  const me = S.me;
  const start = new Date(e.starts_at);
  const h = st.hireOpen(e.id);
  const p = S.data.projects.find((x) => x.id === e.project_id);
  const preVal = R.rates(p).guion + R.rates(p).storyboard;
  if (!h) {
    if (now < start && myS.k === 'pendiente' && st.partners().length > 1 && !R.rsvpState(e, me.id, st.ctx(e.project_id), now).open) return `<div class="card" style="border-color:#3E2C63;background:#160F22"><p class="lbl" style="color:#C9B2FF">¿No irás a esta reunión?</p><p class="sub" style="margin:0">Puedes contratar a <b style="color:#fff">Guillermo</b> para tu preproducción. Tu compañero hace tus guiones y storyboards con él y recibe el 80 % (${R.money(preVal * 0.8)} por video). Tú conservas el 20 % y tu asistencia queda como "no requerida": no es falta ni suma racha.</p><button class="btn b-purple" data-act="hire" data-e="${e.id}">Contratar a Guillermo</button></div>`;
    return '';
  }
  const A = st.member(h.hired_by), B = st.member(h.present);
  if (h.status === 'pendiente') {
    if (me.id === h.present) return `<div class="card" style="border-color:#3E2C63;background:#160F22"><b>${esc(A.name)} quiere contratar a Guillermo</b><p class="sub" style="margin:0">Si aceptas, en esta reunión asignas sus videos y marcas sus guiones y storyboards "con Guillermo". Recibes el 80 % de esa preproducción (${R.money(preVal * 0.8)} por video). Él no tiene que asistir.</p><div class="grid2"><button class="btn b-purple" data-act="hireDecide" data-id="${h.id}" data-s="aceptada">Aceptar</button><button class="btn b-ghost" data-act="hireDecide" data-id="${h.id}" data-s="rechazada">Rechazar</button></div></div>`;
    return banner('fm', `Esperando que ${esc(B.name)} acepte`, 'Si rechaza, la reunión sigue con las reglas normales.', now < start ? `<button class="btn sm b-ghost" data-act="hireDecide" data-id="${h.id}" data-s="cancelada" style="margin-top:8px">Cancelar contratación</button>` : '');
  }
  const mine = e.video_ids.map((id) => S.data.videos.find((v) => v.id === id)).filter((v) => v && v.owner === h.hired_by);
  return banner('fm', `Guillermo trabaja por ${esc(A.name)} en esta reunión`, me.id === h.present
    ? `Tú asignas los videos de ${esc(A.name)} y marcas sus guiones y storyboards "con Guillermo". Recibes el 80 % de esa preproducción.${mine.length ? '' : ' Primero reparte la semana.'}`
    : me.id === h.hired_by ? `${esc(B.name)} y Guillermo preparan tus videos. Te llegarán los guiones aquí. Tu asistencia no es requerida.` : '',
    `${!e.video_ids.length && me.id === h.present ? `<a class="btn sm b-purple" href="#/semana/${e.rodaje_id || ''}" style="margin-top:8px">Repartir videos</a>` : ''}${mine.map((v) => `<a class="btn sm b-ghost" href="#/v/${v.id}" style="margin-top:8px;margin-right:6px">Video ${v.num} de ${first(A)}</a>`).join('')}`);
}

function decisionText(d) {
  return { accept: 'Aceptaste la fuerza mayor: no cuenta como falta.', talk: 'Pediste conversarlo: se aplica la regla normal hasta que se pongan de acuerdo.', record: 'Grabas sus videos y te corresponde el pago de rodaje.', repro: 'Sus videos se reprograman y conservan su dueño.', own: 'Grabas solo tus videos; los suyos se reprograman.', reday: 'Reprogramaste el rodaje completo.', ok: 'Recibiste su aviso.' }[d] || '';
}

// ---------- Resumen ----------
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const LV = {
  Imparable: { bg: '#160F22', border: '#3E2C63', accent: '#C9B2FF', size: 58, speed: '1s' },
  Responsable: { bg: '#200F0A', border: '#5A2416', accent: '#FFB09C', size: 52, speed: '1.3s' },
  Constante: { bg: '#1C130A', border: '#4A3414', accent: '#FFC978', size: 46, speed: '1.6s' },
  Cumplidor: { bg: '#1C170C', border: '#4A3A16', accent: '#FFD592', size: 40, speed: '2s' }
};
// Cada tarea hecha, con a quién se le paga (5.5 apoyo, Guillermo 80/20).
function credits(p, c) {
  const rate = R.rates(p);
  const out = [];
  for (const t of c.tasks) {
    const v = c.videos.find((x) => x.id === t.video_id);
    if (!v) continue;
    const vs = R.videoState(v, c);
    const due = PRE[t.kind] ? vs.d.preDue : t.kind === 'montaje' ? vs.d.montajeDue : t.kind === 'acabado' ? vs.d.finalDue : null;
    const late = !!(due && new Date(t.done_at) > due);
    const base = { t: `Video ${v.num} · ${R.KIND_LABEL[t.kind].toLowerCase()}`, at: new Date(t.done_at), k: R.STAGE_OF[t.kind], kind: t.kind, video: v };
    const when = R.fmtWhen(t.done_at) + (t.kind === 'rodaje' ? '' : late ? ' · fuera de plazo' : ' · a tiempo');
    if (t.hire_id) {
      const h = S.data.hires.find((x) => x.id === t.hire_id);
      if (h) { out.push(Object.assign({}, base, { to: h.present, amt: rate[t.kind] * 0.8, when: when + ' · con Guillermo (80 %)' })); out.push(Object.assign({}, base, { to: h.hired_by, amt: rate[t.kind] * 0.2, when: when + ' · Guillermo (20 %)' })); }
      continue;
    }
    if (t.kind === 'acabado' && vs.apoyo) { out.push(Object.assign({}, base, { to: v.owner, amt: rate[t.kind], when: when + ' · final de apoyo (5.5)' })); continue; }
    out.push(Object.assign({}, base, { to: t.done_by, amt: rate[t.kind], when: when + (t.done_by !== v.owner ? ' · lo tomaste' : '') }));
  }
  return out.sort((a, b) => b.at - a.at);
}
function vSummary() {
  const p = st.project();
  if (!p) return `<p class="empty">Sin proyecto.</p>`;
  const me = S.me;
  const now = new Date();
  const c = st.ctx(p.id);
  const pay = R.payouts(p, c);
  const mine = pay.porMiembro[me.id] || { pre: 0, prod: 0, post: 0, total: 0 };
  const R8 = R.rates(p);
  const scope = ui.scope || 'p';
  const isProj = scope === 'p';
  const key = 'sum:' + p.id + ':' + scope;
  const anim = ui.animKey !== key;
  ui.wantAnim = key;
  const vids = c.videos;
  const states = vids.map((v) => R.videoState(v, c, now));
  const delivered = states.filter((s) => s.delivered).length;
  const complete = vids.length === p.videos_total && states.every((s) => s.complete);
  const paid = !!(p.settlement && p.settlement.paid_at);
  const myCred = credits(p, c).filter((x) => x.to === me.id);
  const cnt = (kind) => myCred.filter((x) => x.kind === kind).length;
  // Lo que falta cobrar de mis videos
  let pendMine = 0;
  vids.forEach((v, i) => {
    if (v.owner !== me.id) return;
    const vs = states[i];
    if (!vs.g) pendMine += R8.guion; if (!vs.s) pendMine += R8.storyboard; if (!vs.r) pendMine += R8.rodaje;
    if (!vs.mo && !vs.montajeMissed) pendMine += R8.montaje + R8.acabado;
    else if (vs.mo && vs.mo.done_by === me.id && !vs.ac) pendMine += R8.acabado;
  });
  const apoyoGiven = vids.filter((v, i) => states[i].apoyo && states[i].ac.done_by === me.id).length;
  const apoyoGot = vids.filter((v, i) => v.owner === me.id && states[i].apoyo).length;
  const lostCount = vids.filter((v, i) => v.owner === me.id && states[i].reassigned).length;
  const tookCount = vids.filter((v, i) => v.owner !== me.id && states[i].reassigned && states[i].mo && states[i].mo.done_by === me.id).length;
  const gMine = (pay.guillermo || {})[me.id];
  const gTo = Object.entries(pay.guillermo || {}).filter(([, x]) => x.to === me.id);
  // Equipo
  const ps = st.partners();
  let tTot = 0, tOk = 0, aTot = 0, aOk = 0;
  for (const m of ps) { const d = R.deliveries(m.id, c, now); tTot += d.total; tOk += d.onTime; }
  for (const e of c.events.filter(active)) for (const m of ps) { const s = st.eventStatus(e, m.id, now); if (['pendiente', 'no_req', 'por_confirmar', 'cancel_ok', 'fm'].indexOf(s.k) !== -1) continue; aTot++; if (s.k === 'puntual') aOk++; }
  const onTimeVideos = states.filter((s) => s.delivered && !s.finalLate).length;
  // Privado
  const dlv = R.deliveries(me.id, c, now);
  const evs = c.events.filter(active).map((e) => st.eventStatus(e, me.id, now)).filter((s) => ['pendiente', 'no_req', 'por_confirmar', 'cancel_ok', 'fm'].indexOf(s.k) === -1);
  const tard = evs.filter((s) => s.k === 'tarde').length, aus = evs.filter((s) => s.k === 'ausente' || s.k === 'cancel_late').length;
  const punt = evs.filter((s) => s.k === 'puntual').length;
  const contr = R.contribution(p, c, now);
  const doneUnits = Object.values(contr.units).reduce((a, b) => a + b, 0);
  const myUnits = contr.units[me.id] || 0;
  const pct = doneUnits ? Math.round(myUnits / doneUnits * 100) : 0;
  const lateCount = dlv.total - dlv.onTime - dlv.missed;
  const bad = lateCount > 0 || dlv.missed > 0 || tard > 0 || aus > 0;
  const sk = R.streak(me.id, c, now);
  const col = bad ? '#FF6B5B' : '#6EE7B7';
  const myVids = vids.filter((v) => v.owner === me.id).length;
  const other = ps.find((m) => m.id !== me.id);
  const oName = other ? first(other) : 'tu compañero';
  const f = R.money;
  const stageIcon = { pre: icon.pen('#6EE7B7'), prod: icon.cam('#FFB547'), post: icon.cut('#FF8A65') };
  const tint = { pre: '#12271E', prod: '#2A2416', post: '#2A1810' };

  let html = `<div class="sumv${anim ? ' anim' : ''}" style="display:flex;flex-direction:column;gap:12px">`;
  html += `<div class="between" style="align-items:center"><div><p class="sub" style="margin:0">${isProj ? esc(p.client) + ' · ' + esc(p.name) : 'Todos tus proyectos del mes'}</p><h1>${isProj ? 'Resumen del proyecto' : 'Resumen del mes'}</h1></div>${av(me, 38)}</div>`;
  html += `<section class="card" style="flex-direction:row;align-items:center;gap:14px;background:#16140F;border-color:#3A3220"><span style="width:46px;height:46px;border-radius:15px;background:#FFB547;color:#1A1203;display:flex;align-items:center;justify-content:center;flex-shrink:0">${icon.check}</span><div style="flex:1"><b class="num" style="font-size:18px">${complete ? '¡Proyecto completo, equipo!' : delivered ? 'El equipo va avanzando' : 'El proyecto está en marcha'}</b><p class="sub" style="margin:2px 0 0;color:#C9C3B5">${delivered} de ${p.videos_total} videos entregados al cliente</p></div></section>`;
  html += `<div class="seg">${[['p', 'Este proyecto'], ['m', 'Mes de ' + MONTHS[Number(String(p.start_date).slice(5, 7)) - 1]]].map(([k, t]) => `<button class="${scope === k ? 'on' : ''}" data-act="scope" data-k="${k}">${t}</button>`).join('')}</div>`;
  // Recibo
  let lines = [], total = mine.total, statusTag, title, subT, totalLabel, foot, stamp = '';
  if (isProj) {
    lines.push({ t: 'PREPRODUCCIÓN', amt: f(mine.pre), d: [cnt('guion') + cnt('storyboard') ? `${cnt('guion')} guiones y ${cnt('storyboard')} storyboards` : 'todavía sin tareas', gMine ? `incluye el 20 % de ${gMine.tasks} tareas de Guillermo` : '', ...gTo.map(([by, x]) => `incluye ${f(x.amount)} por Guillermo (encargo de ${esc(st.member(by).name)})`)].filter(Boolean).join(' · ') });
    lines.push({ t: 'PRODUCCIÓN', amt: f(mine.prod), d: cnt('rodaje') ? `rodaje de ${cnt('rodaje')} videos` + (tard ? ` · ${tard} con tardanza (sí se pagan)` : '') : 'todavía sin rodajes' });
    lines.push({ t: 'POSPRODUCCIÓN', amt: f(mine.post), d: cnt('montaje') + cnt('acabado') ? `${cnt('montaje')} montajes y ${cnt('acabado')} finales` + (apoyoGot ? ` · ${apoyoGot} finales de apoyo de ${oName} (5.5)` : '') + (tookCount ? ` · ${tookCount} videos que tomaste (5.7)` : '') : 'todavía sin ediciones' });
    if (apoyoGiven) lines.push({ t: 'APOYO EN ACABADO', amt: f(0), d: `${apoyoGiven} finales de apoyo · el pago es de ${oName} (5.5)`, c: '#9A927F' });
    if (lostCount) lines.push({ t: 'VIDEOS TOMADOS', amt: f(0), d: `${lostCount} ${lostCount === 1 ? 'pasó' : 'pasaron'} al administrador (5.7)`, c: '#B3261E' });
    if (pendMine > 0.004 && !complete) lines.push({ t: 'POR HACER', amt: f(pendMine), d: 'lo que falta de tus videos', c: '#9A927F' });
    statusTag = complete ? `${p.videos_total} DE ${p.videos_total} VIDEOS · ${paid ? 'PAGADO' : p.status === 'cerrado' ? 'CERRADO' : 'COMPLETO'}` : `EN CURSO · ${delivered} DE ${p.videos_total} VIDEOS`;
    title = `RECIBO · ${String(p.client).toUpperCase()} ${String(p.name).toUpperCase()}`;
    subT = `proyecto de ${p.videos_total} videos · ${f(p.budget)}`;
    totalLabel = complete ? 'TOTAL' : 'ACUMULADO';
    foot = complete ? 'gracias por tu trabajo' : 'el recibo se cierra con el último video';
    if (complete) stamp = `<div class="stamp-wrap"><div class="stamp">${paid ? 'PAGADO' : 'LISTO PARA COBRAR'}</div>${'<span class="coin"></span>'.repeat(4)}</div>`;
  } else {
    const mon = String(p.start_date).slice(0, 7);
    const projs = S.data.projects.filter((x) => String(x.start_date).slice(0, 7) === mon && x.status !== 'archivado');
    total = 0;
    for (const x of projs) {
      const cx = st.ctx(x.id);
      const m = R.payouts(x, cx).porMiembro[me.id] || { total: 0 };
      total += m.total;
      const dv = cx.videos.filter((v) => R.videoState(v, cx).delivered).length;
      lines.push({ t: `${String(x.client).toUpperCase()} · ${String(x.name).toUpperCase()}`, amt: f(m.total), d: x.status === 'cerrado' ? 'cerrado' : `en curso · ${dv} de ${x.videos_total} videos` });
    }
    statusTag = 'MES EN CURSO';
    title = `RESUMEN · ${MONTHS[Number(mon.slice(5, 7)) - 1].toUpperCase()} ${mon.slice(0, 4)}`;
    subT = 'suma de tus proyectos';
    totalLabel = 'TOTAL DEL MES';
    foot = 'para tus cuentas personales';
  }
  html += `<div class="between" style="align-items:center"><p class="lbl" style="color:var(--mint)">${isProj ? 'Tu pago de este proyecto' : 'Tus ingresos del mes'}</p><span class="muted" style="color:#9CC9B4">${icon.lock} Solo tú lo ves</span></div>
  <div class="slot"><span></span></div>
  <div class="receipt"><div class="paper">
    <div style="display:flex;justify-content:center;margin-bottom:8px"><span class="rtag ${isProj && complete ? 'rtag-ok' : ''}">${isProj && complete ? '' : '<i></i>'}${statusTag}</span></div>
    <p class="mono" style="margin:0;text-align:center;font-size:11px;letter-spacing:.14em">${esc(title)}</p>
    <p class="mono" style="margin:4px 0 12px;text-align:center;font-size:11px;color:#6B6455">${esc(String(me.name).toUpperCase())} · ${subT}</p>
    ${lines.map((l) => `<div class="ln"${l.c ? ` style="color:${l.c}"` : ''}><span>${esc(l.t)}</span><span class="d"></span><b>${l.amt}</b></div>${l.d ? `<p class="ln-sub">${l.d}</p>` : ''}`).join('')}
    <div style="border-top:2px dashed #B9B2A2;margin:6px 0 10px"></div>
    <div class="between"><span class="mono" style="font-size:13px;font-weight:700">${totalLabel}</span><span class="num" style="font-size:32px;font-weight:700;color:#0F5E40" data-count="${total.toFixed(2)}">${f(total)}</span></div>
    <p class="mono" style="margin:8px 0 4px;text-align:center;font-size:10px;color:#857D6C">${foot}</p>
    ${stamp}
  </div><svg width="100%" height="12" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true" style="display:block"><path d="M0 0h300v2 L290 12 L280 2 L270 12 L260 2 L250 12 L240 2 L230 12 L220 2 L210 12 L200 2 L190 12 L180 2 L170 12 L160 2 L150 12 L140 2 L130 12 L120 2 L110 12 L100 2 L90 12 L80 2 L70 12 L60 2 L50 12 L40 2 L30 12 L20 2 L10 12 L0 2z" fill="#F6F2E7"/></svg></div>`;
  if (isProj) {
    const moves = myCred.slice(0, 4);
    html += `<div class="card" style="padding:6px 14px 4px;gap:0"><p class="lbl" style="margin:8px 0 4px">Últimos ingresos</p>${moves.map((m, i) => `<div class="mv" style="animation-delay:${(1.6 + i * 0.15).toFixed(2)}s"><span class="mv-ic" style="background:${tint[m.k]}">${stageIcon[m.k]}</span><div style="flex:1;min-width:0"><p style="margin:0;font-size:13px;font-weight:600">${m.t}</p><p style="margin:1px 0 0;font-size:11px;color:#8B8B94">${m.when}</p></div><span class="num" style="font-size:14px;font-weight:700;color:#6EE7B7">+ ${f(m.amt)}</span></div>`).join('') || '<p class="empty" style="padding:10px 0">Cuando marques tu primera tarea aparecerá aquí.</p>'}</div>`;
  }
  // Lo que logramos juntos
  const rp = tTot ? tOk / tTot : 0;
  const ringPct = Math.round(rp * 100);
  html += `<section class="card" style="gap:16px;background:#121318"><p class="lbl">Lo que logramos juntos</p>
  <div class="row" style="gap:16px"><div class="ring"><span class="glow"></span><svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="#1C2420" stroke-width="12"/><circle class="rg" cx="60" cy="60" r="50" fill="none" stroke="#6EE7B7" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(rp * 314.16).toFixed(1)} 314.2" transform="rotate(-90 60 60)"/></svg><div class="ring-c"><b class="num">${tTot ? ringPct + '%' : '—'}</b><span>a tiempo</span></div></div>
  <div style="flex:1;display:flex;flex-direction:column;gap:6px"><b class="num" style="font-size:18px;line-height:1.2">${complete ? 'Gran proyecto, equipo' : !tTot ? 'Recién empezamos' : rp >= 0.85 ? 'Vamos muy bien, equipo' : 'A recuperar el ritmo'}</b><p class="small" style="margin:0;color:#A1A1AA;line-height:1.45">${complete ? `El cliente recibió sus ${p.videos_total} videos.` : `El cliente ya tiene ${delivered} de sus ${p.videos_total} videos.`} ${tTot ? `${tOk} de ${tTot} entregas llegaron a tiempo.` : ''}</p>
  <div class="row" style="gap:8px"><div style="display:flex">${ps.map((m, i) => `<span style="margin-left:${i ? -7 : 0}px;border:2px solid #121318;border-radius:50%">${av(m, 24)}</span>`).join('')}</div><span class="small" style="color:#9CC9B4">Equipo de producción</span></div></div></div>
  <div class="grid3">
    <div class="stat"><b style="color:var(--mint)">${delivered}/${p.videos_total}</b><span>videos al cliente</span></div>
    <div class="stat"><b>${tOk}/${tTot}</b><span>entregas a tiempo</span></div>
    <div class="stat"><b>${aOk}/${aTot}</b><span>llegadas puntuales</span></div></div>`;
  // Tu aporte real
  const ind = [
    { v: `${dlv.onTime}/${dlv.total}`, l: lateCount + dlv.missed ? `entregas a tiempo · ${lateCount + dlv.missed} ${lateCount + dlv.missed === 1 ? 'falla' : 'fallas'}` : 'tus entregas a tiempo', bad: lateCount + dlv.missed > 0 },
    { v: `${punt}/${evs.length}`, l: tard + aus ? `puntualidad · ${tard + aus} ${tard + aus === 1 ? 'falla' : 'fallas'}` : 'llegadas puntuales', bad: tard + aus > 0 },
    { v: `${myVids - lostCount}/${myVids}`, l: 'tus videos, hechos por ti', bad: lostCount > 0 }
  ];
  const cover = [];
  if (tookCount) cover.push({ t: `Tomaste ${tookCount} ${tookCount === 1 ? 'video' : 'videos'} de ${oName} (5.7)`, d: 'Montaje y final para asegurar la entrega', dot: '#FFB547' });
  if (apoyoGiven) cover.push({ t: `${apoyoGiven} acabados de apoyo · sin cobro`, d: `Acordado en el punto 5.5: el pago es de ${oName}`, dot: '#6EE7B7' });
  if (lostCount) cover.push({ t: `${lostCount} ${lostCount === 1 ? 'video pasó' : 'videos pasaron'} a ${oName} · ${f(lostCount * (R8.montaje + R8.acabado))}`, d: 'Incumplimiento: el montaje no llegó a tiempo (5.7)', dot: '#FF6B5B' });
  if (apoyoGot) cover.push({ t: `${apoyoGot} acabados de ${oName}`, d: 'Apoyo acordado (5.5) · no es falta y tú los cobras', dot: '#8B8B94' });
  if (gMine) cover.push({ t: `Guillermo hizo ${gMine.tasks} tareas por ti`, d: `${oName} recibió el 80 %; tú conservas el 20 %`, dot: '#B98CFF' });
  const tips = [];
  if (bad) {
    if (lateCount) tips.push([`${lateCount} ${lateCount === 1 ? 'entrega llegó' : 'entregas llegaron'} tarde`, 'Termina guiones y storyboards en la misma reunión (suma +1 de reunión) y empieza cada montaje un día antes. Tarde resta 3.', `${dlv.total} de ${dlv.total} a tiempo`]);
    if (tard) tips.push([`${tard} ${tard === 1 ? 'llegada tarde' : 'llegadas tarde'}`, 'Sal 15 minutos antes. Puntual suma +1; tarde resta 1 (igual se paga).', `${evs.length} de ${evs.length} puntual`]);
    if (aus) tips.push([`${aus} ${aus === 1 ? 'falta' : 'faltas'} sin aviso a tiempo`, 'Si no puedes ir, avisa desde la app: rodaje hasta las 18:00 del día anterior, reunión con 24 h.', 'cero faltas']);
    if (dlv.missed) tips.push([`${dlv.missed} ${dlv.missed === 1 ? 'video pasó' : 'videos pasaron'} a otra persona`, `Si no llegas al plazo del montaje, el video y sus ${f(R8.montaje + R8.acabado)} pasan al administrador.`, `${myVids} de ${myVids} hechos por ti`]);
  } else {
    tips.push(['Tu racha sigue en el próximo proyecto', 'Cada entrega a tiempo la hace crecer; no empieza de cero.', sk.next ? `llegar a ${sk.next.name}` : `seguir en ${sk.level.name}`]);
    tips.push(['Termina la preproducción en la reunión', 'Cada video listo antes de finalizarla suma +1 punto de reunión.', 'todos los videos en la reunión']);
  }
  const lv = LV[sk.level.name];
  const flame = !bad && sk.pts > 0 && lv;
  const msg = !doneUnits ? 'Todavía no hay tareas hechas.' : bad
    ? `Tu parte va por debajo de lo esperado por incumplimientos. Lo que cobras sale de las tareas que hiciste: ${f(mine.total)} hasta hoy.`
    : pct > 52 ? `Hiciste más de lo que te tocaba. Cobras ${f(mine.total)} hasta hoy${apoyoGiven ? ': los acabados de apoyo se le pagan a ' + oName + ' (5.5)' : ''}.` : `Vas al día con tu parte. Cobras ${f(mine.total)} hasta hoy.`;
  html += `<div class="aporte" style="background:${bad ? '#160C0C' : '#0E0F13'};border-color:${bad ? '#5C1F1F' : '#262830'}">
    <div class="between" style="align-items:center"><p class="lbl" style="color:${col}">Tu aporte real</p><span class="muted">${icon.lock} Solo tú</span></div>
    ${flame ? `<div class="flame-hd" style="background:${lv.bg};border-color:${lv.border}"><span class="fglow" style="background:${sk.level.color};animation-duration:${lv.speed}"></span><div class="fbox"><span class="em" style="left:18px;background:${sk.level.color};animation-delay:.2s"></span><span class="em" style="left:38px;background:${lv.accent};animation-delay:.9s"></span><span class="em" style="left:28px;background:${sk.level.color};animation-delay:1.4s"></span><svg width="${lv.size}" height="${lv.size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block;transform-origin:50% 90%;animation:flick ${lv.speed} ease-in-out infinite"><path d="M12 2c1.2 3.4 6 5.6 6 11.2a6 6 0 0 1-12 0c0-3.4 2.3-4.6 2.3-6.8 1.1 1.1 2.3 2.3 3.4 2.3 0-2.3-1.1-4.5.3-6.7z" fill="${sk.level.color}"/><path d="M12 11c.6 1.6 3 2.8 3 5.4a3 3 0 0 1-6 0c0-1.6 1.1-2.2 1.1-3.3.6.6 1.2 1.1 1.7 1.1 0-1.1-.4-2.1.2-3.2z" fill="#FFF1C2"/></svg></div>
      <div style="position:relative;flex:1;min-width:0"><b class="num" style="font-size:21px;line-height:1.15;color:#fff">${sk.level.name === 'Imparable' ? '¡Proyecto impecable!' : sk.level.name === 'Responsable' ? '¡Gran trabajo!' : sk.level.name === 'Constante' ? '¡Buen ritmo!' : '¡Buen comienzo!'}</b><p style="margin:5px 0 0;font-size:13px;color:${lv.accent}">Racha de <b class="num" style="color:#fff">${sk.pts} pts</b> · <b style="color:${sk.level.color}">${sk.level.name}</b></p><p style="margin:4px 0 0;font-size:11px;color:#A1A1AA">${sk.next ? `A ${sk.next.min - sk.pts} pts de ${sk.next.name}.` : 'Nivel más alto · récord ' + sk.best}</p></div></div>` : ''}
    <div class="row" style="align-items:baseline;gap:8px"><b class="num" style="font-size:36px;line-height:1;color:${col}">${pct}%</b><span class="small" style="color:#C9C9D1">del trabajo del equipo · ${fmtU(myUnits)} de ${fmtU(doneUnits)} tareas hechas</span></div>
    <div style="position:relative;padding-top:18px"><div class="bar" style="height:16px"><i class="fill" style="width:${pct}%;background:${col}"></i></div><div class="exp"><span>Lo esperado 50%</span><i></i></div></div>
    <p class="small" style="margin:0;line-height:1.5;color:${bad ? '#FFC2BA' : '#B9EBD4'}">${msg}</p>
    <div class="grid3" style="gap:6px">${ind.map((x) => `<div class="stat" style="background:${x.bad ? '#2A1212' : '#12221A'};border:1px solid ${x.bad ? '#5C1F1F' : '#1F3A2C'}"><b style="color:${x.bad ? '#FF6B5B' : '#6EE7B7'}">${x.v}</b><span>${x.l}</span></div>`).join('')}</div>
    ${cover.length ? `<p class="lbl" style="margin-top:2px">${bad || lostCount || apoyoGot ? 'Lo que el equipo cubrió por ti' : 'Lo que hiciste por el equipo'}</p>${cover.map((x) => `<div class="row" style="gap:10px;align-items:flex-start"><span style="width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;background:${x.dot}"></span><div><p style="margin:0;font-size:13px;font-weight:600">${x.t}</p><p style="margin:1px 0 0;font-size:11px;color:#8B8B94">${x.d}</p></div></div>`).join('')}` : ''}
    <div class="tips" style="background:${bad ? '#1E1010' : '#0F1A15'};border-color:${bad ? '#4A1C1C' : '#1F3A2C'}"><p class="lbl" style="color:${bad ? '#FF9B8F' : '#6EE7B7'}">${bad ? 'Para el próximo proyecto' : 'Para mantenerlo'}</p>
    ${tips.map(([what, how, goal], i) => `<div class="row" style="gap:10px;align-items:flex-start"><span class="tipn" style="background:${bad ? '#3A1616' : '#12221A'};color:${bad ? '#FF9B8F' : '#6EE7B7'}">${i + 1}</span><div style="flex:1"><p style="margin:0;font-size:13px;font-weight:700;line-height:1.35;color:${bad ? '#FFC2BA' : '#F4F4F5'}">${what}</p><p style="margin:3px 0 0;font-size:12px;line-height:1.45;color:#D4D4D8">${how}</p><span class="goal">Meta: ${goal}</span></div></div>`).join('')}</div>
  </div>`;
  // Medallas del equipo
  const R56 = 2 * Math.PI * 25;
  const B = [
    { name: 'Proyecto completo', ic: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z', n: delivered, d: p.videos_total },
    { name: 'Cliente sin esperas', ic: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z', n: onTimeVideos, d: Math.max(delivered, 1), need: delivered > 0 },
    { name: 'Todos puntuales', ic: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', n: aOk, d: Math.max(aTot, 1), need: aTot > 0 },
    { name: 'Cero entregas tarde', ic: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4', n: tOk, d: Math.max(tTot, 1), need: tTot > 0 }
  ];
  html += `<div style="display:flex;flex-direction:column;gap:10px"><p class="lbl">Medallas del equipo</p><div class="badges">${B.map((b, i) => {
    const pr = b.need === false ? 0 : Math.min(1, b.n / b.d);
    const won = pr >= 1 && (b.need !== false);
    return `<div class="badge" style="animation-delay:${(0.4 + i * 0.12).toFixed(2)}s"><div class="bring"><svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" fill="none" stroke="#22242C" stroke-width="3"/><circle class="rg" cx="28" cy="28" r="25" fill="none" stroke="${won ? '#FFB547' : '#4A4D57'}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(pr * R56).toFixed(1)} ${R56.toFixed(1)}" transform="rotate(-90 28 28)"/></svg><span style="background:${won ? '#1C1A14' : '#15161C'}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${won ? '#FFC978' : '#6B6B75'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${b.ic}"/></svg></span></div><b style="color:${won ? '#F4F4F5' : '#A1A1AA'}">${b.name}</b><span style="color:${won ? '#6EE7B7' : '#8B8B94'}">${won ? 'Ganada' : b.need === false ? 'Por empezar' : `${b.n} de ${b.d}`}</span></div>`;
  }).join('')}</div></div>`;
  // Próximo reto
  const reto = tTot + aTot ? Math.round((tOk + aOk) / (tTot + aTot) * 100) : 0;
  html += `<div class="reto"><div class="between" style="align-items:center"><p class="lbl" style="color:#FFB547">Próximo reto del equipo</p><span class="muted" style="color:#C9C3B5">${esc(p.client)}</span></div>
    <b class="num" style="font-size:17px">Equipo impecable</b>
    <p class="small" style="margin:0;color:#C9C3B5;line-height:1.45">Todas las entregas a tiempo y todos puntuales. Si lo logran, el equipo gana "Todos puntuales" y "Cero entregas tarde".</p>
    <div class="row" style="gap:10px"><div class="bar" style="flex:1;height:10px;background:#2E2A20"><i class="fill" style="width:${reto}%;background:#FFB547"></i></div><b class="num small" style="color:#FFC978">${reto}%</b></div>
    <div class="row" style="gap:8px;align-items:flex-start;padding:10px;border-radius:12px;background:#15130E"><span style="color:#FFC978;font-weight:700">+</span><p class="small" style="margin:0;line-height:1.45;color:#E4D5C3"><b style="color:#FFC978">Tu aporte:</b> ${bad ? 'llega puntual y entrega guiones y montajes a tiempo: con eso el equipo gana las medallas que faltan.' : 'sigue entregando a tiempo y termina la preproducción en la reunión; así el equipo no pierde puntualidad al final.'}</p></div></div>`;
  html += `</section>`;
  if (me.role === 'admin') html += `<a class="btn ${p.status === 'cerrado' ? 'b-ghost' : 'b-amber'}" href="#/cierre">${p.status === 'cerrado' ? 'Ver liquidación' : 'Cierre del proyecto'}</a>${p.status === 'cerrado' ? '' : `<p class="muted" style="margin:-6px 0 0;text-align:center">Se envía cuando estén los ${p.videos_total} videos · ${oName} confirma la liquidación</p>`}`;
  else html += p.status === 'cerrado' || (p.settlement && p.settlement.sent_at) ? `<a class="btn b-blue" href="#/cierre">Ver liquidación</a>` : `<div class="row card" style="flex-direction:row;padding:12px 14px">${icon.check}<p class="small" style="margin:0;line-height:1.45;color:#C9C9D1">Cuando ${esc((st.admin() || {}).name || 'el administrador')} cierre el proyecto, te llegará la liquidación para que la confirmes.</p></div>`;
  html += `</div>`;
  return html;
}
const fmtU = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

function vClose() {
  const p = st.project();
  if (!p) return `<p class="empty">Sin proyecto.</p>`;
  const c = st.ctx(p.id);
  const pay = R.payouts(p, c);
  const ps = st.partners();
  const me = S.me;
  const se = p.settlement || {};
  const vids = c.videos;
  const complete = vids.length === p.videos_total && vids.every((v) => R.videoState(v, c).complete);
  const cols = ps.concat(S.data.members.filter((m) => m.role === 'colaborador' && pay.porMiembro[m.id]));
  const amt = (m, k) => R.money((pay.porMiembro[m.id] || {})[k] || 0);
  const sum = cols.reduce((a, m) => a + ((pay.porMiembro[m.id] || {}).total || 0), 0);
  let html = `<a href="#/resumen" class="row muted" style="text-decoration:none">${icon.back} Resumen</a><h1>Cierre del proyecto</h1><p class="sub">${esc(p.client)} · ${esc(p.name)} · ${R.money(p.budget)}</p>`;
  const step = se.paid_at ? 3 : se.confirmed_at ? 2 : se.sent_at ? 1 : 0;
  if (se.observation && !se.sent_at) html += banner('warn', `${esc(st.member(se.observation.by).name)} hizo una observación`, esc(se.observation.text));
  if (!complete && step === 0) html += banner('wait', 'Todavía no se puede cerrar', `Faltan tareas: ${vids.length}/${p.videos_total} videos repartidos y ${vids.filter((v) => R.videoState(v, c).complete).length} completos. La tabla muestra lo hecho hasta hoy.`);
  html += `<section class="card"><div class="between"><p class="lbl">Liquidación</p><span class="muted">la ven los dos</span></div>
  <table class="liq"><tr><th>Etapa</th>${cols.map((m) => `<th>${first(m)}</th>`).join('')}</tr>
  <tr><td>Preproducción</td>${cols.map((m) => `<td>${amt(m, 'pre')}</td>`).join('')}</tr>
  <tr><td>Rodaje</td>${cols.map((m) => `<td>${amt(m, 'prod')}</td>`).join('')}</tr>
  <tr><td>Posproducción</td>${cols.map((m) => `<td>${amt(m, 'post')}</td>`).join('')}</tr>
  <tr class="tot"><td>Total</td>${cols.map((m) => `<td style="color:${(COLOR[m.role] || ['#fff'])[0]}">${amt(m, 'total')}</td>`).join('')}</tr></table>
  ${Object.entries(pay.guillermo || {}).map(([by, g]) => `<div class="between small" style="padding:8px 10px;border-radius:12px;background:#160F22;border:1px solid #3E2C63"><span style="color:#D9CCF5">Guillermo · contratado por ${esc(st.member(by).name)} · ${g.tasks} tareas</span><b class="num" style="color:#C9B2FF">${R.money(g.amount)} → ${first(st.member(g.to))}</b></div>`).join('')}
  ${Object.entries(pay.excedente || {}).filter(([, x]) => x > 0.004).map(([id, x]) => `<div class="between small" style="padding:8px 10px;border-radius:12px;background:#2A1810;border:1px solid #5A3020"><span style="color:#FFD9CC">Excedente de ${esc(st.member(id).name)} · por definir quién lo paga</span><b class="num" style="color:#FFB09C">${R.money(x)}</b></div>`).join('')}
  <div class="banner ${Math.abs(sum - p.budget) < 0.01 ? 'bn-ok' : 'bn-wait'}"><div><b>${cols.map((m) => amt(m, 'total')).join(' + ')} = ${R.money(sum)}</b><p>${Math.abs(sum - p.budget) < 0.01 ? 'Igual al presupuesto del cliente. No sobra ni falta nada.' : 'Faltan ' + R.money(p.budget - sum) + ' por tareas que aún no se hacen.'}</p></div></div></section>`;
  if (step >= 1 && se.amounts) html += `<p class="muted" style="margin:-4px 0 0">Enviada ${R.fmtWhen(se.sent_at)}${se.confirmed_at ? ' · confirmada ' + R.fmtWhen(se.confirmed_at) : ''}${se.paid_at ? ' · pagada ' + R.fmtWhen(se.paid_at) : ''}</p>`;
  if (me.role === 'admin') {
    if (step === 0) html += `<button class="btn b-amber" data-act="sendSettle" ${complete ? '' : 'disabled'}>Enviar liquidación a ${ps.filter((m) => m.role === 'socio').map(first).join(', ') || 'tu socio'}</button>`;
    if (step === 1) html += banner('wait', 'Esperando confirmación', 'Tu socio recibió la liquidación.');
    if (step === 2) html += `<form data-form="pay" class="card"><p class="lbl">Registrar pago (6.2)</p><p class="sub" style="margin:0">Transfiere a cada uno lo que le corresponde dentro de 3 días y adjunta la constancia.</p><label class="field"><span>Constancia (foto)</span><input class="in" type="file" name="proof" accept="image/*" style="padding-top:10px"></label><button class="btn b-amber">Registrar pago y cerrar</button></form>`;
  } else {
    if (step === 0) html += banner('wait', 'El administrador está preparando el cierre', 'Cuando lo envíe, podrás confirmarlo aquí.');
    if (step === 1) html += `<button class="btn b-blue" data-act="confirmSettle">Confirmo la liquidación</button><button class="btn b-ghost" data-act="observe">Tengo una observación</button>`;
    if (step === 2) html += banner('ok', 'Confirmaste tu liquidación', 'El administrador tiene 3 días para transferirte.');
  }
  if (step === 3) html += `<div style="display:flex;justify-content:center;padding:6px 0"><div class="mono" style="padding:10px 18px;border:3px solid #6EE7B7;border-radius:12px;color:#6EE7B7;font-weight:700;text-align:center;transform:rotate(-4deg)">PROYECTO CERRADO<br><span style="font-size:11px;font-weight:400">confirmado por los dos · pagado</span></div></div>${se.proof ? `<button class="btn b-ghost" data-act="photo" data-p="${esc(se.proof)}">Ver constancia</button>` : ''}`;
  html += `<a class="btn b-ghost" href="#/historial">Ver historial del proyecto</a>`;
  return html;
}

function logText(l) {
  const a = st.member(l.actor);
  const who = l.actor ? esc(a.name) : 'La app';
  const n = (l.data && l.data.new) || {}, o = (l.data && l.data.old) || {};
  const vnum = (vid) => (S.data.videos.find((v) => v.id === vid) || {}).num || '?';
  const T = l.type;
  if (T === 'invite') return { k: 'team', t: `${who} invitó a ${esc(l.data.name)} como ${ROLE[l.data.role]}` };
  if (T === 'join') return { k: 'team', t: `${esc(l.data.name)} entró al equipo` };
  if (T === 'tasks.insert' && n.hire_id) { const hh = S.data.hires.find((x) => x.id === n.hire_id) || {}; return { k: 'task', t: `Guillermo hizo el ${R.KIND_LABEL[n.kind].toLowerCase()} del video ${vnum(n.video_id)}`, s: `contratado por ${esc(st.member(hh.hired_by).name)} · lo registró ${who}` }; }
  if (T === 'hires.insert') { const ev = S.data.events.find((x) => x.id === n.event_id) || {}; return { k: 'plan', t: `${who} contrató a Guillermo para la reunión del ${R.fmtWhen(ev.starts_at)}`, s: 'cobra el 80 % de su preproducción' }; }
  if (T === 'hires.update' && n.status !== o.status) return { k: 'plan', t: `${who} ${{ aceptada: 'aceptó', rechazada: 'rechazó', cancelada: 'canceló' }[n.status] || 'actualizó'} la contratación de Guillermo` };
  if (T === 'tasks.insert') return { k: 'task', t: `${who} marcó ${R.KIND_LABEL[n.kind].toLowerCase()} del video ${vnum(n.video_id)}`, s: n.link ? 'con enlace' : '' };
  if (T === 'tasks.delete') return { k: 'task', t: `${who} desmarcó ${R.KIND_LABEL[o.kind].toLowerCase()} del video ${vnum(o.video_id)}` };
  if (T === 'tasks.update') return { k: 'task', t: `${who} corrigió ${R.KIND_LABEL[n.kind].toLowerCase()} del video ${vnum(n.video_id)}` };
  if (T === 'videos.insert') return { k: 'plan', t: `${who} repartió el video ${n.num} a ${esc(st.member(n.owner).name)}`, s: 'publica ' + R.fmtDay(n.publish_date) };
  if (T === 'videos.update' && n.owner !== o.owner) return { k: 'plan', t: `Video ${n.num}: pasó de ${esc(st.member(o.owner).name)} a ${esc(st.member(n.owner).name)}`, s: 'intercambio registrado por ' + who };
  if (T === 'events.insert') return { k: 'plan', t: `${who} programó ${n.kind === 'rodaje' ? 'un rodaje' : 'una reunión'} · ${R.fmtWhen(n.starts_at)}` };
  if (T === 'events.update' && n.tolerance_min !== o.tolerance_min) return { k: 'plan', t: `${who} cambió la tolerancia a ${n.tolerance_min} min`, s: R.fmtWhen(n.starts_at) };
  if (T === 'events.update') return { k: 'plan', t: `${who} reprogramó videos del rodaje del ${R.fmtWhen(n.starts_at)}` };
  if (T === 'attendance.insert' || T === 'attendance.update') {
    const m = st.member(n.member_id);
    if (n.notice && (!o.notice || o.notice.decision !== n.notice.decision) && n.notice.decision) return { k: 'att', t: `${who} respondió el aviso de ${esc(m.name)}`, s: decisionText(n.notice.decision) };
    if (n.notice && (!o.notice || !o.notice.sent_at)) return { k: 'att', t: `${esc(m.name)} avisó que no irá`, s: n.notice.reason === 'fm' ? 'fuerza mayor · ' + esc(n.notice.fm_kind || '') : '' };
    if (n.arrived_at && !o.arrived_at) return { k: 'att', t: `${esc(m.name)} registró su llegada · ${R.limaTime(n.arrived_at)}`, s: n.photo ? 'con foto' : '', photo: n.photo };
  }
  if (T === 'projects.insert') return { k: 'pay', t: `${who} creó el proyecto ${esc(n.client)} · ${esc(n.name)}`, s: R.money(n.budget) + ' · ' + n.videos_total + ' videos' };
  if (T === 'projects.update') {
    const ns = n.settlement || {}, os = o.settlement || {};
    if (ns.paid_at && !os.paid_at) return { k: 'pay', t: `${who} registró el pago y cerró el proyecto`, photo: ns.proof };
    if (ns.confirmed_at && !os.confirmed_at) return { k: 'pay', t: `${who} confirmó la liquidación` };
    if (ns.sent_at && !os.sent_at) return { k: 'pay', t: `${who} envió la liquidación`, s: Object.entries(ns.amounts || {}).map(([id, v]) => esc(st.member(id).name) + ' ' + R.money(v)).join(' · ') };
    if (ns.observation && !os.observation) return { k: 'pay', t: `${who} hizo una observación a la liquidación`, s: esc(ns.observation.text) };
    return { k: 'pay', t: `${who} actualizó el proyecto` };
  }
  if (T === 'corrections.insert') return { k: 'team', t: `${who} pidió una corrección`, s: esc(n.text) };
  if (T === 'corrections.update') return { k: 'team', t: `${who} ${n.status === 'aprobada' ? 'aprobó' : 'rechazó'} una corrección`, s: esc(n.text) };
  if (T === 'members.update' && n.name !== o.name) return { k: 'team', t: `${esc(o.name)} ahora se llama ${esc(n.name)}`, s: 'cambio hecho por ' + who };
  return null;
}
function logText2(l) {
  const a = st.member(l.actor);
  const who = l.actor ? esc(a.name) : 'La app';
  const n = (l.data && l.data.new) || {}, o = (l.data && l.data.old) || {};
  const T = l.type;
  const evn = (x) => (x.kind === 'rodaje' ? 'el rodaje' : 'la reunión') + ' del ' + R.fmtWhen(x.starts_at);
  if (T === 'settings.look') return { k: 'team', t: `${who} cambió la apariencia de la app`, s: 'colores principal y de urgencia' };
  if (T === 'settings.reminders') return { k: 'team', t: `${who} ajustó los recordatorios automáticos` };
  if (T === 'proposals.insert') return { k: 'team', t: `${who} propuso cambiar ${n.kind === 'pct' ? 'los porcentajes del acuerdo' : 'las reglas de registro'}`, s: propSummary(n) };
  if (T === 'proposals.update' && n.status !== o.status) return { k: 'team', t: `${who} ${{ aprobada: 'aprobó', rechazada: 'rechazó', retirada: 'retiró' }[n.status] || 'actualizó'} la propuesta de ${n.kind === 'pct' ? 'porcentajes' : 'reglas'}`, s: propSummary(n) };
  if (T === 'videos.update' && n.title !== o.title) return { k: 'plan', t: `${who} puso tema al video ${n.num}`, s: esc(n.title || 'sin tema') };
  if (T === 'events.insert' && n.kind === 'rodaje' && n.note === 'Reprogramado') return { k: 'plan', t: `${who} reprogramó el rodaje para el ${R.fmtWhen(n.starts_at)}` };
  if (T === 'events.update' && n.status !== o.status && n.status === 'cancelado') return { k: 'plan', t: `${who} canceló ${evn(n)}`, s: n.cancel_note ? esc(n.cancel_note) : '' };
  if (T === 'events.update' && n.status !== o.status && n.status === 'reprogramado') return { k: 'plan', t: `${evn(n)} quedó reprogramado`.replace(/^e/, 'E'), s: n.cancel_note ? esc(n.cancel_note) : '' };
  if (T === 'events.update' && n.ended_at && !o.ended_at) return { k: 'plan', t: `${who} finalizó ${evn(n)}`, s: 'terminó a las ' + R.limaTime(n.ended_at) };
  if (T === 'events.update' && n.end_requested_at && !o.end_requested_at) return { k: 'plan', t: `${who} pidió finalizar ${evn(n)}`, s: 'a las ' + R.limaTime(n.end_requested_at) };
  if (T === 'events.update' && n.starts_at !== o.starts_at) return { k: 'plan', t: `${who} cambió ${evn(o)}`, s: 'nueva hora: ' + R.fmtWhen(n.starts_at) };
  if (T === 'events.update' && n.rodaje_id !== o.rodaje_id) return null;
  if (T === 'events.update' && (n.video_ids || []).length > (o.video_ids || []).length) return { k: 'plan', t: `${who} asignó videos a ${evn(n)}` };
  if (T === 'events.delete') return { k: 'plan', t: `${who} borró ${evn(o)}`, s: 'estaba vacío' };
  if (T === 'projects.update' && n.status !== o.status && (n.status === 'archivado' || o.status === 'archivado')) return { k: 'pay', t: `${who} ${n.status === 'archivado' ? 'archivó' : 'reabrió'} el proyecto ${esc(n.client)} · ${esc(n.name)}` };
  if (T === 'projects.delete') return { k: 'pay', t: `${who} borró el proyecto ${esc(o.client)} · ${esc(o.name)}`, s: 'estaba vacío' };
  // 1.4 · entregas al límite y deshacer
  if (T === 'tasks.update' && n.void && !o.void) return { k: 'task', t: `El ${R.KIND_LABEL[n.kind].toLowerCase()} de ${esc(st.member(n.done_by).name)} del video ${(S.data.videos.find((v) => v.id === n.video_id) || {}).num || '?'} ya no cuenta`, s: 'el video pasó al administrador' };
  if (T === 'tasks.update' && n.review !== o.review) {
    const vn = (S.data.videos.find((v) => v.id === n.video_id) || {}).num || '?';
    if (n.review === 'aprobada') return { k: 'task', t: `${who} aprobó la entrega del video ${vn}` };
    if (n.review === 'cambios') return { k: 'task', t: `${who} pidió cambios al video ${vn}`, s: esc(n.review_note || '') };
    if (n.review === 'rechazada') return { k: 'task', t: `${who} rechazó la entrega del video ${vn}`, s: 'el video pasó al administrador' };
    if (n.review === 'pendiente' && o.review === 'cambios') return { k: 'task', t: `${who} entregó la corrección del video ${vn}` };
    if (n.review === 'pendiente') return { k: 'task', t: `${who} deshizo su decisión sobre el video ${vn}` };
    if (n.review === 'cambios' && o.review === 'pendiente') return { k: 'task', t: `${who} deshizo la entrega de la corrección del video ${vn}` };
  }
  if (T === 'tasks.insert' && n.review === 'pendiente') return { k: 'task', t: `${who} entregó el video ${(S.data.videos.find((v) => v.id === n.video_id) || {}).num || '?'} por su cuenta`, s: 'por revisar' };
  // 1.4 · entrega reprogramada, integrantes y colaborador externo
  if (T === 'videos.update' && (n.reprog || []).length > (o.reprog || []).length) { const r = n.reprog[n.reprog.length - 1]; return { k: 'plan', t: `${who} reprogramó la entrega del video ${n.num}`, s: R.fmtDay(r.from) + ' → ' + R.fmtDay(r.to) + (r.late ? ' · ya estaba vencida' : '') + (r.note ? ' · ' + esc(r.note) : '') }; }
  if (T === 'settings.guillermo') return { k: 'team', t: `${who} cambió el WhatsApp de Guillermo` };
  if (T === 'members.update' && n.phone !== o.phone) return { k: 'team', t: `${who} ${n.phone ? 'actualizó' : 'quitó'} el WhatsApp de ${esc(n.name)}` };
  if (T === 'members.update' && n.active === false && o.active !== false) return { k: 'team', t: `${who} canceló la invitación de ${esc(n.name)}` };
  if (T === 'members.update' && n.invite_code !== o.invite_code) return { k: 'team', t: `${who} generó un enlace nuevo para ${esc(n.name)}` };
  if (T === 'jobs.insert') return { k: 'team', t: `${who} propuso contratar a ${esc(st.member(n.member_id).name)} como editor`, s: `${n.video_ids.length} ${n.video_ids.length === 1 ? 'video' : 'videos'} · ${R.money(n.price)} c/u` };
  if (T === 'jobs.update' && n.status !== o.status) {
    const E = esc(st.member(n.member_id).name);
    const t = { invitado: `${who} aprobó contratar a ${E}`, rechazado: `${who} rechazó contratar a ${E}`, cancelado: `${who} canceló el encargo de ${E}`, activo: `${E} aceptó el encargo`, finalizado: `${E} marcó el servicio como finalizado`, cerrado: `${who} confirmó el servicio de ${E} y registró su pago` }[n.status];
    if (t) return { k: n.status === 'cerrado' ? 'pay' : 'team', t };
  }
  if (T === 'job_items.update' && n.stage !== o.stage) {
    const vn = (S.data.videos.find((v) => v.id === n.video_id) || {}).num || '?';
    const ORD = ['montaje', 'rev1', 'aj1', 'final', 'rev2', 'aj2', 'upload', 'done'];
    if (ORD.indexOf(n.stage) < ORD.indexOf(o.stage)) return { k: 'task', t: `${who} deshizo un paso del video ${vn} (editor)` };
    const t = { rev1: `${who} entregó el montaje del video ${vn}`, aj1: `${who} envió observaciones del montaje del video ${vn}`, final: `${who} aprobó el montaje del video ${vn}`, rev2: `${who} entregó el video final ${vn}`, aj2: `${who} envió observaciones finales del video ${vn}`, upload: `${who} aprobó el video ${vn}`, done: `${who} subió el video ${vn} a Drive` }[n.stage];
    if (t) return { k: 'task', t, s: n.stage === 'aj1' ? (n.obs1 || []).map((x) => esc(x.t)).join(' · ') : n.stage === 'aj2' ? (n.obs2 || []).map((x) => esc(x.t)).join(' · ') : '' };
  }
  if (T === 'videos.update' && n.apoyo_due !== o.apoyo_due) return { k: 'plan', t: `${who} adelantó el montaje del video ${n.num}`, s: n.apoyo_due ? 'con apoyo hasta ' + R.fmtWhen(n.apoyo_due) : '' };
  if (T === 'videos.update' && n.publish_date !== o.publish_date) return { k: 'plan', t: `${who} cambió la publicación del video ${n.num}`, s: R.fmtDay(o.publish_date) + ' → ' + R.fmtDay(n.publish_date) };
  if (T === 'events.update' && o.ended_at && !n.ended_at) return { k: 'plan', t: `${who} deshizo el fin de ${evn(n)}` };
  if (T === 'events.update' && o.status === 'cancelado' && n.status === 'activo') return { k: 'plan', t: `${who} deshizo la cancelación de ${evn(n)}` };
  if (T === 'claims.insert' && n.kind === 'montaje') return { k: 'task', t: `${who} tomó el video ${(S.data.videos.find((v) => v.id === n.video_id) || {}).num || '?'}`, s: 'no llegó entregado a las 08:00' };
  if (T === 'attendance.insert' || T === 'attendance.update') {
    const m = st.member(n.member_id);
    if (o.arrived_at && !n.arrived_at) return { k: 'att', t: `${who} deshizo ${n.member_id === l.actor ? 'su llegada' : 'la confirmación de la llegada de ' + esc(m.name)}` };
    if (o.claimed_at && !n.claimed_at) return { k: 'att', t: `${esc(m.name)} deshizo su llegada` };
    if (o.notice && o.notice.decision && n.notice && !n.notice.decision) return { k: 'att', t: `${who} deshizo su respuesta al aviso de ${esc(m.name)}` };
    if (n.arrived_at && !o.arrived_at && n.confirmed_by) return { k: 'att', t: `${who} confirmó la llegada de ${esc(m.name)} · ${R.limaTime(n.arrived_at)}`, s: n.claimed_at ? 'la marcó a las ' + R.limaTime(n.claimed_at) : '' };
    if (n.claimed_at && !o.claimed_at && !n.arrived_at) return { k: 'att', t: `${esc(m.name)} marcó su llegada · ${R.limaTime(n.claimed_at)}`, s: 'espera confirmación del administrador' };
  }
  return logText(l);
}

function vHistory() {
  const F = [['all', 'Todo'], ['task', 'Tareas'], ['att', 'Asistencia'], ['plan', 'Reparto'], ['pay', 'Pagos'], ['team', 'Equipo']];
  const rows = S.data.log.slice().reverse().map((l) => Object.assign({ l }, logText2(l) || {})).filter((x) => x.t && (ui.histF === 'all' || x.k === ui.histF));
  const pendC = S.data.corrections.filter((x) => x.status === 'pendiente');
  let html = `<div><h1>Historial</h1><p class="sub">Todo queda registrado con fecha y hora. Nadie puede borrarlo ni editarlo. Si algo está mal, se pide una corrección; lo vacío (una reunión o un proyecto sin datos) sí se puede borrar, y queda anotado aquí.</p></div>`;
  if (pendC.length) html += `<section class="card" style="border-color:#4A3414;background:#1C130A"><p class="lbl" style="color:#FFC978">Correcciones pendientes</p>${pendC.map((c) => `<div><b class="small">${esc(st.member(c.requested_by).name)}:</b> <span class="small">${esc(c.text)}</span>${c.requested_by !== S.me.id ? `<div class="grid2" style="margin-top:8px"><button class="btn sm b-amber" data-act="corr" data-id="${c.id}" data-s="aprobada">Aprobar</button><button class="btn sm b-ghost" data-act="corr" data-id="${c.id}" data-s="rechazada">Rechazar</button></div>` : '<p class="muted" style="margin:4px 0 0">Esperando respuesta</p>'}</div>`).join('')}${st.isAdmin() ? '<p class="muted" style="margin:0">Al aprobar, el administrador aplica el cambio (por ejemplo, desmarcar y volver a marcar la tarea). El original queda en el historial.</p>' : ''}</section>`;
  html += `<div class="row" style="flex-wrap:wrap;gap:6px">${F.map(([k, t]) => `<button class="btn sm ${ui.histF === k ? 'b-amber' : 'b-ghost'}" data-act="histF" data-k="${k}">${t}</button>`).join('')}</div>`;
  let lastDay = '';
  html += `<section class="card" style="padding:6px 16px"><div class="list">${rows.map((x) => {
    const day = R.limaDate(x.l.at);
    const head = day !== lastDay ? `<p class="lbl" style="padding:12px 0 2px">${R.fmtDay(day)}</p>` : '';
    lastDay = day;
    const a = st.member(x.l.actor);
    return head + `<div class="li" style="align-items:flex-start">${x.l.actor ? av(a, 28) : '<span class="av" style="width:28px;height:28px;background:#22242C;color:#C9C9D1;font-size:9px">App</span>'}<span class="t"><b style="font-weight:600">${x.t}</b><span>${R.limaTime(x.l.at)}${x.s ? ' · ' + x.s : ''}</span>${x.photo ? `<button class="btn sm b-ghost" data-act="photo" data-p="${esc(x.photo)}" style="margin-top:6px">Ver foto</button>` : ''}</span><button class="btn sm b-ghost" data-act="askCorr" data-id="${x.l.id}" style="min-height:30px;padding:0 8px;font-size:11px">Corregir</button></div>`;
  }).join('') || '<p class="empty">Sin registros.</p>'}</div></section>`;
  return html;
}

// ---------- Equipo ----------
function vTeam() {
  const me = S.me;
  const ms = S.data.members.filter((m) => m.active);
  const base = location.origin + location.pathname;
  let html = `${backTo('#/', 'Inicio')}<h1>Equipo</h1><p class="sub">${esc((S.teams.find((t) => t.team_id === S.teamId) || {}).team || '')} · entraste como ${esc(S.session.user.email)}</p>`;
  // 1.4: los integrantes se gestionan en Administrador → Integrantes (Opción C). Aquí, solo tu ficha.
  if (me.role === 'admin') html += `<a class="ait" href="#/admin/integrantes" style="border:1px solid var(--line);border-radius:18px;background:var(--card)"><span class="tic tint-blue">${icon.users}</span><span class="ttx"><b>Integrantes e invitaciones</b><span>${ms.filter((m) => m.role !== 'colaborador').map((m) => esc(m.name.split(' ')[0])).join(' · ')}${ms.some((m) => m.role === 'colaborador') ? ' · ' + ms.filter((m) => m.role === 'colaborador').length + ' colaborador(es)' : ''}</span></span>${icon.chev}</a>`;
  else html += `<p class="lbl alb">Tu ficha</p>${memberCard(me, { canEdit: true })}<button class="hb x-amber" data-act="memSave">Guardar</button>
    <section class="card" style="padding:12px 16px"><p class="lbl">Equipo</p><div class="list">${ms.filter((m) => m.id !== me.id && m.user_id).map((m) => `<div class="li">${av(m)}<span class="t"><b>${esc(m.name)}</b><span>${ROLE[m.role]}${m.phone ? ' · +51 ' + fmtPhone(m.phone) : ''}</span></span>${m.phone ? `<a class="btn sm b-ghost" href="${st.waLink(m, 'Hola')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div>`).join('')}</div></section>`;
  const isEmpty = (p) => !S.data.videos.some((v) => v.project_id === p.id) && !S.data.events.some((e) => e.project_id === p.id);
  const prow = (p) => `<div class="li"><button data-act="openProject" data-id="${p.id}" class="t" style="background:none;border:none;text-align:left;color:inherit;cursor:pointer;padding:0;font:inherit"><b>${esc(p.client)} · ${esc(p.name)}</b><span>${R.money(p.budget)} · ${p.videos_total} videos · desde ${R.fmtDay(p.start_date)}</span></button>
    ${me.role === 'admin' ? (isEmpty(p) ? `<button class="btn sm b-red" data-act="delProject" data-id="${p.id}">Borrar</button>` : p.status === 'abierto' ? `<button class="btn sm b-ghost" data-act="archProject" data-id="${p.id}" data-on="1">Archivar</button>` : p.status === 'archivado' ? `<button class="btn sm b-ghost" data-act="archProject" data-id="${p.id}">Reabrir</button>` : '') : ''}
    <span class="chip ${p.status === 'abierto' ? 'c-ok' : 'c-mute'}">${p.status === 'cerrado' ? 'Cerrado' : p.status === 'archivado' ? 'Archivado' : p.id === S.projectId ? 'Actual' : 'Abierto'}</span></div>`;
  const live = S.data.projects.filter((p) => p.status !== 'archivado').slice().reverse();
  const arch = S.data.projects.filter((p) => p.status === 'archivado').slice().reverse();
  html += `<section class="card" style="padding:12px 16px"><div class="between"><p class="lbl">Proyectos</p>${isAdminBtn('<a class="btn sm b-amber" href="#/proyecto/nuevo">Nuevo</a>')}</div><div class="list">${live.map(prow).join('') || '<p class="empty">Sin proyectos.</p>'}</div>
  ${arch.length ? `<p class="lbl" style="margin-top:6px">Archivados</p><div class="list" style="opacity:.75">${arch.map(prow).join('')}</div>` : ''}
  ${me.role === 'admin' ? '<p class="muted" style="margin:0">Un proyecto vacío se puede borrar. Uno con registros se archiva: deja de aparecer en el selector y su historial se conserva.</p>' : ''}</section>`;
  if (S.teams.length > 1) html += `<section class="card"><p class="lbl">Tus equipos</p>${S.teams.map((t) => `<button class="btn ${t.team_id === S.teamId ? 'b-amber' : 'b-ghost'}" data-act="team" data-id="${t.team_id}">${esc(t.team)}</button>`).join('')}</section>`;
  if (st.canPractice()) html += `<section class="card"><p class="lbl">Modo práctica</p><p class="sub" style="margin:0">Prueba la app con un proyecto de ejemplo sin tocar los datos reales: nada llega a la base ni al historial. Puedes cambiar entre las dos vistas (administrador y socio).</p>${st.practice() ? '<button class="btn b-amber" data-act="practiceOff">Salir del modo práctica</button>' : '<button class="btn b-ghost" data-act="practiceOn">Entrar al modo práctica</button>'}</section>`;
  html += `<section class="card"><p class="lbl">Instalar en el celular</p><p class="sub" style="margin:0"><b>iPhone:</b> en Safari, botón Compartir → "Agregar a pantalla de inicio". <b>Android:</b> en Chrome, menú ⋮ → "Instalar app".</p></section>`;
  html += `<button class="btn b-ghost" data-act="signOut">Cerrar sesión</button>`;
  html += `<p class="muted" style="text-align:center;margin:4px 0 0">Registro audiovisual · versión ${VERSION}</p>`;
  return html;
}

// WhatsApp de cada integrante (+51 · 9 dígitos que empiezan con 9). Se usa para el botón "Escribir por WhatsApp".
function waField(m, canEdit) {
  const val = (ui.phone || {})[m.id] != null ? ui.phone[m.id] : (m.phone || '');
  const digits = String(val).replace(/\D/g, '');
  const ok = st.PHONE_RE.test(digits);
  const shown = digits.replace(/(\d{3})(\d{0,3})(\d{0,3}).*/, (x, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  if (!canEdit) return m.phone ? `<p class="muted" style="margin:-4px 0 8px 46px">WhatsApp +51 ${esc(shown)}</p>` : '';
  return `<form data-form="phone" class="row" style="gap:8px;margin:-2px 0 10px 46px"><input type="hidden" name="m" value="${m.id}">
    <span class="in" style="flex:1;display:flex;align-items:center;gap:6px;min-height:44px;border-color:${digits && !ok ? 'var(--u0)' : ok ? 'var(--g-bd)' : 'var(--line2)'}"><b class="muted" style="font-size:14px">+51</b><input name="p" inputmode="numeric" maxlength="11" value="${esc(shown)}" placeholder="9XX XXX XXX" aria-label="WhatsApp de ${esc(m.name)}" style="flex:1;min-width:0;background:transparent;border:none;color:var(--tx);outline:none;font-size:15px">${ok ? `<span style="color:var(--mint)">${icon.tick}</span>` : ''}</span>
    <button class="btn sm x-green" style="min-height:44px">Guardar</button>${m.phone ? `<a class="btn sm b-ghost" style="min-height:44px" href="${st.waLink(m, 'Hola')}" target="_blank" rel="noopener">Probar</a>` : ''}</form>`;
}
// ==================================================================
// 1.4 · Integrantes (Opción C)
// ==================================================================
const fmtPhone = (d) => String(d || '').replace(/\D/g, '').slice(0, 9).replace(/^(\d{3})(\d{0,3})(\d{0,3}).*/, (x, a, b, c) => [a, b, c].filter(Boolean).join(' '));
const inviteLink = (m) => location.origin + location.pathname + '#/i/' + m.invite_code;
function memberCard(m, o = {}) {
  const me = S.me;
  const canEdit = o.canEdit != null ? o.canEdit : (me.role === 'admin' || m.id === me.id);
  const ch = (ui.memCh || {})[m.id] || {};
  const name = ch.name != null ? ch.name : m.name;
  const ph = String(ch.phone != null ? ch.phone : (m.phone || '')).replace(/\D/g, '');
  const ok = st.PHONE_RE.test(ph);
  const bad = ph.length > 0 && !ok;
  const col = o.color || COLOR[m.role] || ['#22242C', '#C9C9D1'];
  const roleCh = { admin: ['Administrador', '#2A2416', '#FFC978'], socio: ['Socio', '#18233A', '#A9C7FF'], colaborador: ['Colaborador', '#21163A', '#D6C2FF'] }[m.role] || ['', '#22242C', '#C9C9D1'];
  const pending = !m.user_id && m.invite_code && !o.static;
  const expired = pending && m.invite_expires && new Date(m.invite_expires) < new Date();
  const editing = (ui.memEdit || {})[m.id];
  const sub = o.sub != null ? o.sub : pending ? (expired ? 'La invitación venció' : 'Invitación pendiente · vence ' + R.fmtDay(R.limaDate(m.invite_expires))) : m.role === 'socio' ? (m.apoyo ? 'Recibe apoyo en el video final' : 'Socio') : m.role === 'admin' ? 'Administra el equipo' : 'Colaborador';
  const msg = m.role === 'colaborador' ? `Hola ${m.name.split(' ')[0]}, te invito a trabajar con nosotros en la app de registro. Entra aquí para ver las condiciones del encargo: ${pending ? inviteLink(m) : ''}` : `Hola, te invito como Socio a nuestro equipo en la app de registro. Ahí marcamos nuestras tareas y vemos cuánto le toca a cada uno: ${pending ? inviteLink(m) : ''}`;
  return `<section class="mcard">
    <div class="row" style="gap:12px">
      <span class="av" style="width:46px;height:46px;background:${col[0]};color:${col[1]};font-size:17px">${esc(String(name || '?').charAt(0).toUpperCase())}</span>
      <div style="flex:1;min-width:0">${editing && canEdit && !o.static ? `<input class="in" data-mf="name" data-id="${m.id}" value="${esc(name)}" aria-label="Nombre de ${esc(m.name)}" style="min-height:40px">` : `<b class="num" style="display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(name)}${m.id === me.id ? ' (tú)' : ''}</b>`}
        <span class="muted" style="display:block;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${expired ? 'color:var(--u0)' : ''}">${esc(sub)}</span></div>
      <span class="rolechip" style="background:${roleCh[1]};color:${roleCh[2]}">${roleCh[0]}</span>
      ${canEdit && !o.static ? `<button class="ibtn" data-act="memEdit" data-id="${m.id}" aria-label="Editar nombre">${icon.pen('currentColor', 15)}</button>` : ''}
    </div>
    ${pending ? `<div class="row" style="gap:8px;flex-wrap:wrap">${expired ? `<button class="btn sm x-amber" data-act="memRenew" data-id="${m.id}">Enlace nuevo</button>` : `<a class="btn sm x-green" href="https://wa.me/${ph && ok ? '51' + ph : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${waIc}Enviar por WhatsApp</a><button class="btn sm b-ghost" data-act="copy" data-t="${esc(inviteLink(m))}">Copiar enlace</button>`}<button class="btn sm b-ghost" data-act="memCancel" data-id="${m.id}" style="color:var(--r-fg2)">Cancelar</button></div>` : ''}
    ${canEdit || ph ? `<div class="wafield"><span class="small" style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--tx2)">${waIc.replace('stroke="currentColor"', 'stroke="#6EE7B7"')}WhatsApp</span>
      <div class="row" style="gap:8px"><span class="pfx">+51</span>${canEdit ? `<input class="in" type="tel" inputmode="numeric" maxlength="11" data-mf="phone" data-id="${m.id}" value="${esc(fmtPhone(ph))}" placeholder="9XX XXX XXX" aria-label="WhatsApp de ${esc(m.name)}" style="flex:1;min-width:0;${bad ? 'border-color:var(--u0)' : ''}">` : `<span class="in" style="flex:1;display:flex;align-items:center">${esc(fmtPhone(ph))}</span>`}<span class="okdot"${ok ? '' : ' hidden'}>${icon.tick}</span></div>
      <span class="small wabad" style="color:#FFC978;font-weight:600"${bad ? '' : ' hidden'}>Debe tener 9 dígitos y empezar con 9</span>
      <a class="linkbtn watry" href="https://wa.me/51${ph}?text=${encodeURIComponent('Hola')}" target="_blank" rel="noopener" style="color:#A7F3D0;text-decoration:none;align-self:flex-start"${ok ? '' : ' hidden'}>Probar chat ↗</a></div>` : ''}
    ${o.extra || ''}</section>`;
}
function vIntegrantes() {
  if (!st.isAdmin()) return adminOnly('');
  const ms = S.data.members.filter((m) => m.active);
  const socios = ms.filter((m) => m.role === 'admin' || m.role === 'socio').sort((a, b) => (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1));
  const cols = ms.filter((m) => m.role === 'colaborador');
  const gph = (ui.gPhone != null ? ui.gPhone : ((st.settings().guillermo || {}).phone || ''));
  const jobsOf = (m) => (S.data.jobs || []).filter((j) => j.member_id === m.id && ['propuesto'].concat(R.JOB_LIVE).indexOf(j.status) !== -1);
  let html = `<div class="between" style="align-items:center">${backTo('#/admin', 'Administrador')}<span class="pill-amber">${icon.shield}Solo tú</span></div>
    <div><h1 style="font-size:28px">Integrantes</h1><p class="sub">${esc((S.teams.find((t) => t.team_id === S.teamId) || {}).team || '')}</p></div>`;
  html += `<p class="lbl alb">Socios</p>` + socios.map((m) => memberCard(m)).join('');
  html += `<p class="lbl alb">Colaboradores</p>` + cols.map((m) => {
    const js = jobsOf(m);
    const sub = js.length ? js.map((j) => `Edición · ${j.video_ids.length} ${j.video_ids.length === 1 ? 'video' : 'videos'} · ${{ propuesto: 'por aprobar', invitado: 'invitado', activo: 'trabajando', finalizado: 'por confirmar', cerrado: 'cerrado' }[j.status]}`).join(' · ') : null;
    return memberCard(m, { sub: !m.user_id && m.invite_code ? null : sub || 'Sin encargo activo', extra: js.length ? `<div class="row" style="gap:8px;flex-wrap:wrap">${js.map((j) => `<a class="btn sm b-ghost" href="#/encargo/${j.id}">Ver encargo · ${j.video_ids.length} ${j.video_ids.length === 1 ? 'video' : 'videos'}</a>`).join('')}</div>` : `<button class="btn sm b-ghost" data-act="jobNewFor" data-id="${m.id}">Armar un encargo</button>` });
  }).join('');
  html += memberCard({ id: 'G', name: 'Guillermo', role: 'colaborador', phone: String(gph).replace(/\D/g, ''), user_id: 'x', active: true }, { static: true, canEdit: true, sub: 'Preproducción · 80 % cuando lo envían', color: ['#C9B2FF', '#160F22'] })
    .replace('data-mf="phone" data-id="G"', 'data-mf="gphone" data-id="G"');
  html += `<button class="dashbtn" data-act="memInvite">${icon.plus}Invitar integrante</button>
    <button class="hb x-amber" data-act="memSave">Guardar</button>
    <p class="muted" style="margin:-6px 4px 0;text-align:center">El número solo se usa para el botón de WhatsApp.</p>`;
  return html;
}
function sheetInvite() {
  const d = ui.inv || { role: 'socio', apoyo: true, name: '', phone: '' };
  const isC = d.role === 'colaborador';
  const roles = [['socio', 'Socio', 'Todas las etapas, reparto 2 y 2, aprueba cambios'], ['colaborador', 'Colaborador', 'Un servicio puntual, solo sus videos']];
  return `<h2>Invita a alguien</h2><p class="sub" style="margin:0">Le llega un enlace por WhatsApp.</p>
    <label class="field"><span>Nombre</span><input class="in" data-inv="name" value="${esc(d.name)}" placeholder="${isC ? 'Nombre del editor' : 'Nombre de tu socio'}"></label>
    <label class="field"><span>WhatsApp</span><span class="row" style="gap:8px"><span class="pfx">+51</span><input class="in" type="tel" inputmode="numeric" maxlength="11" data-inv="phone" value="${esc(fmtPhone(d.phone))}" placeholder="9XX XXX XXX" style="flex:1;min-width:0"></span></label>
    <div class="field"><span>Rol</span><div class="row" style="gap:8px">${roles.map(([k, t, s]) => `<button class="rolebtn${d.role === k ? ' on' : ''}" data-act="invRole" data-k="${k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div></div>
    ${isC ? `<div class="pmsg pm-blue"><span class="pdot"></span><p>Luego armas su encargo: videos, monto por video y quién cubre el excedente. ${otherPartner() ? first(otherPartner()) + ' lo aprueba' : 'Queda listo'} y le llega la invitación.</p></div>
      <button class="hb x-amber" data-act="invGo">Armar el encargo${arrow}</button>`
      : `<label class="row small" style="gap:10px"><input type="checkbox" data-inv="apoyo" ${d.apoyo ? 'checked' : ''} style="width:22px;height:22px"> Recibe apoyo en el video final (entregas al límite)</label>
      <button class="hb x-amber" data-act="invGo">Crear invitación</button>`}
    <button class="btn b-ghost" data-act="close">Cancelar</button>`;
}

// ==================================================================
// 1.4 · Entrega vencida: reprogramar (solo el administrador, cualquier video sin entregar)
// ==================================================================
function sheetReprog(v) {
  const c = st.ctx(v.project_id);
  const s = R.videoState(v, c, new Date());
  const tomorrow = R.addDays(R.limaDate(new Date()), 1);
  const def = v.publish_date >= tomorrow ? R.addDays(v.publish_date, 1) : R.addDays(tomorrow, 1);
  const lateMine = s.overdue && s.inCharge === S.me.id;
  return `<form data-form="reprog" style="display:contents"><input type="hidden" name="v" value="${v.id}">
    <h2>Reprogramar entrega · video ${v.num}</h2>
    <p class="sub" style="margin:0">Hoy publica ${R.fmtDay(v.publish_date)}. Elige la fecha que acordaste con el cliente: los plazos de montaje y video final se mueven con ella.</p>
    <label class="field"><span>Nueva fecha de publicación</span><input class="in" type="date" name="d" min="${tomorrow}" value="${def}" required></label>
    <label class="field"><span>Nota (opcional)</span><input class="in" name="note" maxlength="140" placeholder="Ej.: lo acordé con el cliente por WhatsApp"></label>
    ${lateMine ? pmsg('red', 'La entrega ya venció y estaba en tus manos: resta 3 puntos de racha.') : s.overdue ? pmsg('amber', 'La entrega ya venció.') : ''}
    <button class="hb x-amber">Reprogramar entrega</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`;
}
const reprogLines = (v) => (v.reprog || []).map((r) => `<div class="li"><span class="t"><b>Entrega reprogramada: ${R.fmtDay(r.from)} → ${R.fmtDay(r.to)}</b><span>${esc(first(st.member(r.by)))} · ${R.fmtWhen(r.at)}${r.late ? ' · ya estaba vencida' : ''}${r.note ? ' · ' + esc(r.note) : ''}</span></span></div>`).join('');

// ==================================================================
// 1.4 · Colaborador externo: encargo (socios) y "Mis videos" (colaborador)
// ==================================================================
const JOB_CH = {
  montaje: ['Montaje', 'Esperando montaje', '#FFC978', '#2E2010'], rev1: ['En revisión', 'Revisar montaje', '#A9C7FF', '#18233A'],
  aj1: ['Ajustes', 'Haciendo ajustes', '#FFC978', '#2E2010'], final: ['Video final', 'Esperando final', '#FFC978', '#2E2010'],
  rev2: ['Revisión final', 'Revisión final', '#A9C7FF', '#18233A'], aj2: ['Últimos ajustes', 'Últimos ajustes', '#FFC978', '#2E2010'],
  upload: ['Subir a Drive', 'Subiendo a Drive', '#6EE7B7', '#12221A'], done: ['Listo', 'Listo', '#6EE7B7', '#12221A']
};
const jobCap = (p) => { const r = R.rates(p); return r.montaje + r.acabado; };
const jobDues = (v) => ({ m: R.at(R.addDays(v.publish_date, -3), '21:00'), f: R.at(R.addDays(v.publish_date, -1), '18:00') });
function jobMoney(j, p) {
  const n = j.video_ids.length, cap = jobCap(p), price = Number(j.price) || 0;
  return { n, cap, price, total: price * n, covered: Math.min(price, cap) * n, gap: Math.max(0, price - cap) * n };
}
const payerName = (j, vids) => {
  if (j.payer === 'half') return 'A medias';
  if (j.payer === 'tbd') return 'Por definir';
  const owners = Array.from(new Set(vids.map((v) => v.owner)));
  return owners.map((id) => first(st.member(id))).join(' y ') + ' (dueño de los videos)';
};
function vJobNew(params) {
  if (!st.isAdmin()) return adminOnly('');
  const p = st.project();
  if (!p) return `${backTo('#/admin/integrantes', 'Integrantes')}<div class="card"><p class="empty">Primero crea un proyecto.</p></div>`;
  const c = st.ctx(p.id);
  const now = new Date();
  const d = ui.job || (ui.job = { member_id: params.m || '', name: (ui.inv || {}).name || '', phone: (ui.inv || {}).phone || '', video_ids: [], price: jobCap(p), payer: 'owner', drive_url: '' });
  const cols = S.data.members.filter((m) => m.role === 'colaborador' && m.active);
  const busy = new Set((S.data.jobs || []).filter((j) => ['propuesto'].concat(R.JOB_LIVE).indexOf(j.status) !== -1).flatMap((j) => j.video_ids));
  const eligible = c.videos.filter((v) => { const s = R.videoState(v, c, now); return !s.mo && !s.ac && !busy.has(v.id); }).sort((a, b) => a.num - b.num);
  const sel = eligible.filter((v) => d.video_ids.indexOf(v.id) !== -1);
  const m = jobMoney({ video_ids: sel.map((v) => v.id), price: d.price }, p);
  const soc = otherPartner();
  const who = d.member_id ? st.member(d.member_id) : { name: d.name || 'el editor' };
  const owners = Array.from(new Set(sel.map((v) => v.owner)));
  const ownerTxt = owners.length ? owners.map((id) => first(st.member(id))).join(' y ') : 'Dueño de los videos';
  const payerTxt = d.payer === 'half' ? `Cada uno pone ${R.money(m.gap / 2)}.` : d.payer === 'tbd' ? `Queda anotado: faltan ${R.money(m.gap)} y lo definen conversando.` : `${ownerTxt} pone ${R.money(m.gap)}.`;
  const msg = `Hola ${esc(String(who.name).split(' ')[0])}, te invito a editar ${m.n || '…'} ${m.n === 1 ? 'video' : 'videos'} de ${esc(p.client)} por ${R.money(m.price)} cada uno (${R.money(m.total)} en total). Entra aquí para ver las condiciones del encargo.`;
  let html = `${backTo('#/admin/integrantes', 'Integrantes')}<div class="row" style="gap:12px"><span class="av" style="width:40px;height:40px;background:#FFB547;color:#1A1203">${esc(ini(S.me.name)).charAt(0)}</span><div style="flex:1"><h1 style="font-size:24px;margin:0">Contratar editor</h1><p class="sub" style="margin:2px 0 0">${esc(p.client)} · ${esc(p.name)}</p></div></div>`;
  html += `<section class="card"><p class="lbl" style="margin:0">Editor</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">${cols.map((x) => `<button class="chipbtn${d.member_id === x.id ? ' on' : ''}" data-act="jobWho" data-id="${x.id}">${esc(x.name)}</button>`).join('')}<button class="chipbtn${!d.member_id ? ' on' : ''}" data-act="jobWho" data-id="">${icon.plus}Nuevo</button></div>
    ${!d.member_id ? `<label class="field"><span>Nombre</span><input class="in" data-job="name" value="${esc(d.name)}" placeholder="Nombre del editor"></label>
      <label class="field"><span>WhatsApp</span><span class="row" style="gap:8px"><span class="pfx">+51</span><input class="in" type="tel" inputmode="numeric" maxlength="11" data-job="phone" value="${esc(fmtPhone(d.phone))}" placeholder="9XX XXX XXX" style="flex:1;min-width:0"></span></label>` : ''}</section>`;
  html += `<section class="card"><p class="lbl" style="margin:0">El encargo</p>
    <div class="krow"><span>Servicio</span><b>Edición completa (montaje y final)</b></div>
    <div class="krow"><span>Revisiones</span><b>1 de montaje + 1 final</b></div>
    <p class="lbl" style="margin:4px 0 0">Videos</p>
    ${eligible.length ? `<div class="vpick">${eligible.map((v) => { const on = d.video_ids.indexOf(v.id) !== -1; const o = st.member(v.owner); const col = COLOR[o.role] || ['#22242C', '#C9C9D1']; return `<button class="vpk${on ? ' on' : ''}" data-act="jobVid" data-id="${v.id}" aria-pressed="${on}"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span class="vins" style="background:${col[0]};color:${col[1]}">${esc(ini(o.name)).charAt(0)}</span><small>${R.fmtDay(v.publish_date)}</small></button>`; }).join('')}</div>` : '<p class="empty" style="margin:0">No hay videos sin montaje para encargar.</p>'}
    <div class="pricebox"><span>Monto acordado por video</span><div class="row" style="gap:8px"><button class="sb" data-act="jobPrice" data-d="-5" aria-label="Bajar monto" ${d.price <= 5 ? 'disabled' : ''}>−</button><b class="num" style="min-width:96px;text-align:center;font-size:18px">${R.money(d.price)}</b><button class="sb" data-act="jobPrice" data-d="5" aria-label="Subir monto">+</button></div></div>
    <p class="lbl" style="margin:4px 0 0">Plazos del editor</p><p class="muted" style="margin:-4px 0 0;line-height:1.45">Montaje 3 días antes de la publicación a las 21:00 · final 1 día antes a las 18:00. Así ustedes revisan antes de su propio plazo.</p>
    <label class="field"><span>Carpeta de Drive para subir los videos (opcional)</span><input class="in" type="url" data-job="drive_url" value="${esc(d.drive_url)}" placeholder="https://drive.google.com/…"></label></section>`;
  html += `<section class="card privbox"><div class="between" style="align-items:center"><p class="lbl" style="margin:0;color:#FFB09C">Solo para ustedes</p><span class="small" style="display:flex;align-items:center;gap:5px;color:#C9A89C">${icon.lock}el editor no lo ve</span></div>
    <div class="krow"><span>Acordado con el editor</span><b class="num">${R.money(m.price)} × ${m.n} = ${R.money(m.total)}</b></div>
    <div class="krow"><span>Cubre el presupuesto <small>(tope ${R.money(m.cap)} por video)</small></span><b class="num" style="color:#6EE7B7">${R.money(m.covered)}</b></div>
    <div class="gapbox${m.gap > 0 ? ' bad' : ''}"><b>${m.gap > 0 ? 'Excedente a cubrir aparte' : 'Sin excedente'}</b><b class="num">${R.money(m.gap)}</b></div>
    ${m.gap > 0 ? `<p class="lbl" style="margin:2px 0 0">¿Quién cubre el excedente?</p><div class="row" style="gap:6px;flex-wrap:wrap">${[['owner', ownerTxt + ' (dueño)'], ['half', 'A medias'], ['tbd', 'Por definir']].map(([k, t]) => `<button class="paybtn${d.payer === k ? ' on' : ''}" data-act="jobPayer" data-k="${k}">${esc(t)}</button>`).join('')}</div><p class="small" style="margin:0;color:#E4D5CF">${payerTxt}</p>` : ''}</section>`;
  html += `<div class="pmsg pm-green"><span class="pdot"></span><p><span class="small" style="display:block;margin-bottom:4px;color:#6EE7B7">Así le llega al editor</span>${msg}</p></div>`;
  const ready = (d.member_id || d.name.trim()) && sel.length && d.price > 0;
  html += `<button class="hb ${ready ? 'x-amber' : 'x-off'}" data-act="jobCreate" ${ready ? '' : 'disabled'}>${soc ? 'Pedir aprobación a ' + first(soc) : 'Crear encargo'}</button>
    <p class="muted" style="margin:-4px 0 0;text-align:center">${soc ? 'La contratación necesita el acuerdo de los dos (14.2).' : 'Queda en el historial.'}</p>`;
  return html;
}
function jobDetailCard(j, it, v, me) {
  const isAdmOrSoc = isPartner(me);
  const ch = JOB_CH[it.stage];
  const due = jobDues(v);
  const editor = first(st.member(j.member_id));
  const undo = it.prev && it.prev.by === me.id && R.within(it.prev.at) ? undoLink('jobUndo', `data-id="${it.id}"`) : '';
  const list = (arr, title, editable) => `<div class="obsbox"><p>${title}</p>${(arr || []).map((o, k) => `<button class="obs${o.done ? ' done' : ''}" ${editable ? `data-act="jobCheck" data-id="${it.id}" data-i="${k}"` : 'disabled'}><i>${icon.tick}</i><span>${esc(o.t)}</span></button>`).join('')}</div>`;
  let title = '', sub = '', body = '', acts = '';
  const n1 = (it.obs1 || []).filter((o) => o.done).length, n2 = (it.obs2 || []).filter((o) => o.done).length;
  const late = (at, dd) => at && new Date(at) > dd ? ' · tarde' : at ? ' · a tiempo' : '';
  if (it.stage === 'montaje') { title = 'Esperando el montaje'; sub = 'Plazo: ' + R.fmtWhen(due.m) + '. Te avisamos cuando ' + editor + ' lo entregue.'; }
  else if (it.stage === 'rev1') {
    title = 'Revisión de montaje · 1 de 2'; sub = `Entregado ${R.fmtWhen(it.montaje_at)}${late(it.montaje_at, due.m)}. Escribe las observaciones, una por línea: ${editor} las marcará una por una.`;
    body = `<textarea class="in" data-obs="${it.id}" rows="4" placeholder="Subir el volumen de la voz en 0:12&#10;Cortar la pausa larga en 0:40" style="min-height:110px;padding-top:12px">${esc((ui.obs || {})[it.id] || '')}</textarea>`;
    acts = `<button class="hb x-amber" data-act="jobObs" data-id="${it.id}">Enviar observaciones</button><button class="hb x-ghost" data-act="jobOk" data-id="${it.id}">Aprobar sin cambios</button>`;
  } else if (it.stage === 'aj1') { title = `${editor} está haciendo ajustes`; sub = 'Luego entrega el video final antes del ' + R.fmtWhen(due.f) + '.'; body = list(it.obs1, `Revisión de montaje · ${n1} de ${(it.obs1 || []).length}`, false); }
  else if (it.stage === 'final') { title = 'Montaje aprobado sin cambios'; sub = 'Plazo del video final: ' + R.fmtWhen(due.f) + '.'; }
  else if (it.stage === 'rev2') {
    title = 'Revisión final · 2 de 2'; sub = `Entregado ${R.fmtWhen(it.final_at)}${late(it.final_at, due.f)}. Es la última: si hay observaciones, ${editor} las corrige y lo sube directo a Drive.`;
    body = `<textarea class="in" data-obs="${it.id}" rows="3" placeholder="Una observación por línea" style="min-height:90px;padding-top:12px">${esc((ui.obs || {})[it.id] || '')}</textarea>`;
    acts = `<button class="hb x-green" data-act="jobOk" data-id="${it.id}">${icon.check}Aprobar: está perfecto</button><button class="hb x-ghost" data-act="jobObs" data-id="${it.id}">Enviar observaciones finales</button>`;
  } else if (it.stage === 'aj2') { title = `Últimos ajustes de ${editor}`; sub = 'Cuando los marque todos, podrá subirlo a Drive.'; body = list(it.obs2, `Revisión final · ${n2} de ${(it.obs2 || []).length}`, false); }
  else if (it.stage === 'upload') { title = `Aprobado · ${editor} lo está subiendo`; sub = 'Te avisamos cuando lo marque como subido.'; }
  else { title = `Video ${v.num} listo`; sub = `Aprobado y subido a Drive · ${R.fmtWhen(it.uploaded_at)}.`; }
  if (!isAdmOrSoc) acts = '';
  return `<section class="card jobd"><div class="between" style="align-items:center"><p class="lbl" style="margin:0">Video ${v.num}${v.title ? ' · ' + esc(v.title) : ''}</p><span class="chip13" style="color:${ch[2]};background:${ch[3]}">${ch[1]}</span></div>
    <b class="num" style="font-size:17px">${title}</b><p class="muted" style="margin:-6px 0 0;line-height:1.45">${sub}</p>${body}${acts}${undo ? `<div class="pextra">${undo}</div>` : ''}</section>`;
}
function vJob(id) {
  const j = (S.data.jobs || []).find((x) => x.id === id);
  if (!j) return `${backTo('#/', 'Inicio')}<p class="empty">Encargo no encontrado.</p>`;
  const me = S.me;
  const p = projOf(j.project_id);
  const cm = st.member(j.member_id);
  const vids = j.video_ids.map((x) => S.data.videos.find((v) => v.id === x)).filter(Boolean).sort((a, b) => a.num - b.num);
  const items = st.jobItems(j.id);
  const m = jobMoney(j, p);
  const ownerTxt = Array.from(new Set(vids.map((v) => v.owner))).map((x) => first(st.member(x))).join(' y ');
  const prop = st.member(j.proposed_by);
  const nums = vids.map((v) => v.num).join(', ');
  let html = `${backTo(st.isAdmin() ? '#/admin/integrantes' : '#/', st.isAdmin() ? 'Integrantes' : 'Inicio')}<div class="row" style="gap:12px"><span class="av" style="width:40px;height:40px;background:#FF8A65;color:#1A0E08">${esc(ini(cm.name)).charAt(0)}</span><div style="flex:1;min-width:0"><h1 style="font-size:22px;margin:0">Encargo · ${esc(cm.name)}</h1><p class="sub" style="margin:2px 0 0">${esc(p.client)} · ${esc(p.name)} · ${vids.length === 1 ? 'video' : 'videos'} ${nums}</p></div></div>`;
  const ban = (tone, t, d) => `<section class="jban jb-${tone}"><b>${t}</b>${d ? `<p>${d}</p>` : ''}</section>`;
  const summary = `<section class="card privbox"><div class="between" style="align-items:center"><p class="lbl" style="margin:0;color:#FFB09C">Solo para ustedes</p><span class="small" style="display:flex;align-items:center;gap:5px;color:#C9A89C">${icon.lock}el editor no lo ve</span></div>
    <div class="krow"><span>Acordado con el editor</span><b class="num">${R.money(m.price)} × ${m.n} = ${R.money(m.total)}</b></div>
    <div class="krow"><span>Cubre el presupuesto <small>(tope ${R.money(m.cap)} por video)</small></span><b class="num" style="color:#6EE7B7">${R.money(m.covered)}</b></div>
    <div class="gapbox${m.gap > 0 ? ' bad' : ''}"><b>${m.gap > 0 ? 'Excedente a cubrir aparte' : 'Sin excedente'}</b><b class="num">${R.money(m.gap)}</b></div>
    ${m.gap > 0 ? `<div class="krow"><span>Lo cubre</span><b>${esc(payerName(j, vids))}</b></div>` : ''}</section>`;
  const terms = `<section class="card"><p class="lbl" style="margin:0">El encargo</p><div class="krow"><span>Servicio</span><b>Edición completa</b></div><div class="krow"><span>Videos</span><b>${nums}</b></div><div class="krow"><span>Revisiones</span><b>1 de montaje + 1 final</b></div>${j.drive_url ? `<div class="krow"><span>Drive</span><a href="${esc(j.drive_url)}" target="_blank" rel="noopener">Abrir carpeta</a></div>` : ''}</section>`;
  if (j.status === 'propuesto') {
    if (me.id === j.proposed_by) html += ban('wait', 'Esperando a ' + first(otherPartner() || { name: 'tu socio' }), 'Le llegó el encargo para aprobarlo.') + terms + summary + (st.isAdmin() ? `<button class="btn b-ghost" data-act="jobDecide" data-id="${j.id}" data-s="cancelado" style="color:var(--r-fg2)">Cancelar encargo</button>` : '');
    else html += ban('warn', `${esc(first(prop))} propone contratar un editor`, `Para los videos ${nums}. Revisa el monto y quién cubre el excedente.`) + terms + summary + `<button class="hb x-blue" data-act="jobDecide" data-id="${j.id}" data-s="invitado">${icon.check}Aprobar y enviar invitación</button><button class="btn b-ghost" data-act="jobDecide" data-id="${j.id}" data-s="rechazado">Rechazar</button>`;
    return html;
  }
  if (j.status === 'rechazado' || j.status === 'cancelado') return html + ban('wait', j.status === 'rechazado' ? 'Encargo rechazado' : 'Encargo cancelado', '') + terms + summary;
  if (j.status === 'invitado') {
    const pend = !cm.user_id && cm.invite_code;
    const msg = `Hola ${String(cm.name).split(' ')[0]}, te invito a editar ${m.n} ${m.n === 1 ? 'video' : 'videos'} de ${p.client} por ${R.money(m.price)} cada uno (${R.money(m.total)} en total). Entra aquí para ver las condiciones del encargo: ${pend ? inviteLink(cm) : location.origin + location.pathname}`;
    html += ban('wait', pend ? 'Invitación lista' : 'Encargo enviado', 'Esperando que el editor acepte las condiciones.');
    html += `<div class="row" style="gap:8px"><a class="hb x-green" style="flex:2;font-size:14px" href="https://wa.me/${cm.phone ? '51' + cm.phone : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${waIc}Enviar por WhatsApp</a>${pend ? `<button class="hb x-ghost" style="flex:1;font-size:14px" data-act="copy" data-t="${esc(inviteLink(cm))}">Copiar enlace</button>` : ''}</div>`;
    html += terms + summary + (st.isAdmin() ? `<button class="btn b-ghost" data-act="jobDecide" data-id="${j.id}" data-s="cancelado" style="color:var(--r-fg2)">Cancelar encargo</button>` : '');
    return html;
  }
  const doneN = items.filter((i) => i.stage === 'done').length;
  const pend = items.filter((i) => i.stage === 'rev1' || i.stage === 'rev2').length;
  if (j.status === 'finalizado') html += ban('warn', 'El editor marcó el servicio como finalizado', `Revisa que los ${vids.length} videos estén en Drive y confírmalo.`);
  else if (j.status === 'cerrado') html += ban('ok', 'Encargo cerrado', 'Pago al editor registrado ' + R.fmtWhen(j.closed_at) + '.');
  else if (pend) html += ban('warn', pend + (pend === 1 ? ' video por revisar' : ' videos por revisar'), 'Las observaciones le llegan al editor como checklist.');
  const selId = (ui.jobSel || {})[j.id] || (items.find((i) => i.stage === 'rev1' || i.stage === 'rev2') || items[0] || {}).video_id;
  html += `<section class="card" style="gap:8px"><div class="between" style="align-items:center"><p class="lbl" style="margin:0">Videos del editor</p><span class="muted">${doneN} de ${vids.length} listos</span></div>
    ${vids.map((v) => { const it = items.find((i) => i.video_id === v.id) || { stage: 'montaje' }; const chh = JOB_CH[it.stage]; const on = v.id === selId; const need = it.stage === 'rev1' || it.stage === 'rev2'; const dd = jobDues(v); const due = it.stage === 'montaje' ? 'Montaje: ' + R.fmtWhen(dd.m) : it.stage === 'done' ? 'Subido a Drive' : it.stage === 'upload' ? 'Aprobado · falta subir' : 'Final: ' + R.fmtWhen(dd.f);
      return `<button class="jvid${on ? ' on' : ''}" data-act="jobSel" data-j="${j.id}" data-v="${v.id}"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span style="flex:1;min-width:0"><b style="display:block;font-size:13px">Video ${v.num} · publica ${R.fmtDay(v.publish_date)}</b><span class="small" style="display:block;margin-top:1px;color:${need ? '#FFC978' : 'var(--tx4)'}">${due}</span></span><span class="chip13" style="color:${chh[2]};background:${chh[3]}">${chh[1]}</span></button>`; }).join('')}</section>`;
  const sv = vids.find((v) => v.id === selId);
  const sit = items.find((i) => i.video_id === selId);
  if (sv && sit) html += jobDetailCard(j, sit, sv, me);
  if (j.status === 'finalizado' || j.status === 'cerrado') html += summary.replace('Solo para ustedes', 'Resumen del encargo') + (j.status === 'finalizado' ? `<button class="hb x-amber" data-act="jobClose" data-id="${j.id}">Confirmar y registrar el pago al editor</button><p class="muted" style="margin:-4px 0 0;text-align:center">Estos montos pasan solos a la liquidación del cierre del proyecto.</p>` : '');
  else html += summary;
  return html;
}
// Vista del colaborador (EncargoA, vista del editor).
function vColab() {
  const H = S.colab || { jobs: [] };
  const me = S.me;
  const jobs = H.jobs || [];
  let html = `<div class="between" style="align-items:center"><div style="min-width:0"><p class="muted" style="margin:0">Hola, ${esc(first(me))} · Colaborador</p><h1 style="font-size:24px;margin:2px 0 0">${jobs.length === 1 ? esc(jobs[0].project.client) + ' · ' + esc(jobs[0].project.name) : 'Mis videos'}</h1></div><span class="pill-amber" style="background:#2A1810;color:#FFB09C">Edición</span></div>`;
  if (!jobs.length) return html + `<section class="jban jb-wait"><b>Todavía no hay encargo</b><p>Cuando el equipo lo apruebe, aparecerá aquí.</p></section>`;
  const sj = jobs.find((x) => x.id === ui.colabJob) || jobs[jobs.length - 1];
  if (jobs.length > 1) html += `<div class="row" style="gap:6px;flex-wrap:wrap">${jobs.map((x) => `<button class="chipbtn${x.id === sj.id ? ' on' : ''}" data-act="colabJob" data-id="${x.id}">${esc(x.project.client)} · ${x.videos.length} videos</button>`).join('')}</div>`;
  const n = sj.videos.length;
  const price = Number(sj.price);
  if (sj.status === 'invitado') {
    html += `<section class="card"><p class="lbl" style="margin:0;color:#FFB09C">Condiciones del encargo</p>
      <div class="krow"><span>Servicio</span><b>Edición completa</b></div><div class="krow"><span>Videos</span><b>${n} · ${esc(sj.project.client)}</b></div>
      <div class="krow"><span>Pago</span><b class="num">${R.money(price)} por video · ${R.money(price * n)}</b></div><div class="krow"><span>Cuándo se paga</span><b>3 días después de confirmar</b></div>
      <div style="height:1px;background:var(--line)"></div>
      ${[['Plazos:', 'montaje 3 días antes de la publicación a las 21:00; video final 1 día antes a las 18:00.'], ['Revisiones:', '2 en total: una del montaje y una del final. Las observaciones te llegan como checklist.'], ['Entrega:', 'márcala en la app aunque envíes el archivo por WhatsApp o Drive, así queda registrada la hora.'], ['Final:', 'cuando el video esté aprobado, lo subes a la carpeta de Drive del proyecto.']].map(([t, d]) => `<div class="row small" style="gap:10px;align-items:flex-start;line-height:1.45"><span style="width:6px;height:6px;border-radius:50%;background:#FF8A65;flex-shrink:0;margin-top:7px"></span><span><b>${t}</b> ${d}</span></div>`).join('')}</section>
      <button class="hb x-coral" data-act="colabAccept" data-id="${sj.id}">${icon.check}Acepto el encargo</button><p class="muted" style="margin:-4px 0 0;text-align:center">Puedes volver a ver las condiciones cuando quieras.</p>`;
    return html;
  }
  const doneN = sj.videos.filter((v) => v.item.stage === 'done').length;
  html += `<section class="wallet"><div class="between" style="align-items:center"><span class="lbl" style="color:var(--w-title,var(--mint))">Tu pago en este proyecto</span><span class="muted" style="color:var(--w-sub)">${icon.lock} Solo tú</span></div>
    <div class="row" style="gap:8px;align-items:baseline"><b class="num" style="font-size:34px;line-height:1">${R.money(price * doneN)}</b><span class="small" style="color:var(--w-sub)">de ${R.money(price * n)}</span></div>
    <p class="small" style="margin:0;color:var(--w-sub)">${R.money(price)} por video aprobado y subido · se paga 3 días después de confirmar el servicio</p></section>`;
  if (sj.status === 'activo' && doneN === n) html += `<section class="jban jb-ok"><b>¡Terminaste tus ${n} videos!</b><p>Marca el servicio como finalizado para que lo confirmen y te paguen.</p></section><button class="hb x-coral" data-act="colabFinish" data-id="${sj.id}">Servicio finalizado</button>`;
  if (sj.status === 'finalizado') html += `<section class="jban jb-wait"><b>Servicio finalizado</b><p>El equipo lo está confirmando. Te pagarán ${R.money(price * n)} dentro de los 3 días siguientes.</p></section>`;
  if (sj.status === 'cerrado') html += `<section class="jban jb-ok"><b>Servicio confirmado</b><p>Recibirás ${R.money(price * n)}. ¡Gracias por tu trabajo!</p></section>`;
  const selId = (ui.colabSel || {})[sj.id] || (sj.videos.find((v) => ['montaje', 'aj1', 'final', 'aj2', 'upload'].indexOf(v.item.stage) !== -1) || sj.videos[0]).id;
  html += `<section class="card" style="gap:8px"><div class="between" style="align-items:center"><p class="lbl" style="margin:0">Tus videos</p><span class="muted">${doneN} de ${n} listos</span></div>
    ${sj.videos.map((v) => { const it = v.item; const chh = JOB_CH[it.stage]; const on = v.id === selId; const mine = ['montaje', 'aj1', 'final', 'aj2', 'upload'].indexOf(it.stage) !== -1; const due = it.stage === 'montaje' ? 'Montaje: ' + R.fmtWhen(v.montaje_due) : it.stage === 'done' ? 'Subido a Drive' : it.stage === 'upload' ? 'Aprobado · falta subir' : 'Final: ' + R.fmtWhen(v.final_due);
      return `<button class="jvid${on ? ' on c' : ''}" data-act="colabSel" data-j="${sj.id}" data-v="${v.id}"><span class="vbox"><small>VIDEO</small><b class="num">${v.num}</b></span><span style="flex:1;min-width:0"><b style="display:block;font-size:13px">Video ${v.num} · publica ${R.fmtDay(v.publish_date)}</b><span class="small" style="display:block;margin-top:1px;color:${mine ? '#FFC978' : 'var(--tx4)'}">${due}</span></span><span class="chip13" style="color:${chh[2]};background:${chh[3]}">${chh[0]}</span></button>`; }).join('')}</section>`;
  const v = sj.videos.find((x) => x.id === selId);
  if (v) {
    const it = v.item; const ch = JOB_CH[it.stage];
    const can = sj.status === 'activo';
    const list = (arr, title) => `<div class="obsbox"><p>${title}</p>${(arr || []).map((o, k) => `<button class="obs${o.done ? ' done' : ''}" ${can ? `data-act="colabCheck" data-id="${it.id}" data-i="${k}"` : 'disabled'}><i>${icon.tick}</i><span>${esc(o.t)}<small>Observación del equipo</small></span></button>`).join('')}</div>`;
    const all = (arr) => (arr || []).every((o) => o.done);
    const n1 = (it.obs1 || []).filter((o) => o.done).length, n2 = (it.obs2 || []).filter((o) => o.done).length;
    let title = '', sub = '', body = '', acts = '', note = '';
    const btn = (t, act, dis) => `<button class="hb ${dis ? 'x-off' : 'x-coral'}" data-act="colabStep" data-id="${it.id}" data-k="${act}" ${dis ? 'disabled' : ''}>${t}</button>`;
    if (it.stage === 'montaje') { title = 'Entrega el montaje'; sub = 'Plazo: ' + R.fmtWhen(v.montaje_due) + '. Si lo enviaste por WhatsApp o Drive, márcalo aquí para que quede registrado a tiempo.'; acts = v.shot ? btn('Entregué el montaje', 'montaje') : ''; note = v.shot ? '' : 'Se activa cuando el video esté grabado.'; }
    else if (it.stage === 'rev1') { title = 'Estamos revisando tu montaje'; sub = `Entregado ${R.fmtWhen(it.montaje_at)}. Te llegarán las observaciones aquí.`; }
    else if (it.stage === 'aj1') { title = 'Haz estos ajustes'; sub = 'Marca cada punto cuando lo termines. Luego entrega el video final antes del ' + R.fmtWhen(v.final_due) + '.'; body = list(it.obs1, `Revisión de montaje · ${n1} de ${(it.obs1 || []).length}`); acts = btn('Entregué el video final', 'final', !all(it.obs1)); note = all(it.obs1) ? 'Plazo: ' + R.fmtWhen(v.final_due) + '.' : 'Marca todos los ajustes para entregar.'; }
    else if (it.stage === 'final') { title = 'Montaje aprobado: entrega el final'; sub = 'Plazo del video final: ' + R.fmtWhen(v.final_due) + '.'; acts = btn('Entregué el video final', 'final'); }
    else if (it.stage === 'rev2') { title = 'Revisión final en curso'; sub = 'Es la última revisión. Si no hay observaciones, te pediremos subirlo a Drive.'; }
    else if (it.stage === 'aj2') { title = 'Últimos ajustes'; sub = 'Cuando los termines, lo subes a Drive. No hay otra revisión.'; body = list(it.obs2, `Revisión final · ${n2} de ${(it.obs2 || []).length}`); acts = btn('Listo, subir a Drive', 'upload', !all(it.obs2)); note = all(it.obs2) ? '' : 'Marca todos los ajustes para continuar.'; }
    else if (it.stage === 'upload') {
      title = 'El video está perfecto, súbelo'; sub = 'Súbelo con este nombre en la carpeta del proyecto.';
      body = `<div class="drivebox"><b>Súbelo aquí</b>${sj.drive_url ? `<a href="${esc(sj.drive_url)}" target="_blank" rel="noopener">${esc(sj.drive_url.replace(/^https?:\/\//, '').slice(0, 42))}${sj.drive_url.length > 50 ? '…' : ''}</a>` : '<span class="small">Pide el enlace de la carpeta al equipo.</span>'}<span class="small">Nombre del archivo: ${esc(String(sj.project.client).replace(/\s+/g, ''))}_Video${v.num}_FINAL.mp4</span></div>`;
      acts = btn('Ya lo subí', 'uploaded');
    } else { title = `Video ${v.num} listo`; sub = 'Aprobado y subido a Drive.'; }
    if (!can) { acts = ''; note = ''; }
    const undo = it.prev_by === me.id && R.within(it.prev_at) && can ? undoLink('colabUndo', `data-id="${it.id}"`) : '';
    html += `<section class="card jobd"><div class="between" style="align-items:center"><p class="lbl" style="margin:0">Video ${v.num}${v.title ? ' · ' + esc(v.title) : ''}</p><span class="chip13" style="color:${ch[2]};background:${ch[3]}">${ch[0]}</span></div>
      <b class="num" style="font-size:17px">${title}</b><p class="muted" style="margin:-6px 0 0;line-height:1.45">${sub}</p>${body}${acts}${note ? `<p class="muted" style="margin:-4px 0 0;text-align:center">${note}</p>` : ''}${undo ? `<div class="pextra">${undo}</div>` : ''}</section>`;
  }
  const ps = (H.partners || []).filter((x) => x.phone);
  if (ps.length) html += `<div class="row" style="gap:8px;flex-wrap:wrap">${ps.map((x) => `<a class="btn sm b-ghost" href="https://wa.me/51${x.phone}" target="_blank" rel="noopener">${waIc}Escribir a ${esc(String(x.name).split(' ')[0])}</a>`).join('')}</div>`;
  return html;
}
function colabLayout(body) {
  return `<div class="wrap"><main style="padding-bottom:30px">${st.isDemo() ? demoBar() : ''}${body}
    <button class="btn b-ghost" data-act="signOut" style="margin-top:8px">Cerrar sesión</button><p class="muted" style="text-align:center;margin:4px 0 0">Registro audiovisual · versión ${VERSION}</p></main></div>`;
}

function vNewProject() {
  return `<a href="#/equipo" class="row muted" style="text-decoration:none">${icon.back} Equipo</a><h1>Nuevo proyecto</h1><p class="sub">Un proyecto es un paquete de videos de un cliente (por ejemplo, 16 videos al mes). Los montos por tarea salen solos del presupuesto (cláusula cuarta).</p>
  <form data-form="project" class="card">
    <label class="field"><span>Cliente</span><input class="in" name="client" required placeholder="PerteneSer"></label>
    <label class="field"><span>Nombre del proyecto</span><input class="in" name="name" required placeholder="Noviembre"></label>
    <div class="grid2"><label class="field"><span>Presupuesto (S/)</span><input class="in" name="budget" type="number" step="0.01" min="1" required value="1000"></label>
    <label class="field"><span>Videos</span><input class="in" name="videos" type="number" min="1" required value="16"></label></div>
    <label class="field"><span>Empieza</span><input class="in" name="start" type="date" required value="2026-11-09"></label>
    <p class="muted" style="margin:0">Reparto: preproducción 25 % · rodaje 35 % · montaje 16 % · acabado 24 %.</p>
    <button class="btn b-amber">Crear proyecto</button></form>`;
}

// ==================================================================
// 1.2: tema día/noche y colores del equipo
// ==================================================================
function theme() { try { return localStorage.getItem('ra-theme') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
function fgFor(hex) { const h = hex.replace('#', ''); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#14110A' : '#FFFFFF'; }
function applyLook() {
  const L = st.look();
  const d = document.documentElement;
  d.dataset.theme = theme();
  d.style.setProperty('--amber', L.main);
  d.style.setProperty('--main-fg', fgFor(L.main));
  d.style.setProperty('--u0', L.u0);
  d.style.setProperty('--u1', L.u1);
  d.style.setProperty('--u2', L.u2);
  applyLook13();
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.setAttribute('content', theme() === 'light' ? '#F6F5F2' : '#0B0C10');
}

// ==================================================================
// 1.2: Administrador
// ==================================================================
const PALETTE = {
  main: [['Ámbar', '#FFB547'], ['Coral', '#FF8A65'], ['Menta', '#6EE7B7'], ['Azul', '#8AB4FF'], ['Violeta', '#B98CFF']],
  u0: [['Rojo coral', '#FF6B5B'], ['Rojo intenso', '#E5484D'], ['Frambuesa', '#FF4D7D'], ['Rojo naranja', '#FF5A36']],
  u1: [['Naranja', '#FF9F2E'], ['Ámbar', '#FFB547'], ['Amarillo', '#F5C542'], ['Durazno', '#FF8A65']],
  u2: [['Gris', '#5A5D67'], ['Gris claro', '#8B8B94'], ['Azul pizarra', '#4A5A78'], ['Verde musgo', '#3E6B5A']]
};
const RULE_DEF = [
  ['Llegadas a reuniones y rodajes', [
    ['open', 'Se puede marcar desde', 'antes de la hora programada', 5, 5, 60, (x) => x + ' min'],
    ['punt', 'Puntual hasta', 'después de la hora · suma +1', 5, 0, 30, (x) => x + ' min'],
    ['tol', 'Tardanza hasta', 'se paga pero resta 1 · después es falta', 5, 15, 90, (x) => x + ' min']]],
  ['Plazos de entrega', [
    ['pre', 'Guion y storyboard', 'el día antes del rodaje · luego tu compañero puede tomarlos', 30, 720, 1380, (x) => R.hm(x)],
    ['take', 'Tomar lo del compañero', 'horas antes del rodaje · hasta ahí se toma y se entrega', 1, 1, 12, (x) => x + ' h'],
    ['undo', 'Deshacer una tarea', 'tiempo para corregir un error al marcar', 5, 5, 60, (x) => x + ' min']]],
  ['Confirmar asistencia', [
    ['avr', 'Rodaje · confirmar hasta', 'del día anterior · sin confirmar resta 2', 30, 720, 1380, (x) => R.hm(x)],
    ['conf', 'Reunión · confirmar con', 'horas antes · sin confirmar resta 2', 1, 6, 48, (x) => x + ' h'],
    ['madr', 'Madrugada · hasta', 'si el plazo cae antes, pasa a las 23:59 del día anterior', 30, 0, 480, (x) => R.hm(x)]]]
];
// 1.4 · Entregas al límite (para mostrar propuestas)
const ENT_DEF = [
  ['mon', 'Días de apoyo', 'antes de publicar · entregas al límite', 0, 0, 0, (x) => x + ' días'], ['monh', 'Hora del apoyo', 'último envío del montaje', 0, 0, 0, R.hm],
  ['self', 'Entrega por su cuenta', 'hasta esta hora del día anterior', 0, 0, 0, R.hm], ['auto', 'Pasa al administrador', 'si nadie lo tomó', 0, 0, 0, R.hm],
  ['fix', 'Corregir cambios', 'si se pidieron cambios', 0, 0, 0, R.hm], ['fin', 'Video final', 'días antes de publicar, 23:59', 0, 0, 0, (x) => x + ' día antes']];
const PCT_DEF = [['pre', 'Preproducción', 'pre'], ['rod', 'Rodaje', 'prod'], ['mon', 'Montaje', 'post'], ['aca', 'Video final', 'star']];
const REM_DEF = [
  ['Reuniones y rodajes', [['reu', 'pre', 'Reunión de preproducción', '4 h antes y 30 min antes', 'A los dos'], ['rod', 'prod', 'Rodaje', 'El día anterior a las 20:00 y 1 h antes', 'A los dos'], ['arr', 'prod', 'Llegada sin marcar', '10 min después de la hora, si aún no marcaste', 'A quien falte marcar']]],
  ['Entregas', [['pre', 'pre', 'Guion y storyboard por vencer', '3 h antes del plazo', 'Al dueño del video'], ['take', 'pre', 'Tarea disponible para tomar', 'Cuando vence una tarea de tu compañero', 'Al otro socio'], ['mon', 'post', 'Montaje por vencer', '24 h antes y 6 h antes', 'Al dueño del video'], ['fin', 'post', 'Video final por vencer', '6 h antes', 'A quien le toca el final']]],
  ['Equipo', [['team', 'team', 'Avisos de tu compañero', 'Si avisa que no irá, pide finalizar una reunión o marca su llegada', 'Al otro socio · a ti para confirmar']]]
];
function adminOnly(body) { return st.isAdmin() ? body : `${backTo('#/', 'Inicio')}${banner('bad', 'Solo para el administrador', 'Esta sección la ve solo quien administra el equipo.')}`; }
function aitem(href, tint, ic, title, sub, badge = '') {
  return `<a class="ait" href="${href}"><span class="tic tint-${tint}">${ic}</span><span class="ttx"><b>${title}</b><span>${sub}</span></span>${badge}${icon.chev}</a>`;
}
function vAdmin(sub) {
  if (!st.isAdmin()) return adminOnly('');
  if (sub === 'apariencia') return vAdminLook();
  if (sub === 'reglas') return vAdminRules();
  if (sub === 'porcentajes') return vAdminPct();
  if (sub === 'recordatorios') return vAdminRem();
  if (sub === 'practica') return vAdminPractice();
  if (sub === 'entregas') return vAdminEntregas();
  if (sub === 'integrantes') return vIntegrantes();
  const S0 = st.settings();
  const pend = st.proposals().filter((p) => p.status === 'pendiente');
  const pct = Object.assign({}, R.DEFAULT_PCT, S0.pct || {});
  const rem = S0.reminders || {};
  const remOn = REM_DEF.reduce((a, g) => a + g[1].filter((r) => rem[r[0]] !== false).length, 0);
  const L = st.look();
  let html = `${backTo('#/', 'Inicio')}<div><div class="between" style="align-items:center"><h1 style="font-size:28px">Administrador</h1><span class="pill-amber">${icon.shield}Solo tú</span></div><p class="sub">Tu socio no ve esta sección. Lo que toca el acuerdo se propone y se aplica cuando él lo aprueba.</p></div>`;
  if (pend.length) html += `<section class="pendbox"><div class="row" style="gap:8px"><span class="hdot blue"></span><b class="small" style="color:#C9D8FF">Esperando que tu socio apruebe · ${pend.length}</b></div>${pend.map((p) => `<a class="penditem" href="#/propuesta/${p.id}"><span style="flex:1"><b class="small">${p.kind === 'pct' ? 'Porcentajes del acuerdo' : 'Reglas de registro'}</b><br><span class="muted">${propSummary(p)} · ${R.fmtWhen(p.created_at)}</span></span><span class="gchip g-next">Pendiente</span></a>`).join('')}</section>`;
  html += `<div><p class="lbl alb">Acuerdo · con aprobación del socio</p><div class="agrp">
    ${aitem('#/admin/porcentajes', 'pre', icon.pie('var(--c-pre)'), 'Porcentajes del acuerdo', `Pre ${pct.pre} · Rodaje ${pct.rod} · Montaje ${pct.mon} · Final ${pct.aca}`, st.pendingProposal('pct') ? '<span class="gchip g-next">1 propuesta</span>' : '')}
    ${aitem('#/admin/entregas', 'post', icon.cut('var(--c-post)', 19), 'Entregas al límite', (() => { const r = Object.assign({}, R.DEFAULT_RULES, S0.rules || {}); return `Apoyo ${r.mon} días · ${R.hm(r.monh)} · pasa a ti ${R.hm(r.auto)}`; })())}
    ${aitem('#/admin/reglas', 'pre', icon.clock.replace(/width="12" height="12"/, 'width="19" height="19"').replace('currentColor', 'var(--c-pre)'), 'Reglas de registro', 'Llegadas, plazos y avisos de inasistencia', st.pendingProposal('rules') ? '<span class="gchip g-next">1 propuesta</span>' : '')}</div></div>`;
  html += `<div><p class="lbl alb">Avisos · los cambias tú</p><div class="agrp">${aitem('#/admin/recordatorios', 'prod', icon.bell('var(--c-prod)'), 'Recordatorios automáticos', `${remOn} de 8 activos · descanso 22:00 a 7:00`)}</div></div>`;
  html += `<div><p class="lbl alb">App · los cambias tú</p><div class="agrp">
    ${aitem('#/admin/apariencia', 'info', icon.palette, 'Apariencia', `Color principal y urgencia <span class="sw4">${[L.main, L.u0, L.u1, L.u2].map((c) => `<i style="background:${c}"></i>`).join('')}</span>`)}
    ${aitem('#/admin/practica', 'lab', icon.flask, 'Modo práctica', 'Prueba con un proyecto de ejemplo · no toca los datos reales', st.practice() ? '<span class="gchip g-live">Encendido</span>' : '<span class="gchip g-past">Apagado</span>')}</div></div>`;
  html += `<div><p class="lbl alb">Equipo</p><div class="agrp">
    ${aitem('#/admin/integrantes', 'blue', icon.users, 'Integrantes e invitaciones', S.data.members.filter((m) => m.active && m.role !== 'colaborador').map((m) => esc(m.name.split(' ')[0]) + (m.role === 'admin' ? ' (admin)' : '') + (!m.user_id ? ' (invitado)' : '')).join(' · ') + (S.data.members.some((m) => m.active && m.role === 'colaborador') ? ' · colaboradores' : ''))}
    ${aitem('#/historial', 'info', icon.hist, 'Historial de cambios', 'Cada ajuste queda registrado · lo ve también tu socio')}</div></div>`;
  html += `<p class="muted" style="margin:0 4px;line-height:1.45">Clientes y proyectos se crean desde el selector de arriba (el nombre del proyecto).</p>`;
  return html;
}
function propSummary(p) {
  const old = p.old || {};
  if (p.kind === 'pct') return PCT_DEF.map(([k, n]) => `${n.split(' ')[0]} ${p.data[k]}`).join(' · ');
  const all = RULE_DEF.flatMap((g) => g[1]).concat(ENT_DEF);
  return Object.entries(p.data).map(([k, v]) => {
    if (k === 'cli') return 'Por cliente: ' + (Object.entries(v || {}).map(([cl, d]) => `${esc(cl)} ${d} días`).join(', ') || 'ninguno');
    const d = all.find((x) => x[0] === k); const was = old[k] != null ? old[k] : R.DEFAULT_RULES[k]; return d ? `${d[1]}: ${d[6](was)} → ${d[6](v)}` : k;
  }).join(' · ');
}
// ==================================================================
// 1.3 · Apariencia C: colores para los dos, por separado en noche y día
// ==================================================================
const LOOK_DEF = {
  dark: {
    main: '#FFB547', u0: '#FF6B5B', u1: '#FF9F2E', u2: '#5A5D67',
    stPre: '#12805A', stRod: '#A15F00', stPost: '#B4452A', bdPre: '#6EE7B7', bdRod: '#FFB547', bdPost: '#FF8A65', stOn: 100, stOff: 22, bdOp: 55, fgOn: '#FFFFFF',
    r1: ['#17130C', '#3A3220', '#FFB547', '#FFD08A'], r2: ['#1C130A', '#4A3414', '#FF9F2E', '#FFC978'], r3: ['#0C1720', '#1E3A52', '#5CC8FF', '#A8E1FF'], r4: ['#160F22', '#3E2C63', '#B98CFF', '#D6C2FF'],
    meta: ['#16140F', '#3A3220', '#FFB547', '#2A2518'], wallet: ['#121A16', '#1F3A2C', '#6EE7B7', '#F4F4F5']
  },
  light: {
    main: '#D98A00', u0: '#D93B2B', u1: '#E07B00', u2: '#8B8B94',
    stPre: '#12805A', stRod: '#A15F00', stPost: '#B4452A', bdPre: '#12805A', bdRod: '#A15F00', bdPost: '#B4452A', stOn: 100, stOff: 12, bdOp: 45, fgOn: '#FFFFFF',
    r1: ['#FFF4E0', '#F2D9A6', '#E08A00', '#7A4A00'], r2: ['#FFEBD6', '#F5C99A', '#E06F00', '#7A3D00'], r3: ['#E3F3FC', '#A9D7F0', '#1E88C7', '#0B4A70'], r4: ['#F1E9FF', '#D4C0FA', '#7C4DDB', '#3E2273'],
    meta: ['#FFF7E8', '#EFD9AE', '#D98A00', '#F1E3C4'], wallet: ['#E9F7F0', '#B7E2CC', '#0F8A5F', '#0B1F15']
  }
};
function lookFor(mode, saved) {
  const L = saved || st.settings().look || {};
  const base = JSON.parse(JSON.stringify(LOOK_DEF[mode]));
  // Compatibilidad con la 1.2 (colores sueltos = noche).
  if (mode === 'dark') ['main', 'u0', 'u1', 'u2'].forEach((k) => { if (L[k]) base[k] = L[k]; });
  return Object.assign(base, JSON.parse(JSON.stringify((L[mode]) || {})));
}
const hexRgb = (h) => { const x = String(h || '#000').replace('#', ''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255); };
const lum = (h) => { const c = hexRgb(h).map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Mezcla un color con el fondo según la opacidad (para medir el contraste real).
const over = (fg, bg, op) => { const a = hexRgb(fg), b = hexRgb(bg); return '#' + a.map((v, i) => Math.round((v * op / 100 + b[i] * (1 - op / 100)) * 255).toString(16).padStart(2, '0')).join(''); };
function applyLook13() {
  const mode = theme();
  const L = lookFor(mode);
  const d = document.documentElement.style;
  d.setProperty('--amber', L.main); d.setProperty('--main-fg', fgFor(L.main));
  d.setProperty('--u0', L.u0); d.setProperty('--u1', L.u1); d.setProperty('--u2', L.u2);
  [['pre', 'Pre'], ['rod', 'Rod'], ['post', 'Post']].forEach(([k, K]) => { d.setProperty('--st-' + k, L['st' + K]); d.setProperty('--st-' + k + '-c', L['bd' + K]); });
  d.setProperty('--st-on', L.stOn + '%'); d.setProperty('--st-off', L.stOff + '%'); d.setProperty('--st-bdop', L.bdOp + '%'); d.setProperty('--st-fg-on', L.fgOn);
  d.setProperty('--meta-bg', L.meta[0]); d.setProperty('--meta-line', L.meta[1]); d.setProperty('--meta-bar', L.meta[2]); d.setProperty('--meta-track', L.meta[3]);
  d.setProperty('--w-bg', L.wallet[0]); d.setProperty('--w-line', L.wallet[1]); d.setProperty('--w-title', L.wallet[2]); d.setProperty('--w-money', L.wallet[3]);
  for (let n = 1; n <= 4; n++) { const r = L['r' + n]; d.setProperty(`--r${n}-bg`, r[0]); d.setProperty(`--r${n}-bd`, r[1]); d.setProperty(`--r${n}-c`, r[2]); d.setProperty(`--r${n}-t`, r[3]); }
}
const SUG = {
  main: ['#FFB547', '#FF8A65', '#6EE7B7', '#8AB4FF', '#B98CFF', '#F5C542'],
  u0: ['#FF6B5B', '#E5484D', '#FF4D7D', '#D93B2B', '#FF5A36', '#C2410C'], u1: ['#FF9F2E', '#FFB547', '#F5C542', '#FF8A65', '#E07B00', '#D97706'], u2: ['#5A5D67', '#8B8B94', '#4A5A78', '#3E6B5A', '#6B7280', '#A1A1AA'],
  st: ['#12805A', '#A15F00', '#B4452A', '#2D5BBA', '#7C4DDB', '#0E7490'], bd: ['#6EE7B7', '#FFB547', '#FF8A65', '#8AB4FF', '#B98CFF', '#FFFFFF'],
  rc: ['#FFB547', '#FF9F2E', '#5CC8FF', '#B98CFF', '#6EE7B7', '#F5C542'], bg: ['#17130C', '#1C130A', '#0C1720', '#160F22', '#121A16', '#15161C'], bgl: ['#FFF4E0', '#FFEBD6', '#E3F3FC', '#F1E9FF', '#E9F7F0', '#FFFFFF'], tx: ['#F4F4F5', '#FFD08A', '#A8E1FF', '#D6C2FF', '#C9F7E3', '#15161C']
};
function swatches(path, cur, list) {
  return `<div class="row" style="gap:8px;flex-wrap:wrap">${list.map((c) => `<button class="swu" data-act="lk" data-p="${path}" data-c="${c}" aria-label="${c}" aria-pressed="${cur === c}" style="background:${c};${cur === c ? 'box-shadow:0 0 0 2px var(--s1),0 0 0 5px var(--tx)' : ''}">${cur === c ? icon.tick : ''}</button>`).join('')}
    <label class="swu" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);position:relative;overflow:hidden" aria-label="Otro color"><input type="color" value="${cur}" data-lk="${path}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer"></label></div>`;
}
const colorRow = (name, path, cur, list, warn = '') => `<div style="display:flex;flex-direction:column;gap:8px"><div class="row" style="gap:10px"><i style="width:14px;height:14px;border-radius:4px;background:${cur};border:1px solid var(--line2)"></i><b class="small" style="flex:1;font-size:13px">${name}</b><span class="muted mono">${cur}</span></div>${swatches(path, cur, list)}${warn}</div>`;
const rangeRow = (name, path, cur) => `<label style="display:flex;flex-direction:column;gap:6px"><span class="row" style="gap:10px"><b class="small" style="flex:1;font-size:13px">${name}</b><b class="num">${cur} %</b></span><input type="range" min="0" max="100" step="1" value="${cur}" data-lk="${path}" data-num="1" style="width:100%;accent-color:var(--amber)"></label>`;
const warnLow = (fg, bg, op = 100) => { const r = contrast(fg, op < 100 ? over(bg, theme() === 'light' ? '#FFFFFF' : '#15161C', op) : bg); return r < 3 ? `<p class="small" style="margin:0;color:var(--u1);font-weight:600">Se lee con dificultad (contraste ${r.toFixed(1)}). Puedes guardarlo igual.</p>` : ''; };
function vAdminLook() {
  const mode = (ui.lk && ui.lk.mode) || theme();
  const saved = st.settings().look || {};
  const edit = (ui.lk && ui.lk.data) || {};
  const L = Object.assign(lookFor(mode, saved), JSON.parse(JSON.stringify(edit[mode] || {})));
  const sec = (ui.lk && ui.lk.sec) || 'main';
  const stage = (ui.lk && ui.lk.stage) || 'Pre';
  const changed = Object.keys(edit).some((m) => Object.keys(edit[m] || {}).length);
  const isL = mode === 'light';
  const surf = isL ? '#FFFFFF' : '#15161C';
  let html = `${backTo('#/admin', 'Administrador')}<div><h1 style="font-size:28px">Apariencia</h1><p class="sub">Para los dos celulares. Noche y día se guardan por separado.</p></div>`;
  html += `<div class="seg">${[['dark', 'Noche'], ['light', 'Día']].map(([k, t]) => `<button class="${mode === k ? 'on' : ''}" data-act="lkMode" data-k="${k}">${t}</button>`).join('')}</div>`;
  // Vista previa en vivo
  const lvP = L.r3;
  const tileP = (K, ic, on) => `<span class="stile" style="min-height:70px;border-radius:16px;cursor:default;background:${over(L['st' + K], surf, on ? L.stOn : L.stOff)};border-color:${over(L['bd' + K], surf, L.bdOp)};color:${on ? L.fgOn : (isL ? '#15161C' : '#F4F4F5')}">${ic(on ? L.fgOn : L['bd' + K], 20)}<span style="font-size:10px">${{ Pre: 'Preproducción', Rod: 'Rodaje', Post: 'Posproducción' }[K]}</span></span>`;
  html += `<section class="card" style="gap:12px;background:${isL ? '#F6F5F2' : '#0B0C10'}"><p class="lbl">Vista previa · ${mode === 'dark' ? 'noche' : 'día'}</p>
    <div class="racha" style="background:${lvP[0]};border-color:${lvP[1]};padding:12px 14px"><div class="rfire" style="width:60px;height:70px">${icon.flame(lvP[2], 44)}</div><div class="rtx"><p class="lbl" style="color:${lvP[3]}">Tu racha</p><b class="num" style="font-size:32px;line-height:1;color:${lvP[3]}">15</b><span class="rlv" style="--lvc:${lvP[2]};--lvt:${lvP[3]};--lvchip:${over(lvP[2], lvP[0], 18)}">Nivel 3 · Responsable</span></div></div>
    <div class="dsqs">${[['HOY', 'u0'], ['DOM', 'u1'], ['LUN', 'u2'], ['MAR', null]].map(([d, k], i) => `<div class="dsq ${k ? '' : 'd-none'} ${i === 0 ? 'on' : ''}" style="${k ? `--uc:${L[k]}` : ''}"><span class="dw">${d}</span><b class="num">${i + 1}</b></div>`).join('')}</div>
    <div class="stiles">${tileP('Pre', icon.pen, stage === 'Pre')}${tileP('Rod', icon.cam, stage === 'Rod')}${tileP('Post', icon.cut, stage === 'Post')}</div>
    <div class="grid2"><div style="border-radius:16px;padding:12px;background:${L.meta[0]};border:1px solid ${L.meta[1]}"><p class="lbl" style="color:${L.meta[2]}">Meta del equipo</p><b class="num" style="font-size:24px;color:${isL ? '#15161C' : '#F4F4F5'}">56%</b><div style="height:8px;border-radius:9px;background:${L.meta[3]};margin-top:6px"><div style="width:56%;height:100%;border-radius:9px;background:${L.meta[2]}"></div></div></div>
      <div style="border-radius:16px;padding:12px;background:${L.wallet[0]};border:1px solid ${L.wallet[1]}"><p class="lbl" style="color:${L.wallet[2]}">En la billetera</p><b class="num" style="font-size:24px;color:${L.wallet[3]}">S/ 156.25</b></div></div>
    <span class="hb" style="min-height:44px;background:${over(L.main, surf, 18)};border:1px solid ${over(L.main, surf, 45)};color:${L.main};font-size:14px">Botón principal</span></section>`;
  const SECS = [['main', 'Principal'], ['etapas', 'Etapas'], ['urg', 'Urgencia'], ['racha', 'Racha'], ['meta', 'Meta del equipo'], ['wallet', 'Billetera']];
  html += `<div class="row" style="gap:6px;flex-wrap:wrap">${SECS.map(([k, t]) => `<button class="btn sm ${sec === k ? 'x-amber' : 'b-ghost'}" data-act="lkSec" data-k="${k}">${t}</button>`).join('')}</div>`;
  let body = '';
  if (sec === 'main') body = colorRow('Color principal', 'main', L.main, SUG.main, warnLow(L.main, surf));
  if (sec === 'urg') body = [['u0', 'Urgente · vence hoy o ya venció'], ['u1', 'Próximo · 1 o 2 días'], ['u2', 'Con tiempo · 3 días o más']].map(([k, n]) => colorRow(n, k, L[k], SUG[k])).join('');
  if (sec === 'etapas') {
    body = `<div class="seg">${[['Pre', 'Preproducción'], ['Rod', 'Rodaje'], ['Post', 'Posproducción']].map(([k, t]) => `<button class="${stage === k ? 'on' : ''}" data-act="lkStage" data-k="${k}">${t}</button>`).join('')}</div>`
      + colorRow('Fondo', 'st' + stage, L['st' + stage], SUG.st, warnLow(L.fgOn, L['st' + stage], L.stOn))
      + rangeRow('Opacidad · elegida', 'stOn', L.stOn) + rangeRow('Opacidad · sin elegir', 'stOff', L.stOff)
      + colorRow('Borde e ícono sin elegir', 'bd' + stage, L['bd' + stage], SUG.bd) + rangeRow('Opacidad del borde', 'bdOp', L.bdOp)
      + colorRow('Ícono y texto · elegida', 'fgOn', L.fgOn, ['#FFFFFF', '#F4F4F5', '#15161C', '#FFF1C2', '#C9F7E3', '#DCE6FF']);
  }
  if (sec === 'racha') {
    const ln = (ui.lk && ui.lk.lv) || 3;
    const r = L['r' + ln];
    body = `<div class="seg">${['Cumplidor', 'Constante', 'Responsable', 'Imparable'].map((t, i) => `<button class="${ln === i + 1 ? 'on' : ''}" data-act="lkLv" data-k="${i + 1}">${t}</button>`).join('')}</div>`
      + colorRow('Fondo', `r${ln}.0`, r[0], isL ? SUG.bgl : SUG.bg) + colorRow('Borde', `r${ln}.1`, r[1], SUG.bd)
      + colorRow('Llama, insignia y barra', `r${ln}.2`, r[2], SUG.rc) + colorRow('Número de puntos', `r${ln}.3`, r[3], SUG.tx, warnLow(r[3], r[0]));
  }
  if (sec === 'meta') body = colorRow('Fondo', 'meta.0', L.meta[0], isL ? SUG.bgl : SUG.bg) + colorRow('Borde', 'meta.1', L.meta[1], SUG.bd) + colorRow('Barra y título', 'meta.2', L.meta[2], SUG.rc, warnLow(L.meta[2], L.meta[0])) + colorRow('Fondo de la barra', 'meta.3', L.meta[3], isL ? SUG.bgl : SUG.bg);
  if (sec === 'wallet') body = colorRow('Fondo', 'wallet.0', L.wallet[0], isL ? SUG.bgl : SUG.bg) + colorRow('Borde', 'wallet.1', L.wallet[1], SUG.bd) + colorRow('Título', 'wallet.2', L.wallet[2], SUG.rc, warnLow(L.wallet[2], L.wallet[0])) + colorRow('Monto', 'wallet.3', L.wallet[3], SUG.tx, warnLow(L.wallet[3], L.wallet[0]));
  html += `<section class="card" style="gap:16px">${body}</section>`;
  html += `<div class="row" style="gap:10px"><button class="btn b-ghost" style="flex:1" data-act="lkReset">Restaurar</button><button class="btn x-amber" style="flex:2" data-act="lookSave" ${changed ? '' : 'disabled'}>Guardar para los dos</button></div><p class="muted" style="margin:-6px 0 0;text-align:center">Restaurar vuelve esta sección (${mode === 'dark' ? 'noche' : 'día'}) a los colores de fábrica. Queda en el historial.</p>`;
  return html;
}
function lkSet(path, val) {
  const mode = (ui.lk && ui.lk.mode) || theme();
  ui.lk = Object.assign({ mode }, ui.lk || {}, { mode });
  ui.lk.data = Object.assign({}, ui.lk.data || {});
  const cur = Object.assign(lookFor(mode), JSON.parse(JSON.stringify(ui.lk.data[mode] || {})));
  const m = Object.assign({}, ui.lk.data[mode] || {});
  const [k, i] = path.split('.');
  if (i != null) { const arr = (m[k] || cur[k]).slice(); arr[Number(i)] = val; m[k] = arr; } else m[k] = val;
  ui.lk.data[mode] = m;
}

function vAdminRules() {
  const base = Object.assign({}, R.DEFAULT_RULES, st.settings().rules || {});
  const cur = Object.assign({}, base, ui.rules || {});
  const pend = st.pendingProposal('rules');
  let changes = 0;
  let html = `${backTo('#/admin', 'Administrador')}<div><h1 style="font-size:28px">Reglas de registro</h1><p class="sub">Son parte del acuerdo: cambias los valores y los propones. Se aplican cuando tu socio los aprueba.</p></div>`;
  if (pend) html += `<section class="pendbox row" style="flex-direction:row;align-items:center"><span style="flex:1;min-width:0"><b class="small" style="color:#C9D8FF">Propuesta esperando a tu socio</b><br><span class="muted">${propSummary(pend)}</span></span><button class="btn sm b-ghost" data-act="propWithdraw" data-id="${pend.id}">Retirar</button></section>`;
  for (const [g, items] of RULE_DEF) {
    html += `<div><p class="lbl alb">${g}</p><div class="agrp">${items.map(([k, name, sub, step, min, max, fmt]) => {
      const ch = cur[k] !== base[k]; if (ch) changes++;
      return `<div class="srow${ch ? ' ch' : ''}"><span class="ttx"><b>${name}</b><span>${ch ? 'Antes: ' + fmt(base[k]) + ' · ' : ''}${sub}</span></span><button class="sb" data-act="ruleStep" data-k="${k}" data-d="${-step}" data-min="${min}" data-max="${max}" aria-label="Menos">−</button><b class="num sval">${fmt(cur[k])}</b><button class="sb" data-act="ruleStep" data-k="${k}" data-d="${step}" data-min="${min}" data-max="${max}" aria-label="Más">+</button></div>`;
    }).join('')}</div></div>`;
  }
  html += `<div><p class="lbl alb">Siempre activo</p><div class="agrp"><div class="srow"><span class="tic tint-pre">${icon.check}</span><span class="ttx"><b>Tú confirmas la llegada de tu socio</b><span>Si no asistes, su llegada vale sola. Las tareas se marcan en orden y con la hora del servidor.</span></span></div></div></div>`;
  if (changes) html += `<div class="propbar"><span style="flex:1;min-width:0"><b>${changes} ${changes === 1 ? 'cambio' : 'cambios'} por proponer</b><br><span class="muted">Hasta que tu socio apruebe, siguen las reglas actuales.</span></span><button class="btn sm b-ghost" data-act="rulesDiscard">Descartar</button><button class="btn sm b-blue" data-act="rulesPropose" ${pend ? 'disabled' : ''}>Proponer</button></div><div style="height:70px"></div>`;
  return html;
}
function vAdminPct() {
  const base = Object.assign({}, R.DEFAULT_PCT, st.settings().pct || {});
  const cur = Object.assign({}, base, ui.pct || {});
  const sum = cur.pre + cur.rod + cur.mon + cur.aca;
  const changed = Object.keys(base).some((k) => base[k] !== cur[k]);
  const pend = st.pendingProposal('pct');
  const p = st.project();
  const V = p ? p.budget / p.videos_total : 62.5;
  const ok = sum === 100;
  const COLS = { pre: 'var(--c-pre)', rod: 'var(--c-prod)', mon: 'var(--c-post)', aca: '#B98CFF' };
  let html = `${backTo('#/admin', 'Administrador')}<div><h1 style="font-size:28px">Porcentajes del acuerdo</h1><p class="sub">Cuánto del valor de cada video se paga por etapa (cláusula cuarta). Tienen que sumar 100 %.</p></div>`;
  if (pend) html += `<section class="pendbox row" style="flex-direction:row;align-items:center"><span style="flex:1;min-width:0"><b class="small" style="color:#C9D8FF">Propuesta esperando a tu socio</b><br><span class="muted">${propSummary(pend)}</span></span><button class="btn sm b-ghost" data-act="propWithdraw" data-id="${pend.id}">Retirar</button></section>`;
  html += `<section class="card" style="gap:12px"><div class="between"><p class="lbl">Un video${p ? ' de ' + esc(p.client) + ' · ' + esc(p.name) : ''}</p><b class="num">${R.money(V)}</b></div>
    <div class="pbar">${PCT_DEF.map(([k]) => `<i style="width:${cur[k] / Math.max(sum, 100) * 100}%;background:${COLS[k]}"></i>`).join('')}</div>
    <div class="between"><b class="small" style="color:${ok ? 'var(--mint)' : 'var(--u0)'}">Suma: ${sum} %</b><span class="small" style="color:${ok ? 'var(--mint)' : 'var(--u0)'}">${ok ? 'Cuadra con el valor del video' : sum > 100 ? 'Sobran ' + (sum - 100) + ' %' : 'Faltan ' + (100 - sum) + ' %'}</span></div></section>`;
  html += `<div class="agrp">${PCT_DEF.map(([k, name, ic]) => {
    const ch = cur[k] !== base[k];
    const extra = k === 'pre' ? `guion y storyboard · ${R.money(V * cur[k] / 200)} c/u` : k === 'rod' ? 'por video grabado' : k === 'mon' ? 'edición del video' : 'acabado y entrega';
    return `<div class="srow${ch ? ' ch' : ''}"><span class="tic tint-${ic}">${stageIc(ic)}</span><span class="ttx"><b>${name}</b><span>${R.money(V * cur[k] / 100)} · ${extra}${ch ? ' · antes ' + base[k] + ' %' : ''}</span></span><button class="sb" data-act="pctStep" data-k="${k}" data-d="-1" aria-label="Menos">−</button><b class="num sval" style="min-width:48px">${cur[k]}%</b><button class="sb" data-act="pctStep" data-k="${k}" data-d="1" aria-label="Más">+</button></div>`;
  }).join('')}</div>`;
  html += `<p class="muted" style="margin:0 4px;line-height:1.45">Si tu socio aprueba, se aplica desde el próximo proyecto. El proyecto en curso sigue con lo que firmaron.</p>`;
  html += `<div class="row" style="gap:10px"><button class="btn b-ghost" style="flex:1" data-act="pctReset">Volver al acuerdo</button><button class="btn b-blue" style="flex:2" data-act="pctPropose" ${ok && changed && !pend ? '' : 'disabled'}>Proponer a tu socio</button></div>`;
  return html;
}
function vAdminRem() {
  const rem = Object.assign({}, st.settings().reminders || {}, ui.rem || {});
  const on = (k) => rem[k] !== false;
  const TINT = { pre: 'pre', prod: 'prod', post: 'post', team: 'blue' };
  const IC = { pre: stageIc('pre'), prod: stageIc('prod'), post: stageIc('post'), team: icon.users };
  let n = 0;
  let html = `${backTo('#/admin', 'Administrador')}<div><h1 style="font-size:28px">Recordatorios automáticos</h1><p class="sub">Llegan al celular de quien le toca. Tú decides cuáles se envían.</p></div>`;
  html += banner('wait', 'Llegan en la próxima actualización', 'Ya puedes dejarlos configurados. Para enviarlos al celular falta activar las notificaciones en el servidor; cuando esté listo, la app te pedirá permiso.');
  for (const [g, items] of REM_DEF) {
    html += `<div><p class="lbl alb">${g}</p><div class="agrp">${items.map(([k, ic, name, when, who]) => { const o = on(k); if (o) n++; return `<div class="srow"><span class="tic tint-${TINT[ic]}${o ? '' : ' dimmed'}">${IC[ic]}</span><span class="ttx"><b${o ? '' : ' class="dim"'}>${name}</b><span>${when}</span><span style="font-size:11px;color:var(--tx4)">${who}</span></span><button class="sw ${o ? 'on' : ''}" role="switch" aria-checked="${o}" aria-label="${name}" data-act="remToggle" data-k="${k}"><i></i></button></div>`; }).join('')}</div></div>`;
  }
  const rest = rem.rest !== false;
  html += `<div><p class="lbl alb">Horario de descanso</p><div class="agrp"><div class="srow"><span class="tic tint-lab">${icon.moon}</span><span class="ttx"><b>No molestar de 22:00 a 7:00</b><span>Lo que caiga en ese horario se envía a las 7:00. Lo urgente del mismo día sí llega.</span></span><button class="sw ${rest ? 'on lab' : ''}" role="switch" aria-checked="${rest}" aria-label="Horario de descanso" data-act="remToggle" data-k="rest"><i></i></button></div></div></div>`;
  if (ui.rem && Object.keys(ui.rem).length) html += `<button class="btn b-amber" data-act="remSave">Guardar recordatorios</button>`;
  return html;
}
function vAdminPractice() {
  const on = st.practice();
  const P = [['Un proyecto de ejemplo ya armado', 'Con videos repartidos, un rodaje próximo y tareas por vencer.'], ['Ver como administrador o como socio', 'Cambias de vista con un toque para ver lo que le aparece a cada uno.'], ['Marca, toma, deshaz y avisa', 'Todo funciona igual que en la app real, con las mismas reglas.'], ['Una franja violeta te lo recuerda', 'Mientras estés en práctica la verás arriba en todas las pantallas.']];
  let html = `${backTo('#/admin', 'Administrador')}<div style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:4px 0"><span class="tic tint-lab" style="width:72px;height:72px;border-radius:22px">${icon.flask.replace('width="19" height="19"', 'width="34" height="34"')}</span><h1 style="font-size:28px">Modo práctica</h1><p class="sub" style="font-size:14px">Prueba todo con un proyecto de ejemplo antes de usarlo de verdad. Lo que marques aquí no llega a la base real, ni al historial, ni a la billetera.</p></div>`;
  html += `<section class="tlist" style="padding:6px 14px">${P.map(([t, d], i) => `<div class="trow" style="align-items:flex-start"><span class="tipn lab">${i + 1}</span><span class="ttx"><b>${t}</b><span>${d}</span></span></div>`).join('')}</section>`;
  html += on ? `<div class="row" style="gap:10px"><button class="btn b-ghost" style="flex:1" data-act="demoReset">Reiniciar ejemplo</button><button class="btn" style="flex:1;background:var(--tx);color:var(--bg)" data-act="practiceOff">Salir</button></div>` : `<button class="btn b-purple" data-act="practiceOn">Entrar al modo práctica</button>`;
  html += `<p class="muted" style="margin:-6px 0 0;text-align:center">Solo cambia este celular. Tu socio sigue viendo los datos reales.</p>`;
  return html;
}
function vProposal(id) {
  const p = st.proposals().find((x) => x.id === id);
  if (!p) return `${backTo('#/', 'Inicio')}<p class="empty">Propuesta no encontrada.</p>`;
  const me = S.me;
  const who = st.member(p.proposed_by);
  const old = p.old || {};
  let rows = '';
  if (p.kind === 'pct') {
    const was = Object.assign({}, R.DEFAULT_PCT, old);
    rows = PCT_DEF.map(([k, n, ic]) => `<div class="srow${was[k] !== p.data[k] ? ' ch' : ''}"><span class="tic tint-${ic}">${stageIc(ic)}</span><span class="ttx"><b>${n}</b><span>Antes ${was[k]} %</span></span><b class="num sval">${p.data[k]} %</b></div>`).join('');
  } else {
    const all = RULE_DEF.flatMap((g) => g[1]).concat(ENT_DEF);
    rows = Object.entries(p.data).map(([k, v]) => {
      if (k === 'cli') { const was = old.cli || {}; return `<div class="srow ch"><span class="ttx"><b>Días de apoyo por cliente</b><span>Antes: ${Object.entries(was).map(([cl, d]) => esc(cl) + ' ' + d + ' días').join(', ') || 'los del equipo'}</span></span><b class="num sval" style="font-size:13px">${Object.entries(v || {}).map(([cl, d]) => esc(cl) + ' ' + d + ' días').join('<br>') || 'Los del equipo'}</b></div>`; }
      const d = all.find((x) => x[0] === k); if (!d) return ''; const was = old[k] != null ? old[k] : R.DEFAULT_RULES[k]; return `<div class="srow ch"><span class="ttx"><b>${d[1]}</b><span>Antes: ${d[6](was)} · ${d[2]}</span></span><b class="num sval">${d[6](v)}</b></div>`; }).join('');
  }
  const status = { pendiente: ['Pendiente', 'next'], aprobada: ['Aprobada', 'done'], rechazada: ['Rechazada', 'past'], retirada: ['Retirada', 'past'] }[p.status];
  let html = `${backTo('#/', 'Inicio')}<div><div class="between" style="align-items:center"><p class="lbl">Propuesta de ${esc(who.name)}</p><span class="gchip g-${status[1]}">${status[0]}</span></div><h1 style="font-size:26px">${p.kind === 'pct' ? 'Porcentajes del acuerdo' : Object.keys(p.data).every((k) => ENT_DEF.some((x) => x[0] === k) || k === 'cli') ? 'Entregas al límite' : 'Reglas de registro'}</h1><p class="sub">${R.fmtWhen(p.created_at)}${p.kind === 'pct' ? ' · si la apruebas, rige desde el próximo proyecto' : ' · si la apruebas, se aplica desde ahora'}</p></div>`;
  html += `<div class="agrp">${rows}</div>`;
  if (p.status === 'pendiente' && p.proposed_by !== me.id) html += `<div class="row" style="gap:10px"><button class="btn b-ghost" style="flex:1" data-act="propDecide" data-id="${p.id}" data-s="rechazada">Rechazar</button><button class="btn b-mint" style="flex:2" data-act="propDecide" data-id="${p.id}" data-s="aprobada">Aprobar</button></div><p class="muted" style="margin:-6px 0 0;text-align:center">Queda registrado en el historial con fecha y hora.</p>`;
  else if (p.status === 'pendiente') html += `<button class="btn b-ghost" data-act="propWithdraw" data-id="${p.id}">Retirar propuesta</button>`;
  else if (p.decided_by) html += banner(p.status === 'aprobada' ? 'ok' : 'wait', `${status[0]} por ${esc(st.member(p.decided_by).name)}`, R.fmtWhen(p.decided_at));
  return html;
}

// ==================================================================
// Hojas (formularios emergentes)
// ==================================================================
function openSheet(html) { sheetHtml = html; render(); }
function closeSheet() { sheetHtml = null; render(); }

function sheetMark(v, k, hireId) {
  const h = hireId ? S.data.hires.find((x) => x.id === hireId) : null;
  const val = R.rates(projOf(v.project_id))[k];
  const cm = R.canMark(v, k, S.me, st.ctx(v.project_id), new Date(), { hire: h });
  return `<form data-form="mark" class="" style="display:contents"><input type="hidden" name="v" value="${v.id}"><input type="hidden" name="k" value="${k}"><input type="hidden" name="h" value="${hireId || ''}">
  <h2>${R.KIND_LABEL[k]} · video ${v.num}</h2>
  ${h ? `<div class="banner bn-fm"><div><b>Con Guillermo · contratado por ${esc(st.member(h.hired_by).name)}</b><p>Quedará como "Hecho por Guillermo". Recibes ${R.money(val * 0.8)} (80 %) y ${R.money(val * 0.2)} siguen siendo de ${esc(st.member(h.hired_by).name)}. No suma ni resta racha.</p></div></div>` : ''}
  ${cm.claimed ? banner('wait', `Entregas lo que tomaste de ${esc(st.member(v.owner).name)}`, `Cobras ${R.money(val)} y sumas +${R.PTS.rescue} puntos de rescate.`) : ''}
  ${cm.late ? banner('warn', 'Fuera de plazo', 'Se paga igual, pero resta 3 puntos de racha.') : ''}
  ${cm.apoyo ? banner('wait', 'Acabado de apoyo (5.5)', `Si el montaje llegó a tiempo, el pago es de ${esc(st.member(v.owner).name)}.`) : ''}
  <p class="sub" style="margin:0">Queda registrado con la hora de ahora: ${R.fmtWhen(new Date())}.</p>
  <label class="field"><span>Enlace (opcional): Drive, Docs o WhatsApp</span><input class="in" name="link" type="url" placeholder="https://"></label>
  <button class="btn b-amber">Marcar como hecho</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`;
}

function sheetNotice(e, fmOnly) {
  const now = new Date();
  const dl = R.noticeDeadline(e);
  const onTime = now <= dl;
  const isR = e.kind === 'rodaje';
  const text = onTime
    ? (isR ? 'Avisar a tiempo no resta racha. Tu compañero puede reprogramar el día o grabar solo sus videos; los tuyos no los toma sin tu permiso.' : 'Avisar a tiempo no resta racha.')
    : (isR ? 'Tu compañero decide: reprogramar el día (los gastos extra van por tu cuenta) o tomar el día completo y cobrar esos rodajes. Resta 3 puntos.' : 'Fuera de plazo resta 3 puntos.');
  return `<form data-form="notice" style="display:contents"><input type="hidden" name="e" value="${e.id}">
  <h2>${fmOnly ? 'Fue fuerza mayor' : 'No podré ir'}</h2>
  ${fmOnly ? '' : `<div class="banner ${onTime ? 'bn-ok' : 'bn-warn'}"><div><b>${onTime ? `A tiempo · hasta ${R.fmtWhen(dl)}` : `Fuera de plazo · venció ${R.fmtWhen(dl)}`}</b><p>${text}</p></div></div>`}
  <p class="lbl">Motivo</p>
  <label class="opt" data-pick="reason"><input type="radio" name="reason" value="normal" ${fmOnly ? '' : 'checked'} class="hide"><span class="rd"></span><span><b>Otro compromiso</b><br><span class="muted">Trabajo, viaje, algo personal.</span></span></label>
  <label class="opt" data-pick="reason"><input type="radio" name="reason" value="fm" ${fmOnly ? 'checked' : ''} class="hide"><span class="rd"></span><span><b>Fuerza mayor</b><br><span class="muted">Salud, accidente, familiar u otra situación grave (7.4). No das detalles privados; tu compañero la acepta.</span></span></label>
  <label class="field"><span>Tipo de fuerza mayor (si aplica)</span><select class="in" name="fm_kind"><option>Salud</option><option>Accidente</option><option>Familiar</option><option>Otra grave</option></select></label>
  ${isR ? `<p class="lbl">Tus videos de este rodaje</p>
  <label class="opt" data-pick="choice"><input type="radio" name="choice" value="repro" checked class="hide"><span class="rd"></span><span><b>Reprogramar el día</b><br><span class="muted">Siguen siendo tuyos y conservan su valor.</span></span></label>
  <label class="opt" data-pick="choice"><input type="radio" name="choice" value="other" class="hide"><span class="rd"></span><span><b>Que los grabe mi compañero</b><br><span class="muted">El pago de rodaje pasa a quien graba (5.4).</span></span></label>` : ''}
  <button class="btn b-blue">Enviar aviso</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`;
}

const dateTimeSheet = (form, title, text, hidden, d, t, btn) => `<form data-form="${form}" style="display:contents">${Object.entries(hidden).map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`).join('')}<h2>${title}</h2>${text ? `<p class="sub" style="margin:0">${text}</p>` : ''}
  <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="d" required value="${d}"></label><label class="field"><span>Hora</span><input class="in" type="time" name="t" required value="${t}"></label></div>
  ${form === 'reday' || form === 'cancelEv' ? '<label class="field"><span>Nota (opcional)</span><input class="in" name="note" placeholder="Ej.: lluvia, locación cerrada"></label>' : ''}
  <button class="btn b-amber">${btn}</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`;

// ==================================================================
// Animaciones: +S/ al marcar y −S/ al deshacer
// ==================================================================
function fly(rect, text, down) {
  const d = document.createElement('div');
  d.className = 'fly' + (down ? ' fly-down' : '');
  d.textContent = text;
  d.style.left = (rect.left + rect.width / 2) + 'px';
  d.style.top = (rect.top - 6) + 'px';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1500);
}
function centerRect() { return { left: window.innerWidth / 2 - 10, top: window.innerHeight / 2, width: 20 }; }
function showUndo(task, amt, text) {
  if (!task || !task.id) return;
  ui.undo = { id: task.id, amt, text, until: Date.now() + 8000 };
  ui.bump = Date.now();
  render();
  setTimeout(() => { if (ui.undo && ui.undo.id === task.id && Date.now() >= ui.undo.until - 50) { ui.undo = null; render(); } }, 8000);
}
function animateWallet() {
  const el = document.querySelector('[data-wallet]');
  if (!el) return;
  const to = Number(el.dataset.wallet), from = Number(el.dataset.from);
  if (Math.abs(to - from) < 0.005) { el.textContent = R.money(to); return; }
  if (from > to) el.classList.add('down'); else el.classList.add('up');
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 1100); const e = 1 - Math.pow(1 - k, 3); el.textContent = R.money(from + (to - from) * e); if (k < 1 && document.body.contains(el)) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function animateCounts() {
  if (!ui.wantAnim || ui.wantAnim === ui.animKey) return;
  ui.animKey = ui.wantAnim;
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 1300); const e = 1 - Math.pow(1 - k, 3); el.textContent = R.money(target * e); if (k < 1 && document.body.contains(el)) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

// ==================================================================
// Render y eventos
// ==================================================================
function render() {
  if (!S.ready) return;
  applyLook();
  const r = location.hash.replace(/^#\/?/, '').split('/');
  let html;
  ui.wantAnim = null;
  if (!S.session) html = vLogin(r[0] === 'i' ? r[1] : null);
  else if (!S.teamId || !S.me) html = vNoTeam(r[0] === 'i' ? r[1] : ui.inviteCode);
  else if (r[0] === 'i' && r[1]) html = S.me.role === 'colaborador' ? colabLayout(vAccept(r[1])) : layout('home', vAccept(r[1]));
  else if (S.me.role === 'colaborador') html = colabLayout(vColab());
  else {
    const map = { admin: ['', () => vAdmin(r[1])], propuesta: ['home', () => vProposal(r[1])], '': ['home', vHome], videos: ['vids', vEtapas], rodajes: ['vids', vRodajesPasados], semana: ['vids', () => vWeek(r[1])], v: ['vids', () => vVideo(r[1])], e: ['vids', () => vEvent(r[1])], resumen: ['sum', vSummary], cierre: ['sum', vClose], historial: ['hist', vHistory], equipo: ['', vTeam], proyecto: ['', vNewProject], encargo: ['', () => (r[1] || '').split('?')[0] === 'nuevo' ? vJobNew(Object.fromEntries(new URLSearchParams((r[1] || '').split('?')[1] || ''))) : vJob(r[1])] };
    const [tab, fn] = map[r[0]] || map[''];
    html = layout(tab, fn());
  }
  if (sheetHtml) html += `<div class="sheet" data-act="closeBg"><div>${sheetHtml}</div></div>`;
  if (ui.rpop) html += rachaPop(ui.rpop);
  const u = ui.undo && Date.now() < ui.undo.until && !(S.toast && S.toast.kind === 'bad') ? ui.undo : null;
  const toastHtml = u ? `<div class="t-ok undo"><span>${u.text ? esc(u.text) : 'Registrado'}</span><button data-act="undoQuick">Deshacer</button></div>` : S.toast ? `<div class="t-${S.toast.kind}">${esc(S.toast.msg)}</div>` : '';
  if ($toast.innerHTML !== toastHtml) $toast.innerHTML = toastHtml;
  // 1.3: no volver a dibujar si nada cambió, y las animaciones de entrada solo la primera vez
  // que se abre una pantalla (si no, las tarjetas "parpadean" en cada actualización).
  if (html === ui.lastHtml) return;
  const key = r.join('/') + '|' + (S.me ? S.me.id : '') + '|' + (sheetHtml ? 's' : '');
  if (key === ui.lastKey) $app.setAttribute('data-settled', ''); else $app.removeAttribute('data-settled');
  ui.lastKey = key; ui.lastHtml = html;
  $app.innerHTML = html;
  syncOpts();
  syncOwn();
  animateCounts();
  animateWallet();
  animatePop();
  if (r[0] !== 'resumen') ui.animKey = null;
}

function syncOwn() {
  document.querySelectorAll('label.own').forEach((l) => { const i = l.querySelector('input'); l.classList.toggle('on-' + l.dataset.k, !!(i && i.checked)); });
  document.querySelectorAll('[data-owncount] [data-n]').forEach((b) => { b.textContent = document.querySelectorAll(`label.own input[value="${b.dataset.n}"]:checked`).length; });
}
function syncOpts() {
  document.querySelectorAll('label.opt').forEach((l) => { const i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
}
const evById = (id) => S.data.events.find((x) => x.id === id);

const ACT = {
  close: closeSheet,
  closeBg: (el, e) => { if (e.target === el) closeSheet(); },
  pickProject: () => openSheet(`<h2>Proyectos</h2>${S.data.projects.filter((p) => p.status !== 'archivado').slice().reverse().map((p) => `<button class="btn ${p.id === S.projectId ? 'b-amber' : 'b-ghost'}" data-act="openProject" data-id="${p.id}">${esc(p.client)} · ${esc(p.name)}${p.status === 'cerrado' ? ' (cerrado)' : ''}</button>`).join('') || '<p class="empty">Sin proyectos.</p>'}${isAdminBtn('<a class="btn b-ghost" href="#/proyecto/nuevo" data-act="close">+ Nuevo proyecto</a>')}<a class="btn b-ghost" href="#/equipo" data-act="close">Archivados y ajustes</a>`),
  openProject: (el) => { st.switchProject(el.dataset.id); sheetHtml = null; location.hash = '#/'; render(); },
  team: (el) => st.switchTeam(el.dataset.id),
  allPend: () => { ui.allPend = !ui.allPend; render(); },
  day: (el) => { ui.day = Number(el.dataset.i); render(); },
  theme: () => { try { localStorage.setItem('ra-theme', theme() === 'light' ? 'dark' : 'light'); } catch (e) { /* */ } render(); },
  title: async (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); const t = prompt('Tema del video (por ejemplo: "Ansiedad en el trabajo"):', v.title || ''); if (t !== null) await st.setTitle(v, t); },
  lk: (el) => { lkSet(el.dataset.p, el.dataset.c); render(); },
  lkMode: (el) => { ui.lk = Object.assign({}, ui.lk || {}, { mode: el.dataset.k }); render(); },
  lkSec: (el) => { ui.lk = Object.assign({ mode: theme() }, ui.lk || {}, { sec: el.dataset.k }); render(); },
  lkStage: (el) => { ui.lk = Object.assign({ mode: theme() }, ui.lk || {}, { stage: el.dataset.k }); render(); },
  lkLv: (el) => { ui.lk = Object.assign({ mode: theme() }, ui.lk || {}, { lv: Number(el.dataset.k) }); render(); },
  lkReset: () => {
    const mode = (ui.lk && ui.lk.mode) || theme(); const sec = (ui.lk && ui.lk.sec) || 'main';
    const keys = { main: ['main'], urg: ['u0', 'u1', 'u2'], etapas: ['stPre', 'stRod', 'stPost', 'bdPre', 'bdRod', 'bdPost', 'stOn', 'stOff', 'bdOp', 'fgOn'], racha: ['r1', 'r2', 'r3', 'r4'], meta: ['meta'], wallet: ['wallet'] }[sec];
    keys.forEach((k) => lkSet(k, JSON.parse(JSON.stringify(LOOK_DEF[mode][k])))); render();
  },
  lookSave: async () => {
    const saved = JSON.parse(JSON.stringify(st.settings().look || {}));
    const edit = (ui.lk && ui.lk.data) || {};
    for (const m of ['dark', 'light']) if (edit[m]) saved[m] = Object.assign({}, saved[m] || {}, edit[m]);
    if (saved.dark) ['main', 'u0', 'u1', 'u2'].forEach((k) => { if (saved.dark[k]) saved[k] = saved.dark[k]; });
    await st.saveLook(saved); ui.lk = Object.assign({}, ui.lk || {}, { data: {} });
  },
  ruleStep: (el) => {
    const base = Object.assign({}, R.DEFAULT_RULES, st.settings().rules || {});
    ui.rules = Object.assign({}, ui.rules || {});
    const k = el.dataset.k; const cur = ui.rules[k] != null ? ui.rules[k] : base[k];
    ui.rules[k] = Math.max(Number(el.dataset.min), Math.min(Number(el.dataset.max), cur + Number(el.dataset.d)));
    if (ui.rules[k] === base[k]) delete ui.rules[k];
    render();
  },
  rulesDiscard: () => { ui.rules = null; render(); },
  rulesPropose: async () => { if (!ui.rules || !Object.keys(ui.rules).length) return; await st.propose('rules', ui.rules); ui.rules = null; },
  pctStep: (el) => {
    const base = Object.assign({}, R.DEFAULT_PCT, st.settings().pct || {});
    const cur = Object.assign({}, base, ui.pct || {});
    cur[el.dataset.k] = Math.max(0, Math.min(100, cur[el.dataset.k] + Number(el.dataset.d)));
    ui.pct = cur; render();
  },
  pctReset: () => { ui.pct = null; render(); },
  pctPropose: async () => { const base = Object.assign({}, R.DEFAULT_PCT, st.settings().pct || {}); const cur = Object.assign({}, base, ui.pct || {}); await st.propose('pct', cur); ui.pct = null; },
  remToggle: (el) => { const curAll = Object.assign({}, st.settings().reminders || {}, ui.rem || {}); ui.rem = Object.assign({}, ui.rem || {}); ui.rem[el.dataset.k] = curAll[el.dataset.k] === false; render(); },
  remSave: async () => { await st.saveReminders(Object.assign({}, st.settings().reminders || {}, ui.rem || {})); ui.rem = null; },
  propWithdraw: async (el) => { const p = st.proposals().find((x) => x.id === el.dataset.id); if (p && confirm('¿Retirar la propuesta? Tu socio ya no podrá aprobarla.')) await st.decideProposal(p, 'retirada'); },
  propDecide: async (el) => { const p = st.proposals().find((x) => x.id === el.dataset.id); if (!p) return; if (el.dataset.s === 'aprobada' && !confirm(p.kind === 'pct' ? '¿Aprobar los nuevos porcentajes? Rigen desde el próximo proyecto.' : '¿Aprobar las nuevas reglas? Se aplican desde ahora.')) return; await st.decideProposal(p, el.dataset.s); },
  stage: (el) => {
    const k = el.dataset.k;
    if (k === 'rod' && ui.stage === 'rod') { render(); return; }
    ui.stage = k;
    if (k === 'rod') { const now = new Date(); const r = weekRodaje(st.ctx(), now); if (r && now >= new Date(new Date(r.starts_at).getTime() - R.RULES.open * 60000) && R.limaDate(now) === R.limaDate(r.starts_at)) { location.hash = '#/e/' + r.id; return; } }
    render();
  },
  pastToggle: (el) => { ui.past = Object.assign({}, ui.past || {}); ui.past[el.dataset.k] = !ui.past[el.dataset.k]; render(); },
  scope: (el) => { ui.scope = el.dataset.k; render(); },
  mark: (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); openSheet(sheetMark(v, el.dataset.k, el.dataset.h)); },
  quick: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const k = el.dataset.k;
    const hire = el.dataset.h ? S.data.hires.find((h) => h.id === el.dataset.h) : null;
    const cm = R.canMark(v, k, S.me, st.ctx(v.project_id), new Date(), { hire });
    if (!cm.ok) { st.toast(cm.why || 'Todavía no se puede', 'bad'); return; }
    if (k === 'rodaje' && cm.split && !confirm(`El video ${v.num} no tiene storyboard. Se graba igual y el valor del storyboard se reparte mitad y mitad. ¿Marcar grabado?`)) return;
    const amt = gain(v, k, cm, !!hire);
    const rect = el.getBoundingClientRect();
    el.classList.add('done');
    const before = R.streak(S.me.id, st.ctx(v.project_id), new Date()).pts;
    const t = await st.markTask(v, k, hire ? { hire_id: hire.id } : {}, null);
    if (v.owner === S.me.id && !hire) ui.burst = Date.now();
    if (amt) fly(rect, '+ ' + R.money(amt));
    const helpedOwn = v.owner === S.me.id && st.member(v.owner).apoyo && (k === 'montaje' || k === 'acabado');
    showUndo(t, amt, cm.self ? 'Entregado · ' + first(st.admin() || { name: 'el administrador' }) + ' revisa tu video' : helpedOwn ? 'Montaje listo · ' + R.money(postValue(v)) + ' en espera' : cm.apoyo && k === 'acabado' ? 'Final de apoyo · a ' + first(st.member(v.owner)) + ' le llegan ' + R.money(postValue(v)) : null);
    afterMark(v, k, cm, before);
  },
  // ---------- 1.4 · revisión, corrección y deshacer ----------
  review: (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    if (el.dataset.k === 'ok') { openSheet(sheetReview(v, 'ok')); return; }
    if (el.dataset.k === 'no') { ui.revNote = ''; openSheet(sheetReview(v, 'no1')); return; }
    const s = R.videoState(v, st.ctx(v.project_id), new Date());
    openSheet(`<h2>Revisar entrega · video ${v.num}</h2><p class="sub" style="margin:0">${first(st.member(v.owner))} entregó ${s.ac && s.ac.redelivered_at ? 'la corrección' : 'el video completo'}. Revísalo y decide.</p>
      <div class="grid2"><button class="hb x-red" data-act="review" data-v="${v.id}" data-k="no" style="font-size:14px">Pedir cambios</button><button class="hb x-green" data-act="review" data-v="${v.id}" data-k="ok" style="font-size:14px">Aprobar</button></div><button class="btn b-ghost" data-act="close">Volver</button>`);
  },
  reviewGo: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const ok = el.dataset.ok === '1';
    sheetHtml = null;
    const res = await st.reviewDelivery(v, ok, ok ? null : ui.revNote);
    const O = first(st.member(v.owner));
    ui.revNote = '';
    offerUndo(res === 'aprobada' ? `Aprobado · a ${O} le llegan ${R.money(postValue(v))}` : res === 'cambios' ? `Cambios pedidos · ${O} corrige hasta las ${R.hm(R.RULES.fix)}` : 'El video pasa a ti', () => st.reviewUndo(v));
  },
  reviewUndo: async (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); await st.reviewUndo(v); },
  redeliver: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    if (!confirm(`¿Entregar la corrección del video ${v.num}?`)) return;
    await st.redeliver(v);
    offerUndo('Corrección entregada · ' + first(st.admin() || { name: 'el administrador' }) + ' la revisa', () => st.redeliverUndo(v));
  },
  redeliverUndo: async (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); await st.redeliverUndo(v); },
  unclaim: async (el) => { await st.unclaim(el.dataset.id); },
  undoArr: async (el) => { const a = S.data.attendance.find((x) => x.id === el.dataset.a); if (a) await st.undoArrival(a); },
  undoEnd: async (el) => { await st.undoEnd(evById(el.dataset.e)); },
  undoCancel: async (el) => { await st.undoCancel(evById(el.dataset.e)); },
  undoDecision: async (el) => { const a = S.data.attendance.find((x) => x.id === el.dataset.a); if (a) await st.undoDecision(a); },
  entStep: (el) => {
    const base = entBase();
    ui.ent = Object.assign({}, ui.ent || {});
    const k = el.dataset.k; const cur = ui.ent[k] != null ? ui.ent[k] : base[k];
    ui.ent[k] = Math.max(Number(el.dataset.min), Math.min(Number(el.dataset.max), cur + Number(el.dataset.d)));
    if (ui.ent[k] === base[k]) delete ui.ent[k];
    render();
  },
  entCli: (el) => {
    const base = entBase();
    const clients = Array.from(new Set(S.data.projects.map((p) => p.client).filter(Boolean)));
    const cl = clients[Number(el.dataset.i)];
    const cli = Object.assign({}, base.cli, (ui.ent || {}).cli || {});
    if (cli[cl] != null) delete cli[cl]; else cli[cl] = Math.max(2, ((ui.ent || {}).mon || base.mon) + 1);
    ui.ent = Object.assign({}, ui.ent || {}, { cli });
    render();
  },
  entCliStep: (el) => {
    const base = entBase();
    const clients = Array.from(new Set(S.data.projects.map((p) => p.client).filter(Boolean)));
    const cl = clients[Number(el.dataset.i)];
    const cli = Object.assign({}, base.cli, (ui.ent || {}).cli || {});
    cli[cl] = Math.max(2, Math.min(6, (cli[cl] || base.mon) + Number(el.dataset.d)));
    ui.ent = Object.assign({}, ui.ent || {}, { cli });
    render();
  },
  entDiscard: () => { ui.ent = null; render(); },
  entPropose: async () => {
    const base = entBase();
    const e = ui.ent || {};
    const data = {};
    for (const k of ENT_KEYS) if (e[k] != null && e[k] !== base[k]) data[k] = e[k];
    if (e.cli && JSON.stringify(e.cli) !== JSON.stringify(base.cli)) data.cli = e.cli;
    if (!Object.keys(data).length) return;
    await st.propose('rules', data); ui.ent = null;
  },
  choquePick: (el) => { ui.choque.picks[Number(el.dataset.n)] = el.dataset.k; openSheet(sheetChoque()); },
  choqueSave: async () => {
    const ch = ui.choque; if (!ch) return;
    sheetHtml = null;
    if (ch.mode === 'reparto') {
      const rows = ch.rows.map((r) => Object.assign({}, r));
      ch.list.forEach((x, n) => Object.assign(rows[x.i], choqueApply(x, ch.picks[n])));
      ui.choque = null;
      await doReparto(ch.rod, rows);
    } else {
      ui.choque = null;
      for (let n = 0; n < ch.list.length; n++) {
        const x = ch.list[n]; const patch = choqueApply(x, ch.picks[n]);
        if (patch.apoyo_due) await st.setApoyoDue(x.it.video, patch.apoyo_due);
        if (patch.publish_date) await st.setPublish(x.it.video, patch.publish_date);
      }
      location.hash = '#/videos';
    }
  },
  claim: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const k = el.dataset.k;
    const cm = R.canMark(v, k, S.me, st.ctx(v.project_id), new Date());
    if (!cm.claim) { st.toast(cm.why || 'Ya no se puede tomar', 'bad'); return; }
    const c = await st.claimTask(v, k);
    const lim = k === 'montaje' ? R.takeLimit(v, 'montaje', st.ctx(v.project_id)) : cm.limit;
    if (c && c.id) { ui.undo = { claim: c.id, until: Date.now() + 8000, text: k === 'montaje' ? `Lo tomaste · entrégalo hasta ${whenRel(lim)}` : `Lo tomaste · entrégalo antes de ${R.fmtWhen(lim)}` }; render(); setTimeout(() => { if (ui.undo && ui.undo.claim === c.id) { ui.undo = null; render(); } }, 8000); }
  },
  rsvp: async (el) => {
    const e = evById(el.dataset.e);
    const k = el.dataset.k;
    if (k === 'no' && e.kind === 'rodaje') { openSheet(sheetNotice(e, false)); return; }
    if (k === 'guillermo') { ACT.hire(el); return; }
    ui.evOpen = Object.assign({}, ui.evOpen || {}); delete ui.evOpen[e.id];
    await st.setRsvp(e, k);
  },
  evToggle: (el) => { ui.evOpen = Object.assign({}, ui.evOpen || {}); ui.evOpen[el.dataset.e] = !ui.evOpen[el.dataset.e]; render(); },
  rsvpChange: (el) => { ui.evOpen = Object.assign({}, ui.evOpen || {}); ui.evOpen[el.dataset.e] = 'ask'; render(); },
  popClose: () => { ui.rpop = null; render(); },
  reproVideo: (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const now = new Date();
    const cur = R.rodajeOf(v, st.ctx(v.project_id));
    const next = S.data.events.filter((e) => e.kind === 'rodaje' && active(e) && e.project_id === v.project_id && new Date(e.starts_at) > now && (!cur || e.id !== cur.id)).sort(byStart);
    openSheet(`<h2>Reprogramar el video ${v.num}</h2><p class="sub" style="margin:0">Sin guion no se graba. Pasa a otro rodaje y ${esc(first(st.member(v.owner)))} vuelve a tener plazo hasta el día anterior a las ${R.hm(R.RULES.pre)}.</p>
      ${next.map((e) => `<button class="btn x-amber" data-act="reproGo" data-v="${v.id}" data-e="${e.id}">${R.fmtWhen(e.starts_at)} · ${evTitle(e, st.ctx(v.project_id)).vt || 'sin videos'}</button>`).join('') || '<p class="empty">No hay rodajes siguientes.</p>'}
      ${isPartner(S.me) ? `<button class="btn b-ghost" data-act="reproNew" data-v="${v.id}">Programar un rodaje nuevo</button>` : ''}<button class="btn b-ghost" data-act="close">Cancelar</button>`);
  },
  reproGo: async (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); sheetHtml = null; await st.moveVideo(v, el.dataset.e); },
  reproNew: (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); openSheet(dateTimeSheet('newRodV', 'Rodaje nuevo', `Para el video ${v.num}.`, { v: v.id }, R.addDays(R.limaDate(new Date()), 2), '10:00', 'Programar')); },
  undoQuick: async (el) => {
    const u = ui.undo; if (!u) return;
    ui.undo = null;
    if (u.fn) { await u.fn(); return; }
    if (u.claim) { await st.unclaim(u.claim); return; }
    const rect = el.getBoundingClientRect();
    await st.undoOwn(u.id);
    if (u.amt) fly(rect, '− ' + R.money(u.amt), true);
  },
  undo: async (el) => {
    const t = S.data.tasks.find((x) => x.id === el.dataset.id);
    if (!confirm('¿Deshacer esta tarea? Quedará en el historial.')) return;
    const v = t && S.data.videos.find((x) => x.id === t.video_id);
    const rect = el.getBoundingClientRect();
    await st.undoTask(el.dataset.id);
    if (v) { const r = R.rates(projOf(v.project_id))[t.kind]; fly(rect, '− ' + R.money(t.hire_id ? r * 0.8 : r), true); }
  },
  swap: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const other = st.partners().find((m) => m.id !== v.owner);
    if (other && confirm(`¿Pasar el video ${v.num} a ${other.name}? Háganlo solo de mutuo acuerdo: queda en el historial.`)) await st.changeOwner(v.id, other.id);
  },
  checkin: async (el) => { const e = evById(el.dataset.e); await st.checkIn(e); if (S.me.role === 'admin' && Date.now() <= new Date(e.starts_at).getTime() + R.RULES.punt * 60000) { ui.burst = Date.now(); render(); } const a = st.attOf(e.id, S.me.id); if (a) offerUndo('Llegada registrada', () => st.undoArrival(st.attOf(e.id, S.me.id))); },
  confirmArr: async (el) => { const a = S.data.attendance.find((x) => x.id === el.dataset.a); await st.confirmArrival(a, el.dataset.m); offerUndo('Llegada confirmada', () => st.undoArrival(S.data.attendance.find((x) => x.id === a.id))); },
  endMeeting: async (el) => {
    const e = evById(el.dataset.e);
    const c = st.ctx(e.project_id);
    const pendPre = e.video_ids.map((id) => c.videos.find((v) => v.id === id)).filter((v) => v && v.owner !== S.me.id).filter((v) => { const s = R.videoState(v, c); return !s.g || !s.s; });
    const direct = S.me.role === 'admin' || R.adminAbsent(e, c);
    const warn = pendPre.length ? `\n\nOjo: ${st.member(pendPre[0].owner).name} todavía no termina ${pendPre.length === 1 ? 'el video' : 'los videos'} ${pendPre.map((v) => v.num).join(', ')}. Al finalizar, ya no suma el punto de reunión (igual tiene plazo hasta el día antes del rodaje, 18:00).` : '';
    if (!confirm((direct ? '¿Finalizar la reunión ahora?' : '¿Pedir al administrador que finalice la reunión? Quedará con la hora de ahora.') + warn)) return;
    await st.endMeeting(e);
    if (evById(e.id).ended_at) offerUndo('Reunión finalizada', () => st.undoEnd(evById(e.id)));
  },
  confirmEnd: async (el) => { const id = el.dataset.e; await st.confirmEnd(evById(id)); offerUndo('Reunión finalizada', () => st.undoEnd(evById(id))); },
  extraMeet: (el) => { const r = evById(el.dataset.r); openSheet(dateTimeSheet('extraMeet', 'Otra reunión', `Antes de ${R.fmtWhen(R.preDueFor(r.starts_at))} (plazo de preproducción).`, { r: r.id }, R.limaDate(new Date()), '18:00', 'Agendar')); },
  reday: (el) => { const e = evById(el.dataset.e); openSheet(dateTimeSheet('reday', 'Reprogramar el rodaje', 'Se crea un rodaje nuevo con los mismos videos. El anterior queda como "reprogramado" en el historial. Los plazos de preproducción se mueven con el rodaje.', { e: e.id, a: el.dataset.a || '' }, R.addDays(R.limaDate(e.starts_at), 1), R.limaTime(e.starts_at), 'Reprogramar')); },
  moveEv: (el) => { const e = evById(el.dataset.e); openSheet(dateTimeSheet('moveEv', 'Cambiar fecha u hora', 'Solo mientras nadie haya marcado su llegada. Queda en el historial.', { e: e.id }, R.limaDate(e.starts_at), R.limaTime(e.starts_at), 'Guardar')); },
  cancelEv: async (el) => { const e = evById(el.dataset.e); const note = prompt(`¿Cancelar ${e.kind === 'rodaje' ? 'el rodaje' : 'la reunión'} del ${R.fmtWhen(e.starts_at)}? Queda en el historial. Escribe el motivo (opcional):`, ''); if (note === null) return; await st.cancelEvent(e, note.trim()); offerUndo('Cancelado', () => st.undoCancel(evById(e.id))); },
  delEv: async (el) => { const e = evById(el.dataset.e); if (!confirm('¿Borrar? Está vacío, así que no se pierde ningún registro.')) return; await st.deleteEvent(e); location.hash = '#/videos'; },
  newRod: () => openSheet(dateTimeSheet('newRod', 'Programar rodaje', 'Para los videos que se quedaron sin rodaje.', {}, R.addDays(R.limaDate(new Date()), 2), '10:00', 'Programar')),
  delProject: async (el) => { const p = projOf(el.dataset.id); if (!confirm(`¿Borrar el proyecto ${p.client} · ${p.name}? Está vacío.`)) return; await st.deleteProject(p); if (S.projectId === p.id) { const n = S.data.projects.find((x) => x.status !== 'archivado'); st.switchProject(n ? n.id : null); } },
  archProject: async (el) => { const p = projOf(el.dataset.id); const on = !!el.dataset.on; if (on && !confirm(`¿Archivar ${p.client} · ${p.name}? Deja de aparecer en el selector; su historial se conserva y puedes reabrirlo.`)) return; await st.archiveProject(p, on); if (on && S.projectId === p.id) { const n = S.data.projects.find((x) => x.status !== 'archivado' && x.id !== p.id); if (n) st.switchProject(n.id); } },
  practiceOn: () => { if (confirm('Entrarás a un espacio de práctica en este celular. Tus datos reales no cambian. ¿Entrar?')) st.setPractice(true); },
  practiceOff: () => st.setPractice(false),
  notice: (el) => { openSheet(sheetNotice(evById(el.dataset.e), !!el.dataset.fm)); },
  decide: async (el) => { const a = S.data.attendance.find((x) => x.id === el.dataset.a); await st.decideNotice(a, el.dataset.d); offerUndo('Respuesta registrada', () => st.undoDecision(S.data.attendance.find((x) => x.id === a.id))); },
  repro: (el) => {
    const e = evById(el.dataset.e);
    const left = e.video_ids.filter((id) => !S.data.tasks.find((t) => t.video_id === id && t.kind === 'rodaje'));
    openSheet(`<form data-form="repro" style="display:contents"><input type="hidden" name="e" value="${e.id}"><h2>Reprogramar</h2><p class="sub" style="margin:0">${left.length} videos pasan al nuevo rodaje. Conservan su dueño y su valor (5.10).</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="d" required value="${R.addDays(R.limaDate(e.starts_at), 1)}"></label><label class="field"><span>Hora</span><input class="in" type="time" name="t" required value="10:00"></label></div>
    <button class="btn b-amber">Reprogramar</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`);
  },
  tol: (el) => { const e = evById(el.dataset.e); const v = prompt('Tolerancia en minutos (acordada con tu socio):', e.tolerance_min); if (v && Number(v) > 0) st.setTolerance(e, Number(v)); },
  sendSettle: async () => { const p = st.project(); if (confirm('¿Enviar la liquidación? Tu socio la revisará y confirmará.')) await st.sendSettlement(p); },
  confirmSettle: async () => { await st.confirmSettlement(st.project()); },
  observe: async () => { const t = prompt('¿Qué no cuadra? Ej.: "El rodaje del video 3 lo grabé yo."'); if (t) await st.observeSettlement(st.project(), t); },
  histF: (el) => { ui.histF = el.dataset.k; render(); },
  askCorr: async (el) => { const t = prompt('Describe la corrección. El registro original no se borra; tu compañero tendrá que aprobarla.'); if (t) await st.requestCorrection(Number(el.dataset.id), t); },
  corr: async (el) => { const c = S.data.corrections.find((x) => x.id === el.dataset.id); await st.decideCorrection(c, el.dataset.s); },
  rename: async (el) => { const m = st.member(el.dataset.id); const n = prompt('Nombre (así aparecerá en avisos, recibos e historial):', m.name); if (n && n.trim() && n.trim() !== m.name) await st.renameMember(m.id, n); },
  // ---------- 1.4 · Integrantes C ----------
  memEdit: (el) => { ui.memEdit = Object.assign({}, ui.memEdit, { [el.dataset.id]: !(ui.memEdit || {})[el.dataset.id] }); render(); },
  memRenew: async (el) => { await st.renewInvite(st.member(el.dataset.id)); },
  memCancel: async (el) => { const m = st.member(el.dataset.id); if (confirm(`¿Cancelar la invitación de ${m.name}? El enlace dejará de funcionar.`)) await st.cancelInvite(m); },
  memInvite: () => { ui.inv = { role: 'socio', apoyo: true, name: '', phone: '' }; openSheet(sheetInvite()); },
  invRole: (el) => { ui.inv = Object.assign({}, ui.inv, { role: el.dataset.k }); openSheet(sheetInvite()); },
  invGo: async () => {
    const d = ui.inv || {};
    const name = String(d.name || '').trim();
    const ph = String(d.phone || '').replace(/\D/g, '');
    if (!name) return st.toast('Escribe el nombre', 'bad');
    if (ph && !st.PHONE_RE.test(ph)) return st.toast('El WhatsApp debe tener 9 dígitos y empezar con 9', 'bad');
    if (d.role === 'colaborador') { ui.job = null; ui.inv = d; sheetHtml = null; location.hash = '#/encargo/nuevo'; return; }
    const code = await st.inviteMember(name, 'socio', !!d.apoyo);
    const m = S.data.members.find((x) => x.invite_code === code);
    if (m && ph) await st.saveMembers({ [m.id]: { phone: ph } }, null, 'Invitación lista');
    const link = location.origin + location.pathname + '#/i/' + code;
    const msg = `Hola ${name.split(' ')[0]}, te invito como Socio a nuestro equipo en la app de registro. Ahí marcamos nuestras tareas y vemos cuánto le toca a cada uno: ${link}`;
    ui.inv = null;
    openSheet(`<h2>Invitación lista</h2><p class="sub" style="margin:0">Envíale este enlace a ${esc(name)}. Vence en 7 días; si vence, generas uno nuevo desde Integrantes.</p>
      <div class="pmsg pm-green"><span class="pdot"></span><p>${esc(msg)}</p></div>
      <a class="hb x-green" href="https://wa.me/${ph ? '51' + ph : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${waIc}Enviar por WhatsApp</a>
      <button class="btn b-ghost" data-act="copy" data-t="${esc(link)}">Copiar enlace</button><button class="btn b-ghost" data-act="close">Listo</button>`);
  },
  memSave: async () => { await st.saveMembers(ui.memCh || {}, ui.gPhone != null ? ui.gPhone : null); ui.memCh = {}; ui.memEdit = {}; ui.gPhone = null; render(); },
  // ---------- 1.4 · Entrega vencida ----------
  reprog: (el) => openSheet(sheetReprog(S.data.videos.find((x) => x.id === el.dataset.v))),
  // ---------- 1.4 · Encargo al colaborador ----------
  jobNewFor: (el) => { ui.job = null; ui.inv = null; location.hash = '#/encargo/nuevo?m=' + el.dataset.id; },
  jobWho: (el) => { ui.job.member_id = el.dataset.id; render(); },
  jobVid: (el) => { const a = ui.job.video_ids; const i = a.indexOf(el.dataset.id); if (i === -1) a.push(el.dataset.id); else a.splice(i, 1); render(); },
  jobPrice: (el) => { ui.job.price = Math.max(5, Number(ui.job.price) + Number(el.dataset.d)); render(); },
  jobPayer: (el) => { ui.job.payer = el.dataset.k; render(); },
  jobCreate: async () => {
    const d = ui.job; const p = st.project();
    if (!d.member_id && !String(d.name || '').trim()) return st.toast('Escribe el nombre del editor', 'bad');
    const ph = String(d.phone || '').replace(/\D/g, '');
    if (!d.member_id && ph && !st.PHONE_RE.test(ph)) return st.toast('El WhatsApp debe tener 9 dígitos y empezar con 9', 'bad');
    const j = await st.createJob({ member_id: d.member_id || null, name: String(d.name || '').trim(), phone: ph, project_id: p.id, video_ids: d.video_ids.slice(), price: d.price, payer: d.payer, drive_url: String(d.drive_url || '').trim() });
    ui.job = null; ui.inv = null;
    st.toast(otherPartner() ? 'Encargo enviado a ' + otherPartner().name.split(' ')[0] + ' para que lo apruebe' : 'Encargo creado');
    if (j && j.id) location.hash = '#/encargo/' + j.id;
  },
  jobDecide: async (el) => {
    const j = S.data.jobs.find((x) => x.id === el.dataset.id); const s0 = el.dataset.s;
    if ((s0 === 'cancelado' || s0 === 'rechazado') && !confirm(s0 === 'cancelado' ? '¿Cancelar este encargo?' : '¿Rechazar este encargo?')) return;
    await st.decideJob(j, s0);
  },
  jobClose: async (el) => { const j = S.data.jobs.find((x) => x.id === el.dataset.id); if (confirm('¿Confirmas que los videos están en Drive y registras el pago al editor?')) await st.decideJob(j, 'cerrado'); },
  jobSel: (el) => { ui.jobSel = Object.assign({}, ui.jobSel, { [el.dataset.j]: el.dataset.v }); render(); },
  jobObs: async (el) => {
    const lines = String((ui.obs || {})[el.dataset.id] || '').split('\n').map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return st.toast('Escribe al menos una observación (una por línea)', 'bad');
    await st.jobStep(el.dataset.id, 'obs', lines); ui.obs[el.dataset.id] = ''; st.toast('Observaciones enviadas al editor'); render();
  },
  jobOk: async (el) => { await st.jobStep(el.dataset.id, 'ok'); st.toast('Aprobado'); },
  jobUndo: async (el) => { await st.jobUndo(el.dataset.id); },
  // ---------- 1.4 · Vista del colaborador ----------
  colabJob: (el) => { ui.colabJob = el.dataset.id; render(); },
  colabSel: (el) => { ui.colabSel = Object.assign({}, ui.colabSel, { [el.dataset.j]: el.dataset.v }); render(); },
  colabAccept: async (el) => { await st.jobAccept(el.dataset.id); },
  colabFinish: async (el) => { if (confirm('¿Marcar el servicio como finalizado? El equipo lo confirmará y registrará tu pago.')) await st.jobFinish(el.dataset.id); },
  colabStep: async (el) => { await st.jobStep(el.dataset.id, el.dataset.k); st.toast({ montaje: 'Montaje entregado', final: 'Video final entregado', upload: 'Listo para subir', uploaded: '¡Video listo!' }[el.dataset.k] || 'Registrado'); },
  colabCheck: async (el) => { await st.jobStep(el.dataset.id, 'check', null, Number(el.dataset.i)); },
  colabUndo: async (el) => { await st.jobUndo(el.dataset.id); },
  copy: async (el) => { try { await navigator.clipboard.writeText(el.dataset.t); st.toast('Enlace copiado'); } catch (e) { prompt('Copia el enlace:', el.dataset.t); } },
  photo: async (el) => { const url = await st.fileUrl(el.dataset.p); openSheet(url ? `<img class="photo" style="max-height:70vh" src="${esc(url)}" alt="Evidencia"><button class="btn b-ghost" data-act="close">Cerrar</button>` : '<p class="empty">No se pudo cargar la foto.</p><button class="btn b-ghost" data-act="close">Cerrar</button>'); },
  hire: (el) => {
    const e = evById(el.dataset.e);
    const p = projOf(e.project_id);
    const val = R.rates(p).guion + R.rates(p).storyboard;
    const other = st.partners().find((m) => m.id !== S.me.id);
    openSheet(`<h2>Contratar a Guillermo</h2>
    <p class="sub" style="margin:0">Para la reunión del ${R.fmtWhen(e.starts_at)}.</p>
    <div class="card tight"><div class="between small"><span class="muted">Hace</span><b>Tus guiones y storyboards de esta semana</b></div>
    <div class="between small"><span class="muted">Cobra</span><b>80 % · ${R.money(val * 0.8)} por video</b></div>
    <div class="between small"><span class="muted">Lo recibe</span><b>${esc(other ? other.name : 'tu compañero')}</b></div>
    <div class="between small"><span class="muted">Tú conservas</span><b>20 % · ${R.money(val * 0.2)} por video</b></div></div>
    <p class="muted" style="margin:0">Tu compañero tiene que aceptar. Tu asistencia queda como "no requerida": no es falta ni suma racha. El rodaje y la edición de tus videos siguen siendo tuyos.</p>
    <button class="btn b-purple" data-act="hireGo" data-e="${e.id}">Contratar</button><button class="btn b-ghost" data-act="close">Cancelar</button>`);
  },
  hireGo: async (el) => { const e = evById(el.dataset.e); sheetHtml = null; await st.hireGuillermo(e); },
  hireDecide: async (el) => { const h = S.data.hires.find((x) => x.id === el.dataset.id); await st.decideHire(h, el.dataset.s); },
  signOut: () => st.signOut(),
  google: () => { location.href = st.googleUrl(); },
  demoAs: (el) => { ui.undo = null; ui.rpop = null; return st.demoSwitch(el.dataset.id); },
  demoReset: () => { if (confirm('¿Borrar todos los datos de la demo?')) st.demoReset(); },
  seed: async () => { await seedDemo(); location.hash = '#/'; location.reload(); }
};

const FORM = {
  sendCode: async (f) => {
    ui.email = f.email.trim().toLowerCase();
    if (st.isDemo()) { await st.verifyCode(ui.email, '000000'); return; }
    await st.sendCode(ui.email); ui.codeSent = true; st.toast('Te enviamos el correo'); render();
  },
  verify: async (f) => { await st.verifyCode(ui.email, f.code.trim()); location.hash = location.hash || '#/'; render(); },
  createTeam: async (f) => { await st.createTeam(f.team.trim(), f.me.trim()); location.hash = '#/equipo'; },
  goInvite: (f) => { location.hash = '#/i/' + f.code.trim().toUpperCase(); },
  accept: async (f) => { await st.acceptInvite(f.code, f.name.trim()); ui.inviteInfo = null; location.hash = '#/'; st.toast('¡Ya eres parte del equipo!'); },
  invite: async (f, form) => { await st.invite(f.name.trim(), 'socio', !!form.apoyo.checked); form.reset(); },
  project: async (f) => { await st.createProject({ client: f.client.trim(), name: f.name.trim(), budget: Number(f.budget), videos_total: Number(f.videos), start_date: f.start }); location.hash = '#/videos'; },
  plan: async (f) => {
    if (R.at(f.rd, f.rt) < new Date() && !confirm('La fecha del rodaje ya pasó. ¿Programarlo igual?')) return;
    if (R.at(f.md, f.mt) >= R.preDueFor(R.at(f.rd, f.rt))) throw new Error(`La reunión tiene que ser antes de ${R.fmtWhen(R.preDueFor(R.at(f.rd, f.rt)))} (día antes del rodaje, 18:00)`);
    await st.planWeek({ rodaje_date: f.rd, rodaje_time: f.rt, meeting_date: f.md, meeting_time: f.mt });
    ui.stage = 'pre';
    // 1.4: ¿el rodaje o la reunión nuevos caen el último día de apoyo de un video ya repartido?
    const c = st.ctx();
    const vids = c.videos.filter((v) => { const s = R.videoState(v, c); return !s.mo && !s.delivered; });
    const list = choquesDe(vids.map((v) => ({ video: v, num: v.num, owner: v.owner, publish_date: v.publish_date, apoyo_due: v.apoyo_due })), [[f.rd, 'rodaje'], [f.md, 'reunión']])
      .filter((x) => x.kind === 'clash' && (x.apoyoDay === f.rd || x.apoyoDay === f.md));
    if (list.length) { ui.choque = { mode: 'plan', list, picks: {} }; openSheet(sheetChoque()); return; }
    location.hash = '#/videos';
  },
  reparto: async (f) => {
    const rod = evById(f.r);
    const n = Number(f.n);
    const videos = Array.from({ length: n }, (_, i) => ({ publish_date: f['pub' + i], owner: f['own' + i], title: (f['tit' + i] || '').trim() }));
    const rd = R.limaDate(rod.starts_at);
    // 1.4: aviso de choque (apoyo en día de rodaje o reunión, o poco tiempo entre rodaje y publicación).
    const base = S.data.videos.filter((x) => x.project_id === rod.project_id).reduce((m, x) => Math.max(m, x.num), 0);
    const list = choquesDe(videos.map((v, i) => Object.assign({}, v, { num: base + i + 1, rodajeDate: rd })));
    if (list.length) { ui.choque = { mode: 'reparto', rod, rows: videos, list, picks: {} }; openSheet(sheetChoque()); return; }
    await doReparto(rod, videos);
  },
  reviewNote: async (f) => {
    const v = S.data.videos.find((x) => x.id === f.v);
    ui.revNote = (f.note || '').trim();
    if (!ui.revNote) throw new Error('Escribe qué debe corregir');
    openSheet(sheetReview(v, 'no2'));
  },
  mark: async (f) => {
    const v = S.data.videos.find((x) => x.id === f.v);
    sheetHtml = null;
    const extra = {}; if (f.link) extra.link = f.link; if (f.h) extra.hire_id = f.h;
    const hire = f.h ? S.data.hires.find((h) => h.id === f.h) : null;
    const cm = R.canMark(v, f.k, S.me, st.ctx(v.project_id), new Date(), { hire });
    const amt = gain(v, f.k, cm, !!hire);
    const before = R.streak(S.me.id, st.ctx(v.project_id), new Date()).pts;
    const t = await st.markTask(v, f.k, extra, null);
    if (amt) fly(centerRect(), '+ ' + R.money(amt));
    showUndo(t, amt);
    afterMark(v, f.k, cm, before);
  },
  notice: async (f) => {
    const e = evById(f.e);
    sheetHtml = null;
    await st.sendNotice(e, { reason: f.reason, fm_kind: f.reason === 'fm' ? f.fm_kind : null, choice: f.choice || null });
  },
  repro: async (f) => {
    const e = evById(f.e);
    const left = e.video_ids.filter((id) => !S.data.tasks.find((t) => t.video_id === id && t.kind === 'rodaje'));
    sheetHtml = null;
    await st.reprogram(e, left, f.d, f.t);
  },
  reday: async (f) => {
    const e = evById(f.e);
    sheetHtml = null;
    const nu = await st.reprogramDay(e, f.d, f.t, (f.note || '').trim());
    const a = f.a && S.data.attendance.find((x) => x.id === f.a);
    if (a && !a.notice.decision) await st.decideNotice(a, 'reday');
    if (nu && nu.id) location.hash = '#/e/' + nu.id;
  },
  moveEv: async (f) => { const e = evById(f.e); sheetHtml = null; if (e.kind === 'reunion' && e.rodaje_id) { const r = evById(e.rodaje_id); if (r && R.at(f.d, f.t) >= R.preDueFor(r.starts_at)) throw new Error('La reunión tiene que ser antes del plazo de preproducción'); } await st.moveEvent(e, f.d, f.t); },
  extraMeet: async (f) => { const r = evById(f.r); sheetHtml = null; await st.extraMeeting(r, f.d, f.t); },
  newRodV: async (f) => {
    const v = S.data.videos.find((x) => x.id === f.v);
    sheetHtml = null;
    const r = await st.newRodaje(v.project_id, [], f.d, f.t);
    if (r && r.id) await st.moveVideo(v, r.id);
  },
  newRod: async (f) => {
    const c = st.ctx();
    const ids = c.videos.filter((v) => !R.rodajeOf(v, c) && !R.videoState(v, c).r).map((v) => v.id);
    sheetHtml = null;
    await st.newRodaje(S.projectId, ids, f.d, f.t);
  },
  reprog: async (f) => {
    const v = S.data.videos.find((x) => x.id === f.v);
    const s0 = R.videoState(v, st.ctx(v.project_id), new Date());
    const lateMine = s0.overdue && s0.inCharge === S.me.id;
    if (!confirm(`¿Reprogramar la entrega del video ${v.num} al ${R.fmtDay(f.d)}?${lateMine ? ' Resta 3 puntos de racha.' : ''}`)) return;
    await st.reprogramDelivery(v, f.d, f.note);
    sheetHtml = null; st.toast(`Entrega del video ${v.num} reprogramada al ${R.fmtDay(f.d)}`);
  },
  phone: async (f) => { await st.setPhone(f.m, f.p); },
  pay: async (f, form) => {
    const file = form.proof && form.proof.files[0];
    let path = null;
    if (file) path = await st.uploadPhoto(file);
    if (confirm('¿Registrar el pago y cerrar el proyecto?')) await st.paySettlement(st.project(), path);
  }
};

async function doReparto(rod, videos) {
  await st.reparto(rod, videos);
  ui.stage = 'pre';
  const mt = S.data.events.find((e) => e.kind === 'reunion' && e.rodaje_id === rod.id && active(e) && !e.ended_at);
  location.hash = mt ? '#/e/' + mt.id : '#/videos';
}
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'closeBg') { if (e.target === el) closeSheet(); return; }
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  if (el.tagName === 'A' && el.getAttribute('href')) { sheetHtml = null; location.hash = el.getAttribute('href'); return; }
  try { await fn(el, e); } catch (err) { console.error(err); }
});
document.addEventListener('change', (e) => { if (e.target.closest('label.opt')) syncOpts(); if (e.target.closest('label.own')) syncOwn(); if (e.target.dataset && e.target.dataset.lk) { lkSet(e.target.dataset.lk, e.target.dataset.num ? Number(e.target.value) : e.target.value); render(); } });
// 1.4: campos que se guardan mientras escribes (sin volver a dibujar la pantalla).
document.addEventListener('input', (e) => {
  const t = e.target; const d = t.dataset || {};
  if (d.mf) {
    const val = d.mf === 'phone' || d.mf === 'gphone' ? t.value.replace(/\D/g, '').slice(0, 9) : t.value;
    if (d.mf === 'gphone') ui.gPhone = val;
    else { ui.memCh = ui.memCh || {}; ui.memCh[d.id] = Object.assign({}, ui.memCh[d.id], { [d.mf]: val }); }
    if (d.mf !== 'name') {
      const box = t.closest('.wafield'); const ok = st.PHONE_RE.test(val);
      if (box) { box.querySelector('.okdot').hidden = !ok; box.querySelector('.wabad').hidden = ok || !val; const a = box.querySelector('.watry'); a.hidden = !ok; a.href = 'https://wa.me/51' + val + '?text=Hola'; }
      t.style.borderColor = val && !ok ? 'var(--u0)' : '';
    }
  }
  if (d.inv) { ui.inv = ui.inv || {}; ui.inv[d.inv] = t.type === 'checkbox' ? t.checked : t.value; }
  if (d.job && ui.job) ui.job[d.job] = t.value;
  if (d.obs) { ui.obs = ui.obs || {}; ui.obs[d.obs] = t.value; }
});
document.addEventListener('change', (e) => { const d = e.target.dataset || {}; if (d.inv && e.target.type === 'checkbox') { ui.inv = ui.inv || {}; ui.inv.apoyo = e.target.checked; } });
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form).entries());
  const btn = form.querySelector('button:not([type=button])');
  if (btn) btn.disabled = true;
  try { await FORM[form.dataset.form](f, form); }
  catch (err) { console.error(err); st.toast(err.message || 'Algo salió mal', 'bad'); }
  finally { if (btn && document.body.contains(btn)) btn.disabled = false; render(); }
});
window.addEventListener('hashchange', () => { sheetHtml = null; const r = location.hash.replace(/^#\/?/, '').split('/'); if (r[0] === 'i') ui.inviteCode = r[1]; render(); window.scrollTo(0, 0); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.teamId) st.load().catch(() => {}); });
setInterval(() => { if (document.visibilityState === 'visible' && S.teamId && !sheetHtml && !document.activeElement.matches('input,textarea,select')) st.load().catch(() => {}); }, 60000);

st.onChange(render);
{ const r = location.hash.replace(/^#\/?/, '').split('/'); if (r[0] === 'i') ui.inviteCode = r[1]; }
st.boot().catch((e) => { $app.innerHTML = `<div class="wrap"><main>${banner('bad', 'No se pudo cargar', esc(e.message))}</main></div>`; });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
