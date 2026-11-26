"""HD nature: rocks & boulders (displaced, baked stone with lichen and cracks), tree stumps,
cut logs, mushrooms. Real displacement in geometry + baked detail normals."""
import math, random
import bmesh
from mathutils import Vector, noise
from lib import core
from lib.mats import mat, assign

def rock_mesh(name, size, seed, rough=0.35, flat=0.0, sub=4, ridge=0.0):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    rnd = random.Random(seed)
    off = Vector((rnd.uniform(-50, 50), rnd.uniform(-50, 50), rnd.uniform(-50, 50)))
    # a few big planar facets (fractured faces) for a real rock silhouette
    planes = [(Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.6, 1))).normalized(), rnd.uniform(0.55, 0.85)) for _ in range(rnd.randint(4, 7))]
    for v in bm.verts:
        p = v.co.copy()
        d = 1.0 + rough * (noise.fractal(p * 1.3 + off, 0.6, 2.0, 5) * 0.6) + ridge * abs(noise.noise(p * 3 + off))
        p = p * d
        for n, k in planes:
            dist = p.dot(n)
            if dist > k:
                p -= n * (dist - k) * 0.9
        v.co = Vector((p.x * size[0] / 2, p.y * size[1] / 2, p.z * size[2] / 2))
    # flatten the base so it sits on the ground
    minz = min(v.co.z for v in bm.verts)
    cut = minz + size[2] * (0.12 + flat)
    for v in bm.verts:
        if v.co.z < cut:
            v.co.z = cut - (cut - v.co.z) * 0.08
    o = core.from_bmesh(name, bm)
    core.smooth(o)
    return o

def build_rock(p):
    o = rock_mesh('rock', p.get('size', (1.0, 0.8, 0.6)), p.get('seed', 1), p.get('rough', 0.35), p.get('flat', 0.0), ridge=p.get('ridge', 0.0))
    assign(o, mat('stone', 'stone', color=p.get('color', '#8a857c'), lichen=p.get('lichen', 0.0), scale=p.get('scale', 2.2), cracks=p.get('cracks', 4.0), bump=0.6, ao_dist=0.25))
    if p.get('moss'):
        pass

def build_rock_group(p):
    rnd = random.Random(p.get('seed', 7))
    parts = []
    for k in range(p.get('count', 5)):
        s = rnd.uniform(0.15, 0.45) * p.get('scale_all', 1)
        o = rock_mesh('rock', (s * rnd.uniform(1, 1.5), s, s * rnd.uniform(0.5, 0.8)), rnd.randint(0, 999), 0.35)
        a = rnd.uniform(0, math.tau); r = rnd.uniform(0, 0.35) * p.get('scale_all', 1)
        o.location = (math.cos(a) * r, math.sin(a) * r, 0)
        core.apply_transform([o])
        mn = min((o.matrix_world @ v.co).z for v in o.data.vertices)
        o.location.z -= mn
        parts.append(o)
    j = core.join(parts, 'rocks')
    assign(j, mat('stone', 'stone', color=p.get('color', '#7d786f'), lichen=p.get('lichen', 0.2), bump=0.6))

def root_flare_profile(R, H):
    return [(0, 0), (R * 1.6, 0), (R * 1.25, H * 0.08), (R * 1.05, H * 0.25), (R, H * 0.5), (R * 0.98, H), (0, H)]

