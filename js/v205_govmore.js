'use strict';
// ---------- v205_govmore: every paper / licence the game asks for now has its own counter at the district hall ----------
//  - company licences (VAT, telecom, energy, food, factory, transport, building, restaurant, e-commerce, payment) are applied for at the authority that really grants them
//    (revenue, NBTC, ERC, FDA, industry office, land transport, municipality, DBD, Bank of Thailand) - one chooser screen, paid from the company account
//  - the hall building gets two more rows of counters for the extra agencies (the ones that used to be only in the phone app)
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

  // two more rows of counters in the hall for the agencies of v26 (+ the new ones)
  if (typeof Rooms !== 'undefined' && Rooms.build) {
    const _rb = Rooms.build;
    Rooms.build = function (def, K) {
      _rb.call(this, def, K);
      if (def.kind !== 'gov' || !window.Agency26) return;
      const g = this.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d, L = Agency26.agencies, per = [9, 9], zs = [-D / 2 + 20.6, -D / 2 + 26.6];
      const looks = ['toon:suit', 'Olivia', 'toon:civil', 'Erika', 'toon:chic', 'Lydia', 'toon:jacket', 'Kate'];
      let n = 0;
      for (let r = 0; r < 2; r++) for (let c = 0; c < per[r]; c++, n++) {
        const a = L[n]; if (!a) continue;
        const x = -W / 2 + 2.2 + c * ((W - 4.4) / (per[r] - 1)), z = zs[r];
        U.mk(g, GEO.box, mc(0x8d6e63), [X + x, 0.53, Z + z], [2.5, 1.05, 0.7]); this.cols.push(Col.box(X + x, Z + z, 1.25, 0.35, 0));
        U.mk(g, GEO.box, mc(0xeeeeee), [X + x, 1.08, Z + z], [2.6, 0.06, 0.8]);
        const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), new THREE.MeshBasicMaterial({ map: U.signTex(a.s, { w: 384, h: 90, bg: '#1b5e20' }) })); sg.position.set(X + x, 2.3, Z + z - 0.45); g.add(sg);
        const o = Models.human(Object.assign({ skin: 0xe0a87e, hair: 0x1b120c }, { avatar: looks[n % looks.length] })); o.position.set(X + x, 0, Z + z - 0.9); g.add(o); this.staff.push(o);
        this.pois.push({ kind: 'act', x: X + x, z: Z + z + 1.0, r: 1.45, label: a.s, icon: a.i, act: () => ({ icon: a.i, label: a.n, fn: () => Agency26.agency(a.id) }) });
      }
    };
  }
});
