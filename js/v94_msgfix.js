// v94_msgfix.js: the red number on the Messages icon (and on the Contacts & Social group) counted EVERY unread message, but appointment messages are not shown in the Messages app
//  (they live in the Appointments app), so you saw "3 new" and then an empty list until you pressed "Read all". Now the number counts only what the Messages app really lists;
//  appointment messages are counted in the Appointments app (its own tile and the popup), and opening either app marks what it shows as read.
V23.add('v94_msgfix', () => {
  if (typeof Phone === 'undefined' || !window.Phone59 || !Phone59.catOf) return;
  const catOf = m => { try { return Phone59.catOf(m); } catch (e) { return m.cat; } };
  const isAppt = m => m.cat === 'appt' || catOf(m) === 'appt';
  Phone.unread = function () { return (S.msgs || []).filter(m => !m.read && !isAppt(m)).length; };
  Phone.unreadAppt = function () { return (S.msgs || []).filter(m => !m.read && isAppt(m)).length; };
  window.MsgFix94 = { unread: () => Phone.unread(), appt: () => Phone.unreadAppt() };
  try { Phone.badge(); } catch (e) { }
});
