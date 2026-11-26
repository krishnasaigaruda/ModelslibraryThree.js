"""HD home: bean bags, office chairs, bar stools, bookshelves with books, TV stands, wardrobes,
desks, pendant/floor lamps, mirrors, picture frames, cushion sets, folded throws, curtains."""
import math, random
import bmesh
from mathutils import Vector
from lib import core, cloth
from lib.mats import mat, assign

WOODS = {'oak': '#b48a5a', 'walnut': '#5e3b24', 'ash': '#cbb08a', 'ebony': '#2a1d16', 'white-oak': '#c9a87a', 'cherry': '#8a4a2c', 'pine': '#c8a066'}
def wood(p, axis='X', name=None):
    return mat(name or f'wood_{axis.lower()}', 'wood', color=WOODS.get(p.get('wood', 'oak'), p.get('wood', '#b48a5a')), axis=axis, ring=9, bump=0.25)
def fabric(p, key='color', default='#7d858c', name='fabric_primary', **kw):
    return mat(name, p.get('fabric', 'fabric'), color=p.get(key, default), tint=True, bump=0.6, sheen=0.25, **kw)
def metal(color='#1d1e20', name='metal_frame', rough=0.35):
    return mat(name, 'metal', color=color, metal=1.0, rough=rough)

# ------------------------------------------------------------------ bean bag
def build_beanbag(p):
    shape = p.get('shape', 'classic')
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
    rnd = random.Random(p.get('seed', 1))
    R = p.get('r', 0.45)
    H = p.get('h', 0.6)
    for v in bm.verts:
        x, y, z = v.co
        if shape == 'pouf':  # squarish cube pouf
            n = 5.0
            k = (abs(x) ** n + abs(y) ** n + abs(z) ** n) ** (-1 / n)
            x, y, z = x * k, y * k, z * k
        zz = (z + 1) / 2                      # 0 bottom … 1 top
        spread = 1 + 0.25 * (1 - zz) ** 2      # bags slump wider at the bottom
        if shape == 'chair':                   # back rest bulge (+y = back)
            zz2 = zz * (1 + 0.6 * max(0, y) ** 2)
            dent = 0.35 * max(0, -y) * max(0, z) # seat dent at the front/top
            zz = max(0, zz2 - dent)
        elif shape == 'classic':
            zz -= 0.18 * max(0, z) ** 2 * (1 - (x * x + y * y))   # sitting dimple on top
        wr = 0.015 * math.sin(math.atan2(y, x) * 7 + rnd.random() * 6) * (1 - abs(z))   # soft wrinkles
        v.co = Vector((x * R * spread * (1 + wr), y * R * spread * (1 + wr), max(0.0, zz) * H))
    o = core.from_bmesh('beanbag', bm)
    core.add_subsurf(o, 1)
    assign(o, fabric(p, default='#6d7b6a', grain=90))
    if p.get('piping', False) and shape != 'pouf':
        pts = []
        for i in range(48):
            a = i / 48 * math.tau
            pts.append((math.cos(a) * R * 1.22, math.sin(a) * R * 1.22, H * 0.06))
        pip = core.tube_path('piping', pts, 0.008, closed=True)
        assign(pip, fabric(p, default='#6d7b6a', grain=90))

# ------------------------------------------------------------------ office chair
def build_office_chair(p):
    frame = metal(p.get('frame', '#1b1c1e'), rough=0.3) if p.get('base') != 'chrome' else mat('chrome', 'chrome')
    plastic = mat('plastic_black', 'plastic', color='#18191b', rough=0.45)
    # 5-star base with casters (casters touch the floor, legs rest on caster stems)
    hub_z = 0.12
    for k in range(5):
        a = k * math.tau / 5
        tip = (math.cos(a) * 0.33, math.sin(a) * 0.33, 0.085)
        leg = core.post_between('leg', (0, 0, hub_z), tip, (0.045, 0.03), bevel=0.008)
        assign(leg, frame)
        stem = core.cylinder('caster_stem', 0.009, 0.03, at=(tip[0], tip[1], 0.06)); assign(stem, frame)
        for s in (-1, 1):
            w = core.cylinder('caster', 0.03, 0.018, verts=24, rot=(math.radians(90), 0, a))
            w.location = (tip[0] + math.cos(a) * 0.02, tip[1] + math.sin(a) * 0.02 + 0, 0.03)
            w.location = (tip[0] - math.sin(a) * 0.012 * s, tip[1] + math.cos(a) * 0.012 * s, 0.03)
            assign(w, plastic)
    hub = core.cylinder('hub', 0.05, 0.05, at=(0, 0, hub_z - 0.025), verts=24, bevel=0.006); assign(hub, frame)
    seat_z = p.get('seat_h', 0.48)
    gas = core.cylinder('gas_lift', 0.026, seat_z - 0.06 - hub_z, at=(0, 0, hub_z), verts=24); assign(gas, mat('chrome', 'chrome'))
    plate = core.soft_box('mech', (0.22, 0.24, 0.05), at=(0, 0, seat_z - 0.06), n=8, subsurf=1); assign(plate, plastic)
    up = fabric(p, default='#2d3033')
    seat = core.soft_box('seat', (0.5, 0.5, 0.09), at=(0, -0.02, seat_z), n=4.5, puff=0.012, cuts=12); assign(seat, up)
    # back support spine from the mechanism up behind the seat
    spine = core.post_between('spine', (0, 0.1, seat_z - 0.05), (0, 0.29, seat_z + 0.12), (0.06, 0.02), bevel=0.006); assign(spine, plastic)
    bh = p.get('back_h', 0.55)
    if p.get('back') == 'mesh':
        frm = core.soft_box('back_frame', (0.46, 0.04, bh), at=(0, 0.3, seat_z + 0.1 + bh / 2), n=6, puff=-0.02, puff_axis=1, rot=(math.radians(-8), 0, 0)); assign(frm, plastic)
        mesh_m = mat('mesh_fabric', 'grille', color=p.get('color', '#26292c'), cells=220)
        mp = core.soft_box('back_mesh', (0.42, 0.02, bh - 0.04), at=(0, 0.288, seat_z + 0.1 + bh / 2), n=6, puff=-0.02, puff_axis=1, rot=(math.radians(-8), 0, 0)); assign(mp, mesh_m)
    else:
        bk = core.soft_box('back', (0.46, 0.09, bh), at=(0, 0.31, seat_z + 0.1 + bh / 2), n=4.5, puff=0.015, puff_axis=1, rot=(math.radians(-8), 0, 0)); assign(bk, up)
        if p.get('headrest'):
            hz = seat_z + 0.1 + bh + 0.1
            hy = 0.31 + (bh + 0.1) * math.sin(math.radians(8)) / 2 + 0.02
            for s in (-1, 1):
                st = core.post_between('headrest_post', (s * 0.08, 0.31 + bh * 0.07, seat_z + 0.06 + bh), (s * 0.08, hy, hz), None, round_=True, r=0.008); assign(st, mat('chrome', 'chrome'))
            hr = core.soft_box('headrest', (0.3, 0.08, 0.14), at=(0, hy, hz + 0.05), n=4, rot=(math.radians(-8), 0, 0)); assign(hr, up)
    if p.get('arms', True):
        for s in (-1, 1):
            post = core.post_between('arm_post', (s * 0.2, -0.02, seat_z - 0.05), (s * 0.27, -0.02, seat_z + 0.2), (0.03, 0.05), bevel=0.006); assign(post, plastic)
            pad = core.soft_box('arm_pad', (0.08, 0.26, 0.03), at=(s * 0.27, -0.03, seat_z + 0.215), n=6); assign(pad, plastic)

