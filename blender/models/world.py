"""HD history, creatures (statues), military display items (no guns), places, small buildings,
people (dress forms, artist mannequins), animals (birds on perches, fish bowls, cat figurines),
and simple vehicles (bicycles, kick scooters)."""
import math, random
from mathutils import Vector
from lib import core, cloth
from lib.mats import mat, assign

def flat(c, name=None, rough=0.4, metal=0.0): return mat(name or f'flat_{c[1:]}', 'flat', color=c, rough=rough, metal=metal)
def wood(c='#8a5a32', axis='X', name=None): return mat(name or f'wood_{axis.lower()}_{c[1:]}', 'wood', color=c, axis=axis, ring=9, bump=0.3)
def stone(c='#a8a296', name='stone', lichen=0.0): return mat(name, 'stone', color=c, lichen=lichen, cracks=1.0, bump=0.6)
def iron(): return mat('iron', 'painted_metal', color='#2a2622', metal=0.8, wear=0.4, rough=0.5)
def chrome(): return mat('chrome', 'chrome')

# ------------------------------------------------------------------ history
def build_amphora(p):
    m = mat('terracotta_primary', 'ceramic', color=p.get('color', '#b5643c'), tint=True, rough=0.75, speckle=True)
    H = p.get('h', 0.7)
    prof = [(0.0, 0.0), (0.03, 0.0), (0.04, 0.04), (0.1, H * 0.25), (0.17, H * 0.5), (0.16, H * 0.68), (0.07, H * 0.8), (0.05, H * 0.9), (0.062, H * 0.97), (0.062, H)]
    from models.props import vessel
    vessel('amphora', prof, 0.007, m)
    for s in (-1, 1):
        h = core.tube_path('handle', [(s * 0.055, 0, H * 0.9), (s * 0.13, 0, H * 0.92), (s * 0.15, 0, H * 0.8), (s * 0.15, 0, H * 0.7), (s * 0.155, 0, H * 0.66)], 0.013); assign(h, m)
    if p.get('stand', True):   # the amphora rests in a stand ring (its belly touches the ring's inner rim)
        ring = core.lathe('stand_ring', [(0.07, 0), (0.1, 0), (0.1, 0.16), (0.07, 0.16)], steps=48); assign(ring, iron())
        for o in core.mesh_objects():
            if o.name.startswith(('amphora', 'handle', 'band')):
                o.location.z += 0.05
    if p.get('pattern'):
        band = core.lathe('band', [(0.171, H * 0.47 + 0.03), (0.171, H * 0.53 + 0.03)], steps=72); assign(band, flat('#1c1410', 'black_figure', 0.6))

def build_column(p):
    m = stone(p.get('color', '#e2dccf'), 'marble_column') if p.get('mat', 'marble') == 'stone' else mat('marble_column', 'marble', color=p.get('color', '#ece8df'), vein='#9a948c')
    H = p.get('h', 2.4)
    order = p.get('order', 'doric')
    base = core.soft_box('plinth', (0.6, 0.6, 0.12), at=(0, 0, 0.06), n=16, subsurf=0); assign(base, m)
    torus = core.lathe('base_torus', [(0.0, 0.12), (0.27, 0.12), (0.29, 0.15), (0.27, 0.18), (0.24, 0.19), (0.0, 0.19)], steps=64); assign(torus, m)
    shaft_h = H * (p.get('broken', 1.0))
    shaft = core.lathe('shaft', [(0, 0.19), (0.23, 0.19), (0.21, 0.19 + shaft_h - 0.35), (0, 0.19 + shaft_h - 0.35)] if p.get('broken', 1.0) == 1.0 else [(0, 0.19), (0.23, 0.19), (0.22, 0.19 + shaft_h), (0, 0.19 + shaft_h)], steps=48)
    for v in shaft.data.vertices:  # flutes
        a = math.atan2(v.co.y, v.co.x)
        r = math.hypot(v.co.x, v.co.y)
        if r > 0.05:
            k = 1 - 0.03 * (0.5 + 0.5 * math.cos(a * 20))
            v.co.x *= k; v.co.y *= k
    if p.get('broken', 1.0) < 1.0:  # jagged break
        top = 0.19 + shaft_h
        rnd = random.Random(4)
        for v in shaft.data.vertices:
            if v.co.z > top - 1e-4:
                v.co.z += rnd.uniform(-0.06, 0.03) + 0.04 * math.sin(math.atan2(v.co.y, v.co.x) * 2)
        assign(shaft, m)
        rub = core.sphere('rubble', 0.08, seg=12, rings=8, scale=(1.3, 1, 0.6)); rub.location = (0.35, 0.1, 0.07); assign(rub, m)
        return
    assign(shaft, m)
    zt = 0.19 + shaft_h - 0.35
    if order == 'doric':
        cap = core.lathe('echinus', [(0, zt), (0.21, zt), (0.24, zt + 0.04), (0.3, zt + 0.12), (0.0, zt + 0.12)], steps=64); assign(cap, m)
        ab = core.soft_box('abacus', (0.64, 0.64, 0.1), at=(0, 0, zt + 0.17), n=16, subsurf=0); assign(ab, m)
    else:  # ionic volutes
        cap = core.soft_box('capital', (0.62, 0.42, 0.12), at=(0, 0, zt + 0.06), n=10, subsurf=1); assign(cap, m)
        for s in (-1, 1):
            vol = core.lathe('volute', [(0.04 + 0.03 * math.cos(a), 0.03 * math.sin(a)) for a in [i * math.tau / 16 for i in range(17)]], steps=32, rot=(math.radians(90), 0, 0))
            vol.location = (s * 0.28, 0, zt + 0.04); vol.scale = (1, 5.2, 1); assign(vol, m)
        ab = core.soft_box('abacus', (0.6, 0.5, 0.06), at=(0, 0, zt + 0.15), n=16, subsurf=0); assign(ab, m)

def build_chest(p):
    W, D, H = p.get('w', 0.7), 0.42, 0.36
    w = mat('chest_wood', 'wood', color=p.get('wood', '#6a4428'), axis='X', ring=8, bump=0.5)
    met = mat('gold_trim', 'metal', color='#c9a24a', metal=1, rough=0.3) if p.get('trim', 'gold') == 'gold' else iron()
    box = core.soft_box('box', (W, D, H), at=(0, 0, H / 2), n=18, subsurf=0); assign(box, w)
    lid = core.lathe('lid', [(0, -W / 2), (D / 2, -W / 2), (D / 2, W / 2), (0, W / 2)], steps=2)
    # barrel-top lid: half cylinder along X
    import bmesh
    core.bpy.data.objects.remove(lid)
    lid = core.cylinder('lid', D / 2, W, verts=32, rot=(0, math.radians(90), 0)); lid.location = (-W / 2, 0, H)
    bm = bmesh.new(); bm.from_mesh(lid.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 1e-4], context='VERTS')
    bm.to_mesh(lid.data); bm.free()
    import bmesh as _b
    sol = lid.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.03
    assign(lid, w)
    cap = core.cylinder('lid_end', D / 2, 0.02, verts=32, rot=(0, math.radians(90), 0))
    for s in (-1, 1):
        e = core.cylinder('lid_end', D / 2, 0.02, verts=32, rot=(0, math.radians(90), 0)); e.location = (s * W / 2 - (0.02 if s > 0 else 0), 0, H)
        bm = bmesh.new(); bm.from_mesh(e.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 1e-4], context='VERTS')
        bm.to_mesh(e.data); bm.free()
        assign(e, w)
    core.bpy.data.objects.remove(cap)
    for x in (-W * 0.35, 0, W * 0.35) if W > 0.5 else (-W * 0.3, W * 0.3):
        band = core.soft_box('band', (0.04, D + 0.008, H), at=(x, 0, H / 2), n=12, subsurf=0); assign(band, met)
        arc = core.lathe('lid_band', [(D / 2 + 0.002, -0.02), (D / 2 + 0.008, -0.02), (D / 2 + 0.008, 0.02), (D / 2 + 0.002, 0.02)], steps=32, rot=(0, math.radians(90), 0)); arc.location = (x, 0, H)
        bm = bmesh.new(); bm.from_mesh(arc.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.x > 1e-4)], context='VERTS')
        bm.to_mesh(arc.data); bm.free()
        assign(arc, met)
    lock = core.soft_box('lock', (0.08, 0.02, 0.1), at=(0, -D / 2 - 0.008, H - 0.02), n=6, subsurf=1); assign(lock, met)
    if p.get('open'):
        pass
    if p.get('treasure', True):
        rnd = random.Random(5)
        coins = []
        for k in range(30):
            c = core.cylinder('coin', 0.014, 0.003, verts=16, rot=(rnd.uniform(-1, 1), rnd.uniform(-1, 1), 0))
            c.location = (rnd.uniform(-W * 0.3, W * 0.3), -D / 2 - 0.02 - rnd.uniform(0, 0.12), 0.003 + rnd.uniform(0, 0.004))
            c.location.z = 0.008
            coins.append(c)
        pile = core.join(coins, 'coins'); assign(pile, mat('gold_coin', 'metal', color='#e0b84a', metal=1, rough=0.2))

# ------------------------------------------------------------------ creatures (statues)
def _catmull(pts, n=12):
    """Dense Catmull-Rom points through pts."""
    P = [Vector(p) for p in pts]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out

def taper_tube(name, pts, r0, r1, seg=18, n=12, flat=1.0, ease=1.0):
    """Closed tube swept along a smooth path whose radius goes r0 -> r1 (ease shapes the taper); ends capped."""
    C = _catmull(pts, n)
    verts, faces = [], []
    up = Vector((0, 0, 1))
    m = len(C)
    for i, c in enumerate(C):
        t = i / (m - 1)
        tan = (C[min(i + 1, m - 1)] - C[max(i - 1, 0)]).normalized()
        side = tan.cross(up)
        if side.length < 1e-4: side = tan.cross(Vector((0, 1, 0)))
        side.normalize(); nrm = side.cross(tan).normalized()
        r = r0 + (r1 - r0) * t ** ease
        for k in range(seg):
            a = k / seg * math.tau
            verts.append(tuple(c + side * math.cos(a) * r + nrm * math.sin(a) * r * flat))
    for i in range(m - 1):
        for k in range(seg):
            faces.append((i * seg + k, i * seg + (k + 1) % seg, (i + 1) * seg + (k + 1) % seg, (i + 1) * seg + k))
    verts.append(tuple(C[0])); verts.append(tuple(C[-1]))
    a0, a1 = len(verts) - 2, len(verts) - 1
    for k in range(seg):
        faces.append(((k + 1) % seg, k, a0))
        faces.append(((m - 1) * seg + k, (m - 1) * seg + (k + 1) % seg, a1))
    o = core.from_pydata(name, verts, faces)
    core.smooth(o)
    return o

