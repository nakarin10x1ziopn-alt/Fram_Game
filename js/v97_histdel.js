// v97_histdel.js: delete buttons for the rest of the phone's records
//  - Call history (Phone app "call"): a trash button on each call and "clear call history"
//  - Bill payment history: on each bill page of the phone and in the bank app's Bills tab (one entry, one category, or everything)
//  - Life diary / timeline: a trash button on each entry, "delete what is shown", "delete the whole diary"
//  - News (TV, online, newspaper): a trash button on each story, "delete the stories shown", "delete all news"
//  Several at once need a second tap to confirm; a single entry is deleted straight away. The controls are added to the screen after it is drawn, so the original screens are untouched.
V23.add('v97_histdel', () => {
  if (typeof UI === 'undefined' || typeof Phone === 'undefined') return;
  const toast = (t, i) => { try { UI.toast(t, i || '🗑️'); } catch (e) { } };
  const body = () => document.getElementById('mBody');
  const dtx = d => { try { return window.Cal24 ? Cal24.dateText(d) : String(d); } catch (e) { return String(d); } };
  const txt = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
  let armed = null, tm = 0;
  const arm = k => { armed = k; clearTimeout(tm); tm = setTimeout(() => { armed = null; try { UI.renderBody(); } catch (e) { } }, 5000); };
  const need = (k, what) => { if (armed === k) { armed = null; clearTimeout(tm); return true; } arm(k); toast(`แตะปุ่มอีกครั้งเพื่อยืนยันลบ${what}`, '⚠️'); try { UI.renderBody(); } catch (e) { } return false; };
  const mk = (key, a, v, text, small) => { const b = document.createElement('button'); b.className = 'btn ghost'; b.dataset.a = a; if (v != null) b.dataset.v = v; b.textContent = armed === key ? '⚠️ แตะอีกครั้งเพื่อยืนยันลบ' : text; b.style.cssText = (small ? 'padding:0 9px;min-height:0;font-size:12px;margin-left:8px;' : '') + (armed === key ? 'border-color:#ff8a65;color:#ffccbc;' : ''); return b; };
  const rowOf = (...bs) => { const r = document.createElement('div'); r.className = 'row'; for (const b of bs) r.appendChild(b); return r; };
  const redraw = () => { try { Phone.badge(); } catch (e) { } try { UI.renderBody(); } catch (e) { } };
  const bh = () => { const s = (S.b84 = S.b84 || {}); s.hist = s.hist || []; for (const h of s.hist) if (!h.uid) h.uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7); return s.hist; };

  // ---------------- handlers ----------------
  UI.H.mdelcall1 = d => { const i = +d.v; if (Phone.callLog[i] != null) { Phone.callLog.splice(i, 1); toast('ลบรายการโทรแล้ว'); } redraw(); };
  UI.H.mdelcallall = () => { if (!need('callall', 'ประวัติการโทรทั้งหมด')) return; const n = Phone.callLog.length; Phone.callLog.length = 0; toast(`ล้างประวัติการโทร ${n} รายการ`); redraw(); };
  UI.H.mdelbill1 = d => { const h = bh(), n = h.length; S.b84.hist = h.filter(x => x.uid !== d.v); if (S.b84.hist.length < n) toast('ลบรายการประวัติบิลแล้ว'); redraw(); };
  UI.H.mdelbillcat = d => { if (!need('billcat', 'ประวัติของหมวดนี้')) return; const h = bh(), n = h.length; S.b84.hist = h.filter(x => x.cat !== d.v); toast(`ลบประวัติบิลหมวดนี้ ${n - S.b84.hist.length} รายการ`); redraw(); };
  UI.H.mdelbillall = () => { if (!need('billall', 'ประวัติการชำระบิลทั้งหมด')) return; const n = bh().length; S.b84.hist = []; toast(`ลบประวัติการชำระบิล ${n} รายการ`); redraw(); };
  const evByKey = (arr, key) => { const [d, n] = String(key).split(':'); return arr.find(e => e.d == d && e.n == n); };
  UI.H.mdelev1 = d => { const x = S.v31d; if (!x) return; const e = evByKey(x.ev, d.v); if (e) { x.ev = x.ev.filter(q => q !== e); toast('ลบรายการไดอารี่แล้ว'); } redraw(); };
  UI.H.mdelevshown = d => { if (!need('evshown', 'รายการไดอารี่ที่แสดงอยู่')) return; const x = S.v31d; if (!x) return; const keys = new Set(String(d.v || '').split(',')); const n0 = x.ev.length; x.ev = x.ev.filter(e => !keys.has(e.d + ':' + e.n)); toast(`ลบไดอารี่ ${n0 - x.ev.length} รายการ`); redraw(); };
  UI.H.mdelevall = () => { if (!need('evall', 'ไดอารี่ทั้งหมด')) return; const x = S.v31d; if (!x) return; const n = x.ev.length; x.ev = []; toast(`ลบไดอารี่ทั้งหมด ${n} รายการ`); redraw(); };
  UI.H.mdelnews1 = d => { const x = S.v31n; if (!x) return; const e = evByKey(x.feed, d.v); if (e) { x.feed = x.feed.filter(q => q !== e); toast('ลบข่าวแล้ว'); } redraw(); };
  UI.H.mdelnewsshown = d => { if (!need('newsshown', 'ข่าวที่แสดงอยู่')) return; const x = S.v31n; if (!x) return; const keys = new Set(String(d.v || '').split(',')); const n0 = x.feed.length; x.feed = x.feed.filter(e => !keys.has(e.d + ':' + e.n)); toast(`ลบข่าว ${n0 - x.feed.length} ข่าว`); redraw(); };
  UI.H.mdelnewsall = () => { if (!need('newsall', 'ข่าวทั้งหมด')) return; const x = S.v31n; if (!x) return; const n = x.feed.length; x.feed = []; toast(`ลบข่าวทั้งหมด ${n} ข่าว`); redraw(); };

  // ---------------- controls added after a screen is drawn ----------------
  const decorate = () => {
    const root = body(); if (!root) return;
    const title = (UI.cur && UI.cur.title) || '';
    // call history
    const hc = [...root.querySelectorAll('h5')].find(h => /ประวัติการโทร/.test(h.textContent));
    if (hc && hc.nextElementSibling && hc.nextElementSibling.tagName === 'UL') {
      const ul = hc.nextElementSibling; [...ul.children].forEach((li, i) => { const b = mk('call' + i, 'mdelcall1', i, '🗑️', true); li.appendChild(b); });
      ul.insertAdjacentElement('afterend', rowOf(mk('callall', 'mdelcallall', null, '🗑️ ล้างประวัติการโทรทั้งหมด')));
    }
    // bill history on a phone bill page
    const hb = [...root.querySelectorAll('h5')].find(h => /^ประวัติการชำระ/.test(txt(h)));
    if (hb && /^bill_/.test(Phone.app || '')) {
      const cat = Phone.app.slice(5), list = bh().filter(x => x.cat === cat).slice(0, 5); let k = 0, last = hb;
      for (let el = hb.nextElementSibling; el && el.tagName !== 'H5'; el = el.nextElementSibling) { last = el; if (el.classList.contains('dim') && list[k]) el.appendChild(mk('b1' + list[k].uid, 'mdelbill1', list[k++].uid, '🗑️', true)); }
      if (list.length) last.insertAdjacentElement('afterend', rowOf(mk('billcat', 'mdelbillcat', cat, '🗑️ ลบประวัติของหมวดนี้ทั้งหมด')));
    }
    if (/^bill_all$/.test(Phone.app || '') && bh().length) root.appendChild(rowOf(mk('billall', 'mdelbillall', null, '🗑️ ลบประวัติการชำระบิลทั้งหมด')));
    // bill history in the bank app (Bills tab)
    const hk = [...root.querySelectorAll('h5')].find(h => /ประวัติชำระล่าสุด/.test(h.textContent));
    if (hk) {
      const list = bh().slice(0, 6); let k = 0, last = hk;
      for (let el = hk.nextElementSibling; el && el.tagName !== 'H5'; el = el.nextElementSibling) { last = el; if (list[k] && el.tagName === 'DIV' && /฿/.test(el.textContent)) { const b = mk('b1' + list[k].uid, 'mdelbill1', list[k].uid, '🗑️', true); k++; el.appendChild(b); } }
      last.insertAdjacentElement('afterend', rowOf(mk('billall', 'mdelbillall', null, '🗑️ ลบประวัติการชำระบิลทั้งหมด')));
    }
    // diary
    if (/ไดอารี่ชีวิต/.test(title) && S.v31d) {
      const evs = S.v31d.ev.slice().sort((a, b) => (b.d - a.d) || (b.n - a.n)), used = new Set(), shown = [];
      root.querySelectorAll('.card').forEach(c => { const h4 = c.querySelector('h4'); if (!h4) return; const t = txt(h4), p = txt(c.querySelector('p.dim')); const e = evs.find(q => !used.has(q) && q.h === t && p.indexOf(dtx(q.d)) === 0); if (!e) return; used.add(e); shown.push(e.d + ':' + e.n); h4.appendChild(mk('ev' + e.d + e.n, 'mdelev1', e.d + ':' + e.n, '🗑️', true)); });
      if (shown.length) root.insertBefore(rowOf(mk('evshown', 'mdelevshown', shown.join(','), `🗑️ ลบที่แสดงอยู่ (${shown.length})`), mk('evall', 'mdelevall', null, '🗑️ ลบไดอารี่ทั้งหมด')), root.firstChild);
    }
    // news
    if (/สื่อ & ข่าว/.test(title) && S.v31n) {
      const evs = S.v31n.feed.slice().sort((a, b) => (b.d - a.d) || (b.n - a.n)), used = new Set(), shown = [];
      root.querySelectorAll('.card').forEach(c => { const h4 = c.querySelector('h4'); if (!h4) return; const t = txt(h4), p = txt(c.querySelector('p.dim')); const e = evs.find(q => !used.has(q) && q.h === t && p.indexOf(dtx(q.d)) === 0); if (!e) return; used.add(e); shown.push(e.d + ':' + e.n); h4.appendChild(mk('nw' + e.d + e.n, 'mdelnews1', e.d + ':' + e.n, '🗑️', true)); });
      if (shown.length) root.insertBefore(rowOf(mk('newsshown', 'mdelnewsshown', shown.join(','), `🗑️ ลบข่าวที่แสดงอยู่ (${shown.length})`), mk('newsall', 'mdelnewsall', null, '🗑️ ลบข่าวทั้งหมด')), root.firstChild);
    }
  };
  { const _rb = UI.renderBody.bind(UI);
    UI.renderBody = function () { _rb.apply(this, arguments); try { decorate(); } catch (e) { console.warn('v97', e); } };
  }
  window.HistDel97 = { decorate };
});