# ------------------------------------------------------------------ bar stool
def build_bar_stool(p):
    H = p.get('h', 0.75)
    style = p.get('style', 'metal')
    if style == 'wood':
        w = wood(p, 'Z', 'wood_v')
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            o = core.post_between('leg', (math.cos(a) * 0.24, math.sin(a) * 0.24, 0), (math.cos(a) * 0.15, math.sin(a) * 0.15, H - 0.03), None, round_=True, r=0.017)
            assign(o, w)
        ring = core.lathe('footring', [(0.2 - 0.012, 0.27), (0.2 + 0.012, 0.27), (0.2 + 0.012, 0.29), (0.2 - 0.012, 0.29)], steps=48); assign(ring, w)
        seat = core.lathe('seat', [(0, H - 0.035), (0.19, H - 0.035), (0.2, H - 0.02), (0.195, H), (0.1, H + 0.008), (0, H + 0.01)], steps=64); assign(seat, wood(p, 'X', 'wood_h'))
    else:
        m = metal(p.get('frame', '#1e1f21')) if style == 'metal' else mat('chrome', 'chrome')
        base = core.lathe('base', [(0, 0), (0.22, 0), (0.22, 0.012), (0.2, 0.02), (0.04, 0.04), (0, 0.04)], steps=64); assign(base, m)
        col = core.cylinder('column', 0.025, H - 0.08, at=(0, 0, 0.035), verts=24); assign(col, m)
        ring = core.lathe('footring', [(0.17, 0.3), (0.18, 0.3), (0.18, 0.315), (0.17, 0.315)], steps=48); assign(ring, m)
        for k in range(3):
            a = k * math.tau / 3
            o = core.post_between('spoke', (0, 0, 0.307), (math.cos(a) * 0.175, math.sin(a) * 0.175, 0.307), None, round_=True, r=0.007); assign(o, m)
        seat, _ = cloth.pillow('seat', 0.4, 0.4, 0.09, at=(0, 0, H - 0.02), squash=0.6, piping=0)
        seat.scale = (1, 1, 1)
        assign(seat, fabric(p, default='#6b4a2e', name='leather_primary') if p.get('fabric') != 'fabric' else fabric(p))
        cup = core.cylinder('seat_plate', 0.12, 0.025, at=(0, 0, H - 0.05), verts=32); assign(cup, m)
        if p.get('back'):
            for s in (-1, 1):
                o = core.post_between('back_post', (s * 0.12, 0.12, H - 0.04), (s * 0.15, 0.2, H + 0.3), None, round_=True, r=0.01); assign(o, m)
            bk = core.soft_box('back', (0.36, 0.04, 0.12), at=(0, 0.205, H + 0.27), n=6, puff=-0.01, puff_axis=1); assign(bk, seat.data.materials[0])

# ------------------------------------------------------------------ bookshelf with books
BOOK_COLS = ['#7a1f24', '#1f3550', '#2f5a3a', '#c8a24a', '#3b3b3b', '#e7e0d0', '#8a4a2c', '#4a3a6a', '#b85a3c', '#2c6a6a']
def books_row(x0, x1, z, depth, y_back, rnd, max_h=0.3, lean_end=True):
    """Fill a shelf from x0 to x1 with books standing on z, backs against y_back. Returns objects."""
    out = []
    x = x0 + 0.005
    pages = mat('book_pages', 'flat', color='#efe8d6', rough=0.8)
    while x < x1 - 0.03:
        t = rnd.uniform(0.018, 0.045)
        h = rnd.uniform(0.6, 1.0) * max_h
        d = min(depth - 0.01, rnd.uniform(0.15, 0.24))
        if x + t > x1 - 0.005:
            break
        if rnd.random() < 0.08 and x > x0 + 0.1:   # gap
            x += rnd.uniform(0.03, 0.08)
            continue
        c = BOOK_COLS[rnd.randrange(len(BOOK_COLS))]
        cov = core.soft_box('book', (t, d, h), at=(x + t / 2, y_back - d / 2, z + h / 2 - 0.001), n=14, subsurf=0)
        assign(cov, mat(f'book_{c[1:]}', 'flat', color=c, rough=0.55))
        pg = core.soft_box('pages', (t - 0.004, d - 0.004, h - 0.008), at=(x + t / 2, y_back - d / 2 - 0.004, z + h / 2 - 0.001), n=14, subsurf=0)
        assign(pg, pages)
        out += [cov, pg]
        x += t + 0.001
    return out

