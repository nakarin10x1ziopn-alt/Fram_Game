'use strict';
// ---------- v27: five extra town-only pedestrians (rider, student, office worker, street vendor, tourist) ----------
// Built on the hand-built Models.human rig with extra props, so they walk/wave like everyone else. They are NOT in the
// character creator. They appear only while the player is in a city (or on the main town street), by size and time of day.
V23.add('v27_npc', () => {
  const ROLES = {
    rider: {
      job: 'ไรเดอร์ส่งอาหาร', i: '🛵',
      names: ['เอก (ไรเดอร์)', 'บอล (ไรเดอร์)', 'ต้น (ไรเดอร์)', 'นุ่น (ไรเดอร์)', 'ตูน (ไรเดอร์)', 'โอ๊ต (ไรเดอร์)'], fem: ['นุ่น (ไรเดอร์)', 'ตูน (ไรเดอร์)'],
      age: [21, 34], pace: 1.25,
      lines: ['ออเดอร์เข้าเยอะมากวันนี้ ต้องรีบส่งก่อนอาหารเย็น!', 'ถ้าสั่งอาหารผ่านแอป ผมอาจเป็นคนไปส่งให้คุณนะ', 'ฝนตกทีไรออเดอร์ล้น แต่ก็เหนื่อยหน่อย', 'ช่วงเที่ยงกับเย็นคือช่วงทอง ส่งไม่หยุดเลย'],
      look: (f, R) => ({ skin: [0xe0a87e, 0xc68d63][R() < 0.5 ? 0 : 1], shirt: 0x1faa59, pants: 0x263238, hair: 0x1b120c, shoe: 0x222222, longSleeve: false, pony: f }),
      props: (P, U2, head, R) => {
        const hm = mc(0x1faa59, { roughness: 0.4 }), wh = mc(0xffffff, { roughness: 0.4 });
        U.mk(head, gcache('v27helm', () => new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI * 0.62)), hm, [0, 0.025, -0.004], [0.14, 0.14, 0.145]);
        U.mk(head, GEO.box, wh, [0, 0.07, 0.0], [0.05, 0.01, 0.2]);
        U.mk(head, GEO.box, mc(0x111111, { roughness: 0.2 }), [0, 0.0, 0.126], [0.2, 0.05, 0.012]);
        U.mk(U2, GEO.box, hm, [0, 1.22, -0.27], [0.46, 0.46, 0.4]);
        U.mk(U2, GEO.box, wh, [0, 1.46, -0.27], [0.48, 0.03, 0.42]);
        U.mk(U2, GEO.box, wh, [0, 1.22, -0.475], [0.26, 0.2, 0.01]);
      },
    },
    student: {
      job: 'นักเรียน/นักศึกษา', i: '🎒',
      names: ['น้องพลอย (นักศึกษา)', 'น้องบีม (นักเรียน)', 'น้องมิ้นท์ (นักศึกษา)', 'น้องกัน (นักเรียน)', 'น้องฟ้า (นักศึกษา)', 'น้องนนท์ (นักเรียน)'], fem: ['น้องพลอย (นักศึกษา)', 'น้องมิ้นท์ (นักศึกษา)', 'น้องฟ้า (นักศึกษา)'],
      age: [15, 22], pace: 1.1,
      lines: ['วันนี้มีสอบกลางภาค ใจสั่นเลย...', 'กำลังจะไปห้องสมุด ใกล้สอบแล้วค่ะ', 'อยากสอบติดมหาวิทยาลัยในเมืองใหญ่ แล้วหางานดี ๆ ทำ', 'ถ้ามีเอกสารไม่ครบ ลงทะเบียนเรียนไม่ได้นะ ต้องเตรียมให้ดี'],
      look: (f, R) => ({ skin: 0xf1c9a5, shirt: 0xfafafa, pants: f ? 0x1c2a4a : 0x1c2a4a, skirt: f ? 0x1c2a4a : null, hair: R() < 0.5 ? 0x1b120c : 0x3a2416, shoe: 0x111111, long: f && R() < 0.5, pony: f && R() < 0.5 }),
      props: (P, U2, head, R) => {
        const bag = mc([0x1565c0, 0xc62828, 0x2e7d32, 0x6a1b9a][(R() * 4) | 0], { roughness: 0.8 });
        U.mk(U2, GEO.box, bag, [0, 1.2, -0.2], [0.34, 0.42, 0.18]);
        U.mk(U2, GEO.box, bag, [0, 1.1, -0.31], [0.24, 0.16, 0.06]);
        for (const s of [-1, 1]) U.mk(U2, GEO.box, bag, [s * 0.1, 1.3, -0.02], [0.04, 0.3, 0.2]);
      },
    },
    office: {
      job: 'พนักงานออฟฟิศ', i: '💼',
      names: ['คุณสมชาย (ออฟฟิศ)', 'คุณวรรณา (ออฟฟิศ)', 'คุณธนา (ออฟฟิศ)', 'คุณปวีณา (ออฟฟิศ)', 'คุณกฤษณ์ (ออฟฟิศ)', 'คุณอรทัย (ออฟฟิศ)'], fem: ['คุณวรรณา (ออฟฟิศ)', 'คุณปวีณา (ออฟฟิศ)', 'คุณอรทัย (ออฟฟิศ)'],
      age: [25, 45], pace: 1.2,
      lookGlasses: 0.4,
      lines: ['ประชุมสิบโมง ขอตัวก่อนนะครับ', 'งานเดือนนี้เยอะมาก แต่โบนัสปลายปีก็น่าสนใจ', 'อย่าลืมยื่นภาษีและดูสิทธิประกันสังคมด้วยนะ', 'กาแฟแก้วที่สามของวันแล้ว...'],
      look: (f, R) => ({ skin: 0xf1c9a5, shirt: f ? 0xe8e8ee : 0x37474f, pants: f ? 0x2a2f3a : 0x263238, skirt: f ? 0x2a2f3a : null, hair: 0x1b120c, shoe: 0x111111, longSleeve: true, glasses: R() < 0.4, bun: f }),
      props: (P, U2, head, R) => {
        U.mk(U2, GEO.box, mc(0xcfd8dc), [0, 1.3, 0.1], [0.07, 0.17, 0.01]);                       // shirt collar / inner
        U.mk(U2, GEO.box, mc(0x1565c0, { roughness: 0.5 }), [0, 1.24, 0.122], [0.035, 0.2, 0.01]);   // lanyard
        U.mk(U2, GEO.box, mc(0xffffff), [0, 1.12, 0.126], [0.07, 0.09, 0.008]);                      // badge
        U.mk(U2, GEO.box, mc(0x1565c0), [0, 1.155, 0.13], [0.07, 0.02, 0.004]);
        // briefcase held low at the side
        U.mk(U2, GEO.box, mc(0x4e342e, { roughness: 0.6 }), [0.27, 0.78, 0.04], [0.06, 0.3, 0.38]);
      },
    },
    vendor: {
      job: 'แม่ค้า/พ่อค้าแผงลอย', i: '🧺',
      names: ['ป้าสมศรี (แม่ค้า)', 'ลุงสมหมาย (พ่อค้า)', 'พี่แจ๋ว (แม่ค้า)', 'ป้าบุญมา (แม่ค้า)', 'ลุงเจริญ (พ่อค้า)', 'พี่หน่อย (แม่ค้า)'], fem: ['ป้าสมศรี (แม่ค้า)', 'พี่แจ๋ว (แม่ค้า)', 'ป้าบุญมา (แม่ค้า)', 'พี่หน่อย (แม่ค้า)'],
      age: [38, 62], pace: 0.9,
      lines: ['ผลไม้สด ๆ ทุกวัน ถูกกว่าห้างเยอะ!', 'ขายแผงลอยต้องมีใบอนุญาตจากเทศกิจด้วยนะ', 'ข้าวเหนียวมะม่วงร้อน ๆ เอาไหมจ๊ะ', 'วันไหนฝนตก ขายไม่ค่อยดี แต่ก็สู้ต่อ'],
      look: (f, R) => ({ skin: 0xc68d63, shirt: f ? 0xf48fb1 : 0x8d6e63, pants: 0x4e342e, hair: R() < 0.5 ? 0x1b120c : 0x9e9e9e, apron: 0xfff8e1, hat: 'straw', shoe: 0x3e2723, long: f && R() < 0.4, bun: f && R() < 0.5 }),
      props: (P, U2, head, R) => {
        const wood = mc(0x8d6e63, { roughness: 0.9 });
        U.mk(U2, GEO.box, wood, [0, 1.0, 0.3], [0.5, 0.04, 0.34]);                                     // tray in front
        for (const [x, c] of [[-0.15, 0xe53935], [0, 0xffb300], [0.15, 0x7cb342]]) U.mk(U2, GEO.sph, mc(c, { roughness: 0.6 }), [x, 1.07, 0.3], 0.07);
        for (const s of [-1, 1]) U.mk(U2, GEO.box, wood, [s * 0.1, 1.28, 0.18], [0.03, 0.55, 0.22], [0.5, 0, 0]);  // strap
      },
    },
    tourist: {
      job: 'นักท่องเที่ยว', i: '📷',
      names: ['แจ็ค (นักท่องเที่ยว)', 'เอมิลี่ (นักท่องเที่ยว)', 'ฮิโรชิ (นักท่องเที่ยว)', 'โซเฟีย (นักท่องเที่ยว)', 'ไมเคิล (นักท่องเที่ยว)', 'มินจี (นักท่องเที่ยว)'], fem: ['เอมิลี่ (นักท่องเที่ยว)', 'โซเฟีย (นักท่องเที่ยว)', 'มินจี (นักท่องเที่ยว)'],
      age: [22, 58], pace: 0.8,
      lines: ['Hello! This town is so beautiful. Where is the best place to eat?', 'ผมมาเที่ยวคนเดียว ชอบที่นี่มาก อาหารอร่อย', 'ขอถ่ายรูปด้วยได้ไหมครับ? (ยิ้ม)', 'ที่นี่ผู้คนใจดีมาก ไว้จะกลับมาอีกแน่นอน'],
      look: (f, R) => ({ skin: [0xf5d8c0, 0xf1c9a5, 0xe0a87e][(R() * 3) | 0], shirt: [0xff7043, 0x26a69a, 0xffca28, 0xec407a][(R() * 4) | 0], pants: 0xd7ccc8, hair: [0x6e4a2f, 0xd9b45a, 0x1b120c][(R() * 3) | 0], hat: 'cap', capColor: 0xf5f5f5, shoe: 0xeeeeee, glasses: R() < 0.3, pony: f }),
      props: (P, U2, head, R) => {
        const bag = mc(0x455a64, { roughness: 0.8 });
        U.mk(U2, GEO.box, bag, [0, 1.2, -0.2], [0.36, 0.46, 0.2]);
        U.mk(U2, GEO.box, mc(0x111111), [0, 1.07, 0.15], [0.14, 0.09, 0.07]);                          // camera on chest
        U.mk(U2, GEO.cyl, mc(0x222222), [0, 1.07, 0.21], [0.03, 0.05, 0.03], [Math.PI / 2, 0, 0]);
        U.mk(U2, GEO.box, mc(0x222222), [0, 1.3, 0.12], [0.02, 0.4, 0.01]);                            // strap
        U.mk(head, GEO.box, mc(0x0a0a0a, { roughness: 0.15 }), [0, 0.012, 0.125], [0.17, 0.034, 0.012]); // sunglasses
      },
    },
  };
  const KEYS = Object.keys(ROLES);
  const R = Math.random;

  // ---- profiles: People.prof builds one from the name, so seed ours (gender, age, job) before anyone talks to them ----
  function seedProf(name, role, fem) {
    People._p = People._p || {};
    const r = ROLES[role], age = r.age[0] + ((Math.abs(strHash(name)) % (r.age[1] - r.age[0] + 1)));
    const tk = Object.keys(TRAITS);
    People._p[name] = { fem, age, trait: tk[Math.abs(strHash(name)) % tk.length], job: r.job, single: false };
  }

  function make(role, line) {
    const r = ROLES[role], name = r.names[(R() * r.names.length) | 0], fem = r.fem.includes(name);
    seedProf(name, role, fem);
    const o = Models.human(Object.assign({}, r.look(fem, R)));
    const P = o.userData, U2 = P.upper.children[0];
    r.props(P, U2, P.head, R);
    o.scale.setScalar(0.94 + R() * 0.1); World.dyn.add(o);
    const zs = line[2] - line[1], z = line[1] + R() * zs;
    const n = { obj: o, name, rot: R() * TAU, speed: 0, timer: R() * 3, st: 'idle', wave: 0, line, x: line[0], z, tx: line[0], tz: z, role, npc27: true, townRes: true, pace: r.pace * (0.9 + R() * 0.2) };
    o.position.set(n.x, World.groundY(n.x, z), z);
    G.npcs.push(n);
    return n;
  }
  function remove(n) {
    const i = G.npcs.indexOf(n); if (i >= 0) G.npcs.splice(i, 1);
    if (n.tag) { G.scene.remove(n.tag); n.tag = null; }
    if (UI.talkTo === n) return false;
    World.dyn.remove(n.obj); return true;
  }

  // ---- where they walk: the pavements of the current city's streets, or the main town street ----
  const MAIN_LINES = () => (World.npcRoutes && World.npcRoutes.village ? World.npcRoutes.village.lines : null);
  function ctx() {
    if (G.inside || G.inRoom || G.inMine) return null;
    const A = G.away;
    if (A) {
      if (A.key === undefined && !A.size && A.cx === undefined) return null;
      if (!A.cx || A.key === 'mount' || A.key === 'island' || A.n === 'mount' || A.n === 'island') return null;
      const size = A.size || 'medium', streets = A.streets || [0], zl = size === 'large' ? 55 : size === 'medium' ? 50 : 45;
      const lines = []; for (const sx of streets) for (const side of [-5.5, 5.5]) lines.push([A.cx + sx + side, A.cz - zl, A.cz + zl]);
      return { id: 'a:' + (A.key || A.n), size, lines, total: size === 'large' ? 10 : size === 'medium' ? 6 : 3 };
    }
    const ml = MAIN_LINES(), p = G.player.pos;
    if (ml && p.z < -150 && p.z > -340 && Math.abs(p.x) < 60) return { id: 'main', size: 'main', lines: ml, total: 5 };
    return null;
  }
  // role weights by the hour: students around school times, riders at meal times, offices at commute and lunch
  function weights(h) {
    if (h < 6 || h >= 21.5) return null;
    const inR = (a, b) => h >= a && h < b;
    return {
      rider: inR(11, 14) || inR(17, 21) ? 3 : 0.7,
      student: inR(6.5, 8.5) || inR(15, 17.5) ? 3 : inR(11, 13) ? 1 : 0,
      office: inR(7, 9) || inR(12, 13.5) || inR(17, 19) ? 3 : inR(9, 12) || inR(13.5, 17) ? 0.8 : 0.3,
      vendor: inR(6, 20) ? 2 : 0.3,
      tourist: inR(9, 18) ? 2 : inR(18, 21.5) ? 1 : 0,
    };
  }
  function manage() {
    if (!G.started || G.simulating || G.paused) return;
    const c = ctx(), mine = G.npcs.filter(n => n.npc27);
    if (!c) { for (const n of mine) remove(n); this.cur = null; return; }
    // moving to another city drops the old crowd
    if (this.cur !== c.id) { for (const n of mine) remove(n); this.cur = c.id; }
    const w = weights(S.time / 60), now = G.npcs.filter(n => n.npc27), p = G.player.pos;
    const want = {}; let sum = 0;
    if (w) for (const k of KEYS) sum += w[k];
    for (const k of KEYS) want[k] = w && sum ? Math.round(c.total * w[k] / sum) : 0;
    if (w && !KEYS.some(k => want[k]) && c.total) want[KEYS.reduce((a, b) => (w[b] > w[a] ? b : a))] = 1;
    for (let tot = KEYS.reduce((a, k) => a + want[k], 0); tot > c.total; tot--) want[KEYS.reduce((a, b) => (want[b] > want[a] ? b : a))]--;
    for (const k of KEYS) {
      const have = now.filter(n => n.role === k);
      if (have.length > want[k]) {   // drop extras only while nobody is looking at them
        const far = have.filter(n => Math.hypot(n.x - p.x, n.z - p.z) > 30 || !n.obj.visible)[0];
        if (far) remove(far);
      } else if (have.length < want[k]) {
        // never the same line twice in a row, and never right next to the player
        const line = c.lines[(R() * c.lines.length) | 0];
        const n = make(k, line);
        if (Math.hypot(n.x - p.x, n.z - p.z) < 14) { n.z = U.clamp(p.z + (R() < 0.5 ? -1 : 1) * (20 + R() * 20), Math.min(line[1], line[2]), Math.max(line[1], line[2])); n.tz = n.z; n.obj.position.z = n.z; }
      }
    }
  }

  // ---- talk: a role line in the card and the real job on the profile ----
  const _card = People.card.bind(People);
  People.card = function (n) {
    const base = _card(n);
    if (!n.npc27 || !ROLES[n.role]) return base;
    const r = ROLES[n.role];
    if (!n._line || n._lineDay !== S.day) { n._line = U.pick(r.lines); n._lineDay = S.day; }
    return base + `<p class="lead">${r.i} ${esc(r.job)} · “${esc(n._line)}”</p>`;
  };

  // ---- never saved or left behind: strip the crowd before saving and when a city is left ----
  window.Npc27 = { ROLES, manage: () => manage.call(Npc27), make, ctx, count: () => G.npcs.filter(n => n.npc27).length, clear: () => G.npcs.filter(n => n.npc27).forEach(remove) };
  setInterval(() => { try { Npc27.manage(); } catch (e) { console.error('npc27', e); } }, 2500);
});
