'use strict';
// ---------- Driving school in ภูผาใหม่: theory class → written exam → practical test on the cone course → licence ----------
LICENSE_Q.push(
  ['ป้ายวงกลมขอบแดงมีตัวเลข 60 หมายถึงอะไร?', ['ความเร็วไม่เกิน 60', 'ระยะทาง 60 กม.', 'จอดได้ 60 นาที'], 0],
  ['ดื่มเครื่องดื่มแอลกอฮอล์แล้วควรทำอย่างไร?', ['ขับช้า ๆ', 'ให้คนอื่นขับหรือเรียกแท็กซี่', 'เปิดกระจกขับ'], 1],
  ['ก่อนเปลี่ยนช่องทางต้องทำอะไร?', ['เปิดไฟเลี้ยวและมองกระจก', 'บีบแตร', 'เร่งความเร็ว'], 0],
  ['ทางม้าลายมีคนกำลังข้าม ต้องทำอย่างไร?', ['ขับผ่านเร็ว ๆ', 'หยุดให้คนข้ามก่อน', 'บีบแตรไล่'], 1],
  ['ฝนตกหนักทัศนวิสัยต่ำควรทำอย่างไร?', ['เปิดไฟหน้าและลดความเร็ว', 'เปิดไฟฉุกเฉินแล้วขับเร็ว', 'ปิดไฟประหยัดแบต'], 0],
);
const DriveSchool = {
  st() { if (!S.dl) S.dl = { theory: false, written: false }; return S.dl; },
  ui() {
    const s = this.st();
    UI.open('โรงเรียนสอนขับรถภูผา', null, () => `<p class="lead">ครูฝึกเอก: “สอบใบขับขี่ต้องผ่าน 3 ขั้น: เรียนทฤษฎี → สอบข้อเขียน → สอบขับจริงในลานฝึกครับ”</p>
      <div class="grid">
        <div class="card"><div class="ci">📘</div><div class="cb"><h4>1. เรียนทฤษฎี 2 ชม. ${s.theory ? '✅' : ''}</h4><p class="dim">800 ฿ · กฎจราจร ป้าย มารยาทการขับขี่</p><div class="row"><button class="btn" data-a="dsclass" ${!s.theory && S.money >= 800 ? '' : 'disabled'}>เรียน</button></div></div></div>
        <div class="card"><div class="ci">📝</div><div class="cb"><h4>2. สอบข้อเขียน ${s.written ? '✅' : ''}</h4><p class="dim">5 ข้อ ต้องถูก 4 ข้อขึ้นไป (สอบใหม่ได้ ไม่เสียเงิน)</p><div class="row"><button class="btn" data-a="dswritten" ${s.theory && !s.written ? '' : 'disabled'}>เริ่มสอบ</button></div></div></div>
        <div class="card"><div class="ci">🚗</div><div class="cb"><h4>3. สอบขับจริง ${S.license ? '✅' : ''}</h4><p class="dim">500 ฿ · ใช้รถของโรงเรียน ขับผ่านเส้นทางในลานฝึก ห้ามชนกรวยเกิน 2 อัน ห้ามเกิน 25 กม./ชม. แล้วจอดให้นิ่งที่เส้นชัย</p><div class="row"><button class="btn" data-a="dsdrive" ${s.written && !S.license && S.money >= 500 ? '' : 'disabled'}>เริ่มสอบขับ</button></div></div></div>
        <div class="card"><div class="ci">🚛</div><div class="cb"><h4>4. ใบขับขี่รถบรรทุก (ประเภท 2) ${S.lic2 ? '✅' : ''}</h4><p class="dim">1,500 ฿ · สอบขับรถบรรทุก 6 ล้อในลานกรวย (ต้องมีใบขับขี่รถยนต์ก่อน) จำเป็นสำหรับรถบรรทุก รถขยะ รถตัก</p><div class="row"><button class="btn" data-a="dstruck" ${S.license && !S.lic2 && S.money >= 1500 ? '' : 'disabled'}>สอบรถบรรทุก</button></div></div></div>
        <div class="card"><div class="ci">🔁</div><div class="cb"><h4>ต่ออายุใบขับขี่</h4><p class="dim">300 ฿ · อบรมออนไลน์ 1 ชม. ${S.licExp ? `· หมดอายุ${RD(S.licExp)}` : ''}${S.licOld ? ' · ⚠️ หมดอายุแล้ว' : ''}</p><div class="row"><button class="btn ghost" data-a="dsrenew" ${(S.license || S.licOld) && S.money >= 300 ? '' : 'disabled'}>ต่ออายุ</button></div></div></div>
      </div>${S.license ? `<p class="lead good">🪪 คุณมีใบขับขี่แล้ว${S.licExp ? ` (ใช้ได้ถึง${RD(S.licExp)})` : ''}</p>` : ''}`);
  },
  klass() { if (S.money < 800) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(800), '💸'); return; } S.money -= 800; UI.close(); fade(() => { tick(120); this.st().theory = true; UI.toast('เรียนทฤษฎีจบแล้ว! ไปสอบข้อเขียนได้เลย', '📘'); }); },
  written() {
    this.quiz = { i: 0, ok: 0, qs: LICENSE_Q.slice().sort(() => Math.random() - 0.5).slice(0, 5) };
    UI.open('สอบข้อเขียน', null, () => { const q = this.quiz; if (q.i >= 5) return `<p class="lead">${q.ok >= 4 ? '🎉 สอบผ่าน! ไปสอบขับจริงต่อได้เลย' : '❌ ยังไม่ผ่าน ลองใหม่ได้'} (ถูก ${q.ok}/5)</p>`; const [t, ch] = q.qs[q.i]; return `<p class="lead">ข้อ ${q.i + 1}/5: ${t}</p>${ch.map((c, i) => `<button class="btn ghost choice" data-a="dsans" data-i="${i}">${c}</button>`).join('')}`; });
  },
  answer(i) { const q = this.quiz; if (+i === q.qs[q.i][2]) q.ok++; q.i++; if (q.i >= 5 && q.ok >= 4) this.st().written = true; },
  startDrive(type = 'sedan') {
    const fee = type === 'sedan' ? 500 : 1500; if (S.money < fee) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(fee), '💸'); return; } S.money -= fee; UI.close();
    const y = Towns4.yard, d = { type, x: y.x, z: y.z - 13, r: 0 };
    fade(() => {
      // the exam can be started from the phone while standing inside a house / room / mine / another town: the outdoor world is hidden then (black screen), so go outside first
      try { leaveIndoors(); if (G.away && typeof Town2 !== 'undefined' && Town2.leaveAway) Town2.leaveAway(true); World.outdoor.visible = true; World.sky.visible = true; } catch (e) { console.warn('driveschool outdoors', e); }
      if (G.driving) { G.driving.speed = 0; exitCar(); }
      const o = addCarObj(d); o.school = true; if (o.col) { Col.remove(o.col); o.col = null; } enterCar(o);
      const pts = [[0, -7], [-3, -1], [3, 5], [0, 12]].map(([x, z]) => ({ x: y.x + x, z: y.z + z }));
      this.test = { o, pts, i: 0, hits: new Set(), t: 0, still: 0, warn: 0, type };
      UI.toast('เริ่มสอบ! ขับตามลูกศรเขียวทีละจุด ช้า ๆ ไม่ชนกรวย แล้วจอดนิ่งที่จุดสุดท้าย', '🚦');
    });
  },
  update(dt) {
    const T_ = this.test; if (!T_ || !G.started || UI.isOpen() || G.paused) return;
    if (G.driving !== T_.o) { this.finish(false, 'ลงจากรถระหว่างสอบ'); return; }
    T_.t += dt; const d = T_.o.d, sp = Math.abs(T_.o.speed) * 3.6;
    if (!this.mk) { this.mk = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0x69f0ae, toneMapped: false })); this.mk.rotation.x = Math.PI; G.scene.add(this.mk); }
    const p = T_.pts[T_.i]; this.mk.visible = true; this.mk.position.set(p.x, 2.2 + Math.sin(G.t * 4) * 0.2, p.z);
    for (const [k, c] of Towns4.cones.entries()) if (!T_.hits.has(k) && Math.hypot(c.x - d.x, c.z - d.z) < 1.25) { T_.hits.add(k); Sfx.burst(0.2, 300, 'lowpass', 0.3); UI.toast(`ชนกรวย! (${T_.hits.size}/2)`, '🔶'); }
    if (sp > 25 && (T_.warn -= dt) <= 0) { T_.warn = 2; T_.speedy = (T_.speedy || 0) + 1; UI.toast('เร็วเกินไป! ลดความเร็ว (หักคะแนน)', '⚠️'); }
    if (T_.hits.size > 2) return this.finish(false, 'ชนกรวยเกิน 2 อัน');
    if ((T_.speedy || 0) > 3) return this.finish(false, 'ขับเร็วเกินกำหนดหลายครั้ง');
    if (T_.t > 120) return this.finish(false, 'ใช้เวลานานเกินไป');
    if (Math.hypot(p.x - d.x, p.z - d.z) < 2.4) {
      if (T_.i < T_.pts.length - 1) { T_.i++; Sfx.tone(880, 0.12, 'sine', 0.05); }
      else if (sp < 1) { T_.still += dt; if (T_.still > 1.2) return this.finish(true); }
    }
    if (Contests.hud && !Contests.race) { Contests.hud.hidden = false; Contests.hud.textContent = `🚦 สอบขับ จุด ${T_.i + 1}/${T_.pts.length} · ${Math.round(sp)} กม./ชม. · ชนกรวย ${T_.hits.size}/2 · ${Math.round(T_.t)} วิ`; }
  },
  finish(ok, why) {
    const T_ = this.test; this.test = null; if (this.mk) this.mk.visible = false; Contests.hud.hidden = true;
    const o = T_.o; o.speed = 0; if (G.driving === o) exitCar();
    World.dyn.remove(o.g); if (o.col) Col.remove(o.col); G.cars.splice(G.cars.indexOf(o), 1);
    if (ok && T_.type !== 'sedan') { S.lic2 = 1; Prog.add(40); Life2.note('สอบใบขับขี่รถบรรทุก (ประเภท 2) ผ่านแล้ว! 🚛'); UI.toast('สอบผ่าน! ได้ใบขับขี่รถบรรทุกแล้ว', '🚛'); }
    else if (ok) { S.license = 1; S.licExp = S.day + 2 * (typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84); Stations2.st().points = 0; Prog.add(40); Life2.note('สอบใบขับขี่ผ่านแล้ว! 🪪'); UI.toast('ยินดีด้วย! สอบผ่าน ได้ใบขับขี่แล้ว 🪪', '🎉'); }
    else UI.toast(`สอบไม่ผ่าน: ${why} ลองสอบใหม่ได้ (500 ฿)`, '❌');
  },
};
UI.H.dsclass = () => DriveSchool.klass();
UI.H.dswritten = () => DriveSchool.written();
UI.H.dsans = d => DriveSchool.answer(d.i);
UI.H.dsdrive = () => DriveSchool.startDrive();