def build_bookshelf(p):
    W, D, H = p.get('w', 0.9), p.get('d', 0.32), p.get('h', 1.9)
    shelves = p.get('shelves', 5)
    t = 0.022
    m = wood(p) if p.get('finish') != 'white' else mat('paint_primary_white', 'painted_metal', color=p.get('color', '#efede8'), tint=True, metal=0, wear=0.0, rough=0.5)
    mv = wood(p, 'Z', 'wood_v') if p.get('finish') != 'white' else m
    for s in (-1, 1):
        o = core.soft_box('side', (t, D, H), at=(s * (W / 2 - t / 2), 0, H / 2), n=18, subsurf=0); assign(o, mv)
    back = core.soft_box('back', (W - 0.01, 0.008, H - 0.01), at=(0, D / 2 - 0.004, H / 2), n=18, subsurf=0); assign(back, mv)
    rnd = random.Random(p.get('seed', 4))
    gap = (H - 0.08 - t) / shelves
    for k in range(shelves + 1):
        z = 0.06 + k * gap
        o = core.soft_box('shelf', (W - 2 * t + 0.002, D - 0.01, t), at=(0, -0.005, z + t / 2), n=18, subsurf=0); assign(o, m)
        if k < shelves and p.get('books', True):
            books_row(-W / 2 + t, W / 2 - t, z + t, D - 0.02, D / 2 - 0.01, rnd, max_h=min(0.32, gap - t - 0.02))
    kick = core.soft_box('plinth', (W - 2 * t + 0.002, 0.02, 0.06), at=(0, -D / 2 + 0.03, 0.03), n=18, subsurf=0); assign(kick, m)

# ------------------------------------------------------------------ TV stand / media console
def build_tv_stand(p):
    W, D, H = p.get('w', 1.6), p.get('d', 0.42), p.get('h', 0.5)
    leg_h = p.get('leg_h', 0.14)
    body_h = H - leg_h
    m = wood(p)
    car = core.soft_box('carcass', (W, D, body_h), at=(0, 0, leg_h + body_h / 2), n=20, subsurf=0); assign(car, m)
    # front: two slatted doors + an open middle shelf
    slat = wood(p, 'Z', 'wood_v')
    dw = W * 0.33
    for s in (-1, 1):
        x = s * (W / 2 - dw / 2 - 0.01)
        n = int(dw / 0.03)
        for k in range(n):
            o = core.soft_box('slat', (0.022, 0.018, body_h - 0.04), at=(x - dw / 2 + 0.015 + k * dw / n, -D / 2 - 0.006, leg_h + body_h / 2), n=10, subsurf=0)
            assign(o, slat)
    shelf_m = mat('shelf_inner', 'flat', color='#1c1a18', rough=0.7)
    niche = core.soft_box('niche', (W - 2 * dw - 0.06, 0.012, body_h - 0.06), at=(0, -D / 2 - 0.002, leg_h + body_h / 2), n=16, subsurf=0)
    assign(niche, shelf_m)
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = core.frustum('leg', (0.035, 0.035), (0.022, 0.022), leg_h + 0.004, at=(sx * (W / 2 - 0.08), sy * (D / 2 - 0.06), 0))
            assign(o, wood(p, 'Z', 'wood_v') if not p.get('metal_legs') else metal())

# ------------------------------------------------------------------ wardrobe
def build_wardrobe(p):
    W, D, H = p.get('w', 1.2), p.get('d', 0.6), p.get('h', 2.0)
    doors = p.get('doors', 2)
    leg_h = 0.08
    m = wood(p) if p.get('finish') != 'paint' else mat('paint_primary_wardrobe', 'painted_metal', color=p.get('color', '#e8e4dc'), tint=True, metal=0, wear=0.0, rough=0.45)
    mv = wood(p, 'Z', 'wood_v') if p.get('finish') != 'paint' else m
    car = core.soft_box('carcass', (W, D, H - leg_h), at=(0, 0, leg_h + (H - leg_h) / 2), n=24, subsurf=0); assign(car, mv)
    crown = core.soft_box('crown', (W + 0.04, D + 0.03, 0.04), at=(0, -0.01, H + 0.018), n=14, subsurf=1); assign(crown, m)
    dw = (W - 0.03) / doors
    hm = mat('brass_handle', 'metal', color=p.get('handle', '#b8955a'), metal=1, rough=0.25)
    for k in range(doors):
        x = -W / 2 + 0.015 + dw * (k + 0.5)
        d = core.soft_box('door', (dw - 0.006, 0.022, H - leg_h - 0.06), at=(x, -D / 2 - 0.01, leg_h + (H - leg_h) / 2), n=20, subsurf=0); assign(d, mv)
        if p.get('panels', True):
            for z0, z1 in ((0.15, 0.55), (0.6, 0.95)):
                pz = leg_h + (H - leg_h) * (z0 + z1) / 2
                ph = (H - leg_h) * (z1 - z0) - 0.04
                o = core.soft_box('panel_mould', (dw - 0.12, 0.012, ph), at=(x, -D / 2 - 0.024, pz), n=6, subsurf=1); assign(o, mv)
        hx = x + (dw / 2 - 0.05) * (1 if k % 2 == 0 else -1) * (-1 if doors == 2 else 1)
        hd = core.tube_path('handle', [(hx, -D / 2 - 0.02, leg_h + H * 0.5 + 0.12), (hx, -D / 2 - 0.05, leg_h + H * 0.5 + 0.1), (hx, -D / 2 - 0.05, leg_h + H * 0.5 - 0.1), (hx, -D / 2 - 0.02, leg_h + H * 0.5 - 0.12)], 0.007)
        assign(hd, hm)
    o = core.soft_box('plinth', (W - 0.04, D - 0.04, leg_h + 0.004), at=(0, 0, (leg_h + 0.004) / 2), n=20, subsurf=0); assign(o, mv)

