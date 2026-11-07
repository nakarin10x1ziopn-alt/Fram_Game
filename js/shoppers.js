'use strict';
// ---------- Shoppers by car: villagers drive in, park at the kerb, walk into a shop (or to your farm stand), come back and drive off ----------
const SHOP_CARS = ['sedan', 'suv', 'van', 'taxi', 'hatchback-sports', 'truck-flat', 'sedan-sports'];
const Shoppers = {
  list: [], t: 8,
  // where a car can stop for a given door: beside the main road, the town streets or inside the farm gate
  parkFor(x, z) {
    if (Math.abs(x) < 60 && z < -60 && z > -335) return { lane: x < 0 ? -2.2 : 2.2, park: x < 0 ? -4.2 : 4.2, axis: 'z', start: z + (Math.random() < 0.5 ? 70 : -70), min: -330, max: -64 };
    if (Math.abs(x - 170) < 20 && z < -230 && z > -306) return { lane: x < 170 ? 167.8 : 172.2, park: x < 170 ? 165.8 : 174.2, axis: 'z', start: z + 60, min: -300, max: -232, base: 170 };
    if (Math.abs(x + 105) < 20 && z < -364 && z > -436) return { lane: x < -105 ? -107.2 : -102.8, park: x < -105 ? -109.2 : -100.8, axis: 'z', start: z - 50, min: -432, max: -368, base: -105 };
    return null;
  },
  targets() {
    const out = [];
    for (const p of World.pois) if ((p.kind === 'shop' || (p.room && p.kind === 'act')) && !p.noRoom) { const pk = this.parkFor(p.x, p.z); if (pk) out.push({ x: p.x, z: p.z, pk, label: p.label }); }
    return out;
  },
  spawn() {
    const me = G.player.pos, stand = Social.shopPos, stock = Object.keys(S.stand || {}).some(k => S.stand[k] > 0), h = S.time / 60;
    let dest;
    if (stock && h >= 8 && h < 18 && Math.random() < 0.4 && Math.hypot(me.x - stand.x, me.z - stand.z) < 120) dest = { farm: true, x: stand.x, z: stand.z, park: { x: 1.5, z: -53 }, start: { x: 2.2, z: -150 }, gate: { x: 2.2, z: -62 } };
    else {
      const T_ = this.targets().filter(t => Math.hypot(t.x - me.x, t.z - me.z) < 130); if (!T_.length) return;
      const t = U.pick(T_), pk = t.pk, sz = U.clamp(pk.start, pk.min, pk.max);
      // parking bays every 6.5 m along the kerb; never two cars in one bay
      let bz = U.clamp(Math.round(t.z / 6.5) * 6.5, pk.min + 3, pk.max - 3);
      for (let k = 0; k < 6 && this.list.some(o => o.dest.park && Math.abs(o.dest.park.x - pk.park) < 1 && Math.abs(o.dest.park.z - bz) < 6); k++) bz = U.clamp(bz + (k % 2 ? -1 : 1) * 6.5 * (k + 1), pk.min + 3, pk.max - 3);
      if (this.list.some(o => o.dest.park && Math.abs(o.dest.park.x - pk.park) < 1 && Math.abs(o.dest.park.z - bz) < 6)) return;
      dest = { x: t.x, z: t.z, park: { x: pk.park, z: bz }, start: { x: pk.lane, z: sz }, lane: pk.lane, label: t.label, exitZ: sz < t.z ? pk.max : pk.min };
    }
    const kind = U.pick(SHOP_CARS), car = Models.kcar(kind) || Models.car('pickup'); World.dyn.add(car.g);
    // pull in from the lane a few metres before the bay, never with a 90 degree turn on the spot
    const pts = dest.farm ? [dest.gate, dest.park] : [{ x: dest.lane, z: dest.park.z - Math.sign(dest.park.z - dest.start.z || 1) * 7 }, dest.park];
    const s = { car, dest, pts, i: 0, x: dest.start.x, z: dest.start.z, h: 0, speed: 0, st: 'drive', t: 0 };
    s.h = Math.atan2(pts[0].x - s.x, pts[0].z - s.z); car.g.position.set(s.x, World.groundY(s.x, s.z), s.z);
    this.list.push(s);
  },
  person(s) {
    const nm = U.pick(G.npcs.filter(n => !n.staff && !n.keeper)); const o = Models.human({ avatar: nm ? People.avatarFor(nm.name, (Math.random() * 9) | 0) : 'Erika' }); World.dyn.add(o);
    const side = l2w(s.x, s.z, s.h, 1.6, 0); o.position.set(side.x, World.groundY(side.x, side.z), side.z);
    s.ped = { o, x: side.x, z: side.z, name: nm ? nm.name : 'ลูกค้า' };
  },
  walkTo(p, tx, tz, dt, sp = 1.5) {
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 0.15) { const m = Math.min(d, sp * dt); p.x += dx / d * m; p.z += dz / d * m; p.o.rotation.y = Math.atan2(dx, dz); }
    p.o.position.set(p.x, World.groundY(p.x, p.z), p.z); Models.animHuman(p.o, dt, d > 0.15 ? sp : 0, null);
    return d <= 0.15;
  },
  drive(s, dt) {
    const p = s.pts[s.i]; if (!p) return true;
    const dx = p.x - s.x, dz = p.z - s.z, d = Math.hypot(dx, dz), me = G.driving ? G.driving.d : G.player.pos;
    const blocked = Math.hypot(me.x - (s.x + Math.sin(s.h) * 3), me.z - (s.z + Math.cos(s.h) * 3)) < 2.6;
    // slow right down while the target is off to the side, so the car can never orbit a point it cannot reach
    const err = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - s.h), Math.cos(Math.atan2(dx, dz) - s.h)));
    const want = blocked ? 0 : (s.i === s.pts.length - 1 ? Math.min(9, d * 1.2) : 9) * U.clamp(Math.cos(err), 0.18, 1);
    s.speed = U.lerp(s.speed, want, Math.min(1, dt * 2));
    // reached, or just passed close by (the point is behind us)
    // the per-leg timeout only runs while the car can move, so a car you are blocking never skips ahead and parks in the lane
    if (!blocked) s.leg = (s.leg || 0) + dt;
    if (d < 0.6 || (d < 2.5 && err > Math.PI / 2) || s.leg > 25) { s.i++; s.leg = 0; return s.i >= s.pts.length; }
    s.h = U.angLerp(s.h, Math.atan2(dx, dz), Math.min(1, dt * 4));
    s.x += Math.sin(s.h) * s.speed * dt; s.z += Math.cos(s.h) * s.speed * dt;
    s.car.g.position.set(s.x, World.groundY(s.x, s.z), s.z); s.car.g.rotation.y = s.h;
    for (const w of s.car.wheels) w.rotation.x += s.speed * dt / s.car.r;
    return false;
  },
  update(dt) {
    if (!G.started || UI.isOpen() || G.paused) return;
    if ((this.t -= dt) <= 0) { this.t = 18 + Math.random() * 20; if (this.list.length < 4 && !G.inside && !G.away && S.time > 6 * 60 && S.time < 21 * 60) this.spawn(); }
    for (const s of this.list.slice()) {
      s.t += dt;
      if (s.st === 'drive') { if (this.drive(s, dt)) { s.st = 'park';
        // line the car up with the kerb, straight and exactly in its bay
        if (s.dest.park && !s.dest.farm) { s.x = s.dest.park.x; s.z = s.dest.park.z; s.h = Math.cos(s.h) >= 0 ? 0 : Math.PI; s.car.g.position.set(s.x, World.groundY(s.x, s.z), s.z); s.car.g.rotation.y = s.h; } s.col = Col.box(s.x, s.z, 1.0, 2.2, s.h); this.person(s); } }
      else if (s.st === 'park') { const d = s.dest, door = d.farm ? { x: d.x - 0.2, z: d.z } : d; if (this.walkTo(s.ped, door.x, door.z, dt)) { s.st = 'shop'; s.t = 0; s.ped.o.visible = d.farm; } }
      else if (s.st === 'shop') { if (s.dest.farm) Models.animHuman(s.ped.o, dt, 0, null); if (s.t > (s.dest.farm ? 3 : 10 + Math.random() * 8)) { if (s.dest.farm) Social.buy(s.ped); s.st = 'back'; s.ped.o.visible = true; } }
      else if (s.st === 'back') { const side = l2w(s.x, s.z, s.h, 1.6, 0); if (this.walkTo(s.ped, side.x, side.z, dt)) { World.dyn.remove(s.ped.o); Col.remove(s.col); s.st = 'leave'; s.pts = s.dest.farm ? [s.dest.gate, { x: 2.2, z: -170 }] : [{ x: s.dest.lane, z: s.z + Math.sign(s.dest.exitZ - s.z || 1) * 7 }, { x: s.dest.lane, z: s.dest.exitZ }]; s.i = 0; } }
      else if (s.st === 'leave') { if (this.drive(s, dt)) { World.dyn.remove(s.car.g); this.list.splice(this.list.indexOf(s), 1); } }
    }
  },
};
