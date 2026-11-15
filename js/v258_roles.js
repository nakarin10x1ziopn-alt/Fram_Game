'use strict';
// ---------- v258: the chairman chooses who holds each position ----------
// On the board tab, below the executives: "👥 กำหนดตำแหน่งเอง".
//  - structure: how many people sit in each position (chair 1, directors up to 14, audit committee 3-5, executives up to 23 in 7 departments)
//  - chair: pick yourself or any director (an elected chair means the player no longer casts the deciding vote - the same rule as the board resolution)
//  - audit committee: add or remove independent directors; a director can be changed to the independent line (once every 60 days) so he/she can serve
//  - director's line (careful / growth / independent): sets how that director votes
//  - executives: move one to another free position, or swap two positions (pay follows the new position)
//  - appoint a sitting director to an executive position (the person stays a director, the director's fee stops because the pay is now a salary)
V23.add('v258_roles', function () {
  const A = window.Agm216;
  if (!A || typeof Company === 'undefined' || !A.EXEC || !A.tierBadge) return;
  const { POS } = A.EXEC, DEPT = A.DEPT;
  const E = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const th = n => Math.round(n).toLocaleString('en-US');
  const TRN = { cons: '🛡️ สายระมัดระวัง', growth: '🚀 สายขยายธุรกิจ', indep: '⚖️ สายอิสระ' };
  const BOARD_MAX = 15, COOL = 60;
  const B = c => (Array.isArray(c.board) ? c.board : []);
  const X = c => (Array.isArray(c.exec) ? c.exec : []);
  const freeKeys = c => Object.keys(POS).filter(k => !X(c).some(e => e.k === k));
  if (!document.getElementById('rl258css')) { const st = document.createElement('style'); st.id = 'rl258css'; st.textContent = '.cx-body .btn.on{background:linear-gradient(180deg,#ffe07a,#ffc233);color:#1b2a14;border-color:#ffd54f;font-weight:600}.cx-hire select{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.08);color:var(--ink,#f4f7ee);border:1px solid rgba(255,255,255,.22);font-size:15px;min-height:44px}.cx-hire .btn{min-height:44px}'; document.head.appendChild(st); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const viceOf = c => (c.vice && B(c).some(d => d.n === c.vice) && c.vice !== c.chair ? c.vice : null);
  const posName = k => (POS[k] ? POS[k].n : k);
  const sal = (c, k) => { try { return A.execSal(c, k); } catch (e) { return 50000; } };
  const members = c => { try { return A.AUDC ? A.AUDC.members(c) : []; } catch (e) { return []; } };

  const btn = (c, act, x, label, o) => { o = o || {}; return `<button class="btn ${o.ghost ? 'ghost' : ''} ${o.on ? 'on' : ''}" data-a="rl258" data-v="${c.id}" data-k="${act}"${x != null ? ` data-x="${E(x)}"` : ''}${o.y != null ? ` data-y="${E(o.y)}"` : ''} ${o.dis ? 'disabled' : ''}>${label}</button>`; };

  const panel = c => {
    const dirs = B(c), ex = X(c), chair = c.chair && dirs.some(d => d.n === c.chair) ? c.chair : null, aud = members(c), free = freeKeys(c);
    const sum = `<div class="cx-chips"><span class="cx-chip">👑 ประธาน 1</span><span class="cx-chip ${viceOf(c) ? 'good' : ''}">🥈 รองประธาน ${viceOf(c) ? 1 : 0}/1</span><span class="cx-chip">👔 กรรมการ ${dirs.length}/${BOARD_MAX - 1}</span><span class="cx-chip ${A.AUDC && A.AUDC.valid(c) ? 'good' : ''}">🔍 กรรมการตรวจสอบ ${aud.length}/${A.AUDC ? A.AUDC.NAUD : 3} (สูงสุด 5)</span><span class="cx-chip">🧑‍💼 ผู้บริหาร ${ex.length}/${Object.keys(POS).length}</span></div>`;
    const chairRow = `<div class="cx-actions">${btn(c, 'chair', 'me', '👑 คุณเป็นประธาน', { on: !chair, ghost: !!chair })}${dirs.map(d => btn(c, 'chair', d.n, E(d.n), { on: chair === d.n, ghost: chair !== d.n })).join('')}</div>`;
    const vice = viceOf(c), viceRow = `<div class="cx-actions">${btn(c, 'vice', '', 'ไม่มีรองประธาน', { on: !vice, ghost: !!vice })}${dirs.filter(d => d.n !== chair).map(d => btn(c, 'vice', d.n, E(d.n), { on: vice === d.n, ghost: vice !== d.n })).join('')}</div>`;
    const dirRows = dirs.length ? `<div class="cx-grid">${dirs.map(d => {
      const isAud = aud.includes(d.n), cool = d.tch != null && S.day - d.tch < COOL, ind = d.trait === 'indep';
      return `<div class="cx-card"><h4>${E(d.n)}${chair === d.n ? ' 👑' : ''}${vice === d.n ? ' 🥈' : ''}${d.execK ? ' · ' + E(posName(d.execK).replace(/\s*\(.*\)/, '')) : ''}</h4><div class="cx-chips"><span class="cx-chip ${ind ? 'good' : ''}">${TRN[d.trait] || 'ยังไม่ระบุสาย'}</span>${isAud ? '<span class="cx-chip good">🔍 กรรมการตรวจสอบ</span>' : ''}</div>
        <div class="cx-meta">เปลี่ยนสายการโหวต${cool ? ` (ทำได้อีกครั้งใน ${COOL - (S.day - d.tch)} วัน)` : ''}</div>
        <div class="cx-actions">${['cons', 'growth', 'indep'].map(t => btn(c, 'trait', d.n, TRN[t], { y: t, on: d.trait === t, ghost: d.trait !== t, dis: cool || d.trait === t })).join('')}</div>
        ${A.AUDC ? `<div class="cx-actions">${isAud ? btn(c, 'audoff', d.n, '🔍 ถอดจากกรรมการตรวจสอบ', { ghost: true }) : btn(c, 'audon', d.n, '🔍 แต่งตั้งเป็นกรรมการตรวจสอบ', { dis: !ind || aud.length >= 5 })}</div>${!isAud && !ind ? '<div class="cx-meta">ต้องเป็น "สายอิสระ" ก่อนจึงจะเป็นกรรมการตรวจสอบได้</div>' : ''}` : ''}
      </div>`; }).join('')}</div>` : '<p class="dim">ยังไม่มีกรรมการนอกจากคุณ</p>';
    const exRows = ex.length ? `<div class="cx-grid">${ex.map(e => {
      const opts = free.map(k => `<option value="free:${k}">${E(posName(k))} · ${th(sal(c, k))} ฿</option>`).join('') + ex.filter(o => o !== e).map(o => `<option value="swap:${o.k}">สลับกับ ${E(o.n)} (${E(posName(o.k).replace(/\s*\(.*\)/, ''))})</option>`).join('');
      return `<div class="cx-card"><h4>${E(posName(e.k))}</h4><div class="cx-meta"><b>${E(e.n)}</b> · ${th(e.sal || sal(c, e.k))} ฿/เดือน${e.dir ? ' · 👔 กรรมการ' : ''}</div>
        <div class="cx-hire"><select id="rl258mv_${c.id}_${e.k}">${opts || '<option value="">ไม่มีตำแหน่งให้ย้าย</option>'}</select>${btn(c, 'move', e.k, '↔️ ย้ายตำแหน่ง', { dis: !opts })}</div></div>`; }).join('')}</div>` : '<p class="dim">ยังไม่มีผู้บริหาร</p>';
    const cand = dirs.filter(d => !d.execK);
    const appoint = cand.length && free.length ? `<div class="cx-hire"><select id="rl258ap_${c.id}">${cand.map(d => `<option value="${E(d.n)}">${E(d.n)}</option>`).join('')}</select><select id="rl258apk_${c.id}">${DEPT.map(([ic, nm, ks]) => { const f = ks.filter(k => free.includes(k)); return f.length ? `<optgroup label="${ic} ${nm}">${f.map(k => `<option value="${k}">${E(posName(k))} · ${th(sal(c, k))} ฿/เดือน</option>`).join('')}</optgroup>` : ''; }).join('')}</select>${btn(c, 'appoint', '', '🎖️ แต่งตั้งเป็นผู้บริหาร')}</div>` : '<p class="dim">ไม่มีกรรมการที่แต่งตั้งเป็นผู้บริหารได้ (ต้องมีกรรมการที่ยังไม่ได้เป็นผู้บริหาร และมีตำแหน่งว่าง)</p>';
    return `<h5>👥 กำหนดตำแหน่งเอง</h5><p class="dim">ประธานกรรมการเลือกได้ว่าใครดำรงตำแหน่งอะไร · มีกรรมการได้สูงสุด ${BOARD_MAX - 1} คนนอกจากประธาน · ผู้บริหารมีได้ ${Object.keys(POS).length} ตำแหน่ง (ตำแหน่งละ 1 คน) ใน ${DEPT.length} ฝ่าย · จ้างผู้บริหารใหม่จากภายนอกได้ที่กล่องด้านบน หรือแต่งตั้งกรรมการที่มีอยู่เป็นผู้บริหารได้ที่นี่</p>${sum}
      <h5>👑 ประธานกรรมการ</h5><p class="dim">ถ้าเลือกกรรมการเป็นประธาน คุณจะไม่ได้เป็นผู้ชี้ขาดเมื่อเสียงเสมอ และกรรมการคนนั้นจะพอใจมากขึ้น</p>${chairRow}
      <h5>🥈 รองประธานกรรมการ</h5><p class="dim">ถ้าประธาน (กรรมการที่ถูกเลือก) ไม่มาประชุม รองประธานจะเป็นผู้ชี้ขาดเมื่อเสียงเสมอ (ผลชี้ขาดโน้มเอียงตามอารมณ์ของรองประธาน) และถ้าประธานออกจากบอร์ด รองประธานจะขึ้นเป็นประธานแทน · ผู้ที่ได้เป็นรองประธานจะพอใจขึ้น</p>${viceRow}
      <h5>👔 กรรมการและคณะกรรมการตรวจสอบ</h5>${dirRows}
      <h5>🧑‍💼 ย้ายหรือสลับตำแหน่งผู้บริหาร</h5><p class="dim">เงินเดือนปรับตามตำแหน่งใหม่ · ผู้ถูกย้ายไปตำแหน่งที่เงินเดือนสูงขึ้นจะพอใจ ไปตำแหน่งที่ต่ำลงจะไม่พอใจเล็กน้อย</p>${exRows}
      <h5>🎖️ แต่งตั้งกรรมการเป็นผู้บริหาร</h5>${appoint}`;
  };
  { const _tb = A.tierBadge; A.tierBadge = function (c, tr) { let h = _tb ? _tb.apply(this, arguments) : ''; try { if (c && c.st === 'open') h += panel(c); } catch (e) { console.warn('v258 panel', e); } return h; }; }

  const reserveOK = (c, k) => (c.cash || 0) >= (sal(c, k) + 875) * 3;
  UI.H.rl258 = d => {
    const c = Company.get(+d.v); if (!c || c.st !== 'open') return; const a = d.k, x = d.x, dirs = B(c), dir = dirs.find(q => q.n === x);
    if (a === 'chair') {
      if (x === 'me') { c.chair = null; UI.toast('คุณกลับมาเป็นประธานกรรมการ', '👑'); return; }
      if (!dir) return; if (c.vice === dir.n) c.vice = null; c.chair = dir.n; dir.mood = clamp((dir.mood || 55) + 8, 5, 98); UI.toast(`${dir.n} เป็นประธานกรรมการ (คุณไม่ได้เป็นผู้ชี้ขาดแล้ว)`, '👑'); return;
    }
    if (a === 'vice') { if (!x) { c.vice = null; UI.toast('ยกเลิกตำแหน่งรองประธาน', '🥈'); return; } if (!dir || x === c.chair) { UI.toast('เลือกกรรมการที่ไม่ได้เป็นประธาน', '⚠️'); return; } c.vice = dir.n; dir.mood = clamp((dir.mood || 55) + 6, 5, 98); UI.toast(`${dir.n} เป็นรองประธานกรรมการ`, '🥈'); return; }
    if (a === 'trait') { if (!dir || !TRN[d.y]) return; if (dir.tch != null && S.day - dir.tch < COOL) { UI.toast('เปลี่ยนสายได้ทุก 60 วัน', '⏳'); return; } dir.trait = d.y; dir.tch = S.day; dir.mood = clamp((dir.mood || 55) - 3, 5, 98); const e = X(c).find(q => q.n === dir.n); if (e) e.trait = d.y; if (d.y !== 'indep') c.auditc = (c.auditc || []).filter(n => n !== dir.n); UI.toast(`${dir.n} เปลี่ยนเป็น${TRN[d.y]}`, '⚖️'); return; }
    if (a === 'audon') { if (!dir || dir.trait !== 'indep') { UI.toast('ต้องเป็นกรรมการสายอิสระ', '⚠️'); return; } c.auditc = c.auditc || []; if (c.auditc.length >= 5) { UI.toast('กรรมการตรวจสอบเต็มแล้ว (5 คน)', '⚠️'); return; } if (!c.auditc.includes(dir.n)) c.auditc.push(dir.n); dir.mood = clamp((dir.mood || 55) + 4, 5, 98); UI.toast(`แต่งตั้ง ${dir.n} เป็นกรรมการตรวจสอบ (${members(c).length}/${A.AUDC ? A.AUDC.NAUD : 3})`, '🔍'); return; }
    if (a === 'audoff') { c.auditc = (c.auditc || []).filter(n => n !== x); UI.toast(`ถอด ${x} จากกรรมการตรวจสอบ`, '🔍'); return; }
    if (a === 'move') {
      const e = X(c).find(q => q.k === x), sel = document.getElementById(`rl258mv_${c.id}_${x}`), v = sel && sel.value; if (!e || !v) return; const [mode, k2] = v.split(':');
      const set = (p, k) => { const old = p.k, from = sal(c, old), to = sal(c, k); p.k = k; p.sal = to; p.ask = null; p.kpi = null; p.fails = 0; p.mood = clamp((p.mood == null ? 55 : p.mood) + (to > from ? 4 : to < from ? -4 : 0), 5, 98); const b = dirs.find(q => q.n === p.n); if (b && b.execK) b.execK = k; };
      if (mode === 'free') { if (!POS[k2] || X(c).some(q => q.k === k2)) { UI.toast('ตำแหน่งนี้ไม่ว่างแล้ว', '⚠️'); return; } if (!reserveOK(c, k2)) { UI.toast('เงินบริษัทไม่พอสำรองเงินเดือน 3 เดือนของตำแหน่งใหม่', '💸'); return; } const from = e.k; set(e, k2); UI.toast(`ย้าย ${e.n} จาก${posName(from)} ไป${posName(k2)}`, '↔️'); return; }
      if (mode === 'swap') { const o = X(c).find(q => q.k === k2); if (!o) return; const ka = e.k, kb = o.k; set(e, kb); set(o, ka); UI.toast(`สลับตำแหน่ง ${e.n} กับ ${o.n}`, '↔️'); }
      return;
    }
    if (a === 'appoint') {
      const sel = document.getElementById(`rl258ap_${c.id}`), pk = document.getElementById(`rl258apk_${c.id}`), who = sel && sel.value, k = pk && pk.value, b = dirs.find(q => q.n === who); if (!b || !POS[k]) return;
      if (b.execK || X(c).some(q => q.k === k)) { UI.toast('ตำแหน่งนี้ไม่ว่างหรือเป็นผู้บริหารอยู่แล้ว', '⚠️'); return; }
      if (!reserveOK(c, k)) { UI.toast(`เงินบริษัทไม่พอ ต้องมีสำรองเงินเดือน 3 เดือนของ${posName(k)}`, '💸'); return; }
      c.exec = X(c); c.exec.push({ k, n: b.n, sal: sal(c, k), since: S.day, mood: b.mood == null ? 60 : b.mood, trait: b.trait || A.pickTrait(c, k), dir: 1 }); b.execK = k; b.appt = 1;
      UI.toast(`แต่งตั้ง ${b.n} เป็น${posName(k)} (ยังเป็นกรรมการ ค่าตอบแทนเปลี่ยนเป็นเงินเดือน)`, '🎖️');
    }
  };
  // ----- the vice chair really does something -----
  // 1) when the elected chair is not at the meeting, a tie is decided by the vice chair (if present), leaning with that director's mood
  const _tie = A.tieEx;
  A.tieEx = function (SS, it) {
    const c = SS && SS.f && SS.f.c;
    if (c && c.chair && viceOf(c)) {
      const att = SS.att || [], chairHere = att.some(h => h.k === 'dir' && h.n === c.chair), vh = att.find(h => h.k === 'dir' && h.n === viceOf(c));
      if (!chairHere && vh) { const d = B(c).find(q => q.n === vh.n); return Math.random() < clamp(0.5 + ((d && d.mood != null ? d.mood : 55) - 50) / 200, 0.3, 0.7); }
    }
    return _tie ? _tie.apply(this, arguments) : null;
  };
  // 2) if the elected chair leaves the board, the vice chair becomes the chair (instead of the player taking the chair back)
  if (A.syncBoard) { const _sync = A.syncBoard; A.syncBoard = function (c) { const prev = c && c.chair, v = c && viceOf(c); const r = _sync.apply(this, arguments); try { if (prev && c.chair == null && v && B(c).some(d => d.n === v)) { c.chair = v; c.vice = null; Phone.msg(c.name, '🥈 ประธานออกจากบอร์ด ' + v + ' ขึ้นเป็นประธานกรรมการแทน', false); } } catch (e) { } return r; }; }
  window.Roles258 = { viceOf, panel, members, freeKeys };
});
