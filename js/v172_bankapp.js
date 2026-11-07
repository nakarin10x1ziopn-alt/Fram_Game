'use strict';
// ---------- v172_bankapp: one bank app ----------
//  The old phone apps "ธนาคาร", "สินเชื่อ & เครดิต" and "ประกัน & สุขภาพ" are folded into the bank app as tabs (their screens and buttons are reused as they are, so every
//  existing feature and save keeps working). The bank app itself sits on the phone home screen instead of inside a category popup; the three old icons are gone.
V23.add('v172_bankapp', () => {
  if (typeof Phone === 'undefined' || typeof UI === 'undefined' || typeof APPS === 'undefined' || !window.Bank49) return;
  const parse = h => { const d = document.createElement('div'); d.innerHTML = h; return d; };
  const live = id => { try { return typeof Phone.apps[id] === 'function' ? String(Phone.apps[id].call(Phone) || '') : ''; } catch (e) { console.warn('v172 ' + id, e); return '<p class="empty">เปิดหน้านี้ไม่ได้</p>'; } };

  // loans + investment products: the old credit app, minus its old card block (the card has its own tabs now)
  const tabLoan = () => {
    const d = parse(live('loan'));
    d.querySelectorAll('.card').forEach(c => { const t = c.querySelector('h4'); if (t && /^บัตรเครดิต วงเงิน/.test(t.textContent.trim())) c.innerHTML = '<div class="ci">💳</div><div class="cb"><h4>บัตรเครดิต</h4><p class="dim">จัดการบัตร ใบแจ้งหนี้ ผ่อน และกดเงินสดที่แท็บ "บัตรเครดิต/สินเชื่อ" และ "บัตรของฉัน"</p></div>'; });
    return '<p class="dim">สินเชื่อบ้าน รถ SME สินเชื่อเฉพาะทาง และผลิตภัณฑ์ลงทุนกับธนาคาร (พันธบัตร กองทุน) · จัดการ/ปรับโครงสร้างหนี้ได้ที่แท็บ "เครดิตบูโร/จัดการหนี้"</p>' + d.innerHTML;
  };
  const tabIns = () => live('ins');
  // the old bank app: piggy banks and the old 90-day fixed deposit (kept so nothing in a save is lost)
  const tabOld = () => {
    const d = parse(live('bank')); const p = d.querySelector('p.dim'); if (p && /บิลทั้งหมด/.test(p.textContent)) p.remove();
    return '<p class="dim">กระปุกออมเป้าหมาย และเงินฝากประจำ 90 วันแบบเดิม (ใช้งานได้ตามปกติ) · เงินฝากประจำแบบใหม่ที่ค้ำสินเชื่อได้อยู่แท็บ "เงินฝากประจำ" และเป้าหมายออมแบบรายเดือนอยู่แท็บ "แลกเงิน/บัญชีพิเศษ"</p>' + d.innerHTML;
  };
  const T = ['🏭 สินเชื่อเฉพาะทาง/ลงทุน', '🛡️ ประกัน & สุขภาพ', '🐷 กระปุกออม/ฝากเดิม'];
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (title === '📱 แอปธนาคารสุขใจ' && Array.isArray(tabs) && tabs.length >= 6 && !tabs.includes(T[0])) {
        const base = tabs.length, r0 = render; tabs = tabs.concat(T);
        render = t => (t === base ? tabLoan() : t === base + 1 ? tabIns() : t === base + 2 ? tabOld() : r0(t));
      }
      return _open(title, tabs, render, opts);
    }; }

  // phone home: the bank app is an icon of its own; the three old apps and the "bank" category tile are gone
  { const _r = Phone.render.bind(Phone);
    Phone.render = function () {
      for (const id of ['bank', 'loan', 'ins']) { const i = APPS.findIndex(a => a.id === id); if (i >= 0) APPS.splice(i, 1); }
      try { const c = window.Phone59 && window.Phone59.CATS.find(q => q[0] === 'bank'); if (c) c[3] = ['mbank49']; } catch (e) { }
      let h = _r(); if (this.app) return h;
      h = h.replace(/<button data-a="pcat" data-v="bank"[^>]*>[\s\S]*?<\/button>/, '');
      const pin = '<div class="apps" id="phPin" style="margin-bottom:6px"><button data-a="app" data-v="mbank49"><span>🏦</span>แอปธนาคาร</button></div>';
      return h.includes('<div class="apps" id="phCats">') ? h.replace('<div class="apps" id="phCats">', pin + '<div class="apps" id="phCats">') : h;
    }; }
  window.BankApp172 = { tabLoan, tabIns, tabOld };
});
