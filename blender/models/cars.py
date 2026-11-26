"""HD cars: subdivision-surface body lofted from cross-sections (smooth, real proportions),
tinted glass, door shut lines, wheel arches cut with booleans + liners, lathe tyres with
tread, multi-spoke alloys with brake discs/calipers, lamps/grille/mirrors/handles placed on
the body surface by ray casting (so nothing floats). Faces +X."""
import math, bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from lib import core
from lib.mats import mat, assign

def interp(keys, u):
    keys = sorted(keys)
    if u <= keys[0][0]: return keys[0][1]
    for (a, va), (b, vb) in zip(keys, keys[1:]):
        if a <= u <= b:
            t = (u - a) / (b - a)
            t = t * t * (3 - 2 * t)
            return va + (vb - va) * t
    return keys[-1][1]

BODIES = {
    'sedan': dict(L=4.75, W=1.84, wb=2.82, R=0.33, front_ovh=0.92,
                  top=[(0, .7), (.03, .92), (.1, 1.0), (.2, 1.02), (.34, 1.4), (.4, 1.445), (.55, 1.44), (.59, 1.4), (.72, 1.0), (.78, .95), (.96, .82), (1, .66)],
                  belt=[(0, .98), (.5, .97), (1, .9)], bottom=[(0, .36), (.06, .23), (.14, .2), (.9, .2), (.96, .27), (1, .38)],
                  width=[(0, .8), (.07, .96), (.2, 1), (.85, 1), (.95, .94), (1, .82)], glass=dict(rear=(.205, .34), roof=(.34, .59), ws=(.59, .72)),
                  doors=[.27, .485, .705], bpillar=.48, hood=.725, trunk=.195),
    'hatchback': dict(L=4.2, W=1.8, wb=2.62, R=0.32, front_ovh=0.86,
                      top=[(0, .7), (.02, 1.0), (.06, 1.18), (.12, 1.4), (.2, 1.46), (.55, 1.46), (.6, 1.42), (.73, 1.0), (.8, .95), (.96, .84), (1, .64)],
                      belt=[(0, 1.0), (.5, .98), (1, .9)], bottom=[(0, .36), (.06, .24), (.14, .21), (.88, .21), (.96, .28), (1, .38)],
                      width=[(0, .84), (.06, .96), (.2, 1), (.85, 1), (.95, .94), (1, .82)], glass=dict(rear=(.03, .13), roof=(.13, .6), ws=(.6, .73)),
                      doors=[.2, .44, .705], bpillar=.44, hood=.735, trunk=.02),
    'suv': dict(L=4.85, W=1.95, wb=2.9, R=0.38, front_ovh=0.92,
                top=[(0, .86), (.02, 1.15), (.05, 1.38), (.1, 1.68), (.16, 1.74), (.58, 1.74), (.63, 1.7), (.75, 1.2), (.8, 1.14), (.96, 1.04), (1, .82)],
                belt=[(0, 1.14), (.5, 1.12), (1, 1.08)], bottom=[(0, .5), (.06, .36), (.14, .32), (.88, .32), (.96, .4), (1, .52)],
                width=[(0, .86), (.06, .97), (.2, 1), (.85, 1), (.95, .95), (1, .86)], glass=dict(rear=(.04, .12), roof=(.12, .63), ws=(.63, .75)),
                doors=[.21, .46, .73], bpillar=.46, hood=.755, trunk=.03),
}

