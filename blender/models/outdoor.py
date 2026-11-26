"""HD food, kitchen appliances & glassware, garden/street extras and light nature pieces."""
import math, random
from mathutils import Vector
from lib import core, cloth
from lib.mats import mat, assign

def flat(c, name=None, rough=0.4, metal=0.0): return mat(name or f'flat_{c[1:]}', 'flat', color=c, rough=rough, metal=metal)
def chrome(): return mat('chrome', 'chrome')
def steel(): return mat('steel', 'metal', color='#c9ccd0', metal=1.0, rough=0.22, axis='Z')
def glass(name='glass_clear', alpha=0.25): return mat(name, 'glass', color='#eef6f4', alpha=alpha, rough=0.02)

# ------------------------------------------------------------------ food
def fruit(kind, at, rnd, s=1.0):
    x, y, z = at
    if kind == 'apple':
        r = 0.04 * s
        o = core.lathe('apple', [(0, -r * 0.85)] + [(r * math.sin(math.pi * t / 12) * (1.05 - 0.1 * t / 12), -r * math.cos(math.pi * t / 12) * 0.9) for t in range(1, 12)] + [(0.004, r * 0.78), (0, r * 0.7)], steps=32)
        o.location = (x, y, z + r * 0.85); assign(o, mat('apple_skin', 'plastic', color=rnd.choice(['#b3201b', '#c8341c', '#8fae2a']), rough=0.3))
        st = core.post_between('stem', (x, y, z + r * 1.5), (x + 0.004, y, z + r * 1.95), None, round_=True, r=0.0018, verts=6); assign(st, flat('#4a3220', 'stem_brown', 0.7))
    elif kind == 'orange':
        r = 0.037 * s
        o = core.sphere('orange', r, at=(x, y, z + r), seg=32, rings=16, scale=(1, 1, 0.95)); assign(o, mat('orange_peel', 'leather', color='#e8821c', grain=900, bump=0.6))
    elif kind == 'lemon':
        r = 0.03 * s
        o = core.sphere('lemon', r, at=(x, y, z + r * 0.9), seg=32, rings=16, scale=(1.35, 1, 0.92)); assign(o, mat('lemon_peel', 'leather', color='#e8d020', grain=900, bump=0.6))
    elif kind == 'banana':
        pts = [(x - 0.09 * s, y, z + 0.035), (x - 0.04 * s, y, z + 0.018), (x + 0.04 * s, y, z + 0.018), (x + 0.09 * s, y, z + 0.04)]
        o = core.tube_path('banana', pts, 0.017 * s); assign(o, mat('banana_peel', 'plastic', color='#e8c83a', rough=0.5))
        tipc = core.sphere('banana_tip', 0.006, at=pts[-1], seg=8, rings=4); assign(tipc, flat('#3a2a1a', 'banana_end', 0.7))
    elif kind == 'pear':
        o = core.lathe('pear', [(0, 0)] + [(0.035 * s * math.sin(math.pi * t / 12) * (1 - 0.45 * (t / 12) ** 1.5), 0.1 * s * (1 - math.cos(math.pi * t / 12)) / 2) for t in range(1, 12)] + [(0, 0.1 * s)], steps=32)
        o.location = (x, y, z); assign(o, mat('pear_skin', 'plastic', color='#a8b83a', rough=0.45))
    return o

def build_fruit_bowl(p):
    rnd = random.Random(p.get('seed', 2))
    from models.props import vessel
    m = mat('ceramic_primary', 'ceramic', color=p.get('color', '#ecebe6'), tint=True, rough=0.15) if p.get('bowl', 'ceramic') == 'ceramic' else mat('wood_z', 'wood', color='#8a5a32', axis='Z')
    R = 0.15
    vessel('bowl', [(R * 0.45, 0), (R * 0.5, 0.008), (R * 0.85, 0.05), (R, 0.09)], 0.006, m)
    kinds = p.get('fruit', ['apple', 'orange', 'apple', 'lemon', 'orange', 'pear'])
    for i, k in enumerate(kinds):
        a = i / len(kinds) * math.tau
        rr = 0.06 if i < 5 else 0.0
        z = 0.012 + (0.035 if i >= 5 else 0)
        fruit(k, (math.cos(a) * rr, math.sin(a) * rr, z), rnd)
    if p.get('banana'):
        fruit('banana', (0.0, 0.0, 0.06), rnd)

def build_bread(p):
    kind = p.get('kind', 'boule')
    crust = mat('bread_crust', 'leather', color=p.get('color', '#b0702a'), grain=60, bump=0.8)
    board = core.soft_box('board', (0.4, 0.26, 0.022), at=(0, 0, 0.011), n=8, subsurf=1); assign(board, mat('wood_x', 'wood', color='#a8743f', axis='X'))
    z = 0.022
    if kind == 'boule':
        o = core.sphere('loaf', 0.1, seg=48, rings=24, scale=(1, 1, 0.55)); o.location = (0, 0, z + 0.016)
        for v in o.data.vertices:
            if v.co.z < 0:
                v.co.z *= 0.35
        assign(o, crust)
        for k in range(3):
            sc = core.soft_box('score', (0.14, 0.008, 0.006), n=4, subsurf=1); sc.location = (0, (k - 1) * 0.035, z + 0.066); sc.rotation_euler = (0, 0, 0.5); assign(sc, mat('bread_crumb', 'fabric', color='#e8d2a0', bump=0.6))
    elif kind == 'baguette':
        for k, y in enumerate((-0.05, 0.05)):
            o = core.loft('baguette', [(-0.18, 0.01, 0.01, 0.0), (-0.16, 0.028, 0.025, 0), (0.16, 0.03, 0.026, 0), (0.18, 0.01, 0.01, 0)], seg=20)
            o.location = (0, y, z + 0.022); o.rotation_euler = (0, 0, 0.12 * (k * 2 - 1)); core.add_subsurf(o, 1); assign(o, crust)
    else:  # sliced sandwich loaf with slices fallen forward
        o = core.soft_box('loaf', (0.22, 0.11, 0.1), at=(0.03, 0, z + 0.05), n=4, puff=0.012, subsurf=1); assign(o, crust)
        crumb = mat('bread_crumb', 'fabric', color='#ecd8a8', bump=0.8)
        for k in range(3):
            sl = core.soft_box('slice', (0.012, 0.105, 0.095), n=6, subsurf=1); sl.location = (-0.1 - k * 0.025, 0, z + 0.048); sl.rotation_euler = (0, -0.25 * (k + 1), 0)
            sl.location = (-0.09 - k * 0.03, 0, z + 0.04 - k * 0.008)
            assign(sl, crumb)

def build_cake(p):
    kind = p.get('kind', 'layer')
    plate = core.lathe('cake_stand', [(0, 0), (0.07, 0), (0.07, 0.01), (0.02, 0.02), (0.02, 0.09), (0.16, 0.1), (0.16, 0.11), (0, 0.11)], steps=72)
    assign(plate, glass('stand_glass', 0.4) if p.get('stand') == 'glass' else mat('ceramic_white', 'ceramic', color='#f3f0ea'))
    z = 0.11
    icing = mat('icing_primary', 'ceramic', color=p.get('color', '#f4e8e0'), tint=True, rough=0.35)
    if kind == 'layer':
        o = core.lathe('cake', [(0, z), (0.12, z), (0.122, z + 0.005), (0.122, z + 0.1), (0.118, z + 0.11), (0, z + 0.11)], steps=72); assign(o, icing)
        rnd = random.Random(1)
        for k in range(10):
            a = k * math.tau / 10
            b = core.sphere('berry', 0.014, seg=12, rings=8); b.location = (math.cos(a) * 0.09, math.sin(a) * 0.09, z + 0.12); assign(b, mat('berry', 'plastic', color=p.get('berry', '#b3101e'), rough=0.2))
        drip = core.lathe('drip_band', [(0.123, z + 0.08), (0.126, z + 0.09), (0.123, z + 0.11)], steps=72); assign(drip, mat('ganache', 'ceramic', color=p.get('drip', '#3a1e12'), rough=0.2))
    else:  # cupcakes
        for k in range(p.get('count', 4)):
            a = k * math.tau / p.get('count', 4)
            x, y = math.cos(a) * 0.08, math.sin(a) * 0.08
            cup = core.lathe('liner', [(0.024, z), (0.032, z + 0.04), (0.0, z + 0.04), (0, z)], steps=24)
            for v in cup.data.vertices:
                ang = math.atan2(v.co.y, v.co.x)
                kk = 1 + 0.05 * math.cos(ang * 16)
                v.co.x *= kk; v.co.y *= kk
            cup.location = (x, y, 0); assign(cup, flat(p.get('liner', '#d94a6a'), 'liner', 0.6))
            top = core.lathe('frosting', [(0, z + 0.035), (0.034, z + 0.04), (0.03, z + 0.055), (0.02, z + 0.07), (0.008, z + 0.085), (0, z + 0.088)], steps=24); top.location = (x, y, 0); assign(top, icing)
            ch = core.sphere('cherry', 0.008, seg=12, rings=6); ch.location = (x, y, z + 0.093); assign(ch, mat('berry', 'plastic', color='#b3101e', rough=0.2))

