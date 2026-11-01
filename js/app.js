import * as st from './store.js';
import { S } from './store.js';
import * as R from './rules.js';
import { seedDemo } from './demo.js';

export const VERSION = '1.2';
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
  if (cm && cm.apoyo) return 0;
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
        else if (vs.d.preDue && now > vs.d.preDue && me.role !== 'colaborador') push(k, vs.d.preDue, t, `De ${first(owner)} · no llegó a tiempo`, { take: true });
      }
    } else if (!vs.r) {
      if (!rod) { if (v.owner === me.id) out.push({ type: 'norod', video: v, due: null, title: `Video ${v.num} sin rodaje`, sub: 'Prográmalo en Etapas → Rodaje' }); }
      else {
        const cm = R.canMark(v, 'rodaje', me, c, now);
        if (cm.ok) push('rodaje', new Date(rod.starts_at), `Rodaje · ${vname}`, v.owner === me.id ? (v.title ? esc(v.title) : 'Tu video') : `De ${first(owner)} · lo grabas tú`, { take: v.owner !== me.id });
      }
    } else if (!vs.mo) {
      if (v.owner === me.id && !vs.montajeMissed) push('montaje', vs.d.montajeDue || vs.d.finalDue, `Montaje · ${vname}`, owner.apoyo ? 'Tu final lo hace el administrador como apoyo (5.5)' : (v.title ? esc(v.title) : 'Tu video'));
      else if (v.owner !== me.id && me.role === 'admin' && vs.montajeMissed) push('montaje', vs.d.finalDue, `Montaje y final · ${vname}`, `De ${first(owner)} · su montaje no llegó (5.7)`, { take: true });
    } else if (!vs.ac) {
      if (v.owner === me.id && !owner.apoyo) push('acabado', vs.d.finalDue, `Video final · ${vname}`, v.title ? esc(v.title) : 'Tu video');
      else if (v.owner !== me.id && me.role === 'admin' && (owner.apoyo || vs.reassigned)) push('acabado', vs.d.finalDue, `Video final · ${vname}`, vs.reassigned ? `De ${first(owner)} · lo tomaste (5.7)` : `De ${first(owner)} · apoyo: el pago es de él (5.5)`);
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
    if (cm.ok) return `<button class="tbtn ${x.take ? 't-take' : x.hire ? 't-g' : 't-done'}" data-act="quick" data-v="${x.video.id}" data-k="${x.kind}"${x.hire ? ` data-h="${x.hire.id}"` : ''}>${x.take ? 'Tomar' : 'Hecho'}</button>`;
    if (cm.gone) return `<span class="tbtn t-gone">Venció</span>`;
    const r = x.rod;
    const lockTxt = x.kind === 'rodaje' && r ? (R.limaDate(now) === R.limaDate(r.starts_at) ? R.limaTime(new Date(new Date(r.starts_at).getTime() - R.RULES.open * 60000)) : dowShort(r.starts_at)) : 'Espera';
    return `<span class="tbtn t-lock">${icon.lock}${lockTxt}</span>`;
  }
  if (x.type === 'event') {
    if (R.canCheckIn(ev, now)) return `<button class="tbtn t-arr" data-act="checkin" data-e="${ev.id}">Llegué</button>`;
    return `<span class="tbtn t-lock">${icon.lock}${R.limaDate(now) === R.limaDate(ev.starts_at) ? R.limaTime(new Date(new Date(ev.starts_at).getTime() - R.RULES.open * 60000)) : dowShort(ev.starts_at)}</span>`;
  }
  if (x.type === 'claim') return `<button class="tbtn t-arr" data-act="confirmArr" data-a="${x.att.id}" data-m="claimed">Sí, ${R.limaTime(x.att.claimed_at)}</button>`;
  if (x.type === 'endreq') return `<button class="tbtn t-done" data-act="confirmEnd" data-e="${ev.id}">Confirmar</button>`;
  return `<a class="tbtn t-ghost" href="${rowHref(x)}">Ver</a>`;
}
function rowHref(x) {
  if (x.type === 'task' || x.type === 'norod') return '#/v/' + x.video.id;
  if (x.type === 'reparto') return '#/semana/' + x.event.id;
  if (x.type === 'settle') return '#/cierre';
  if (x.type === 'corr') return '#/historial';
  if (x.type === 'proposal') return '#/propuesta/' + x.prop.id;
  return x.event ? '#/e/' + x.event.id : '#/';
}
function dueLine(x, now) {
  if (x.type !== 'task' && x.type !== 'event') return '';
  if (x.type === 'task' && x.cm.gone) return `<span class="due-l u0">Venció ${R.fmtWhen(x.due)} · pasó a tu compañero</span>`;
  if (x.type === 'task' && !x.cm.ok && x.cm.why) return `<span class="due-l">${esc(x.cm.why)}</span>`;
  if (!x.due) return '';
  return `<span class="due-l u${x.band}">${x.type === 'event' ? '' : 'Entrega: '}${R.fmtWhen(x.due)} · ${countdown(x.due, now)}</span>`;
}
function pendItem(x, now = new Date(), i = 0) {
  const k = stageOf(x);
  return `<div class="trow" style="animation-delay:${(i * 0.04).toFixed(2)}s">
    <a class="tic tint-${k}" href="${rowHref(x)}" aria-label="Ver detalle">${stageIc(k)}</a>
    <a class="ttx" href="${rowHref(x)}"><b${x.type === 'task' && (x.cm.gone || (!x.cm.ok)) ? ' class="dim"' : ''}>${x.title}${x.repro ? ' <em class="tag-red">Reprogramado</em>' : ''}</b><span>${x.sub || ''}</span>${dueLine(x, now)}</a>
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
    return `<button class="btn sm ${on ? 'b-amber' : 'b-ghost'}" data-act="demoAs" data-id="${u.id}">${esc(m ? m.name : u.email)}</button>`;
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
      <div class="banner bn-warn"><div><b>Antes de entrar</b><p>La app sigue el acuerdo que firmaron: pago por etapa (guion y storyboard S/ 7.81, rodaje S/ 21.88, montaje S/ 10, acabado S/ 15 por video de S/ 62.50), plazos a las 21:00, tolerancia de 10 y 45 min, avisos de rodaje hasta las 18:00 del día anterior y de reunión con 24 h. La racha nunca cambia lo que cobras.</p></div></div>
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
  Responsable: { n: 3, color: '#FF5A36', text: '#FF9B7E', size: 62, speed: '.9s', embers: 7, cls: 'lv3' },
  Imparable: { n: 4, color: '#B98CFF', text: '#D6C2FF', size: 66, speed: '.7s', embers: 9, cls: 'lv4' }
};
function rachaCard(sk) {
  const lv = LVS[sk.level.name] || LVS.Cumplidor;
  const min = sk.level.min || 0;
  const lit = sk.next ? Math.round((sk.pts - min) / (sk.next.min - min) * 10) : 10;
  const lefts = [18, 70, 40, 82, 28, 58, 10, 48, 76];
  const embers = Array.from({ length: lv.embers }, (_, i) => `<span class="ember" style="left:${lefts[i]}%;background:${i % 2 ? '#FFF1C2' : lv.color};animation-duration:${(1.4 + (i % 3) * 0.4).toFixed(1)}s;animation-delay:${(i * 0.23).toFixed(2)}s"></span>`).join('');
  const burst = ui.burst && Date.now() - ui.burst < 2200;
  const left = sk.next ? sk.next.min - sk.pts : 0;
  return `<section class="racha ${lv.cls}">
    <div class="rfire"><span class="rglow" style="background:${lv.color}"></span>${burst ? `<span class="rring" style="border-color:${lv.color}"></span>` : ''}${embers}
      <div class="${burst ? 'burst' : ''}">${icon.flame(lv.color, lv.size).replace('class="flame"', `class="flame" style="transform-origin:50% 90%;animation:flick ${lv.speed} ease-in-out infinite"`)}</div></div>
    <div class="rtx"><p class="lbl" style="color:${lv.text}">Tu racha</p>
      <div class="row" style="align-items:baseline;gap:8px"><b class="num" style="font-size:44px;line-height:1;color:${lv.text}">${sk.pts}</b><span class="small" style="color:var(--r-sub)">puntos</span></div>
      <span class="rlv" style="background:${lv.color}">Nivel ${lv.n} · ${sk.level.name}</span>
      <div class="rdots">${Array.from({ length: 10 }, (_, i) => `<i style="background:${i < lit ? lv.color : 'var(--r-off)'}"></i>`).join('')}</div>
      <span style="font-size:11px;color:var(--r-sub)">${sk.next ? `${left} ${left === 1 ? 'punto más' : 'puntos más'} para ser ${sk.next.name.toLowerCase()}` : 'Nivel máximo: sigue así'}</span></div>
    ${burst ? '<span class="rplus">+1 punto</span>' : ''}</section>`;
}
function heroOf(items, now) {
  const arrive = items.find((x) => x.type === 'event' && R.canCheckIn(x.event, now));
  if (arrive) return arrive;
  const order = ['claim', 'endreq', 'proposal', 'notice', 'hire', 'settle', 'corr'];
  for (const t of order) { const f = items.find((x) => x.type === t); if (f) return f; }
  return items.find((x) => x.type === 'task' && x.band === 0 && x.cm.ok) || null;
}
function heroCard(x, now) {
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
  const rest = items.filter((x) => x !== hero);
  const today = R.limaDate(now);
  const idx = (x) => { if (!x.due || x.urgent) return 0; const d = dayDiff(today, R.limaDate(x.due)); return d < 0 ? 0 : d > 4 ? 5 : d; };
  const days = [[], [], [], [], [], []];
  rest.forEach((x) => days[idx(x)].push(x));
  const nDays = days[5].length ? 6 : 5;
  if (ui.day == null || ui.dayFor !== today) { ui.day = Math.max(0, days.findIndex((d) => d.length)); ui.dayFor = today; }
  const sel = Math.min(ui.day, nDays - 1);
  const pendCount = items.length;
  html += `<div class="between" style="margin-top:2px;align-items:baseline"><p class="num" style="margin:0;font-size:20px;font-weight:700">Te toca</p><span class="muted">${pendCount ? pendCount + (pendCount === 1 ? ' pendiente' : ' pendientes') : 'Todo al día'}</span></div>`;
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
  html += `<section class="meta"><div class="between" style="align-items:center"><span class="lbl" style="color:var(--amber)">Meta del equipo</span><div style="display:flex">${st.partners().map((m, i) => `<span style="margin-left:${i ? -8 : 0}px;border:2px solid var(--meta-bg);border-radius:50%">${av(m, 26)}</span>`).join('')}</div></div>
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
  html += `<section class="wallet"><div class="between" style="align-items:center"><span class="lbl" style="color:var(--mint)">En la billetera</span><span class="muted" style="color:var(--w-sub)">${icon.lock} Solo tú</span></div>
    <b class="num wmoney" data-wallet="${total.toFixed(2)}" data-from="${prev.toFixed(2)}">${R.money(prev)}</b>
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
function vEtapas() {
  const p = st.project();
  if (!p) return `<div class="card">${banner('wait', 'Sin proyecto', 'Crea un proyecto para empezar.')}${isAdminBtn('<a class="btn b-amber" href="#/proyecto/nuevo">Crear proyecto</a>')}</div>`;
  const c = st.ctx();
  const now = new Date();
  const tab = ui.stage || 'pre';
  const open = p.status === 'abierto';
  const left = p.videos_total - c.videos.length;
  const byStart = (a, b) => new Date(a.starts_at) - new Date(b.starts_at);
  const vOf = (ids) => ids.map((id) => c.videos.find((v) => v.id === id)).filter(Boolean).sort((a, b) => a.num - b.num);
  const rods = c.events.filter((e) => e.kind === 'rodaje').sort(byStart);
  const week = (rod) => { const act = rods.filter(active); const i = act.indexOf(rod); return i === -1 ? null : i + 1; };
  const group = (k, title, sub, chip, rows, extra = '', dim = false) => `<section class="vgroup${dim ? ' dim' : ''}"><div class="vghead"><span class="tic tint-${k}">${stageIc(k, 17)}</span><div style="flex:1;min-width:0"><b class="num" style="font-size:16px">${title}</b>${sub ? `<p class="muted" style="margin:1px 0 0">${sub}</p>` : ''}</div>${chip}</div>${rows}${extra}</section>`;
  const chip = (t, k) => `<span class="gchip g-${k}">${t}</span>`;
  const evState = (e) => e.status === 'cancelado' ? chip('Cancelado', 'past') : e.status === 'reprogramado' ? chip('Reprogramado', 'past') : e.kind === 'reunion' && e.ended_at ? chip('Finalizada', 'done') : e.kind === 'reunion' && R.meetingOpen(e, now) ? chip('En curso', 'live') : new Date(e.starts_at) < now ? chip(e.kind === 'rodaje' ? 'Pasó' : 'Pasó', 'past') : R.band(new Date(e.starts_at), now) <= 1 ? chip(R.limaDate(e.starts_at) === R.limaDate(now) ? 'Hoy' : 'Pronto', 'live') : chip('Programado', 'next');
  let html = `<div class="between" style="align-items:center"><div><h1 style="font-size:28px">Etapas</h1><p class="sub" style="margin:2px 0 0">${c.videos.length} de ${p.videos_total} videos repartidos</p></div>${open && left > 0 ? `<a class="btn sm b-amber" href="#/semana">${icon.plus}Programar semana</a>` : ''}</div>`;
  html += `<div class="stabs" role="tablist">${[['pre', 'Preproducción', 'pre'], ['rod', 'Rodaje', 'prod'], ['post', 'Posproducción', 'post']].map(([k, t, ic]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-act="stage" data-k="${k}">${stageIc(ic, 20)}<span>${t}</span></button>`).join('')}</div>`;
  html += `<div class="legend wrapl"><span><i class="vs vs-ok mini">${icon.tick}</i>Hecho</span><span><i class="vs vs-late mini"></i>Tarde</span><span><i class="vs vs-p mini"></i>Pendiente</span><span>${st.partners().map((m) => { const col = COLOR[m.role]; return `<i class="vins mini" style="background:${col[0]};color:${col[1]}">${esc(ini(m.name)).charAt(0)}</i>`; }).join('')}de quién es</span></div>`;
  if (tab === 'pre') {
    const meets = c.events.filter((e) => e.kind === 'reunion').sort(byStart).reverse();
    if (!meets.length) html += `<div class="card"><p class="empty">Todavía no hay reuniones. Usa "Programar semana": primero el rodaje, luego la reunión.</p></div>`;
    for (const e of meets) {
      const rod = S.data.events.find((x) => x.id === e.rodaje_id);
      const w = rod ? week(rod) : null;
      const vs = vOf(e.video_ids);
      html += group('pre', `${w ? 'Semana ' + w + ' · ' : ''}reunión ${R.fmtDay(R.limaDate(e.starts_at))}`, rod ? 'Para el rodaje del ' + R.fmtWhen(rod.starts_at) : 'Sin rodaje', evState(e),
        vs.map((v) => vrow(v, c, now, 'pre')).join(''),
        !vs.length && active(e) && open && rod ? `<a class="dashadd" href="#/semana/${rod.id}">${icon.plus}Repartir los videos de esta semana</a>` : '', !active(e) || !!e.ended_at);
    }
    const loose = c.videos.filter((v) => !R.meetingOf(v, c));
    if (loose.length) html += group('pre', 'Sin reunión', '', '', loose.map((v) => vrow(v, c, now, 'pre')).join(''));
  } else if (tab === 'rod') {
    if (!rods.length) html += `<div class="card"><p class="empty">Todavía no hay rodajes.</p></div>`;
    for (const e of rods.slice().reverse()) {
      const vs = vOf(e.video_ids);
      html += group('prod', `Rodaje ${R.fmtWhen(e.starts_at)}${wasReprogrammed(e) ? ' <em class="tag-red">Reprogramado</em>' : ''}`, `${vs.length} videos · tolerancia hasta ${R.limaTime(new Date(new Date(e.starts_at).getTime() + e.tolerance_min * 60000))}`, `<a href="#/e/${e.id}" style="text-decoration:none">${evState(e)}</a>`,
        vs.map((v) => vrow(v, c, now, 'rod')).join('') + (vs.length ? `<a class="dashadd solid" href="#/e/${e.id}">${icon.cam('var(--c-prod)', 16)}Abrir rodaje: llegadas y grabación</a>` : ''),
        !vs.length && active(e) && open ? `<a class="dashadd" href="#/semana/${e.id}">${icon.plus}Repartir los videos de esta semana</a>` : '', !active(e) || new Date(e.starts_at) < now && vs.every((v) => R.videoState(v, c, now).r));
    }
    const loose = c.videos.filter((v) => !R.rodajeOf(v, c) && !R.videoState(v, c, now).r);
    if (loose.length) html += group('prod', 'Videos sin rodaje', 'Se cancelaron o reprogramaron', chip('Atención', 'live'), loose.map((v) => vrow(v, c, now, 'rod')).join(''), open ? `<button class="btn sm b-amber" data-act="newRod" style="align-self:stretch">Programar rodaje para estos videos</button>` : '');
  } else {
    const all = c.videos.slice();
    const states = new Map(all.map((v) => [v.id, R.videoState(v, c, now)]));
    const nextDue = (v) => { const s = states.get(v.id); return s.mo ? s.d.finalDue : (s.d.montajeDue || s.d.finalDue); };
    const done = all.filter((v) => states.get(v.id).ac).sort((a, b) => a.num - b.num);
    const pend = all.filter((v) => !states.get(v.id).ac).sort((a, b) => nextDue(a) - nextDue(b));
    const soon = pend.filter((v) => states.get(v.id).r && R.band(nextDue(v), now) <= 1 || states.get(v.id).montajeMissed);
    const later = pend.filter((v) => soon.indexOf(v) === -1);
    if (!all.length) html += `<div class="card"><p class="empty">Todavía no hay videos.</p></div>`;
    if (soon.length) html += group('post', 'Entregas de estos días', 'Montaje y video final', chip('Urgente', 'live'), soon.map((v) => vrow(v, c, now, 'post')).join(''));
    if (later.length) html += group('post', 'Próximas', 'Se habilitan después del rodaje', chip('Con tiempo', 'next'), later.map((v) => vrow(v, c, now, 'post')).join(''));
    if (done.length) html += group('post', 'Entregados al cliente', '', chip(done.length + (done.length === 1 ? ' video' : ' videos'), 'done'), done.map((v) => vrow(v, c, now, 'post')).join(''), '', true);
  }
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
  const rows = R.KINDS.map((k) => {
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
      if (cm.ok) right = `<button class="tbtn ${viaG ? 't-g' : cm.take ? 't-take' : 't-done'}" data-act="mark" data-v="${v.id}" data-k="${k}"${viaG ? ` data-h="${hire.id}"` : ''}>${viaG ? 'Con Guillermo' : cm.take ? 'Tomar' : 'Hecho'}</button>`;
      else if (cm.gone) { right = `<span class="tbtn t-gone">Venció</span>`; sub = 'Venció ' + R.fmtWhen(due) + ' · pasó a tu compañero'; subC = 'u0'; }
      else { right = `<span class="tbtn t-lock">${icon.lock}${k === 'rodaje' && ev ? (R.limaDate(now) === R.limaDate(ev.starts_at) ? R.limaTime(new Date(new Date(ev.starts_at).getTime() - R.RULES.open * 60000)) : dowShort(ev.starts_at)) : 'Espera'}</span>`; if (cm.why) sub = esc(cm.why) + (due ? ' · ' + R.fmtWhen(due) : ''); dim = true; }
      if (cm.take && cm.ok) { sub = `No llegó a tiempo · si lo haces, cobras tú`; subC = 'u0'; }
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
  ${vs.montajeMissed && !vs.mo ? banner('bad', 'El montaje no llegó a tiempo', 'Según el punto 5.7, el administrador hace el montaje y el final, y cobra la posproducción de este video.') : ''}
  <section class="tlist" style="padding:4px 14px">${rows}</section>
  <p class="muted" style="margin:-6px 4px 0;line-height:1.45">Se marca en orden: guion y storyboard, luego el rodaje (el día del rodaje, con tu llegada confirmada), el montaje y el video final.</p>
  ${ev ? `<a class="btn b-ghost" href="#/e/${ev.id}">${icon.cam('var(--c-prod)', 16)}Ver rodaje · ${R.fmtWhen(ev.starts_at)}</a>` : ''}
  ${changeOwner}`;
}

// ---------- Reunión o rodaje ----------
function vEvent(id) {
  const e = S.data.events.find((x) => x.id === id);
  if (!e) return `<p class="empty">No encontrado.</p>`;
  const me = S.me;
  const now = new Date();
  const isRod = e.kind === 'rodaje';
  const ps = st.partners();
  const c = st.ctx(e.project_id);
  const p = projOf(e.project_id);
  const open = p && p.status === 'abierto';
  const act = active(e);
  const myS = st.eventStatus(e, me.id, now);
  const vids = e.video_ids.map((vid) => S.data.videos.find((v) => v.id === vid)).filter(Boolean).sort((a, b) => a.num - b.num);
  const start = new Date(e.starts_at);
  const tolEnd = new Date(start.getTime() + e.tolerance_min * 60000);
  const atts = S.data.attendance.filter((x) => x.event_id === e.id);
  const someoneArrived = atts.some((a) => a.arrived_at || a.claimed_at);
  const amHere = ['puntual', 'tarde'].indexOf(myS.k) !== -1;
  let html = `${backTo('#/videos', 'Etapas')}
  <div><div class="between"><p class="lbl" style="color:${isRod ? '#FFB547' : '#A9C7FF'}">${isRod ? 'Rodaje' : 'Reunión de preproducción'}${wasReprogrammed(e) ? ' <em class="tag-red">Reprogramado</em>' : ''}</p>${evChip(e, now)}</div><h1>${R.fmtWhen(e.starts_at)}</h1>
  <p class="sub">Puntual hasta ${R.limaTime(new Date(start.getTime() + 600000))} · tolerancia hasta ${R.limaTime(tolEnd)}${isRod ? ` · avisos a tiempo hasta ${R.fmtWhen(R.noticeDeadline(e))}` : ''}</p></div>`;
  if (e.status === 'reprogramado') { const nu = S.data.events.find((x) => x.id === e.replaced_by); html += banner('bad', 'Este rodaje se reprogramó', (nu ? 'Nueva fecha: ' + R.fmtWhen(nu.starts_at) + '. ' : '') + (e.cancel_note ? esc(e.cancel_note) : ''), nu ? `<a class="btn sm b-ghost" href="#/e/${nu.id}" style="margin-top:8px">Ver el nuevo rodaje</a>` : ''); }
  if (e.status === 'cancelado') html += banner('bad', 'Cancelado', esc(e.cancel_note || ''));
  if (!isRod && e.rodaje_id) { const r = S.data.events.find((x) => x.id === e.rodaje_id); if (r) html += `<a class="btn sm b-ghost" href="#/e/${r.id}" style="align-self:flex-start">Para el rodaje del ${R.fmtWhen(r.starts_at)}</a>`; }
  // Asistencia
  html += `<section class="card"><p class="lbl">Asistencia</p>${ps.map((m) => {
    const a = st.attOf(e.id, m.id);
    const s = st.eventStatus(e, m.id, now);
    const extra = a && a.arrived_at ? 'Llegó ' + R.limaTime(a.arrived_at) + (a.confirmed_by ? ' · confirmó ' + first(st.member(a.confirmed_by)) : '')
      : a && a.claimed_at ? 'Marcó su llegada a las ' + R.limaTime(a.claimed_at)
      : a && a.notice && a.notice.sent_at ? 'Avisó ' + R.fmtWhen(a.notice.sent_at) + (a.notice.reason === 'fm' ? ' · fuerza mayor (' + esc(a.notice.fm_kind || '') + ')' : '') : '';
    const confirm = me.role === 'admin' && act && a && a.claimed_at && !a.arrived_at && m.id !== me.id
      ? `<div class="grid2" style="margin-top:8px"><button class="btn sm b-mint" data-act="confirmArr" data-a="${a.id}" data-m="claimed">Sí, llegó a las ${R.limaTime(a.claimed_at)}</button><button class="btn sm b-ghost" data-act="confirmArr" data-a="${a.id}" data-m="now">No, llegó ahora</button></div>` : '';
    return `<div><div class="row">${av(m)}<div style="flex:1"><b>${esc(m.name)}</b><p class="muted" style="margin:2px 0 0">${extra}</p></div>${attChip(s)}${a && a.photo ? `<button class="btn sm b-ghost" data-act="photo" data-p="${esc(a.photo)}">Foto</button>` : ''}</div>${confirm}</div>`;
  }).join('')}</section>`;
  if (!isRod && act) html += guillermoBlock(e, myS, now);
  // Mis acciones
  if (act && myS.k === 'pendiente') {
    if (R.canCheckIn(e, now)) html += `<button class="btn b-mint" data-act="checkin" data-e="${e.id}">Llegué</button><p class="muted" style="margin:-6px 0 0;text-align:center">${me.role === 'admin' || R.adminAbsent(e, c, now) ? 'Queda registrada con la hora de ahora.' : 'Queda con la hora de ahora y el administrador la confirma.'}</p>`;
    else if (now < start) html += banner('wait', 'La llegada se marca desde las ' + R.limaTime(new Date(start.getTime() - 900000)), '15 minutos antes de la hora programada.');
    if (now < tolEnd) html += `<button class="btn b-ghost" data-act="notice" data-e="${e.id}">No podré ir</button>`;
  }
  if (act && myS.k === 'por_confirmar') html += banner('wait', 'Tu llegada espera confirmación', `La marcaste a las ${R.limaTime(st.attOf(e.id, me.id).claimed_at)}. Si el administrador la confirma, vale esa hora.`);
  if (act && myS.k === 'ausente' && (!st.attOf(e.id, me.id) || !st.attOf(e.id, me.id).notice) && now - tolEnd < 24 * 3600000) {
    html += `<button class="btn b-purple" data-act="notice" data-e="${e.id}" data-fm="1">Fue fuerza mayor</button><p class="muted" style="margin:-6px 0 0;text-align:center">Puedes marcarlo hasta 24 h después (7.9). Tu compañero tiene que aceptarlo.</p>`;
  }
  // Reunión: finalizar
  if (!isRod && act) {
    if (e.ended_at) html += banner('ok', 'Reunión finalizada · ' + R.limaTime(e.ended_at), 'Los guiones y storyboards terminados hasta esa hora sumaron +1 punto de reunión por video.');
    else if (e.end_requested_at) {
      if (me.role === 'admin') html += `<div class="card" style="border-color:#4A3414;background:#1C130A"><b>${esc(st.member(e.end_requested_by).name)} pidió finalizar a las ${R.limaTime(e.end_requested_at)}</b><p class="sub" style="margin:0">Si lo confirmas, la reunión queda finalizada a esa hora. Los puntos de reunión cuentan hasta ahí.</p><button class="btn b-amber" data-act="confirmEnd" data-e="${e.id}">Confirmar fin de la reunión</button></div>`;
      else html += banner('wait', (e.end_requested_by === me.id ? 'Pediste' : esc(st.member(e.end_requested_by).name) + ' pidió') + ' finalizar a las ' + R.limaTime(e.end_requested_at), 'El administrador lo confirma. Los puntos de reunión cuentan hasta esa hora.');
    } else if (R.meetingOpen(e, now)) {
      html += banner('fm', '+1 punto de reunión por video', 'Termina el guion y el storyboard de cada video antes de finalizar la reunión y sumas un punto extra en tu racha.');
      if (amHere || me.role === 'admin') {
        const direct = me.role === 'admin' || R.adminAbsent(e, c, now);
        html += `<button class="btn ${direct ? 'b-amber' : 'b-ghost'}" data-act="endMeeting" data-e="${e.id}">${direct ? 'Finalizar reunión' : 'Pedir finalizar la reunión'}</button>`;
      }
      html += `<p class="muted" style="margin:-6px 0 0;text-align:center">Si nadie la finaliza, se cierra sola a las ${R.limaTime(R.meetingEnd(e))} (6 h).</p>`;
    }
    const rod = S.data.events.find((x) => x.id === e.rodaje_id);
    if (!e.video_ids.length && rod && open) html += `<a class="btn b-amber" href="#/semana/${rod.id}">Repartir videos</a>`;
    if (e.ended_at && rod && active(rod) && open && now < R.preDueFor(rod.starts_at) && !S.data.events.some((x) => x.kind === 'reunion' && x.rodaje_id === rod.id && active(x) && !x.ended_at)) html += `<button class="btn b-ghost" data-act="extraMeet" data-r="${rod.id}">Agendar otra reunión para este rodaje</button>`;
  }
  // Avisos del otro por responder
  for (const a of atts.filter((x) => x.member_id !== me.id && x.notice && x.notice.sent_at)) {
    const who = st.member(a.member_id);
    const s = st.eventStatus(e, a.member_id, now);
    const n = a.notice;
    if (n.decision) { html += banner('ok', `Respondiste el aviso de ${esc(who.name)}`, decisionText(n.decision)); continue; }
    if (!act) continue;
    const want = n.choice === 'other' ? 'Pide que grabes sus videos.' : n.choice === 'repro' ? 'Pide reprogramar.' : '';
    if (n.reason === 'fm') html += `<div class="card" style="border-color:#3E2C63;background:#160F22"><b>${esc(who.name)} marcó fuerza mayor</b><p class="sub" style="margin:0">Motivo: ${esc(n.fm_kind || '')}. ${want} Si la aceptas, no cuenta como falta ni resta racha (7.9). El pago siempre es de quien hace el trabajo.</p><div class="grid2"><button class="btn b-purple" data-act="decide" data-a="${a.id}" data-d="accept">Acepto</button><button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="talk">Conversarlo</button></div></div>`;
    else if (!isRod) html += `<div class="card"><b>${esc(who.name)} ${s.k === 'cancel_ok' ? 'canceló a tiempo' : 'avisó fuera de plazo'}</b><p class="sub" style="margin:0">${s.k === 'cancel_ok' ? 'Cancelar con 24 h es su derecho: no resta racha.' : 'Avisó con menos de 24 h: le resta 3 puntos.'} Si quiere, puede contratar a Guillermo.</p><button class="btn b-amber" data-act="decide" data-a="${a.id}" data-d="ok">Entendido</button></div>`;
    else if (s.k === 'cancel_ok') html += `<div class="card"><b>${esc(who.name)} canceló a tiempo</b><p class="sub" style="margin:0">${want} Avisó antes de las 18:00 del día anterior: es su derecho (7.8). Puedes reprogramar el día o grabar solo tus videos. Sus videos no los tomas sin su permiso.</p><div class="grid2"><button class="btn b-amber" data-act="reday" data-e="${e.id}" data-a="${a.id}">Reprogramar el día</button><button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="own">Grabo solo los míos</button></div>${n.choice === 'other' ? `<button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="record">Grabo también los suyos (me lo pidió)</button>` : ''}</div>`;
    else html += `<div class="card" style="border-color:#4A3414;background:#1C130A"><b>${esc(who.name)} avisó fuera de plazo</b><p class="sub" style="margin:0">${want} Tú decides: reprogramar el día (los gastos extra van por su cuenta) o tomar el día completo y grabar también sus videos (te corresponde ese pago, 7.3).</p><div class="grid2"><button class="btn b-ghost" data-act="reday" data-e="${e.id}" data-a="${a.id}">Reprogramar el día</button><button class="btn b-amber" data-act="decide" data-a="${a.id}" data-d="record">Tomo el día completo</button></div></div>`;
  }
  // Videos del rodaje
  if (isRod && vids.length) {
    html += `<section class="card" style="padding:12px 16px"><p class="lbl">Videos de este rodaje</p><div class="list">${vids.map((v) => {
      const t = S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje');
      const o = st.member(v.owner);
      let right = '', why = '';
      if (t) right = `<span class="chip c-ok">Grabó ${first(st.member(t.done_by))}</span>`;
      else if (act && open) {
        const cm = R.canMark(v, 'rodaje', me, c, now);
        if (cm.ok) right = `<button class="btn sm b-amber" data-act="quick" data-v="${v.id}" data-k="rodaje">${cm.take ? 'Lo grabé yo' : 'Grabado'}</button>`;
        else { right = '<span class="chip c-mute">Pendiente</span>'; why = cm.why; }
      } else right = '<span class="chip c-mute">—</span>';
      return `<div class="li">${av(o, 26)}<span class="t"><b>Video ${v.num}</b><span>De ${esc(o.name)} · publica ${R.fmtDay(v.publish_date)}</span>${why ? `<span class="why">${icon.lock} ${esc(why)}</span>` : ''}</span>${right}</div>`;
    }).join('')}</div>
    ${act && open && now > start && vids.some((v) => !S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje')) ? `<button class="btn b-ghost" data-act="repro" data-e="${e.id}">Reprogramar videos no grabados</button>` : ''}</section>`;
  }
  // Herramientas
  if (act && open) {
    const tools = [];
    const anyShot = vids.some((v) => S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje'));
    if (isRod && !anyShot && (me.role === 'admin' || atts.some((a) => a.member_id !== me.id && a.notice && a.notice.sent_at))) tools.push(`<button class="btn b-ghost" data-act="reday" data-e="${e.id}">Reprogramar el rodaje completo</button>`);
    if (me.role === 'admin' && !someoneArrived) tools.push(`<button class="btn b-ghost" data-act="moveEv" data-e="${e.id}">Cambiar fecha u hora</button>`);
    if (me.role === 'admin' && now < start) tools.push(`<button class="btn b-ghost" data-act="tol" data-e="${e.id}">Cambiar tolerancia (${e.tolerance_min} min)</button>`);
    if (me.role === 'admin' && !e.video_ids.length && !atts.length && !S.data.hires.some((h) => h.event_id === e.id)) tools.push(`<button class="btn b-red" data-act="delEv" data-e="${e.id}">Borrar ${isRod ? 'rodaje' : 'reunión'}</button>`);
    else if (me.role === 'admin') tools.push(`<button class="btn b-red" data-act="cancelEv" data-e="${e.id}">Cancelar ${isRod ? 'rodaje' : 'reunión'}</button>`);
    if (tools.length) html += `<p class="lbl" style="margin-top:6px">Opciones</p>` + tools.join('');
  }
  return html;
}

function guillermoBlock(e, myS, now) {
  const me = S.me;
  const start = new Date(e.starts_at);
  const h = st.hireOpen(e.id);
  const p = S.data.projects.find((x) => x.id === e.project_id);
  const preVal = R.rates(p).guion + R.rates(p).storyboard;
  if (!h) {
    if (now < start && myS.k === 'pendiente' && st.partners().length > 1) return `<div class="card" style="border-color:#3E2C63;background:#160F22"><p class="lbl" style="color:#C9B2FF">¿No irás a esta reunión?</p><p class="sub" style="margin:0">Puedes contratar a <b style="color:#fff">Guillermo</b> para tu preproducción. Tu compañero hace tus guiones y storyboards con él y recibe el 80 % (${R.money(preVal * 0.8)} por video). Tú conservas el 20 % y tu asistencia queda como "no requerida": no es falta ni suma racha.</p><button class="btn b-purple" data-act="hire" data-e="${e.id}">Contratar a Guillermo</button></div>`;
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
  if (T === 'attendance.insert' || T === 'attendance.update') {
    const m = st.member(n.member_id);
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
  html += `<section class="card" style="padding:12px 16px"><p class="lbl">Integrantes</p><div class="list">${ms.map((m) => {
    const pendingInv = !m.user_id;
    const link = base + '#/i/' + m.invite_code;
    const msg = encodeURIComponent(`Hola, te invito a nuestro equipo en la app de registro. Entra aquí: ${link}`);
    return `<div class="li">${av(m)}<span class="t"><b>${esc(m.name)}${m.id === me.id ? ' (tú)' : ''}</b><span>${ROLE[m.role]}${m.apoyo ? ' · recibe apoyo en el acabado' : ''}${pendingInv ? ' · invitación pendiente' : ''}</span>
      ${pendingInv && m.invite_code ? `<span class="row" style="gap:6px;margin-top:8px"><a class="btn sm b-mint" href="https://wa.me/?text=${msg}" target="_blank" rel="noopener">Enviar por WhatsApp</a><button class="btn sm b-ghost" data-act="copy" data-t="${esc(link)}">Copiar enlace</button></span>` : ''}</span>
      ${(me.role === 'admin' || m.id === me.id) && !pendingInv ? `<button class="btn sm b-ghost" data-act="rename" data-id="${m.id}">Editar</button>` : ''}</div>`;
  }).join('')}</div></section>`;
  if (me.role === 'admin') html += `<form data-form="invite" class="card"><p class="lbl">Invitar a tu socio</p>
    <label class="field"><span>Nombre</span><input class="in" name="name" required placeholder="Nombre de tu socio"></label>
    <label class="row small" style="gap:10px"><input type="checkbox" name="apoyo" checked style="width:20px;height:20px"> Recibe apoyo en el acabado (5.5): su montaje vence 2 días antes</label>
    <button class="btn b-amber">Crear invitación</button><p class="muted" style="margin:0">Te dará un enlace para enviarle por WhatsApp. Vence en 7 días.</p></form>`;
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
    ['mon', 'Montaje (con apoyo)', 'días antes de publicar, a las 21:00', 1, 1, 5, (x) => x + (x === 1 ? ' día' : ' días')],
    ['fin', 'Video final', 'días antes de publicar, a las 21:00', 1, 0, 3, (x) => x + (x === 1 ? ' día' : ' días')],
    ['undo', 'Deshacer una tarea', 'tiempo para corregir un error al marcar', 5, 5, 60, (x) => x + ' min']]],
  ['Avisar que no podrás ir', [
    ['avr', 'Rodaje · a tiempo hasta', 'del día anterior · después resta 3', 30, 720, 1380, (x) => R.hm(x)],
    ['avm', 'Reunión · con anticipación', 'horas antes · después resta 3', 2, 6, 72, (x) => x + ' h']]]
];
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
    ${aitem('#/admin/reglas', 'pre', icon.clock.replace(/width="12" height="12"/, 'width="19" height="19"').replace('currentColor', 'var(--c-pre)'), 'Reglas de registro', 'Llegadas, plazos y avisos de inasistencia', st.pendingProposal('rules') ? '<span class="gchip g-next">1 propuesta</span>' : '')}</div></div>`;
  html += `<div><p class="lbl alb">Avisos · los cambias tú</p><div class="agrp">${aitem('#/admin/recordatorios', 'prod', icon.bell('var(--c-prod)'), 'Recordatorios automáticos', `${remOn} de 8 activos · descanso 22:00 a 7:00`)}</div></div>`;
  html += `<div><p class="lbl alb">App · los cambias tú</p><div class="agrp">
    ${aitem('#/admin/apariencia', 'info', icon.palette, 'Apariencia', `Color principal y urgencia <span class="sw4">${[L.main, L.u0, L.u1, L.u2].map((c) => `<i style="background:${c}"></i>`).join('')}</span>`)}
    ${aitem('#/admin/practica', 'lab', icon.flask, 'Modo práctica', 'Prueba con un proyecto de ejemplo · no toca los datos reales', st.practice() ? '<span class="gchip g-live">Encendido</span>' : '<span class="gchip g-past">Apagado</span>')}</div></div>`;
  html += `<div><p class="lbl alb">Equipo</p><div class="agrp">
    ${aitem('#/equipo', 'blue', icon.users, 'Integrantes e invitaciones', st.partners().map((m) => esc(m.name.split(' ')[0]) + (m.role === 'admin' ? ' (admin)' : '')).join(' · '))}
    ${aitem('#/historial', 'info', icon.hist, 'Historial de cambios', 'Cada ajuste queda registrado · lo ve también tu socio')}</div></div>`;
  html += `<p class="muted" style="margin:0 4px;line-height:1.45">Clientes y proyectos se crean desde el selector de arriba (el nombre del proyecto).</p>`;
  return html;
}
function propSummary(p) {
  const old = p.old || {};
  if (p.kind === 'pct') return PCT_DEF.map(([k, n]) => `${n.split(' ')[0]} ${p.data[k]}`).join(' · ');
  const all = RULE_DEF.flatMap((g) => g[1]);
  return Object.entries(p.data).map(([k, v]) => { const d = all.find((x) => x[0] === k); const was = old[k] != null ? old[k] : R.DEFAULT_RULES[k]; return d ? `${d[1]}: ${d[6](was)} → ${d[6](v)}` : k; }).join(' · ');
}
function vAdminLook() {
  const cur = ui.look || st.look();
  const prevDays = [['HOY', 0], ['DOM', 1], ['LUN', 2], ['MAR', null], ['MIÉ', 2]];
  let html = `${backTo('#/admin', 'Administrador')}<div><h1 style="font-size:28px">Apariencia</h1><p class="sub">Elige y mira el resultado al instante. Al guardar, cambia en los celulares de los dos.</p></div>`;
  html += `<section class="card" style="gap:12px"><p class="lbl">Vista previa</p>
    <div class="dsqs">${prevDays.map(([d, b], i) => `<div class="dsq ${b === null ? 'd-none' : ''} ${i === 0 ? 'on' : ''}" style="${b === null ? '' : `--uc:${cur['u' + b]}`}"><span class="dw">${d}</span><b class="num">${31 + i > 31 ? i : 31}</b></div>`).join('')}</div>
    <div class="trow" style="border:none;padding:6px 8px;border-radius:14px;background:var(--s2)"><span class="tic tint-post">${stageIc('post')}</span><span class="ttx"><b>Montaje · video 4</b><span class="due-l" style="color:${cur.u0}">Hoy 21:00 · en 58 min</span></span><span class="tbtn" style="background:${cur.main};color:${fgFor(cur.main)}">Hecho</span></div></section>`;
  html += `<div><p class="lbl">Color principal</p><p class="muted" style="margin:4px 0 10px">Botones, pestaña activa y títulos destacados.</p><div class="swrow">${PALETTE.main.map(([n, c]) => `<button class="swb" data-act="lookPick" data-k="main" data-c="${c}" aria-label="${n}" aria-pressed="${cur.main === c}"><span style="background:${c};${cur.main === c ? `box-shadow:0 0 0 3px var(--bg),0 0 0 6px ${c}` : ''}">${cur.main === c ? icon.tick : ''}</span><small>${n}</small></button>`).join('')}</div></div>`;
  html += `<div style="display:flex;flex-direction:column;gap:12px"><div><p class="lbl">Colores de urgencia</p><p class="muted" style="margin:4px 0 0">Los cuadrados de los días y las fechas límite en Inicio y Etapas.</p></div>
    ${[['u0', 'Urgente', 'vence hoy o ya venció'], ['u1', 'Próximo', 'vence en 1 o 2 días'], ['u2', 'Con tiempo', 'vence en 3 días o más']].map(([k, n, w]) => `<div class="card tight"><div class="row" style="gap:10px"><i style="width:14px;height:14px;border-radius:4px;background:${cur[k]}"></i><b style="flex:1">${n}</b><span class="muted">${w}</span></div>
      <div class="row" style="gap:8px">${PALETTE[k].map(([nn, c]) => `<button class="swu" data-act="lookPick" data-k="${k}" data-c="${c}" aria-label="${nn}" aria-pressed="${cur[k] === c}" style="background:${c};${cur[k] === c ? 'box-shadow:0 0 0 2px var(--s1),0 0 0 5px var(--tx)' : ''}">${cur[k] === c ? icon.tick : ''}</button>`).join('')}</div></div>`).join('')}</div>`;
  html += `<div class="row" style="gap:10px"><button class="btn b-ghost" style="flex:1" data-act="lookReset">Restablecer</button><button class="btn b-amber" style="flex:2" data-act="lookSave">Guardar para los dos</button></div><p class="muted" style="margin:-6px 0 0;text-align:center">No necesita aprobación del socio · queda en el historial.</p>`;
  return html;
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
    const all = RULE_DEF.flatMap((g) => g[1]);
    rows = Object.entries(p.data).map(([k, v]) => { const d = all.find((x) => x[0] === k); if (!d) return ''; const was = old[k] != null ? old[k] : R.DEFAULT_RULES[k]; return `<div class="srow ch"><span class="ttx"><b>${d[1]}</b><span>Antes: ${d[6](was)} · ${d[2]}</span></span><b class="num sval">${d[6](v)}</b></div>`; }).join('');
  }
  const status = { pendiente: ['Pendiente', 'next'], aprobada: ['Aprobada', 'done'], rechazada: ['Rechazada', 'past'], retirada: ['Retirada', 'past'] }[p.status];
  let html = `${backTo('#/', 'Inicio')}<div><div class="between" style="align-items:center"><p class="lbl">Propuesta de ${esc(who.name)}</p><span class="gchip g-${status[1]}">${status[0]}</span></div><h1 style="font-size:26px">${p.kind === 'pct' ? 'Porcentajes del acuerdo' : 'Reglas de registro'}</h1><p class="sub">${R.fmtWhen(p.created_at)}${p.kind === 'pct' ? ' · si la apruebas, rige desde el próximo proyecto' : ' · si la apruebas, se aplica desde ahora'}</p></div>`;
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
  ${cm.take ? banner('warn', `Tomas la tarea de ${esc(st.member(v.owner).name)}`, `No la entregó a tiempo: el pago (${R.money(val)}) pasa a ti y queda en el historial.`) : ''}
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
    ? (isR ? 'Avisar hasta las 18:00 del día anterior es cancelar a tiempo: no resta racha. Tu compañero puede reprogramar el día o grabar solo sus videos; los tuyos no los toma sin tu permiso.' : 'Avisar con 24 h es cancelar a tiempo: no resta racha.')
    : (isR ? 'Tu compañero decide: reprogramar el día (los gastos extra van por tu cuenta) o tomar el día completo y cobrar esos rodajes. Resta 3 puntos.' : 'Avisar con menos de 24 h resta 3 puntos.');
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
function showUndo(task, amt) {
  if (!task || !task.id) return;
  ui.undo = { id: task.id, amt, until: Date.now() + 8000 };
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
  else if (r[0] === 'i' && r[1]) html = layout('home', vAccept(r[1]));
  else {
    const map = { admin: ['', () => vAdmin(r[1])], propuesta: ['home', () => vProposal(r[1])], '': ['home', vHome], videos: ['vids', vEtapas], semana: ['vids', () => vWeek(r[1])], v: ['vids', () => vVideo(r[1])], e: ['vids', () => vEvent(r[1])], resumen: ['sum', vSummary], cierre: ['sum', vClose], historial: ['hist', vHistory], equipo: ['', vTeam], proyecto: ['', vNewProject] };
    const [tab, fn] = map[r[0]] || map[''];
    html = layout(tab, fn());
  }
  if (sheetHtml) html += `<div class="sheet" data-act="closeBg"><div>${sheetHtml}</div></div>`;
  $app.innerHTML = html;
  const u = ui.undo && Date.now() < ui.undo.until ? ui.undo : null;
  $toast.innerHTML = u ? `<div class="t-ok undo"><span>${u.amt ? '+ ' + R.money(u.amt) + ' · registrado' : 'Registrado'}</span><button data-act="undoQuick">Deshacer</button></div>` : S.toast ? `<div class="t-${S.toast.kind}">${esc(S.toast.msg)}</div>` : '';
  syncOpts();
  animateCounts();
  animateWallet();
  if (r[0] !== 'resumen') ui.animKey = null;
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
  lookPick: (el) => { ui.look = Object.assign({}, ui.look || st.look()); ui.look[el.dataset.k] = el.dataset.c; render(); },
  lookReset: () => { ui.look = { main: '#FFB547', u0: '#FF6B5B', u1: '#FF9F2E', u2: '#5A5D67' }; render(); },
  lookSave: async () => { await st.saveLook(ui.look || st.look()); ui.look = null; },
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
  stage: (el) => { ui.stage = el.dataset.k; render(); },
  scope: (el) => { ui.scope = el.dataset.k; render(); },
  mark: (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); openSheet(sheetMark(v, el.dataset.k, el.dataset.h)); },
  quick: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const k = el.dataset.k;
    const hire = el.dataset.h ? S.data.hires.find((h) => h.id === el.dataset.h) : null;
    const cm = R.canMark(v, k, S.me, st.ctx(v.project_id), new Date(), { hire });
    if (!cm.ok) { st.toast(cm.why || 'Todavía no se puede', 'bad'); return; }
    if (cm.take && !confirm(`Vas a tomar ${R.KIND_LABEL[k].toLowerCase()} del video ${v.num} de ${st.member(v.owner).name}. El pago pasa a ti y queda en el historial. ¿Seguir?`)) return;
    if (cm.late && !confirm('Está fuera de plazo: se paga igual, pero resta 3 puntos de racha. ¿Marcar?')) return;
    const amt = gain(v, k, cm, !!hire);
    const rect = el.getBoundingClientRect();
    el.classList.add('done');
    const t = await st.markTask(v, k, hire ? { hire_id: hire.id } : {}, null);
    if (v.owner === S.me.id && !hire) ui.burst = Date.now();
    fly(rect, amt ? '+ ' + R.money(amt) : 'Apoyo ✓');
    showUndo(t, amt);
  },
  undoQuick: async (el) => {
    const u = ui.undo; if (!u) return;
    ui.undo = null;
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
  checkin: async (el) => { const e = evById(el.dataset.e); await st.checkIn(e); if (S.me.role === 'admin' && Date.now() <= new Date(e.starts_at).getTime() + R.RULES.punt * 60000) { ui.burst = Date.now(); render(); } },
  confirmArr: async (el) => { const a = S.data.attendance.find((x) => x.id === el.dataset.a); await st.confirmArrival(a, el.dataset.m); },
  endMeeting: async (el) => {
    const e = evById(el.dataset.e);
    const c = st.ctx(e.project_id);
    const pendPre = e.video_ids.map((id) => c.videos.find((v) => v.id === id)).filter((v) => v && v.owner !== S.me.id).filter((v) => { const s = R.videoState(v, c); return !s.g || !s.s; });
    const direct = S.me.role === 'admin' || R.adminAbsent(e, c);
    const warn = pendPre.length ? `\n\nOjo: ${st.member(pendPre[0].owner).name} todavía no termina ${pendPre.length === 1 ? 'el video' : 'los videos'} ${pendPre.map((v) => v.num).join(', ')}. Al finalizar, ya no suma el punto de reunión (igual tiene plazo hasta el día antes del rodaje, 18:00).` : '';
    if (!confirm((direct ? '¿Finalizar la reunión ahora?' : '¿Pedir al administrador que finalice la reunión? Quedará con la hora de ahora.') + warn)) return;
    await st.endMeeting(e);
  },
  confirmEnd: async (el) => { await st.confirmEnd(evById(el.dataset.e)); },
  extraMeet: (el) => { const r = evById(el.dataset.r); openSheet(dateTimeSheet('extraMeet', 'Otra reunión', `Antes de ${R.fmtWhen(R.preDueFor(r.starts_at))} (plazo de preproducción).`, { r: r.id }, R.limaDate(new Date()), '18:00', 'Agendar')); },
  reday: (el) => { const e = evById(el.dataset.e); openSheet(dateTimeSheet('reday', 'Reprogramar el rodaje', 'Se crea un rodaje nuevo con los mismos videos. El anterior queda como "reprogramado" en el historial. Los plazos de preproducción se mueven con el rodaje.', { e: e.id, a: el.dataset.a || '' }, R.addDays(R.limaDate(e.starts_at), 1), R.limaTime(e.starts_at), 'Reprogramar')); },
  moveEv: (el) => { const e = evById(el.dataset.e); openSheet(dateTimeSheet('moveEv', 'Cambiar fecha u hora', 'Solo mientras nadie haya marcado su llegada. Queda en el historial.', { e: e.id }, R.limaDate(e.starts_at), R.limaTime(e.starts_at), 'Guardar')); },
  cancelEv: async (el) => { const e = evById(el.dataset.e); const note = prompt(`¿Cancelar ${e.kind === 'rodaje' ? 'el rodaje' : 'la reunión'} del ${R.fmtWhen(e.starts_at)}? Queda en el historial. Escribe el motivo (opcional):`, ''); if (note === null) return; await st.cancelEvent(e, note.trim()); },
  delEv: async (el) => { const e = evById(el.dataset.e); if (!confirm('¿Borrar? Está vacío, así que no se pierde ningún registro.')) return; await st.deleteEvent(e); location.hash = '#/videos'; },
  newRod: () => openSheet(dateTimeSheet('newRod', 'Programar rodaje', 'Para los videos que se quedaron sin rodaje.', {}, R.addDays(R.limaDate(new Date()), 2), '10:00', 'Programar')),
  delProject: async (el) => { const p = projOf(el.dataset.id); if (!confirm(`¿Borrar el proyecto ${p.client} · ${p.name}? Está vacío.`)) return; await st.deleteProject(p); if (S.projectId === p.id) { const n = S.data.projects.find((x) => x.status !== 'archivado'); st.switchProject(n ? n.id : null); } },
  archProject: async (el) => { const p = projOf(el.dataset.id); const on = !!el.dataset.on; if (on && !confirm(`¿Archivar ${p.client} · ${p.name}? Deja de aparecer en el selector; su historial se conserva y puedes reabrirlo.`)) return; await st.archiveProject(p, on); if (on && S.projectId === p.id) { const n = S.data.projects.find((x) => x.status !== 'archivado' && x.id !== p.id); if (n) st.switchProject(n.id); } },
  practiceOn: () => { if (confirm('Entrarás a un espacio de práctica en este celular. Tus datos reales no cambian. ¿Entrar?')) st.setPractice(true); },
  practiceOff: () => st.setPractice(false),
  notice: (el) => { openSheet(sheetNotice(evById(el.dataset.e), !!el.dataset.fm)); },
  decide: async (el) => { const a = S.data.attendance.find((x) => x.id === el.dataset.a); await st.decideNotice(a, el.dataset.d); },
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
  demoAs: (el) => st.demoSwitch(el.dataset.id),
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
    location.hash = '#/videos';
  },
  reparto: async (f) => {
    const rod = evById(f.r);
    const n = Number(f.n);
    const videos = Array.from({ length: n }, (_, i) => ({ publish_date: f['pub' + i], owner: f['own' + i], title: (f['tit' + i] || '').trim() }));
    const rd = R.limaDate(rod.starts_at);
    const soon = videos.map((v, i) => ({ v, i })).filter(({ v }) => v.publish_date <= R.addDays(rd, 2));
    if (soon.length && !confirm(`Ojo: ${soon.length === 1 ? 'un video se publica' : soon.length + ' videos se publican'} muy cerca del rodaje (${R.fmtDay(rd)}): su montaje vencería antes o el mismo día. ¿Guardar igual?`)) return;
    await st.reparto(rod, videos);
    ui.stage = 'pre';
    location.hash = '#/videos';
  },
  mark: async (f) => {
    const v = S.data.videos.find((x) => x.id === f.v);
    sheetHtml = null;
    const extra = {}; if (f.link) extra.link = f.link; if (f.h) extra.hire_id = f.h;
    const hire = f.h ? S.data.hires.find((h) => h.id === f.h) : null;
    const cm = R.canMark(v, f.k, S.me, st.ctx(v.project_id), new Date(), { hire });
    const amt = gain(v, f.k, cm, !!hire);
    const t = await st.markTask(v, f.k, extra, null);
    fly(centerRect(), amt ? '+ ' + R.money(amt) : 'Apoyo ✓');
    showUndo(t, amt);
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
  newRod: async (f) => {
    const c = st.ctx();
    const ids = c.videos.filter((v) => !R.rodajeOf(v, c) && !R.videoState(v, c).r).map((v) => v.id);
    sheetHtml = null;
    await st.newRodaje(S.projectId, ids, f.d, f.t);
  },
  pay: async (f, form) => {
    const file = form.proof && form.proof.files[0];
    let path = null;
    if (file) path = await st.uploadPhoto(file);
    if (confirm('¿Registrar el pago y cerrar el proyecto?')) await st.paySettlement(st.project(), path);
  }
};

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
document.addEventListener('change', (e) => { if (e.target.closest('label.opt')) syncOpts(); });
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