def loft_body(b):
    L, W = b['L'], b['W']
    hw = W / 2
    us = sorted(set([i / 60 for i in range(61)] + [d + s * 0.0015 for d in b['doors'] + [b['hood'], b['trunk']] for s in (-1, 1)]))
    rings = []
    meta = []
    for u in us:
        top = interp(b['top'], u)
        zb = interp(b['bottom'], u)
        w = interp(b['width'], u) * hw
        belt = min(interp(b['belt'], u), top - 0.04)
        gh = max(0.0, min(1.0, (top - belt - 0.05) / 0.3))
        wr = w * 0.76
        crown = 0.02 + 0.015 * gh
        pts = [(0, zb), (w * 0.9, zb), (w, zb + 0.11), (w * 1.0, (zb + belt) / 2 + 0.06), (w * 0.985, belt),
               (w * 0.985 - (w * 0.985 - wr) * 0.62 * gh, belt + (top - belt) * 0.6), (w * 0.9 + (wr * 0.9 - w * 0.9) * gh, top - 0.012 - 0.015 * gh), (0, top + crown * 0.4)]
        x = -L / 2 + u * L
        rings.append([(x, y, z) for y, z in pts])
        meta.append(u)
    # build mesh (mirror in Y)
    bm = bmesh.new()
    n = len(rings[0])
    grid = []
    for ring in rings:
        row = []
        for j, (x, y, z) in enumerate(ring):
            row.append(bm.verts.new((x, -y, z)))  # -Y side (indices 0..n-1)
        rowp = [bm.verts.new((x, y, z)) if 0 < j < n - 1 else row[j] for j, (x, y, z) in enumerate(ring)]
        grid.append((row, rowp))
    faces = []
    gl = b['glass']
    def mat_for(u, j):
        side_band = j == 4
        top_band = j in (5, 6)
        if any(abs(u - d) < 0.0016 for d in b['doors']) and j <= 3:
            return 2  # seam
        if abs(u - b['hood']) < 0.0016 and j >= 4 or abs(u - b['trunk']) < 0.0016 and j >= 4:
            return 2
        if top_band and (gl['ws'][0] + 0.01 < u < gl['ws'][1] - 0.004 or gl['rear'][0] + 0.005 < u < gl['rear'][1] - 0.01):
            return 1 if j == 6 or True else 0
        if side_band and gl['rear'][1] - 0.035 < u < gl['ws'][0] + 0.06:
            if abs(u - b['bpillar']) < 0.012:
                return 3  # black B-pillar
            return 1
        if side_band and (gl['ws'][0] + 0.06 <= u < gl['ws'][1] - 0.02 or gl['rear'][0] < u <= gl['rear'][1] - 0.035):
            return 3  # A / C pillar trims in black
        return 0
    for i in range(len(rings) - 1):
        u = (meta[i] + meta[i + 1]) / 2
        for side in (0, 1):
            ra, rb = grid[i][side], grid[i + 1][side]
            for j in range(n - 1):
                q = [ra[j], rb[j], rb[j + 1], ra[j + 1]] if side == 1 else [ra[j + 1], rb[j + 1], rb[j], ra[j]]
                try:
                    f = bm.faces.new(q)
                    f.material_index = mat_for(u, j)
                except ValueError:
                    pass
    # end caps
    for i in (0, len(rings) - 1):
        row, rowp = grid[i]
        loop = row + list(reversed(rowp[1:-1]))
        try:
            f = bm.faces.new(loop if i == 0 else list(reversed(loop)))
            f.material_index = 0
        except ValueError:
            pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return core.from_bmesh('body', bm)

def surface(bvh, origin, direction):
    loc, nrm, idx, dist = bvh.ray_cast(Vector(origin), Vector(direction).normalized())
    return loc, nrm

def stick(name, size, loc, nrm, m, embed=0.4, n=8, roll=0.0):
    """Thin rounded part laid onto the body surface at loc, facing nrm, half-embedded (never floats)."""
    o = core.soft_box(name, size, n=n, subsurf=1)
    q = Vector((0, 0, 1)).rotation_difference(nrm)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q @ Matrix.Rotation(roll, 4, 'Z').to_quaternion()
    o.location = loc + nrm * (size[2] * (0.5 - embed))
    assign(o, m)
    return o

