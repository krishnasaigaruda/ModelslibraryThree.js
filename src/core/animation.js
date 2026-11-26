import * as THREE from 'three';

/*
 * Every model ships real THREE.AnimationClip objects in `object.animations`,
 * so they work with THREE.AnimationMixer and survive GLB export.
 * The helpers below build those clips from simple descriptions.
 */

const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };

function axisVec(axis) {
  return axis instanceof THREE.Vector3 ? axis.clone().normalize() : AXES[axis];
}

/** Continuous rotation of nodes about an axis (wheels, rotors, fans). */
export function spinTrack(node, axis = 'x', period = 1, direction = 1) {
  const base = node.quaternion.clone();
  const a = axisVec(axis);
  const steps = 8;
  const times = [];
  const values = [];
  const q = new THREE.Quaternion();
  for (let i = 0; i <= steps; i++) {
    times.push((i / steps) * period);
    q.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(a, direction * (i / steps) * Math.PI * 2));
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values);
}

/**
 * Rotation driven by a function of normalized time t∈[0,1] → angle (radians).
 * Used for swinging limbs, rocking chairs, opening doors.
 */
export function rotateTrack(node, axis, period, angleAt, steps = 24) {
  const base = node.quaternion.clone();
  const a = axisVec(axis);
  const times = [];
  const values = [];
  const q = new THREE.Quaternion();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    times.push(t * period);
    q.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(a, angleAt(t)));
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values);
}

/** Position offset driven by t∈[0,1] → [dx,dy,dz]. */
export function moveTrack(node, period, offsetAt, steps = 24) {
  const base = node.position.clone();
  const times = [];
  const values = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [dx, dy, dz] = offsetAt(t);
    times.push(t * period);
    values.push(base.x + dx, base.y + dy, base.z + dz);
  }
  return new THREE.VectorKeyframeTrack(`${node.name}.position`, times, values);
}

/** Scale driven by t∈[0,1] → [sx,sy,sz] multipliers. */
export function scaleTrack(node, period, scaleAt, steps = 24) {
  const base = node.scale.clone();
  const times = [];
  const values = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [sx, sy, sz] = scaleAt(t);
    times.push(t * period);
    values.push(base.x * sx, base.y * sy, base.z * sz);
  }
  return new THREE.VectorKeyframeTrack(`${node.name}.scale`, times, values);
}

/** Any numeric property, e.g. 'bulb.intensity' or 'siren.material.emissiveIntensity'. */
export function numberTrack(path, period, valueAt, steps = 24, interpolation) {
  const times = [];
  const values = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    times.push(t * period);
    values.push(valueAt(t));
  }
  return new THREE.NumberKeyframeTrack(path, times, values, interpolation);
}

export const clip = (name, period, tracks) => new THREE.AnimationClip(name, period, tracks.filter(Boolean));

export const wave = (t, cycles = 1) => Math.sin(t * Math.PI * 2 * cycles);
/** 0 → 1 → 0 over the clip with easing; good for "open then close" loops. */
export const pingPong = (t) => 0.5 - 0.5 * Math.cos(t * Math.PI * 2);

/**
 * Small convenience wrapper around THREE.AnimationMixer.
 *
 *   const anim = createAnimator(car);
 *   anim.play('drive');
 *   // in your render loop:
 *   anim.update(clock.getDelta());
 */
