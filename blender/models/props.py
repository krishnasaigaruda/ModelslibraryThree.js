"""HD kitchenware, decor, lamps, potted plants and rugs. Lathe-turned shapes with real wall
thickness (inside + outside surfaces), glossy baked ceramic, brushed steel, glass, wood."""
import math, random
from lib import core
from lib.mats import mat, assign

def shell_profile(outer, t):
    """Closed lathe profile with wall thickness: inner (offset) going up, rim, outer going down."""
    inner = [(max(0.0, r - t), z + (t if i == 0 else 0)) for i, (r, z) in enumerate(outer)]
    inner[0] = (0.0, outer[0][1] + t)
    rim = outer[-1]
    prof = inner + [(rim[0] - t / 2, rim[1] + t * 0.35)] + list(reversed(outer))
    prof.append((0.0, outer[0][1]))
    return prof

def vessel(name, outer, t, m, steps=64):
    o = core.lathe(name, shell_profile(outer, t), steps=steps)
    assign(o, m)
    return o

def ceramic(p, name='ceramic_primary'):
    return mat(name, 'ceramic', color=p.get('color', '#efe9df'), tint=True, rough=p.get('rough', 0.12), speckle=p.get('speckle', False))

def build_mug(p):
    h, r = p.get('h', 0.095), p.get('r', 0.041)
    outer = [(r * 0.86, 0), (r * 0.96, 0.004), (r, 0.015), (r * (1.02 if p.get('belly') else 1), h * 0.6), (r, h)]
    vessel('mug', outer, 0.004, ceramic(p))
    hr = h * 0.33
    hd = core.tube_path('handle', [(r - 0.003, 0, h * 0.78), (r + hr * 0.7, 0, h * 0.8), (r + hr * 0.9, 0, h * 0.5), (r + hr * 0.6, 0, h * 0.24), (r - 0.003, 0, h * 0.22)], 0.0065)
    assign(hd, ceramic(p))

def build_plate(p):
    r = p.get('r', 0.135)
    deep = p.get('deep', 0.0)
    outer = [(r * 0.55, 0), (r * 0.6, 0.006), (r * 0.7, 0.008 + deep * 0.3), (r * 0.9, 0.012 + deep * 0.8), (r, 0.022 + deep)]
    vessel('plate', outer, 0.005, ceramic(p), steps=96)

def build_bowl(p):
    r, h = p.get('r', 0.08), p.get('h', 0.07)
    outer = [(r * 0.45, 0), (r * 0.5, 0.006), (r * 0.8, h * 0.35), (r * 0.97, h * 0.75), (r, h)]
    vessel('bowl', outer, 0.004, ceramic(p), steps=80)

def build_vase(p):
    h, r = p.get('h', 0.32), p.get('r', 0.075)
    shape = p.get('shape', 'amphora')
    if shape == 'amphora':
        outer = [(r * 0.55, 0), (r * 0.6, 0.006), (r, h * 0.35), (r * 0.9, h * 0.6), (r * 0.42, h * 0.84), (r * 0.4, h * 0.94), (r * 0.5, h)]
    elif shape == 'cylinder':
        outer = [(r * 0.94, 0), (r, 0.006), (r, h)]
    else:  # bud / bottle
        outer = [(r * 0.6, 0), (r * 0.66, 0.006), (r, h * 0.3), (r * 0.95, h * 0.45), (r * 0.25, h * 0.75), (r * 0.22, h * 0.95), (r * 0.27, h)]
    vessel('vase', outer, 0.005, ceramic(p), steps=72)

