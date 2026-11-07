// v67_nursery.js: the greenhouse (nursery)
//  - walls and plant beds are solid, so nobody walks through the beds any more
//  - up to 6 greenhouses in total (the one you start with + 5 bought, each dearer than the last)
//  - every greenhouse can be moved and turned: walk to the spot you want, the house follows in front of you, green = free, red = blocked
V23.add('v67_nursery', () => {
  if (typeof Farm2 === 'undefined' || !Farm2.ghObjs) return;
  const MAXH = 6, PRICE = [0, 8000, 12000, 18000, 26000, 36000];
  const doorSpot = h => Farm2.ghHouses()[h].pos;

  // an "open the greenhouse manager" prompt at the open end of every greenhouse
  const movMgr = h => { const ob = Farm2.ghObjs[h], o = doorSpot(h), q = l2w(o.x, o.z, o.r * Math.PI / 2, -6.4, 0); ob.mgr.x = q.x; ob.mgr.z = q.z; };
  const addMgr = h => {
    const ob = Farm2.ghObjs[h]; if (ob.mgr) return;
    ob.mgr = { kind: 'act', x: 0, z: 0, r: 1.7, label: 'จัดการเรือนกระจก', icon: '🏡', map: h === 0, act: () => ({ icon: '🛠️', label: `จัดการเรือนกระจก (${Farm2.ghHouses().length}/${MAXH})`, fn: panel }) };
    World.pois.push(ob.mgr); movMgr(h);
  };
  { const _p = Farm2.placeGH.bind(Farm2); Farm2.placeGH = function (h, c) { _p(h, c); if (this.ghObjs[h].mgr) movMgr(h); }; }
  { const _b = Farm2.buildGH.bind(Farm2); Farm2.buildGH = function (h) { _b(h); addMgr(h); }; }
  { const _r = Farm2.removeGH.bind(Farm2); Farm2.removeGH = function (h) { const m = this.ghObjs[h].mgr; if (m) { const i = World.pois.indexOf(m); if (i >= 0) World.pois.splice(i, 1); } _r(h); }; }
  for (let h = 0; h < Farm2.ghObjs.length; h++) addMgr(h);

  // ---- management panel ----
  const panel = () => UI.open('🏡 เรือนกระจก (โรงเพาะชำ)', null, () => {
    const H = Farm2.ghHouses(), next = H.length < MAXH ? PRICE[H.length] : 0;
    return `<p class="lead">มีแล้ว ${H.length}/${MAXH} หลัง · แต่ละหลังมี 6 แปลง ปลูกได้ทุกฤดู ไม่ต้องรดน้ำ · ย้ายและหมุนได้ตามใจ</p>
      <div class="grid">${H.map((x, i) => { const used = x.s.filter(s => s.c).length; return `<div class="card"><div class="ci">🏡</div><div class="cb"><h4>เรือนกระจก ${i + 1}</h4><p class="dim">ปลูกอยู่ ${used}/6 แปลง</p><div class="row"><button class="btn ghost" data-a="gh67move" data-v="${i}">ย้าย / หมุน</button></div></div></div>`; }).join('')}</div>
      ${H.length < MAXH ? `<div class="row"><button class="btn" data-a="gh67buy" ${S.money < next ? 'disabled' : ''}>🛒 ซื้อเรือนกระจกหลังที่ ${H.length + 1} (${baht(next)})</button></div>` : '<p class="dim">ซื้อครบ 6 หลังแล้ว</p>'}`;
  });
  UI.H.gh67buy = () => {
    if (PL) { UI.toast('วางเรือนกระจกหลังที่ซื้อไว้ให้เสร็จก่อน', '🏡'); return; }
    const f = Farm2.st(), n = f.ghx.length + 1; if (n >= MAXH) return;
    const cost = PRICE[n]; if (S.money < cost) { UI.toast(`เงินไม่พอ (ต้องใช้ ${baht(cost)})`, '💸'); return; }
    S.money -= cost; try { Sfx.coin(); } catch (e) { }
    const p = G.player.pos; f.ghx.push({ x: p.x, z: p.z, r: 0, un: 1, paid: cost, s: Array.from({ length: 6 }, () => ({ c: null, g: 0 })) });
    Farm2.buildGH(n); Farm2.unsolidGH(n); start(n, true);
  };
  UI.H.gh67move = d => start(+d.v, false);

  // ---- placement ----
  let PL = null, bar = null, ov = null;
  const snap = v => Math.round(v * 2) / 2;
  const check = (h, x, z, r) => {
    const rot = r * Math.PI / 2, own = Farm2.ghObjs[h];
    if (x < -68 || x > 68 || z < -52 || z > 56) return 'อยู่นอกพื้นที่ฟาร์ม';
    const gy = World.groundY(x, z); if (!(gy > -0.1)) return 'พื้นที่เป็นน้ำ';
    for (let lx = -5.5; lx <= 5.51; lx += 0.5) for (let lz = -4; lz <= 4.01; lz += 0.5) {
      const q = l2w(x, z, rot, lx, lz);
      if (Math.abs(World.groundY(q.x, q.z) - gy) > 0.6) return 'พื้นลาดเอียงเกินไป';
      if (Collide.covered(q.x, q.z)) return 'ชนสิ่งก่อสร้างหรือต้นไม้';
      if (roadDist(q.x, q.z) < 4.5) return 'ติดถนน';
      if (q.x > FIELD.x0 - 1.5 && q.x < FIELD.x0 + 15.5 && q.z > FIELD.z0 - 1.5 && q.z < FIELD.z0 + 13) return 'ทับแปลงผัก';
      if (q.x > PEN.x0 - 1 && q.x < PEN.x1 + 1 && q.z > PEN.z0 - 1 && q.z < PEN.z1 + 1) return 'ทับคอกสัตว์';
      const zn = zoneAt(q.x, q.z); if (!zn || zn.id !== 'farm') return 'อยู่นอกพื้นที่ฟาร์ม';
    }
    const inRect = q => { const dx = q.x - x, dz = q.z - z, c = Math.cos(rot), s = Math.sin(rot), lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < 6.2 && Math.abs(lz) < 4.7; };
    for (const p of World.pois) if (!own.pois.includes(p) && p !== own.mgr && inRect(p)) return 'ทับจุดโต้ตอบอื่น';
    return '';
  };
  Farm2.ghCheck = check;   // (also used by the tests)
  const ui = () => {
    if (bar) return bar;
    bar = document.createElement('div'); bar.id = 'ghPlace';
    bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(110px + env(safe-area-inset-bottom,0px));z-index:9;width:min(460px,calc(100vw - 24px));background:rgba(20,40,28,.92);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:10px 12px;font:600 14px system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)';
    bar.innerHTML = '<div id="ghTxt" style="margin-bottom:8px;line-height:1.4"></div><div style="display:flex;gap:8px"><button class="btn ghost" id="ghRot" style="flex:1">🔄 หมุน (R)</button><button class="btn" id="ghOk" style="flex:1.4">✅ วางที่นี่ (E)</button><button class="btn ghost" id="ghNo" style="flex:1">ยกเลิก (Esc)</button></div>';
    document.body.appendChild(bar);
    bar.querySelector('#ghRot').onclick = rotate; bar.querySelector('#ghOk').onclick = commit; bar.querySelector('#ghNo').onclick = cancel;
    return bar;
  };
  const start = (h, isNew) => {
    UI.close(); const o = doorSpot(h), ob = Farm2.ghObjs[h];
    Farm2.unsolidGH(h);
    PL = { h, isNew, old: { x: o.x, z: o.z, r: o.r }, x: o.x, z: o.z, r: o.r, err: '' };
    if (!ov) { ov = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), new THREE.MeshBasicMaterial({ color: 0x44ff66, transparent: true, opacity: 0.35, depthWrite: false })); ov.rotation.x = -Math.PI / 2; ov.position.y = 0.22; }
    ob.gh.add(ov); ov.visible = true; ui().style.display = '';
    UI.toast('เดินไปยังจุดที่ต้องการ เรือนกระจกจะตามอยู่ข้างหน้า สีเขียว = วางได้', '🏡');
    loop();
  };
  const loop = () => {
    if (!PL) return;
    const P = G.player;
    { const dp = window.Drag89 ? Drag89.pos(P.pos.x + Math.sin(P.rot) * 7, P.pos.z + Math.cos(P.rot) * 7) : { x: P.pos.x + Math.sin(P.rot) * 7, z: P.pos.z + Math.cos(P.rot) * 7 }; PL.x = snap(dp.x); PL.z = snap(dp.z); }
    if (PL.x !== PL.lx || PL.z !== PL.lz || PL.r !== PL.lr) { PL.lx = PL.x; PL.lz = PL.z; PL.lr = PL.r; PL.err = check(PL.h, PL.x, PL.z, PL.r); }
    const ob = Farm2.ghObjs[PL.h]; ob.gh.position.set(PL.x, 0, PL.z); ob.gh.rotation.y = PL.r * Math.PI / 2;
    ov.material.color.set(PL.err ? 0xff4444 : 0x44ff66);
    bar.querySelector('#ghTxt').textContent = PL.err ? '⛔ วางตรงนี้ไม่ได้: ' + PL.err : '✅ วางตรงนี้ได้ · เดินเพื่อเลื่อน กด R เพื่อหมุน';
    requestAnimationFrame(loop);
  };
  const rotate = () => { if (PL) { PL.r = (PL.r + 1) % 4; try { Sfx.click(); } catch (e) { } } };
  const end = () => { if (ov && ov.parent) ov.parent.remove(ov); if (bar) bar.style.display = 'none'; PL = null; };
  const commit = () => {
    if (!PL) return; PL.err = check(PL.h, PL.x, PL.z, PL.r);   // check again right now, whatever the last frame saw
    if (PL.err) { UI.toast('วางตรงนี้ไม่ได้: ' + PL.err, '⛔'); return; }
    const h = PL.h, o = doorSpot(h); o.x = PL.x; o.z = PL.z; o.r = PL.r; delete o.un; delete o.paid;
    const isNew = PL.isNew; end(); Farm2.placeGH(h, true); Farm2.refresh();
    try { Sfx.plant(); } catch (e) { } UI.toast(isNew ? `วางเรือนกระจกหลังที่ ${h + 1} แล้ว` : 'ย้ายเรือนกระจกแล้ว', '🏡'); saveGame(true);
  };
  const cancel = () => {
    if (!PL) return; const h = PL.h, o = doorSpot(h), old = PL.old, isNew = PL.isNew, paid = o.paid || 0; end();
    if (isNew) { Farm2.removeGH(h); if (window.Refund181) Refund181.give(paid, 'คืนเงินเรือนกระจก'); else S.money += paid; UI.toast(`ยกเลิก คืนเงิน ${baht(paid)}`, '↩️'); }
    else { o.x = old.x; o.z = old.z; o.r = old.r; Farm2.placeGH(h, false); }
  };
  // E / Space / the hand button place it; R turns it; Esc cancels
  { const _da = doAction; doAction = function () { if (PL) { commit(); return; } return _da.apply(this, arguments); }; }
  addEventListener('keydown', e => { if (!PL) return; if (e.code === 'KeyR') { e.preventDefault(); rotate(); } else if (e.code === 'Escape') { e.preventDefault(); cancel(); } });
});
