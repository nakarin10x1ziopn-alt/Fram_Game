'use strict';
// ---------- Synthesized sound (no audio files needed) ----------
const Sfx = {
  ctx: null, on: true, master: null,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx;
    this.out = c.createGain(); this.out.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = this.on ? 0.7 : 0; this.master.connect(this.out);
    Music.init(c, this.out);
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    const loop = (freq, type, q) => {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
      const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.master); s.start();
      return { g, f };
    };
    this.rain = loop(1400, 'lowpass');
    this.wind = loop(380, 'lowpass');
    this.sea = loop(500, 'lowpass');
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 40;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = c.createGain(); g.gain.value = 0; o.connect(f); f.connect(g); g.connect(this.master); o.start();
    this.engine = { o, g, f };
    this.birdT = 2; this.crickT = 1;
  },
  // iOS/Safari suspend the context when the app is backgrounded; resume on the next touch
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); },
  // global mute silences effects and music together
  setOn(v) { this.on = v; if (this.out) this.out.gain.setTargetAtTime(v ? 1 : 0, this.ctx.currentTime, 0.05); },
  tone(freq, dur, type = 'sine', vol = 0.1, slide, delay = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, freq, type = 'bandpass', vol = 0.2, q = 1, delay = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  horn(far) { const v = far ? 0.025 : 0.06; this.tone(392, 0.45, 'square', v); this.tone(494, 0.45, 'square', v * 0.8); },
  step(kind) {
    if (kind === 'grass') this.burst(0.07, 2600, 'highpass', 0.035, 0.7);
    else if (kind === 'dirt') this.burst(0.08, 900, 'bandpass', 0.06, 1.2);
    else if (kind === 'hard') { this.burst(0.05, 1800, 'bandpass', 0.06, 2); }
    else { this.burst(0.08, 420, 'lowpass', 0.12, 1); this.tone(150, 0.06, 'sine', 0.03); }
  },
  woof() { this.tone(330, 0.12, 'sawtooth', 0.06, 200); this.tone(300, 0.14, 'sawtooth', 0.06, 180, 0.2); },
  meow() { this.tone(700, 0.45, 'triangle', 0.05, 520); },
  coin() { this.tone(988, 0.09, 'square', 0.05); this.tone(1319, 0.22, 'square', 0.05, null, 0.08); },
  pop() { this.tone(420, 0.12, 'sine', 0.18, 820); this.burst(0.08, 2400, 'highpass', 0.05); },
  plant() { this.burst(0.18, 600, 'lowpass', 0.25); },
  water() { this.burst(0.7, 2600, 'bandpass', 0.12, 0.6); this.burst(0.5, 900, 'bandpass', 0.08, 1, 0.1); },
  click() { this.tone(660, 0.05, 'triangle', 0.06); },
  error() { this.tone(220, 0.15, 'square', 0.05, 160); },
  door() { this.burst(0.25, 300, 'lowpass', 0.3); this.tone(140, 0.2, 'triangle', 0.08, 90); },
  thunder(d = 0) { this.burst(2.6, 120, 'lowpass', 0.9, 0.5, d); this.burst(1.2, 300, 'lowpass', 0.4, 0.5, d + 0.1); },
  eat() { for (let i = 0; i < 3; i++) this.burst(0.07, 1200, 'bandpass', 0.15, 2, i * 0.12); },
  cluck() { this.tone(900, 0.08, 'square', 0.04, 600); this.tone(1000, 0.1, 'square', 0.04, 700, 0.12); },
  moo() { this.tone(160, 0.9, 'sawtooth', 0.07, 110); },
  baa() { const t = 0.5; for (let i = 0; i < 5; i++) this.tone(420 + (i % 2) * 30, t / 5, 'sawtooth', 0.04, null, i * t / 5); },
  oink() { this.tone(260, 0.12, 'square', 0.05, 180); this.tone(240, 0.12, 'square', 0.05, 170, 0.15); },
  goal() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.08, null, i * 0.11)); },
  piano() { const n = [523, 587, 659, 784, 880, 784, 659, 587]; n.forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.08, null, i * 0.22)); },
  update(dt, p) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, k = 0.4;
    const out = p.outdoor ? 1 : 0.25;
    this.rain.g.gain.setTargetAtTime(p.rain * 0.35 * out, t, k);
    this.wind.g.gain.setTargetAtTime((0.02 + p.wind * 0.1) * out, t, k);
    this.sea.g.gain.setTargetAtTime(p.sea * 0.12 * (0.7 + 0.3 * Math.sin(t * 0.6)), t, k);
    const e = this.engine;
    e.g.gain.setTargetAtTime(p.car ? 0.05 + Math.min(1, Math.abs(p.carSpeed) / 30) * 0.05 : 0, t, 0.1);
    e.o.frequency.setTargetAtTime(38 + Math.abs(p.carSpeed) * 3.2, t, 0.1);
    e.f.frequency.setTargetAtTime(300 + Math.abs(p.carSpeed) * 30, t, 0.1);
    if (p.outdoor && !p.night && p.rain < 0.1) {
      this.birdT -= dt;
      if (this.birdT < 0) { this.birdT = 2 + Math.random() * 6; const f = 2000 + Math.random() * 1800; for (let i = 0; i < 2 + (Math.random() * 3 | 0); i++) this.tone(f, 0.09, 'sine', 0.025, f * 1.3, i * 0.13); }
    }
    if (p.outdoor && p.night && p.rain < 0.1) {
      this.crickT -= dt;
      if (this.crickT < 0) { this.crickT = 0.5 + Math.random() * 1.5; for (let i = 0; i < 3; i++) this.tone(4200, 0.03, 'square', 0.008, null, i * 0.06); }
    }
  },
};

