"""HD dining chairs, tables, beds, dressers/nightstands, bookshelves.
Solid-wood parts use baked grain (vertical parts 'wood_v', horizontal 'wood_h')."""
import math
from lib import core, cloth
from lib.mats import mat, assign

WOODS = {'oak': '#b48a5a', 'walnut': '#5e3b24', 'cherry': '#8a4a2c', 'ash': '#cbb08a', 'ebony': '#2a1d16', 'teak': '#8f5f34', 'white-oak': '#c9a87a', 'pine': '#c8a066'}

def wv(p):  # vertical grain
    return mat('wood_v', 'wood', color=WOODS.get(p.get('wood', 'oak'), p.get('wood')), axis='Z', ring=10, bump=0.25)
def wh(p, axis='X'):
    return mat('wood_h' if axis == 'X' else 'wood_hy', 'wood', color=WOODS.get(p.get('wood', 'oak'), p.get('wood')), axis=axis, ring=8, bump=0.25)

def chair_legs(p, w, d, h, splay=0.0, top=0.036, bottom=0.026, round_=False, inset=0.025):
    out = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (w / 2 - inset), sy * (d / 2 - inset)
            foot = (x + sx * splay, y + sy * splay, 0)
            if round_:
                o = core.post_between('leg', foot, (x, y, h), None, round_=True, r=bottom / 2)
            else:
                o = core.frustum('leg', (top, top), (bottom, bottom), 1.0, bevel=0)
                L = (core.Vector((x, y, h)) - core.Vector(foot)).length
                o.scale = (1, 1, L)
                q = core.Vector((0, 0, 1)).rotation_difference((core.Vector((x, y, h)) - core.Vector(foot)).normalized())
                o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = q; o.location = foot
                core.apply_transform([o]); core.add_bevel(o, 0.003, 2)
            assign(o, wv(p))
            out.append(o)
    return out

