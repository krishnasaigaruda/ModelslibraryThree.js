"""HD everyday objects: electronics, fashion, carried items, hand tools.
Real dimensions; screens are glossy black glass; plastics/metal clean PBR."""
import math, random
from lib import core, cloth
from lib.mats import mat, assign

def alu(c='#c3c6ca'): return mat('aluminium', 'metal', color=c, metal=1.0, rough=0.3, axis='X')
def plastic(c, name=None, rough=0.4): return mat(name or f'plastic_{c[1:]}', 'flat', color=c, rough=rough)
def screen(): return mat('screen_glass', 'flat', color='#07090b', rough=0.05, metal=0.2)
def rubber(): return mat('rubber', 'rubber', color='#151515')

# ------------------------------------------------------------------ electronics
def build_laptop(p):
    W, D = p.get('w', 0.32), p.get('d', 0.22)
    body = alu(p.get('color', '#c3c6ca')) if p.get('finish') != 'black' else plastic('#1d1e20', 'plastic_primary')
    base = core.soft_box('base', (W, D, 0.014), at=(0, 0, 0.007), n=10, subsurf=1); assign(base, body)
    kb = core.soft_box('keyboard_well', (W * 0.86, D * 0.42, 0.002), at=(0, 0.02, 0.0141), n=10, subsurf=0); assign(kb, plastic('#121314', 'keys'))
    for r in range(5):
        for c in range(13):
            k = core.soft_box('key', (W * 0.86 / 13 - 0.003, D * 0.42 / 5 - 0.003, 0.0015), at=(-W * 0.43 + (c + 0.5) * W * 0.86 / 13, 0.02 - D * 0.21 + (r + 0.5) * D * 0.42 / 5, 0.0152), n=6, subsurf=0)
            assign(k, plastic('#1a1b1d', 'keys'))
    tp = core.soft_box('trackpad', (W * 0.36, D * 0.26, 0.0006), at=(0, -D * 0.3, 0.0142), n=8, subsurf=0); assign(tp, plastic('#9ea2a6', 'trackpad', 0.25))
    ang = math.radians(p.get('open', 105))
    th = math.pi / 2 - ang
    hy, hz = D / 2 - 0.004, 0.014
    dy, dz = -math.cos(ang), math.sin(ang)          # direction from the hinge up the lid
    lid = core.soft_box('lid', (W, 0.007, D), n=10, subsurf=1)
    lid.rotation_euler = (th, 0, 0)
    lid.location = (0, hy + dy * D / 2, hz + dz * D / 2)
    assign(lid, body)
    scr = core.soft_box('screen', (W * 0.94, 0.001, D * 0.9), n=10, subsurf=0)
    scr.rotation_euler = (th, 0, 0)
    ny, nz = -math.cos(th), -math.sin(th)           # lid's front face normal
    scr.location = (0, lid.location[1] + ny * 0.0038, lid.location[2] + nz * 0.0038)
    assign(scr, screen() if not p.get('on') else mat('screen_on', 'emissive', color='#1d2a3a', emit='#5b8cc8', strength=0.6))
    # orbixstudio.dev emblem centred on the back of the lid
    by, bz = math.cos(th), math.sin(th)              # lid's back face normal
    orbix_on('emblem', 0.014, (0, lid.location[1] + by * 0.0036, lid.location[2] + bz * 0.0036), th)

def build_monitor(p):
    W = p.get('w', 0.62); H = W * 9 / 16
    m = plastic(p.get('color', '#1c1d1f'), 'plastic_primary')
    base = core.soft_box('stand_base', (0.24, 0.18, 0.012), at=(0, 0.02, 0.006), n=8, subsurf=1); assign(base, m)
    neck = core.post_between('neck', (0, 0.06, 0.01), (0, 0.06, 0.09 + H * 0.5), (0.05, 0.02), bevel=0.006); assign(neck, m)
    panel = core.soft_box('panel', (W, 0.03, H), at=(0, 0.035, 0.11 + H / 2), n=10, subsurf=1); assign(panel, m)
    scr = core.soft_box('screen', (W - 0.014, 0.001, H - 0.03), at=(0, 0.0195, 0.115 + H / 2), n=12, subsurf=0)
    assign(scr, screen() if not p.get('on') else mat('screen_on', 'emissive', color='#1d2a3a', emit='#4a7fbf', strength=0.6))

def build_tv(p):
    W = p.get('w', 1.23); H = W * 9 / 16
    m = plastic('#141516', 'tv_body', 0.3)
    panel = core.soft_box('panel', (W, 0.03, H), at=(0, 0, 0.09 + H / 2), n=12, subsurf=1); assign(panel, m)
    scr = core.soft_box('screen', (W - 0.012, 0.001, H - 0.012), at=(0, -0.0155, 0.09 + H / 2), n=12, subsurf=0); assign(scr, screen())
    if p.get('feet', True):
        for s in (-1, 1):
            f = core.tube_path('foot', [(s * W * 0.38, 0.0, 0.1), (s * W * 0.4, -0.02, 0.01), (s * W * 0.4, -0.12, 0.008)], 0.008); assign(f, alu('#2a2b2d'))
            f2 = core.tube_path('foot', [(s * W * 0.38, 0.0, 0.1), (s * W * 0.4, 0.02, 0.01), (s * W * 0.4, 0.1, 0.008)], 0.008); assign(f2, alu('#2a2b2d'))
    else:
        base = core.soft_box('pedestal', (0.32, 0.2, 0.012), at=(0, 0, 0.006), n=10, subsurf=1); assign(base, alu('#2a2b2d'))
        neck = core.post_between('neck', (0, 0.02, 0.01), (0, 0.02, 0.1 + H * 0.3), (0.06, 0.02), bevel=0.005); assign(neck, alu('#2a2b2d'))

def build_speaker(p):
    kind = p.get('kind', 'bookshelf')
    if kind == 'bookshelf':
        W, D, H = 0.17, 0.24, 0.3
        cab = core.soft_box('cabinet', (W, D, H), at=(0, 0, H / 2), n=14, subsurf=1)
        assign(cab, mat('wood_x', 'wood', color=p.get('wood', '#5e3b24'), axis='X', ring=9))
        baffle = core.soft_box('baffle', (W - 0.004, 0.004, H - 0.004), at=(0, -D / 2 - 0.001, H / 2), n=14, subsurf=0); assign(baffle, plastic('#141414', 'baffle', 0.6))
        for z, r in ((H * 0.68, 0.06), (H * 0.25, 0.016)):
            cone = core.lathe('driver', [(0.0, 0.004), (r * 0.25, 0.0), (r * 0.8, -0.008), (r, -0.006), (r + 0.006, 0.0), (r + 0.006, 0.003)], steps=48, rot=(math.radians(90), 0, 0))
            cone.location = (0, -D / 2 - 0.003, z); assign(cone, plastic('#222326', 'driver_cone', 0.55))
        port = core.lathe('port', [(0.018, 0), (0.022, 0), (0.022, 0.003)], steps=32, rot=(math.radians(90), 0, 0)); port.location = (0, -D / 2 - 0.002, H * 0.08); assign(port, plastic('#0d0d0d', 'port'))
    else:  # smart / portable cylinder speaker with fabric
        R, H = (0.05, 0.17) if kind == 'smart' else (0.035, 0.18)
        body = core.lathe('body', [(0, 0), (R * 0.95, 0), (R, 0.01), (R, H - 0.01), (R * 0.95, H), (0, H)], steps=64)
        assign(body, mat('fabric_primary', 'fabric', color=p.get('color', '#5f6468'), tint=True, bump=0.6))
        top = core.cylinder('top', R * 0.92, 0.004, at=(0, 0, H - 0.001), verts=64); assign(top, plastic('#1b1c1e', 'top_cap', 0.3))
        ring = core.lathe('ring_light', [(R * 0.6, H + 0.003), (R * 0.68, H + 0.003)], steps=48); assign(ring, mat('led', 'emissive', color='#9ad0ff', emit='#3aa0ff', strength=0.8))