def build_stump(p):
    R, H = p.get('r', 0.25), p.get('h', 0.45)
    o = core.lathe('stump', root_flare_profile(R, H)[:-1], steps=64)
    rnd = random.Random(p.get('seed', 2))
    off = Vector((rnd.uniform(0, 99), 0, 0))
    roots = p.get('roots', 5)
    for v in o.data.vertices:
        a = math.atan2(v.co.y, v.co.x)
        r = math.hypot(v.co.x, v.co.y)
        if r < 1e-5: continue
        lowk = max(0.0, 1 - v.co.z / (H * 0.45))
        k = 1 + lowk * 0.35 * max(0, math.cos(a * roots + rnd.uniform(-0.2, 0.2))) ** 3 + 0.04 * noise.noise(Vector((a * 3, v.co.z * 8, 0)) + off)
        v.co.x *= k; v.co.y *= k
    assign(o, mat('bark', 'bark', color=p.get('bark', '#5b4634'), bump=0.9))
    top = core.lathe('cut', [(0, H), (R * 0.98 - 0.004, H), (R * 0.98 - 0.004, H + 0.004), (0, H + 0.006)], steps=64)
    assign(top, mat('endgrain', 'endgrain', color=p.get('wood', '#c79a64'), ring=26))
    if p.get('axe'):
        ax = core.soft_box('axe_head', (0.18, 0.02, 0.1), at=(0.03, 0, H + 0.03), n=6, rot=(0, math.radians(-10), 0), subsurf=1)
        assign(ax, mat('steel_axe', 'painted_metal', color='#33363a', metal=0.9, wear=0.4))
        hd = core.post_between('axe_handle', (-0.02, 0, H + 0.04), (-0.55, 0, H - 0.25), None, round_=True, r=0.016)
        assign(hd, mat('wood_v', 'wood', color='#b48a5a', axis='Z'))

def build_log(p):
    R, L = p.get('r', 0.18), p.get('l', 1.4)
    o = core.lathe('log', [(R * 0.96, 0), (R, 0.02)] + [(R * (1 + 0.03 * math.sin(i * 1.7)), L * i / 8) for i in range(1, 8)] + [(R * 0.94, L - 0.02), (R * 0.9, L)], steps=48,
                   rot=(0, math.radians(90), 0))
    o.location = (-L / 2, 0, R)
    assign(o, mat('bark', 'bark', color=p.get('bark', '#4f3e30'), bump=0.9))
    for x, rr in [(-L / 2 + 0.002, R * 0.94), (L / 2 - 0.002, R * 0.88)]:
        s = 1 if x > 0 else -1
        c = core.cylinder('end', rr, 0.006, at=(x - (0.004 if s > 0 else 0.002), 0, R), rot=(0, math.radians(90), 0), verts=48)
        assign(c, mat('endgrain', 'endgrain', color=p.get('wood', '#c49866'), ring=24))
    if p.get('branch'):
        b = core.post_between('branch', (0.1, R * 0.6, R * 1.3), (0.35, R * 2.5, R * 1.9), None, round_=True, r=R * 0.25, verts=16)
        assign(b, mat('bark', 'bark'))

