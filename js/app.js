import * as st from './store.js';
import { S } from './store.js';
import * as R from './rules.js';
import { seedDemo } from './demo.js';

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

// ==================================================================
// Lo pendiente de cada persona
// ==================================================================
function pending() {
  const me = S.me; if (!me) return [];
  const out = [];
  const now = new Date();
  const c = st.ctx();
  const p = st.project();
  if (p && p.status === 'abierto') {
    for (const v of c.videos) {
      const vs = R.videoState(v, c, now);
      const owner = st.member(v.owner);
      const add = (kind, due, label, extra = {}) => out.push(Object.assign({ type: 'task', video: v, kind, due, label }, extra));
      const mt = st.meetingOf(v.id);
      const hire = mt ? st.hireFor(mt.id) : null;
      if (hire && hire.present === me.id && hire.hired_by === v.owner) {
        if (!vs.g) add('guion', vs.d.preDue, `Guion con Guillermo · video ${v.num} de ${first(owner)}`);
        if (!vs.s) add('storyboard', vs.d.preDue, `Storyboard con Guillermo · video ${v.num} de ${first(owner)}`);
      }
      if (v.owner === me.id) {
        const byG = hire && hire.hired_by === me.id;
        if (!vs.g && !byG) add('guion', vs.d.preDue, `Guion del video ${v.num}`);
        if (!vs.s && !byG) add('storyboard', vs.d.preDue, `Storyboard del video ${v.num}`);
        if (owner.apoyo) { if (!vs.mo && !vs.montajeMissed) add('montaje', vs.d.montajeDue, `Montaje del video ${v.num}`); }
        else { if (!vs.mo) add('montaje', vs.d.finalDue, `Montaje del video ${v.num}`); if (!vs.ac) add('acabado', vs.d.finalDue, `Video final ${v.num}`); }
      } else if (me.role === 'admin') {
        if (vs.montajeMissed && !vs.mo) add('montaje', vs.d.finalDue, `Tomar el video ${v.num} de ${owner.name} (5.7)`, { urgent: true });
        else if (vs.mo && !vs.ac && (owner.apoyo || vs.reassigned)) add('acabado', vs.d.finalDue, vs.reassigned ? `Video final ${v.num} (lo tomaste)` : `Acabado de apoyo · video ${v.num} de ${first(owner)}`);
      }
    }
    for (const e of c.events) {
      const start = new Date(e.starts_at);
      const s = st.eventStatus(e, me.id, now);
      if (s.k === 'pendiente' && start - now < 7 * 864e5) out.push({ type: 'event', event: e, due: start, label: (e.kind === 'rodaje' ? 'Rodaje' : 'Reunión') + ' · ' + R.fmtWhen(e.starts_at) });
      for (const a of c.attendance.filter((x) => x.event_id === e.id && x.member_id !== me.id && x.notice && x.notice.sent_at && !x.notice.decision)) {
        out.push({ type: 'notice', event: e, att: a, due: start, label: `${st.member(a.member_id).name} avisó que no irá`, urgent: true });
      }
    }
    for (const h of S.data.hires.filter((x) => x.status === 'pendiente' && x.present === me.id && x.project_id === p.id)) {
      const ev = S.data.events.find((e) => e.id === h.event_id);
      if (ev) out.push({ type: 'hire', event: ev, due: new Date(ev.starts_at), label: `${st.member(h.hired_by).name} quiere contratar a Guillermo`, urgent: true });
    }
    const se = p.settlement;
    if (se && se.sent_at && !se.confirmed_at && me.role !== 'admin') out.push({ type: 'settle', due: now, label: 'Revisa y confirma la liquidación', urgent: true });
    if (se && se.confirmed_at && !se.paid_at && me.role === 'admin') out.push({ type: 'settle', due: now, label: 'Registra el pago de la liquidación', urgent: true });
    if (se && se.observation && !se.sent_at && me.role === 'admin') out.push({ type: 'settle', due: now, label: 'Hay una observación en la liquidación', urgent: true });
  }
  for (const cr of S.data.corrections.filter((x) => x.status === 'pendiente' && x.requested_by !== me.id)) out.push({ type: 'corr', corr: cr, due: new Date(cr.created_at), label: `${st.member(cr.requested_by).name} pidió una corrección`, urgent: true });
  return out.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (a.due || 0) - (b.due || 0));
}

function dueChip(due) {
  if (!due) return '';
  const now = new Date();
  const h = (due - now) / 3600000;
  if (h < 0) return `<span class="chip c-bad">Venció ${R.fmtWhen(due)}</span>`;
  if (h < 24) return `<span class="chip c-late">Hoy · ${R.limaTime(due)}</span>`;
  return `<span class="chip c-mute">${R.fmtWhen(due)}</span>`;
}

