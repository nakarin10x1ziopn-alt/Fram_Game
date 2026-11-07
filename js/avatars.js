'use strict';
// ---------- Villager avatars: 100Avatars (CC0, Polygonal Mind) animated with Quaternius Universal Animation Library (CC0) ----------
// UAL clips are retargeted onto each avatar's VRM humanoid bones once at load (world-space rotation deltas from the T-pose).
const AV_BONES = {
  pelvis: 'hips', spine_01: 'spine', spine_02: 'chest', spine_03: 'upperChest', neck_01: 'neck', Head: 'head',
  clavicle_l: 'leftShoulder', upperarm_l: 'leftUpperArm', lowerarm_l: 'leftLowerArm', hand_l: 'leftHand',
  clavicle_r: 'rightShoulder', upperarm_r: 'rightUpperArm', lowerarm_r: 'rightLowerArm', hand_r: 'rightHand',
  thigh_l: 'leftUpperLeg', calf_l: 'leftLowerLeg', foot_l: 'leftFoot', ball_l: 'leftToes',
  thigh_r: 'rightUpperLeg', calf_r: 'rightLowerLeg', foot_r: 'rightFoot', ball_r: 'rightToes',
};
const AV_CLIPS = { idle: 'Idle_Loop', walk: 'Walk_Loop', jog: 'Jog_Fwd_Loop', talk: 'Idle_Talking_Loop', interact: 'Interact', pick: 'PickUp_Table', sit: 'Sitting_Idle_Loop', drive: 'Driving_Loop', dance: 'Dance_Loop', kneel: 'Fixing_Kneeling' };
const AV_NAMES = ['Erika', 'Kate', 'Kyle', 'Lydia', 'Jennifer', 'Rose', 'Olivia', 'Robert'];
const AV_LABEL = { Erika: 'เอริกา', Kate: 'เคท', Kyle: 'ไคล์', Lydia: 'ลิเดีย', Jennifer: 'เจนนี่ (เด็ก)', Rose: 'โรส (โจรสลัด)', Olivia: 'โอลิเวีย', Robert: 'โรเบิร์ต' };