def build_dragon_statue(p):
    """Seated dragon (sejant) on a plinth: haunches, upright chest, S-curved neck, horned head,
    clawed forelegs, tail curled round the base, back spines and folded (or half-raised) wings."""
    m = {'stone': stone('#8f8a80', 'statue_stone', lichen=0.2), 'bronze': mat('bronze_statue', 'metal', color='#6b5530', metal=1, rough=0.32),
         'jade': mat('jade', 'ceramic', color='#3f8a5f', rough=0.15)}[p.get('mat', 'stone')]
    parts = []
    add = lambda o: (assign(o, m), parts.append(o))[1] if False else (assign(o, m) or parts.append(o) or o)
    add(core.soft_box('plinth', (0.5, 0.4, 0.1), at=(0, 0, 0.05), n=12, subsurf=1))
    add(core.soft_box('plinth_cap', (0.46, 0.36, 0.02), at=(0, 0, 0.105), n=10, subsurf=1))
    Z = 0.115  # top of plinth
    # haunches + hind feet
    for s in (-1, 1):
        add(core.sphere('haunch', 0.07, seg=32, rings=16, scale=(0.62, 1.25, 1.0), at=(s * 0.058, 0.07, Z + 0.075)))
        add(taper_tube('hind_foot', [(s * 0.085, 0.07, Z + 0.03), (s * 0.095, 0.0, Z + 0.018), (s * 0.1, -0.04, Z + 0.016)], 0.028, 0.02, flat=0.6))
        for c in (-1, 0, 1):
            add(core.cylinder('claw', 0.007, 0.03, at=(s * 0.1 + c * 0.012, -0.045, Z + 0.008), r2=0.0015, verts=8, rot=(math.radians(-80), 0, 0)))
    # torso: from the tail root up through an upright chest
    add(taper_tube('torso', [(0, 0.11, Z + 0.06), (0, 0.06, Z + 0.1), (0, -0.0, Z + 0.17), (0, -0.04, Z + 0.24)], 0.08, 0.06, ease=0.8))
    add(core.sphere('chest', 0.068, seg=32, rings=16, scale=(1, 0.95, 1.2), at=(0, -0.035, Z + 0.2)))
    # neck: S-curve up and forward
    neck_pts = [(0, -0.04, Z + 0.24), (0, -0.075, Z + 0.31), (0, -0.06, Z + 0.38), (0, -0.075, Z + 0.43)]
    add(taper_tube('neck', neck_pts, 0.05, 0.034))
    # head pointing forward (-y) with a slightly lowered snout
    head = core.loft('head', [(-0.02, 0.034, 0.034, 0), (0.03, 0.037, 0.033, 0.0), (0.075, 0.028, 0.024, -0.006), (0.11, 0.021, 0.017, -0.012), (0.13, 0.016, 0.012, -0.015), (0.137, 0.01, 0.008, -0.016)], seg=24, power=2.2)
    head.rotation_euler = (0, 0, -math.pi / 2); head.location = (0, -0.08, Z + 0.44); core.add_subsurf(head, 1); add(head)
    hx, hy, hz = 0, -0.08, Z + 0.44
    jaw = core.loft('jaw', [(0.0, 0.026, 0.012, 0), (0.06, 0.022, 0.011, 0), (0.115, 0.012, 0.007, 0.002)], seg=16)
    jaw.rotation_euler = (math.radians(0), math.radians(12), -math.pi / 2); jaw.location = (0, hy - 0.005, hz - 0.03); core.add_subsurf(jaw, 1); add(jaw)
    for s in (-1, 1):
        add(core.sphere('brow', 0.014, seg=16, rings=8, scale=(1, 1.6, 0.7), at=(s * 0.022, hy - 0.04, hz + 0.022)))
        add(core.sphere('eye', 0.008, seg=12, rings=8, at=(s * 0.027, hy - 0.048, hz + 0.012)))
        add(core.sphere('nostril', 0.005, seg=10, rings=6, at=(s * 0.009, -0.205, hz - 0.009)))
        add(taper_tube('horn', [(s * 0.02, hy + 0.0, hz + 0.025), (s * 0.035, hy + 0.05, hz + 0.05), (s * 0.04, hy + 0.1, hz + 0.05), (s * 0.038, hy + 0.13, hz + 0.03)], 0.011, 0.0015, ease=0.9))
        add(taper_tube('frill', [(s * 0.03, hy + 0.01, hz - 0.005), (s * 0.05, hy + 0.04, hz - 0.01), (s * 0.06, hy + 0.06, hz - 0.03)], 0.006, 0.001))
    # forelegs: shoulder -> elbow -> forefoot on the plinth, three claws each
    for s in (-1, 1):
        add(taper_tube('foreleg', [(s * 0.05, -0.04, Z + 0.23), (s * 0.07, -0.06, Z + 0.15), (s * 0.065, -0.085, Z + 0.07), (s * 0.065, -0.1, Z + 0.02)], 0.03, 0.02))
        add(core.sphere('forefoot', 0.025, seg=20, rings=10, scale=(1.1, 1.4, 0.6), at=(s * 0.065, -0.115, Z + 0.012)))
        for c in (-1, 0, 1):
            add(core.cylinder('claw', 0.006, 0.026, at=(s * 0.065 + c * 0.012, -0.142, Z + 0.006), r2=0.0012, verts=8, rot=(math.radians(-80), 0, 0)))
    # tail: from the rump round the side of the plinth, ending in a spade
    tail = [(0, 0.12, Z + 0.05), (0.08, 0.16, Z + 0.025), (0.17, 0.11, Z + 0.02), (0.2, 0.0, Z + 0.018), (0.17, -0.1, Z + 0.016), (0.11, -0.15, Z + 0.014)]
    add(taper_tube('tail', tail, 0.042, 0.009, ease=0.7))
    add(core.extrude_outline('tail_spade', [(0, 0), (0.025, 0.012), (0.05, 0.0), (0.025, -0.012)], 0.006, at=(0.11, -0.15, Z + 0.006), rot=(0, 0, math.radians(200))))
    # spines down the neck and back
    spine_path = _catmull([(0, -0.075, Z + 0.43), (0, -0.06, Z + 0.38), (0, -0.075, Z + 0.31), (0, -0.0, Z + 0.17), (0, 0.06, Z + 0.1), (0, 0.11, Z + 0.06)], 6)
    for i in range(1, len(spine_path) - 2, 2):
        c = spine_path[i]
        prev, nxt = spine_path[i - 1], spine_path[i + 1]
        tan = (nxt - prev).normalized()
        back = Vector((0, 1, 0.4)).normalized()
        h = 0.03 * (1 - 0.4 * i / len(spine_path))
        sp = core.cylinder('spine', 0.012, h, verts=8, r2=0.0015)
        sp.location = c + back * 0.035
        sp.rotation_euler = (math.radians(-45), 0, 0)
        add(sp)
    # wings
    raised = bool(p.get('wings'))
    for s in (-1, 1):
        sh = Vector((s * 0.045, 0.02, Z + 0.22))
        wrist = sh + (Vector((s * 0.14, 0.1, 0.17)) if raised else Vector((s * 0.05, 0.08, 0.08)))
        add(taper_tube('wing_arm', [tuple(sh), tuple(sh.lerp(wrist, 0.5) + Vector((s * 0.01, 0, 0.02))), tuple(wrist)], 0.018, 0.009))
        tips = ([Vector((s * 0.05, 0.16, -0.05)), Vector((s * 0.02, 0.2, -0.16)), Vector((s * -0.03, 0.17, -0.24))] if raised
                else [Vector((0.0, 0.12, -0.06)), Vector((s * -0.01, 0.13, -0.12)), Vector((s * -0.02, 0.1, -0.16))])
        prev = wrist
        for k, tdir in enumerate(tips):
            tip = wrist + tdir
            add(taper_tube('wing_finger', [tuple(wrist), tuple(wrist.lerp(tip, 0.5) + Vector((0, 0, 0.01))), tuple(tip)], 0.008, 0.002))
        # membrane: thin fan between shoulder, wrist and finger tips (scalloped trailing edge)
        ring = [sh, wrist] + [wrist + t for t in tips] + [sh + Vector((0, 0.09, -0.05))]
        verts, faces = [], []
        cen = sum(ring, Vector()) / len(ring)
        for v in ring: verts.append(tuple(v))
        verts.append(tuple(cen))
        c = len(verts) - 1
        for k in range(len(ring)):
            faces.append((k, (k + 1) % len(ring), c))
        mem = core.from_pydata('wing_membrane', verts, faces)
        core.add_subsurf(mem, 2)
        add(mem)
        # give the membrane thickness
        import bpy
        sol = mem.modifiers.new('solid', 'SOLIDIFY'); sol.thickness = 0.004; sol.offset = 0

def build_gargoyle(p):
    m = stone(p.get('color', '#7f7b74'), 'gargoyle_stone', lichen=p.get('lichen', 0.3))
    base = core.soft_box('ledge', (0.42, 0.42, 0.14), at=(0, 0, 0.07), n=10, subsurf=1); assign(base, m)
    body = core.sphere('body', 0.13, seg=32, rings=16, scale=(0.9, 0.8, 1.15)); body.location = (0, 0.02, 0.27); core.add_subsurf(body, 1); assign(body, m)
    head = core.sphere('head', 0.085, seg=32, rings=16, scale=(1, 1.1, 0.9)); head.location = (0, -0.07, 0.42); core.add_subsurf(head, 1); assign(head, m)
    snout = core.sphere('snout', 0.05, seg=24, rings=12, scale=(1, 1.2, 0.7)); snout.location = (0, -0.15, 0.4); assign(snout, m)
    for s in (-1, 1):
        ear = core.cylinder('ear', 0.025, 0.08, at=(s * 0.06, -0.05, 0.47), r2=0.003, rot=(0.3, s * 0.5, 0)); assign(ear, m)
        eye = core.sphere('eye', 0.016, at=(s * 0.035, -0.145, 0.44), seg=12, rings=8); assign(eye, m)
        haunch = core.sphere('haunch', 0.075, seg=24, rings=12, scale=(0.8, 1.3, 0.9)); haunch.location = (s * 0.1, -0.02, 0.19); assign(haunch, m)
        arm = core.tube_path('arm', [(s * 0.09, -0.06, 0.32), (s * 0.08, -0.12, 0.22), (s * 0.06, -0.14, 0.145)], 0.03); assign(arm, m)
        wing = core.extrude_outline('wing', [(0, 0), (0.12, 0.16), (0.22, 0.3), (0.14, 0.26), (0.1, 0.32), (0.05, 0.22), (0.0, 0.25)], 0.02)
        wing.rotation_euler = (math.radians(75), 0, math.radians(90) + s * 0.5); wing.location = (s * 0.06, 0.1, 0.25); assign(wing, m)
    tail = core.tube_path('tail', [(0, 0.12, 0.16), (0.1, 0.2, 0.145), (0.18, 0.12, 0.145)], 0.018); assign(tail, m)