// ==================================================================
// Pantallas
// ==================================================================
function layout(tab, body) {
  const p = st.project();
  const n = pending().filter((x) => x.urgent).length;
  return `<div class="wrap">
  <header class="top">
    <button class="ibtn" data-act="pickProject" aria-label="Cambiar proyecto" style="width:auto;padding:0 10px;gap:6px;flex:1;justify-content:flex-start;min-width:0">
      <span class="pj" style="text-align:left"><b>${p ? esc(p.client) + ' · ' + esc(p.name) : 'Sin proyecto'}</b><span>${p ? (p.status === 'cerrado' ? 'Cerrado' : R.money(p.budget) + ' · ' + p.videos_total + ' videos') : 'Crea uno en Equipo'}</span></span>${icon.down}
    </button>
    <a class="ibtn" href="#/equipo" aria-label="Equipo y ajustes">${icon.gear}</a>
  </header>
  <main>${st.isDemo() ? demoBar() : ''}${body}</main>
  <nav class="tabs"><div>
    <a href="#/" class="${tab === 'home' ? 'on' : ''}"><span class="${n ? 'dot' : ''}">${icon.home}</span>Inicio</a>
    <a href="#/videos" class="${tab === 'vids' ? 'on' : ''}">${icon.vids}Videos</a>
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
  return `<div class="demo"><div class="between"><span class="muted"><b style="color:#FFC978">Modo demo</b> · solo en este navegador</span><button class="btn sm b-ghost" data-act="demoReset">Borrar demo</button></div>${users.length > 1 ? `<div class="row" style="flex-wrap:wrap;gap:6px"><span class="muted">Ver como:</span>${btns}</div>` : ''}</div>`;
}

// ---------- Entrar ----------
function vLogin(inviteCode) {
  const demo = st.isDemo();
  return `<div class="wrap"><main style="padding-bottom:40px;justify-content:center;min-height:100vh">
  <div style="display:flex;gap:6px">${['#12271E:#6EE7B7', '#2A2416:#FFB547', '#2A1810:#FF8A65'].map((c) => `<span style="width:46px;height:46px;border-radius:14px;background:${c.split(':')[0]}"></span>`).join('')}</div>
  <h1 style="font-size:30px;line-height:1.1">Registra el trabajo de tu equipo audiovisual</h1>
  <p class="sub" style="font-size:15px">Quién hizo cada tarea, a tiempo o no, y cuánto le corresponde a cada uno.</p>
  ${inviteCode ? `<div id="invbox">${banner('wait', 'Tienes una invitación', 'Entra con tu correo para aceptarla.')}</div>` : ''}
  ${demo ? `<div class="demo">${banner('warn', 'Modo demo', 'Todavía no está conectada la base de datos. Puedes probar todo: se guarda solo en este navegador.')}<button class="btn b-amber" data-act="seed">Cargar proyecto de ejemplo</button></div>` : ''}
  ${demo ? '' : `<button class="btn" data-act="google" style="background:#F4F4F5;color:#0B0C10"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>Continuar con Google</button>
  <p class="muted" style="text-align:center;margin:0">o con un código a tu correo</p>`}
  <form data-form="sendCode" class="card">
    <label class="field"><span>Tu correo</span><input class="in" name="email" type="email" required autocomplete="email" placeholder="tucorreo@gmail.com" value="${esc(ui.email || '')}"></label>
    <button class="btn b-amber">${demo ? 'Entrar (demo)' : 'Enviarme el código'}</button>
  </form>
  ${ui.codeSent && !demo ? `<form data-form="verify" class="card">
    <p class="sub" style="margin:0">Te enviamos un correo a <b>${esc(ui.email)}</b>. Escribe el código de 6 dígitos, o toca el enlace del correo desde este mismo celular.</p>
    <label class="field"><span>Código</span><input class="in num" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required style="font-size:22px;letter-spacing:.3em"></label>
    <button class="btn b-amber">Entrar</button>
  </form>` : ''}
  </main></div>`;
}

// ---------- Sin equipo ----------
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
      <div class="banner bn-warn"><div><b>Antes de entrar</b><p>La app sigue el acuerdo que firmaron: pago por etapa (guion y storyboard S/ 7.81, rodaje S/ 21.88, montaje S/ 10, acabado S/ 15 por video de S/ 62.50), plazos a las 21:00, tolerancia de 10 y 45 min, avisos con 48 h (rodaje) y 24 h (reunión). La racha nunca cambia lo que cobras.</p></div></div>
      <label class="row small" style="gap:10px"><input type="checkbox" name="ok" required style="width:20px;height:20px"> Leí las reglas y son las mismas del acuerdo que firmé</label>` : ''}
    <label class="field"><span>Tu nombre (así aparecerás)</span><input class="in" name="name" value="${esc(info.name)}" required></label>
    <button class="btn b-blue">Entrar al equipo</button>
  </form>`;
}

// ---------- Inicio ----------
function vHome() {
  const me = S.me;
  const c = st.ctx();
  const p = st.project();
  const sk = R.streak(me.id, c);
  const pend = pending();
  const nx = sk.next;
  let html = `<div class="row"><div style="flex:1"><p class="sub" style="margin:0">Hola,</p><h1>${first(me)}</h1></div>${av(me, 40)}</div>`;
  html += `<section class="card" style="flex-direction:row;align-items:center;gap:14px;background:#15130F;border-color:#3A3220">
    <div>${icon.flame(sk.level.color, 46)}</div>
    <div style="flex:1"><p class="lbl" style="color:${sk.level.color}">Tu racha · ${sk.level.name}</p>
    <p class="num" style="margin:2px 0 0;font-size:26px;font-weight:700">${sk.pts} pts</p>
    <p class="muted" style="margin:2px 0 0">${nx ? `${nx.min - sk.pts} ${nx.min - sk.pts === 1 ? 'punto' : 'puntos'} más para ${nx.name}` : 'Nivel más alto'} · récord ${sk.best}</p></div></section>`;
  if (!p) return html + `<div class="card">${banner('wait', 'Todavía no hay proyectos', S.me.role === 'admin' ? 'Crea el primero en Equipo → Proyectos.' : 'Cuando el administrador cree uno, aparecerá aquí.')}${isAdminBtn('<a class="btn b-amber" href="#/proyecto/nuevo">Crear proyecto</a>')}</div>`;
  html += `<p class="lbl" style="margin-top:4px">Te toca</p>`;
  if (!pend.length) html += `<div class="card"><p class="empty">Nada pendiente por ahora. 🎬</p></div>`;
  else html += `<div class="card" style="padding:4px 16px"><div class="list">${pend.slice(0, 12).map(pendItem).join('')}</div></div>`;
  const vids = c.videos;
  const delivered = vids.filter((v) => R.videoState(v, c).delivered).length;
  html += `<section class="card"><p class="lbl">El equipo en este proyecto</p><div class="grid3">
    <div class="stat"><b style="color:var(--mint)">${delivered}/${p.videos_total}</b><span>videos al cliente</span></div>
    <div class="stat"><b>${vids.length}</b><span>videos repartidos</span></div>
    <div class="stat"><b>${c.events.filter((e) => new Date(e.starts_at) > new Date()).length}</b><span>reuniones y rodajes por venir</span></div></div></section>`;
  return html;
}

function isAdminBtn(h) { return st.isAdmin() ? h : ''; }

function pendItem(x) {
  if (x.type === 'task') return `<a class="li" href="#/v/${x.video.id}"><span class="chip ${x.urgent ? 'c-bad' : 'c-info'}" style="min-width:34px;justify-content:center">${x.video.num}</span><span class="t"><b>${x.label}</b><span>publica ${R.fmtDay(x.video.publish_date)}</span></span>${dueChip(x.due)}</a>`;
  if (x.type === 'event') return `<a class="li" href="#/e/${x.event.id}"><span class="chip c-late">${x.event.kind === 'rodaje' ? 'Rodaje' : 'Reunión'}</span><span class="t"><b>${x.label}</b><span>${R.canCheckIn(x.event) ? 'Ya puedes registrar tu llegada' : 'El registro se abre 15 min antes'}</span></span></a>`;
  if (x.type === 'notice') return `<a class="li" href="#/e/${x.event.id}"><span class="chip c-bad">Aviso</span><span class="t"><b>${esc(x.label)}</b><span>${x.event.kind === 'rodaje' ? 'Rodaje' : 'Reunión'} · ${R.fmtWhen(x.event.starts_at)}</span></span></a>`;
  if (x.type === 'hire') return `<a class="li" href="#/e/${x.event.id}"><span class="chip c-fm">Guillermo</span><span class="t"><b>${esc(x.label)}</b><span>Reunión · ${R.fmtWhen(x.event.starts_at)} · acepta o rechaza</span></span></a>`;
  if (x.type === 'settle') return `<a class="li" href="#/cierre"><span class="chip c-bad">Cierre</span><span class="t"><b>${x.label}</b></span></a>`;
  if (x.type === 'corr') return `<a class="li" href="#/historial"><span class="chip c-late">Corrección</span><span class="t"><b>${esc(x.label)}</b><span>${esc(x.corr.text)}</span></span></a>`;
  return '';
}

// ---------- Videos ----------
function vVideos() {
  const p = st.project();
  if (!p) return `<div class="card">${banner('wait', 'Sin proyecto', 'Crea un proyecto para empezar.')}${isAdminBtn('<a class="btn b-amber" href="#/proyecto/nuevo">Crear proyecto</a>')}</div>`;
  const c = st.ctx();
  const evs = c.events.slice().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  let html = `<div class="between"><div><h1>Videos</h1><p class="sub">${c.videos.length} de ${p.videos_total} repartidos</p></div>${p.status === 'abierto' && c.videos.length < p.videos_total ? '<a class="btn sm b-amber" href="#/semana">Repartir semana</a>' : ''}</div>`;
  if (p.status === 'abierto') html += `<button class="btn b-ghost" data-act="schedule">Agendar reunión de preproducción</button>`;
  if (!c.videos.length) html += `<div class="card"><p class="empty">Todavía no hay videos. En la reunión semanal, reparte los videos (2 y 2) y programa el rodaje.</p></div>`;
  const byOwner = c.videos.slice().sort((a, b) => a.num - b.num);
  html += `<section class="card" style="padding:6px 16px">${byOwner.map((v) => {
    const vs = R.videoState(v, c);
    const o = st.member(v.owner);
    const dot = (t, late) => `<i class="${t ? (late ? 'l' : 'd') : ''}"></i>`;
    const status = vs.delivered ? '<span class="chip c-ok">Entregado</span>' : vs.montajeMissed && !vs.mo ? '<span class="chip c-bad">Sin montaje</span>' : vs.reassigned ? '<span class="chip c-late">Lo tomó otro</span>' : '';
    return `<a class="li" href="#/v/${v.id}"><span class="chip c-mute" style="min-width:34px;justify-content:center">${v.num}</span>${av(o, 26)}<span class="t"><b>Publica ${R.fmtDay(v.publish_date)}</b><span class="dots" style="margin-top:5px">${dot(vs.g, vs.preLate)}${dot(vs.s, vs.preLate)}${dot(vs.r)}${dot(vs.mo, vs.montajeLate)}${dot(vs.ac, vs.finalLate)}</span></span>${status}</a>`;
  }).join('') || ''}</section>`;
  html += `<p class="muted" style="margin:-6px 0 0">Puntos: guion · storyboard · rodaje · montaje · final. Verde a tiempo, amarillo tarde.</p>`;
  html += `<p class="lbl" style="margin-top:6px">Reuniones y rodajes</p><section class="card" style="padding:6px 16px">${evs.map((e) => {
    const me = st.eventStatus(e, S.me.id);
    return `<a class="li" href="#/e/${e.id}"><span class="chip ${e.kind === 'rodaje' ? 'c-late' : 'c-info'}">${e.kind === 'rodaje' ? 'Rodaje' : 'Reunión'}</span><span class="t"><b>${R.fmtWhen(e.starts_at)}</b><span>${e.video_ids.length} videos · tolerancia ${e.tolerance_min} min</span></span>${attChip(me)}</a>`;
  }).join('') || '<p class="empty">Sin reuniones ni rodajes.</p>'}</section>`;
  return html;
}

function attChip(s) {
  const K = { puntual: 'c-ok', tarde: 'c-late', ausente: 'c-bad', cancel_ok: 'c-mute', cancel_late: 'c-late', fm: 'c-fm', fm_pend: 'c-fm', pendiente: 'c-info', no_req: 'c-fm' };
  return `<span class="chip ${K[s.k]}">${s.label}</span>`;
}

// ---------- Repartir semana (5.8) ----------
function vWeek() {
  const p = st.project();
  const ps = st.partners();
  const adm = ps.find((m) => m.role === 'admin') || S.me;
  const soc = ps.find((m) => m.role === 'socio');
  const c = st.ctx();
  const left = p.videos_total - c.videos.length;
  const n = Math.min(4, left);
  const today = R.limaDate(new Date());
  const sched = S.data.events.filter((e) => e.kind === 'reunion' && e.project_id === p.id && !e.video_ids.length).sort((x, y) => new Date(x.starts_at) - new Date(y.starts_at))[0];
  const meet = ui.meet || (sched ? R.limaDate(sched.starts_at) : today);
  const pubBase = R.addDays(meet, 7);
  const rows = Array.from({ length: n }, (_, i) => {
    const owner = soc ? (i < Math.ceil(n / 2) ? adm.id : soc.id) : adm.id;
    return `<div class="row" style="gap:8px"><span class="chip c-mute" style="min-width:34px;justify-content:center">${c.videos.length + i + 1}</span>
      <input class="in" type="date" name="pub${i}" value="${R.addDays(pubBase, Math.floor(i / 2) * 2)}" style="flex:1;min-width:0">
      <select class="in" name="own${i}" style="flex:1;min-width:0">${ps.map((m) => `<option value="${m.id}" ${m.id === owner ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>`;
  }).join('');
  return `<a href="#/videos" class="row muted" style="text-decoration:none">${icon.back} Videos</a>
  <h1>Repartir la semana</h1><p class="sub">En la reunión semanal deciden qué videos le tocan a cada uno (por defecto 2 y 2). Quedan ${left} videos por repartir.</p>
  <form data-form="week" class="card">
    <input type="hidden" name="n" value="${n}">
    <p class="lbl">Reunión de preproducción</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="md" value="${meet}" required></label><label class="field"><span>Hora</span><input class="in" type="time" name="mt" value="${sched ? R.limaTime(sched.starts_at) : '10:00'}" required></label></div>
    ${sched && st.hireFor(sched.id) ? `<div class="banner bn-fm"><div><b>Guillermo trabaja por ${esc(st.member(st.hireFor(sched.id).hired_by).name)} en esta reunión</b><p>Asigna sus videos y luego marca sus guiones y storyboards "con Guillermo". Recibes el 80 % de esa preproducción.</p></div></div>` : ''}
    <p class="muted" style="margin:-4px 0 0">Guiones y storyboards vencen al día siguiente a las 21:00.</p>
    <p class="lbl">Rodaje</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="rd" value="${R.addDays(meet, 2)}"></label><label class="field"><span>Hora</span><input class="in" type="time" name="rt" value="10:00"></label></div>
    <p class="lbl">Videos · fecha de publicación y dueño</p>
    ${rows}
    <p class="muted" style="margin:0">Montaje: 2 días antes de publicar (si recibe apoyo) · final: 1 día antes, a las 21:00.</p>
    <button class="btn b-amber" ${n ? '' : 'disabled'}>Guardar reparto</button>
  </form>`;
}

