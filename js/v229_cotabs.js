'use strict';
// ---------- v229: "บริษัทของฉัน" split into category tabs ----------
// Overview · licences & building · staff · contracts · money · branches · shareholders · board & executives.
// Nothing is removed: the finished page is cut into sections (by its headings) and only the chosen category is shown. The staff list is grouped by role.
V23.add('v229_cotabs', function () {
  if (typeof Company === 'undefined' || !Company.html) return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const CATS = [
    { id: 'ov', i: '📋', n: 'ภาพรวม' },
    { id: 'lic', i: '📜', n: 'ใบอนุญาต/ระบบ/ทรัพย์สิน' },
    { id: 'staff', i: '🧑‍🔧', n: 'พนักงาน' },
    { id: 'ct', i: '📑', n: 'สัญญา/ลูกค้า' },
    { id: 'fin', i: '💰', n: 'บัญชี/ปันผล' },
    { id: 'br', i: '🏪', n: 'สาขา/แฟรนไชส์' },
    { id: 'mna', i: '🤝', n: 'ซื้อ-ขายกิจการ' },
    { id: 'hold', i: '👥', n: 'ผู้ถือหุ้น/ระดมทุน' },
    { id: 'board', i: '👔', n: 'บอร์ด/ผู้บริหาร' },
  ];
  const RULES = [   // heading text -> category (first match wins); an unknown heading stays in the previous category
    ['ov', /เงื่อนไขก่อนเปิด/], ['board', /ผู้บริหาร|คณะกรรมการ|นัดประชุม|รายงานการประชุม|คำมั่น|ประชุมสามัญ/], ['staff', /พนักงาน|แรงงานต่างด้าว/],
    ['ct', /สัญญา|ข้อเสนอจากลูกค้า/], ['fin', /บัญชีบริษัท|จ่ายเงินปันผล/], ['br', /สาขา/], ['hold', /ทะเบียนผู้ถือหุ้น|นักลงทุนที่สนใจ|ชวนคนในหมู่บ้าน|ระดมทุน/],
    ['lic', /ใบอนุญาต|ระบบไฟฟ้า|อินเทอร์เน็ตธุรกิจ|อุปกรณ์\/ทรัพย์สิน/],
  ];
  const BOARD_LEAD = /^(👔 บริษัทนี้|🏛️ \+ 👔|[⛔✅] ประชุมบอร์ด)/;
  Company.tab229 = Company.tab229 || 'ov';
  // v238: layout of the company page: an even grid of category tabs, the bank line as its own box, button groups that wrap with a gap, executive cards, and a separate danger zone
  if (!document.getElementById('cx-style')) {
    const st = document.createElement('style'); st.id = 'cx-style';
    st.textContent = `
      .cx-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:12px 0}
      .cx-tabs .btn{width:100%;margin:0;padding:10px 8px;text-align:center;line-height:1.25;white-space:normal}
      .cx-body h5{margin:20px 0 8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.14)}
      .cx-body .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
      .cx-body .row .btn{margin:0;max-width:100%;white-space:normal;text-align:left}
      .cx-bank{border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 12px;margin:10px 0;background:rgba(255,255,255,.05)}
      .cx-bank p{margin:0 0 8px}
      .cx-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      .cx-actions .btn{margin:0;flex:1 1 auto}
      .cx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin:8px 0}
      .cx-card{display:flex;flex-direction:column;gap:8px;border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:12px;background:rgba(255,255,255,.06)}
      .cx-card h4{margin:0;font-size:15px;line-height:1.35}
      .cx-dept{font-size:12px;opacity:.75}
      .cx-meta{font-size:13px;line-height:1.55;opacity:.92}
      .cx-chips{display:flex;flex-wrap:wrap;gap:4px}
      .cx-chip{display:inline-block;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12px}
      .cx-chip.good{background:rgba(120,220,140,.28)}
      .cx-chip.bad{background:rgba(255,120,120,.3)}
      .cx-ask{border-top:1px dashed rgba(255,255,255,.25);padding-top:8px;font-size:13px}
      .cx-ask .cx-actions{margin-top:6px}
      .cx-card>.cx-actions{margin-top:auto}
      .cx-hire{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
      .cx-hire select{flex:1 1 260px;min-width:0}
      .cx-danger{margin-top:24px;border:1px dashed rgba(255,120,120,.55);border-radius:14px;padding:12px}
      .cx-danger p{margin:0 0 8px}`;
    document.head.appendChild(st);
  }
  const staffView = (c, el) => {
    const L = c.staff || [], by = {}; L.forEach((s, i) => { (by[s.r] = by[s.r] || []).push([s, i]); });
    let nm = r => r; try { nm = r => (ROLES[r] || {}).n || r; } catch (e) { }
    const rows = Object.keys(by).map(r => {
      const g = by[r], last = g[g.length - 1][1];
      return `<details style="margin:4px 0"><summary><b>${E(nm(r))}</b> · ${g.length} คน <button class="btn ghost" data-a="cofire" data-v="${c.id}" data-k="${last}">เลิกจ้างคนล่าสุด 1 คน</button></summary><p class="dim">${g.map(([s, i]) => `${E(s.name)} <button class="btn ghost" data-a="cofire" data-v="${c.id}" data-k="${i}">เลิกจ้าง</button>`).join(' · ')}</p></details>`;
    }).join('');
    const d = document.createElement('div'); d.innerHTML = `<p class="dim">พนักงานทั้งหมด ${L.length} คน (กดชื่อตำแหน่งเพื่อดูรายคน)</p>${rows}`; return [...d.children];
  };
  const wrap = () => {
    const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open') return html;
        const box = document.createElement('div'); box.innerHTML = html; const kids = [...box.children];
        const first = kids.findIndex(k => k.tagName === 'H5'); if (first < 0 || kids.filter(k => k.tagName === 'H5').length < 4) return html;
        // the bank line (cash, reputation, profit and the capital buttons) becomes its own box with the buttons on a separate row
        const headHtml = kids.slice(0, first).map(k => {
          if (!/^💰 บัญชีบริษัท/.test((k.textContent || '').trim())) return k.outerHTML;
          const b = k.cloneNode(true), btns = [...b.querySelectorAll('button')]; btns.forEach(x => x.remove()); b.querySelectorAll('.dim').forEach(x => x.remove());
          return `<div class="cx-bank"><p>${b.innerHTML}</p><div class="cx-actions"><span class="dim">เพิ่มทุนเข้าบัญชีบริษัท / จ่ายปันผล:</span>${btns.map(x => x.outerHTML).join('')}</div></div>`;
        }).join('');
        const sec = {}; let danger = null; CATS.forEach(x => sec[x.id] = []);
        let cur = 'ov';
        for (const k of kids.slice(first)) {
          const tx = (k.textContent || '').trim();
          if (k.querySelector && k.querySelector('[data-a="coclose"]')) { danger = k; continue; }   // the close-company button gets its own danger zone on the overview
          if (k.tagName === 'H5') { const r = RULES.find(([, re]) => re.test(tx)); if (r) cur = r[0]; sec[cur].push(k); continue; }
          if (/^📊 ภาพรวม/.test(tx)) { sec.ov.push(k); continue; }
          if (BOARD_LEAD.test(tx)) cur = 'board';
          if (cur === 'staff' && k.querySelector && k.querySelector('[data-a="cofire"]') && k.tagName === 'P') { staffView(c, k).forEach(x => sec.staff.push(x)); continue; }
          sec[cur].push(k);
        }
        const tab = CATS.some(x => x.id === Company.tab229) ? Company.tab229 : 'ov';
        const badge = id => id === 'staff' ? ` (${(c.staff || []).length})` : id === 'board' && window.Agm216 && Agm216.dirCount ? ` (${Agm216.dirCount(c)})` : id === 'br' ? ` (${(c.br || []).filter(b => b.st === 'open').length})` : id === 'hold' ? ` (${((c.reg || []).filter(h => h.p > 0.0005).length) + 1})` : '';
        const bar = `<div class="cx-tabs">${CATS.map(x => `<button class="btn ${x.id === tab ? '' : 'ghost'}" data-a="cotab229" data-k="${x.id}">${x.i} ${E(x.n)}${badge(x.id)}</button>`).join('')}</div>`;
        const out = document.createElement('div'); sec[tab].forEach(x => out.appendChild(x));
        if (tab === 'ov' && danger) { const w = document.createElement('div'); w.className = 'cx-danger'; w.innerHTML = `<p class="dim">⚠️ การเลิกกิจการจะจ่ายค่าชดเชยพนักงานและหนี้เงินกู้ก่อน แล้วแบ่งเงินที่เหลือให้ผู้ถือหุ้นตามสัดส่วน ยกเลิกไม่ได้</p>${danger.outerHTML}`; out.appendChild(w); }
        return headHtml + bar + `<div class="cx-body">${out.innerHTML || '<p class="dim">ไม่มีรายการในหมวดนี้</p>'}</div>`;
      } catch (e) { console.warn('v229 cotabs', e); return html; }
    };
  };
  wrap();
  Object.assign(UI.H, { cotab229: d => { Company.tab229 = d.k; } });
});