// ---------- Background music: generated live on a pentatonic scale, 4-bar phrases (A A B B), mood follows time & weather ----------
const Music = {
  on: true, ctx: null, step: 0, next: 0, mood: { night: false, rain: false, inside: false },
  init(ctx, dest) {
    this.ctx = ctx;
    this.gain = ctx.createGain(); this.gain.gain.value = this.on ? 0.3 : 0;
    // soft echo for space
    const d = ctx.createDelay(1); d.delayTime.value = 0.36;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    this.send = ctx.createGain(); this.send.gain.value = 0.35;
    this.send.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.gain);
    this.gain.connect(dest);
    this.next = ctx.currentTime + 0.3; this.phrases = null;
    setInterval(() => this.tick(), 100);
  },
  setOn(v) { this.on = v; if (this.gain) this.gain.gain.setTargetAtTime(v ? 0.3 : 0, this.ctx.currentTime, 0.3); },
  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  note(n, t, dur, type, vol, toSend = true) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = this.midi(n);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (type === 'sine' && dur > 1.5 ? 0.4 : 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.gain); if (toSend) g.connect(this.send);
    o.start(t); o.stop(t + dur + 0.05);
  },
  makePhrases() {
    const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79];
    const mk = () => {
      const bars = []; let idx = 4;
      for (let b = 0; b < 4; b++) {
        const bar = [];
        for (let s = 0; s < 8; s++) {
          const dense = this.mood.night ? 0.22 : this.mood.rain ? 0.3 : 0.45;
          if (Math.random() < (s % 2 === 0 ? dense + 0.15 : dense - 0.15)) { idx = U.clamp(idx + Math.round((Math.random() - 0.5) * 4), 0, scale.length - 1); bar.push(scale[idx]); }
          else bar.push(null);
        }
        bars.push(bar);
      }
      return bars;
    };
    const A = mk(), B = mk();
    this.phrases = [A, A, B, B];
  },
  tick() {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') { if (this.ctx) this.next = Math.max(this.next, this.ctx.currentTime + 0.1); return; }
    const m = this.mood, tempo = m.night ? 66 : m.rain ? 78 : 94, stepDur = 60 / tempo / 2;
    while (this.next < this.ctx.currentTime + 0.5) { this.play(this.next, stepDur); this.next += stepDur; this.step++; }
  },
  play(t, sd) {
    const m = this.mood, s = this.step % 8, barN = Math.floor(this.step / 8), bar = barN % 4;
    if (s === 0 && barN % 16 === 0) this.makePhrases();
    if (!this.phrases) this.makePhrases();
    const prog = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]], ch = prog[bar];
    if (s === 0) {
      this.note(ch[0] - 12, t, sd * 6, 'sine', m.night ? 0.09 : 0.12, false);
      for (const n of ch) this.note(n + (m.night ? 0 : 12), t, sd * 8.5, 'sine', m.night ? 0.03 : m.rain ? 0.028 : 0.018, false);
    }
    if (s === 4 && !m.night) this.note(ch[1] - 12, t, sd * 3, 'sine', 0.08, false);
    const n = this.phrases[Math.floor(barN / 4) % 4][bar][s];
    if (n != null) {
      if (m.night) this.note(n + 12, t, 1.8, 'sine', 0.05);
      else this.note(n, t, m.inside ? 0.9 : 0.6, 'triangle', m.inside ? 0.05 : 0.065);
    }
  },
};
