'use strict';
// ---------- v179_shopmerge: shops that sold the same / similar things are now one shop ----------
//  Every shop of the village and of the big / middle / small cities was compared (66 shops). Shops of the same kind that sold overlapping things are combined into ONE shop with all their tabs:
//   * the shop that is kept (the "host") gets every tab / product of the others; the same product is never listed twice
//   * the building doors stay where they are (the map, taxi, shop signs and saves keep working), but the doors of a combined shop open the same shop with the same combined name
//   * NOT merged: restaurant / seafood (they are menu-order kitchens, not shelves), the car showrooms (different level gates, models and delivery), carpenter + luxury furniture (level 3 vs 14),
//     the PC shops (already one list per city), pharmacy / furniture / festival stalls / online shop / mall / mart (each is the only one of its kind in its area)
//  City shops are created when the city is first built, so each area is combined once, the first time one of its shops is opened (after v178's duplicate check).
V23.add('v179_shopmerge', () => {
  if (typeof SHOPS === 'undefined' || typeof UI === 'undefined') return;
  const M = [
    // village (the door that is kept is the one that exists: nightmarket / islandbar / mountain have no reachable door any more)
    { host: 'farmshop', abs: ['hardware'], n: 'ร้านเกษตร & วัสดุก่อสร้าง' },
    { host: 'ranch', abs: ['petshop'], n: 'ปศุสัตว์ & สัตว์เลี้ยง' },
    { host: 'florist', abs: ['rare'], n: 'ร้านดอกไม้ & พันธุ์ไม้หายาก' },
    { host: 'itshop', abs: ['secshop'], n: 'ไอที & ซีเคียวริตี้' },
    { host: 'citycafe', abs: ['islandbar'], n: 'คาเฟ่ & บาร์ สุขใจ' },
    { host: 'floating', abs: ['nightmarket'], n: 'ตลาดน้ำ & ถนนคนเดิน สุขใจ' },
    // big city (the bigger building is the one that stays)
    { host: 'v25_metro_mall', abs: ['v23_metro_0'], n: null },
    { host: 'v23_metro_1', abs: ['v23_metro_3', 'v23_metro_4'], n: 'ไอทีมอลล์ สมาร์ตโฮม & ซีเคียวริตี้' },
    { host: 'v23_metro_5', abs: ['v23_metro_6'], n: 'แฟชั่น & จิวเวลรี่' },
    { host: 'v23_metro_7', abs: ['v23_metro_14'], n: 'หนังสือ ของเล่น & ของขวัญ' },
    { host: 'v23_metro_10', abs: ['v23_metro_11'], n: 'ซูชิ ราเมน & สตรีทฟู้ด' },
    { host: 'v23_metro_12', abs: ['v23_metro_13'], n: 'คาเฟ่ & เบเกอรี่' },
    { host: 'v25_metro_market', abs: ['v23_metro_15'], n: null },
    // middle city
    { host: 'v25_orchard_mall', abs: ['v23_orchard_0', 'v23_orchard_1'], n: null },
    { host: 'v23_orchard_3', abs: ['v23_orchard_4'], n: 'น้ำผลไม้ & ผลไม้แปรรูป' },
    { host: 'v23_orchard_5', abs: ['v23_orchard_7'], n: 'ร้านชำ & ร้านยา' },
    { host: 'v23_orchard_2', abs: ['v23_orchard_6'], n: 'ตลาดผลไม้ & ครัวสวนทอง' },
    // small city
    { host: 'v23_sunflower_0', abs: ['v23_sunflower_4'], n: 'ร้านชำ & เกษตร' },
    { host: 'v23_sunflower_1', abs: ['v23_sunflower_3'], n: 'ข้าวแกง & กาแฟ' },
  ];
  const GONE = new Set(), NAME = {};
  for (const m of M) { for (const a of m.abs) if (/^v23_/.test(a)) GONE.add(a); if (m.n) NAME[m.host] = m.n; }
  const areaOf = sid => (window.Dedupe178 ? Dedupe178.areaOf(sid) : (/^pcc_/.test(sid) ? sid.slice(4) : /metro/.test(sid) ? 'metro' : /orchard/.test(sid) ? 'orchard' : /sunflower/.test(sid) ? 'sunflower' : 'village'));
  const done = {}, log = {}, pair = {};   // pair: absorbed id -> host id
  const MENUS = () => (typeof MENU !== 'undefined' ? MENU : {});

  function run(area) {
    if (done[area]) return; const todo = M.filter(m => areaOf(m.host) === area); if (!todo.length) return;
    // everything of the area must exist (city shops are built on the first visit)
    if (todo.some(m => !SHOPS[m.host])) return;
    done[area] = 1; let merged = 0, moved = 0;
    for (const m of todo) {
      const H = SHOPS[m.host]; if (!H || MENUS()[m.host]) continue;
      const have = new Set(); for (const t of H.tabs || []) for (const k of t.items || []) have.add(k);
      let used = 0;
      for (const a of m.abs) {
        const A = SHOPS[a]; if (!A || MENUS()[a] || A === H) continue;
        for (const t of (m.share ? [] : (A.tabs || []))) {
          const add = (t.items || []).filter(k => !have.has(k)); (t.items || []).forEach(k => have.add(k));
          if (!add.length) continue;
          let T = (H.tabs || []).find(x => x.n === t.n);
          if (T) T.items = T.items.concat(add); else (H.tabs = H.tabs || []).push(Object.assign({}, t, { items: add }));
          moved += add.length;
        }
        pair[a] = m.host; used++;
      }
      if (!used) continue;
      if (m.n) H.n = m.n; for (const a of m.abs) if (SHOPS[a]) { SHOPS[a].n = H.n; SHOPS[a].tabs = H.tabs; }
      merged += used;
    }
    log[area] = { merged, itemsMoved: moved };
  }
  const sync = id => { const h = pair[id]; if (h && SHOPS[h] && SHOPS[id]) { SHOPS[id].tabs = SHOPS[h].tabs; SHOPS[id].n = SHOPS[h].n; } };
  const first = id => { try { if (window.Dedupe178) Dedupe178.run(areaOf(id)); } catch (e) { } run(areaOf(id)); sync(id); };
  { const _shop = UI.shop.bind(UI); UI.shop = function (id) { try { first(id); } catch (e) { console.warn('v179', e); } return _shop(id); }; }
  setTimeout(() => { try { if (typeof G !== 'undefined' && G.started) { if (window.Dedupe178) Dedupe178.run('village'); run('village'); } else setTimeout(() => { try { if (window.Dedupe178) Dedupe178.run('village'); run('village'); } catch (e) { } }, 20000); } catch (e) { } }, 16000);
    // the far-city doors of merged shops are in cities that no longer exist: drop them
  try { if (typeof World !== 'undefined' && World.pois) { const dead = p => p && p.kind === 'shop' && (p.id === 'mountain' || p.id === 'islandbar') && Math.abs(p.x) > 1500; for (let i = World.pois.length - 1; i >= 0; i--) if (dead(World.pois[i])) World.pois.splice(i, 1); } } catch (e) { }
  window.ShopMerge179 = { M, run, log, pair, areaOf, gone: id => GONE.has(id), nameFor: (id, n) => NAME[id] || n };
});
