'use strict';
// ---------- v255: the medical certificate for a driving licence comes from the driving school ----------
// Since the village clinic was removed, the only place for the certificate is the driving school. Step 0 of the school: a physical check and the
// certificate (200 baht, valid 1 month like before). The certificate is the same document as before, so the licence test and the public-transport licence
// still see it. The check is done on the spot, so there is no waiting time.
V23.add('v255_medcert', function () {
  if (typeof DriveSchool === 'undefined' || typeof Agency26 === 'undefined' || typeof UI === 'undefined') return;
  const FEE = 200;
  const has = () => !!(window.Gov24 && Gov24.has && Gov24.has('medcert'));
  UI.H.dsmed = () => {
    if (has()) { UI.toast('คุณมีใบรับรองแพทย์ที่ใช้ได้อยู่แล้ว', '🩺'); return; }
    if (S.money < FEE) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + FEE + ' ฿', '💸'); return; }
    S.money -= FEE; try { Bank2.log('ตรวจร่างกายและใบรับรองแพทย์ (โรงเรียนสอนขับรถ)', -FEE); } catch (e) { }
    Agency26.grant('medcert', { dx: 'ตรวจร่างกายผู้ขอใบขับขี่', rest: 0 }, 'โรงเรียนสอนขับรถภูผา', 'ออก');
    try { Life2.note && Life2.note('ตรวจร่างกายที่โรงเรียนสอนขับรถ ได้ใบรับรองแพทย์'); } catch (e) { }
    UI.renderBody();
  };
  const _ui = DriveSchool.ui.bind(DriveSchool);
  DriveSchool.ui = function () {
    _ui();
    const r = UI.cur && UI.cur.render; if (!r) return;
    UI.cur.render = t => {
      const ok = has();
      const card = `<div class="card"><div class="ci">🩺</div><div class="cb"><h4>0. ตรวจร่างกายและใบรับรองแพทย์ ${ok ? '✅' : ''}</h4><p class="dim">${FEE} ฿ · ต้องมีก่อนสมัครเรียนและสอบ · ใบรับรองใช้ได้ 1 เดือน</p><div class="row"><button class="btn" data-a="dsmed" ${ok || S.money < FEE ? 'disabled' : ''}>${ok ? 'มีใบรับรองแล้ว' : 'ตรวจร่างกาย ' + FEE + ' ฿'}</button></div></div></div>`;
      return card + r(t);
    };
    UI.renderBody();
  };
  window.Med255 = { has, FEE };
});
