'use strict';
// ---------- v36 touch driving: tablet/phone pedals that never overlap, a clear "ขึ้นรถ / ลงรถ" button, camera button ----------
V23.add('v36_touch', () => {
  const $ = id => document.getElementById(id);
  if (!$('hudBR') || typeof DrivePad === 'undefined') return;
  const css = document.createElement('style');
  css.textContent = `
:root{--pb:clamp(64px,8.5vw,90px)}
body.touch{overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
body.touch *{touch-action:manipulation}
body.touch #c{touch-action:none}
body.touch input,body.touch textarea{-webkit-user-select:text;user-select:text}
body.touch #dpad button{width:var(--pb);height:var(--pb);border-radius:20px;font-size:clamp(26px,3.6vw,34px);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;bottom:calc(20px + env(safe-area-inset-bottom,0px));display:grid;place-items:center;padding:0}
body.touch #dpad .l{left:calc(16px + env(safe-area-inset-left,0px))}
body.touch #dpad .r{left:calc(30px + var(--pb) + env(safe-area-inset-left,0px))}
body.touch #dpad .gas{right:calc(16px + env(safe-area-inset-right,0px));height:calc(var(--pb) * 1.5)}
body.touch #dpad .brk{right:calc(30px + var(--pb) + env(safe-area-inset-right,0px))}
body.driving #hudBR{bottom:calc(34px + var(--pb) * 1.5 + env(safe-area-inset-bottom,0px));flex-direction:row;align-items:flex-end}
body.driving #joyHint{display:none}
#bEnter{width:auto;border-radius:30px;padding:0 20px;font-size:17px;font-weight:600;height:58px;border:3px solid rgba(255,255,255,.85);background:linear-gradient(#4fc3f7,#1e88e5);color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35);white-space:nowrap}
#bEnter:active{transform:scale(.95)}
#bCar{height:58px;font-size:17px}
#bCar.slow{opacity:.65}
#bCam{font-size:22px}
@media (max-height:500px){:root{--pb:60px}#bEnter,#bCar{height:48px;font-size:15px}body.driving #hudBR{bottom:calc(20px + env(safe-area-inset-bottom,0px));right:calc(var(--pb) * 2 + 52px + env(safe-area-inset-right,0px))}}
`;
  document.head.appendChild(css);

  const hud = $('hudBR'), act = $('bAct');
  const enter = document.createElement('button'); enter.className = 'panel'; enter.id = 'bEnter'; enter.hidden = true; enter.textContent = '🚗 ขึ้นรถ';
  hud.insertBefore(enter, act);
  const cam = document.createElement('button'); cam.className = 'panel sb'; cam.id = 'bCam'; cam.hidden = true; cam.textContent = '📷'; cam.title = 'เปลี่ยนมุมกล้อง';
  hud.insertBefore(cam, $('bHorn'));

  const near = () => {
    if (!G.started || G.driving || !G.player || G.inside || G.inRoom || G.inMine || G.paused) return null;
    const p = G.player.pos; let best = null, bd = 4.6;
    for (const c of G.cars) { if (!c || !c.d) continue; const d = Math.hypot(p.x - c.d.x, p.z - c.d.z); if (d < bd) { bd = d; best = c; } }
    return best;
  };
  let target = null;
  enter.addEventListener('pointerdown', e => {
    e.preventDefault();
    const c = near() || target; if (!c || G.driving || UI.isOpen()) return;
    enterCar(c); Sfx.click();
  });
  const views = [5.5, 8.5, 13];
  cam.addEventListener('pointerdown', e => {
    e.preventDefault(); const i = views.findIndex(v => Math.abs(G.cam.dist - v) < 0.6);
    G.cam.dist = views[(i + 1) % views.length]; G.cam.lastDrag = 0; Sfx.click();
  });

  // pedals keep the finger even when it slides off the button, and let go when the system takes the pointer away
  const releases = { l: () => { if (DrivePad.x === -1) DrivePad.x = 0; }, r: () => { if (DrivePad.x === 1) DrivePad.x = 0; }, gas: () => { if (DrivePad.y === 1) DrivePad.y = 0; }, brk: () => { if (DrivePad.y === -1) DrivePad.y = 0; } };
  for (const cls in releases) {
    const b = DrivePad.el && DrivePad.el.querySelector('.' + cls); if (!b) continue;
    b.addEventListener('pointerdown', e => { try { b.setPointerCapture(e.pointerId); } catch (x) { } });
    b.addEventListener('lostpointercapture', () => { b.classList.remove('on'); releases[cls](); });
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  const stopAll = () => { DrivePad.x = 0; DrivePad.y = 0; if (DrivePad.el) DrivePad.el.querySelectorAll('button.on').forEach(b => b.classList.remove('on')); };
  addEventListener('blur', stopAll); document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  document.addEventListener('gesturestart', e => e.preventDefault());

  const sync = () => {
    const driving = !!G.driving, touch = !!(G.Q && G.Q.touch);
    document.body.classList.toggle('driving', driving);
    target = near();
    enter.hidden = !(touch && target && !UI.isOpen());
    cam.hidden = !(touch && driving);
    const bc = $('bCar');
    if (bc && driving) { const fast = Math.abs(G.driving.speed) > 2.5; bc.classList.toggle('slow', fast); bc.textContent = fast ? '🛑 ชะลอก่อนลงรถ' : '🚪 ลงรถ'; }
  };
  setInterval(sync, 250);
  const _b = UI.buttons.bind(UI); UI.buttons = function () { _b(); sync(); };
  sync();
});