def build_bottle(p):
    kind = p.get('kind', 'wine')
    if kind == 'wine':
        r, h = 0.037, 0.3
        prof = [(0, 0), (r * 0.9, 0), (r, 0.006), (r, h * 0.62), (r * 0.9, h * 0.7), (0.0145, h * 0.82), (0.0145, h * 0.97), (0.016, h * 0.975), (0.016, h), (0, h)]
        g = core.lathe('bottle', prof, steps=48); assign(g, mat('bottle_glass', 'glass', color=p.get('glass', '#1e3a22'), alpha=0.82, rough=0.05))
        lab = core.lathe('label', [(r + 0.0006, h * 0.18), (r + 0.0006, h * 0.45)], steps=48)
        assign(lab, mat('label_paper', 'fabric', color=p.get('label', '#efe6d2'), bump=0.2))
        cap = core.lathe('foil', [(0.0152, h * 0.88), (0.0168, h * 0.885), (0.0168, h + 0.002), (0, h + 0.002)], steps=32)
        assign(cap, mat('foil', 'metal', color=p.get('foil', '#6b1420'), metal=1, rough=0.35))
    else:  # olive oil / milk style clear bottle with liquid
        r, h = 0.03, 0.25
        prof = [(0, 0), (r * 0.9, 0), (r, 0.005), (r, h * 0.7), (0.012, h * 0.88), (0.012, h), (0, h)]
        g = core.lathe('bottle', prof, steps=48); assign(g, mat('bottle_glass', 'glass', color='#e6efe9', alpha=0.25, rough=0.03))
        liq = core.lathe('liquid', [(0, 0.004), (r * 0.94, 0.004), (r * 0.94, h * 0.6), (0, h * 0.6)], steps=48)
        assign(liq, mat('liquid', 'glass', color=p.get('liquid', '#a88a1c'), alpha=0.75, rough=0.02))
        cap = core.cylinder('cap', 0.0135, 0.02, at=(0, 0, h - 0.004), verts=32, bevel=0.002); assign(cap, mat('cap_black', 'plastic', color='#151515', rough=0.5))

def build_teapot(p):
    r, h = 0.085, 0.13
    outer = [(r * 0.6, 0), (r * 0.65, 0.006), (r, h * 0.4), (r * 0.92, h * 0.78), (r * 0.62, h)]
    vessel('pot', outer, 0.005, ceramic(p))
    lid = core.lathe('lid', [(0, h + 0.002), (r * 0.63, h + 0.002), (r * 0.6, h + 0.012), (r * 0.35, h + 0.025), (0.012, h + 0.03), (0.016, h + 0.042), (0, h + 0.046)], steps=48)
    assign(lid, ceramic(p))
    sp = core.tube_path('spout', [(r * 0.85, 0, h * 0.3), (r * 1.25, 0, h * 0.5), (r * 1.5, 0, h * 0.85), (r * 1.62, 0, h * 0.95)], 0.011)
    assign(sp, ceramic(p))
    hd = core.tube_path('handle', [(-r * 0.85, 0, h * 0.75), (-r * 1.45, 0, h * 0.8), (-r * 1.5, 0, h * 0.45), (-r * 0.97, 0, h * 0.25)], 0.008)
    assign(hd, ceramic(p))

def build_cookpot(p):
    r, h = p.get('r', 0.11), p.get('h', 0.13)
    steel = mat('steel', 'metal', color='#c9ccd0', metal=1.0, rough=0.22, axis='Z')
    vessel('pot', [(r * 0.98, 0), (r, 0.005), (r, h)], 0.0025, steel, steps=72)
    lid = core.lathe('lid', [(0, h + 0.001), (r + 0.004, h + 0.001), (r + 0.004, h + 0.006), (r * 0.6, h + 0.02), (0, h + 0.026)], steps=72)
    assign(lid, mat('lid_glass', 'glass', color='#e8f0ee', alpha=0.3) if p.get('glass_lid') else steel)
    knob = core.lathe('knob', [(0, h + 0.024), (0.01, h + 0.024), (0.012, h + 0.04), (0.02, h + 0.045), (0.018, h + 0.05), (0, h + 0.052)], steps=32)
    assign(knob, mat('bakelite', 'plastic', color='#141414', rough=0.45))
    for s in (-1, 1):
        hd = core.tube_path('handle', [(s * (r - 0.002), -0.035, h * 0.78), (s * (r + 0.03), -0.03, h * 0.82), (s * (r + 0.035), 0, h * 0.84), (s * (r + 0.03), 0.03, h * 0.82), (s * (r - 0.002), 0.035, h * 0.78)], 0.0055)
        assign(hd, steel)

