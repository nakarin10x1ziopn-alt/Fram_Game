'use strict';
// ---------- v257: the owner invites named people from outside the village to co-invest ----------
// Company page > "ผู้ถือหุ้น & นักลงทุน" > "🤝 ชวนคนภายนอกร่วมลงทุน": a list of 5 people from the city (business owners, wealthy investors, senior officers).
// No villager, friend, partner or other person from the village is ever on the list (and a name that matches one is dropped).
// For each person the owner chooses the stake to offer: 5% / 10% / 15% / 20% of the company in new shares (the price of each stake is shown; a stake the person
// cannot afford, or one that would leave you under 10%, is greyed out with the reason). Inviting costs 3,000 (company cash).
// They answer after 3 days: a bigger stake is harder to get (-6 points per 5%), reputation and a profit this year help. A yes becomes an offer in the share-offer
// list ("คำเสนอซื้อหุ้น") and goes through the normal accept step; a no is reported by phone.
// The list refreshes every 14 days; up to 2 invitations may wait at once.
V23.add('v257_invite', function () {
  if (typeof Company === 'undefined' || !Company.list || typeof Inv241 === 'undefined' || typeof Cal36 === 'undefined') return;
  const E = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const INVITE_FEE = 3000, WAIT = 3, LIST = 5, MAXWAIT = 2, STAKES = [0.05, 0.1, 0.15, 0.2];
  const open = c => c && c.st === 'open';
  const msg = (c, t, q) => { try { Phone.msg(c.name, t, !!q); } catch (e) { } };
  const hist = (c, t) => { try { c.hist.unshift(`${RD(S.day)}: ${t}`); } catch (e) { } };
  const valueOf = c => Math.max(1000000, Math.round((c.cash || 0) * 0.6 + (c.ytd || 0) * 6 + (c.paid || c.cap || 0)));
  const mineOf = c => (c.mine == null ? 1 : c.mine);
  const INV = c => { const x = c.inv257 = c.inv257 || { list: [], day: -999, seq: 0 }; return x; };
  const pcs = p => Math.round(p * 100) + '%';
  // names of people of the village: never invited
  const villagers = () => { const s = new Set(); try { for (const n of G.npcs || []) s.add(n.name); } catch (e) { } try { for (const k of Object.keys(S.friends || {})) s.add(k); } catch (e) { } try { if (S.rel) { if (S.rel.partner) s.add(S.rel.partner); for (const k of S.rel.kids || []) if (k && k.name) s.add(k.name); } } catch (e) { } return s; };
  // why a stake cannot be offered to this person ('' = fine)
  const why = (c, p, pct) => {
    const V = valueOf(c), t = Inv241.price(V, pct);
    if (mineOf(c) - pct < 0.1) return 'คุณจะเหลือหุ้นต่ำกว่า 10%';
    if (t < (Inv241.MIN_TICKET[p.cls] || 0)) return 'น้อยเกินไปสำหรับคนระดับนี้';
    if (t > p.wealth * 0.5) return 'เกินกำลังเงินของเขา';
    return '';
  };
  const afford = (c, p) => STAKES.filter(s => !why(c, p, s));

  const refresh = c => {
    const x = INV(c);
    if (x.list.length && S.day - x.day < 14) return;
    x.day = S.day;
    const keep = x.list.filter(p => p.invited), bad = villagers(), fresh = [];
    for (let k = 0; k < LIST * 12 && fresh.length + keep.length < LIST; k++) {
      const p = Inv241.make(['biz', 'rich', 'officer'][k % 3]); if (!p || bad.has(p.n) || fresh.some(q => q.who === p.n) || keep.some(q => q.who === p.n)) continue;
      const cand = { id: ++x.seq, who: p.n, kind: p.k || 'inv', prof: p.prof || '', cls: p.cls, wealth: p.wealth || 0, serving: !!p.serving, ret: !!p.ret };
      if (afford(c, cand).length) fresh.push(cand);
    }
    x.list = keep.concat(fresh);
  };
  const chance = (c, pct) => clamp(0.2 + (c.rep || 0) / 200 + ((c.ytd || 0) > 0 ? 0.15 : 0) - (pct - 0.05) * 1.2, 0.05, 0.85);
  const daily = () => {
    for (const c of Company.list()) {
      if (!open(c)) continue; const x = INV(c);
      for (const p of x.list.slice()) {
        if (!p.invited || S.day < p.invited.due) continue;
        const pct = p.invited.pct; p.invited = null;
        if (Math.random() < chance(c, pct) && (c.of || []).length < 4 && !(c.of || []).some(o => o.who === p.who) && mineOf(c) - pct >= 0.1) {
          const bid = Math.max(1000, Math.round(Inv241.price(valueOf(c), pct) * (0.95 + Math.random() * 0.15)));
          c.of = c.of || []; c.of.push({ id: 900000 + (++x.seq), who: p.who, kind: p.kind, pct, mode: 'new', bid, exp: S.day + 10, prof: p.prof, cls: p.cls, serving: p.serving, ret: p.ret, fromInvite: 1 });
          msg(c, `✅ ${p.who}${p.prof ? ` (${p.prof})` : ''} ตอบรับคำชวน: ซื้อหุ้นใหม่ ${pcs(pct)} เสนอ ${B(bid)} · ดูและรับได้ในหน้าผู้ถือหุ้น (คำเสนอซื้อหุ้น)`);
          hist(c, `${p.who} ตอบรับคำชวนลงทุน ${pcs(pct)}`);
        } else {
          msg(c, `❌ ${p.who} ยังไม่สนใจถือหุ้น ${pcs(pct)} ตอนนี้ (ลองเสนอสัดส่วนที่น้อยลง หรือรอให้บริษัทมีชื่อเสียงและผลกำไรมากขึ้น)`, true);
        }
        x.list = x.list.filter(q => q !== p);
      }
      refresh(c);
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v257 daily', e); } return r; }; }

  const section = c => {
    refresh(c); const x = INV(c), waiting = x.list.filter(p => p.invited).length, V = valueOf(c);
    const rows = x.list.map((p, i) => {
      const head = `<h4>${E(p.who)}</h4><p class="cx-meta">${p.prof ? E(p.prof) + ' · ' : ''}ทรัพย์สิน ${B(p.wealth)}</p>`;
      if (p.invited) return `<div class="cx-card">${head}<p class="dim">⏳ ชวนถือหุ้น ${pcs(p.invited.pct)} แล้ว รอคำตอบอีก ${Math.max(0, p.invited.due - S.day)} วัน</p></div>`;
      const btns = STAKES.map(s => { const w = why(c, p, s), can = !w && waiting < MAXWAIT && c.cash >= INVITE_FEE; return `<button class="btn ${w ? 'ghost' : ''}" data-a="inv257" data-v="invite|${i}|${s}" ${can ? '' : 'disabled'} title="${E(w || 'โอกาสตอบรับประมาณ ' + Math.round(chance(c, s) * 100) + '%')}">${pcs(s)}<br><small>${w ? 'ไม่ได้' : B(Inv241.price(V, s))}</small></button>`; }).join('');
      const note = !afford(c, p).length ? '<p class="dim">ตอนนี้ไม่มีสัดส่วนไหนที่เหมาะกับคนนี้</p>' : '';
      return `<div class="cx-card">${head}<div class="cx-meta">เลือกสัดส่วนหุ้นใหม่ที่จะเสนอ (ชวน ${B(INVITE_FEE)})</div><div class="cx-actions">${btns}</div>${note}</div>`;
    }).join('');
    return `<h5>🤝 ชวนคนภายนอกร่วมลงทุน</h5>
      <p class="lead">รายชื่อคนจากในเมือง (ไม่มีชาวบ้าน เพื่อน หรือคนในหมู่บ้าน) ที่อาจสนใจถือหุ้นบริษัทของคุณ · เลือกชวนเองทีละคน และกำหนดสัดส่วนที่เสนอได้ <b>5% / 10% / 15% / 20%</b> (ค่าติดต่อ ${B(INVITE_FEE)}) · ตอบภายใน ${WAIT} วัน · ยิ่งขอหุ้นมาก ยิ่งตอบรับยาก · ชวนได้ครั้งละไม่เกิน ${MAXWAIT} คน · รายชื่อรีเฟรชทุก 14 วัน</p>
      <p class="dim">คุณต้องเหลือหุ้นไม่ต่ำกว่า 10% หลังเสนอ · ปุ่มที่กดไม่ได้คือสัดส่วนที่เขาซื้อไม่ไหว น้อยเกินไปสำหรับเขา หรือทำให้คุณเหลือหุ้นไม่พอ (เอาเมาส์ชี้เพื่อดูเหตุผล)</p>
      ${x.list.length ? `<div class="cx-grid">${rows}</div>` : '<p class="dim">ยังไม่มีรายชื่อในขณะนี้</p>'}`;
  };
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open' || Company.tab229 !== 'hold') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        body.insertAdjacentHTML('beforeend', section(c)); return box.innerHTML;
      } catch (e) { console.warn('v257 page', e); return html; }
    }; }
  UI.H.inv257 = d => {
    const [a, i, s] = String(d.v || '').split('|'), c = Company.get(Company.sel); if (!c || c.st !== 'open') return;
    const x = INV(c), p = x.list[+i], pct = +s; if (a !== 'invite' || !p || !STAKES.includes(pct)) return;
    if (p.invited || x.list.filter(q => q.invited).length >= MAXWAIT) { UI.toast('ชวนได้ครั้งละไม่เกิน 2 คน รอคำตอบก่อน', '⏳'); return; }
    const w = why(c, p, pct); if (w) { UI.toast(`เสนอ ${pcs(pct)} ให้ ${p.who} ไม่ได้: ${w}`, '⚠️'); return; }
    if (c.cash < INVITE_FEE) { UI.toast('เงินบริษัทไม่พอ ค่าติดต่อ ' + B(INVITE_FEE), '⚠️'); return; }
    c.cash -= INVITE_FEE; try { Company.book(c, 0, INVITE_FEE); } catch (e) { }
    p.invited = { due: S.day + WAIT, pct };
    hist(c, `ชวน ${p.who} ถือหุ้น ${pcs(pct)}`);
    msg(c, `📨 ส่งคำชวนถึง ${p.who} (เสนอหุ้นใหม่ ${pcs(pct)}) จะตอบภายใน ${WAIT} วัน (ค่าติดต่อ ${B(INVITE_FEE)})`, true);
    UI.toast(`ส่งคำชวนถึง ${p.who} (${pcs(pct)}) แล้ว`, '📨');
  };
  window.Invite257 = { refresh, daily, section, INV, INVITE_FEE, STAKES, why, afford, chance, villagers };
});
