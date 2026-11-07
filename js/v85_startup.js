// v85_startup.js: the picture must look the same from the first frame
//  - high used to start in the post-processed (slightly more vivid) look, and a few seconds later the quality governor, seeing the stutter of the first seconds (shaders compiling,
//    the title screen fading out), switched the effects off, which changed the colours. Now (1) the two looks are matched (see v65_look.js) and (2) the governor leaves the effects alone
//    for the first 30 seconds after the game starts, so a start-up hiccup cannot change the picture
V23.add('v85_startup', () => {
  if (typeof Perf === 'undefined' || typeof startGame !== 'function') return;
  let t0 = 0;
  const _s = startGame; startGame = function () { if (arguments[0] !== true) t0 = performance.now(); return _s.apply(this, arguments); };
  const _d = Perf.down.bind(Perf);
  Perf.down = function () { if (t0 && performance.now() - t0 < 30000) return; return _d.apply(this, arguments); };
  window.Startup85 = { warm: () => !!t0 && performance.now() - t0 < 30000 };
});