def build_board(p):
    L, W, T = p.get('l', 0.42), p.get('w', 0.26), 0.022
    from lib.mats import mat as M
    wood = M('board_wood', 'wood', color=p.get('wood', '#a8743f'), axis='X', ring=10)
    b = core.soft_box('board', (L, W, T), at=(0, 0, T / 2), n=8, subsurf=1)
    if p.get('handle'):
        h = core.soft_box('handle', (0.12, 0.07, T), at=(L / 2 + 0.05, 0, T / 2), n=6, subsurf=1)
        b = core.join([b, h])
        hole = core.cylinder('hole', 0.013, T * 3, at=(L / 2 + 0.075, 0, -T))
        mod = b.modifiers.new('hole', 'BOOLEAN'); mod.object = hole; mod.operation = 'DIFFERENCE'
        core.apply_mods(b)
        core.bpy.data.objects.remove(hole)
    assign(b, wood)

def build_lamp(p):
    kind = p.get('kind', 'table')
    brass = mat('brass', 'metal', color=p.get('metal', '#b8955a'), metal=1.0, rough=0.25)
    shade_m = mat('fabric_secondary_shade', 'fabric', color=p.get('shade', '#efe8da'), tint=True, emit='#ffe2b0', strength=0.25, bump=0.4)
    def shade(z0, h, r_bot, r_top):
        o = core.lathe('shade', [(r_bot, z0), (r_top, z0 + h), (r_top - 0.003, z0 + h), (r_bot - 0.003, z0)] + [(r_bot, z0)], steps=72)
        assign(o, shade_m)
        # spider + bulb
        bulb = core.sphere('bulb', 0.03, at=(0, 0, z0 + h * 0.4), seg=24, rings=12)
        assign(bulb, mat('bulb', 'emissive', color='#fff4dc', emit='#ffd9a0', strength=2.0))
        for a in range(3):
            ang = a * 2 * math.pi / 3
            o2 = core.post_between('spider', (0, 0, z0 + h * 0.62), (math.cos(ang) * (r_top - 0.003), math.sin(ang) * (r_top - 0.003), z0 + h - 0.004), None, round_=True, r=0.0018, verts=8)
            assign(o2, brass)
        return z0 + h * 0.62
    if kind == 'table':
        h = p.get('base_h', 0.32)
        base = core.lathe('base', [(0, 0), (0.06, 0), (0.07, 0.01), (0.1, h * 0.35), (0.09, h * 0.7), (0.035, h * 0.92), (0.03, h), (0, h)], steps=72)
        assign(base, ceramic(p))
        stem = core.cylinder('stem', 0.008, 0.2, at=(0, 0, h - 0.005)); assign(stem, brass)
        hub = shade(h + 0.06, 0.25, 0.2, 0.15)
        # stem must reach the spider hub
        stem.scale.z = (hub - (h - 0.005)) / 0.2
    elif kind == 'floor':
        H = 1.6
        wood = mat('wood_v', 'wood', color=p.get('wood', '#6a4428'), axis='Z', ring=12)
        top = (0, 0, 1.15)
        for k in range(3):
            a = k * 2 * math.pi / 3 + math.pi / 6
            o = core.post_between('leg', (math.cos(a) * 0.32, math.sin(a) * 0.32, 0), top, None, round_=True, r=0.014)
            assign(o, wood)
        hub = core.sphere('hub', 0.025, at=top, seg=24, rings=12); assign(hub, brass)
        stem = core.cylinder('stem', 0.009, 0.3, at=top); assign(stem, brass)
        z = shade(1.33, 0.3, 0.24, 0.22)
        stem.scale.z = (z - 1.15) / 0.3
    else:  # desk lamp: weighted base, two arms, cone head (all joints touching)
        mm = mat('paint_primary_lamp', 'painted_metal', color=p.get('color', '#1f4e3d'), tint=True, metal=0.4, wear=0.08, rough=0.35)
        base = core.lathe('base', [(0, 0), (0.08, 0), (0.085, 0.01), (0.075, 0.028), (0.02, 0.035), (0, 0.035)], steps=64); assign(base, mm)
        j1 = (0, 0, 0.04); j2 = (0.05, 0, 0.36); j3 = (0.32, 0, 0.42)
        for a, b in [(j1, j2), (j2, j3)]:
            for s in (-1, 1):
                o = core.post_between('arm', (a[0], s * 0.012, a[2]), (b[0], s * 0.012, b[2]), None, round_=True, r=0.005); assign(o, mm)
        for j in (j1, j2, j3):
            o = core.cylinder('joint', 0.014, 0.034, at=(j[0], 0.017, j[2]), rot=(math.radians(90), 0, 0)); assign(o, brass)
        head = core.lathe('head', [(0.012, 0), (0.03, 0.02), (0.075, 0.13), (0.072, 0.13), (0.028, 0.022), (0.01, 0.002)], steps=56,
                          at=(j3[0] + 0.02, 0, j3[2]), rot=(0, math.radians(150), 0))
        assign(head, mm)
        bc = (j3[0] + 0.02 + 0.065 * math.sin(math.radians(150)), 0, j3[2] + 0.065 * math.cos(math.radians(150)))
        sock = core.post_between('socket', (j3[0] + 0.02, 0, j3[2]), bc, None, round_=True, r=0.012); assign(sock, brass)
        bulb = core.sphere('bulb', 0.025, at=bc, seg=20, rings=10)
        assign(bulb, mat('bulb', 'emissive', color='#fff4dc', emit='#ffd9a0', strength=2.0))