def build_coffee(p):
    kind = p.get('kind', 'cappuccino')
    cer = mat('ceramic_primary', 'ceramic', color=p.get('color', '#f3f0ea'), tint=True, rough=0.12)
    from models.props import vessel
    if kind == 'cappuccino' or kind == 'espresso':
        s = 1.0 if kind == 'cappuccino' else 0.65
        sau = core.lathe('saucer', [(0, 0), (0.05 * s + 0.01, 0), (0.07 * s + 0.01, 0.008), (0.075 * s + 0.012, 0.014), (0.072 * s + 0.012, 0.016), (0.03 * s, 0.01), (0, 0.01)], steps=64); assign(sau, cer)
        vessel('cup', [(0.025 * s, 0.01), (0.03 * s, 0.014), (0.045 * s, 0.05 * s + 0.01), (0.048 * s, 0.07 * s + 0.01)], 0.004, cer)
        foam = core.cylinder('crema', 0.044 * s, 0.002, at=(0, 0, 0.062 * s + 0.01), verts=48); assign(foam, mat('crema', 'fabric', color='#c89a6a' if kind == 'cappuccino' else '#8a5a32', bump=0.4))
        if kind == 'cappuccino':
            art = core.sphere('latte_art', 0.016, seg=16, rings=8, scale=(1, 1.2, 0.06)); art.location = (0, 0, 0.0635 + 0.01); assign(art, flat('#f2e8d8', 'milk_foam', 0.6))
        hd = core.tube_path('handle', [(0.044 * s, 0, 0.05 * s + 0.01), (0.07 * s, 0, 0.05 * s + 0.01), (0.065 * s, 0, 0.025 * s + 0.01), (0.033 * s, 0, 0.022 * s + 0.01)], 0.005 * s + 0.001); assign(hd, cer)
        sp = core.post_between('spoon', (-0.02, -0.05, 0.016), (0.03, -0.07 * s - 0.01, 0.016), None, round_=True, r=0.0025); assign(sp, chrome())
    else:  # latte glass
        g = core.lathe('latte_glass', [(0, 0), (0.032, 0), (0.035, 0.13), (0.032, 0.13), (0.029, 0.004), (0, 0.004)], steps=48); assign(g, glass())
        coffee = core.lathe('latte', [(0, 0.004), (0.029, 0.004), (0.031, 0.06), (0, 0.06)], steps=48); assign(coffee, mat('latte_coffee', 'glass', color='#a8703a', alpha=0.9))
        milk = core.lathe('milk', [(0, 0.06), (0.031, 0.06), (0.033, 0.115), (0, 0.118)], steps=48); assign(milk, flat('#efe2c8', 'milk_foam', 0.6))
        sau = core.cylinder('coaster', 0.05, 0.004, verts=48); assign(sau, mat('cork', 'soil', color='#b48a5a'))

def croissant(name, at, rot_z, crust, size=1.0):
    """Crescent of rolled dough: segmented body that tapers to the horns, flat underside, bent round an arc."""
    st = []
    N = 56
    SEG = 7
    for i in range(N + 1):
        t = -1 + 2 * i / N
        env = (1 - abs(t) ** 1.7) ** 1.15
        g = math.copysign(abs(t) ** 0.75, t)  # rolls get narrower toward the horns
        u = (g + 1) / 2 * SEG
        ridge = 0.86 + 0.14 * math.sin(math.pi * (u % 1)) ** 0.5  # each roll of dough bulges
        k = max(env * ridge, 0.05)
        st.append((t * 0.1 * size, 0.034 * k * size, 0.032 * k * size, 0.032 * k * size))
    o = core.loft(name, st, seg=28, power=2.0)
    # bend the straight roll into a crescent: curvature grows toward the tips so the horns hook ~90 degrees
    xm = 0.1 * size
    steps = 200
    th = lambda x: math.copysign(1.55 * (abs(x) / xm) ** 1.5, x)
    table = {}
    for side in (-1, 1):
        cx = cy = 0.0
        table[(side, 0)] = (0.0, 0.0, 0.0)
        for i in range(1, steps + 1):
            x = side * xm * i / steps
            a = th(x)
            dx = xm / steps
            cx += math.cos(a) * dx * side
            cy += math.sin(a) * dx * side
            table[(side, i)] = (cx, cy, a)
    for v in o.data.vertices:
        x, y, z = v.co
        z = max(z, 0.004 * size)  # flat base resting on the plate
        side = 1 if x >= 0 else -1
        i = min(steps, round(abs(x) / xm * steps))
        cx, cy, a = table[(side, i)]
        v.co = (cx - y * math.sin(a), cy + y * math.cos(a), z)
    core.add_subsurf(o, 1)
    o.rotation_euler = (0, 0, rot_z)
    o.location = at
    assign(o, crust)
    return o

def build_croissant_plate(p):
    from models.props import vessel
    vessel('plate', [(0.07, 0), (0.08, 0.006), (0.12, 0.012), (0.13, 0.02)], 0.005, mat('ceramic_white', 'ceramic', color='#f3f0ea'))
    crust = mat('croissant', 'leather', color='#b8691f', grain=60, bump=0.55, rough=0.35)
    n = p.get('count', 2)
    # horns curve toward +y in the croissant's own frame; lay them side by side, horns facing out
    lay = {2: [((0.0, -0.052, 0.0015), 0.05), ((0.0, 0.052, 0.0015), math.pi + 0.05)],
           3: [((0.0, -0.06, 0.0015), 0.0), ((0.052, 0.03, 0.0015), math.pi * 2 / 3 + math.pi), ((-0.052, 0.03, 0.0015), -math.pi * 2 / 3 + math.pi)]}[n]
    for k, (at, rz) in enumerate(lay):
        croissant('croissant', at, rz, crust, size=0.66 if n == 3 else 0.8)

# ------------------------------------------------------------------ kitchen
def build_kettle(p):
    kind = p.get('kind', 'electric')
    if kind == 'electric':
        m = mat('plastic_primary', 'plastic', color=p.get('color', '#ecebe8'), tint=True, rough=0.3)
        base = core.lathe('base', [(0, 0), (0.1, 0), (0.1, 0.02), (0, 0.022)], steps=48); assign(base, flat('#1a1a1a', 'base_black'))
        body = core.lathe('body', [(0, 0.022), (0.085, 0.022), (0.09, 0.05), (0.082, 0.2), (0.06, 0.24), (0, 0.24)], steps=48); assign(body, m)
        hd = core.tube_path('handle', [(-0.08, 0, 0.21), (-0.13, 0, 0.2), (-0.13, 0, 0.08), (-0.085, 0, 0.06)], 0.014); assign(hd, m)
        sp = core.post_between('spout', (0.07, 0, 0.19), (0.11, 0, 0.225), (0.03, 0.04), bevel=0.01); assign(sp, m)
        win = core.soft_box('water_window', (0.01, 0.025, 0.12), at=(-0.084, 0.0, 0.12), n=6, subsurf=0); assign(win, glass('window_glass', 0.6))
    else:  # stovetop whistling kettle
        m = mat('paint_primary', 'paint', color=p.get('color', '#b3201b'), metal=0.4, rough=0.3) if kind == 'enamel' else steel()
        body = core.lathe('body', [(0, 0), (0.1, 0), (0.11, 0.02), (0.1, 0.12), (0.06, 0.16), (0.03, 0.17), (0, 0.17)], steps=64); assign(body, m)
        knob = core.sphere('knob', 0.018, at=(0, 0, 0.18), seg=16, rings=8); assign(knob, flat('#1a1a1a', 'bakelite'))
        sp = core.post_between('spout', (0.08, 0, 0.08), (0.16, 0, 0.17), None, round_=True, r=0.014); assign(sp, m)
        hd = core.tube_path('handle', [(-0.06, 0, 0.15), (-0.04, 0, 0.24), (0.04, 0, 0.24), (0.06, 0, 0.15)], 0.009); assign(hd, steel())
        grip = core.cylinder('grip', 0.016, 0.07, verts=16, rot=(0, math.radians(90), 0)); grip.location = (-0.035, 0, 0.24); assign(grip, flat('#1a1a1a', 'bakelite'))

