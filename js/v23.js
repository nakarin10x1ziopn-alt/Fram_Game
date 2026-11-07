'use strict';
// ---------- v23 registry: each v23_*.js file registers an init(fn) that runs once at the end of boot (after every other module) ----------
const V23 = {
  mods: [], times: [],
  add(name, fn) { this.mods.push({ name, fn }); },
  init() { for (const m of this.mods) { const t = performance.now(); try { m.fn(); } catch (e) { console.error('V23 module failed:', m.name, e); } this.times.push([m.name, Math.round(performance.now() - t)]); } },
};
