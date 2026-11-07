// cat_ram.js: 60 more memory kits for the computer plaza (brand, size, speed) on top of the 16 basic ones. Prices follow the Thai retail market (DDR4 about 85 baht per GB, DDR5 about 115 baht per GB, faster kits cost more).
function RAM91() {
  const BR = ['Kingston Fury', 'Corsair Vengeance', 'G.Skill Trident Z', 'Crucial', 'TeamGroup T-Force', 'ADATA XPG', 'Patriot Viper', 'Lexar', 'Kingmax', 'Apacer', 'Corsair Dominator', 'G.Skill Ripjaws', 'Klevv', 'PNY XLR8'];
  const PREM = { 'Corsair Dominator': 1.18, 'G.Skill Trident Z': 1.1, 'Corsair Vengeance': 1.05, 'Kingston Fury': 1.04, 'Crucial': 0.95, 'Lexar': 0.93, 'Kingmax': 0.92, 'Apacer': 0.94, 'PNY XLR8': 0.97, 'Patriot Viper': 0.98 };
  const D4 = { 8: [2666, 3200], 16: [2666, 3200, 3600, 4000], 32: [3200, 3600, 4000], 64: [3200, 3600] };
  const D5 = { 16: [4800, 5600, 6000], 32: [4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000], 48: [5600, 6000, 6400, 7200, 8000], 64: [5200, 5600, 6000, 6400, 6800, 7200], 96: [5600, 6000, 6400, 7200], 128: [4800, 5600, 6000, 6400], 192: [5200, 5600, 6000] };
  const rows = []; let n = 0;
  const price = (ddr, gb, mhz, br) => { const base = ddr === 4 ? gb * 78 + (mhz - 2666) * 0.22 * (gb / 16) : gb * 104 + (mhz - 4800) * 0.2 * (gb / 16); return Math.round(base * (PREM[br] || 1) / 10) * 10 - 1; };
  const push = (ddr, gb, mhz, br) => { rows.push(['x1_d' + ddr + '_' + gb + '_' + mhz + '_' + br.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8), gb, ddr, mhz, Math.max(490, price(ddr, gb, mhz, br)), br]); };
  for (const [ddr, T] of [[4, D4], [5, D5]]) for (const gb of Object.keys(T)) for (const mhz of T[gb]) { push(ddr, +gb, mhz, BR[n++ % BR.length]); }
  // popular kits sold under a second brand as well
  for (const [ddr, gb, mhz] of [[4, 16, 3200], [4, 32, 3200], [5, 32, 6000], [5, 32, 5600], [5, 16, 5600], [5, 64, 6000], [5, 32, 6400], [4, 16, 3600], [5, 48, 6000], [5, 96, 6400], [4, 8, 3200], [5, 32, 7200], [5, 64, 5600], [5, 128, 5600], [5, 16, 6000]]) push(ddr, gb, mhz, BR[(n += 5) % BR.length]);
  const seen = new Set(); return rows.filter(r => !seen.has(r[0]) && seen.add(r[0])).slice(0, 62);
}
