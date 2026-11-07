// v65_look.js: stronger, more vivid colour on medium and high quality (low is left as it was)
//  - high (with the post-processing grade): saturation, contrast and a vibrance lift in the grade pass
//  - medium (and high where post-processing is off): the same look through a filter on the canvas
V23.add('v65_look', () => {
  const LOOK = { sat: 1.07, con: 1.02, vib: 0, vig: 0.2, css: 'saturate(1.04) contrast(1.02)' };   // v129: measured so the post-processed picture (high) and the plain one (when the governor drops the effects) have the same colour   // v126: calmer, true-to-life colour (v115 was a little too vivid)
  const apply = () => {
    if (!G.renderer || !G.Q) return;
    const lvl = G.Q.lvl, vivid = lvl !== 'low', cv = G.renderer.domElement;
    const g = typeof Gfx !== 'undefined' && Gfx.on && Gfx.grade;
    if (g) { const u = Gfx.grade.uniforms; u.sat.value = vivid ? LOOK.sat : 1.08; u.con.value = vivid ? LOOK.con : 1.04; u.vib.value = vivid ? LOOK.vib : 0; u.vig.value = vivid ? LOOK.vig : 0.18; }
    const want = vivid && !g ? (lvl === 'med' ? 'saturate(1.06) contrast(1.03)' : LOOK.css) : '';   // medium: a lively 3D look (colours are also enriched at the source, see v72_realcolor.js)
    if (cv.style.filter !== want) cv.style.filter = want;
  };
  apply(); setInterval(apply, 1500);
});
