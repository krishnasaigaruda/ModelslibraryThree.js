"""HD hobbies: music instruments, sports gear, toys, science equipment, art objects."""
import math, random
from lib import core, cloth
from lib.mats import mat, assign

def wood(c='#b48a5a', axis='X', name=None): return mat(name or f'wood_{axis.lower()}_{c[1:]}', 'wood', color=c, axis=axis, ring=9, bump=0.25)
def flat(c, name=None, rough=0.4, metal=0.0): return mat(name or f'flat_{c[1:]}', 'flat', color=c, rough=rough, metal=metal)
def chrome(): return mat('chrome', 'chrome')
def brass(): return mat('brass', 'metal', color='#b8955a', metal=1, rough=0.25)

# ------------------------------------------------------------------ music
def guitar_outline(L=0.5, n=60):
    """Dreadnought body outline (x along length from the tail, y across): 39 cm lower bout, 27 cm waist, 29 cm upper bout."""
    ctrl = [(0, 0), (0.005, 0.05), (0.02, 0.1), (0.05, 0.14), (0.1, 0.172), (0.18, 0.192), (0.26, 0.195), (0.36, 0.182), (0.46, 0.152),
            (0.54, 0.136), (0.62, 0.14), (0.72, 0.147), (0.82, 0.14), (0.9, 0.116), (0.95, 0.086), (0.98, 0.056), (0.995, 0.028), (1, 0)]
    def width(t):
        for (t0, w0), (t1, w1) in zip(ctrl, ctrl[1:]):
            if t <= t1:
                u = (t - t0) / (t1 - t0)
                u = u * u * (3 - 2 * u)
                return w0 + (w1 - w0) * u
        return 0
    ts = [0.5 - 0.5 * math.cos(math.pi * i / n) for i in range(n + 1)]  # denser near the ends
    pts = [(-L / 2 + L * t, width(t) * L / 0.5) for t in ts]
    return pts + [(x, -w) for x, w in reversed(pts[1:-1])]

def build_guitar(p):
    import bpy, mathutils
    body_m = wood(p.get('top', '#d9b47a'), 'X', 'spruce_top') if p.get('finish') != 'sunburst' else mat('paint_primary_burst', 'wood', color='#8a4a1c', axis='X', ring=12)
    side_m = wood(p.get('wood', '#6a3a1e'), 'X', 'rosewood')
    ebony = flat('#1c1410', 'ebony_board', 0.45)
    bone = flat('#ece6d6', 'bone_nut', 0.35)
    steel = mat('string_steel', 'metal', color='#cfcfcf', metal=1, rough=0.25)
    nickel = mat('fret_nickel', 'metal', color='#d8d8d4', metal=1, rough=0.2)
    before = {o.name for o in bpy.context.scene.objects}
    # --- guitar built upright in its own frame: length +Z (bottom at z=0), across X, soundboard facing -Y
    L, D = 0.5, 0.1
    outline = [(w, x + L / 2) for x, w in guitar_outline(L)]
    body = core.extrude_outline('body', outline, D, rot=(math.radians(90), 0, 0), bevel=0.004); assign(body, side_m)
    top = core.extrude_outline('soundboard', [(x * 0.99, (y - L / 2) * 0.99 + L / 2) for x, y in outline], 0.003, rot=(math.radians(90), 0, 0))
    top.location = (0, -D + 0.001, 0); assign(top, body_m)
    zh = 0.355  # soundhole centre
    hole = core.cylinder('soundhole', 0.042, 0.004, verts=48, rot=(math.radians(90), 0, 0)); hole.location = (0, -D - 0.0005, zh); assign(hole, flat('#0b0806', 'hole_dark', 0.9))
    for rr, mm in ((0.05, ebony), (0.056, bone)):
        ring = core.lathe('rosette', [(rr - 0.003, -0.0008), (rr, -0.0008), (rr, 0.0008), (rr - 0.003, 0.0008)], steps=48, rot=(math.radians(90), 0, 0))
        ring.location = (0, -D - 0.0022, zh); assign(ring, mm)
    guard = core.extrude_outline('pickguard', [(0.03 + 0.045 * math.cos(a), 0.05 * math.sin(a)) for a in [i / 24 * math.pi * 1.6 - 1.2 for i in range(25)]] + [(0.03, -0.0)], 0.0012, rot=(math.radians(90), 0, 0))
    guard.location = (0.012, -D - 0.0018, zh - 0.03); assign(guard, flat('#2a1610', 'pickguard', 0.25))
    bridge = core.soft_box('bridge', (0.15, 0.01, 0.03), at=(0, -D - 0.006, 0.12), n=6, subsurf=1); assign(bridge, ebony)
    saddle = core.soft_box('saddle', (0.075, 0.006, 0.004), at=(0, -D - 0.012, 0.125), n=6, subsurf=0); assign(saddle, bone)
    # neck, fretboard, frets, nut, headstock + tuners
    NL = 0.37
    neck = core.loft('neck', [(L - 0.03, 0.013, 0.029, 0), (L + NL, 0.011, 0.023, 0)], seg=16, power=2.2)
    neck.rotation_euler = (0, math.radians(-90), 0); neck.location = (0, -D + 0.013, 0)
    assign(neck, side_m)
    fb = core.loft('fretboard', [(0.4, 0.0035, 0.029, 0), (L + NL, 0.0035, 0.0225, 0)], seg=8, power=8)
    fb.rotation_euler = (0, math.radians(-90), 0); fb.location = (0, -D - 0.0035, 0); assign(fb, ebony)
    scale = 0.645
    nut_z = L + NL
    for n in range(1, 20):
        z = nut_z - (scale - scale / 2 ** (n / 12))
        if z < 0.405: break
        w = 0.022 + (nut_z - z) / (nut_z - 0.4) * 0.006
        fr = core.soft_box('fret', (2 * w, 0.0025, 0.0015), at=(0, -D - 0.0075, z), n=6, subsurf=0); assign(fr, nickel)
    nut = core.soft_box('nut', (0.046, 0.009, 0.005), at=(0, -D - 0.005, nut_z + 0.002), n=6, subsurf=0); assign(nut, bone)
    head = core.soft_box('headstock', (0.078, 0.016, 0.19), at=(0, -D + 0.006, nut_z + 0.095), n=8, subsurf=1); assign(head, side_m)
    hv = core.soft_box('head_veneer', (0.074, 0.002, 0.18), at=(0, -D - 0.0025, nut_z + 0.1), n=8, subsurf=0); assign(hv, ebony)
    for s in (-1, 1):
        for k in range(3):
            z = nut_z + 0.05 + k * 0.05
            post = core.cylinder('tuner_post', 0.004, 0.022, verts=12, rot=(math.radians(90), 0, 0)); post.location = (s * 0.025, -D + 0.012, z); assign(post, nickel)
            gear = core.soft_box('tuner_gear', (0.016, 0.012, 0.018), at=(s * 0.042, -D + 0.016, z), n=6, subsurf=1); assign(gear, nickel)
            btn = core.soft_box('tuner_button', (0.022, 0.006, 0.016), at=(s * 0.06, -D + 0.016, z), n=5, subsurf=1); assign(btn, bone)
    # strings: bridge saddle → nut → tuner posts
    for k in range(6):
        xb = (k - 2.5) * 0.0105
        xn = (k - 2.5) * 0.0072
        r = 0.00045 + (5 - k) * 0.00013
        st = core.post_between('string', (xb, -D - 0.0145, 0.125), (xn, -D - 0.0105, nut_z + 0.002), None, round_=True, r=r, verts=6); assign(st, steel)
        side = -1 if k < 3 else 1
        zt = nut_z + 0.05 + (2 - k if k < 3 else k - 3) * 0.05
        st2 = core.post_between('string', (xn, -D - 0.0105, nut_z + 0.002), (side * 0.025, -D - 0.006, zt), None, round_=True, r=r, verts=6); assign(st2, steel)
    # pure model: lies on its back, strings up (no A-frame stand)
    core.settle(before, rx=-math.pi / 2)

