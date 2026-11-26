import * as THREE from 'three';
import { clip } from '../../core/animation.js';
import { poseTrack, offsetTrack, smooth01 } from './skin.js';

/*
 * Person animation clips (in place). Legs use 2-bone IK so the stance foot is
 * planted and moves backward at exactly the walk/run speed (no sliding when the
 * character is moved at userData.premade.walkSpeed / runSpeed), with heel-strike,
 * roll and toe-off at the ball of the foot (toe bones). Arms swing opposite the
 * legs with elbow bend; shoulders counter-rotate against the hips.
 *
 * Bone rotation conventions (rest frames are identity, character faces +Z):
 *  legs/arms: −x swings forward, knee +x bends back, elbow −x flexes;
 *  left arm +z raises sideways (right arm −z); foot +x points the toes down.
 */
export function buildAnimations(rig, P, { lids = [] } = {}) {
  const H = P.H;
  const TAU = Math.PI * 2;
  const b = (n) => rig.get(n);
  const sm = smooth01;
  const Lt = P.thighLen;
  const Ls = P.shinLen;
  const ballZ = 0.072 * H; // ankle → ball of foot (horizontal)
  const ankleY = P.ankleY;

  const make = (name, period, spec, steps = 48) => {
    const tracks = [];
    for (const [node, fn] of Object.entries(spec)) {
      if (node === 'hipsPos') tracks.push(offsetTrack(b('hips'), period, fn, steps));
      else if (node === 'blink') for (const lid of lids) tracks.push(poseTrack(lid, period, (t) => [fn(t) * 1.8, 0, 0], steps * 2));
      else tracks.push(poseTrack(b(node), period, fn, steps));
    }
    return clip(name, period, tracks);
  };
  /** blink curve: closes quickly at the given times (fractions of the clip). */
  const blinks = (...at) => (t) => Math.max(0, ...at.map((c) => 1 - Math.abs(t - c) / 0.03));

  /** 2-bone IK in the sagittal plane: hip height → ankle (z forward, y up). Returns [thigh, knee]. */
  const legIK = (hipY, z, y) => {
    const vz = z;
    const vy = y - hipY;
    let d = Math.hypot(vz, vy);
    d = Math.min(d, (Lt + Ls) * 0.9995);
    const thV = Math.atan2(-vz, -vy);
    const cosB = (Lt * Lt + d * d - Ls * Ls) / (2 * Lt * d);
    const beta = Math.acos(THREE.MathUtils.clamp(cosB, -1, 1));
    const cosK = (Lt * Lt + Ls * Ls - d * d) / (2 * Lt * Ls);
    const knee = Math.PI - Math.acos(THREE.MathUtils.clamp(cosK, -1, 1));
    return [thV - beta, knee];
  };

  /**
   * Leg spec for a gait. footAt(phase) → { z, y, pitch, toe } (ankle target, foot pitch, toe bend);
   * hip(t) → { y, x, yaw, roll } ; phaseOffset per leg.
   */
  const gaitLegs = (footAt, hip) => {
    const out = {};
    for (const [sfx, off] of [['L', 0], ['R', 0.5]]) {
      const solve = (t) => {
        const f = footAt((t + off) % 1);
        const h = hip(t);
        const [thigh, knee] = legIK(P.hipY + h.y, f.z, f.y);
        return { thigh, knee, f, h };
      };
      out[`upperLeg_${sfx}`] = (t) => {
        const r = solve(t);
        // keep the foot under the hip when the pelvis sways sideways
        return [r.thigh, 0, -r.h.x / (Lt + Ls) - r.h.roll];
      };
      out[`lowerLeg_${sfx}`] = (t) => [solve(t).knee, 0, 0];
      out[`foot_${sfx}`] = (t) => {
        const r = solve(t);
        return [r.f.pitch - (r.thigh + r.knee), 0, r.h.roll];
      };
      out[`toes_${sfx}`] = (t) => [solve(t).f.toe, 0, 0];
    }
    return out;
  };

  /** Both legs doing the same thing (jumping, squatting). */
  const symLegs = (footAt, hip) => {
    const out = {};
    for (const sfx of ['L', 'R']) {
      const solve = (t) => {
        const f = footAt(t);
        const [thigh, knee] = legIK(P.hipY + hip(t).y, f.z, f.y);
        return { thigh, knee, f };
      };
      out[`upperLeg_${sfx}`] = (t) => [solve(t).thigh, 0, 0];
      out[`lowerLeg_${sfx}`] = (t) => [solve(t).knee, 0, 0];
      out[`foot_${sfx}`] = (t) => {
        const r = solve(t);
        return [r.f.pitch - (r.thigh + r.knee), 0, 0];
      };
    }
    return out;
  };

  /** Foot path for a gait with given stance fraction, half step length, swing lift. */
  const footPath = (stance, half, lift, heelUp = 0.55, toeUp = 0.28) => (ph) => {
    if (ph < stance) {
      const s = ph / stance;
      const z = half * (1 - 2 * s);
      const strike = -toeUp * (1 - sm(s / 0.14)); // heel strike: toes up, then foot flat
      const push = heelUp * sm((s - 0.66) / 0.34); // heel rises, rolling over the ball
      const pitch = strike + push;
      // rolling over the ball lifts the ankle; keep the ball planted
      const y = ankleY + ballZ * Math.sin(Math.max(0, push)) + 0.004 * H * Math.max(0, -strike / toeUp);
      return { z: z + ballZ * (1 - Math.cos(push)), y, pitch, toe: -push };
    }
    const s = (ph - stance) / (1 - stance);
    const z = -half + 2 * half * sm(s);
    const y = ankleY + ballZ * Math.sin(heelUp) * (1 - sm(s / 0.3)) + lift * Math.sin(Math.PI * Math.min(1, s * 1.1));
    const pitch = heelUp * (1 - sm(s / 0.45)) - toeUp * sm((s - 0.65) / 0.35);
    return { z, y, pitch, toe: -0.25 * Math.sin(Math.PI * Math.min(1, s / 0.5)) };
  };

  const clips = [];
  const kid = P.child;

  // ---------------- walk ----------------
  const walkT = kid ? 0.82 : 1.05;
  const walkStance = 0.6;
  const walkHalf = (kid ? 0.15 : 0.17) * H;
  const walkFoot = footPath(walkStance, walkHalf, 0.045 * H);
  const walkHip = (t) => ({
    // highest at mid-stance of each leg (t ≈ 0.3, 0.8), lowest at double support
    y: -0.014 * H + 0.011 * H * Math.cos(TAU * 2 * (t - walkStance / 2)),
    x: 0.014 * H * Math.sin(TAU * (t - 0.05)), // sway over the stance leg
    yaw: 0.1 * Math.sin(TAU * t),
    roll: 0.035 * Math.sin(TAU * t),
  });
  clips.push(make('walk', walkT, {
    hipsPos: (t) => [walkHip(t).x, walkHip(t).y, 0],
    hips: (t) => [0.03, -walkHip(t).yaw, walkHip(t).roll],
    spine: (t) => [0.02, walkHip(t).yaw * 0.6, -walkHip(t).roll * 0.6],
    chest: (t) => [0.0 - 0.01 * Math.cos(TAU * 2 * t), walkHip(t).yaw * 1.0, -walkHip(t).roll * 0.4], // shoulders counter-rotate
    neck: (t) => [-0.02 + 0.015 * Math.cos(TAU * 2 * t), -walkHip(t).yaw * 0.5, 0],
    upperArm_L: (t) => [0.36 * Math.sin(TAU * t) + 0.02, 0, 0.04],
    upperArm_R: (t) => [-0.36 * Math.sin(TAU * t) + 0.02, 0, -0.04],
    lowerArm_L: (t) => [-0.2 - 0.32 * sm((-Math.sin(TAU * t) + 0.2) / 1.2), 0, 0],
    lowerArm_R: (t) => [-0.2 - 0.32 * sm((Math.sin(TAU * t) + 0.2) / 1.2), 0, 0],
    hand_L: (t) => [0.1 * Math.sin(TAU * t - 0.6), 0, 0],
    hand_R: (t) => [-0.1 * Math.sin(TAU * t - 0.6), 0, 0],
    ...gaitLegs(walkFoot, walkHip),
    blink: blinks(0.4),
  }, 64));

  // ---------------- run ----------------
  const runT = kid ? 0.6 : 0.7;
  const runStance = 0.36;
  const runHalf = (kid ? 0.2 : 0.24) * H;
  const runFoot = footPath(runStance, runHalf, 0.15 * H, 0.7, 0.15);
  const runHip = (t) => ({
    // lowest mid-stance (absorbing), highest in flight
    y: -0.016 * H - 0.016 * H * Math.cos(TAU * 2 * (t - runStance / 2)),
    x: 0.008 * H * Math.sin(TAU * t),
    yaw: 0.16 * Math.sin(TAU * t),
    roll: 0.03 * Math.sin(TAU * t),
  });
  clips.push(make('run', runT, {
    hipsPos: (t) => [runHip(t).x, runHip(t).y, 0],
    hips: (t) => [0.08, -runHip(t).yaw, runHip(t).roll],
    spine: (t) => [0.1, runHip(t).yaw * 0.5, 0],
    chest: (t) => [0.04, runHip(t).yaw * 1.1, 0],
    neck: () => [-0.14, 0, 0],
    upperArm_L: (t) => [0.6 * Math.sin(TAU * t) + 0.05, 0, 0.1],
    upperArm_R: (t) => [-0.6 * Math.sin(TAU * t) + 0.05, 0, -0.1],
    lowerArm_L: (t) => [-1.6 - 0.2 * Math.sin(TAU * t), 0.2, 0],
    lowerArm_R: (t) => [-1.6 + 0.2 * Math.sin(TAU * t), -0.2, 0],
    hand_L: () => [0.15, 0, 0],
    hand_R: () => [0.15, 0, 0],
    ...gaitLegs(runFoot, runHip),
  }, 56));

  // standing helper: feet planted at rest while the pelvis shifts (IK keeps them still)
  const stand = (hipFn) => gaitLegs(() => ({ z: 0, y: ankleY, pitch: 0, toe: 0 }), hipFn);

  // ---------------- idle ----------------
  const idleHip = (t) => ({ y: -0.006 * H - 0.003 * H * (0.5 - 0.5 * Math.cos(TAU * t)), x: 0.012 * H * Math.sin(TAU * t), yaw: 0.02 * Math.sin(TAU * t), roll: 0.02 * Math.sin(TAU * t) });
  clips.push(make('idle', 5, {
    hipsPos: (t) => [idleHip(t).x, idleHip(t).y, 0],
    hips: (t) => [0, idleHip(t).yaw, idleHip(t).roll],
    spine: (t) => [0.015 * Math.sin(TAU * t * 3), 0, -idleHip(t).roll * 0.8], // breathing
    chest: (t) => [-0.02 * Math.sin(TAU * t * 3), -idleHip(t).yaw, -idleHip(t).roll * 0.4],
    neck: (t) => [0.03 * Math.sin(TAU * t + 1), 0.12 * Math.sin(TAU * t * 0.5 + 0.4), 0.02 * Math.sin(TAU * t)],
    upperArm_L: (t) => [0.03 * Math.sin(TAU * t), 0, 0.02 + 0.015 * Math.sin(TAU * t * 3)],
    upperArm_R: (t) => [0.03 * Math.sin(TAU * t + 0.5), 0, -0.02 - 0.015 * Math.sin(TAU * t * 3)],
    lowerArm_L: () => [-0.14, 0, 0],
    lowerArm_R: () => [-0.14, 0, 0],
    ...stand(idleHip),
    blink: blinks(0.18, 0.52, 0.86),
  }, 80));

  // ---------------- talk ----------------
  const calmHip = (t) => ({ y: -0.005 * H, x: 0.006 * H * Math.sin(TAU * t), yaw: 0, roll: 0.01 * Math.sin(TAU * t) });
  clips.push(make('talk', 3, {
    hipsPos: (t) => [calmHip(t).x, calmHip(t).y, 0],
    neck: (t) => [0.07 * Math.sin(TAU * t * 2) * sm(Math.sin(TAU * t) + 0.3), 0.15 * Math.sin(TAU * t * 0.5), 0.05 * Math.sin(TAU * t)], // nods
    spine: (t) => [0.02, 0.05 * Math.sin(TAU * t), 0],
    chest: (t) => [0, 0.06 * Math.sin(TAU * t + 0.5), 0],
    upperArm_R: (t) => [-0.35 - 0.12 * Math.sin(TAU * t * 2), 0.2, -0.12],
    lowerArm_R: (t) => [-1.2 - 0.3 * Math.sin(TAU * t * 2), 0.35 * Math.sin(TAU * t), 0],
    hand_R: (t) => [0.2 * Math.sin(TAU * t * 2 + 1), 0.5 + 0.3 * Math.sin(TAU * t), 0.2],
    upperArm_L: (t) => [-0.12 - 0.22 * sm(Math.sin(TAU * t + 2)), -0.1, 0.06],
    lowerArm_L: (t) => [-0.4 - 0.8 * sm(Math.sin(TAU * t + 2)), -0.3 * sm(Math.sin(TAU * t + 2)), 0],
    hand_L: (t) => [0, -0.4 * sm(Math.sin(TAU * t + 2)), 0],
    ...stand(calmHip),
    blink: blinks(0.3, 0.75),
  }, 72));

  // ---------------- wave ----------------
  clips.push(make('wave', 1.2, {
    hipsPos: () => [0.006 * H, -0.005 * H, 0],
    spine: () => [0, 0, 0.04],
    neck: () => [0.04, -0.12, -0.05],
    upperArm_R: (t) => [-0.3, 0, -2.5 + 0.04 * Math.sin(TAU * t)],
    lowerArm_R: (t) => [-0.35, 0, -0.25 + 0.42 * Math.sin(TAU * t * 2)],
    hand_R: (t) => [0, 0.3, 0.2 * Math.sin(TAU * t * 2 + 0.7)],
    upperArm_L: (t) => [0.02 * Math.sin(TAU * t), 0, 0.03],
    lowerArm_L: () => [-0.15, 0, 0],
    ...stand(() => ({ y: -0.005 * H, x: 0.006 * H, yaw: 0, roll: 0.01 })),
    blink: blinks(0.6),
  }));

  // ---------------- point ----------------
  clips.push(make('point', 2.4, {
    hipsPos: () => [-0.006 * H, -0.004 * H, 0],
    spine: (t) => [0, -0.12 + 0.02 * Math.sin(TAU * t), 0],
    chest: () => [0, -0.12, 0],
    neck: (t) => [0.02, -0.2 + 0.03 * Math.sin(TAU * t), 0],
    upperArm_R: (t) => [-1.4 + 0.03 * Math.sin(TAU * t), 0.15, -0.12],
    lowerArm_R: () => [-0.08, 0, 0],
    hand_R: () => [0.15, 0, 0],
    upperArm_L: () => [0.02, 0, 0.03],
    lowerArm_L: () => [-0.18, 0, 0],
    ...stand(() => ({ y: -0.004 * H, x: -0.006 * H, yaw: 0, roll: -0.01 })),
    blink: blinks(0.5),
  }));

  // ---------------- look-around ----------------
  const look = (t) => 0.75 * Math.sin(TAU * t) * sm(Math.abs(Math.sin(TAU * t)) * 1.5);
  clips.push(make('look-around', 4, {
    hipsPos: () => [0, -0.005 * H, 0],
    neck: (t) => [0.02 * Math.cos(TAU * t * 2), look(t) * 0.75, 0],
    chest: (t) => [0, look(t) * 0.25, 0],
    spine: (t) => [0, look(t) * 0.1, 0],
    upperArm_L: () => [0.02, 0, 0.03],
    upperArm_R: () => [0.02, 0, -0.03],
    lowerArm_L: () => [-0.15, 0, 0],
    lowerArm_R: () => [-0.15, 0, 0],
    ...stand(() => ({ y: -0.005 * H, x: 0, yaw: 0, roll: 0 })),
    blink: blinks(0.25, 0.75),
  }));

  // ---------------- phone call ----------------
  clips.push(make('phone-call', 3, {
    hipsPos: (t) => [0.01 * H * Math.sin(TAU * t * 0.5), -0.006 * H, 0],
    neck: (t) => [0.05 + 0.04 * Math.sin(TAU * t), 0.1 * Math.sin(TAU * t * 0.5), -0.16],
    upperArm_R: () => [-0.55, 0.4, -0.62],
    lowerArm_R: () => [-2.35, 0.2, 0],
    hand_R: () => [0.2, 0.4, 0.3],
    upperArm_L: (t) => [-0.15 - 0.15 * sm(Math.sin(TAU * t)), 0, 0.05],
    lowerArm_L: (t) => [-0.3 - 0.6 * sm(Math.sin(TAU * t)), 0, 0],
    ...stand((t) => ({ y: -0.006 * H, x: 0.01 * H * Math.sin(TAU * t * 0.5), yaw: 0, roll: 0.01 })),
    blink: blinks(0.2, 0.7),
  }));

  // ---------------- jump ----------------
  const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  const air = (t) => (t > 0.42 && t < 0.7 ? 1 - ((t - 0.56) / 0.14) ** 2 : 0);
  const crouch = (t) => 0.95 * bump(t, 0.22, 0.11) + 0.75 * bump(t, 0.78, 0.07);
  const jumpHip = (t) => ({ y: -Lt * (1 - Math.cos(crouch(t) * 0.9)) * 1.4 + 0.22 * H * air(t), x: 0, yaw: 0, roll: 0 });
  clips.push(make('jump', 1.4, {
    hipsPos: (t) => [0, jumpHip(t).y, 0],
    spine: (t) => [0.4 * crouch(t), 0, 0],
    neck: (t) => [-0.3 * crouch(t), 0, 0],
    upperArm_L: (t) => [0.8 * crouch(t) - 2.5 * bump(t, 0.5, 0.12), 0, 0.15 * bump(t, 0.5, 0.12)],
    upperArm_R: (t) => [0.8 * crouch(t) - 2.5 * bump(t, 0.5, 0.12), 0, -0.15 * bump(t, 0.5, 0.12)],
    lowerArm_L: (t) => [-0.3 - 0.4 * crouch(t), 0, 0],
    lowerArm_R: (t) => [-0.3 - 0.4 * crouch(t), 0, 0],
    ...symLegs((ph) => ({ z: 0.03 * H * air(ph), y: ankleY + 0.1 * H * air(ph), pitch: 0.45 * air(ph), toe: 0 }), jumpHip),
  }, 72));

  // ---------------- sit (one-shot) ----------------
  const sp = (t) => sm(t / 0.85);
  const sitDrop = Lt * (1 - Math.cos(1.52)) * 0.98;
  clips.push(make('sit', 1.3, {
    hipsPos: (t) => [0, -sitDrop * sp(t), -0.03 * H * sp(t)],
    spine: (t) => [-0.04 * sp(t) + 0.14 * Math.sin(Math.PI * Math.min(1, t / 0.85)), 0, 0],
    neck: (t) => [0.04 * sp(t), 0, 0],
    upperArm_L: (t) => [-0.3 * sp(t), 0, -0.22 * sp(t)],
    upperArm_R: (t) => [-0.3 * sp(t), 0, 0.22 * sp(t)],
    lowerArm_L: (t) => [-0.85 * sp(t), -0.35 * sp(t), 0],
    lowerArm_R: (t) => [-0.85 * sp(t), 0.35 * sp(t), 0],
    hand_R: (t) => [1.25 * sp(t), 0, 0], // held items lie forward over the lap instead of through it
    upperLeg_L: (t) => [-1.52 * sp(t), 0, 0],
    upperLeg_R: (t) => [-1.52 * sp(t), 0, 0],
    lowerLeg_L: (t) => [1.52 * sp(t), 0, 0],
    lowerLeg_R: (t) => [1.52 * sp(t), 0, 0],
    blink: blinks(0.9),
  }));

  // ---------------- typing (seated) ----------------
  const seated = { upperLeg_L: () => [-1.52, 0, 0], upperLeg_R: () => [-1.52, 0, 0], lowerLeg_L: () => [1.52, 0, 0], lowerLeg_R: () => [1.52, 0, 0] };
  clips.push(make('typing', 2, {
    hipsPos: () => [0, -sitDrop, -0.03 * H],
    spine: (t) => [0.1 + 0.01 * Math.sin(TAU * t), 0, 0],
    chest: () => [0.04, 0, 0],
    neck: (t) => [0.18 + 0.02 * Math.sin(TAU * t * 0.5), 0.06 * Math.sin(TAU * t * 0.5), 0],
    upperArm_L: () => [-0.45, -0.1, 0.1],
    upperArm_R: () => [-0.45, 0.1, -0.1],
    lowerArm_L: () => [-1.15, -0.35, 0],
    lowerArm_R: () => [-1.15, 0.35, 0],
    hand_L: (t) => [0.25 + 0.12 * Math.max(0, Math.sin(TAU * t * 6)), 0, -1.3],
    hand_R: (t) => [0.25 + 0.12 * Math.max(0, Math.sin(TAU * t * 6 + 2)), 0, 1.3],
    ...seated,
    blink: blinks(0.35, 0.8),
  }, 96));

  // ---------------- clap (IK: the palms really meet) ----------------
  clips.push(buildClap(rig, P, make, blinks));

  // ---------------- dance ----------------
  const danceHip = (t) => ({ y: -0.03 * H * (0.6 + 0.4 * Math.cos(TAU * 2 * t)), x: 0.05 * H * Math.sin(TAU * t), yaw: 0.15 * Math.sin(TAU * t), roll: 0.08 * Math.sin(TAU * t) });
  clips.push(make('dance', 1.0, {
    hipsPos: (t) => [danceHip(t).x, danceHip(t).y, 0],
    hips: (t) => [0, danceHip(t).yaw, danceHip(t).roll],
    spine: (t) => [0.05, -0.12 * Math.sin(TAU * t), -0.14 * Math.sin(TAU * t)],
    chest: (t) => [0, -0.1 * Math.sin(TAU * t), 0],
    neck: (t) => [0.06 * Math.sin(TAU * 2 * t), 0.15 * Math.sin(TAU * t), 0.08 * Math.sin(TAU * t)],
    upperArm_L: (t) => [-0.4 - 0.3 * Math.sin(TAU * t), 0, 1.4 + 0.4 * Math.sin(TAU * t)],
    upperArm_R: (t) => [-0.4 + 0.3 * Math.sin(TAU * t), 0, -1.4 + 0.4 * Math.sin(TAU * t)],
    lowerArm_L: (t) => [-1.0 - 0.4 * Math.sin(TAU * 2 * t), 0, 0],
    lowerArm_R: (t) => [-1.0 + 0.4 * Math.sin(TAU * 2 * t), 0, 0],
    ...stand(danceHip),
  }));
  return clips;
}

