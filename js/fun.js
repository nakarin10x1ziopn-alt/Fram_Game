'use strict';
// ---------- Feel & polish: juicy feedback (floating numbers, item pops, level-up fireworks), daily goals with streaks and
// gift boxes, livelier villagers (greetings, small requests, daily rumours), a cooking timing minigame, ghost rivals and
// turbo in the time trial, a photo mode with filters and an album, step-by-step hints with a guide arrow, a tidier HUD,
// and visual touches (wet roads and puddles, sunbeams indoors, falling leaves, brake lights, mood bubbles) ----------

// ===== 6. juice =====
const Juice = {
  init() {
    const css = document.createElement('style');
    css.textContent = `.flt{position:fixed;z-index:30;pointer-events:none;font:700 18px Mitr,Kanit,sans-serif;text-shadow:0 2px 6px rgba(0,0,0,.6);animation:fltUp 1.3s ease-out forwards}.flt.gain{color:#ffe066}.flt.loss{color:#ff8a80}.flt.item{font-size:26px}@keyframes fltUp{0%{opacity:0;transform:translate(-50%,6px) scale(.7)}15%{opacity:1;transform:translate(-50%,-6px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-60px) scale(1)}}
#money.bump{animation:bump .35s}@keyframes bump{50%{transform:scale(1.18);filter:brightness(1.4)}}
#dailyCard{position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(120px + env(safe-area-inset-bottom,0px));z-index:5;width:min(230px,46vw);padding:8px 10px;font-size:12.5px;border-radius:14px;pointer-events:auto;cursor:pointer}
#dailyCard b{color:#ffe08a}#dailyCard .dq{display:flex;justify-content:space-between;gap:6px;margin-top:3px}#dailyCard .dq.done{color:#9be37a;text-decoration:line-through}
#hudToggle{position:fixed;left:calc(min(250px,46vw) + 16px + env(safe-area-inset-left,0px));top:calc(10px + env(safe-area-inset-top,0px));z-index:7;width:26px;height:26px;border-radius:50%;font-size:12px;padding:0;opacity:.75}
body.hud-min #hudTL > :not(#stats){display:none} body.hud-min #dailyCard{display:none}
#dock{position:fixed;right:calc(10px + env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);z-index:5;display:flex;flex-direction:column;gap:6px}
#dock button{width:42px;height:42px;border-radius:12px;font-size:20px;padding:0}
body.photo .hud,body.photo #prompt,body.photo #dailyCard,body.photo #dock,body.photo #hudToggle,body.photo #tut,body.photo #toasts,body.photo #fps{display:none!important}
#photoBar{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:31;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:94vw}
#guideArrow{position:fixed;z-index:6;pointer-events:none;font-size:34px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6));transition:opacity .3s}
@media (max-width:640px){#hudToggle{left:calc(196px + 14px)}#toasts .toast:nth-last-child(n+3){display:none}.toast{font-size:12.5px;padding:6px 10px}}
@media (orientation:portrait) and (max-width:700px){#hudTL{width:min(170px,44vw)}#hudToggle{left:calc(min(170px,44vw) + 14px)}#dailyCard{top:46%;bottom:auto;width:auto;max-width:44vw;font-size:11.5px}#dailyCard .dq{display:none}#dock{top:auto;bottom:calc(200px + env(safe-area-inset-bottom,0px))}#dock button{width:38px;height:38px}.mbox{max-height:90vh}}`;
    document.head.appendChild(css);
    // money floats next to the wallet; items pop above the action button
    const _earn = earn; earn = n => { _earn(n); if (!G.simulating && n > 0) this.float(`+${U.fmt(Math.round(n))} ฿`, 'gain', $('money')); };
    const _add = addItem; addItem = (id, n = 1) => { _add(id, n); if (!G.simulating && G.started && ITEMS[id] && !UI.isOpen()) this.float(`${ITEMS[id].i} +${n}`, 'item', $('bAct') || $('hotbar')); };
    const _pa = Prog.add.bind(Prog); Prog.add = n => { const l = S.lvl; const r = _pa(n); if (S.lvl > l && !G.simulating) this.party('เลเวลอัป Lv.' + S.lvl); return r; };
    const _pr = Career.promote.bind(Career); Career.promote = () => { _pr(); if (!G.simulating) this.party('เลื่อนตำแหน่ง!'); };
  },
  last: 0,
  float(text, cls, anchor) {
    const now = performance.now(); if (now - this.last < 90) return; this.last = now;
    const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const el = document.createElement('div'); el.className = 'flt ' + cls; el.textContent = text; el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = (r.top - 4) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1300);
    if (cls === 'gain') { const m = $('money'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }
  },
  party(t) { UI.toast(`🎉 ${t}`, '⭐'); Sfx.tone(523, 0.12, 'square', 0.05); Sfx.tone(659, 0.12, 'square', 0.05, null, 0.12); Sfx.tone(784, 0.3, 'square', 0.05, null, 0.24); const p = G.player.pos; for (let i = 0; i < 3; i++) setTimeout(() => Fest2.rocket(p.x, p.z), i * 250); },
};