# ------------------------------------------------------------------ desk
def build_desk(p):
    W, D, H = p.get('w', 1.4), p.get('d', 0.7), p.get('h', 0.75)
    top_t = 0.03
    top = core.soft_box('top', (W, D, top_t), at=(0, 0, H - top_t / 2), n=18, subsurf=1); assign(top, wood(p))
    under = H - top_t
    style = p.get('style', 'legs')
    if style == 'frame':
        m = metal(p.get('frame', '#1c1d1f'))
        for s in (-1, 1):
            x = s * (W / 2 - 0.06)
            for pts in [((x, -D / 2 + 0.05, 0.015), (x, -D / 2 + 0.05, under + 0.002)), ((x, D / 2 - 0.05, 0.015), (x, D / 2 - 0.05, under + 0.002)),
                        ((x, -D / 2 + 0.05, under - 0.02), (x, D / 2 - 0.05, under - 0.02)), ((x, -D / 2 + 0.03, 0.015), (x, D / 2 - 0.03, 0.015))]:
                o = core.post_between('frame', pts[0], pts[1], (0.035, 0.035), bevel=0.003); assign(o, m)
        bar = core.post_between('frame', (-W / 2 + 0.06, D / 2 - 0.05, under - 0.02), (W / 2 - 0.06, D / 2 - 0.05, under - 0.02), (0.035, 0.035), bevel=0.003); assign(bar, m)
    else:
        for sx in (-1, 1):
            for sy in (-1, 1):
                o = core.frustum('leg', (0.045, 0.045), (0.03, 0.03), under + 0.004, at=(sx * (W / 2 - 0.05), sy * (D / 2 - 0.05), 0)); assign(o, wood(p, 'Z', 'wood_v'))
        ap = core.soft_box('apron', (W - 0.1, 0.02, 0.08), at=(0, D / 2 - 0.05, under - 0.04 + 0.002), n=16, subsurf=0); assign(ap, wood(p))
    if p.get('drawers'):
        pw = 0.42
        ped = core.soft_box('pedestal', (pw, D - 0.08, under - 0.02), at=(W / 2 - pw / 2 - 0.08, 0, (under - 0.02) / 2 + 0.01), n=20, subsurf=0); assign(ped, wood(p, 'Z', 'wood_v'))
        hm = mat('handle_metal', 'metal', color='#2a2a2a', metal=1, rough=0.3)
        for k in range(3):
            z = 0.1 + k * (under - 0.06) / 3 + 0.1
            f = core.soft_box('drawer', (pw - 0.02, 0.018, (under - 0.06) / 3 - 0.01), at=(W / 2 - pw / 2 - 0.08, -D / 2 + 0.04 - 0.009, 0.03 + (k + 0.5) * (under - 0.06) / 3), n=16, subsurf=0)
            assign(f, wood(p))
            hd = core.soft_box('pull', (0.12, 0.015, 0.012), at=(W / 2 - pw / 2 - 0.08, -D / 2 + 0.04 - 0.024, 0.03 + (k + 0.75) * (under - 0.06) / 3), n=6, subsurf=0); assign(hd, hm)

# ------------------------------------------------------------------ pendant lamp (with ceiling canopy + cord — floats only on a ceiling, so it ships with a short stand? No: a pendant hangs; we give it a floor-standing "hook stand"?)
def build_pendant(p):
    """Pendant lamp shown as it hangs: canopy disc at the top, cord, shade. Origin at the floor would be wrong,
    so the whole fixture is mounted on a slim floor stand arm (arc) when `stand` is set; otherwise the
    object's top is the ceiling plate — the model reports userData.floating via its name convention."""
    drop = p.get('drop', 0.9)
    kind = p.get('kind', 'dome')
    brass = mat('brass', 'metal', color=p.get('metal', '#b8955a'), metal=1, rough=0.25)
    sh = mat('paint_primary_shade', 'painted_metal', color=p.get('color', '#1f3b33'), tint=True, metal=0.4, wear=0.0, rough=0.35) if kind != 'glass' else mat('glass_shade', 'glass', color='#efe9df', alpha=0.55)
    # floor stand: heavy base + column + arc arm reaching over the shade (so the model stands on the ground)
    H = drop + 0.9
    base = core.lathe('base', [(0, 0), (0.18, 0), (0.18, 0.02), (0.16, 0.035), (0, 0.04)], steps=64); assign(base, brass)
    arc = core.tube_path('arm', [(0, 0, 0.03), (0, 0, H * 0.6), (0.08, 0, H * 0.95), (0.4, 0, H + 0.05), (0.7, 0, H)], 0.012); assign(arc, brass)
    cord = core.post_between('cord', (0.7, 0, H + 0.005), (0.7, 0, H - drop * 0.5), None, round_=True, r=0.003); assign(cord, mat('cord', 'flat', color='#141414', rough=0.6))
    zt = H - drop * 0.5
    cap = core.cylinder('socket', 0.02, 0.05, at=(0.7, 0, zt - 0.045), verts=24); assign(cap, brass)
    if kind == 'dome':
        prof = [(0.02, 0), (0.06, -0.02), (0.16, -0.1), (0.2, -0.18), (0.198, -0.185), (0.155, -0.105), (0.055, -0.026), (0.015, -0.006)]
    elif kind == 'cone':
        prof = [(0.02, 0), (0.12, -0.25), (0.118, -0.252), (0.017, -0.004)]
    else:  # glass globe
        prof = [(0.02, 0)] + [(0.14 * math.sin(math.pi * t / 12) + 0.02 * (1 - t / 12), -0.14 * (1 - math.cos(math.pi * t / 12))) for t in range(1, 12)] + [(0.0, -0.28)]
    shade = core.lathe('shade', prof, at=(0.7, 0, zt - 0.04), steps=64); assign(shade, sh)
    bulb = core.sphere('bulb', 0.03, at=(0.7, 0, zt - 0.1), seg=20, rings=10)
    assign(bulb, mat('bulb', 'emissive', color='#fff4dc', emit='#ffd9a0', strength=2.0))
    stem = core.post_between('bulb_stem', (0.7, 0, zt - 0.05), (0.7, 0, zt - 0.08), None, round_=True, r=0.012); assign(stem, brass)