def build_toaster(p):
    m = mat('paint_primary', 'paint', color=p.get('color', '#e8e2d6'), metal=0.3, rough=0.3) if p.get('finish') != 'steel' else steel()
    body = core.soft_box('body', (0.3, 0.17, 0.2), at=(0, 0, 0.1 + 0.015), n=5, subsurf=1); assign(body, m)
    for s in (-1, 1):
        sl = core.soft_box('slot', (0.24, 0.025, 0.02), at=(0, s * 0.035, 0.212), n=8, subsurf=0); assign(sl, flat('#141414', 'slot_dark', 0.8))
    lever = core.soft_box('lever', (0.03, 0.025, 0.015), at=(0.16, 0, 0.17), n=6, subsurf=1); assign(lever, chrome())
    dial = core.cylinder('dial', 0.014, 0.012, at=(0.15, 0, 0.07), verts=24, rot=(0, math.radians(90), 0)); assign(dial, chrome())
    for sx in (-1, 1):
        for sy in (-1, 1):
            f = core.cylinder('foot', 0.012, 0.016, at=(sx * 0.12, sy * 0.06, 0), verts=16); assign(f, flat('#141414', 'rubber_foot', 0.8))
    if p.get('toast'):
        crumb = mat('toast', 'leather', color='#c08a4a', grain=80, bump=0.5)
        for s in (-1, 1):
            t = core.soft_box('toast', (0.11, 0.012, 0.11), at=(0.04 * s, s * 0.035, 0.24), n=5, subsurf=1); assign(t, crumb)

def build_coffee_maker(p):
    m = flat(p.get('color', '#1d1e20'), 'machine_body', 0.35)
    st = steel()
    base = core.soft_box('base', (0.24, 0.3, 0.06), at=(0, 0, 0.03), n=8, subsurf=1); assign(base, m)
    tower = core.soft_box('tower', (0.24, 0.12, 0.34), at=(0, 0.09, 0.06 + 0.17), n=8, subsurf=1); assign(tower, m)
    head = core.soft_box('head', (0.24, 0.26, 0.08), at=(0, 0.02, 0.4 - 0.04), n=8, subsurf=1); assign(head, st if p.get('kind') == 'espresso' else m)
    drip = core.soft_box('drip_tray', (0.2, 0.14, 0.012), at=(0, -0.06, 0.066), n=6, subsurf=0); assign(drip, st)
    if p.get('kind') == 'espresso':
        pf = core.cylinder('portafilter', 0.035, 0.03, at=(0, -0.04, 0.29), verts=32); assign(pf, st)
        hd = core.post_between('pf_handle', (0, -0.07, 0.305), (0, -0.2, 0.3), None, round_=True, r=0.012); assign(hd, flat('#1a1a1a', 'bakelite'))
        from models.props import vessel
        vessel('cup', [(0.02, 0.072), (0.024, 0.075), (0.03, 0.12)], 0.003, mat('ceramic_white', 'ceramic', color='#f3f0ea'))
        for o in core.mesh_objects():
            if o.name.startswith('cup'):
                o.location.y = -0.04
        gauge = core.cylinder('gauge', 0.025, 0.006, verts=32, rot=(math.radians(90), 0, 0)); gauge.location = (0, -0.11, 0.36); assign(gauge, chrome())
    else:  # drip coffee with glass carafe
        car = core.lathe('carafe', [(0, 0.072), (0.06, 0.072), (0.065, 0.12), (0.05, 0.18), (0.045, 0.2), (0.0, 0.2)], steps=48); car.location.y = -0.04; assign(car, glass('carafe_glass', 0.35))
        coffee = core.lathe('coffee', [(0, 0.075), (0.058, 0.075), (0.062, 0.12), (0, 0.12)], steps=48); coffee.location.y = -0.04; assign(coffee, mat('coffee_dark', 'glass', color='#2a160a', alpha=0.95))
        hd = core.tube_path('carafe_handle', [(0.055, -0.04, 0.17), (0.095, -0.04, 0.16), (0.095, -0.04, 0.1), (0.06, -0.04, 0.095)], 0.008); assign(hd, flat('#1a1a1a', 'bakelite'))

def build_mixer(p):
    """Tilt-head stand mixer: oval base with bowl clamp, curved pedestal, sculpted head with
    chrome trim band and front hub cap, speed lever, flat beater, steel bowl with handle."""
    m = mat('paint_primary', 'paint', color=p.get('color', '#b3201b'), metal=0.4, rough=0.25)
    base = core.loft('base', [(-0.17, 0.02, 0.022, 0.024), (-0.15, 0.1, 0.024, 0.024), (0.05, 0.12, 0.026, 0.026), (0.2, 0.1, 0.026, 0.026), (0.22, 0.03, 0.022, 0.026)], seg=28, power=3.0)
    core.add_subsurf(base, 1); assign(base, m)
    plate = core.cylinder('bowl_plate', 0.085, 0.012, at=(-0.03, 0, 0.044), verts=40, bevel=0.003); assign(plate, chrome())
    # pedestal: tapered, leaning slightly forward, joins base and head
    col = core.loft('column', [(0.03, 0.055, 0.07, 0.0), (0.18, 0.05, 0.065, 0.0), (0.34, 0.048, 0.06, 0.0)], seg=24, power=2.6, cap=True)
    col.rotation_euler = (0, math.radians(-90), 0); col.location = (0.16, 0, 0.0); core.add_subsurf(col, 1); assign(col, m)
    # head: rounded rear, widest at the hinge, tapering nose over the bowl
    head = core.loft('head', [(-0.15, 0.015, 0.02, 0.0), (-0.13, 0.05, 0.05, 0.0), (-0.05, 0.068, 0.066, 0.004), (0.08, 0.075, 0.075, 0.006), (0.18, 0.068, 0.07, 0.004), (0.215, 0.03, 0.035, 0.0)], seg=32, power=2.2)
    head.location = (0.0, 0, 0.345); core.add_subsurf(head, 1); assign(head, m)
    band = core.cylinder('trim_band', 0.077, 0.018, verts=48, rot=(0, math.radians(90), 0)); band.location = (0.02, 0, 0.348); assign(band, chrome())
    hub = core.cylinder('hub_cap', 0.024, 0.014, verts=32, rot=(0, math.radians(-90), 0)); hub.location = (-0.15, 0, 0.345); assign(hub, chrome())
    hinge = core.cylinder('hinge_pin', 0.012, 0.13, verts=20, rot=(math.radians(90), 0, 0)); hinge.location = (0.16, 0.065, 0.31); assign(hinge, chrome())
    lever = core.post_between('speed_lever', (0.12, -0.072, 0.33), (0.08, -0.09, 0.355), None, round_=True, r=0.006); assign(lever, chrome())
    knob = core.cylinder('lever_knob', 0.01, 0.012, verts=16, rot=(math.radians(90), 0, 0)); knob.location = (0.08, -0.095, 0.355); assign(knob, chrome())
    from models.props import vessel
    vessel('bowl', [(0.05, 0.05), (0.058, 0.056), (0.1, 0.13), (0.112, 0.2), (0.116, 0.205)], 0.003, steel())
    for o in core.mesh_objects():
        if o.name.startswith('bowl') and o.name != 'bowl_plate':
            o.location.x = -0.03
    hnd = core.post_between('bowl_handle', (0.06, 0.0, 0.17), (0.09, 0.0, 0.12), (0.02, 0.012), bevel=0.004); assign(hnd, steel())
    shaft = core.post_between('beater_shaft', (-0.03, 0, 0.3), (-0.03, 0, 0.17), None, round_=True, r=0.007); assign(shaft, chrome())
    # flat beater: a rounded triangular paddle frame
    pts = [(-0.03, 0, 0.17), (-0.075, 0, 0.1), (-0.03, 0, 0.075), (0.015, 0, 0.1), (-0.03, 0, 0.17)]
    for i in range(4):
        seg = core.post_between(f'beater_{i}', pts[i], pts[i + 1], None, round_=True, r=0.005); assign(seg, chrome())
    rib = core.post_between('beater_rib', (-0.03, 0, 0.165), (-0.03, 0, 0.078), None, round_=True, r=0.004); assign(rib, chrome())