def pot(p, r=0.12, h=0.2, style='terracotta'):
    if style == 'terracotta':
        m = mat('terracotta', 'ceramic', color='#b5643c', rough=0.8, speckle=True)
        outer = [(r * 0.72, 0), (r * 0.75, 0.006), (r * 0.95, h * 0.85), (r * 0.95, h * 0.86), (r * 1.06, h * 0.87), (r * 1.06, h)]
    else:
        m = ceramic(p, 'ceramic_primary')
        outer = [(r * 0.7, 0), (r * 0.76, 0.006), (r * 1.0, h * 0.55), (r * 0.94, h)]
    vessel('pot', outer, 0.008, m)
    soil = core.lathe('soil', [(0, h * 0.86), (outer[-1][0] - 0.01, h * 0.86), (outer[-1][0] - 0.01, h * 0.88)], steps=48)
    assign(soil, mat('soil', 'soil', color='#3a281b'))
    return h * 0.87

def leaf_blade(name, base, h, w, lean, twist, curl=0.02, rot=0.0, thick=0.004):
    """Single sword-like leaf (snake plant / grass): strip with width profile, lean + twist, solidified."""
    n = 14
    verts, faces = [], []
    for i in range(n + 1):
        t = i / n
        z = h * t
        wid = w * (math.sin(min(1, t * 1.15) * math.pi) ** 0.6 if t < 0.9 else (1 - t) * 6 * 0.4) * (0.6 + 0.4 * (1 - t))
        ang = rot + twist * t
        off = lean * t * t
        c = (math.cos(rot) * off, math.sin(rot) * off)
        for s in (-1, 0, 1):
            d = s * wid / 2
            bend = curl * (1 - abs(s))
            verts.append((base[0] + c[0] + math.cos(ang + math.pi / 2) * d + math.cos(ang) * bend, base[1] + c[1] + math.sin(ang + math.pi / 2) * d + math.sin(ang) * bend, base[2] + z))
    for i in range(n):
        for j in range(2):
            a = i * 3 + j
            faces.append((a, a + 1, a + 4, a + 3))
    o = core.from_pydata(name, verts, faces)
    sol = o.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = thick
    core.add_subsurf(o, 1)
    return o