def build_mushroom(p):
    kind = p.get('kind', 'fly-agaric')
    rnd = random.Random(p.get('seed', 4))
    count = p.get('count', 3)
    stem_m = mat('stem', 'ceramic', color=p.get('stem', '#efe8d8'), rough=0.6)
    cap_m = mat('cap', 'spots', color=p.get('color', '#b8231a'), warts=kind == 'fly-agaric', rough=0.35 if kind == 'fly-agaric' else 0.6, bump=0.5)
    gill_m = mat('gills', 'fabric', color='#e8dfcc' if kind != 'porcini' else '#c8b46a', bump=0.6)
    ground = rock_mesh('moss', (0.36, 0.3, 0.07), 42, rough=0.25, flat=0.35)  # low organic mound of moss/earth
    assign(ground, mat('moss', 'foliage', color='#4c6a2a', bump=0.8))
    for k in range(count):
        s = rnd.uniform(0.6, 1.0) if k else 1.0
        a = rnd.uniform(0, math.tau); r = 0 if k == 0 else rnd.uniform(0.05, 0.1)
        x, y = math.cos(a) * r, math.sin(a) * r
        H = (0.12 if kind != 'chanterelle' else 0.06) * s
        R = (0.06 if kind == 'fly-agaric' else 0.05) * s
        sr = R * (0.28 if kind != 'porcini' else 0.55)
        stem = core.lathe('stem', [(0, 0.02), (sr * 1.3, 0.02), (sr * 1.15, H * 0.3), (sr, H * 0.95), (0, H)], at=(x, y, 0), steps=32)
        assign(stem, stem_m)
        if kind == 'chanterelle':
            cap = core.lathe('cap', [(sr, H * 0.6), (R * 0.7, H * 0.95), (R, H * 1.2), (R * 0.95, H * 1.25), (R * 0.5, H * 1.15), (0, H * 1.12)], at=(x, y, 0), steps=48)
        else:
            dome = 0.6 if kind == 'fly-agaric' else 0.5
            cap = core.lathe('cap', [(R * 0.98, H * 0.96), (R, H), (R * 0.95, H + R * dome * 0.4), (R * 0.7, H + R * dome * 0.85), (R * 0.35, H + R * dome), (0, H + R * dome * 1.02)], at=(x, y, 0), steps=48)
            gills = core.lathe('gills', [(sr * 0.95, H * 0.97), (R * 0.97, H * 0.965)], at=(x, y, 0), steps=48)
            assign(gills, gill_m)
        tilt = (rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12), 0)
        for part in [stem, cap] + ([gills] if kind != 'chanterelle' else []):
            part.rotation_euler = tilt  # same pivot (stem foot) → parts stay joined
        assign(cap, cap_m)

TYPES = {
    'hd-rock': {'label': 'Rock (HD)', 'category': 'nature', 'options': {}, 'build': build_rock,
                'variants': {'boulder-granite': dict(size=(1.4, 1.1, 0.9), seed=3, color='#8d8880'),
                             'boulder-lichen': dict(size=(1.2, 1.0, 0.8), seed=11, lichen=0.6, color='#7f7b74'),
                             'slab-sandstone': dict(size=(1.6, 1.0, 0.45), seed=5, color='#b39470', flat=0.05, scale=1.2),
                             'rock-dark-basalt': dict(size=(0.7, 0.6, 0.5), seed=21, color='#4c4a48', rough=0.25, ridge=0.1),
                             'pebble-river': dict(size=(0.22, 0.16, 0.1), seed=8, rough=0.12, color='#9a958c', cracks=0.5),
                             'tall-standing-stone': dict(size=(0.7, 0.55, 1.8), seed=14, color='#7a776f', lichen=0.35),
                             'rock-limestone': dict(size=(0.9, 0.75, 0.55), seed=33, color='#c8c1b2', ridge=0.15)}},
    'hd-rock-group': {'label': 'Rock cluster (HD)', 'category': 'nature', 'options': {}, 'build': build_rock_group,
                      'variants': {'small-cluster': dict(), 'mossy-cluster': dict(seed=19, lichen=0.6, count=6, scale_all=1.4)}},
    'hd-stump': {'label': 'Tree stump (HD)', 'category': 'nature', 'options': {}, 'build': build_stump,
                 'variants': {'oak': dict(), 'birch-pale': dict(bark='#d9d4c8', r=0.18, h=0.35, wood='#e0c49a', seed=5), 'with-axe': dict(axe=True, r=0.28, h=0.4, seed=9)}},
    'hd-log': {'label': 'Log (HD)', 'category': 'nature', 'options': {}, 'build': build_log,
               'variants': {'oak-log': dict(), 'thin-branchy': dict(r=0.11, l=1.1, branch=True, bark='#5b4a38'), 'big-trunk': dict(r=0.3, l=2.2, bark='#3f3328')}},
    'hd-mushroom': {'label': 'Mushrooms (HD)', 'category': 'nature', 'options': {}, 'build': build_mushroom,
                    'variants': {'fly-agaric': dict(), 'porcini': dict(kind='porcini', color='#7a4a26', stem='#e6dcc0', seed=6), 'chanterelle': dict(kind='chanterelle', color='#e0a030', stem='#e8b850', count=5, seed=9)}},
}