const Avatars = {
  src: {}, ok: false,
  async load() {
    if (!this.want) return;   // v29: nobody but an old save's own player uses these models any more; v29_set2 loads them on demand
    if (typeof ASSET_DATA === 'undefined') return;
    if (!ASSET_DATA.chars && typeof AssetPack !== 'undefined') await AssetPack.loadChars();
    if (!ASSET_DATA.chars || !THREE.GLTFLoader || !THREE.SkeletonUtils) return;
    const L = new THREE.GLTFLoader(), parse = b64 => new Promise((res, rej) => L.parse(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer, '', res, rej));
    try {
      const ual = await parse(ASSET_DATA.chars.ual);
      this.ual = { scene: ual.scene, clips: Object.fromEntries(ual.animations.map(c => [c.name, c])) };
      const parsed = await Promise.all(AV_NAMES.map(n => ASSET_DATA.chars[n] ? parse(ASSET_DATA.chars[n]) : null));
      AV_NAMES.forEach((n, i) => { if (parsed[i]) this.src[n] = this.prepare(parsed[i]); });
      this.ok = Object.keys(this.src).length > 0;
      delete ASSET_DATA.chars;   // the decoded models are all that is needed: drop 6 MB of base64 text
    } catch (e) { console.warn('avatars', e); }
  },
  // humanoid name -> bone object, using the VRM bone map
  boneMap(gltf) {
    const ext = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM, map = {};
    if (!ext) return map;
    for (const b of ext.humanoid.humanBones) {
      const nm = THREE.PropertyBinding.sanitizeNodeName(gltf.parser.json.nodes[b.node].name);
      const o = gltf.scene.getObjectByName(nm); if (o) map[b.bone] = o;
    }
    return map;
  },
  prepare(gltf) {
    const root = gltf.scene; root.updateMatrixWorld(true);
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (o.material.map) o.material.map.encoding = THREE.sRGBEncoding; o.material.needsUpdate = true; } });
    const bones = this.boneMap(gltf);
    const box = new THREE.Box3().setFromObject(root), h = box.max.y - box.min.y;
    return { root, bones, h, clips: this.retarget(root, bones) };
  },
  retarget(root, tb) {
    const S = this.ual.scene, src = {}; S.traverse(o => { if (AV_BONES[o.name]) src[AV_BONES[o.name]] = o; });
    const mixer = new THREE.AnimationMixer(S), q = new THREE.Quaternion(), tmp = new THREE.Quaternion();
    const wq = o => o.getWorldQuaternion(new THREE.Quaternion());
    // source T-pose world rotations
    const tp = mixer.clipAction(this.ual.clips.A_TPose); tp.play(); mixer.setTime(0); S.updateMatrixWorld(true);
    const sRest = {}, sRestHips = src.hips.getWorldPosition(new THREE.Vector3());
    for (const k in src) sRest[k] = wq(src[k]);
    tp.stop();
    // target rest pose (VRM files are authored in T-pose)
    root.updateMatrixWorld(true);
    const tRest = {}, tLocal = {}; for (const k in tb) { tRest[k] = wq(tb[k]); tLocal[k] = tb[k].quaternion.clone(); }
    // facing: flip the deltas when the rigs face opposite ways
    const side = (b, l, r) => { const a = b[l].getWorldPosition(new THREE.Vector3()), c = b[r].getWorldPosition(new THREE.Vector3()); return Math.sign(a.x - c.x) || 1; };
    mixer.setTime(0); S.updateMatrixWorld(true);
    const flip = side(src, 'leftUpperArm', 'rightUpperArm') !== side(tb, 'leftUpperArm', 'rightUpperArm');
    const F = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), Fi = F.clone().invert();
    const tHips = tb.hips.position.clone(), sH = (() => { const b = new THREE.Box3().setFromObject(S); return b.max.y - b.min.y || 1.8; })();
    const tH = new THREE.Box3().setFromObject(root), scl = (tH.max.y - tH.min.y) / sH;
    const out = {};
    const order = Object.keys(tb).filter(k => src[k]).sort((a, b) => depth(tb[a]) - depth(tb[b]));
    function depth(o) { let d = 0; while (o.parent) { d++; o = o.parent; } return d; }
    for (const key in AV_CLIPS) {
      const clip = this.ual.clips[AV_CLIPS[key]]; if (!clip) continue;
      const act = mixer.clipAction(clip); act.play();
      const fps = 24, n = Math.max(2, Math.ceil(clip.duration * fps) + 1), times = new Float32Array(n);
      const vals = {}; for (const k of order) vals[k] = new Float32Array(n * 4);
      const hipPos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const t = Math.min(clip.duration, i / fps); times[i] = t; mixer.setTime(t); S.updateMatrixWorld(true);
        const tw = {};
        const worldOf = o => { // target world rotation at this frame
          if (!o || o === root.parent) return new THREE.Quaternion();
          const k = Object.keys(tb).find(x => tb[x] === o);
          if (k && tw[k]) return tw[k];
          return worldOf(o.parent).multiply(o.quaternion.clone());
        };
        for (const k of order) {
          const d = wq(src[k]).multiply(tmp.copy(sRest[k]).invert()); // world delta from T-pose
          if (flip) d.premultiply(F).multiply(Fi);
          tw[k] = d.multiply(tRest[k]);
          const pw = worldOf(tb[k].parent);
          q.copy(pw).invert().multiply(tw[k]); q.toArray(vals[k], i * 4);
        }
        const hp = src.hips.getWorldPosition(new THREE.Vector3()).sub(sRestHips).multiplyScalar(scl);
        hipPos[i * 3] = tHips.x; hipPos[i * 3 + 1] = tHips.y + hp.y / (tb.hips.parent ? tb.hips.parent.getWorldScale(new THREE.Vector3()).y : 1); hipPos[i * 3 + 2] = tHips.z;
      }
      act.stop();
      const tracks = order.map(k => new THREE.QuaternionKeyframeTrack(tb[k].name + '.quaternion', times, vals[k]));
      tracks.push(new THREE.VectorKeyframeTrack(tb.hips.name + '.position', times, hipPos));
      out[key] = new THREE.AnimationClip(key, clip.duration, tracks);
    }
    for (const k in tb) tb[k].quaternion.copy(tLocal[k]);
    return out;
  },
  // a new animated villager; height in metres
  make(name, height = 1.72) {
    const s = this.src[name]; if (!s) return null;
    const g = new THREE.Group(), body = THREE.SkeletonUtils.clone(s.root);
    if (name === 'Jennifer') height = 1.35;
    body.scale.setScalar(height / s.h); body.rotation.y = Math.PI; g.add(body); blobUnder(g, 0.35, 0.3);
    const mixer = new THREE.AnimationMixer(body), actions = {};
    for (const k in s.clips) actions[k] = mixer.clipAction(s.clips[k]);
    g.userData.av = { mixer, actions, cur: null }; g.userData.avName = name;
    this.play(g, 'idle', 0); g.userData.av.mixer.update(0.01);
    // tools (watering can, rod, pickaxe) hang from this group like on the hand-built model
    const hb = s.bones.rightHand && body.getObjectByName(s.bones.rightHand.name);
    const elR = new THREE.Group(); g.userData.elR = elR; g.userData.phase = 0;
    if (hb) {
      g.updateMatrixWorld(true); const ws = hb.getWorldScale(new THREE.Vector3()).x || 1;
      elR.scale.setScalar(1 / ws); elR.rotation.x = Math.PI; elR.position.y = -0.36 / ws; hb.add(elR);
    } else g.add(elR);
    return g;
  },
  play(g, k, fade = 0.25) {
    const av = g.userData.av, a = av.actions[k] || av.actions.idle; if (av.cur === a) return a;
    a.reset().play(); if (av.cur && fade) av.cur.crossFadeTo(a, fade, false); else if (av.cur) av.cur.stop();
    av.cur = a; return a;
  },
  pick(i) { const n = Object.keys(this.src); return n.length ? n[i % n.length] : null; },
};