def build_plant(p):
    kind = p.get('kind', 'snake')
    rnd = random.Random(p.get('seed', 3))
    if kind == 'snake':
        top = pot(p, 0.12, 0.22, p.get('pot', 'ceramic'))
        lm = mat('leaf_snake', 'foliage', color='#3c6b33', bump=0.4)
        for k in range(p.get('leaves', 11)):
            a = rnd.uniform(0, math.tau)
            rr = rnd.uniform(0, 0.06)
            o = leaf_blade('leaf', (math.cos(a) * rr, math.sin(a) * rr, top - 0.02), rnd.uniform(0.35, 0.7), rnd.uniform(0.045, 0.065), rnd.uniform(0.02, 0.1), rnd.uniform(-0.6, 0.6), rot=a)
            assign(o, lm)
    elif kind == 'echeveria':
        top = pot(p, 0.08, 0.1, 'terracotta')
        lm = mat('leaf_succulent', 'foliage', color='#7c9a8a', bump=0.2)
        core_ = core.soft_box('rosette_core', (0.05, 0.05, 0.06), at=(0, 0, top + 0.02), n=3, subsurf=1)
        assign(core_, lm)
        i = 0
        for ring in range(5):
            cnt = 6 + ring * 2
            for k in range(cnt):
                a = k * math.tau / cnt + ring * 0.4
                L = 0.025 + ring * 0.012
                tilt = math.radians(20 + ring * 14)
                o = core.soft_box('leaf', (L, L * 0.55, L * 0.22), n=3.2, subsurf=1, taper=0.0)
                o.location = (math.cos(a) * L * 0.5, math.sin(a) * L * 0.5, top + 0.012 + (4 - ring) * 0.006)
                o.rotation_euler = (0, -tilt, a)
                assign(o, lm)
    elif kind in ('barrel-cactus', 'column-cactus'):
        top = pot(p, 0.11 if kind == 'barrel-cactus' else 0.09, 0.14, 'terracotta')
        H = 0.16 if kind == 'barrel-cactus' else 0.45
        R = 0.085 if kind == 'barrel-cactus' else 0.045
        prof = [(0, top - 0.02)] + [(R * (math.sin(min(1, (t / 12) * 1.3) * math.pi / 2) ** 0.5 if kind == 'barrel-cactus' else (1 if t < 11 else 0.7)) * (1 - (t / 12) ** 6 * (0.85 if kind == 'barrel-cactus' else 0.6)), top - 0.02 + H * t / 12) for t in range(13)] + [(0, top - 0.02 + H)]
        c = core.lathe('cactus', prof, steps=96)
        ribs = 14 if kind == 'barrel-cactus' else 9
        for v in c.data.vertices:
            a = math.atan2(v.co.y, v.co.x)
            rr = math.hypot(v.co.x, v.co.y)
            k = 1 + 0.07 * math.cos(a * ribs)
            v.co.x *= k; v.co.y *= k
        assign(c, mat('cactus_skin', 'foliage', color='#3f6e3a', bump=0.3))
        # spines: tiny cones along rib crests (touching the skin)
        sp = mat('spine', 'plastic', color='#e9dfb8', rough=0.5)
        spines = []
        for rb in range(ribs):
            a = rb * math.tau / ribs
            for t in range(2, 12, 2):
                z = top - 0.02 + H * t / 12
                rr = prof[t + 1][0] * 1.07 - 0.001
                s = core.cylinder('spine', 0.0015, 0.012, at=(math.cos(a) * rr, math.sin(a) * rr, z), verts=6, r2=0.0001, rot=(0, math.radians(80), a))
                spines.append(s)
        if spines:
            assign(core.join(spines, 'spines'), sp)
    elif kind == 'grass':
        top = pot(p, 0.1, 0.14, p.get('pot', 'ceramic'))
        lm = mat('leaf_grass', 'foliage', color='#5b7a34', bump=0.2)
        blades = []
        for k in range(60):
            a = rnd.uniform(0, math.tau); rr = rnd.uniform(0, 0.07)
            blades.append(leaf_blade('blade', (math.cos(a) * rr, math.sin(a) * rr, top - 0.01), rnd.uniform(0.25, 0.45), 0.008, rnd.uniform(0.08, 0.2), rnd.uniform(-0.3, 0.3), curl=0.002, rot=a, thick=0.0015))
        assign(core.join(blades, 'grass'), lm)

def build_rug(p):
    L, W = p.get('l', 2.4), p.get('w', 1.6)
    t = 0.012 if p.get('pattern') != 'shag' else 0.03
    r = core.soft_box('rug', (L, W, t), at=(0, 0, t / 2), n=20, subsurf=0, cuts=4)
    assign(r, mat('rug_wool', 'rug', colors=p.get('colors'), pattern=p.get('pattern', 'persian'), aspect=L / W, bump=0.8))
    if p.get('fringe', True):
        strands = []
        for s in (-1, 1):
            n = int(W / 0.012)
            for k in range(n):
                y = -W / 2 + 0.01 + k * (W - 0.02) / (n - 1)
                st = core.post_between('fringe', (s * (L / 2 - 0.005), y, 0.003), (s * (L / 2 + 0.05), y, 0.0025), None, round_=True, r=0.0022, verts=5)
                strands.append(st)
        assign(core.join(strands, 'fringe'), mat('fringe_cotton', 'fabric', color='#eee6d4', bump=0.3))