settle = core.settle  # shared: rotate a fresh build and rest it on the ground (no display stands)

def build_headphones(p):
    m = plastic(p.get('color', '#1d1e20'), 'plastic_primary', 0.35)
    cush = mat('leather_cushion', 'leather', color='#1a1a1a', bump=0.4)
    import bpy
    before = {o.name for o in bpy.context.scene.objects}
    # pure model: rests on its ear cups (no display stand)
    band = []
    for i in range(17):
        a = math.pi * i / 16
        band.append((math.cos(a) * 0.09, 0, 0.13 + math.sin(a) * 0.095))
    b = core.tube_path('headband', band, 0.012); assign(b, m)
    pad = core.tube_path('band_pad', band[4:13], 0.014); assign(pad, cush)
    for s in (-1, 1):
        yoke = core.post_between('yoke', (s * 0.09, 0, 0.13), (s * 0.09, 0, 0.08), None, round_=True, r=0.006); assign(yoke, alu('#9a9ea2'))
        cup = core.lathe('cup', [(0, 0), (0.045, 0), (0.05, 0.012), (0.048, 0.03), (0.04, 0.036), (0, 0.037)], steps=48, rot=(0, math.radians(90 * -s), 0))
        cup.location = (s * 0.115, 0, 0.06); assign(cup, m)
        ear = core.lathe('ear_cushion', [(0.02, 0), (0.042, 0), (0.046, 0.01), (0.04, 0.02), (0.022, 0.02)], steps=48, rot=(0, math.radians(90 * s), 0))
        ear.location = (s * 0.115, 0, 0.06); assign(ear, cush)
    settle(before)

def build_controller(p):
    m = plastic(p.get('color', '#1f2023'), 'plastic_primary', 0.35)
    body = core.loft('body', [(-0.075, 0.01, 0.012, 0.0), (-0.07, 0.03, 0.02, 0.0), (-0.045, 0.045, 0.022, 0), (-0.02, 0.05, 0.02, 0), (0.02, 0.05, 0.02, 0), (0.045, 0.045, 0.022, 0), (0.07, 0.03, 0.02, 0), (0.075, 0.01, 0.012, 0)], seg=28, power=2.4)
    body.location = (0, 0, 0.028); core.add_subsurf(body, 1); assign(body, m)
    for s in (-1, 1):
        g = core.soft_box('grip', (0.035, 0.07, 0.035), at=(s * 0.05, -0.04, 0.022), n=3, subsurf=1, rot=(0, 0, s * 0.35)); assign(g, m)
        stick = core.lathe('stick', [(0, 0.035), (0.006, 0.035), (0.006, 0.045), (0.011, 0.047), (0.011, 0.052), (0, 0.053)], steps=24); stick.location = (s * 0.025, -0.01, 0); assign(stick, plastic('#2a2b2e', 'sticks', 0.6))
    for k, c in enumerate(['#3fbf5f', '#d94040', '#3f7fd9', '#e0c040']):
        a = k * math.pi / 2
        bt = core.cylinder('button', 0.0045, 0.006, at=(0.048 + math.cos(a) * 0.011, 0.012 + math.sin(a) * 0.011, 0.046), verts=16, bevel=0.0015); assign(bt, plastic(c, f'btn_{k}', 0.25))
    dp = core.soft_box('dpad', (0.024, 0.008, 0.005), at=(-0.048, 0.012, 0.047), n=8, subsurf=0); assign(dp, plastic('#2a2b2e', 'sticks'))
    dp2 = core.soft_box('dpad', (0.008, 0.024, 0.005), at=(-0.048, 0.012, 0.047), n=8, subsurf=0); assign(dp2, plastic('#2a2b2e', 'sticks'))

ORBIX = ['#ff5fa2', '#ff8a4c', '#ffd23f', '#7be36b', '#3fc3ff', '#7a6cff', '#c86bff']

def orbix(name, r, at, normal_y=1, flat=0.35):
    """orbixstudio.dev studio emblem: glossy rainbow ring (7 colour arcs) round a dark centre, facing +/-Y."""
    tube = r * 0.36
    cx, cy, cz = at
    n = len(ORBIX)
    for i, c in enumerate(ORBIX):
        a0 = math.tau * i / n + math.radians(135)
        pts = [(cx + r * math.cos(a0 + math.tau / n * k / 6 * 1.08), cy, cz + r * math.sin(a0 + math.tau / n * k / 6 * 1.08)) for k in range(7)]
        arc = core.tube_path(f'{name}_ring', pts, tube, seg=10)
        for v in arc.data.vertices:
            v.co.y = cy + (v.co.y - cy) * flat
        assign(arc, mat(f'orbix_{c[1:]}', 'flat', color=c, rough=0.2))
    disc = core.cylinder(f'{name}_centre', r * 0.7, tube * flat * 1.6, verts=32, rot=(math.radians(90), 0, 0))
    disc.location = (cx, cy + normal_y * tube * flat * 0.8, cz)
    assign(disc, mat('orbix_centre', 'flat', color='#140f1f', rough=0.25))

def orbix_on(name, r, center, rot_x=0.0):
    """Studio emblem placed on a tilted surface: built facing +Y at the origin, then rotated about X and moved."""
    import bpy, mathutils
    before = {o.name for o in bpy.context.scene.objects}
    orbix(name, r, (0, 0, 0))
    bpy.context.view_layer.update()
    M = mathutils.Matrix.Translation(center) @ mathutils.Matrix.Rotation(rot_x, 4, 'X')
    for o in bpy.context.scene.objects:
        if o.name not in before and o.type == 'MESH':
            o.matrix_world = M @ o.matrix_world

def build_phone(p):
    """Smartphone lying flat, screen up: glass front (lock screen when on), camera bump, side buttons."""
    import bpy, mathutils
    W, H, T = 0.072, 0.15, 0.0082
    m = alu(p.get('color', '#2a2c2f'))
    st_m = plastic('#cfd2d4', 'stand', 0.4)
    before = {o.name for o in bpy.context.scene.objects}
    # --- built upright: width X, screen facing -Y, bottom at z=0
    body = core.soft_box('phone', (W, T, H), at=(0, 0, H / 2), n=10, subsurf=1); assign(body, m)
    glass = core.soft_box('screen', (W - 0.0022, 0.0008, H - 0.0022), at=(0, -T / 2 + 0.0002, H / 2), n=14, subsurf=1)
    assign(glass, screen() if not p.get('on') else mat('screen_on', 'emissive', color='#1d2a3a', emit='#5a8fd0', strength=0.7))
    if p.get('on'):  # clock bar + dock row on the lock screen
        clock = core.soft_box('lock_clock', (0.03, 0.0004, 0.009), at=(0, -T / 2 - 0.0003, H * 0.78), n=6, subsurf=0); assign(clock, mat('screen_text', 'emissive', color='#ffffff', emit='#ffffff', strength=1.0))
        for k in range(4):
            ic = core.soft_box('app_icon', (0.011, 0.0004, 0.011), at=(-0.024 + k * 0.016, -T / 2 - 0.0003, 0.014), n=5, subsurf=0); assign(ic, mat('screen_icon', 'emissive', color='#dfe8f5', emit='#dfe8f5', strength=0.8))
    cam = core.soft_box('camera_bump', (0.027, 0.0018, 0.027), at=(-W / 2 + 0.019, T / 2 + 0.0006, H - 0.019), n=6, subsurf=1); assign(cam, m)
    for dx, dz in ((-0.006, 0.006), (0.006, 0.006), (-0.006, -0.006)):
        lens = core.cylinder('lens', 0.0045, 0.0016, verts=24, rot=(math.radians(90), 0, 0)); lens.location = (-W / 2 + 0.019 + dx, T / 2 + 0.0024, H - 0.019 + dz)
        assign(lens, mat('lens_glass', 'glass', color='#0a0c10', alpha=1.0, rough=0.02))
    for z0, h in ((0.112, 0.012), (0.094, 0.012)):
        bt = core.soft_box('button', (0.0012, 0.0035, h), at=(W / 2 + 0.0002, 0, z0), n=6, subsurf=0); assign(bt, m)
    orbix('emblem', 0.008, (0, T / 2 + 0.0012, H * 0.62))  # studio emblem on the back
    # pure model: lies flat on its back, screen up (no desk stand)
    settle(before, rx=-math.pi / 2)
    void = (st_m, mathutils)

