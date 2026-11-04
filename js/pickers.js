// 1.6 · Selector de hora (ruedas, 24 h, de 5 en 5 · boceto HoraB) y calendario del mes (boceto CalendarioA).
// Se dibujan fuera de la pantalla principal (en <body>), así un redibujo de la app no los cierra.
import { fmtDay, addDays, limaDate } from './rules.js';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ACC = {
  amber: { c: '#FFB547', t: '#FFC978', bg: '#36280F', bd: '#6B4A1A', fg: '#FFE2B8', on: '#1A1203' },
  blue: { c: '#8AB4FF', t: '#A9C7FF', bg: '#1D3566', bd: '#3D6BB8', fg: '#E3ECFF', on: '#0B1530' },
  mint: { c: '#6EE7B7', t: '#9EF0CD', bg: '#133626', bd: '#2F6B4F', fg: '#C9F7E3', on: '#0B1F15' }
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = {
  prev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
};
export const p2 = (n) => String(n).padStart(2, '0');
// Hora redondeada a 5 minutos.
export function roundTime(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '') || [0, 10, 0];
  let tot = Math.round((Number(m[1]) * 60 + Number(m[2])) / 5) * 5;
  tot = ((tot % 1440) + 1440) % 1440;
  return p2(Math.floor(tot / 60)) + ':' + p2(tot % 60);
}