// ===== 7. daily goals, streaks and gift boxes =====
const DAILY_POOL = [
  ['harvest', 'เก็บเกี่ยวผลผลิต', '🧺', () => 8 + S.lvl], ['sold', 'ขายของ', '💰', () => 10 + S.lvl], ['planted', 'ปลูกผัก', '🌱', () => 6], ['watered', 'รดน้ำ', '💧', () => 6],
  ['cooked', 'ทำอาหาร', '🍳', () => 1], ['fish', 'ตกปลา', '🎣', () => 2], ['fed', 'ให้อาหารสัตว์', '🐔', () => 1], ['talk', 'คุยกับชาวบ้าน', '💬', () => 3],
];
const GIFT_LOOT = [['seed_' + 'tomato', 6], ['fert', 4], ['feed', 6], ['teddy', 1], ['cake', 2], ['n95', 2]];
const Daily = {
  st() { const d = S.dq; if (!d || d.day !== S.day) { const pick = DAILY_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 3); S.dq = { day: S.day, base: { ...S.stats, talk: Object.keys(S.daily.talk || {}).length }, list: pick.map(([k, n, i, g]) => ({ k, n, i, goal: g() })), done: false, streak: d && d.done && d.day === S.day - 1 ? (d.streak || 0) : 0, boxes: (d && d.boxes) || 0 }; } return S.dq; },
  prog(q) { const d = this.st(), cur = q.k === 'talk' ? Object.keys(S.daily.talk || {}).length : (S.stats[q.k] || 0); return Math.min(q.goal, cur - (d.base[q.k] || 0)); },
  check() {
    const d = this.st(); if (d.done) return;
    if (d.list.every(q => this.prog(q) >= q.goal)) { d.done = true; d.streak = (d.streak || 0) + 1; d.boxes++; const v = 500 + d.streak * 150; earn(v); Prog.add(30); Juice.party(`ภารกิจประจำวันครบ! ต่อเนื่อง ${d.streak} วัน`); if (d.streak % 7 === 0) { d.boxes += 2; UI.toast('ทำครบ 7 วันติด ได้กล่องของขวัญพิเศษ 2 กล่อง!', '🎁'); } }
  },
  open() {
    const d = this.st(); if (!d.boxes) return; d.boxes--;
    const r = Math.random(); let txt;
    if (r < 0.12) { const decor = Object.keys(FURN).filter(k => FURN[k].decor && !S.furn[k]); const k = decor.length ? U.pick(decor) : null; if (k) { S.furn[k] = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; txt = `ของแต่งบ้านหายาก: ${FURN[k].n}`; } }
    if (!txt && r < 0.3) { const v = 1000 + (Math.random() * 4000 | 0); earn(v); txt = `เงินรางวัล ${baht(v)}`; }
    if (!txt) { const [id, n] = U.pick(GIFT_LOOT); if (ITEMS[id]) { addItem(id, n); txt = `${ITEMS[id].n} ×${n}`; } else { earn(800); txt = 'เงินรางวัล 800 ฿'; } }
    Sfx.coin(); UI.toast('🎁 เปิดกล่อง: ' + txt, '🎁'); const p = G.player.pos; Fest2.rocket(p.x, p.z);
  },
  card() {
    let el = $('dailyCard'); if (!el) { el = document.createElement('div'); el.id = 'dailyCard'; el.className = 'panel'; document.body.appendChild(el); el.onclick = () => this.ui(); }
    const d = this.st(); el.innerHTML = `<b>🎯 ภารกิจวันนี้</b> ${d.streak ? `🔥${d.streak}` : ''}${d.boxes ? ` · 🎁×${d.boxes}` : ''}${d.list.map(q => { const p = this.prog(q); return `<div class="dq ${p >= q.goal ? 'done' : ''}"><span>${q.i} ${q.n}</span><span>${p}/${q.goal}</span></div>`; }).join('')}`;
    el.hidden = !G.started || G.inside && G.inRoom;
  },
  ui() { const d = this.st(); UI.open('ภารกิจประจำวัน', null, () => `<p class="lead">ทำครบ 3 อย่างได้เงิน + กล่องของขวัญ · ทำต่อเนื่องได้รางวัลมากขึ้น (ต่อเนื่อง ${d.streak || 0} วัน)</p><div class="grid">${d.list.map(q => { const p = this.prog(q); return `<div class="card"><div class="ci">${q.i}</div><div class="cb"><h4>${q.n}</h4><div class="prog"><i style="width:${p / q.goal * 100}%"></i></div><p class="dim">${p}/${q.goal}</p></div></div>`; }).join('')}</div><div class="row"><button class="btn" data-a="giftopen" ${d.boxes ? '' : 'disabled'}>🎁 เปิดกล่องของขวัญ (${d.boxes})</button></div>`); },
};

