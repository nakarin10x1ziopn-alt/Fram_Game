'use strict';
// ---------- v167_branch: the village bank branch works like a real branch ----------
// New tabs in the branch window (the old two stay): 📝 open / close accounts and counter services · 📖 account statement · 💰 fixed deposits · 🔐 safe-deposit box
//   * open a savings or current account at the counter (name it, first deposit from savings or cash, ID card + counter hours, passbook / chequebook), close extra accounts, rename them
//   * transfer to another person or another bank at the counter (no app limit, a real fee), certificate of balance, new chequebook, PromptPay, specimen signature
//   * fixed deposits 3 / 6 / 12 months (1 month = 7 game days) with interest paid at maturity, early withdrawal loses the interest
//   * safe-deposit box rented for 28 days, cash goes in and out
// Data: S.v49.fd [], S.v49.safe {until, cash}
V23.add('v167_branch', () => {
  const B = window.Bank49; if (!B || typeof UI === 'undefined' || typeof Bank2 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const bS = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const msg = (t, good) => { try { Phone.msg('ธนาคารสุขใจ', t, !!good); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const V = () => { const v = B.V(); if (!v.fd) v.fd = []; if (!v.safe) v.safe = { until: 0, cash: 0 }; if (!v.fdSeq) v.fdSeq = 0; return v; };
  const TITLE = 'ธนาคารสุขใจ สาขาหมู่บ้าน', f1 = 'font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0;min-width:0;flex:1';
  const BR = { stm: 'main' };
  const BANKS = ['ธนาคารสุขใจ (สาขาอื่น)', 'กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย', 'ทหารไทยธนชาต', 'กรุงศรีอยุธยา', 'ออมสิน', 'ธ.ก.ส.'];
  const FDT = { 3: { days: 21, rate: 1.5 }, 6: { days: 42, rate: 1.9 }, 12: { days: 84, rate: 2.4 } };   // months -> game days (1 month = 7 days) and yearly rate %
  const status = () => (B.bankOpen() ? '🟢 เคาน์เตอร์เปิด' : '🔴 เคาน์เตอร์ปิด (เปิด จ–ศ 08:30–16:30 ไม่ใช่วันหยุด)') + (B.hasId() ? ' · 🪪 มีบัตรประชาชน' : ' · ⚠️ ยังไม่มีบัตรประชาชน (ทำที่ศูนย์ราชการ ต้องใช้ทุกบริการที่เคาน์เตอร์)');
  const gate = () => { if (!B.bankOpen()) { toast('เคาน์เตอร์ปิดอยู่ เปิด จ–ศ 08:30–16:30', '🕘'); return false; } if (!B.hasId()) { toast('ทำรายการที่เคาน์เตอร์ต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return false; } return true; };
  const accOpts = (id, withMain = true, sel) => `<select id="${id}" style="${f1}">${B.all().filter(a => withMain || !a.main).map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${E(a.name)} · ${E(a.no)} · ${bS(B.balOf(a))}</option>`).join('')}</select>`;
  const slip = (o) => { try { if (window.Slip49) window.Slip49.make(o); } catch (e) { console.warn('slip', e); } };

  // ---------------- tab 2: open / close accounts and counter services ----------------
  function tabService() {
    const v = V(), extra = v.accts;
    return `<p class="lead">🏦 บริการที่เคาน์เตอร์สาขา</p><p class="dim">${status()}</p>
      <h5>📝 เปิดบัญชีใหม่</h5>
      <p class="dim">กรอกคำขอเปิดบัญชี ใช้บัตรประชาชน · ออมทรัพย์ฝากขั้นต่ำ 500 ฿ (เปิดเพิ่มได้ถึง 5 บัญชี) · กระแสรายวัน ฝากขั้นต่ำ 2,000 ฿ ได้สมุดเช็ค ${20} ใบ (มีได้ 1 บัญชี) · ผู้ขอเปิด: ${E(S.name || 'ชาวไร่')}</p>
      <div class="row"><select id="brType" style="${f1}"><option value="sav">💰 บัญชีออมทรัพย์ (สมุดคู่ฝาก)</option><option value="cur" ${extra.some(a => a.type === 'cur') ? 'disabled' : ''}>🧾 บัญชีกระแสรายวัน (สมุดเช็ค)</option></select></div>
      <div class="row"><input id="brName" type="text" maxlength="24" placeholder="ชื่อบัญชี (ไม่ใส่ก็ได้ เช่น ออมไว้ซื้อรถ)" style="${f1}"></div>
      <div class="row"><input id="brDep" type="number" min="1" placeholder="เงินฝากเริ่มต้น (บาท)" style="${f1}"><select id="brSrc" style="${f1}"><option value="sav">จากบัญชีออมทรัพย์หลัก (${bS(Bank.st().sav)})</option><option value="cash">จากเงินสด (${bS(S._c)})</option></select></div>
      <div class="row"><button class="btn" data-a="s163bropen">📝 ยื่นคำขอและเปิดบัญชี</button></div>
      <h5>📒 บัญชีของฉัน</h5>${B.all().map(a => `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${a.type === 'cur' ? '🧾' : '💰'} ${E(a.name)}</h4><p class="dim">เลขที่ ${E(a.no)}${a.opened ? ' · เปิด ' + E(RD(a.opened)) : ''}</p><p><b>${bS(B.balOf(a))}</b></p></div>${a.main ? '<span class="dim">บัญชีหลัก</span>' : `<button class="btn ghost" data-a="s163brclose" data-v="${a.id}">ปิดบัญชี</button>`}</div>`).join('')}
      ${extra.length ? `<div class="row"><select id="brRenAcc" style="${f1}">${extra.map(a => `<option value="${a.id}">${E(a.name)}</option>`).join('')}</select><input id="brRenName" type="text" maxlength="24" placeholder="ชื่อบัญชีใหม่" style="${f1}"><button class="btn ghost" data-a="s163brname">ตั้งชื่อ</button></div>` : ''}
      <h5>🏦 โอนเงินที่เคาน์เตอร์ (ถึงบุคคลอื่น / ต่างธนาคาร)</h5>
      <p class="dim">ไม่จำกัดวงเงินแบบแอป · ค่าธรรมเนียม: ธนาคารเดียวกัน ฟรี · ต่างธนาคาร 25 ฿ (ไม่เกิน 100,000) / 35 ฿ (ไม่เกิน 500,000) / 50 ฿ (มากกว่านั้น) · ได้สลิปโอนเงิน</p>
      <div class="row">${accOpts('brXfFrom')}</div>
      <div class="row"><select id="brXfBank" style="${f1}">${BANKS.map(b => `<option>${E(b)}</option>`).join('')}</select></div>
      <div class="row"><input id="brXfNo" type="text" inputmode="numeric" maxlength="12" placeholder="เลขที่บัญชีผู้รับ (10–12 หลัก)" style="${f1}"><input id="brXfNm" type="text" maxlength="30" placeholder="ชื่อบัญชีผู้รับ" style="${f1}"></div>
      <div class="row"><input id="brXfAmt" type="number" min="1" placeholder="จำนวนเงิน" style="${f1}"><input id="brXfMemo" type="text" maxlength="30" placeholder="บันทึกช่วยจำ (ไม่บังคับ)" style="${f1}"></div>
      <div class="row"><button class="btn" data-a="s163brxfer">🏦 ทำรายการโอน</button></div>
      <h5>🗂️ บริการอื่น</h5>
      <div class="row"><button class="btn ghost" data-a="s163brcert">📄 หนังสือรับรองยอดเงินฝาก (100 ฿)</button><button class="btn ghost" data-a="s163brbook" ${extra.some(a => a.type === 'cur') ? '' : 'disabled'}>📒 ขอสมุดเช็คเล่มใหม่ (100 ฿)</button></div>
      <div class="row"><button class="btn ghost" data-a="s163brpp">🔳 ลงทะเบียนพร้อมเพย์</button><button class="btn ghost" data-a="s163brsig">✍️ ขอเปลี่ยนลายเซ็นตัวอย่าง</button></div>`;
  }
  UI.H.s163bropen = () => {
    if (!gate()) return;
    const a = B.openNew(val('brType') === 'cur' ? 'cur' : 'sav', +val('brDep') || 0, val('brName'), val('brSrc') === 'cash' ? 'cash' : 'sav', true);
    if (a) toast(a.type === 'cur' ? `เปิดบัญชีกระแสรายวัน ${a.no} · ได้สมุดเช็ค` : `เปิดบัญชี ${a.no} · ได้สมุดคู่ฝาก`, '📒');
  };
  UI.H.s163brclose = d => {
    if (!gate()) return; const v = V(), a = v.accts.find(x => x.id === d.v); if (!a) return;
    if (a.type === 'cur' && v.ch.some(c => c.status === 'pending' && !c.held)) { toast('มีเช็คที่ยังไม่ถูกเรียกเก็บ ปิดบัญชีกระแสรายวันไม่ได้ ต้องรอเช็คเคลียร์ก่อน', '🧾'); return; }
    if (!confirm(`ปิดบัญชี ${a.name} (${a.no})? ยอดเงิน ${bS(a.bal)} จะโอนเข้าบัญชีออมทรัพย์หลัก`)) return;
    const bal = Math.round(a.bal); Bank.st().sav += bal; v.accts = v.accts.filter(x => x.id !== a.id); if (a.type === 'cur') v.book.left = 0;
    B.tx(`ปิดบัญชี ${a.no} โอนยอด ${bS(bal)} เข้าบัญชีหลัก`, 0, 'main'); try { Bank2.log(`ปิดบัญชี ${a.name} (โอนยอดคงเหลือเข้าบัญชีหลัก)`, 0); } catch (e) { }
    msg(`ปิดบัญชี ${a.name} เลขที่ ${a.no} เรียบร้อย โอนเงินคงเหลือ ${bS(bal)} เข้าบัญชีออมทรัพย์หลัก`, true); toast('ปิดบัญชีเรียบร้อย', '🗂️');
    slip({ k: 'acct', amt: bal, payee: a.name, memo: `ปิดบัญชี เลขที่ ${a.no} โอนยอดเข้าบัญชีหลัก`, from: a.no, neutral: true });
  };
  UI.H.s163brname = () => { const a = V().accts.find(x => x.id === val('brRenAcc')), n = String(val('brRenName') || '').trim().slice(0, 24); if (!a) return; if (n.length < 2) { toast('พิมพ์ชื่อบัญชีใหม่อย่างน้อย 2 ตัวอักษร', 'ℹ️'); return; } a.name = n; toast('เปลี่ยนชื่อบัญชีแล้ว', '✏️'); };
  UI.H.s163brxfer = () => {
    if (!gate()) return; const v = V(), a = B.all().find(x => x.id === val('brXfFrom')), bank = val('brXfBank') || BANKS[0], no = String(val('brXfNo') || '').replace(/\D/g, ''), nm = String(val('brXfNm') || '').trim().slice(0, 30), n = Math.round(+val('brXfAmt') || 0), memo = String(val('brXfMemo') || '').trim().slice(0, 30);
    if (!a) return; if (no.length < 10 || no.length > 12) { toast('เลขที่บัญชีผู้รับต้องมี 10–12 หลัก', 'ℹ️'); return; } if (nm.length < 2) { toast('พิมพ์ชื่อบัญชีผู้รับ', 'ℹ️'); return; } if (!(n >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; }
    const same = bank === BANKS[0], fee = same ? 0 : n <= 100000 ? 25 : n <= 500000 ? 35 : 50;
    if (B.balOf(a) < n + fee) { toast(`เงินใน${a.name}ไม่พอ (มี ${bS(B.balOf(a))} ต้องใช้ ${bS(n + fee)} รวมค่าธรรมเนียม)`, '💸'); return; }
    B.setBal(a, B.balOf(a) - n - fee); const masked = no.slice(0, 3) + '-x-xxx' + no.slice(-3);
    B.tx(`โอนที่เคาน์เตอร์ไป ${nm} (${bank} ${masked})${fee ? ' ค่าธรรมเนียม ' + fee : ''}`, -(n + fee), a.id); try { Bank2.log(`โอนที่เคาน์เตอร์ไป ${nm} (${bank})`, -(n + fee)); } catch (e) { }
    if (n >= 2000000) msg(`ธุรกรรมโอนเงิน ${bS(n)} ที่เคาน์เตอร์ ธนาคารรายงานสำนักงาน ปปง. ตามกฎหมาย`, false);
    toast(`โอน ${bS(n)} ให้ ${nm} (${bank}) สำเร็จ${fee ? ' · ค่าธรรมเนียม ' + bS(fee) : ''}`, '🏦');
    slip({ k: 'xfer', amt: n, fee, payee: `${nm} (${bank} ${masked})`, memo: memo || 'โอนเงินที่เคาน์เตอร์', from: `${a.name} ${a.no}` });
  };
  UI.H.s163brcert = () => {
    if (!gate()) return; const fee = 100, v = V(), use = S._c >= fee ? 'cash' : (Bank.st().sav >= fee ? 'sav' : null); if (!use) { toast('เงินไม่พอจ่ายค่าธรรมเนียม 100 ฿', '💸'); return; }
    if (use === 'cash') S._c -= fee; else Bank.st().sav -= fee;
    const L = B.all(), tot = L.reduce((s, a) => s + B.balOf(a), 0) + v.fd.reduce((s, f) => s + f.amt, 0);
    B.tx('ค่าหนังสือรับรองยอดเงินฝาก', use === 'sav' ? -fee : 0, 'main'); try { if (use === 'sav') Bank2.log('ค่าหนังสือรับรองยอดเงินฝาก', -fee); } catch (e) { }
    slip({ k: 'acct', amt: fee, payee: `หนังสือรับรองยอดเงินฝาก · ${S.name || 'ชาวไร่'}`, memo: `ยอดเงินฝากรวม ${bS(tot)} ณ ${RD(S.day)}`, from: use === 'cash' ? 'เงินสด' : 'ออมทรัพย์', items: L.map(a => ({ memo: `${a.name} ${a.no}`, amt: Math.round(B.balOf(a)) })).concat(v.fd.map(f => ({ memo: `เงินฝากประจำ ${f.term} เดือน`, amt: f.amt }))) });
  };
  UI.H.s163brbook = () => { if (!gate()) return; UI.H.b49({ v: 'book' }); };
  UI.H.s163brpp = () => { if (!gate()) return; UI.H.b49({ v: 'ppreg' }); };
  UI.H.s163brsig = () => { if (window.BankPlus || UI.H.s163rs) UI.H.s163rs(); };

  // ---------------- tab 3: statement ----------------
  function tabStatement() {
    const v = V(), L = B.all(), a = L.find(x => x.id === BR.stm) || L[0]; BR.stm = a.id;
    const rows = v.tx.filter(x => (x.ac || 'main') === a.id).slice(0, 40), cut = S.day - 28;
    let inn = 0, out = 0; for (const x of v.tx) if ((x.ac || 'main') === a.id && x.d > cut && x.a) { if (x.a > 0) inn += x.a; else out += -x.a; }
    return `<p class="lead">📖 สมุดบัญชี / รายการเดินบัญชี</p>
      <div class="row"><select id="brStmAcc" style="${f1}" onchange="UI.H.s163brstm({v:this.value})">${L.map(x => `<option value="${x.id}" ${x.id === a.id ? 'selected' : ''}>${E(x.name)} · ${E(x.no)}</option>`).join('')}</select></div>
      <div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${a.type === 'cur' ? '🧾' : '💰'} ${E(a.name)} · ${E(a.no)}</h4><p>ยอดคงเหลือ <b>${bS(B.balOf(a))}</b></p><p class="dim">28 วันล่าสุด: เงินเข้า ${bS(inn)} · เงินออก ${bS(out)}${a.main ? '' : ` · เปิดบัญชี ${E(RD(a.opened || 1))}`}</p></div></div>
      ${rows.length ? `<div class="msgs">${rows.map(x => `<div class="msg"><b>${E(x.t)}</b> <small>${E(RD(x.d))}</small><p class="${x.a >= 0 ? 'good' : ''}">${x.a >= 0 ? '+' : ''}${bS(x.a)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีรายการของบัญชีนี้ (รายการของบัญชีออมทรัพย์หลักบางส่วนดูที่แท็บ "สินเชื่อ ลงทุน ประกัน" ได้ด้วย)</p>'}
      <p class="dim">ใบแจ้งยอดและสลิปแต่ละรายการดูได้ที่แอปธนาคาร แท็บ "สลิป/ใบเสร็จ"</p>`;
  }
  UI.H.s163brstm = d => { BR.stm = d.v; try { UI.renderBody(); } catch (e) { } };

  // ---------------- tab 4: fixed deposits ----------------
  const fdRate = k => Math.max(0.3, +(FDT[k].rate + (window.Policy169 ? window.Policy169.delta() * 0.6 : 0)).toFixed(2));
  const fdInterest = f => Math.round(f.amt * f.rate / 100 * FDT[f.term].days / 84);
  function tabFixed() {
    const v = V(), tot = v.fd.reduce((s, f) => s + f.amt, 0);
    return `<p class="lead">💰 เงินฝากประจำ</p><p class="dim">${B.hasId() ? '🪪 มีบัตรประชาชน · ฝาก/ถอนได้ทุกเวลา ทั้งที่สาขา ในแอปธนาคาร' : '⚠️ ยังไม่มีบัตรประชาชน (ทำที่ศูนย์ราชการ)'}</p>
      <p class="dim">ล็อกเงินไว้ตามกำหนดแล้วได้ดอกเบี้ยสูงกว่าออมทรัพย์ · ครบกำหนดแล้วเงินต้น+ดอกเบี้ยเข้าบัญชีออมทรัพย์หลักเอง · ถอนก่อนกำหนดไม่ได้ดอกเบี้ย และเสียค่าธรรมเนียม 0.1% (ขั้นต่ำ 20 ฿) · ฝากขั้นต่ำ 10,000 ฿ · 1 เดือนในเกม = 7 วัน</p>
      <div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>เปิดบัญชีเงินฝากประจำ</h4>
        <div class="row">${Object.keys(FDT).map(k => `<label style="flex:1;font-size:13.5px"><input type="radio" name="brFdT" value="${k}" ${k === '6' ? 'checked' : ''}> ${k} เดือน (${FDT[k].days} วัน) · ${fdRate(k)}% ต่อปี</label>`).join('')}</div>
        <div class="row"><input id="brFdAmt" type="number" min="10000" placeholder="จำนวนเงินฝาก (จากออมทรัพย์หลัก ${bS(Bank.st().sav)})" style="${f1}"><button class="btn" data-a="s163brfd">ฝากประจำ</button></div></div></div>
      <h5>บัญชีเงินฝากประจำของฉัน (${v.fd.length} บัญชี · รวม ${bS(tot)})</h5>
      ${v.fd.length ? v.fd.map(f => `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${bS(f.amt)} · ${f.term} เดือน · ${f.rate}%</h4><p class="dim">ฝาก ${E(RD(f.start))} · ครบ ${E(RD(f.due))} (อีก ${Math.max(0, f.due - S.day)} วัน)</p><p>ดอกเบี้ยเมื่อครบกำหนด ≈ <b class="good">${bS(fdInterest(f))}</b></p></div><button class="btn ghost" data-a="s163brfdx" data-v="${f.id}">ถอนก่อนกำหนด</button></div>`).join('') : '<p class="empty">ยังไม่มีเงินฝากประจำ</p>'}`;
  }
  UI.H.s163brfd = () => {
    if (!B.hasId()) { toast('ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)', '🪪'); return; } const v = V(), term = +(document.querySelector('input[name="brFdT"]:checked') || {}).value || 6, n = Math.round(+val('brFdAmt') || 0);
    if (n < 10000) { toast('ฝากประจำขั้นต่ำ 10,000 ฿', '💸'); return; } if (Bank.st().sav < n) { toast('เงินในบัญชีออมทรัพย์หลักไม่พอ', '💸'); return; } if (v.fd.length >= 20) { toast('มีเงินฝากประจำครบ 20 บัญชีแล้ว', 'ℹ️'); return; }
    const T = Object.assign({}, FDT[term], { rate: fdRate(term) }); Bank.st().sav -= n; const f = { id: ++v.fdSeq, amt: n, term, rate: T.rate, start: S.day, due: S.day + T.days };
    v.fd.push(f); B.tx(`ฝากประจำ ${term} เดือน (${T.rate}% ต่อปี)`, -n, 'main'); try { Bank2.log(`ฝากประจำ ${term} เดือน`, -n); } catch (e) { }
    toast(`ฝากประจำ ${bS(n)} ${term} เดือน ครบกำหนด ${RD(f.due)}`, '💰'); msg(`เปิดบัญชีเงินฝากประจำ ${bS(n)} ระยะ ${term} เดือน ดอกเบี้ย ${T.rate}% ต่อปี ครบกำหนด ${RD(f.due)} (ดอกเบี้ยประมาณ ${bS(fdInterest(f))})`, true);
    slip({ k: 'acct', amt: n, payee: `เงินฝากประจำ ${term} เดือน`, memo: `ดอกเบี้ย ${T.rate}% ต่อปี ครบกำหนด ${RD(f.due)}`, from: 'ออมทรัพย์ ' + B.all()[0].no, neutral: true });
  };
  UI.H.s163brfdx = d => {
    if (!B.hasId()) { toast('ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)', '🪪'); return; } const v = V(), f = v.fd.find(x => x.id === +d.v); if (!f) return; if (window.Secured169 && window.Secured169.locked(f.id)) { toast('เงินฝากประจำนี้ค้ำสินเชื่ออยู่ ถอนก่อนกำหนดไม่ได้ ชำระสินเชื่อให้หมดก่อน', '🔒'); return; } const fee = Math.max(20, Math.round(f.amt * 0.001));
    if (!confirm(`ถอนก่อนกำหนด ${bS(f.amt)}? จะไม่ได้ดอกเบี้ยและเสียค่าธรรมเนียม ${bS(fee)}`)) return;
    v.fd = v.fd.filter(x => x.id !== f.id); Bank.st().sav += f.amt - fee; B.tx('ถอนเงินฝากประจำก่อนกำหนด', f.amt - fee, 'main'); try { Bank2.log('ถอนเงินฝากประจำก่อนกำหนด (ไม่ได้ดอกเบี้ย)', f.amt - fee); } catch (e) { }
    toast(`ถอนเงินฝากประจำก่อนกำหนด ได้รับ ${bS(f.amt - fee)}`, '💰');
  };
  function fdDay() {
    const v = V(); for (const f of v.fd.slice()) if (S.day >= f.due) {
      const it = fdInterest(f); let tot = f.amt + it; v.fd = v.fd.filter(x => x.id !== f.id); if (window.Secured169) tot = window.Secured169.settle(f, tot); Bank.st().sav += tot;
      B.tx(`เงินฝากประจำครบกำหนด (ดอกเบี้ย ${it})`, tot, 'main'); try { Bank2.log(`เงินฝากประจำ ${f.term} เดือนครบกำหนด (เงินต้น ${f.amt} + ดอกเบี้ย ${it})`, tot); } catch (e) { }
      msg(`เงินฝากประจำ ${bS(f.amt)} ครบกำหนดแล้ว เงินต้น + ดอกเบี้ย ${bS(it)} รวม ${bS(tot)} เข้าบัญชีออมทรัพย์หลัก`, true);
    }
  }

  // ---------------- tab 5: safe-deposit box ----------------
  function tabSafe() {
    const v = V(), on = v.safe.until >= S.day;
    return `<p class="lead">🔐 ตู้นิรภัย (Safe Deposit Box)</p><p class="dim">${status()}</p>
      <p class="dim">เก็บเงินสดไว้ในตู้นิรภัยของธนาคาร ปลอดภัยกว่าพกติดตัว · ค่าเช่า 400 ฿ ต่อ 28 วัน (ต่ออายุได้) · เปิดตู้ได้เฉพาะเวลาทำการและต้องมีบัตรประชาชน · ถ้าไม่ต่ออายุ ต้องจ่ายค่าเช่าก่อนจึงจะเปิดตู้ได้</p>
      <div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>🔐 ตู้ของคุณ ${on ? '' : '<small class="bad">(หมดอายุ)</small>'}</h4><p>เงินสดในตู้ <b>${bS(v.safe.cash)}</b></p><p class="dim">${v.safe.until ? (on ? `เช่าถึง ${E(RD(v.safe.until))} (อีก ${v.safe.until - S.day} วัน)` : `หมดอายุเมื่อ ${E(RD(v.safe.until))}`) : 'ยังไม่เคยเช่า'}</p></div><button class="btn" data-a="s163brsafe" data-v="rent">${v.safe.until ? 'ต่ออายุ 28 วัน' : 'เช่าตู้ 28 วัน'} (400 ฿)</button></div>
      ${on ? `<div class="row"><input id="brSafeAmt" type="number" min="1" placeholder="จำนวนเงินสด" style="${f1}"></div><div class="row"><button class="btn" data-a="s163brsafe" data-v="in">นำเงินสดเข้าตู้ (มีเงินสด ${bS(S._c)})</button><button class="btn ghost" data-a="s163brsafe" data-v="out">นำเงินสดออกจากตู้</button></div>` : ''}`;
  }
  UI.H.s163brsafe = d => {
    if (!gate()) return; const v = V(), a = d.v;
    if (a === 'rent') { const fee = 400, use = S._c >= fee ? 'cash' : (Bank.st().sav >= fee ? 'sav' : null); if (!use) { toast('เงินไม่พอจ่ายค่าเช่าตู้ 400 ฿', '💸'); return; } if (use === 'cash') S._c -= fee; else Bank.st().sav -= fee; v.safe.until = Math.max(v.safe.until, S.day) + 28; B.tx('ค่าเช่าตู้นิรภัย 28 วัน', use === 'sav' ? -fee : 0, 'main'); try { if (use === 'sav') Bank2.log('ค่าเช่าตู้นิรภัย', -fee); } catch (e) { }
      toast(`เช่าตู้นิรภัยถึง ${RD(v.safe.until)}`, '🔐'); slip({ k: 'acct', amt: fee, payee: 'ตู้นิรภัยธนาคารสุขใจ', memo: `ค่าเช่าตู้ 28 วัน ถึง ${RD(v.safe.until)}`, from: use === 'cash' ? 'เงินสด' : 'ออมทรัพย์' }); return; }
    if (v.safe.until < S.day) { toast('ตู้นิรภัยหมดอายุ ต่ออายุก่อนจึงจะเปิดตู้ได้', '🔐'); return; }
    const n = Math.round(+val('brSafeAmt') || 0); if (!(n >= 1)) { toast('พิมพ์จำนวนเงินสด', 'ℹ️'); return; }
    if (a === 'in') { if (S._c < n) { toast(`เงินสดในกระเป๋าไม่พอ (มี ${bS(S._c)})`, '💸'); return; } S._c -= n; v.safe.cash += n; toast(`นำเงินสด ${bS(n)} เข้าตู้นิรภัยแล้ว`, '🔐'); }
    else { if (v.safe.cash < n) { toast(`เงินในตู้ไม่พอ (มี ${bS(v.safe.cash)})`, '💸'); return; } v.safe.cash -= n; S._c += n; toast(`นำเงินสด ${bS(n)} ออกจากตู้นิรภัยแล้ว`, '🔐'); }
  };

  // ---------------- wire into the branch window ----------------
  const branchName = () => { try { const p0 = G.player.pos; let best = null, bd = 80; for (const p of World.pois) if (p.icon === '🏦' && /^ธนาคารสุขใจ.*(สาขา|สำนักงาน)/.test(p.label || '')) { const d = Math.hypot(p.x - p0.x, p.z - p0.z); if (d < bd) { bd = d; best = p.label; } } return best || TITLE; } catch (e) { return TITLE; } };
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (title === TITLE && Array.isArray(tabs) && tabs.length === 2) {
        const base = tabs.length, r0 = render; tabs = tabs.concat(['📝 เปิดบัญชี/บริการ', '📖 สมุดบัญชี', '💰 เงินฝากประจำ', '🔐 ตู้นิรภัย']);
        render = t => (t >= base ? [tabService, tabStatement, tabFixed, tabSafe][t - base]() : r0(t));
        title = branchName();   // the same full service in every branch: village, the towns and the head office
      } else if (title === '📱 แอปธนาคารสุขใจ' && Array.isArray(tabs) && tabs.length === 6 && !tabs.includes('📖 สมุดบัญชี')) {
        const base = tabs.length, r0 = render; tabs = tabs.concat(['📖 สมุดบัญชี', '💰 เงินฝากประจำ']);
        render = t => (t >= base ? [tabStatement, tabFixed][t - base]() : r0(t));
      }
      return _open(title, tabs, render, opts);
    }; }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { fdDay(); } catch (e) { console.warn('v167 fd', e); } return r; }; }
  window.Branch167 = { tabService, tabStatement, tabFixed, tabSafe, fdDay, V };
});
