// v95_toastfront.js: notifications are always visible, readable and recoverable
//  - toasts used to sit BEHIND windows (z-index 20 under the 60 of the phone) and, on the phone layout, in a small slot the open phone covers. While a window is open they now move to the top
//    centre above everything, a little bigger with a gold edge
//  - they stay as long as the text needs to be read (about 4.5 s for a short line up to 15 s for a long one, such as "a limited company needs at least 2 shareholders ..."), and a tap dismisses them at once
//  - the last 20 notifications are kept: a small 🔔 button (top right, shown while a window is open) lists them again with the time, so a message you missed is never lost
V23.add('v95_toastfront', () => {
  const css = document.createElement('style');
  css.textContent = `
body.modal-open #toasts { z-index: 400 !important; position: fixed !important; top: calc(8px + env(safe-area-inset-top, 0px)) !important; left: 50% !important; right: auto !important; transform: translateX(-50%) !important; width: min(480px, calc(100vw - 64px)) !important; max-width: none !important; }
body.modal-open #toasts .toast { pointer-events: auto !important; font-size: 14.5px !important; padding: 9px 14px !important; background: rgba(12, 38, 26, .97) !important; border: 1px solid #ffd54f !important; box-shadow: 0 10px 30px rgba(0, 0, 0, .6) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
body.modal-open #toasts .toast:nth-last-child(n+4) { display: none !important; }
#tlog95 { position: fixed; top: calc(8px + env(safe-area-inset-top, 0px)); right: 8px; z-index: 401; width: 40px; height: 40px; border-radius: 50%; border: 1px solid #ffd54f; background: rgba(12, 38, 26, .95); color: #fff; font-size: 20px; display: none; place-items: center; cursor: pointer; padding: 0; }
#tlog95 b { position: absolute; top: -4px; right: -4px; min-width: 17px; height: 17px; padding: 0 4px; box-sizing: border-box; border-radius: 9px; background: #e53935; color: #fff; font-size: 11px; line-height: 17px; font-weight: 700; display: none; }
#tlog95.unread b { display: block; }
#tlogbox95 { position: fixed; z-index: 410; top: calc(54px + env(safe-area-inset-top, 0px)); right: 8px; width: min(420px, calc(100vw - 16px)); max-height: 60vh; overflow: auto; background: rgba(10, 30, 21, .98); border: 1px solid #ffd54f; border-radius: 14px; padding: 8px 10px; box-shadow: 0 12px 34px rgba(0, 0, 0, .65); display: none; }
#tlogbox95.on { display: block; }
#tlogbox95 p { margin: 0; padding: 7px 2px; border-bottom: 1px solid rgba(255, 255, 255, .12); font-size: 13.5px; line-height: 1.4; }
#tlogbox95 small { opacity: .6; }`;
  document.head.appendChild(css);
  const LOG = [];
  const btn = document.createElement('button'); btn.id = 'tlog95'; btn.textContent = '🔔'; btn.insertAdjacentHTML('beforeend', '<b></b>'); btn.title = 'ข้อความแจ้งเตือนล่าสุด'; document.body.appendChild(btn);
  const box = document.createElement('div'); box.id = 'tlogbox95'; document.body.appendChild(box);
  const clock = () => { try { return Cal36.hhmm(); } catch (e) { const m = Math.floor(S.time); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); } };
  const render = () => { box.innerHTML = (LOG.length ? '<p style="text-align:right"><button data-clear95="1" class="btn ghost" style="padding:3px 10px;min-height:0">🗑️ ล้างทั้งหมด</button></p>' : '') + (LOG.slice().reverse().map(l => `<p><small>${l.t}</small> ${l.i} ${l.m}</p>`).join('') || '<p>ยังไม่มีข้อความ</p>'); };
  let unread = 0; const badge = () => { btn.classList.toggle('unread', unread > 0); const b = btn.querySelector('b'); if (b) b.textContent = unread > 9 ? '9+' : String(unread); };
  btn.addEventListener('click', e => { e.stopPropagation(); unread = 0; badge(); render(); box.classList.toggle('on'); });
  document.addEventListener('pointerdown', e => { if (box.classList.contains('on') && !box.contains(e.target) && !btn.contains(e.target)) box.classList.remove('on'); }, true);
  box.addEventListener('click', e => { if (e.target && e.target.dataset && e.target.dataset.clear95) { LOG.length = 0; render(); e.stopPropagation(); return; } box.classList.remove('on'); });
  setInterval(() => { let on = false; try { on = !!(G && G.started && S); } catch (e) { } btn.style.display = on ? 'grid' : 'none'; if (!on) box.classList.remove('on'); }, 500);   // v1.1: the bell sits at the top all the time (it used to show only while a window / the map was open)
  const esc2 = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const _t = UI.toast.bind(UI);
  UI.toast = function (msg, icon) {
    const holder = document.getElementById('toasts'), last0 = holder ? holder.lastElementChild : null;
    const r = _t.apply(this, arguments);
    try {
      if (holder) {
        const t = holder.lastElementChild;
        if (t && t !== last0) {
          const text = String(msg == null ? '' : msg); LOG.push({ t: clock(), i: icon || '', m: esc2(text) }); if (LOG.length > 20) LOG.shift(); if (!box.classList.contains('on')) { unread++; badge(); } else render();
          const life = Math.min(15000, Math.max(4500, 3200 + text.length * 90)), c = t.cloneNode(true);
          holder.replaceChild(c, t);
          const kill = () => { c.classList.add('out'); setTimeout(() => c.remove(), 450); };
          c.addEventListener('click', e => { e.stopPropagation(); kill(); });
          setTimeout(kill, life);
        }
      }
    } catch (e) { }
    return r;
  };
  window.ToastFront95 = { test: () => UI.toast('ทดสอบข้อความแจ้งเตือน', '🔔'), log: LOG };
});
