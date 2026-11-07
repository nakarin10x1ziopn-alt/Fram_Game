'use strict';
// ---------- CCTV you can actually watch: cameras and outdoor switches get a mounting point around the farm,
// cable runs are measured (Ethernet stops at 100 m, so far points need a switch in between), each camera shows
// a live picture rendered from where it hangs (black & white infrared at night), and motion at night raises an
// alert with a saved snapshot you can play back ----------
const MOUNTS = {
  house: { n: 'หน้าบ้าน (มองไปทางไร่)', x: -12, z: -24, y: 3.4, lx: 9, lz: -9 },        // v47: a pole in the front yard with an open view over the farm (it used to look at the porch roof)
  gate: { n: 'ทางเข้าไร่', x: 4, z: -58, y: 3.2, lx: 2, lz: -40 },
  field: { n: 'แปลงผัก', x: 0, z: -14, y: 3.2, lx: 10, lz: -4 },
  pen: { n: 'คอกสัตว์', x: -16, z: 12, y: 3.2, lx: -34, lz: 28 },
  garage: { n: 'โรงจอดรถ', x: -47, z: -43, y: 4.0, lx: -58, lz: -46 },                    // v47: in front of the garage, clear of the trees, sees every bay and the driveway
  orchard: { n: 'สวนผลไม้', x: 28, z: -40, y: 3.2, lx: 38, lz: -28 },
  south: { n: 'ท้ายไร่ (บ้านเช่า)', x: 40, z: 40, y: 3.2, lx: 40, lz: 52 },
  road: { n: 'ปากทางถนนใหญ่ (ไกล)', x: 3, z: -110, y: 4, lx: 0, lz: -140 },
};
const CCTV = {
  spotOf(d) { return MOUNTS[d.spot || 'house']; },
  len(a, b) { return Math.round(Math.hypot(a.x - b.x, a.z - b.z) * 1.15 + 6); },
  // check every cable touching this device after it moves
  ok(site, d, spot) {
    const L = Sec.site(site).dev, me = MOUNTS[spot], wired = x => !DEV[x.k].wifiC && !['sensor', 'hdd'].includes(DEV[x.k].t) && !['isp', 'site', 'solo'].includes(x.p);
    const p = L.find(x => x.uid === d.p); if (p && wired(d)) { const l = this.len(me, this.spotOf(p)); if (l > 100) return `สาย LAN จาก${MOUNTS[p.spot || 'house'].n}ยาว ${l} ม. เกิน 100 ม. (ต้องมีสวิตช์คั่นกลางทาง)`; }
    if (p && DEV[d.k].wifiC && Math.hypot(me.x - this.spotOf(p).x, me.z - this.spotOf(p).z) > 45) return 'ไกลจากตัวปล่อย WiFi เกินไป สัญญาณไม่ถึง';
    for (const k of L.filter(x => x.p === d.uid && wired(x))) { const l = this.len(me, this.spotOf(k)); if (l > 100) return `สายไปยัง ${DEV[k.k].n} จะยาว ${l} ม. เกิน 100 ม.`; }
    return '';
  },
  cycle(site, uid) {
    const d = Sec.site(site).dev.find(x => x.uid === uid); if (!d) return; const keys = Object.keys(MOUNTS); let i = keys.indexOf(d.spot || 'house');
    for (let n = 0; n < keys.length; n++) { i = (i + 1) % keys.length; const e = this.ok(site, d, keys[i]); if (!e) { d.spot = keys[i]; this.draw(); UI.toast(`ย้าย${DEV[d.k].n}ไปที่${MOUNTS[keys[i]].n}`, '📍'); return; } }
    UI.toast('ไม่มีตำแหน่งอื่นที่สายถึง', '📏');
  },
  // small camera / box models at their mounting points
  draw() {
    if (this.g) World.outdoor.remove(this.g); const g = new THREE.Group(); World.outdoor.add(g); this.g = g;
    for (const d of Sec.site('home').dev) {
      const D = DEV[d.k]; if (!(D.t === 'switch' || D.t === 'ap') || !d.spot || d.spot === 'house') continue;      // cameras are drawn by v47_cctv
      const M = MOUNTS[d.spot], y = World.groundY(M.x, M.z);
      if (!g.userData[d.spot]) { g.userData[d.spot] = 1; U.mk(g, GEO.cyl, mc(0x9e9e9e, { metalness: 0.5 }), [M.x, y + M.y / 2, M.z], [0.07, M.y, 0.07]); }
      if (D.t === 'cam') { const c = new THREE.Group(); c.position.set(M.x, y + M.y - 0.15 - (g.userData[d.spot + 'n'] = (g.userData[d.spot + 'n'] || 0) + 1) * 0.25, M.z); c.lookAt(M.lx, y, M.lz); g.add(c); U.mk(c, GEO.box, mc(0xfafafa, { roughness: 0.3 }), [0, 0, 0.12], [0.14, 0.14, 0.32]); U.mk(c, GEO.cyl, mc(0x111111), [0, 0, 0.3], [0.05, 0.03, 0.05], [Math.PI / 2, 0, 0]); }
      else U.mk(g, GEO.box, mc(0xeceff1), [M.x + 0.12, y + 1.4, M.z], [0.12, 0.45, 0.35]);
    }
  },
  // ----- live view -----
  cams() { const st = Sec.status('home'); return Sec.site('home').dev.filter(d => DEV[d.k].t === 'cam' && st.isOn(d)); },
  view(uid) {
    const d = Sec.site('home').dev.find(x => x.uid === uid) || this.cams()[0];
    if (!d) { UI.toast('ยังไม่มีกล้องที่ออนไลน์', '📹'); return; }
    this.vd = d;
    UI.open('ภาพสดกล้องวงจรปิด', null, () => `<p class="lead">${DEV[d.k].i} ${esc(DEV[d.k].n)} · ${MOUNTS[d.spot || 'house'].n} · ${Phone.clock()} ${G.night > 0.5 ? '· โหมดอินฟราเรด' : ''}</p><canvas id="cctvC" width="480" height="270" style="width:100%;background:#000;border-radius:8px"></canvas>
      <div class="row">${this.cams().map(c => `<button class="btn ${c === d ? '' : 'ghost'}" data-a="cctvv" data-v="${c.uid}">${MOUNTS[c.spot || 'house'].n}</button>`).join('')}</div>
      <div class="row"><button class="btn ghost" data-a="cctvalert">${S.sec.alert ? '🔔 แจ้งเตือนกลางคืน: เปิด' : '🔕 แจ้งเตือนกลางคืน: ปิด'}</button><button class="btn ghost" data-a="cctvlog">ย้อนดูเหตุการณ์ (${(this.events || []).length})</button></div>`, { wide: true });
    UI.cur.onClose = () => { this.vd = null; };
  },
  shot(d, w = 480, h = 270) {
    const M = this.spotOf(d), r = G.renderer, y = World.groundY(M.x, M.z);
    if (!this.rt || this.rt.width !== w) { if (this.rt) this.rt.dispose(); this.rt = new THREE.WebGLRenderTarget(w, h, { encoding: THREE.sRGBEncoding }); this.cam = new THREE.PerspectiveCamera(70, w / h, 0.2, 400); this.buf = new Uint8Array(w * h * 4); }
    this.cam.position.set(M.x, y + M.y - 0.3, M.z); this.cam.lookAt(M.lx, y, M.lz);
    // the camera housings themselves must not block their own lenses
    const ins = World.outdoor.visible, cg = this.g, cgv = cg && cg.visible; World.outdoor.visible = true; if (cg) cg.visible = false;
    r.setRenderTarget(this.rt); r.render(G.scene, this.cam); r.setRenderTarget(null); World.outdoor.visible = ins; if (cg) cg.visible = cgv;
    r.readRenderTargetPixels(this.rt, 0, 0, w, h, this.buf);
    const img = new ImageData(w, h), ir = G.night > 0.5;
    for (let row = 0; row < h; row++) for (let x = 0; x < w; x++) { const s = ((h - 1 - row) * w + x) * 4, o = (row * w + x) * 4; let R = this.buf[s], Gg = this.buf[s + 1], B = this.buf[s + 2]; if (ir) { const l = Math.min(255, (R * 0.3 + Gg * 0.59 + B * 0.11) * 2.6 + 18); R = Gg = B = l; } img.data[o] = R; img.data[o + 1] = Gg; img.data[o + 2] = B; img.data[o + 3] = 255; }
    return img;
  },
  update(dt) {
    if (!this.vd || !UI.isOpen()) return; this.t = (this.t || 0) - dt; if (this.t > 0) return; this.t = 0.15;
    const c = document.getElementById('cctvC'); if (!c) return; const g2 = c.getContext('2d'); g2.putImageData(this.shot(this.vd), 0, 0);
    g2.fillStyle = 'rgba(0,0,0,.45)'; g2.fillRect(0, 0, 480, 22); g2.fillStyle = '#fff'; g2.font = '14px monospace'; g2.fillText(`CAM ${this.vd.uid}  ${RD(S.day)}  ${Phone.clock()}  ● REC`, 8, 16);
  },
  // night motion: the thief spawns → alert with a snapshot from the nearest camera
  motion(x, z) {
    const cams = this.cams(); if (!cams.length) return;
    const d = cams.slice().sort((a, b) => Math.hypot(this.spotOf(a).x - x, this.spotOf(a).z - z) - Math.hypot(this.spotOf(b).x - x, this.spotOf(b).z - z))[0];
    try { const img = this.shot(d, 240, 135), c = document.createElement('canvas'); c.width = 240; c.height = 135; c.getContext('2d').putImageData(img, 0, 0); (this.events = this.events || []).unshift({ t: `${RD(S.day)} ${Phone.clock()}`, at: MOUNTS[d.spot || 'house'].n, src: c.toDataURL('image/jpeg', 0.7) }); this.events.length = Math.min(this.events.length, 8); } catch (e) { }
    if (S.sec.alert) { Phone.msg('กล้องวงจรปิด', `⚠️ ตรวจพบความเคลื่อนไหวที่${MOUNTS[d.spot || 'house'].n} ${Phone.clock()} เปิดดูภาพสดในแอปได้เลย`, true); UI.toast('กล้องตรวจพบคนแปลกหน้าในไร่!', '📹'); Sfx.tone(880, 0.2, 'square', 0.05); }
  },
  logUI() { UI.open('ย้อนดูเหตุการณ์', null, () => (this.events || []).length ? `<div class="grid">${this.events.map(e => `<div class="card"><div class="cb"><img src="${e.src}" style="width:100%;border-radius:6px"><h4>${e.t}</h4><p class="dim">${e.at}</p></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีเหตุการณ์ที่บันทึก (กล้องจะเก็บภาพเมื่อมีคนแปลกหน้าเข้าไรตอนกลางคืน)</p>', { wide: true }); },
  init() {
    this.draw();
    const _sp = Emergency.spawnThief.bind(Emergency); Emergency.spawnThief = ripe => { _sp(ripe); const th = Emergency.thief; if (th) this.motion(th.x, th.z); };
    const _in = Sec.install.bind(Sec); Sec.install = (site, k, parent) => { const e = _in(site, k, parent); if (!e && site === 'home') { const d = Sec.site('home').dev.at(-1); d.spot = 'house'; const p = Sec.site('home').dev.find(x => x.uid === parent); if (p && p.spot) d.spot = p.spot; this.draw(); } return e; };
    const _rm = Sec.remove.bind(Sec); Sec.remove = (site, uid) => { _rm(site, uid); if (site === 'home') this.draw(); };
    // the planner shows where each device hangs and lets you move it
    const _ui = Sec.ui.bind(Sec); Sec.ui = (site = 'home') => { _ui(site); if (site !== 'home') return; const r = UI.cur.render; UI.cur.render = t => r(t).replace(/data-a="secrm" data-v="(d\d+)">ถอด<\/button>/g, (m, uid) => { const d = Sec.site('home').dev.find(x => x.uid === uid), D = d && DEV[d.k]; return m + (D && (D.t === 'cam' || D.t === 'switch' || D.t === 'ap' || D.wifiC) ? ` <button class="btn ghost" data-a="cctvmove" data-v="${uid}">📍 ${MOUNTS[d.spot || 'house'].n}</button>` : ''); }) + `<div class="row"><button class="btn" data-a="cctvv">📺 ดูภาพสดกล้อง</button></div>`; UI.renderBody(); };
    Phone.apps.cctv = (orig => () => { setTimeout(() => { if (Phone.app === 'cctv') { Phone.app = null; UI.close(); this.view(); } }, 0); return ''; })(Phone.apps.cctv);
  },
};
Object.assign(UI.H, { cctvmove: d => CCTV.cycle('home', d.v), cctvv: d => { UI.close(); CCTV.view(d.v); }, cctvalert: () => { S.sec.alert = S.sec.alert ? 0 : 1; }, cctvlog: () => { UI.close(); CCTV.logUI(); } });
