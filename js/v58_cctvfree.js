// v58_cctvfree.js: three CCTV additions on top of v57
//  1) the spot buttons in the PTZ live view move the pole (free, same rules as the angle window) instead of only turning the lens
//  2) every spot button shows a warning when the cable / WiFi will not reach it or the view from it is blocked
//  3) "place the pole anywhere": opens the mover (v37) from the angle window, and while placing a camera it checks the spot (road, driveway, plots, water,
//     buildings, blocked view) and refuses a pole standing on the driveway / road / plots / pen / water / inside a building
V23.add('v58_cctvfree', () => {
  if (typeof MOUNTS === 'undefined' || typeof CCTV === 'undefined' || !window.Spots57) return;
  const dev = uid => Sec.site('home').dev.find(d => d.uid === uid);
  const LEG = '⛔ สาย LAN/WiFi ไม่ถึงจุดนี้ · 🚧 มุมมองถูกบังมาก (ตัวเลข = % ของมุมที่บัง) · ⚠️ บังบางส่วน · กดแล้วเกมจะบอกเหตุผล';

  // ---------- 1) move the pole to a named spot (angle window and PTZ live view) ----------
  const keyOf = d => 'h:' + d.uid;
  function moveTo(dd, key) {
    const M = MOUNTS[key]; if (!M || !(window.Cam36 && Cam36.state)) return;
    const mv = window.Move37, mk = keyOf(dd);
    if (mv && mv.st().pend.some(p => p.key === mk)) { UI.toast('มีงานช่างย้ายกล้องนี้ค้างอยู่ รอให้เสร็จก่อน', '👷'); return; }
    const sp = CCTV.spotOf(dd), near = Math.hypot(G.player.pos.x - sp.x, G.player.pos.z - sp.z) < 30, tech = Cam36.state().tech && Cam36.state().tech[dd.uid] === S.day;
    if (!(dd.fresh || near || tech || dd.k === 'cam_ptz')) { UI.toast('ต้องเรียกช่างหรือเดินไปใกล้กล้องก่อน', '👷'); return; }
    const placed = !!(mv && mv.moved(dd));
    if (dd.spot === key && !placed) { UI.toast('กล้องอยู่ที่จุดนี้แล้ว', 'ℹ️'); return; }
    const err = CCTV.ok('home', dd, key); if (err) { UI.toast(err, '📏'); return; }
    if (placed) delete mv.st().pos[mk];            // a pole placed by hand overrides the named spot, so drop it
    dd.spot = key; const p = Cam36.state().pose[dd.uid]; if (p) { p.zone = ''; p.yo = 0; p.po = 0; }
    try { if (placed) mv.syncAll(); else CCTV.draw(); } catch (e) { }
    UI.toast(`📍 วางเสาติดกล้องที่ ${M.n} แล้ว (ฟรี) — ปรับมุมต่อได้เลย`, '📹'); CCTV.vd = dd;
  }
  const _h = UI.H.v36cc;
  UI.H.v36cc = function (d) {
    if (d.s === 'zone' && d.x && MOUNTS[d.x]) {
      const t = UI.cur && UI.cur.title, dd = dev(d.v);
      if (dd && (t === 'ตั้งมุมกล้อง' || (t === 'ภาพสดกล้องวงจรปิด' && dd.k === 'cam_ptz'))) { moveTo(dd, d.x); return; }
    }
    return _h.apply(this, arguments);
  };

  // ---------- 2) warnings on the spot buttons ----------
  function decorate(h, uid, live) {
    const dd = dev(uid); if (!dd) return h; const cur = dd.spot || 'house', S58 = window.Spots57;
    const badge = k => {
      if (k === cur) return ''; const M = MOUNTS[k]; let err = ''; try { err = CCTV.ok('home', dd, k); } catch (e) { }
      if (err) return ' ⛔'; const o = S58.occlusion(M.x, M.z, M.lx, M.lz); return o >= 0.5 ? ` 🚧${Math.round(o * 100)}%` : o > 0.2 ? ' ⚠️' : '';
    };
    h = h.replace(/<button class="btn[^"]*" data-a="v36cc" data-s="zone" data-v="[^"]+" data-x="([^"]+)"[^>]*>([^<]*)<\/button>/g, (m, k, txt) => MOUNTS[k] ? m.replace(txt + '</button>', txt + badge(k) + '</button>') : m);
    if (live) return h.replace(/<div class="row">(?=<button class="btn[^"]*" data-a="v36cc" data-s="zone")/, `<h5>📍 ย้ายเสากล้องไปจุดอื่น (ฟรี)</h5><p class="dim">${LEG}</p><div class="row">`);
    h = h.replace('ให้เลย ฟรี)</h5>', `ให้เลย ฟรี)</h5><p class="dim">${LEG}</p>`);
    // 3) free placement entry point
    return h.replace('<h5>ปรับละเอียด', `<div class="row"><button class="btn ghost" data-a="v58" data-s="free" data-v="${uid}">🆓 วางเสาเอง ที่ไหนก็ได้ในไร่ (เดินไปยืนตรงจุดนั้น)</button></div><h5>ปรับละเอียด`);
  }
  function hook(live, uid) {
    const c = UI.cur; if (!c || c._v58 || typeof c.render !== 'function') return; c._v58 = 1; const r0 = c.render;
    c.render = t => decorate(r0(t), uid, live); UI.renderBody();
  }
  { const _a = CCTV.angleUI.bind(CCTV); CCTV.angleUI = function (uid) { _a(uid); if (UI.cur && UI.cur.title === 'ตั้งมุมกล้อง') hook(false, uid); }; }
  { const _v = CCTV.view.bind(CCTV);
    CCTV.view = function (uid) { _v(uid); const d = this.vd; if (d && d.k === 'cam_ptz' && UI.cur && UI.cur.title === 'ภาพสดกล้องวงจรปิด') hook(true, d.uid); }; }
  UI.H.v58 = d => {
    if (d.s !== 'free') return; const dd = dev(d.v); if (!dd) return;
    if (!window.Move37) { UI.toast('ระบบย้ายอุปกรณ์ยังไม่พร้อม', '⚠️'); return; }
    if (G.inside || G.inRoom) { UI.toast('ออกมายืนกลางแจ้งในไร่ก่อน แล้วค่อยวางเสา', '🏠'); return; }
    Move37.startMode(keyOf(dd)); UI.toast('เดินไปยังจุดที่ต้องการ เสาจะวางห่างตัว 3 ม. ตามทิศที่หันหน้า แล้วกด ✔ วางที่นี่', '🆓');
  };

  // ---------- 3) while the mover places a camera outdoors: check the spot, refuse the bad ones ----------
  const HARD = r => r && r !== 'นอกไร่' && r !== 'ติดจุดใช้งาน';
  function annotate(iv) {
    iv.dataset.hard58 = ''; const txt = iv.textContent; let isCam = false;
    for (const k in DEV) if (DEV[k].t === 'cam' && txt.includes(DEV[k].n)) { isCam = true; break; }
    if (!isCam) return; const t = Move37.target(); if (!t || !t.np || t.np.w !== 'out') return;
    const x = t.np.x, z = t.np.z, r = t.np.r || 0, why = Spots57.bad(x, z), occ = Spots57.occlusion(x, z, x + Math.sin(r) * 14, z + Math.cos(r) * 14), pc = Math.round(occ * 100);
    let msg, col;
    if (HARD(why)) { msg = `⛔ ตั้งเสาตรงนี้ไม่ได้: ${why}`; col = '#ff8a80'; iv.dataset.hard58 = '1'; iv.dataset.msg58 = msg; }
    else if (why) { msg = `⚠️ ${why === 'นอกไร่' ? 'อยู่นอกเขตไร่' : 'ติดจุดใช้งาน อาจเกะกะ'} · มุมมองถูกบัง ${pc}%`; col = '#ffd54f'; }
    else if (occ > 0.5) { msg = `🚧 มุมมองถูกบังมาก ${pc}% (หมุนตัวไปทิศอื่นหรือขยับเสา)`; col = '#ffd54f'; }
    else if (occ > 0.2) { msg = `⚠️ มุมมองถูกบังบางส่วน ${pc}%`; col = '#ffd54f'; }
    else { msg = `✅ จุดนี้โล่ง มุมมองไม่ถูกบัง (${pc}%)`; col = '#a5d6a7'; }
    const s = document.createElement('div'); s.className = 'c58'; s.style.cssText = 'color:' + col + ';font-weight:600'; s.textContent = msg; iv.appendChild(s);
  }
  function hookMover() {
    const iv = document.getElementById('mv37i'), box = document.getElementById('mv37'); if (!iv || !box || iv._c58) return; iv._c58 = 1;
    new MutationObserver(() => { if (!iv.querySelector('.c58')) { try { annotate(iv); } catch (e) { } } }).observe(iv, { childList: true });
    box.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-m="ok"]');
      if (b && iv.dataset.hard58 === '1') { e.stopImmediatePropagation(); e.stopPropagation(); UI.toast(iv.dataset.msg58 || 'ตั้งเสาตรงนี้ไม่ได้', '⛔'); }
    }, true);
  }
  setInterval(hookMover, 400);
  window.Spots58 = { moveTo, annotate };
});
