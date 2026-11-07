// v63_lifephone.js: phone "ชีวิตประจำวัน", trimmed
//  - removed from the phone: ชีวิตจริงเพิ่มเติม, สมุดสะสม, ไดอารี่ (both diary apps), ข่าว & เหตุการณ์
//  - สลากกินแบ่ง gets its own topic on the phone home screen (one tap opens it): buy tickets, see the latest draw, the next draw date and the prize table
V23.add('v63_lifephone', () => {
  if (typeof Phone === 'undefined' || typeof APPS === 'undefined' || !window.Phone59 || typeof RL === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const GONE = ['life26', 'collect', 'diary', 'diary31', 'news'];
  for (const id of GONE) { const i = APPS.findIndex(a => a.id === id); if (i >= 0) APPS.splice(i, 1); }
  for (const c of Phone59.CATS) c[3] = c[3].filter(id => !GONE.includes(id));

  if (!APPS.some(a => a.id === 'lotto')) APPS.push({ id: 'lotto', i: '🎫', n: 'สลากกินแบ่ง' });
  const at = Phone59.CATS.findIndex(c => c[0] === 'life'); if (!Phone59.CATS.some(c => c[0] === 'lotto')) Phone59.CATS.splice(at >= 0 ? at + 1 : Phone59.CATS.length, 0, ['lotto', '🎫', 'สลากกินแบ่ง', ['lotto']]);
  // this topic has one screen only, so its tile opens it directly instead of a popup with one app in it
  { const _p = UI.H.pcat; UI.H.pcat = d => { if (d && d.v === 'lotto') { Phone.cat = null; Phone.open('lotto'); return; } return _p(d); }; }

  // draws are on days 1 and 4 of each 7-day week (RL.daily: dIdx 0 and 3)
  const nextDraw = () => { for (let d = S.day; d < S.day + 8; d++) { const i = (d - 1) % 7; if (i === 0 || i === 3) return d; } return S.day; };
  Phone.apps.lotto = function () {
    const s = RL.st(), L = s.lot || [], ld = s.lastDraw, nd = nextDraw();
    let h = `<p class="lead">🎫 สลากกินแบ่งรัฐบาล · ใบละ 80 ฿ · ถือได้ไม่เกิน 10 ใบ · ออกรางวัลทุกวันแรกและวันที่ 4 ของสัปดาห์</p>
      <div class="card"><div class="ci">🎟️</div><div class="cb"><h4>สลากที่ถือ ${L.length}/10 ใบ</h4><p class="dim">${L.length ? L.map(E).join(' · ') : 'ยังไม่มีสลาก'}</p><p class="dim">ออกรางวัลครั้งถัดไป: ${nd === S.day ? 'วันนี้ (ผลออกตอนขึ้นวันใหม่)' : RD(nd)}</p><div class="row"><button class="btn" data-a="rl" data-v="lot" ${S.money < 80 || L.length >= 10 ? 'disabled' : ''}>ซื้อ 1 ใบ (80 ฿)</button></div></div></div>`;
    h += `<h5>🏆 ผลรางวัลล่าสุด</h5>` + (ld ? `<div class="card"><div class="ci">📢</div><div class="cb"><h4>${RD(ld.day)}</h4><p class="dim">รางวัลที่ 1: <b>${E(ld.win)}</b> · เลขท้าย 3 ตัว: <b>${E(ld.f3)}</b> · เลขท้าย 2 ตัว: <b>${E(ld.l2)}</b></p><p class="${ld.total ? 'good' : 'dim'}">${ld.held && ld.held.length ? (ld.res.length ? '🎉 ' + ld.res.map(E).join(', ') : `สลาก ${ld.held.length} ใบของคุณไม่ถูกรางวัล`) : 'งวดนั้นคุณไม่ได้ถือสลาก'}</p></div></div>` : '<p class="empty">ยังไม่มีการออกรางวัล</p>');
    h += `<h5>💰 รางวัล</h5><p class="dim">รางวัลที่ 1 (6 ตัวตรง) ${baht(6000000)} · เลขท้าย 3 ตัว ${baht(4000)} · เลขท้าย 2 ตัว ${baht(2000)}<br>ซื้อได้เท่านั้นก่อนวันออกรางวัล สลากที่ไม่ถูกจะหมดอายุหลังออกรางวัล</p>`;
    return h;
  };
});
