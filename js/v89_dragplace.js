// v89_dragplace.js: move things by dragging a finger (iPad / touch)
//  Every "carry it and place it" mode (furniture, IT gear and cameras, plots, garden beds, the greenhouse, lights) used to put the piece a few steps in front of the player, so on a tablet the only
//  way to move it was the walking joystick. Now, while any of these modes is open, a touch on the 3D view picks the piece up (or, if you touch somewhere else, brings it to your finger) and
//  dragging slides it along the ground under your finger; lifting the finger leaves it there, and the OK / rotate buttons work as before. The walking joystick does NOT appear while placing,
//  and a second finger is ignored while one is dragging. Mouse users keep the old way.
V23.add('v89_dragplace', () => {
  const BARS = ['moveUI', 'mv37', 'pl40', 'pl42', 'ghPlace', 'ltPlace'];
  const css = document.createElement('style');
  css.textContent = 'body.dragplace #joy, body.dragplace #joyHint { display: none !important; }';
  document.head.appendChild(css);
  const D = { on: false, tgt: null, cur: null, id: null, off: { x: 0, z: 0 }, hinted: false };
  const barOn = () => { for (const id of BARS) { const e = document.getElementById(id); if (e && !e.hidden && e.style.display !== 'none' && e.getClientRects().length) return true; } return false; };
  const sync = () => {
    const on = barOn(); if (on === D.on) return;
    D.on = on; document.body.classList.toggle('dragplace', on); D.tgt = null; D.cur = null; D.id = null;
    if (on && !D.hinted && (document.body.classList.contains('touch') || matchMedia('(pointer: coarse)').matches)) { D.hinted = true; try { UI.toast('ลากนิ้วบนจอเพื่อเลื่อนของไปวางได้เลย', '👆'); } catch (e) { } }
  };
  setInterval(sync, 80);
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  const ground = e => {
    const cv = document.getElementById('c'), r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, G.camera); plane.constant = -(G.player.pos.y || 0);
    return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null;
  };
  const useTouch = e => e.pointerType !== 'mouse';
  // called by the placement modes with the spot they would have used (in front of the player); returns the spot to use
  D.pos = (x, z) => { if (D.on && D.tgt) { D.cur = { x: D.tgt.x, z: D.tgt.z }; return D.cur; } D.cur = { x, z }; return D.cur; };
  D.active = () => { sync(); return D.on; };
  D.nudge = (fw, sd) => { if (!D.tgt) { if (D.cur) D.tgt = { x: D.cur.x, z: D.cur.z }; else return; } const r = G.player.rot || 0, fx = Math.sin(r), fz = Math.cos(r); D.tgt.x += fx * fw + fz * sd; D.tgt.z += fz * fw - fx * sd; };
  // pointer hooks (game.js calls these before its own joystick / camera handling; true = handled)
  D.down = e => {
    if (!D.active() || !useTouch(e)) return false;
    if (D.id !== null) return true;                           // a second finger while dragging: ignore it
    const g = ground(e); if (!g) return false;
    D.id = e.pointerId;
    if (D.cur && Math.hypot(g.x - D.cur.x, g.z - D.cur.z) < 3.2) { D.off = { x: D.cur.x - g.x, z: D.cur.z - g.z }; } else D.off = { x: 0, z: 0 };
    D.tgt = { x: g.x + D.off.x, z: g.z + D.off.z }; return true;
  };
  D.move = e => { if (D.id === null || e.pointerId !== D.id) return D.on && D.id !== null && useTouch(e); const g = ground(e); if (g) D.tgt = { x: g.x + D.off.x, z: g.z + D.off.z }; return true; };
  D.up = e => { if (e.pointerId === D.id) { D.id = null; return true; } return false; };
  window.Drag89 = D;
});
