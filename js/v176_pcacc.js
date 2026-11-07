'use strict';
// ---------- v176_pcacc: accessories INSTALLED in a computer (monitors, UPS, keyboard, mouse, headset ...) ----------
//  Before: monitors / UPS / peripherals were just items in the bag, "counted" for the whole game, so it was never clear which one was in use and selling one broke the setup.
//  Now: like the CPU / GPU / RAM, every computer has accessory slots. Buy the item, install it on a computer (IT centre > Computers > Accessories, or it is installed for you when you buy it),
//  take it out again to use it somewhere else. Only INSTALLED accessories work. Selling or taking apart a computer returns its accessories to the bag.
//  UPS: it really carries the computer through a power cut (runtime depends on its VA and the computer's load; an overloaded UPS carries nothing) and can also feed the cameras / network.
V23.add('v176_pcacc', () => {
  if (typeof PC === 'undefined' || typeof PC_PARTS === 'undefined' || typeof UI === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const bS = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '🔌'); } catch (e) { } };
  const st = () => { const s = S.v176 = S.v176 || {}; if (s.auto == null) s.auto = 1; return s; };
  const now = () => S.day * 1440 + S.time;

  // ----- slots -----
  const SLOTS = [
    ['mon', '🖥️', 'จอภาพ', 3], ['ups', '🔋', 'เครื่องสำรองไฟ (UPS)', 1], ['kb', '⌨️', 'คีย์บอร์ด', 1], ['mouse', '🖱️', 'เมาส์', 1], ['headset', '🎧', 'หูฟัง', 1], ['webcam', '📷', 'เว็บแคม', 1],
    ['mic', '🎙️', 'ไมโครโฟน', 1], ['speaker', '🔊', 'ลำโพง', 1], ['net', '🌐', 'เราเตอร์ / สวิตช์', 2], ['print', '🖨️', 'ปริ้นเตอร์', 1], ['furn', '🪑', 'โต๊ะ / เก้าอี้', 2],
    ['vr', '🥽', 'VR / จอยเกม', 2], ['console', '🎮', 'คอนโซลเกม', 1], ['addon', '🎛️', 'การ์ดเสริม / อุปกรณ์เสียง', 3], ['stor', '🗃️', 'ที่เก็บข้อมูลภายนอก / NAS', 3], ['cable', '🔌', 'สายและปลั๊กพ่วง', 3],
  ];
  const SL = Object.fromEntries(SLOTS.map(s => [s[0], s]));
  const grpOf = k => { const P = PC_PARTS[k]; if (!P) return null; if (P.s === 'mon') return 'mon'; if (P.s === 'per') return P.g || (k === 'ups' ? 'ups' : null); return null; };
  const accOf = pc => { if (!pc.acc) pc.acc = {}; return pc.acc; };
  const listOf = (pc, g) => { const a = accOf(pc); return a[g] || (a[g] = []); };
  const pcName = pc => pc.name || 'คอมพิวเตอร์';
  const bagKeys = g => Object.keys(PC_PARTS).filter(k => grpOf(k) === g && count('pc_' + k) > 0);
  const nameOf = k => (PC_PARTS[k] || {}).n || k;

  // ----- UPS model -----
  const vaOf = k => { const m = /(\d{3,5})\s*VA/i.exec(nameOf(k)); return m ? +m[1] : 650; };
  const onlineOf = k => /ออนไลน์|online/i.test(nameOf(k));
  const loadOf = pc => Math.round((+pc.w || 200) * 0.6 + listOf(pc, 'mon').length * 30 + 10);
  const upsOf = pc => { const l = listOf(pc, 'ups'); return l[0] || null; };
  const camW = () => { try { return Math.max(20, Sec.watts('home')); } catch (e) { return 20; } };
  const totalLoad = pc => loadOf(pc) + (accOf(pc).upsShare ? camW() : 0);
  const ratedW = k => Math.round(vaOf(k) * 0.6 * (onlineOf(k) ? 1.1 : 1));
  const runMin = pc => { const u = upsOf(pc); if (!u) return 0; const L = totalLoad(pc); if (L > ratedW(u)) return 0; return Math.round(vaOf(u) * 0.25 * (onlineOf(u) ? 1.3 : 1) / L * 60); };
  const dark = () => { try { return (typeof Grid !== 'undefined' && Grid.st().src === 'none') || (typeof Power !== 'undefined' && Power.st && Power.st().trip > 0) || !!S.powerOff; } catch (e) { return false; } };
  setInterval(() => { try { const s = st(); if (!S || !S.day) return; if (dark()) { if (!s.out0) s.out0 = now(); } else s.out0 = 0; } catch (e) { } }, 1000);
  const elapsed = () => { const s = st(); return s.out0 ? now() - s.out0 : 0; };
  const covered = pc => !dark() || (runMin(pc) > 0 && elapsed() <= runMin(pc));
  const pcs = () => S.pcs || [];
  const bestPc = () => pcs().filter(p => !p.broken).reduce((a, b) => (!a || (b.score || 0) > (a.score || 0) ? b : a), null) || pcs()[0] || null;
  const live = () => pcs().filter(p => !p.broken && p.os !== null);
  window.PCAcc176 = {
    SLOTS, groupOf: grpOf, runMin, ratedW, loadOf, totalLoad, dark, elapsed,
    powerOk: () => !dark() || pcs().some(p => covered(p)),
    jobOk: () => !dark() || (() => { const b = bestPc(); return !!b && covered(b); })(),
    // UPS capacity / load that the camera system may count on (only UPS units switched to "feed the cameras")
    shared: () => { let va = 0, w = 0; for (const p of pcs()) { const u = upsOf(p); if (u && accOf(p).upsShare) { va += vaOf(u) * (onlineOf(u) ? 1.3 : 1); w += loadOf(p); } } return { va, w }; },
    installed: g => pcs().reduce((a, p) => a.concat(listOf(p, g)), []),
    has: g => pcs().some(p => listOf(p, g).length > 0),
    pcCovers: covered,
  };

  // ----- install / remove -----
  const NOAUTO = { on: 0 };
  function install(pc, k, quiet) {
    const g = grpOf(k); if (!g || !pc) return false; if (count('pc_' + k) < 1) { toast('ไม่มีชิ้นนี้ในกระเป๋า', 'ℹ️'); return false; }
    const l = listOf(pc, g), cap = SL[g][3]; let swapped = null;
    if (l.length >= cap) { if (cap === 1 || quiet) { if (quiet) return false; swapped = l.shift(); } else { toast(`${SL[g][2]}ของเครื่องนี้ครบ ${cap} ชิ้นแล้ว ถอดอันเก่าออกก่อน`, 'ℹ️'); return false; } }
    takeItem('pc_' + k, 1); l.push(k);
    if (swapped) { NOAUTO.on = 1; try { addItem('pc_' + swapped, 1); } finally { NOAUTO.on = 0; } }
    if (!quiet) toast(`ติดตั้ง ${nameOf(k)} ที่ "${pcName(pc)}" แล้ว${swapped ? ' (ถอดอันเดิมเก็บเข้ากระเป๋า)' : ''}`, SL[g][1]);
    return true;
  }
  function remove(pc, g, idx) {
    const l = listOf(pc, g), k = l[idx]; if (!k) return; l.splice(idx, 1); NOAUTO.on = 1; try { addItem('pc_' + k, 1); } finally { NOAUTO.on = 0; }
    if (g === 'ups' && accOf(pc).upsShare) accOf(pc).upsShare = 0;
    toast(`ถอด ${nameOf(k)} ออกจาก "${pcName(pc)}" เก็บเข้ากระเป๋าแล้ว`, SL[g][1]);
  }
  function giveBack(pc) { const a = accOf(pc); for (const g of Object.keys(a)) if (Array.isArray(a[g])) { NOAUTO.on = 1; try { for (const k of a[g]) addItem('pc_' + k, 1); } finally { NOAUTO.on = 0; } a[g] = []; } a.upsShare = 0; }
  // buying one: it is installed for you on the best computer when there is a free slot (switch off in the accessories window)
  { const _add = window.addItem || addItem;
    const wrapped = function (id, n) {
      const r = _add.apply(this, arguments);
      try { if (!NOAUTO.on && st().auto && typeof id === 'string' && id.indexOf('pc_') === 0 && grpOf(id.slice(3)) && pcs().length) { const pc = bestPc(); if (pc) { const k = id.slice(3); const want = Math.max(1, n | 0); for (let i = 0; i < want; i++) { if (!install(pc, k, true)) break; } if (listOf(pc, grpOf(k)).includes(k)) toast(`ติดตั้ง ${nameOf(k)} ที่ "${pcName(pc)}" ให้แล้ว (ดู/ถอดได้ที่ ศูนย์ไอที › คอมพิวเตอร์ › อุปกรณ์เสริม)`, SL[grpOf(k)][1]); } } } catch (e) { console.warn('v176 auto', e); }
      return r;
    };
    try { addItem = wrapped; } catch (e) { }
    window.addItem = wrapped; }
  // taking a computer apart or selling it returns what was plugged in
  { const _t = PC.tear.bind(PC); PC.tear = function (i) { const p = pcs()[+i]; if (p) giveBack(p); return _t(i); }; }
  { const _s = UI.H.v36sellpc; if (_s) UI.H.v36sellpc = function (d) { const p = pcs()[+d.i]; if (p) giveBack(p); return _s.apply(this, arguments); }; }

  // ----- what counts -----
  PC.monitor = function () { let best = null; for (const p of pcs()) { if (p.broken) continue; for (const k of listOf(p, 'mon')) { const P = PC_PARTS[k]; if (!P) continue; if (!best || P.perf > PC_PARTS[best].perf || (P.perf === PC_PARTS[best].perf && P.price > PC_PARTS[best].price)) best = k; } } return best; };
  { const alias = { headset: 'headset', gchair: 'furn', ups: 'ups', streamkit: 'webcam', kb: 'kb', mouse: 'mouse', speaker: 'speaker' };
    PC.has = function (k) {
      const g = alias[k]; if (!g) return count('pc_' + k) > 0;
      if (g === 'webcam') return window.PCAcc176.has('webcam') && window.PCAcc176.has('mic');
      return window.PCAcc176.has(g);
    }; }
  // descriptions in the shop say where to put it
  { const _d = PC.desc.bind(PC); PC.desc = function (P) { let t = _d(P); if (P && (P.s === 'mon' || (P.s === 'per' && (P.g || P.n && /UPS/.test(P.n))))) t = String(t).replace(/ · มีชิ้นส่วนในกระเป๋าแล้วไปประกอบที่โต๊ะประกอบคอม/, '') + ' · ซื้อแล้วติดตั้งที่ ศูนย์ไอที › คอมพิวเตอร์ › อุปกรณ์เสริม (ติดตั้งให้เองถ้ามีคอมและช่องว่าง)'; return t; }; }
  // ----- windows -----
  const upsLine = (pc, k) => { const L = totalLoad(pc), rated = ratedW(k), m = runMin(pc); return `<p class="dim">${vaOf(k)} VA${onlineOf(k) ? ' ออนไลน์' : ''} · รับโหลดได้ ~${rated} W · โหลดตอนนี้ ~${L} W${accOf(pc).upsShare ? ' (รวมกล้อง/เครือข่าย)' : ''} · ${m > 0 ? `<b class="good">สำรองไฟได้ ~${m >= 60 ? (m / 60).toFixed(1) + ' ชม.' : m + ' นาที'}</b>` : '<b class="bad">โหลดเกินกำลัง UPS (สำรองไฟไม่ได้)</b>'}</p>`; };
  let sel = 0;
  const winHtml = t => {
    const list = pcs(); if (!list.length) return '<p class="empty">ยังไม่มีคอมพิวเตอร์ ประกอบหรือซื้อก่อนที่คอมพิวเตอร์พลาซ่า</p>'; if (sel >= list.length) sel = 0; const pc = list[sel];
    const pick = `<div class="row" style="flex-wrap:wrap">${list.map((p, i) => `<button class="btn ${i === sel ? '' : 'ghost'}" style="font-size:13px;padding:5px 9px" data-a="pca176sel" data-v="${i}">${E(pcName(p))}</button>`).join('')}</div>`;
    if (t === 0) {
      const dk = dark(); let h = pick + `<p class="lead">🔌 อุปกรณ์ที่ติดตั้งกับ "${E(pcName(pc))}" · เฉพาะที่ติดตั้งแล้วเท่านั้นที่ใช้งานได้จริง${dk ? ' · <b class="bad">ตอนนี้ไฟดับ</b>' : ''}</p>`;
      for (const [g, ic, lab, cap] of SLOTS) { const l = listOf(pc, g); h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${ic} ${lab} <span class="dim">(${l.length}/${cap})</span></h4>${l.length ? l.map((k, i) => `<div class="row" style="justify-content:space-between;gap:8px"><span>${E(nameOf(k))}</span><button class="btn ghost" style="font-size:13px;padding:4px 9px" data-a="pca176rm" data-v="${g}|${i}">ถอด</button></div>${g === 'ups' ? upsLine(pc, k) : ''}`).join('') : '<p class="dim">ยังไม่ได้ติดตั้ง</p>'}${g === 'ups' && l.length ? `<div class="row"><button class="btn ${accOf(pc).upsShare ? '' : 'ghost'}" style="font-size:13px;padding:5px 9px" data-a="pca176share">${accOf(pc).upsShare ? '✅ จ่ายไฟให้กล้อง/เครือข่ายด้วย (กดเพื่อยกเลิก)' : '📷 ให้ UPS นี้จ่ายไฟให้กล้อง/เครือข่ายด้วย'}</button></div>` : ''}</div></div>`; }
      return h;
    }
    let h = pick + '<p class="lead">🎒 ในกระเป๋า (กดติดตั้งที่ "' + E(pcName(pc)) + '")</p>', any = 0;
    for (const [g, ic, lab, cap] of SLOTS) { const ks = bagKeys(g); if (!ks.length) continue; any = 1; h += `<h5>${ic} ${lab}</h5>` + ks.map(k => `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${E(nameOf(k))} × ${count('pc_' + k)}</h4>${g === 'ups' ? `<p class="dim">${vaOf(k)} VA · รับโหลด ~${ratedW(k)} W</p>` : ''}</div><div class="row"><button class="btn" data-a="pca176in" data-v="${k}">ติดตั้ง</button></div></div>`).join(''); }
    return h + (any ? '' : '<p class="empty">ไม่มีอุปกรณ์เสริมในกระเป๋า (ซื้อได้ที่คอมพิวเตอร์พลาซ่า / ร้านไอทีในเมือง)</p>') + `<div class="row"><button class="btn ${st().auto ? '' : 'ghost'}" data-a="pca176auto">${st().auto ? '✅ ติดตั้งให้อัตโนมัติเมื่อซื้อ' : '⬜ ติดตั้งให้อัตโนมัติเมื่อซื้อ'}</button></div>`;
  };
  const openWin = i => { if (i != null) sel = +i; UI.open('🔌 อุปกรณ์เสริมของคอมพิวเตอร์', ['ติดตั้งอยู่', 'ในกระเป๋า'], winHtml, { wide: true }); };
  UI.H.pca176open = d => openWin(d && d.v);
  UI.H.pca176sel = d => { sel = +d.v; };
  UI.H.pca176in = d => { const pc = pcs()[sel]; if (pc) install(pc, d.v); };
  UI.H.pca176rm = d => { const [g, i] = String(d.v).split('|'), pc = pcs()[sel]; if (pc) remove(pc, g, +i); };
  UI.H.pca176share = () => { const pc = pcs()[sel]; if (pc && upsOf(pc)) { accOf(pc).upsShare = accOf(pc).upsShare ? 0 : 1; toast(accOf(pc).upsShare ? 'UPS จ่ายไฟให้กล้อง/เครือข่ายด้วย (โหลดรวมสูงขึ้น เวลาสำรองไฟสั้นลง)' : 'UPS สำรองไฟให้คอมเครื่องนี้อย่างเดียว', '🔋'); } };
  UI.H.pca176auto = () => { st().auto = st().auto ? 0 : 1; toast(st().auto ? 'ติดตั้งอุปกรณ์เสริมให้อัตโนมัติเมื่อซื้อ' : 'ปิดการติดตั้งอัตโนมัติ (ต้องกดติดตั้งเอง)', '🔌'); };

  // IT centre > "คอมพิวเตอร์" tab gets an accessories section; the bank-style summary line per computer
  const section = () => {
    const list = pcs(); if (!list.length) return '';
    return `<h5>🔌 อุปกรณ์เสริม (จอ UPS คีย์บอร์ด ฯลฯ)</h5><p class="dim">ต้องติดตั้งกับคอมแต่ละเครื่องจึงจะใช้งานได้ ไม่ได้นับจากของในกระเป๋าอีกแล้ว</p>` + list.map((p, i) => { const a = accOf(p), n = SLOTS.reduce((s, x) => s + listOf(p, x[0]).length, 0), u = upsOf(p), mons = listOf(p, 'mon'); return `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${E(pcName(p))}</h4><p class="dim">ติดตั้งแล้ว ${n} ชิ้น · จอ ${mons.length ? mons.map(k => E(nameOf(k)).replace(/^จอ\s*/, '')).join(', ') : '<b class="bad">ยังไม่มี</b>'} · UPS ${u ? vaOf(u) + 'VA' + (runMin(p) ? ' (~' + runMin(p) + ' นาที)' : ' (โหลดเกิน)') : 'ไม่มี'}</p></div><div class="row"><button class="btn" data-a="pca176open" data-v="${i}">จัดการอุปกรณ์เสริม</button></div></div>`; }).join('');
  };
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (typeof title === 'string' && /ศูนย์ไอที/.test(title) && Array.isArray(tabs) && tabs.includes('คอมพิวเตอร์') && !tabs.__pca) { const ix = tabs.indexOf('คอมพิวเตอร์'), r0 = render; render = t => { const h = r0(t); return t === ix ? h + section() : h; }; tabs.__pca = 1; }
      return _open(title, tabs, render, opts);
    }; }

  // one-time move: accessories that were lying in the bag are installed on the best computer, exactly the setup the player already had
  function migrate() {
    const s = st(); if (s.mig || !pcs().length) return; s.mig = 1; let n = 0; const pc = bestPc(); if (!pc) return;
    for (const [g] of SLOTS) for (const k of bagKeys(g).sort((x, y) => (PC_PARTS[y].price || 0) - (PC_PARTS[x].price || 0))) { while (count('pc_' + k) > 0 && install(pc, k, true)) n++; }
    if (n) { try { Phone.msg('ศูนย์ไอที', `ย้ายอุปกรณ์เสริม ${n} ชิ้นที่อยู่ในกระเป๋า (จอ UPS คีย์บอร์ด ฯลฯ) ไปติดตั้งที่ "${pcName(pc)}" แล้ว ดู/ถอด/ย้ายได้ที่ ศูนย์ไอที › คอมพิวเตอร์ › อุปกรณ์เสริม`, true); } catch (e) { } }
  }
  setInterval(() => { try { migrate(); } catch (e) { console.warn('v176 migrate', e); } }, 2000);
  window.PCAcc176.install = install; window.PCAcc176.remove = remove; window.PCAcc176.open = openWin; window.PCAcc176.migrate = migrate;
});
