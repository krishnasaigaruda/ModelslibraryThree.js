"""HD street furniture: hydrants, benches, bollards, bins, cones, manhole covers, crates,
barrels, pallets. Painted cast iron with chipped edges + rust, weathered wood, galvanised steel."""
import math, random
from lib import core
from lib.mats import mat, assign

def paint(p, default='#b32418', wear=0.35, name='paint_primary'):
    return mat(name, 'painted_metal', color=p.get('color', default), tint=True, metal=0.3, wear=p.get('wear', wear), rough=0.42)

def bolts(center_z, r, n, m, size=0.012, h=0.01, z_axis=True, phase=0.0):
    out = []
    for k in range(n):
        a = phase + k * math.tau / n
        o = core.cylinder('bolt', size, h, at=(math.cos(a) * r, math.sin(a) * r, center_z), verts=6, bevel=0.002)
        out.append(o)
    j = core.join(out, 'bolts'); assign(j, m)
    return j

def build_hydrant(p):
    m = paint(p, '#b32418')
    cap_m = paint(p, p.get('cap', '#e8e2d0'), name='paint_secondary_caps') if p.get('cap') else m
    style = p.get('style', 'classic')
    H = 0.78 if style == 'classic' else 0.95
    # ground flange + barrel + top bonnet (one continuous lathe so nothing floats)
    prof = [(0, 0), (0.15, 0), (0.15, 0.03), (0.12, 0.045), (0.1, 0.06), (0.1, H * 0.62), (0.115, H * 0.64), (0.115, H * 0.67), (0.1, H * 0.69),
            (0.098, H * 0.8), (0.08, H * 0.9), (0.03, H * 0.97), (0.03, H), (0, H)]
    body = core.lathe('body', prof, steps=64); assign(body, m)
    bolts(0.032, 0.13, 8, m, size=0.011)
    bolts(H * 0.655, 0.112, 8, m, size=0.008, h=0.008)
    # pentagon operating nut on top
    nut = core.cylinder('nut', 0.025, 0.04, at=(0, 0, H - 0.005), verts=5, bevel=0.003); assign(nut, cap_m)
    # side outlets with caps (touch the barrel)
    for a, r, L in [(0, 0.06, 0.09), (math.pi, 0.045, 0.07), (math.pi / 2, 0.045, 0.07)] if style == 'classic' else [(0, 0.07, 0.1), (math.pi, 0.07, 0.1)]:
        z = H * 0.48
        c, s = math.cos(a), math.sin(a)
        rot = (0, math.radians(90), a)
        out = core.lathe('outlet', [(0, 0.08), (r, 0.08), (r, 0.08 + L * 0.5), (r * 1.15, 0.08 + L * 0.55), (r * 1.15, 0.08 + L), (0, 0.08 + L)], steps=40, rot=rot)
        out.location = (0, 0, z)
        assign(out, m)
        capn = core.cylinder('capnut', r * 0.5, 0.03, at=(c * (0.08 + L - 0.003), s * (0.08 + L - 0.003), z), verts=5, rot=rot, bevel=0.003)
        assign(capn, cap_m)

