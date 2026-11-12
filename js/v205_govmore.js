'use strict';
// ---------- v205_govmore: every paper / licence the game asks for now has its own counter at the district hall ----------
//  - company licences (VAT, telecom, energy, food, factory, transport, building, restaurant, e-commerce, payment) are applied for at the authority that really grants them
//    (revenue, NBTC, ERC, FDA, industry office, land transport, municipality, DBD, Bank of Thailand) - one chooser screen, paid from the company account
//  - the extra agencies (the ones that used to be only in the phone app) have their counters in the combined service centre (v28_walkin.js), not in the village hall
V23.add('v205_govmore', () => {
  if (typeof Gov24 === 'undefined' || typeof CO_LIC === 'undefined' || typeof Company === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const CoLic = {
    body(key) {
      const L = CO_LIC[key]; if (!L) return '<p class="empty">ไม่พบใบอนุญาต</p>';
      const cs = Company.list().filter(c => ['setup', 'open'].includes(c.st) && (key === 'vat' || (CO_TYPES[c.type].lic || []).includes(key)));
      return `<p class="lead">${E(L.n)} · ค่าธรรมเนียม ${baht(L.fee)} · พิจารณา ${L.days} วัน (จ่ายจากบัญชีบริษัท)</p>` + (cs.length ? cs.map(c => {
        const have = c.lic[key], wait = c.licApp[key], why = L.need ? L.need(c) : '';
        return `<div class="card"><div class="ci">${CO_TYPES[c.type].i}</div><div class="cb"><h4>${E(c.name)}</h4><p class="dim">เงินในบัญชีบริษัท ${baht(Math.round(c.cash))}${why ? ` · <span class="bad">⚠️ ${E(why)}</span>` : ''}</p>
          <div class="row">${have ? '<span class="good">✅ มีใบอนุญาตแล้ว</span>' : wait ? `<span class="dim">🕓 รอผลถึง${RD(wait)}</span>` : `<button class="btn" data-a="colic" data-v="${c.id}" data-k="${key}">ยื่นขอใบอนุญาต ${baht(L.fee)}</button>`}</div></div></div>`;
      }).join('') : '<p class="empty">ยังไม่มีบริษัทที่ต้องใช้ใบอนุญาตนี้ (จดทะเบียนบริษัทที่แอป 🏢 บริษัทของฉัน ก่อน)</p>');
    },
    open(key, title) { UI.open('📄 ' + (title || (CO_LIC[key] || {}).n || 'ใบอนุญาตบริษัท'), null, () => this.body(key)); },
  };
  window.CoLic205 = CoLic;

  // counters on the existing government offices
  const add = (id, sv) => { const o = Gov24.offices.find(x => x.id === id); if (!o) return; for (const s of sv) if (!o.sv.some(x => x.id === s.id)) o.sv.push(s); };
  const csv = (id, key, n, i, d) => ({ id, n, i, d, req: ['idcard'], run: () => { UI.close(); setTimeout(() => CoLic.open(key), 0); } });
  add('revenue', [csv('covat', 'vat', 'จดทะเบียนภาษีมูลค่าเพิ่ม ภ.พ.20 (บริษัท)', '🏢', 'รายได้บริษัทเกิน 1.8 ล้านบาทต่อปีต้องจด ฟรี 1 วัน')]);
  add('dbd', [csv('coecom', 'ecom', 'จดทะเบียนพาณิชย์อิเล็กทรอนิกส์ + PDPA (บริษัท)', '🛍️', 'สำหรับอีคอมเมิร์ซ โฮสติ้ง ฟินเทค EdTech และร้านไอที')]);
  add('dlt', [csv('codlt', 'dlt', 'ใบอนุญาตประกอบการขนส่งไม่ประจำทาง (บริษัทขนส่ง)', '🚚', 'บริษัทขนส่งสินค้าต้องมี ใช้รถบรรทุก/กระบะของบริษัท')]);
  add('municipal', [csv('cobuild', 'build', 'ใบอนุญาตก่อสร้าง/ดัดแปลงอาคาร (บริษัท)', '🏗️', 'สถานีชาร์จ EV และอาคารของบริษัท'), { id: 'bext', n: 'ขออนุญาตดัดแปลง/ต่อเติมอาคาร (บ้านหลัก)', i: '🏠', d: 'ต้องมีบัตรประชาชนและทะเบียนบ้าน ยื่นและติดตามที่แอป 🏠 ต่อเติมบ้าน', req: ['idcard', 'housereg'], run: () => { UI.close(); setTimeout(() => { try { House36.openApp(); } catch (e) { UI.toast('เปิดแอปต่อเติมบ้านจากหน้ามือถือ', '🏠'); } }, 0); } }, csv('cofood', 'food', 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร (ร้านอาหาร/คาเฟ่ บริษัท)', '🍽️', 'ต้องมีครัวมาตรฐานก่อน')]);

  // (the counters of the extra agencies are NOT in the village hall: they are in the service centre, see v28_walkin.js)
});