// ===== 8. livelier villagers =====
const RUMOURS = ['ได้ยินว่าเฮียหมงกำลังจะเปิดร้านสาขาใหม่', 'ช่วงนี้ผักราคาดีที่ตลาดริมทะเลนะ', 'มีคนเห็นแสงประหลาดในเหมืองชั้นลึก', 'ป้าบัวคำว่าปีนี้ฝนจะมาเร็ว', 'ครูฝึกเอกชมว่าคุณขับรถเก่ง', 'ว่ากันว่ามีสมบัติฝังอยู่แถวดอยสุขใจ', 'โรงเรียนกำลังหาอาสาสมัครสอนหนังสือ', 'ร้านไอทีลดราคาการ์ดจอสุดสัปดาห์นี้'];
const Villagers = {
  bubble: null,
  update(dt) {
    this.t = (this.t || 0) - dt; if (this.t > 0 || G.inside || !G.started) return; this.t = 0.6;
    const p = G.player.pos; let near = null, bd = 6;
    for (const n of G.npcs) { if (n.away || !n.obj.visible) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; near = n; } }
    if (!this.spr) { this.spr = U.sprite('👋', 0.7, false); this.spr.visible = false; G.scene.add(this.spr); }
    if (near && near !== this.lastNear) { this.lastNear = near; const f = Friends.get(near.name), req = (S.req || {})[near.name]; const e = req && (req.until || req.day) >= S.day ? '❗' : f >= 6 ? '😊' : f >= 3 ? '👋' : '🙂'; this.spr.material.map = U.emojiTex(e); this.spr.material.needsUpdate = true; this.spr.visible = true; this.spr.userData.n = near; if (f >= 3 && Math.random() < 0.4 && !req) Sfx.tone(880, 0.06, 'sine', 0.02); }
    if (!near) { this.spr.visible = false; this.lastNear = null; }
    if (this.spr.visible) { const n = this.spr.userData.n; this.spr.position.set(n.x, World.groundY(n.x, n.z) + 2.5, n.z); }
  },
  // one small request from a random villager, only every 4-7 days now, and it stays open for 3 days
  day() {
    if (S.reqNext == null || (!S.reqSlow && S.reqNext - S.day < 12)) { S.reqSlow = 1; S.reqNext = S.day + 25 + (Math.random() * 20 | 0); }   // v1.1: requests are rare now
    if (S.reqNext <= S.day) {
      let L = G.npcs.filter(n => !n.staff && !n.fixed && S.friends[n.name] != null); if (!L.length) L = G.npcs.filter(n => !n.staff && !n.fixed && !n.townRes && n.home);
      if (L.length) {
        const n = U.pick(L), crops = Object.keys(CROPS).filter(k => !CROPS[k].tree && (SEED_LVL[k] || 1) <= S.lvl), c = U.pick(crops), q = 2 + (Math.random() * 4 | 0);
        S.req = { [n.name]: { day: S.day, until: S.day + 2, item: c, n: q } }; S.reqNext = S.day + 28 + (Math.random() * 28 | 0);
        Phone.msg(n.name, `ช่วยหน่อยได้ไหม อยากได้${CROPS[c].n} ${q} ชิ้น เอามาให้ที่หมู่บ้านภายใน 3 วันนะ (ตอบแทนอย่างงาม)`, false);
      }
    }
    if (Math.random() < 0.3) RL.log('🗣️ ข่าวลือ: ' + U.pick(RUMOURS));
  },
  init() {
    G.targetHooks.push((consider, p) => { const R = S.req || {}; for (const name in R) { const r = R[name]; if ((r.until || r.day) < S.day) continue; const n = G.npcs.find(x => x.name === name && !x.away); if (!n) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < 2.4) consider({ kind: 'ext', act: () => ({ icon: '❗', label: `ส่ง${CROPS[r.item].n} ${r.n} ชิ้นให้${name} (มี ${countBase(r.item)})`, fn: () => { if (countBase(r.item) < r.n) { UI.toast('ของยังไม่พอ', '📦'); return; } takeBase(r.item, r.n); const v = Math.round(priceOf(r.item) * r.n * 2); earn(v); Friends.add(name, 1); delete S.req[name]; UI.toast(`${name}ขอบคุณมาก! ได้ ${baht(v)} และความสนิท +1`, '💝'); } }) }, d - 0.6); } });
  },
};

