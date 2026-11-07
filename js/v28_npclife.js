'use strict';
// ---------- v28: villagers and town pedestrians live by the calendar ----------
// Festival / public-holiday days: villagers go to the matching temple, mosque, church, shrine or the plaza and wear a garland;
// rain and storms send people under cover; at night most of the people still outside stand still. Speech cards mention the day.
// Town pedestrians (Npc27) get a home -> work/school -> lunch -> home day, no students or office workers on holidays, and a
// watchdog that un-sticks anyone who stops moving. Everything is throttled (1 s) and reuses shared geometry.
V23.add('v28_npclife', () => {
  const R = Math.random, clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const hourNow = () => S.time / 60;
  const wetNow = () => { const w = S.weather && S.weather.type; return w === 'rain' || w === 'storm'; };
  const evNow = () => { try { return (typeof Cal24 !== 'undefined' && Cal24.event()) || null; } catch (e) { return null; } };
  const holNow = () => { try { return typeof Cal24 !== 'undefined' && Cal24.isHoliday(); } catch (e) { return false; } };

  // ---- places a villager can go to on a festival day / in the rain ----
  const plaza = () => ({ x: -28 + (R() - 0.5) * 16, z: -265 + (R() - 0.5) * 16 });
  const temple = () => { const T = typeof TEMPLE !== 'undefined' ? TEMPLE : { x: -24, z: -325 }; return { x: T.x + 2 + R() * 9, z: T.z - 5 + R() * 10 }; };
  function siteFor(rel) {
    if (rel === 'buddhist' || !rel) return temple();
    const S0 = window.Fest24 && Fest24.SITES ? Fest24.SITES.find(s => s.rel === rel) : null;
    return S0 ? { x: S0.x + (R() - 0.5) * 8, z: S0.z + (R() - 0.5) * 10 } : temple();
  }
  const SHELTERS = () => {
    const T = typeof TEMPLE !== 'undefined' ? TEMPLE : { x: -24, z: -325 };
    return [{ x: 13.5, z: -252 }, { x: T.x + 6, z: T.z }, { x: -28, z: -255 }, { x: 8, z: -262 }];
  };

  // ---- villagers: the schedule hook (called whenever a villager is idle and picks where to walk) ----
  const _sched = Social2.sched.bind(Social2);
  function villagerPlan(n) {
    const h = hourNow(), ev = evNow(), hol = holNow();
    if (wetNow() && h >= 6 && h < 22 && R() < 0.75) { const s = SHELTERS(); const p = s[(R() * s.length) | 0]; n._sched = { x: p.x + (R() - 0.5) * 3, z: p.z + (R() - 0.5) * 3 }; n.doing = 'หลบฝนใต้ชายคา'; return true; }
    if (ev && h >= 7 && h < 21 && R() < (hol ? 0.65 : 0.5)) {
      const p = R() < 0.7 ? siteFor(ev.rel) : plaza();
      n._sched = p; n.doing = `ไปร่วม${ev.n}`; return true;
    }
    if ((h >= 19.5 || h < 6) && R() < 0.55) { n._sched = { x: n.x, z: n.z }; n.doing = 'ยืนพักอยู่กับที่'; return true; }
    return false;
  }

  // ---- town pedestrians: home end -> work/school end -> lunch in the middle -> home ----
  function townPlan(n) {
    const L = n.line; if (!L) return false;
    const zmin = Math.min(L[1], L[2]), zmax = Math.max(L[1], L[2]), mid = (zmin + zmax) / 2, half = (zmax - zmin) / 2;
    if (n.v28h == null) { const a = R() < 0.5; n.v28h = a ? zmin + 3 : zmax - 3; n.v28w = a ? zmax - 3 : zmin + 3; n.v28s = mid + (R() - 0.5) * half; }
    const h = hourNow(), at = (zc, sp) => clampN(zc + (R() - 0.5) * 2 * sp, zmin, zmax);
    let z, doing;
    if (wetNow()) { z = at(mid, 6); doing = 'หลบฝนใต้ชายคาร้านค้า'; }
    else switch (n.role) {
      case 'office':
        if (h < 8.5) { z = at(n.v28w, 2); doing = 'เดินไปทำงาน'; }
        else if (h < 12) { z = at(n.v28w, 5); doing = 'ทำงานแถวออฟฟิศ'; }
        else if (h < 13.5) { z = at(mid, 6); doing = 'ไปกินข้าวกลางวัน'; }
        else if (h < 17.5) { z = at(n.v28w, 5); doing = 'ทำงานแถวออฟฟิศ'; }
        else if (h < 19) { z = at(mid, 8); doing = 'แวะซื้อของหลังเลิกงาน'; }
        else { z = at(n.v28h, 3); doing = 'เดินกลับบ้าน'; }
        break;
      case 'student':
        if (h < 8) { z = at(n.v28w, 2); doing = 'เดินไปโรงเรียน/มหาวิทยาลัย'; }
        else if (h < 11.5) { z = at(n.v28w, 5); doing = 'อยู่แถวสถานศึกษา'; }
        else if (h < 13) { z = at(mid, 6); doing = 'ไปกินข้าวกลางวัน'; }
        else if (h < 15) { z = at(n.v28w, 5); doing = 'อยู่แถวสถานศึกษา'; }
        else if (h < 17.5) { z = at(mid, 10); doing = 'เดินเล่นหลังเลิกเรียน'; }
        else { z = at(n.v28h, 3); doing = 'เดินกลับบ้าน'; }
        break;
      case 'vendor':
        if (h >= 20) { z = at(n.v28h, 3); doing = 'เก็บของกลับบ้าน'; }
        else { z = at(n.v28s, 3); doing = 'ขายของที่แผง'; }
        break;
      case 'rider':
        z = (h >= 11 && h < 14) || (h >= 17 && h < 21) ? at(mid, half) : at(mid, half * 0.7); doing = 'วิ่งส่งอาหาร'; break;
      default:
        z = at(mid, half * 0.8); doing = 'เดินเที่ยวชมเมือง';
    }
    n._sched = { x: L[0] + (R() - 0.5) * 0.8, z }; n.doing = doing; return true;
  }

  Social2.sched = function (n) {
    try {
      if (n.npc27) return townPlan(n);
      if (n.fixed || n.keeper || n.staff || n.townRes || n.x > 100) return _sched(n);
      const r = Social.st();
      if (n.single && r.partner === n.name && r.stage === 'married') return _sched(n);
      if (villagerPlan(n)) return true;
    } catch (e) { console.error('v28 sched', e); }
    return _sched(n);
  };

  // ---- festival garland on everyone visible (one shared torus, one material per colour) ----
  const RING = new THREE.TorusGeometry(0.2, 0.045, 6, 14), mats = {};
  const GCOL = { buddhist: 0xffb300, muslim: 0x2e9e4a, christian: 0xd32f2f, chinese: 0xe53935, hindu: 0xff7043 };
  const ringMat = c => mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  function applyDress() {
    const ev = evNow(), key = ev && (ev.hol || ev.fx) ? ev.k : '';
    const col = ev ? (GCOL[ev.rel] || 0xffb300) : 0;
    const P = G.player && G.player.pos; if (!P) return;
    for (const n of G.npcs) {
      if (n._fk === key) continue;
      if (n._fz) { n.obj.remove(n._fz); n._fz = null; }
      if (!key) { n._fk = key; continue; }
      if (!n.obj.visible || n.staff && n.name === 'หลวงพ่อสมปอง') continue;   // out of view: dressed when they come back
      const m = new THREE.Mesh(RING, ringMat(col)); m.rotation.x = Math.PI / 2; m.position.y = 1.36; m.scale.set(1, 1, 1.4);
      n.obj.add(m); n._fz = m; n._fk = key;
    }
  }

  // ---- town pedestrians: calendar-aware crowd (replaces v27's manage; same make/ctx) ----
  function weights(h) {
    if (h < 6 || h >= 21.5) return null;
    const inR = (a, b) => h >= a && h < b, hol = holNow(), ev = evNow(), wet = wetNow();
    const w = {
      rider: inR(11, 14) || inR(17, 21) ? 3 : 0.7,
      student: inR(6.5, 8.5) || inR(15, 17.5) ? 3 : inR(11, 13) ? 1 : 0,
      office: inR(7, 9) || inR(12, 13.5) || inR(17, 19) ? 3 : inR(9, 12) || inR(13.5, 17) ? 0.8 : 0.3,
      vendor: inR(6, 20) ? 2 : 0.3,
      tourist: inR(9, 18) ? 2 : inR(18, 21.5) ? 1 : 0,
    };
    if (hol) { w.student = 0; w.office = 0; }
    if (ev) { w.vendor *= hol ? 2 : 1.8; w.tourist *= hol ? 2 : 1.6; }
    if (wet) { w.tourist *= 0.3; w.student *= 0.5; w.vendor *= 0.4; w.rider *= 1.5; }
    return w;
  }
  function removeN(n) {
    const i = G.npcs.indexOf(n); if (i >= 0) G.npcs.splice(i, 1);
    if (n.tag) { G.scene.remove(n.tag); n.tag = null; }
    if (UI.talkTo === n) return false;
    World.dyn.remove(n.obj); return true;
  }
  function manage() {
    if (!G.started || G.simulating || G.paused) return;
    const c = Npc27.ctx(), mine = G.npcs.filter(n => n.npc27);
    if (!c) { for (const n of mine) removeN(n); Npc27.cur = null; return; }
    if (Npc27.cur !== c.id) { for (const n of mine) removeN(n); Npc27.cur = c.id; }
    const h = hourNow(), w = weights(h), now = G.npcs.filter(n => n.npc27), p = G.player.pos, KEYS = Object.keys(Npc27.ROLES);
    let total = c.total; if (h >= 19) total = Math.ceil(total * 0.6); if (wetNow()) total = Math.max(1, Math.round(total * 0.7)); if (evNow() && h >= 8) total = Math.round(total * 1.3);
    const want = {}; let sum = 0;
    if (w) for (const k of KEYS) sum += w[k];
    for (const k of KEYS) want[k] = w && sum ? Math.round(total * w[k] / sum) : 0;
    if (w && sum && !KEYS.some(k => want[k]) && total) want[KEYS.reduce((a, b) => (w[b] > w[a] ? b : a))] = 1;
    for (let tot = KEYS.reduce((a, k) => a + want[k], 0); tot > total; tot--) want[KEYS.reduce((a, b) => (want[b] > want[a] ? b : a))]--;
    for (const k of KEYS) {
      const have = now.filter(n => n.role === k);
      if (have.length > want[k]) {
        const far = have.filter(n => Math.hypot(n.x - p.x, n.z - p.z) > 30 || !n.obj.visible)[0];
        if (far) removeN(far);
      } else if (have.length < want[k]) {
        const line = c.lines[(R() * c.lines.length) | 0];
        const n = Npc27.make(k, line);
        if (Math.hypot(n.x - p.x, n.z - p.z) < 14) { n.z = clampN(p.z + (R() < 0.5 ? -1 : 1) * (20 + R() * 20), Math.min(line[1], line[2]), Math.max(line[1], line[2])); n.tz = n.z; n.obj.position.z = n.z; }
      }
    }
  }
  Npc27.manage = manage;

  // ---- watchdog: a town pedestrian that has not moved for ~5 s while walking gets a fresh target ----
  function unstick() {
    for (const n of G.npcs) {
      if (!n.npc27 || !n.obj.visible) continue;
      if (n._lx !== undefined && Math.hypot(n.x - n._lx, n.z - n._lz) < 0.5 && n.st === 'walk' && !(UI.talkTo === n && UI.isOpen())) {
        if ((n._stk = (n._stk || 0) + 1) >= 5) {
          n._stk = 0; n.st = 'idle'; n.timer = 0;
          const L = n.line, zmin = Math.min(L[1], L[2]), zmax = Math.max(L[1], L[2]);
          n.dodge = { x: L[0] + (R() - 0.5) * 1.2, z: clampN(n.z + (R() - 0.5) * 8, zmin, zmax), t: 1.5 };
        }
      } else { n._stk = 0; n._lx = n.x; n._lz = n.z; }
      // pushed well off the pavement line (props, other people): ease back
      if (n.line && Math.abs(n.x - n.line[0]) > 3 && n.st !== 'home') n.x += (n.line[0] - n.x) * 0.4;
    }
  }

  // ---- what people say: one extra line on the talk card ----
  const LINES = {
    buddhist: ['วันนี้วันสำคัญ ไปทำบุญที่วัดมาหรือยัง?', 'ฉันตักบาตรตั้งแต่เช้าเลย ใจเบาสบาย'],
    muslim: ['วันนี้ฉันไปมัสยิดมาแล้ว ขอให้ทุกคนมีแต่ความสุขนะ', 'เตรียมอาหารไว้แบ่งปันเพื่อนบ้านด้วย'],
    christian: ['สุขสันต์วันสำคัญนะ! ไปโบสถ์ด้วยกันไหม?', 'วันนี้ที่โบสถ์มีเสียงเพลงสวยมาก'],
    chinese: ['ไปไหว้ที่ศาลเจ้ามาแล้ว ขอให้โชคดีนะ', 'วันนี้ที่ศาลเจ้าคนเยอะมาก ควันธูปตลบเลย'],
    hindu: ['วันนี้ที่เทวสถานสวยมาก จุดตะเกียงเต็มไปหมด', 'แบ่งขนมหวานให้ด้วยนะ วันนี้วันดี'],
  };
  function dayLine(n) {
    const ev = evNow(), h = hourNow();
    if (wetNow()) return n.doing === 'หลบฝนใต้ชายคา' || n.doing === 'หลบฝนใต้ชายคาร้านค้า' ? 'ฝนตกหนักเลย ขอหลบตรงนี้ก่อน เดี๋ยวก็หยุด' : 'ฝนตกแบบนี้ ระวังลื่นด้วยนะ';
    if (ev) {
      const pool = LINES[ev.rel] || LINES.buddhist, base = pool[Math.abs(strHash(n.name + S.day)) % pool.length];
      return `${ev.i || '🎉'} ${ev.n}${holNow() ? ' (วันหยุด)' : ''} · “${base}”`;
    }
    if (h >= 21 || h < 5) return 'ดึกแล้ว เตรียมตัวนอนได้แล้วนะ';
    return '';
  }
  const _card = People.card.bind(People);
  People.card = function (n) {
    const base = _card(n);
    try {
      if (n.fixed && n.keeper) return base;
      const l = dayLine(n); if (!l) return base;
      return base + `<p class="lead">${esc(l)}</p>`;
    } catch (e) { return base; }
  };

  window.NpcLife28 = { villagerPlan, townPlan, weights, dayLine, applyDress, unstick, wet: wetNow };
  setInterval(() => { if (!G.started || G.simulating) return; try { applyDress(); unstick(); } catch (e) { console.error('v28 npclife', e); } }, 1000);
});
