'use strict';
// ---------- More pets (rabbit, hamster, horse, turtle, parrot, songbird), up to 5 pets, training, racing / beauty / singing contests, horse riding ----------
function quadPet(o) {
  const P = { legs: [], legRate: o.rate || 11 }, fur = mc(o.col, { roughness: 0.9 }), lt = mc(o.light ?? o.col, { roughness: 0.9 }), dk = mc(0x161210, { roughness: 0.3 });
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); P.body = b;
  const s = o.size || 1;
  U.mk(b, capsule(0.15 * s * (o.fat || 1), 0.38 * s * (o.long || 1), 12), fur, [0, (o.h || 0.42) * s, 0], 1, [Math.PI / 2, 0, 0]);
  if (o.shell) { U.mk(b, GEO.sph, mc(o.shell, { roughness: 0.6 }), [0, 0.2 * s, 0], [0.32 * s, 0.17 * s, 0.38 * s]); }
  const head = new THREE.Group(); head.position.set(0, (o.headY || 0.6) * s, (o.headZ || 0.28) * s); b.add(head); P.head = head;
  if (o.neck) U.mk(b, capsule(0.09 * s, 0.4 * s), fur, [0, 0.95 * s, 0.38 * s], 1, [-0.6, 0, 0]);
  U.mk(head, GEO.sph, fur, [0, 0, 0], [0.12 * s * (o.headW || 1), 0.12 * s, 0.13 * s * (o.snout || 1)]);
  for (const sd of [-1, 1]) {
    U.mk(head, GEO.sph, dk, [sd * 0.055 * s, 0.03 * s, 0.1 * s], 0.022 * s); U.mk(head, GEO.sphLo, mc(0xffffff, { roughness: 0.1 }), [sd * 0.058 * s, 0.04 * s, 0.118 * s], 0.007 * s);
    if (o.ears === 'long') U.mk(head, capsule(0.03 * s, 0.22 * s), lt, [sd * 0.05 * s, 0.2 * s, -0.02 * s], 1, [0, 0, sd * 0.15]);
    else if (o.ears === 'pointy') U.mk(head, GEO.cone, fur, [sd * 0.06 * s, 0.13 * s, -0.02 * s], [0.035 * s, 0.09 * s, 0.035 * s]);
    else if (o.ears !== 'none') U.mk(head, GEO.sph, fur, [sd * 0.08 * s, 0.09 * s, 0], [0.04 * s, 0.04 * s, 0.03 * s]);
  }
  U.mk(head, GEO.sph, dk, [0, -0.01 * s, (0.13 * (o.snout || 1)) * s], 0.02 * s);
  if (o.mane) for (let i = 0; i < 6; i++) U.mk(b, GEO.box, mc(o.mane), [0, (1.05 - i * 0.08) * s, (0.45 - i * 0.08) * s], [0.04 * s, 0.12 * s, 0.1 * s]);
  const lx = 0.09 * s * (o.wide || 1), lz = 0.17 * s * (o.long || 1), ll = (o.leg || 0.2) * s;
  for (const [x, z] of [[-lx, lz], [lx, lz], [-lx, -lz], [lx, -lz]]) { const lg = new THREE.Group(); lg.position.set(x, (o.h || 0.42) * s - 0.08 * s, z); g.add(lg); U.mk(lg, capsule(0.04 * s, ll), o.shell ? mc(0x8d9a5b) : fur, [0, -ll * 0.6, 0]); P.legs.push(lg); }
  const tail = new THREE.Group(); tail.position.set(0, (o.h || 0.42) * s + 0.05 * s, -0.3 * s * (o.long || 1)); b.add(tail); P.tail = tail;
  if (o.tail === 'puff') U.mk(tail, GEO.sph, mc(0xffffff), [0, 0, -0.02 * s], 0.06 * s); else if (o.tail === 'hair') U.mk(tail, capsule(0.04 * s, 0.35 * s), mc(o.mane || o.col), [0, -0.15 * s, -0.05 * s], 1, [0.4, 0, 0]); else if (o.tail !== 'none') U.mk(tail, capsule(0.025 * s, 0.12 * s), fur, [0, 0.04 * s, -0.04 * s], 1, [-0.6, 0, 0]);
  g.userData = P; return blobUnder(Models.compact(shadowAll(g)), 0.35 * s);
}
function birdPet(col, head, beak) {
  const P = { legs: [], legRate: 16 }, g = new THREE.Group(), b = new THREE.Group(); g.add(b); P.body = b;
  U.mk(b, GEO.sph, mc(col, { roughness: 0.6 }), [0, 0.22, 0], [0.1, 0.12, 0.14]);
  for (const s of [-1, 1]) U.mk(b, GEO.sph, mc(col, { roughness: 0.6 }), [s * 0.09, 0.23, -0.02], [0.03, 0.08, 0.12]);
  U.mk(b, GEO.box, mc(col), [0, 0.2, -0.16], [0.06, 0.02, 0.14]);
  const h = new THREE.Group(); h.position.set(0, 0.36, 0.06); b.add(h); P.head = h;
  U.mk(h, GEO.sph, mc(head, { roughness: 0.6 }), [0, 0, 0], 0.075);
  U.mk(h, GEO.cone, mc(beak), [0, -0.01, 0.08], [0.025, 0.06, 0.025], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) U.mk(h, GEO.sphLo, mc(0x111111), [s * 0.04, 0.02, 0.05], 0.012);
  for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.04, 0.12, 0); g.add(l); U.mk(l, GEO.cylLo, mc(0xe0a050), [0, -0.06, 0], [0.01, 0.12, 0.01]); P.legs.push(l); }
  g.userData = P; return blobUnder(Models.compact(shadowAll(g)), 0.15);
}
Models.rabbit = () => quadPet({ col: 0xf5f5f5, light: 0xf8bbd0, size: 0.75, ears: 'long', tail: 'puff', leg: 0.14, h: 0.32, rate: 14 });
Models.hamster = () => quadPet({ col: 0xffcc80, light: 0xfff3e0, size: 0.45, fat: 1.4, long: 0.7, ears: 'round', tail: 'none', leg: 0.08, h: 0.24, rate: 18 });
Models.turtle = () => quadPet({ col: 0x8d9a5b, shell: 0x5d7a3a, size: 0.8, ears: 'none', tail: 'stub', leg: 0.08, h: 0.16, headY: 0.18, headZ: 0.38, rate: 5 });
Models.horse = () => quadPet({ col: 0x8d5a3a, light: 0x8d5a3a, mane: 0x2b1a10, size: 2.1, long: 1.4, wide: 1.1, neck: true, headY: 0.62, headZ: 0.32, snout: 1.6, ears: 'pointy', tail: 'hair', leg: 0.42, h: 0.62, rate: 7 });
Models.parrot = () => birdPet(0x43a047, 0xe53935, 0xffd54f);
Models.songbird = () => birdPet(0x8d8478, 0xbcaaa4, 0x333333);
Object.assign(PETS, {
  rabbit: { n: 'กระต่ายขาว', i: '🐇', price: 900, spd: 6, beauty: 7 },
  hamster: { n: 'แฮมสเตอร์', i: '🐹', price: 400, spd: 3, beauty: 6 },
  turtle: { n: 'เต่าบก', i: '🐢', price: 1100, spd: 1, beauty: 5 },
  parrot: { n: 'นกแก้วพูดได้', i: '🦜', price: 3500, spd: 4, beauty: 9, sing: 5 },
  songbird: { n: 'นกเขาชวาเสียงดี', i: '🐦', price: 2800, spd: 3, beauty: 6, sing: 9 },
  horse: { n: 'ม้าแข่งพันธุ์ไทย', i: '🐎', price: 25000, spd: 10, beauty: 7, ride: true },
});
PETS.dog.spd = 7; PETS.dog.beauty = 6; PETS.cat.spd = 5; PETS.cat.beauty = 8;
for (const k of ['treat', 'groomkit', 'pettoy', 'saddle']) ITEMS[k] = ITEMS[k] || { cat: 'tool' };
Object.assign(TOOLS, {
  treat: { n: 'ขนมสัตว์เลี้ยง', i: '🦴', price: 40, desc: 'ให้สัตว์เลี้ยง ความสุข +20' }, groomkit: { n: 'ชุดอาบน้ำตัดขน', i: '🧴', price: 250, desc: 'ใช้ตอนดูแลสัตว์ ความงาม +2' },
  pettoy: { n: 'ของเล่นสัตว์เลี้ยง', i: '🧶', price: 120, desc: 'เล่นกับสัตว์เลี้ยง ความสุข +30' }, saddle: { n: 'อานม้า', i: '🏇', price: 3000, desc: 'ต้องมีจึงขี่ม้าได้ เดินทางเร็วขึ้น 1.8 เท่า' },
});
for (const k of ['treat', 'groomkit', 'pettoy', 'saddle']) Object.assign(ITEMS[k], { n: TOOLS[k].n, i: TOOLS[k].i, cat: 'tool' });
SHOPS.petshop = { n: 'ศูนย์สัตว์เลี้ยงภูผา', tabs: [{ n: 'สัตว์เลี้ยง', items: ['pet:dog', 'pet:cat', 'pet:rabbit', 'pet:hamster', 'pet:turtle', 'pet:parrot', 'pet:songbird', 'pet:horse'] }, { n: 'ของใช้สัตว์', items: ['tool:treat', 'tool:groomkit', 'tool:pettoy', 'tool:saddle'] }] };
SHOPS.ranch.tabs[2].items.push('pet:rabbit', 'pet:hamster');