def build_knife_block(p):
    w = mat('wood_z', 'wood', color=p.get('wood', '#5e3b24'), axis='Z')
    blk = core.soft_box('block', (0.12, 0.14, 0.24), n=10, subsurf=1); blk.rotation_euler = (math.radians(-18), 0, 0); blk.location = (0, 0, 0.11); assign(blk, w)
    foot = core.soft_box('foot', (0.13, 0.18, 0.02), at=(0, 0.0, 0.01), n=8, subsurf=1); assign(foot, w)
    hm = flat('#1a1a1a', 'knife_handle', 0.35) if p.get('handles', 'black') == 'black' else mat('wood_handle', 'wood', color='#8a5a32', axis='Z')
    lean = math.radians(-18)
    for k in range(5):
        x = (k % 3 - 1) * 0.035
        yo = 0.03 if k < 3 else -0.02
        top = Vector((x, yo + 0.12 * math.sin(-lean) * 1.0 + 0.0, 0.11 + 0.12 * math.cos(lean)))
        hdl = core.post_between('handle', tuple(top), tuple(top + Vector((0, math.sin(-lean) * 0.11, math.cos(lean) * 0.11))), (0.022, 0.016), bevel=0.006); assign(hdl, hm)
        bolster = core.post_between('bolster', tuple(top + Vector((0, -0.003, -0.01))), tuple(top), (0.024, 0.016), bevel=0.003); assign(bolster, chrome())

def build_wine_glasses(p):
    g = glass('wine_glass', 0.22)
    wine = mat('wine', 'glass', color=p.get('wine', '#6a0a1a'), alpha=0.9, rough=0.02)
    for k in range(p.get('count', 2)):
        x = (k - (p.get('count', 2) - 1) / 2) * 0.1
        kind = p.get('kind', 'red')
        if kind == 'tumbler':
            o = core.lathe('tumbler', [(0, 0), (0.038, 0), (0.042, 0.1), (0.039, 0.1), (0.035, 0.008), (0, 0.008)], steps=48); o.location.x = x; assign(o, g)
            ice = core.soft_box('ice', (0.03, 0.03, 0.03), n=8, subsurf=1); ice.location = (x, 0, 0.03); assign(ice, glass('ice', 0.5))
            liq = core.lathe('whisky', [(0, 0.008), (0.035, 0.008), (0.036, 0.04), (0, 0.04)], steps=48); liq.location.x = x; assign(liq, mat('whisky', 'glass', color='#b8701a', alpha=0.8))
            continue
        bowl_h = 0.11 if kind == 'red' else 0.13
        prof = [(0, 0), (0.035, 0), (0.035, 0.003), (0.004, 0.008), (0.004, 0.09), (0.02, 0.1), (0.042, 0.1 + bowl_h * 0.4), (0.04, 0.1 + bowl_h * 0.8), (0.033 if kind == 'red' else 0.028, 0.1 + bowl_h)]
        inner = [(r - 0.0012, z) for r, z in reversed(prof[5:])] + [(0, 0.095)]
        o = core.lathe('wine_glass', prof + inner, steps=48); o.location.x = x; assign(o, g)
        if p.get('filled', True) and kind != 'champagne':
            liq = core.lathe('wine', [(0, 0.097), (0.02, 0.1), (0.039, 0.1 + bowl_h * 0.35), (0, 0.1 + bowl_h * 0.35)], steps=48); liq.location.x = x; assign(liq, wine)

def build_jars(p):
    g = glass('jar_glass', 0.25)
    rnd = random.Random(p.get('seed', 3))
    contents = p.get('contents', [('#e8d8a0', 0.7), ('#6a3a1a', 0.5), ('#d9b060', 0.8)])
    for i, (c, fill) in enumerate(contents):
        x = (i - (len(contents) - 1) / 2) * 0.11
        R, H = 0.045, 0.14 + 0.03 * (i % 2)
        o = core.lathe('jar', [(0, 0), (R, 0), (R + 0.002, 0.006), (R + 0.002, H - 0.02), (R - 0.006, H - 0.012), (R - 0.006, H), (R - 0.008, H), (R - 0.008, H - 0.012), (R, H - 0.02), (R, 0.008), (0, 0.004)], steps=48)
        o.location.x = x; assign(o, g)
        lid = core.cylinder('lid', R - 0.004, 0.022, at=(x, 0, H - 0.008), verts=48, bevel=0.003)
        assign(lid, mat('wood_lid', 'wood', color='#b48a5a', axis='Z') if p.get('lids', 'wood') == 'wood' else chrome())
        cont = core.lathe('contents', [(0, 0.004), (R - 0.002, 0.004), (R - 0.002, 0.004 + (H - 0.03) * fill), (0, 0.004 + (H - 0.03) * fill + 0.005)], steps=48); cont.location.x = x
        assign(cont, mat(f'contents_{c[1:]}', 'soil', color=c, bump=0.6))

# ------------------------------------------------------------------ outdoor / street
def build_lamppost(p):
    kind = p.get('kind', 'victorian')
    m = mat('paint_primary', 'painted_metal', color=p.get('color', '#1d2a22'), tint=True, metal=0.6, wear=0.15)
    lamp = mat('lamp_glass', 'emissive', color='#f4ead0', emit='#ffd9a0', strength=0.6)
    if kind == 'victorian':
        base = core.lathe('base', [(0, 0), (0.22, 0), (0.22, 0.06), (0.16, 0.12), (0.12, 0.5), (0.09, 0.56), (0.065, 0.6), (0, 0.6)], steps=48); assign(base, m)
        pole = core.lathe('pole', [(0.065, 0.6), (0.055, 2.6), (0.08, 2.7), (0.08, 2.75), (0, 2.75)], steps=32)
        for v in pole.data.vertices:
            a = math.atan2(v.co.y, v.co.x)
            if 0.65 < v.co.z < 2.55:
                k = 1 - 0.06 * (0.5 + 0.5 * math.cos(a * 12))
                v.co.x *= k; v.co.y *= k
        assign(pole, m)
        cage = core.lathe('lantern_frame', [(0.12, 2.75), (0.18, 3.05), (0.2, 3.1), (0.06, 3.3), (0.02, 3.4), (0, 3.42)], steps=6); assign(cage, m)
        gl = core.lathe('lantern', [(0, 2.76), (0.115, 2.76), (0.17, 3.04), (0, 3.04)], steps=6); assign(gl, lamp)
        for s in (-1, 1):
            arm = core.tube_path('ladder_bar', [(0, 0, 2.55), (s * 0.25, 0, 2.6), (s * 0.3, 0, 2.65)], 0.012); assign(arm, m)
    else:  # modern LED pole
        pole = core.lathe('pole', [(0, 0), (0.08, 0), (0.08, 0.02), (0.06, 0.04), (0.045, 4.5), (0, 4.5)], steps=32); assign(pole, m)
        arm = core.post_between('arm', (0, 0, 4.45), (0.7, 0, 4.6), (0.06, 0.04), bevel=0.01); assign(arm, m)
        head = core.soft_box('head', (0.55, 0.22, 0.06), at=(0.85, 0, 4.6), n=6, subsurf=1); assign(head, m)
        led = core.soft_box('led_panel', (0.48, 0.17, 0.008), at=(0.85, 0, 4.567), n=8, subsurf=0); assign(led, mat('led_white', 'emissive', color='#f4f4f0', emit='#ffffff', strength=0.8))
        door = core.soft_box('access_door', (0.06, 0.012, 0.25), at=(0.0, -0.05, 0.5), n=6, subsurf=0); assign(door, m)

def build_mailbox(p):
    kind = p.get('kind', 'us')
    if kind == 'us':
        m = mat('paint_primary', 'painted_metal', color=p.get('color', '#2a2d30'), tint=True, metal=0.5, wear=0.2)
        post = core.soft_box('post', (0.1, 0.1, 1.05), at=(0, 0, 0.525), n=14, subsurf=0); assign(post, mat('wood_z', 'wood', color='#8a6a48', axis='Z'))
        arm = core.soft_box('arm', (0.1, 0.5, 0.06), at=(0, 0, 1.08), n=12, subsurf=0); assign(arm, mat('wood_y', 'wood', color='#8a6a48', axis='Y'))
        bx = core.soft_box('box_base', (0.17, 0.48, 0.12), at=(0, 0, 1.17), n=10, subsurf=1); assign(bx, m)
        dome = core.cylinder('box_top', 0.085, 0.48, verts=32, rot=(math.radians(90), 0, 0)); dome.location = (0, 0.24, 1.23); assign(dome, m)
        flag = core.soft_box('flag', (0.01, 0.12, 0.05), at=(0.095, 0.06, 1.3), n=6, subsurf=0); assign(flag, flat('#c41e1e', 'flag_red', 0.4))
        fp = core.post_between('flag_arm', (0.09, 0.1, 1.2), (0.095, 0.06, 1.28), None, round_=True, r=0.004); assign(fp, flat('#c41e1e', 'flag_red'))
    else:  # UK pillar box
        m = mat('paint_primary', 'painted_metal', color=p.get('color', '#c41e1e'), tint=True, metal=0.4, wear=0.15)
        body = core.lathe('pillar', [(0, 0), (0.26, 0), (0.26, 0.08), (0.22, 0.1), (0.22, 1.25), (0.26, 1.3), (0.27, 1.36), (0.2, 1.48), (0.08, 1.54), (0, 1.55)], steps=64); assign(body, m)
        slot = core.soft_box('slot', (0.22, 0.02, 0.025), at=(0, -0.222, 1.15), n=6, subsurf=0); assign(slot, flat('#141414', 'slot_dark', 0.8))
        plate = core.soft_box('plate', (0.16, 0.012, 0.1), at=(0, -0.222, 0.95), n=6, subsurf=0); assign(plate, flat('#efe9df', 'plate_cream', 0.5))
        door = core.soft_box('door', (0.26, 0.015, 0.4), at=(0, -0.22, 0.6), n=8, subsurf=0); assign(door, m)