def build_dragon_egg(p):
    m = mat('egg_shell', 'leather', color=p.get('color', '#3f6a5a'), grain=40, bump=1.0)
    nest = core.lathe('nest', [(0, 0), (0.14, 0), (0.17, 0.04), (0.15, 0.08), (0.11, 0.06), (0, 0.05)], steps=48)
    for v in nest.data.vertices:
        a = math.atan2(v.co.y, v.co.x)
        k = 1 + 0.06 * math.sin(a * 13 + v.co.z * 80)
        v.co.x *= k; v.co.y *= k
    assign(nest, mat('nest_twigs', 'bark', color='#6a5034', bump=1.0))
    egg = core.lathe('egg', [(0, 0.05)] + [(0.085 * math.sin(math.pi * t / 16) * (1 - 0.25 * (t / 16)), 0.05 + 0.13 * (1 - math.cos(math.pi * t / 16))) for t in range(1, 16)] + [(0, 0.31)], steps=48)
    assign(egg, m)
    if p.get('glow'):
        crack = core.lathe('glow_crack', [(0.084, 0.16), (0.0855, 0.165)], steps=48); assign(crack, mat('ember', 'emissive', color='#ff7a1a', emit='#ff6a00', strength=3.0))

# ------------------------------------------------------------------ military (display items only)
def build_ammo_crate(p):
    W, D, H = 0.8, 0.45, 0.4
    w = mat('crate_olive', 'planks', color=p.get('color', '#4f5a36'), tint=True, board=0.1, bump=0.5)
    box = core.soft_box('crate', (W, D, H), at=(0, 0, H / 2), n=14, subsurf=0); assign(box, w)
    lid = core.soft_box('lid', (W + 0.02, D + 0.02, 0.04), at=(0, 0, H + 0.018), n=10, subsurf=1); assign(lid, w)
    met = iron()
    for s in (-1, 1):
        h = core.tube_path('rope_handle', [(s * (W / 2 + 0.002), -0.08, H * 0.6), (s * (W / 2 + 0.04), -0.06, H * 0.5), (s * (W / 2 + 0.04), 0.06, H * 0.5), (s * (W / 2 + 0.002), 0.08, H * 0.6)], 0.01)
        assign(h, mat('rope', 'fabric', color='#b8a07a', bump=0.8))
        latch = core.soft_box('latch', (0.06, 0.02, 0.06), at=(s * W * 0.3, -D / 2 - 0.008, H), n=6, subsurf=1); assign(latch, met)
    sten = core.text_mesh('stencil', p.get('label', 'SUPPLIES'), 0.07, depth=0.0008, at=(0, -D / 2 - 0.0005, H * 0.5), rot=(math.radians(90), 0, 0))
    assign(sten, flat('#e8e2c8', 'stencil_paint', 0.8))

def build_helmet(p):
    kind = p.get('kind', 'medieval')
    stand = core.lathe('stand', [(0, 0), (0.09, 0), (0.09, 0.02), (0.015, 0.03), (0.015, 0.2), (0, 0.2)], steps=48); assign(stand, mat('wood_z', 'wood', color='#3b2416', axis='Z'))
    if kind == 'medieval':
        m = mat('steel_polished', 'metal', color='#c3c6ca', metal=1, rough=0.25, axis='Z')
        dome = core.lathe('helm', [(0, 0.42), (0.06, 0.415), (0.1, 0.39), (0.12, 0.33), (0.125, 0.25), (0.12, 0.19), (0.115, 0.19), (0.12, 0.25), (0.115, 0.33), (0.095, 0.385), (0.055, 0.41), (0, 0.415)], steps=64)
        assign(dome, m)
        slit = core.soft_box('visor_slit', (0.12, 0.01, 0.012), at=(0, -0.124, 0.31), n=6, subsurf=0); assign(slit, flat('#0a0a0a', 'slit_dark', 0.9))
        ridge = core.lathe('crest', [(0.0, 0.42), (0.004, 0.42)], steps=8)
        core.bpy.data.objects.remove(ridge)
        rivets = []
        for k in range(16):
            a = k * math.tau / 16
            rivets.append(core.sphere('rivet', 0.006, at=(math.cos(a) * 0.123, math.sin(a) * 0.123, 0.22), seg=8, rings=4))
        assign(core.join(rivets, 'rivets'), m)
    else:  # WWII-style steel pot helmet, olive drab
        m = mat('paint_primary_helmet', 'painted_metal', color=p.get('color', '#4f5a36'), tint=True, metal=0.4, wear=0.35, rough=0.6)
        dome = core.lathe('helm', [(0, 0.37), (0.07, 0.365), (0.11, 0.33), (0.13, 0.27), (0.14, 0.2), (0.15, 0.195), (0.15, 0.19), (0.13, 0.19), (0.125, 0.27), (0.105, 0.325), (0.065, 0.355), (0, 0.36)], steps=64)
        assign(dome, m)
        for s in (-1, 1):
            strap = core.tube_path('chin_strap', [(s * 0.13, 0.0, 0.2), (s * 0.12, -0.02, 0.15), (s * 0.06, -0.06, 0.12), (0, -0.07, 0.115)], 0.006); assign(strap, mat('strap', 'leather', color='#5a4a30'))
    inner_top = 0.415 if kind == 'medieval' else 0.36   # the helmet rests on a padded head form
    post_top = core.sphere('stand_head', 0.1, at=(0, 0, inner_top + 0.003 - 0.125), seg=24, rings=12, scale=(1, 1, 1.25)); assign(post_top, mat('form_black', 'flat', color='#1c1c1c', rough=0.6))

def build_shield(p):
    kind = p.get('kind', 'round')
    stand = core.soft_box('stand_base', (0.4, 0.25, 0.04), at=(0, 0.06, 0.02), n=8, subsurf=1); assign(stand, mat('wood_x', 'wood', color='#3b2416', axis='X'))
    post = core.post_between('stand_post', (0, 0.1, 0.03), (0, 0.1, 0.45), (0.04, 0.03), bevel=0.005); assign(post, mat('wood_z', 'wood', color='#3b2416', axis='Z'))
    lean = math.radians(12)
    if kind == 'round':
        R = 0.38
        face = core.cylinder('shield', R, 0.02, verts=64, rot=(math.radians(90) - lean, 0, 0)); face.location = (0, 0.06, 0.04 + R)
        assign(face, mat('paint_primary_shield', 'planks', color=p.get('color', '#7a1f24'), tint=True, board=0.12, bump=0.5))
        rim = core.lathe('rim', [(R - 0.005, -0.014), (R + 0.006, -0.014), (R + 0.006, 0.014), (R - 0.005, 0.014)], steps=72, rot=(math.radians(90) - lean, 0, 0)); rim.location = face.location; assign(rim, iron())
        boss = core.sphere('boss', 0.08, seg=32, rings=16, scale=(1, 0.6, 1)); boss.location = (0, 0.06 - 0.02, 0.04 + R + 0.0); boss.rotation_euler = (-lean, 0, 0); assign(boss, iron())
        if p.get('stripes', True):
            for k in range(4):
                a = k * math.pi / 2 + math.pi / 4
                st = core.post_between('paint_stripe', (0, 0.06 - 0.011 * math.cos(lean), 0.04 + R), (math.cos(a) * R * 0.95, 0.06 - 0.011 * math.cos(lean) + math.sin(a) * R * math.sin(lean) * 0.95, 0.04 + R + math.sin(a) * R * math.cos(lean) * 0.95), (0.06, 0.002), bevel=0)
                assign(st, flat(p.get('stripe', '#e8dcc0'), 'shield_paint', 0.7))
    else:  # heater shield with a heraldic stripe
        pts = [(-0.27, 0.35), (0.27, 0.35), (0.27, 0.05), (0.18, -0.2), (0.0, -0.36), (-0.18, -0.2), (-0.27, 0.05)]
        face = core.extrude_outline('shield', pts, 0.025, bevel=0.008, rot=(math.radians(90) - lean, 0, 0)); face.location = (0, 0.07, 0.42)
        assign(face, mat('paint_primary_shield', 'painted_metal', color=p.get('color', '#1f3a6b'), tint=True, metal=0.2, wear=0.3))
        band = core.extrude_outline('bend', [(-0.27, 0.2), (-0.17, 0.35), (0.27, -0.05), (0.18, -0.2)], 0.004, rot=(math.radians(90) - lean, 0, 0)); band.location = (0, 0.07 - 0.026 * math.cos(lean), 0.42 + 0.026 * math.sin(lean))
        assign(band, flat(p.get('stripe', '#d9b45a'), 'heraldry_gold', 0.4, 0.6))

def build_sword_display(p):
    plaque = core.soft_box('plaque', (0.22, 0.04, 1.05), n=12, subsurf=1); plaque.location = (0, 0.04, 0.6); plaque.rotation_euler = (math.radians(-8), 0, 0)
    assign(plaque, mat('wood_z', 'wood', color=p.get('wood', '#4a2a16'), axis='Z'))
    foot = core.soft_box('stand_foot', (0.36, 0.3, 0.05), at=(0, 0.06, 0.025), n=10, subsurf=1); assign(foot, mat('wood_x', 'wood', color=p.get('wood', '#4a2a16'), axis='X'))
    lean = math.radians(-8)
    def on(z, off=0.026):  # point on the plaque front at height z
        return (0, 0.04 - 0.02 - off * math.cos(lean) + (z - 0.6) * math.sin(-lean), z)
    steel = mat('blade_steel', 'metal', color='#d0d3d6', metal=1, rough=0.18, axis='Z')
    gold = mat('gold_trim', 'metal', color='#c9a24a', metal=1, rough=0.3)
    kind = p.get('kind', 'longsword')
    L = 0.75 if kind == 'longsword' else 0.6
    blade = core.post_between('blade', on(0.12), on(0.12 + L), (0.045 if kind == 'longsword' else 0.035, 0.006), bevel=0.0015); assign(blade, steel)
    tip = core.cylinder('tip', 0.024, 0.06, verts=4, r2=0.0005); tip.location = on(0.12 + L - 0.005); tip.scale = (1, 0.2, 1); tip.rotation_euler = (lean, 0, math.radians(45)); assign(tip, steel)
    guard = core.post_between('crossguard', (-0.11, on(0.12)[1], 0.12), (0.11, on(0.12)[1], 0.12), (0.018, 0.02), bevel=0.004) if kind == 'longsword' else core.lathe('guard', [(0.03, -0.006), (0.045, -0.006), (0.045, 0.006), (0.03, 0.006)], steps=32)
    if kind != 'longsword':
        guard.location = on(0.12)
    assign(guard, gold)
    grip = core.post_between('grip', on(0.12), on(-0.04 + 0.12 - 0.0), None, round_=True, r=0.014)
    grip = core.post_between('grip', on(0.13), on(0.12 - 0.15 + 0.15 * 0 + 0.0 + 0.15 * 0), None, round_=True, r=0.014)
    core.bpy.data.objects.remove(grip)
    grip = core.post_between('grip', on(0.12), on(0.12 - 0.0001), None, round_=True, r=0.0001)
    core.bpy.data.objects.remove(grip)
    # handle pointing down below the guard: plaque starts at 0.075, handle 0.12 → 0.12 down to 0.07? keep sword point-up with grip below guard
    hg = core.post_between('grip', on(0.12), on(0.0 + 0.12 - 0.11), None, round_=True, r=0.014); assign(hg, mat('grip_leather', 'leather', color='#3a2416'))
    pommel = core.sphere('pommel', 0.022, seg=16, rings=8); pommel.location = on(0.12 - 0.12); assign(pommel, gold)
    for z in (0.3, 0.6):
        peg = core.post_between('peg', on(z, 0.0), on(z, 0.035), None, round_=True, r=0.006); assign(peg, gold)