V = {'h': 0.095}
TYPES = {
    'hd-mug': {'label': 'Mug (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'glaze color'}, 'build': build_mug,
               'variants': {'white': dict(color='#f3f0ea'), 'speckled-stoneware': dict(color='#d9cdb8', speckle=True, rough=0.35, belly=True), 'cobalt': dict(color='#1f3f8a'), 'sage': dict(color='#9aab92', rough=0.3)}},
    'hd-plate': {'label': 'Plate & bowl (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'glaze color'}, 'build': build_plate,
                 'variants': {'dinner-white': dict(), 'side-stoneware': dict(r=0.1, color='#cfc2a8', speckle=True, rough=0.4), 'pasta-deep': dict(r=0.13, deep=0.03, color='#e9e4da')}},
    'hd-bowl': {'label': 'Bowl (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'glaze color'}, 'build': build_bowl,
                'variants': {'cereal-white': dict(), 'serving-terracotta': dict(r=0.14, h=0.09, color='#b9663e', rough=0.5, speckle=True)}},
    'hd-vase': {'label': 'Vase (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {'color': 'glaze color'}, 'build': build_vase,
                'variants': {'amphora-sand': dict(color='#d8c6a4', speckle=True, rough=0.45), 'cylinder-black': dict(shape='cylinder', color='#1c1c1c', r=0.06, h=0.28, rough=0.2), 'bud-celadon': dict(shape='bud', color='#a9c4b0', h=0.24, r=0.06)}},
    'hd-bottle': {'label': 'Bottle (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_bottle,
                  'variants': {'wine-red': dict(kind='wine'), 'wine-white': dict(kind='wine', glass='#7a8a3a', foil='#c9b37a', label='#f6f2e8'), 'olive-oil': dict(kind='oil')}},
    'hd-teapot': {'label': 'Teapot (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'glaze color'}, 'build': build_teapot,
                  'variants': {'white': dict(color='#f3f0ea'), 'jade': dict(color='#4f7f6a', rough=0.15)}},
    'hd-cookpot': {'label': 'Cooking pot (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_cookpot,
                   'variants': {'stockpot': dict(r=0.12, h=0.16), 'saucepan-glass-lid': dict(r=0.09, h=0.09, glass_lid=True)}},
    'hd-cutting-board': {'label': 'Cutting board (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_board,
                         'variants': {'oak-paddle': dict(handle=True), 'walnut-block': dict(wood='#5a3822', l=0.45, w=0.3)}},
    'hd-lamp': {'label': 'Lamp (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'base / body color', 'secondaryColor': 'shade'}, 'build': build_lamp,
                'variants': {'table-ceramic': dict(kind='table', color='#e9e3d6'), 'table-indigo': dict(kind='table', color='#2a3c6b', shade='#f4f0e6'), 'tripod-floor': dict(kind='floor'), 'desk-green': dict(kind='desk'), 'desk-black': dict(kind='desk', color='#1b1b1c')}},
    'hd-plant': {'label': 'Potted plant (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {'color': 'pot glaze (ceramic pots)'}, 'build': build_plant,
                 'variants': {'snake-plant': dict(kind='snake', color='#efeae0'), 'echeveria': dict(kind='echeveria'), 'barrel-cactus': dict(kind='barrel-cactus'), 'column-cactus': dict(kind='column-cactus'), 'ornamental-grass': dict(kind='grass', color='#2c2c2e')}},
    'hd-rug': {'label': 'Rug (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {}, 'build': build_rug,
               'variants': {'persian-red': dict(pattern='persian'), 'kilim-terracotta': dict(pattern='kilim', colors=['#b5532f', '#efe2c8', '#2e3f4f']), 'modern-blue': dict(pattern='modern', colors=['#2e4a6b', '#d9d2c2', '#c8954e'], fringe=False), 'persian-navy': dict(pattern='persian', colors=['#1d2c4a', '#e8dcc0', '#8b2a2a'], l=3.0, w=2.0)}},
}