def build_chair(p):
    style = p.get('style', 'spindle')
    W, D, SH = p.get('w', 0.46), p.get('d', 0.48), p.get('seat_h', 0.46)
    seat_t = 0.035
    metal = style == 'industrial'
    if metal:
        mm = mat('paint_primary_metal', 'painted_metal', color=p.get('color', '#2b2d2f'), tint=True, metal=0.6, wear=0.25, rough=0.4)
        for sx in (-1, 1):
            for sy in (-1, 1):
                o = core.post_between('leg', (sx * (W / 2 - 0.02) + sx * 0.03, sy * (D / 2 - 0.02) + sy * 0.03, 0), (sx * (W / 2 - 0.02), sy * (D / 2 - 0.02), SH - seat_t), (0.022, 0.022), bevel=0.002)
                assign(o, mm)
        k = 1 - 0.16 / (SH - seat_t)  # legs splay 0.03 outward at the floor → position at rail height
        for sy in (-1, 1):
            xx = W / 2 - 0.02 + 0.03 * k
            yy = sy * (D / 2 - 0.02 + 0.03 * k)
            o = core.post_between('rail', (-xx, yy, 0.16), (xx, yy, 0.16), (0.014, 0.014), bevel=0.001); assign(o, mm)
        # back: two posts continuing up + curved backrest panel
        for sx in (-1, 1):
            o = core.post_between('bpost', (sx * (W / 2 - 0.02), D / 2 - 0.02, SH - seat_t - 0.01), (sx * (W / 2 - 0.03), D / 2 + 0.02, SH + 0.36), (0.02, 0.02), bevel=0.002); assign(o, mm)
        bp = core.soft_box('backrest', (W - 0.04, 0.02, 0.14), at=(0, D / 2 + 0.03, SH + 0.28), n=14, rot=(math.radians(-8), 0, 0))
        assign(bp, wh(p))
        st = core.soft_box('seat', (W + 0.02, D + 0.02, seat_t), at=(0, 0, SH - seat_t / 2), n=12, subsurf=1)
        assign(st, wh(p))
        return
    legs_h = SH - seat_t
    round_ = style in ('windsor', 'bentwood')
    if style == 'shell':
        # Moulded shell (seat + back in ONE continuous surface) on a wooden mounting plate;
        # four splayed dowel legs run from the floor into the plate corners.
        plate_z = legs_h - 0.02
        pw, pd = W * 0.55, D * 0.5
        plate = core.soft_box('mount_plate', (pw, pd, 0.024), at=(0, 0, plate_z + 0.012), n=12, subsurf=0)
        assign(plate, wh(p))
        for sx in (-1, 1):
            for sy in (-1, 1):
                top = (sx * (pw / 2 - 0.02), sy * (pd / 2 - 0.02), plate_z + 0.012)
                foot = (sx * (W / 2 + 0.01), sy * (D / 2 + 0.01), 0)
                o = core.post_between('leg', foot, top, None, round_=True, r=0.015)
                assign(o, wv(p))
        # cross braces (black steel) between the legs, touching them at mid height
        mm = mat('metal_brace', 'metal', color='#1c1c1e', metal=1.0, rough=0.35)
        for sx, sy in ((1, 1), (1, -1)):
            k = 0.45
            a = (sx * ((W / 2 + 0.01) * (1 - k) + (pw / 2 - 0.02) * k), sy * ((D / 2 + 0.01) * (1 - k) + (pd / 2 - 0.02) * k), (plate_z + 0.012) * k)
            b = (-a[0], -a[1], a[2])
            o = core.post_between('brace', a, b, None, round_=True, r=0.005, verts=10); assign(o, mm)
        # shell: swept profile (seat curving up into the back) → solidified surface
        prof = [(-D / 2 + 0.01, plate_z + 0.06), (-D / 2 + 0.05, plate_z + 0.03), (0.0, plate_z + 0.024), (D / 2 - 0.08, plate_z + 0.035),
                (D / 2 - 0.02, plate_z + 0.1), (D / 2 + 0.01, plate_z + 0.25), (D / 2 + 0.04, plate_z + 0.42), (D / 2 + 0.05, plate_z + 0.48)]
        nx = 16
        verts, faces = [], []
        for i, (y, z) in enumerate(prof):
            t = i / (len(prof) - 1)
            hw = W / 2 * (1 - 0.1 * t) + 0.01
            for k in range(nx + 1):
                u = k / nx * 2 - 1
                x = u * hw
                verts.append((x, y - 0.02 * (u * u) * t, z + 0.05 * abs(u) ** 2.5 * (1 - t * 0.5)))
        for i in range(len(prof) - 1):
            for k in range(nx):
                a = i * (nx + 1) + k
                faces.append((a, a + 1, a + nx + 2, a + nx + 1))
        sh = core.from_pydata('shell', verts, faces)
        sol = sh.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.012; sol.offset = 1.0
        core.add_subsurf(sh, 2)
        assign(sh, mat('plastic_primary', 'plastic', color=p.get('color', '#e8e4dc'), tint=True, rough=0.35))
        return
    chair_legs(p, W, D, legs_h + 0.004, splay=0.025 if style == 'windsor' else 0.0, round_=round_)
    # aprons under the seat (connect legs)
    if style not in ('windsor', 'shell'):
        for sy in (-1, 1):
            o = core.soft_box('apron', (W - 0.06, 0.02, 0.07), at=(0, sy * (D / 2 - 0.025), legs_h - 0.035), n=16, subsurf=0); assign(o, wh(p))
        for sx in (-1, 1):
            o = core.soft_box('apron', (0.02, D - 0.06, 0.07), at=(sx * (W / 2 - 0.025), 0, legs_h - 0.035), n=16, subsurf=0); assign(o, wh(p, 'Y'))
    # stretchers
    if style in ('spindle', 'ladder', 'windsor'):
        for sx in (-1, 1):
            o = core.post_between('str', (sx * (W / 2 - 0.025), -D / 2 + 0.03, 0.17), (sx * (W / 2 - 0.025), D / 2 - 0.03, 0.17), None, round_=True, r=0.011); assign(o, wh(p, 'Y'))
        o = core.post_between('str', (-W / 2 + 0.03, 0, 0.17), (W / 2 - 0.03, 0, 0.17), None, round_=True, r=0.011); assign(o, wh(p))
        # cross stretcher must touch the side ones: side stretchers run along y at x=±(W/2-0.025) → crossing at y=0 ✓
    # seat
    if style == 'upholstered' or p.get('pad'):
        base = core.soft_box('seatbase', (W, D, 0.02), at=(0, 0, legs_h + 0.01), n=14, subsurf=0); assign(base, wh(p))
        pad = core.soft_box('pad', (W - 0.01, D - 0.01, 0.06), at=(0, -0.0, legs_h + 0.02 + 0.03 - 0.004), n=5, puff=0.008)
        assign(pad, mat('fabric_primary', p.get('fabric', 'fabric'), color=p.get('color', '#8b7d6b'), tint=True, bump=0.6))
    else:
        seat = core.soft_box('seat', (W + 0.01, D + 0.01, seat_t), at=(0, 0, legs_h + seat_t / 2), n=10, sag=0.006)
        assign(seat, wh(p))
    # back
    top = SH + p.get('back_h', 0.42)
    for sx in (-1, 1):
        x = sx * (W / 2 - 0.025)
        if round_:
            o = core.post_between('bpost', (x, D / 2 - 0.025, legs_h), (x * 0.95, D / 2 + 0.04, top), None, round_=True, r=0.015)
        else:
            o = core.post_between('bpost', (x, D / 2 - 0.025, legs_h - 0.07), (x, D / 2 + 0.03, top), (0.034, 0.03), bevel=0.004)
        assign(o, wv(p))
    def rail(z, h, name='rail'):
        y = D / 2 - 0.025 + (z - legs_h) / (top - legs_h) * 0.055
        o = core.soft_box(name, (W - 0.05 + 0.012, 0.024, h), at=(0, y, z), n=10, puff=-0.006, puff_axis=1, rot=(math.radians(-7), 0, 0), subsurf=1)
        assign(o, wh(p))
        return y
    if style == 'ladder':
        for k in range(4):
            rail(SH + 0.1 + k * 0.095, 0.05)
    elif style == 'upholstered':
        y = D / 2 + 0.01
        bk = core.soft_box('backpad', (W - 0.05, 0.05, top - SH - 0.08), at=(0, y + 0.02, (top + SH + 0.06) / 2), n=5, puff=0.008, puff_axis=1, rot=(math.radians(-7), 0, 0))
        assign(bk, mat('fabric_primary', p.get('fabric', 'fabric'), color=p.get('color', '#8b7d6b'), tint=True, bump=0.6))
        rail(top - 0.03, 0.05)
    else:  # spindle / windsor / bentwood
        y_top = rail(top - 0.04, 0.08, 'toprail')
        n = p.get('spindles', 5)
        for k in range(n):
            x = (k - (n - 1) / 2) * (W - 0.12) / (n - 1)
            o = core.post_between('spindle', (x, D / 2 - 0.03, legs_h + seat_t - 0.005), (x, y_top, top - 0.06), None, round_=True, r=0.008, verts=12)
            assign(o, wv(p))