def build_drum(p):
    kind = p.get('kind', 'snare')
    shell_m = mat('paint_primary_shell', 'paint', color=p.get('color', '#7a1218'), metal=0.6, rough=0.25)
    head_m = flat('#ece8de', 'drumhead', 0.6)
    R, H = (0.18, 0.14) if kind == 'snare' else (0.25, 0.42)
    z0 = 0.5 if kind == 'snare' else 0.0
    shell = core.lathe('shell', [(R, z0), (R, z0 + H)], steps=72); assign(shell, shell_m)
    for z in (z0, z0 + H):
        hd = core.cylinder('head', R + 0.004, 0.004, at=(0, 0, z - 0.002), verts=72); assign(hd, head_m)
        hoop = core.lathe('hoop', [(R + 0.004, z - 0.012), (R + 0.012, z - 0.012), (R + 0.012, z + 0.012), (R + 0.004, z + 0.012)], steps=72); assign(hoop, chrome())
    lugs = 8 if kind == 'snare' else 10
    for k in range(lugs):
        a = k * math.tau / lugs
        lug = core.soft_box('lug', (0.016, 0.022, H * 0.35), n=4, subsurf=1); lug.location = (math.cos(a) * (R + 0.01), math.sin(a) * (R + 0.01), z0 + H / 2); lug.rotation_euler = (0, 0, a); assign(lug, chrome())
        rod = core.post_between('tension_rod', (math.cos(a) * (R + 0.01), math.sin(a) * (R + 0.01), z0), (math.cos(a) * (R + 0.01), math.sin(a) * (R + 0.01), z0 + H), None, round_=True, r=0.003, verts=8); assign(rod, chrome())
    if kind == 'snare':  # tripod snare stand
        col = core.cylinder('stand_column', 0.012, z0 - 0.005, at=(0, 0, 0.005)); assign(col, chrome())
        for k in range(3):
            a = k * math.tau / 3
            lg = core.post_between('stand_leg', (0, 0, 0.25), (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.0), None, round_=True, r=0.009); assign(lg, chrome())
            arm = core.post_between('basket_arm', (0, 0, z0 - 0.04), (math.cos(a + 0.5) * R * 0.9, math.sin(a + 0.5) * R * 0.9, z0 - 0.004), None, round_=True, r=0.006); assign(arm, chrome())
    else:  # floor tom on legs / bass drum lying? → floor tom on three legs
        for k in range(3):
            a = k * math.tau / 3 + 0.3
            lg = core.post_between('leg', (math.cos(a) * (R + 0.03), math.sin(a) * (R + 0.03), 0.0), (math.cos(a) * (R + 0.02), math.sin(a) * (R + 0.02), H * 0.7), None, round_=True, r=0.008); assign(lg, chrome())
            br = core.soft_box('leg_bracket', (0.03, 0.03, 0.05), n=6, subsurf=1); br.location = (math.cos(a) * (R + 0.018), math.sin(a) * (R + 0.018), H * 0.7); assign(br, chrome())
        shell.location.z = 0.06
        for o in core.mesh_objects():
            if o.name.startswith(('head', 'hoop', 'lug', 'tension')):
                o.location.z += 0.06

def build_microphone(p):
    """Microphone on its own (no floor stand), lying on its side on the ground."""
    import bpy
    before = {o.name for o in bpy.context.scene.objects}
    kind = p.get('kind', 'vocal')
    blk = flat('#1a1a1b', 'mic_black', 0.4)
    if kind == 'vocal':  # handheld dynamic mic: tapered body + ball grille, built along +Z
        body = core.lathe('mic_body', [(0, 0), (0.012, 0), (0.016, 0.06), (0.022, 0.13), (0.024, 0.14), (0.0, 0.14)], steps=32); assign(body, blk)
        ring = core.lathe('grille_ring', [(0.024, 0.138), (0.0255, 0.138), (0.0255, 0.15), (0.024, 0.15)], steps=32); assign(ring, chrome())
        g = core.sphere('grille', 0.03, seg=32, rings=16); g.location = (0, 0, 0.165)
        assign(g, mat('mesh_grille', 'grille', color='#9a9ea2', cells=180))
        sw = core.soft_box('switch', (0.008, 0.004, 0.016), at=(0, -0.0165, 0.08), n=4, subsurf=1); assign(sw, chrome())
        core.settle(before, rx=math.pi / 2, rz=0.4)
    else:  # studio condenser: body + grille capsule, lying on its side
        body = core.lathe('mic_body', [(0, 0), (0.026, 0.01), (0.028, 0.17), (0, 0.17)], steps=48); assign(body, mat('gold_mic', 'metal', color='#c9a24a', metal=1, rough=0.25) if p.get('finish') == 'gold' else chrome())
        cap = core.sphere('grille', 0.03, at=(0, 0, 0.18), seg=32, rings=16, scale=(1, 1, 1.4)); assign(cap, mat('mesh_grille', 'grille', color='#c9ccd0', cells=180))
        xlr = core.cylinder('xlr', 0.012, 0.012, at=(0, 0, -0.011), verts=24); assign(xlr, blk)
        core.settle(before, rx=math.pi / 2, rz=-0.3)