// villagers built with Models.human({ avatar }) get an animated avatar; everything else keeps the hand-built model
const _humanProc = Models.human, _animProc = Models.animHuman;
Models.human = function (o) {
  if (o && o.avatar && Avatars.ok) { const g = Avatars.make(o.avatar); if (g) return g; }
  return _humanProc(o);
};
Models.animHuman = function (obj, dt, speed, act) {
  const av = obj.userData.av; if (!av) return _animProc(obj, dt, speed, act);
  act = act && (act.type || act);
  let k = 'idle';
  if (speed > 3.2) k = 'jog'; else if (speed > 0.15) k = 'walk';
  else if (act === 'harvest' || act === 'plant' || act === 'fill' || act === 'collect') k = 'pick';
  else if (act === 'wave' || act === 'talk') k = 'talk';
  else if (act === 'water' || act === 'cast' || act === 'eat') k = 'interact';
  else if (act === 'pet') k = 'kneel';
  else if (act === 'sit') k = 'sit';
  else if (act === 'dance') k = 'dance';
  const a = Avatars.play(obj, k);
  a.timeScale = k === 'walk' ? U.clamp(speed / 1.4, 0.6, 1.8) : k === 'jog' ? U.clamp(speed / 3.6, 0.7, 1.6) : 1;
  av.acc = (av.acc || 0) + dt;
  const cp = G.camera.position, far = Math.abs(cp.x - obj.position.x) + Math.abs(cp.z - obj.position.z) > 28;
  if (far && (av.skip = (av.skip || 0) + 1) % 3) return;
  av.mixer.update(av.acc); av.acc = 0;
  // two footsteps per walk/jog cycle, for step sounds and dust
  const ud = obj.userData, f = a.time / a.getClip().duration;
  if (k === 'walk' || k === 'jog') { let df = f - (ud.lf ?? f); if (df < 0) df += 1; ud.phase += df * Math.PI * 2; }
  ud.lf = f;
};