export function createAnimator(object) {
  const mixer = new THREE.AnimationMixer(object);
  const clips = new Map(object.animations.map((c) => [c.name, c]));
  const clipFor = (name) => {
    const c = clips.get(name);
    if (!c) {
      const names = object.animations.map((a) => a.name).join(', ') || '(none)';
      throw new Error(`[three-premade] "${object.name}" has no animation "${name}". Available: ${names}`);
    }
    return c;
  };

  const meta = object.userData.premade ?? {};
  const oneShot = new Set(meta.oneShot ?? []);
  const groups = meta.exclusive ?? [];
  // Layering: every active animation plays at full strength. When two animations move the
  // same property (e.g. walk and wave both move the arm), the one started LATER owns that
  // property and the earlier one keeps playing on everything else — so walk + wave = legs
  // walking + arm waving, instead of both being averaged to half strength.
  const stack = []; // active names, oldest first
  const state = new Map(); // name -> { action, key, loop }
  const fading = new Set();
  let globalSpeed = 1;
  const speeds = new Map();
  const derived = new Map(); // cache of filtered clips

  const effectiveClip = (name, idx) => {
    const base = clipFor(name);
    const owned = new Set();
    for (const later of stack.slice(idx + 1)) for (const t of clipFor(later).tracks) owned.add(t.name);
    const tracks = base.tracks.filter((t) => !owned.has(t.name));
    if (tracks.length === base.tracks.length) return { clip: base, key: name };
    const key = `${name}|${tracks.map((t) => t.name).join(',')}`;
    if (!derived.has(key)) derived.set(key, new THREE.AnimationClip(name, base.duration, tracks));
    return { clip: derived.get(key), key };
  };

  const startAction = (name, clip, { loop, fade, time = 0 }) => {
    const action = mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.timeScale = (speeds.get(name) ?? 1) * globalSpeed;
    action.enabled = true;
    action.reset();
    action.time = time;
    action.setEffectiveWeight(1);
    if (fade > 0) action.fadeIn(fade);
    action.play();
    return action;
  };

  // Rebuild the per-animation track sets after the stack changed; keeps playback time.
  const relayer = () => {
    stack.forEach((name, i) => {
      const st = state.get(name);
      const { clip, key } = effectiveClip(name, i);
      if (st.key === key) return;
      const time = st.action.time;
      st.action.stop();
      st.action = startAction(name, clip, { loop: st.loop, fade: 0, time });
      st.key = key;
    });
  };

  const api = {
    mixer,
    /** Every animation this object has. */
    get names() {
      return object.animations.map((a) => a.name);
    },
    /** Animations currently switched on (including held one-shots like steerLeft). */
    get playing() {
      return [...stack];
    },
    /** True for clips that play once and hold their last pose (e.g. steerLeft). */
    isOneShot: (name) => oneShot.has(name),
    /**
     * Start an animation. Several run at once at full strength (drive + steerLeft + lights,
     * walk + wave). Animations in the same exclusive group replace each other
     * (steerLeft ↔ steerRight, drive ↔ reverse) because they can't happen together.
     */
    play(name, { loop = !oneShot.has(name), fade = 0.25, speed, exclusive = false } = {}) {
      clipFor(name);
      const group = groups.find((g) => g.includes(name));
      for (const n of [...stack]) {
        if (n === name) continue;
        if (exclusive || group?.includes(n)) api.stop(n, { fade });
      }
      if (speed != null) speeds.set(name, speed);
      if (state.has(name)) {
        state.get(name).action.stop();
        stack.splice(stack.indexOf(name), 1);
        state.delete(name);
      }
      stack.push(name);
      const { clip, key } = effectiveClip(name, stack.length - 1);
      state.set(name, { action: startAction(name, clip, { loop, fade }), key, loop });
      relayer();
      return state.get(name).action;
    },
    /** Stop one animation (or all with no name). Parts ease back to their rest pose. */
    stop(name, { fade = 0.25 } = {}) {
      const names = name == null ? [...stack] : [name];
      for (const n of names) {
        const st = state.get(n);
        if (!st) continue;
        st.action.fadeOut(fade);
        fading.add(st.action);
        stack.splice(stack.indexOf(n), 1);
        state.delete(n);
      }
      relayer();
    },
    toggle(name, opts) {
      return state.has(name) ? (api.stop(name, opts), false) : (api.play(name, opts), true);
    },
    isPlaying(name) {
      return state.has(name);
    },
    /** Speed for one animation, or for all when name is omitted (0.25 = slow motion, 2 = double). */
    setSpeed(nameOrSpeed, speed) {
      if (typeof nameOrSpeed === 'number') {
        globalSpeed = nameOrSpeed;
        for (const [n, st] of state) st.action.timeScale = (speeds.get(n) ?? 1) * globalSpeed;
      } else {
        speeds.set(nameOrSpeed, speed);
        const st = state.get(nameOrSpeed);
        if (st) st.action.timeScale = speed * globalSpeed;
      }
    },
    update(delta) {
      mixer.update(delta);
    },
  };
  return api;
}