def build_picnic_table(p):
    w = mat('wood_x', 'wood', color=p.get('wood', '#9a7a52'), axis='X', ring=8, bump=0.4)
    wv = mat('wood_z', 'wood', color=p.get('wood', '#9a7a52'), axis='Z', ring=8, bump=0.4)
    L = p.get('l', 1.8)
    for k in range(5):
        o = core.soft_box('top_board', (L, 0.14, 0.04), at=(0, -0.29 + k * 0.145, 0.76), n=10, subsurf=0); assign(o, w)
    for s in (-1, 1):
        for k in range(2):
            o = core.soft_box('seat_board', (L, 0.13, 0.04), at=(0, s * (0.62 + k * 0.14 - 0.07), 0.45), n=10, subsurf=0); assign(o, w)
    for x in (-L / 2 + 0.2, L / 2 - 0.2):
        for s in (-1, 1):
            lg = core.post_between('leg', (x, s * 0.75, 0.0), (x, s * 0.12, 0.74), (0.09, 0.04), bevel=0.006); lg.rotation_mode = 'QUATERNION'; assign(lg, wv)
        cross = core.soft_box('seat_support', (0.08, 1.6, 0.06), at=(x, 0, 0.4), n=10, subsurf=0); assign(cross, mat('wood_y', 'wood', color=p.get('wood', '#9a7a52'), axis='Y'))
        tsup = core.soft_box('top_support', (0.08, 0.7, 0.05), at=(x, 0, 0.715), n=10, subsurf=0); assign(tsup, mat('wood_y', 'wood', color=p.get('wood', '#9a7a52'), axis='Y'))

def build_planter(p):
    kind = p.get('kind', 'box')
    from models.nature import rock_mesh
    if kind == 'box':
        W = p.get('w', 1.2)
        box = core.soft_box('planter', (W, 0.45, 0.45), at=(0, 0, 0.225), n=16, subsurf=0); assign(box, mat('wood_x', 'wood', color=p.get('wood', '#7a5a3c'), axis='X') if p.get('mat', 'wood') == 'wood' else mat('corten', 'painted_metal', color='#7a3a1a', metal=0.6, wear=0.8))
        soil = core.soft_box('soil', (W - 0.06, 0.39, 0.02), at=(0, 0, 0.44), n=10, subsurf=0); assign(soil, mat('soil', 'soil'))
    else:  # round concrete bowl planter
        box = core.lathe('planter', [(0, 0), (0.25, 0), (0.45, 0.4), (0.48, 0.45), (0.43, 0.45), (0.22, 0.06), (0, 0.06)], steps=64); assign(box, mat('concrete', 'concrete', color=p.get('color', '#a8a49c')))
        soil = core.cylinder('soil', 0.4, 0.02, at=(0, 0, 0.38), verts=48); assign(soil, mat('soil', 'soil'))
    lm = mat('shrub_leaves', 'foliage', color=p.get('leaves', '#3f6b2a'), bump=0.9)
    rnd = random.Random(p.get('seed', 4))
    for k in range(p.get('shrubs', 3)):
        s = rock_mesh('shrub', (0.4, 0.35, 0.35), rnd.randint(0, 99), rough=0.5)
        x = (k - (p.get('shrubs', 3) - 1) / 2) * 0.35 if kind == 'box' else rnd.uniform(-0.1, 0.1)
        s.location = (x, rnd.uniform(-0.03, 0.03), 0.44 if kind == 'box' else 0.39); assign(s, lm)
    if p.get('flowers'):
        for k in range(14):
            fx, fy, fz = (rnd.uniform(-0.45, 0.45) if kind == 'box' else rnd.uniform(-0.2, 0.2), rnd.uniform(-0.12, 0.12), 0.62 + rnd.uniform(0, 0.08))
            st = core.post_between('flower_stem', (fx, fy, 0.43 if kind == 'box' else 0.38), (fx, fy, fz), None, round_=True, r=0.003, verts=6); assign(st, mat('flower_stem', 'foliage', color='#3f6b2a'))
            f = core.sphere('flower', 0.025, seg=12, rings=6); f.location = (fx, fy, fz)
            assign(f, flat(p['flowers'], 'flower_petals', 0.5))

def build_bike_rack(p):
    m = mat('steel', 'metal', color='#bfc3c7', metal=1, rough=0.28) if p.get('finish', 'steel') == 'steel' else mat('paint_primary', 'painted_metal', color=p.get('color', '#1d2a22'), tint=True, metal=0.6, wear=0.15)
    n = p.get('loops', 3)
    for k in range(n):
        x = (k - (n - 1) / 2) * 0.7
        loop = core.tube_path('hoop', [(x, -0.3, 0), (x, -0.3, 0.6), (x, -0.2, 0.78), (x, 0.2, 0.78), (x, 0.3, 0.6), (x, 0.3, 0)], 0.025)
        assign(loop, m)
        for s in (-1, 1):
            plate = core.cylinder('base_plate', 0.06, 0.008, at=(x, s * 0.3, 0), verts=24); assign(plate, m)

def build_gnome(p):
    hat = mat('gnome_hat', 'ceramic', color=p.get('hat', '#b3201b'), rough=0.3)
    coat = mat('gnome_coat', 'ceramic', color=p.get('coat', '#2a5aa0'), rough=0.3)
    skin = mat('gnome_skin', 'ceramic', color='#e8b898', rough=0.35)
    beard = mat('gnome_beard', 'ceramic', color='#efede6', rough=0.5)
    boots = mat('gnome_boots', 'ceramic', color='#3a2a1e', rough=0.35)
    S = p.get('size', 1.0)
    for s in (-1, 1):
        b = core.sphere('boot', 0.035 * S, seg=16, rings=8, scale=(0.9, 1.4, 0.7)); b.location = (s * 0.035 * S, -0.015 * S, 0.024 * S); assign(b, boots)
    body = core.lathe('body', [(0, 0.02 * S), (0.085 * S, 0.02 * S), (0.09 * S, 0.06 * S), (0.08 * S, 0.16 * S), (0.06 * S, 0.2 * S), (0, 0.21 * S)], steps=48); assign(body, coat)
    belt = core.lathe('belt', [(0.087 * S, 0.1 * S), (0.087 * S, 0.12 * S)], steps=48); assign(belt, boots)
    head = core.sphere('face', 0.055 * S, at=(0, 0, 0.245 * S), seg=24, rings=12); assign(head, skin)
    nose = core.sphere('nose', 0.016 * S, at=(0, -0.055 * S, 0.245 * S), seg=12, rings=6); assign(nose, skin)
    bd = core.lathe('beard', [(0.0, 0.13 * S), (0.05 * S, 0.15 * S), (0.06 * S, 0.21 * S), (0.05 * S, 0.24 * S), (0, 0.24 * S)], steps=32); bd.location = (0, -0.03 * S, 0); bd.scale = (1, 0.7, 1); assign(bd, beard)
    h = core.lathe('hat', [(0, 0.26 * S), (0.065 * S, 0.27 * S), (0.05 * S, 0.33 * S), (0.025 * S, 0.4 * S), (0.0, 0.44 * S)], steps=32); h.rotation_euler = (0.15, 0, 0); assign(h, hat)
    for s in (-1, 1):
        arm = core.tube_path('arm', [(s * 0.075 * S, 0, 0.18 * S), (s * 0.085 * S, -0.04 * S, 0.13 * S), (s * 0.03 * S, -0.075 * S, 0.12 * S)], 0.02 * S); assign(arm, coat)
        hand = core.sphere('hand', 0.016 * S, at=(s * 0.025 * S, -0.08 * S, 0.12 * S), seg=12, rings=6); assign(hand, skin)
    if p.get('lantern'):
        ln = core.soft_box('lantern', (0.03 * S, 0.03 * S, 0.045 * S), at=(0, -0.095 * S, 0.1 * S), n=6, subsurf=1); assign(ln, mat('lantern_glow', 'emissive', color='#f4e0a0', emit='#ffb040', strength=1.0))