def build_table(p):
    kind = p.get('kind', 'dining')
    L, Wd, H = p.get('l', 1.8), p.get('w', 0.9), p.get('h', 0.75)
    t = p.get('top_t', 0.04)
    top_mat = mat('marble_top', 'marble', color=p.get('marble', '#eeebe5'), vein=p.get('vein', '#77706a')) if p.get('top') == 'marble' else (
        mat('glass_top', 'glass', color='#cfe3dc', alpha=0.42) if p.get('top') == 'glass' else wh(p))
    if p.get('round'):
        top = core.lathe('top', [(0, H - t), (L / 2 - 0.01, H - t), (L / 2, H - t + 0.008), (L / 2, H - 0.008), (L / 2 - 0.01, H), (0, H)], steps=96)
    else:
        top = core.soft_box('top', (L, Wd, t), at=(0, 0, H - t / 2), n=18, subsurf=1)
    assign(top, top_mat)
    base = p.get('base', 'legs')
    under = H - t
    if base == 'pedestal':
        mm = mat('brass_base', 'metal', color=p.get('metal', '#b08d57'), metal=1.0, rough=0.28) if p.get('metal_kind', 'brass') == 'brass' else mat('metal_base', 'painted_metal', color='#1d1e20', metal=0.5, wear=0.05)
        ped = core.lathe('pedestal', [(0, 0), (L * 0.22, 0), (L * 0.22, 0.012), (L * 0.2, 0.025), (0.06, 0.07), (0.045, 0.12), (0.04, under - 0.06), (0.07, under - 0.01), (0.07, under + 0.002), (0, under + 0.002)], steps=64)
        assign(ped, mm)
        return
    if base == 'trestle':
        for sx in (-1, 1):
            x = sx * (L / 2 - 0.25)
            foot = core.soft_box('foot', (0.08, Wd - 0.1, 0.06), at=(x, 0, 0.03), n=14, subsurf=0); assign(foot, wh(p, 'Y'))
            post = core.soft_box('post', (0.07, 0.14, under - 0.12), at=(x, 0, 0.06 + (under - 0.12) / 2), n=14, subsurf=0); assign(post, wv(p))
            cap = core.soft_box('cap', (0.08, Wd - 0.16, 0.06), at=(x, 0, under - 0.03), n=14, subsurf=0); assign(cap, wh(p, 'Y'))
        beam = core.soft_box('beam', (L - 0.5, 0.05, 0.08), at=(0, 0, 0.3), n=14, subsurf=0); assign(beam, wh(p))
        return
    leg_top = p.get('leg', 0.07)
    leg_bot = leg_top * p.get('taper', 0.65)
    inset = 0.06 if not p.get('round') else 0
    if p.get('round'):
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            x, y = math.cos(a) * L * 0.28, math.sin(a) * L * 0.28
            o = core.frustum('leg', (leg_top, leg_top), (leg_bot, leg_bot), under + 0.003, at=(x, y, 0)); assign(o, wv(p))
        ring = core.lathe('apron', [(L * 0.28 + 0.03, under - 0.08), (L * 0.28 + 0.03, under + 0.002), (L * 0.28 - 0.01, under + 0.002), (L * 0.28 - 0.01, under - 0.08)], steps=64, close_top=False)
        assign(ring, wh(p))
        return
    metal_legs = p.get('metal_legs')
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (L / 2 - inset), sy * (Wd / 2 - inset)
            if metal_legs:
                o = core.post_between('leg', (x, y, 0), (x, y, under + 0.003), (0.03, 0.03), bevel=0.003)
                assign(o, mat('metal_legs', 'painted_metal', color='#18191b', metal=0.6, wear=0.04, rough=0.35))
            else:
                o = core.frustum('leg', (leg_top, leg_top), (leg_bot, leg_bot), under + 0.003, at=(x, y, 0)); assign(o, wv(p))
    if p.get('apron', True):
        ah = 0.09
        for sy in (-1, 1):
            o = core.soft_box('apron', (L - 2 * inset - 0.02, 0.022, ah), at=(0, sy * (Wd / 2 - inset), under - ah / 2 + 0.002), n=16, subsurf=0); assign(o, wh(p))
        for sx in (-1, 1):
            o = core.soft_box('apron', (0.022, Wd - 2 * inset - 0.02, ah), at=(sx * (L / 2 - inset), 0, under - ah / 2 + 0.002), n=16, subsurf=0); assign(o, wh(p, 'Y'))
    if p.get('shelf'):
        o = core.soft_box('shelf', (L - 2 * inset + 0.02, Wd - 2 * inset + 0.02, 0.022), at=(0, 0, 0.12), n=16, subsurf=0); assign(o, wh(p))

