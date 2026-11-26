"""Procedural PBR materials (our own node setups) that get baked to textures for glTF.

mat(name, kind, **params) returns a bpy material. Each procedural graph produces
color / roughness / height; the shared tail wires Principled BSDF + bump. The bake
step (lib/bake.py) renders those into images and swaps in a glTF-friendly material.

Naming: put 'paint' / 'primary' in the name for parts the `color` option recolors,
'secondary' / 'fabric' for `secondaryColor`. Recolourable materials ('tint': True)
bake a neutral (white-ish) detail map and keep the real color as baseColorFactor.
"""
import bpy, json, math, colorsys

def hexrgb(h):
    if not isinstance(h, str):
        return tuple(h)
    h = h.lstrip('#')
    s = tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in s)  # sRGB → linear

class G:
    """Tiny node-graph builder."""
    def __init__(self, m):
        self.nt = m.node_tree
        self.n = self.nt.nodes
        self.l = self.nt.links
        self.x = -1400
    def node(self, t, **kw):
        nd = self.n.new(t)
        nd.location = (self.x, len(self.n) * -40 % 800)
        self.x += 60
        for k, v in kw.items():
            if k.startswith('i_'):
                nd.inputs[k[2:].replace('_', ' ')].default_value = v
            else:
                setattr(nd, k, v)
        return nd
    def link(self, a, b):
        self.l.new(a, b)
        return b
    def coord(self, scale=1.0, kind='Object', stretch=(1, 1, 1)):
        tc = self.node('ShaderNodeTexCoord')
        mp = self.node('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (scale * stretch[0], scale * stretch[1], scale * stretch[2])
        self.link(tc.outputs[kind], mp.inputs['Vector'])
        return mp.outputs['Vector']
    def noise(self, vec, scale, detail=6, rough=0.55, dist=0.0, dims='3D'):
        nz = self.node('ShaderNodeTexNoise', noise_dimensions=dims)
        nz.inputs['Scale'].default_value = scale
        nz.inputs['Detail'].default_value = detail
        nz.inputs['Roughness'].default_value = rough
        nz.inputs['Distortion'].default_value = dist
        self.link(vec, nz.inputs['Vector'])
        return nz
    def voronoi(self, vec, scale, feature='F1', metric='EUCLIDEAN', rand=1.0):
        v = self.node('ShaderNodeTexVoronoi', feature=feature, distance=metric)
        v.inputs['Scale'].default_value = scale
        v.inputs['Randomness'].default_value = rand
        self.link(vec, v.inputs['Vector'])
        return v
    def wave(self, vec, scale, kind='BANDS', direction='X', dist=4.0, detail=3.0, profile='SIN'):
        w = self.node('ShaderNodeTexWave', wave_type=kind, bands_direction=direction, wave_profile=profile)
        w.inputs['Scale'].default_value = scale
        w.inputs['Distortion'].default_value = dist
        w.inputs['Detail'].default_value = detail
        self.link(vec, w.inputs['Vector'])
        return w
    def ramp(self, fac, stops):
        r = self.node('ShaderNodeValToRGB')
        cr = r.color_ramp
        while len(cr.elements) < len(stops):
            cr.elements.new(0.5)
        for el, (p, c) in zip(cr.elements, stops):
            el.position = p
            el.color = (*c, 1) if len(c) == 3 else c
        self.link(fac, r.inputs['Fac'])
        return r.outputs['Color']
    def math(self, op, a, b=None, clamp=False):
        m = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        for i, v in enumerate([a, b]):
            if v is None: continue
            if isinstance(v, (int, float)): m.inputs[i].default_value = v
            else: self.link(v, m.inputs[i])
        return m.outputs[0]
    def mix(self, fac, a, b, blend='MIX'):
        m = self.node('ShaderNodeMix', data_type='RGBA', blend_type=blend)
        for sock, v in [(m.inputs[0], fac), (m.inputs[6], a), (m.inputs[7], b)]:
            if isinstance(v, (int, float)): sock.default_value = v
            elif isinstance(v, tuple): sock.default_value = (*v, 1) if len(v) == 3 else v
            else: self.link(v, sock)
        return m.outputs[2]
    def rgb(self, c):
        n = self.node('ShaderNodeRGB')
        n.outputs[0].default_value = (*c, 1)
        return n.outputs[0]
    def value(self, v):
        n = self.node('ShaderNodeValue')
        n.outputs[0].default_value = v
        return n.outputs[0]
    def bw(self, col):
        n = self.node('ShaderNodeRGBToBW')
        self.link(col, n.inputs[0])
        return n.outputs[0]

def _shade(c, k):
    """Scale a linear color brightness."""
    return tuple(min(1, max(0, x * k)) for x in c)

# ------------------------------------------------------------------ procedural kinds
# each returns (color_socket, roughness_socket_or_float, height_socket_or_None)

def k_wood(g, p):
    """Flat-sawn timber: cathedral growth rings + fine pore streaks along the grain + soft colour drift."""
    base = hexrgb(p.get('color', '#9a6a3f'))
    axis = p.get('axis', 'X')
    st = {'X': (0.08, 1, 1), 'Y': (1, 0.08, 1), 'Z': (1, 1, 0.08)}[axis]
    st2 = {'X': (0.02, 1, 1), 'Y': (1, 0.02, 1), 'Z': (1, 1, 0.02)}[axis]
    vec = g.coord(1.0, stretch=st)
    rings = g.wave(vec, p.get('ring', 6.0) * 1.8, kind='RINGS', dist=5.0, detail=3.0, profile='SAW')
    pores = g.noise(g.coord(1.0, stretch=st2), 260, detail=2, rough=0.5)
    streak = g.noise(g.coord(1.0, stretch=st2), 40, detail=3, rough=0.55)
    drift = g.noise(vec, 2.5, detail=2)
    f = g.math('MULTIPLY', g.math('POWER', rings.outputs['Fac'], 1.6), 0.5)
    f = g.math('ADD', f, g.math('MULTIPLY', streak.outputs['Fac'], 0.3))
    f = g.math('ADD', f, g.math('MULTIPLY', pores.outputs['Fac'], 0.15))
    f = g.math('ADD', f, g.math('MULTIPLY', drift.outputs['Fac'], 0.2))
    col = g.ramp(f, [(0.2, _shade(base, 1.18)), (0.5, base), (0.8, _shade(base, 0.66))])
    rough = g.math('ADD', g.math('MULTIPLY', pores.outputs['Fac'], p.get('rough_var', 0.2)), p.get('rough', 0.38))
    h = g.math('ADD', g.math('MULTIPLY', rings.outputs['Fac'], 0.3), g.math('MULTIPLY', pores.outputs['Fac'], 0.7))
    return col, rough, h

def k_fabric(g, p):
    """Upholstery: heathered threads + soft mottling (no periodic weave → no moiré at 1K)."""
    base = hexrgb(p.get('color', '#7b8794')) if not p.get('tint') else (0.92, 0.92, 0.92)
    v = g.coord(1.0)
    threads = g.noise(g.coord(1.0, stretch=(0.15, 1, 1)), 140, detail=3, rough=0.6)
    threads2 = g.noise(g.coord(1.0, stretch=(1, 0.15, 0.15)), 140, detail=3, rough=0.6)
    fuzz = g.noise(v, 260, detail=4, rough=0.7)
    mott = g.noise(v, 5, detail=4)
    heather = g.math('MULTIPLY', g.math('ADD', threads.outputs['Fac'], threads2.outputs['Fac']), 0.5)
    f = g.math('ADD', g.math('MULTIPLY', heather, 0.45), g.math('MULTIPLY', fuzz.outputs['Fac'], 0.25))
    f = g.math('ADD', f, g.math('MULTIPLY', mott.outputs['Fac'], 0.3))
    col = g.ramp(f, [(0.3, _shade(base, 0.8)), (0.7, _shade(base, 1.04))])
    h = g.math('ADD', g.math('MULTIPLY', heather, 0.6), g.math('MULTIPLY', fuzz.outputs['Fac'], 0.4))
    if p.get('boucle'):
        loops = g.voronoi(v, 160, feature='F1')
        h = g.math('ADD', g.math('MULTIPLY', h, 0.4), g.math('MULTIPLY', g.math('SUBTRACT', 1, loops.outputs['Distance']), 0.8))
        col = g.ramp(g.math('ADD', g.math('MULTIPLY', f, 0.6), g.math('MULTIPLY', loops.outputs['Distance'], 0.4)), [(0.3, _shade(base, 0.82)), (0.7, _shade(base, 1.04))])
    return col, g.math('ADD', g.math('MULTIPLY', f, 0.08), 0.88), h

def k_leather(g, p):
    base = hexrgb(p.get('color', '#5a3420')) if not p.get('tint') else (0.92, 0.92, 0.92)
    v = g.coord(1.0)
    cells = g.voronoi(v, p.get('grain', 120.0), feature='DISTANCE_TO_EDGE')
    mott = g.noise(v, 5, detail=5)
    crease = g.math('POWER', g.math('SUBTRACT', 1, cells.outputs['Distance'], clamp=True), 8)
    f = g.math('ADD', g.math('MULTIPLY', mott.outputs['Fac'], 0.5), g.math('MULTIPLY', crease, -0.25))
    col = g.ramp(f, [(0.2, _shade(base, 0.6)), (0.6, base), (0.9, _shade(base, 1.25))])
    rough = g.math('ADD', g.math('MULTIPLY', mott.outputs['Fac'], 0.2), p.get('rough', 0.38))
    return col, rough, g.math('MULTIPLY', cells.outputs['Distance'], 1.0)

def k_metal(g, p):
    """Brushed / satin metal. brushed axis via 'axis'."""
    base = hexrgb(p.get('color', '#b8bcc2'))
    axis = p.get('axis', 'Z')
    st = {'X': (0.02, 1, 1), 'Y': (1, 0.02, 1), 'Z': (1, 1, 0.02)}[axis]
    br = g.noise(g.coord(1.0, stretch=st), 600, detail=2, rough=0.5)
    sm = g.noise(g.coord(1.0), 8, detail=4)
    f = g.math('ADD', g.math('MULTIPLY', br.outputs['Fac'], 0.6), g.math('MULTIPLY', sm.outputs['Fac'], 0.4))
    col = g.ramp(f, [(0.3, _shade(base, 0.85)), (0.7, _shade(base, 1.08))])
    rough = g.math('ADD', g.math('MULTIPLY', f, 0.15), p.get('rough', 0.3))
    return col, rough, g.math('MULTIPLY', br.outputs['Fac'], 0.3)

def k_painted_metal(g, p):
    """Painted steel with chipped edges / rust spots (street furniture)."""
    paint = hexrgb(p.get('color', '#2d5a3a')) if not p.get('tint') else (0.9, 0.9, 0.9)
    v = g.coord(1.0)
    wear = g.noise(v, p.get('wear_scale', 9.0), detail=8, rough=0.65)
    ao = g.node('ShaderNodeAmbientOcclusion', samples=8, inside=False)
    ao.inputs['Distance'].default_value = 0.05
    # edges: inverse AO with "inside" gives convex edges; approximate with pointiness-free trick
    edge = g.node('ShaderNodeAmbientOcclusion', samples=8, inside=True)
    edge.inputs['Distance'].default_value = 0.02
    edgef = g.math('SUBTRACT', 1, edge.outputs['AO'], clamp=True)
    amt = p.get('wear', 0.35)
    m = g.math('GREATER_THAN', g.math('ADD', g.math('MULTIPLY', wear.outputs['Fac'], 0.9), g.math('MULTIPLY', edgef, amt * 1.4)), 0.92 - amt * 0.25)
    rust = g.ramp(g.noise(v, 40, detail=6).outputs['Fac'], [(0.3, hexrgb('#5a2a12')), (0.7, hexrgb('#9a4e22'))])
    pc = g.mix(g.math('MULTIPLY', g.noise(v, 3, detail=3).outputs['Fac'], 0.25), paint, _shade(paint, 0.75))
    col = g.mix(m, pc, rust)
    rough = g.math('ADD', g.math('MULTIPLY', m, 0.45), p.get('rough', 0.45))
    h = g.math('MULTIPLY', m, -0.4)
    return col, rough, h

def k_ceramic(g, p):
    base = hexrgb(p.get('color', '#f1ede4')) if not p.get('tint') else (0.95, 0.95, 0.95)
    v = g.coord(1.0)
    n = g.noise(v, 30, detail=4)
    col = g.ramp(n.outputs['Fac'], [(0.3, _shade(base, 0.96)), (0.7, _shade(base, 1.02))])
    if p.get('speckle'):
        sp = g.math('GREATER_THAN', g.noise(v, 500, detail=1).outputs['Fac'], 0.72)
        col = g.mix(g.math('MULTIPLY', sp, 0.6), col, _shade(base, 0.35))
    return col, p.get('rough', 0.12), g.math('MULTIPLY', n.outputs['Fac'], 0.05)

def k_stone(g, p):
    """Rock / boulder surface with strata, lichen and cracks."""
    base = hexrgb(p.get('color', '#8a857c'))
    v = g.coord(1.0)
    big = g.noise(v, p.get('scale', 2.2), detail=10, rough=0.62, dist=0.4)
    fine = g.noise(v, 60, detail=6, rough=0.6)
    # sparse hairline fractures: thin voronoi edges, only where a low-frequency mask allows
    cr = g.voronoi(g.noise(v, 1.5, detail=3, dist=1.2).outputs['Color'], p.get('cracks', 4.0) * 0.8, feature='DISTANCE_TO_EDGE')
    mask = g.math('GREATER_THAN', g.noise(v, 1.1, detail=2).outputs['Fac'], 0.62)
    crack = g.math('MULTIPLY', g.math('LESS_THAN', cr.outputs['Distance'], 0.006), mask)
    f = g.math('ADD', g.math('MULTIPLY', big.outputs['Fac'], 0.7), g.math('MULTIPLY', fine.outputs['Fac'], 0.3))
    col = g.ramp(f, [(0.3, _shade(base, 0.55)), (0.5, base), (0.72, _shade(base, 1.3))])
    col = g.mix(g.math('MULTIPLY', crack, 0.45), col, _shade(base, 0.4))
    if p.get('lichen', 0) > 0:
        ln = g.noise(v, 7, detail=6)
        lm = g.math('GREATER_THAN', ln.outputs['Fac'], 1 - p['lichen'] * 0.5)
        col = g.mix(g.math('MULTIPLY', lm, 0.85), col, g.ramp(fine.outputs['Fac'], [(0.3, hexrgb('#5e6a2c')), (0.7, hexrgb('#a8a85a'))]))
    rough = g.math('ADD', g.math('MULTIPLY', fine.outputs['Fac'], 0.15), 0.78)
    h = g.math('SUBTRACT', g.math('ADD', g.math('MULTIPLY', big.outputs['Fac'], 0.6), g.math('MULTIPLY', fine.outputs['Fac'], 0.4)), g.math('MULTIPLY', crack, 0.3))
    return col, rough, h

def k_concrete(g, p):
    base = hexrgb(p.get('color', '#a19d95'))
    v = g.coord(1.0)
    n = g.noise(v, 8, detail=8)
    pores = g.math('GREATER_THAN', g.noise(v, 300, detail=1).outputs['Fac'], 0.68)
    col = g.ramp(n.outputs['Fac'], [(0.3, _shade(base, 0.82)), (0.7, _shade(base, 1.1))])
    col = g.mix(g.math('MULTIPLY', pores, 0.5), col, _shade(base, 0.5))
    return col, 0.88, g.math('SUBTRACT', g.math('MULTIPLY', n.outputs['Fac'], 0.3), g.math('MULTIPLY', pores, 0.3))

def k_bark(g, p):
    base = hexrgb(p.get('color', '#5b4634'))
    v = g.coord(1.0, stretch=(1, 1, 0.18))
    w = g.wave(v, 14, kind='BANDS', direction='X', dist=12, detail=6)
    vr = g.voronoi(g.coord(1.0, stretch=(1, 1, 0.3)), 9, feature='DISTANCE_TO_EDGE')
    f = g.math('MULTIPLY', g.math('ADD', w.outputs['Fac'], vr.outputs['Distance']), 0.6)
    col = g.ramp(f, [(0.1, _shade(base, 0.35)), (0.5, base), (0.9, _shade(base, 1.4))])
    return col, 0.9, f

def k_plastic(g, p):
    base = hexrgb(p.get('color', '#e04020')) if not p.get('tint') else (0.92, 0.92, 0.92)
    n = g.noise(g.coord(1.0), 40, detail=3)
    col = g.ramp(n.outputs['Fac'], [(0.3, _shade(base, 0.95)), (0.7, _shade(base, 1.03))])
    return col, g.math('ADD', g.math('MULTIPLY', n.outputs['Fac'], 0.1), p.get('rough', 0.4)), g.math('MULTIPLY', n.outputs['Fac'], 0.04)

def k_rubber(g, p):
    base = hexrgb(p.get('color', '#1b1b1b'))
    n = g.noise(g.coord(1.0), 200, detail=3)
    col = g.ramp(n.outputs['Fac'], [(0.3, _shade(base, 0.85)), (0.7, _shade(base, 1.15))])
    return col, 0.9, g.math('MULTIPLY', n.outputs['Fac'], 0.1)

def k_marble(g, p):
    """Carrara-like marble: soft grey clouding + thin branching veins of varying strength."""
    base = hexrgb(p.get('color', '#efece6'))
    vein = hexrgb(p.get('vein', '#6f6a66'))
    v = g.coord(1.0)
    warp = g.noise(v, 1.6, detail=6, rough=0.6, dist=1.5)
    w1 = g.wave(warp.outputs['Color'], 1.3, kind='BANDS', direction='DIAGONAL', dist=9, detail=7, profile='SIN')
    w2 = g.wave(v, 3.5, kind='BANDS', direction='Y', dist=16, detail=8, profile='SIN')
    v1 = g.math('POWER', g.math('SUBTRACT', 1, g.math('ABSOLUTE', g.math('SUBTRACT', g.math('MULTIPLY', w1.outputs['Fac'], 2), 1)), clamp=True), 14)
    v2 = g.math('POWER', g.math('SUBTRACT', 1, g.math('ABSOLUTE', g.math('SUBTRACT', g.math('MULTIPLY', w2.outputs['Fac'], 2), 1)), clamp=True), 30)
    cloud = g.noise(v, 4, detail=6)
    strength = g.noise(v, 2, detail=2)
    vm = g.math('MULTIPLY', g.math('ADD', g.math('MULTIPLY', v1, 0.8), g.math('MULTIPLY', v2, 0.4)), g.math('ADD', strength.outputs['Fac'], 0.2), clamp=True)
    col = g.ramp(cloud.outputs['Fac'], [(0.35, _shade(base, 0.9)), (0.65, base)])
    col = g.mix(vm, col, vein)
    return col, 0.1, None

def k_flat(g, p):
    """Plain colour with micro noise (paint, glass etc. — not baked)."""
    return g.rgb(hexrgb(p.get('color', '#cccccc'))), p.get('rough', 0.5), None

def k_foliage(g, p):
    base = hexrgb(p.get('color', '#3f6b2a'))
    v = g.coord(1.0)
    n = g.noise(v, 18, detail=4)
    vein = g.wave(v, 60, kind='BANDS', direction='X', dist=2)
    col = g.ramp(g.math('ADD', g.math('MULTIPLY', n.outputs['Fac'], 0.8), g.math('MULTIPLY', vein.outputs['Fac'], 0.2)),
                 [(0.25, _shade(base, 0.6)), (0.55, base), (0.85, _shade(base, 1.35))])
    return col, 0.55, g.math('MULTIPLY', vein.outputs['Fac'], 0.2)

def k_soil(g, p):
    base = hexrgb(p.get('color', '#3b2a1e'))
    v = g.coord(1.0)
    n = g.noise(v, 50, detail=8, rough=0.7)
    peb = g.voronoi(v, 80)
    f = g.math('ADD', g.math('MULTIPLY', n.outputs['Fac'], 0.7), g.math('MULTIPLY', peb.outputs['Distance'], 0.3))
    col = g.ramp(f, [(0.3, _shade(base, 0.6)), (0.7, _shade(base, 1.4))])
    return col, 0.95, f

def k_rug(g, p):
    """Woven rug: border bands + field pattern from Generated (0..1) coords, wool fuzz."""
    c1, c2, c3 = (hexrgb(c) for c in (p.get('colors') or ['#7a1f24', '#e3d6bd', '#1f3550']))
    tc = g.node('ShaderNodeTexCoord')
    sep = g.node('ShaderNodeSeparateXYZ'); g.link(tc.outputs['Generated'], sep.inputs[0])
    x, y = sep.outputs['X'], sep.outputs['Y']
    ex = g.math('MINIMUM', x, g.math('SUBTRACT', 1, x))
    ey = g.math('MINIMUM', y, g.math('SUBTRACT', 1, y))
    ar = p.get('aspect', 1.5)
    edge = g.math('MINIMUM', g.math('MULTIPLY', ex, ar), ey)   # distance to edge, roughly isotropic
    pat = p.get('pattern', 'persian')
    fuzz = g.noise(g.coord(1.0), 300, detail=3, rough=0.7)
    if pat == 'persian':
        b1 = g.math('LESS_THAN', edge, 0.03); b2 = g.math('LESS_THAN', edge, 0.09); b3 = g.math('LESS_THAN', edge, 0.11)
        dx = g.math('ABSOLUTE', g.math('SUBTRACT', x, 0.5)); dy = g.math('ABSOLUTE', g.math('SUBTRACT', y, 0.5))
        diamond = g.math('ADD', g.math('MULTIPLY', dx, ar), dy)
        med = g.math('LESS_THAN', diamond, 0.22)
        medr = g.math('LESS_THAN', diamond, 0.25)
        rep = g.math('GREATER_THAN', g.math('SINE', g.math('MULTIPLY', g.math('ADD', g.math('MULTIPLY', x, 40 * ar), g.math('MULTIPLY', y, 40)), 1)), 0.6)
        col = g.mix(rep, c1, _shade(c1, 0.75))
        col = g.mix(medr, col, c2); col = g.mix(med, col, c3)
        col = g.mix(b3, col, c2); col = g.mix(b2, col, c3); col = g.mix(b1, col, c1)
    elif pat == 'kilim':
        band = g.math('FRACT', g.math('MULTIPLY', y, 9))
        zig = g.math('ABSOLUTE', g.math('SUBTRACT', g.math('FRACT', g.math('MULTIPLY', x, 14 * ar)), 0.5))
        z1 = g.math('LESS_THAN', g.math('ABSOLUTE', g.math('SUBTRACT', band, 0.5)), g.math('MULTIPLY', zig, 0.6))
        col = g.mix(z1, c2, c1)
        alt = g.math('GREATER_THAN', g.math('FRACT', g.math('MULTIPLY', y, 4.5)), 0.5)
        col = g.mix(g.math('MULTIPLY', alt, g.math('LESS_THAN', band, 0.12)), col, c3)
        col = g.mix(g.math('LESS_THAN', edge, 0.025), col, c3)
    else:  # modern: soft abstract blobs + plain border
        n = g.noise(g.coord(1.0), 1.2, detail=2, dist=0.6)
        col = g.ramp(n.outputs['Fac'], [(0.42, c1), (0.5, c2), (0.6, c3)])
        col = g.mix(g.math('LESS_THAN', edge, 0.02), col, _shade(c2, 0.8))
    col = g.mix(g.math('MULTIPLY', fuzz.outputs['Fac'], 0.35), col, _shade((0.5, 0.5, 0.5), 0.6), 'MULTIPLY') if False else col
    col = g.mix(0.25, col, g.ramp(fuzz.outputs['Fac'], [(0.3, (0.55, 0.55, 0.55)), (0.7, (1, 1, 1))]), 'MULTIPLY')
    return col, 0.95, fuzz.outputs['Fac']

def k_endgrain(g, p):
    """Cut log / stump face: growth rings around Z axis + radial checks."""
    base = hexrgb(p.get('color', '#c79a64'))
    v = g.coord(1.0)
    rings = g.wave(v, p.get('ring', 22.0), kind='RINGS', dist=1.5, detail=3, profile='SIN')
    n = g.noise(v, 30, detail=4)
    f = g.math('ADD', g.math('MULTIPLY', rings.outputs['Fac'], 0.7), g.math('MULTIPLY', n.outputs['Fac'], 0.3))
    col = g.ramp(f, [(0.2, _shade(base, 0.62)), (0.6, base), (0.9, _shade(base, 1.15))])
    return col, 0.8, f

def k_spots(g, p):
    """Mushroom cap with white warts (fly agaric) or plain."""
    base = hexrgb(p.get('color', '#b8231a'))
    v = g.coord(1.0)
    n = g.noise(v, 9, detail=4)
    col = g.ramp(n.outputs['Fac'], [(0.3, _shade(base, 0.75)), (0.7, _shade(base, 1.15))])
    h = g.math('MULTIPLY', n.outputs['Fac'], 0.2)
    if p.get('warts'):
        vr = g.voronoi(v, p.get('wart_scale', 55.0))
        w = g.math('LESS_THAN', vr.outputs['Distance'], 0.22)
        col = g.mix(w, col, hexrgb('#f2eee2'))
        h = g.math('ADD', h, g.math('MULTIPLY', w, 0.6))
    return col, p.get('rough', 0.45), h

def k_grille(g, p):
    """Black honeycomb / mesh grille insert (holes read as dark cavities in the normal + AO)."""
    base = hexrgb(p.get('color', '#141516'))
    v = g.coord(1.0)
    cells = g.voronoi(v, p.get('cells', 70.0), feature='DISTANCE_TO_EDGE', rand=0.0)
    hole = g.math('GREATER_THAN', cells.outputs['Distance'], 0.12)
    col = g.mix(hole, base, _shade(base, 0.25))
    return col, 0.45, g.math('SUBTRACT', 1, hole)

def k_tread(g, p):
    """Tyre rubber with directional tread blocks (around the axle = Y axis) + sidewall texture."""
    base = hexrgb(p.get('color', '#1c1c1d'))
    tc = g.node('ShaderNodeTexCoord')
    sep = g.node('ShaderNodeSeparateXYZ'); g.link(tc.outputs['Object'], sep.inputs[0])
    ang = g.node('ShaderNodeMath', operation='ARCTAN2'); g.link(sep.outputs['Z'], ang.inputs[0]); g.link(sep.outputs['X'], ang.inputs[1])
    blocks = g.math('GREATER_THAN', g.math('SINE', g.math('ADD', g.math('MULTIPLY', ang.outputs[0], p.get('blocks', 36)), g.math('MULTIPLY', g.math('ABSOLUTE', sep.outputs['Y']), 40))), -0.2)
    n = g.noise(g.coord(1.0), 300, detail=2)
    col = g.mix(g.math('MULTIPLY', n.outputs['Fac'], 0.3), base, _shade(base, 1.6))
    return col, 0.88, g.math('ADD', g.math('MULTIPLY', blocks, 0.7), g.math('MULTIPLY', n.outputs['Fac'], 0.3))

def k_shingle(g, p):
    """Asphalt / cedar shingle roof: staggered rows (along X), per-tab colour variation, granules."""
    base = hexrgb(p.get('color', '#4a4642'))
    tc = g.node('ShaderNodeTexCoord')
    sep = g.node('ShaderNodeSeparateXYZ'); g.link(tc.outputs['Object'], sep.inputs[0])
    row_h = p.get('row', 0.14); tab_w = p.get('tab', 0.3)
    along = g.math('ADD', g.math('MULTIPLY', sep.outputs['Z'], 1.0), g.math('MULTIPLY', g.math('ABSOLUTE', sep.outputs['Y']), 0.7))
    row = g.math('FLOOR', g.math('DIVIDE', along, row_h))
    frac = g.math('FRACT', g.math('DIVIDE', along, row_h))
    xs = g.math('ADD', g.math('DIVIDE', sep.outputs['X'], tab_w), g.math('MULTIPLY', row, 0.5))
    tab = g.math('FLOOR', xs)
    edge = g.math('LESS_THAN', g.math('FRACT', xs), 0.04)
    rnd = g.node('ShaderNodeTexWhiteNoise', noise_dimensions='2D')
    cmb = g.node('ShaderNodeCombineXYZ'); g.link(tab, cmb.inputs[0]); g.link(row, cmb.inputs[1]); g.link(cmb.outputs[0], rnd.inputs['Vector'])
    gran = g.noise(g.coord(1.0), 400, detail=2)
    shade = g.math('ADD', g.math('MULTIPLY', rnd.outputs['Value'], 0.5), g.math('MULTIPLY', gran.outputs['Fac'], 0.5))
    col = g.ramp(shade, [(0.2, _shade(base, 0.7)), (0.8, _shade(base, 1.25))])
    groove = g.math('MAXIMUM', edge, g.math('LESS_THAN', frac, 0.08))
    col = g.mix(g.math('MULTIPLY', groove, 0.7), col, _shade(base, 0.3))
    h = g.math('SUBTRACT', frac, g.math('MULTIPLY', groove, 0.6))
    return col, 0.85, h

def k_planks(g, p):
    """Painted / stained vertical boards with grooves between them (siding)."""
    base = hexrgb(p.get('color', '#8c3b2c')) if not p.get('tint') else (0.92, 0.92, 0.92)
    tc = g.node('ShaderNodeTexCoord')
    sep = g.node('ShaderNodeSeparateXYZ'); g.link(tc.outputs['Object'], sep.inputs[0])
    bw = p.get('board', 0.15)
    pos = g.math('ADD', sep.outputs['X'], sep.outputs['Y'])
    groove = g.math('LESS_THAN', g.math('FRACT', g.math('DIVIDE', pos, bw)), 0.06)
    grain = g.noise(g.coord(1.0, stretch=(1, 1, 0.05)), 80, detail=3)
    wear = g.noise(g.coord(1.0), 6, detail=6)
    col = g.ramp(g.math('ADD', g.math('MULTIPLY', grain.outputs['Fac'], 0.5), g.math('MULTIPLY', wear.outputs['Fac'], 0.5)), [(0.3, _shade(base, 0.82)), (0.7, _shade(base, 1.06))])
    col = g.mix(g.math('MULTIPLY', groove, 0.8), col, _shade(base, 0.35))
    return col, 0.7, g.math('SUBTRACT', g.math('MULTIPLY', grain.outputs['Fac'], 0.3), groove)

KINDS = dict(shingle=k_shingle, planks=k_planks, grille=k_grille, tread=k_tread, endgrain=k_endgrain, spots=k_spots, rug=k_rug, wood=k_wood, fabric=k_fabric, leather=k_leather, metal=k_metal, painted_metal=k_painted_metal, ceramic=k_ceramic,
             stone=k_stone, concrete=k_concrete, bark=k_bark, plastic=k_plastic, rubber=k_rubber, marble=k_marble, flat=k_flat,
             foliage=k_foliage, soil=k_soil)
# kinds that are NOT baked (uniform PBR values are enough, or special: glass/emissive/chrome/clearcoat paint)
NO_BAKE = {'flat', 'glass', 'chrome', 'paint', 'emissive', 'mirror'}

_cache = {}

def mat(name, kind='flat', **p):
    """Get-or-create a material. Same name → same material (so parts share it and get joined at bake)."""
    if name in _cache and _cache[name].name in bpy.data.materials:
        return _cache[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (400, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); bsdf.location = (100, 0)
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    spec = dict(kind=kind, **p)
    bake = kind not in NO_BAKE and p.get('bake', True)
    spec['bake'] = bake
    if 'color' in p:
        spec['factor'] = list(hexrgb(p['color']))
    m['spec'] = json.dumps(spec)
    bsdf.inputs['Metallic'].default_value = p.get('metal', 0.0)
    if p.get('sheen'):
        bsdf.inputs['Sheen Weight'].default_value = p['sheen']
    if kind == 'glass':
        bsdf.inputs['Base Color'].default_value = (*hexrgb(p.get('color', '#ffffff')), 1)
        bsdf.inputs['Roughness'].default_value = p.get('rough', 0.02)
        bsdf.inputs['Transmission Weight'].default_value = 1.0
        bsdf.inputs['Alpha'].default_value = p.get('alpha', 0.35)
        bsdf.inputs['IOR'].default_value = 1.45
        m.surface_render_method = 'BLENDED'
    elif kind == 'chrome':
        bsdf.inputs['Base Color'].default_value = (*hexrgb(p.get('color', '#e8e8ea')), 1)
        bsdf.inputs['Metallic'].default_value = 1.0
        bsdf.inputs['Roughness'].default_value = p.get('rough', 0.06)
    elif kind == 'paint':
        bsdf.inputs['Base Color'].default_value = (*hexrgb(p.get('color', '#a01818')), 1)
        bsdf.inputs['Metallic'].default_value = p.get('metal', 0.55)
        bsdf.inputs['Roughness'].default_value = p.get('rough', 0.32)
        bsdf.inputs['Coat Weight'].default_value = 1.0
        bsdf.inputs['Coat Roughness'].default_value = 0.03
    elif kind == 'emissive':
        bsdf.inputs['Base Color'].default_value = (*hexrgb(p.get('color', '#ffffff')), 1)
        bsdf.inputs['Emission Color'].default_value = (*hexrgb(p.get('emit', p.get('color', '#ffffff'))), 1)
        bsdf.inputs['Emission Strength'].default_value = p.get('strength', 0.3)
        bsdf.inputs['Roughness'].default_value = 0.15
    elif kind == 'mirror':
        bsdf.inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1)
        bsdf.inputs['Metallic'].default_value = 1.0
        bsdf.inputs['Roughness'].default_value = 0.0
    else:
        g = G(m)
        col, rough, h = KINDS[kind](g, spec)
        g.link(col, bsdf.inputs['Base Color'])
        if isinstance(rough, (int, float)): bsdf.inputs['Roughness'].default_value = rough
        else: g.link(rough, bsdf.inputs['Roughness'])
        if h is not None:
            bump = g.node('ShaderNodeBump')
            bump.inputs['Strength'].default_value = p.get('bump', 0.35)
            bump.inputs['Distance'].default_value = p.get('bump_dist', 0.002)
            g.link(h, bump.inputs['Height'])
            g.link(bump.outputs['Normal'], bsdf.inputs['Normal'])
        if p.get('emit'):
            bsdf.inputs['Emission Color'].default_value = (*hexrgb(p['emit']), 1)
            bsdf.inputs['Emission Strength'].default_value = p.get('strength', 0.5)
    _cache[name] = m
    return m

def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj

def reset_cache():
    _cache.clear()