# ------------------------------------------------------------------ sports
def ball(name, R, kind):
    b = core.sphere(name, R, at=(0, 0, R), seg=48, rings=24)
    m = {'basketball': mat('ball_basketball', 'leather', color='#c8561c', grain=400, bump=0.6),
         'soccer': mat('ball_soccer', 'leather', color='#f2f2ee', grain=500, bump=0.3),
         'tennis': mat('ball_tennis', 'fabric', color='#cfe03a', bump=1.0, boucle=True),
         'volleyball': mat('ball_volley', 'leather', color='#f2ecd8', grain=500, bump=0.3),
         'beach': mat('ball_beach', 'plastic', color='#f2f2ee', rough=0.25)}[kind]
    assign(b, m)
    lines = []
    lm = flat('#141414', 'ball_seam', 0.6)
    if kind == 'basketball':
        for rot in [(0, 0, 0), (math.pi / 2, 0, 0)]:
            r = core.lathe('seam', [(R * 1.002, -0.0025), (R * 1.006, -0.0025), (R * 1.006, 0.0025), (R * 1.002, 0.0025)], steps=72, rot=rot); r.location = (0, 0, R); lines.append(r)
        for s in (-1, 1):
            pts = [(s * R * 0.55 * math.cos(t) + 0 * s, R * math.sin(t) * 1.0, 0) for t in [i * math.pi / 24 - math.pi / 2 for i in range(25)]]
            pts = [(x, y, R + math.sqrt(max(0, R * R - x * x - y * y)) * 0) for x, y, _ in pts]
            curve = []
            for i in range(25):
                t = -math.pi / 2 + i * math.pi / 24
                y = R * 1.004 * math.sin(t)
                x = s * R * 0.6 * math.cos(t)
                zz = math.sqrt(max(1e-6, (R * 1.004) ** 2 - x * x - y * y))
                curve.append((x, y, R + zz))
            for i in range(25):
                t = -math.pi / 2 + i * math.pi / 24
                y = R * 1.004 * math.sin(t)
                x = s * R * 0.6 * math.cos(t)
            lines.append(core.tube_path('seam', curve, 0.0025))
            curve2 = [(x, y, 2 * R - z) for x, y, z in curve]
            lines.append(core.tube_path('seam', curve2, 0.0025))
    elif kind == 'tennis':
        curve = []
        for i in range(97):
            t = i / 96 * math.tau
            d = (math.cos(t) + 0.33 * math.cos(3 * t), math.sin(t) - 0.33 * math.sin(3 * t), 0.7 * math.sin(2 * t))
            l = math.sqrt(sum(c * c for c in d))
            curve.append((d[0] / l * R * 1.005, d[1] / l * R * 1.005, R + d[2] / l * R * 1.005))
        lines.append(core.tube_path('seam', curve, 0.0016, closed=True))
        lm = flat('#f4f4ee', 'ball_seam_white', 0.6)
    elif kind == 'beach':
        cols = ['#d93030', '#f2c200', '#2a6ad9', '#f2f2ee', '#3aa04a', '#f2f2ee']
        for k, c in enumerate(cols):
            a0 = k * math.tau / 6
            verts, faces = [], []
            for j in range(13):
                v = -math.pi / 2 + j * math.pi / 12
                for i in range(7):
                    u = a0 + i * (math.tau / 6) / 6
                    rr = R * 1.003
                    verts.append((rr * math.cos(v) * math.cos(u), rr * math.cos(v) * math.sin(u), R + rr * math.sin(v)))
            for j in range(12):
                for i in range(6):
                    a = j * 7 + i
                    faces.append((a, a + 1, a + 8, a + 7))
            pnl = core.from_pydata('panel', verts, faces); core.smooth(pnl)
            sol = pnl.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.001
            assign(pnl, flat(c, f'beach_{k}', 0.25))
        return b
    elif kind in ('soccer', 'volleyball'):
        # pentagon patches (soccer) / curved panel seams (volleyball) as raised seam rings
        import mathutils
        phi = (1 + 5 ** 0.5) / 2
        ico = [(0, 1, phi), (0, -1, phi), (0, 1, -phi), (0, -1, -phi), (1, phi, 0), (-1, phi, 0), (1, -phi, 0), (-1, -phi, 0), (phi, 0, 1), (-phi, 0, 1), (phi, 0, -1), (-phi, 0, -1)]
        if kind == 'soccer':
            for v in ico:
                d = mathutils.Vector(v).normalized()
                pent = core.cylinder('patch', R * 0.33, 0.002, verts=5)
                pent.rotation_mode = 'QUATERNION'; pent.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(d)
                pent.location = mathutils.Vector((0, 0, R)) + d * (R * 0.955)
                assign(pent, flat('#151515', 'soccer_black', 0.5))
                # bend the patch onto the sphere
                core.bpy.context.view_layer.update()
                for vv in pent.data.vertices:
                    w = pent.matrix_world @ vv.co
                    rel = w - mathutils.Vector((0, 0, R))
                    rel = rel.normalized() * (R * (1.004 if vv.co.z > 0 else 0.99))
                    vv.co = pent.matrix_world.inverted() @ (rel + mathutils.Vector((0, 0, R)))
        else:
            for rot in [(0, 0, 0), (math.pi / 2, 0, 0), (0, math.pi / 2, 0)]:
                for off in (-0.33, 0.33):
                    rr = R * math.sqrt(1 - off * off)
                    r = core.lathe('seam', [(rr * 1.003, off * R - 0.0015), (rr * 1.006, off * R - 0.0015), (rr * 1.006, off * R + 0.0015), (rr * 1.003, off * R + 0.0015)], steps=72, rot=rot)
                    r.location = (0, 0, R); lines.append(r)
            lm = flat('#2a4a8a', 'volley_seam', 0.5)
    for l in lines:
        assign(l, lm)
    return b

