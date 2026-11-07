'use strict';
// ---------- v45_savereset: DURING THE TEST PERIOD ONLY (before 1 Dec 2569 00:00 Thai time) a new game version (GAME_VER in life8.js) wipes every older save and starts the new version fresh ----------
// From 1 Dec 2569 (real play) saves are never deleted by an update: only the player can delete a save (the delete button). The one-time test-period wipe on 1 Dec itself is v39_testperiod.js.
// Every save is stamped with the version that wrote it (S.gv). When the page loads a save whose stamp differs from GAME_VER (no stamp = an older version) the save is deleted
// everywhere: the three local slots and their backups, and the same slots on the game server (Net, "save" with null). The player then starts a new game of the new version, and a
// message says so once. To publish a test-period version WITHOUT wiping, set SAVE_RESET_ON_NEW_VERSION to false for that release.
const SAVE_RESET_ON_NEW_VERSION = false;   // saves survive every update: a new version never deletes or resets a save (the loader fills any new fields with defaults)
const SAVE_RESET_FLAG = 'raisukjai3d_vwipe';
{
  const slotKey = n => n === 1 ? SAVE_KEY : SAVE_KEY + '_s' + n;
  const wipeSlot = (n, why) => {
    try { localStorage.removeItem(slotKey(n)); localStorage.removeItem(slotKey(n) + '_bak'); } catch (e) { }
    try { if (typeof Net !== 'undefined' && Net.on) { const pid = safeGet('raisukjai3d_pid'); if (pid) Net.api('save', { id: pid + (n > 1 ? '_s' + n : ''), save: null }).catch(() => { }); } } catch (e) { }
  };
  const inTest = () => Date.now() < T39_CUTOFF;   // T39_CUTOFF: 1 Dec 2569 00:00 Thai time (v39_testperiod.js)
  const stale = raw => { try { const s = JSON.parse(raw); return !s || s.gv !== GAME_VER; } catch (e) { return true; } };
  const _ls = loadState;
  loadState = function () {
    if (!SAVE_RESET_ON_NEW_VERSION || !inTest()) return _ls.apply(this, arguments);   // after the test period nothing is ever wiped by a new version
    let wiped = false, from = '';
    for (let n = 1; n <= 3; n++) {
      const raw = safeGet(slotKey(n)); if (!raw) continue;
      if (stale(raw)) { try { from = from || (JSON.parse(raw).gv || 'เก่า'); } catch (e) { from = from || 'เก่า'; } wipeSlot(n); wiped = true; }
    }
    // the save the server handed over for the current slot
    try { if (typeof Net !== 'undefined' && Net.remoteSave && stale(Net.remoteSave)) { try { from = from || (JSON.parse(Net.remoteSave).gv || 'เก่า'); } catch (e) { from = from || 'เก่า'; } Net.remoteSave = null; wipeSlot(Slots.cur()); wiped = true; } } catch (e) { }
    // other slots that exist only on the server
    try { if (typeof Net !== 'undefined' && Net.on) { const pid = safeGet('raisukjai3d_pid'); if (pid) for (const n of [2, 3]) Net.api('save?id=' + pid + '_s' + n).then(r => { if (r && r.save && r.save.gv !== GAME_VER) wipeSlot(n); }).catch(() => { }); } } catch (e) { }
    if (wiped) safeSet(SAVE_RESET_FLAG, from || 'เก่า');
    return _ls.apply(this, arguments);
  };
  const _sg = saveGame;
  saveGame = function () { try { if (S) S.gv = GAME_VER; } catch (e) { } return _sg.apply(this, arguments); };
}
V23.add('v45_savereset', () => {
  if (S) S.gv = GAME_VER;
  const from = safeGet(SAVE_RESET_FLAG);
  if (from) {
    safeSet(SAVE_RESET_FLAG, '');
    // wait until the player is in the game and nothing else is open (the character creator opens first on a new game), then say it once
    let tries = 0; const show = () => {
      if (++tries > 80) return;
      if (!G.started || UI.isOpen()) { setTimeout(show, 1500); return; }
      try { UI.open('อัปเดตเวอร์ชันใหม่', null, () => `<p class="lead">เกมอัปเดตเป็นเวอร์ชัน ${GAME_VER} (จากเวอร์ชัน ${esc(from)}) เซฟเดิมถูกลบและรีเซ็ตอัตโนมัติ นี่คือการเริ่มเล่นใหม่ในเวอร์ชันล่าสุด</p><div class="row end"><button class="btn" data-a="close">รับทราบ</button></div>`); } catch (e) { }
    };
    setTimeout(show, 3000);
  }
});