// ===== 9. cooking minigame =====
const Cook = {
  start(id) {
    const R = RECIPES[id]; for (const k in R.need) if (countBase(k) < R.need[k]) return;
    this.g = { id, step: 0, hits: [], pos: 0, dir: 1, speed: 1.1 };
    UI.open(`ทำ${R.n}`, null, () => { const g = this.g; if (!g) return ''; return `<p class="lead">${['หั่นวัตถุดิบ 🔪', 'ผัด/ต้มให้ได้ที่ 🔥', 'ปรุงรสและจัดจาน 🧂'][g.step] || 'เสร็จแล้ว!'} — กด <b>หยุด</b> ตอนเข็มอยู่ในโซนสีเขียว (${g.step + 1}/3)</p><div style="position:relative;height:34px;border-radius:17px;background:linear-gradient(90deg,#c62828,#f9a825 30%,#43a047 42%,#43a047 58%,#f9a825 70%,#c62828);margin:10px 0"><div id="ckNeedle" style="position:absolute;top:-4px;width:6px;height:42px;border-radius:3px;background:#fff;box-shadow:0 0 10px #fff;left:${g.pos * 100}%"></div></div><div class="row"><button class="btn big" data-a="ckhit">หยุด!</button></div><p class="dim">${g.hits.map(h => h > 0.85 ? '🌟 สมบูรณ์แบบ' : h > 0.6 ? '👍 ดี' : '😅 พอใช้').join(' · ')}</p>`; });
    UI.cur.onClose = () => { this.g = null; };
  },
  update(dt) { const g = this.g; if (!g || g.step > 2) return; g.pos += g.dir * dt * g.speed; if (g.pos > 1) { g.pos = 1; g.dir = -1; } if (g.pos < 0) { g.pos = 0; g.dir = 1; } const n = $('ckNeedle'); if (n) n.style.left = (g.pos * 100) + '%'; },
  hit() {
    const g = this.g; if (!g) return; const acc = 1 - Math.min(1, Math.abs(g.pos - 0.5) / 0.5); g.hits.push(acc); g.step++; g.speed += 0.35; Sfx.tone(acc > 0.85 ? 880 : 520, 0.1, 'triangle', 0.05);
    if (g.step >= 3) {
      const R = RECIPES[g.id], q = g.hits.reduce((s, x) => s + x, 0) / 3; for (const k in R.need) takeBase(k, R.need[k]);
      const extra = q > 0.85 ? 1 : 0; addItem('dish_' + g.id, 1 + extra); S.stats.cooked++; Prog.add(10 + Math.round(q * 10)); this.g = null; UI.close(); playAct('fill', 1.0);
      UI.toast(q > 0.85 ? `ฝีมือระดับเชฟ! ได้${R.n} 2 จาน` : q > 0.6 ? `ทำ${R.n}อร่อยมาก` : `ทำ${R.n}เสร็จ (รสชาติพอใช้)`, R.i); return;
    }
    UI.renderBody();
  },
};
UI.H.ckhit = () => Cook.hit();
UI.H.cook = d => Cook.start(d.id);