def build_ball(p):
    k = p.get('kind', 'basketball')
    R = {'basketball': 0.12, 'soccer': 0.11, 'tennis': 0.0335, 'volleyball': 0.105, 'beach': 0.2}[k]
    ball('ball', R, k)

def build_dumbbell(p):
    kind = p.get('kind', 'hex')
    m = mat('rubber_plate', 'rubber', color=p.get('color', '#1b1b1b')) if kind == 'hex' else chrome()
    grip = mat('knurled', 'metal', color='#9a9ea2', metal=1, rough=0.45, axis='Y')
    pairs = p.get('pair', True)
    for i in range(2 if pairs else 1):
        y = (i - 0.5) * 0.2 if pairs else 0
        R = 0.065 if kind == 'hex' else 0.055
        for s in (-1, 1):
            head = core.cylinder('head', R, 0.07, verts=6 if kind == 'hex' else 48, rot=(0, math.radians(90), 0), bevel=0.005)
            head.location = (s * 0.1 - (0.035 if s > 0 else -0.035) * 0 - 0.035 + (0.07 if s > 0 else 0) - (0 if s > 0 else 0), y, R * (0.866 if kind == 'hex' else 1))
            head.location = (s * 0.1 - 0.035, y, R * (0.866 if kind == 'hex' else 1))
            head.rotation_euler = (math.radians(30) if kind == 'hex' else 0, math.radians(90), 0)
            assign(head, m)
        bar = core.cylinder('handle', 0.016, 0.13, verts=24, rot=(0, math.radians(90), 0)); bar.location = (-0.065, y, R * (0.866 if kind == 'hex' else 1)); assign(bar, grip)

def build_skateboard(p):
    deck_m = mat('deck_maple', 'wood', color=p.get('wood', '#d9b47a'), axis='X', ring=10)
    grip_m = mat('griptape', 'concrete', color='#1a1a1a')
    L, W = 0.8, 0.205
    st = []
    for i in range(21):
        t = i / 20
        x = -L / 2 + L * t
        kick = 0.05 * max(0, (abs(t - 0.5) - 0.38) / 0.12) ** 1.6
        w = W / 2 * (1 - 0.35 * max(0, (abs(t - 0.5) - 0.38) / 0.12) ** 2)
        st.append((x, w, 0.006, 0.105 + kick))
    deck = core.loft('deck', st, seg=24, power=6); core.add_subsurf(deck, 1); assign(deck, deck_m)
    grip = core.loft('griptape', [(x, w * 0.97, 0.0015, z + 0.006) for x, w, _, z in st[2:-2]], seg=24, power=6); assign(grip, grip_m)
    truck_m = mat('truck_alu', 'metal', color='#b9bcc0', metal=1, rough=0.3)
    wheel_m = mat('urethane', 'plastic', color=p.get('wheels', '#f0e8d0'), rough=0.5)
    for s in (-1, 1):
        x = s * 0.22
        base = core.soft_box('baseplate', (0.06, 0.05, 0.012), at=(x, 0, 0.093), n=6, subsurf=1); assign(base, truck_m)
        hanger = core.soft_box('hanger', (0.04, 0.17, 0.03), at=(x, 0, 0.065), n=4, subsurf=1, taper=0.0); assign(hanger, truck_m)
        kp = core.post_between('kingpin', (x, 0, 0.065), (x, 0, 0.095), None, round_=True, r=0.008); assign(kp, truck_m)
        axle = core.cylinder('axle', 0.004, 0.22, verts=12, rot=(math.radians(90), 0, 0)); axle.location = (x, 0.11, 0.027); assign(axle, truck_m)
        for sy in (-1, 1):
            w = core.lathe('wheel', [(0.004, -0.016), (0.022, -0.016), (0.027, -0.01), (0.027, 0.01), (0.022, 0.016), (0.004, 0.016)], steps=32, rot=(math.radians(90), 0, 0))
            w.location = (x, sy * 0.09, 0.027); assign(w, wheel_m)
        post = core.post_between('hanger_link', (x, 0, 0.05), (x, 0, 0.027), None, round_=True, r=0.012); assign(post, truck_m)

# ------------------------------------------------------------------ toys
def build_teddy(p):
    fur = mat('fur_primary', 'fabric', color=p.get('color', '#9a6a3c'), tint=True, bump=1.0, boucle=True, sheen=0.4)
    pad = mat('fur_pad', 'fabric', color=p.get('pad', '#d8b88a'), bump=0.6)
    eye = flat('#0d0b0a', 'eye_black', 0.1)
    S = p.get('size', 1.0)
    def sp(name, r, at, sc=(1, 1, 1), m=fur):
        o = core.sphere(name, r * S, at=tuple(a * S for a in at), seg=32, rings=16, scale=sc); core.add_subsurf(o, 1); assign(o, m); return o
    sp('body', 0.1, (0, 0, 0.13), (1, 0.85, 1.15))
    sp('head', 0.085, (0, -0.01, 0.3))
    sp('muzzle', 0.04, (0, -0.075, 0.285), (1.1, 0.9, 0.8), pad)
    nose = sp('nose', 0.014, (0, -0.11, 0.3), (1.3, 0.8, 0.9), eye)
    for s in (-1, 1):
        sp('ear', 0.035, (s * 0.065, 0.0, 0.375), (1, 0.55, 1))
        sp('ear_inner', 0.022, (s * 0.065, -0.012, 0.372), (1, 0.4, 1), pad)
        sp('eye', 0.011, (s * 0.032, -0.072, 0.325), m=eye)
        sp('arm', 0.04, (s * 0.1, -0.03, 0.17), (0.85, 0.85, 1.5)).rotation_euler = (0.5, s * 0.5, 0)
        leg = sp('leg', 0.05, (s * 0.06, -0.06, 0.045), (0.9, 1.5, 0.85))
        sp('foot_pad', 0.035, (s * 0.06, -0.128, 0.05), (0.9, 0.35, 0.9), pad)
    if p.get('bow'):
        bow = core.lathe('ribbon', [(0.045 * S, 0.215 * S), (0.06 * S, 0.215 * S), (0.06 * S, 0.235 * S), (0.045 * S, 0.235 * S)], steps=48); assign(bow, mat('ribbon', 'fabric', color=p['bow'], sheen=0.6))

