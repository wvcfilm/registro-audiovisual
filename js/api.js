// Capa de datos. Misma interfaz para Supabase (real) y para el modo demo (en este navegador).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const TABLES = ['members', 'projects', 'videos', 'tasks', 'events', 'attendance', 'hires', 'log', 'corrections', 'proposals', 'claims'];
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(16).slice(2) + Date.now().toString(16));

// ------------------------------------------------------------------
// Supabase por REST (sin librerías)
// ------------------------------------------------------------------
class SupabaseAPI {
  constructor(url, key) {
    this.mode = 'supabase';
    this.url = url.replace(/\/$/, '');
    this.key = key;
    this.s = JSON.parse(localStorage.getItem('ra-session') || 'null');
  }
  save(s) { this.s = s; if (s) localStorage.setItem('ra-session', JSON.stringify(s)); else localStorage.removeItem('ra-session'); }
  headers(json = true) {
    const h = { apikey: this.key };
    if (this.s && this.s.access_token) h.Authorization = 'Bearer ' + this.s.access_token;
    else if (this.key.startsWith('eyJ')) h.Authorization = 'Bearer ' + this.key;
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }
  async req(path, opts = {}) {
    await this.fresh();
    const r = await fetch(this.url + path, Object.assign({}, opts, { headers: Object.assign(this.headers(!opts.raw), opts.headers || {}) }));
    if (r.status === 401 && this.s) { await this.refresh(); return this.req(path, opts); }
    const text = await r.text();
    const body = text ? JSON.parse(text) : null;
    if (!r.ok) throw new Error((body && (body.message || body.msg || body.error_description || body.error)) || ('Error ' + r.status));
    return body;
  }
  // --- sesión ---
  async handleRedirect() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get('access_token')) {
      this.save({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_at: Date.now() + Number(h.get('expires_in') || 3600) * 1000 });
      history.replaceState(null, '', location.pathname + location.search);
      await this.loadUser();
    }
  }
  async loadUser() {
    const u = await fetch(this.url + '/auth/v1/user', { headers: this.headers() }).then((r) => r.ok ? r.json() : null);
    if (u) this.save(Object.assign({}, this.s, { user: { id: u.id, email: u.email } }));
  }
  async fresh() { if (this.s && this.s.expires_at && Date.now() > this.s.expires_at - 60000) await this.refresh(); }
  async refresh() {
    if (!this.s || !this.s.refresh_token) { this.save(null); return; }
    const r = await fetch(this.url + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: this.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: this.s.refresh_token }) });
    if (!r.ok) { this.save(null); return; }
    const b = await r.json();
    this.save({ access_token: b.access_token, refresh_token: b.refresh_token, expires_at: Date.now() + b.expires_in * 1000, user: { id: b.user.id, email: b.user.email } });
  }
  session() { return this.s && this.s.user ? this.s : null; }
  async sendCode(email) {
    const redirect = encodeURIComponent(location.origin + location.pathname);
    const r = await fetch(`${this.url}/auth/v1/otp?redirect_to=${redirect}`, { method: 'POST', headers: { apikey: this.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, create_user: true }) });
    if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.msg || b.error_description || 'No se pudo enviar el correo'); }
  }
  googleUrl() {
    return `${this.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(location.origin + location.pathname)}`;
  }
  async verifyCode(email, token) {
    const r = await fetch(`${this.url}/auth/v1/verify`, { method: 'POST', headers: { apikey: this.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', email, token }) });
    const b = await r.json();
    if (!r.ok) throw new Error('El código no es válido o venció');
    this.save({ access_token: b.access_token, refresh_token: b.refresh_token, expires_at: Date.now() + b.expires_in * 1000, user: { id: b.user.id, email: b.user.email } });
  }
  async signOut() { try { await fetch(this.url + '/auth/v1/logout', { method: 'POST', headers: this.headers() }); } catch (e) { /* sin red */ } this.save(null); }
  // --- datos ---
  rpc(fn, args) { return this.req('/rest/v1/rpc/' + fn, { method: 'POST', body: JSON.stringify(args || {}) }); }
  list(table, teamId) {
    const ORDER = { log: 'id.asc', videos: 'num.asc', tasks: 'done_at.asc', attendance: 'id.asc', hires: 'created_at.asc' };
    return this.req(`/rest/v1/${table}?select=*&team_id=eq.${teamId}&order=${ORDER[table] || 'created_at.asc'}`);
  }
  async insert(table, row) { const b = await this.req(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) }); return b[0]; }
  async update(table, id, patch) { const b = await this.req(`/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) }); return b[0]; }
  remove(table, id) { return this.req(`/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE' }); }
  async upload(teamId, file) {
    const path = `${teamId}/${Date.now()}-${(file.name || 'foto.jpg').replace(/[^\w.-]/g, '_')}`;
    await this.req(`/storage/v1/object/evidencia/${path}`, { method: 'POST', raw: true, headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
    return path;
  }
  async fileUrl(path) {
    const b = await this.req(`/storage/v1/object/sign/evidencia/${path}`, { method: 'POST', body: JSON.stringify({ expiresIn: 3600 }) });
    return this.url + '/storage/v1' + b.signedURL;
  }
}

// ------------------------------------------------------------------
// Modo demo: todo en este navegador, con las mismas reglas que la base real
// ------------------------------------------------------------------
class DemoAPI {
  constructor() {
    this.mode = 'demo';
    this.db = JSON.parse(localStorage.getItem('ra-demo') || 'null') || { teams: [], users: [], who: null };
    TABLES.forEach((t) => { if (!this.db[t]) this.db[t] = []; });
    this.logId = this.db.log.length;
  }
  persist() { localStorage.setItem('ra-demo', JSON.stringify(this.db)); }
  session() { const u = this.db.users.find((x) => x.id === this.db.who); return u ? { user: u } : null; }
  async handleRedirect() {}
  async sendCode() {}
  async verifyCode(email) {
    let u = this.db.users.find((x) => x.email === email.toLowerCase());
    if (!u) { u = { id: uuid(), email: email.toLowerCase() }; this.db.users.push(u); }
    this.db.who = u.id; this.persist();
  }
  async signOut() { this.db.who = null; this.persist(); }
  switchUser(id) { this.db.who = id; this.persist(); }
  me(teamId) { return this.db.members.find((m) => m.team_id === teamId && m.user_id === this.db.who && m.active); }
  partner(teamId) { const m = this.me(teamId); return m && (m.role === 'admin' || m.role === 'socio'); }
  log(teamId, projectId, type, data, actor) {
    const n = (data && data.new) || {};
    const when = this.seeding ? (n.done_at || n.arrived_at || n.created_at || new Date().toISOString()) : new Date().toISOString();
    this.db.log.push({ id: ++this.logId, team_id: teamId, project_id: projectId || null, at: when, actor: actor !== undefined ? actor : (this.me(teamId) || {}).id || null, type, data });
  }
  async rpc(fn, a) {
    const uid = this.db.who;
    if (fn === 'create_team') {
      const t = { id: uuid(), name: a.team_name, created_at: new Date().toISOString() };
      this.db.teams.push(t);
      this.db.members.push({ id: uuid(), team_id: t.id, user_id: uid, name: a.my_name, role: 'admin', apoyo: false, active: true, created_at: new Date().toISOString() });
      this.persist(); return t.id;
    }
    if (fn === 'my_teams') {
      return this.db.members.filter((m) => m.user_id === uid && m.active).map((m) => ({ team_id: m.team_id, team: (this.db.teams.find((t) => t.id === m.team_id) || {}).name, member_id: m.id, role: m.role, name: m.name }));
    }
    if (fn === 'create_invite') {
      const me = this.me(a.t);
      if (!me || me.role !== 'admin') throw new Error('Solo el administrador invita');
      const code = Math.random().toString(16).slice(2, 10).toUpperCase();
      this.db.members.push({ id: uuid(), team_id: a.t, user_id: null, name: a.invite_name, role: a.invite_role, apoyo: !!a.gets_apoyo, invite_code: code, invite_expires: new Date(Date.now() + 7 * 864e5).toISOString(), active: true, created_at: new Date().toISOString() });
      this.log(a.t, null, 'invite', { name: a.invite_name, role: a.invite_role });
      this.persist(); return code;
    }
    if (fn === 'invite_info') {
      const m = this.db.members.find((x) => x.invite_code === String(a.code).toUpperCase());
      if (!m) return null;
      return { team: (this.db.teams.find((t) => t.id === m.team_id) || {}).name, name: m.name, role: m.role, expired: new Date(m.invite_expires) < new Date(), used: !!m.user_id };
    }
    if (fn === 'accept_invite') {
      const m = this.db.members.find((x) => x.invite_code === String(a.code).toUpperCase());
      if (!m) throw new Error('Invitación no encontrada');
      if (m.user_id) throw new Error('Esta invitación ya se usó');
      m.user_id = uid; m.name = (a.my_name || '').trim() || m.name; m.invite_code = null;
      this.log(m.team_id, null, 'join', { name: m.name, role: m.role }, m.id);
      this.persist(); return m.team_id;
    }
    if (fn === 'team_settings') { const t = this.db.teams.find((x) => x.id === a.t); return t ? (t.settings || {}) : null; }
    if (fn === 'save_settings') {
      const me = this.me(a.t); if (!me || me.role !== 'admin') throw new Error('Solo el administrador cambia los ajustes');
      if (['look', 'reminders'].indexOf(a.k) === -1) throw new Error('Ese ajuste se cambia con una propuesta');
      const t = this.db.teams.find((x) => x.id === a.t); t.settings = Object.assign({}, t.settings || {}); t.settings[a.k] = a.v;
      this.log(a.t, null, 'settings.' + a.k, { new: a.v }); this.persist(); return t.settings;
    }
    if (fn === 'move_video') {
      const v = this.db.videos.find((x) => x.id === a.v);
      if (!v || !this.partner(v.team_id)) throw new Error('Sin permiso');
      if (this.db.tasks.find((t) => t.video_id === v.id && t.kind === 'rodaje')) throw new Error('Ese video ya se grabó');
      const dst = this.db.events.find((e) => e.id === a.to_rodaje && e.kind === 'rodaje' && (e.status || 'activo') === 'activo' && e.project_id === v.project_id);
      if (!dst) throw new Error('Elige un rodaje activo del mismo proyecto');
      if (new Date(dst.starts_at) <= new Date()) throw new Error('Ese rodaje ya empezó');
      for (const e of this.db.events.filter((x) => x.kind === 'rodaje' && (x.status || 'activo') === 'activo' && x.id !== dst.id && x.video_ids.indexOf(v.id) !== -1)) e.video_ids = e.video_ids.filter((id) => id !== v.id);
      if (dst.video_ids.indexOf(v.id) === -1) dst.video_ids = dst.video_ids.concat([v.id]);
      this.log(v.team_id, v.project_id, 'video.reprogramado', { video: v.num, to: dst.starts_at });
      this.persist(); return null;
    }
    throw new Error('Función desconocida: ' + fn);
  }
  async list(table, teamId) {
    if (!this.partner(teamId)) return [];
    const rows = this.db[table].filter((r) => r.team_id === teamId);
    return JSON.parse(JSON.stringify(rows));
  }
  projectOf(table, row) {
    if (table === 'projects') return row.id;
    if (table === 'attendance') { const e = this.db.events.find((x) => x.id === row.event_id); return e ? e.project_id : null; }
    return row.project_id || null;
  }
  async insert(table, row) {
    if (!this.partner(row.team_id)) throw new Error('Sin permiso');
    if (table === 'log') { const r = Object.assign({ id: ++this.logId, at: new Date().toISOString() }, row); this.db.log.push(r); this.persist(); return r; }
    if (table === 'tasks' && this.db.tasks.find((t) => t.video_id === row.video_id && t.kind === row.kind)) throw new Error('Esa tarea ya está marcada');
    if (table === 'attendance' && this.db.attendance.find((t) => t.event_id === row.event_id && t.member_id === row.member_id)) throw new Error('Ya existe');
    if (table === 'claims') {
      const me = this.me(row.team_id);
      if (!me || row.member_id !== me.id) throw new Error('Solo puedes tomar a tu nombre');
      if (this.db.claims.find((c) => c.video_id === row.video_id && c.kind === row.kind && (c.rodaje_id || null) === (row.rodaje_id || null))) throw new Error('Ya lo tomó alguien');
      if (this.db.tasks.find((t) => t.video_id === row.video_id && t.kind === row.kind)) throw new Error('Esa tarea ya está hecha');
    }
    const r = Object.assign({ id: uuid(), created_at: new Date().toISOString() }, row);
    if (table === 'tasks' && !r.done_at) r.done_at = new Date().toISOString();
    this.db[table].push(r);
    this.log(r.team_id, this.projectOf(table, r), table + '.insert', { new: r, old: null });
    // 1.3 (igual que la base): grabar sin storyboard lo reparte mitad y mitad y lo cierra.
    if (table === 'tasks' && r.kind === 'rodaje' && !this.db.tasks.find((t) => t.video_id === r.video_id && t.kind === 'storyboard')) {
      const v = this.db.videos.find((x) => x.id === r.video_id);
      const oth = this.db.members.find((m) => m.team_id === r.team_id && m.active && m.id !== v.owner && (m.role === 'admin' || m.role === 'socio'));
      const sb = { id: uuid(), team_id: r.team_id, project_id: r.project_id, video_id: r.video_id, kind: 'storyboard', done_by: v.owner, done_at: r.done_at, split: true, split_with: oth ? oth.id : v.owner, created_at: r.created_at };
      this.db.tasks.push(sb);
      this.log(r.team_id, r.project_id, 'tasks.insert', { new: sb, old: null });
    }
    this.persist(); return JSON.parse(JSON.stringify(r));
  }
  async update(table, id, patch) {
    const r = this.db[table].find((x) => x.id === id);
    if (!r) throw new Error('No encontrado');
    const me = this.me(r.team_id);
    if (!me) throw new Error('Sin permiso');
    if (table === 'tasks' && me.role !== 'admin') throw new Error('Solo el administrador corrige tareas');
    if (table === 'log') throw new Error('El historial no se edita');
    const old = JSON.parse(JSON.stringify(r));
    if (table === 'proposals' && patch.status && patch.status !== old.status) {
      if (old.status !== 'pendiente') throw new Error('Esa propuesta ya se decidió');
      if (patch.status === 'retirada' && me.id !== old.proposed_by) throw new Error('Solo quien propuso puede retirarla');
      if ((patch.status === 'aprobada' || patch.status === 'rechazada') && me.id === old.proposed_by) throw new Error('La aprueba tu compañero');
      patch = Object.assign({}, patch, { decided_by: me.id, decided_at: new Date().toISOString() });
      if (patch.status === 'aprobada') { const t = this.db.teams.find((x) => x.id === r.team_id); t.settings = Object.assign({}, t.settings || {}); t.settings[old.kind] = Object.assign({}, t.settings[old.kind] || {}, old.data); }
    }
    Object.assign(r, patch);
    this.log(r.team_id, this.projectOf(table, r), table + '.update', { new: r, old });
    this.persist(); return JSON.parse(JSON.stringify(r));
  }
  async remove(table, id) {
    const i = this.db[table].findIndex((x) => x.id === id);
    if (i < 0) return;
    const r = this.db[table][i];
    const me = this.me(r.team_id);
    const ownClaim = table === 'claims' && me && r.member_id === me.id && !this.db.tasks.find((t) => t.video_id === r.video_id && t.kind === r.kind);
    if (!me || (me.role !== 'admin' && !ownClaim) || table === 'log') throw new Error('Sin permiso');
    this.db[table].splice(i, 1);
    this.log(r.team_id, this.projectOf(table, r), table + '.delete', { new: null, old: r });
    if (table === 'tasks' && r.kind === 'rodaje') {
      const j = this.db.tasks.findIndex((t) => t.video_id === r.video_id && t.kind === 'storyboard' && t.split);
      if (j >= 0) { const sb = this.db.tasks.splice(j, 1)[0]; this.log(r.team_id, r.project_id, 'tasks.delete', { new: null, old: sb }); }
    }
    this.persist();
  }
  async upload(teamId, file) {
    const data = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); });
    const key = 'ra-file-' + Date.now();
    try { localStorage.setItem(key, data); } catch (e) { return 'demo-sin-espacio'; }
    return key;
  }
  async fileUrl(path) { return localStorage.getItem(path) || ''; }
  reset() { localStorage.removeItem('ra-demo'); Object.keys(localStorage).filter((k) => k.startsWith('ra-file-')).forEach((k) => localStorage.removeItem(k)); }
}

let practice = false;
try { practice = localStorage.getItem('ra-practice') === '1'; } catch (e) { /* sin almacenamiento */ }
export const isPractice = practice;
export const hasServer = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const api = hasServer && !practice ? new SupabaseAPI(SUPABASE_URL, SUPABASE_ANON_KEY) : new DemoAPI();
export { TABLES, uuid };
