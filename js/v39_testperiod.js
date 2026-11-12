'use strict';
// real-date cutoff used before the game state exists (the closure below shares the same value)
const T39_CUTOFF = Date.parse('2026-12-01T00:00:00+07:00'), T39_FLAG = 'raisukjai3d_t39wipe';
// a test save that is loaded after the cutoff is dropped: the player gets a brand-new game (see apply() for the money and level)
{ const _ls = loadState; loadState = function () {
  const s = _ls.apply(this, arguments);
  // (the old end-of-test wipe is removed: saves are never deleted, whatever the date)
  return s;
}; }
// ---------- v39_testperiod: money and level rules for the test period, keyed to the REAL Thai date (UTC+7) ----------
//   until 30 Nov 2569 (everything before 1 Dec 2569 00:00 Thai time): every NEW save starts with 80,000,000 ฿ at the MAXIMUM level (Lvl39.MAX, 50), no papers
//   from 1 Dec 2569: every test save is WIPED once (the real game starts again from nothing): new save = 40,000 ฿, level 1, no items. A save made after the cutoff carries S.v39.reset and is never wiped
// The single place to change dates and amounts is the CFG block below. The old life7 TestMode (500M, level 20) is retired.
V23.add('v39_testperiod', function () {
  const CFG = {
    START: '2026-11-01T00:00:00+07:00',      // 1 Nov 2569
    CUTOFF: '2026-12-01T00:00:00+07:00',     // 1 Dec 2569 00:00 Thai time: from here on the reset applies
    START_CASH: 2000,                        // cash in the wallet of a new save (2,000 THB)
    TEST_MONEY: 10000000000,                  // a new save: savings account (10,000,000,000 THB = 10,000 million)
    TEST_LEVEL: () => 50,   // 'เลเวลต้น' = the maximum level; the number comes from js/v39_levels.js (fallback 50)
    AFTER_MONEY: 30000,                       // in the bank; plus 10,000 cash in the wallet (v49_bank)                       // every save after the cutoff
    AFTER_LEVEL: 1,
  };
  const T0 = Date.parse(CFG.START), T1 = Date.parse(CFG.CUTOFF);
  let fake = null;                            // test hook: pretend it is another real date
  const now = () => fake == null ? Date.now() : fake;
  const inTest = () => now() < T1;            // before the cutoff (a clock set earlier than the start counts as the test period too)
  const V = () => (S.v39 = S.v39 || {});
  const thaiDate = t => { const d = new Date(t + 7 * 3600000); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear() + 543}`; };
  const log = (t, a) => { try { Bank2.log(t, a); } catch (e) { } };

  const setLevel = l => { S.lvl = l; S.xp = 0; };
  // the saved money of an old test save sits in the bank too: clear deposits so 40,000 ฿ really is all there is
  const clearDeposits = () => { try { const b = S.bank; if (b) { b.sav = 0; b.fixed = []; b.jars = []; } } catch (e) { } };

  const notice = () => {
    const txt = `สิ้นสุดช่วงทดสอบ (1–30 พ.ย. 2569) แล้ว ระบบรีเซ็ตเซฟทดสอบทั้งหมดอัตโนมัติ นี่คือการเริ่มเล่นจริงใหม่ทั้งหมด: เงินสด 10,000 ฿ + บัญชีธนาคาร ${CFG.AFTER_MONEY.toLocaleString('en-US')} ฿ · เลเวล ${CFG.AFTER_LEVEL} ของที่เคยมีทั้งหมดหายไป`;
    setTimeout(() => { try { Phone.msg('ทีมงานเกม', txt, true); UI.open('เริ่มเล่นจริง', null, () => `<p class="lead">${txt}</p><div class="row end"><button class="btn" data-a="close">รับทราบ</button></div>`); } catch (e) { } }, 2500);
  };
  const banner = () => {
    const v = V(); if (v.banner) return; v.banner = 1;
    const txt = 'ช่วงทดสอบ 1 พ.ย.–30 พ.ย. 2569: เริ่มเกมใหม่ได้เงินสด 10,000 ฿ + บัญชีธนาคาร 80,000,000 ฿ + เลเวล 50 หลัง 1 ธ.ค. ระบบจะรีเซ็ตทุกเซฟอัตโนมัติ เริ่มเล่นจริงใหม่ด้วยเงินสด 10,000 ฿ + บัญชีธนาคาร 30,000 ฿ + เลเวล 1 ของทั้งหมดจะหายไป';
    setTimeout(() => { try { Phone.msg('ทีมงานเกม', txt, true); UI.toast('🧪 ' + txt, '🧪'); } catch (e) { } }, 3000);
  };

  function apply(why) {
    if (!S) return;
    const v = V();
    // 1. a brand-new save
    if (G.fresh && !v.init) {
      v.init = 1;
      if (true) { v.given = 1; if (window.Pay49) Pay49.setStart(CFG.START_CASH, CFG.TEST_MONEY); else S.money = CFG.TEST_MONEY; setLevel(CFG.TEST_LEVEL()); log('เงินเริ่มต้น (เซฟใหม่)', CFG.TEST_MONEY); }   // v1.1: the same start for every new save, whatever the date
      else { v.reset = 1; v.resetDay = S.day; if (window.Pay49) Pay49.setStart(10000, CFG.AFTER_MONEY); else S.money = CFG.AFTER_MONEY; setLevel(CFG.AFTER_LEVEL); if (safeGet(T39_FLAG)) { safeSet(T39_FLAG, ''); notice(); } }
    }
    // 2. the cutoff passed while a test save was open: wipe it (the reload starts the real game from nothing)
    if (!inTest() && !v.reset && !Slots.deleting) {
      v.reset = 1; v.resetDay = S.day;   // after the cutoff an old test save simply carries on (it is no longer wiped)
    }   // (the test-period banner is retired)
  }

  // check on load, at every new game day, when the tab comes back to the front, and once a minute (a tab left open across midnight)
  setTimeout(() => { try { apply('load'); } catch (e) { console.warn('v39 testperiod', e); } }, 0);   // after every module has registered, so Lvl39.MAX is known
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { apply('day'); } catch (e) { } return r; }; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { apply('visible'); } catch (e) { } } });
  setInterval(() => { try { if (G.started && !V().reset && !inTest()) apply('timer'); } catch (e) { } }, 60000);

  window.Test39 = {
    CFG,
    now, inTest,
    simulateDate(d) { fake = d == null ? null : (typeof d === 'number' ? d : Date.parse(/T/.test(d) ? d : d + 'T12:00:00+07:00')); return fake == null ? 'real' : thaiDate(fake); },
    apply,
    info: () => ({ inTest: inTest(), date: thaiDate(now()), flags: Object.assign({}, S.v39), money: S.money, lvl: S.lvl }),
  };
});