def build_floor_lamp(p):
    kind = p.get('kind', 'column')
    brass = mat('brass', 'metal', color=p.get('metal', '#b8955a'), metal=1, rough=0.25) if p.get('finish', 'brass') == 'brass' else metal('#1c1c1e')
    base = core.lathe('base', [(0, 0), (0.15, 0), (0.15, 0.025), (0.12, 0.04), (0, 0.045)], steps=64); assign(base, brass)
    shade_m = mat('fabric_secondary_shade', 'fabric', color=p.get('shade', '#efe8da'), tint=True, emit='#ffe2b0', strength=0.25)
    if kind == 'column':
        H = 1.55
        pole = core.cylinder('pole', 0.012, H, at=(0, 0, 0.04)); assign(pole, brass)
        sh = core.lathe('shade', [(0.22, H - 0.05), (0.18, H + 0.25), (0.177, H + 0.25), (0.217, H - 0.05), (0.22, H - 0.05)], steps=72); assign(sh, shade_m)
        for a in range(3):
            ang = a * math.tau / 3
            o = core.post_between('spider', (0, 0, H + 0.12), (math.cos(ang) * 0.183, math.sin(ang) * 0.183, H + 0.2), None, round_=True, r=0.002, verts=8); assign(o, brass)
        pole.scale.z = (H + 0.12 - 0.04) / H
        bulb = core.sphere('bulb', 0.03, at=(0, 0, H + 0.05), seg=20, rings=10); assign(bulb, mat('bulb', 'emissive', color='#fff4dc', emit='#ffd9a0', strength=2.0))
    else:  # arc lamp: marble base, big arc, dome shade at the end
        base.scale = (1.5, 1.5, 1.4)
        assign(base, mat('marble_base', 'marble'))
        arc = core.tube_path('arc', [(0, 0, 0.06), (0.05, 0, 1.2), (0.4, 0, 1.95), (1.1, 0, 2.0), (1.5, 0, 1.6)], 0.014); assign(arc, brass)
        dome = core.lathe('shade', [(0.025, 0), (0.08, -0.03), (0.2, -0.13), (0.24, -0.22), (0.238, -0.225), (0.198, -0.135), (0.078, -0.035), (0.02, -0.006)], at=(1.5, 0, 1.6), steps=64)
        assign(dome, mat('paint_primary_shade', 'painted_metal', color=p.get('color', '#1d1d1f'), tint=True, metal=0.5, wear=0.0, rough=0.3))
        bulb = core.sphere('bulb', 0.035, at=(1.5, 0, 1.53), seg=20, rings=10); assign(bulb, mat('bulb', 'emissive', color='#fff4dc', emit='#ffd9a0', strength=2.0))
        stem = core.post_between('bulb_stem', (1.5, 0, 1.6), (1.5, 0, 1.55), None, round_=True, r=0.014); assign(stem, brass)

# ------------------------------------------------------------------ mirror (floor-standing / on a stand) & picture frame (on an easel stand / leaning)
def build_mirror(p):
    kind = p.get('kind', 'floor')
    fm = wood(p) if p.get('frame') == 'wood' else mat('brass', 'metal', color=p.get('metal', '#b8955a'), metal=1, rough=0.25) if p.get('frame') == 'brass' else metal('#18191b')
    mirror = mat('mirror', 'mirror')
    if kind == 'floor':  # tall leaning mirror: rests on the floor at a slight angle with a back strut
        W, H = p.get('w', 0.6), p.get('h', 1.7)
        lean = math.radians(8)
        shape = p.get('shape', 'arch')
        if shape == 'arch':
            pts = [(-W / 2, 0), (W / 2, 0)] + [(math.cos(a) * W / 2, H - W / 2 + math.sin(a) * W / 2) for a in [i * math.pi / 24 for i in range(25)]]
            pts = [(-W / 2, 0), (W / 2, 0), (W / 2, H - W / 2)] + [(math.cos(i * math.pi / 24) * W / 2, H - W / 2 + math.sin(i * math.pi / 24) * W / 2) for i in range(1, 24)] + [(-W / 2, H - W / 2)]
        else:
            pts = core.rounded_rect(W, H, 0.03)
            pts = [(x, y + H / 2) for x, y in pts]
        frame = core.extrude_outline('frame', pts, 0.035, rot=(math.radians(90) - lean, 0, 0), bevel=0.006)
        glass_pts = [(x * (W - 0.06) / W, 0.03 + (y - 0) * (H - 0.06) / H) for x, y in pts]
        glass = core.extrude_outline('glass', glass_pts, 0.006, rot=(math.radians(90) - lean, 0, 0))
        glass.location = (0, -0.031 * math.cos(lean) - 0.003, 0.0)
        assign(frame, fm); assign(glass, mirror)
        strut = core.post_between('strut', (0, 0.03 + H * 0.55 * math.sin(lean), H * 0.55 * math.cos(lean)), (0, 0.38, 0), (0.03, 0.02), bevel=0.004)
        assign(strut, fm)
    else:  # round vanity mirror on a stand
        R = p.get('r', 0.18)
        base = core.lathe('base', [(0, 0), (0.1, 0), (0.1, 0.015), (0.08, 0.025), (0, 0.025)], steps=48); assign(base, fm)
        post = core.cylinder('post', 0.008, 0.15, at=(0, 0, 0.02)); assign(post, fm)
        yoke = core.tube_path('yoke', [(-R - 0.02, 0, 0.17 + R), (-R - 0.02, 0, 0.17), (R + 0.02, 0, 0.17), (R + 0.02, 0, 0.17 + R)], 0.006); assign(yoke, fm)
        ring = core.lathe('ring', [(R - 0.012, -0.012), (R + 0.012, -0.012), (R + 0.012, 0.012), (R - 0.012, 0.012)], steps=72, rot=(math.radians(90), 0, 0)); ring.location = (0, 0, 0.17 + R); assign(ring, fm)
        g = core.cylinder('glass', R - 0.008, 0.006, verts=72, rot=(math.radians(90), 0, 0)); g.location = (0, 0.003, 0.17 + R); assign(g, mirror)
        for s in (-1, 1):
            pv = core.cylinder('pivot', 0.012, 0.03, verts=16, rot=(0, math.radians(90), 0)); pv.location = (s * (R + 0.005) - (0.015 if s > 0 else -0.015) * 0 + (-0.015 if s < 0 else 0), 0, 0.17 + R); assign(pv, fm)

