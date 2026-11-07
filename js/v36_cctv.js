'use strict';
// ---------- v36 CCTV: mounting angle, lens and viewing zone like a real installer sets them (with a coverage / blind-spot / night-IR rating),
// pan-tilt-zoom pad in the live view (PTZ cameras) and technician / on-site re-aiming for fixed cameras,
// and cameras that really go dark: power cut (UPS runtime), internet cut or suspended (cloud / WiFi cameras and push alerts), with gaps kept in the recording log ----------
V23.add('v36_cctv', () => {
  if (typeof CCTV === 'undefined' || typeof Sec === 'undefined') return;
  const st = () => { if (!S.v36c) S.v36c = { pose: {}, gaps: [], rec: {}, out: 0, missed: 0, tech: {} }; const s = S.v36c; if (!s.pose) s.pose = {}; if (!s.gaps) s.gaps = []; if (!s.rec) s.rec = {}; if (!s.tech) s.tech = {}; return s; };
  const now = () => S.day * 1440 + S.time;
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dev = uid => Sec.site('home').dev.find(x => x.uid === uid);
  const netUp = () => { try { return ISP.speed() > 0; } catch (e) { return false; } };

  // ----- mounting types and lenses -----
  const MT = {
    corner: { n: 'มุมบ้าน/มุมผนัง', h: 3.0, note: 'ติดสูง 3 ม. มองได้ไกล ปลอดภัยจากการงัด' },
    pole: { n: 'เสาสูง', h: 4.5, note: 'ติดบนเสา 4.5 ม. มองกว้างสุด แต่มุมใต้เสาอับ' },
    eave: { n: 'ใต้ชายคา', h: 2.6, note: 'กันฝนกันแดด ภาพชัดใกล้ แต่ถูกมือเอื้อมถึงได้' },
    ceil: { n: 'เพดานในร่ม', h: 2.5, note: 'ติดเพดานห้อง เหมาะกล้องในบ้าน' },
  };
  const LENS = {
    wide: { n: 'มุมกว้าง 110°', fov: 110 },
    std: { n: 'มาตรฐาน 90°', fov: 90 },
    tele: { n: 'เทเล 62° (ไกลชัด)', fov: 62 },
    fish: { n: 'ฟิชอาย 360° (ติดเพดาน ดู 4 ทิศ)', fov: 125, fish: 1 },
    ptz: { n: 'PTZ ซูมได้ (60° ที่ 1×)', fov: 60, ptz: 1 },
  };
  const ZOOMS = [1, 2, 4, 8, 15, 25];
  // night infrared / colour-light range (m) and sensor megapixels per camera model
  const SPEC = {
    cam_b2: { ir: 25, mp: 2 }, cam_d4: { ir: 30, mp: 4 }, cam_8k: { ir: 40, mp: 8 }, cam_ptz: { ir: 100, mp: 4 },
    cam_wifi: { ir: 8, mp: 2 }, cam_4g: { ir: 15, mp: 2 }, cam_ahd: { ir: 20, mp: 2 },
  };
  const spec = d => SPEC[d.k] || { ir: 15, mp: 2 };
  const isPTZ = d => d.k === 'cam_ptz';
  const lensOk = d => isPTZ(d) ? ['ptz'] : d.k === 'cam_wifi' ? ['wide', 'std', 'fish'] : ['wide', 'std', 'tele'];
  const mtOk = d => d.k === 'cam_wifi' ? ['ceil', 'eave', 'corner'] : ['corner', 'pole', 'eave'];

  function defPose(d) { return { mt: d.k === 'cam_wifi' ? 'ceil' : 'corner', lens: isPTZ(d) ? 'ptz' : 'std', zone: '', yo: 0, po: 0, zoom: 1 }; }
  function P(d) {
    const s = st(); let p = s.pose[d.uid]; if (!p) p = s.pose[d.uid] = defPose(d);
    if (!lensOk(d).includes(p.lens)) p.lens = lensOk(d)[0]; if (!mtOk(d).includes(p.mt)) p.mt = mtOk(d)[0];
    return p;
  }
  // camera position, direction and rating
  function pose(d) {
    const p = P(d), M = CCTV.spotOf(d), g = World.groundY(M.x, M.z), h = (M.mv && M.y > 0.3) ? M.y : MT[p.mt].h, camY = g + h;   // a camera moved with the mover hangs at the height it was placed at
    const Z = p.zone && MOUNTS[p.zone] ? MOUNTS[p.zone] : M, tx = Z.lx, tz = Z.lz;
    const dist0 = Math.max(4, Math.hypot(tx - M.x, tz - M.z)), pitDef = Math.atan2(camY - World.groundY(tx, tz), dist0) / D2R;
    const lens = LENS[p.lens], zoom = lens.ptz ? p.zoom : 1;
    const pitch = clamp(pitDef + p.po, isPTZ(d) ? -30 : 4, 89);
    const yaw = Math.atan2(tx - M.x, tz - M.z) + p.yo * D2R;
    const fov = clamp(lens.fov / zoom, 2.4, 140), vfov = 2 * Math.atan(Math.tan(fov * D2R / 2) * 9 / 16) / D2R;
    // where the centre ray lands on the ground, how wide the picture is there, and the dead zone under the camera
    const dist = h / Math.tan(Math.max(3, pitch) * D2R), slant = h / Math.sin(Math.max(3, pitch) * D2R), width = 2 * slant * Math.tan(fov * D2R / 2);
    const blind = h / Math.tan(Math.min(89, pitch + vfov / 2) * D2R);
    return { x: M.x, z: M.z, y: camY, yaw, pitch, fov, vfov, dist, width, blind, h, zoom, p, ir: spec(d).ir };
  }
  function rate(d) {
    const o = pose(d), sp = spec(d), ppm = Math.sqrt(sp.mp * 1e6 * 16 / 9) / Math.max(0.5, o.width);
    let score = 100; const notes = [];
    if (o.blind > 3) { score -= Math.min(30, (o.blind - 3) * 5); notes.push(`จุดอับใต้กล้องรัศมี ${o.blind.toFixed(1)} ม.`); }
    if (o.dist > o.ir) { score -= 22; notes.push(`กลางคืนไกลเกินอินฟราเรด (${o.ir} ม.) ภาพมืด`); }
    if (ppm < 62) { score -= 22; notes.push('ภาพไกล/กว้างเกิน เห็นเป็นเงาเล็กๆ'); } else if (ppm < 125) { score -= 8; notes.push('พอสังเกตได้ แต่ดูหน้าไม่ชัด'); }
    if (o.h < 2.6) { score -= 6; notes.push('ติดต่ำ มือเอื้อมถึงได้'); }
    if (o.width < 3) { score -= 14; notes.push('มุมแคบมาก ครอบคลุมพื้นที่น้อย'); }
    const lvl = ppm >= 250 ? 'ระบุตัวตนได้' : ppm >= 125 ? 'จำแนกคนได้' : ppm >= 62 ? 'สังเกตเหตุการณ์ได้' : 'ตรวจจับได้เท่านั้น';
    if (window.Cam47) { const oc = Cam47.occ(d, o); if (oc.frac > 0.12) { score -= Math.min(40, Math.round(oc.frac * 70)); notes.push(`มีสิ่งบังหน้ากล้อง ${Math.round(oc.frac * 100)}% (อาคาร/ต้นไม้) ลอง “ตั้งมุมอัตโนมัติ”`); } }
    score = clamp(Math.round(score), 0, 100);
    return { score, label: score >= 80 ? 'ดีมาก' : score >= 60 ? 'ดี' : score >= 40 ? 'พอใช้' : 'ควรปรับมุม', ppm: Math.round(ppm), lvl, notes, o, night: o.dist <= o.ir };
  }
  CCTV.pose = pose; CCTV.rate = rate;

  // ----- rendering from the real pose -----
  // The picture is rendered at 960x540 with anti-aliasing and finished like a real camera: slight contrast and colour grading, lens vignette, sensor noise; at night the monochrome
  // infrared image with the typical bright centre (IR LED hot spot) and heavier grain. Cached tables keep it cheap.
  CCTV.shot = function (d, w = 960, h = 540) {
    const o = pose(d), r = G.renderer;
    if (!this.rt || this.rt.width !== w || this.rt.height !== h) {
      if (this.rt) this.rt.dispose();
      const opt = { encoding: THREE.sRGBEncoding };
      this.rt = (r.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) ? new THREE.WebGLMultisampleRenderTarget(w, h, opt) : new THREE.WebGLRenderTarget(w, h, opt);
      this.cam = new THREE.PerspectiveCamera(70, w / h, 0.2, 400); this.buf = new Uint8Array(w * h * 4);
      const vg = new Float32Array(w * h), ht = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const nx = x / w * 2 - 1, ny = y / h * 2 - 1, rr = nx * nx * 0.8 + ny * ny * 1.2; vg[y * w + x] = Math.max(0.6, 1 - rr * 0.2); ht[y * w + x] = Math.max(0.55, 1.12 - rr * 0.5); }
      this.vg = vg; this.ht = ht; this.noise = new Int8Array(8192); for (let i = 0; i < 8192; i++) this.noise[i] = ((Math.random() + Math.random() + Math.random() - 1.5) * 8) | 0;
    }
    const c = this.cam; c.fov = 2 * Math.atan(Math.tan(o.fov * D2R / 2) * (h / w)) / D2R; c.aspect = w / h; c.near = o.fov < 12 ? 1 : 0.3; c.far = 2400; c.updateProjectionMatrix();
    c.position.set(o.x, o.y, o.z);
    const cp = Math.cos(o.pitch * D2R); c.lookAt(o.x + Math.sin(o.yaw) * cp * 10, o.y - Math.sin(o.pitch * D2R) * 10, o.z + Math.cos(o.yaw) * cp * 10);
    const ins = World.outdoor.visible, cg = this.g, cgv = cg && cg.visible; World.outdoor.visible = true; if (cg) cg.visible = false;
    // the sky dome and the stars follow the player's camera: bring them to the lens for this picture, otherwise the sky is empty black
    const sk = this.skyObjs || (this.skyObjs = G.scene.children.filter(x => (x.isMesh && x.renderOrder === -10) || x.isPoints)), sv = sk.map(x => x.position.clone()); sk.forEach(x => x.position.copy(c.position));
    r.setRenderTarget(this.rt); r.render(G.scene, c); r.setRenderTarget(null); World.outdoor.visible = ins; if (cg) cg.visible = cgv; sk.forEach((x, i) => x.position.copy(sv[i]));
    r.readRenderTargetPixels(this.rt, 0, 0, w, h, this.buf);
    const img = new ImageData(w, h), out = img.data, buf = this.buf, vg = this.vg, ht = this.ht, nz = this.noise, ir = G.night > 0.5, gain = ir ? clamp(o.ir / Math.max(6, o.dist), 0.3, 1.15) : 1;
    let ni = (Math.random() * 8000) | 0; const amp = ir ? 1.5 : 0.7;
    for (let row = 0; row < h; row++) {
      let s = (h - 1 - row) * w * 4, p = row * w * 4, vi = row * w;
      for (let x = 0; x < w; x++, s += 4, p += 4, vi++) {
        let R = buf[s], Gg = buf[s + 1], B = buf[s + 2]; const n = nz[(ni = (ni + 7) & 8191)] * amp;
        if (ir) { const l = Math.min(255, ((R * 0.3 + Gg * 0.59 + B * 0.11) * 2.6 + 18) * gain * ht[vi]) + n; R = Gg = B = l; }
        else { const l = R * 0.3 + Gg * 0.59 + B * 0.11, v = vg[vi]; R = ((l + (R - l) * 0.9 - 128) * 1.07 + 128) * v * 1.02 + n; Gg = ((l + (Gg - l) * 0.9 - 128) * 1.07 + 128) * v + n; B = ((l + (B - l) * 0.9 - 128) * 1.07 + 128) * v * 0.97 + n; }
        out[p] = R < 0 ? 0 : R > 255 ? 255 : R; out[p + 1] = Gg < 0 ? 0 : Gg > 255 ? 255 : Gg; out[p + 2] = B < 0 ? 0 : B > 255 ? 255 : B; out[p + 3] = 255;
      }
    }
    return img;
  };

  // ----- what keeps a camera alive (power, UPS runtime, internet) -----
  const upsInfo = () => { const L = Sec.site('home').dev, X = window.PCAcc176 ? PCAcc176.shared() : { va: 0, w: 0 }, va = L.filter(d => DEV[d.k].t === 'ups').reduce((s, d) => s + DEV[d.k].va, 0) + X.va, w = Math.max(20, Sec.watts('home')) + X.w; return { va, runMin: va ? Math.round(va * 0.25 / w * 60) : 0 }; };
  const _pow = Sec.powered.bind(Sec);
  Sec.powered = function (site) {
    const ok = _pow(site); if (site !== 'home') return ok;
    const s = st(), dark = typeof Grid !== 'undefined' && Grid.st().src === 'none';
    if (!dark) { s.out = 0; return ok; }
    if (!s.out) s.out = now();
    if (!ok) return false;
    return now() - s.out <= upsInfo().runMin;                       // only the UPS is carrying the cameras: it runs flat after its runtime
  };
  const _status = Sec.status.bind(Sec);
  Sec.status = function (site) {
    const o = _status(site); if (site !== 'home') return o;
    const L = Sec.site('home').dev, base = o.isOn, up = netUp();
    const isOn = d => {
      const D = DEV[d.k];
      if (D.solo && D.t === 'cam') return true;                                                          // battery + solar + own 4G SIM: independent of the house
      if (D.t === 'cam' && D.cloud) return base(d) && up;                                                 // WiFi camera → router → internet → cloud
      return base(d);
    };
    const cams = L.filter(d => DEV[d.k].t === 'cam'), recs = L.filter(d => DEV[d.k].t === 'nvr' || DEV[d.k].t === 'dvr');
    const hasHdd = r => L.some(d => d.p === r.uid && DEV[d.k].t === 'hdd');
    const recorded = c => { const D = DEV[c.k]; if (D.cloud) return isOn(c); if (D.analog) { const r = L.find(x => x.uid === c.p); return !!r && isOn(r) && hasHdd(r); } return recs.some(r => DEV[r.k].t === 'nvr' && isOn(r) && hasHdd(r)) && isOn(c); };
    const rec = cams.filter(c => isOn(c) && recorded(c)).length;
    return Object.assign({}, o, { isOn, onCnt: cams.filter(isOn).length, rec, remoteOK: o.remoteOK && up, why: d => whyOff(d, up) });
  };
  function whyOff(d, up) {
    const D = DEV[d.k]; if (D.solo) return '';
    if (!Sec.powered('home')) return upsInfo().va && typeof Grid !== 'undefined' && Grid.st().src === 'none' ? 'ไฟดับ — UPS หมดแล้ว' : 'ไฟดับ';
    if (D.cloud && !up) return ISP.st().unpaid >= 2 ? 'อินเทอร์เน็ตถูกระงับ (ค้างชำระ)' : 'อินเทอร์เน็ตใช้ไม่ได้';
    return 'ตัวกลางเครือข่ายออฟไลน์ (เราเตอร์/สวิตช์/PoE)';
  }
  // push alerts need the internet: with the line down the motion is still recorded locally if a recorder lives, but nothing reaches the phone
  const _motion = CCTV.motion.bind(CCTV);
  CCTV.motion = function (x, z) {
    if (!netUp() && S.sec && S.sec.alert) { const a = S.sec.alert; S.sec.alert = 0; try { _motion(x, z); } finally { S.sec.alert = a; } st().missed++; return; }
    _motion(x, z);
  };

  // ----- recording gaps: logged hour by hour -----
  function scan() {
    const s = st(), t = now(), status = Sec.status('home'), L = Sec.site('home').dev, up = netUp();
    for (const d of L) {
      if (DEV[d.k].t !== 'cam') continue;
      const on = status.isOn(d), was = s.rec[d.uid]; s.rec[d.uid] = on ? 1 : 0;
      if (was === undefined) continue;
      if (was && !on) { s.gaps.unshift({ u: d.uid, a: t, b: 0, why: whyOff(d, up) }); if (s.gaps.length > 80) s.gaps.length = 80; if (!G.simulating) Phone.msg('กล้องวงจรปิด', `⚠️ ${DEV[d.k].n} (${CCTV.spotOf(d).n}) ออฟไลน์: ${whyOff(d, up)} — หยุดบันทึกภาพ`, false); }
      if (!was && on) { const g = s.gaps.find(x => x.u === d.uid && !x.b); if (g) { g.b = t; if (!G.simulating) Phone.msg('กล้องวงจรปิด', `${DEV[d.k].n} (${CCTV.spotOf(d).n}) กลับมาออนไลน์ ช่องว่างในการบันทึก ${fmtDur(g.b - g.a)}`, false); } }
    }
  }
  const fmtDur = m => m >= 1440 ? `${Math.floor(m / 1440)} วัน ${Math.round(m % 1440 / 60)} ชม.` : m >= 60 ? `${Math.floor(m / 60)} ชม. ${Math.round(m % 60)} นาที` : `${Math.round(m)} นาที`;
  const clock = a => { const day = Math.floor(a / 1440), m = a % 1440; return `${RD(day)} ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`; };
  if (typeof Smart !== 'undefined') { const _h = Smart.hour; Smart.hour = function () { _h.apply(this, arguments); try { scan(); } catch (e) { } }; }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { scan(); } catch (e) { } return r; }; }

  // ----- UI: angle picker, live view with pad, recording log -----
  const near = d => { const M = CCTV.spotOf(d); return Math.hypot(G.player.pos.x - M.x, G.player.pos.z - M.z) < 30; };
  const canAim = d => isPTZ(d) || near(d) || d.fresh || (st().tech[d.uid] && st().tech[d.uid] === S.day);
  const stars = sc => '●'.repeat(Math.round(sc / 20)) + '○'.repeat(5 - Math.round(sc / 20));
  function ratingHtml(d) {
    const r = rate(d), o = r.o;
    return `<div class="card"><div class="ci">🎯</div><div class="cb"><h4>คะแนนมุมกล้อง ${r.score}/100 · ${r.label} <span class="dim">${stars(r.score)}</span></h4>
      <p class="dim">ภาพกว้าง ${o.width.toFixed(1)} ม. ที่ระยะ ${o.dist.toFixed(0)} ม. · จุดอับใต้กล้อง ${o.blind.toFixed(1)} ม. · ความละเอียด ${r.ppm} พิกเซล/ม. (${r.lvl})</p>
      <p class="dim">กลางคืน: อินฟราเรดไกล ${o.ir} ม. — ${r.night ? 'เห็นถึงจุดที่มอง' : 'ไม่ถึงจุดที่มอง'}${r.notes.length ? '<br>⚠️ ' + r.notes.join(' · ') : ''}</p></div></div>`;
  }
  function pad(d, big) {
    const p = P(d), ok = canAim(d);
    const b = (a, t) => `<button class="btn ghost" data-a="v36cc" data-s="${a}" data-v="${d.uid}" ${ok ? '' : 'disabled'}>${t}</button>`;
    return `<div class="row">${b('pl', '◀ ซ้าย')}${b('pu', '▲ เงย')}${b('pd', '▼ ก้ม')}${b('pr', 'ขวา ▶')}${isPTZ(d) ? b('zo', '➖ ซูมออก') + b('zi', `➕ ซูมเข้า (${p.zoom}×)`) : ''}${b('rs', '↺ รีเซ็ต')}</div>${ok ? '' : `<div class="row"><button class="btn" data-a="v36cc" data-s="tech" data-v="${d.uid}">👷 เรียกช่างปรับมุม ฿350 (ใช้เวลา 1 ชม.)</button><span class="dim">หรือเดินไปใกล้กล้อง (ภายใน 30 ม.) แล้วปรับเอง</span></div>`}`;
  }
  CCTV.angleUI = function (uid) {
    const d = dev(uid); if (!d) return; this.vd = d;
    UI.open('ตั้งมุมกล้อง', null, () => {
      const p = P(d), btn = (a, v, t, on) => `<button class="btn ${on ? '' : 'ghost'}" data-a="v36cc" data-s="${a}" data-v="${d.uid}" data-x="${v}" ${canAim(d) ? '' : 'disabled'}>${t}</button>`;
      return `<p class="lead">${DEV[d.k].i} ${esc(DEV[d.k].n)} · ${esc(CCTV.spotOf(d).n)} ${d.fresh ? '· 🔧 ช่างติดตั้งอยู่หน้างาน เลือกมุมได้ฟรี' : ''}</p>
        <canvas id="cctvC" width="960" height="540" style="width:100%;background:#000;border-radius:8px"></canvas>
        ${ratingHtml(d)}
        <h5>ตำแหน่งติดตั้ง</h5><div class="row">${mtOk(d).map(k => btn('mt', k, `${MT[k].n} (${MT[k].h} ม.)`, p.mt === k)).join('')}</div><p class="dim">${MT[p.mt].note}</p>
        <h5>เลนส์ / องศามองภาพ</h5><div class="row">${lensOk(d).map(k => btn('lens', k, LENS[k].n, p.lens === k)).join('')}</div>
        <h5>ทิศที่มอง (โซนเฝ้าระวัง)</h5><div class="row">${btn('zone', '', 'ค่าเริ่มต้นของจุดนี้', !p.zone)}${Object.keys(MOUNTS).map(k => btn('zone', k, MOUNTS[k].n, p.zone === k)).join('')}</div>
        <h5>ปรับละเอียด (หมุน ${p.yo}° · เงย/ก้ม ${p.po > 0 ? '+' : ''}${p.po}°)</h5>${pad(d)}
        <div class="row">${btn('auto', '', '🎯 ตั้งมุมอัตโนมัติ (ทิศที่โล่งและชัดที่สุด)', false)}</div>
        <div class="row end"><button class="btn" data-a="v36cc" data-s="done" data-v="${d.uid}">✔ เสร็จ กลับไปผังเครือข่าย</button></div>`;
    }, { wide: true });
    UI.cur.onClose = () => { this.vd = null; if (d.fresh) d.fresh = 0; };
  };
  const _view = CCTV.view.bind(CCTV);
  CCTV.view = function (uid) {
    const all = Sec.site('home').dev.filter(x => DEV[x.k].t === 'cam');
    const d = all.find(x => x.uid === uid) || this.cams()[0] || all[0];
    if (!d) { UI.toast('ยังไม่ได้ติดตั้งกล้อง', '📹'); return; }
    this.vd = d; const status = Sec.status('home');
    UI.open('ภาพสดกล้องวงจรปิด', null, () => {
      const on = status.isOn(d), p = P(d), o = pose(d);
      return `<p class="lead">${DEV[d.k].i} ${esc(DEV[d.k].n)} · ${esc(CCTV.spotOf(d).n)} · ${Phone.clock()} ${G.night > 0.5 ? '· โหมดอินฟราเรด' : ''}${on ? '' : ' · 🔴 ออฟไลน์'}</p>
        <canvas id="cctvC" width="960" height="540" style="width:100%;background:#000;border-radius:8px"></canvas>
        <p class="dim">${LENS[p.lens].n}${p.lens === 'ptz' ? ` · ซูม ${p.zoom}×` : ''} · หมุน ${p.yo}° · เงย/ก้ม ${o.pitch.toFixed(0)}° · ${MT[p.mt].n}${on ? '' : ' · ' + esc(status.why(d))}</p>
        ${on && isPTZ(d) ? `<div class="row">${Object.keys(MOUNTS).map(k => `<button class="btn ghost" data-a="v36cc" data-s="zone" data-v="${d.uid}" data-x="${k}">${MOUNTS[k].n}</button>`).join('')}</div>` : ''}
        ${pad(d)}
        <div class="row">${all.map(c => `<button class="btn ${c === d ? '' : 'ghost'}" data-a="cctvv" data-v="${c.uid}">${status.isOn(c) ? '🟢' : '🔴'} ${esc(CCTV.spotOf(c).n)}</button>`).join('')}</div>
        <div class="row"><button class="btn ghost" data-a="cctvalert">${S.sec.alert ? '🔔 แจ้งเตือนกลางคืน: เปิด' : '🔕 แจ้งเตือนกลางคืน: ปิด'}</button><button class="btn ghost" data-a="cctvlog">ย้อนดูเหตุการณ์ (${(CCTV.events || []).length})</button><button class="btn ghost" data-a="v36cc" data-s="ang" data-v="${d.uid}">🎯 ตั้งมุม/คะแนน</button><button class="btn ghost" data-a="v36cc" data-s="gaps" data-v="${d.uid}">📼 ช่องว่างการบันทึก (${st().gaps.length})</button></div>`;
    }, { wide: true });
    UI.cur.onClose = () => { this.vd = null; };
  };
  const _update = CCTV.update.bind(CCTV);
  CCTV.update = function (dt) {
    if (!this.vd || !UI.isOpen()) return; this.t = (this.t || 0) - dt; if (this.t > 0) return; this.t = 0.15;
    const c = document.getElementById('cctvC'); if (!c) return; const g2 = c.getContext('2d'), d = this.vd;
    const status = Sec.status('home'), on = status.isOn(d);
    if (!on) {
      const W = c.width, H = c.height, img = g2.createImageData(W, H); for (let i = 0; i < img.data.length; i += 4) { const v = (Math.random() * 60) | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g2.putImageData(img, 0, 0); g2.fillStyle = '#ff5252'; g2.font = `bold ${W / 22 | 0}px monospace`; g2.textAlign = 'center'; g2.fillText('NO SIGNAL', W / 2, H * 0.44); g2.font = `${W / 34 | 0}px sans-serif`; g2.fillStyle = '#fff'; g2.fillText(status.why(d), W / 2, H * 0.55); g2.textAlign = 'left'; return;
    }
    const img = this.shot(d); if (c.width !== img.width) { c.width = img.width; c.height = img.height; }
    g2.putImageData(img, 0, 0); const o = pose(d); if (window.Cam47) Cam47.osd(g2, d, o, img.width, img.height);
  };
  function gapsUI(uid) {
    const s = st(), up = netUp(), L = Sec.site('home').dev.filter(x => DEV[x.k].t === 'cam'), status = Sec.status('home'), ui = upsInfo();
    UI.open('ช่องว่างการบันทึก & สถานะระบบ', null, () => `<p class="lead">🔌 UPS ${ui.va ? `${ui.va} VA · สำรองไฟได้ราว ${fmtDur(ui.runMin)} ตอนไฟดับ` : 'ไม่มี — ไฟดับเมื่อไรกล้องและเครื่องบันทึกดับทันที'} · 🌐 อินเทอร์เน็ต ${up ? 'ใช้ได้' : '🔴 ใช้ไม่ได้'} · 🔔 แจ้งเตือนที่ไม่ได้ส่ง ${s.missed} ครั้ง</p>
      <div class="grid">${L.map(d => `<div class="card"><div class="ci">${status.isOn(d) ? '🟢' : '🔴'}</div><div class="cb"><h4>${esc(DEV[d.k].n)} · ${esc(CCTV.spotOf(d).n)}</h4><p class="dim">${DEV[d.k].solo ? 'ทำงานเองด้วยแบตเตอรี่/โซลาร์ + ซิม 4G ไม่ต้องใช้ไฟบ้าน' : DEV[d.k].cloud ? 'ต้องมีไฟ + เน็ตจึงบันทึกขึ้นคลาวด์/ดูได้' : DEV[d.k].analog ? 'ต่อ DVR ด้วยสายนำสัญญาณ: ไม่ต้องใช้เน็ตแต่ต้องมีไฟ' : 'PoE: ต้องมีไฟที่สวิตช์/เครื่องบันทึก (เน็ตใช้เฉพาะดูจากนอกบ้านและแจ้งเตือน)'}${status.isOn(d) ? '' : ' · ❌ ' + esc(status.why(d))}</p></div></div>`).join('') || '<p class="empty">ยังไม่มีกล้อง</p>'}</div>
      <h5>ประวัติช่วงที่กล้องหยุดบันทึก</h5>${s.gaps.length ? `<div class="grid">${s.gaps.slice(0, 20).map(g => { const d = dev(g.u); return `<div class="card"><div class="ci">📼</div><div class="cb"><h4>${d ? esc(DEV[d.k].n) + ' · ' + esc(CCTV.spotOf(d).n) : g.u}</h4><p class="dim">${clock(g.a)} → ${g.b ? clock(g.b) + ` (${fmtDur(g.b - g.a)})` : 'ยังไม่กลับมา'}<br>สาเหตุ: ${esc(g.why)}</p></div></div>`; }).join('')}</div>` : '<p class="empty">ยังไม่เคยมีช่วงขาดการบันทึก</p>'}
      <div class="row end"><button class="btn ghost" data-a="v36cc" data-s="view" data-v="${uid || ''}">กลับไปดูภาพสด</button></div>`, { wide: true });
  }
  CCTV.gapsUI = gapsUI;
  UI.H.v36cc = d => {
    const dd = dev(d.v), a = d.s, x = d.x; if (!dd && !['gaps', 'view'].includes(a)) return; const p = dd ? P(dd) : null;
    if (a === 'done') { UI.close(); Sec.ui('home'); return; }
    if (a === 'view') { UI.close(); CCTV.view(d.v); return; }
    if (a === 'ang') { UI.close(); CCTV.angleUI(d.v); return; }
    if (a === 'gaps') { UI.close(); gapsUI(d.v); return; }
    if (a === 'tech') {
      if (S.money < 350) { UI.toast('เงินไม่พอค่าช่าง ฿350', '💸'); return; }
      S.money -= 350; Bank2.log('ค่าช่างปรับมุมกล้อง', -350); const uid = d.v;
      UI.close(); fade(() => { tick(60); st().tech[uid] = S.day; UI.toast('ช่างปรับมุมเสร็จ เลือกมุมใหม่ได้ตลอดวันนี้', '👷'); CCTV.angleUI(uid); }); return;
    }
    if (!canAim(dd)) { UI.toast('ต้องเรียกช่างหรือเดินไปใกล้กล้องก่อน', '👷'); return; }
    if (a === 'pl') p.yo = ((p.yo - 10 + 540) % 360) - 180; if (a === 'pr') p.yo = ((p.yo + 10 + 540) % 360) - 180;
    if (a === 'pu') p.po = clamp(p.po - 5, -60, 60); if (a === 'pd') p.po = clamp(p.po + 5, -60, 60);
    if (a === 'zi') p.zoom = ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(p.zoom) + 1)] || p.zoom; if (a === 'zo') p.zoom = ZOOMS[Math.max(0, ZOOMS.indexOf(p.zoom) - 1)] || 1;
    if (a === 'rs') { Object.assign(p, { yo: 0, po: 0, zoom: 1, zone: '' }); }
    if (a === 'auto' && window.Cam47) { const b = Cam47.autoAim(dd); if (b) { p.yo = ((b.yo + 540) % 360) - 180; UI.toast(b.r.frac > 0.12 ? 'ทิศนี้โล่งที่สุดแล้ว (ยังมีสิ่งบังบางส่วน ลองย้ายจุดติดตั้ง)' : 'ตั้งมุมให้เห็นชัดไม่มีอะไรบังแล้ว', '🎯'); } }
    if (a === 'mt' && mtOk(dd).includes(x)) p.mt = x;
    if (a === 'lens' && lensOk(dd).includes(x)) { p.lens = x; p.zoom = 1; if (LENS[x].fish) p.yo = ((p.yo + 90 + 540) % 360) - 180; }
    if (a === 'zone') { p.zone = x || ''; p.yo = 0; p.po = 0; }
    CCTV.vd = dd;
  };
  // after a camera is installed the installer asks how to aim it; the planner gets a "set angle" button
  const _in = Sec.install.bind(Sec);
  Sec.install = function (site, k, parent) {
    const e = _in(site, k, parent);
    if (!e && site === 'home' && DEV[k] && DEV[k].t === 'cam') { const d = Sec.site('home').dev.at(-1); if (d) { P(d); d.fresh = 1; setTimeout(() => { try { CCTV.angleUI(d.uid); } catch (x) { } }, 60); } }
    return e;
  };
  const _ui = Sec.ui.bind(Sec);
  Sec.ui = function (site = 'home') {
    _ui(site); if (site !== 'home') return; const r = UI.cur.render;
    UI.cur.render = t => r(t).replace(/(data-a="cctvmove" data-v="(d\d+)">[^<]*<\/button>)/g, (m, whole, uid) => { const d = dev(uid); return whole + (d && DEV[d.k].t === 'cam' ? ` <button class="btn ghost" data-a="v36cc" data-s="ang" data-v="${uid}">🎯 มุม ${rate(d).score}</button>` : ''); }) + `<div class="row"><button class="btn ghost" data-a="v36cc" data-s="gaps" data-v="">📼 ช่องว่างการบันทึก / UPS</button></div>`;
    UI.renderBody();
  };
  window.Cam36 = { pose, rate, scan, state: st, ups: upsInfo, gaps: gapsUI, angle: uid => CCTV.angleUI(uid) };
  st(); scan();
});