// ===== 10. time trial: ghost rivals and turbo =====
const RaceFX = {
  update(dt) {
    const r = Contests.race;
    if (!r) { if (this.ghosts) { for (const g of this.ghosts) World.dyn.remove(g.m.g); this.ghosts = null; } this.boost = 0; return; }
    if (r.st === 'go' && !this.ghosts) {
      const path = [[RACE_START.x, RACE_START.z]].concat(RACE_CP), segs = []; let L = 0; for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(l); L += l; }
      this.ghosts = RIVAL_TIMES.slice(0, 2).map(([who, t], i) => { const m = Models.car(i ? 'sedan' : 'sports'); m.g.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; o.material.depthWrite = false; } }); World.dyn.add(m.g); return { m, who, v: L / t, s: 0, path, segs }; });
    }
    for (const g of this.ghosts || []) {
      g.s += g.v * dt; let s = g.s, i = 0; while (i < g.segs.length && s > g.segs[i]) { s -= g.segs[i]; i++; } if (i >= g.segs.length) { g.m.g.visible = false; continue; }
      // side by side across the road (perpendicular to it), turning smoothly at the checkpoints
      const a = g.path[i], b = g.path[i + 1], k = s / g.segs[i], ux = (b[0] - a[0]) / g.segs[i], uz = (b[1] - a[1]) / g.segs[i], off = g === this.ghosts[0] ? -2.2 : 2.2;
      const x = U.lerp(a[0], b[0], k) + uz * off, z = U.lerp(a[1], b[1], k) - ux * off, hd = Math.atan2(ux, uz);
      g.h = g.h == null ? hd : U.angLerp(g.h, hd, Math.min(1, dt * 3));
      g.m.g.position.set(x, World.groundY(x, z), z); g.m.g.rotation.y = g.h; for (const w of g.m.wheels) w.rotation.x += g.v * dt / g.m.r;
    }
    this.cd = Math.max(0, (this.cd || 0) - dt); this.boost = Math.max(0, (this.boost || 0) - dt);
    if (Contests.hud && !Contests.hud.hidden && r.st === 'go') Contests.hud.dataset.extra = this.cd ? ` · เทอร์โบชาร์จ ${Math.ceil(this.cd)} วิ` : ' · กด B เทอร์โบ!';
  },
  turbo() { if (!Contests.race || this.cd > 0) return; this.boost = 2.5; this.cd = 8; Sfx.burst(0.6, 400, 'bandpass', 0.3); UI.toast('เทอร์โบ!', '🚀'); },
  init() {
    const _spec = Garage.spec.bind(Garage); Garage.spec = d => { const s = _spec(d); if (this.boost > 0 && G.driving && G.driving.d === d) return Object.assign({}, s, { top: s.top * 1.3, acc: s.acc * 1.6 }); return s; };
    addEventListener('keydown', e => { if (e.code === 'KeyB' && G.driving) this.turbo(); });
  },
};

