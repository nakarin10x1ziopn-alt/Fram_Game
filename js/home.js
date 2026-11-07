'use strict';
// ---------- Home appliances that do something: air-con, fan, radio, game console, washer, exercise bike, TV channels ----------
const Home = {
  // called from World.buildInterior with the room helpers
  place(W, has, placeK, w, d) {
    const act = (icon, label, fn) => ({ kind: 'act', icon, label, act: () => ({ icon, label, fn }) });
    if (has('aircon')) placeK('aircon', this.m.aircon(), W.lay.aircon[0], W.lay.aircon[1], 0);
    if (has('aircon')) W.inPois.push(Object.assign({ x: IN.x + W.lay.aircon[0], z: IN.z + W.lay.aircon[1] + 0.9, r: 1.1 }, act('❄️', S.ac ? 'ปิดแอร์' : 'เปิดแอร์ (นอนสบาย ค่าประสบการณ์ +20% พรุ่งนี้)', () => { S.ac = !S.ac; Sfx.click(); UI.toast(S.ac ? 'เปิดแอร์แล้ว เย็นสบาย ค่าไฟวันละ 30 ฿' : 'ปิดแอร์แล้ว', '❄️'); World.buildInterior(S.up.house, S); World.interior.visible = true; })));
    Smart.place(W, has, placeK, w, d);
    { const owned = Object.keys(FURN).filter(k => FURN[k].decor && has(k)); if (owned.length) { const c = new THREE.Group(), m = mc(0x6d4c41, { roughness: 0.6 }); U.mk(c, GEO.box, m, [0, 0.9, 0], [1.6, 1.8, 0.45]); for (let r = 0; r < 3; r++) U.mk(c, GEO.box, mc(0xd7ccc8), [0, 0.35 + r * 0.55, 0.05], [1.5, 0.04, 0.4]); owned.slice(0, 12).forEach((k, i) => { const sp = U.sprite(FURN[k].i, 0.34, false); sp.position.set(-0.55 + (i % 4) * 0.37, 0.55 + Math.floor(i / 4) * 0.55, 0.12); c.add(sp); }); placeK('d_cabinet', c, w / 2 - 0.3, 0.9, -Math.PI / 2, 0.25, 0.8); } }
    if (has('fan')) placeK('fan', this.m.fan(), W.lay.fan[0], W.lay.fan[1], 0, 0.2, 0.2, act('🌀', 'เปิดพัดลมก่อนนอน', () => { S.fanOn = !S.fanOn; UI.toast(S.fanOn ? 'เปิดพัดลมแล้ว นอนสบายขึ้น (ค่าประสบการณ์ +10% พรุ่งนี้)' : 'ปิดพัดลม', '🌀'); }));
    if (has('radio')) placeK('radio', this.m.radio(), W.lay.radio[0], W.lay.radio[1], W.lay.radio[2], 0.2, 0.2, act('📻', 'เปิด/ปิดวิทยุ', () => { S.music = S.music === false; Music.setOn(S.music !== false); UI.toast(S.music === false ? 'ปิดวิทยุ' : 'เปิดวิทยุ: เพลงลูกทุ่งคลอเบา ๆ', '📻'); }));
    if (has('console')) placeK('console', this.m.console(), W.lay.console[0], W.lay.console[1], 0, 0.25, 0.2, act('🎮', 'เล่นเกม 1 ชั่วโมง (พลังงาน +15 วันละครั้ง)', () => this.game()));
    if (has('washer')) placeK('washer', this.m.washer(), W.lay.washer[0], W.lay.washer[1], W.lay.washer[2], 0.35, 0.35, act('🧺', 'ซักผ้า (เสื้อผ้าสะอาด คุยถูกใจได้หัวใจ +25% วันนี้)', () => this.wash()));
    if (has('bike')) placeK('bike', this.m.bike(), W.lay.bike[0], W.lay.bike[1], W.lay.bike[2], 0.3, 0.6, act('🚴', 'ปั่นจักรยาน 30 นาที (พลังงานสูงสุด +1 ถาวร วันละครั้ง)', () => this.exercise()));
  },
  m: {
    aircon() { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0xf5f5f5, { roughness: 0.4 }), [0, 2.35, 0], [1.1, 0.32, 0.22]); U.mk(g, GEO.box, mc(0x90a4ae), [0, 2.24, 0.1], [0.95, 0.04, 0.04]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: S.ac ? 0x40c4ff : 0x555555 }), [0.45, 2.42, 0.115], [0.04, 0.03, 0.01]); return g; },
    fan() { const g = new THREE.Group(), w = mc(0xeceff1); U.mk(g, GEO.cyl, w, [0, 0.03, 0], [0.22, 0.06, 0.22]); U.mk(g, GEO.cylLo, w, [0, 0.55, 0], [0.025, 1.0, 0.025]); U.mk(g, GEO.cyl, mc(0x4fc3f7, { roughness: 0.3 }), [0, 1.1, 0.05], [0.26, 0.04, 0.26], [Math.PI / 2, 0, 0]); U.mk(g, GEO.sph, w, [0, 1.1, -0.04], 0.08); return g; },
    radio() { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0x8d6e63, { roughness: 0.6 }), [0, 0.95, 0], [0.42, 0.26, 0.16]); U.mk(g, GEO.cyl, mc(0x3e2723), [-0.08, 0.95, 0.081], [0.08, 0.01, 0.08], [Math.PI / 2, 0, 0]); U.mk(g, GEO.box, mc(0xffe082), [0.12, 0.98, 0.081], [0.12, 0.06, 0.01]); U.mk(g, GEO.box, mc(0x6d4c41), [0, 0.42, 0], [0.5, 0.84, 0.3]); return g; },
    console() { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0x212121, { roughness: 0.3 }), [0, 0.12, 0], [0.38, 0.08, 0.26]); U.mk(g, GEO.box, mc(0x37474f), [0.3, 0.1, 0.2], [0.14, 0.04, 0.09]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x40c4ff }), [-0.12, 0.165, 0.131], [0.08, 0.01, 0.005]); return g; },
    washer() { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0xfafafa, { roughness: 0.35 }), [0, 0.45, 0], [0.6, 0.9, 0.6]); U.mk(g, GEO.cyl, mc(0x90caf9, { roughness: 0.1 }), [0, 0.45, 0.3], [0.2, 0.02, 0.2], [Math.PI / 2, 0, 0]); U.mk(g, GEO.box, mc(0x607d8b), [0, 0.82, 0.3], [0.5, 0.08, 0.01]); return g; },
    bike() { const g = new THREE.Group(), k = mc(0x263238, { roughness: 0.4 }); U.mk(g, GEO.box, k, [0, 0.05, 0], [0.4, 0.1, 1.1]); U.mk(g, GEO.cyl, mc(0xd32f2f), [0, 0.35, 0.35], [0.25, 0.08, 0.25], [0, 0, Math.PI / 2]); U.mk(g, GEO.cylLo, k, [0, 0.55, -0.2], [0.04, 1.0, 0.04]); U.mk(g, GEO.box, mc(0x111111), [0, 1.05, -0.22], [0.26, 0.06, 0.32]); U.mk(g, GEO.cylLo, k, [0, 0.8, 0.4], [0.03, 0.8, 0.03]); U.mk(g, GEO.box, k, [0, 1.2, 0.42], [0.5, 0.04, 0.04]); return g; },
  },
  game() {
    if (S.powerOff) { UI.toast('ไฟถูกตัด ชำระค่าไฟในแอปธนาคารก่อน', '⚡'); return; }
    if (S.daily.game) { UI.toast('วันนี้เล่นเกมไปแล้ว พักสายตาบ้างนะ', '🎮'); return; }
    S.daily.game = 1; fade(() => { tick(60); S.energy = Math.min(maxEnergy(), S.energy + 15); UI.toast(U.pick(['ชนะบอสด่านสุดท้าย! ', 'แข่งรถในเกมได้ที่ 1! ', 'ปลูกผักในเกมฟาร์มอีกที ฮา ๆ ']) + 'พลังงาน +15', '🎮'); });
  },
  wash() {
    if (S.daily.wash) { UI.toast('ซักผ้าไปแล้ววันนี้', '🧺'); return; }
    S.daily.wash = 1; (S.buff = S.buff || {}).clean = S.day; Sfx.water(); UI.toast('เสื้อผ้าสะอาดหอมกรุ่น! คุยกับใครวันนี้ได้หัวใจเพิ่ม 25%', '🧺');
  },
  exercise() {
    if (S.daily.bike) { UI.toast('ออกกำลังกายไปแล้ววันนี้', '🚴'); return; }
    if (!useEnergy(10)) return;
    S.daily.bike = 1; S.fit = Math.min(30, (S.fit || 0) + 1); fade(() => { tick(30); UI.toast(`ปั่นจักรยานเสร็จ! พลังงานสูงสุด +1 (สะสม ${S.fit}/30)`, '🚴'); });
  },
  // TV now has channels
  tv() {
    if (S.powerOff) { UI.toast('ไฟถูกตัด ชำระค่าไฟในแอปธนาคารก่อน', '⚡'); return; }
    UI.open('ทีวี · เลือกช่อง', null, () => {
      const n = WEATHER[S.weather.next], h = hotCrops().map(k => `${CROPS[k].i} ${CROPS[k].n} ${baht(priceOf(k))}`).join(' · ');
      return `<div class="grid">
        <div class="card"><div class="ci">📰</div><div class="cb"><h4>ข่าวเกษตรช่อง 3</h4><p class="dim">พรุ่งนี้: ${n.i} ${n.n} · ราคาเด่นวันนี้ ${h}</p></div></div>
        <div class="card"><div class="ci">👩‍🍳</div><div class="cb"><h4>รายการครัวคุณป้า</h4><p class="dim">เมนูวันนี้: ${(() => { const k = Object.keys(RECIPES)[S.day % Object.keys(RECIPES).length], R_ = RECIPES[k]; return `${R_.i} ${R_.n} ใช้ ${Object.keys(R_.need).map(x => ITEMS[x].i + R_.need[x]).join(' ')} ขาย ${baht(R_.sell)}`; })()}</p></div></div>
        <div class="card"><div class="ci">🎭</div><div class="cb"><h4>ละครหลังข่าว</h4><p class="dim">ดูแล้วผ่อนคลาย พลังงาน +8 (วันละครั้ง)</p><div class="row"><button class="btn" data-a="tvdrama" ${S.daily.drama ? 'disabled' : ''}>ดูละคร 1 ชม.</button></div></div></div>
        <div class="card"><div class="ci">⚽</div><div class="cb"><h4>ช่องกีฬา</h4><p class="dim">สถิติแข่งรถดีที่สุดของคุณ: ${S.contest && S.contest.best.race ? S.contest.best.race.toFixed(2) + ' วิ' : 'ยังไม่มี'} · ชนะการแข่งขันแล้ว ${S.contest ? S.contest.wins : 0} ครั้ง</p></div></div></div>`;
    });
  },
  // morning effects of a good night's sleep
  wake() {
    if (S.ac && S.furn.aircon) { S.money = Math.max(0, S.money - 30); (S.buff = S.buff || {}).xp = { day: S.day, k: 1.2 }; }
    else if (S.fanOn && S.furn.fan) (S.buff = S.buff || {}).xp = { day: S.day, k: 1.1 };
  },
};
UI.H.tvdrama = () => { S.daily.drama = 1; UI.close(); fade(() => { tick(60); S.energy = Math.min(maxEnergy(), S.energy + 8); UI.toast('ละครสนุกมาก ลุ้นตอนต่อไป! พลังงาน +8', '🎭'); }); };