def build_blocks(p):
    rnd = random.Random(p.get('seed', 2))
    cols = ['#d93030', '#f2c200', '#2a6ad9', '#3aa04a', '#e07a20', '#8a4ac8']
    S = 0.05
    layout = p.get('layout', [(0, 0, 0), (1, 0, 0), (2, 0, 0), (0.5, 0, 1), (1.5, 0, 1), (1, 0, 2), (3.2, 0.3, 0), (-1.3, 0.5, 0)])
    letters = 'ABCDEFGH'
    for i, (x, y, z) in enumerate(layout):
        c = cols[i % len(cols)]
        b = core.soft_box('block', (S, S, S), at=(x * S * 1.02, y * S, z * S + S / 2), n=10, subsurf=1, rot=(0, 0, rnd.uniform(-0.1, 0.1) if z == 0 else 0))
        assign(b, mat(f'block_wood_{c[1:]}', 'wood', color=c, axis='Z', ring=12, bump=0.15) if p.get('painted', True) else mat('block_wood', 'wood', color='#d9b47a', axis='Z'))
        if p.get('letters', True):
            t = core.text_mesh('letter', letters[i % 8], S * 0.6, depth=0.001, at=(x * S * 1.02, y * S - S / 2 - 0.0002, z * S + S / 2), rot=(math.radians(90), 0, 0))
            assign(t, flat('#f4f1ea', 'letter_white', 0.5))

def build_rocking_horse(p):
    wm = mat('wood_x', 'wood', color=p.get('wood', '#b48a5a'), axis='X', ring=9) if not p.get('painted') else mat('paint_primary_horse', 'painted_metal', color=p.get('color', '#efe9df'), tint=True, metal=0, wear=0.15, rough=0.45)
    # rockers: two curved runners touching the floor at their lowest point
    for s in (-1, 1):
        pts = [(math.sin(t) * 0.6, s * 0.15, 0.02 + 0.45 * (1 - math.cos(t)) * 0.6) for t in [i * 0.08 - 0.72 for i in range(19)]]
        r = core.tube_path('rocker', pts, 0.02); assign(r, mat('wood_rocker', 'wood', color='#8a5a32', axis='X'))
        for x in (-0.25, 0.25):
            zl = 0.02 + 0.45 * (1 - math.cos(math.asin(x / 0.6))) * 0.6
            lg = core.post_between('leg', (x * 1.0, s * 0.15, zl), (x * 0.6, s * 0.06, 0.42), None, round_=True, r=0.022); assign(lg, wm)
    body = core.loft('body', [(-0.28, 0.05, 0.05, 0.47), (-0.2, 0.09, 0.09, 0.47), (0.1, 0.1, 0.1, 0.48), (0.24, 0.07, 0.08, 0.5), (0.28, 0.04, 0.05, 0.52)], seg=24); core.add_subsurf(body, 1); assign(body, wm)
    neck = core.post_between('neck', (0.2, 0, 0.5), (0.32, 0, 0.72), (0.08, 0.1), bevel=0.03); core.add_subsurf(neck, 1); assign(neck, wm)
    head = core.loft('head', [(0.28, 0.045, 0.06, 0.74), (0.36, 0.05, 0.055, 0.73), (0.46, 0.035, 0.04, 0.7), (0.48, 0.02, 0.03, 0.69)], seg=20); core.add_subsurf(head, 1); assign(head, wm)
    for s in (-1, 1):
        ear = core.cylinder('ear', 0.018, 0.06, at=(0.3, s * 0.03, 0.78), r2=0.003, rot=(s * 0.2, -0.2, 0)); assign(ear, wm)
        eye = core.sphere('eye', 0.01, at=(0.4, s * 0.042, 0.745), seg=12, rings=8); assign(eye, flat('#141414', 'eye_black', 0.1))
        hd = core.post_between('handle', (0.32, s * 0.09, 0.7), (0.32, 0, 0.7), None, round_=True, r=0.01); assign(hd, wm)
    mane = core.tube_path('mane', [(0.18, 0, 0.56), (0.25, 0, 0.7), (0.3, 0, 0.8)], 0.025); assign(mane, mat('mane_yarn', 'fabric', color=p.get('mane', '#3b2a1e'), bump=1.0, boucle=True))
    tail = core.tube_path('tail', [(-0.27, 0, 0.5), (-0.36, 0, 0.45), (-0.4, 0, 0.32)], 0.02); assign(tail, mat('mane_yarn', 'fabric'))
    seat = core.soft_box('saddle', (0.18, 0.2, 0.03), at=(0, 0, 0.565), n=4, subsurf=1); assign(seat, mat('saddle_leather', 'leather', color=p.get('saddle', '#7a1f24')))

def build_top(p):
    m = mat('paint_primary_top', 'painted_metal', color=p.get('color', '#d93030'), tint=True, metal=0.2, wear=0.05)
    o = core.lathe('top', [(0, 0), (0.004, 0.003), (0.05, 0.04), (0.055, 0.05), (0.03, 0.06), (0.008, 0.065), (0.008, 0.1), (0, 0.1)], steps=64); assign(o, m)
    band = core.lathe('stripe', [(0.0505, 0.041), (0.0555, 0.048)], steps=64); assign(band, flat(p.get('stripe', '#f2c200'), 'stripe', 0.3))