def build_wheelbarrow(p):
    tray = mat('paint_primary', 'painted_metal', color=p.get('color', '#2a7a4a'), tint=True, metal=0.5, wear=0.3)
    frame = mat('steel', 'metal', color='#9a9ea2', metal=1, rough=0.35)
    R = 0.2
    wheel = core.lathe('tyre', [(R - 0.05, -0.04), (R - 0.02, -0.045), (R, -0.02), (R, 0.02), (R - 0.02, 0.045), (R - 0.05, 0.04)], steps=48, rot=(math.radians(90), 0, 0)); wheel.location = (0.55, 0, R); assign(wheel, mat('tyre', 'tread', color='#1b1b1c', bump=0.8))
    hub = core.cylinder('hub', R - 0.05, 0.06, verts=32, rot=(math.radians(90), 0, 0)); hub.location = (0.55, 0.03, R); assign(hub, tray)
    t = core.lathe('tray', [(0.0, 0.0), (0.25, 0.0), (0.4, 0.25), (0.38, 0.26), (0.235, 0.015), (0, 0.015)], steps=4)
    t.scale = (1.6, 1.1, 1); t.rotation_euler = (0, 0, math.pi / 4); t.location = (0.05, 0, 0.36); assign(t, tray)
    for s in (-1, 1):
        h = core.tube_path('handle_frame', [(0.55, s * 0.035, R), (0.3, s * 0.25, 0.36), (-0.4, s * 0.28, 0.42), (-0.75, s * 0.28, 0.5)], 0.016); assign(h, frame)
        lg = core.post_between('leg', (-0.25, s * 0.27, 0.4), (-0.3, s * 0.27, 0.0), None, round_=True, r=0.014); assign(lg, frame)
        g = core.cylinder('grip', 0.02, 0.12, verts=16, rot=(0, math.radians(90), 0)); g.location = (-0.85, s * 0.28, 0.5); assign(g, mat('grip_rubber', 'rubber', color='#1a1a1a'))

def build_firewood(p):
    bark = mat('bark', 'bark', color=p.get('bark', '#5b4634'), bump=0.9)
    end = mat('endgrain', 'endgrain', color=p.get('wood', '#c49866'), ring=26)
    rnd = random.Random(p.get('seed', 5))
    rows = p.get('rows', 4)
    L = 0.45
    if p.get('rack', True):
        rk = mat('steel_rack', 'painted_metal', color='#1d1d1f', metal=0.7, wear=0.2)
        for s in (-1, 1):
            u = core.tube_path('rack_end', [(s * 0.55, 0, 0.0), (s * 0.55, 0, rows * 0.13 + 0.15)], 0.015); assign(u, rk)
        base = core.post_between('rack_base', (-0.55, 0, 0.02), (0.55, 0, 0.02), (0.03, 0.03), bevel=0.003); assign(base, rk)
        for s in (-1, 1):
            f = core.post_between('rack_foot', (s * 0.55, -0.25, 0.02), (s * 0.55, 0.25, 0.02), (0.04, 0.04), bevel=0.003); assign(f, rk)
    z = 0.031 if p.get('rack', True) else 0.0   # logs rest ON the rack's base bar
    for r in range(rows):
        n = 8 - (r % 2)
        for k in range(n):
            rad = rnd.uniform(0.058, 0.065)
            x = -0.48 + (k + 0.5 + 0.5 * (r % 2)) * (0.96 / 8)
            log = core.cylinder('log', rad, L, verts=10 if rnd.random() < 0.5 else 6, rot=(math.radians(90), 0, rnd.uniform(-0.05, 0.05)))
            log.location = (x, L / 2, z + rad); assign(log, bark)
            for yy in (L / 2 + 0.001, -L / 2 - 0.004):
                c = core.cylinder('cut', rad * 0.92, 0.004, verts=10, rot=(math.radians(90), 0, 0)); c.location = (x, yy, z + rad); assign(c, end)
        z += 0.115

def build_fence(p):
    kind = p.get('kind', 'picket')
    L = p.get('l', 2.4)
    if kind == 'picket':
        m = mat('paint_primary', 'planks', color=p.get('color', '#f2f1ec'), tint=True, board=0.5, bump=0.3)
        for s in (-1, 1):
            po = core.soft_box('post', (0.09, 0.09, 1.1), at=(s * L / 2, 0, 0.55), n=14, subsurf=0); assign(po, m)
            cap = core.lathe('post_cap', [(0, 1.1), (0.055, 1.1), (0.055, 1.13), (0.03, 1.17), (0, 1.18)], steps=4); cap.location = (s * L / 2, 0, 0); cap.rotation_euler = (0, 0, math.pi / 4); assign(cap, m)
        for z in (0.25, 0.8):
            r = core.soft_box('rail', (L, 0.04, 0.08), at=(0, 0.06, z), n=12, subsurf=0); assign(r, m)
        n = int(L / 0.12)
        for k in range(n):
            x = -L / 2 + 0.1 + k * (L - 0.2) / (n - 1)
            pk = core.extrude_outline('picket', [(-0.04, 0.05), (0.04, 0.05), (0.04, 0.98), (0.0, 1.05), (-0.04, 0.98)], 0.02, rot=(math.radians(90), 0, 0))
            pk.location = (x, 0.09, 0); assign(pk, m)
    elif kind == 'rail':  # split rail ranch fence
        m = mat('wood_x', 'wood', color=p.get('wood', '#8a7a62'), axis='X', ring=6, bump=0.5)
        for s in (-1, 1):
            po = core.cylinder('post', 0.07, 1.2, at=(s * L / 2, 0, 0), verts=10); assign(po, mat('wood_z', 'wood', color=p.get('wood', '#8a7a62'), axis='Z'))
        for z in (0.4, 0.75, 1.05):
            r = core.cylinder('rail', 0.05, L + 0.1, verts=7, rot=(0, math.radians(90), 0)); r.location = (-L / 2 - 0.05, 0, z); assign(r, m)
    else:  # wrought iron
        m = mat('paint_primary', 'painted_metal', color=p.get('color', '#141414'), tint=True, metal=0.7, wear=0.15)
        stone = mat('stone_base', 'concrete', color='#b0aca4')
        wall = core.soft_box('plinth_wall', (L + 0.3, 0.3, 0.4), at=(0, 0, 0.2), n=14, subsurf=0); assign(wall, stone)
        for s in (-1, 1):
            pier = core.soft_box('pier', (0.4, 0.4, 1.6), at=(s * (L / 2 + 0.15), 0, 0.8), n=14, subsurf=0); assign(pier, stone)
        for z in (0.5, 1.3):
            r = core.post_between('rail', (-L / 2 - 0.02, 0, z), (L / 2 + 0.02, 0, z), (0.03, 0.03), bevel=0.003); assign(r, m)
        n = int(L / 0.13)
        for k in range(n):
            x = -L / 2 + 0.06 + k * (L - 0.12) / (n - 1)
            bar = core.post_between('bar', (x, 0, 0.39), (x, 0, 1.45), (0.018, 0.018), bevel=0.002); assign(bar, m)
            sp = core.cylinder('spear', 0.02, 0.07, at=(x, 0, 1.44), verts=4, r2=0.001); assign(sp, m)

# ------------------------------------------------------------------ nature extras (light)
def build_bush(p):
    from models.nature import rock_mesh
    rnd = random.Random(p.get('seed', 2))
    lm = mat('bush_leaves', 'foliage', color=p.get('color', '#3f6b2a'), bump=1.0)
    S = p.get('size', 1.0)
    parts = []
    for k in range(p.get('clumps', 5)):
        s = rnd.uniform(0.5, 0.8) * S
        c = rock_mesh('clump', (s, s * 0.9, s * 0.8), rnd.randint(0, 999), rough=0.55)
        a = rnd.uniform(0, math.tau); r = rnd.uniform(0, 0.25 * S)
        c.location = (math.cos(a) * r, math.sin(a) * r, rnd.uniform(0, 0.25 * S))
        parts.append(c)
    j = core.join(parts, 'bush'); assign(j, lm)
    trunk = core.cylinder('stem', 0.03 * S, 0.3 * S, at=(0, 0, 0), verts=10); assign(trunk, mat('bark', 'bark', color='#4a3a2a'))
    if p.get('flowers'):
        fl = []
        for k in range(40):
            a = rnd.uniform(0, math.tau); r = rnd.uniform(0.15, 0.4) * S
            fl.append(core.sphere('flower', 0.02 * S, at=(math.cos(a) * r, math.sin(a) * r, rnd.uniform(0.2, 0.6) * S), seg=8, rings=4))
        assign(core.join(fl, 'flowers'), flat(p['flowers'], 'blossom', 0.5))