def build_camera(p):
    kind = p.get('kind', 'dslr')
    body_m = plastic('#1a1a1b', 'camera_body', 0.55)
    grip_m = mat('leatherette', 'leather', color='#151515', bump=0.5, grain=300)
    if kind == 'dslr':
        b = core.soft_box('body', (0.14, 0.075, 0.1), at=(0, 0, 0.05), n=6, subsurf=1); assign(b, grip_m)
        prism = core.soft_box('prism', (0.06, 0.06, 0.04), at=(0, 0.005, 0.11), n=5, subsurf=1, taper=0.3); assign(prism, body_m)
        grip = core.soft_box('grip', (0.035, 0.05, 0.09), at=(0.06, -0.03, 0.047), n=3.5, subsurf=1); assign(grip, grip_m)
        lens = core.lathe('lens', [(0, 0), (0.033, 0), (0.035, 0.01), (0.035, 0.05), (0.038, 0.052), (0.038, 0.09), (0.034, 0.095), (0, 0.095)], steps=48, rot=(math.radians(90), 0, 0))
        lens.location = (-0.005, -0.035, 0.05); assign(lens, body_m)
        glass = core.cylinder('lens_glass', 0.028, 0.002, verts=48, rot=(math.radians(90), 0, 0)); glass.location = (-0.005, -0.129, 0.05); assign(glass, mat('lens_coat', 'flat', color='#141c2a', rough=0.02, metal=0.6))
        ring = core.lathe('focus_ring', [(0.0385, 0.055), (0.0395, 0.055), (0.0395, 0.085), (0.0385, 0.085)], steps=64, rot=(math.radians(90), 0, 0)); ring.location = lens.location; assign(ring, rubber())
    else:  # vintage rangefinder
        b = core.soft_box('body', (0.13, 0.04, 0.075), at=(0, 0, 0.0375), n=8, subsurf=1); assign(b, grip_m)
        top = core.soft_box('top_plate', (0.13, 0.04, 0.02), at=(0, 0, 0.083), n=10, subsurf=1); assign(top, mat('chrome', 'chrome', rough=0.15))
        lens = core.lathe('lens', [(0, 0), (0.022, 0), (0.024, 0.006), (0.024, 0.035), (0, 0.035)], steps=48, rot=(math.radians(90), 0, 0)); lens.location = (-0.01, -0.019, 0.04); assign(lens, mat('chrome', 'chrome', rough=0.15))
        glass = core.cylinder('lens_glass', 0.017, 0.002, verts=48, rot=(math.radians(90), 0, 0)); glass.location = (-0.01, -0.0545, 0.04); assign(glass, mat('lens_coat', 'flat', color='#141c2a', rough=0.02, metal=0.6))
        for x in (0.035, 0.05):
            d = core.cylinder('dial', 0.008, 0.008, at=(x, 0, 0.093), verts=24, bevel=0.001); assign(d, mat('chrome', 'chrome', rough=0.15))
        vf = core.soft_box('viewfinder', (0.018, 0.002, 0.01), at=(0.04, -0.021, 0.083), n=6, subsurf=0); assign(vf, mat('lens_coat', 'flat', color='#141c2a', rough=0.02))

# ------------------------------------------------------------------ fashion
def build_sneaker(p):
    """Low-top sneaker pair: shaped upper with a padded collar opening, tongue, laces through eyelets on the
    instep, mudguard band, heel counter, rubber toe cap and a cupsole with toe spring."""
    import bpy, mathutils
    up = mat('fabric_primary_upper', p.get('upper', 'leather'), color=p.get('color', '#f2f2ef'), tint=True, bump=0.4, grain=260)
    sole = mat('sole_rubber', 'rubber', color=p.get('sole', '#f4f2ec'))
    accent = mat('accent', 'leather', color=p.get('accent', '#1f3a6b'), bump=0.3)
    lining = mat('lining_dark', 'fabric', color='#1e1f22', bump=0.3)
    lace_m = mat('laces', 'fabric', color=p.get('laces', '#f4f4f2'), bump=0.3)
    # heel -> toe: (x, half-width, top height)
    prof = [(-0.14, 0.03, 0.07), (-0.13, 0.036, 0.075), (-0.1, 0.04, 0.07), (-0.06, 0.042, 0.068), (-0.03, 0.045, 0.086), (0.0, 0.047, 0.083),
            (0.04, 0.048, 0.07), (0.08, 0.046, 0.057), (0.11, 0.04, 0.047), (0.13, 0.03, 0.04), (0.142, 0.015, 0.032)]
    B = 0.02  # upper sinks into the cupsole
    def top_at(x):
        for (x0, w0, t0), (x1, w1, t1) in zip(prof, prof[1:]):
            if x <= x1:
                u = (x - x0) / (x1 - x0); return t0 + (t1 - t0) * u, w0 + (w1 - w0) * u
        return prof[-1][2], prof[-1][1]
    spring = lambda x: 0.014 * max(0.0, (x - 0.06) / 0.085) ** 2
    def bend(o):  # toe spring on every part
        for v in o.data.vertices:
            v.co.z += spring(v.co.x + o.location.x)
    for side in (-1, 1):
        before = {o.name for o in bpy.context.scene.objects}
        upper = core.loft('upper', [(x, w, (t - B) / 2, (t + B) / 2) for x, w, t in prof], seg=32, power=2.4)
        core.add_subsurf(upper, 1); assign(upper, up)
        so = core.loft('sole', [(-0.147, 0.033, 0.014, 0.014), (-0.12, 0.044, 0.015, 0.015), (-0.03, 0.05, 0.014, 0.014), (0.06, 0.054, 0.013, 0.013), (0.12, 0.045, 0.013, 0.013), (0.148, 0.02, 0.012, 0.012)], seg=32, power=4)
        core.add_subsurf(so, 1); assign(so, sole)
        toe = core.loft('toe_cap', [(0.1, 0.044, 0.013, 0.03), (0.13, 0.034, 0.012, 0.03), (0.146, 0.017, 0.008, 0.029)], seg=24, power=2.2); assign(toe, sole)
        band = core.loft('mudguard', [(x, w + 0.0018, 0.008, 0.032) for x, w, t in prof if -0.14 <= x <= 0.1], seg=32, power=2.4); assign(band, accent)
        heel = core.loft('heel_counter', [(x, w + 0.0022, (min(t, 0.068) - B) / 2, (min(t, 0.068) + B) / 2) for x, w, t in prof[:3]], seg=32, power=2.4); assign(heel, accent)
        # collar opening: dark lining sunk into the top, ringed by a padded collar
        op = core.loft('collar_opening', [(-0.128, 0.012, 0.004, 0.068), (-0.11, 0.026, 0.005, 0.069), (-0.075, 0.03, 0.005, 0.068), (-0.045, 0.026, 0.005, 0.07), (-0.035, 0.012, 0.004, 0.072)], seg=24); assign(op, lining)
        ring = [(-0.082 + 0.05 * math.cos(a), 0.033 * math.sin(a), 0.071 + 0.004 * math.cos(a)) for a in [i / 24 * math.tau for i in range(24)]]
        collar = core.tube_path('collar', ring, 0.0065, seg=10, closed=True, res=3); assign(collar, up)
        tongue = core.soft_box('tongue', (0.05, 0.04, 0.008), at=(-0.03, 0, 0.087), n=4, subsurf=1, rot=(0, math.radians(26), 0)); assign(tongue, up)
        # eyelets + laces over the instep
        for k in range(5):
            x = -0.006 + k * 0.016
            t, w = top_at(x)
            for sy in (-1, 1):
                ey = core.soft_box('eyelet_stay', (0.012, 0.008, 0.004), at=(x, sy * 0.022, t + 0.0005), n=6, subsurf=0); assign(ey, accent)
            lace = core.post_between('lace', (x - 0.003, -0.022, t + 0.003), (x + 0.003, 0.022, t + 0.003), None, round_=True, r=0.0024, verts=8); assign(lace, lace_m)
        tab = core.soft_box('heel_tab', (0.008, 0.02, 0.022), at=(-0.142, 0, 0.066), n=4, subsurf=1); assign(tab, accent)
        new = [o for o in bpy.context.scene.objects if o.name not in before and o.type == 'MESH']
        bpy.context.view_layer.update()
        for o in new:
            # apply the object's own transform into the mesh, then toe spring, then place the shoe
            o.data.transform(o.matrix_world); o.matrix_world = mathutils.Matrix.Identity(4)
            for v in o.data.vertices: v.co.z += spring(v.co.x)
            o.matrix_world = mathutils.Matrix.Translation((side * 0.065, 0, 0)) @ mathutils.Matrix.Rotation(math.radians(90 + side * -6), 4, 'Z')

