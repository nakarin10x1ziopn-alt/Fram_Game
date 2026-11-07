'use strict';
// ---------- Village competitions: car time trial, fishing derby, cooking contest, animal show; plus two new village shops ----------
const CONTESTS = {
  race: { n: 'แข่งรถจับเวลา', i: '🏁', desc: 'ขับจากหมู่บ้านผ่านทุกประตูไปถึงเมืองริมทะเลให้เร็วที่สุด แต่งรถที่อู่ช่วยได้มาก', prize: [2000, 1000, 500] },
  fish: { n: 'แข่งตกปลา', i: '🎣', desc: 'มีเวลา 3 ชั่วโมงในเกม ตกปลาให้ได้มูลค่ารวมสูงสุด ที่บ่อในฟาร์มหรือท่าเรือก็ได้', prize: [1500, 800, 400] },
  cook: { n: 'ประกวดทำอาหาร', i: '👩‍🍳', desc: 'ส่งอาหาร 1 จาน กรรมการให้คะแนนจากความยากของเมนู', prize: [1500, 800, 400] },
  animal: { n: 'ประกวดสัตว์เลี้ยงในฟาร์ม', i: '🐄', desc: 'พาสัตว์ 1 ตัวมาประกวด คะแนนจากชนิดและความสุขของสัตว์', prize: [2000, 1000, 500] },
};
const RACE_CP = [[0, -250], [0, -305], [18, -342], [75, -368], [150, -390], [230, -392]];
const RACE_START = { x: 2.2, z: -192, r: Math.PI };
const RIVAL_TIMES = [['พี่ทะเล', 27.5], ['ภูผา', 31], ['น้องฝน', 35.5], ['ลุงมี', 41], ['ยายสาย', 52]];
FOODS.sandwich = { n: 'แซนด์วิชแฮมชีส', i: '🥪', price: 45, en: 18 };
FOODS.energy = { n: 'เครื่องดื่มชูกำลัง', i: '🥤', price: 35, en: 25 };
FOODS.onigiri = { n: 'ข้าวปั้นไส้ทูน่า', i: '🍙', price: 30, en: 15 };
FOODS.cake = { n: 'เค้กสตรอว์เบอร์รี', i: '🍰', price: 120, en: 40 };
for (const id of ['sandwich', 'energy', 'onigiri', 'cake']) ITEMS['food_' + id] = { n: FOODS[id].n, i: FOODS[id].i, en: FOODS[id].en, cat: 'dish' };
FURN.flowers = { n: 'แจกันดอกไม้สด', i: '💐', price: 600 };
FURN.trophy2 = { n: 'ถ้วยแชมป์แข่งรถ', i: '🏆', price: 0 };
SHOPS.mart = { n: 'ร้านสะดวกซื้อสุขใจมาร์ท', tabs: [{ n: 'อาหาร & เครื่องดื่ม', items: ['food:sandwich', 'food:onigiri', 'food:energy', 'food:coffee', 'food:cake'] }, { n: 'ของใช้', items: ['tool:extinguisher', 'tool:feed', 'tool:fert'] }] };
SHOPS.florist = { n: 'ร้านดอกไม้บ้านมะลิ', tabs: [{ n: 'ดอกไม้', items: ['tool:bouquet', 'furn:flowers', 'furn:plant', 'seed:sunflower', 'seed:strawberry'] }] };