def build_grass_clump(p):
    from models.props import leaf_blade
    rnd = random.Random(p.get('seed', 3))
    lm = mat('grass_blades', 'foliage', color=p.get('color', '#5b7a34'), bump=0.3)
    mound = core.sphere('earth', 0.15, seg=16, rings=8, scale=(1.3, 1.3, 0.25)); mound.location = (0, 0, 0.0); assign(mound, mat('soil', 'soil'))
    bl = []
    for k in range(p.get('blades', 80)):
        a = rnd.uniform(0, math.tau); r = rnd.uniform(0, 0.12)
        bl.append(leaf_blade('blade', (math.cos(a) * r, math.sin(a) * r, 0.02), rnd.uniform(0.2, 0.5) * p.get('height', 1.0), 0.01, rnd.uniform(0.05, 0.25), rnd.uniform(-0.4, 0.4), curl=0.002, rot=a, thick=0.0015))
    assign(core.join(bl, 'grass'), lm)
    if p.get('seed_heads'):
        for k in range(10):
            a = rnd.uniform(0, math.tau)
            st = core.post_between('stalk', (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.02), (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.6), None, round_=True, r=0.002, verts=6); assign(st, mat('straw', 'foliage', color='#c8b070'))
            hd = core.sphere('seed_head', 0.012, at=(math.cos(a) * 0.15, math.sin(a) * 0.15, 0.62), seg=8, rings=4, scale=(1, 1, 3)); assign(hd, mat('straw', 'foliage'))

def build_flower_pot(p):
    from models.props import pot
    top = pot(p, p.get('r', 0.1), p.get('h', 0.16), p.get('pot', 'terracotta'))
    rnd = random.Random(p.get('seed', 6))
    stem_m = mat('flower_stem', 'foliage', color='#3f6b2a')
    petal = mat('petals', 'fabric', color=p.get('color', '#d9304a'), bump=0.3, sheen=0.4)
    for k in range(p.get('count', 7)):
        a = rnd.uniform(0, math.tau); r = rnd.uniform(0, 0.05)
        h = rnd.uniform(0.18, 0.32)
        base = (math.cos(a) * r, math.sin(a) * r, top - 0.01)
        tip = (base[0] + math.cos(a) * 0.04, base[1] + math.sin(a) * 0.04, top + h)
        st = core.post_between('stem', base, tip, None, round_=True, r=0.003, verts=6); assign(st, stem_m)
        kind = p.get('flower', 'tulip')
        if kind == 'tulip':
            fl = core.lathe('tulip', [(0, 0), (0.015, 0.005), (0.02, 0.025), (0.016, 0.045), (0.0, 0.04)], steps=6); fl.location = tip; assign(fl, petal)
        else:  # daisy-like
            ctr = core.sphere('center', 0.01, at=tip, seg=12, rings=6, scale=(1, 1, 0.5)); assign(ctr, flat('#e8b020', 'flower_center', 0.6))
            for j in range(10):
                b = j * math.tau / 10
                pe = core.sphere('petal', 0.012, seg=8, rings=4, scale=(1.6, 0.5, 0.15)); pe.location = (tip[0] + math.cos(b) * 0.018, tip[1] + math.sin(b) * 0.018, tip[2]); pe.rotation_euler = (0, 0, b); assign(pe, petal)
        for j in range(2):
            lf = core.sphere('leaf', 0.03, seg=8, rings=4, scale=(1, 0.3, 0.08)); m_ = 0.4 + 0.2 * j
            lf.location = (base[0] + (tip[0] - base[0]) * m_ + math.cos(a + 1.5) * 0.02, base[1] + (tip[1] - base[1]) * m_ + math.sin(a + 1.5) * 0.02, base[2] + (tip[2] - base[2]) * m_); lf.rotation_euler = (0.3, -0.4, a + 1.5); assign(lf, stem_m)

def build_cliff(p):
    """Layered rock face: strata ledges that jut out / recede, a slight bedding dip, vertical joints, tapering crest."""
    from mathutils import noise
    W, D, H = p.get('size', (3.0, 1.6, 2.2))
    rnd = random.Random(p.get('seed', 17))
    o = core.soft_box('cliff', (W, D, H), at=(0, 0, H / 2), n=7, cuts=48, subsurf=0)
    # strata: random bed thicknesses, each with its own set-back
    beds, z = [], 0.0
    while z < H:
        t = rnd.uniform(0.16, 0.42) * H / 2.2
        beds.append((z, z + t, rnd.uniform(-0.1, 0.1)))
        z += t
    def setback(zz):
        v = 0.0
        for z0, z1, off in beds:
            k = min(1.0, max(0.0, (zz - z0) / 0.035)) * min(1.0, max(0.0, (z1 - zz) / 0.035))
            v += off * (k * k * (3 - 2 * k))
        return v
    joints = [rnd.uniform(-W / 2 * 0.8, W / 2 * 0.8) for _ in range(rnd.randint(3, 5))]
    off = Vector((rnd.uniform(-50, 50), rnd.uniform(-50, 50), rnd.uniform(-50, 50)))
    dip = rnd.uniform(-0.06, 0.06)
    for v in o.data.vertices:
        x, y, zz = v.co
        zz += H / 2  # mesh is centred on the box; work from the base
        zn = max(0.0, min(1.0, zz / H))
        zb = zz + dip * x  # beds dip gently across the face
        taper = 1 - 0.32 * zn ** 1.4
        sb = setback(zb)
        sx = (abs(x) * taper + sb) / max(abs(x), 1e-6) if abs(x) > 1e-6 else 1
        sy = (abs(y) * taper + sb) / max(abs(y), 1e-6) if abs(y) > 1e-6 else 1
        nx, ny = x * sx, y * sy
        # vertical joints cut into the walls
        for jx in joints:
            g = math.exp(-((x - jx) / 0.035) ** 2)
            ny -= math.copysign(0.07 * g, y) if abs(y) > D * 0.3 else 0
        # weathered surface + a ragged crest
        q = Vector((nx, ny, zz)) * 1.6 + off
        n = noise.fractal(q, 0.55, 2.0, 5)
        nx += 0.05 * n * (1 if x >= 0 else -1)
        ny += 0.05 * n * (1 if y >= 0 else -1)
        if zz > H * 0.97:
            zz += 0.12 * noise.fractal(Vector((x, y, 0)) * 1.2 + off, 0.5, 2.0, 4)
        v.co = (nx, ny, max(0.0, zz) - H / 2)
    core.smooth(o)
    assign(o, mat('cliff_stone', 'stone', color=p.get('color', '#8f877a'), lichen=p.get('lichen', 0.25), scale=1.2, cracks=2.0, bump=0.8, ao_dist=0.4))
    # talus: a few fallen blocks at the foot, resting on the ground and against the face
    from models.nature import rock_mesh
    for k in range(rnd.randint(3, 5)):
        sz = rnd.uniform(0.18, 0.4)
        r = rock_mesh('talus', (sz, sz * 0.8, sz * 0.6), p.get('seed', 17) * 7 + k, rough=0.3, sub=3)
        bx = rnd.uniform(-W / 2 * 0.8, W / 2 * 0.8)
        r.location = (bx, -(D / 2) * (1 - 0.0) - sz * 0.25 + setback(sz * 0.3), 0)
        bpy_min = min(v.co.z for v in r.data.vertices)
        r.location.z = -bpy_min - 0.01
        assign(r, mat('cliff_stone', 'stone'))