def build_bench(p):
    L = p.get('l', 1.8)
    wood = mat('wood_h', 'wood', color=p.get('wood', '#8a6a48'), axis='X', ring=8, bump=0.3)
    iron = mat('paint_primary', 'painted_metal', color=p.get('color', '#1d2a22'), tint=True, metal=0.5, wear=0.2, rough=0.4)
    style = p.get('style', 'park')
    seat_h = 0.45
    ends_x = [-L / 2 + 0.15, L / 2 - 0.15] + ([0] if L > 2 else [])
    for x in ends_x:
        if style == 'park':
            # cast-iron end frame: front leg, rear leg rising to back support, armrest — tubes, touching
            pts_leg = [(x, -0.25, 0), (x, -0.22, 0.2), (x, -0.2, seat_h - 0.03)]
            core.tube_path  # noqa
            a = core.tube_path('frame', [(x, -0.26, 0.0), (x, -0.23, 0.22), (x, -0.21, seat_h - 0.035), (x, 0.12, seat_h - 0.05), (x, 0.2, seat_h - 0.02), (x, 0.24, 0.82)], 0.022); assign(a, iron)
            b = core.tube_path('frame', [(x, 0.2, 0.0), (x, 0.17, 0.2), (x, 0.13, seat_h - 0.05)], 0.022); assign(b, iron)
            if x != 0:
                arm = core.tube_path('arm', [(x, -0.21, seat_h - 0.035), (x, -0.24, 0.6), (x, -0.08, 0.66), (x, 0.17, 0.64), (x, 0.215, 0.6)], 0.018); assign(arm, iron)
            foot = core.soft_box('foot', (0.06, 0.08, 0.02), at=(x, -0.26, 0.01), n=6, subsurf=0); assign(foot, iron)
            foot = core.soft_box('foot', (0.06, 0.08, 0.02), at=(x, 0.2, 0.01), n=6, subsurf=0); assign(foot, iron)
        else:  # modern concrete/steel block legs
            leg = core.soft_box('leg', (0.08, 0.5, seat_h - 0.04), at=(x, 0, (seat_h - 0.04) / 2), n=16, subsurf=0)
            assign(leg, mat('concrete', 'concrete', color='#a7a39b') if style == 'concrete' else iron)
    # seat slats (resting on the frames)
    n = 5 if style == 'park' else 6
    for k in range(n):
        y = -0.22 + k * (0.36 / (n - 1)) if style == 'park' else -0.23 + k * 0.092
        z = seat_h - 0.02 + (0 if style != 'park' else -0.03 * (k / (n - 1)))
        o = core.soft_box('slat', (L, 0.065, 0.032), at=(0, y, z), n=10, subsurf=0); assign(o, wood)
    if style == 'park':
        for k in range(3):
            z = 0.56 + k * 0.09
            y = 0.205 + (z - 0.5) * 0.11
            o = core.soft_box('backslat', (L, 0.028, 0.07), at=(0, y + 0.012, z), n=10, subsurf=0, rot=(math.radians(-15), 0, 0)); assign(o, wood)

def build_bollard(p):
    style = p.get('style', 'steel')
    if style == 'steel':
        m = mat('steel', 'metal', color='#bfc3c7', metal=1.0, rough=0.28, axis='Z')
        o = core.lathe('bollard', [(0, 0), (0.07, 0), (0.07, 0.95), (0.068, 0.97), (0.05, 0.995), (0, 1.0)], steps=64); assign(o, m)
        for z in (0.82, 0.87):
            b = core.lathe('band', [(0.0705, z), (0.0715, z), (0.0715, z + 0.035), (0.0705, z + 0.035)], steps=64)
            assign(b, mat('reflector', 'emissive', color='#e6e6e6', emit='#ffffff', strength=0.05))
    elif style == 'cast-iron':
        m = paint(p, '#1b1d1f', wear=0.3)
        o = core.lathe('bollard', [(0, 0), (0.13, 0), (0.13, 0.04), (0.1, 0.07), (0.085, 0.12), (0.075, 0.7), (0.09, 0.73), (0.09, 0.76), (0.07, 0.8), (0.075, 0.86), (0.04, 0.93), (0.03, 0.97), (0, 0.98)], steps=64)
        assign(o, m)
        if p.get('gold_band'):
            b = core.lathe('band', [(0.091, 0.735), (0.093, 0.735), (0.093, 0.755), (0.091, 0.755)], steps=64)
            assign(b, mat('gilt', 'metal', color='#c9a24a', metal=1, rough=0.3))
    else:  # concrete
        o = core.lathe('bollard', [(0, 0), (0.2, 0), (0.2, 0.5), (0.18, 0.56), (0.1, 0.6), (0, 0.61)], steps=64)
        assign(o, mat('concrete', 'concrete', color=p.get('color', '#b0aca4')))