let el = null;
function close() { if (el) { el.remove(); el = null; document.documentElement.classList.remove('pk-open'); } }
export const pickerOpen = () => !!el;
function mount(html, acc) {
  close();
  el = document.createElement('div');
  el.className = 'pk';
  el.style.setProperty('--pk', acc.c); el.style.setProperty('--pk-t', acc.t); el.style.setProperty('--pk-bg', acc.bg); el.style.setProperty('--pk-bd', acc.bd); el.style.setProperty('--pk-fg', acc.fg); el.style.setProperty('--pk-on', acc.on);
  el.innerHTML = `<button type="button" class="pk-bgx" aria-label="Cerrar" data-pk="x"></button><section class="pk-sh" role="dialog" aria-modal="true">${html}</section>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('pk-open');
  return el;
}

// ---------- Hora ----------
// opts: { value 'HH:MM', title, sub, accent, onDone(v) }
export function openTime(opts) {
  const acc = ACC[opts.accent] || ACC.amber;
  const v = roundTime(opts.value || '10:00');
  const H = Array.from({ length: 24 }, (_, i) => i), M = Array.from({ length: 12 }, (_, i) => i * 5);
  const col = (vals, lbl, k) => `<div class="pk-wc"><span class="pk-wl">${lbl}</span><div class="pk-w" data-w="${k}">${vals.map((x, i) => `<button type="button" class="pk-wi" data-i="${i}" aria-label="${lbl} ${p2(x)}">${p2(x)}</button>`).join('')}</div></div>`;
  const root = mount(`<span class="pk-grab"></span>
    <div class="pk-hd"><p class="lbl" style="color:var(--pk-t)">${esc(opts.title || 'Hora')}</p><span class="pk-day">${esc(opts.sub || '')}</span></div>
    <div class="pk-wheels"><span class="pk-band" aria-hidden="true"></span>${col(H, 'Hora', 'h')}<b class="pk-colon">:</b>${col(M, 'Minutos', 'm')}</div>
    <p class="pk-tip">Desliza o toca un número · queda <b data-big>${v}</b></p>
    <div class="pk-bt"><button type="button" class="pk-sb pk-c" data-pk="x">Cancelar</button><button type="button" class="pk-sb pk-ok" data-pk="ok">Listo</button></div>`, acc);
  const IH = 44;
  const wh = root.querySelector('[data-w=h]'), wm = root.querySelector('[data-w=m]');
  const idx = (w) => Math.max(0, Math.min(w.children.length - 1, Math.round(w.scrollTop / IH)));
  const cur = () => p2(H[idx(wh)]) + ':' + p2(M[idx(wm)]);
  const paint = (w) => { const i = idx(w); [...w.children].forEach((b, k) => { const d = Math.abs(k - i); b.className = 'pk-wi' + (d === 0 ? ' on' : d === 1 ? ' n1' : d === 2 ? ' n2' : ''); }); root.querySelector('[data-big]').textContent = cur(); };
  const [h0, m0] = v.split(':').map(Number);
  requestAnimationFrame(() => { wh.scrollTop = h0 * IH; wm.scrollTop = (m0 / 5) * IH; paint(wh); paint(wm); });
  for (const w of [wh, wm]) {
    let t = null;
    w.addEventListener('scroll', () => { paint(w); clearTimeout(t); t = setTimeout(() => { const i = idx(w); if (Math.abs(w.scrollTop - i * IH) > 1) w.scrollTo({ top: i * IH, behavior: 'smooth' }); }, 120); }, { passive: true });
    w.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) w.scrollTo({ top: Number(b.dataset.i) * IH, behavior: 'smooth' }); });
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pk]');
    if (!b) return;
    if (b.dataset.pk === 'ok') { const val = cur(); close(); opts.onDone && opts.onDone(val); } else close();
  });
}

// ---------- Calendario ----------
// opts: { value 'YYYY-MM-DD', today, title, sub, accent, day(d) → {off, tight, why}, dots(d) → {rod, meet},
//         okText(d) → texto si se puede, quick: [{t, d}], onDone(d) }
export function openDate(opts) {
  const acc = ACC[opts.accent] || ACC.amber;
  const today = opts.today || limaDate(new Date());
  let sel = opts.value || null;
  let month = (sel || today).slice(0, 7);
  const info = (d) => (opts.day ? opts.day(d) || {} : {});
  const root = mount('', acc);
  const sh = root.querySelector('.pk-sh');
  function draw() {
    const [y, mo] = month.split('-').map(Number);
    const first = `${month}-01`;
    const dow = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7; // lunes = 0
    const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    let cells = '';
    for (let i = 0; i < dow; i++) cells += '<span class="pk-cx"></span>';
    for (let n = 1; n <= days; n++) {
      const d = `${month}-${p2(n)}`;
      const s = info(d), dt = opts.dots ? opts.dots(d) || {} : {};
      const cls = ['pk-cd', s.off ? 'off' : '', s.tight ? 'tight' : '', d === today ? 'today' : '', d === sel ? 'on' : ''].filter(Boolean).join(' ');
      cells += `<button type="button" class="${cls}" data-d="${d}" aria-label="${esc(fmtDay(d))}${s.off ? ' · no disponible' : ''}"><span>${n}</span>${dt.rod || dt.meet ? `<i>${dt.rod ? '<u class="r"></u>' : ''}${dt.meet ? '<u class="m"></u>' : ''}</i>` : ''}</button>`;
    }
    const s = sel ? info(sel) : { off: true, why: 'Elige un día.' };
    let line, kind;
    if (!sel) { line = 'Elige un día.'; kind = 'mute'; }
    else if (s.off) { line = `${fmtDay(sel)}: ${s.why || 'no disponible'}. Elige otro día.`; kind = 'bad'; }
    else if (s.tight) { line = `${fmtDay(sel)} · ${s.why}`; kind = 'bad'; }
    else { line = (opts.okText ? opts.okText(sel) : '') || s.why || fmtDay(sel); kind = 'ok'; }
    const minM = opts.minMonth || '', maxM = opts.maxMonth || '';
    const quick = (opts.quick || []).filter((q) => q && q.d && !info(q.d).off);
    sh.innerHTML = `<span class="pk-grab"></span>
      <div class="pk-hd"><p class="lbl" style="color:var(--pk-t)">${esc(opts.title || 'Fecha')}</p><span class="pk-day">${esc(opts.sub || '')}</span></div>
      <div class="pk-nav"><button type="button" class="pk-nb" data-pk="prev" aria-label="Mes anterior" ${minM && month <= minM ? 'disabled' : ''}>${ico.prev}</button><p class="pk-mo">${MESES[mo - 1]} ${y}</p><button type="button" class="pk-nb" data-pk="next" aria-label="Mes siguiente" ${maxM && month >= maxM ? 'disabled' : ''}>${ico.next}</button></div>
      <div class="pk-grid">${['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((t) => `<span class="pk-dh">${t}</span>`).join('')}${cells}</div>
      ${quick.length ? `<div class="pk-qk">${quick.map((q) => `<button type="button" class="pk-chip" data-d="${q.d}">${esc(q.t)}</button>`).join('')}</div>` : ''}
      <div class="pk-lg">${opts.dots ? '<span><u class="r"></u>Rodaje</span><span><u class="m"></u>Reunión</span>' : ''}${opts.day ? '<span><b class="lt"></b>Poco tiempo</span><span><b class="lo"></b>No disponible</span>' : ''}</div>
      <div class="pk-info ${kind}"><span></span><p>${esc(line)}</p></div>
      <div class="pk-bt"><button type="button" class="pk-sb pk-c" data-pk="x">Cancelar</button><button type="button" class="pk-sb pk-ok" data-pk="ok" ${!sel || s.off ? 'disabled' : ''}>Listo</button></div>`;
  }
  draw();
  root.addEventListener('click', (e) => {
    const d = e.target.closest('[data-d]');
    if (d) { sel = d.dataset.d; month = sel.slice(0, 7); draw(); return; }
    const b = e.target.closest('[data-pk]');
    if (!b || b.disabled) return;
    const k = b.dataset.pk;
    if (k === 'prev' || k === 'next') { const [y, mo] = month.split('-').map(Number); const t = new Date(Date.UTC(y, mo - 1 + (k === 'next' ? 1 : -1), 1)); month = t.toISOString().slice(0, 7); draw(); return; }
    if (k === 'ok') { if (!sel || info(sel).off) return; const v = sel; close(); opts.onDone && opts.onDone(v); return; }
    close();
  });
}
// Atajos útiles: "Jue 19" (próximos días permitidos) y "Próxima semana".
export function quickDays(from, n, ok) {
  const out = [];
  for (let d = from, k = 0; k < 21 && out.length < n; k++, d = addDays(d, 1)) if (ok(d)) out.push({ t: fmtDay(d).replace(/ \w+$/, '').replace(/^./, (c) => c.toUpperCase()), d });
  return out;
}
export { close as closePicker };