def drawer_front(p, w, h, at, handle='knob'):
    """Drawer front panel (slightly proud) + handle touching it. at = centre of front face plane (y = front)."""
    x, y, z = at
    f = core.soft_box('drawer', (w, 0.02, h), at=(x, y - 0.01, z), n=16, subsurf=0)
    assign(f, wh(p))
    hm = mat('brass_handle', 'metal', color=p.get('handle_color', '#b8955a'), metal=1.0, rough=0.25)
    if handle == 'knob':
        k = core.lathe('knob', [(0, 0), (0.008, 0), (0.008, 0.012), (0.016, 0.02), (0.017, 0.028), (0, 0.03)], at=(x, y - 0.02 + 0.001, z), rot=(math.radians(90), 0, 0), steps=24)
        assign(k, hm)
    elif handle == 'bar':
        L = min(0.22, w * 0.45)
        b = core.tube_path('bar', [(x - L / 2, y - 0.02, z), (x - L / 2, y - 0.045, z), (x + L / 2, y - 0.045, z), (x + L / 2, y - 0.02, z)], 0.006)
        assign(b, hm)
    elif handle == 'cup':
        c = core.soft_box('cup', (0.1, 0.02, 0.03), at=(x, y - 0.024, z + h * 0.3), n=6, puff=0.0)
        assign(c, hm)