ART = [['#c96f3b', '#2f4e6b', '#e9dcc0'], ['#1f3b33', '#d9b45a', '#efe8da'], ['#7a1f24', '#e3c9a0', '#2a2a2a'], ['#5a7d9a', '#f0e6d2', '#b4553a']]
def build_frame(p):
    W, H = p.get('w', 0.5), p.get('h', 0.7)
    fm = wood(p) if p.get('frame') == 'wood' else mat('frame_black', 'flat', color='#141414', rough=0.4) if p.get('frame') == 'black' else mat('gilt', 'metal', color='#c9a24a', metal=1, rough=0.3)
    lean = math.radians(10)
    o = core.soft_box('frame', (W, 0.03, H), n=12, subsurf=0)
    o.rotation_euler = (-lean, 0, 0); o.location = (0, 0.015 + H / 2 * math.sin(lean), H / 2 * math.cos(lean)); assign(o, fm)
    mat_board = core.soft_box('mat', (W - 0.06, 0.006, H - 0.06), n=12, subsurf=0)
    mat_board.rotation_euler = (-lean, 0, 0); mat_board.location = (0, 0.015 + H / 2 * math.sin(lean) - 0.016 * math.cos(lean), H / 2 * math.cos(lean) + 0.016 * math.sin(lean))
    assign(mat_board, mat('mat_board', 'flat', color='#f4f1ea', rough=0.9))
    cols = ART[p.get('art', 0) % len(ART)]
    art = core.soft_box('art', (W - 0.14, 0.004, H - 0.14), n=12, subsurf=0)
    art.rotation_euler = (-lean, 0, 0); art.location = (0, 0.015 + H / 2 * math.sin(lean) - 0.02 * math.cos(lean), H / 2 * math.cos(lean) + 0.02 * math.sin(lean))
    assign(art, mat(f'artwork_{p.get("art", 0)}', 'rug', colors=cols, pattern=p.get('pattern', 'modern'), aspect=W / H, bump=0.1))
    # easel-style back leg so it stands on its own
    leg = core.post_between('stand', (0, 0.02 + H * 0.5 * math.sin(lean), H * 0.5 * math.cos(lean)), (0, 0.02 + H * 0.5 * math.sin(lean) + 0.2, 0), (0.025, 0.012), bevel=0.003)
    assign(leg, fm)

# ------------------------------------------------------------------ cushion set / folded throw / curtains
def build_cushions(p):
    cols = p.get('colors', ['#c9b79c', '#7d858c', '#a0522d'])
    rnd = random.Random(p.get('seed', 2))
    base_m = mat('ottoman', 'fabric', color=p.get('base', '#3a3c40'), bump=0.6)
    seat = core.soft_box('ottoman', (0.9, 0.55, 0.38), at=(0, 0, 0.19), n=6, puff=0.01)   # cushions displayed on a low ottoman
    assign(seat, base_m)
    for i, c in enumerate(cols):
        s = [0.45, 0.42, 0.36][i % 3]
        pl, pip = cloth.pillow('cushion', s, s, 0.15, at=(-0.24 + i * 0.24, 0.02, 0.38 + s / 2 * 0.95 - 0.02), rot=(math.radians(80 + rnd.uniform(-6, 6)), 0, math.radians(rnd.uniform(-8, 8))), seed=i)
        m = mat(f'fabric_cushion_{i}', 'fabric', color=c, bump=0.7, sheen=0.3, boucle=(i == 1 and p.get('boucle', False)))
        assign(pl, m); assign(pip, m)

def build_throw(p):
    """Folded throw lying across a bench and falling over the front edge in soft vertical folds, fringed hem."""
    from mathutils import Vector
    base_m = mat('bench_wood', 'wood', color=WOODS.get(p.get('wood', 'oak')), axis='X', ring=9)
    W = 1.1
    bench = core.soft_box('bench_top', (W, 0.4, 0.04), at=(0, 0, 0.44), n=14, subsurf=1); assign(bench, base_m)
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = core.frustum('leg', (0.035, 0.035), (0.025, 0.025), 0.424, at=(sx * (W / 2 - 0.06), sy * 0.14, 0)); assign(o, mat('bench_wood_v', 'wood', color=WOODS.get(p.get('wood', 'oak')), axis='Z', ring=9))
    rnd = random.Random(p.get('seed', 5))
    T = 0.016          # folded-throw thickness
    BW = 0.5           # folded width
    x0 = 0.12          # off-centre on the bench
    top = 0.46 + T / 2
    yb, yf = -0.13, 0.2  # lies from near the back to the front edge
    r = 0.022          # wraps the bench's rounded edge
    hang = 0.3
    Lt = (yf - r) - yb
    La = math.pi / 2 * (r + T / 2)
    Ls = Lt + La + hang
    nx, ns = 36, 70
    ph = [rnd.uniform(0, math.tau) for _ in range(3)]
    def mid(u, s):
        """u in [-1,1] across the width, s = arc length from the back edge."""
        x = u * BW / 2
        if s <= Lt:
            y, z, d = yb + s, top + 0.003 * math.sin(u * 7 + ph[0]) * (s / Lt), 0
        elif s <= Lt + La:
            a = (s - Lt) / (r + T / 2)
            y, z, d = yf - r + math.sin(a) * (r + T / 2), 0.46 - r + math.cos(a) * (r + T / 2), 0
        else:
            d = (s - Lt - La) / hang  # 0 at the edge -> 1 at the hem
            y, z = yf + T / 2, 0.46 - r - d * hang
            # folds grow toward the hem; the cloth flares a little and the hem swings forward
            amp = 0.028 * d ** 1.3
            y += amp * (0.5 + 0.5 * math.sin(u * math.pi * 3.2 + ph[1])) + 0.01 * d ** 2
            x *= 1 + 0.07 * d
            z += 0.012 * d * math.sin(u * math.pi * 1.5 + ph[2])
        return Vector((x0 + x, y, z))
    P = [[mid(-1 + 2 * i / nx, Ls * j / ns) for j in range(ns + 1)] for i in range(nx + 1)]
    def nrm(i, j):
        du = P[min(i + 1, nx)][j] - P[max(i - 1, 0)][j]
        ds = P[i][min(j + 1, ns)] - P[i][max(j - 1, 0)]
        n = ds.cross(du)
        return n.normalized() if n.length > 1e-9 else Vector((0, 0, 1))
    verts, faces = [], []
    idx = lambda i, j, side: side * (nx + 1) * (ns + 1) + i * (ns + 1) + j
    for side in (0, 1):
        for i in range(nx + 1):
            for j in range(ns + 1):
                n = nrm(i, j)
                # keep the top surface pointing up (away from the bench)
                if n.z < -0.3 or (n.y < -0.3 and j > ns * 0.5): n = -n
                verts.append(tuple(P[i][j] + n * (T / 2 if side == 0 else -T / 2)))
    for i in range(nx):
        for j in range(ns):
            faces.append((idx(i, j, 0), idx(i + 1, j, 0), idx(i + 1, j + 1, 0), idx(i, j + 1, 0)))
            faces.append((idx(i, j, 1), idx(i, j + 1, 1), idx(i + 1, j + 1, 1), idx(i + 1, j, 1)))
    for i in range(nx):  # back + hem edges
        for j in (0, ns):
            faces.append((idx(i, j, 0), idx(i, j, 1), idx(i + 1, j, 1), idx(i + 1, j, 0)))
    for j in range(ns):  # side edges
        for i in (0, nx):
            faces.append((idx(i, j, 0), idx(i, j + 1, 0), idx(i, j + 1, 1), idx(i, j, 1)))
    th = core.from_pydata('throw', verts, faces)
    import bmesh as _bm
    bm = _bm.new(); bm.from_mesh(th.data); _bm.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(th.data); bm.free()
    core.add_subsurf(th, 1)
    knit = mat('throw_knit', 'fabric', color=p.get('color', '#8a6e4b'), bump=1.0, boucle=p.get('boucle', True), sheen=0.0)
    assign(th, knit)
    if p.get('fringe', True):
        # tassels hanging from the hem, each rooted inside the cloth
        for k in range(22):
            u = -1 + 2 * (k + 0.5) / 22
            hp = mid(u, Ls - 0.004)
            tas = core.post_between('fringe', (hp.x, hp.y, hp.z + 0.004), (hp.x + rnd.uniform(-0.004, 0.004), hp.y + 0.004, hp.z - 0.045), None, round_=True, r=0.0032, verts=6)
            assign(tas, knit)

