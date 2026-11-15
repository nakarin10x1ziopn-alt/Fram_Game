'use strict';
// ---------- v256: the agenda picker is a fixed popup you choose from yourself ----------
// A button on the board page opens a popup that stays in the middle of the screen: the title, the search box and the buttons stay in place and only the list scrolls.
//  - the list keeps its scroll position when you tick or untick something (it used to jump), and the tick shows at once
//  - search: type to show only the matching items; "ไปวาระ" jumps to a group without moving anything else
//  - big targets (about 56 px), no double-tap zoom, the number chosen is always shown, "ล้างที่เลือก" empties the choice
//  - nothing is chosen for you: only what you tick is sent (the meeting mode with the routine items is chosen on the page, as before)
V23.add('v256_agpop', function () {
  if (typeof UI === 'undefined') return;
  if (!document.getElementById('agpopcss256')) {
    const st = document.createElement('style'); st.id = 'agpopcss256';
    st.textContent = `
      #agpop256, #agpop256 * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      #agpop256 { position: fixed; inset: 0; z-index: 95; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 10px; }
      #agpop256 .agbox { width: min(560px, 100%); height: min(88dvh, 760px); display: flex; flex-direction: column; background: var(--panel-solid, #183424); border: 1px solid var(--line, rgba(255,255,255,.2)); border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,.55); overflow: hidden; }
      #agpop256 .agh { flex: 0 0 auto; padding: 12px 14px 10px; border-bottom: 1px solid var(--line, rgba(255,255,255,.15)); }
      #agpop256 .agh .r1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 16px; }
      #agpop256 .agh .r2 { display: flex; gap: 8px; margin-top: 8px; }
      #agpop256 .agh input, #agpop256 .agh select { flex: 1 1 0; min-width: 0; min-height: 42px; padding: 8px 12px; border-radius: 12px; font-size: 16px; background: rgba(255,255,255,.08); color: var(--ink, #f4f7ee); border: 1px solid rgba(255,255,255,.22); }
      #agpop256 .agh select { flex: 0 0 44%; }
      #agpop256 .agl { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-anchor: none; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 8px 14px 14px; }
      #agpop256 .agf { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--line, rgba(255,255,255,.15)); }
      #agpop256 .agf .cnt { font-size: 15px; }
      #agpop256 .btn { min-height: 44px; }
      #agpop256 .agl p.dim { margin: 14px 2px 4px; font-size: 13px; color: #ffd98a; }
      #agpop256 .agl p.dim b { font-weight: 600; }
      #agpop256 .agl button[data-a="ag217tog"] { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; margin: 6px 0; padding: 10px 14px; text-align: left; white-space: normal; border-radius: 14px; background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)); border: 1px solid rgba(255,255,255,.14); color: var(--ink, #f4f7ee); font-size: 15px; line-height: 1.45; }
      #agpop256 .agl button[data-a="ag217tog"]:active { background: rgba(255,255,255,.14); }
      #agpop256 .agl button[data-a="ag217tog"].on { background: linear-gradient(180deg, rgba(255,207,63,.22), rgba(255,207,63,.10)); border-color: rgba(255,207,63,.7); box-shadow: 0 0 0 1px rgba(255,207,63,.25) inset; }
      #agpop256 .agck { flex: 0 0 28px; width: 28px; height: 28px; border-radius: 8px; border: 2px solid rgba(255,255,255,.4); display: inline-flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #1b2a14; background: rgba(0,0,0,.25); }
      #agpop256 .agck.on { background: linear-gradient(180deg, #ffe07a, #ffc233); border-color: #ffd54f; }
      #agpop256 .aglbl { flex: 1 1 auto; min-width: 0; }
      #agpop256 .agnone { padding: 18px 4px; color: rgba(244,247,238,.7); }`;
    document.head.appendChild(st);
  }
  let open = null;   // { cid, kind }
  let q = '';
  const src = () => open && document.querySelector(`.ag256src[data-cid="${open.cid}"][data-kind="${open.kind}"]`);
  const el = id => document.getElementById(id);
  // the page's list -> cards: a real tick box and a label (the plain ☐/☑ of the page stays as the source of the state)
  const dress = root => {
    root.querySelectorAll('button[data-a="ag217tog"]').forEach(btn => {
      const t = btn.textContent.trim(), on = t.startsWith('☑'), label = t.replace(/^[☐☑]\s*/, '');
      btn.classList.toggle('on', on); btn.innerHTML = '<span class="agck' + (on ? ' on' : '') + '">' + (on ? '✓' : '') + '</span><span class="aglbl"></span>'; btn.querySelector('.aglbl').textContent = label; btn.dataset.lbl = label.toLowerCase();
    });
  };
  const groups = root => [...root.querySelectorAll('p.dim')].filter(p => p.querySelector('b'));
  const filter = root => {
    const s = q.trim().toLowerCase();
    root.querySelectorAll('button[data-a="ag217tog"]').forEach(b => { b.style.display = !s || (b.dataset.lbl || '').includes(s) ? '' : 'none'; });
    // a group title stays only if one of its items is shown
    groups(root).forEach(p => { let n = p.nextElementSibling, any = false; while (n && !(n.tagName === 'P' && n.classList.contains('dim'))) { if (n.tagName === 'BUTTON' && n.style.display !== 'none') any = true; n = n.nextElementSibling; } p.style.display = any || !s ? '' : 'none'; });
    if (s && ![...root.querySelectorAll('button[data-a="ag217tog"]')].some(b => b.style.display !== 'none')) { const d = document.createElement('div'); d.className = 'agnone'; d.textContent = 'ไม่พบวาระที่ค้นหา'; root.appendChild(d); }
  };
  const paint = (keep) => {
    const box = el('agpop256'); if (!open || !box) return;
    const s = src(), list = box.querySelector('.agl'), y = keep === false ? 0 : list.scrollTop;
    const tmp = document.createElement('div'); tmp.innerHTML = s ? s.innerHTML : '<p class="agnone">ไม่มีรายการให้เลือกแล้ว</p>';
    dress(tmp); filter(tmp);                                  // everything is built away from the screen, so the list changes in one step and keeps its place
    list.replaceChildren(...tmp.childNodes); list.scrollTop = y; requestAnimationFrame(() => { if (Math.abs(list.scrollTop - y) > 1) list.scrollTop = y; });
    const n = (s && [...s.querySelectorAll('button[data-a="ag217tog"]')].filter(b => b.textContent.trim().startsWith('☑')).length) || 0, all = s ? s.querySelectorAll('button[data-a="ag217tog"]').length : 0;
    box.querySelector('.cnt').innerHTML = `เลือกแล้ว <b>${n}</b> วาระ <span class="dim">(จาก ${all})</span>`;
    box.querySelector('[data-pop="clear"]').disabled = !n;
    const sel = box.querySelector('select'); if (sel && sel.options.length <= 1) { const g = groups(tmp).map(p => p.textContent.trim()); g.forEach((t, i) => sel.add(new Option(t.replace(/^วาระที่\s*/, 'วาระที่ ').slice(0, 34), String(i)))); }
  };
  const close = () => { const b = el('agpop256'); if (b) b.remove(); open = null; q = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  UI.H.agpop = d => {
    const old = el('agpop256'); if (old) old.remove();
    open = { cid: d.v, kind: d.k }; q = '';
    const b = document.createElement('div'); b.id = 'agpop256';
    b.innerHTML = `<div class="agbox" role="dialog" aria-modal="true"><div class="agh"><div class="r1"><b>📋 เลือกวาระการประชุม</b><button class="btn ghost" data-pop="close">✕ ปิด</button></div><div class="r2"><input type="search" placeholder="🔍 ค้นหาวาระ" aria-label="ค้นหาวาระ"><select aria-label="ไปที่วาระ"><option value="">ไปที่วาระ…</option></select></div></div><div class="agl"></div><div class="agf"><span class="cnt"></span><span><button class="btn ghost" data-pop="clear">ล้างที่เลือก</button> <button class="btn" data-pop="close">เสร็จ</button></span></div></div>`;
    document.body.appendChild(b);
    b.addEventListener('click', e => {
      if (e.target === b) { close(); return; }
      const x = e.target.closest('[data-pop]');
      if (x) { if (x.dataset.pop === 'close') { close(); return; } if (x.dataset.pop === 'clear' && !x.disabled) { const h = UI.H.ag217clr; if (h) h({ v: open.cid, k: open.kind }); try { UI.renderBody(); } catch (er) { } paint(); } return; }
      const t = e.target.closest('[data-a]'); if (!t || t.disabled) return;
      if (t.dataset.a === 'ag217tog') { const on = !t.classList.contains('on'); t.classList.toggle('on', on); const ck = t.querySelector('.agck'); if (ck) { ck.classList.toggle('on', on); ck.textContent = on ? '✓' : ''; } }   // the tick shows at once
      const h = UI.H[t.dataset.a]; if (h) h(t.dataset);
      try { UI.renderBody(); } catch (er) { }   // the page behind is redrawn; the list below keeps its place
      paint();
    });
    b.querySelector('input').addEventListener('input', e => { q = e.target.value; paint(); });
    b.querySelector('select').addEventListener('change', e => {
      const i = e.target.value; if (i === '') return; const list = b.querySelector('.agl'), g = groups(list)[+i]; if (g) list.scrollTop = Math.max(0, g.offsetTop - list.offsetTop - 4); e.target.value = '';
    });
    document.addEventListener('keydown', onKey);
    paint(false);
  };
  // while the popup is open the list follows the page when it is redrawn (the choices are read from the page's hidden copy)
  const _rb = UI.renderBody.bind(UI);
  UI.renderBody = function () { const r = _rb(); if (open) { try { paint(); } catch (e) { } } return r; };
  window.AgPop256 = { open: () => open, close, paint };
});