def build_trashcan(p):
    style = p.get('style', 'galvanized')
    if style == 'galvanized':
        m = mat('galvanized', 'metal', color='#a9adb0', metal=1.0, rough=0.45)
        prof = [(0, 0), (0.22, 0), (0.23, 0.02)]
        for k in range(5):
            z = 0.05 + k * 0.13
            prof += [(0.23, z), (0.236, z + 0.015), (0.23, z + 0.03)]
        prof += [(0.235, 0.68), (0.235, 0.7)]
        can = core.lathe('can', [(0, 0.005)] + shell_like(prof), steps=72); assign(can, m)
        lid = core.lathe('lid', [(0, 0.7), (0.25, 0.7), (0.25, 0.72), (0.2, 0.75), (0.05, 0.77), (0, 0.775)], steps=72); assign(lid, m)
        h = core.tube_path('handle', [(-0.06, 0, 0.77), (-0.05, 0, 0.81), (0.05, 0, 0.81), (0.06, 0, 0.77)], 0.008); assign(h, m)
        for s in (-1, 1):
            sh = core.tube_path('sidehandle', [(s * 0.232, -0.06, 0.6), (s * 0.27, -0.05, 0.6), (s * 0.27, 0.05, 0.6), (s * 0.232, 0.06, 0.6)], 0.007); assign(sh, m)
    else:  # park bin: slatted wood around a steel liner, on a post frame
        wood = mat('wood_v', 'wood', color=p.get('wood', '#7a5a3c'), axis='Z', ring=10)
        liner = core.lathe('liner', [(0, 0.05), (0.22, 0.05), (0.22, 0.85), (0.215, 0.86), (0, 0.86)], steps=48)
        assign(liner, mat('paint_primary', 'painted_metal', color=p.get('color', '#26332c'), tint=True, wear=0.2, metal=0.4))
        n = 18
        slats = []
        for k in range(n):
            a = k * math.tau / n
            o = core.soft_box('slat', (0.06, 0.025, 0.78), n=10, subsurf=0)
            o.location = (math.cos(a) * 0.233, math.sin(a) * 0.233, 0.07 + 0.39); o.rotation_euler = (0, 0, a + math.pi / 2)
            slats.append(o)
        assign(core.join(slats, 'slats'), wood)
        for z in (0.2, 0.72):
            ring = core.lathe('band', [(0.245, z), (0.252, z), (0.252, z + 0.03), (0.245, z + 0.03)], steps=64)
            assign(ring, mat('paint_primary', 'painted_metal'))
        foot = core.lathe('foot', [(0, 0), (0.2, 0), (0.2, 0.05), (0, 0.05)], steps=48); assign(foot, mat('paint_primary', 'painted_metal'))

def shell_like(prof, t=0.004):
    inner = [(r - t, z) for r, z in reversed(prof)]
    return prof + inner

def build_cone(p):
    H = p.get('h', 0.7)
    orange = mat('cone_plastic', 'plastic', color=p.get('color', '#ff5a14'), rough=0.45)
    base = core.soft_box('base', (0.38 if H > 0.5 else 0.28,) * 2 + (0.03,), at=(0, 0, 0.015), n=8, subsurf=0)
    assign(base, mat('cone_base', 'rubber', color='#1a1a1a'))
    r0 = 0.15 if H > 0.5 else 0.11
    cone = core.lathe('cone', [(0, 0.028), (r0, 0.028), (0.025, H - 0.01), (0.022, H), (0, H)], steps=64); assign(cone, orange)
    for z0, z1 in ([(0.38, 0.5), (0.2, 0.3)] if H > 0.5 else [(0.2, 0.3)]):
        z0 *= H / 0.7; z1 *= H / 0.7
        rr = lambda z: r0 + (0.025 - r0) * (z - 0.028) / (H - 0.038) + 0.001
        b = core.lathe('band', [(rr(z0), z0), (rr(z1), z1)], steps=64)
        assign(b, mat('reflective_band', 'emissive', color='#f2f2f2', emit='#ffffff', strength=0.06))

def build_manhole(p):
    R = p.get('r', 0.33)
    iron = mat('cast_iron', 'painted_metal', color='#2c2b29', metal=0.8, wear=0.3, wear_scale=20, rough=0.55)
    frame = core.lathe('frame', [(R, 0), (R + 0.06, 0), (R + 0.06, 0.012), (R + 0.004, 0.014), (R + 0.004, 0.0), ], steps=96)
    assign(frame, iron)
    cover = core.lathe('cover', [(0, 0), (R, 0), (R, 0.014), (0, 0.016)], steps=96); assign(cover, iron)
    # raised grip pattern: radial ribs + concentric rings (real geometry so it catches light)
    ribs = []
    for k in range(24):
        a = k * math.tau / 24
        o = core.soft_box('rib', (R * 0.62, 0.012, 0.006), n=8, subsurf=0)
        o.location = (math.cos(a) * R * 0.5, math.sin(a) * R * 0.5, 0.017); o.rotation_euler = (0, 0, a)
        ribs.append(o)
    for rr in (R * 0.15, R * 0.85):
        ribs.append(core.lathe('ring', [(rr - 0.008, 0.014), (rr + 0.008, 0.014), (rr + 0.006, 0.021), (rr - 0.006, 0.021)], steps=96))
    assign(core.join(ribs, 'pattern'), iron)
    if p.get('plate'):
        sq = core.soft_box('ground', (2 * R + 0.3, 2 * R + 0.3, 0.004), at=(0, 0, -0.002), n=20, subsurf=0)
        assign(sq, mat('asphalt', 'concrete', color='#3b3b3a'))