// ===== 11. photo mode =====
const Photo = {
  filters: { none: 'ปกติ', vivid: 'สดใส', warm: 'อบอุ่น', bw: 'ขาวดำ', film: 'ฟิล์ม', dream: 'ฝันหวาน' },
  css: { none: '', vivid: 'saturate(1.45) contrast(1.08)', warm: 'sepia(.25) saturate(1.2) brightness(1.04)', bw: 'grayscale(1) contrast(1.15)', film: 'sepia(.35) contrast(.95) brightness(1.05) saturate(.9)', dream: 'brightness(1.08) saturate(1.25) blur(.4px)' },
  on: false, f: 'none',
  toggle() {
    this.on = !this.on; document.body.classList.toggle('photo', this.on); UI.close(); const cv = $('c');
    if (this.on) { const bar = document.createElement('div'); bar.id = 'photoBar'; bar.innerHTML = Object.entries(this.filters).map(([k, n]) => `<button class="btn ghost" data-f="${k}">${n}</button>`).join('') + '<button class="btn" data-snap="1">📸 ถ่ายรูป</button><button class="btn ghost" data-alb="1">🖼️ อัลบั้ม</button><button class="btn danger" data-x="1">ออก</button>'; document.body.appendChild(bar);
      bar.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.f) { this.f = b.dataset.f; cv.style.filter = this.css[this.f]; } if (b.dataset.snap) this.snap(); if (b.dataset.alb) { this.toggle(); this.album(); } if (b.dataset.x) this.toggle(); }; G.paused = true; UI.toast('โหมดถ่ายรูป: ลากเมาส์หมุนกล้อง ล้อเมาส์ซูม', '📸'); }
    else { const b = $('photoBar'); if (b) b.remove(); cv.style.filter = ''; G.paused = false; }
  },
  snap() {
    Gfx.render(); const src = $('c'); if (!src.width || !src.height) { UI.toast('ถ่ายรูปไม่ได้ตอนหน้าต่างเกมถูกย่อ', '📸'); return; } const w = 480, h = Math.round(480 * src.height / src.width), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.filter = this.css[this.f] || 'none'; g.drawImage(src, 0, 0, w, h);
    g.filter = 'none'; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#ffe08a'; g.font = '13px Kanit,sans-serif'; g.fillText(`${S.farm || 'ไร่สุขใจ'} · ${RD(S.day)} · ${Phone.clock()}`, 8, h - 7);
    const url = c.toDataURL('image/jpeg', 0.72), L = this.list(); L.unshift({ t: `${RD(S.day)} ${Phone.clock()}`, url }); if (L.length > 12) L.length = 12; safeSet('raisukjai3d_album', JSON.stringify(L));
    const fl = document.createElement('div'); fl.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:32;opacity:.85;transition:opacity .4s;pointer-events:none'; document.body.appendChild(fl); setTimeout(() => fl.style.opacity = 0, 30); setTimeout(() => fl.remove(), 450); Sfx.tone(1400, 0.05, 'square', 0.04);
  },
  list() { try { return JSON.parse(safeGet('raisukjai3d_album') || '[]'); } catch (e) { return []; } },
  album() { const L = this.list(); UI.open('อัลบั้มรูป', null, () => L.length ? `<div class="grid">${L.map((p, i) => `<div class="card"><div class="cb"><img src="${p.url}" style="width:100%;border-radius:10px"><p class="dim">${p.t}</p><div class="row"><button class="btn ghost" data-a="phdel" data-i="${i}">ลบ</button></div></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีรูป เข้าโหมดถ่ายรูปด้วยปุ่ม 📸 หรือกด K</p>', { wide: true }); },
};
UI.H.phdel = d => { const L = Photo.list(); L.splice(+d.i, 1); safeSet('raisukjai3d_album', JSON.stringify(L)); };

// ===== 12. step-by-step hints with a guide arrow =====
const HINTS = [
  ['car', () => S.cars.length > 0, 'มีรถแล้ว! เติมน้ำมันได้ที่ปั๊ม ขับไปดูกัน', /ปั๊มน้ำมัน/],
  ['license', () => S.cars.length > 0 && !S.license && S.lvl >= 2, 'ขับรถต้องมีใบขับขี่ ไปสอบที่โรงเรียนสอนขับรถภูผา', /โรงเรียนสอนขับรถ/],
  ['town', () => S.lvl >= 3, 'ลองไปเที่ยวเมืองทุ่งทอง มีร้านไอทีและโชว์รูมรถ', /ทุ่งทอง/],
  ['grid', () => S.lvl >= 4, 'บ้านใช้ไฟเยอะขึ้นแล้ว ดูการไฟฟ้าที่ภูผาใหม่ ขยายมิเตอร์ได้', /การไฟฟ้า/],
  ['career', () => S.lvl >= 3 && !(S.job && S.job.k), 'อยากมีรายได้ประจำ สมัครงานในแอป 💼 งานประจำ หรือที่เครื่องสแกนหน้าที่ทำงาน', /เครื่องสแกน|สถานีตำรวจทุ่งทอง/],
  ['company', () => S.money > 600000, 'มีทุนพอแล้ว ลองเปิดบริษัทในแอป 🏢 บริษัทของฉัน', null],
  ['sec', () => S.money > 30000 && S.lvl >= 5, 'ติดกล้องวงจรปิดกันขโมยได้ที่ไอทีซีเคียวริตี้ ทุ่งทอง', /ไอทีซีเคียวริตี้/],
];
const Hints = {
  update(dt) {
    this.t = (this.t || 0) - dt; if (this.t <= 0 && G.started && !G.simulating && !UI.isOpen()) {
      this.t = 6; const seen = (S.hintSeen = S.hintSeen || {});
      for (const [k, cond, text, re] of HINTS) { if (seen[k] || !cond()) continue; seen[k] = S.day; UI.toast('💡 ' + text, '🧭'); if (re) { const p = World.pois.find(q => q.label && re.test(q.label) && q.x < 2500); if (p) { this.target = { x: p.x, z: p.z, until: performance.now() + 60000 }; } } break; }
    }
    // a floating arrow at the screen edge points toward the hinted place (or the GPS target)
    let el = $('guideArrow'); if (!el) { el = document.createElement('div'); el.id = 'guideArrow'; el.textContent = '➤'; document.body.appendChild(el); }
    const T = (GPS.dest) || (this.target && performance.now() < this.target.until ? this.target : null);
    if (!T || G.inside || UI.isOpen() || Photo.on) { el.style.opacity = 0; return; }
    const v = new THREE.Vector3(T.x, World.groundY(T.x, T.z) + 2, T.z).project(G.camera), on = v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9;
    let x = v.x, y = v.y; if (v.z > 1) { x = -x; y = -y; } const a = Math.atan2(-y, x), r = Math.min(innerWidth, innerHeight) * 0.36;
    el.style.opacity = 1; el.style.left = (on ? (x + 1) / 2 * innerWidth : innerWidth / 2 + Math.cos(a) * r) - 17 + 'px'; el.style.top = (on ? (1 - y) / 2 * innerHeight - 50 : innerHeight / 2 + Math.sin(a) * r) - 17 + 'px'; el.style.transform = on ? 'rotate(90deg)' : `rotate(${a}rad)`;
    const me = G.driving ? G.driving.d : G.player.pos; if (this.target && Math.hypot(me.x - this.target.x, me.z - this.target.z) < 8) this.target = null;
  },
};

// ===== 13. tidier HUD: collapse button, de-duplicated toasts, quick dock =====
const Hud = {
  init() {
    const t = document.createElement('button'); t.id = 'hudToggle'; t.className = 'panel'; t.textContent = '⇔'; t.title = 'ย่อ/ขยายแผงข้อมูล'; document.body.appendChild(t);
    t.onclick = () => { document.body.classList.toggle('hud-min'); S.hudMin = document.body.classList.contains('hud-min'); }; if (S.hudMin) document.body.classList.add('hud-min');
    const dock = document.createElement('div'); dock.id = 'dock'; dock.className = 'hud'; dock.style.pointerEvents = 'auto';
    dock.innerHTML = [['today', '📋', 'แผนวันนี้'], ['gps', '🧭', 'GPS'], ['career', '💼', 'งานประจำ'], ['photo', '📸', 'ถ่ายรูป (K)']].map(([k, i, n]) => `<button class="panel" data-q="${k}" title="${n}">${i}</button>`).join(''); document.body.appendChild(dock);
    dock.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.q === 'photo') Photo.toggle(); else Phone.open(b.dataset.q); };
    addEventListener('keydown', e => { if (e.code === 'KeyK' && G.started && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) Photo.toggle(); });
    // the same message within 4 seconds is shown once
    const _toast = UI.toast.bind(UI), seen = new Map(); UI.toast = (m, i) => { const now = performance.now(); if (seen.get(m) > now - 4000) return; seen.set(m, now); if (seen.size > 40) seen.clear(); return _toast(m, i); };
  },
};