def build_handbag(p):
    kind = p.get('kind', 'tote')
    lm = mat('leather_primary', 'leather', color=p.get('color', '#7a4a2a'), tint=True, bump=0.5)
    hw = mat('gold_hw', 'metal', color='#c9a24a', metal=1, rough=0.25)
    if kind == 'tote':
        b = core.soft_box('bag', (0.38, 0.14, 0.3), at=(0, 0, 0.15), n=6, puff=0.01, puff_axis=1, taper=0.12); assign(b, lm)
        for s in (-1, 1):
            h = core.tube_path('handle', [(-0.09, s * 0.06, 0.29), (-0.07, s * 0.06, 0.42), (0.07, s * 0.06, 0.42), (0.09, s * 0.06, 0.29)], 0.008); assign(h, lm)
            for x in (-0.09, 0.09):
                r = core.lathe('ring', [(0.008, -0.003), (0.012, -0.003), (0.012, 0.003), (0.008, 0.003)], steps=20, rot=(math.radians(90), 0, 0)); r.location = (x, s * 0.068, 0.29); assign(r, hw)
    else:  # structured top-handle bag with flap and clasp
        b = core.soft_box('bag', (0.28, 0.12, 0.2), at=(0, 0, 0.1), n=8, puff=0.006, puff_axis=1, taper=0.06); assign(b, lm)
        flap = core.soft_box('flap', (0.27, 0.13, 0.11), at=(0, -0.003, 0.15), n=10, puff=0.0, subsurf=1); assign(flap, lm)
        clasp = core.soft_box('clasp', (0.04, 0.012, 0.025), at=(0, -0.068, 0.12), n=6, subsurf=1); assign(clasp, hw)
        h = core.tube_path('handle', [(-0.07, 0, 0.2), (-0.05, 0, 0.3), (0.05, 0, 0.3), (0.07, 0, 0.2)], 0.009); assign(h, lm)

def build_hat(p):
    kind = p.get('kind', 'fedora')
    if kind == 'fedora':
        m = mat('fabric_primary_felt', 'fabric', color=p.get('color', '#3b3029'), tint=True, bump=0.5)
        brim = core.lathe('brim', [(0.075, 0.012), (0.16, 0.018), (0.17, 0.028), (0.168, 0.032), (0.155, 0.024), (0.075, 0.02)], steps=72); assign(brim, m)
        crown = core.lathe('crown', [(0.0, 0.135), (0.04, 0.13), (0.075, 0.115), (0.085, 0.07), (0.088, 0.02), (0.075, 0.016)], steps=72)
        for v in crown.data.vertices:  # center pinch dent
            if v.co.z > 0.11:
                v.co.z -= 0.02 * max(0, 1 - abs(v.co.x) / 0.05)
        assign(crown, m)
        band = core.lathe('band', [(0.0882, 0.02), (0.0875, 0.045)], steps=72); assign(band, mat('hat_band', 'fabric', color=p.get('band', '#141414'), bump=0.3))
    else:  # knit beanie on a stand head form (to keep its shape)
        stand = core.lathe('stand', [(0, 0), (0.06, 0), (0.06, 0.01), (0.012, 0.015), (0.012, 0.12), (0.0, 0.12)], steps=48); assign(stand, mat('wood_v', 'wood', color='#c8a066', axis='Z'))
        head = core.sphere('head_form', 0.09, at=(0, 0, 0.2), seg=32, rings=16, scale=(0.85, 1, 1.05)); assign(head, mat('form_white', 'flat', color='#ece9e2', rough=0.6))
        cap = core.lathe('beanie', [(0.0, 0.31), (0.05, 0.3), (0.08, 0.26), (0.088, 0.2), (0.09, 0.17), (0.093, 0.17), (0.093, 0.135), (0.08, 0.135)], steps=64)
        assign(cap, mat('fabric_primary_knit', 'fabric', color=p.get('color', '#9a2f2a'), tint=True, bump=1.0, boucle=True))
        pom = core.sphere('pompom', 0.035, at=(0, 0, 0.335), seg=24, rings=12); assign(pom, mat('pompom', 'fabric', color=p.get('pom', '#efe9df'), bump=1.0, boucle=True))

def build_sunglasses(p):
    fm = plastic(p.get('color', '#141414'), 'frame_primary', 0.25) if p.get('frame') != 'metal' else mat('gold_frame', 'metal', color='#c9a24a', metal=1, rough=0.2)
    lens = mat('lens_tint', 'glass', color=p.get('lens', '#1f2a24'), alpha=0.82, rough=0.02)
    round_ = p.get('shape', 'wayfarer') == 'round'
    rr = 0.0018 if round_ else 0.0034  # rim tube radius (thin wire vs acetate)
    zc = 0.028
    for s in (-1, 1):
        cx = s * 0.034
        if round_:
            ring = [(cx + 0.025 * math.cos(a), 0, zc + 0.025 * math.sin(a)) for a in [i / 32 * math.tau for i in range(32)]]
            lpts = [(0.0245 * math.cos(a), 0.0245 * math.sin(a)) for a in [i / 40 * math.tau for i in range(40)]]
        else:
            # wayfarer: wider at the brow, tapering to the cheek
            base = core.rounded_rect(0.05, 0.038, 0.011, n=6)
            shp = [(x * (1 + 0.14 * (y / 0.038)) + (0.003 * s if y > 0 else 0), y) for x, y in base]
            ring = [(cx + x, 0, zc + y) for x, y in shp]
            lpts = [(x * 0.97, y * 0.96) for x, y in shp]
        rim = core.tube_path('rim', ring, rr, seg=8, closed=True, res=3); assign(rim, fm)
        l = core.extrude_outline('lens', lpts, 0.0016, rot=(math.radians(90), 0, 0)); l.location = (cx, 0.0008, zc); assign(l, lens)
        if not round_:  # heavy brow bar
            brow = core.tube_path('brow', [(cx - s * 0.026, 0, zc + 0.017), (cx, 0, zc + 0.021), (cx + s * 0.03, 0, zc + 0.019)], 0.0045, seg=8); assign(brow, fm)
        hx = s * (0.061 if not round_ else 0.06)
        hinge = core.soft_box('hinge', (0.008, 0.01, 0.01), at=(hx, 0.004, zc + 0.012), n=6, subsurf=0); assign(hinge, fm)
        # temple: straight back from the hinge, curving down at the ear tip to rest on the table
        tw = 0.0022 if round_ else 0.0035
        temple = core.tube_path('temple', [(hx, 0.006, zc + 0.012), (hx + s * 0.003, 0.06, zc + 0.008), (hx + s * 0.005, 0.115, zc), (hx + s * 0.005, 0.135, 0.004), (hx + s * 0.004, 0.14, 0.0025)], tw, seg=8, res=6)
        assign(temple, fm)
    bridge = core.tube_path('bridge', [(-0.009, 0.0, zc + 0.012), (0, 0.0, zc + 0.016), (0.009, 0.0, zc + 0.012)], rr * 1.1, seg=8); assign(bridge, fm)
    for s in (-1, 1):  # nose pads on arms reaching down to the table
        pad = core.post_between('nose_pad', (s * 0.008, 0.003, zc - 0.004), (s * 0.01, 0.006, 0.0025), None, round_=True, r=0.0025, verts=8); assign(pad, fm)