def build_crate(p):
    S = p.get('size', 0.6)
    wood = mat('crate_wood', 'wood', color=p.get('wood', '#b08a5a'), axis='X', ring=7, rough=0.7, bump=0.4)
    woodv = mat('crate_wood_v', 'wood', color=p.get('wood', '#b08a5a'), axis='Z', ring=7, rough=0.7, bump=0.4)
    t = 0.02
    sl = 4
    gap = 0.012
    sh = (S - gap * (sl - 1)) / sl
    for face in range(4):
        a = face * math.pi / 2
        c, s = math.cos(a), math.sin(a)
        for k in range(sl):
            z = sh / 2 + k * (sh + gap)
            o = core.soft_box('slat', (S - 0.002, t, sh), n=14, subsurf=0)
            o.location = (c * 0 + s * (S / 2 - t / 2) * 0, 0, 0)
            o.location = (-s * (S / 2 - t / 2), -c * (S / 2 - t / 2), z) if False else (s * (S / 2 - t / 2), -c * (S / 2 - t / 2), z)
            o.rotation_euler = (0, 0, a)
            assign(o, wood)
        # corner posts
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = core.soft_box('post', (0.045, 0.045, S), at=(sx * (S / 2 - 0.022), sy * (S / 2 - 0.022), S / 2), n=14, subsurf=0)
            assign(o, woodv)
    bottom = core.soft_box('bottom', (S - 0.01, S - 0.01, t), at=(0, 0, t / 2), n=14, subsurf=0); assign(bottom, wood)
    if p.get('lid', True):
        for k in range(4):
            o = core.soft_box('lid', (S - 0.002, (S - 0.03) / 4, t), at=(0, -S / 2 + (k + 0.5) * S / 4, S + t / 2 - 0.001), n=14, subsurf=0); assign(o, wood)

def build_barrel(p):
    kind = p.get('kind', 'steel')
    if kind == 'steel':
        m = mat('paint_primary', 'painted_metal', color=p.get('color', '#1f4f8f'), tint=True, metal=0.5, wear=p.get('wear', 0.3), rough=0.4)
        R, H = 0.29, 0.88
        prof = [(0, 0), (R - 0.01, 0), (R, 0.012), (R, 0.02)]
        for z in (H * 0.33, H * 0.66):
            prof += [(R, z - 0.02), (R + 0.012, z - 0.008), (R + 0.012, z + 0.008), (R, z + 0.02)]
        prof += [(R, H - 0.02), (R + 0.006, H - 0.01), (R + 0.006, H), (R - 0.01, H), (R - 0.012, H - 0.008), (0, H - 0.008)]
        o = core.lathe('drum', prof, steps=72); assign(o, m)
        for (x, r) in [(0.16, 0.03), (-0.17, 0.018)]:
            b = core.cylinder('bung', r, 0.012, at=(x, 0, H - 0.01), verts=16, bevel=0.002); assign(b, m)
    else:  # oak barrel with hoops (staves bulge)
        wood = mat('barrel_wood', 'wood', color=p.get('wood', '#8a5a32'), axis='Z', ring=6, bump=0.4)
        R, H = 0.3, 0.9
        prof = [(0, 0.01), (R * 0.84, 0.01)] + [(R * (0.84 + 0.16 * math.sin(math.pi * t / 10)), 0.01 + (H - 0.02) * t / 10) for t in range(11)] + [(0, H - 0.01)]
        o = core.lathe('barrel', prof, steps=48)
        # stave grooves
        for v in o.data.vertices:
            a = math.atan2(v.co.y, v.co.x)
            k = 1 - 0.006 * (abs(math.cos(a * 12)) ** 30)
            v.co.x *= k; v.co.y *= k
        assign(o, wood)
        hoop = mat('iron_hoop', 'painted_metal', color='#2a2622', metal=0.8, wear=0.5, rough=0.5)
        for t in (0.08, 0.25, 0.75, 0.92):
            z = H * t
            r = R * (0.84 + 0.16 * math.sin(math.pi * (z - 0.01) / (H - 0.02))) + 0.002
            h = core.lathe('hoop', [(r, z - 0.025), (r + 0.005, z - 0.02), (r + 0.005, z + 0.02), (r, z + 0.025)], steps=72)
            assign(h, hoop)