# ------------------------------------------------------------------ science
def build_microscope(p):
    body = mat('paint_primary_scope', 'painted_metal', color=p.get('color', '#ecebe6'), tint=True, metal=0.2, wear=0.0, rough=0.35)
    blk = flat('#1a1a1b', 'scope_black', 0.4)
    base = core.soft_box('base', (0.16, 0.22, 0.04), at=(0, 0.02, 0.02), n=8, subsurf=1); assign(base, body)
    arm = core.tube_path('arm', [(0, 0.09, 0.04), (0, 0.1, 0.18), (0, 0.06, 0.3)], 0.025); assign(arm, body)
    stage = core.soft_box('stage', (0.12, 0.12, 0.012), at=(0, 0.0, 0.14), n=8, subsurf=1); assign(stage, blk)
    sp = core.post_between('stage_mount', (0, 0.06, 0.14), (0, 0.095, 0.14), (0.04, 0.03), bevel=0.004); assign(sp, body)
    tube = core.post_between('tube', (0, 0.0, 0.2), (0, 0.06, 0.34), None, round_=True, r=0.018); assign(tube, body)
    head = core.soft_box('head', (0.05, 0.07, 0.05), at=(0, 0.04, 0.31), n=5, subsurf=1); assign(head, body)
    head2 = core.post_between('head_link', (0, 0.06, 0.3), (0, 0.04, 0.31), None, round_=True, r=0.02); assign(head2, body)
    ep = core.post_between('eyepiece', (0, 0.06, 0.33), (0, 0.1, 0.4), None, round_=True, r=0.012); assign(ep, blk)
    turret = core.cylinder('nosepiece', 0.03, 0.02, at=(0, 0.0, 0.19), verts=32); assign(turret, chrome())
    for k in range(3):
        a = k * math.tau / 3
        obj = core.cylinder('objective', 0.007, 0.03, at=(math.cos(a) * 0.016, math.sin(a) * 0.016, 0.162), verts=16); assign(obj, chrome())
    for s in (-1, 1):
        kn = core.cylinder('focus_knob', 0.022, 0.012, verts=32, rot=(0, math.radians(90), 0)); kn.location = (s * 0.031 - (0.012 if s > 0 else 0) + (0.012 if s > 0 else 0), 0.1, 0.12); assign(kn, blk)
    lamp = core.cylinder('illuminator', 0.02, 0.012, at=(0, 0.0, 0.04), verts=24); assign(lamp, mat('led_white', 'emissive', color='#f4f4f0', emit='#ffffff', strength=0.6))
    slide = core.soft_box('slide', (0.075, 0.025, 0.002), at=(0, 0, 0.147), n=6, subsurf=0); assign(slide, mat('slide_glass', 'glass', color='#e8f2ee', alpha=0.4))

def build_flasks(p):
    glass = mat('lab_glass', 'glass', color='#eef6f4', alpha=0.3, rough=0.02)
    rnd = random.Random(p.get('seed', 3))
    liquids = p.get('liquids', ['#3a8ad9', '#d94a3a', '#3ab06a', '#e0c030'])
    tray = core.soft_box('tray', (0.5, 0.2, 0.012), at=(0, 0, 0.006), n=10, subsurf=1); assign(tray, flat('#ecebe6', 'tray_white', 0.5))
    x = -0.18
    for i, c in enumerate(liquids):
        kind = ['erlenmeyer', 'round', 'beaker', 'tube'][i % 4] if p.get('mix', True) else 'erlenmeyer'
        lq = mat(f'liquid_{c[1:]}', 'glass', color=c, alpha=0.75, rough=0.02)
        if kind == 'erlenmeyer':
            prof = [(0, 0.012), (0.045, 0.012), (0.048, 0.02), (0.015, 0.11), (0.015, 0.15), (0.018, 0.152)]
            fill = [(0, 0.014), (0.044, 0.014), (0.03, 0.06), (0, 0.06)]
        elif kind == 'round':
            prof = [(0, 0.012)] + [(0.05 * math.sin(math.pi * t / 10), 0.012 + 0.05 * (1 - math.cos(math.pi * t / 10))) for t in range(1, 9)] + [(0.012, 0.12), (0.012, 0.17), (0.015, 0.172)]
            fill = [(0, 0.014), (0.045, 0.04), (0.04, 0.055), (0, 0.055)]
            ring = core.lathe('ring_stand', [(0.03, 0.012), (0.036, 0.012), (0.036, 0.02), (0.03, 0.02)], steps=32); ring.location = (x, 0, 0); assign(ring, flat('#2a2a2a', 'cork', 0.8))
        elif kind == 'beaker':
            prof = [(0, 0.012), (0.035, 0.012), (0.035, 0.1), (0.038, 0.104)]
            fill = [(0, 0.014), (0.033, 0.014), (0.033, 0.06), (0, 0.06)]
        else:
            prof = [(0, 0.012), (0.009, 0.016), (0.01, 0.14), (0.012, 0.142)]
            fill = [(0, 0.016), (0.009, 0.016), (0.009, 0.09), (0, 0.09)]
            rack = core.soft_box('tube_rack', (0.05, 0.05, 0.05), at=(x, 0, 0.037), n=10, subsurf=0); assign(rack, mat('wood_z', 'wood', color='#c8a066', axis='Z'))
        g = core.lathe('vessel', prof + [(r - 0.0015, z) for r, z in reversed(prof[1:])], steps=48); g.location = (x, 0, 0); assign(g, glass)
        f = core.lathe('liquid', fill, steps=48); f.location = (x, 0, 0); assign(f, lq)
        x += 0.12

def build_globe(p):
    R = 0.15
    stand_m = mat('wood_z', 'wood', color=p.get('wood', '#5e3b24'), axis='Z') if p.get('stand', 'wood') == 'wood' else brass()
    base = core.lathe('base', [(0, 0), (0.1, 0), (0.1, 0.02), (0.06, 0.035), (0.02, 0.05), (0.015, 0.12), (0, 0.12)], steps=64); assign(base, stand_m)
    tilt = math.radians(23.5)
    cz = 0.12 + 0.03 + R
    meridian = core.lathe('meridian', [(R + 0.008, -0.004), (R + 0.016, -0.004), (R + 0.016, 0.004), (R + 0.008, 0.004)], steps=72, rot=(math.radians(90), tilt, 0)); meridian.location = (0, 0, cz); assign(meridian, brass())
    post = core.post_between('meridian_post', (0, 0, 0.115), (0, 0, cz - R - 0.012), None, round_=True, r=0.008); assign(post, brass())
    g = core.sphere('globe', R, at=(0, 0, cz), seg=64, rings=32); g.rotation_euler = (0, tilt, 0)
    assign(g, mat('globe_map', 'stone', color=p.get('sea', '#5f86a8'), scale=1.6, cracks=0.1, lichen=0.9 if p.get('land', True) else 0, bump=0.1))
    axle = core.post_between('axle', (-math.sin(tilt) * (R + 0.012), 0, cz - math.cos(tilt) * (R + 0.012)), (math.sin(tilt) * (R + 0.012), 0, cz + math.cos(tilt) * (R + 0.012)), None, round_=True, r=0.004); assign(axle, brass())

