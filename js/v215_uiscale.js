'use strict';
// ---------- v215: UI size for laptops / desktops ----------
// The HUD, the windows, the toasts and the prompts were made for a phone / iPad and look small on a laptop screen.
// A scale factor (zoom) is applied to all of them: automatic from the window size on a mouse + keyboard computer (1.0 on a touch device),
// or chosen by the player in the settings window (auto · 100% · 115% · 130% · 150% · 175%). Windows keep fitting the screen (max-height / width are divided by the factor).
V23.add('v215_uiscale', function () {
  const KEY = 'raisukjai_uiscale';
  const get = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } };
  const touch = () => { try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches; } catch (e) { return false; } };
  const auto = () => {
    if (touch()) return 1;
    const w = innerWidth, h = innerHeight;
    if (w < 700 || h < 420) return 1;                      // a phone-sized window keeps the original layout
    return Math.max(1.25, Math.min(2, Math.round(Math.min(w / 1000, h / 560) * 20) / 20));   // v215b: bigger (a 1920x1080 laptop gets about x1.9)
  };
  // the HUD (corner panels, icons, hotbar) is scaled a little more than the windows, the pop-up toasts keep their normal size
  const hudOf = s => { if (get() !== 'auto' || touch()) return s; const w = innerWidth, h = innerHeight; if (w < 700 || h < 420) return s; return Math.max(1, Math.min(2.1, Math.round(Math.min(w / 1050, h / (h < 900 ? 575 : 620)) * 20) / 20)); };   // v230: the height counts more on short laptop windows (a 1366x650 window gets about x1.15, a full-HD one x1.75; it was x2.1 and felt too big)
  const factor = () => { const v = get(); return v === 'auto' ? auto() : Math.max(0.8, Math.min(2, (+v || 100) / 100)); };
  const st = document.createElement('style'); st.id = 'ui215'; document.head.appendChild(st);
  let last = 0;
  function apply() {
    const s = factor(), hs = hudOf(s), pm = Math.round((1 + (s - 1) * 0.15) * 100) / 100;   // every pop-up window (menus, phone, side panels) grows only a little   // the phone and the side panels are scaled less (they are already tall)
     if (Math.abs(s * 10 + hs - last) < 0.001) return; last = s * 10 + hs;
    window.UIScale = s; document.documentElement.style.setProperty('--ui-scale', String(s));
    if (s === 1) { st.textContent = ''; return; }
    st.textContent = `
      .hud, #prompt, #fps, #fishUI, #moveUI, #tut, #raceHud, #selName { zoom: ${hs}; }
      #modal .mbox { zoom: ${pm}; max-height: calc(min(84vh, 780px) / ${pm}) !important; width: min(720px, calc(100% / ${pm})) !important; }
      #modal.wide .mbox { width: min(940px, calc(100% / ${pm})) !important; }
      #modal.phone .mbox { zoom: ${pm}; width: min(420px, calc(100% / ${pm})) !important; max-height: calc(min(84vh, 780px) / ${pm}) !important; }
      html body #modal.phone .mbox, html body.phone189 #modal.phone .mbox, html body.ipad.ipm174 #modal.phone .mbox { max-height: calc((100dvh - 16px) / ${pm}) !important; }
      html body #modal.side .mbox, html body.ipad.ipm174 #modal.side .mbox { max-height: calc((100dvh - 16px) / ${pm}) !important; }
      #modal.side .mbox { zoom: ${pm}; width: min(380px, calc(100% / ${pm})) !important; max-height: calc(92vh / ${pm}) !important; }
      #hotbar { max-width: calc(100vw / ${hs} - 24px); }
      @media (max-width: 640px) { #modal.side .mbox { width: calc(100% / ${pm}) !important; max-height: calc(52vh / ${pm}) !important; } }
    `;
  }
  apply();
  addEventListener('resize', () => { try { apply(); } catch (e) { } });
  // the chooser in the settings window
  const OPT = [['auto', 'อัตโนมัติ'], ['100', '100%'], ['115', '115%'], ['130', '130%'], ['150', '150%'], ['175', '175%'], ['200', '200%']];
  { const _m = UI.menu; if (_m) UI.menu = function () {
    const r = _m.apply(this, arguments);
    try {
      const c = UI.cur, rr = c && c.render;
      if (rr && !c.sc215) {
        c.sc215 = 1;
        c.render = function () {
          const html = rr.apply(this, arguments), cur = get();
          return html + `<h5>🖥️ ขนาดตัวอักษรและเมนู (โน้ตบุ๊ก/คอมพิวเตอร์)</h5><p class="dim" style="margin:2px 4px 6px">ตอนนี้ ×${(window.UIScale || 1).toFixed(2)} · เลือกขนาดที่อ่านสบายตา (ใช้ได้ทันที)</p><div class="row" style="flex-wrap:wrap;gap:6px">${OPT.map(([v, n]) => `<button class="btn ${cur === v ? '' : 'ghost'}" data-a="uisc215" data-v="${v}">${n}</button>`).join('')}</div>`;
        };
        UI.renderBody();
      }
    } catch (e) { console.warn('v215 menu', e); }
    return r;
  }; }
  UI.H.uisc215 = d => { try { localStorage.setItem(KEY, d.v); } catch (e) { } last = 0; apply(); UI.renderBody(); };
  // keyboard: Ctrl + / Ctrl - / Ctrl 0 are browser zoom, so use Alt + (+ / -) for the game's own size
  addEventListener('keydown', e => { if (!e.altKey || e.ctrlKey || e.metaKey) return; const k = e.key; if (k !== '+' && k !== '=' && k !== '-' && k !== '0') return; const f = Math.round(factor() * 100), n = k === '0' ? 'auto' : String(Math.max(80, Math.min(200, f + (k === '-' ? -10 : 10)))); try { localStorage.setItem(KEY, n); } catch (x) { } last = 0; apply(); try { UI.toast('ขนาดหน้าจอเกม ×' + (window.UIScale || 1).toFixed(2), '🖥️'); } catch (x) { } e.preventDefault(); });
  window.UIScale215 = { apply, factor, auto };
});