def build_pallet(p):
    L, W = 1.2, 0.8
    wood = mat('pallet_wood', 'wood', color=p.get('wood', '#c2a070'), axis='X', ring=8, rough=0.8, bump=0.45)
    woody = mat('pallet_wood_y', 'wood', color=p.get('wood', '#c2a070'), axis='Y', ring=8, rough=0.8, bump=0.45)
    bh = 0.022
    for k in range(3):  # bottom boards
        y = -W / 2 + 0.05 + k * (W - 0.1) / 2
        o = core.soft_box('bottom', (L, 0.1, bh), at=(0, y, bh / 2), n=14, subsurf=0); assign(o, wood)
    for i in range(3):
        for k in range(3):
            x = -L / 2 + 0.05 + i * (L - 0.1) / 2
            y = -W / 2 + 0.05 + k * (W - 0.1) / 2
            o = core.soft_box('block', (0.1, 0.1, 0.078), at=(x, y, bh + 0.039 - 0.001), n=14, subsurf=0); assign(o, woody)
    for i in range(3):  # stringers across
        x = -L / 2 + 0.05 + i * (L - 0.1) / 2
        o = core.soft_box('stringer', (0.1, W, bh), at=(x, 0, bh + 0.078 + bh / 2 - 0.002), n=14, subsurf=0); assign(o, woody)
    n = 7
    for k in range(n):
        y = -W / 2 + 0.05 + k * (W - 0.1) / (n - 1)
        o = core.soft_box('top', (L, 0.1, bh), at=(0, y, bh * 2 + 0.078 + bh / 2 - 0.004), n=14, subsurf=0); assign(o, wood)

TYPES = {
    'hd-fire-hydrant': {'label': 'Fire hydrant (HD)', 'category': 'street', 'options': {'color': 'paint color'}, 'build': build_hydrant,
                        'variants': {'red-classic': dict(), 'yellow-silver-caps': dict(color='#e3b31c', cap='#cfd2d4'), 'tall-red-white': dict(style='tall', color='#b8251b', cap='#efece4', wear=0.2)}},
    'hd-bench': {'label': 'Bench (HD)', 'category': 'street', 'options': {'color': 'frame color'}, 'build': build_bench,
                 'variants': {'park-cast-iron': dict(), 'park-long': dict(l=2.4, color='#202020', wood='#6e5136'), 'concrete-modern': dict(style='concrete', wood='#9c7a52'), 'steel-modern': dict(style='steel', color='#34383c', wood='#b58a5b')}},
    'hd-bollard': {'label': 'Bollard (HD)', 'category': 'street', 'options': {'color': 'paint color'}, 'build': build_bollard,
                   'variants': {'stainless': dict(style='steel'), 'cast-iron-black': dict(style='cast-iron', gold_band=True), 'concrete-dome': dict(style='concrete')}},
    'hd-trash-can': {'label': 'Trash can (HD)', 'category': 'street', 'options': {'color': 'frame color'}, 'build': build_trashcan,
                     'variants': {'galvanized': dict(), 'park-slatted': dict(style='park')}},
    'hd-traffic-cone': {'label': 'Traffic cone (HD)', 'category': 'street', 'options': {}, 'build': build_cone,
                        'variants': {'tall': dict(), 'small': dict(h=0.45)}},
    'hd-manhole': {'label': 'Manhole cover (HD)', 'category': 'street', 'options': {}, 'build': build_manhole,
                   'variants': {'round': dict(), 'round-in-asphalt': dict(plate=True)}},
    'hd-crate': {'label': 'Wooden crate (HD)', 'category': 'street', 'options': {}, 'build': build_crate,
                 'variants': {'pine-lidded': dict(), 'weathered-open': dict(wood='#8f8068', lid=False), 'large': dict(size=0.9, wood='#c09868')}},
    'hd-barrel': {'label': 'Barrel (HD)', 'category': 'street', 'options': {'color': 'drum paint'}, 'build': build_barrel,
                  'variants': {'steel-blue': dict(), 'steel-red-rusty': dict(color='#9a2418', wear=0.6), 'oak': dict(kind='oak')}},
    'hd-pallet': {'label': 'Pallet (HD)', 'category': 'street', 'options': {}, 'build': build_pallet,
                  'variants': {'euro': dict(), 'weathered': dict(wood='#8e8270')}},
}
