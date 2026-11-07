// v80_driving.js: what a crash does to the driver (the car already took damage, the person did not)
//  an impact under ~30 km/h is a bump; 30-70 km/h shakes you up (energy and mood drop, you may be hurt a little); above ~70 km/h is a serious injury and you need a doctor
V23.add('v80_driving', () => {
  let last = 0;
  window.Crash80 = {
    hit(v, what) {
      const now = performance.now(); if (now - last < 1500 || !S) return; last = now;
      const kmh = Math.round(v * 3.6); if (kmh < 30) return;
      try {
        if (kmh < 70) {
          const loss = Math.round((kmh - 25) * 0.6); S.energy = Math.max(0, S.energy - loss); if (S.mood != null) S.mood = Math.max(0, S.mood - Math.round(loss / 3));
          UI.toast(`ชน${what === 'car' ? 'รถคันอื่น' : 'สิ่งกีดขวาง'}ที่ ${kmh} กม./ชม. ตกใจและเจ็บตัวเล็กน้อย พลังงาน −${loss}`, '💥');
        } else {
          S.energy = Math.max(0, S.energy - 45); if (S.mood != null) S.mood = Math.max(0, S.mood - 25);
          const c = window.Health31 && Health31.startCond && Health31.startCond('compl', `บาดเจ็บจากรถชนที่ ${kmh} กม./ชม.`);
          UI.toast(`ชนแรงมากที่ ${kmh} กม./ชม.! บาดเจ็บสาหัส ไปโรงพยาบาลหรือโทร 1669`, '🚑');
          if (!c && typeof Life2 !== 'undefined' && Life2.getSick) Life2.getSick('บาดเจ็บจากรถชน');
        }
      } catch (e) { console.warn('crash80', e); }
    },
  };
});