// ===== 1-5. visual touches =====
const Vis = {
  init() {
    // puddles: a few mirror-like discs on the road near you while it rains
    const m = new THREE.MeshStandardMaterial({ color: 0x2b3440, roughness: 0.04, metalness: 0.9, transparent: true, opacity: 0.0, depthWrite: false });
    this.pud = []; for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(1, 20), m); p.rotation.x = -Math.PI / 2; p.renderOrder = 1; p.visible = false; G.scene.add(p); this.pud.push(p); } this.pudMat = m;
    this.roadBase = World.roadMat ? World.roadMat.roughness : null;
    // sunbeams through the house windows
    const bm = new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.beams = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 4.5), bm); b.position.set(IN.x - 3 + i * 3, 1.6, IN.z - 1); b.rotation.set(-0.55, 0.3, 0); this.beams.add(b); } this.beamMat = bm; G.scene.add(this.beams);
    // brake / tail lights on every player car
    this.tail = new THREE.MeshBasicMaterial({ color: 0x660000, toneMapped: false });
    this.lights();
    const _add = addCarObj; addCarObj = c => { const o = _add(c); this.carLights(o); return o; };
  },
  lights() { for (const o of G.cars) this.carLights(o); },
  carLights(o) { if (o.tl) return; o.tl = []; for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.05), this.tail); m.position.set(s * 0.62, 0.62, -2.05); o.g.add(m); o.tl.push(m); } },
  update(dt) {
    const wet = G.wet || G.wx.rain;
    if (World.roadMat && this.roadBase != null) World.roadMat.roughness = U.lerp(this.roadBase, 0.25, Math.min(1, wet));
    // puddles follow the player along the road
    const want = wet > 0.3 && !G.inside; this.pudMat.opacity = U.lerp(this.pudMat.opacity, want ? 0.55 : 0, Math.min(1, dt));
    if (want && (!this.pt || (this.pt -= dt) <= 0)) { this.pt = 4; const p = G.player.pos; for (const d of this.pud) { const a = Math.random() * TAU, r = 4 + Math.random() * 18, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (roadDist(x, z) < 3.5) { d.position.set(x, World.groundY(x, z) + 0.04, z); d.scale.set(0.6 + Math.random() * 1.2, 0.4 + Math.random() * 0.8, 1); d.visible = true; } else d.visible = false; } }
    if (this.pudMat.opacity < 0.02) for (const d of this.pud) d.visible = false;
    // indoor sunbeams only by day in the house
    const h = S.time / 60; this.beams.visible = G.inside && !G.inRoom && !G.inMine && h > 7 && h < 17.5; this.beamMat.opacity = 0.05 + 0.04 * Math.sin(G.t * 0.7);
    // tail lights: dim at night, bright red when braking
    const c = G.driving; for (const o of G.cars) if (o.tl) { const braking = o === c && Input.axis().y < -0.1 && o.speed > 0.5; o.tl[0].material = o.tl[1].material = braking ? Vis.brake || (Vis.brake = new THREE.MeshBasicMaterial({ color: 0xff1744, toneMapped: false })) : G.night > 0.5 ? Vis.night || (Vis.night = new THREE.MeshBasicMaterial({ color: 0xb71c1c, toneMapped: false })) : this.tail; }
    // falling leaves in the cool season and petals in the hot season around the player
    this.lt = (this.lt || 0) - dt; if (this.lt <= 0 && !G.inside && Fest2.small) { this.lt = 0.35; const se = season().id; if (se !== 'rain' && G.wx.rain < 0.2) { const p = G.player.pos, a = Math.random() * TAU, r = 3 + Math.random() * 14; Fest2.spawnS(p.x + Math.cos(a) * r, World.groundY(p.x, p.z) + 5 + Math.random() * 3, p.z + Math.sin(a) * r, 0.6 + G.wx.wind, -0.9, (Math.random() - .5) * .6, U.col(se === 'cool' ? U.pick([0xd84315, 0xf9a825, 0x8d6e63]) : U.pick([0xff80ab, 0xfff59d])), 6); } }
    // a mood bubble above your head now and then
    this.mt = (this.mt || 0) - dt; if (this.mt <= 0 && !G.inside && !G.driving) { this.mt = 9 + Math.random() * 6; const md = S.mood || 50, e = S.energy < 15 ? '😩' : md > 85 ? U.pick(['😄', '🎶', '✨']) : md < 25 ? '😞' : null; if (e) { if (!this.mb) { this.mb = U.sprite(e, 0.6, false); G.scene.add(this.mb); } this.mb.material.map = U.emojiTex(e); this.mb.material.needsUpdate = true; this.mb.visible = true; this.mbT = 2.2; } }
    if (this.mb && this.mb.visible) { this.mbT -= dt; const p = G.player.pos; this.mb.position.set(p.x, p.y + 2.4 + Math.sin(G.t * 3) * 0.05, p.z); if (this.mbT <= 0 || G.inside) this.mb.visible = false; }
  },
};

const Fun = {
  init() { Juice.init(); Villagers.init(); RaceFX.init(); Hud.init(); Vis.init(); Daily.st(); },
  day() { Villagers.day(); },
  update(dt) {
    Villagers.update(dt); Cook.update(dt); RaceFX.update(dt); Hints.update(dt); Vis.update(dt);
    this.ct = (this.ct || 0) - dt; if (this.ct <= 0) { this.ct = 0.5; Daily.check(); Daily.card(); }
  },
};
UI.H.giftopen = () => Daily.open();
// the race HUD shows the turbo state
{ const _u = Contests.update.bind(Contests); Contests.update = dt => { _u(dt); if (Contests.race && Contests.hud && Contests.hud.dataset.extra && !Contests.hud.textContent.includes('เทอร์โบ')) Contests.hud.textContent += Contests.hud.dataset.extra; }; }