# ------------------------------------------------------------------ items
def build_backpack(p):
    m = mat('fabric_primary', 'fabric', color=p.get('color', '#2f4a3a'), tint=True, bump=0.8)
    acc = mat('webbing', 'fabric', color='#1a1a1a', bump=0.6)
    body = core.soft_box('body', (0.3, 0.17, 0.44), at=(0, 0, 0.22), n=4.2, puff=0.015, puff_axis=1, taper=0.08); assign(body, m)
    pocket = core.soft_box('front_pocket', (0.24, 0.06, 0.18), at=(0, -0.09, 0.13), n=4, puff=0.01, puff_axis=1); assign(pocket, m)
    lid = core.soft_box('lid', (0.28, 0.16, 0.06), at=(0, 0.0, 0.43), n=4, subsurf=1); assign(lid, m if p.get('lid', True) else acc)
    zp = core.tube_path('zip', [(-0.11, -0.12, 0.2), (0, -0.122, 0.21), (0.11, -0.12, 0.2)], 0.003); assign(zp, mat('zip_metal', 'metal', color='#9a9ea2', metal=1, rough=0.3))
    for s in (-1, 1):
        st = core.tube_path('strap', [(s * 0.08, 0.085, 0.4), (s * 0.1, 0.13, 0.3), (s * 0.11, 0.12, 0.1), (s * 0.1, 0.087, 0.03)], 0.012); assign(st, acc)
    handle = core.tube_path('handle', [(-0.04, 0.06, 0.455), (0, 0.06, 0.49), (0.04, 0.06, 0.455)], 0.007); assign(handle, acc)

def build_suitcase(p):
    W, D, H = p.get('w', 0.4), p.get('d', 0.24), p.get('h', 0.62)
    kind = p.get('kind', 'hard')
    shell = mat('paint_primary_shell', 'flat', color=p.get('color', '#2a3f5f'), rough=0.3) if kind == 'hard' else mat('fabric_primary', 'fabric', color=p.get('color', '#2a2c2f'), tint=True, bump=0.7)
    wh = 0.04
    b = core.soft_box('shell', (W, D, H), at=(0, 0, wh + H / 2), n=10 if kind == 'hard' else 6, subsurf=1); assign(b, shell)
    if kind == 'hard':
        for k in range(4):
            r = core.soft_box('rib', (0.03, 0.02, H - 0.08), at=(-W * 0.3 + k * W * 0.2, -D / 2 + 0.004, wh + H / 2), n=8, subsurf=1)
            assign(r, shell)
    seam = core.soft_box('zip_seam', (W + 0.014, 0.014, H + 0.014), at=(0, 0, wh + H / 2), n=10, subsurf=1); assign(seam, mat('zip_black', 'flat', color='#141414', rough=0.6))
    black = plastic('#151515', 'trim_black', 0.5)
    for s in (-1, 1):
        rail = core.post_between('handle_rail', (s * 0.08, D / 2 - 0.02, wh + H - 0.01), (s * 0.08, D / 2 - 0.02, wh + H + p.get('ext', 0.25)), (0.016, 0.01), bevel=0.003); assign(rail, alu('#9da1a5'))
    grip = core.soft_box('handle_grip', (0.2, 0.024, 0.03), at=(0, D / 2 - 0.02, wh + H + p.get('ext', 0.25)), n=6, subsurf=1); assign(grip, black)
    for sx in (-1, 1):
        for sy in (-1, 1):
            hs = core.soft_box('wheel_housing', (0.05, 0.05, 0.03), at=(sx * (W / 2 - 0.04), sy * (D / 2 - 0.04), wh + 0.005), n=6, subsurf=1); assign(hs, black)
            w = core.cylinder('wheel', 0.022, 0.018, verts=24, rot=(0, math.radians(90), 0)); w.location = (sx * (W / 2 - 0.04) - 0.009, sy * (D / 2 - 0.04), 0.022); assign(w, rubber())
    top = core.soft_box('top_handle', (0.14, 0.03, 0.025), at=(0, -0.02, wh + H + 0.01), n=6, subsurf=1); assign(top, black)

def build_umbrella(p):
    import bpy
    before = {o.name for o in bpy.context.scene.objects}
    canopy = mat('fabric_primary_canopy', 'fabric', color=p.get('color', '#1f2c4a'), tint=True, bump=0.4, sheen=0.3)
    shaft_m = mat('shaft', 'metal', color='#2a2a2a', metal=1, rough=0.3)
    handle_m = mat('wood_v', 'wood', color='#5e3b24', axis='Z') if p.get('handle', 'wood') == 'wood' else plastic('#141414', 'handle')
    if p.get('open', True):
        R, H = 0.5, 0.85
        ribs = 8
        verts, faces = [], []
        rings = 8
        for j in range(rings + 1):
            t = j / rings
            for i in range(ribs * 6):
                a = i / (ribs * 6) * math.tau
                scallop = 1 - 0.06 * t * (1 - abs(math.cos(a * ribs / 2)))
                r = R * math.sin(t * math.pi / 2 * 0.95) * scallop
                z = H + 0.18 * math.cos(t * math.pi / 2) - 0.02 * t * (1 - abs(math.cos(a * ribs / 2)))
                verts.append((r * math.cos(a), r * math.sin(a), z))
        n = ribs * 6
        for j in range(rings):
            for i in range(n):
                faces.append((j * n + i, j * n + (i + 1) % n, (j + 1) * n + (i + 1) % n, (j + 1) * n + i))
        c = core.from_pydata('canopy', verts, faces)
        sol = c.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.003
        core.add_subsurf(c, 1); assign(c, canopy)
        # pure model (no base stand): shaft runs down to a J-handle; the whole umbrella is laid tipped on its side
        shaft = core.cylinder('shaft', 0.008, H + 0.18 - 0.1, at=(0, 0, 0.1)); assign(shaft, shaft_m)
        hook = core.tube_path('handle', [(0, 0, 0.12), (0, 0.004, 0.05), (0, 0.035, 0.02), (0, 0.065, 0.05), (0, 0.065, 0.09)], 0.012); assign(hook, handle_m)
        tip = core.cylinder('tip', 0.006, 0.04, at=(0, 0, H + 0.175), r2=0.002); assign(tip, shaft_m)
        for i in range(ribs):
            a = (i + 0.5) / ribs * math.tau
            rb = core.post_between('stretcher', (0, 0, H - 0.1), (math.cos(a) * R * 0.45, math.sin(a) * R * 0.45, H + 0.13), None, round_=True, r=0.002, verts=6); assign(rb, shaft_m)
    else:  # closed and furled, lying on the floor (no umbrella-stand bucket)
        furl = core.lathe('furled', [(0.004, 0.006), (0.02, 0.15), (0.03, 0.55), (0.025, 0.7), (0.009, 0.74)], steps=24)
        for v in furl.data.vertices:
            a = math.atan2(v.co.y, v.co.x)
            k = 1 + 0.12 * math.cos(a * 8 + v.co.z * 20)
            v.co.x *= k; v.co.y *= k
        assign(furl, canopy)
        shaft = core.cylinder('shaft', 0.006, 0.12, at=(0, 0, 0.72)); assign(shaft, shaft_m)
        hook = core.tube_path('handle', [(0, 0, 0.83), (0, 0.005, 0.9), (0, 0.04, 0.93), (0, 0.07, 0.9), (0, 0.07, 0.86)], 0.012); assign(hook, handle_m)
    settle(before, ry=math.radians(62) if p.get('open', True) else math.pi / 2)