# ------------------------------------------------------------------ art
def build_sculpture(p):
    kind = p.get('kind', 'twist')
    m = {'marble': mat('marble_sculpt', 'marble'), 'bronze': mat('bronze', 'painted_metal', color='#6a4a2a', metal=1, wear=0.3, rough=0.35),
         'stone': mat('stone_sculpt', 'stone', color='#a8a296', lichen=0.0, cracks=0.5), 'black': flat('#141414', 'basalt_polish', 0.2)}[p.get('mat', 'marble')]
    plinth = core.soft_box('plinth', (0.32, 0.32, 0.9), at=(0, 0, 0.45), n=20, subsurf=0); assign(plinth, flat('#ecebe6', 'plinth_white', 0.6))
    z0 = 0.9
    if kind == 'twist':
        st = []
        for i in range(25):
            t = i / 24
            st.append((t * 0.6, 0.06 + 0.04 * math.sin(t * math.pi), 0.025 + 0.02 * math.sin(t * math.pi), 0))
        o = core.loft('twist', st, seg=24, power=2.2)
        o.rotation_euler = (0, math.radians(-90), 0); o.location = (0, 0, z0)
        tw = o.modifiers.new('twist', 'SIMPLE_DEFORM'); tw.deform_method = 'TWIST'; tw.angle = math.radians(220); tw.deform_axis = 'X'
        core.add_subsurf(o, 1); assign(o, m)
    elif kind == 'ring':
        o = core.lathe('ring', [(0.13 + 0.035 * math.cos(a), 0.035 * math.sin(a)) for a in [i * math.tau / 24 for i in range(25)]], steps=64, rot=(math.radians(90), 0, 0))
        o.location = (0, 0, z0 + 0.168); assign(o, m)
        foot = core.soft_box('foot', (0.12, 0.08, 0.02), at=(0, 0, z0 + 0.01), n=10, subsurf=1); assign(foot, m)
    elif kind == 'stack':
        z = z0
        rnd = random.Random(3)
        for k in range(5):
            r = 0.1 - k * 0.012
            s = core.sphere('pebble', r, seg=32, rings=16, scale=(1, 0.8, 0.45)); s.location = (rnd.uniform(-0.01, 0.01), rnd.uniform(-0.01, 0.01), z + r * 0.42); assign(s, m)
            z += r * 0.8
    else:  # abstract figure: arching form
        pts = [(-0.12, 0, z0), (-0.1, 0, z0 + 0.3), (0, 0, z0 + 0.45), (0.1, 0, z0 + 0.3), (0.12, 0, z0)]
        o = core.tube_path('arch', pts, 0.04); assign(o, m)

def build_easel(p):
    w = mat('wood_z', 'wood', color=p.get('wood', '#c8a066'), axis='Z')
    H = 1.6
    import mathutils
    for s in (-1, 1):
        lg = core.post_between('leg', (s * 0.3, -0.15, 0), (s * 0.05, 0.0, H), (0.035, 0.022), bevel=0.004); assign(lg, w)
    back = core.post_between('back_leg', (0, 0.55, 0), (0, 0.02, H - 0.05), (0.035, 0.022), bevel=0.004); assign(back, w)
    ledge_z = 0.75
    t = (ledge_z) / H
    xw = 0.3 - 0.25 * t
    ledge = core.soft_box('ledge', (0.62, 0.07, 0.025), at=(0, -0.15 + 0.15 * t - 0.03, ledge_z), n=10, subsurf=0); assign(ledge, w)
    lean = math.atan2(0.15, H)
    can_h = p.get('canvas_h', 0.6)
    can = core.soft_box('canvas', (p.get('canvas_w', 0.5), 0.025, can_h), n=16, subsurf=0)
    can.rotation_euler = (-lean, 0, 0); can.location = (0, -0.15 + 0.15 * t - 0.03 + (can_h / 2) * math.sin(lean) - 0.0, ledge_z + 0.012 + can_h / 2)
    assign(can, mat(f'painting_{p.get("art", 0)}', 'rug', colors=p.get('colors', ['#5a7d9a', '#f0e6d2', '#c8962c']), pattern=p.get('pattern', 'modern'), aspect=0.8, bump=0.3))
    clamp = core.soft_box('top_clamp', (0.08, 0.06, 0.03), at=(0, can.location[1] + (can_h / 2) * math.sin(lean) + 0.01, ledge_z + can_h + 0.02), n=6, subsurf=0); assign(clamp, w)
    mast = core.post_between('mast', (0, can.location[1] + can_h * math.sin(lean) / 2 + 0.03, ledge_z + 0.01), (0, 0.0, H - 0.02), (0.03, 0.02), bevel=0.004); assign(mast, w)

def build_paint_set(p):
    rnd = random.Random(p.get('seed', 1))
    tray = core.soft_box('palette', (0.36, 0.26, 0.008), at=(0, 0, 0.004), n=3.5, subsurf=1); assign(tray, mat('wood_x', 'wood', color='#c8a066', axis='X'))
    cols = ['#d93030', '#f2c200', '#2a6ad9', '#f4f4f0', '#141414', '#3aa04a', '#e07a20']
    for i, c in enumerate(cols):
        a = i / len(cols) * math.pi * 1.4 - 0.2
        blob = core.sphere('paint', 0.018, seg=16, rings=8, scale=(1.2, 1, 0.45)); blob.location = (math.cos(a) * 0.12, math.sin(a) * 0.08, 0.009); assign(blob, flat(c, f'paint_{c[1:]}', 0.15))
    for k in range(3):
        b = core.post_between('brush', (-0.15 + k * 0.03, -0.16 - k * 0.01, 0.011), (0.12 + k * 0.03, -0.1 - k * 0.01, 0.011), None, round_=True, r=0.004, verts=10)
        assign(b, flat(['#b3201b', '#1f3550', '#141414'][k], f'brush_{k}', 0.3))
        tip = core.cylinder('bristles', 0.006, 0.025, verts=12, r2=0.002, rot=(0, math.radians(90), 0)); tip.location = (0.12 + k * 0.03, -0.1 - k * 0.01, 0.011); assign(tip, flat('#3a2a1a', 'bristle', 0.8))
        fer = core.cylinder('ferrule', 0.0045, 0.02, verts=12, rot=(0, math.radians(90), 0)); fer.location = (0.1 + k * 0.03, -0.1 - k * 0.01, 0.011); assign(fer, chrome())

