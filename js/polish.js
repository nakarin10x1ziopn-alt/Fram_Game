'use strict';
// ---------- Set F: save slots, key rebinding, gamepad, ultra graphics, step-by-step tutorial ----------
const Slots = {
  cur() { return +(safeGet('raisukjai3d_slot') || 1); },
  key(n = this.cur()) { return n === 1 ? SAVE_KEY : SAVE_KEY + '_s' + n; },
  info(n) { try { const s = JSON.parse(safeGet(this.key(n)) || 'null'); return s ? `${s.name || 'ชาวไร่'} · ${(() => { try { const st0 = s.v36 && s.v36.cal && s.v36.cal.start; if (typeof st0 === 'number' && typeof Cal36 !== 'undefined') { const t = new Date((st0 + s.day - 1) * 86400000); return t.getUTCDate() + ' ' + Cal36.MONS[t.getUTCMonth()] + ' ' + (t.getUTCFullYear() + 543); } } catch (e) { } return RD(s.day); })()} · ${U.fmt(s.money)} ฿ · Lv.${s.lvl || 1}` : 'ว่าง'; } catch (e) { return 'ว่าง'; } },
  has(n) { try { const r = safeGet(this.key(n)); return !!(r && r.length > 100); } catch (e) { return false; } },
  html() { return [1, 2, 3].map(n => `<div class="slotwrap"><button class="btn ${n === this.cur() ? '' : 'ghost'} slotbtn" data-slot="${n}">💾 ช่อง ${n}<br><small>${esc(this.info(n))}</small></button>${this.has(n) ? `<button class="btn ghost slotdel" data-del="${n}" title="ลบเซฟช่อง ${n}">🗑️ ลบเซฟ</button>` : ''}</div>`).join(''); },
  // delete a save for good: this browser's copy, its automatic backup, and the copy kept on the server. Nothing may write the slot again while it goes
  ask(n) {
    if (!this.has(n) && !(n === this.cur() && G.started)) return;
    UI.confirm(`ลบเซฟช่อง ${n}?`, `${this.info(n)} — ลบแล้วกู้คืนไม่ได้ ความคืบหน้าทั้งหมดของช่องนี้จะหายถาวร`, 'ลบเซฟถาวร', () => this.remove(n));
  },
  remove(n) {
    const cur = n === this.cur();
    this.deleting = n;
    safeDel(this.key(n)); safeDel(this.key(n) + '_bak');
    const pid = safeGet('raisukjai3d_pid'), id = Net.cloud ? Net.cloudId(n) : (pid ? pid + (n > 1 ? '_s' + n : '') : null);
    const done = () => { if (cur) { location.reload(); return; } this.deleting = 0; { const box = document.getElementById('slots'); if (box) box.innerHTML = this.html(); UI.toast(`ลบเซฟช่อง ${n} แล้ว`, '🗑️'); if (UI.cur && UI.cur.render) UI.renderBody(); } };
    if ((Net.on || Net.cloud) && id) { const t = setTimeout(done, 2500); Net.api('save', { id, save: null }).catch(() => {}).finally(() => { clearTimeout(t); done(); }); } else done();
  },
  use(n) { if (G.started && S) saveGame(true); const go = () => { safeSet('raisukjai3d_slot', String(n)); location.reload(); }; G.started && S ? Net.flush(go) : go(); },
  initStart() {
    const box = document.createElement('div'); box.id = 'slots'; box.innerHTML = this.html();
    const play = document.getElementById('btnPlay'); play.parentNode.insertBefore(box, play);
    box.addEventListener('click', e => { const d = e.target.closest('[data-del]'); if (d) { this.ask(+d.dataset.del); return; } const b = e.target.closest('[data-slot]'); if (b && +b.dataset.slot !== this.cur()) this.use(+b.dataset.slot); });
  },
};
function saveKey() { return Slots.key(); }
function safeDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
// while a slot is being deleted nothing (autosave, page-hide save, slot switch) may write it back
{ const _sg = saveGame; saveGame = function () { if (Slots.deleting) return; return _sg.apply(this, arguments); }; }
if (typeof Net !== 'undefined') { const _sr = Net.saveRemote.bind(Net); Net.saveRemote = function () { if (Slots.deleting) return; return _sr.apply(this, arguments); }; }