def build_boxes(p):
    card = mat('cardboard', 'fabric', color='#b48a5a', bump=0.25, rough=0.85)
    edge = mat('cardboard_dark', 'flat', color='#8e6a42', rough=0.9)
    tape = mat('tape', 'flat', color=p.get('tape', '#c9a86a'), rough=0.25)
    label = mat('label_white', 'flat', color='#f2f0ea', rough=0.6)
    rnd = random.Random(p.get('seed', 3))
    stack = p.get('stack', [(0.5, 0.4, 0.35), (0.4, 0.3, 0.3), (0.3, 0.25, 0.22)])
    z = 0
    for i, (w, d, h) in enumerate(stack):
        rot = rnd.uniform(-0.15, 0.15) if i else 0
        g = []
        b = core.box('box', (w, d, h), at=(0, 0, h / 2), bevel=0.004, seg=2); assign(b, card); g.append(b)
        seam = core.soft_box('flap_seam', (w + 0.001, 0.003, 0.0012), at=(0, 0, h + 0.0002), n=8, subsurf=0); assign(seam, edge); g.append(seam)
        tw = 0.048
        t = core.soft_box('tape', (tw, d + 0.003, 0.0012), at=(0, 0, h + 0.0008), n=8, subsurf=0); assign(t, tape); g.append(t)
        for s in (-1, 1):  # tape folds down the front and back
            t2 = core.soft_box('tape', (tw, 0.0012, 0.07), at=(0, s * (d / 2 + 0.0008), h - 0.035), n=8, subsurf=0); assign(t2, tape); g.append(t2)
        if w > 0.3 or i == 0:
            lb = core.soft_box('label', (0.1, 0.0012, 0.065), at=(w * 0.22, -(d / 2 + 0.0008), h * 0.45), n=8, subsurf=0); assign(lb, label); g.append(lb)
            for k in range(3):
                ln = core.soft_box('label_line', (0.07 - k * 0.012, 0.0014, 0.005), at=(w * 0.22 - k * 0.006, -(d / 2 + 0.0012), h * 0.45 + 0.018 - k * 0.014), n=6, subsurf=0); assign(ln, edge); g.append(ln)
        for o in g:
            o.location.z += z
            if rot:
                c, sn = math.cos(rot), math.sin(rot)
                x, y = o.location.x, o.location.y
                o.location.x, o.location.y = x * c - y * sn, x * sn + y * c
                o.rotation_euler.z += rot
        z += h

def build_bucket(p):
    kind = p.get('kind', 'metal')
    m = mat('galvanized', 'metal', color='#a9adb0', metal=1, rough=0.45) if kind == 'metal' else mat('plastic_primary', 'plastic', color=p.get('color', '#d94a2a'), tint=True, rough=0.4)
    R0, R1, H = 0.12, 0.15, 0.28
    def wall(name):
        return core.lathe(name, [(0, 0), (R0, 0), (R0 + 0.002, 0.006), (R1, H), (R1 + 0.006, H + 0.004), (R1 - 0.004, H + 0.006), (R0 - 0.004, 0.008), (0, 0.008)], steps=64)
    assign(wall('bucket'), m)
    for s in (-1, 1):
        lug = core.soft_box('lug', (0.02, 0.012, 0.03), at=(s * (R1 - 0.004), 0, H - 0.02), n=6, subsurf=1); assign(lug, m)
    hd = core.tube_path('bail', [(-R1 + 0.002, 0, H - 0.02), (-R1 * 0.9, 0, H + 0.12), (0, 0, H + 0.17), (R1 * 0.9, 0, H + 0.12), (R1 - 0.002, 0, H - 0.02)], 0.003); assign(hd, mat('steel_wire', 'metal', color='#7d8084', metal=1, rough=0.35))
    grip = core.cylinder('grip', 0.012, 0.09, verts=16, rot=(0, math.radians(90), 0)); grip.location = (-0.045, 0, H + 0.168); assign(grip, mat('wood_x', 'wood', color='#8a5a32', axis='X'))

def build_watering_can(p):
    m = mat('paint_primary', 'painted_metal', color=p.get('color', '#2f5a3a'), tint=True, metal=0.5, wear=0.2) if p.get('kind', 'metal') == 'metal' else mat('plastic_primary', 'plastic', color=p.get('color', '#2f7a5a'), tint=True)
    body = core.lathe('body', [(0, 0), (0.1, 0), (0.105, 0.01), (0.105, 0.2), (0.07, 0.24), (0.06, 0.25), (0, 0.25)], steps=64); assign(body, m)
    sp = core.post_between('spout', (0.08, 0, 0.05), (0.32, 0, 0.27), None, round_=True, r=0.012); assign(sp, m)
    rose = core.lathe('rose', [(0.012, 0), (0.035, 0.03), (0.035, 0.034), (0, 0.035)], steps=32, rot=(0, math.radians(42), 0)); rose.location = (0.315, 0, 0.265); assign(rose, m)
    hd = core.tube_path('handle', [(-0.095, 0, 0.2), (-0.12, 0, 0.3), (-0.02, 0, 0.36), (0.05, 0, 0.243)], 0.01); assign(hd, m)

# ------------------------------------------------------------------ tools
def _strip_outline(pts):
    """Centerline [(x, y, half_width)] -> closed 2D outline (offset both sides of the tangent)."""
    L, R = [], []
    for i, (x, y, w) in enumerate(pts):
        x0, y0 = pts[max(i - 1, 0)][:2]; x1, y1 = pts[min(i + 1, len(pts) - 1)][:2]
        tx, ty = x1 - x0, y1 - y0; n = math.hypot(tx, ty) or 1
        nx, ny = -ty / n, tx / n
        L.append((x + nx * w, y + ny * w)); R.append((x - nx * w, y - ny * w))
    return L + R[::-1]

def build_hammer(p):
    kind = p.get('kind', 'claw')
    steel = mat('steel_forged', 'metal', color='#6a6e73', metal=1, rough=0.32)
    polished = mat('steel_polished', 'chrome', rough=0.15)
    wood = mat('wood_x', 'wood', color='#c8a066', axis='X')
    L = 0.33
    if kind == 'mallet':
        h = core.loft('handle', [(0, 0.014, 0.011, 0.04), (0.05, 0.015, 0.012, 0.04), (0.2, 0.013, 0.01, 0.04), (L - 0.04, 0.012, 0.009, 0.04), (L, 0.011, 0.009, 0.04)], seg=20, power=2.4)
        core.add_subsurf(h, 1); assign(h, wood)
        head = core.cylinder('head', 0.04, 0.13, verts=32, rot=(math.radians(90), 0, 0), bevel=0.006); head.location = (L - 0.02, 0.065, 0.04)
        assign(head, mat('rubber_mallet', 'rubber', color='#1a1a1a'))
        return
    # claw hammer lying on its side: handle along X, head along Y, resting flat on the ground
    T = 0.026  # head thickness (z)
    zc = T / 2
    st = [(0.0, 0.0145, 0.011), (0.03, 0.0155, 0.0115), (0.12, 0.0135, 0.0105), (0.22, 0.011, 0.0092), (L - 0.035, 0.0098, 0.0088), (L + 0.004, 0.0105, 0.0092)]
    h = core.loft('handle', [(x, w, hh, zc) for x, w, hh in st], seg=24, power=2.6)
    core.add_subsurf(h, 1)
    if p.get('handle', 'wood') == 'wood':
        assign(h, wood)
    else:  # fibreglass shaft with a moulded rubber grip
        assign(h, mat('fibreglass_yellow', 'plastic', color='#e0b21c', rough=0.35))
        g = core.loft('grip', [(-0.003, 0.0152, 0.0122, zc), (0.005, 0.0165, 0.0128, zc), (0.06, 0.0168, 0.013, zc), (0.12, 0.0148, 0.0118, zc), (0.13, 0.0141, 0.0112, zc)], seg=24, power=2.6)
        core.add_subsurf(g, 1); assign(g, mat('rubber_grip', 'rubber', color=p.get('grip', '#c23a1a')))
    cx = L - 0.012
    neck = [(cx, -0.058, 0.0115), (cx, -0.04, 0.0098), (cx, -0.026, 0.0112), (cx, -0.019, 0.0172), (cx, 0.017, 0.0172), (cx, 0.026, 0.0125), (cx - 0.001, 0.036, 0.0118)]
    head = core.extrude_outline('head', _strip_outline(neck), T, at=(0, 0, 0), bevel=0.0025)
    assign(head, steel)
    face = core.cylinder('face', 0.0128, 0.02, verts=32, rot=(math.radians(90), 0, 0), bevel=0.002)
    face.location = (cx, -0.054, zc); assign(face, polished)
    # split claw: two curved prongs with a nail slot between them
    claw = [(cx - 0.001, 0.03, 0.0112), (cx - 0.004, 0.05, 0.0098), (cx - 0.011, 0.07, 0.0082), (cx - 0.022, 0.086, 0.0062), (cx - 0.036, 0.096, 0.0036)]
    for z0 in (0.0, T - 0.0105):
        c = core.extrude_outline('claw', _strip_outline(claw), 0.0105, at=(0, 0, z0), bevel=0.0018); assign(c, steel)
    wedge = core.soft_box('wedge', (0.006, 0.02, 0.003), at=(L + 0.0035, 0, zc), n=8, subsurf=0); assign(wedge, polished)

