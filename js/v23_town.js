'use strict';
// ---------- v23_town: six more far cities (3 large, 2 medium, 1 small) reachable by taxi or highway. Each is built on first visit
// like Town3's, every shop is walk-in (Rooms) and sells real catalogue items; bigger cities have more and more specialised shops ----------
V23.add('town', () => {
  const TEX = T; // global texture table (the town loops below shadow the name T)
  const TOWNS = [
    { key: 'metro', size: 'large', n: 'สุขนครมหานคร', icon: '🌆', cx: 4400, cz: 3000, fee: 800, min: 150, ground: 0x9aa3a8, hello: 'ถึงสุขนครมหานครแล้ว เมืองหลวงที่ใหญ่ที่สุด ร้านค้าครบทุกอย่าง',
      st: 'modern', shops: [['dept', 'ห้างสุขนครเซ็นเตอร์'], ['elec', 'ไอทีมอลล์สุขนคร'], ['pcs', 'คอมเวิลด์สุขนคร'], ['sec', 'ซีเคียวริตี้ไฮเทค'], ['smart', 'สมาร์ตโฮมสโตร์'], ['fashion', 'แฟชั่นสุขนคร'], ['jewel', 'จิวเวลรี่ทองคำ'], ['book', 'หนังสือและของเล่น'], ['furn', 'เฟอร์นิเจอร์โมเดิร์น'], ['pharm', 'ร้านยาสุขนคร'], ['sushi', 'ซูชิและราเมน'], ['thai', 'สตรีทฟู้ดสุขนคร'], ['cafe', 'คาเฟ่สกายไลน์'], ['bakery', 'เบเกอรี่ปารีเซียง'], ['gift', 'ร้านของขวัญสุขนคร'], ['grocery', 'ท็อปมาร์ท 24 ชม.']],
      svc: ['bank', 'police', 'fire', 'hospital'], names: ['คุณก้อง', 'คุณแพร', 'พี่ภัทร', 'น้องมายด์', 'คุณธนา', 'พี่เฟิร์น', 'คุณต้น', 'น้องพลอย'] },
    { key: 'port', size: 'large', n: 'ท่าทองธานี', icon: '⚓', cx: 4400, cz: 3600, fee: 700, min: 130, ground: 0x98a39a, hello: 'ถึงท่าทองธานีแล้ว เมืองท่าค้าขายขนาดใหญ่ กลิ่นทะเลโชยมาเลย',
      st: 'thai', shops: [['seafood', 'ตลาดอาหารทะเลท่าเรือ'], ['grill', 'ครัวทะเลเผาท่าทอง'], ['market', 'ตลาดสดท่าทอง'], ['fishing', 'อุปกรณ์ประมงและเกษตร'], ['hardware', 'วัสดุก่อสร้างท่าเรือ'], ['net', 'เครือข่ายและกล้องวงจรปิด'], ['seeds', 'ร้านเมล็ดพันธุ์ท่าทอง'], ['wholesale', 'ค้าส่งท่าทอง'], ['cafe', 'กาแฟริมท่า'], ['sweets', 'ขนมไทยท่าเรือ'], ['fashion', 'เสื้อผ้ามือหนึ่งท่าเรือ'], ['furn', 'เฟอร์นิเจอร์ไม้ท่าทอง'], ['pharm', 'ร้านยาท่าทอง'], ['florist', 'ร้านดอกไม้ท่าเรือ'], ['gift', 'ของฝากท่าทอง'], ['dept', 'ห้างท่าทองพลาซ่า']],
      svc: ['bank', 'police', 'fire', 'hospital'], names: ['กัปตันชัย', 'แม่ค้าส้ม', 'ลุงเรือ', 'พี่ทะเล', 'ป้าปลา', 'น้องคลื่น', 'เฮียท่า', 'พี่นาวา'] },
    { key: 'andaman', size: 'large', n: 'อันดามันซิตี้', icon: '🏖️', cx: 4400, cz: 4200, fee: 750, min: 140, ground: 0xb7b79a, hello: 'ถึงอันดามันซิตี้แล้ว เมืองท่องเที่ยวริมทะเล ลมเย็นสบาย',
      st: 'resort', shops: [['fashion', 'บูติกรีสอร์ทแฟชั่น'], ['jewel', 'ไข่มุกอันดามัน'], ['gift', 'ของที่ระลึกอันดามัน'], ['petshop', 'ศูนย์สัตว์เลี้ยงอันดามัน'], ['pharm', 'สปาและสุขภาพ'], ['cafe', 'คาเฟ่ริมหาด'], ['seafood', 'ซีฟู้ดอันดามัน'], ['juice', 'บาร์น้ำผลไม้สดชื่น'], ['book', 'หนังสือและงานศิลป์'], ['elec', 'อิเล็กทรอนิกส์นักท่องเที่ยว'], ['decor', 'ของแต่งบ้านดีไซน์'], ['sweets', 'ขนมและไอศกรีมหาดทราย'], ['florist', 'ดอกไม้เมืองรีสอร์ท'], ['grocery', 'มินิมาร์ทอันดามัน'], ['thai', 'ร้านอาหารไทยริมเล'], ['dept', 'ห้างอันดามันเซ็นเตอร์']],
      svc: ['bank', 'police', 'fire', 'hospital'], names: ['คุณนุ่น', 'พี่ปอ', 'น้องทราย', 'คุณมาร์ค', 'พี่เกด', 'ลุงหาด', 'น้องใบเตย', 'คุณแอม'] },
    { key: 'brook', size: 'medium', n: 'ลำธารเมือง', icon: '🌲', cx: 5000, cz: 3000, fee: 450, min: 100, ground: 0x84ad76, hello: 'ถึงลำธารเมืองแล้ว เมืองกลางหุบเขา งานฝีมือและกาแฟขึ้นชื่อ',
      st: 'wood', shops: [['book', 'ร้านหนังสือลำธาร'], ['fashion', 'งานฝีมือและผ้าทอ'], ['cafe', 'คาเฟ่ริมลำธาร'], ['thai', 'ครัวพื้นเมืองลำธาร'], ['farm', 'ร้านเกษตรลำธาร'], ['furn', 'เฟอร์นิเจอร์ไม้ลำธาร'], ['grocery', 'ร้านชำลำธาร'], ['gift', 'ของฝากลำธาร'], ['florist', 'ร้านดอกไม้ลำธาร']],
      svc: ['bank', 'police', 'hospital'], names: ['ครูใหญ่', 'พี่ลำธาร', 'ป้าผ้า', 'น้องหมอก', 'ลุงไม้', 'พี่กาแฟ'] },
    { key: 'grain', size: 'medium', n: 'ไร่ทองเมือง', icon: '🌾', cx: 5000, cz: 3600, fee: 400, min: 90, ground: 0xa6b36f, hello: 'ถึงไร่ทองเมืองแล้ว เมืองเกษตรกรรม ตลาดผลผลิตคึกคัก',
      st: 'thai', shops: [['farm', 'ร้านเกษตรไร่ทอง'], ['ranch', 'ปศุสัตว์ไร่ทอง'], ['hardware', 'วัสดุก่อสร้างไร่ทอง'], ['grocery', 'ร้านชำไร่ทอง'], ['thai', 'ข้าวแกงไร่ทอง'], ['market', 'ตลาดสดไร่ทอง'], ['pharm', 'ร้านยาไร่ทอง'], ['elec', 'เครื่องใช้ไฟฟ้าไร่ทอง'], ['seeds', 'เมล็ดพันธุ์ไร่ทอง']],
      svc: ['bank', 'police', 'hospital'], names: ['ลุงทอง', 'ป้าข้าว', 'พี่ไร่', 'น้องรวง', 'เฮียหมู', 'พี่นา'] },
    { key: 'riverside', size: 'small', n: 'บ้านสวนริมน้ำ', icon: '🛖', cx: 5000, cz: 4200, fee: 250, min: 70, ground: 0x7fae6c, hello: 'ถึงบ้านสวนริมน้ำแล้ว หมู่บ้านเล็ก ๆ เงียบสงบ มีร้านจำเป็นครบ',
      st: 'wood', shops: [['grocery', 'ร้านชำป้าสวน'], ['thai', 'ข้าวแกงริมน้ำ'], ['farm', 'เกษตรชุมชนริมน้ำ'], ['florist', 'ร้านดอกไม้ริมน้ำ'], ['cafe', 'กาแฟริมคลอง']],
      svc: ['hospital'], names: ['ป้าสวน', 'ลุงพาย', 'น้องน้ำ', 'พี่สวน'] },
    { key: 'tech', size: 'large', n: 'ศรีนครเทค', icon: '🎓', cx: 4400, cz: 4800, fee: 780, min: 145, ground: 0xa0a8ae, hello: 'ถึงศรีนครเทคแล้ว เมืองมหาวิทยาลัยและเทคโนโลยี เต็มไปด้วยนักศึกษาและร้านไอที',
      st: 'modern', shops: [['pcs', 'ไอทีพาร์ทศรีนครเทค'], ['sec', 'ซีเคียวริตี้แล็บ'], ['smart', 'สมาร์ตโฮมแกลเลอรี่'], ['elec', 'มือถือและแกดเจ็ตสแควร์'], ['net', 'เน็ตเวิร์กโซลูชัน'], ['book', 'ร้านหนังสือมหาวิทยาลัย'], ['cafe', 'คาเฟ่ติวเตอร์'], ['sushi', 'ราเมนนักศึกษา'], ['thai', 'ครัวหอพัก'], ['bakery', 'เบเกอรี่แคมปัส'], ['juice', 'น้ำปั่นสุขภาพ'], ['pharm', 'ร้านยาแคมปัส'], ['fashion', 'แฟชั่นวัยรุ่น'], ['gift', 'ของขวัญรับปริญญา'], ['furn', 'เฟอร์นิเจอร์หอพัก'], ['dept', 'ห้างศรีนครเทคพลาซ่า']],
      svc: ['bank', 'police', 'fire', 'hospital'], names: ['พี่ติวเตอร์', 'น้องบัณฑิต', 'อาจารย์ปิติ', 'คุณวิน', 'น้องฟ้า', 'พี่เกม', 'น้องบิว', 'ดร.สมชาย'] },
    { key: 'orchard', size: 'medium', n: 'สวนทองเมือง', icon: '🍊', cx: 5000, cz: 4800, fee: 420, min: 95, ground: 0x8fb36d, hello: 'ถึงสวนทองเมืองแล้ว เมืองสวนผลไม้ กลิ่นส้มและมะม่วงหอมไปทั่ว',
      st: 'wood', shops: [['farm', 'เกษตรสวนทอง'], ['seeds', 'เมล็ดพันธุ์ผลไม้'], ['market', 'ตลาดผลไม้สวนทอง'], ['juice', 'น้ำผลไม้สดสวนทอง'], ['sweets', 'ผลไม้แปรรูปและขนม'], ['grocery', 'ร้านชำสวนทอง'], ['thai', 'ครัวสวนทอง'], ['pharm', 'ร้านยาสวนทอง'], ['gift', 'ของฝากสวนทอง']],
      svc: ['bank', 'police', 'hospital'], names: ['ป้าส้ม', 'ลุงมะม่วง', 'พี่ทุเรียน', 'น้องลิ้นจี่', 'เจ๊มังคุด', 'พี่สวน'] },
    { key: 'sunflower', size: 'small', n: 'บ้านทุ่งทานตะวัน', icon: '🌻', cx: 5600, cz: 3600, fee: 260, min: 75, ground: 0x9cb85e, hello: 'ถึงบ้านทุ่งทานตะวันแล้ว หมู่บ้านเล็ก ๆ ท่ามกลางทุ่งดอกไม้ เงียบสงบ',
      st: 'wood', shops: [['grocery', 'ร้านชำลุงตะวัน'], ['thai', 'ข้าวแกงทุ่งทานตะวัน'], ['florist', 'ดอกไม้ทุ่งตะวัน'], ['cafe', 'กาแฟกลางทุ่ง'], ['farm', 'เกษตรทุ่งตะวัน']],
      svc: ['hospital'], names: ['ลุงตะวัน', 'ป้าดอกไม้', 'น้องทานตะวัน', 'พี่ทุ่ง'] },
  ];
  const LIMIT = { large: 30, medium: 22, small: 14 };
  const ICON = { dept: '🏬', elec: '📱', pcs: '🖥️', sec: '📹', smart: '🏠', fashion: '👗', jewel: '💍', book: '📚', furn: '🛋️', pharm: '💊', sushi: '🍣', thai: '🍛', cafe: '☕', bakery: '🥐', gift: '🎁', grocery: '🏪', seafood: '🦐', grill: '🍤', market: '🥬', fishing: '🎣', hardware: '🧰', net: '📡', seeds: '🌱', wholesale: '📦', sweets: '🍨', florist: '💐', petshop: '🐾', juice: '🥤', decor: '🖼️', farm: '🌾', ranch: '🐄' };
  const FOOD_ROOM = { thai: 1, sushi: 1, cafe: 1, bakery: 1, seafood: 1, grill: 1, sweets: 1, juice: 1 };
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shuffle = (arr, seed) => { const r = rng(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // catalogue pools: only ids that really exist, and only entries the shop UI can actually sell
  let P = null;
  // reward-only items (the contest trophy costs 0) are never sold
  const ok = key => { try { const e = UI.entry(key, 'v23'); return !!(e && e.name) && e.price !== 0; } catch (e) { return false; } };
  const pools = () => {
    if (P) return P;
    const t = ids => ids.filter(i => TOOLS[i]).map(i => 'tool:' + i), f = ids => ids.filter(i => FOODS[i]).map(i => 'food:' + i), fu = ids => ids.filter(i => FURN[i]).map(i => 'furn:' + i);
    const wear = Object.keys(TOOLS).filter(k => k.startsWith('wear_')), pcs = s => Object.keys(PC_PARTS).filter(k => s.includes(PC_PARTS[k].s)).map(k => 'pc:' + k);
    P = {
      meals: f(['rice', 'noodle', 'kapao', 'chicken', 'padthai', 'greencurry', 'tomyum', 'khaoman', 'khaokha', 'kuaychap', 'yentafo', 'laab', 'somtam', 'kaiyang', 'moopin', 'jok', 'patongko', 'khanomjeen', 'massaman', 'panang', 'tomkha', 'pla_rad']),
      sea: f(['seafood', 'grillfish', 'crab', 'prawn', 'squid', 'hoymalang', 'pupad', 'boat', 'tomyum', 'pla_rad', 'rice', 'somtam']),
      jp: f(['sushi', 'onigiri', 'noodle', 'greentea', 'chicken', 'jok', 'rice', 'milktea', 'bingsu', 'waffle', 'cake', 'coffee']),
      drinks: f(['coffee', 'icecoffee', 'thaitea', 'greentea', 'lemonade', 'milktea', 'cocoa', 'cocoa2', 'smoothie', 'coconut', 'ice', 'energy']),
      sweets: f(['khanom', 'coconutice', 'bingsu', 'bualoy', 'tubtim', 'mango', 'roti', 'waffle', 'donut', 'cake', 'ice', 'cocoa', 'coconut']),
      bakery: f(['croissant', 'donut', 'cake', 'waffle', 'sandwich', 'roti', 'onigiri', 'coffee', 'cocoa', 'milktea', 'smoothie', 'energy', 'bingsu']),
      snack: f(['sandwich', 'energy', 'onigiri', 'cake', 'mango', 'roti', 'donut', 'ice', 'coconut', 'khanom']),
      wear: t(wear), hats: t(wear.filter(k => /cowboy|beanie|crown/.test(k))), eyes: t(wear.filter(k => /glasses|shades/.test(k))),
      jewels: t(['wear_necklace', 'wear_pearl', 'wear_watch', 'wear_bracelet', 'wear_necklace_silver', 'wear_pearl_black', 'wear_watch_gold', 'wear_bracelet_ruby', 'ring', 'jewelbox', 'watchgift', 'wear_crown_gold']),
      bags: t(wear.filter(k => /backpack|scarf/.test(k))),
      books: t(['book_farm', 'book_cook', 'book_love', 'book_animal', 'book_fish', 'book_money', 'book_car', 'comic', 'magazine', 'novel2']),
      toys: t(['ball', 'kite', 'legoset', 'yoyo', 'boardgame', 'balloon', 'fishtoy', 'card', 'guitar', 'easel', 'teddy', 'plushie']),
      gifts: t(['bouquet', 'ring', 'chocolate', 'perfume', 'teddy', 'rosegift', 'watchgift', 'cake2', 'letter', 'plushie', 'jewelbox', 'balloon']),
      health: t(['vitamin', 'balm', 'medicine', 'energydrink2', 'herbtea', 'inhaler', 'bandage', 'sunscreen', 'vitc', 'shoes']),
      farm: t(['feed', 'fert', 'sprinkler', 'sprinkler_pro', 'extinguisher', 'seedling', 'fingerling', 'fishfeed', 'pesticide', 'ladybug', 'sandbag', 'water']),
      fish: t(['fingerling', 'fishfeed', 'book_fish', 'fishtoy', 'water', 'seedling', 'sandbag', 'extinguisher', 'feed', 'fert']),
      garden: t(['fseed_rose', 'fseed_jasmine', 'fseed_orchid', 'bouquet', 'rosegift', 'seedling', 'water', 'ladybug']).concat(fu(['flowers', 'plant', 'd_cactus', 'd_bonsai', 'd_plant2', 'd_vase'])),
      pet: t(['treat', 'groomkit', 'pettoy', 'saddle', 'fishfeed']),
      pets: Object.keys(PETS).map(k => 'pet:' + k),
      animals: Object.keys(ANIMALS).map(k => 'animal:' + k),
      seeds: Object.keys(CROPS).map(k => 'seed:' + k),
      tech: t(['phone_pro', 'phone_fold', 'tablet', 'smartwatch', 'earbuds', 'powerbank', 'laptop', 'gamingpc', 'vr', 'console2', 'keyboard', 'monitor', 'drone', 'soilsensor', 'weatherstation', 'gps_tractor', 'cctv_kit', 'router']),
      appl: fu(['tv', 'aircon', 'fan', 'radio', 'console', 'washer', 'bike', 'smarttv', 'projector', 'airpurifier', 'printer3d', 'aispeaker']),
      smart: fu(['aispeaker', 'robotvac', 'smartfridge', 'massagechair', 'smartmirror', 'solar', 'evcharger', 'smartgarden', 'doorbell', 'projector', 'printer3d', 'airpurifier', 'pcdesk', 'vrset', 'smarttv']).concat(typeof FUT !== 'undefined' ? Object.keys(FUT).map(k => 'fut:' + k) : []),
      home: fu(['rug', 'plant', 'lamp', 'painting', 'table', 'bookshelf', 'sofa', 'trophy', 'flowers', 'elephant', 'lanternL', 'piano', 'aquarium']),
      decor: fu(Object.keys(FURN).filter(k => k.startsWith('d_'))),
      pcCore: pcs(['cpu', 'mobo']), pcGfx: pcs(['gpu', 'ram']), pcStore: pcs(['ssd', 'psu', 'case', 'cool']), pcPer: pcs(['mon', 'per']),
      pcSets: typeof PC_PRESETS !== 'undefined' ? Object.keys(PC_PRESETS).map(k => 'pcset:' + k) : [],
      secAll: typeof DEV !== 'undefined' ? Object.keys(DEV).map(k => 'sec:' + k) : [],
    };
    for (const k in P) P[k] = P[k].filter(ok);
    return P;
  };
  // shop type -> tabs of [tab name, pool names]
  const TYPES = {
    dept: [['👗 แฟชั่น', ['wear']], ['📺 เครื่องใช้ไฟฟ้า', ['appl', 'tech']], ['🛋️ ของแต่งบ้าน', ['home', 'decor']], ['🎁 ของขวัญและของเล่น', ['gifts', 'toys']], ['💊 สุขภาพ', ['health']], ['🍰 อาหาร', ['snack', 'drinks']]],
    elec: [['📱 มือถือและแกดเจ็ต', ['tech']], ['📺 เครื่องใช้ไฟฟ้า', ['appl']], ['🔌 สมาร์ต', ['smart']]],
    pcs: [['🧠 ซีพียู/บอร์ด', ['pcCore']], ['🎮 การ์ดจอ/แรม', ['pcGfx']], ['💾 ที่เก็บข้อมูล/เคส/ระบายความร้อน', ['pcStore']], ['🖥️ จอและอุปกรณ์', ['pcPer']], ['📦 คอมประกอบสำเร็จ', ['pcSets']]],
    sec: [['📹 กล้อง/เซนเซอร์/ระบบ', ['secAll']], ['🌐 เครือข่าย', ['tech']]],
    net: [['📡 อุปกรณ์เครือข่าย/CCTV', ['secAll']], ['📱 แกดเจ็ต', ['tech']]],
    smart: [['🏠 สมาร์ตโฮม', ['smart']], ['📺 เครื่องใช้ไฟฟ้า', ['appl']], ['📱 แกดเจ็ต', ['tech']]],
    fashion: [['🎩 หมวกและแว่น', ['hats', 'eyes']], ['🎒 กระเป๋า ผ้าพันคอ', ['bags']], ['👑 เครื่องประดับ', ['jewels']], ['👟 รองเท้าและอื่น ๆ', ['wear', 'health']]],
    jewel: [['💍 จิวเวลรี่', ['jewels']], ['🎁 ของขวัญ', ['gifts']]],
    book: [['📚 หนังสือ', ['books']], ['🧸 ของเล่น', ['toys']], ['🎁 ของขวัญ', ['gifts']]],
    furn: [['🛋️ เฟอร์นิเจอร์', ['home']], ['🖼️ ของตกแต่ง', ['decor']], ['📺 เครื่องใช้ไฟฟ้า', ['appl']]],
    decor: [['🖼️ ของตกแต่ง', ['decor']], ['🛋️ เฟอร์นิเจอร์', ['home']]],
    pharm: [['💊 ยาและสุขภาพ', ['health']], ['🌿 ชาสมุนไพร/วิตามิน', ['health', 'snack']]],
    sushi: [['🍣 เมนูญี่ปุ่น', ['jp']], ['🥤 เครื่องดื่ม', ['drinks']]],
    thai: [['🍛 จานหลัก', ['meals']], ['🥤 เครื่องดื่มและของหวาน', ['drinks', 'sweets']]],
    seafood: [['🦐 อาหารทะเล', ['sea']], ['🥤 เครื่องดื่ม', ['drinks']]],
    grill: [['🍤 ทะเลเผา', ['sea']], ['🍚 ข้าวและกับ', ['meals']]],
    cafe: [['☕ เครื่องดื่ม', ['drinks']], ['🥐 ของว่าง', ['bakery']]],
    bakery: [['🥐 เบเกอรี่', ['bakery']], ['☕ เครื่องดื่ม', ['drinks']]],
    sweets: [['🍨 ของหวาน', ['sweets']], ['🥤 เครื่องดื่ม', ['drinks']]],
    juice: [['🥤 เครื่องดื่ม', ['drinks']], ['🍨 ของหวาน', ['sweets']]],
    gift: [['🎁 ของขวัญ', ['gifts']], ['🖼️ ของตกแต่ง', ['decor']], ['🧸 ของเล่น', ['toys']]],
    grocery: [['🍙 อาหารและขนม', ['snack', 'drinks']], ['💊 ของใช้ส่วนตัว', ['health']], ['🌾 ของใช้ฟาร์ม', ['farm']]],
    market: [['🥬 เมล็ดพันธุ์', ['seeds']], ['🍛 อาหารปรุงสุก', ['meals', 'snack']], ['🥤 เครื่องดื่ม', ['drinks']]],
    wholesale: [['🌾 ฟาร์มขายส่ง', ['farm']], ['🌱 เมล็ดพันธุ์', ['seeds']], ['🍙 อาหารและขนม', ['snack', 'drinks']]],
    fishing: [['🎣 ประมง', ['fish']], ['🌾 ฟาร์ม', ['farm']]],
    hardware: [['🧰 อุปกรณ์ฟาร์ม', ['farm']], ['🔌 ไฟฟ้าและสมาร์ต', ['appl', 'smart']]],
    seeds: [['🌱 เมล็ดพันธุ์', ['seeds']], ['🌺 สวนดอกไม้', ['garden']], ['🧰 อุปกรณ์', ['farm']]],
    farm: [['🌱 เมล็ดพันธุ์', ['seeds']], ['🧰 อุปกรณ์ฟาร์ม', ['farm']], ['🌺 สวน', ['garden']]],
    ranch: [['🐄 สัตว์ฟาร์ม', ['animals']], ['🌾 อาหารและยา', ['farm']], ['🐾 อุปกรณ์สัตว์', ['pet']]],
    petshop: [['🐾 สัตว์เลี้ยง', ['pets']], ['🦴 ของใช้สัตว์', ['pet']]],
    florist: [['💐 ดอกไม้และสวน', ['garden']], ['🎁 ของขวัญ', ['gifts']]],
  };
  const stockFor = (type, size, seed) => {
    const Pl = pools(), spec = TYPES[type] || TYPES.grocery, lim = type === 'dept' ? 42 : LIMIT[size];
    const per = Math.ceil(lim / spec.length), seen = new Set(), tabs = [];
    for (const [tn, pn] of spec) {
      const keys = shuffle([].concat(...pn.map(p => Pl[p] || [])).filter(k => !seen.has(k)), seed + tn).slice(0, per);
      keys.forEach(k => seen.add(k)); if (keys.length) tabs.push({ n: tn, items: keys });
    }
    return tabs;
  };

  // ---------- layout ----------
  const PAL = {
    modern: [0xeceff1, 0xe3f2fd, 0xf3e5f5, 0xe8f5e9, 0xfff8e1, 0xe0f7fa], thai: [0xffe0b2, 0xf8bbd0, 0xdcedc8, 0xfff9c4, 0xd7ccc8, 0xb3e5fc],
    resort: [0xfffde7, 0xe1f5fe, 0xffe4ec, 0xe0f2f1, 0xfff3e0, 0xf1f8e9], wood: [0xb08968, 0xc8a27c, 0xa1887f, 0xd7ccc8, 0xbcaaa4, 0xc9b79c],
  };
  const SIGN = ['#0d47a1', '#b71c1c', '#33691e', '#6a1b9a', '#e65100', '#00695c', '#263238', '#ad1457', '#4527a0', '#1565c0'];
  const AWN = [0x1e88e5, 0xe53935, 0x7cb342, 0xab47bc, 0xff7043, 0x26a69a, 0xfbc02d, 0xec407a];
  const NAMES_ADDED = {};

  const buildTown = T => {
    const { cx, cz } = T, big = T.size === 'large', med = T.size === 'medium', R = big ? 88 : 70;
    const ground = new THREE.MeshStandardMaterial({ map: TEX.grass, color: U.col(T.ground), roughness: 0.95 });
    const A = Town2.area(T.n, T.icon, cx, cz, ground, T.hello, { x: -14, z: -262 });
    const g = A.g; A.x0 = cx - R; A.x1 = cx + R; A.z0 = cz - R; A.z1 = cz + R; A.size = T.size; A.key = T.key;
    if (big) { const p2 = U.mk(g, new THREE.PlaneGeometry(260, 260), ground, [cx, -0.01, cz], 1, [-Math.PI / 2, 0, 0]); p2.castShadow = false; p2.receiveShadow = true; }
    const streets = big ? [-40, 0, 40] : med ? [-20, 20] : [0];
    A.streets = streets; const zLen = big ? 180 : 140;
    const road = new THREE.MeshStandardMaterial({ map: TEX.road, normalMap: TEX.road_n || null, roughness: 0.85 }), pave = texMat('paving', 0xe2dbd0, { roughness: 0.9 });
    for (const sx of streets) {
      const r = U.mk(g, new THREE.PlaneGeometry(8, zLen), road, [cx + sx, 0.02, cz], 1, [-Math.PI / 2, 0, 0]); r.receiveShadow = true;
      for (const s of [-1, 1]) U.mk(g, U.box(3, 0.1, zLen, 2), pave, [cx + sx + s * 5.5, 0.05, cz]);
    }
    if (big) { const r = U.mk(g, new THREE.PlaneGeometry(2 * 62, 8), road, [cx, 0.021, cz + 50], 1, [-Math.PI / 2, 0, 0]); r.receiveShadow = true; }
    const L = Math.PI / 2, Rr = -Math.PI / 2, pal = PAL[T.st] || PAL.thai;
    const pois = (x, z, icon, label, fn) => World.pois.push({ kind: 'act', x, z, r: 2.6, label, icon, act: () => G.away === A ? { icon, label, fn } : null });
    const Bd = (o, x, z, rot, shop, icon) => {
      const b = World.building(o); b.position.set(x, 0, z); b.rotation.y = rot; g.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); if (LY) LY.foot(x, z, rot, o.w, o.d, shop ? 'shop' : 'service');
      const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
      if (shop) World.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: o.sign || SHOPS[shop].n, icon: icon || '🏪', map: false });
      return door;
    };
    // slots: walk down every street, both sides
    const z0 = cz - (big ? 72 : 52), step = big ? 17 : 15, rowsN = big ? 8 : med ? 7 : 6;
    const LY = window.V25Layout ? V25Layout.plan(T) : null, at = (sl, o) => LY ? LY.pos(sl, o) : sl, slots = [];
    if (LY) slots.push(...LY.shopSlots); else for (let i = 0; i < rowsN; i++) for (const sx of streets) for (const side of [-1, 1]) slots.push({ x: cx + sx + side * 11, z: z0 + i * step, rot: side < 0 ? L : Rr });
    const style = (i, name, type) => {
      const wall = pal[i % pal.length], bg = SIGN[hash(name) % SIGN.length], aw = AWN[hash(name + 'a') % AWN.length];
      if (T.st === 'modern') return { w: type === 'dept' ? 16 : 10, d: type === 'dept' ? 11 : 8, h: type === 'dept' ? 8 : 5 + (i % 3), rows: type === 'dept' || i % 3 === 0 ? 2 : 1, flat: true, glassFront: true, wall, roof: 0xe0e0e0, sign: name, signStyle: { bg } };
      if (T.st === 'wood') return { w: 9, d: 7.5, h: 3.6, roofH: 2.6, wallTex: 'wood', wall, roof: 0x4e342e, sign: name, signStyle: { bg }, awning: aw, winF: [-2.4, 2.4], winS: [0], pots: true, flowers: i % 2 === 0 };
      if (T.st === 'resort') return { w: 10, d: 8, h: type === 'dept' ? 6.5 : 4.2, rows: type === 'dept' ? 2 : 1, roofH: 2.4, wall, roof: [0x0288d1, 0xd84315, 0x00897b][i % 3], sign: name, signStyle: { bg }, awning: aw, winF: [-2.6, 2.6], winS: [0], flowers: true, pots: true };
      return { w: 10, d: 8, h: 6, rows: 2, roofH: 2.2, wall, roof: [0x8d3b2a, 0x6d4c41, 0x33691e][i % 3], sign: name, signStyle: { bg }, awning: aw, winF: [-2.6, 2.6], winS: [0], ww: 1.4, wh: 1.3, shutter: 0x6d4c41 };
    };
    let si = 0;
    T.shops.forEach(([type, name0], i) => {
      let name = name0;
      const id = `v23_${T.key}_${i}`, gone = !!(window.ShopMerge179 && ShopMerge179.gone(id));   // v179: a shop merged into another one keeps its data but gets no building and no slot (the next shops move up)
      const sl = gone ? null : slots[si++]; if (!sl && !gone) return;
      SHOPS[id] = { n: name, tabs: stockFor(type, T.size, id) };
      if (type === 'dept') SHOP_ROOM[id] = ROOM_KIND.v25dept ? 'v25dept' : 'mall'; else if (FOOD_ROOM[type]) SHOP_ROOM[id] = 'restaurant';
      if (gone) return;
      if (window.ShopMerge179) name = ShopMerge179.nameFor(id, name);
      const o = style(i, name, type), q = at(sl, o); Bd(o, q.x, q.z, sl.rot, id, ICON[type]);
    });
    const svcDef = {
      bank: ['ธนาคารสุขใจ สาขา' + T.n, '🏦', () => Bank2.ui(), '#00695c'], police: ['สถานีตำรวจ' + T.n, '🚓', () => Emergency.stationUI('police'), '#1d2f5a'],
      fire: ['สถานีดับเพลิง' + T.n, '🚒', () => Emergency.stationUI('fire'), '#b3261e'], hospital: ['โรงพยาบาล' + T.n, '🏥', () => Life2.clinicUI(), '#1565c0'],
    };
    for (const k of T.svc) {
      const sl = slots[si++]; if (!sl) break; const [lb, ic, fn, bg] = svcDef[k];
      const so = { w: 11, d: 8, h: 4.4, flat: true, glassFront: true, wall: k === 'hospital' ? 0xffffff : 0xf1ebdc, roof: 0xe0e0e0, sign: lb, signStyle: { bg } }, sq = at(sl, so);
      const d = Bd(so, sq.x, sq.z, sl.rot);
      pois(d.x, d.z, ic, lb, fn);
    }
    // v179: shop slots freed by merged shops become small roadside pocket parks (trees + a bench), so the street has no bare gap
    if (LY && window.ShopMerge179) for (const sl of slots.slice(si)) { try {
      const q = at(sl, { d: 8 }), pk = mc(0x4e7d3a, { roughness: 0.9 }), tk = mc(0x5d4037);
      for (const dz of [-4, 4]) { const x = q.x, z = q.z + dz; U.mk(g, GEO.cylLo, tk, [x, 1.2, z], [0.22, 2.4, 0.22]); U.mk(g, GEO.sph, pk, [x, 3.2, z], 1.5); Col.circle(x, z, 0.35); }
      U.mk(g, GEO.box, M.wood, [q.x - sl.side * 1.5, 0.45, q.z], [0.6, 0.12, 2.2]);
      LY.foot(q.x, q.z, sl.rot, 12, 7, 'park');
    } catch (e) { console.warn('v179 park', e); } }
    // lamps and street trees
    const lampM = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
    for (const sx of streets) for (let z = cz - zLen / 2 + 8; z <= cz + zLen / 2 - 8; z += 16) for (const s of [-1, 1]) { if (LY && LY.inCross(z)) continue; U.mk(g, GEO.cylLo, M.metal, [cx + sx + s * 7.2, 2.5, z], [0.08, 5, 0.08]); U.mk(g, GEO.sph, lampM, [cx + sx + s * 6.6, 5, z], 0.18); Col.circle(cx + sx + s * 7.2, z, 0.2); }
    const leaf = mc(T.st === 'wood' ? 0x3f6f3a : 0x5c8f4a, { roughness: 0.9 }), trunk = mc(0x5d4037), rr = rng(T.key + 'tree');
    for (let i = 0; i < (LY ? 0 : big ? 44 : 28); i++) {
      const x = cx + (rr() < 0.5 ? -1 : 1) * (big ? 62 + rr() * 20 : 38 + rr() * 26), z = cz - R + 4 + rr() * (2 * R - 8);
      U.mk(g, GEO.cylLo, trunk, [x, 1.2, z], [0.22, 2.4, 0.22]); U.mk(g, GEO.sph, leaf, [x, 3.2, z], 1.5); Col.circle(x, z, 0.35);
    }
    if (LY) LY.decorate(T, A, g);
    if (big && !LY) { // skyline towers around the edge
      const gl = mc(0x5d8aa8, { roughness: 0.1, metalness: 0.6 });
      [[-78, -70, 12, 12, 46], [78, -72, 14, 10, 58], [-80, 10, 12, 14, 38], [80, 14, 10, 10, 50], [-76, 70, 14, 12, 44], [78, 72, 12, 12, 40]].forEach(([dx, dz, w, d, h], i) => {
        const b = new THREE.Group(); b.position.set(cx + dx, 0, cz + dz); g.add(b);
        U.mk(b, U.box(w, h, d, 3), texMat('plaster', [0xb0bec5, 0xcfd8dc, 0x90a4ae, 0xeceff1][i % 4]), [0, h / 2, 0]);
        for (let y = 2; y < h - 1; y += 3) U.mk(b, GEO.box, gl, [0, y, d / 2 + 0.02], [w - 1, 1.4, 0.06]);
        Col.box(cx + dx, cz + dz, w / 2 + 0.3, d / 2 + 0.3, 0, 'bld');
      });
    }
    // town gate sign at the north end of the main street
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshStandardMaterial({ map: U.signTex('ยินดีต้อนรับสู่ ' + T.n, { w: 640, h: 96, bg: SIGN[hash(T.key) % SIGN.length], fg: '#ffffff' }) }));
    sg.position.set(cx, 7, cz - zLen / 2 + 3); g.add(sg);
    for (const s of [-1, 1]) { U.mk(g, GEO.cylLo, M.metal, [cx + s * 4, 3.5, cz - zLen / 2 + 3], [0.2, 7, 0.2]); Col.circle(cx + s * 4, cz - zLen / 2 + 3, 0.3); }
    // taxi stand at the south end
    pois(cx + 3, cz + 62, '🚕', 'เรียกแท็กซี่กลับหมู่บ้านสุขใจ', () => Town2.leaveAway());
    A.spawn = { x: cx + 3, z: cz + 58 };
    // residents on the pavements
    T.names.forEach((nm, i) => {
      if (!NAMES_ADDED[nm]) { NAMES_ADDED[nm] = 1; if (!NPC_NAMES.includes(nm)) NPC_NAMES.push(nm); }
      const o = Models.human({ avatar: People.avatarFor(nm, i + 1) }); World.dyn.add(o);
      const sx = streets[i % streets.length], n = { obj: o, name: nm, rot: 0, speed: 0, timer: i, st: 'idle', wave: 0, townRes: true, circ: { x: cx + sx + (i % 2 ? 5.5 : -5.5), z: cz - 40 + i * 9, r: 1.4 } };
      n.x = n.circ.x; n.z = n.circ.z; n.tx = n.x; n.tz = n.z; o.position.set(n.x, 0, n.z); G.npcs.push(n);
    });
    S.towns23 = S.towns23 || {}; if (!S.towns23[T.key]) S.towns23[T.key] = S.day;
    T.built = true;
    return A;
  };

  // ---------- registration ----------
  window.V23Kit = { TOWNS, buildTown, stockFor };
  window.V23Towns = TOWNS.map(T => ({ id: T.key, key: T.key, name: T.n, n: T.n, size: T.size, icon: T.icon, x: T.cx, z: T.cz, fee: T.fee, shops: T.shops.length + T.svc.length }));
  Plan.hwExtra = Plan.hwExtra || [];
  for (const T of TOWNS) {
    if (!Town2.areas[T.key]) Town2.areas[T.key] = { n: T.n, icon: T.icon, cx: T.cx, cz: T.cz, size: T.size, lazy: () => buildTown(T) };
    const label = `${T.n} (${T.size === 'large' ? 'เมืองใหญ่' : T.size === 'medium' ? 'เมืองกลาง' : 'เมืองเล็ก'})`;
    if (!TAXI_DEST.some(d => d.away === T.key)) TAXI_DEST.push({ n: label, away: T.key, fee: T.fee });
    if (!Plan.hwExtra.some(d => d[0] === T.key)) Plan.hwExtra.push([T.key, T.min]);
  }
  // remember the cities you have been to (S.towns23 is created on first visit and saved with the game)
  const _go = Town2.go.bind(Town2);
  Town2.go = (k, fee) => { _go(k, fee); const T = TOWNS.find(t => t.key === k); if (T) { S.towns23 = S.towns23 || {}; if (!S.towns23[k]) S.towns23[k] = S.day; } };
});