def build_case(p):
    """Dresser / nightstand / sideboard: carcass, top, drawers with handles, legs or plinth."""
    W, D, H = p.get('w', 1.2), p.get('d', 0.48), p.get('h', 0.85)
    leg_h = p.get('leg_h', 0.12)
    body_h = H - leg_h - 0.03
    carcass = core.soft_box('carcass', (W, D, body_h), at=(0, 0, leg_h + body_h / 2), n=20, subsurf=0)
    assign(carcass, wh(p))
    top = core.soft_box('top', (W + 0.02, D + 0.02, 0.03), at=(0, 0, leg_h + body_h + 0.015 - 0.002), n=16, subsurf=1)
    assign(top, mat('marble_top', 'marble') if p.get('top') == 'marble' else wh(p))
    cols, rows = p.get('cols', 2), p.get('rows', 3)
    gap = 0.006
    fw = (W - 0.04 - gap * (cols - 1)) / cols
    fh = (body_h - 0.04 - gap * (rows - 1)) / rows
    for c in range(cols):
        for r in range(rows):
            x = -W / 2 + 0.02 + fw / 2 + c * (fw + gap)
            z = leg_h + 0.02 + fh / 2 + r * (fh + gap)
            drawer_front(p, fw, fh, (x, -D / 2, z), p.get('handle', 'knob'))
    if p.get('legs', 'taper') == 'taper':
        for sx in (-1, 1):
            for sy in (-1, 1):
                o = core.frustum('leg', (0.04, 0.04), (0.026, 0.026), leg_h + 0.004, at=(sx * (W / 2 - 0.04), sy * (D / 2 - 0.04), 0), rot=(0, 0, 0))
                assign(o, wv(p))
    else:
        o = core.soft_box('plinth', (W - 0.04, D - 0.04, leg_h + 0.004), at=(0, 0, (leg_h + 0.004) / 2), n=20, subsurf=0)
        assign(o, wh(p))