const KeyMap = {
  ACTIONS: [['action', 'ทำสิ่งที่แสดง', 'KeyE'], ['car', 'ขึ้น/ลงรถ', 'KeyF'], ['horn', 'บีบแตร', 'KeyG'], ['phone', 'มือถือ', 'KeyP'], ['inv', 'กระเป๋า', 'KeyI'], ['map', 'แผนที่', 'KeyM'], ['book', 'สมุดสะสม', 'KeyB'], ['decor', 'แต่งบ้าน', 'KeyH']],
  binds: (() => { try { return JSON.parse(safeGet('raisukjai3d_keys') || '{}'); } catch (e) { return {}; } })(),
  bind(a) { return this.binds[a] || this.ACTIONS.find(x => x[0] === a)[2]; },
  // turn the pressed key into the default code the game listens for
  tr(code) {
    for (const [a, , def] of this.ACTIONS) if (this.bind(a) === code) return def;
    if (this.ACTIONS.some(([a, , def]) => def === code && this.bind(a) !== def)) return '';
    return code;
  },
  ui() {
    UI.open('ตั้งค่าปุ่มคีย์บอร์ด & จอยเกม', null, () => `<p class="lead">กด "เปลี่ยน" แล้วกดปุ่มที่ต้องการบนคีย์บอร์ด · จอยเกม: สติ๊กซ้ายเดิน สติ๊กขวาหมุนกล้อง A=ทำงาน B=ขึ้นลงรถ X=มือถือ Y=กระเป๋า RT=วิ่ง/เร่ง Start=เมนู</p>
      <div class="grid">${this.ACTIONS.map(([a, n]) => `<div class="card"><div class="ci">⌨️</div><div class="cb"><h4>${n}</h4><p>${this.waiting === a ? '⏳ กดปุ่มใหม่...' : '<kbd>' + this.bind(a).replace(/^Key|^Digit/, '') + '</kbd>'}</p><div class="row"><button class="btn ghost" data-a="rebind" data-k="${a}">เปลี่ยน</button></div></div></div>`).join('')}</div>
      <div class="row end"><button class="btn ghost" data-a="keyreset">คืนค่าเริ่มต้น</button></div>`);
  },
  listen(a) {
    // one listener at a time: a second click replaces the first instead of stacking
    if (this.h) removeEventListener('keydown', this.h, true);
    this.waiting = a; UI.renderBody();
    const h = this.h = e => { e.preventDefault(); e.stopPropagation(); removeEventListener('keydown', h, true); if (e.code !== 'Escape') { this.binds[a] = e.code; safeSet('raisukjai3d_keys', JSON.stringify(this.binds)); } this.waiting = null; UI.renderBody(); };
    addEventListener('keydown', h, true);
  },
};

const Pad = {
  x: 0, y: 0, prev: [],
  poll(dt) {
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g) : null;
    if (!gp) { this.x = this.y = 0; return; }
    const dz = v => Math.abs(v) < 0.15 ? 0 : v;
    this.x = dz(gp.axes[0]); this.y = -dz(gp.axes[1]);
    G.cam.yaw -= dz(gp.axes[2] || 0) * dt * 2.6; G.cam.pitch = U.clamp(G.cam.pitch + dz(gp.axes[3] || 0) * dt * 1.6, 0.1, 1.35);
    const b = gp.buttons.map(x => x.pressed), was = this.prev, hit = i => b[i] && !was[i];
    Input.sprint = !!b[7];
    if (G.started && !UI.isOpen()) {
      if (hit(0)) doAction(); if (hit(1)) toggleCar(); if (hit(2)) Phone.open(); if (hit(3)) UI.inventory(); if (hit(9)) UI.menu();
    } else if (UI.isOpen() && (hit(1) || hit(9))) UI.close();
    if (G.driving && hit(0)) honk();
    if (!was.length && b.some(Boolean)) UI.toast('เชื่อมต่อจอยเกมแล้ว', '🎮');
    this.prev = b;
  },
};