const Contests = {
  race: null, derby: null,
  st() { if (!S.contest) S.contest = { day: {}, best: {}, wins: 0 }; return S.contest; },
  done(k) { const d = this.st().day[k]; return d != null && S.day - d < 3; },
  init(scene) {
    this.scene = scene;
    const hud = document.createElement('div'); hud.id = 'raceHud'; hud.hidden = true; document.body.appendChild(hud); this.hud = hud;
    // contest board next to the plaza
    const bx = -13.5, bz = -284, g = new THREE.Group(); g.position.set(bx, World.groundY(bx, bz), bz); g.rotation.y = Math.PI / 2;
    for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [s * 1.3, 1.4, 0], [0.09, 2.8, 0.09]);
    U.mk(g, GEO.box, mc(0x1d3557), [0, 1.9, 0], [2.8, 1.5, 0.1]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('🏆 ศูนย์แข่งขัน', { w: 512, h: 160, bg: '#1d3557', fg: '#ffd166' }), roughness: 0.7 });
    U.mk(g, new THREE.PlaneGeometry(2.6, 0.8), sm, [0, 2.15, 0.06]);
    U.mk(g, GEO.cyl, mc(0xe0b13a, { metalness: 0.6, roughness: 0.3 }), [0, 3.1, 0], [0.25, 0.35, 0.25]);
    World.outdoor.add(g); Col.box(bx, bz, 0.2, 1.4, Math.PI / 2);
    World.pois.push({ kind: 'act', x: bx + 1.8, z: bz, r: 2.4, label: 'ศูนย์แข่งขัน', icon: '🏆', map: true, act: () => ({ icon: '🏆', label: 'ดูรายการแข่งขันวันนี้', fn: () => this.ui() }) });
    // checkpoint arches for the time trial
    this.gates = RACE_CP.map(([x, z], i) => {
      const a = new THREE.Group(); a.position.set(x, World.groundY(x, z), z);
      const nx = (RACE_CP[i + 1] || [x + (x - RACE_CP[i - 1][0]), z + (z - RACE_CP[i - 1][1])]);
      a.rotation.y = Math.atan2(nx[0] - (RACE_CP[i - 1] || [0, -192])[0], nx[1] - (RACE_CP[i - 1] || [0, -192])[1]);
      const m = new THREE.MeshBasicMaterial({ color: i === RACE_CP.length - 1 ? 0xffd166 : 0x30c8ff, transparent: true, opacity: 0.75, toneMapped: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.22, 8, 40, Math.PI), m); ring.position.y = 0.1; a.add(ring);
      a.visible = false; scene.add(a); return { a, m };
    });
    this.buildShops();
  },
  buildShops() {
    const mk = (x, z, rot, o, shop, icon) => {
      const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b);
      Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 7, true);
      const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
      World.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: SHOPS[shop].n, icon, map: true });
      const k = Models.human({ skin: 0xf1c9a5, hair: 0x1b120c, shirt: 0x2e7d32, pants: 0x34507a, avatar: shop === 'mart' ? 'Olivia' : 'Erika' });
      const sp = l2w(x, z, rot, 1.6, o.d / 2 + 0.6); k.position.set(sp.x, World.groundY(sp.x, sp.z), sp.z); k.rotation.y = rot; World.dyn.add(k);
      G.npcs.push({ obj: k, name: shop === 'mart' ? 'พี่โอ๋มาร์ท' : 'ป้ามะลิวัลย์', rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: sp.x, z: sp.z, tx: sp.x, tz: sp.z, hx: sp.x, hz: sp.z, hrot: rot, keeper: shop });
    };
    mk(15, -70, -Math.PI / 2, { w: 9, d: 7, h: 3.6, flat: true, wall: 0xf5f5f5, roof: 0xe0e0e0, sign: 'สุขใจมาร์ท 24 ชม.', signStyle: { bg: '#2e7d32', fg: '#fff' }, glassFront: true, winS: [0], ww: 1.4, wh: 1.2, awning: 0xff7043 }, 'mart', '🏪');
    mk(-15, -70, Math.PI / 2, { w: 8, d: 6.5, h: 3.4, roofH: 2.2, wallTex: 'wood', wall: 0xf8e1e7, roof: 0x8e3b5a, sign: 'ร้านดอกไม้บ้านมะลิ', signStyle: { bg: '#ad1457' }, awning: 0xf06292, flowers: true, pots: true, winF: [-2.4, 2.4], winS: [0] }, 'florist', '💐');
  },
  ui() {
    UI.open('ศูนย์แข่งขันประจำหมู่บ้าน', null, () => {
      const c = this.st();
      return `<p class="lead">แต่ละรายการแข่งได้ทุก 3 วัน ที่ 1 ได้ถ้วยรางวัลไปตั้งในบ้าน · ชนะมาแล้ว ${c.wins} ครั้ง</p><div class="grid">${Object.keys(CONTESTS).map(k => {
        const C = CONTESTS[k], d = this.done(k), best = c.best[k];
        return `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${C.n}</h4><p class="dim">${C.desc}</p><p>รางวัลที่ 1: ${baht(C.prize[0])}${best ? ` · สถิติดีสุดของคุณ: ${k === 'race' ? best.toFixed(2) + ' วิ' : best + ' คะแนน'}` : ''}</p><div class="row"><button class="btn" data-a="cstart" data-k="${k}" ${d ? 'disabled' : ''}>${d ? `แข่งได้อีกครั้ง${RD(c.day[k] + 3)}` : 'สมัครแข่ง'}</button></div></div></div>`;
      }).join('')}</div>`;
    }, { wide: true });
  },
  start(k) {
    if (this.done(k)) return;
    if (k === 'race') return this.startRace();
    if (k === 'fish') return this.startDerby();
    if (k === 'cook') return this.pick('cook');
    if (k === 'animal') return this.pick('animal');
  },
  // ----- results shared by every contest -----
  finish(k, mine, it, lowerWins) {
    const c = this.st(); c.day[k] = S.day;
    let rivals;
    if (k === 'race') rivals = RIVAL_TIMES.map(([who, t]) => ({ who, score: +(t * (0.95 + Math.random() * 0.12)).toFixed(2) }));
    else { const base = { fish: 260 + S.lvl * 40, cook: 260 + S.lvl * 30, animal: 120 + S.lvl * 10 }[k]; rivals = G.npcs.filter(n => !n.fixed).slice(3, 8).map((n, i) => ({ who: n.name, score: Math.round(base * [1.6, 1.3, 1.1, 0.9, 0.7][i] * (0.85 + Math.random() * 0.3)) })); }
    const all = rivals.concat([{ who: (S.name || 'คุณ') + ' (คุณ)', score: mine, me: true }]).sort((a, b) => lowerWins ? a.score - b.score : b.score - a.score);
    const rank = all.findIndex(r => r.me) + 1, prize = CONTESTS[k].prize[rank - 1] || 200;
    if (!c.best[k] || (lowerWins ? mine < c.best[k] : mine > c.best[k])) c.best[k] = mine;
    earn(prize); Bank2.income('เงินรางวัลแข่งขัน', prize); Prog.add(rank <= 3 ? 60 : 20);
    if (rank === 1) { c.wins++; Life2.note('ชนะเลิศ' + CONTESTS[k].n + '!'); if (k === 'race') S.furn.trophy2 = 1; else S.furn.trophy = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; }
    if (k === 'race') all.forEach(r => r.label = r.score.toFixed(2) + ' วินาที');
    UI.contestResult(all, rank, prize, it);
  },
  // ----- cooking & animals: pick an entry -----
  pick(k) {
    UI.open(CONTESTS[k].n, null, () => {
      if (k === 'cook') {
        const ids = Object.keys(S.inv).filter(id => id.startsWith('dish_') && S.inv[id] > 0);
        if (!ids.length) return '<p class="empty">ยังไม่มีอาหารที่ทำเอง ทำอาหารที่ครัวในบ้านก่อนนะ</p>';
        return `<p class="lead">เลือกส่ง 1 จาน (จานจะถูกใช้ไป)</p><div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${S.inv[id]}</small></h4><div class="row"><button class="btn" data-a="center" data-k="cook" data-id="${id}">ส่งประกวด</button></div></div></div>`).join('')}</div>`;
      }
      if (!S.animals.length) return '<p class="empty">ยังไม่มีสัตว์ในฟาร์ม</p>';
      return `<p class="lead">เลือกสัตว์ 1 ตัว สัตว์ที่มีความสุขมากจะได้คะแนนสูง</p><div class="grid">${S.animals.map((a, i) => `<div class="card"><div class="ci">${ANIMALS[a.type].i}</div><div class="cb"><h4>${esc(a.name)}</h4><p class="dim">ความสุข ${Math.round(a.happy ?? 50)}%</p><div class="row"><button class="btn" data-a="center" data-k="animal" data-id="${i}">ส่งประกวด</button></div></div></div>`).join('')}</div>`;
    });
  },
  enter(k, id) {
    if (k === 'cook') { const it = ITEMS[id]; if (!takeItem(id)) return; this.finish('cook', Math.round((it.sell || 100) * (0.9 + Math.random() * 0.25) * 1.2), it); }
    else { const a = S.animals[+id], A = ANIMALS[a.type]; this.finish('animal', Math.round(A.price / 12 * (0.5 + (a.happy ?? 50) / 100) * (0.9 + Math.random() * 0.2)), { i: A.i, n: a.name }); }
  },
  // ----- fishing derby -----
  startDerby() {
    if (!S.up.rod) { UI.toast('ต้องมีคันเบ็ดก่อน ซื้อได้ที่ร้านเกษตร', '🎣'); return; }
    UI.close(); this.derby = { end: S.day * 1440 + S.time + 180, score: 0, n: 0 };
    UI.toast('เริ่มแข่งตกปลา! มีเวลา 3 ชั่วโมงในเกม ไปที่บ่อในฟาร์มหรือท่าเรือได้เลย', '🎣');
  },
  onFish(id) { if (!this.derby) return; this.derby.score += FISH[id].sell; this.derby.n++; UI.toast(`แข่งตกปลา: ${this.derby.n} ตัว รวม ${this.derby.score} คะแนน`, '🐟'); },
  // ----- car time trial -----
  startRace() {
    const o = G.driving || G.cars[0];
    if (!o) { UI.toast('ต้องมีรถก่อน ซื้อได้ที่โชว์รูม', '🚗'); return; }
    UI.close();
    fade(() => {
      if (G.inside) setInside(false);
      if (G.inMine) Mine.leave(true);
      if (G.driving && G.driving !== o) { G.driving.speed = 0; exitCar(); }
      Object.assign(o.d, RACE_START, { parked: false }); o.speed = 0;
      o.g.position.set(o.d.x, World.groundY(o.d.x, o.d.z), o.d.z); o.g.rotation.y = o.d.r;
      if (G.driving !== o) { if (o.col) { Col.remove(o.col); o.col = null; } enterCar(o); }
      G.player.pos.set(o.d.x, 0, o.d.z); G.cam.yaw = o.d.r + Math.PI; snapCam();
      this.race = { st: 'count', t: 3.2, cp: 0, o };
      this.gates.forEach(g => g.a.visible = true); this.hud.hidden = false;
    });
  },
  stopRace(msg) {
    const r = this.race; this.race = null; this.gates.forEach(g => g.a.visible = false); this.hud.hidden = true;
    if (msg) UI.toast(msg, '🏁');
    return r;
  },
  update(dt) {
    if (!this.scene || !G.started) return;
    const live = !G.paused && !UI.isOpen();
    const r = this.race;
    if (r) {
      if (!G.driving || G.driving !== r.o) { this.stopRace('ออกจากรถ การแข่งถูกยกเลิก'); return; }
      if (!live) return;
      if (r.st === 'count') {
        const before = Math.ceil(r.t); r.t -= dt; G.driving.speed = 0;
        if (Math.ceil(r.t) !== before && r.t > 0) Sfx.tone(520, 0.18, 'square', 0.06);
        this.hud.textContent = r.t > 0 ? `เตรียมตัว... ${Math.ceil(r.t)}` : 'ไป!';
        if (r.t <= 0) { r.st = 'go'; r.time = 0; Sfx.tone(1040, 0.4, 'square', 0.07); }
      } else {
        r.time += dt;
        const [x, z] = RACE_CP[r.cp], d = r.o.d;
        if (Math.hypot(d.x - x, d.z - z) < 9) {
          Sfx.tone(880 + r.cp * 60, 0.15, 'sine', 0.06); this.gates[r.cp].a.visible = false; r.cp++;
          if (r.cp >= RACE_CP.length) { const t = +r.time.toFixed(2); this.stopRace(); this.finish('race', t, { i: CARS[d.type].i, n: CARS[d.type].n }, true); return; }
        }
        this.gates.forEach((g, i) => { g.m.opacity = i === r.cp ? 0.55 + 0.4 * Math.sin(G.t * 8) : 0.35; });
        const nx = RACE_CP[r.cp], dist = Math.round(Math.hypot(d.x - nx[0], d.z - nx[1]));
        this.hud.textContent = `🏁 ${r.time.toFixed(1)} วิ · ประตู ${r.cp + 1}/${RACE_CP.length} · อีก ${dist} ม.`;
        if (r.time > 150) this.stopRace('หมดเวลา! ลองใหม่พรุ่งนี้นะ');
      }
    }
    const dv = this.derby;
    if (dv && live) {
      const now = S.day * 1440 + S.time, left = dv.end - now;
      if (left <= 0) { this.derby = null; this.hud.hidden = true; this.finish('fish', dv.score, { i: '🎣', n: `ปลา ${dv.n} ตัว` }); }
      else if (!this.race) { this.hud.hidden = false; this.hud.textContent = `🎣 แข่งตกปลา · ${dv.n} ตัว · ${dv.score} คะแนน · เหลือ ${Math.ceil(left / 60)} ชม.`; }
    }
  },
};
UI.H.cstart = d => Contests.start(d.k);
UI.H.center = d => Contests.enter(d.k, d.id);