def build_bed(p):
    W, L = p.get('w', 1.6), p.get('l', 2.05)
    leg_h = p.get('leg_h', 0.18)
    rail_h = 0.2
    fabric = p.get('frame') == 'upholstered'
    fm = mat('fabric_primary', 'fabric', color=p.get('color', '#9a9188'), tint=True, bump=0.6) if fabric else wh(p, 'Y')
    for sx in (-1, 1):  # side rails
        o = core.soft_box('rail', (0.06, L, rail_h), at=(sx * (W / 2 + 0.03), 0, leg_h + rail_h / 2), n=10 if fabric else 18, subsurf=1 if fabric else 0); assign(o, fm)
    o = core.soft_box('footrail', (W + 0.12, 0.06, rail_h + (0.1 if fabric else 0)), at=(0, -L / 2 - 0.03, leg_h + rail_h / 2 + (0.05 if fabric else 0)), n=10 if fabric else 18, subsurf=1 if fabric else 0)
    assign(o, mat('fabric_primary', 'fabric') if fabric else wh(p))
    # headboard
    hb_h = p.get('head_h', 1.1)
    if fabric:
        hb = core.soft_box('headboard', (W + 0.16, 0.1, hb_h - leg_h + 0.02), at=(0, L / 2 + 0.05, leg_h + (hb_h - leg_h) / 2), n=5, puff=0.015, puff_axis=1, cuts=14)
        assign(hb, fm)
    else:
        hb = core.soft_box('headboard', (W + 0.12, 0.05, hb_h - 0.04), at=(0, L / 2 + 0.025, (hb_h - 0.04) / 2 + 0.04), n=18, subsurf=1); assign(hb, wh(p))
    # legs
    for sx in (-1, 1):
        for sy in (-1, 1):
            if fabric and sy > 0:
                continue  # headboard reaches the floor? no — give it legs too
            o = core.frustum('leg', (0.06, 0.06), (0.045, 0.045), leg_h + 0.004, at=(sx * (W / 2 + 0.02), sy * (L / 2 - 0.0), 0))
            assign(o, wv(p))
    if fabric:
        for sx in (-1, 1):
            o = core.frustum('leg', (0.06, 0.06), (0.045, 0.045), leg_h + 0.004, at=(sx * (W / 2 + 0.02), L / 2 + 0.05, 0)); assign(o, wv(p))
    # slats support (hidden) + mattress resting on rails' inner ledge
    mz = leg_h + rail_h - 0.06
    ms = core.soft_box('slats', (W, L, 0.03), at=(0, 0, mz - 0.015), n=20, subsurf=0); assign(ms, wh(p))
    mt_h = 0.24
    # mattress: ticking base + fitted sheet over the top and sides
    tick = core.soft_box('mattress_base', (W - 0.01, L - 0.01, 0.05), at=(0, 0, mz + 0.021), n=10, subsurf=1)
    assign(tick, mat('mattress_ticking', 'fabric', color='#dcd8d0', bump=0.5))
    sheet_c = p.get('sheet', '#f3f1ec')
    fh = mt_h - 0.035
    fitted = core.soft_box('fitted_sheet', (W - 0.006, L - 0.006, fh), at=(0, 0, mz + 0.035 + fh / 2 - 0.008), n=6, cuts=14)
    sheet_m = mat('sheet_cotton', 'fabric', color=sheet_c, bump=0.5, sheen=0.4)
    assign(fitted, sheet_m)
    top = mz + 0.035 - 0.008 + fh            # top surface of the fitted sheet
    # duvet: covers ~70 % from the foot, rolls over the edges, hangs down the sides and the foot
    xh = (W - 0.006) / 2
    foot_y = -(L - 0.006) / 2
    head_y = foot_y + (L - 0.006) * 0.7
    foot_top = leg_h + rail_h + (0.1 if fabric else 0)
    hang_side = top - mz - 0.02
    hang_foot = max(0.05, top - foot_top - 0.07)
    duvet = cloth.drape('duvet', top, xh, foot_y, head_y, hang_side, hang_foot, edge_r=0.05, thickness=0.035,
                        flare_side=0.1, flare_start=0.1, quilt=0.012, folds=0.014, seed=int(W * 10))
    assign(duvet, mat('fabric_secondary_duvet', 'fabric', color=p.get('bedding', '#d9d4ca'), tint=True, bump=0.8, sheen=0.2))
    # turned-down top sheet folded back over the duvet's head edge, with a soft roll at the fold
    band = cloth.drape('sheet_fold', top + 0.05, xh + 0.01, head_y - 0.26, head_y, 0.1, 0.0, edge_r=0.05, thickness=0.008, folds=0.008, seed=3, foot=False)
    assign(band, sheet_m)
    roll = core.tube_path('sheet_roll', [(-xh - 0.04, head_y, top + 0.04), (0, head_y + 0.004, top + 0.045), (xh + 0.04, head_y, top + 0.04)], 0.022)
    assign(roll, sheet_m)
    # pillows resting on the sheet, leaning on the headboard
    n_p = 2 if W > 1.2 else 1
    pw = min(0.7, (W - 0.12) / n_p - 0.02)
    pm = mat('pillow_fabric', 'fabric', color=sheet_c, bump=0.6, sheen=0.4)
    for k in range(n_p):
        x = 0 if n_p == 1 else (k - 0.5) * (W / 2)
        pl, pip = cloth.pillow('pillow', pw, 0.46, 0.17, at=(x, L / 2 - 0.27, top + 0.045), rot=(math.radians(-14), 0, 0), seed=k)
        assign(pl, pm); assign(pip, pm)
    if p.get('throw'):
        th = cloth.drape('throw', top + 0.05, xh + 0.05, foot_y + 0.08, foot_y + 0.55, 0.2, 0.0, edge_r=0.05, thickness=0.02, folds=0.016, seed=9, foot=False)
        assign(th, mat('throw_knit', 'fabric', color=p['throw'], bump=1.0, boucle=True, sheen=0.3))

