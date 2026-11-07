// v92_pcjobs.js: 15 heavy jobs for a PC you built yourself
//  A built PC used to offer only freelance work, an online course, films and video editing. Now it can also take 15 demanding jobs that need a strong machine (CPU, graphics card,
//  memory and overall score are checked against the parts you really fitted) and a fast internet line (checked against your package speed), and that draw a lot of power and data:
//  4K multi-platform streaming, AI model training, 3D animation rendering, 8K editing, crypto / distributed computing, GPU cloud rental, game-server hosting, esports tournaments,
//  CAD/BIM, data science, film VFX, drone photogrammetry, game-engine builds, 4K live studio, 2 TB cloud backup.
//  Each job (20 a day in total): takes game time and energy, keeps the machine busy (electricity), uses internet at its own rate (shown in the power and internet statistics) and pays by how strong the machine is.
V23.add('v92_pcjobs', () => {
  const P = window.PC51; if (!P || typeof PC39 === 'undefined' || typeof PC_PARTS === 'undefined') return;
  const { ACTS, RATE, ACT, addWin, oneShot, St } = P, R = Math.random, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toast = (t, i) => { try { UI.toast(t, i || '🖥️'); } catch (e) { } };
  const mbps = () => { try { return ISP.speed(); } catch (e) { return 0; } };
  const spec = m => {
    const pc = (m && m.ref) || {}; let cpu = 0, gpu = 0, ram = 0;
    for (const k of pc.parts || []) { const p = PC_PARTS[k]; if (!p) continue; if (p.s === 'cpu') cpu = Math.max(cpu, p.perf || 0); else if (p.s === 'gpu') gpu = Math.max(gpu, p.perf || 0); else if (p.s === 'ram') ram += p.gb || 0; }
    if (pc.laptop || !(pc.parts || []).length) { const e = clamp((pc.score || 0) / 100, 0, 95); cpu = Math.max(cpu, e); gpu = Math.max(gpu, e); ram = Math.max(ram, (pc.score || 0) >= 9000 ? 32 : 16); }
    return { score: pc.score || 0, cpu, gpu, ram, w: pc.w || 300 };
  };
  // [key, icon, name, minutes, energy, GB per hour, power use (x load), net Mbps needed, need {score,cpu,gpu,ram}, base pay, download GB, XP, short description]
  const JOBS = [
    ['stream4k', '📺', 'สตรีมเกม 4K หลายแพลตฟอร์มพร้อมกัน', 240, 12, 7.5, 1.0, 100, { gpu: 60, cpu: 60, ram: 32 }, 4200, 0, 20, 'ถ่ายทอดสด 4K 60fps ไปหลายช่อง ได้เงินสปอนเซอร์และผู้ติดตาม'],
    ['aitrain', '🤖', 'เทรน/ฟายน์จูนโมเดล AI ให้บริษัท', 360, 14, 1.8, 1.5, 100, { gpu: 80, cpu: 60, ram: 64 }, 14000, 20, 40, 'โหลดชุดข้อมูล 20 GB แล้วเทรนทั้งคืน กินไฟหนักมาก'],
    ['render3d', '🎞️', 'เรนเดอร์แอนิเมชัน 3D ให้สตูดิโอ', 300, 12, 2.4, 1.4, 60, { cpu: 70, gpu: 60, ram: 32 }, 7500, 6, 28, 'เรนเดอร์ฉาก 3D ทีละเฟรม ซีพียูและการ์ดจอทำงานเต็มที่'],
    ['edit8k', '🎬', 'ตัดต่อและคัลเลอร์เกรด 8K รับงานลูกค้า', 240, 12, 5, 1.0, 200, { gpu: 65, cpu: 65, ram: 64 }, 8500, 0, 26, 'ไฟล์ดิบ 8K ใหญ่มาก ต้องแรมเยอะและอัปโหลดงานเสร็จให้ลูกค้า'],
    ['crypto', '⛏️', 'ขุดเหรียญ/คำนวณกระจาย 8 ชั่วโมง', 480, 4, 0.6, 1.6, 20, { gpu: 55, ram: 16 }, 3000, 0, 10, 'การ์ดจอทำงานเต็ม 8 ชม. ค่าไฟสูง รายได้ขึ้นลงตามราคาเหรียญ'],
    ['cloudgpu', '☁️', 'ให้เช่าพลัง GPU บนแพลตฟอร์มคลาวด์', 480, 3, 3, 1.5, 300, { gpu: 75, ram: 32 }, 9000, 0, 22, 'เปิดเครื่องให้คนอื่นเช่าประมวลผล ต้องเน็ตแรงและเสถียร'],
    ['gameserver', '🕹️', 'โฮสต์เซิร์ฟเวอร์เกมให้ผู้เล่น 8 ชม.', 480, 4, 9, 0.8, 300, { cpu: 60, ram: 32 }, 4800, 0, 18, 'ผู้เล่นหลายร้อยคนเชื่อมเข้ามา ใช้เน็ตอัปโหลดหนักมาก'],
    ['esports', '🏆', 'แข่งอีสปอร์ตออนไลน์ชิงเงินรางวัล', 180, 16, 1.2, 1.2, 100, { gpu: 70, cpu: 75, ram: 32 }, 6500, 0, 30, 'เฟรมเรตสูง หน่วงต่ำ มีโอกาสได้เงินรางวัลก้อนใหญ่'],
    ['cad', '🏗️', 'จำลองสถาปัตยกรรม CAD/BIM + เรนเดอร์', 300, 11, 1, 1.2, 50, { cpu: 70, gpu: 55, ram: 64 }, 7000, 4, 24, 'แบบอาคารไฟล์ใหญ่ เรนเดอร์ภาพลูกค้า ใช้แรมมาก'],
    ['dataml', '🧠', 'งานวิเคราะห์ข้อมูลเชิงลึก (Data / ML) รับจ้าง', 360, 12, 2, 1.3, 100, { cpu: 80, ram: 64, gpu: 40 }, 9500, 10, 32, 'ประมวลผลข้อมูลหลายล้านแถว ต้องซีพียูแรงและแรมเยอะ'],
    ['vfx', '🎇', 'คอมโพสิต VFX / เรนเดอร์ฉากภาพยนตร์', 480, 16, 3.5, 1.6, 300, { score: 9000, gpu: 85, cpu: 80, ram: 96 }, 22000, 30, 50, 'งานระดับโปรดักชันภาพยนตร์ กินไฟและแรมสูงสุด จ่ายหนักที่สุด'],
    ['photogram', '🛰️', 'ประมวลผลภาพโดรน ทำแผนที่และโมเดล 3 มิติของไร่', 300, 10, 2.2, 1.4, 100, { gpu: 65, cpu: 65, ram: 64 }, 8000, 12, 26, 'ภาพถ่ายโดรนพันภาพถูกต่อเป็นโมเดล 3 มิติ'],
    ['unreal', '🎮', 'คอมไพล์/บิลด์เกมด้วย Unreal Engine ให้ลูกค้า', 300, 12, 1.5, 1.4, 150, { cpu: 85, ram: 64, gpu: 60 }, 10500, 25, 34, 'คอมไพล์โค้ดและแสงเงา แล้วอัปโหลดบิลด์ขึ้นเซิร์ฟเวอร์'],
    ['studio', '🎙️', 'สตูดิโอไลฟ์คอนเสิร์ต/พอดแคสต์ 4K', 240, 10, 6, 0.9, 200, { gpu: 55, cpu: 60, ram: 32 }, 5200, 0, 20, 'ถ่ายสดหลายกล้อง เสียงคุณภาพสูง อัปโหลดต่อเนื่อง'],
    ['backup', '💽', 'สำรองข้อมูลธุรกิจขึ้นคลาวด์ 2 TB พร้อมเข้ารหัส', 360, 5, 30, 0.8, 500, { cpu: 60, ram: 32 }, 3800, 0, 14, 'อัปโหลดข้อมูลมหาศาล ใช้เน็ตหนักที่สุดในบรรดางาน'],
  ];
  const qOf = sp => clamp((0.4 * sp.cpu + 0.4 * sp.gpu + 0.2 * Math.min(100, sp.ram)) / 100, 0.3, 1.2);
  const missing = (J, sp) => {
    const need = J[8], out = [];
    if (need.score && sp.score < need.score) out.push(`คะแนนเครื่อง ${need.score}`);
    if (need.cpu && sp.cpu < need.cpu) out.push(`ซีพียู ${need.cpu}+`);
    if (need.gpu && sp.gpu < need.gpu) out.push(`การ์ดจอ ${need.gpu}+`);
    if (need.ram && sp.ram < need.ram) out.push(`แรม ${need.ram} GB`);
    if (mbps() < J[7]) out.push(`เน็ต ${J[7]} Mbps (ตอนนี้ ${mbps()})`);
    return out;
  };
  // v136: up to 20 jobs a day in total; the first job (4K streaming) must be finished today before the other 14 appear
  const DAILY = 20, cnt = () => { const n = St().n; if (n.j92d !== S.day) { n.j92d = S.day; n.j92c = 0; n.j92f = 0; } return n; };
  const done = () => cnt().j92c, firstDone = () => !!cnt().j92f;
  for (const J of JOBS) {
    const [k, ic, nm, mins, en, gbh, load, mb, need, base, dl, xp, desc] = J, rk = 'j' + k;
    RATE[rk] = gbh; ACT[rk] = [ic, nm];
    const kWh = sp => ((sp.w || 300) / 1000 * load * mins / 60);
    ACTS['j92_' + k] = {
      i: ic, n: `${nm} (${Math.round(mins / 60)} ชม.)`,
      hide: () => k !== JOBS[0][0] && !firstDone(),
      d: () => { const m = PC39.best(), sp = spec(m), miss = m ? missing(J, sp) : ['ต้องมีคอม'];
        return `${k === JOBS[0][0] ? '📋 งานที่ 1 ต้องทำให้เสร็จก่อน จึงจะเลือกงานอื่นๆ ได้ · ' : ''}วันนี้ทำแล้ว ${done()}/${DAILY} งาน · ${desc} · เงิน ~${baht(Math.round(base * (0.55 + 0.9 * qOf(sp))))} (ยิ่งสเปกแรงยิ่งได้เยอะ) · ใช้ไฟ ~${(kWh(sp)).toFixed(1)} kWh · เน็ต ${gbh} GB/ชม.${dl ? ' + โหลด ' + dl + ' GB' : ''} · ต้องการ: ${[need.score ? 'คะแนน ' + need.score : '', need.cpu ? 'ซีพียู ' + need.cpu + '+' : '', need.gpu ? 'การ์ดจอ ' + need.gpu + '+' : '', need.ram ? 'แรม ' + need.ram + 'GB' : '', 'เน็ต ' + mb + ' Mbps'].filter(Boolean).join(' · ')}${miss.length ? ' · ❌ ยังขาด: ' + miss.join(', ') : ' · ✅ สเปกพอ'}`; },
      ok: () => { const m = PC39.best(); return !!m && done() < DAILY && (k === JOBS[0][0] || firstDone()) && !missing(J, spec(m)).length; },
      run(m) {
        const sp = spec(m), miss = missing(J, sp);
        if (done() >= DAILY) { toast(`วันนี้ทำครบ ${DAILY} งานแล้ว พรุ่งนี้ค่อยทำต่อ`, '📋'); return; }
        if (k !== JOBS[0][0] && !firstDone()) { toast('ต้องทำงานที่ 1 ให้เสร็จก่อน', '🔒'); return; }
        if (miss.length) { toast('สเปกหรือเน็ตยังไม่พอ ต้องการ: ' + miss.join(', '), '❌'); return; }
        if (!PC39.usable()) { toast('คอมปิดอยู่ ต้องเปิดเครื่องก่อน', '🖥️'); return; }
        if (S.energy < en) { toast('พลังงานไม่พอ พักก่อน', '😴'); return; }
        addWin(m.uid, rk, mins); PC39.mark(m.uid, mins); if (dl) oneShot(m.uid, 'dl', dl);
        UI.close();
        fade(() => {
          tick(mins); useEnergy(en);
          const q = qOf(sp); let f = 0.85 + R() * 0.3;
          if (k === 'crypto') f = 0.3 + R() * 1.6;                       // the coin price moves
          if (k === 'esports') f = R() < 0.18 + q * 0.2 ? 2.4 + R() * 1.5 : 0.5 + R() * 0.5;   // a tournament win pays a lot
          const pay = Math.round(base * (0.55 + 0.9 * q) * f);
          earn(pay); try { Bank2.income(nm, pay); } catch (e) { }
          if (/stream|studio/.test(k)) S.fans = (S.fans || 0) + Math.round((25 + sp.gpu / 3) * (0.7 + R() * 0.6));
          { const n = cnt(); n.j92c++; if (k === JOBS[0][0]) n.j92f = 1; } try { Prog.add(xp); } catch (e) { } S.mood = Math.max(0, Math.min(100, (S.mood || 50) + (k === 'esports' ? 4 : -3)));
          toast(`${nm} เสร็จแล้ว (วันนี้ ${done()}/${DAILY} งาน) ได้เงิน ${baht(pay)} · ใช้ไฟ ~${kWh(sp).toFixed(1)} kWh · ใช้เน็ต ~${(gbh * mins / 60).toFixed(1)} GB${dl ? ' + โหลด ' + dl + ' GB' : ''}`, ic);
        });
      },
    };
  }
  window.PCJobs92 = { JOBS, spec, missing, count: () => JOBS.length };
});
