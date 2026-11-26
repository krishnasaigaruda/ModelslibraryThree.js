import * as THREE from 'three';

/*
 * Vehicle (and street) lamps that are clearly visible both OFF and ON.
 *
 * A lamp group = one shared lens material + one shared glow material, so a single
 * animation track lights every lamp of the group (e.g. both tail lights).
 *
 *   const tail = lampGroup('taillights', 'tail');
 *   tail.add(body, { at: [x, y, z], normal: [-1, 0, 0], w: 0.3, h: 0.08 });
 *   tail.add(body, { at: [x, y, -z], normal: [-1, 0, 0], w: 0.3, h: 0.08 });
 *   // first lens mesh is named 'taillights', first glow 'taillights_glow'
 *   lampTracks('taillights', 3)  → tracks for vehicleAnimations / clip()
 *
 * Each lamp = dark bezel (housing) + glossy coloured lens + additive glow card
 * facing along `normal` (invisible when off, so it costs nothing visually).
 * The glow card is a plain mesh (not a Sprite) so it exports to .glb.
 */

export const LAMP_KINDS = {
  //            lens off color, emissive color, off intensity, glow color, lens opacity
  head:    { lens: '#e9eef2', emissive: '#fff6e6', off: 0.12, glow: '#fff3dd', clear: true },
  drl:     { lens: '#eef3f6', emissive: '#f4fbff', off: 0.35, glow: '#eaf6ff', clear: true },
  tail:    { lens: '#7a0a0c', emissive: '#ff0800', off: 0.35, glow: '#ff2a1a' },
  brake:   { lens: '#8a080a', emissive: '#ff0400', off: 0.25, glow: '#ff2010' },
  signal:  { lens: '#e89a1c', emissive: '#ff5200', off: 0.2, glow: '#ffa21a' },
  reverse: { lens: '#f4f4f2', emissive: '#ffffff', off: 0.05, glow: '#ffffff', clear: true },
  fog:     { lens: '#f2f0e0', emissive: '#fff8d0', off: 0.08, glow: '#fff4c0', clear: true },
  red:     { lens: '#9a0c14', emissive: '#ff0010', off: 0.25, glow: '#ff2030' },
  blue:    { lens: '#1a3cd0', emissive: '#0a30ff', off: 0.25, glow: '#3060ff' },
  amber:   { lens: '#e89a1c', emissive: '#ff8000', off: 0.25, glow: '#ffb020' },
  white:   { lens: '#f4f4f4', emissive: '#ffffff', off: 0.1, glow: '#ffffff', clear: true },
  green:   { lens: '#20a040', emissive: '#00ff40', off: 0.2, glow: '#40ff70' },
};

/** Intensity values the standard animations use when a lamp is ON. */
export const LAMP_ON = { head: 4, drl: 2, tail: 1.4, brake: 2.6, signal: 2.4, reverse: 3, fog: 3, red: 2.6, blue: 3, amber: 2.4, white: 4, green: 2.4 };

let glowTexture = null;
function getGlowTexture() {
  if (glowTexture || typeof document === 'undefined') return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

export function lensMaterial(kind) {
  const k = LAMP_KINDS[kind] ?? LAMP_KINDS.white;
  return new THREE.MeshPhysicalMaterial({
    color: k.lens,
    emissive: k.emissive,
    emissiveIntensity: k.off,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    // coloured lamps skip tone mapping so a lit red stays red instead of washing out to pink
    toneMapped: !!k.clear,
    name: `lamp_${kind}`,
  });
}

export function glowMaterial(kind) {
  const k = LAMP_KINDS[kind] ?? LAMP_KINDS.white;
  return new THREE.MeshBasicMaterial({
    color: k.glow,
    map: getGlowTexture(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    name: `glow_${kind}`,
  });
}

const bezelMat = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.35, metalness: 0.6, name: 'lamp_bezel' });
const _z = new THREE.Vector3(0, 0, 1);