def build_wrench(p):
    steel = mat('steel_satin', 'metal', color='#8d9196', metal=1, rough=0.28, axis='X')
    L = p.get('l', 0.22); k = L / 0.22
    t = 0.0075 * k
    # I-beam style shaft that flares into each head
    x0, x1 = -L / 2 + 0.03 * k, L / 2 - 0.028 * k
    sh = core.loft('shaft', [(x0 - 0.004 * k, 0.0125 * k, 0.0034 * k, t / 2), (x0 + 0.02 * k, 0.0092 * k, 0.0034 * k, t / 2), (0, 0.0084 * k, 0.003 * k, t / 2),
                             (x1 - 0.02 * k, 0.009 * k, 0.0034 * k, t / 2), (x1 + 0.004 * k, 0.0115 * k, 0.0036 * k, t / 2)], seg=24, power=4)
    core.add_subsurf(sh, 1); assign(sh, steel)
    # ring end (+x): 12-point box ring
    R, r = 0.0172 * k, 0.0098 * k
    ring = core.lathe('ring_end', [(r, -t / 2), (R, -t / 2), (R, t / 2), (r, t / 2)], steps=48, close_top=False)
    for v in ring.data.vertices:
        rr = math.hypot(v.co.x, v.co.y)
        if rr < (R + r) / 2:
            a = math.atan2(v.co.y, v.co.x)
            f = 1 + 0.075 * (0.5 + 0.5 * math.cos(12 * a))
            v.co.x *= f; v.co.y *= f
    ring.location = (L / 2 - 0.0175 * k, 0, t / 2); assign(ring, steel)
    core.add_bevel(ring, 0.0012 * k, 2)
    # open end (-x): jaw rotated 15 degrees
    Ro, s = 0.0215 * k, 0.0086 * k
    a1 = math.pi - math.asin(s / Ro)
    pts = [(Ro * math.cos(a1 - (2 * a1) * i / 28), Ro * math.sin(a1 - (2 * a1) * i / 28)) for i in range(29)]
    pts += [(0.0, -s), (0.004 * k, -s * 0.55), (0.004 * k, s * 0.55), (0.0, s)]
    j = core.extrude_outline('open_end', pts, t, at=(-L / 2 + 0.022 * k, 0, 0), rot=(0, 0, math.radians(15)), bevel=0.0012 * k)
    assign(j, steel)

def build_screwdriver(p):
    hdl = mat('plastic_primary', 'plastic', color=p.get('color', '#d9b020'), tint=True, rough=0.3)
    grip = mat('rubber_grip_black', 'rubber', color='#1b1b1b')
    chrome = mat('chrome_tool', 'chrome', rough=0.18)
    R = 0.0152
    prof = [(0, 0), (0.0105, 0), (0.0138, 0.006), (R, 0.022), (R * 0.95, 0.055), (R, 0.08), (0.0125, 0.094), (0.0082, 0.101), (0.0068, 0.106), (0, 0.106)]
    def flute(o, depth=0.09):
        for v in o.data.vertices:
            a = math.atan2(v.co.y, v.co.x)
            f = 1 - depth * (abs(math.cos(a * 3)) ** 6)
            v.co.x *= f; v.co.y *= f
    h = core.lathe('handle', prof, steps=48); flute(h)
    h.rotation_euler = (0, math.radians(90), 0); h.location = (0, 0, R); assign(h, hdl)
    # soft black grip band in the middle; the coloured shell shows at the butt and the nose
    g = core.lathe('grip', [(R * 0.97 + 0.0008, 0.026), (R * 0.95 + 0.0009, 0.055), (R + 0.0008, 0.074)], steps=48, close_top=True, close_bottom=True); flute(g, 0.07)
    g.rotation_euler = (0, math.radians(90), 0); g.location = (0, 0, R); assign(g, grip)
    fer = core.cylinder('ferrule', 0.0058, 0.01, verts=24, rot=(0, math.radians(90), 0), bevel=0.001); fer.location = (0.101, 0, R); assign(fer, chrome)
    SL = 0.1
    sh = core.cylinder('shaft', 0.0034, SL, verts=20, rot=(0, math.radians(90), 0)); sh.location = (0.108, 0, R); assign(sh, chrome)
    x = 0.108 + SL
    if p.get('tip', 'flat') == 'flat':
        tip = core.loft('tip', [(x - 0.002, 0.0034, 0.0034, R), (x + 0.008, 0.0039, 0.0019, R), (x + 0.018, 0.0036, 0.0007, R), (x + 0.0185, 0.0034, 0.0005, R)], seg=20, power=3)
    else:
        tip = core.cylinder('tip', 0.0034, 0.013, verts=20, rot=(0, math.radians(90), 0), r2=0.0007); tip.location = (x - 0.001, 0, R)
        for ang in (0, 90):
            fin = core.soft_box('tip_fin', (0.011, 0.0058, 0.0011), at=(x + 0.004, 0, R), rot=(math.radians(ang), 0, 0), n=6, subsurf=0, taper=0.0); assign(fin, chrome)
    assign(tip, chrome)

def build_toolbox(p):
    W, D, H = p.get('w', 0.5), 0.24, 0.24
    m = mat('paint_primary', 'painted_metal', color=p.get('color', '#b3201b'), tint=True, metal=0.5, wear=p.get('wear', 0.15), rough=0.35)
    box = core.soft_box('box', (W, D, H), at=(0, 0, H / 2), n=16, subsurf=1); assign(box, m)
    lid = core.soft_box('lid', (W + 0.01, D + 0.01, 0.05), at=(0, 0, H + 0.02), n=10, subsurf=1, taper=0.06); assign(lid, m)
    steel = mat('chrome_tool', 'chrome', rough=0.2)
    for s in (-1, 1):
        latch = core.soft_box('latch', (0.04, 0.012, 0.05), at=(s * W * 0.33, -D / 2 - 0.004, H - 0.005), n=6, subsurf=1); assign(latch, steel)
        post = core.soft_box('handle_post', (0.02, 0.03, 0.04), at=(s * 0.12, 0, H + 0.06), n=6, subsurf=1); assign(post, steel)
    grip = core.cylinder('handle', 0.012, 0.26, verts=16, rot=(0, math.radians(90), 0)); grip.location = (-0.13, 0, H + 0.085); assign(grip, plastic('#141414', 'grip'))
    if p.get('tools_on_top'):
        build_wrench({'l': 0.22});
        for o in core.mesh_objects():
            if o.name.startswith(('shaft', 'ring_end', 'open_end')) and o.location.z < 0.02:
                o.location.z += H + 0.045

