'use strict';
// ---------- Better image on high/ultra: multisampled render target + soft bloom; smoothness helpers for every quality level ----------
const GRADE_SHADER = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1.08 }, con: { value: 1.04 }, vig: { value: 0.18 }, vib: { value: 0.0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, con, vig, vib; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 o = mix(vec3(l), c.rgb, sat);
      float cs = max(o.r, max(o.g, o.b)) - min(o.r, min(o.g, o.b)); o = mix(vec3(dot(o, vec3(0.2126, 0.7152, 0.0722))), o, 1.0 + vib * (1.0 - cs));
      o = (o - 0.5) * con + 0.5;
      float d = distance(vUv, vec2(0.5)); o *= 1.0 - vig * smoothstep(0.38, 0.85, d);
      gl_FragColor = vec4(clamp(o, 0.0, 1.0), c.a); }`,
};
const Gfx = {
  on: false, frame: 0,
  init() {
    const r = G.renderer, lvl = G.Q.lvl;
    this.want = (lvl === 'high' || lvl === 'ultra') && safeGet('raisukjai3d_bloom') !== '0' && !(S && S.mobile);
    if (this.want && THREE.EffectComposer && THREE.UnrealBloomPass) {
      try {
        const w = innerWidth, h = innerHeight, opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, encoding: THREE.sRGBEncoding };
        // sRGB target: materials encode as on screen, so the sky and UI colours stay exactly the same
        const rt = r.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(w * r.getPixelRatio(), h * r.getPixelRatio(), opts) : new THREE.WebGLRenderTarget(w * r.getPixelRatio(), h * r.getPixelRatio(), opts);
        // 4x MSAA on both levels: 8x costs a lot of fill rate for an edge difference that is hard to see
        if (rt.samples !== undefined) rt.samples = 4;
        const c = new THREE.EffectComposer(r, rt);
        c.addPass(new THREE.RenderPass(G.scene, G.camera));
        this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), lvl === 'ultra' ? 0.42 : 0.32, 0.55, 0.86);
        c.addPass(this.bloom);
        // gentle colour grade: a touch more saturation and contrast, soft vignette (one cheap full-screen pass)
        if (THREE.ShaderPass) { this.grade = new THREE.ShaderPass(GRADE_SHADER); this.grade.uniforms.vig.value = lvl === 'ultra' ? 0.24 : 0.18; c.addPass(this.grade); }
        this.composer = c; this.on = true;
        addEventListener('resize', () => this.resize());
      } catch (e) { console.warn('postprocessing off', e); this.on = false; }
    }
    // shadows: high and ultra refresh the shadow map every other frame (sun and props move slowly)
    if (r.shadowMap.enabled && (lvl === 'high' || lvl === 'ultra' || lvl === 'med')) r.shadowMap.autoUpdate = false;
    if (lvl === 'ultra') { G.sun.shadow.radius = 2; G.renderer.toneMappingExposure = 1.05; }
    this.aniso();
  },
  // sharper ground, roads and walls at grazing angles: anisotropic filtering costs almost nothing on desktop GPUs
  aniso() {
    const max = G.renderer.capabilities.getMaxAnisotropy(), lvl = G.Q.lvl, want = Math.min(max, lvl === 'ultra' || lvl === 'high' ? 16 : lvl === 'med' ? 8 : 2);
    if (want <= 1) return; const seen = new Set();
    const fix = t => { if (t && !seen.has(t)) { seen.add(t); if (t.anisotropy < want) { t.anisotropy = want; t.needsUpdate = true; } } };
    G.scene.traverse(o => { if (!o.material) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) { fix(m.map); fix(m.normalMap); fix(m.roughnessMap); } });
    for (const k in T) if (T[k] && T[k].isTexture) fix(T[k]);
  },
  // ultra keeps its shadows and effects; only the render resolution follows the frame rate
  dynRes() {
    if (G.Q.lvl !== 'ultra' || G.fps === this.lastFps || !G.fps) return; this.lastFps = G.fps;
    if (G.fps < 45 && G.pr > 1) Perf.setPr(Math.max(1, G.pr - 0.25));
    else if (G.fps > 58 && G.pr < G.Q.pr) Perf.setPr(Math.min(G.Q.pr, G.pr + 0.25));
  },
  resize() { if (this.composer) { this.composer.setPixelRatio(G.renderer.getPixelRatio()); this.composer.setSize(innerWidth, innerHeight); } },
  render() {
    const r = G.renderer; this.frame++;
    if (!r.shadowMap.autoUpdate) r.shadowMap.needsUpdate = this.frame % 2 === 0 || !!G.driving;
    // night makes lamps and windows glow more, daytime keeps the bloom subtle
    if (this.bloom) this.bloom.strength = (G.Q.lvl === 'ultra' ? 0.38 : 0.28) + (G.night || 0) * 0.35;
    if (this.frame % 30 === 0) this.dynRes();
    if (this.on && this.composer) this.composer.render(); else r.render(G.scene, G.camera);
  },
  // the quality governor drops the glow before anything else
  drop() { if (this.on) { this.on = false; return true; } return false; },
};
UI.H.bloom = () => { const v = safeGet('raisukjai3d_bloom') === '0' ? '1' : '0'; safeSet('raisukjai3d_bloom', v); UI.toast('ตั้งค่าแล้ว มีผลหลังโหลดหน้าใหม่', '✨'); };
