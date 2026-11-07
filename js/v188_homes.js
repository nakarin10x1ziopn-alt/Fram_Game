'use strict';
// ---------- v188_homes: every home you own can be entered with E and is a real, lived-in room ----------
//  Audit result (before this file):
//   * a plot you built on, the condo / shophouse / house / dorm you bought: walk-in door with E -> YES, but the room was completely EMPTY (no bed, no water, no kitchen, no wardrobe)
//   * houses / condos / dorms bought on the property market (other cities, listed in the estate app): no building on the map, so NO way in
//   * "drink water" existed nowhere inside a home
//  Now:
//   * the first time you walk into a home it comes with a basic starter set that is already in place: bed (sleep to morning), wardrobe (change clothes), kitchen (cook),
//     fridge (eat), dining table, shower, sofa and a NEW drinking-water dispenser (restores thirst). They follow the same rules as the main house: the kitchen / fridge / fan need
//     power, the kitchen / shower / dispenser need water (meters from the "ไฟ-น้ำ-เน็ต ตามทรัพย์สิน" app). You can still move, store or buy more in the room layout editor.
//     A home you already furnished yourself is left exactly as it is.
//   * the water dispenser is also in the furniture catalogue (3,500 THB) for homes that lost theirs
//   * market properties get a room too: in the property app press "🚪 เข้าบ้านหลังนี้" (their buildings are not on the map, you step straight into the room and "ออกจากอาคาร" brings you back)
V23.add('v188_homes', () => {
  if (typeof Prop23 === 'undefined' || typeof HF === 'undefined' || typeof Rooms === 'undefined') return;
  const toast = (t, i) => { try { UI.toast(t, i || 'ℹ️'); } catch (e) { } };

  // ---------- the new piece of furniture ----------
  HF.water = {
    n: 'ตู้กดน้ำดื่ม (น้ำเย็น/น้ำร้อน)', i: '🚰', price: 3500, w: 1, d: 1, use: 'water', wt: 1,
    mk() { const g = new THREE.Group(); hbox(g, 0.5, 1.15, 0.45, 0, 0.58, 0, 0xeceff1, { roughness: 0.5 }); hbox(g, 0.42, 0.3, 0.02, 0, 0.95, 0.24, 0x90caf9, { roughness: 0.2 }); hbox(g, 0.1, 0.08, 0.1, -0.1, 0.62, 0.26, 0x1e88e5); hbox(g, 0.1, 0.08, 0.1, 0.1, 0.62, 0.26, 0xe53935); hbox(g, 0.36, 0.04, 0.2, 0, 0.5, 0.3, 0x546e7a); return g; },
  };
  { const _a = Prop23.actOf.bind(Prop23);
    Prop23.actOf = function (def, h, it, spec) {
      if (spec && spec.use === 'water') {
        const bad = this.need(h, spec);
        return { icon: '🚰', label: 'ดื่มน้ำจากตู้กดน้ำ', fn: () => { if (bad) { toast(bad, '⚠️'); return; } if (typeof S.thirst === 'number' && S.thirst >= 98) { toast('ไม่กระหายน้ำ', '💧'); return; } try { Life2.drink(); } catch (e) { S.thirst = Math.min(100, (S.thirst || 50) + 50); toast('ดื่มน้ำเย็น ๆ สดชื่น!', '💧'); } } };
      }
      return _a(def, h, it, spec);
    }; }

  // ---------- starter set ----------
  const ORDER = ['bed2', 'wardrobe', 'kitchen', 'fridge', 'water', 'shower', 'table', 'sofa'];
  function starter(hid) {
    if (!hid || /^main/.test(hid)) return; let h; try { h = Prop23.home(hid); } catch (e) { return; }
    if (h.starter) return; h.starter = 1;
    if ((h.items && h.items.length) || (h.boxes && Object.keys(h.boxes).length) || (h.orders && h.orders.length)) return;   // the player already furnished it
    let g; try { g = Prop23.grid(hid); } catch (e) { return; } const W = g.W, D = g.D, free = D >= 7 ? D - 2 : D - 1;   // keep the row in front of the door empty so you can walk in
    const placed = [];
    for (const k of ORDER) {
      const sp = HF[k]; if (!sp) continue; let done = false;
      for (let r = 0; r < 2 && !done; r++) {
        const odd = r % 2, fw = odd ? sp.d : sp.w, fd = odd ? sp.w : sp.d;
        for (let y = 0; y + fd <= free && !done; y++) for (let x = 0; x + fw <= W && !done; x++) {
          if (!Prop23.fits(h, W, D, k, x, y, r)) continue; if (k !== 'sofa' && k !== 'table' && y > 1 && placed.length < ORDER.length) { /* keep big items near the walls first */ }
          h.items.push({ k, x, y, r }); placed.push(k); done = true;
        }
      }
    }
    h.starterN = placed.length;
  }
  { const _b = Prop23.build.bind(Prop23); Prop23.build = function (def, K) { try { if (def && def.home) starter(def.home); } catch (e) { console.warn('v188 starter', e); } return _b(def, K); }; }

  // ---------- market properties: a room to step into ----------
  const dims = area => { const W = Math.max(6, Math.min(14, Math.round(Math.sqrt((area || 80) * 1.3)))), D = Math.max(5, Math.min(10, Math.round((area || 80) / W))); return [W, D]; };
  function enter(id) {
    let I; try { I = Estate39.info(id); } catch (e) { return; } if (!I || I.type === 'land' || !Estate39.ids().includes(id)) { toast('ที่ดินเปล่าไม่มีห้องให้เข้า', '🌳'); return; }
    if (typeof G !== 'undefined' && (G.driving || G.inRoom)) { toast(G.driving ? 'ลงจากรถก่อน' : 'ออกจากอาคารที่อยู่ก่อน', '🚪'); return; }
    const [W, D] = dims(I.area), kind = 'own' + W + 'x' + D; ROOM_KIND[kind] = ROOM_KIND[kind] || { w: W, d: D, floor: 0xd7ccc8, wall: 0xfaf3e6, title: I.n };
    const p = Prop23.homePoi[id] = Prop23.homePoi[id] || { kind: 'act', x: G.player.pos.x, z: G.player.pos.z, r: 2, label: I.n, icon: I.i || '🏠' };
    p.x = G.player.pos.x; p.z = G.player.pos.z; p.label = I.n; p.room = { kind, title: I.n, home: id, staff: null, service: () => { } };
    UI.close(); try { Phone.app = null; } catch (e) { } Rooms.enter(p);
  }
  window.Home188 = { starter, enter, ORDER, dims };
});