const Pets2 = {
  list() { S.pets = S.pets || []; if (S.pet && !S.pets.find(p => p.name === S.pet.name)) S.pets.push(Object.assign({ spd: 0, beauty: 0, joy: 60, wins: 0 }, S.pet)); return S.pets; },
  cur() { return this.list().find(p => S.pet && p.name === S.pet.name); },
  stat(p) { const B = PETS[p.type]; return { spd: (B.spd || 3) + (p.spd || 0), beauty: (B.beauty || 5) + (p.beauty || 0) + Math.round((p.joy ?? 60) / 25), sing: (B.sing || 0) + (p.sing || 0) }; },
  ui() {
    const L = this.list();
    UI.open('สัตว์เลี้ยงของฉัน', null, () => L.length ? `<p class="lead">มีได้สูงสุด 5 ตัว · เลือกตัวที่จะเดินตามคุณ · ฝึกและดูแลทุกวันเพื่อไปแข่ง/ประกวดที่สนามในเมืองภูผาใหม่</p><div class="grid">${L.map((p, i) => { const B = PETS[p.type], st = this.stat(p), active = S.pet && S.pet.name === p.name, done = p.day === S.day; return `<div class="card"><div class="ci">${B.i}</div><div class="cb"><h4>${esc(p.name)} <small>${B.n}${active ? ' · เดินตามอยู่' : ''}</small></h4><p class="dim">ความเร็ว ${st.spd} · ความงาม ${st.beauty}${st.sing ? ' · เสียงร้อง ' + st.sing : ''} · ความสุข ${Math.round(p.joy ?? 60)}% · ชนะ ${p.wins || 0} ครั้ง</p>
        <div class="row"><button class="btn ghost" data-a="pettrain" data-i="${i}" ${done ? 'disabled' : ''}>ฝึกวิ่ง</button><button class="btn ghost" data-a="petgroom" data-i="${i}" ${done ? 'disabled' : ''}>อาบน้ำแต่งตัว${count('groomkit') ? ' (+ชุด)' : ''}</button>${B.sing ? `<button class="btn ghost" data-a="petsing" data-i="${i}" ${done ? 'disabled' : ''}>ฝึกร้อง</button>` : ''}<button class="btn ghost" data-a="pettreat" data-i="${i}" ${count('treat') || count('pettoy') ? '' : 'disabled'}>ให้ขนม/เล่น</button></div></div></div>`; }).join('')}</div>` : '<p class="empty">ยังไม่มีสัตว์เลี้ยง ไปรับเลี้ยงที่ฟาร์มปศุสัตว์หรือศูนย์สัตว์เลี้ยงภูผา</p>');
  },
  care(i, k) {
    const p = this.list()[i]; if (!p || p.day === S.day) return;
    if (!useEnergy(5)) return; p.day = S.day;
    if (k === 'train') p.spd = Math.min(15, (p.spd || 0) + 1);
    if (k === 'groom') { const kit = takeItem('groomkit'); p.beauty = Math.min(15, (p.beauty || 0) + (kit ? 2 : 1)); }
    if (k === 'sing') p.sing = Math.min(15, (p.sing || 0) + 1);
    p.joy = Math.min(100, (p.joy ?? 60) + 5); Prog.add(4); Sfx.tone(700, 0.1, 'sine', 0.05, 900);
    UI.toast(`${p.name} ${k === 'train' ? 'วิ่งเก่งขึ้น' : k === 'groom' ? 'สวยขึ้น' : 'ร้องเพราะขึ้น'}!`, PETS[p.type].i);
  },
  treat(i) { const p = this.list()[i]; if (takeItem('pettoy')) p.joy = Math.min(100, (p.joy ?? 60) + 30); else if (takeItem('treat')) p.joy = Math.min(100, (p.joy ?? 60) + 20); },
  // ----- arena -----
  arenaUI() {
    const L = this.list();
    UI.open('สนามแข่งและประกวดสัตว์เลี้ยง', null, () => L.length ? `<p class="lead">สัตว์แต่ละตัวลงแข่งได้วันละ 1 รายการ · ที่ 1 ได้ถ้วยรางวัลและเงิน</p><div class="grid">${L.map((p, i) => { const B = PETS[p.type], used = p.arena === S.day; return `<div class="card"><div class="ci">${B.i}</div><div class="cb"><h4>${esc(p.name)}</h4><div class="row"><button class="btn" data-a="petrace" data-i="${i}" ${used ? 'disabled' : ''}>${p.type === 'horse' ? '🏇 แข่งม้า (รางวัล 4,000)' : '🏁 แข่งวิ่ง (รางวัล 1,500)'}</button><button class="btn ghost" data-a="petshow" data-i="${i}" ${used ? 'disabled' : ''}>🎀 ประกวดความงาม (1,500)</button>${B.sing ? `<button class="btn ghost" data-a="petsingc" data-i="${i}" ${used ? 'disabled' : ''}>🎶 ประกวดเสียงนก (2,000)</button>` : ''}</div></div></div>`; }).join('')}</div>` : '<p class="empty">ต้องมีสัตว์เลี้ยงก่อน</p>');
  },
  compete(i, kind) {
    const p = this.list()[i]; if (!p || p.arena === S.day) return; p.arena = S.day;
    const st = this.stat(p), mine = kind === 'race' ? st.spd * 10 + Math.random() * 25 : kind === 'show' ? st.beauty * 10 + Math.random() * 25 : st.sing * 11 + Math.random() * 25;
    const base = kind === 'race' ? (p.type === 'horse' ? 110 : 70) : 80, prize = kind === 'race' && p.type === 'horse' ? 4000 : kind === 'sing' ? 2000 : 1500;
    const rivals = ['เจ้าด่าง', 'มะม่วง', 'ทองคำ', 'ลูกชิ้น', 'โกโก้'].map((n, k) => ({ who: n, score: Math.round(base * [1.25, 1.1, 0.95, 0.8, 0.65][k] * (0.85 + Math.random() * 0.3)) }));
    const all = rivals.concat([{ who: p.name + ' (ของคุณ)', score: Math.round(mine), me: true }]).sort((a, b) => b.score - a.score);
    const rank = all.findIndex(r => r.me) + 1, pay = [prize, Math.round(prize / 2), Math.round(prize / 4)][rank - 1] || 100;
    earn(pay); Bank2.income('การแข่งขันสัตว์เลี้ยง', pay); p.joy = Math.min(100, (p.joy ?? 60) + 10); Prog.add(rank === 1 ? 50 : 15);
    if (rank === 1) { p.wins = (p.wins || 0) + 1; S.furn.trophy = 1; Life2.note(`${p.name}ชนะ${kind === 'race' ? 'การแข่งวิ่ง' : kind === 'show' ? 'การประกวดความงาม' : 'การประกวดเสียงนก'}!`); }
    UI.contestResult(all, rank, pay, { i: PETS[p.type].i, n: p.name });
  },
  // ----- horse riding -----
  canRide() { return S.pet && PETS[S.pet.type] && PETS[S.pet.type].ride && count('saddle'); },
  toggleRide() { if (!this.canRide()) { UI.toast(S.pet && S.pet.type === 'horse' ? 'ต้องมีอานม้าก่อน (ศูนย์สัตว์เลี้ยงภูผา)' : 'ต้องมีม้าก่อน', '🐎'); return; } S.riding = !S.riding; UI.toast(S.riding ? 'ขึ้นขี่ม้าแล้ว! เดินทางเร็วขึ้น (กด E ที่ม้าอีกครั้งเพื่อลง)' : 'ลงจากหลังม้าแล้ว', '🏇'); },
  update(dt) {
    if (!S.riding || !Pet.obj || G.inside || G.driving) { if (S.riding && (G.inside || G.driving)) S.riding = false; return; }
    const P = G.player; Pet.obj.position.set(P.pos.x, P.pos.y, P.pos.z); Pet.obj.rotation.y = P.rot; Pet.x = P.pos.x; Pet.z = P.pos.z;
    Models.animAnimal(Pet.obj, dt, P.speed / 3, null); P.obj.position.y = P.pos.y + 1.05;
  },
  day() { for (const p of this.list()) p.joy = Math.max(0, (p.joy ?? 60) - 5); },
  init() { G.targetHooks.push((consider, p) => { if (!Pet.obj || G.inside || !S.pet || S.pet.type !== 'horse') return; const d = Math.hypot(p.x - Pet.x, p.z - Pet.z); if (d < 2.2) consider({ kind: 'ext', act: () => ({ icon: '🏇', label: S.riding ? 'ลงจากหลังม้า' : 'ขี่ม้า', fn: () => this.toggleRide() }) }, d - 0.5); }); },
};
UI.H.petpick = d => { const p = Pets2.list()[+d.i]; S.pet = { type: p.type, name: p.name }; S.riding = false; Pet.spawn(); UI.toast(`${p.name}มาเดินตามคุณแล้ว`, PETS[p.type].i); };
UI.H.pettrain = d => Pets2.care(+d.i, 'train');
UI.H.petgroom = d => Pets2.care(+d.i, 'groom');
UI.H.petsing = d => Pets2.care(+d.i, 'sing');
UI.H.pettreat = d => Pets2.treat(+d.i);
UI.H.petrace = d => Pets2.compete(+d.i, 'race');
UI.H.petshow = d => Pets2.compete(+d.i, 'show');
UI.H.petsingc = d => Pets2.compete(+d.i, 'sing');