# ------------------------------------------------------------------ places
def build_gazebo(p):
    R, H = p.get('r', 1.6), 2.4
    sides = p.get('sides', 6)
    w = mat('paint_primary_gazebo', 'planks', color=p.get('color', '#efede6'), tint=True, board=0.12, bump=0.4)
    floor = core.lathe('deck', [(0, 0), (R + 0.2, 0), (R + 0.2, 0.25), (0, 0.25)], steps=sides);  # deck corners line up with the posts
    assign(floor, mat('deck_wood', 'planks', color='#8a6a48', board=0.14, bump=0.5))
    roof_m = mat('roof_shingle', 'shingle', color=p.get('roof', '#5a3a2a'), row=0.12, bump=0.8)
    posts = []
    for k in range(sides):
        a = k * math.tau / sides
        x, y = math.cos(a) * R, math.sin(a) * R
        po = core.soft_box('post', (0.1, 0.1, H), at=(x, y, 0.25 + H / 2), n=14, subsurf=0); po.rotation_euler = (0, 0, a); assign(po, w)
        if k != 0:  # railing on all sides except the entrance
            a2 = (k + 1) * math.tau / sides
            x2, y2 = math.cos(a2) * R, math.sin(a2) * R
            for z in (0.35, 1.15):
                r = core.post_between('rail', (x, y, z), (x2, y2, z), (0.06, 0.05), bevel=0.006); assign(r, w)
            for t in [i / 9 for i in range(1, 9)]:
                b = core.post_between('baluster', (x + (x2 - x) * t, y + (y2 - y) * t, 0.34), (x + (x2 - x) * t, y + (y2 - y) * t, 1.16), (0.03, 0.03), bevel=0.003); assign(b, w)
        a2 = (k + 1) * math.tau / sides
        beam = core.post_between('beam', (x, y, 0.25 + H - 0.06), (math.cos(a2) * R, math.sin(a2) * R, 0.25 + H - 0.06), (0.1, 0.12), bevel=0.008); assign(beam, w)
    roof = core.lathe('roof', [(R + 0.35, 0.25 + H - 0.08), (R + 0.35, 0.25 + H), (0.08, 0.25 + H + 1.0), (0.0, 0.25 + H + 1.02), (0.0, 0.25 + H - 0.08 + 0.02)], steps=sides)
    roof.rotation_euler = (0, 0, math.pi / sides); assign(roof, roof_m)
    fin = core.lathe('finial', [(0, 0.25 + H + 1.0), (0.05, 0.25 + H + 1.0), (0.03, 0.25 + H + 1.15), (0.0, 0.25 + H + 1.25)], steps=24); assign(fin, w)
    for s in (0,):
        st = core.soft_box('step', (0.4, 0.8, 0.12), at=((R + 0.2) * math.cos(math.pi / sides) + 0.18, 0, 0.06), n=10, subsurf=0); st.rotation_euler = (0, 0, 0); assign(st, mat('deck_wood', 'planks'))

def build_fountain(p):
    m = stone(p.get('color', '#c8c1b2'), 'fountain_stone')
    water = mat('water', 'glass', color='#5a8aa0', alpha=0.6, rough=0.03)
    R = p.get('r', 1.3)
    basin = core.lathe('basin', [(0, 0), (R, 0), (R + 0.05, 0.05), (R + 0.05, 0.45), (R - 0.1, 0.45), (R - 0.1, 0.12), (0, 0.12)], steps=96); assign(basin, m)
    w = core.cylinder('pool_water', R - 0.1, 0.24, at=(0, 0, 0.12), verts=96); assign(w, water)
    tiers = p.get('tiers', 2)
    z = 0.12
    col_r = 0.12
    for k in range(tiers):
        h = 0.7 if k == 0 else 0.45
        col = core.lathe('pedestal', [(0, z), (col_r * 1.4, z), (col_r, z + 0.1), (col_r * 0.85, z + h - 0.1), (col_r * 1.2, z + h), (0, z + h)], steps=48); assign(col, m)
        z += h
        br = 0.6 - k * 0.25
        bowl = core.lathe('bowl', [(0, z - 0.02), (br * 0.3, z - 0.02), (br, z + 0.12), (br, z + 0.16), (br - 0.04, z + 0.16), (br * 0.3 - 0.02, z + 0.02), (0, z + 0.02)], steps=72); assign(bowl, m)
        ww = core.lathe('bowl_water', [(0, z + 0.02), (br - 0.045, z + 0.13)], steps=48)
        ww = core.cylinder('bowl_water', br - 0.05, 0.1, at=(0, 0, z + 0.04), verts=48, r2=br - 0.05); assign(ww, water)
        col_r *= 0.7
    top = core.lathe('spout', [(0, z + 0.02), (0.05, z + 0.02), (0.03, z + 0.2), (0.0, z + 0.25)], steps=24); assign(top, m)
    jet = core.lathe('water_jet', [(0.0, z + 0.24), (0.012, z + 0.26), (0.02, z + 0.45), (0.0, z + 0.5)], steps=16); assign(jet, water)

def build_well(p):
    m = stone(p.get('color', '#9a948a'), 'well_stone', lichen=0.25)
    ring = core.lathe('well_wall', [(0.55, 0), (0.75, 0), (0.75, 0.8), (0.72, 0.85), (0.58, 0.85), (0.55, 0.8)], steps=64); assign(ring, m)
    water = core.cylinder('water', 0.55, 0.02, at=(0, 0, 0.3), verts=48); assign(water, mat('water_dark', 'glass', color='#1f3a40', alpha=0.85))
    w = mat('wood_z', 'wood', color='#6a4a2e', axis='Z')
    for s in (-1, 1):
        po = core.soft_box('post', (0.1, 0.1, 1.5), at=(s * 0.68, 0, 0.75 + 0.6), n=14, subsurf=0); assign(po, w)
    axle = core.cylinder('windlass', 0.05, 1.45, verts=24, rot=(0, math.radians(90), 0)); axle.location = (-0.725, 0, 1.75); assign(axle, mat('wood_x', 'wood', color='#6a4a2e', axis='X'))
    crank = core.tube_path('crank', [(0.72, 0, 1.75), (0.82, 0, 1.75), (0.82, 0, 1.6), (0.9, 0, 1.6)], 0.012); assign(crank, iron())
    roof_m = mat('roof_shingle', 'shingle', color='#5a4a3a', row=0.1, bump=0.8)
    for s in (-1, 1):
        rs = core.soft_box('roof', (0.8, 1.7, 0.04), n=12, subsurf=0); rs.rotation_euler = (0, s * 0.7, 0); rs.location = (s * 0.29, 0, 2.38); rs.rotation_euler = (0, -s * 0.7, 0)
        rs.location = (s * 0.28, 0, 2.33)
        assign(rs, roof_m)
    for s in (-1, 1):
        po2 = core.soft_box('post_top', (0.1, 0.1, 0.55), at=(s * 0.68 * 0 + s * 0.0 + 0, 0, 0), n=10, subsurf=0)
        core.bpy.data.objects.remove(po2)
    ridge = core.soft_box('ridge', (0.12, 1.7, 0.08), at=(0, 0, 2.6), n=6, subsurf=1); assign(ridge, w)
    for s in (-1, 1):
        k = core.post_between('king_post', (s * 0.68, 0, 2.1), (0, 0, 2.6), (0.08, 0.08), bevel=0.006); assign(k, w)
    rope = core.post_between('rope', (0, 0, 1.75), (0, 0, 1.08), None, round_=True, r=0.008); assign(rope, mat('rope', 'fabric', color='#b8a07a', bump=0.8))
    bucket = core.lathe('bucket', [(0, 0.8), (0.1, 0.8), (0.12, 1.0), (0.11, 1.0), (0.09, 0.81), (0, 0.81)], steps=32); assign(bucket, mat('wood_z', 'wood', color='#6a4a2e', axis='Z'))
    bail = core.tube_path('bucket_bail', [(-0.115, 0, 0.99), (-0.08, 0, 1.06), (0, 0, 1.0 + 0.09), (0.08, 0, 1.06), (0.115, 0, 0.99)], 0.005); assign(bail, iron())
    rope.scale = (1, 1, 1)

