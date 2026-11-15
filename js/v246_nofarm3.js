'use strict';
// ---------- v246: the last farm leftovers that the player could still see ----------
//  - achievements that need a removed place or system (car time trial, contest wins, the two removed far areas, farm hands) are gone
//  - the optional chapter quests ask for things that can still be done (no planting, watering, fishing, harvesting or animal produce)
//  - the "did you know" tips no longer talk about vegetables, animals, the farm stand or the watering can
V23.add('v246_nofarm3', function () {
  try {
    if (typeof ACH !== 'undefined') for (let i = ACH.length - 1; i >= 0; i--) if (['race', 'win3', 'travel', 'hands'].includes(ACH[i][0])) ACH.splice(i, 1);
  } catch (e) { console.warn('v246 ach', e); }
  try {
    if (typeof SIDE !== 'undefined' && SIDE.length >= 5) {
      const Q = [
        [['bought', 'ซื้อของ 10 ชิ้น', 10, 800], ['cooked', 'ทำอาหาร 3 จาน', 3, 800], ['sold', 'ขายของ 20 ชิ้น', 20, 1000]],
        SIDE[1],
        [['mkrep', 'ตกลงราคากับลูกค้า 3 ครั้ง', 3, 2000], ['sold', 'ขายของ 40 ชิ้น', 40, 2500], ['cooked', 'ทำอาหาร 5 จาน', 5, 1500]],
        [['bought', 'ซื้อของ 25 ชิ้น', 25, 2000], ['cooked', 'ทำอาหาร 8 จาน', 8, 1500], ['earned', 'หาเงินได้ 20,000 ฿', 20000, 3000]],
        [['sold', 'ขายของ 60 ชิ้น', 60, 3000], ['bought', 'ซื้อของ 40 ชิ้น', 40, 3000], ['stories', 'อ่านเรื่องชาวบ้านจบ 5 ตอน', 5, 4000]],
      ];
      for (let i = 0; i < 5; i++) SIDE[i] = Q[i];
    }
  } catch (e) { console.warn('v246 side', e); }
  try {   // an old save has no starting value for the new quest kinds: take the current one
    if (typeof SideQ !== 'undefined') { const _r = SideQ.rows.bind(SideQ); SideQ.rows = function () { try { const g = Saga.st(); if (g.started && !g.ended && SIDE[g.ch]) { const st = this.st(), b = st['b' + g.ch] = st['b' + g.ch] || {}; for (const [k] of SIDE[g.ch]) if (b[k] == null) b[k] = this.val(k); } } catch (e) { } return _r(); }; }
  } catch (e) { console.warn('v246 sideq', e); }
  try {
    if (typeof TIPS !== 'undefined' && Array.isArray(TIPS)) for (let i = TIPS.length - 1; i >= 0; i--) if (/ผัก|สัตว์ที่มี|แผงขาย|บัวรดน้ำ|ฟาร์ม|ปลูก|เกษตร|รดน้ำ|ผลผลิต|เมล็ด|แปลง|ปุ๋ย|คอก|ตกปลา/.test(TIPS[i])) TIPS.splice(i, 1);
  } catch (e) { console.warn('v246 tips', e); }
  try {   // a villager's favourite (also the item a story chapter asks for) must be something that can still be bought
    if (typeof favOf === 'function') {
      const _f = favOf, POOL = ['food_cake', 'food_sandwich', 'food_onigiri', 'food_energy'];
      const farmish = id => { const it = typeof ITEMS !== 'undefined' ? ITEMS[id] : null; return !it || ['crop', 'product', 'fish', 'artisan', 'seed'].includes(it.cat) || (typeof CROPS !== 'undefined' && CROPS[id]); };
      favOf = function (name) { const f = _f(name); if (!farmish(f)) return f; let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return POOL.find((p, i) => i === h % POOL.length && ITEMS[p]) || POOL.find(p => ITEMS[p]) || f; };
    }
  } catch (e) { console.warn('v246 fav', e); }
  try {   // the two bought farmland lots (rice, corn, cassava, cane) are gone; an old owner is paid back 80% once
    if (typeof BIG_FIELDS !== 'undefined') {
      const lots = BIG_FIELDS.slice(); BIG_FIELDS.length = 0;
      const refund = () => { try { if (!S || S.fields245) return; const own = S.fields || {}; let cash = 0; for (const F of lots) if (own[F.id]) cash += Math.round(F.price * 0.8); S.fields = undefined; S.fields245 = 1; if (cash > 0) { S.money += cash; try { Bank2.log('คืนเงินที่ดินทำไร่ (ปิดระบบ)', cash); } catch (e) { } try { Phone.msg('ระบบเกม', 'ที่ดินทำไร่ถูกปิดแล้ว ได้รับเงินคืน ' + (typeof baht === 'function' ? baht(cash) : cash) + ' (80% ของราคาซื้อ)', false); } catch (e) { } } } catch (e) { } };
      const purge = () => { try { if (World.pois) World.pois = World.pois.filter(o => !(o && /ไร่ริมถนน/.test(o.label || ''))); if (typeof Fields !== 'undefined' && Fields.g) { for (const k in Fields.g) { const g = Fields.g[k]; if (g && g.parent) g.parent.remove(g); } Fields.g = {}; } } catch (e) { } };
      let n = 0; const iv = setInterval(() => { try { if (typeof S !== 'undefined' && S && typeof G !== 'undefined' && G.started) { clearInterval(iv); refund(); purge(); setTimeout(purge, 3000); } else if (++n > 600) clearInterval(iv); } catch (e) { } }, 700);
    }
  } catch (e) { console.warn('v246 fields', e); }
});
