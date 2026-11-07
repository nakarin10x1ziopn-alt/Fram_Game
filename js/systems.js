'use strict';
// ---------- Progression & life systems: farmer level, crop quality, delivery orders, friendship, pet, house actions ----------

// ---- Farmer level ----
const MAX_LVL = 50;
function xpNeed(l) { return Math.round(60 + 50 * Math.pow(l - 1, 1.6)); }
const Prog = {
  init() {
    if (!S.lvl) {
      // older saves: estimate experience from what the player has already done
      const st = S.stats;
      S.xp = st.harvest * 5 + st.planted * 2 + st.watered + st.products * 6 + (st.fish || 0) * 8 + st.cooked * 10; S.lvl = 1;
      while (S.lvl < MAX_LVL && S.xp >= xpNeed(S.lvl)) { S.xp -= xpNeed(S.lvl); S.lvl++; Life2.note('เลเวลอัปเป็น Lv.' + S.lvl); }
    }
  },
  add(n) {
    if (S.lvl >= MAX_LVL) return;
    S.xp += Math.round(n * (S.buff && S.buff.xp && S.buff.xp.day === S.day ? S.buff.xp.k : 1) * Life2.xpMult());
    while (S.lvl < MAX_LVL && S.xp >= xpNeed(S.lvl)) {
      S.xp -= xpNeed(S.lvl); S.lvl++;
      const unl = Object.keys(SEED_LVL).filter(k => SEED_LVL[k] === S.lvl).map(k => CROPS[k].i + ' ' + CROPS[k].n);
      Sfx.goal(); S.energy = Math.min(maxEnergy(), S.energy + 20);
      UI.toast(`เลื่อนเป็นเกษตรกรระดับ ${S.lvl}! พลังงานสูงสุด +5${unl.length ? ' · ปลดล็อก ' + unl.join(', ') : ''}`, '🎉');
      FX.burst(G.player.pos.x, G.player.pos.y + 2, G.player.pos.z, 40, new THREE.Color(1, 0.85, 0.25), 4, 5);
    }
  },
};

// ---- Crop quality: watered every day + fertilizer + good soil give silver ★ or gold ★★ produce ----
function qid(base, q) { return q ? base + '@' + q : base; }
function rollQuality(p) {
  const score = (S.up.soil - 1) * 0.22 + (p.f ? 0.3 : 0) + ((p.dry || 0) < 1 ? 0.25 : 0) + Math.random() * 0.35 + (S.lvl - 1) * 0.012 + (S.luck === S.day ? 0.25 : 0);
  return score >= 0.85 ? 2 : score >= 0.55 ? 1 : 0;
}
function countBase(b) { return count(b) + count(b + '@1') + count(b + '@2'); }
function takeBase(b, n) {
  if (countBase(b) < n) return false;
  for (const id of [b, b + '@1', b + '@2']) { const k = Math.min(n, count(id)); if (k) { takeItem(id, k); n -= k; } }
  return true;
}
const STARS = ['', ' ★', ' ★★'];

// ---- Delivery orders on the village notice board ----
function orderPool() {
  const pool = [];
  for (const k in CROPS) if (!CROPS[k].tree && (SEED_LVL[k] || 1) <= S.lvl) pool.push([k, CROPS[k].sell, 3, 8]);
  if (S.up.orchard) for (const k of ['mango', 'orange']) pool.push([k, CROPS[k].sell, 2, 5]);
  const owned = new Set(S.animals.map(a => ANIMALS[a.type].prod));
  for (const k of owned) pool.push([k, PRODUCTS[k].sell, 1, 4]);
  if (S.up.rod) for (const k of ['nile', 'mackerel', 'catfish', 'crab']) pool.push(['fish_' + k, FISH[k].sell, 1, 3]);
  if (S.stats.cooked) for (const k of ['salad', 'omelet', 'cornsoup']) pool.push(['dish_' + k, RECIPES[k].sell, 1, 2]);
  return pool;
}
const Orders = {
  daily() {
    const before = S.orders.length;
    S.orders = S.orders.filter(o => o.due >= S.day);
    if (S.orders.length < before) UI.toast(`ออเดอร์หมดเวลา ${before - S.orders.length} รายการ`, '📋');
    const names = G.npcs.filter(n => !n.fixed).map(n => n.name), pool = orderPool();
    while (S.orders.length < 3 && pool.length && names.length) {
      const [item, val, lo, hi] = U.pick(pool), qty = lo + Math.floor(Math.random() * (hi - lo + 1));
      S.orders.push({ who: U.pick(names), item, qty, reward: Math.round(val * qty * 1.7 / 10) * 10 + 50, due: S.day + 2 + (Math.random() < 0.4 ? 1 : 0) });
    }
  },
  deliver(i) {
    const o = S.orders[i]; if (!o) return;
    if (countBase(o.item) < o.qty) { UI.toast('ของยังไม่ครบ', '📦'); Sfx.error(); return; }
    takeBase(o.item, o.qty); earn(o.reward); S.stats.orders = (S.stats.orders || 0) + 1;
    Friends.add(o.who, 1); Prog.add(40); S.orders.splice(i, 1);
    UI.toast(`ส่งของให้${o.who}แล้ว ได้ ${U.fmt(o.reward)} ฿ · ❤️ +1`, '📦');
  },
};