TYPES = {
    'hd-fruit-bowl': {'label': 'Fruit bowl (HD)', 'category': 'food', 'options': {'color': 'bowl glaze'}, 'build': build_fruit_bowl, 'tags': ['fruit bowl', 'fruit', 'apples', 'oranges', 'lemons'],
                      'variants': {'mixed-white-bowl': dict(), 'citrus-wood-bowl': dict(bowl='wood', fruit=['orange', 'lemon', 'orange', 'lemon', 'orange', 'lemon']), 'apples-bananas': dict(fruit=['apple'] * 6, banana=True, color='#2a3f5f')}},
    'hd-bread': {'label': 'Bread (HD)', 'category': 'food', 'options': {}, 'build': build_bread, 'tags': ['bread', 'loaf', 'baguette', 'sourdough', 'bakery'],
                 'variants': {'sourdough-boule': dict(), 'baguettes': dict(kind='baguette', color='#c08a3a'), 'sliced-loaf': dict(kind='sliced', color='#a86a2a')}},
    'hd-cake': {'label': 'Cake (HD)', 'category': 'food', 'options': {'color': 'icing color'}, 'build': build_cake, 'tags': ['cake', 'cupcakes', 'dessert', 'bakery', 'birthday'],
                'variants': {'berry-layer-cake': dict(), 'chocolate-drip': dict(color='#4a2a1a', drip='#2a140a', berry='#e8c040'), 'cupcakes-pink': dict(kind='cupcakes', color='#f2c0d0'), 'cupcakes-vanilla': dict(kind='cupcakes', color='#f4ead6', liner='#3a8ad9', stand='glass')}},
    'hd-coffee-cup': {'label': 'Coffee cup (HD)', 'category': 'food', 'options': {'color': 'cup glaze'}, 'build': build_coffee, 'tags': ['coffee', 'cappuccino', 'espresso', 'latte', 'cup'],
                      'variants': {'cappuccino': dict(), 'espresso': dict(kind='espresso', color='#1d1d1f'), 'latte-glass': dict(kind='latte')}},
    'hd-croissants': {'label': 'Croissants (HD)', 'category': 'food', 'options': {}, 'build': build_croissant_plate, 'tags': ['croissant', 'pastry', 'breakfast', 'bakery'],
                      'variants': {'two-on-plate': dict(), 'three-on-plate': dict(count=3)}},
    'hd-kettle': {'label': 'Kettle (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'body color'}, 'build': build_kettle, 'tags': ['kettle', 'electric kettle', 'tea kettle', 'kitchen'],
                  'variants': {'electric-white': dict(), 'electric-black': dict(color='#1d1e20'), 'stovetop-steel': dict(kind='steel'), 'stovetop-red-enamel': dict(kind='enamel')}},
    'hd-toaster': {'label': 'Toaster (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'body color'}, 'build': build_toaster, 'tags': ['toaster', 'toast', 'kitchen appliance'],
                   'variants': {'cream-retro': dict(), 'steel-with-toast': dict(finish='steel', toast=True), 'mint': dict(color='#a8d8c8')}},
    'hd-coffee-maker': {'label': 'Coffee maker (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_coffee_maker, 'tags': ['coffee maker', 'espresso machine', 'coffee machine', 'kitchen appliance'],
                        'variants': {'drip-black': dict(), 'espresso-steel': dict(kind='espresso', color='#2a2b2d')}},
    'hd-stand-mixer': {'label': 'Stand mixer (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'paint color'}, 'build': build_mixer, 'tags': ['stand mixer', 'mixer', 'baking', 'kitchen appliance'],
                       'variants': {'red': dict(), 'pastel-blue': dict(color='#9fbcd8'), 'black': dict(color='#1d1e20')}},
    'hd-knife-block': {'label': 'Knife block (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_knife_block, 'tags': ['knife block', 'knives', 'kitchen'],
                       'variants': {'walnut-black': dict(), 'oak-wood-handles': dict(wood='#b48a5a', handles='wood')}},
    'hd-glassware': {'label': 'Glassware (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_wine_glasses, 'tags': ['wine glass', 'glass', 'glassware', 'tumbler', 'whisky'],
                     'variants': {'red-wine-pair': dict(), 'white-wine-pair': dict(kind='white', wine='#e8d080'), 'empty-trio': dict(count=3, filled=False), 'whisky-tumblers': dict(kind='tumbler')}},
    'hd-jar-set': {'label': 'Jar set (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {}, 'build': build_jars, 'tags': ['jars', 'storage jars', 'pantry', 'canisters'],
                   'variants': {'pantry-wood-lids': dict(), 'steel-lids': dict(lids='steel', contents=[('#3a2010', 0.6), ('#f2f0ea', 0.75), ('#a0702a', 0.4)])}},
    'hd-lamppost': {'label': 'Lamppost (HD)', 'category': 'street', 'options': {'color': 'paint color'}, 'build': build_lamppost, 'tags': ['lamppost', 'street light', 'lamp post', 'lantern'],
                    'variants': {'victorian-green': dict(), 'victorian-black': dict(color='#141414'), 'modern-led': dict(kind='modern', color='#5a5e62')}},
    'hd-mailbox': {'label': 'Mailbox (HD)', 'category': 'street', 'options': {'color': 'paint color'}, 'build': build_mailbox, 'tags': ['mailbox', 'postbox', 'letter box', 'pillar box'],
                   'variants': {'us-black': dict(), 'us-green': dict(color='#2a5a3a'), 'uk-pillar-red': dict(kind='uk')}},
    'hd-picnic-table': {'label': 'Picnic table (HD)', 'category': 'street', 'options': {}, 'build': build_picnic_table, 'tags': ['picnic table', 'park table', 'bench table'],
                        'variants': {'natural': dict(), 'weathered-long': dict(wood='#8a8270', l=2.4)}},
    'hd-planter': {'label': 'Planter (HD)', 'category': 'street', 'options': {}, 'build': build_planter, 'tags': ['planter', 'plant box', 'flower box', 'shrubs'],
                   'variants': {'wood-box': dict(), 'corten-box-flowers': dict(mat='corten', flowers='#d94a6a'), 'concrete-bowl': dict(kind='bowl', shrubs=1)}},
    'hd-bike-rack': {'label': 'Bike rack (HD)', 'category': 'street', 'options': {'color': 'paint color'}, 'build': build_bike_rack, 'tags': ['bike rack', 'bicycle stand', 'cycle rack'],
                     'variants': {'steel-three': dict(), 'green-five': dict(finish='paint', loops=5)}},
    'hd-garden-gnome': {'label': 'Garden gnome (HD)', 'category': 'street', 'options': {}, 'build': build_gnome, 'tags': ['garden gnome', 'gnome', 'garden ornament'],
                        'variants': {'classic': dict(), 'green-lantern': dict(hat='#2a6a3a', coat='#b3201b', lantern=True), 'large-blue': dict(hat='#2a4a8a', coat='#c8962c', size=1.6)}},
    'hd-wheelbarrow': {'label': 'Wheelbarrow (HD)', 'category': 'street', 'options': {'color': 'tray color'}, 'build': build_wheelbarrow, 'tags': ['wheelbarrow', 'barrow', 'garden', 'construction'],
                       'variants': {'green': dict(), 'red': dict(color='#b3201b')}},
    'hd-firewood': {'label': 'Firewood stack (HD)', 'category': 'nature', 'options': {}, 'build': build_firewood, 'tags': ['firewood', 'logs', 'wood pile', 'log rack'],
                    'variants': {'rack': dict(), 'tall-rack': dict(rows=6, seed=9), 'pile-no-rack': dict(rack=False, rows=3, bark='#4a3a2a')}},
    'hd-fence': {'label': 'Fence (HD)', 'category': 'street', 'options': {'color': 'paint color'}, 'build': build_fence, 'tags': ['fence', 'picket fence', 'railing', 'gate', 'ranch fence'],
                 'variants': {'white-picket': dict(), 'split-rail': dict(kind='rail'), 'wrought-iron': dict(kind='iron'), 'green-picket': dict(color='#4f6a52')}},
    'hd-bush': {'label': 'Bush (HD)', 'category': 'nature', 'options': {}, 'build': build_bush, 'tags': ['bush', 'shrub', 'hedge', 'plant'],
                'variants': {'round-green': dict(), 'flowering-pink': dict(flowers='#e07a9a', seed=8), 'large-dark': dict(color='#2f5a2a', size=1.5, clumps=7, seed=12)}},
    'hd-grass-clump': {'label': 'Grass clump (HD)', 'category': 'nature', 'options': {}, 'build': build_grass_clump, 'tags': ['grass', 'grass clump', 'tuft', 'meadow'],
                       'variants': {'green': dict(), 'dry-seed-heads': dict(color='#a8a060', seed_heads=True, seed=7), 'tall-wild': dict(height=1.6, blades=120, seed=11)}},
    'hd-flower-pot': {'label': 'Flowers in pot (HD)', 'category': 'nature', 'options': {}, 'build': build_flower_pot, 'tags': ['flowers', 'flower pot', 'tulips', 'daisies', 'potted flowers'],
                      'variants': {'red-tulips': dict(), 'yellow-tulips': dict(color='#e8c020', seed=4), 'white-daisies': dict(flower='daisy', color='#f4f2ea', pot='ceramic', count=9), 'purple-daisies': dict(flower='daisy', color='#8a4ac8', count=8)}},
    'hd-cliff': {'label': 'Cliff piece (HD)', 'category': 'nature', 'options': {}, 'build': build_cliff, 'tags': ['cliff', 'rock face', 'crag', 'outcrop', 'boulder'],
                 'variants': {'grey-outcrop': dict(), 'sandstone-wall': dict(color='#b39470', size=(4.0, 1.4, 2.6), seed=23, lichen=0.1), 'mossy-crag': dict(color='#6f6a62', lichen=0.7, seed=31)}},
}
