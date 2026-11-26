"""HD small buildings: garden sheds and a log cabin facade-complete cabin. Board siding,
shingle roofs, trimmed door/window with glass, hinges and handle — all parts connected."""
import math, bpy, bmesh
from lib import core
from lib.mats import mat, assign

def gable_walls(W, D, H, ridge):
    """Closed wall prism with gable ends (front/back = ±Y)."""
    pts = [(-W / 2, 0), (W / 2, 0), (W / 2, H), (0, H + ridge), (-W / 2, H)]
    o = core.extrude_outline('walls', pts, D, rot=(math.radians(90), 0, 0))
    o.location = (0, D / 2, 0)
    return o

def build_shed(p):
    W, D, H = p.get('w', 2.4), p.get('d', 1.8), p.get('h', 2.0)
    ridge = p.get('ridge', 0.6)
    walls = gable_walls(W, D, H, ridge)
    assign(walls, mat('paint_primary_siding', 'planks', color=p.get('color', '#7d3326'), tint=True, board=0.14, bump=0.5))
    trim_m = mat('trim_white', 'painted_metal', color=p.get('trim', '#ecebe5'), metal=0.0, wear=0.1, rough=0.55)
    # corner trims
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = core.soft_box('corner', (0.07, 0.07, H), at=(sx * (W / 2 - 0.02), sy * (D / 2 - 0.02), H / 2), n=12, subsurf=0); assign(o, trim_m)
    # roof: two slabs meeting at the ridge, overhanging, resting on the wall tops
    ov = 0.18
    ang = math.atan2(ridge, W / 2)
    half = (W / 2 + ov) / math.cos(ang)
    roof_m = mat('roof_shingle', 'shingle', color=p.get('roof', '#3f3d3a'), bump=0.8)
    for s in (-1, 1):
        o = core.soft_box('roof', (half, D + 2 * ov, 0.05), n=14, subsurf=0)
        o.rotation_euler = (0, s * ang, 0)
        o.location = (s * (W / 2 + ov) / 2, 0, H + ridge - (ridge + ov * math.tan(ang)) / 2 + 0.028 / math.cos(ang))
        assign(o, roof_m)
    cap = core.soft_box('ridge_cap', (0.16, D + 2 * ov, 0.05), at=(0, 0, H + ridge + 0.04), n=6, subsurf=1); assign(cap, roof_m)
    # fascia boards under the roof edges (gable ends)
    # door on the front (-Y): frame trims + door leaf + handle + hinges
    dw, dh = p.get('door_w', 0.9), min(1.85, H - 0.1)
    fy = -D / 2
    door = core.soft_box('door', (dw, 0.04, dh), at=(-W * 0.12 if p.get('window', True) else 0, fy - 0.01, dh / 2 + 0.02), n=16, subsurf=0)
    assign(door, mat('paint_secondary_door', 'planks', color=p.get('door', '#2f4f3e'), tint=True, board=0.11, bump=0.5))
    dx = door.location.x
    for x in (dx - dw / 2 - 0.035, dx + dw / 2 + 0.035):
        o = core.soft_box('door_trim', (0.07, 0.03, dh + 0.07), at=(x, fy - 0.012, (dh + 0.07) / 2), n=12, subsurf=0); assign(o, trim_m)
    o = core.soft_box('door_trim', (dw + 0.14, 0.03, 0.07), at=(dx, fy - 0.012, dh + 0.055), n=12, subsurf=0); assign(o, trim_m)
    # Z-brace on the door
    for z in (0.3, dh - 0.25):
        o = core.soft_box('brace', (dw - 0.1, 0.025, 0.1), at=(dx, fy - 0.04, z), n=12, subsurf=0); assign(o, mat('paint_secondary_door', 'planks'))
    iron = mat('iron', 'painted_metal', color='#1d1d1d', metal=0.8, wear=0.3)
    for z in (0.3, dh - 0.25):
        o = core.soft_box('hinge', (0.28, 0.012, 0.035), at=(dx - dw / 2 + 0.12, fy - 0.058, z), n=6, subsurf=0); assign(o, iron)
    hd = core.tube_path('handle', [(dx + dw / 2 - 0.1, fy - 0.03, 1.05), (dx + dw / 2 - 0.1, fy - 0.07, 1.03), (dx + dw / 2 - 0.1, fy - 0.07, 0.87), (dx + dw / 2 - 0.1, fy - 0.03, 0.85)], 0.008)
    assign(hd, iron)
    if p.get('window', True):
        ww, wh = 0.6, 0.55
        wx, wz = W * 0.27, 1.25
        frame = core.soft_box('window_frame', (ww + 0.1, 0.05, wh + 0.1), at=(wx, fy - 0.015, wz), n=14, subsurf=0)
        assign(frame, trim_m)
        glass = core.soft_box('window_glass', (ww, 0.02, wh), at=(wx, fy - 0.035, wz), n=20, subsurf=0)
        assign(glass, mat('glass_window', 'glass', color='#26343a', alpha=0.7, rough=0.03))
        for (sx, sz, a, b) in ((ww, 0.03, 0, 0), (0.03, wh, 0, 0)):
            o = core.soft_box('muntin', (sx, 0.02, sz), at=(wx, fy - 0.048, wz), n=10, subsurf=0); assign(o, trim_m)
        sill = core.soft_box('sill', (ww + 0.18, 0.08, 0.035), at=(wx, fy - 0.035, wz - wh / 2 - 0.06), n=10, subsurf=0); assign(sill, trim_m)
        if p.get('planter'):
            box = core.soft_box('planter', (ww + 0.1, 0.16, 0.14), at=(wx, fy - 0.12, wz - wh / 2 - 0.15), n=14, subsurf=0)
            assign(box, mat('paint_secondary_door', 'planks'))
            # brackets join planter to the wall
            for x in (wx - ww / 2, wx + ww / 2):
                o = core.soft_box('bracket', (0.03, 0.16, 0.03), at=(x, fy - 0.1, wz - wh / 2 - 0.23), n=6, subsurf=0); assign(o, iron)
            fl = core.soft_box('flowers', (ww, 0.12, 0.08), at=(wx, fy - 0.12, wz - wh / 2 - 0.05), n=3, subsurf=1)
            assign(fl, mat('flowers', 'foliage', color='#4f7a2e', bump=0.8))
    # foundation skids / concrete pad
    pad = core.soft_box('pad', (W + 0.3, D + 0.3, 0.1), at=(0, 0, -0.05 + 0.001), n=20, subsurf=0)
    assign(pad, mat('concrete', 'concrete', color='#9e9a92'))

TYPES = {
    'hd-shed': {'label': 'Garden shed (HD)', 'category': 'buildings', 'options': {'color': 'siding color', 'secondaryColor': 'door color'}, 'build': build_shed,
                'variants': {'barn-red': dict(), 'sage-green-planter': dict(color='#7f927a', door='#e8e2d2', roof='#5a4e44', planter=True),
                             'navy-small': dict(w=1.8, d=1.4, h=1.9, color='#28374d', door='#c49a5a', window=False),
                             'natural-cedar': dict(color='#9a6a44', door='#6b4a30', trim='#5c4330', roof='#6b5240')}},
}