// ---- Friendship: talk daily, give gifts, receive presents at 3 / 6 / 10 hearts ----
const GIFT_TIERS = [[3, 'เมล็ดพันธุ์ 6 ซอง'], [6, 'ปุ๋ย 5 ถุง + เงิน 800 ฿'], [10, 'สปริงเกอร์โปร + เงิน 2,000 ฿']];
function favOf(name) { if (typeof SINGLE_FAV !== 'undefined' && SINGLE_FAV[name]) return SINGLE_FAV[name]; const pool = ['tomato', 'strawberry', 'corn', 'egg', 'milk', 'fish_nile', 'pumpkin', 'cabbage', 'dish_salad', 'sunflower', 'chili', 'carrot']; return pool[Math.abs(strHash(name)) % pool.length]; }
const Friends = {
  get(name) { return Math.max(0, S.friends[name] || 0); },
  add(name, v) {
    const before = this.get(name); S.friends[name] = Math.max(0, Math.min(10, before + v));
    // each heart tier pays out once per person, even if hearts drop and climb back
    const paid = (S.friendPaid = S.friendPaid || {});
    for (const [h, desc] of GIFT_TIERS) if (before < h && S.friends[name] >= h && (paid[name] || 0) < h) {
      paid[name] = h;
      if (h === 3) { const pool = Object.keys(CROPS).filter(k => !CROPS[k].tree && (SEED_LVL[k] || 1) <= S.lvl); addItem('seed_' + U.pick(pool), 6); }
      if (h === 6) { addItem('fert', 5); earn(800); }
      if (h === 10) { addItem('sprinkler_pro', 1); earn(2000); }
      setTimeout(() => UI.toast(`${name}ให้ของขวัญตอบแทนความสนิท: ${desc}`, '🎁'), 600);
    }
  },
  talk(n) {
    if (!S.daily.talk[n.name]) { S.daily.talk[n.name] = 1; this.add(n.name, 0.25); }
  },
  gift(n, id) {
    if (S.daily.gift[n.name]) { UI.toast(`วันนี้ให้${n.name}ไปแล้ว พรุ่งนี้ค่อยให้ใหม่นะ`, '🎁'); return; }
    if (!takeItem(id)) return;
    S.daily.gift[n.name] = 1; if (Social.single(n.name)) Social2.flirtOther(n.name);
    const base = ITEMS[id].base || id, fav = favOf(n.name) === base, dish = id.startsWith('dish_');
    const v = (fav ? 2 : GOODS[id] && GOODS[id].gift ? GOODS[id].gift : dish ? 1.5 : 1) * (Life2.bdays && Life2.bdays.includes(n.name) ? 3 : 1);
    this.add(n.name, v); Prog.add(3); n.wave = 1.5;
    UI.toast(fav ? `${n.name}: “ว้าว! ${ITEMS[id].n} ของโปรดเลย ขอบใจมากนะ ${S.name || ''}!” ❤️+2` : `${n.name}: “ขอบใจจ้า น่ารักจริง” ❤️+${v}`, fav ? '😍' : '😊');
  },
};
function shopDiscount(shop) { const k = G.npcs.find(n => n.keeper === shop); return k && Friends.get(k.name) >= 5 ? 0.9 : 1; }