def wheel(p, x, y, R, side):
    width = p.get('tyre_w', 0.235)
    tread = mat('tyre', 'tread', color='#1b1b1c', bump=0.8)
    rimm = mat('rim', 'metal', color=p.get('rim', '#c7cacd'), metal=1.0, rough=0.22, axis='Z') if p.get('rim_kind', 'alloy') != 'black' else mat('rim', 'metal', color='#202224', metal=0.8, rough=0.35)
    hw = width / 2
    rr = R * 0.66  # rim radius
    prof = [(rr, -hw * 0.92), (rr + 0.01, -hw), (R * 0.93, -hw * 1.02), (R * 0.99, -hw * 0.85), (R, -hw * 0.6), (R, hw * 0.6), (R * 0.99, hw * 0.85), (R * 0.93, hw * 1.02), (rr + 0.01, hw), (rr, hw * 0.92)]
    tyre = core.lathe('tyre', [(r, z) for r, z in prof], steps=72)
    tyre.rotation_euler = (math.radians(90), 0, 0)
    tyre.location = (x, y, R)
    assign(tyre, tread)
    outer = side * hw * 0.9
    # rim barrel + face (concave), spokes, hub, lugs
    barrel = core.lathe('barrel', [(rr - 0.004, -hw * 0.92), (rr - 0.004, hw * 0.92)], steps=64)
    barrel.rotation_euler = (math.radians(90), 0, 0); barrel.location = (x, y, R); assign(barrel, rimm)
    face_y = y + side * hw * 0.55
    lip = core.lathe('lip', [(rr - 0.025, 0), (rr + 0.006, 0), (rr + 0.006, 0.012), (rr - 0.02, 0.014)], steps=64)
    lip.rotation_euler = (math.radians(-90 * side), 0, 0); lip.location = (x, y + side * hw * 0.82, R); assign(lip, rimm)
    hub = core.lathe('hub', [(0, 0.03), (0.07, 0.03), (0.075, 0.0), (0.06, -0.03), (0, -0.03)], steps=32)
    hub.rotation_euler = (math.radians(-90 * side), 0, 0); hub.location = (x, face_y, R); assign(hub, rimm)
    nsp = p.get('spokes', 5)
    for k in range(nsp):
        a = k * math.tau / nsp
        for d in ((-0.12, 0.0) if p.get('twin', False) else (0.0,)):
            aa = a + d
            o = core.soft_box('spoke', (rr - 0.06, 0.03, 0.045), n=6, subsurf=1)
            o.rotation_euler = (0, -aa, 0)  # local X → (cos aa, 0, sin aa) in the wheel plane
            o.location = (x + math.cos(aa) * (rr / 2 + 0.02), face_y + side * 0.012, R + math.sin(aa) * (rr / 2 + 0.02))
            assign(o, rimm)
    lugs = []
    for k in range(5):
        a = k * math.tau / 5 + 0.3
        o = core.cylinder('lug', 0.01, 0.025, verts=6, rot=(math.radians(-90 * side), 0, 0))
        o.location = (x + math.cos(a) * 0.045, face_y + side * 0.02, R + math.sin(a) * 0.045)
        lugs.append(o)
    assign(core.join(lugs, 'lugs'), mat('chrome', 'chrome'))
    carrier = core.post_between('hub_carrier', (x, y - side * 0.02, R), (x, face_y, R), None, round_=True, r=0.05, verts=24)
    assign(carrier, mat('brake_disc', 'metal', color='#7d7f82', metal=1, rough=0.4, axis='Y'))
    disc = core.cylinder('disc', rr * 0.85, 0.026, verts=48, rot=(math.radians(90), 0, 0))
    disc.location = (x, y - side * 0.0 + 0.013, R)
    assign(disc, mat('brake_disc', 'metal', color='#7d7f82', metal=1, rough=0.4, axis='Y'))
    cal = core.soft_box('caliper', (0.12, 0.07, 0.09), n=6, subsurf=1)
    cal.location = (x - rr * 0.55, y + side * 0.02, R + rr * 0.3)
    assign(cal, mat('caliper', 'plastic', color=p.get('caliper', '#b3201b'), rough=0.35))

