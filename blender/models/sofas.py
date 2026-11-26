"""HD sofas & armchairs: soft upholstered shapes (superellipsoid cushions + subdivision),
baked woven fabric / leather, wood or metal legs. All parts rest on each other."""
import math
from lib import core, cloth
from lib.mats import mat, assign

def legs(p, w, d, z_top, inset=0.07):
    style = p.get('legs', 'taper')
    h = z_top
    out = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (w / 2 - inset), sy * (d / 2 - inset)
            if style == 'taper':
                o = core.lathe('leg', [(0.0, 0), (0.016, 0), (0.017, 0.004), (0.025, h * 0.85), (0.028, h + 0.01), (0.0, h + 0.01)], at=(x, y, 0), steps=24)
                assign(o, mat('wood_legs', 'wood', color=p.get('wood', '#7a4f2c'), axis='Z', ring=18))
            elif style == 'metal':
                o = core.lathe('leg', [(0.0, 0), (0.012, 0), (0.014, 0.004), (0.014, h + 0.01), (0.0, h + 0.01)], at=(x, y, 0), steps=20)
                assign(o, mat('metal_legs', 'metal', color=p.get('metal', '#202124'), metal=1.0, rough=0.35))
            elif style == 'bun':
                o = core.sphere('leg', 1, at=(x, y, h / 2), seg=24, rings=12, scale=(0.045, 0.045, h / 2 + 0.006))
                assign(o, mat('wood_legs', 'wood', color=p.get('wood', '#4a2c18'), axis='Z', ring=18))
            else:  # plinth: hidden recessed base
                o = core.box('plinth', (w - 0.16, d - 0.16, h + 0.01), at=(0, 0, (h + 0.01) / 2), bevel=0.005)
                assign(o, mat('plinth_black', 'plastic', color='#151515', rough=0.6))
                return [o]
            out.append(o)
    return out

def build_sofa(p):
    seats = p.get('seats', 3)
    sw = p.get('seat_w', 0.62)
    arm = p.get('arm_w', 0.2)
    W = seats * sw + 2 * arm
    D = p.get('depth', 0.92)
    leg_h = p.get('leg_h', 0.13)
    base_h = p.get('base_h', 0.2)
    fabric_kind = p.get('fabric', 'fabric')
    col = p.get('color', '#6f7a83')
    up = mat('fabric_primary', fabric_kind, color=col, tint=True, boucle=p.get('boucle', False), bump=0.6 if fabric_kind == 'fabric' else 0.4, grain=110)
    z0 = leg_h
    # frame / base
    base = core.soft_box('base', (W - 0.02, D, base_h), at=(0, 0, z0 + base_h / 2), n=10)
    assign(base, up)
    zt = z0 + base_h  # top of base
    # arms
    arm_h = p.get('arm_h', 0.64) - zt
    for s in (-1, 1):
        if p.get('arm_style') == 'rolled':
            a = core.soft_box('arm', (arm, D, arm_h), at=(s * (W / 2 - arm / 2), 0, zt + arm_h / 2 - 0.005), n=4.2, puff=0.015, puff_axis=0)
        else:
            a = core.soft_box('arm', (arm, D, arm_h), at=(s * (W / 2 - arm / 2), 0, zt + arm_h / 2 - 0.005), n=8)
        assign(a, up)
    # back rest (behind back cushions)
    back_t = 0.2
    back_h = p.get('back_h', 0.82) - zt
    back = core.soft_box('back', (W - 2 * arm + 0.02, back_t, back_h), at=(0, D / 2 - back_t / 2, zt + back_h / 2 - 0.005), n=8, taper=0.0)
    assign(back, up)
    # seat cushions (rest on base, between arms, in front of back)
    ch = p.get('cushion_h', 0.16)
    cd = D - back_t + 0.01
    for i in range(seats):
        x = -W / 2 + arm + sw * (i + 0.5)
        c = core.soft_box('seat', (sw - 0.004, cd, ch), at=(x, -D / 2 + cd / 2, zt + ch / 2 - 0.01), n=5.5, puff=0.018, cuts=12)
        assign(c, up)
    # back cushions: leaning on the back rest, bottoms on the seat cushions
    if p.get('back_cushions', True):
        bh = p.get('back_h', 0.82) - (zt + ch) + 0.02
        bt = 0.17
        tilt = math.radians(12)
        for i in range(seats):
            x = -W / 2 + arm + sw * (i + 0.5)
            yc = D / 2 - back_t - bt / 2 + 0.035 + math.sin(tilt) * bh / 2
            c = core.soft_box('backc', (sw - 0.01, bt, bh), at=(x, yc, zt + ch - 0.02 + bh / 2 * math.cos(tilt)), n=4.5, puff=0.025, puff_axis=1, cuts=12, rot=(-tilt, 0, 0))
            assign(c, up)
    # throw pillows
    for i, s in enumerate(p.get('pillows', [])):
        sx = -1 if i == 0 else 1
        pc = mat('fabric_secondary', 'fabric', color=s, tint=True, bump=0.7)
        # stands on the seat cushion, leaning back onto the back cushions
        c, pip = cloth.pillow('pillow', 0.44, 0.44, 0.15, at=(sx * (W / 2 - arm - 0.26), D / 2 - back_t - 0.2, zt + ch + 0.2),
                              rot=(math.radians(70), 0, sx * math.radians(10)), seed=i)
        assign(c, pc); assign(pip, pc)
    legs(p, W, D, z0 + 0.01)

def build_armchair(p):
    p = dict(p); p.setdefault('seats', 1); p.setdefault('seat_w', 0.6); p.setdefault('depth', 0.86)
    build_sofa(p)

TYPES = {
    'hd-sofa': {
        'label': 'Sofa (HD)', 'category': 'furniture', 'sub': 'furniture',
        'options': {'color': 'upholstery color', 'secondaryColor': 'pillow color'},
        'build': build_sofa,
        'variants': {
            'modern-grey': dict(seats=3, color='#7d858c', legs='taper', pillows=['#c9b79c', '#c9b79c']),
            'loveseat-navy': dict(seats=2, color='#243a5e', legs='metal', arm_w=0.17, pillows=['#d9cdb4']),
            'rolled-arm-sage': dict(seats=3, color='#8a9a7b', legs='bun', arm_style='rolled', arm_h=0.66, wood='#3b2416'),
            'leather-cognac': dict(seats=3, fabric='leather', color='#8a4b22', legs='metal', metal='#1b1b1b', back_h=0.8),
            'low-plinth-cream': dict(seats=3, color='#d8cfbe', legs='plinth', leg_h=0.06, base_h=0.22, arm_h=0.6, back_h=0.76, pillows=['#a0522d', '#a0522d']),
            'four-seat-charcoal': dict(seats=4, color='#3a3c40', legs='taper', wood='#c49a6c', pillows=['#e2c044', '#e2c044']),
        },
    },
    'hd-armchair': {
        'label': 'Armchair (HD)', 'category': 'furniture', 'sub': 'furniture',
        'options': {'color': 'upholstery color'},
        'build': build_armchair,
        'variants': {
            'club-leather': dict(fabric='leather', color='#5a2e18', arm_w=0.24, arm_style='rolled', legs='bun', arm_h=0.66),
            'modern-mustard': dict(color='#c8962c', legs='taper', arm_w=0.14),
            'lounge-teal': dict(color='#2f6c6a', legs='metal', arm_w=0.16, depth=0.9),
            'cream-boucle': dict(color='#e7e0d2', legs='plinth', leg_h=0.06, boucle=True, arm_w=0.2),
        },
    },
}