// ---- House actions ----
function takeShower() {
  if (S.daily.shower) { UI.toast('วันนี้อาบน้ำไปแล้ว สดชื่นอยู่', '🚿'); return; }
  S.daily.shower = 1; S.energy = Math.min(maxEnergy(), S.energy + 30);
  playAct('fill', 1.4); Sfx.water(); Sfx.water();
  const p = G.player.pos; for (let i = 0; i < 40; i++) FX.spawn(p.x + (Math.random() - 0.5) * 0.8, p.y + 2 + Math.random() * 0.3, p.z + (Math.random() - 0.5) * 0.8, 0, -1.5, 0, 0.8, WATER_C, 4);
  UI.toast('อาบน้ำสดชื่น พลังงาน +30', '🚿');
}
const Mail = {
  deliver() {
    if (!S.mail.length) return;
    for (const m of S.mail) addItem(m.id, m.q);
    UI.toast(`พัสดุจากร้านออนไลน์มาส่งแล้ว ${S.mail.length} รายการ`, '📦'); S.mail = [];
  },
};
function resetDaily() { S.daily = { talk: {}, gift: {}, shower: 0, pet: 0 }; }

// ---- Pet dog or cat that follows the player ----
const Pet = {
  obj: null,
  spawn() {
    if (this.obj) { World.dyn.remove(this.obj); G.scene.remove(this.obj); }
    if (!S.pet) return;
    this.obj = Models[S.pet.type](); G.scene.add(this.obj);
    const p = G.player.pos; this.x = p.x - 1.5; this.z = p.z - 1; this.rot = 0; this.speed = 0;
  },
  pet() {
    if (S.daily.pet) { UI.toast(`${S.pet.name}กระดิกหางอย่างมีความสุข`, '🐾'); this.hop = 1; return; }
    S.daily.pet = 1; this.hop = 1.2; S.energy = Math.min(maxEnergy(), S.energy + 10);
    playAct('pet', 0.8); (S.pet.type === 'dog' ? Sfx.woof : Sfx.meow).call(Sfx);
    UI.toast(`ลูบหัว${S.pet.name} หายเหนื่อยเลย พลังงาน +10`, '💕');
  },
  update(dt) {
    if (!this.obj) return;
    const o = this.obj, P = G.player.pos;
    o.visible = !G.driving;
    if (G.driving) { this.x = P.x; this.z = P.z; return; }
    let tx = P.x, tz = P.z, d = Math.hypot(tx - this.x, tz - this.z);
    if (d > 25 || (G.inside !== this.inside)) { this.inside = G.inside; this.x = P.x - Math.sin(G.player.rot) * 1.5; this.z = P.z - Math.cos(G.player.rot) * 1.5; d = 1.5; }
    let want = 0;
    if (d > 2.2) { want = Math.min(6.5, d * 1.4); this.rot = U.angLerp(this.rot, Math.atan2(tx - this.x, tz - this.z), Math.min(1, dt * 6)); }
    else if (d < 1.0) { this.rot = U.angLerp(this.rot, Math.atan2(this.x - tx, this.z - tz), Math.min(1, dt * 4)); want = 1.2; }
    this.speed = U.lerp(this.speed || 0, want, Math.min(1, dt * 5));
    this.x += Math.sin(this.rot) * this.speed * dt; this.z += Math.cos(this.rot) * this.speed * dt;
    if (G.inside) { const r = World.room, c = G.inMine ? MINE0 : G.inRoom && typeof RM0 !== 'undefined' ? RM0 : IN; this.x = U.clamp(this.x, c.x - r.w / 2 + 0.4, c.x + r.w / 2 - 0.4); this.z = U.clamp(this.z, c.z - r.d / 2 + 0.4, c.z + r.d / 2 - 0.4); }
    else { const q = { x: this.x, z: this.z }; Col.push(q, 0.3); this.x = q.x; this.z = q.z; }
    this.hop = Math.max(0, (this.hop || 0) - dt);
    const y = G.inside ? 0 : World.groundY(this.x, this.z);
    o.position.set(this.x, y + (this.hop > 0 ? Math.abs(Math.sin(this.hop * 10)) * 0.2 : 0), this.z); o.rotation.y = this.rot;
    Models.animAnimal(o, dt, this.speed, this.hop > 0 || this.speed > 0.5 ? 'happy' : 'idle');
  },
};