TYPES = {
    'hd-dining-chair': {
        'label': 'Dining chair (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'seat / shell color'},
        'build': build_chair,
        'variants': {
            'oak-spindle': dict(style='spindle', wood='oak'),
            'walnut-upholstered': dict(style='upholstered', wood='walnut', color='#6b5b4b'),
            'ash-ladder-back': dict(style='ladder', wood='ash'),
            'windsor-ebony': dict(style='windsor', wood='ebony', spindles=7),
            'shell-white': dict(style='shell', wood='white-oak', color='#ecebe6'),
            'industrial-black': dict(style='industrial', wood='walnut', color='#2a2b2d'),
            'cherry-padded': dict(style='spindle', wood='cherry', pad=True, color='#3c5a46', spindles=4),
        },
    },
    'hd-table': {
        'label': 'Table (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {},
        'build': build_table,
        'variants': {
            'oak-dining': dict(wood='oak', l=1.8, w=0.9),
            'walnut-trestle': dict(wood='walnut', base='trestle', l=2.0, w=0.95, top_t=0.05),
            'marble-round-pedestal': dict(round=True, l=1.1, top='marble', base='pedestal', top_t=0.03),
            'oak-coffee': dict(wood='white-oak', l=1.2, w=0.6, h=0.42, leg=0.05, shelf=True, apron=False),
            'marble-side': dict(round=True, l=0.5, h=0.55, top='marble', base='pedestal', metal_kind='black', top_t=0.025),
            'industrial-dining': dict(wood='teak', l=1.6, w=0.85, metal_legs=True, apron=False, top_t=0.05),
            'glass-coffee': dict(l=1.1, w=0.6, h=0.4, top='glass', metal_legs=True, apron=False, top_t=0.012),
        },
    },
    'hd-dresser': {
        'label': 'Dresser & cabinet (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {},
        'build': build_case,
        'variants': {
            'oak-six-drawer': dict(wood='oak', handle='knob'),
            'walnut-mid-century': dict(wood='walnut', w=1.4, h=0.8, cols=3, rows=2, handle='bar', leg_h=0.2),
            'white-oak-nightstand': dict(wood='white-oak', w=0.5, d=0.4, h=0.58, cols=1, rows=2, handle='knob', leg_h=0.14),
            'ebony-sideboard': dict(wood='ebony', w=1.8, d=0.45, h=0.78, cols=4, rows=1, handle='bar', legs='plinth', leg_h=0.08, top='marble'),
            'cherry-tall-chest': dict(wood='cherry', w=0.9, h=1.25, cols=1, rows=5, handle='cup', leg_h=0.1),
        },
    },
    'hd-bed': {
        'label': 'Bed (HD)', 'category': 'furniture', 'sub': 'furniture', 'options': {'color': 'headboard fabric', 'secondaryColor': 'duvet'},
        'build': build_bed,
        'variants': {
            'oak-double': dict(wood='oak', w=1.4, throw='#8a6e4b'),
            'walnut-queen': dict(wood='walnut', w=1.6, bedding='#8a9aa5'),
            'upholstered-king': dict(frame='upholstered', w=1.8, color='#8b8378', wood='ebony', head_h=1.25, bedding='#e8e2d6', throw='#5d6b5a'),
            'pine-single': dict(wood='pine', w=0.95, head_h=0.9, bedding='#b0503c'),
        },
    },
}