// ---------- Detalle de video ----------
function vVideo(id) {
  const v = S.data.videos.find((x) => x.id === id);
  if (!v) return `<p class="empty">Video no encontrado.</p>`;
  const c = st.ctx(v.project_id);
  const vs = R.videoState(v, c);
  const o = st.member(v.owner);
  const me = S.me;
  const p = S.data.projects.find((x) => x.id === v.project_id);
  const rate = R.rates(p);
  const open = p.status === 'abierto';
  const isOwner = v.owner === me.id;
  const ev = S.data.events.find((e) => e.kind === 'rodaje' && e.video_ids.indexOf(v.id) !== -1);
  const rows = R.KINDS.map((k) => {
    const t = vs[{ guion: 'g', storyboard: 's', rodaje: 'r', montaje: 'mo', acabado: 'ac' }[k]];
    const due = k === 'guion' || k === 'storyboard' ? vs.d.preDue : k === 'montaje' ? (vs.d.montajeDue || vs.d.finalDue) : k === 'acabado' ? vs.d.finalDue : (ev ? new Date(ev.starts_at) : null);
    let right = '', sub = '';
    if (t) {
      const by = st.member(t.done_by);
      const late = (k === 'guion' || k === 'storyboard') ? !!(vs.d.preDue && new Date(t.done_at) > vs.d.preDue) : k === 'montaje' ? vs.montajeLate : k === 'acabado' ? vs.finalLate : false;
      const hh = t.hire_id ? S.data.hires.find((x) => x.id === t.hire_id) : null;
      sub = `${hh ? `Hecho por Guillermo · contratado por ${esc(st.member(hh.hired_by).name)} · registró ${esc(by.name)}` : esc(by.name)} · ${R.fmtWhen(t.done_at)}${t.link ? ` · <a href="${esc(t.link)}" target="_blank" rel="noopener">enlace</a>` : ''}`;
      if (k === 'acabado' && vs.apoyo) sub += ' · apoyo (se le paga al dueño, 5.5)';
      right = `<span class="chip ${late ? 'c-late' : 'c-ok'}">${late ? 'Tarde' : 'Hecho'}</span>${me.role === 'admin' && open ? `<button class="btn sm b-ghost" data-act="undo" data-id="${t.id}" style="margin-left:6px;min-height:30px;padding:0 8px">Desmarcar</button>` : ''}`;
    } else {
      sub = due ? 'Plazo: ' + R.fmtWhen(due) : (k === 'rodaje' ? 'Sin rodaje programado' : '');
      let can = false, viaG = null;
      if (open) {
        if (isOwner) can = k === 'montaje' ? !(o.apoyo && vs.montajeMissed) : k === 'acabado' ? !o.apoyo : true;
        else if (me.role === 'admin') can = (k === 'montaje' && vs.montajeMissed) || (k === 'acabado' && !!vs.mo && (o.apoyo || vs.reassigned));
        if (k === 'acabado' && !vs.mo) can = false;
        const mt = st.meetingOf(v.id);
        const hire = mt ? st.hireFor(mt.id) : null;
        if (hire && hire.hired_by === v.owner && (k === 'guion' || k === 'storyboard')) {
          can = hire.present === me.id; viaG = can ? hire : null;
          if (!can) sub += ` · lo hace Guillermo (contrataste)`;
        }
      }
      if (k === 'montaje' && o.apoyo && vs.montajeMissed && !isOwner) sub = '<span style="color:#FF9B8F">No llegó a la hora límite: pasa a ' + esc((st.admin() || {}).name || 'el administrador') + ' (5.7)</span>';
      if (k === 'montaje' && o.apoyo && vs.montajeMissed && isOwner) sub = '<span style="color:#FF9B8F">Venció el plazo: el video pasa al administrador (5.7)</span>';
      right = can ? `<button class="btn sm ${viaG ? 'b-purple' : 'b-amber'}" data-act="mark" data-v="${v.id}" data-k="${k}"${viaG ? ` data-h="${viaG.id}"` : ''}>${viaG ? 'Con Guillermo' : 'Marcar'}</button>` : '<span class="chip c-mute">Pendiente</span>';
    }
    return `<div class="li"><span class="t"><b>${R.KIND_LABEL[k]} <span class="muted" style="font-weight:500">· ${R.money(rate[k])}</span></b><span>${sub}</span></span>${right}</div>`;
  }).join('');
  const mtv = st.meetingOf(v.id);
  const hv = mtv ? st.hireFor(mtv.id) : null;
  const changeOwner = open && (me.role === 'admin' || isOwner || (hv && hv.present === me.id)) && !vs.mo && !vs.g && !vs.s ? `<button class="btn b-ghost" data-act="swap" data-v="${v.id}">Intercambiar con mi compañero</button>` : '';
  return `<a href="#/videos" class="row muted" style="text-decoration:none">${icon.back} Videos</a>
  <div class="row">${av(o, 44)}<div style="flex:1"><h1>Video ${v.num}</h1><p class="sub" style="margin:2px 0 0">De ${esc(o.name)} · publica ${R.fmtDay(v.publish_date)}</p></div></div>
  ${vs.montajeMissed && !vs.mo ? banner('bad', 'El montaje no llegó a tiempo', 'Según el punto 5.7, el administrador hace el montaje y el final, y cobra la posproducción de este video.') : ''}
  <section class="card" style="padding:4px 16px"><div class="list">${rows}</div></section>
  ${ev ? `<a class="btn b-ghost" href="#/e/${ev.id}">Ver rodaje · ${R.fmtWhen(ev.starts_at)}</a>` : ''}
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
  const myS = st.eventStatus(e, me.id, now);
  const vids = e.video_ids.map((vid) => S.data.videos.find((v) => v.id === vid)).filter(Boolean).sort((a, b) => a.num - b.num);
  const start = new Date(e.starts_at);
  let html = `<a href="#/videos" class="row muted" style="text-decoration:none">${icon.back} Videos</a>
  <div><p class="lbl" style="color:${isRod ? '#FFB547' : '#A9C7FF'}">${isRod ? 'Rodaje' : 'Reunión de preproducción'}</p><h1>${R.fmtWhen(e.starts_at)}</h1>
  <p class="sub">Puntual hasta ${R.limaTime(new Date(start.getTime() + 600000))} · tolerancia hasta ${R.limaTime(new Date(start.getTime() + e.tolerance_min * 60000))}</p></div>`;
  html += `<section class="card"><p class="lbl">Asistencia</p>${ps.map((m) => {
    const a = st.attOf(e.id, m.id);
    const s = st.eventStatus(e, m.id, now);
    const extra = a && a.arrived_at ? 'Llegó ' + R.limaTime(a.arrived_at) : a && a.notice && a.notice.sent_at ? 'Avisó ' + R.fmtWhen(a.notice.sent_at) + (a.notice.reason === 'fm' ? ' · fuerza mayor (' + esc(a.notice.fm_kind || '') + ')' : '') : '';
    return `<div class="row">${av(m)}<div style="flex:1"><b>${esc(m.name)}</b><p class="muted" style="margin:2px 0 0">${extra}</p></div>${attChip(s)}${a && a.photo ? `<button class="btn sm b-ghost" data-act="photo" data-p="${esc(a.photo)}">Foto</button>` : ''}</div>`;
  }).join('')}</section>`;
  // Guillermo (solo reuniones)
  if (!isRod) html += guillermoBlock(e, myS, now);
  // Mis acciones
  if (myS.k === 'pendiente') {
    if (R.canCheckIn(e, now)) {
      html += `<form data-form="checkin" class="card" style="border-color:#1F3A2C"><input type="hidden" name="e" value="${e.id}">
        <p class="lbl" style="color:var(--mint)">Registrar llegada</p>
        <label class="field"><span>Foto del lugar (opcional, sirve de evidencia)</span><input class="in" type="file" name="photo" accept="image/*" capture="environment" style="padding-top:10px"></label>
        <button class="btn b-mint">Llegué</button></form>`;
    } else if (now < start) {
      html += banner('wait', 'El registro de llegada se abre a las ' + R.limaTime(new Date(start.getTime() - 900000)), '15 minutos antes de la hora programada.');
    }
    if (now < new Date(start.getTime() + e.tolerance_min * 60000)) html += `<button class="btn b-ghost" data-act="notice" data-e="${e.id}">No podré ir</button>`;
  }
  if (myS.k === 'ausente' && (!st.attOf(e.id, me.id) || !st.attOf(e.id, me.id).notice) && now - (start.getTime() + e.tolerance_min * 60000) < 24 * 3600000) {
    html += `<button class="btn b-purple" data-act="notice" data-e="${e.id}" data-fm="1">Fue fuerza mayor</button><p class="muted" style="margin:-6px 0 0;text-align:center">Puedes marcarlo hasta 24 h después (7.9). Tu compañero tiene que aceptarlo.</p>`;
  }
  // Avisos del otro por responder
  for (const a of S.data.attendance.filter((x) => x.event_id === e.id && x.member_id !== me.id && x.notice && x.notice.sent_at)) {
    const who = st.member(a.member_id);
    const s = st.eventStatus(e, a.member_id, now);
    const n = a.notice;
    if (n.decision) { html += banner('ok', `Respondiste el aviso de ${esc(who.name)}`, decisionText(n.decision)); continue; }
    const want = n.choice === 'other' ? `Pide que grabes sus videos.` : n.choice === 'repro' ? 'Pide reprogramar sus videos.' : '';
    if (n.reason === 'fm') html += `<div class="card" style="border-color:#3E2C63;background:#160F22"><b>${esc(who.name)} marcó fuerza mayor</b><p class="sub" style="margin:0">Motivo: ${esc(n.fm_kind || '')}. ${want} Si la aceptas, no cuenta como falta ni resta racha (7.9). El pago siempre es de quien hace el trabajo.</p><div class="grid2"><button class="btn b-purple" data-act="decide" data-a="${a.id}" data-d="accept">Acepto</button><button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="talk">Conversarlo</button></div></div>`;
    else if (s.k === 'cancel_ok') html += `<div class="card"><b>${esc(who.name)} canceló a tiempo</b><p class="sub" style="margin:0">${want} Cancelar a tiempo es su derecho (7.8).</p><button class="btn b-amber" data-act="decide" data-a="${a.id}" data-d="ok">Entendido</button></div>`;
    else html += `<div class="card" style="border-color:#4A3414;background:#1C130A"><b>${esc(who.name)} avisó fuera de plazo</b><p class="sub" style="margin:0">Tú decides si grabas sus videos (te corresponde el pago, 7.3) o si se reprograman (los gastos extra van por su cuenta).</p><div class="grid2"><button class="btn b-amber" data-act="decide" data-a="${a.id}" data-d="record">Los grabo yo</button><button class="btn b-ghost" data-act="decide" data-a="${a.id}" data-d="repro">Reprogramar</button></div></div>`;
  }
  // Videos del rodaje
  if (isRod && vids.length) {
    html += `<section class="card" style="padding:12px 16px"><p class="lbl">Videos de este rodaje</p><div class="list">${vids.map((v) => {
      const t = S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje');
      const o = st.member(v.owner);
      const oS = st.eventStatus(e, v.owner, now);
      const ownerOut = ['ausente', 'cancel_late', 'cancel_ok', 'fm', 'fm_pend'].indexOf(oS.k) !== -1;
      const amHere = ['puntual', 'tarde'].indexOf(myS.k) !== -1;
      let right = '';
      if (t) right = `<span class="chip c-ok">Grabó ${first(st.member(t.done_by))}</span>`;
      else if (v.owner === me.id && amHere) right = `<button class="btn sm b-amber" data-act="mark" data-v="${v.id}" data-k="rodaje">Grabado</button>`;
      else if (v.owner !== me.id && ownerOut && amHere) right = `<button class="btn sm b-amber" data-act="recordFor" data-e="${e.id}" data-v="${v.id}">Lo grabé yo</button>`;
      else right = '<span class="chip c-mute">Pendiente</span>';
      return `<div class="li">${av(o, 26)}<span class="t"><b>Video ${v.num}</b><span>De ${esc(o.name)} · publica ${R.fmtDay(v.publish_date)}</span></span>${right}</div>`;
    }).join('')}</div>
    ${vids.some((v) => !S.data.tasks.find((x) => x.video_id === v.id && x.kind === 'rodaje')) ? `<button class="btn b-ghost" data-act="repro" data-e="${e.id}">Reprogramar videos no grabados</button>` : ''}</section>`;
  }
  if (me.role === 'admin' && now < start) html += `<button class="btn b-ghost" data-act="tol" data-e="${e.id}">Cambiar tolerancia (${e.tolerance_min} min)</button>`;
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
    `${!e.video_ids.length && me.id === h.present ? '<a class="btn sm b-purple" href="#/semana" style="margin-top:8px">Repartir la semana</a>' : ''}${mine.map((v) => `<a class="btn sm b-ghost" href="#/v/${v.id}" style="margin-top:8px;margin-right:6px">Video ${v.num} de ${first(A)}</a>`).join('')}`);
}

function decisionText(d) {
  return { accept: 'Aceptaste la fuerza mayor: no cuenta como falta.', talk: 'Pediste conversarlo: se aplica la regla normal hasta que se pongan de acuerdo.', record: 'Grabas sus videos y te corresponde el pago de rodaje.', repro: 'Sus videos se reprograman y conservan su dueño.', ok: 'Recibiste su aviso.' }[d] || '';
}

// ---------- Resumen ----------
function vSummary() {
  const p = st.project();
  if (!p) return `<p class="empty">Sin proyecto.</p>`;
  const me = S.me;
  const c = st.ctx(p.id);
  const pay = R.payouts(p, c);
  const mine = pay.porMiembro[me.id] || { pre: 0, prod: 0, post: 0, total: 0 };
  const R8 = R.rates(p);
  // lo que falta cobrar de mis videos
  let pendMine = 0;
  for (const v of c.videos.filter((x) => x.owner === me.id)) {
    const vs = R.videoState(v, c);
    if (!vs.g) pendMine += R8.guion; if (!vs.s) pendMine += R8.storyboard; if (!vs.r) pendMine += R8.rodaje;
    if (!vs.mo && !vs.montajeMissed) pendMine += R8.montaje + R8.acabado;
    else if (vs.mo && vs.mo.done_by === me.id && !vs.ac) pendMine += R8.acabado;
  }
  const apoyoCount = c.videos.filter((v) => { const vs = R.videoState(v, c); return vs.apoyo && vs.ac && vs.ac.done_by === me.id; }).length;
  const lostCount = c.videos.filter((v) => v.owner === me.id && R.videoState(v, c).reassigned).length;
  const vids = c.videos;
  const delivered = vids.filter((v) => R.videoState(v, c).delivered).length;
  const complete = vids.length === p.videos_total && vids.every((v) => R.videoState(v, c).complete);
  // equipo
  const ps = st.partners();
  let tTot = 0, tOk = 0, aTot = 0, aOk = 0;
  for (const m of ps) { const d = R.deliveries(m.id, c); tTot += d.total; tOk += d.onTime; }
  for (const e of c.events) for (const m of ps) { const s = st.eventStatus(e, m.id); if (s.k === 'pendiente' || s.k === 'no_req') continue; aTot++; if (s.k === 'puntual') aOk++; }
  // privado
  const dlv = R.deliveries(me.id, c);
  const evs = c.events.map((e) => st.eventStatus(e, me.id)).filter((s) => s.k !== 'pendiente' && s.k !== 'no_req');
  const tard = evs.filter((s) => s.k === 'tarde').length, aus = evs.filter((s) => s.k === 'ausente' || s.k === 'cancel_late').length;
  const punt = evs.filter((s) => s.k === 'puntual').length;
  const contr = R.contribution(p, c);
  const doneUnits = Object.values(contr.units).reduce((a, b) => a + b, 0);
  const pct = doneUnits ? Math.round((contr.units[me.id] || 0) / doneUnits * 100) : 0;
  const lateCount = dlv.total - dlv.onTime - dlv.missed;
  const bad = lateCount > 0 || dlv.missed > 0 || tard > 0 || aus > 0;
  const sk = R.streak(me.id, c);
  const col = bad ? '#FF6B5B' : '#6EE7B7';
  let html = `<div class="between"><div><h1>Resumen</h1><p class="sub">${esc(p.client)} · ${esc(p.name)}</p></div>${av(me, 38)}</div>`;
  html += banner(complete ? 'ok' : 'wait', complete ? '¡Proyecto completo, equipo!' : 'El equipo va avanzando', `${delivered} de ${p.videos_total} videos entregados al cliente`);
  html += `<div class="between"><p class="lbl" style="color:var(--mint)">Tu pago de este proyecto</p><span class="muted">🔒 Solo tú lo ves</span></div>
  <div class="paper">
    <p class="mono" style="margin:0 0 12px;text-align:center;font-size:11px;letter-spacing:.14em">RECIBO · ${esc(String(p.client).toUpperCase())} ${esc(String(p.name).toUpperCase())}</p>
    <div class="ln"><span>PREPRODUCCIÓN</span><span class="d"></span><b>${R.money(mine.pre)}</b></div>
    ${(() => { const g = (pay.guillermo || {})[me.id]; const gTo = Object.entries(pay.guillermo || {}).filter(([, x]) => x.to === me.id); return (g ? `<p class="ln-sub">incluye el 20 % de ${g.tasks} tareas que hizo Guillermo por ti</p>` : '') + gTo.map(([by, x]) => `<p class="ln-sub">incluye ${R.money(x.amount)} por Guillermo (encargo de ${esc(st.member(by).name)})</p>`).join(''); })()}
    <div class="ln"><span>PRODUCCIÓN</span><span class="d"></span><b>${R.money(mine.prod)}</b></div>
    <div class="ln"><span>POSPRODUCCIÓN</span><span class="d"></span><b>${R.money(mine.post)}</b></div>
    ${apoyoCount ? `<div class="ln" style="color:#9A927F"><span>APOYO EN ACABADO</span><span class="d"></span><span>S/ 0.00</span></div><p class="ln-sub">${apoyoCount} finales de apoyo · el pago es del dueño (5.5)</p>` : ''}
    ${lostCount ? `<div class="ln" style="color:#B3261E"><span>VIDEOS TOMADOS</span><span class="d"></span><span>S/ 0.00</span></div><p class="ln-sub">${lostCount} pasaron al administrador (5.7)</p>` : ''}
    ${pendMine > 0.004 && !complete ? `<div class="ln" style="color:#9A927F"><span>POR HACER</span><span class="d"></span><span>${R.money(pendMine)}</span></div>` : ''}
    <div style="border-top:2px dashed #B9B2A2;margin:6px 0 10px"></div>
    <div class="between"><span class="mono" style="font-size:13px;font-weight:700">${complete ? 'TOTAL' : 'ACUMULADO'}</span><span class="num" style="font-size:32px;font-weight:700;color:#0F5E40">${R.money(mine.total)}</span></div>
  </div>`;
  html += `<section class="card"><p class="lbl">Lo que logramos juntos</p><div class="grid3">
    <div class="stat"><b style="color:var(--mint)">${delivered}/${p.videos_total}</b><span>videos al cliente</span></div>
    <div class="stat"><b>${tOk}/${tTot}</b><span>entregas a tiempo</span></div>
    <div class="stat"><b>${aOk}/${aTot}</b><span>llegadas puntuales</span></div></div></section>`;
  html += `<section class="card" style="background:${bad ? '#160C0C' : '#0E0F13'};border-color:${bad ? '#5C1F1F' : '#262830'}">
    <div class="between"><p class="lbl" style="color:${col}">Tu aporte real</p><span class="muted">🔒 Solo tú</span></div>
    ${!bad && sk.pts > 0 ? `<div class="row" style="padding:12px;border-radius:14px;background:#160F22;border:1px solid #3E2C63">${icon.flame(sk.level.color, 44)}<div><b class="num" style="font-size:19px">${sk.level.name === 'Imparable' ? '¡Proyecto impecable!' : '¡Buen trabajo!'}</b><p class="muted" style="margin:3px 0 0">Racha de <b style="color:#fff">${sk.pts} pts</b> · <b style="color:${sk.level.color}">${sk.level.name}</b></p></div></div>` : ''}
    <div class="row" style="align-items:baseline;gap:8px"><b class="num" style="font-size:34px;color:${col}">${pct}%</b><span class="small" style="color:var(--tx2)">del trabajo hecho · ${fmtU(contr.units[me.id] || 0)} de ${fmtU(doneUnits)} tareas</span></div>
    <div style="position:relative;padding-top:16px"><div class="bar"><i style="width:${pct}%;background:${col}"></i></div><span style="position:absolute;left:50%;top:0;bottom:-4px;border-left:2px dashed #C9C9D1"></span><span class="muted" style="position:absolute;left:50%;top:-2px;transform:translateX(4px);font-size:10px">50%</span></div>
    <div class="grid3">
      <div class="stat" style="background:${lateCount || dlv.missed ? '#2A1212' : '#12221A'}"><b style="color:${lateCount || dlv.missed ? '#FF6B5B' : '#6EE7B7'}">${dlv.onTime}/${dlv.total}</b><span>entregas a tiempo</span></div>
      <div class="stat" style="background:${tard || aus ? '#2A1212' : '#12221A'}"><b style="color:${tard || aus ? '#FF6B5B' : '#6EE7B7'}">${punt}/${evs.length}</b><span>llegadas puntuales</span></div>
      <div class="stat" style="background:${lostCount ? '#2A1212' : '#12221A'}"><b style="color:${lostCount ? '#FF6B5B' : '#6EE7B7'}">${c.videos.filter((v) => v.owner === me.id).length - lostCount}/${c.videos.filter((v) => v.owner === me.id).length}</b><span>tus videos, hechos por ti</span></div>
    </div>
    ${bad ? `<div style="display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:14px;background:#1E1010;border:1px solid #4A1C1C"><p class="lbl" style="color:#FF9B8F">Para el próximo proyecto</p>
      ${lateCount ? tip(`${lateCount} ${lateCount === 1 ? 'entrega llegó' : 'entregas llegaron'} tarde`, 'Termina guiones y storyboards en la misma reunión, y empieza cada montaje un día antes.') : ''}
      ${tard ? tip(`${tard} ${tard === 1 ? 'llegada tarde' : 'llegadas tarde'}`, 'Sal 15 minutos antes. Puntual suma +1; tarde resta 1 (igual se paga).') : ''}
      ${aus ? tip(`${aus} ${aus === 1 ? 'falta' : 'faltas'} sin aviso a tiempo`, 'Si no puedes ir, avisa con 48 h (rodaje) o 24 h (reunión) desde la app.') : ''}
      ${dlv.missed ? tip(`${dlv.missed} ${dlv.missed === 1 ? 'video pasó' : 'videos pasaron'} a otra persona`, 'Si no llegas al plazo del montaje, el video y sus S/ 25.00 pasan al administrador.') : ''}</div>` : ''}
  </section>`;
  html += `<a class="btn ${p.status === 'cerrado' ? 'b-ghost' : 'b-amber'}" href="#/cierre">${p.status === 'cerrado' ? 'Ver liquidación' : 'Cierre del proyecto'}</a>`;
  return html;
}
const fmtU = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const tip = (what, how) => `<div><b style="font-size:13px;color:#FFC2BA">${what}</b><p class="small" style="margin:3px 0 0;color:#D4D4D8;line-height:1.45">${how}</p></div>`;

// ---------- Cierre ----------
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

// ---------- Historial ----------
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

function vHistory() {
  const F = [['all', 'Todo'], ['task', 'Tareas'], ['att', 'Asistencia'], ['plan', 'Reparto'], ['pay', 'Pagos'], ['team', 'Equipo']];
  const rows = S.data.log.slice().reverse().map((l) => Object.assign({ l }, logText(l) || {})).filter((x) => x.t && (ui.histF === 'all' || x.k === ui.histF));
  const pendC = S.data.corrections.filter((x) => x.status === 'pendiente');
  let html = `<div><h1>Historial</h1><p class="sub">Todo queda registrado con fecha y hora. Nadie puede borrarlo ni editarlo: si algo está mal, se pide una corrección.</p></div>`;
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
  let html = `<a href="#/" class="row muted" style="text-decoration:none">${icon.back} Inicio</a><h1>Equipo</h1><p class="sub">${esc((S.teams.find((t) => t.team_id === S.teamId) || {}).team || '')} · entraste como ${esc(S.session.user.email)}</p>`;
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
  html += `<section class="card" style="padding:12px 16px"><div class="between"><p class="lbl">Proyectos</p>${isAdminBtn('<a class="btn sm b-amber" href="#/proyecto/nuevo">Nuevo</a>')}</div><div class="list">${S.data.projects.slice().reverse().map((p) => `<button class="li" data-act="openProject" data-id="${p.id}" style="background:none;border:none;border-bottom:1px solid #1F2128;width:100%;text-align:left;color:inherit;cursor:pointer"><span class="t"><b>${esc(p.client)} · ${esc(p.name)}</b><span>${R.money(p.budget)} · ${p.videos_total} videos · desde ${R.fmtDay(p.start_date)}</span></span><span class="chip ${p.status === 'cerrado' ? 'c-mute' : 'c-ok'}">${p.status === 'cerrado' ? 'Cerrado' : p.id === S.projectId ? 'Actual' : 'Abierto'}</span></button>`).join('') || '<p class="empty">Sin proyectos.</p>'}</div></section>`;
  if (S.teams.length > 1) html += `<section class="card"><p class="lbl">Tus equipos</p>${S.teams.map((t) => `<button class="btn ${t.team_id === S.teamId ? 'b-amber' : 'b-ghost'}" data-act="team" data-id="${t.team_id}">${esc(t.team)}</button>`).join('')}</section>`;
  html += `<section class="card"><p class="lbl">Instalar en el celular</p><p class="sub" style="margin:0"><b>iPhone:</b> en Safari, botón Compartir → "Agregar a pantalla de inicio". <b>Android:</b> en Chrome, menú ⋮ → "Instalar app".</p></section>`;
  html += `<button class="btn b-ghost" data-act="signOut">Cerrar sesión</button>`;
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
// Hojas (formularios emergentes)
// ==================================================================
function openSheet(html) { sheetHtml = html; render(); }
function closeSheet() { sheetHtml = null; render(); }

function sheetMark(v, k, hireId) {
  const h = hireId ? S.data.hires.find((x) => x.id === hireId) : null;
  const val = R.rates(S.data.projects.find((p) => p.id === v.project_id))[k];
  return `<form data-form="mark" class="" style="display:contents"><input type="hidden" name="v" value="${v.id}"><input type="hidden" name="k" value="${k}"><input type="hidden" name="h" value="${hireId || ''}">
  <h2>${R.KIND_LABEL[k]} · video ${v.num}</h2>
  ${h ? `<div class="banner bn-fm"><div><b>Con Guillermo · contratado por ${esc(st.member(h.hired_by).name)}</b><p>Quedará como "Hecho por Guillermo". Recibes ${R.money(val * 0.8)} (80 %) y ${R.money(val * 0.2)} siguen siendo de ${esc(st.member(h.hired_by).name)}. No suma ni resta racha.</p></div></div>` : ''}
  <p class="sub" style="margin:0">Queda registrado con la hora de ahora: ${R.fmtWhen(new Date())}.</p>
  <label class="field"><span>Enlace (opcional): Drive, Docs o WhatsApp</span><input class="in" name="link" type="url" placeholder="https://"></label>
  <button class="btn b-amber">Marcar como hecho</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`;
}

function sheetNotice(e, fmOnly) {
  const now = new Date();
  const start = new Date(e.starts_at);
  const hours = e.kind === 'rodaje' ? 48 : 24;
  const onTime = start - now >= hours * 3600000;
  const left = Math.max(0, Math.round((start - now) / 3600000));
  return `<form data-form="notice" style="display:contents"><input type="hidden" name="e" value="${e.id}">
  <h2>${fmOnly ? 'Fue fuerza mayor' : 'No podré ir'}</h2>
  ${fmOnly ? '' : `<div class="banner ${onTime ? 'bn-ok' : 'bn-warn'}"><div><b>${onTime ? `Faltan ${left} h · aviso a tiempo` : `Faltan ${left} h · fuera de plazo`}</b><p>${onTime ? `Avisar con más de ${hours} h es cancelar a tiempo: no resta racha ni es incumplimiento.` : `Con menos de ${hours} h, tu compañero decide si graba tus videos (y cobra ese rodaje) o si se reprograman. Resta 3 puntos.`}</p></div></div>`}
  <p class="lbl">Motivo</p>
  <label class="opt" data-pick="reason"><input type="radio" name="reason" value="normal" ${fmOnly ? '' : 'checked'} class="hide"><span class="rd"></span><span><b>Otro compromiso</b><br><span class="muted">Trabajo, viaje, algo personal.</span></span></label>
  <label class="opt" data-pick="reason"><input type="radio" name="reason" value="fm" ${fmOnly ? 'checked' : ''} class="hide"><span class="rd"></span><span><b>Fuerza mayor</b><br><span class="muted">Salud, accidente, familiar u otra situación grave (7.4). No das detalles privados; tu compañero la acepta.</span></span></label>
  <label class="field"><span>Tipo de fuerza mayor (si aplica)</span><select class="in" name="fm_kind"><option>Salud</option><option>Accidente</option><option>Familiar</option><option>Otra grave</option></select></label>
  ${e.kind === 'rodaje' ? `<p class="lbl">Tus videos de este rodaje</p>
  <label class="opt" data-pick="choice"><input type="radio" name="choice" value="repro" checked class="hide"><span class="rd"></span><span><b>Reprogramarlos</b><br><span class="muted">Siguen siendo tuyos y conservan su valor.</span></span></label>
  <label class="opt" data-pick="choice"><input type="radio" name="choice" value="other" class="hide"><span class="rd"></span><span><b>Que los grabe mi compañero</b><br><span class="muted">El pago de rodaje pasa a quien graba (5.4).</span></span></label>` : ''}
  <button class="btn b-blue">Enviar aviso</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`;
}

// ==================================================================
// Render y eventos
// ==================================================================
function render() {
  if (!S.ready) return;
  const r = location.hash.replace(/^#\/?/, '').split('/');
  let html;
  if (!S.session) html = vLogin(r[0] === 'i' ? r[1] : null);
  else if (!S.teamId || !S.me) html = vNoTeam(r[0] === 'i' ? r[1] : ui.inviteCode);
  else if (r[0] === 'i' && r[1]) html = layout('home', vAccept(r[1]));
  else {
    const map = { '': ['home', vHome], videos: ['vids', vVideos], semana: ['vids', vWeek], v: ['vids', () => vVideo(r[1])], e: ['vids', () => vEvent(r[1])], resumen: ['sum', vSummary], cierre: ['sum', vClose], historial: ['hist', vHistory], equipo: ['', vTeam], proyecto: ['', vNewProject] };
    const [tab, fn] = map[r[0]] || map[''];
    html = layout(tab, fn());
  }
  if (sheetHtml) html += `<div class="sheet" data-act="closeBg"><div>${sheetHtml}</div></div>`;
  $app.innerHTML = html;
  $toast.innerHTML = S.toast ? `<div class="t-${S.toast.kind}">${esc(S.toast.msg)}</div>` : '';
  syncOpts();
}

function syncOpts() {
  document.querySelectorAll('label.opt').forEach((l) => { const i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
}

const ACT = {
  close: closeSheet,
  closeBg: (el, e) => { if (e.target === el) closeSheet(); },
  pickProject: () => openSheet(`<h2>Proyectos</h2>${S.data.projects.slice().reverse().map((p) => `<button class="btn ${p.id === S.projectId ? 'b-amber' : 'b-ghost'}" data-act="openProject" data-id="${p.id}">${esc(p.client)} · ${esc(p.name)}${p.status === 'cerrado' ? ' (cerrado)' : ''}</button>`).join('') || '<p class="empty">Sin proyectos.</p>'}${isAdminBtn('<a class="btn b-ghost" href="#/proyecto/nuevo" data-act="close">+ Nuevo proyecto</a>')}`),
  openProject: (el) => { st.switchProject(el.dataset.id); sheetHtml = null; location.hash = '#/'; render(); },
  team: (el) => st.switchTeam(el.dataset.id),
  mark: (el) => { const v = S.data.videos.find((x) => x.id === el.dataset.v); openSheet(sheetMark(v, el.dataset.k, el.dataset.h)); },
  undo: async (el) => { if (confirm('¿Desmarcar esta tarea? Quedará en el historial.')) await st.undoTask(el.dataset.id); },
  swap: async (el) => {
    const v = S.data.videos.find((x) => x.id === el.dataset.v);
    const other = st.partners().find((m) => m.id !== v.owner);
    if (other && confirm(`¿Pasar el video ${v.num} a ${other.name}? Háganlo solo de mutuo acuerdo: queda en el historial.`)) await st.changeOwner(v.id, other.id);
  },
  notice: (el) => { const e = S.data.events.find((x) => x.id === el.dataset.e); openSheet(sheetNotice(e, !!el.dataset.fm)); },
  decide: async (el) => {
    const a = S.data.attendance.find((x) => x.id === el.dataset.a);
    await st.decideNotice(a, el.dataset.d);
  },
  recordFor: async (el) => { const e = S.data.events.find((x) => x.id === el.dataset.e); await st.recordVideos(e, [el.dataset.v]); },
  repro: (el) => {
    const e = S.data.events.find((x) => x.id === el.dataset.e);
    const left = e.video_ids.filter((id) => !S.data.tasks.find((t) => t.video_id === id && t.kind === 'rodaje'));
    openSheet(`<form data-form="repro" style="display:contents"><input type="hidden" name="e" value="${e.id}"><h2>Reprogramar</h2><p class="sub" style="margin:0">${left.length} videos pasan al nuevo rodaje. Conservan su dueño y su valor (5.10).</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="d" required value="${R.addDays(R.limaDate(e.starts_at), 1)}"></label><label class="field"><span>Hora</span><input class="in" type="time" name="t" required value="10:00"></label></div>
    <button class="btn b-amber">Reprogramar</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`);
  },
  tol: (el) => { const e = S.data.events.find((x) => x.id === el.dataset.e); const v = prompt('Tolerancia en minutos para este rodaje (acordada con tu socio):', e.tolerance_min); if (v && Number(v) > 0) st.setTolerance(e, Number(v)); },
  sendSettle: async () => { const p = st.project(); if (confirm('¿Enviar la liquidación? Tu socio la revisará y confirmará.')) await st.sendSettlement(p); },
  confirmSettle: async () => { await st.confirmSettlement(st.project()); },
  observe: async () => { const t = prompt('¿Qué no cuadra? Ej.: "El rodaje del video 3 lo grabé yo."'); if (t) await st.observeSettlement(st.project(), t); },
  histF: (el) => { ui.histF = el.dataset.k; render(); },
  askCorr: async (el) => { const t = prompt('Describe la corrección. El registro original no se borra; tu compañero tendrá que aprobarla.'); if (t) await st.requestCorrection(Number(el.dataset.id), t); },
  corr: async (el) => { const c = S.data.corrections.find((x) => x.id === el.dataset.id); await st.decideCorrection(c, el.dataset.s); },
  rename: async (el) => { const m = st.member(el.dataset.id); const n = prompt('Nombre (así aparecerá en avisos, recibos e historial):', m.name); if (n && n.trim() && n.trim() !== m.name) await st.renameMember(m.id, n); },
  copy: async (el) => { try { await navigator.clipboard.writeText(el.dataset.t); st.toast('Enlace copiado'); } catch (e) { prompt('Copia el enlace:', el.dataset.t); } },
  photo: async (el) => { const url = await st.fileUrl(el.dataset.p); openSheet(url ? `<img class="photo" style="max-height:70vh" src="${esc(url)}" alt="Evidencia"><button class="btn b-ghost" data-act="close">Cerrar</button>` : '<p class="empty">No se pudo cargar la foto.</p><button class="btn b-ghost" data-act="close">Cerrar</button>'); },
  schedule: () => openSheet(`<form data-form="schedule" style="display:contents"><h2>Agendar reunión</h2><p class="sub" style="margin:0">Agéndala con anticipación. Si no podrás ir, desde la reunión puedes contratar a Guillermo.</p>
    <div class="grid2"><label class="field"><span>Fecha</span><input class="in" type="date" name="d" required value="${R.addDays(R.limaDate(new Date()), 1)}"></label><label class="field"><span>Hora</span><input class="in" type="time" name="t" required value="10:00"></label></div>
    <button class="btn b-amber">Agendar</button><button type="button" class="btn b-ghost" data-act="close">Cancelar</button></form>`),
  hire: (el) => {
    const e = S.data.events.find((x) => x.id === el.dataset.e);
    const p = S.data.projects.find((x) => x.id === e.project_id);
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
  hireGo: async (el) => { const e = S.data.events.find((x) => x.id === el.dataset.e); sheetHtml = null; await st.hireGuillermo(e); },
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
  week: async (f) => {
    const n = Number(f.n);
    const videos = Array.from({ length: n }, (_, i) => ({ publish_date: f['pub' + i], owner: f['own' + i] }));
    await st.addWeek({ meeting_date: f.md, meeting_time: f.mt, rodaje_date: f.rd, rodaje_time: f.rt, videos });
    location.hash = '#/videos';
  },
  mark: async (f) => { const v = S.data.videos.find((x) => x.id === f.v); sheetHtml = null; const extra = {}; if (f.link) extra.link = f.link; if (f.h) extra.hire_id = f.h; await st.markTask(v, f.k, extra); },
  notice: async (f) => {
    const e = S.data.events.find((x) => x.id === f.e);
    sheetHtml = null;
    await st.sendNotice(e, { reason: f.reason, fm_kind: f.reason === 'fm' ? f.fm_kind : null, choice: f.choice || null });
  },
  schedule: async (f) => { sheetHtml = null; await st.scheduleMeeting(f.d, f.t); },
  repro: async (f) => {
    const e = S.data.events.find((x) => x.id === f.e);
    const left = e.video_ids.filter((id) => !S.data.tasks.find((t) => t.video_id === id && t.kind === 'rodaje'));
    sheetHtml = null;
    await st.reprogram(e, left, f.d, f.t);
  },
  checkin: async (f, form) => {
    const e = S.data.events.find((x) => x.id === f.e);
    const file = form.photo && form.photo.files[0];
    let path = null;
    if (file) path = await st.uploadPhoto(file);
    await st.checkIn(e, path);
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
