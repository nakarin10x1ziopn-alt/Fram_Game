// v81_overall.js: general realism
//  - a person cannot go without water for days or food for weeks and just carry on: after 24 hours with no water, or 4 days with no food, you collapse and an ambulance takes you to the hospital
//    (the doctor treats you, you wake up with water and food in you, and the bill is real)
V23.add('v81_overall', () => {
  if (typeof Life2 === 'undefined' || !Life2.tick) return;
  const st = () => { const s = S.v81 = S.v81 || {}; s.dry = s.dry || 0; s.starve = s.starve || 0; s.last = s.last || -99; return s; };
  function collapse(why) {
    const s = st(); s.last = S.day; s.dry = 0; s.starve = 0;
    try { if (G.driving) { G.driving.speed = 0; exitCar(); } } catch (e) { }
    try { UI.toast(`${why} คุณเป็นลมล้มลง! รถพยาบาลนำส่งโรงพยาบาล`, '🚑'); } catch (e) { }
    try {
      const H = window.Health31; let c = H && H.startCond && H.startCond('compl', why);
      if (!c && H && H.active) c = H.active().find(x => x.k === 'compl');
      if (c && H.forceAdmit) H.forceAdmit(c);
    } catch (e) { console.warn('v81 collapse', e); }
    S.thirst = Math.max(S.thirst, 60); S.hunger = Math.max(S.hunger, 45); try { S.energy = Math.max(S.energy, maxEnergy() * 0.4); } catch (e) { }
  }
  const _t = Life2.tick.bind(Life2);
  Life2.tick = function (h) {
    _t(h);
    try {
      if (G.inside && G.sleeping) return;
      const s = st();
      s.dry = S.thirst <= 0.5 ? s.dry + h : 0; s.starve = S.hunger <= 0.5 ? s.starve + h : 0;
      if (S.day - s.last >= 2) { if (s.dry >= 24) collapse('ขาดน้ำรุนแรง'); else if (s.starve >= 96) collapse('ขาดอาหารรุนแรง'); }
    } catch (e) { console.warn('v81', e); }
  };
  window.Overall81 = { st, collapse };
});