def build_pergola(p):
    W, D, H = p.get('w', 3.0), p.get('d', 2.4), 2.4
    w = mat('wood_z', 'wood', color=p.get('wood', '#8a6a48'), axis='Z', ring=8, bump=0.4)
    wx = mat('wood_x', 'wood', color=p.get('wood', '#8a6a48'), axis='X', ring=8, bump=0.4)
    wy = mat('wood_y', 'wood', color=p.get('wood', '#8a6a48'), axis='Y', ring=8, bump=0.4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            po = core.soft_box('post', (0.14, 0.14, H), at=(sx * W / 2, sy * D / 2, H / 2), n=16, subsurf=0); assign(po, w)
            foot = core.soft_box('footing', (0.24, 0.24, 0.06), at=(sx * W / 2, sy * D / 2, 0.03), n=12, subsurf=0); assign(foot, stone('#a8a296', 'footing_stone'))
    for sy in (-1, 1):
        b = core.soft_box('beam', (W + 0.6, 0.08, 0.22), at=(0, sy * D / 2, H + 0.1), n=16, subsurf=0); assign(b, wx)
    n = int(W / 0.4) + 1
    for k in range(n):
        x = -W / 2 + k * W / (n - 1)
        r = core.soft_box('rafter', (0.06, D + 0.5, 0.16), at=(x, 0, H + 0.2 + 0.1), n=16, subsurf=0); assign(r, wy)
    if p.get('vines'):
        lm = mat('vine_leaves', 'foliage', color='#3f6b2a', bump=0.8)
        for sx in (-1, 1):
            v = core.tube_path('vine', [(sx * W / 2 + 0.08, -D / 2 + 0.08, 0.05), (sx * W / 2 + 0.1, -D / 2 + 0.05, 1.0), (sx * W / 2 + 0.06, -D / 2 + 0.1, 2.0), (sx * W / 2 - 0.4, -D / 2 + 0.3, H + 0.38)], 0.025)
            assign(v, mat('vine_stem', 'bark', color='#4a3a2a'))
            from models.nature import rock_mesh
            for k in range(5):
                c = rock_mesh('leaf_clump', (0.6, 0.5, 0.25), 30 + k + (5 if sx > 0 else 0), rough=0.5)
                c.location = (sx * (W / 2 - 0.3 - k * 0.45), -D / 2 + 0.4 + (k % 2) * 0.6, H + 0.35)
                assign(c, lm)

# ------------------------------------------------------------------ small buildings
def build_kiosk(p):
    W, D, H = p.get('w', 2.2), 1.6, 2.5
    body = mat('paint_primary_kiosk', 'painted_metal', color=p.get('color', '#1f4f3e'), tint=True, metal=0.3, wear=0.1)
    k = core.soft_box('body', (W, D, H), at=(0, 0, H / 2), n=20, subsurf=0); assign(k, body)
    roof = core.soft_box('roof', (W + 0.5, D + 0.5, 0.12), at=(0, 0, H + 0.06), n=10, subsurf=1); assign(roof, body)
    awning = core.soft_box('awning', (W + 0.2, 0.7, 0.03), at=(0, -D / 2 - 0.3, H - 0.25), n=8, subsurf=1, rot=(math.radians(-18), 0, 0))
    assign(awning, mat('awning_stripes', 'rug', colors=[p.get('stripe', '#efe9df'), p.get('stripe2', '#b3201b'), p.get('stripe2', '#b3201b')], pattern='kilim', aspect=3.0, bump=0.2))
    for s in (-1, 1):
        arm = core.post_between('awning_arm', (s * (W / 2 - 0.12), -D / 2 + 0.01, H - 0.6), (s * (W / 2 - 0.12), -D / 2 - 0.6, H - 0.345), None, round_=True, r=0.015); assign(arm, iron())
    win = core.soft_box('service_window', (W * 0.7, 0.02, 0.9), at=(0, -D / 2 - 0.006, 1.55), n=16, subsurf=0); assign(win, mat('glass_window', 'glass', color='#26343a', alpha=0.7, rough=0.03))
    counter = core.soft_box('counter', (W * 0.78, 0.3, 0.05), at=(0, -D / 2 - 0.14, 1.08), n=10, subsurf=1); assign(counter, mat('wood_x', 'wood', color='#8a5a32', axis='X'))
    for s in (-1, 1):
        br = core.post_between('counter_bracket', (s * W * 0.3, -D / 2, 0.85), (s * W * 0.3, -D / 2 - 0.25, 1.06), (0.03, 0.03), bevel=0.003); assign(br, iron())
    sign = core.soft_box('sign_board', (W * 0.8, 0.04, 0.3), at=(0, -D / 2 - 0.03, H - 0.05 + 0.3), n=8, subsurf=0); assign(sign, flat('#efe9df', 'sign_cream', 0.5))
    txt = core.text_mesh('sign_text', p.get('text', 'NEWS & COFFEE'), 0.16, depth=0.004, at=(0, -D / 2 - 0.052, H + 0.25), rot=(math.radians(90), 0, 0)); assign(txt, flat('#1a1a1a', 'sign_ink', 0.4))

def build_bus_shelter(p):
    W, D, H = p.get('w', 3.2), 1.4, 2.4
    frame = mat('paint_primary_frame', 'painted_metal', color=p.get('color', '#2a2d30'), tint=True, metal=0.7, wear=0.08, rough=0.35)
    glass = mat('glass_panel', 'glass', color='#c9dcdc', alpha=0.25, rough=0.02)
    pad = core.soft_box('pad', (W + 0.6, D + 0.6, 0.1), at=(0, 0, 0.05), n=20, subsurf=0); assign(pad, mat('concrete', 'concrete', color='#a19d95'))
    for sx in (-1, 1):
        for sy in (-1, 1):
            po = core.post_between('post', (sx * W / 2, sy * D / 2, 0.09), (sx * W / 2, sy * D / 2, H), (0.08, 0.08), bevel=0.006); assign(po, frame)
    roof = core.soft_box('roof', (W + 0.3, D + 0.4, 0.08), at=(0, -0.1, H + 0.04), n=12, subsurf=0, rot=(math.radians(-3), 0, 0)); assign(roof, frame)
    back = core.soft_box('back_glass', (W - 0.08, 0.02, H - 0.35), at=(0, D / 2, 0.3 + (H - 0.35) / 2), n=20, subsurf=0); assign(back, glass)
    for sx in (-1, 1):
        side = core.soft_box('side_glass', (0.02, D - 0.08, H - 0.35), at=(sx * W / 2, 0, 0.3 + (H - 0.35) / 2), n=20, subsurf=0); assign(side, glass)
    rail = core.post_between('glass_rail', (-W / 2, D / 2, 0.3), (W / 2, D / 2, 0.3), (0.05, 0.05), bevel=0.004); assign(rail, frame)
    bench = core.soft_box('bench', (W * 0.6, 0.35, 0.05), at=(0, D / 2 - 0.22, 0.48), n=10, subsurf=1); assign(bench, mat('wood_x', 'wood', color='#8a6a48', axis='X'))
    for s in (-1, 1):
        lg = core.post_between('bench_leg', (s * W * 0.25, D / 2 - 0.22, 0.09), (s * W * 0.25, D / 2 - 0.22, 0.46), (0.05, 0.25), bevel=0.004); assign(lg, frame)
    ad = core.soft_box('ad_panel', (0.04, D - 0.2, 1.6), at=(W / 2 - 0.04, 0, 1.2), n=10, subsurf=0)
    assign(ad, mat('ad_light', 'emissive', color='#e8eef2', emit='#f0f6ff', strength=0.5))

# ------------------------------------------------------------------ people
def build_dress_form(p):
    fab = mat('fabric_primary_form', 'fabric', color=p.get('color', '#e2d6c0'), tint=True, bump=0.6)
    # torso: lofted along Z (use loft along X then rotate)
    st = [(0.0, 0.11, 0.08, 0), (0.12, 0.16, 0.11, 0), (0.25, 0.13, 0.09, 0), (0.38, 0.17, 0.11, 0.01), (0.5, 0.18, 0.11, 0.01), (0.58, 0.12, 0.08, 0), (0.64, 0.05, 0.05, 0), (0.7, 0.045, 0.045, 0), (0.72, 0.03, 0.03, 0)]
    t = core.loft('torso', st, seg=32, power=2.2)
    t.rotation_euler = (0, math.radians(-90), 0); t.location = (0, 0, 0.95)
    core.add_subsurf(t, 1); assign(t, fab)
    cap = core.cylinder('neck_cap', 0.04, 0.03, at=(0, 0, 1.66), verts=24); assign(cap, mat('wood_z', 'wood', color='#5e3b24', axis='Z'))
    pole = core.cylinder('pole', 0.012, 0.98, at=(0, 0, 0.0)); assign(pole, mat('brass', 'metal', color='#b8955a', metal=1, rough=0.25) if p.get('stand', 'wood') == 'brass' else mat('wood_z', 'wood', color='#5e3b24', axis='Z'))
    for k in range(3):
        a = k * math.tau / 3
        lg = core.post_between('leg', (0, 0, 0.25), (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.0), None, round_=True, r=0.012); assign(lg, mat('wood_z', 'wood', color='#5e3b24', axis='Z'))
    if False and p.get('tape'):
        tape = core.tube_path('measuring_tape', [(-0.1, -0.12, 1.55), (0, -0.14, 1.58), (0.1, -0.12, 1.55), (0.12, -0.1, 1.3), (0.11, -0.1, 1.15)], 0.004)
        assign(tape, flat('#e8c43a', 'tape_yellow', 0.5))

def build_artist_mannequin(p):
    w = mat('mannequin_wood', 'wood', color=p.get('wood', '#d9b47a'), axis='Z', ring=12, bump=0.2)
    pose = p.get('pose', 'stand')
    S = p.get('scale', 1.0)
    base = core.soft_box('base', (0.12 * S, 0.12 * S, 0.02 * S), at=(0, 0, 0.01 * S), n=8, subsurf=1); assign(base, w)
    def V(x, y, z): return Vector((x * S, y * S, z * S))
    def seg(a, b, r): o = core.post_between('limb', tuple(a), tuple(b), None, round_=True, r=r * S, verts=16); core.add_subsurf(o, 1); assign(o, w); return o
    def joint(c, r): o = core.sphere('joint', r * S, seg=16, rings=8); o.location = tuple(c); assign(o, w); return o
    pelvis = V(0, 0, 0.19)
    rod = seg(V(0, 0.0, 0.02), pelvis + V(0, 0.02, -0.02), 0.004)
    hip = core.sphere('pelvis', 0.022 * S, seg=24, rings=12, scale=(1.2, 0.8, 0.9)); hip.location = tuple(pelvis); assign(hip, w)
    chest = pelvis + V(0, 0, 0.07)
    torso = core.sphere('chest', 0.028 * S, seg=24, rings=12, scale=(1.15, 0.75, 1.3)); torso.location = tuple(chest); assign(torso, w)
    seg(pelvis, chest, 0.01)
    neck = chest + V(0, 0, 0.045)
    seg(chest, neck, 0.006)
    head = core.sphere('head', 0.02 * S, seg=24, rings=12, scale=(0.85, 0.95, 1.25)); head.location = tuple(neck + V(0, 0, 0.022)); assign(head, w)
    poses = {
        'stand': dict(arms=[(-0.25, 0.0), (-0.25, 0.0)], legs=[(0.0, 0.0), (0.0, 0.0)]),
        'walk': dict(arms=[(-0.2, 0.5), (-0.2, -0.5)], legs=[(0.3, 0.0), (-0.3, 0.0)]),
        'reach': dict(arms=[(2.6, 0.2), (-0.3, 0.0)], legs=[(0.0, 0.0), (0.1, 0.0)]),
        'think': dict(arms=[(-0.2, 0.0), (1.2, 1.6)], legs=[(0.0, 0.0), (0.0, 0.0)]),
    }[pose]
    for i, s in enumerate((-1, 1)):
        sh = chest + V(s * 0.033, 0, 0.02)
        joint(sh, 0.008)
        up, fwd = poses['arms'][i]
        el = sh + V(s * 0.012 * math.cos(up), -math.sin(fwd) * 0.045 * 0.5, -0.045 * math.cos(up) * math.cos(fwd * 0.5)) + V(0, 0, 0.045 * max(0, math.sin(up)) * 0.9)
        seg(sh, el, 0.0065); joint(el, 0.006)
        wr = el + (el - sh).normalized() * 0.042 * S if pose != 'think' or s < 0 else el + V(-s * 0.01, -0.02, 0.035)
        seg(el, wr, 0.005)
        hand = core.sphere('hand', 0.008 * S, seg=12, rings=8, scale=(0.7, 0.5, 1.2)); hand.location = tuple(wr); assign(hand, w)
        hp = pelvis + V(s * 0.016, 0, -0.012)
        joint(hp, 0.009)
        sw, _ = poses['legs'][i]
        kn = hp + V(0, -math.sin(sw) * 0.08, -0.08 * math.cos(sw))
        seg(hp, kn, 0.008); joint(kn, 0.007)
        an = V(kn.x / S * 1, kn.y / S * 1 * 0.6, 0.035)
        an = Vector((kn.x, kn.y * 0.5, 0.035 * S))
        seg(kn, an, 0.0065)
        ft = core.soft_box('foot', (0.016 * S, 0.035 * S, 0.012 * S), n=4, subsurf=1); ft.location = tuple(an + V(0, -0.01, -0.012)); assign(ft, w)
    # make the feet actually stand: lowest foot touches the base top
    rod.name = 'stand_rod'

# ------------------------------------------------------------------ animals
def bird(p, perch_top):
    body_c = p.get('color', '#5a4a3a')
    feather = mat('feathers_primary', 'fabric', color=body_c, tint=True, bump=0.8, sheen=0.3)
    belly = mat('feathers_belly', 'fabric', color=p.get('belly', '#d9cbb0'), bump=0.8)
    beak = flat(p.get('beak', '#e0a030'), 'beak', 0.4)
    eye = flat('#0a0a0a', 'eye_black', 0.05)
    L = p.get('size', 0.16)
    k = L / 0.16
    z = perch_top + 0.018 * k
    body = core.loft('body', [(-0.07 * k, 0.012 * k, 0.012 * k, 0.03 * k), (-0.04 * k, 0.03 * k, 0.03 * k, 0.04 * k), (0.0, 0.034 * k, 0.036 * k, 0.045 * k), (0.035 * k, 0.03 * k, 0.03 * k, 0.055 * k), (0.055 * k, 0.02 * k, 0.02 * k, 0.065 * k)], seg=24)
    body.location = (0, 0, z); core.add_subsurf(body, 1); assign(body, feather)
    chest = core.sphere('breast', 0.027 * k, seg=24, rings=12, scale=(1, 0.95, 1.05)); chest.location = (0.02 * k, 0, z + 0.035 * k); assign(chest, belly)
    head = core.sphere('head', 0.022 * k, seg=24, rings=12); head.location = (0.065 * k, 0, z + 0.075 * k); assign(head, feather)
    bk = core.cylinder('beak', 0.008 * k, 0.02 * k, verts=12, r2=0.0005, rot=(0, math.radians(90), 0)); bk.location = (0.083 * k, 0, z + 0.073 * k); assign(bk, beak)
    for s in (-1, 1):
        e = core.sphere('eye', 0.004 * k, seg=12, rings=6); e.location = (0.075 * k, s * 0.017 * k, z + 0.08 * k); assign(e, eye)
        wing = core.loft('wing', [(-0.05 * k, 0.004 * k, 0.012 * k, 0), (-0.01 * k, 0.006 * k, 0.022 * k, 0), (0.03 * k, 0.004 * k, 0.015 * k, 0)], seg=12)
        wing.location = (0, s * 0.03 * k, z + 0.045 * k); wing.rotation_euler = (s * 0.15, 0.25, 0); assign(wing, feather)
        for dx in (0.0, 0.012):
            lg = core.post_between('leg', (dx * k, s * 0.008 * k, z + 0.02 * k), (dx * k, s * 0.008 * k, perch_top - 0.002), None, round_=True, r=0.0018 * k, verts=8); assign(lg, beak)
    tail = core.soft_box('tail', (0.06 * k, 0.03 * k, 0.006 * k), n=4, subsurf=1); tail.location = (-0.085 * k, 0, z + 0.025 * k); tail.rotation_euler = (0, 0.4, 0); assign(tail, feather)
    if p.get('crest'):
        cr = core.cylinder('crest', 0.01 * k, 0.03 * k, verts=8, r2=0.001, rot=(0, -0.5, 0)); cr.location = (0.058 * k, 0, z + 0.092 * k); assign(cr, feather)

def build_bird(p):
    perch = p.get('perch', 'branch')
    if perch == 'branch':
        base = core.soft_box('base', (0.22, 0.12, 0.02), at=(0, 0, 0.01), n=8, subsurf=1); assign(base, mat('wood_x', 'wood', color='#5e3b24', axis='X'))
        post = core.post_between('post', (0, 0, 0.015), (0, 0, 0.12), None, round_=True, r=0.008); assign(post, mat('brass', 'metal', color='#b8955a', metal=1, rough=0.3))
        br = core.tube_path('branch', [(-0.12, 0, 0.115), (0.0, 0, 0.125), (0.1, 0.01, 0.13), (0.14, 0.02, 0.14)], 0.009); assign(br, mat('branch_bark', 'bark', color='#5b4634'))
        bird(p, 0.134)
    else:  # sitting on a rock
        from models.nature import rock_mesh
        r = rock_mesh('rock', (0.22, 0.18, 0.12), 12, rough=0.3); assign(r, mat('stone', 'stone', color='#8a857c', lichen=0.4))
        core.ground_and_centre([r], centre=False)
        mx = max((r.matrix_world @ v.co).z for v in r.data.vertices)
        bird(p, mx - 0.004)

def build_fishbowl(p):
    glass = mat('bowl_glass', 'glass', color='#eef6f4', alpha=0.22, rough=0.01)
    water = mat('water', 'glass', color='#8ab8c8', alpha=0.35, rough=0.02)
    R = 0.13
    prof = [(0.0, 0.0), (0.06, 0.0)] + [(R * math.sin(math.pi * t / 14) + 0.0, R * (1 - math.cos(math.pi * t / 14))) for t in range(3, 12)] + [(0.08, 0.235), (0.085, 0.24)]
    from models.props import vessel
    vessel('bowl', prof, 0.003, glass)
    wv = core.lathe('water', [(0, 0.004)] + [(R * math.sin(math.pi * t / 14) - 0.004, R * (1 - math.cos(math.pi * t / 14)) + 0.002) for t in range(3, 10)] + [(0, 0.2)], steps=48); assign(wv, water)
    gravel = core.lathe('gravel', [(0, 0.004), (0.06, 0.004), (0.08, 0.025), (0, 0.03)], steps=48); assign(gravel, mat('gravel', 'stone', color=p.get('gravel', '#b8a888'), scale=40, bump=1.0))
    plant = core.tube_path('weed', [(0.03, 0.02, 0.025), (0.04, 0.03, 0.08), (0.025, 0.02, 0.14)], 0.004); assign(plant, mat('weed', 'foliage', color='#3f7a3a'))
    fc = p.get('fish', '#f08a20')
    for k, (x, y, z, a) in enumerate([(-0.02, -0.01, 0.12, 0.3)] + ([(0.03, 0.03, 0.09, 2.6)] if p.get('two') else [])):
        f = core.loft('fish', [(-0.03, 0.002, 0.004, 0), (-0.02, 0.006, 0.012, 0), (0.0, 0.009, 0.016, 0.001), (0.02, 0.007, 0.012, 0.001), (0.03, 0.002, 0.004, 0)], seg=16)
        f.location = (x, y, z); f.rotation_euler = (0, 0, a); core.add_subsurf(f, 1); assign(f, mat(f'fish_scales_{k}', 'leather', color=fc, grain=500, bump=0.3))
        tl = core.extrude_outline('tail_fin', [(0, 0), (-0.02, 0.014), (-0.016, 0), (-0.02, -0.014)], 0.002, rot=(math.radians(90), 0, 0))
        tl.location = (x - 0.028 * math.cos(a), y - 0.028 * math.sin(a) + 0.001, z); tl.rotation_euler = (math.radians(90), 0, a); assign(tl, mat(f'fish_scales_{k}', 'leather'))

def build_cat_figure(p):
    m = mat('ceramic_primary', 'ceramic', color=p.get('color', '#2a2a2c'), tint=True, rough=p.get('rough', 0.2))
    eye = flat(p.get('eyes', '#d9b020'), 'cat_eyes', 0.1)
    body = core.lathe('body', [(0, 0), (0.07, 0), (0.08, 0.04), (0.075, 0.1), (0.06, 0.16), (0.045, 0.2), (0.0, 0.22)], steps=48)
    body.scale = (1, 0.85, 1); assign(body, m)
    head = core.sphere('head', 0.05, seg=32, rings=16, scale=(1, 0.9, 0.88)); head.location = (0, -0.012, 0.25); core.add_subsurf(head, 1); assign(head, m)
    muzzle = core.sphere('muzzle', 0.022, seg=16, rings=8, scale=(1.2, 0.9, 0.8)); muzzle.location = (0, -0.052, 0.238); assign(muzzle, m)
    for s in (-1, 1):
        ear = core.cylinder('ear', 0.02, 0.035, verts=3, r2=0.002, rot=(0.15, s * 0.25, s * 0.5)); ear.location = (s * 0.03, -0.005, 0.285); assign(ear, m)
        e = core.sphere('eye', 0.008, seg=12, rings=6, scale=(1, 0.6, 1.1)); e.location = (s * 0.02, -0.052, 0.258); assign(e, eye)
        paw = core.sphere('paw', 0.017, seg=16, rings=8, scale=(1, 1.5, 0.7)); paw.location = (s * 0.025, -0.06, 0.012); assign(paw, m)
        leg = core.post_between('foreleg', (s * 0.025, -0.05, 0.015), (s * 0.03, -0.035, 0.14), None, round_=True, r=0.014); assign(leg, m)
    tail = core.tube_path('tail', [(0.05, 0.05, 0.015), (0.09, 0.0, 0.012), (0.07, -0.06, 0.012), (0.02, -0.08, 0.012)], 0.012); assign(tail, m)

# ------------------------------------------------------------------ vehicles
def build_bicycle(p):
    frame = mat('paint_primary_frame', 'paint', color=p.get('color', '#1f4f8f'), metal=0.6, rough=0.3)
    tyre = mat('tyre', 'tread', color='#1b1b1c', bump=0.8, blocks=60)
    steelm = chrome()
    R = p.get('r', 0.34)
    wb = p.get('wb', 1.02)
    rear, front = Vector((-wb / 2, 0, R)), Vector((wb / 2, 0, R))
    for c in (rear, front):
        t = core.lathe('tyre', [(R - 0.035, -0.015), (R - 0.02, -0.017), (R - 0.004, -0.012), (R, 0), (R - 0.004, 0.012), (R - 0.02, 0.017), (R - 0.035, 0.015)], steps=72, rot=(math.radians(90), 0, 0))
        t.location = tuple(c); assign(t, tyre)
        rim = core.lathe('rim', [(R - 0.055, -0.01), (R - 0.034, -0.012), (R - 0.034, 0.012), (R - 0.055, 0.01)], steps=72, rot=(math.radians(90), 0, 0)); rim.location = tuple(c); assign(rim, steelm)
        hub = core.cylinder('hub', 0.02, 0.1, verts=24, rot=(math.radians(90), 0, 0)); hub.location = (c.x, 0.05, c.z); assign(hub, steelm)
        sp = []
        for k in range(32):
            a = k * math.tau / 32
            side = 0.045 if k % 2 else -0.045
            sp.append(core.post_between('spoke', (c.x, side, c.z), (c.x + math.cos(a) * (R - 0.05), 0, c.z + math.sin(a) * (R - 0.05)), None, round_=True, r=0.0012, verts=4))
        assign(core.join(sp, 'spokes'), steelm)
    bb = Vector((-0.05, 0, R - 0.06))
    seat_top = Vector((-0.2, 0, R + 0.5))
    head_top = Vector((wb / 2 - 0.12, 0, R + 0.5))
    head_bot = Vector((wb / 2 - 0.08, 0, R + 0.38))
    step = p.get('step_through', False)
    tubes = [(bb, seat_top), (bb, head_bot), (rear, bb), (rear, seat_top + Vector((0.03, 0, -0.06))), (head_bot, head_top)]
    if not step:
        tubes.append((seat_top + Vector((0.01, 0, -0.03)), head_top + Vector((0, 0, -0.03))))
    else:
        tubes[1] = (bb + Vector((0.05, 0, 0.0)), head_bot + Vector((0, 0, -0.05)))
    for a, b in tubes:
        o = core.post_between('frame', tuple(a), tuple(b), None, round_=True, r=0.016 if (a, b) == tubes[0] else 0.013); assign(o, frame)
    # chainstays both sides
    for s in (-1, 1):
        o = core.post_between('stay', (rear.x, s * 0.05, rear.z), (bb.x, s * 0.02, bb.z), None, round_=True, r=0.009); assign(o, frame)
        o = core.post_between('fork', (front.x, s * 0.05, front.z), (head_bot.x, s * 0.03, head_bot.z), None, round_=True, r=0.011); assign(o, frame)
    crown = core.soft_box('fork_crown', (0.04, 0.1, 0.03), at=tuple(head_bot), n=6, subsurf=1); assign(crown, frame)
    post = core.post_between('seatpost', tuple(seat_top), tuple(seat_top + Vector((-0.03, 0, 0.12))), None, round_=True, r=0.012); assign(post, steelm)
    saddle = core.soft_box('saddle', (0.26, 0.15, 0.05), at=tuple(seat_top + Vector((-0.04, 0, 0.14))), n=3.2, subsurf=1, taper=0.0)
    assign(saddle, mat('saddle_leather', 'leather', color=p.get('saddle', '#3a2416')))
    stem = core.post_between('stem', tuple(head_top), tuple(head_top + Vector((-0.02, 0, 0.12))), None, round_=True, r=0.014); assign(stem, steelm)
    bar_c = head_top + Vector((-0.02, 0, 0.12))
    if p.get('bars', 'flat') == 'drop':
        for s in (-1, 1):
            hb = core.tube_path('handlebar', [(bar_c.x, 0, bar_c.z), (bar_c.x, s * 0.2, bar_c.z), (bar_c.x + 0.08, s * 0.21, bar_c.z - 0.03), (bar_c.x + 0.05, s * 0.21, bar_c.z - 0.13), (bar_c.x - 0.03, s * 0.2, bar_c.z - 0.12)], 0.012)
            assign(hb, mat('bar_tape', 'fabric', color='#1a1a1a', bump=0.6))
    else:
        hb = core.tube_path('handlebar', [(bar_c.x - 0.05, -0.3, bar_c.z + 0.02), (bar_c.x, -0.15, bar_c.z), (bar_c.x, 0.15, bar_c.z), (bar_c.x - 0.05, 0.3, bar_c.z + 0.02)], 0.011); assign(hb, steelm)
        for s in (-1, 1):
            g = core.cylinder('grip', 0.016, 0.11, verts=16, rot=(math.radians(90), 0, 0)); g.location = (bar_c.x - 0.05, s * 0.3 + (0.11 if s < 0 else 0) - (0 if s < 0 else 0), bar_c.z + 0.02)
            g.location = (bar_c.x - 0.05, s * 0.3 + (-0.055 * -s) * 0 + (0.055 if s > 0 else 0.055) * 0 + (0.11 / 2 if s > 0 else 0.11 / 2) * 0 + 0.055 * (1 if s > 0 else 1) - (0.11 if s > 0 else 0) * 0, bar_c.z + 0.02)
            assign(g, mat('grip_rubber', 'rubber', color='#3a2a1e'))
    ring = core.lathe('chainring', [(0.08, -0.004), (0.1, -0.004), (0.1, 0.004), (0.08, 0.004)], steps=48, rot=(math.radians(90), 0, 0)); ring.location = (bb.x, -0.04, bb.z); assign(ring, steelm)
    for s in (-1, 1):
        crank = core.post_between('crank', (bb.x, s * 0.06, bb.z), (bb.x + s * 0.12 * 0.5, s * 0.07, bb.z - s * 0.15), (0.02, 0.012), bevel=0.003); assign(crank, steelm)
        ped = core.soft_box('pedal', (0.09, 0.08, 0.02), at=(bb.x + s * 0.06, s * 0.11, bb.z - s * 0.15), n=6, subsurf=1); assign(ped, flat('#141414', 'pedal', 0.5))
    bbshell = core.cylinder('bb_shell', 0.022, 0.12, verts=24, rot=(math.radians(90), 0, 0)); bbshell.location = (bb.x, 0.06, bb.z); assign(bbshell, frame)
    chain = core.tube_path('chain', [(bb.x + 0.0, -0.04, bb.z + 0.1), (rear.x, -0.04, rear.z + 0.04), (rear.x - 0.04, -0.04, rear.z), (rear.x, -0.04, rear.z - 0.04), (bb.x, -0.04, bb.z - 0.1)], 0.004)
    assign(chain, mat('chain_dark', 'metal', color='#4a4a4a', metal=1, rough=0.4))
    # kickstand keeps it upright
    ks = core.post_between('kickstand', (bb.x - 0.08, -0.03, bb.z), (bb.x - 0.18, -0.2, 0.0), None, round_=True, r=0.008); assign(ks, steelm)
    if p.get('basket'):
        bsk = core.lathe('basket', [(0.12, 0), (0.15, 0.22), (0.145, 0.22), (0.115, 0.004), (0, 0.004), (0, 0)], steps=24)
        bsk.location = (front.x + 0.08, 0, head_top.z - 0.18); assign(bsk, mat('wicker', 'fabric', color='#b48a5a', bump=1.0, boucle=True))
        br = core.post_between('basket_bracket', tuple(head_top + Vector((0, 0, -0.05))), (front.x + 0.08, 0, head_top.z - 0.17), (0.02, 0.02), bevel=0.003); assign(br, steelm)

def build_kick_scooter(p):
    m = mat('paint_primary', 'paint', color=p.get('color', '#d93030'), metal=0.3, rough=0.3)
    alu = mat('aluminium', 'metal', color='#c3c6ca', metal=1, rough=0.3)
    wh = mat('pu_wheel', 'plastic', color=p.get('wheels', '#1a1a1a'), rough=0.5)
    R = 0.1 if p.get('kind') != 'electric' else 0.12
    deck = core.soft_box('deck', (0.55, 0.13, 0.04), at=(0, 0, R + 0.0), n=8, subsurf=1); assign(deck, m)
    grip = core.soft_box('grip_tape', (0.5, 0.11, 0.002), at=(0, 0, R + 0.021), n=8, subsurf=0); assign(grip, mat('griptape', 'concrete', color='#1a1a1a'))
    for x in (-0.33, 0.36):
        w = core.lathe('wheel', [(0.02, -0.012), (R - 0.01, -0.012), (R, 0), (R - 0.01, 0.012), (0.02, 0.012)], steps=48, rot=(math.radians(90), 0, 0)); w.location = (x, 0, R); assign(w, wh)
        hub = core.cylinder('hub', 0.022, 0.03, verts=24, rot=(math.radians(90), 0, 0)); hub.location = (x, 0.015, R); assign(hub, alu)
    rear_f = core.post_between('rear_fork', (0.27, 0, R), (-0.33, 0, R), (0.03, 0.06), bevel=0.006)
    core.bpy.data.objects.remove(rear_f)
    rf = core.soft_box('rear_bracket', (0.1, 0.08, 0.03), at=(-0.3, 0, R + 0.0), n=6, subsurf=1); assign(rf, m)
    fender = core.soft_box('fender', (0.18, 0.06, 0.012), at=(-0.31, 0, 2 * R + 0.004), n=6, subsurf=1, rot=(0, math.radians(8), 0)); assign(fender, alu)
    fstrut = core.post_between('fender_strut', (-0.26, 0, R + 0.01), (-0.24, 0, 2 * R + 0.0), (0.02, 0.05), bevel=0.003); assign(fstrut, alu)
    neck = core.soft_box('neck', (0.08, 0.06, 0.06), at=(0.3, 0, R + 0.03), n=6, subsurf=1); assign(neck, m)
    stem = core.post_between('stem', (0.3, 0, R + 0.03), (0.33, 0, 0.92), None, round_=True, r=0.018); assign(stem, alu)
    fork = core.post_between('fork', (0.3, 0, R + 0.03), (0.36, 0, R), (0.03, 0.06), bevel=0.006); assign(fork, alu)
    bar = core.cylinder('handlebar', 0.012, 0.46, verts=16, rot=(math.radians(90), 0, 0)); bar.location = (0.33, 0.23, 0.92); assign(bar, alu)
    for s in (-1, 1):
        g = core.cylinder('grip', 0.017, 0.1, verts=16, rot=(math.radians(90), 0, 0)); g.location = (0.33, s * 0.23 + (0.1 if s < 0 else 0) - (0 if s < 0 else 0), 0.92)
        g.location = (0.33, (0.23 if s > 0 else -0.13), 0.92); assign(g, mat('grip_rubber', 'rubber', color='#1a1a1a'))
    if p.get('kind') == 'electric':
        bat = core.soft_box('battery', (0.4, 0.11, 0.05), at=(0, 0, R - 0.04), n=6, subsurf=1); assign(bat, flat('#1a1a1a', 'battery_black', 0.5))
        disp = core.soft_box('display', (0.06, 0.08, 0.02), at=(0.33, 0, 0.94), n=6, subsurf=1); assign(disp, mat('screen_on', 'emissive', color='#1d2a3a', emit='#4a9fd8', strength=0.6))
        light = core.soft_box('headlight', (0.03, 0.05, 0.03), at=(0.34, 0, 0.8), n=6, subsurf=1); assign(light, mat('lamp_head', 'emissive', color='#e9eef2', emit='#fff4e0', strength=0.4))
    ks = core.post_between('kickstand', (-0.05, -0.05, R - 0.02), (-0.15, -0.16, 0.0), None, round_=True, r=0.006); assign(ks, alu)

TYPES = {
    'hd-amphora': {'label': 'Amphora (HD)', 'category': 'history', 'options': {'color': 'clay color'}, 'build': build_amphora, 'tags': ['amphora', 'ancient', 'pottery', 'greek', 'roman', 'jar'],
                   'variants': {'terracotta': dict(), 'black-figure': dict(pattern=True, color='#c0703c'), 'pale-clay': dict(color='#d8b48a', h=0.8)}},
    'hd-column': {'label': 'Classical column (HD)', 'category': 'history', 'options': {}, 'build': build_column, 'tags': ['column', 'pillar', 'greek', 'roman', 'ruin', 'ancient'],
                  'variants': {'doric-marble': dict(), 'ionic-marble': dict(order='ionic'), 'broken-ruin': dict(broken=0.45, mat='stone', color='#c8c1b2')}},
    'hd-treasure-chest': {'label': 'Treasure chest (HD)', 'category': 'history', 'options': {}, 'build': build_chest, 'tags': ['treasure chest', 'chest', 'pirate', 'gold', 'coins'],
                          'variants': {'gold-trim': dict(), 'iron-bound': dict(trim='iron', wood='#4a3220', treasure=False)}},
    'hd-dragon-statue': {'label': 'Dragon statue (HD)', 'category': 'creatures', 'options': {}, 'build': build_dragon_statue, 'tags': ['dragon', 'statue', 'serpent', 'fantasy', 'creature'],
                         'variants': {'stone': dict(), 'bronze': dict(mat='bronze'), 'jade': dict(mat='jade'), 'stone-winged': dict(wings=True)}},
    'hd-gargoyle': {'label': 'Gargoyle (HD)', 'category': 'creatures', 'options': {}, 'build': build_gargoyle, 'tags': ['gargoyle', 'statue', 'grotesque', 'gothic', 'creature'],
                    'variants': {'weathered': dict(), 'dark-mossy': dict(color='#5a5852', lichen=0.6)}},
    'hd-dragon-egg': {'label': 'Dragon egg (HD)', 'category': 'creatures', 'options': {}, 'build': build_dragon_egg, 'tags': ['dragon egg', 'egg', 'nest', 'fantasy'],
                      'variants': {'emerald': dict(), 'crimson-glowing': dict(color='#7a1f24', glow=True), 'obsidian': dict(color='#1d1d22')}},
    'hd-ammo-crate': {'label': 'Supply crate (HD)', 'category': 'military', 'options': {'color': 'paint color'}, 'build': build_ammo_crate, 'tags': ['crate', 'military crate', 'supply box', 'army'],
                      'variants': {'olive': dict(), 'sand': dict(color='#b8a77a', label='FIELD KIT')}},
    'hd-helmet': {'label': 'Helmet on stand (HD)', 'category': 'military', 'options': {'color': 'paint color'}, 'build': build_helmet, 'tags': ['helmet', 'armour', 'knight', 'soldier', 'army'],
                  'variants': {'knight-steel': dict(), 'field-olive': dict(kind='steelpot'), 'field-sand': dict(kind='steelpot', color='#9a8a62')}},
    'hd-shield': {'label': 'Shield on stand (HD)', 'category': 'military', 'options': {'color': 'paint color'}, 'build': build_shield, 'tags': ['shield', 'viking', 'medieval', 'heraldry', 'armour'],
                  'variants': {'viking-red': dict(), 'viking-blue': dict(color='#1f3a6b', stripe='#d9b45a'), 'heater-blue-gold': dict(kind='heater')}},
    'hd-sword-display': {'label': 'Sword on display (HD)', 'category': 'military', 'options': {}, 'build': build_sword_display, 'tags': ['sword', 'blade', 'display', 'medieval', 'knight'],
                         'variants': {'longsword': dict(), 'arming-sword': dict(kind='arming', wood='#2a1d16')}},
    'hd-gazebo': {'label': 'Gazebo (HD)', 'category': 'places', 'options': {'color': 'paint color'}, 'build': build_gazebo, 'tags': ['gazebo', 'pavilion', 'bandstand', 'garden', 'park'],
                  'variants': {'white-hexagonal': dict(), 'green-octagonal': dict(sides=8, color='#3f5a46', roof='#3a3a3a')}},
    'hd-fountain': {'label': 'Fountain (HD)', 'category': 'places', 'options': {}, 'build': build_fountain, 'tags': ['fountain', 'water feature', 'plaza', 'park'],
                    'variants': {'two-tier': dict(), 'three-tier': dict(tiers=3, r=1.6, color='#d8d0c0'), 'small-single': dict(tiers=1, r=0.9)}},
    'hd-well': {'label': 'Wishing well (HD)', 'category': 'places', 'options': {}, 'build': build_well, 'tags': ['well', 'wishing well', 'village', 'medieval'],
                'variants': {'stone': dict()}},
    'hd-pergola': {'label': 'Pergola (HD)', 'category': 'places', 'options': {}, 'build': build_pergola, 'tags': ['pergola', 'arbour', 'garden', 'patio', 'vines'],
                   'variants': {'cedar': dict(), 'cedar-vines': dict(vines=True), 'dark-wide': dict(wood='#4a3a2a', w=3.8)}},
    'hd-kiosk': {'label': 'Kiosk (HD)', 'category': 'buildings', 'options': {'color': 'paint color'}, 'build': build_kiosk, 'tags': ['kiosk', 'news stand', 'booth', 'coffee stand', 'stall'],
                 'variants': {'green-news': dict(), 'blue-coffee': dict(color='#1f3a6b', text='COFFEE', stripe2='#1f3a6b')}},
    'hd-bus-shelter': {'label': 'Bus shelter (HD)', 'category': 'buildings', 'options': {'color': 'frame color'}, 'build': build_bus_shelter, 'tags': ['bus shelter', 'bus stop', 'shelter', 'street'],
                       'variants': {'graphite': dict(), 'green': dict(color='#24433a', w=4.0)}},
    'hd-dress-form': {'label': 'Dress form (HD)', 'category': 'people', 'options': {'color': 'fabric color'}, 'build': build_dress_form, 'tags': ['dress form', 'mannequin', 'tailor', 'dummy', 'fashion'],
                      'variants': {'linen': dict(), 'black-brass': dict(color='#1d1d1f', stand='brass'), 'floral-tape': dict(color='#d8a49a', tape=True), 'grey': dict(color='#8c8f93')}},
    'hd-artist-mannequin': {'label': 'Artist mannequin (HD)', 'category': 'people', 'options': {}, 'build': build_artist_mannequin, 'tags': ['mannequin', 'artist mannequin', 'figure', 'wooden figure', 'person', 'pose'],
                            'variants': {'standing': dict(), 'walking': dict(pose='walk'), 'reaching': dict(pose='reach'), 'thinking': dict(pose='think'), 'dark-walnut': dict(wood='#6a4428', pose='walk')}},
    'hd-bird': {'label': 'Bird (HD)', 'category': 'animals', 'options': {'color': 'plumage color'}, 'build': build_bird, 'tags': ['bird', 'sparrow', 'robin', 'blue jay', 'finch'],
                'variants': {'sparrow-branch': dict(), 'robin-branch': dict(color='#6a5a4a', belly='#d9602a'), 'blue-jay-rock': dict(color='#3a6ac8', belly='#e8e8e8', beak='#1a1a1a', crest=True, perch='rock', size=0.22),
                             'cardinal-branch': dict(color='#c41e1e', belly='#c41e1e', beak='#e06a20', crest=True), 'goldfinch-rock': dict(color='#e8c020', belly='#f0d850', beak='#e8b8a0', perch='rock')}},
    'hd-fishbowl': {'label': 'Goldfish bowl (HD)', 'category': 'animals', 'options': {}, 'build': build_fishbowl, 'tags': ['fish', 'goldfish', 'fishbowl', 'aquarium', 'pet'],
                    'variants': {'one-goldfish': dict(), 'two-fish': dict(two=True, gravel='#7a8aa0')}},
    'hd-cat-figurine': {'label': 'Cat figurine (HD)', 'category': 'animals', 'options': {'color': 'glaze color'}, 'build': build_cat_figure, 'tags': ['cat', 'figurine', 'kitty', 'statue', 'pet'],
                        'variants': {'black-gloss': dict(), 'white-blue-eyes': dict(color='#efede8', eyes='#3a8ad9'), 'ginger-matte': dict(color='#c8762c', rough=0.6, eyes='#3a8a3a')}},
    'hd-bicycle': {'label': 'Bicycle (HD)', 'category': 'vehicles', 'options': {'color': 'frame color'}, 'build': build_bicycle, 'tags': ['bicycle', 'bike', 'cycle', 'road bike', 'city bike'],
                   'variants': {'city-blue': dict(), 'road-red-drop': dict(color='#b3201b', bars='drop', saddle='#141414'), 'step-through-mint-basket': dict(color='#9fd0c0', step_through=True, basket=True),
                                'black-commuter': dict(color='#1d1e20')}},
    'hd-kick-scooter': {'label': 'Kick scooter (HD)', 'category': 'vehicles', 'options': {'color': 'deck color'}, 'build': build_kick_scooter, 'tags': ['scooter', 'kick scooter', 'e-scooter', 'electric scooter'],
                        'variants': {'red': dict(), 'blue': dict(color='#2a6ad9'), 'electric-black': dict(kind='electric', color='#1d1e20'), 'electric-white': dict(kind='electric', color='#ecebe8', wheels='#2a2a2a')}},
}
