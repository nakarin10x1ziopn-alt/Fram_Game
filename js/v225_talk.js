'use strict';
// ---------- v225: the asker talks back ----------
// After every answer the asker says a short line (tone = how the answer landed), and sometimes asks a follow-up question that quotes the player's own answer.
// A follow-up is one question, asked by the same person, at most one per answer, and no chains: there are at most 6 per meeting.
V23.add('v225_talk', function () {
  if (!window.Agm216 || !Agm216.rebuild) return;
  const A = Agm216;
  const FOLLOW_OPTS = [
    ['ตอบด้วยตัวเลขและกำหนดเวลาที่ชัดเจน พร้อมผู้รับผิดชอบ', 6, () => true],
    ['ตอบกว้างๆ ว่าจะติดตามต่อไป', -2, null],
    ['ไม่ให้รายละเอียดเพิ่ม บอกว่าเป็นความลับทางการค้า', -7, null],
    ['ตอบว่าไม่ต้องห่วง ทุกอย่างอยู่ในการควบคุม', -5, null],
  ];
  const LINES = {
    lie: 'คำตอบนี้ไม่ตรงกับงบที่เรามีอยู่ครับ',
    good: 'ขอบคุณครับ ชัดเจนดี',
    ok: 'เข้าใจครับ ขอให้ติดตามต่อ',
    meh: 'ยังไม่ค่อยกระจ่างเท่าไรครับ',
    bad: 'ไม่พอใจกับคำตอบนี้มากเลยครับ',
  };
  const snip = s => { s = String(s || ''); return s.length > 44 ? s.slice(0, 44) + '…' : s; };
  const followText = (ans, d, lie) => {
    const q = snip(ans);
    if (lie) return `คุณบอกว่า “${q}” แต่ตัวเลขในงบไม่ตรงกับที่คุณพูด ช่วยอธิบายใหม่ให้ตรงกับความจริงได้ไหม?`;
    if (d >= 6) return `ดีครับ “${q}” แล้วคุณมั่นใจได้อย่างไรว่าจะทำได้ตามนั้น มีอะไรรองรับบ้าง?`;
    if (d <= -6) return `“${q}” ไม่น่าพอใจเลย ทำไมถึงเลือกตอบแบบนี้ แล้วจะแก้อย่างไร?`;
    return `“${q}” ฟังดูยังไม่ชัดเจนนัก ช่วยบอกกำหนดเวลาและผู้รับผิดชอบเพิ่มได้ไหม?`;
  };
  A.replyEx = (SS, x, o, dl, lie) => {
    if (!SS || !SS.ans) return;
    const tone = lie ? 'lie' : dl >= 6 ? 'good' : dl >= 1 ? 'ok' : dl >= -5 ? 'meh' : 'bad';
    SS.ans.reply = LINES[tone];
    if (x.q && x.q.fu) return;                         // a follow-up does not start another follow-up
    if ((SS.fuCount || 0) >= 6) return;
    const p = (lie || Math.abs(dl) >= 6) ? 0.6 : 0.25;
    if (Math.random() >= p) return;
    SS.fuCount = (SS.fuCount || 0) + 1;
    const fq = { id: 'talk' + SS.fuCount, no: null, grp: 'all', who: 'sh', cond: false, when: () => true, fu: 1, text: followText(o[0], dl, lie), o: FOLLOW_OPTS.map(([t, m, ck]) => [t, m, ck]) };
    SS.qs.splice(SS.qi + 1, 0, { q: fq, by: x.by, ag: x.ag, follow: 1 });
    A.rebuild(SS);
  };
});