const Tutorial = {
  steps: [
    { t: 'เดินไปที่แปลงผักหน้าบ้าน', at: () => plotCenter(0), done: () => Math.hypot(G.player.pos.x - plotCenter(0).x, G.player.pos.z - plotCenter(0).z) < 3 },
    { t: 'เลือกเมล็ดในแถบล่าง แล้วกดปุ่มกลมเพื่อปลูก', at: () => plotCenter(0), done: b => S.stats.planted > b.planted },
    { t: 'เลือกบัวรดน้ำ แล้วรดน้ำแปลงที่ปลูก', at: () => plotCenter(0), done: b => S.stats.watered > b.watered },
    { t: 'เปิดมือถือ (ปุ่ม 📱 มุมขวาบน หรือกด P)', done: () => Tutorial.phoned },
    { t: 'ไปที่กล่องส่งขายหน้าบ้าน', at: () => { const p = World.pois.find(x => x.kind === 'bin'); return p || { x: 0, z: 0 }; }, done: () => { const p = World.pois.find(x => x.kind === 'bin'); return p && Math.hypot(G.player.pos.x - p.x, G.player.pos.z - p.z) < 3; } },
    { t: 'เดินไปหมู่บ้าน (ตามถนน) แล้วคุยกับชาวบ้าน 1 คน', at: () => ({ x: -10, z: -230 }), done: () => Object.keys(S.daily.talk || {}).length > 0 },
    { t: 'ดูภารกิจรายสัปดาห์ในมือถือ (แอป 🎯 ภารกิจ)', done: () => Phone.app === 'missions' },
  ],
  start(force) {
    if (!force && (S.tut === 'done' || S.stats.harvest > 3)) { S.tut = 'done'; return; }
    S.tut = 0; this.base = Object.assign({}, S.stats);
    if (!this.el) { const el = document.createElement('div'); el.id = 'tut'; el.innerHTML = '<span id="tutTxt"></span><button class="btn ghost" id="tutSkip">ข้าม</button>'; document.body.appendChild(el); this.el = el; el.querySelector('#tutSkip').onclick = () => this.end(true); }
    this.el.hidden = false; this.show();
  },
  show() {
    const st = this.steps[S.tut]; document.getElementById('tutTxt').textContent = `สอนเล่น ${S.tut + 1}/${this.steps.length}: ${st.t}`;
    if (!this.mk) { this.mk = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0x7cf0a0, toneMapped: false })); this.mk.rotation.x = Math.PI; G.scene.add(this.mk); }
    this.mk.visible = !!st.at;
  },
  update(dt) {
    if (S.tut == null || S.tut === 'done' || !this.el) return;
    const st = this.steps[S.tut];
    if (st.at && this.mk) { const p = st.at(); this.mk.position.set(p.x, World.groundY(p.x, p.z) + 2.6 + Math.sin(G.t * 4) * 0.2, p.z); this.mk.rotation.y += dt * 2; this.mk.visible = !G.inside; }
    if (st.done(this.base)) { Sfx.tone(880, 0.15, 'sine', 0.06, 1320); S.tut++; this.base = Object.assign({}, S.stats); if (S.tut >= this.steps.length) this.end(); else this.show(); }
  },
  end(skip) { S.tut = 'done'; if (this.el) this.el.hidden = true; if (this.mk) this.mk.visible = false; if (!skip && !S.tutPaid) { S.tutPaid = 1; earn(500); UI.toast('จบการสอนเล่นแล้ว! รับเงินรางวัล 500 ฿ ขอให้สนุกกับไร่สุขใจ', '🎓'); } },
};
UI.H.rebind = d => KeyMap.listen(d.k);
UI.H.keyreset = () => { KeyMap.binds = {}; safeSet('raisukjai3d_keys', '{}'); };
UI.H.keys = () => KeyMap.ui();
UI.H.slots = () => UI.open('ช่องบันทึกเกม', null, () => `<p class="lead">เล่นได้ 3 เซฟแยกกัน กดช่องอื่นเพื่อบันทึกเกมนี้แล้วสลับไป</p><div class="menu">${[1, 2, 3].map(n => `<div class="row"><button class="btn ${n === Slots.cur() ? '' : 'ghost'}" data-a="slotuse" data-v="${n}">💾 ช่อง ${n}${n === Slots.cur() ? ' (กำลังเล่น)' : ''} — ${esc(Slots.info(n))}</button><button class="btn ghost danger" data-a="slotdel" data-v="${n}">🗑️ ลบ</button></div>`).join('')}</div>`);
UI.H.slotdel = d => Slots.ask(+d.v);
UI.H.slotuse = d => { if (+d.v !== Slots.cur()) Slots.use(+d.v); };
UI.H.tutor = () => { UI.close(); Tutorial.start(true); };