TYPES = {
    # electronics
    'hd-laptop': {'label': 'Laptop (HD)', 'category': 'electronics', 'options': {}, 'build': build_laptop, 'tags': ['laptop', 'notebook', 'computer', 'macbook'],
                  'variants': {'silver': dict(), 'space-grey-on': dict(color='#4a4d52', on=True), 'black-business': dict(finish='black', w=0.34, d=0.235)}},
    'hd-monitor': {'label': 'Monitor (HD)', 'category': 'electronics', 'options': {}, 'build': build_monitor, 'tags': ['monitor', 'screen', 'display', 'computer'],
                   'variants': {'27-inch-black': dict(), '24-inch-white-on': dict(w=0.54, color='#e8e8e6', on=True)}},
    'hd-tv': {'label': 'TV (HD)', 'category': 'electronics', 'options': {}, 'build': build_tv, 'tags': ['tv', 'television', 'flat screen'],
              'variants': {'55-inch-feet': dict(), '65-inch-pedestal': dict(w=1.45, feet=False)}},
    'hd-speaker': {'label': 'Speaker (HD)', 'category': 'electronics', 'options': {'color': 'fabric color'}, 'build': build_speaker, 'tags': ['speaker', 'hifi', 'smart speaker', 'audio'],
                   'variants': {'bookshelf-walnut': dict(), 'bookshelf-oak': dict(wood='#b48a5a'), 'smart-grey': dict(kind='smart'), 'portable-blue': dict(kind='portable', color='#2b4a7a')}},
    'hd-headphones': {'label': 'Headphones (HD)', 'category': 'electronics', 'options': {'color': 'body color'}, 'build': build_headphones, 'tags': ['headphones', 'headset', 'audio', 'over-ear'],
                      'variants': {'black': dict(), 'cream': dict(color='#e8e2d6')}},
    'hd-game-controller': {'label': 'Game controller (HD)', 'category': 'electronics', 'options': {'color': 'body color'}, 'build': build_controller, 'tags': ['game controller', 'gamepad', 'joypad', 'console'],
                           'variants': {'black': dict(), 'white': dict(color='#ecebe8')}},
    'hd-smartphone': {'label': 'Smartphone (HD)', 'category': 'electronics', 'options': {}, 'build': build_phone, 'tags': ['smartphone', 'phone', 'mobile', 'iphone'],
                      'variants': {'graphite': dict(on=True), 'silver': dict(color='#c9ccd0')}},
    'hd-camera': {'label': 'Camera (HD)', 'category': 'electronics', 'options': {}, 'build': build_camera, 'tags': ['camera', 'dslr', 'rangefinder', 'photography'],
                  'variants': {'dslr': dict(), 'vintage-rangefinder': dict(kind='rangefinder')}},
    # fashion
    'hd-sneakers': {'label': 'Sneakers (HD)', 'category': 'fashion', 'options': {'color': 'upper color'}, 'build': build_sneaker, 'tags': ['sneakers', 'trainers', 'shoes', 'kicks'],
                    'variants': {'white-navy': dict(), 'black-red': dict(color='#1d1d1f', accent='#b3201b', sole='#efede6'), 'canvas-green': dict(upper='fabric', color='#4f6a52', accent='#efe9df', laces='#efe9df'),
                                 'grey-orange': dict(color='#8c8f93', accent='#e06a20')}},
    'hd-handbag': {'label': 'Handbag (HD)', 'category': 'fashion', 'options': {'color': 'leather color'}, 'build': build_handbag, 'tags': ['handbag', 'bag', 'purse', 'tote'],
                   'variants': {'tote-cognac': dict(), 'flap-black': dict(kind='flap', color='#161616'), 'tote-cream': dict(color='#e3d6bd'), 'flap-burgundy': dict(kind='flap', color='#5e1a22')}},
    'hd-hat': {'label': 'Hat (HD)', 'category': 'fashion', 'options': {'color': 'hat color'}, 'build': build_hat, 'tags': ['hat', 'fedora', 'beanie', 'cap'],
               'variants': {'fedora-brown': dict(), 'fedora-grey': dict(color='#6e7175'), 'beanie-red': dict(kind='beanie'), 'beanie-navy': dict(kind='beanie', color='#1f2c4a', pom='#c9b79c')}},
    'hd-sunglasses': {'label': 'Sunglasses (HD)', 'category': 'fashion', 'options': {}, 'build': build_sunglasses, 'tags': ['sunglasses', 'glasses', 'shades', 'eyewear'],
                      'variants': {'wayfarer-black': dict(), 'round-gold': dict(shape='round', frame='metal', lens='#3a2a1a'), 'wayfarer-tortoise': dict(color='#5a3a22', lens='#2a2418')}},
    # items
    'hd-backpack': {'label': 'Backpack (HD)', 'category': 'items', 'options': {'color': 'fabric color'}, 'build': build_backpack, 'tags': ['backpack', 'rucksack', 'bag', 'school bag'],
                    'variants': {'forest-green': dict(), 'navy': dict(color='#1f2c4a'), 'mustard': dict(color='#c8962c', lid=False)}},
    'hd-suitcase': {'label': 'Suitcase (HD)', 'category': 'items', 'options': {'color': 'shell color'}, 'build': build_suitcase, 'tags': ['suitcase', 'luggage', 'trolley', 'travel case'],
                    'variants': {'hard-navy': dict(), 'hard-silver': dict(color='#c3c6ca'), 'hard-coral-cabin': dict(color='#e0705a', h=0.52, w=0.36, ext=0.2), 'soft-black': dict(kind='soft')}},
    'hd-umbrella': {'label': 'Umbrella (HD)', 'category': 'items', 'options': {'color': 'canopy color'}, 'build': build_umbrella, 'tags': ['umbrella', 'parasol', 'rain'],
                    'variants': {'open-navy': dict(), 'open-red': dict(color='#a01c1c', handle='black'), 'closed-black': dict(open=False, color='#1d1d1f')}},
    'hd-cardboard-boxes': {'label': 'Cardboard boxes (HD)', 'category': 'items', 'options': {}, 'build': build_boxes, 'tags': ['cardboard box', 'boxes', 'moving boxes', 'parcel', 'package'],
                           'variants': {'stack-of-three': dict(), 'single-large': dict(stack=[(0.6, 0.45, 0.45)]), 'parcels': dict(stack=[(0.35, 0.25, 0.15), (0.25, 0.2, 0.12)], tape='#3a3a3a', seed=5)}},
    'hd-bucket': {'label': 'Bucket (HD)', 'category': 'items', 'options': {'color': 'plastic color'}, 'build': build_bucket, 'tags': ['bucket', 'pail'],
                  'variants': {'galvanized': dict(), 'plastic-red': dict(kind='plastic'), 'plastic-blue': dict(kind='plastic', color='#2a5aa0')}},
    'hd-watering-can': {'label': 'Watering can (HD)', 'category': 'items', 'options': {'color': 'can color'}, 'build': build_watering_can, 'tags': ['watering can', 'garden', 'sprinkler can'],
                        'variants': {'green-metal': dict(), 'plastic-teal': dict(kind='plastic')}},
    # tools
    'hd-hammer': {'label': 'Hammer (HD)', 'category': 'tools', 'options': {}, 'build': build_hammer, 'tags': ['hammer', 'claw hammer', 'mallet', 'tool'],
                  'variants': {'claw-wood': dict(), 'claw-rubber-grip': dict(handle='rubber'), 'rubber-mallet': dict(kind='mallet')}},
    'hd-wrench': {'label': 'Wrench (HD)', 'category': 'tools', 'options': {}, 'build': build_wrench, 'tags': ['wrench', 'spanner', 'tool'],
                  'variants': {'combination': dict(), 'large-combination': dict(l=0.32)}},
    'hd-screwdriver': {'label': 'Screwdriver (HD)', 'category': 'tools', 'options': {'color': 'handle color'}, 'build': build_screwdriver, 'tags': ['screwdriver', 'tool'],
                       'variants': {'flat-yellow': dict(), 'phillips-red': dict(color='#b3201b', tip='phillips')}},
    'hd-toolbox': {'label': 'Toolbox (HD)', 'category': 'tools', 'options': {'color': 'paint color'}, 'build': build_toolbox, 'tags': ['toolbox', 'tool box', 'tool chest', 'tools'],
                   'variants': {'red': dict(), 'blue-worn': dict(color='#2a5aa0', wear=0.45), 'black': dict(color='#1d1e20')}},
}
