"""Soft goods: pillows with piping and bed covers that drape over a mattress (sculpted drape:
cloth rolls over the rounded edge and hangs, flares out, with folds that grow with the drop)."""
import math, random
import bmesh
from mathutils import Vector
from . import core


def pillow(name, w, d, h, at=(0, 0, 0), rot=(0, 0, 0), squash=0.35, piping=0.006, seed=0):
    """Rounded outline, domed faces thinning to the seam, flatter underside, dipped centre, piped seam.
    Returns (pillow, piping). Local z = thickness."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=14, use_grid_fill=True)
    n = 3.0
    for v in bm.verts:
        x, y, z = v.co
        r = (abs(x) ** n + abs(y) ** n) ** (1 / n) or 1e-6
        k = max(abs(x), abs(y)) / r
        x, y = x * k, y * k
        rr = min(1.0, (abs(x) ** n + abs(y) ** n) ** (1 / n))
        thick = max(0.0, 1 - rr ** 2.2) ** 0.55
        zz = z * thick
        zz = zz * (1 - squash) if zz < 0 else zz * (1 - 0.18 * (1 - rr) * squash)
        zz += 0.02 * math.sin(x * 5.1 + seed) * math.sin(y * 4.3 + seed * 2) * thick
        v.co = Vector((x * w / 2, y * d / 2, zz * h / 2))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = core.from_bmesh(name, bm)
    core.add_subsurf(o, 1)
    core.place(o, at, rot)
    pip = None
    if piping:
        pts = []
        for i in range(64):
            a = i / 64 * math.tau
            c, s = math.cos(a), math.sin(a)
            r = (abs(c) ** n + abs(s) ** n) ** (-1 / n)
            pts.append((c * r * w / 2 * 0.995, s * r * d / 2 * 0.995, 0))
        pip = core.tube_path(name + '_piping', pts, piping, closed=True)
        core.place(pip, at, rot)
    return o, pip


def drape(name, top_z, x_half, y_from, y_to, hang_side, hang_foot, edge_r=0.04, thickness=0.03,
          flare_side=0.0, flare_start=0.15, quilt=0.0, folds=0.012, res=0.025, seed=1, foot=True):
    """Cover lying on a mattress top at top_z (|x| ≤ x_half, y_from = foot edge … y_to), rolling over
    the edges (radius edge_r), hanging hang_side at the sides and hang_foot at the foot. Inner
    surface touches the mattress; solidified outward and subdivided."""
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(4)]
    arc = edge_r * math.pi / 2

    def edge_map(s, hang):
        if s <= 0:
            return s, 0.0
        if s < arc:
            t = s / edge_r
            return edge_r * math.sin(t), edge_r * (1 - math.cos(t))
        dd = min(s - arc, hang)
        fl = flare_side * max(0.0, min(1.0, (dd - flare_start) / 0.12)) ** 2
        return edge_r + fl, edge_r + dd

    sx_max = arc + hang_side
    sy_max = arc + hang_foot if foot else 0.0
    nx = int(2 * (x_half + sx_max) / res) + 1
    ny = int((y_to - y_from + sy_max) / res) + 1
    verts, faces = [], []
    for j in range(ny + 1):
        yy = y_from - sy_max + (y_to - y_from + sy_max) * j / ny
        for i in range(nx + 1):
            xx = -(x_half + sx_max) + 2 * (x_half + sx_max) * i / nx
            ex = abs(xx) - x_half
            ey = (y_from - yy) if foot else -1.0
            if foot and ex > 0 and ey > 0:
                # corner: fall radially over the rounded corner (no spikes), shorter hang
                s = math.hypot(ex, ey)
                o, d = edge_map(s, min(hang_side, hang_foot))
                x = math.copysign(x_half + o * ex / s, xx)
                y = y_from - o * ey / s
                dx = dy = d
                drop = d
            else:
                ox, dx = edge_map(ex, hang_side)
                oy, dy = edge_map(ey, hang_foot) if foot else (ey, 0.0)
                x = math.copysign(x_half + ox, xx) if ex > 0 else xx
                y = (y_from - oy) if (foot and ey > 0) else yy
                drop = max(dx, dy)
            z = top_z - drop
            ht = max(0.0, drop - edge_r) / max(hang_side, 1e-3)
            corner = foot and ex > 0 and ey > 0
            if corner:
                ht *= 0.4
            if dx > edge_r and not corner:
                x += math.copysign(folds * ht * (math.sin(yy * 14 + ph[0]) + 0.5 * math.sin(yy * 31 + ph[1])), xx)
            if dy > edge_r and not corner:
                y -= folds * ht * (math.sin(xx * 13 + ph[2]) + 0.5 * math.sin(xx * 29 + ph[3]))
            if drop == 0:
                z += quilt * (0.5 + 0.5 * math.cos(xx * math.tau / 0.35)) * (0.5 + 0.5 * math.cos(yy * math.tau / 0.35))
                z += 0.004 * math.sin(xx * 7 + ph[0]) * math.sin(yy * 5 + ph[1])
            verts.append((x, y, z))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    o = core.from_pydata(name, verts, faces)
    # vertices clamped at the end of the hang collapse together at the corners → merge them and
    # drop the zero-area faces, otherwise solidify spikes.
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    if o.data.polygons and sum(p.normal.z for p in o.data.polygons) < 0:
        for p_ in o.data.polygons:
            p_.flip()
    core.smooth(o)
    sol = o.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = thickness
    sol.offset = 1.0
    sol.use_even_offset = False
    core.add_subsurf(o, 1)
    return o