TYPES = {
    'hd-acoustic-guitar': {'label': 'Acoustic guitar (HD)', 'category': 'music', 'options': {}, 'build': build_guitar, 'tags': ['guitar', 'acoustic guitar', 'instrument', 'music'],
                           'variants': {'natural': dict(), 'sunburst': dict(finish='sunburst'), 'dark-mahogany': dict(top='#8a5a32', wood='#4a2a16')}},
    'hd-drum': {'label': 'Drum (HD)', 'category': 'music', 'options': {}, 'build': build_drum, 'tags': ['drum', 'snare', 'tom', 'percussion', 'drum kit'],
                'variants': {'snare-red': dict(), 'snare-black': dict(color='#141414'), 'floor-tom-blue': dict(kind='tom', color='#1f3a6b')}},
    'hd-microphone': {'label': 'Microphone (HD)', 'category': 'music', 'options': {}, 'build': build_microphone, 'tags': ['microphone', 'mic', 'studio', 'vocal'],
                      'variants': {'vocal': dict(), 'studio-condenser': dict(kind='studio'), 'studio-gold': dict(kind='studio', finish='gold')}},
    'hd-sports-ball': {'label': 'Sports ball (HD)', 'category': 'sports', 'options': {}, 'build': build_ball, 'tags': ['ball', 'basketball', 'football', 'soccer ball', 'tennis ball', 'volleyball', 'beach ball'],
                       'variants': {'basketball': dict(), 'soccer': dict(kind='soccer'), 'tennis': dict(kind='tennis'), 'volleyball': dict(kind='volleyball'), 'beach-ball': dict(kind='beach')}},
    'hd-dumbbell': {'label': 'Dumbbells (HD)', 'category': 'sports', 'options': {}, 'build': build_dumbbell, 'tags': ['dumbbell', 'weights', 'gym', 'fitness'],
                    'variants': {'hex-pair': dict(), 'chrome-pair': dict(kind='chrome'), 'hex-single': dict(pair=False)}},
    'hd-skateboard': {'label': 'Skateboard (HD)', 'category': 'sports', 'options': {}, 'build': build_skateboard, 'tags': ['skateboard', 'skate', 'deck'],
                      'variants': {'maple': dict(), 'dark-red-wheels': dict(wood='#7a4a2a', wheels='#c23a2a')}},
    'hd-teddy-bear': {'label': 'Teddy bear (HD)', 'category': 'toys', 'options': {'color': 'fur color'}, 'build': build_teddy, 'tags': ['teddy bear', 'teddy', 'plush', 'stuffed animal', 'bear'],
                      'variants': {'brown': dict(), 'cream-red-bow': dict(color='#e3d2b0', pad='#f4ead6', bow='#b3201b'), 'grey-small': dict(color='#8c8f93', size=0.7, pad='#d9d4ca')}},
    'hd-toy-blocks': {'label': 'Toy blocks (HD)', 'category': 'toys', 'options': {}, 'build': build_blocks, 'tags': ['blocks', 'toy blocks', 'abc blocks', 'wooden blocks'],
                      'variants': {'abc-stack': dict(), 'natural-tower': dict(painted=False, letters=False, layout=[(0, 0, 0), (0, 0, 1), (0, 0, 2), (0, 0, 3), (1.1, 0, 0), (1.1, 0, 1)])}},
    'hd-rocking-horse': {'label': 'Rocking horse (HD)', 'category': 'toys', 'options': {'color': 'paint color'}, 'build': build_rocking_horse, 'tags': ['rocking horse', 'toy horse', 'nursery'],
                         'variants': {'natural-wood': dict(), 'painted-white': dict(painted=True)}},
    'hd-spinning-top': {'label': 'Spinning top (HD)', 'category': 'toys', 'options': {'color': 'paint color'}, 'build': build_top, 'tags': ['spinning top', 'top', 'toy'],
                        'variants': {'red': dict(), 'blue': dict(color='#2a6ad9', stripe='#f4f4f0')}},
    'hd-microscope': {'label': 'Microscope (HD)', 'category': 'science', 'options': {'color': 'body color'}, 'build': build_microscope, 'tags': ['microscope', 'lab', 'laboratory', 'science'],
                      'variants': {'white': dict(), 'black': dict(color='#2a2b2d')}},
    'hd-lab-glassware': {'label': 'Lab glassware (HD)', 'category': 'science', 'options': {}, 'build': build_flasks, 'tags': ['flask', 'beaker', 'test tube', 'lab glassware', 'chemistry'],
                         'variants': {'mixed-set': dict(), 'erlenmeyer-set': dict(mix=False, liquids=['#7a3ad9', '#3ab0a0', '#d9a03a']), 'mixed-set-green': dict(liquids=['#3ab06a', '#a0d93a', '#3a8ad9', '#d9d9d9'])}},
    'hd-globe': {'label': 'Globe (HD)', 'category': 'science', 'options': {}, 'build': build_globe, 'tags': ['globe', 'world', 'earth', 'map'],
                 'variants': {'wood-stand': dict(), 'brass-stand': dict(stand='brass', sea='#4a6f94'), 'antique': dict(sea='#a08a5a', wood='#3b2416')}},
    'hd-sculpture': {'label': 'Sculpture (HD)', 'category': 'art', 'options': {}, 'build': build_sculpture, 'tags': ['sculpture', 'statue', 'art', 'gallery', 'plinth'],
                     'variants': {'marble-twist': dict(), 'bronze-ring': dict(kind='ring', mat='bronze'), 'stone-stack': dict(kind='stack', mat='stone'), 'black-arch': dict(kind='arch', mat='black'), 'bronze-twist': dict(mat='bronze')}},
    'hd-easel': {'label': 'Easel with canvas (HD)', 'category': 'art', 'options': {}, 'build': build_easel, 'tags': ['easel', 'canvas', 'painting', 'artist'],
                 'variants': {'pine-abstract': dict(), 'walnut-landscape': dict(wood='#5e3b24', colors=['#3a6a4a', '#a8c8e0', '#d9c88a'], art=1)}},
    'hd-paint-palette': {'label': 'Paint palette (HD)', 'category': 'art', 'options': {}, 'build': build_paint_set, 'tags': ['palette', 'paint', 'brushes', 'artist'],
                         'variants': {'oil-colours': dict()}},
}