/** Clap: solve arm angles numerically on the actual skeleton so the palms touch at the contact frames. */
function buildClap(rig, P, make, blinks) {
  const H = P.H;
  const TAU = Math.PI * 2;
  const b = (n) => rig.get(n);
  const bones = ['upperArm_L', 'upperArm_R', 'lowerArm_L', 'lowerArm_R', 'hand_L', 'hand_R'].map(b);
  const saved = bones.map((x) => x.quaternion.clone());
  const root = b('hips').parent ?? b('hips');
  const palm = new THREE.Vector3(0, -0.04 * H, 0);
  const pL = new THREE.Vector3();
  const pR = new THREE.Vector3();
  const pose = (inward, lift) => {
    // upper arms forward & slightly in, elbows ~100°, forearms swung inward by `inward`
    const e = new THREE.Euler();
    const set = (bone, x, y, z) => bone.quaternion.setFromEuler(e.set(x, y, z));
    set(b('upperArm_L'), -0.5 - lift, -inward, -0.12);
    set(b('upperArm_R'), -0.5 - lift, inward, 0.12);
    set(b('lowerArm_L'), -1.75, 0, 0);
    set(b('lowerArm_R'), -1.75, 0, 0);
    set(b('hand_L'), -0.15, 0, 0);
    set(b('hand_R'), -0.15, 0, 0);
    root.updateMatrixWorld(true);
    pL.copy(palm).applyMatrix4(b('hand_L').matrixWorld);
    pR.copy(palm).applyMatrix4(b('hand_R').matrixWorld);
    return pL.x - pR.x; // gap between the palms' centres (left hand is on +X)
  };
  // find the inward rotation where the palm centres are one palm-thickness apart
  const touch = 0.017 * H;
  let lo = 0;
  let hi = 1.4;
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2;
    if (pose(m, 0) > touch) lo = m;
    else hi = m;
  }
  const inContact = (lo + hi) / 2;
  bones.forEach((x, i) => x.quaternion.copy(saved[i]));
  root.updateMatrixWorld(true);
  const open = 0.32; // radians the forearms swing apart between claps
  // contact at t = 0 and 0.5 (twice a second), fast close, slower open
  const sep = (t) => {
    const ph = (t * 2) % 1;
    return ph < 0.65 ? Math.sin((ph / 0.65) * Math.PI * 0.5) : Math.cos(((ph - 0.65) / 0.35) * Math.PI * 0.5);
  };
  const sepS = (t) => sep(t) ** 1.4;
  return make('clap', 1.0, {
    hipsPos: (t) => [0, -0.004 * H - 0.002 * H * Math.cos(TAU * 2 * t), 0],
    spine: () => [0.02, 0, 0],
    chest: (t) => [0.012 * Math.cos(TAU * 2 * t), 0, 0], // little bounce
    neck: (t) => [0.05 + 0.02 * Math.cos(TAU * 2 * t), 0, 0],
    upperArm_L: (t) => [-0.5 - 0.03 * sepS(t), -(inContact - open * sepS(t)), -0.12],
    upperArm_R: (t) => [-0.5 - 0.03 * sepS(t), inContact - open * sepS(t), 0.12],
    lowerArm_L: () => [-1.75, 0, 0],
    lowerArm_R: () => [-1.75, 0, 0],
    hand_L: (t) => [-0.15, 0, 0.18 * sepS(t)], // wrist follow-through
    hand_R: (t) => [-0.15, 0, -0.18 * sepS(t)],
    blink: blinks(0.6),
  }, 64);
}
