'use strict';
// ---------- iPad / iPhone (Safari, iOS 17-18) stability. Everything here runs ONLY on Apple touch devices:
// notebooks and PCs (including Macs with a mouse) are left exactly as they are ----------
const IOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) || /[?&]ios=1\b/.test(location.search);
const IOSFix = {
  init() {
    if (!IOS) return;
    document.body.classList.add('ios');
    this.css(); this.gestures(); this.lifecycle(); this.memory(); this.governor(); this.install();
  },
  // 1. no page zoom from pinches or double taps, no text selection or callouts on long-press, inputs that don't auto-zoom
  css() {
    const s = document.createElement('style');
    s.textContent = `body.ios{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none;touch-action:manipulation}
body.ios input,body.ios textarea,body.ios select{font-size:16px!important;-webkit-user-select:text;user-select:text}
body.ios #c{touch-action:none}
body.ios .btn,body.ios button{touch-action:manipulation}
@supports (height:100dvh){body.ios{height:100dvh}}`;
    document.head.appendChild(s);
  },
  gestures() {
    for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
    // double-tap zoom on the game view is already off: the canvas has touch-action:none
    // iOS reports the new size a moment after rotating
    addEventListener('orientationchange', () => setTimeout(() => dispatchEvent(new Event('resize')), 350));
  },
  // 2. Safari freezes or discards background tabs: save on the way out, wake the sound on the way back
  lifecycle() {
    const out = () => { try { if (G.started) { saveGame(true); if (Net.on || Net.cloud) Net.saveRemote(true); } } catch (e) { } };
    addEventListener('pagehide', out);
    document.addEventListener('visibilitychange', () => { if (document.hidden) out(); else { Sfx.resume(); _clock.getDelta(); } });
    // the audio context comes back "interrupted" after a call or another app: resume on the next touch
    addEventListener('touchend', () => Sfx.resume(), { passive: true });
  },
  // 3. stay well inside the WebGL memory Safari allows a tab
  memory() {
    const r = G.renderer;
    if (G.sun && G.sun.shadow && G.sun.shadow.mapSize.x > 1024) { G.sun.shadow.mapSize.set(1024, 1024); if (G.sun.shadow.map) { G.sun.shadow.map.dispose(); G.sun.shadow.map = null; } }
    if (G.Q.pr > 2) { G.Q.pr = 2; if (G.pr > 2) Perf.setPr(2); }
    // the album keeps 12 photos in storage; on iOS keep 8 so the 5 MB storage quota is never hit
    try { const L = JSON.parse(safeGet('raisukjai3d_album') || '[]'); if (L.length > 8) { L.length = 8; safeSet('raisukjai3d_album', JSON.stringify(L)); } } catch (e) { }
    const _snap = Photo.snap.bind(Photo); Photo.snap = () => { _snap(); setTimeout(() => { try { const L = Photo.list(); if (L.length > 8) { L.length = 8; safeSet('raisukjai3d_album', JSON.stringify(L)); } } catch (e) { } }, 1500); };
    void r;
  },
  // 4. Low Power Mode caps Safari at 30 FPS: that steady 30 is not lag, so it must not lower the picture
  // v137: a steady ~30 fps only counts as Low Power Mode once the picture is already down to 1.0x
  governor() {
    const _down = Perf.down;
    Perf.down = function () { if (G.fps > 26 && G.fps < 34 && IOSFix.steady() && G.pr <= 1.0) return; return _down.call(this); };
    this.dts = [];
    const _frame = Perf.frame;
    Perf.frame = function (dt) { IOSFix.dts.push(dt); if (IOSFix.dts.length > 90) IOSFix.dts.shift(); return _frame.call(this, dt); };
  },
  steady() { const a = this.dts; if (a.length < 60) return false; const m = a.reduce((x, y) => x + y, 0) / a.length; return a.every(d => Math.abs(d - m) < 0.008); },
  // 5. Safari has no install prompt: explain "Add to Home Screen" (also keeps saves safe from Safari's 7-day storage clean-up)
  install() {
    UI.H.install = () => UI.open('ติดตั้งบน iPad / iPhone', null, () => `<p class="lead">1) แตะปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรขึ้น) ใน Safari<br>2) เลือก <b>เพิ่มไปยังหน้าจอโฮม</b><br>3) เปิดเกมจากไอคอนไร่สุขใจบนหน้าจอโฮม</p><p class="dim">เล่นแบบเต็มจอ และ Safari จะไม่ลบเซฟเมื่อไม่ได้เปิดเกมนานเกิน 7 วัน แนะนำให้กด “บันทึกขึ้นเซิร์ฟเวอร์” ในแอปเซฟออนไลน์ด้วย</p><div class="row end"><button class="btn" data-a="close">เข้าใจแล้ว</button></div>`);
    const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    if (!standalone && !safeGet('raisukjai3d_iostip')) setTimeout(() => { safeSet('raisukjai3d_iostip', '1'); UI.toast('เล่นบน iPad/iPhone: เพิ่มเกมไปหน้าจอโฮมเพื่อเล่นเต็มจอและกันเซฟหาย (เมนู ⚙️ → ติดตั้งเกมเป็นแอป)', '📲'); }, 15000);
  },
};
