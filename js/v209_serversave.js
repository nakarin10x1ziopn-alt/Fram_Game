'use strict';
// ---------- v209_serversave: saves on the laptop server (saves\ folder of the computer that runs server.py): status, window to bring any of them back, automatic reconnect ----------
//  - a small status pill (💻 ✓ 14:03) tells whether the last save really reached the file on the laptop; red when it did not (and the game retries by itself)
//  - the "save" button reports the real result of the upload (file name, size, time)
//  - 💻 window: every save the laptop holds (all devices), its backups (last 5 · one per day for 14 days · "replaced by an older one" · "deleted"), load one into the slot being played, download as a file, or save the current game now
//  - when the server was not reachable at start-up the game keeps checking and reconnects (and sends the newest save)
V23.add('v209_serversave', () => {
  if (typeof Net === 'undefined' || typeof UI === 'undefined' || typeof Slots === 'undefined') return;
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const hms = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const dt = t => { const d = new Date(t); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const kb = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const toast = (t, i) => { try { UI.toast(t, i || '💻'); } catch (e) { } };
  const M = { list: null, dir: '', writable: true, err: '', loading: false, open: {} };
  const KEYN = { stale: '⚠️ ก่อนถูกทับด้วยเซฟที่เก่ากว่า', deleted: '🗑️ ก่อนลบเซฟ' };
  const keyName = k => KEYN[k] || (/^d\d{8}$/.test(k) ? `📅 สำรองรายวัน ${+k.slice(7, 9)}/${+k.slice(5, 7)}/${+k.slice(1, 5) + 543}` : `🕓 สำรองอัตโนมัติ #${k}`);

  // ---- status pill ----
  const pill = document.createElement('div');
  pill.id = 'lanPill209';
  pill.style.cssText = 'position:fixed;left:8px;bottom:calc(6px + env(safe-area-inset-bottom,0px));z-index:30;font:11px/1.2 Kanit,sans-serif;padding:3px 8px;border-radius:10px;background:rgba(0,0,0,.55);color:#cfe;display:none;cursor:pointer;user-select:none;-webkit-user-select:none';
  pill.onclick = () => UI.H.srvsave();
  document.body.appendChild(pill);
  const paint = () => {
    if (!Net.on) { pill.style.display = 'none'; return; }
    const l = Net.lan || {}; pill.style.display = G.started ? 'block' : 'none';
    if (l.err) { pill.textContent = '⚠️ เซฟลงเครื่องแม่ข่ายไม่สำเร็จ'; pill.style.background = 'rgba(160,30,30,.85)'; pill.style.color = '#fff'; }
    else if (l.at) { pill.textContent = '💻 ✓ ' + hms(l.at).slice(0, 5); pill.style.background = 'rgba(0,0,0,.55)'; pill.style.color = '#9f9'; pill.title = `เซฟล่าสุดลงเครื่องแม่ข่าย ${hms(l.at)} · ${l.file} · ${kb(l.bytes || 0)}`; }
    else { pill.textContent = '💻 รอเซฟ…'; pill.style.background = 'rgba(0,0,0,.55)'; pill.style.color = '#cfe'; }
  };
  Net.onLan = paint; setInterval(paint, 4000);

  // ---- the save button reports the real result ----
  { const _s = UI.H.save; if (_s) UI.H.save = function (d) {
    const r = _s.apply(this, arguments);
    if (Net.on) Net.saveNowLan().then(res => { if (res) toast(`💻 บันทึกลงเครื่องแม่ข่ายสำเร็จ · ${res.file || 'saves'} · ${kb(res.bytes || 0)} · ${hms(Date.now())}`, '✅'); else toast('⚠️ บันทึกในเบราว์เซอร์แล้ว แต่ยังส่งลงเครื่องแม่ข่ายไม่สำเร็จ' + (Net.lan && Net.lan.err ? ` (${Net.lan.err})` : '') + ' เกมจะลองใหม่อัตโนมัติ', '⚠️'); });
    return r;
  }; }

  // ---- reconnect when the server was off at start-up ----
  let probing = 0;
  setInterval(async () => {
    try {
      if (Net.on || Net.cloud || location.protocol === 'file:' || !G.started || probing) return; probing = 1;
      const p = await Promise.race([Net.api('ping'), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))]);
      if (p && p.ok && !p.cloud) { Net.on = true; try { Net.start(); } catch (e) { } toast('เชื่อมต่อเซิร์ฟเวอร์ได้แล้ว เซฟจะลงเครื่องแม่ข่ายต่อจากนี้', '✅'); Net.saveRemote(true); paint(); }
    } catch (e) { } finally { probing = 0; }
  }, 20000);
  // the browser holds a newer save than the server (offline for a while): send it
  setInterval(() => { try { if (Net.pushLocalNewer && Net.on && G.started) { Net.pushLocalNewer = false; Net.saveRemote(true); } } catch (e) { } }, 3000);

  // ---- window ----
  async function load() {
    M.loading = true; M.err = '';
    try { const r = await Net.api('saves'); M.list = r.saves || []; M.dir = r.dir || ''; M.writable = r.writable !== false; M.free = r.freeMB; }
    catch (e) { M.err = Net.on || location.protocol !== 'file:' ? 'ติดต่อเซิร์ฟเวอร์ไม่ได้ (เปิดเกมผ่าน start-game.bat ที่โน้ตบุ๊ก แล้วเข้าด้วย IP ของโน้ตบุ๊ก)' : 'ใช้ได้เมื่อเปิดเกมผ่านเซิร์ฟเวอร์'; M.list = null; }
    M.loading = false; if (UI.cur && /เซฟในเครื่องแม่ข่าย/.test(UI.cur.title)) UI.renderBody();
  }
  const curId = () => { try { return Net.id(); } catch (e) { return ''; } };
  const row = r => {
    const mine = r.id === curId();
    const head = r.bad ? `<b class="bad">⚠️ ไฟล์เสีย (อ่านไม่ได้)</b>` : r.deleted ? `<b>🗑️ เซฟที่ถูกลบจากเกม</b>` : `<b>${E(r.name || 'ชาวไร่')}${r.farm ? ' · ' + E(r.farm) : ''}</b> · เลเวล ${r.lvl} · วันที่ ${r.day}`;
    const when = r.t ? dt(r.t * 1000) : '';
    const bks = r.backups || [], op = M.open[r.id];
    return `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${head}${mine ? ' <span class="good">◀ เซฟที่กำลังเล่น</span>' : ''}</h4>
      <p class="dim">${E(r.id)} · ${r.pid ? 'ช่อง ' + r.slot + ' · ' : ''}บันทึกล่าสุด ${when} · ${kb(r.bytes || 0)} · สำรอง ${bks.length} ชุด</p>
      <div class="row">${r.bad || r.deleted ? '' : `<button class="btn" data-a="srvload" data-v="${E(r.id)}">⬇️ โหลดมาเล่น (ลงช่อง ${r.slot})</button><button class="btn ghost" data-a="srvdl" data-v="${E(r.id)}">📄 ดาวน์โหลดไฟล์</button>`}${bks.length ? `<button class="btn ghost" data-a="srvbk" data-v="${E(r.id)}">🕓 ${op ? 'ซ่อน' : 'ดู'}สำรอง (${bks.length})</button>` : ''}</div>
      ${op ? bks.map(b => `<div class="row" style="align-items:center;gap:6px"><small style="flex:1">${keyName(b.n)} · ${dt(b.t * 1000)} · ${kb(b.bytes)}</small><button class="btn ghost" style="padding:2px 8px" data-a="srvload" data-v="${E(r.id)}" data-k="${E(b.n)}">กู้คืน</button></div>`).join('') : ''}</div></div>`;
  };
  const html = () => {
    const l = Net.lan || {};
    const st = !Net.on ? '<span class="bad">⚠️ ยังไม่ได้ต่อกับเซิร์ฟเวอร์</span>' : l.err ? `<span class="bad">⚠️ ส่งไม่สำเร็จล่าสุด (${E(l.err)}) กำลังลองใหม่</span>` : l.at ? `<span class="good">✅ เซฟลงเครื่องแม่ข่ายล่าสุด ${hms(l.at)} (${kb(l.bytes || 0)})</span>` : 'ยังไม่ได้ส่งเซฟรอบนี้';
    let h = `<p class="lead">เซฟของเกมทุกเครื่อง (โน้ตบุ๊ก/ไอแพด) ถูกเก็บเป็นไฟล์ในโฟลเดอร์ <b>${E(M.dir || 'saves\\')}</b> ของโน้ตบุ๊กที่เปิดเซิร์ฟเวอร์ และสำรองอัตโนมัติ (5 ชุดล่าสุด · รายวัน 14 วัน · ก่อนถูกทับ/ลบ)</p><p class="dim">${st}</p>`;
    if (M.free >= 0 && M.free < 500) h += `<p class="bad">⚠️ พื้นที่ดิสก์ของโน้ตบุ๊กเหลือน้อย (${M.free} MB) เซฟอาจเขียนไม่สำเร็จ</p>`;
    if (!M.writable) h += '<p class="bad">⚠️ เซิร์ฟเวอร์เขียนโฟลเดอร์ saves ไม่ได้! ตรวจสิทธิ์โฟลเดอร์หรือพื้นที่ดิสก์</p>';
    h += `<div class="row"><button class="btn" data-a="srvnow" ${Net.on ? '' : 'disabled'}>💾 เซฟเกมนี้ลงเครื่องแม่ข่ายเดี๋ยวนี้</button><button class="btn ghost" data-a="srvrefresh">🔄 รีเฟรชรายการ</button></div>`;
    if (M.loading && !M.list) return h + '<p class="empty">กำลังโหลดรายการ...</p>';
    if (M.err) return h + `<p class="bad">${E(M.err)}</p>`;
    if (!M.list || !M.list.length) return h + '<p class="empty">ยังไม่มีเซฟในเครื่องแม่ข่าย</p>';
    return h + '<p class="dim">เลือก “โหลดมาเล่น” เพื่อดึงเซฟกลับมา (เซฟที่เล่นอยู่ถูกเก็บสำรองไว้ก่อนเสมอ)</p>' + M.list.map(row).join('');
  };
  UI.H.srvsave = () => { UI.open('💻 เซฟในเครื่องแม่ข่าย', null, html); load(); };
  UI.H.srvrefresh = () => { load(); };
  UI.H.srvbk = d => { M.open[d.v] = !M.open[d.v]; };
  UI.H.srvnow = async () => { const r = await Net.saveNowLan(); if (r) toast(`💻 บันทึกลงเครื่องแม่ข่ายสำเร็จ · ${r.file} · ${kb(r.bytes || 0)}`, '✅'); else toast('⚠️ ส่งลงเครื่องแม่ข่ายไม่สำเร็จ' + (Net.lan && Net.lan.err ? ` (${Net.lan.err})` : ''), '⚠️'); load(); };
  const fetchSave = async (id, key) => { const r = await Net.api(key ? `backup?id=${encodeURIComponent(id)}&n=${encodeURIComponent(key)}` : `save?id=${encodeURIComponent(id)}`); return r && r.save; };
  UI.H.srvdl = async d => {
    try {
      const s = await fetchSave(d.v); if (!s) { toast('ไม่พบไฟล์เซฟ', '⚠️'); return; }
      const text = JSON.stringify({ raisukjai_backup: 1, slot: 1, time: new Date().toISOString(), save: s }), a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = `raisukjai-${d.v}-${Date.now()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast('ดาวน์โหลดไฟล์เซฟแล้ว', '📄');
    } catch (e) { toast('ดาวน์โหลดไม่สำเร็จ', '⚠️'); }
  };
  UI.H.srvload = async d => {
    let s; try { s = await fetchSave(d.v, d.k); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || typeof s.day !== 'number') { toast('อ่านเซฟนี้ไม่ได้', '⚠️'); return; }
    const m = /^(.*?)(?:_s([23]))?$/.exec(d.v), pid = m[1], slot = +(m[2] || 1), same = d.v === curId();
    const info = `${s.name || 'ชาวไร่'} · เลเวล ${s.lvl || 1} · วันที่ ${s.day}${d.k ? ' · ' + keyName(d.k) : ''}`;
    UI.confirm(`โหลดเซฟนี้ลงช่อง ${slot}?`, `${info} — จะทับเซฟช่อง ${slot} ในเบราว์เซอร์นี้ ${same ? '' : '(และเครื่องนี้จะใช้ไฟล์เซฟชุดนี้ต่อ) '}เซฟเดิมถูกเก็บสำรองไว้ก่อน แล้วเกมจะโหลดใหม่`, 'โหลดเซฟ', async () => {
      Slots.deleting = slot;                                   // nothing may write the slot between now and the reload
      try {
        s.savedAt = Date.now();
        safeSet('raisukjai3d_pid', pid); safeSet('raisukjai3d_slot', String(slot));
        const id = pid + (slot > 1 ? '_s' + slot : '');
        const r = await Net.api('save', { id, save: s, ts: s.savedAt, force: 1 });   // the server keeps the file it replaces as a backup
        if (!r || r.ok === false) throw new Error((r && r.error) || 'server');
        const old = safeGet(Slots.key(slot)); if (old && old.length > 100) safeSet(Slots.key(slot) + '_bak', old);
        if (!safeSet(Slots.key(slot), JSON.stringify(s))) throw new Error('browser storage full');
        toast('โหลดเซฟสำเร็จ กำลังเริ่มเกมใหม่...', '✅'); setTimeout(() => location.reload(), 800);
      } catch (e) { Slots.deleting = 0; toast('โหลดเซฟไม่สำเร็จ: ' + (e && e.message || e), '⚠️'); }
    });
  };
  // entry points: the slot window and the start screen
  { const _sl = UI.H.slots; if (_sl) UI.H.slots = function () { _sl.apply(this, arguments); try { const c = UI.cur, r = c && c.render; if (r && !c.srv209) { c.srv209 = 1; c.render = function () { return r.apply(this, arguments) + `<h5>เซฟในเครื่องแม่ข่าย (โน้ตบุ๊ก)</h5><p class="dim">ดูไฟล์เซฟทุกชุดที่อยู่ในโน้ตบุ๊ก พร้อมสำรอง และดึงกลับมาเล่นได้ทุกเมื่อ</p><div class="row"><button class="btn" data-a="srvsave">💻 เซฟในเครื่องแม่ข่าย / กู้คืน</button></div>`; }; UI.renderBody(); } } catch (e) { } }; }
  if (Slots.initStart) { const _is = Slots.initStart.bind(Slots); Slots.initStart = function () { _is(); try { const row = document.getElementById('slotfile196'); if (!row || document.getElementById('sfSrv209')) return; const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'sfSrv209'; b.style.cssText = 'min-height:0;padding:6px 12px;font-size:13px'; b.textContent = '💻 เซฟในเครื่องแม่ข่าย'; b.onclick = () => UI.H.srvsave(); row.appendChild(b); } catch (e) { console.warn('v209 start', e); } }; }
  window.ServerSave209 = { load, M, paint };
  paint();
});
