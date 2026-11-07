'use strict';
// ---------- v38 phone layout: a slim HUD, one ☰ menu for the rest, tidy bottom controls, windows that fit a short screen ----------
// Phones only (touch and a small screen). Desktop and tablets keep their layout. Force with ?ph=1 / ?ph=0 (remembered in localStorage 'raisukjai3d_ph').
V23.add('v38_mobile', () => {
  const $ = id => document.getElementById(id);
  const css = document.createElement('style');
  css.textContent = `
body.ph { --phs: env(safe-area-inset-top, 0px); --phr: env(safe-area-inset-right, 0px); --phb: env(safe-area-inset-bottom, 0px); --phl: env(safe-area-inset-left, 0px); --nfb: 0px; }
/* ---- top-left: one compact stats card ---- */
body.ph #hudTL { top: calc(6px + var(--phs)); left: calc(6px + var(--phl)); width: min(192px, 40vw); gap: 4px; }
body.ph #stats { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 6px; padding: 5px 8px 6px; border-radius: 12px; cursor: pointer; }
body.ph #money { grid-column: 1; grid-row: 1; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
body.ph #stats > .meta:not(#needs) { display: contents; }
body.ph #stats > .meta:not(#needs) #day, body.ph #stats > .meta:not(#needs) #season { display: none; }
body.ph #clock { grid-column: 2; grid-row: 1; font-size: 12.5px; justify-self: end; }
body.ph #wx { grid-column: 2; grid-row: 2; justify-self: end; font-size: 14px; }
body.ph #calFull { grid-column: 1; grid-row: 2; font-size: 12px; margin: 0; }
body.ph #enWrap { grid-column: 1; grid-row: 3; }
body.ph #stats > .bar:not(#enWrap):not(.xp) { grid-column: 2; grid-row: 3; min-width: 62px; }
body.ph .bar { height: 13px; } body.ph .bar span { font-size: 10.5px; line-height: 13px; padding-left: 4px; }
body.ph .lvrow { grid-column: 1 / -1; grid-row: 4; gap: 6px; font-size: 11.5px; }
body.ph .lvrow .bar.xp { height: 6px; }
body.ph #needs { grid-column: 1 / -1; grid-row: 5; display: flex; gap: 8px; font-size: 12px; flex-wrap: nowrap; }
body.ph #loc { display: none !important; }
body.ph #speed { grid-column: 1 / -1; font-size: 12px; }
body.ph.ph-min #stats > :not(#money):not(.meta:not(#needs)) { display: none !important; }
body.ph.ph-min #wx { display: none; }
body.ph #goal, body.ph #quest, body.ph #dailyCard, body.ph #hudToggle, body.ph #dock { display: none !important; }
/* ---- title screen on a short screen ---- */
body.ph #start { align-items: flex-start; overflow-y: auto; padding-top: max(8px, var(--phs)); padding-bottom: max(8px, var(--phb)); }
body.ph #start .sbox { padding: 10px 14px; gap: 6px; max-height: none; }
body.ph.ph-land #start .logo { font-size: 30px; line-height: 1.05; margin: 0; }
body.ph.ph-land #start .tag { font-size: 12.5px; margin: 2px 0; }
body.ph.ph-land #start .feat { display: none; }
body.ph #slots { gap: 6px; } body.ph #slots .slotbtn { min-width: 108px; padding: 6px 8px; font-size: 12.5px; }
/* ---- top-right: minimap + three quick buttons + ☰ ---- */
body.ph #hudTR { top: calc(6px + var(--phs)); right: calc(6px + var(--phr)); flex-direction: row-reverse; gap: 6px; align-items: flex-start; }
body.ph #mini { width: 76px; height: 76px; border-width: 2px; }
body.ph #hudTR .col { flex-direction: row; gap: 5px; }
body.ph #hudTR .col #bBook, body.ph #hudTR .col #bMenu { display: none; }
body.ph .ib { width: 42px; height: 42px; font-size: 20px; border-radius: 12px; }
body.ph #bPhone { order: 1; } body.ph #bInv { order: 2; } body.ph #bMap { order: 3; } body.ph #phMenuBtn { order: 4; }
#phMenuBtn { display: none; }
body.ph #phMenuBtn { display: grid; }
body.ph #phMenuBtn.on { background: rgba(255, 207, 63, .35) !important; border-color: var(--sun) !important; }
#phSheetBg { display: none; position: fixed; inset: 0; z-index: 29; }
#phSheet { display: none; position: fixed; z-index: 30; top: calc(92px + env(safe-area-inset-top, 0px)); right: calc(6px + env(safe-area-inset-right, 0px)); width: min(320px, calc(100vw - 12px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))); max-height: calc(100dvh - 100px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 8px; border-radius: 16px; grid-template-columns: 1fr 1fr; gap: 6px; }
body.ph-land #phSheet { top: calc(54px + env(safe-area-inset-top, 0px)); right: calc(88px + env(safe-area-inset-right, 0px)); width: min(330px, calc(100vw - 100px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))); max-height: calc(100dvh - 126px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); padding: 6px; gap: 5px; }
body.ph-land #phSheet button { min-height: 40px; padding: 4px 8px; font-size: 13px; }
body.ph.ph-sheet #phSheetBg { display: block; } body.ph.ph-sheet #phSheet { display: grid; }
body.ph.modal-open #phSheet, body.ph.modal-open #phSheetBg { display: none; }
#phSheet button { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 10px; border-radius: 12px; font-size: 13.5px; text-align: left; color: var(--ink); line-height: 1.2; }
#phSheet button .pi { font-size: 21px; flex: none; width: 26px; text-align: center; }
#phSheet button .pb { margin-left: auto; background: #e53935; color: #fff; border-radius: 10px; font-size: 11px; padding: 1px 6px; }
/* ---- toasts: small, two at most, between the stats card and the minimap ---- */
body.ph #toasts { top: calc(6px + var(--phs)); left: calc(min(192px, 40vw) + 16px + var(--phl)); transform: none; width: calc(100vw - min(192px, 40vw) - 16px - 282px - var(--phl) - var(--phr)); max-width: 420px; min-width: 150px; align-items: flex-start; gap: 4px; }
body.ph .toast { font-size: 12.5px; padding: 5px 10px; border-radius: 11px; max-width: 100%; }
body.ph .toast .ti { font-size: 15px; }
body.ph .toast > span:last-child { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
body.ph #toasts .toast:nth-last-child(n+3) { display: none; }
body.ph #fps { top: auto; bottom: calc(2px + var(--phb)); left: calc(6px + var(--phl)); transform: none; font-size: 10px; padding: 2px 5px; opacity: .6; }
/* ---- bottom: hotbar centre, joystick left, actions right ---- */
body.ph #hudB { bottom: calc(6px + var(--phb)); gap: 2px; max-width: calc(100vw - 2 * 118px - var(--phl) - var(--phr)); }
body.ph #selName { font-size: 11px; min-height: 13px; }
body.ph #hotbar { gap: 3px; padding: 3px; border-radius: 12px; }
body.ph .slot { width: 38px; height: 38px; border-radius: 9px; } body.ph .slot .si { font-size: 19px; } body.ph .slot i { display: none; } body.ph .slot b { font-size: 10.5px; }
body.ph #joyHint { left: calc(14px + var(--phl)); bottom: calc(14px + var(--phb)); width: 70px; height: 70px; font-size: 11px; }
body.ph:not(.driving) #hudBR { right: calc(8px + var(--phr)); bottom: calc(8px + max(var(--phb), var(--nfb))); flex-direction: column; align-items: flex-end !important; gap: 6px; max-width: 168px; }
body.ph:not(.driving) #hudBR > .col { flex-direction: row; gap: 6px; }
body.ph:not(.driving) #hudBR .sb { width: 42px; height: 42px; font-size: 19px; }
body.ph:not(.driving) #bAct { width: 72px; height: 72px; }
body.ph:not(.driving) #bAct #actIcon { font-size: 26px; }
body.ph:not(.driving) #bAct #actLbl { font-size: 10.5px; max-width: 64px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
body.ph:not(.driving) #bEnter, body.ph:not(.driving) #bCar { height: 42px; font-size: 14px; padding: 0 12px; }
body.ph.driving #hudTR .col #bBook, body.ph.driving #hudTR .col #bMenu { display: none; }
/* ---- interaction hint above the action button ---- */
body.ph #prompt { left: auto !important; right: calc(8px + var(--phr)) !important; transform: none !important; bottom: var(--phprompt, 140px) !important; max-width: 44vw !important; min-height: 34px !important; padding: 3px 10px 3px 5px !important; font-size: 12.5px !important; gap: 6px !important; border-radius: 17px !important; line-height: 1.2 !important; }
body.ph #prompt:active { transform: scale(.97) !important; }
body.ph #prompt kbd { min-width: 24px; height: 24px; font-size: 13px; }
body.ph #prompt:not([hidden]) { display: block !important; }
body.ph #tut { bottom: calc(66px + var(--phb)); left: 50%; max-width: calc(100vw - 2 * 120px); padding: 6px 10px; font-size: 12px; gap: 6px; border-radius: 12px; }
/* ---- phone held upright: buttons under the minimap, wider stats card, toasts under the top block, hotbar bottom-left ---- */
body.ph-port #hudTL { width: min(230px, calc(100vw - 187px - var(--phl) - var(--phr))); }
body.ph-port .ib { width: 38px; height: 38px; font-size: 18px; }
body.ph-port #hudTR .col { gap: 4px; }
body.ph-port #hudTR { flex-direction: column; align-items: flex-end; gap: 6px; }
body.ph-port #toasts { top: calc(140px + var(--phs)); left: 50%; transform: translateX(-50%); width: calc(100vw - 24px - var(--phl) - var(--phr)); max-width: 420px; align-items: center; }
body.ph-port #phSheet { top: calc(138px + var(--phs)); }
body.ph-port #hudB { left: calc(8px + var(--phl)); transform: none; align-items: flex-start; max-width: calc(100vw - 100px - var(--phl) - var(--phr)); }
body.ph-port #joyHint { bottom: calc(96px + var(--phb)); }
body.ph-port #prompt { max-width: 62vw !important; }
@media (max-width: 380px) { body.ph #money { font-size: 13px; } }
body.ph-port #fps { bottom: auto; top: calc(142px + var(--phs)); left: auto; right: calc(6px + var(--phr)); }
/* ---- windows: fit the screen, scroll inside, close always visible ---- */
body.ph #modal { padding: max(6px, var(--phs)) max(8px, var(--phr)) max(6px, var(--phb)) max(8px, var(--phl)); }
body.ph .mbox, body.ph #modal.wide .mbox { max-height: calc(100dvh - 12px - var(--phs) - var(--phb)); border-radius: 16px; }
body.ph #modal.side .mbox { max-height: calc(100dvh - 12px - var(--phs) - var(--phb)); }
body.ph .mhead { padding: 8px 10px 6px 14px; gap: 8px; }
body.ph .mhead h2 { font-size: 16.5px; }
body.ph #mClose { width: 40px; height: 40px; }
body.ph #mTabs { padding: 0 10px 6px; } body.ph #mTabs button { padding: 7px 12px; font-size: 13px; min-height: 36px; }
body.ph #mBody { padding: 4px 10px 12px; font-size: 14px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; min-height: 0; }
body.ph .btn { min-height: 40px; }
body.ph .ph-land #modal { align-items: center; }
body.ph.ph-land .mbox { max-height: calc(100dvh - 12px - var(--phs) - var(--phb)); }
body.ph #modal.phone .mbox { width: min(400px, 100%); }
body.ph.ph-land #modal.phone .mbox { width: min(400px, 62vw); }
body.ph .card { padding: 8px 10px; } body.ph .ci { width: 38px; height: 38px; font-size: 26px; }
body.ph .grid { gap: 8px; }
body.ph #fishCancel { top: calc(8px + var(--phs)); }
body.ph .fpanel { bottom: calc(10px + var(--phb)); width: min(380px, calc(100vw - 24px)); }
body.ph #moveUI { top: calc(54px + var(--phs)); }
`;
  document.head.appendChild(css);

  // ---- the ☰ button and its sheet; items click the original buttons so every handler keeps working ----
  const menuBtn = document.createElement('button'); menuBtn.id = 'phMenuBtn'; menuBtn.className = 'panel ib'; menuBtn.textContent = '☰'; menuBtn.title = 'เมนู'; menuBtn.setAttribute('aria-label', 'เมนู');
  const col = document.querySelector('#hudTR .col'); if (col) col.appendChild(menuBtn);
  const bg = document.createElement('div'); bg.id = 'phSheetBg'; document.body.appendChild(bg);
  const sheet = document.createElement('div'); sheet.id = 'phSheet'; sheet.className = 'panel'; document.body.appendChild(sheet);
  const closeSheet = () => { document.body.classList.remove('ph-sheet'); menuBtn.classList.remove('on'); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const splitIcon = (txt, fallback) => { const t = (txt || '').trim(); const m = t.match(/^(\S+)\s*(.*)$/u); return m && !/^[A-Za-z0-9ก-๙(]/.test(m[1]) ? [m[1], m[2] || fallback] : ['•', t || fallback]; };
  const buildItems = () => {
    const items = [];
    const add = (el, icon, label, badge) => { if (el) items.push({ el, icon, label, badge }); };
    for (const id of ['bBook', 'bMenu']) { const b = $(id); if (b) add(b, b.textContent.trim().split(/\s+/)[0], (b.title || '').replace(/\s*\([A-Z]\)\s*$/, '') || b.textContent.trim()); }
    document.querySelectorAll('#dock button').forEach(b => add(b, b.textContent.trim().split(/\s+/)[0], (b.title || '').replace(/\s*\([A-Z]\)\s*$/, '')));
    const daily = $('dailyCard'); if (daily) add(daily, '🎯', 'ภารกิจวันนี้');
    const goal = $('goal'); if (goal && !goal.hidden) add(goal, '🎯', ($('goalTxt') || {}).textContent || 'เป้าหมาย');
    const quest = $('quest'); if (quest && !quest.hidden) add(quest, '📜', ($('questT') || {}).textContent || 'ภารกิจ');
    add($('stats'), $('stats') && document.body.classList.contains('ph-min') ? '⬇️' : '⬆️', document.body.classList.contains('ph-min') ? 'ขยายแผงข้อมูล' : 'ย่อแผงข้อมูล');
    return items;
  };
  const openSheet = () => {
    sheet.innerHTML = '';
    const items = buildItems();
    items.forEach(it => {
      const b = document.createElement('button'); b.className = 'panel';
      b.innerHTML = `<span class="pi">${esc(it.icon)}</span><span>${esc(it.label)}</span>`;
      b.addEventListener('click', e => {
        e.stopPropagation(); closeSheet();
        if (it.el.id === 'stats') { toggleMin(); return; }
        setTimeout(() => it.el.click(), 0);
      });
      sheet.appendChild(b);
    });
    document.body.classList.add('ph-sheet'); menuBtn.classList.add('on');
  };
  menuBtn.addEventListener('click', e => { e.stopPropagation(); document.body.classList.contains('ph-sheet') ? closeSheet() : openSheet(); });
  bg.addEventListener('pointerdown', e => { e.preventDefault(); closeSheet(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  // ---- collapsible stats card: tap it to keep only money and clock ----
  let minKey = 'raisukjai3d_ph_min';
  const getMin = () => { try { return localStorage.getItem(minKey) === '1'; } catch (e) { return false; } };
  const toggleMin = () => { const v = !document.body.classList.contains('ph-min'); document.body.classList.toggle('ph-min', v); try { localStorage.setItem(minKey, v ? '1' : '0'); } catch (e) { } };
  const stats = $('stats'); if (stats) stats.addEventListener('click', () => { if (document.body.classList.contains('ph')) toggleMin(); });
  document.body.classList.toggle('ph-min', getMin());

  // ---- is this a phone? ----
  const forced = () => { try { const q = new URLSearchParams(location.search).get('ph'); if (q === '1' || q === '0') localStorage.setItem('raisukjai3d_ph', q); return localStorage.getItem('raisukjai3d_ph'); } catch (e) { return null; } };
  const isPhone = () => {
    const f = forced(); if (f === '0') return false; if (f === '1') return true;
    const touch = document.body.classList.contains('touch') || matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    return (touch && (Math.min(innerWidth, innerHeight) <= 500 || innerWidth <= 480)) || innerHeight <= 520 || innerWidth <= 480;   // a short or narrow window (phone, or a small desktop window) gets the compact layout too: the full desktop HUD does not fit in under 520 px of height
  };
  // the badge Netlify puts in the bottom-right corner: lift the action buttons above it instead of sitting under it
  const badgeLift = () => {
    let lift = 0;
    for (const id of ['nl-badge-frame', 'nl-hud-frame']) {
      const f = $(id); if (!f) continue; const r = f.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || getComputedStyle(f).display === 'none') continue;
      if (r.right > innerWidth - 220) lift = Math.max(lift, Math.round(innerHeight - r.top) + 4);
    }
    return lift;
  };
  let lastLift = -1, lastPrompt = -1;
  const apply = () => {
    const ph = isPhone(), b = document.body;
    b.classList.toggle('ph', ph);
    b.classList.toggle('ph-land', ph && innerWidth > innerHeight); b.classList.toggle('ph-port', ph && innerWidth <= innerHeight);
    if (!ph) closeSheet();
    const lift = ph ? badgeLift() : 0;
    if (lift !== lastLift) { lastLift = lift; b.style.setProperty('--nfb', lift + 'px'); }
    if (ph) { const hb = $('hudBR'); if (hb) { const r = hb.getBoundingClientRect(); const v = Math.max(60, Math.round(innerHeight - r.top + 6)); if (v !== lastPrompt) { lastPrompt = v; b.style.setProperty('--phprompt', v + 'px'); } } }
  };
  // the date in one short line, e.g. "จ. 26 ต.ค. 69"
  const _hud = UI.hud.bind(UI);
  UI.hud = function () {
    _hud();
    if (!document.body.classList.contains('ph') || typeof Cal36 === 'undefined' || !S) return;
    const el = $('calFull'); if (!el) return;
    let t; try { t = Cal36.short(S.day); } catch (e) { return; }
    if (t && el.textContent !== t) el.textContent = t;
  };
  const hb0 = $('hudBR');
  if (hb0 && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { lastPrompt = -1; apply(); }).observe(hb0);
  addEventListener('resize', apply); addEventListener('orientationchange', () => setTimeout(apply, 300));
  setInterval(apply, 500);
  apply();
  window.Mob38 = { apply, isPhone, openSheet, closeSheet, toggleMin };
});