def build_car(p):
    b = dict(BODIES[p.get('body', 'sedan')])
    L, W, R = b['L'], b['W'], b['R']
    body = loft_body(b)
    paint = mat('paint_primary', 'paint', color=p.get('color', '#9b1b1b'), metal=p.get('metal', 0.6), rough=0.28)
    glass = mat('glass_tinted', 'flat', color='#141c21', rough=0.03, metal=0.25)
    seam = mat('trim_seam', 'flat', color='#0a0a0a', rough=0.6)
    trim = mat('trim_black', 'flat', color='#0e0f10', rough=0.25)
    for m in (paint, glass, seam, trim):
        body.data.materials.append(m)
    core.add_subsurf(body, 2)
    core.apply_mods(body)
    # wheel positions
    xr = -L / 2 + (L - b['wb'] - b['front_ovh'])
    xf = xr + b['wb']
    zc = R
    ytrack = W / 2 - 0.13
    # wheel arch cut-outs
    cutters = []
    for x in (xr, xf):
        for s in (-1, 1):
            c = core.cylinder('arch', R + 0.045, 0.5, verts=48, rot=(math.radians(90), 0, 0))
            c.location = (x, s * (W / 2 + 0.2) + (0.25 if s < 0 else -0.25) * 0 , zc + 0.015)
            c.location.y = s * (W / 2 - 0.3) + (0.5 if s > 0 else 0)
            cutters.append(c)
    cut = core.join(cutters, 'cutter')
    mod = body.modifiers.new('arches', 'BOOLEAN'); mod.object = cut; mod.operation = 'DIFFERENCE'; mod.solver = 'EXACT'
    core.apply_mods(body)
    bpy.data.objects.remove(cut)
    # arch liners (inside the cut, black, never sticking out)
    for x in (xr, xf):
        for s in (-1, 1):
            lin = core.lathe('liner', [(R + 0.046, 0), (R + 0.046, 0.3)], steps=48)
            lin.rotation_euler = (math.radians(-90 * s), 0, 0)
            lin.location = (x, s * (W / 2 - 0.3), zc + 0.015)
            # keep only the upper half of the ring (inside the body)
            bpy.context.view_layer.update()
            bm = bmesh.new(); bm.from_mesh(lin.data)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if (lin.matrix_world @ v.co).z < zc + 0.02], context='VERTS')
            bm.to_mesh(lin.data); bm.free()
            sol = lin.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.01
            assign(lin, mat('liner', 'plastic', color='#121212', rough=0.85))
    for x in (xr, xf):
        for s in (-1, 1):
            wheel(p, x, s * ytrack, R, s)
        # axle: joins both wheel hubs/discs and passes through the floor of the body
        ax = core.cylinder('axle', 0.035, 2 * ytrack, verts=16, rot=(math.radians(90), 0, 0))
        ax.location = (x, ytrack, R)
        assign(ax, mat('chassis', 'flat', color='#141414', rough=0.7))
    # ---- details on the surface (ray cast so they sit ON the body)
    dg = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(body, dg)
    top_at = lambda u: interp(b['top'], u)
    head = mat('lamp_head', 'emissive', color='#e9eef2', emit='#fff4e0', strength=0.4)
    tail = mat('lamp_tail', 'emissive', color='#6a0a0c', emit='#ff1810', strength=0.6)
    amber = mat('lamp_signal', 'emissive', color='#e09a20', emit='#ff8a00', strength=0.3)
    chrome = mat('chrome', 'chrome')
    hz = interp(b['top'], 0.97) - 0.1
    for s in (-1, 1):
        loc, nrm = surface(bvh, (L, s * W * 0.33, hz), (-1, 0, 0))
        if loc: stick('headlight', (0.42, 0.11, 0.04), loc, nrm, head, roll=math.radians(90))
        loc, nrm = surface(bvh, (L, s * W * 0.4, hz - 0.17), (-1, 0, 0))
        if loc: stick('fog', (0.12, 0.05, 0.03), loc, nrm, amber, roll=math.radians(90))
        tz = interp(b['top'], 0.04) - 0.1
        loc, nrm = surface(bvh, (-L, s * W * 0.34, tz), (1, 0, 0))
        if loc: stick('taillight', (0.4, 0.1, 0.04), loc, nrm, tail, roll=math.radians(90))
        # mirrors at the A-pillar base
        u = b['glass']['ws'][0] + 0.06
        xm = -L / 2 + u * L
        loc, nrm = surface(bvh, (xm, s * 2, interp(b['belt'], u) + 0.06), (0, -s, 0))
        if loc:
            arm = core.post_between('mirror_arm', loc - Vector((0, s * 0.01, 0)), loc + Vector((-0.04, s * 0.09, 0.02)), (0.03, 0.02), bevel=0.004)
            assign(arm, trim)
            cap = core.soft_box('mirror', (0.12, 0.2, 0.12), n=4, subsurf=1)
            cap.location = loc + Vector((-0.06, s * 0.17, 0.03))
            assign(cap, paint)
            gl = core.soft_box('mirror_glass', (0.01, 0.17, 0.09), n=5, subsurf=1)
            gl.location = loc + Vector((-0.12, s * 0.17, 0.03)); assign(gl, mat('mirror', 'mirror'))
        # door handles: one per door, near its rear edge, just under the belt
        for d0, d1 in zip(b['doors'][:-1], b['doors'][1:]):
            u = d0 + 0.035
            xh = -L / 2 + u * L
            loc, nrm = surface(bvh, (xh, s * 2, interp(b['belt'], u) - 0.08), (0, -s, 0))
            if loc: stick('handle', (0.16, 0.035, 0.03), loc, nrm, chrome, embed=0.35)
        # side repeater
        u = b['doors'][-1] + 0.05
        loc, nrm = surface(bvh, (-L / 2 + u * L, s * 2, interp(b['belt'], u) - 0.1), (0, -s, 0))
        if loc: stick('repeater', (0.06, 0.02, 0.02), loc, nrm, amber)
    # grille + plates
    loc, nrm = surface(bvh, (L, 0, hz - 0.12), (-1, 0, 0))
    if loc: stick('grille', (0.62 if p.get('body') != 'suv' else 0.8, 0.16 if p.get('body') != 'suv' else 0.24, 0.05), loc, nrm, mat('grille', 'grille', cells=60), embed=0.5, roll=math.radians(90))
    plate_m = mat('plate', 'flat', color='#f2f2ee', rough=0.4)
    for end, sx in ((L, -1), (-L, 1)):
        zz = hz - 0.3 if end > 0 else interp(b['top'], 0.03) - 0.32
        loc, nrm = surface(bvh, (end, 0, zz), (sx, 0, 0))
        if loc:
            stick('plate', (0.52, 0.12, 0.012), loc, nrm, plate_m, embed=0.2, roll=math.radians(90))
            txt = bpy.data.curves.new('plate_txt', 'FONT'); txt.body = p.get('plate', 'HD 2026'); txt.size = 0.075; txt.extrude = 0.002
            txt.align_x = 'CENTER'; txt.align_y = 'CENTER'
            to = core.link(bpy.data.objects.new('plate_txt', txt))
            q = Vector((0, 0, 1)).rotation_difference(nrm)
            to.rotation_mode = 'QUATERNION'; to.rotation_quaternion = q @ Matrix.Rotation(math.radians(-90 * sx), 4, 'Z').to_quaternion()
            to.location = loc + nrm * 0.0085
            to = core.to_mesh(to); assign(to, mat('plate_text', 'flat', color='#141414', rough=0.5))
    # front/rear bumper lower trim (black diffuser lips) laid on the surface
    for end, sx, uu in ((L, -1, 0.99), (-L, 1, 0.01)):
        zz = interp(b['bottom'], uu) + 0.06
        loc, nrm = surface(bvh, (end, 0, zz), (sx, 0, 0))
        if loc: stick('lip', (W * 0.7, 0.07, 0.03), loc, nrm, trim, embed=0.5, roll=math.radians(90))
    if p.get('roof_rails'):
        for s in (-1, 1):
            u0, u1 = b['glass']['roof']
            pts = []
            for k in range(6):
                u = u0 + 0.02 + (u1 - u0 - 0.04) * k / 5
                loc, nrm = surface(bvh, (-L / 2 + u * L, s * W * 0.33, 4), (0, 0, -1))
                if loc: pts.append(tuple(loc + Vector((0, 0, 0.03))))
            if len(pts) > 2:
                r = core.tube_path('rail', pts, 0.014); assign(r, mat('rail_metal', 'metal', color='#9a9da1', metal=1, rough=0.3))
                for q in (pts[0], pts[-1]):
                    f = core.soft_box('rail_foot', (0.08, 0.03, 0.05), at=(q[0], q[1], q[2] - 0.02), n=6, subsurf=1); assign(f, trim)

TYPES = {
    'hd-car': {
        'disabled': True,  # experimental: body not yet up to the HD bar — excluded from builds/catalog
        'label': 'Car (HD)', 'category': 'vehicles', 'options': {'color': 'body paint'}, 'build': build_car, 'centre': True,
        'variants': {
            'sedan-red': dict(body='sedan', color='#8e1515'),
            'sedan-silver': dict(body='sedan', color='#b9bdc2', metal=0.8, spokes=10, twin=False, plate='TP 4410'),
            'hatchback-blue': dict(body='hatchback', color='#1f4f9a', caliper='#d9d9d9'),
            'hatchback-white': dict(body='hatchback', color='#eceeee', metal=0.2, rim_kind='black', plate='HD 7781'),
            'suv-black': dict(body='suv', color='#15171a', roof_rails=True, rim='#a9acb0', spokes=6),
            'suv-green': dict(body='suv', color='#3a4f3a', metal=0.4, roof_rails=True, rim_kind='black', caliper='#d2c22a'),
        },
    },
}
