'use strict';
// ---------- v46_pond: the fish pond on the farm is a real pond you can run ----------
// Before: a "pond" prompt on bare grass. Now: a visible pond (water, stone rim, jetty, sign, fish that swim and grow with the stock), a panel that shows the stock, growth,
// feeding and the expected harvest value, and buttons for everything: buy fry and feed right at the pond, release / feed from the bag, harvest it all or only 5, sell the
// fish on the spot, or take them home for the kitchen (ปลานิลเผาเกลือ). The ripe notice arrives by message. Stock lives in S.f2.pond as before { n, g, fed } (+ told).
V23.add('v46_pond', () => {
  if (typeof Farm2 === 'undefined' || typeof POND_POI === 'undefined') return;
  const CAP = 40, RIPE = 3, GROUP = 10;
  const C = { x: 30, z: 20 };                                      // the pond already in the world (water, rocks, reeds, lilies, jetty) is the fish farm: its centre
  const P = () => Farm2.st().pond;
  const toast = (t, i) => { try { UI.toast(t, i || '🐟'); } catch (e) { } };
  const fryPrice = () => (TOOLS.fingerling && TOOLS.fingerling.price) || 25, feedPrice = () => (TOOLS.fishfeed && TOOLS.fishfeed.price) || 18;
  const fishPrice = () => { try { return priceOf('fish_nile'); } catch (e) { return 40; } };
  const growPct = p => Math.min(100, Math.round(p.g / RIPE * 100));
  const ripe = p => p.n > 0 && p.g >= RIPE;

  // ---------- 3D: the real pond gets a sign by the farm-side shore and fish that swim in it ----------
  const g = new THREE.Group(); World.outdoor.add(g);
  const Y = 0.1;
  // (the sign now stands at the entrance of the walkway, see world.js; the fish are real swimming fish, see v68_fishpond.js)
  // fish: one sprite per few fish (max 14), swimming ellipses, bigger as they grow
  const fish = []; let shown = -1, lastSize = -1;
  function syncFish() {
    const p = P(), want = Math.min(14, Math.ceil(p.n / 3)), size = 0.45 + 0.45 * Math.min(1, p.g / RIPE);
    if (want === shown && Math.abs(size - lastSize) < 0.03) return; shown = want; lastSize = size;
    while (fish.length > want) { const f = fish.pop(); g.remove(f.s); }
    while (fish.length < want) { const s = U.sprite('🐟', size, false); g.add(s); fish.push({ s, a: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.35, rx: 1.5 + Math.random() * 3.0, rz: 1.5 + Math.random() * 2.8, dir: Math.random() < 0.5 ? 1 : -1 }); }
    fish.forEach(f => f.s.scale.set(size, size, 1));
  }
  let tm = 0;
  setInterval(() => {
    try {
      return;   // the old emoji fish are retired: v68_fishpond.js draws the fish
      if (!G.started || G.inside || G.inRoom || G.inMine || !G.player) return;
      const d = Math.hypot(G.player.pos.x - C.x, G.player.pos.z - C.z); if (d > 40) return;
      syncFish(); tm += 0.08;
      for (const f of fish) { f.a += f.sp * 0.08 * f.dir; f.s.position.set(C.x + Math.cos(f.a) * f.rx, Y + 0.05 + Math.sin(tm * 3 + f.rx) * 0.03, C.z + Math.sin(f.a) * f.rz); }
    } catch (e) { }
  }, 80);

  // ---------- panel ----------
  const stockTxt = p => !p.n ? 'บ่อว่าง ยังไม่มีปลา' : `ปลา ${p.n} ตัว · โตแล้ว ${growPct(p)}%${ripe(p) ? ' · พร้อมจับ!' : ''}`;
  const hungry = p => p.n > 0 && p.fed !== S.day;
  const expect = p => { const n = Math.round(p.n * 1.6); return { n, v: n * fishPrice() }; };
  Farm2.pondUI = function () {
    UI.open('🐟 บ่อเลี้ยงปลานิล', ['ดูแลบ่อ', 'ซื้อ & ขาย'], tab => {
      const p = P(), e = expect(p), have = count('fish_nile');
      if (tab === 0) return `<div class="card"><div class="ci">${ripe(p) ? '🎣' : '🐟'}</div><div class="cb"><h4>${stockTxt(p)}</h4>
        <div class="prog"><i style="width:${growPct(p)}%"></i></div>
        <p class="dim">${p.n ? `${hungry(p) ? '🍽️ วันนี้ยังไม่ได้ให้อาหาร (ปลาโตช้าลง)' : '✅ วันนี้ให้อาหารแล้ว'} · ถ้าจับทั้งบ่อตอนนี้ ได้ราว ${e.n} ตัว ≈ ${baht(e.v)}` : 'ซื้อลูกปลาแล้วปล่อยลงบ่อ ให้อาหารทุกวัน ครบ 3 วันจับขายได้'}</p></div></div>
        <div class="grid">
        <div class="card"><div class="ci">🫧</div><div class="cb"><h4>ปล่อยลูกปลา</h4><p class="dim">ถุงละ ${GROUP} ตัว · ในบ่อได้สูงสุด ${CAP} ตัว · ในกระเป๋ามี ${count('fingerling')} ถุง</p><div class="row"><button class="btn" data-a="v46pond" data-v="stock" ${count('fingerling') && p.n < CAP ? '' : 'disabled'}>ปล่อยจากกระเป๋า</button></div></div></div>
        <div class="card"><div class="ci">🟤</div><div class="cb"><h4>ให้อาหาร</h4><p class="dim">วันละ 1 ถุง · ในกระเป๋ามี ${count('fishfeed')} ถุง</p><div class="row"><button class="btn" data-a="v46pond" data-v="feed" ${p.n && count('fishfeed') && p.fed !== S.day ? '' : 'disabled'}>ให้อาหาร</button></div></div></div>
        <div class="card"><div class="ci">🎣</div><div class="cb"><h4>จับปลา</h4><p class="dim">ปลาตัวโตขยายพันธุ์ จับทั้งบ่อได้เพิ่มราว 60% · หรือจับแค่ 5 ตัวไว้กินก่อน (ไม่ได้ปลาเพิ่ม)</p><div class="row"><button class="btn" data-a="v46pond" data-v="catch" ${ripe(p) ? '' : 'disabled'}>จับทั้งบ่อ</button><button class="btn ghost" data-a="v46pond" data-v="catch5" ${ripe(p) ? '' : 'disabled'}>จับ 5 ตัว</button></div></div></div>
        </div>`;
      return `<p class="lead">เงินสด ${baht(S.money)} · ปลานิลในกระเป๋า ${have} ตัว (ตัวละ ${baht(fishPrice())})</p><div class="grid">
        <div class="card"><div class="ci">🛒</div><div class="cb"><h4>ซื้อลูกปลา ${GROUP} ตัว</h4><p class="dim">${baht(fryPrice())} · ซื้อแล้วปล่อยลงบ่อให้เลย</p><div class="row"><button class="btn" data-a="v46pond" data-v="buyfry" ${S.money >= fryPrice() && p.n < CAP && !(p.n > 0 && p.g >= 1) ? '' : 'disabled'}>ซื้อ & ปล่อย ${baht(fryPrice())}</button><button class="btn ghost" data-a="v46pond" data-v="buyfrybag" ${S.money >= fryPrice() ? '' : 'disabled'}>ซื้อเก็บไว้</button></div></div></div>
        <div class="card"><div class="ci">🟤</div><div class="cb"><h4>ซื้ออาหารปลา</h4><p class="dim">${baht(feedPrice())} · ซื้อแล้วให้ปลาวันนี้เลย</p><div class="row"><button class="btn" data-a="v46pond" data-v="buyfeed" ${S.money >= feedPrice() && p.n && p.fed !== S.day ? '' : 'disabled'}>ซื้อ & ให้อาหาร ${baht(feedPrice())}</button><button class="btn ghost" data-a="v46pond" data-v="buyfeedbag" ${S.money >= feedPrice() ? '' : 'disabled'}>ซื้อเก็บไว้</button></div></div></div>
        <div class="card"><div class="ci">💰</div><div class="cb"><h4>ขายปลานิล</h4><p class="dim">ราคาวันนี้ตัวละ ${baht(fishPrice())} · ขายที่บ่อได้เลย${have ? ` (ทั้งหมด ${baht(have * fishPrice())})` : ''}</p><div class="row"><button class="btn" data-a="v46pond" data-v="sell" ${have ? '' : 'disabled'}>ขายทั้งหมด ${have} ตัว</button><button class="btn ghost" data-a="v46pond" data-v="sell1" ${have ? '' : 'disabled'}>ขาย 1 ตัว</button></div></div></div>
        <div class="card"><div class="ci">🍳</div><div class="cb"><h4>ทำอาหารจากปลา</h4><p class="dim">ปลานิลเผาเกลือ (ปลา 1 + พริก 1) พลังงาน +50 ขายแพงกว่าตัวปลา · ทำที่ครัวในบ้าน</p></div></div>
        </div>`;
    });
  };
  const _pond = Farm2.pond.bind(Farm2);
  Farm2.pond = function (v) {
    const p = P();
    if (v === 'buyfry' || v === 'buyfrybag') {
      if (S.money < fryPrice()) { toast('เงินไม่พอ', '💸'); return; }
      if (v === 'buyfry') { if (p.n >= CAP) { toast(`บ่อเต็มแล้ว (สูงสุด ${CAP} ตัว)`, '🐟'); return; } if (p.n > 0 && p.g >= 1) { toast('จับปลาชุดเดิมให้หมดก่อนแล้วค่อยปล่อยชุดใหม่', '🐟'); return; } S.money -= fryPrice(); try { Bank2.log('ซื้อลูกปลานิล', -fryPrice()); } catch (e) { } p.n += GROUP; if (p.n === GROUP) p.g = 0; p.told = 0; Sfx.water(); toast(`ปล่อยลูกปลา ${GROUP} ตัวลงบ่อแล้ว`, '🐟'); }
      else { S.money -= fryPrice(); try { Bank2.log('ซื้อลูกปลานิล', -fryPrice()); } catch (e) { } addItem('fingerling', 1); Sfx.coin(); }
      return;
    }
    if (v === 'buyfeed' || v === 'buyfeedbag') {
      if (S.money < feedPrice()) { toast('เงินไม่พอ', '💸'); return; }
      if (v === 'buyfeed') { if (!p.n || p.fed === S.day) return; S.money -= feedPrice(); try { Bank2.log('ซื้ออาหารปลา', -feedPrice()); } catch (e) { } p.fed = S.day; Sfx.water(); toast('ให้อาหารปลาแล้ว', '🟤'); }
      else { S.money -= feedPrice(); try { Bank2.log('ซื้ออาหารปลา', -feedPrice()); } catch (e) { } addItem('fishfeed', 1); Sfx.coin(); }
      return;
    }
    if (v === 'catch5') { if (!ripe(p)) return; const k = Math.min(5, p.n); addItem('fish_nile', k); p.n -= k; if (!p.n) { p.g = 0; p.told = 0; } Prog.add(k); Sfx.pop(); toast(`จับปลานิลได้ ${k} ตัว`, '🎣'); return; }
    if (v === 'sell' || v === 'sell1') {
      const k = v === 'sell' ? count('fish_nile') : Math.min(1, count('fish_nile')); if (!k) return; const val = fishPrice() * k;
      takeItem('fish_nile', k); earn(val); try { Bank2.income('ขายปลานิลที่บ่อ', val); } catch (e) { } S.stats.sold += k; Sfx.coin(); toast(`ขายปลานิล ${k} ตัว ได้ ${baht(val)}`, '💰'); return;
    }
    if (v === 'catch' || v === 'stock') { const r = _pond(v); p.told = 0; return r; }
    return _pond(v);
  };
  UI.H.v46pond = d => Farm2.pond(d.v);
  // the shore prompt opens the new panel
  try { const poi = World.pois.find(x => x.label === 'บ่อเลี้ยงปลา'); if (poi) poi.act = () => ({ icon: ripe(P()) ? '🎣' : '🐟', label: ripe(P()) ? 'บ่อเลี้ยงปลา: ปลาโตแล้ว พร้อมจับ!' : P().n ? `บ่อเลี้ยงปลา (ปลา ${P().n} ตัว โต ${growPct(P())}%)` : 'บ่อเลี้ยงปลา (ว่าง ซื้อลูกปลามาเลี้ยงได้)', fn: () => Farm2.pondUI() }); } catch (e) { }
  // morning message: ripe fish, hungry fish
  { const _nd = newDay; newDay = function () {
    const r = _nd.apply(this, arguments);
    try { const p = P(); if (p.n > 0) { if (ripe(p) && !p.told) { p.told = 1; Phone.msg('บ่อปลาไร่สุขใจ', `ปลานิล ${p.n} ตัวโตเต็มที่แล้ว จับขายได้เลย (ราว ${baht(expect(p).v)})`); } else if (p.fed !== S.day - 1 && p.g < RIPE) Phone.msg('บ่อปลาไร่สุขใจ', 'ปลาในบ่อหิวแล้ว ไปให้อาหารด้วยนะ ไม่ให้อาหารปลาจะโตช้า'); } } catch (e) { }
    return r;
  }; }
  window.Pond46 = { fishN: () => fish.length, C, state: P, growPct, ripe, expect };
});
