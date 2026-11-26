"""Scene + geometry helpers for the HD model builders (Blender, Z-up).

Conventions: metres. Front of furniture/props faces -Y in Blender (= +Z in three.js).
Vehicles face +X. Everything is moved so it sits on the ground and is centred.
"""
import bpy, bmesh, math
from mathutils import Vector, Matrix

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.render.threads_mode = 'FIXED'
    sc.render.threads = 4
    sc.unit_settings.system = 'METRIC'
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)

def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj

def from_bmesh(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))

def from_pydata(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.update()
    return link(bpy.data.objects.new(name, me))

def place(obj, at=(0, 0, 0), rot=(0, 0, 0), scale=None):
    obj.location = at
    obj.rotation_euler = rot
    if scale is not None:
        obj.scale = scale if hasattr(scale, '__len__') else (scale,) * 3
    return obj

def box(name, size, at=(0, 0, 0), bevel=0.0, seg=3, rot=(0, 0, 0)):
    """Axis box of full size (sx,sy,sz) centred at `at`; optional real bevel (applied at export)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = from_bmesh(name, bm)
    place(o, at, rot)
    if bevel > 0:
        add_bevel(o, bevel, seg)
    return o

def cylinder(name, r, h, at=(0, 0, 0), verts=32, rot=(0, 0, 0), bevel=0.0, seg=3, r2=None, cap=True):
    """Cylinder (or cone with r2) along local Z, base at z=0 → top at z=h, then placed."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, h / 2))
    o = from_bmesh(name, bm)
    place(o, at, rot)
    if bevel > 0:
        add_bevel(o, bevel, seg)
    return o

def sphere(name, r, at=(0, 0, 0), seg=32, rings=16, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    o = from_bmesh(name, bm)
    place(o, at, scale=scale)
    return o

def lathe(name, profile, at=(0, 0, 0), steps=48, rot=(0, 0, 0), close_top=False, close_bottom=False):
    """Revolve [(radius, z), …] around Z."""
    profile = list(profile)
    if len(profile) >= 3 and (profile[0][0] > 1e-6 or profile[-1][0] > 1e-6) and not (close_top or close_bottom) \
            and (abs(profile[0][0] - profile[-1][0]) > 1e-6 or abs(profile[0][1] - profile[-1][1]) > 1e-6):
        profile.append(profile[0])   # closed cross-section → watertight solid
    verts, faces = [], []
    n = len(profile)
    for i in range(steps):
        a = 2 * math.pi * i / steps
        c, s = math.cos(a), math.sin(a)
        for r, z in profile:
            verts.append((r * c, r * s, z))
    for i in range(steps):
        j = (i + 1) % steps
        for k in range(n - 1):
            faces.append((i * n + k, j * n + k, j * n + k + 1, i * n + k + 1))
    if close_bottom and profile[0][0] > 1e-6:
        verts.append((0, 0, profile[0][1]))
        ci = len(verts) - 1
        for i in range(steps):
            j = (i + 1) % steps
            faces.append((j * n, i * n, ci))
    if close_top and profile[-1][0] > 1e-6:
        verts.append((0, 0, profile[-1][1]))
        ci = len(verts) - 1
        for i in range(steps):
            j = (i + 1) % steps
            faces.append((i * n + n - 1, j * n + n - 1, ci))
    o = from_pydata(name, verts, faces)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    smooth(o)
    return place(o, at, rot)

def tube_path(name, pts, r, seg=12, closed=False, res=6):
    """Round tube along a smooth curve through points (frames, rails, handles)."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = max(2, seg // 4)
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER') if len(pts) > 2 else cu.splines.new('POLY')
    if sp.type == 'BEZIER':
        sp.bezier_points.add(len(pts) - 1)
        for bp, p in zip(sp.bezier_points, pts):
            bp.co = p
            bp.handle_left_type = bp.handle_right_type = 'AUTO'
        cu.resolution_u = res
    else:
        sp.points.add(len(pts) - 1)
        for bp, p in zip(sp.points, pts):
            bp.co = (*p, 1)
    sp.use_cyclic_u = closed
    o = link(bpy.data.objects.new(name, cu))
    return to_mesh(o)

def to_mesh(o):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.view_layer.objects.active
    smooth(o)
    return o

def smooth(o, angle=None):
    for p in o.data.polygons:
        p.use_smooth = True
    if angle is not None:
        mod = o.modifiers.new('smooth', 'NODES') if False else None
    return o

def add_bevel(o, width, seg=3, limit='ANGLE', angle=30):
    m = o.modifiers.new('bevel', 'BEVEL')
    m.width = width
    m.segments = seg
    m.limit_method = limit
    m.angle_limit = math.radians(angle)
    m.harden_normals = False
    smooth(o)
    wn = o.modifiers.new('wnormal', 'WEIGHTED_NORMAL')
    wn.keep_sharp = True
    return o

def add_subsurf(o, levels=2):
    m = o.modifiers.new('subsurf', 'SUBSURF')
    m.levels = levels
    m.render_levels = levels
    smooth(o)
    return o

def apply_mods(o):
    if o.type != 'MESH' or not o.modifiers:
        return o
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    for m in list(o.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=m.name)
        except RuntimeError:
            o.modifiers.remove(m)
    return o

def apply_transform(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def mesh_objects():
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']

def bounds(objs=None):
    objs = objs or mesh_objects()
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
        ev.to_mesh_clear()
    return mn, mx

def ground_and_centre(objs=None, centre=True):
    """Move everything so min z = 0 and the footprint is centred on the origin."""
    objs = objs or mesh_objects()
    mn, mx = bounds(objs)
    off = Vector((-(mn.x + mx.x) / 2 if centre else 0, -(mn.y + mx.y) / 2 if centre else 0, -mn.z))
    roots = [o for o in objs if o.parent is None]
    for o in roots:
        o.location += off
    return mn + off, mx + off

def join(objs, name=None):
    objs = [o for o in objs if o]
    if len(objs) == 1:
        if name: objs[0].name = name
        return objs[0]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    if name: o.name = name
    return o

def mirror_x(o, merge=True):
    m = o.modifiers.new('mirror', 'MIRROR')
    m.use_axis = (True, False, False)
    m.use_clip = True
    m.use_mirror_merge = merge
    return o

def duplicate(o, at=None, rot=None, name=None):
    n = o.copy()
    n.data = o.data.copy()
    if name: n.name = name
    link(n)
    if at is not None: n.location = at
    if rot is not None: n.rotation_euler = rot
    return n

def rounded_rect(w, h, r, n=8):
    """2D outline points (x,y) of a rounded rectangle centred on origin."""
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4)
    pts = []
    for cx, cy, a0 in [(w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)]:
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def extrude_outline(name, pts, depth, at=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, seg=3):
    """Prism from a 2D outline in XY, extruded along +Z by depth (then placed)."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0)) for x, y in pts]
    f = bm.faces.new(vs)
    res = bmesh.ops.extrude_face_region(bm, geom=[f])
    top = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=(0, 0, depth))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = from_bmesh(name, bm)
    place(o, at, rot)
    if bevel > 0:
        add_bevel(o, bevel, seg)
    return o

def soft_box(name, size, at=(0, 0, 0), n=6.0, cuts=10, puff=0.0, puff_axis=2, rot=(0, 0, 0), subsurf=1, taper=0.0, sag=0.0):
    """Upholstery / soft rounded box: subdivided cube projected onto a superellipsoid
    (|x|^n+|y|^n+|z|^n = 1). n≈4 = pillow, 6–8 = cushion, 12+ = crisp box with soft edges.
    puff bulges the faces on `puff_axis`; taper narrows the top (x/y scaled by 1-taper at +z)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=cuts, use_grid_fill=True)
    hx, hy, hz = size[0] / 2, size[1] / 2, size[2] / 2
    for v in bm.verts:
        x, y, z = v.co
        nrm = (abs(x) ** n + abs(y) ** n + abs(z) ** n) ** (1 / n) or 1
        x, y, z = x / nrm, y / nrm, z / nrm
        c = [x, y, z]
        if puff:
            a, b = [i for i in range(3) if i != puff_axis]
            c[puff_axis] += math.copysign(puff / (size[puff_axis] / 2), c[puff_axis]) * max(0, 1 - c[a] ** 2) * max(0, 1 - c[b] ** 2)
        if sag:
            c[2] -= sag / hz * max(0, 1 - c[0] ** 2) * max(0, 1 - c[1] ** 2) * (1 if c[2] > 0 else 0)
        if taper:
            k = 1 - taper * (c[2] + 1) / 2
            c[0] *= k; c[1] *= k
        v.co = Vector((c[0] * hx, c[1] * hy, c[2] * hz))
    o = from_bmesh(name, bm)
    smooth(o)
    if subsurf:
        add_subsurf(o, subsurf)
    return place(o, at, rot)

def frustum(name, top, bottom, h, at=(0, 0, 0), bevel=0.003, rot=(0, 0, 0)):
    """Square-section tapered post: bottom size → top size (x,y tuples), base at z=0."""
    bm = bmesh.new()
    vs = []
    for z, (sx, sy) in [(0, bottom), (h, top)]:
        for dx, dy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
            vs.append(bm.verts.new((dx * sx / 2, dy * sy / 2, z)))
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    for q in f:
        bm.faces.new([vs[i] for i in q])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = from_bmesh(name, bm)
    place(o, at, rot)
    if bevel:
        add_bevel(o, bevel, 2)
    return o

def post_between(name, a, b, size, bevel=0.003, round_=False, r=None, verts=16):
    """Post/rail from point a to b. Square (size=(w,d)) or round (r)."""
    a = Vector(a); b = Vector(b)
    d = b - a
    L = d.length
    if round_:
        o = cylinder(name, r, L, verts=verts)
    else:
        o = frustum(name, size, size, L, bevel=0)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q
    o.location = a
    if bevel and not round_:
        add_bevel(o, bevel, 2)
    return o

def loft(name, stations, seg=24, cap=True, power=2.0):
    """Smooth body along X from cross-sections: stations = [(x, half_width_y, half_height_z, z_offset), …].
    Sections are superellipses (power 2 = ellipse, higher = boxier). Ends are closed with a pole."""
    verts, faces = [], []
    for x, ry, rz, zo in stations:
        for i in range(seg):
            a = i / seg * math.tau
            c, s = math.cos(a), math.sin(a)
            k = (abs(c) ** power + abs(s) ** power) ** (-1 / power)
            verts.append((x, ry * c * k, zo + rz * s * k))
    n = len(stations)
    for j in range(n - 1):
        for i in range(seg):
            a, b = j * seg + i, j * seg + (i + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    if cap:
        x0, _, _, z0 = stations[0]; x1, _, _, z1 = stations[-1]
        verts.append((x0 - 1e-4, 0, z0)); verts.append((x1 + 1e-4, 0, z1))
        p0, p1 = len(verts) - 2, len(verts) - 1
        for i in range(seg):
            faces.append(((i + 1) % seg, i, p0))
            faces.append(((n - 1) * seg + i, (n - 1) * seg + (i + 1) % seg, p1))
    o = from_pydata(name, verts, faces)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    smooth(o)
    return o

def text_mesh(name, body, size, depth=0.002, at=(0, 0, 0), rot=(0, 0, 0), align='CENTER'):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.extrude = depth
    cu.align_x = align; cu.align_y = 'CENTER'
    o = link(bpy.data.objects.new(name, cu))
    o.location = at; o.rotation_euler = rot
    return to_mesh(o)


def settle(before, rx=0.0, ry=0.0, rz=0.0):
    """Pure models: rotate the meshes built since `before` (set of object names) and set them on the ground
    (lowest bounding-box corner at z=0), so the object rests on its own parts instead of a display stand."""
    import bpy, mathutils
    bpy.context.view_layer.update()
    new = [o for o in bpy.context.scene.objects if o.name not in before and o.type == 'MESH']
    R = mathutils.Euler((rx, ry, rz)).to_matrix().to_4x4()
    for o in new:
        o.matrix_world = R @ o.matrix_world
    bpy.context.view_layer.update()
    low = min((o.matrix_world @ mathutils.Vector(c)).z for o in new for c in o.bound_box)
    for o in new:
        o.matrix_world = mathutils.Matrix.Translation((0, 0, -low)) @ o.matrix_world