def build_curtains(p):
    """Pair of pleated curtains on a rod with finials, hanging from rings; stands on the floor via
    hems pooling slightly (bottom edge touches the floor) — like a staged room set."""
    W, H = p.get('w', 1.6), p.get('h', 2.4)
    rod_m = mat('brass', 'metal', color=p.get('metal', '#b8955a'), metal=1, rough=0.25) if p.get('rod', 'brass') == 'brass' else metal('#151515')
    rod = core.cylinder('rod', 0.014, W + 0.3, verts=24, rot=(0, math.radians(90), 0)); rod.location = (-(W + 0.3) / 2, 0, H); assign(rod, rod_m)
    for s in (-1, 1):
        fin = core.sphere('finial', 0.03, at=(s * ((W + 0.3) / 2 + 0.02), 0, H), seg=20, rings=10); assign(fin, rod_m)
    cm = mat('fabric_primary_curtain', 'fabric', color=p.get('color', '#c9b79c'), tint=True, bump=0.6, sheen=0.35)
    gather = p.get('gather', 0.35)       # 0 = closed … 1 = fully open
    for s in (-1, 1):
        width = W / 2 * (1 - gather * 0.6)
        x0 = s * W / 2 - (width if s > 0 else 0)
        nx, nz = 48, 30
        verts, faces = [], []
        for j in range(nz + 1):
            t = j / nz
            z = H - 0.06 - (H - 0.06) * t
            for i in range(nx + 1):
                u = i / nx
                x = x0 + width * u + s * gather * 0.1 * t * (1 - u if s < 0 else u)
                pleat = 0.035 * math.sin(u * math.pi * 2 * 9) * (1 + 0.6 * t)
                y = pleat + 0.02 * math.sin(u * 7 + t * 3) * t
                verts.append((x, y, z))
        for j in range(nz):
            for i in range(nx):
                a = j * (nx + 1) + i
                faces.append((a, a + 1, a + nx + 2, a + nx + 1))
        c = core.from_pydata('curtain', verts, faces)
        sol = c.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.006
        core.add_subsurf(c, 1)
        assign(c, cm)
        # rings on the rod, joining the curtain top to the rod
        for k in range(8):
            x = x0 + width * k / 7
            r = core.lathe('ring', [(0.02, -0.004), (0.026, -0.004), (0.026, 0.004), (0.02, 0.004)], steps=24, rot=(0, math.radians(90), 0))
            r.location = (x, 0, H - 0.006); assign(r, rod_m)
            clip = core.post_between('clip', (x, 0, H - 0.026), (x, 0, H - 0.07), None, round_=True, r=0.004, verts=8); assign(clip, rod_m)
    # floor-standing rod brackets (a staged display: two slim posts carry the rod)
    for s in (-1, 1):
        post = core.cylinder('post', 0.012, H, at=(s * (W / 2 + 0.1), 0.0, 0)); assign(post, rod_m)
        foot = core.lathe('foot', [(0, 0), (0.12, 0), (0.12, 0.012), (0, 0.016)], steps=48); foot.location = (s * (W / 2 + 0.1), 0, 0); assign(foot, rod_m)