/** Rounded-rect / round outline as a THREE.Shape centred on origin. */
function lampShape(w, h, shape) {
  const s = new THREE.Shape();
  if (shape === 'round') {
    s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2);
    return s;
  }
  const r = Math.min(w, h) * (shape === 'strip' ? 0.5 : 0.28);
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function domedLens(w, h, depth, shape) {
  const geo = new THREE.ExtrudeGeometry(lampShape(w, h, shape), {
    depth: depth * 0.4,
    bevelEnabled: true,
    bevelThickness: depth * 0.6,
    bevelSize: Math.min(w, h) * 0.12,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.computeVertexNormals();
  return geo;
}

/**
 * Create a lamp group. `name` is the animation target name ('taillights', 'indicator_L', …).
 * Returns { name, kind, lens, glow, meshes, add(parent, opts) }.
 */
export function lampGroup(name, kind, { lens, glow } = {}) {
  const grp = { name, kind, lens: lens ?? lensMaterial(kind), glow: glow ?? glowMaterial(kind), meshes: [] };
  let n = 0;
  /**
   * add(parent, { at:[x,y,z], normal:[x,y,z], w, h, depth, shape:'rect'|'round'|'strip', bezel:true,
   *               glowSize, geometry (custom lens geometry, already in place → only material/glow applied), up })
   */
  grp.add = (parent, { at = [0, 0, 0], normal = [0, 0, 1], w = 0.1, h = 0.06, depth = 0.02, shape = 'rect', bezel = true, glowSize, geometry, roll = 0 } = {}) => {
    const nrm = new THREE.Vector3(...normal).normalize();
    const suffix = n ? `_${n}` : '';
    const gs = glowSize ?? Math.max(w, h) * 2.6 + 0.1;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(gs, gs * Math.min(1, (h + 0.12) / (w + 0.12)) * 1.4), grp.glow);
    card.name = `${name}_glow${suffix}`;
    card.renderOrder = 10;
    card.userData.noShadow = true;
    let lensMesh;
    if (geometry) {
      // custom lens geometry already positioned in parent space
      lensMesh = new THREE.Mesh(geometry, grp.lens);
      parent.add(lensMesh);
      geometry.computeBoundingBox();
      card.position.copy(geometry.boundingBox.getCenter(new THREE.Vector3())).addScaledVector(nrm, depth + 0.012);
      card.quaternion.setFromUnitVectors(_z, nrm);
      parent.add(card);
    } else {
      const holder = new THREE.Group();
      holder.name = `${name}_lamp${suffix}`;
      holder.position.set(...at);
      holder.quaternion.setFromUnitVectors(_z, nrm);
      if (roll) holder.rotateZ(roll);
      parent.add(holder);
      if (bezel) {
        const b = new THREE.Mesh(domedLens(w + 0.035, h + 0.035, depth * 0.6, shape), bezelMat);
        b.position.z = -depth * 0.35;
        b.name = `${name}_bezel${suffix}`;
        holder.add(b);
      }
      lensMesh = new THREE.Mesh(domedLens(w, h, depth, shape), grp.lens);
      holder.add(lensMesh);
      card.position.z = depth + 0.012;
      holder.add(card);
    }
    lensMesh.name = `${name}${suffix}`;
    grp.meshes.push(lensMesh);
    n++;
    return lensMesh;
  };
  return grp;
}

/**
 * Animation tracks that switch a lamp group on (constant) or blink it.
 *   lampTracks('taillights', 2.5)              → steady on
 *   lampTracks('indicator_L', 7, { blink: 1 }) → blink once per second
 * `glow` = max glow opacity (0..1).
 */
export function lampTracks(name, intensity, { blink = 0, glow = 0.9, off = 0 } = {}) {
  if (blink) {
    const p = 1 / blink;
    return [
      new THREE.NumberKeyframeTrack(`${name}.material.emissiveIntensity`, [0, p / 2, p], [intensity, off, off], THREE.InterpolateDiscrete),
      new THREE.NumberKeyframeTrack(`${name}_glow.material.opacity`, [0, p / 2, p], [glow, 0, 0], THREE.InterpolateDiscrete),
    ];
  }
  return [
    new THREE.NumberKeyframeTrack(`${name}.material.emissiveIntensity`, [0, 1], [intensity, intensity]),
    new THREE.NumberKeyframeTrack(`${name}_glow.material.opacity`, [0, 1], [glow, glow]),
  ];
}