TYPES = {
    'hd-bean-bag': {'label': 'Bean bag (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'fabric color'}, 'build': build_beanbag,
                    'tags': ['bean bag', 'beanbag', 'pouf', 'pouffe', 'floor cushion', 'lounger'],
                    'variants': {'classic-olive': dict(color='#6d7b6a'), 'classic-charcoal': dict(color='#33363a', seed=3), 'chair-mustard': dict(shape='chair', color='#c8962c', h=0.75),
                                 'chair-leather-tan': dict(shape='chair', fabric='leather', color='#8a5a32', h=0.72), 'pouf-cream-boucle': dict(shape='pouf', color='#e7e0d2', boucle=True, r=0.28, h=0.4),
                                 'pouf-terracotta': dict(shape='pouf', color='#b9663e', r=0.26, h=0.38), 'classic-navy-velvet': dict(color='#1f2c4a', seed=7), 'chair-blush': dict(shape='chair', color='#d8a49a', h=0.7, seed=5)}},
    'hd-office-chair': {'label': 'Office chair (HD)', 'category': 'furniture', 'sub': 'office', 'options': {'color': 'upholstery / mesh color'}, 'build': build_office_chair,
                        'tags': ['office chair', 'desk chair', 'swivel chair', 'task chair', 'computer chair'],
                        'variants': {'mesh-black': dict(back='mesh'), 'executive-leather': dict(fabric='leather', color='#1d1b1a', headrest=True, back_h=0.62, base='chrome'),
                                     'task-grey': dict(color='#7d858c', arms=False), 'mesh-white-frame': dict(back='mesh', color='#3a3d40', frame='#e8e8e6'), 'fabric-blue': dict(color='#2b4a7a', headrest=True)}},
    'hd-bar-stool': {'label': 'Bar stool (HD)', 'category': 'furniture', 'sub': 'kitchen', 'options': {'color': 'seat color'}, 'build': build_bar_stool,
                     'tags': ['bar stool', 'stool', 'counter stool', 'kitchen stool'],
                     'variants': {'metal-leather': dict(), 'chrome-red': dict(style='chrome', color='#9a1f1f'), 'oak-wood': dict(style='wood', wood='oak'),
                                  'walnut-wood-counter': dict(style='wood', wood='walnut', h=0.65), 'metal-back-grey': dict(back=True, fabric='fabric', color='#6e7378')}},
    'hd-bookshelf': {'label': 'Bookshelf (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {}, 'build': build_bookshelf,
                     'tags': ['bookshelf', 'bookcase', 'shelves', 'books', 'shelving'],
                     'variants': {'oak-tall': dict(), 'walnut-wide': dict(wood='walnut', w=1.2, seed=9), 'white-tall': dict(finish='white', seed=12), 'ash-low': dict(wood='ash', h=1.0, shelves=2, w=1.2, seed=5), 'empty-pine': dict(wood='pine', books=False)}},
    'hd-tv-stand': {'label': 'TV stand (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {}, 'build': build_tv_stand,
                    'tags': ['tv stand', 'media console', 'tv unit', 'entertainment center', 'sideboard'],
                    'variants': {'oak-slatted': dict(), 'walnut-long': dict(wood='walnut', w=1.9), 'ash-metal-legs': dict(wood='ash', metal_legs=True, w=1.4)}},
    'hd-wardrobe': {'label': 'Wardrobe (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'paint color'}, 'build': build_wardrobe,
                    'tags': ['wardrobe', 'closet', 'armoire', 'cupboard', 'cabinet'],
                    'variants': {'oak-two-door': dict(), 'white-three-door': dict(finish='paint', doors=3, w=1.6), 'walnut-tall': dict(wood='walnut', h=2.2, panels=False, handle='#1d1d1d'), 'sage-painted': dict(finish='paint', color='#9aab92')}},
    'hd-desk': {'label': 'Desk (HD)', 'category': 'furniture', 'sub': 'office', 'options': {}, 'build': build_desk,
                'tags': ['desk', 'writing desk', 'office desk', 'computer desk', 'workstation'],
                'variants': {'oak-classic': dict(), 'walnut-drawers': dict(wood='walnut', drawers=True), 'industrial-frame': dict(style='frame', wood='teak' if False else '#8f5f34'), 'white-oak-compact': dict(wood='white-oak', w=1.0, d=0.55)}},
    'hd-pendant-lamp': {'label': 'Pendant lamp (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'shade color'}, 'build': build_pendant,
                        'tags': ['pendant lamp', 'hanging lamp', 'ceiling light', 'arc lamp', 'light'],
                        'variants': {'dome-green': dict(), 'dome-black': dict(color='#1b1b1c'), 'cone-white': dict(kind='cone', color='#eeeeea'), 'glass-globe': dict(kind='glass')}},
    'hd-floor-lamp': {'label': 'Floor lamp (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'shade color', 'secondaryColor': 'fabric shade'}, 'build': build_floor_lamp,
                      'tags': ['floor lamp', 'standing lamp', 'arc lamp', 'light'],
                      'variants': {'column-brass': dict(), 'column-black': dict(finish='black', shade='#e9e3d6'), 'arc-marble': dict(kind='arc')}},
    'hd-mirror': {'label': 'Mirror (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {}, 'build': build_mirror,
                  'tags': ['mirror', 'floor mirror', 'vanity mirror', 'looking glass'],
                  'variants': {'arch-brass': dict(frame='brass'), 'rect-black': dict(shape='rect'), 'arch-oak': dict(frame='wood'), 'vanity-round': dict(kind='vanity', frame='brass')}},
    'hd-picture-frame': {'label': 'Picture frame (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {}, 'build': build_frame,
                         'tags': ['picture frame', 'frame', 'art', 'painting', 'print', 'poster'],
                         'variants': {'oak-abstract': dict(frame='wood', art=0), 'black-print': dict(frame='black', art=1), 'gilt-classic': dict(frame='gilt', art=2, w=0.6, h=0.8, pattern='persian'),
                                      'black-landscape': dict(frame='black', art=3, w=0.8, h=0.55)}},
    'hd-cushion-set': {'label': 'Cushion set (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {}, 'build': build_cushions,
                       'tags': ['cushions', 'throw pillows', 'pillows', 'ottoman'],
                       'variants': {'warm-neutrals': dict(), 'blues': dict(colors=['#1f3550', '#9fb4c8', '#e7e0d0'], base='#cfc8bb', seed=4), 'autumn-boucle': dict(colors=['#b5532f', '#e7e0d2', '#c8962c'], boucle=True, seed=7)}},
    'hd-throw-blanket': {'label': 'Throw blanket (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {}, 'build': build_throw,
                         'tags': ['throw', 'blanket', 'knit blanket', 'bench'],
                         'variants': {'knit-camel': dict(), 'knit-grey': dict(color='#8c8f93', wood='walnut', seed=6), 'wool-green': dict(color='#4f6a52', boucle=False, wood='white-oak', seed=8)}},
    'hd-curtains': {'label': 'Curtains (HD)', 'category': 'furniture', 'sub': 'decor', 'options': {'color': 'curtain fabric'}, 'build': build_curtains,
                    'tags': ['curtains', 'drapes', 'window', 'curtain rod'],
                    'variants': {'linen-open': dict(), 'velvet-green-closed': dict(color='#2f4a3a', gather=0.0), 'white-sheer-black-rod': dict(color='#f0ede6', rod='black', gather=0.5)}},
}
